import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { useMetricsPipeline } from '../telemetry/useMetricsPipeline';

const CognitiveLoadContext = createContext(null);

const defaultProbabilities = { Low: 0.34, Medium: 0.33, High: 0.33 };
const defaultPrediction = {
  loadClass: 'Calibrating',
  probabilities: defaultProbabilities,
  shap: [],
  explanation: 'Collecting interaction signals...',
  modelVersion: 'n/a',
  receivedAt: null,
};

export const CognitiveLoadProvider = ({ children }) => {
  const [prediction, setPrediction] = useState(defaultPrediction);
  const [history, setHistory] = useState([]);
  const [hydrated, setHydrated] = useState(false);

  const handlePrediction = useCallback((payload) => {
    if (!payload) {
      return;
    }
    const probabilities = payload.probabilities ? {
      Low: payload.probabilities.Low ?? defaultProbabilities.Low,
      Medium: payload.probabilities.Medium ?? defaultProbabilities.Medium,
      High: payload.probabilities.High ?? defaultProbabilities.High,
    } : { ...defaultProbabilities };
    const normalized = {
      loadClass: payload.loadClass || 'Unknown',
      probabilities,
      shap: Array.isArray(payload.shap) ? payload.shap : [],
      explanation: payload.explanation || 'Model response received.',
      modelVersion: payload.modelVersion || 'unknown',
      receivedAt: payload.receivedAt || Date.now(),
    };
    setPrediction(normalized);
    setHydrated(true);
    setHistory((prev) => {
      const next = [...prev, normalized];
      if (next.length > 60) next.shift();
      return next;
    });
  }, []);

  const {
    transportState,
    lastEmission,
    forceCompute,
    pause,
    resume,
  } = useMetricsPipeline({ onPrediction: handlePrediction });

  const contextValue = useMemo(() => ({
    ...prediction,
    hydrated,
    history,
    lastFeatures: lastEmission,
    transportState,
    forceCompute,
    pauseStreaming: pause,
    resumeStreaming: resume,
  }), [prediction, hydrated, history, lastEmission, transportState, forceCompute, pause, resume]);

  return (
    <CognitiveLoadContext.Provider value={contextValue}>
      {children}
    </CognitiveLoadContext.Provider>
  );
};

export const useCognitiveLoad = () => {
  const context = useContext(CognitiveLoadContext);
  if (!context) {
    throw new Error('useCognitiveLoad must be used within a CognitiveLoadProvider');
  }
  return context;
};
