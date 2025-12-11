export function describeLoadState(loadState) {
  switch ((loadState || '').toString()) {
    case 'High':
      return { title: 'High Cognitive Load', message: 'Users may struggle; consider simplifying the UI or deferring non-essential elements.' };
    case 'Medium':
      return { title: 'Medium Cognitive Load', message: 'Users are somewhat taxed; prioritize essential inputs and reduce distractions.' };
    case 'Low':
      return { title: 'Low Cognitive Load', message: 'Users appear comfortable; full experience is appropriate.' };
    case 'Calibrating':
    default:
      return { title: 'Calibrating', message: 'Model calibration in progress; metrics may not be available yet.' };
  }
}

export function getTaskInsights(shap, taskId = 'task1', top = 3) {
  // Minimal placeholder: return an empty array or a few synthetic insights when shap provided
  try {
    if (!shap) return [];
    const entries = Object.entries(shap || {}).map(([k, v]) => ({ feature: k, importance: v }));
    entries.sort((a, b) => Math.abs(b.importance) - Math.abs(a.importance));
    return entries.slice(0, top).map(e => ({ feature: e.feature, impact: e.importance }));
  } catch (e) {
    return [];
  }
}
