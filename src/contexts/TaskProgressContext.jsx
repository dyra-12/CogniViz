import React, { createContext, useContext, useState, useEffect } from 'react';

const TaskProgressContext = createContext();

export const TaskProgressProvider = ({ children }) => {
  const [currentTask, setCurrentTask] = useState(1);
  const [completedTasks, setCompletedTasks] = useState([]);
  const [consentGiven, setConsentGiven] = useState(false);
  const [showInstructions, setShowInstructions] = useState(true);

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

  const value = {
    currentTask,
    completedTasks,
    showInstructions,
    setShowInstructions,
    completeCurrentTask,
    resetProgress
    , consentGiven, setConsentGiven
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