import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import QuestionnaireModal from '../components/QuestionnaireModal';

const TaskProgressContext = createContext();

export const TaskProgressProvider = ({ children }) => {
  const [currentTask, setCurrentTask] = useState(1);
  const [completedTasks, setCompletedTasks] = useState([]);
  const [consentGiven, setConsentGiven] = useState(false);
  const [showInstructions, setShowInstructions] = useState(true);
  const [showQuestionnaire, setShowQuestionnaire] = useState(false);
  const [questionnaireTaskId, setQuestionnaireTaskId] = useState(null);
  const questionnaireResolver = useRef(null);

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

  const completeCurrentTask = () => {
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

  // Open questionnaire and return a Promise resolved when user saves or rejects when closed
  const openQuestionnaire = (taskId = `task_${currentTask}_form`) => {
    return new Promise((resolve, reject) => {
      setQuestionnaireTaskId(taskId);
      setShowQuestionnaire(true);
      questionnaireResolver.current = { resolve, reject };
    });
  };

  const closeQuestionnaire = () => {
    setShowQuestionnaire(false);
    setQuestionnaireTaskId(null);
    if (questionnaireResolver.current) {
      // if the modal was closed without saving, reject
      questionnaireResolver.current.reject(new Error('questionnaire_closed'));
      questionnaireResolver.current = null;
    }
  };

  const onQuestionnaireSaved = (payload, ok) => {
    if (questionnaireResolver.current) {
      questionnaireResolver.current.resolve({ payload, ok });
      questionnaireResolver.current = null;
    }
    // close modal
    setShowQuestionnaire(false);
    setQuestionnaireTaskId(null);
  };

  const value = {
    currentTask,
    completedTasks,
    showInstructions,
    setShowInstructions,
    completeCurrentTask,
    resetProgress,
    // questionnaire api
    openQuestionnaire,
    closeQuestionnaire,
    showQuestionnaire,
    questionnaireTaskId,
    onQuestionnaireSaved,
    consentGiven, setConsentGiven
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