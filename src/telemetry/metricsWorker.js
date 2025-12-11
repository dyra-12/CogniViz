/* eslint-disable no-restricted-globals */
import { computeEngineeredFeatures, validateFeatureVector, FEATURE_SCHEMA_VERSION } from '../utils/featureSchema';

let latest = { task1: null, task2: null, task3: null };
let intervalMs = 2000;
let timerId = null;
const schemaVersion = FEATURE_SCHEMA_VERSION;

function computeAndPost(source = 'timer') {
  try {
    const features = computeEngineeredFeatures({
      task1: latest.task1,
      task2: latest.task2,
      task3: latest.task3,
    });
    if (!validateFeatureVector(features)) {
      return;
    }
    postMessage({
      type: 'features',
      payload: {
        schemaVersion,
        features,
        source,
        emittedAt: Date.now(),
        intervalMs,
      },
    });
  } catch (err) {
    postMessage({ type: 'error', payload: { message: err.message, stack: err.stack } });
  }
}

function startTimer() {
  stopTimer();
  timerId = setInterval(() => computeAndPost('interval'), intervalMs);
}

function stopTimer() {
  if (timerId) {
    clearInterval(timerId);
    timerId = null;
  }
}

self.onmessage = (event) => {
  const { type, payload } = event.data || {};
  if (type === 'init') {
    intervalMs = payload?.intervalMs || intervalMs;
    startTimer();
    return;
  }
  if (type === 'setTaskData') {
    const { taskId, data } = payload || {};
    if (taskId && data) {
      latest = { ...latest, [taskId]: data };
    }
    return;
  }
  if (type === 'forceCompute') {
    computeAndPost('force');
    return;
  }
  if (type === 'pause') {
    stopTimer();
    return;
  }
  if (type === 'resume') {
    startTimer();
    return;
  }
  if (type === 'terminate') {
    stopTimer();
    close();
  }
};
