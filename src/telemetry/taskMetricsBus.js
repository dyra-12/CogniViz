import { debugTelemetryWarn, debugTelemetry } from './debugLogger';
const listeners = new Set();
const latestByTask = {};
const defaultClone = (data) => {
  if (!data) return null;
  if (typeof structuredClone === 'function') {
    try { return structuredClone(data); } catch { /* fallback below */ }
  }
  try {
    return JSON.parse(JSON.stringify(data));
  } catch {
    return null;
  }
};

function notify(taskId) {
  const snapshot = latestByTask[taskId];
  if (!snapshot) return;
  listeners.forEach((listener) => {
    try {
      listener({ taskId, data: snapshot, timestamp: Date.now() });
    } catch (err) {
      debugTelemetryWarn('bus.listener-error', err);
    }
  });
}

export function publishTaskMetrics(taskId, data) {
  if (!taskId || !data) return;
  latestByTask[taskId] = defaultClone(data);
  debugTelemetry('bus.publish', { taskId, keys: Object.keys(data || {}) });
  notify(taskId);
}

export function subscribeToTaskMetrics(listener) {
  if (typeof listener !== 'function') return () => {};
  listeners.add(listener);
  // Immediately emit latest snapshots so subscriber starts warm.
  Object.entries(latestByTask).forEach(([taskId, snapshot]) => {
    if (snapshot) {
      try {
        listener({ taskId, data: snapshot, timestamp: Date.now() });
      } catch (err) {
        debugTelemetryWarn('bus.listener-init-error', err);
      }
    }
  });
  return () => listeners.delete(listener);
}
