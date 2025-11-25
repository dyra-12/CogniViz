import { useEffect, useMemo, useRef, useState } from 'react';
import { useMetricsCollector } from './useMetricsCollector';
import { resolveTransportConfig } from './transportConfig';
import { MetricsTransport } from './metricsTransport';

export function useMetricsPipeline({ onPrediction } = {}) {
  const configRef = useRef(resolveTransportConfig());
  const transport = useMemo(() => new MetricsTransport(configRef.current), []);
  const [transportState, setTransportState] = useState(transport.getState());

  const { lastEmission, forceCompute, pause, resume } = useMetricsCollector({ autoStart: true });

  useEffect(() => {
    transport.setPredictionHandler(onPrediction);
    return () => transport.setPredictionHandler(null);
  }, [transport, onPrediction]);

  useEffect(() => {
    const unsubscribe = transport.onStateChange((state) => setTransportState(state));
    return unsubscribe;
  }, [transport]);

  useEffect(() => {
    if (lastEmission?.features) {
      transport.enqueue(lastEmission);
    }
  }, [lastEmission, transport]);

  useEffect(() => () => transport.close(), [transport]);

  return {
    transportState,
    lastEmission,
    forceCompute,
    pause,
    resume,
  };
}
