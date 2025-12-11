import React, { createContext } from "react";

// Minimal placeholder hook
export function useCognitiveLoad() {
  // Return a dummy load state and setter
  return {
    loadState: "simulation",
    setLoadState: () => {}
  };
}

export const CognitiveLoadContext = createContext({});

export const CognitiveLoadProvider = ({ children }) => {
  // Placeholder: add state/logic as needed
  return (
    <CognitiveLoadContext.Provider value={{}}>
      {children}
    </CognitiveLoadContext.Provider>
  );
};
