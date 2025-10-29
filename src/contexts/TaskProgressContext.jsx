import React, { createContext, useContext, useState, useEffect } from 'react';
import { saveQuestionnaireResponse } from '../utils/tlx';

const TaskProgressContext = createContext();

export const TaskProgressProvider = ({ children }) => {
  const [currentTask, setCurrentTask] = useState(1);
  const [completedTasks, setCompletedTasks] = useState([]);
  const [consentGiven, setConsentGiven] = useState(false);
  const [showInstructions, setShowInstructions] = useState(true);
  const [questionnaireData, setQuestionnaireData] = useState({
    isOpen: false,
    taskId: null,
    onComplete: null
  });

  // Load progress from localStorage on mount
  useEffect(() => {
    const savedProgress = localStorage.getItem('taskProgress');
    if (savedProgress) {
      const { current, completed } = JSON.parse(savedProgress);
      setCurrentTask(current);
      setCompletedTasks(completed);
    }
    const consent = localStorage.getItem('consentGiven');
    if (consent === 'true') setConsentGiven(true);
  }, []);

  // Save progress to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('taskProgress', JSON.stringify({
      current: currentTask,
      completed: completedTasks
    }));
  }, [currentTask, completedTasks]);

  useEffect(() => {
    localStorage.setItem('consentGiven', consentGiven ? 'true' : 'false');
  }, [consentGiven]);

  /**
   * Open the questionnaire modal for a specific task
   * @param {string} taskId - The task identifier (e.g., 'task_1_form', 'task_2_form', 'task_3_form')
   * @param {Function} onComplete - Callback to run after questionnaire is submitted
   */
  const openQuestionnaire = (taskId, onComplete) => {
    setQuestionnaireData({
      isOpen: true,
      taskId,
      onComplete
    });
  };

  /**
   * Close the questionnaire modal
   */
  const closeQuestionnaire = () => {
    setQuestionnaireData({
      isOpen: false,
      taskId: null,
      onComplete: null
    });
  };

  /**
   * Handle questionnaire submission
   * @param {Object} responses - The questionnaire responses
   */
  const handleQuestionnaireSubmit = async (responses) => {
    try {
      // Save to localStorage
      const savedResponse = saveQuestionnaireResponse(questionnaireData.taskId, responses);
      console.log('Questionnaire saved:', savedResponse);

      // Call the onComplete callback if provided
      if (questionnaireData.onComplete) {
        questionnaireData.onComplete();
      }

      // Close the modal
      closeQuestionnaire();
    } catch (error) {
      console.error('Failed to save questionnaire:', error);
      throw error;
    }
  };

  /**
   * Complete current task - this now triggers the questionnaire
   */
  const completeCurrentTask = () => {
    // Determine the task form ID based on current task
    const taskFormId = `task_${currentTask}_form`;
    
    // Open questionnaire and handle completion
    openQuestionnaire(taskFormId, () => {
      // After questionnaire is submitted, mark task as completed
      if (!completedTasks.includes(currentTask)) {
        setCompletedTasks(prev => [...prev, currentTask]);
      }
      setCurrentTask(prev => prev + 1);
      setShowInstructions(true);
    });
  };

  /**
   * Complete current task without questionnaire (for testing/debugging)
   */
  const completeCurrentTaskDirectly = () => {
    if (!completedTasks.includes(currentTask)) {
      setCompletedTasks(prev => [...prev, currentTask]);
    }
    setCurrentTask(prev => prev + 1);
    setShowInstructions(true);
  };

  const resetProgress = () => {
    setCurrentTask(1);
    setCompletedTasks([]);
    setShowInstructions(true);
    localStorage.removeItem('taskProgress');
  };

  const value = {
    currentTask,
    completedTasks,
    showInstructions,
    setShowInstructions,
    completeCurrentTask,
    completeCurrentTaskDirectly,
    resetProgress,
    consentGiven,
    setConsentGiven,
    // Questionnaire methods
    questionnaireData,
    openQuestionnaire,
    closeQuestionnaire,
    handleQuestionnaireSubmit
  };

  return (
    <TaskProgressContext.Provider value={value}>
      {children}
    </TaskProgressContext.Provider>
  );
};

export const useTaskProgress = () => {
  const context = useContext(TaskProgressContext);
  if (!context) {
    throw new Error('useTaskProgress must be used within a TaskProgressProvider');
  }
  return context;
};