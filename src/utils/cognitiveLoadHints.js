const FEATURE_HINTS = {
  form_hesitation_index: {
    label: 'Form hesitation',
    advice: 'Stay with one field until it is complete to reduce costly context switching.',
  },
  form_efficiency: {
    label: 'Form efficiency',
    advice: 'Lean on keyboard navigation and avoid re-editing finished answers.',
  },
  form_error_rate: {
    label: 'Form errors',
    advice: 'Double-check required inputs before moving on to avoid rework.',
  },
  zip_code_struggle: {
    label: 'ZIP corrections',
    advice: 'Keep ZIP in 5-digit (US) or 6-digit (India) formats to avoid errors.',
  },
  decision_uncertainty: {
    label: 'Decision uncertainty',
    advice: 'Narrow filters to the required specs to shorten the comparison list.',
  },
  exploration_breadth: {
    label: 'Exploration breadth',
    advice: 'Review the curated short list first before reopening filters.',
  },
  rapid_hovers: {
    label: 'Rapid hovering',
    advice: 'Pause over each product card to compare the rating and price calmly.',
  },
  filter_optimization_score: {
    label: 'Filter tuning',
    advice: 'Use the preset laptop filter to lock price, brand, RAM, and rating.',
  },
  scheduling_difficulty: {
    label: 'Scheduling difficulty',
    advice: 'Place meetings in order of constraints to avoid rearranging later.',
  },
  constraint_violation_rate: {
    label: 'Constraint violations',
    advice: 'Check the checklist for time windows before dragging a meeting.',
  },
  budget_management_stress: {
    label: 'Budget stress',
    advice: 'Review the sidebar budget summary before confirming selections.',
  },
  drag_attempts: {
    label: 'Drag attempts',
    advice: 'Preview acceptable slots in the hint text before dragging again.',
  },
  multitasking_load: {
    label: 'Multitasking load',
    advice: 'Finish a resource (flights → hotel → transport) before switching.',
  },
  recovery_efficiency: {
    label: 'Recovery effort',
    advice: 'Undo overruns immediately using the budget controls.',
  },
  mouse_entropy_avg: {
    label: 'Cursor wandering',
    advice: 'Use the quick-jump buttons to move to the next section.',
  },
  idle_time_ratio: {
    label: 'Idle pauses',
    advice: 'Take a short break, then return to finalize the remaining steps.',
  },
  action_density: {
    label: 'Action spikes',
    advice: 'Slow down interactions; deliberate clicks count more than speed.',
  },
};

export const TASK_FEATURE_GROUPS = {
  task1: ['form_hesitation_index', 'form_efficiency', 'form_error_rate', 'zip_code_struggle'],
  task2: ['decision_uncertainty', 'exploration_breadth', 'rapid_hovers', 'filter_optimization_score'],
  task3: [
    'scheduling_difficulty',
    'constraint_violation_rate',
    'budget_management_stress',
    'drag_attempts',
    'multitasking_load',
    'recovery_efficiency',
    'mouse_entropy_avg',
    'idle_time_ratio',
    'action_density',
  ],
};

function toTitleCase(value = '') {
  return value
    .replace(/_/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\w+/g, (word) => word.charAt(0).toUpperCase() + word.slice(1));
}

export function getFeatureHint(featureKey) {
  const fallback = { label: toTitleCase(featureKey), advice: 'Stay focused on the next required step.' };
  return FEATURE_HINTS[featureKey] || fallback;
}

export function getTaskInsights(shap = [], taskKey, limit = 3) {
  const allowed = TASK_FEATURE_GROUPS[taskKey];
  if (!allowed || !Array.isArray(shap)) {
    return [];
  }
  return shap
    .filter((item) => allowed.includes(item.feature))
    .slice(0, limit)
    .map((item) => ({
      feature: item.feature,
      contribution: item.contribution,
      ...getFeatureHint(item.feature),
    }));
}

export function describeLoadState(loadClass) {
  switch (loadClass) {
    case 'High':
      return {
        title: 'High load detected',
        message: 'We are simplifying the interface so you can finish the critical inputs first.',
      };
    case 'Medium':
      return {
        title: 'Moderate load',
        message: 'Consider using the guided steps below to stay on track.',
      };
    case 'Low':
      return {
        title: 'Steady pace',
        message: 'Keep going—everything looks balanced right now.',
      };
    default:
      return {
        title: 'Calibrating',
        message: 'Collecting enough interactions to adapt the UI.',
      };
  }
}
