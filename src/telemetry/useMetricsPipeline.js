// Minimal placeholder for pipeline wiring. Real pipeline was removed; this
// keeps imports satisfied and provides a safe, no-op set of functions.

export function initMetricsPipeline() {
  return {
    start: () => {},
    stop: () => {},
    onFeatures: (cb) => {
      // returns unsubscribe
      return () => {};
    },
  };
}

export default initMetricsPipeline;
