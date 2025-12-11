// Lightweight placeholder hook for metrics collection pipeline
import { useEffect } from 'react';

export default function useMetricsCollector() {
  useEffect(() => {
    // No-op collector to avoid runtime errors where hook is expected.
    return () => {};
  }, []);

  return {
    start: () => {},
    stop: () => {},
    forceFlush: () => {},
  };
}
