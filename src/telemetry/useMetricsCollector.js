import { useEffect, useRef, useState } from 'react';
import { subscribeToTaskMetrics } from './taskMetricsBus';

const WORKER_INTERVAL_MS = 2000;

function createWorker() {
  return new Worker(new URL('./metricsWorker.js', import.meta.url), { type: 'module' });
}

export function useMetricsCollector({ autoStart = true } = {}) {
  const workerRef = useRef(null);
  const latestFeaturesRef = useRef(null);
  const [lastEmission, setLastEmission] = useState(null);

  useEffect(() => {
    if (!autoStart) return undefined;
    const worker = createWorker();
    workerRef.current = worker;
    worker.postMessage({ type: 'init', payload: { intervalMs: WORKER_INTERVAL_MS } });

    const unsubscribe = subscribeToTaskMetrics(({ taskId, data }) => {
      if (!workerRef.current) return;
      workerRef.current.postMessage({ type: 'setTaskData', payload: { taskId, data } });
    });

    worker.onmessage = (event) => {
      const { type, payload } = event.data || {};
      if (type === 'features') {
        latestFeaturesRef.current = payload;
        setLastEmission(payload);
      } else if (type === 'error') {
        console.error('[MetricsWorker]', payload?.message);
      }
    };

    return () => {
      unsubscribe();
      worker.postMessage({ type: 'terminate' });
      workerRef.current = null;
    };
  }, [autoStart]);

  const forceCompute = () => {
    if (workerRef.current) {
      workerRef.current.postMessage({ type: 'forceCompute' });
    }
  };

  const pause = () => {
    if (workerRef.current) {
      workerRef.current.postMessage({ type: 'pause' });
    }
  };

  const resume = () => {
    if (workerRef.current) {
      workerRef.current.postMessage({ type: 'resume' });
    }
  };

  return {
    lastEmission,
    latestFeatures: latestFeaturesRef.current,
    forceCompute,
    pause,
    resume,
  };
}
