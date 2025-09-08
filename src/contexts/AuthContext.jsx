import React, { createContext, useContext, useState, useEffect } from 'react';

// Create the Context
const AuthContext = createContext();

// Create a provider component
export const AuthProvider = ({ children }) => {
  const [participantId, setParticipantId] = useState(null);

  // On component mount, check localStorage for an existing ID, or generate a new one.
  useEffect(() => {
    const storedId = localStorage.getItem('participantId');
    if (storedId) {
      setParticipantId(storedId);
    } else {
      // Simple ID generation. For a more robust solution, use a library like `uuid`
      const newId = Math.random().toString(36).substring(2) + Date.now().toString(36);
      localStorage.setItem('participantId', newId);
      setParticipantId(newId);
    }
  }, []);

  // The value that will be supplied to any descendant component that asks for it.
  const value = {
    participantId
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// A custom hook to easily access the context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};