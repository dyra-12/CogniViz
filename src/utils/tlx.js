export const computeRawTlx = (scores) => {
  // scores: object with 6 numeric values
  const keys = ['mental_demand','physical_demand','temporal_demand','performance','effort','frustration'];
  const vals = keys.map(k => Number(scores[k]) || 0);
  const sum = vals.reduce((a,b) => a + b, 0);
  const avg = vals.length ? sum / vals.length : 0;
  // Round to one decimal for readability
  return Math.round(avg * 10) / 10;
};

export const buildTlxPayload = (taskId, scores) => ({
  task_id: taskId,
  nasa_tlx_scores: {
    mental_demand: Number(scores.mental_demand) || 0,
    physical_demand: Number(scores.physical_demand) || 0,
    temporal_demand: Number(scores.temporal_demand) || 0,
    performance: Number(scores.performance) || 0,
    effort: Number(scores.effort) || 0,
    frustration: Number(scores.frustration) || 0
  },
  raw_tlx_score: computeRawTlx(scores),
  timestamp: new Date().toISOString()
});

export const saveTlxToLocal = (payload) => {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return false;
    const key = `nasa_tlx_${payload.task_id}`;
    // per-task key
    window.localStorage.setItem(key, JSON.stringify(payload));
    // aggregate array
    const aggKey = 'nasa_tlx_responses';
    const existing = window.localStorage.getItem(aggKey);
    let arr = [];
    if (existing) {
      try { arr = JSON.parse(existing) || []; } catch (e) { arr = []; }
    }
    arr = arr.filter(item => item && item.task_id !== payload.task_id); // replace any existing for same task
    arr.push(payload);
    window.localStorage.setItem(aggKey, JSON.stringify(arr));
    return true;
  } catch (e) {
    console.error('Failed to save TLX payload', e);
    return false;
  }
};
