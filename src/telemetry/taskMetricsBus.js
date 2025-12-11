const listeners = new Set();
const latestByTask = {};
const defaultClone = (data) => {
  if (!data) return null;
  if (typeof structuredClone === 'function') {
    try { return structuredClone(data); } catch (_) { /* fallback below */ }
  }
  try {
    return JSON.parse(JSON.stringify(data));
  } catch (_) {
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
      console.error('[TaskMetricsBus] listener error', err);
    }
  });
}

export function publishTaskMetrics(taskId, data) {
  if (!taskId || !data) return;
  latestByTask[taskId] = defaultClone(data);
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
        console.error('[TaskMetricsBus] listener init error', err);
      }
    }
  });
  return () => listeners.delete(listener);
}
