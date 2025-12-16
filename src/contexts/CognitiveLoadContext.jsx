import React, { createContext, useContext, useState } from "react";

export const CognitiveLoadContext = createContext({});

export const CognitiveLoadProvider = ({ children }) => {
  const [state, setState] = useState({
    loadLevel: "LOW",
    metrics: {},
    topFactors: [],
    explanation: "Cognitive load is currently low",
    mode: "LIVE"
  });

  const setLoadLevel = (level) => {
    setState(prev => ({ ...prev, loadLevel: level }));
  };

  const setMetrics = (metrics) => {
    setState(prev => ({ ...prev, metrics }));
  };

  const setTopFactors = (factors) => {
    setState(prev => ({ ...prev, topFactors: factors }));
  };

  const setExplanation = (explanation) => {
    setState(prev => ({ ...prev, explanation }));
  };

  const setMode = (mode) => {
    setState(prev => ({ ...prev, mode }));
  };

  const updateState = (updates) => {
    setState(prev => ({ ...prev, ...updates }));
  };

  const value = {
    ...state,
    setLoadLevel,
    setMetrics,
    setTopFactors,
    setExplanation,
    setMode,
    updateState
  };

  return (
    <CognitiveLoadContext.Provider value={value}>
      {children}
    </CognitiveLoadContext.Provider>
  );
};

export function useCognitiveLoad() {
  const context = useContext(CognitiveLoadContext);
  if (!context) {
    throw new Error("useCognitiveLoad must be used within CognitiveLoadProvider");
  }
  return context;
}
