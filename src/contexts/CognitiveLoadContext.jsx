import React, { createContext, useContext, useState, useEffect } from 'react';

const CognitiveLoadContext = createContext(null);

export const CognitiveLoadProvider = ({ children }) => {
  const envMode = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_COG_LOAD_MODE)
    ? String(import.meta.env.VITE_COG_LOAD_MODE).toLowerCase()
    : (typeof process !== 'undefined' && process?.env?.VITE_COG_LOAD_MODE)
      ? String(process.env.VITE_COG_LOAD_MODE).toLowerCase()
      : 'live';

  const [hydrated, setHydrated] = useState(false);
  const [loadClass, setLoadClass] = useState('Calibrating'); // 'Low'|'Medium'|'High'|'Calibrating'
  const [shap, setShap] = useState(null);

  useEffect(() => {
    // Minimal initialization: in live mode show Low; in simulation show Medium
    if (envMode.includes('sim')) {
      setLoadClass('Medium');
      setShap({ task1: 0.2, task2: 0.3, task3: 0.5 });
      setHydrated(true);
    } else {
      // Live/default: assume Low until telemetry hooks populate it
      setLoadClass('Low');
      setShap({ task1: 0.05, task2: 0.05, task3: 0.1 });
      setHydrated(true);
    }
  }, [envMode]);

  // Expose a small API so components can optionally update state (useful for tests)
  const setManualLoad = (cls, shapObj = null) => {
    setLoadClass(cls);
    if (shapObj) setShap(shapObj);
    setHydrated(true);
  };

  return (
    <CognitiveLoadContext.Provider value={{ loadClass, shap, hydrated, setManualLoad }}>
      {children}
    </CognitiveLoadContext.Provider>
  );
};

export const useCognitiveLoad = () => {
  const ctx = useContext(CognitiveLoadContext);
  if (!ctx) {
    // Provide a safe fallback to avoid crashes in isolated imports
    return { loadClass: 'Calibrating', shap: null, hydrated: false, setManualLoad: () => {} };
  }
  return ctx;
};

export default CognitiveLoadContext;
