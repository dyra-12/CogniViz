/**
 * Simulation prediction logic that converts feature values to cognitive load predictions
 * Simple rule-based model for demonstration purposes
 */

import FEATURE_ORDER from '../telemetry/FEATURE_ORDER.json';

export type ShapContributor = {
  feature: string;
  value: number;
  impact: number;
};

export type PredictionResult = {
  probs: {
    Low: number;
    Medium: number;
    High: number;
  };
  class: 'Low' | 'Medium' | 'High';
  shapTop: ShapContributor[];
  explanation: string;
};

const DEBUG = (import.meta as any).env.VITE_ENABLE_DEBUG_TELEMETRY === 'true';

function log(...args: any[]) {
  if (DEBUG) {
    console.log('[simPredict]', ...args);
  }
}

/**
 * Convert feature array to prediction result
 */
export function predictFromFeatures(features: number[]): PredictionResult {
  if (features.length !== 16) {
    console.warn('[simPredict] Expected 16 features, got', features.length);
  }

  // Key indices for load detection
  const constraintViolationIdx = FEATURE_ORDER.indexOf('constraint_violation_rate');
  const schedulingDifficultyIdx = FEATURE_ORDER.indexOf('scheduling_difficulty');
  const idleTimeIdx = FEATURE_ORDER.indexOf('idle_time_ratio');

  // Get key feature values
  const constraintViolation = features[constraintViolationIdx] || 0;
  const schedulingDifficulty = features[schedulingDifficultyIdx] || 0;
  const idleTime = features[idleTimeIdx] || 0;

  // Calculate aggregate load score (0-1)
  const loadScore = (constraintViolation * 0.4 + schedulingDifficulty * 0.4 + idleTime * 0.2);

  // Determine class based on thresholds
  let loadClass: 'Low' | 'Medium' | 'High';
  let probs: { Low: number; Medium: number; High: number };

  if (loadScore > 0.6) {
    loadClass = 'High';
    probs = {
      Low: Math.max(0, 0.15 - (loadScore - 0.6) * 0.3),
      Medium: Math.max(0, 0.35 - (loadScore - 0.6) * 0.5),
      High: Math.min(1, 0.5 + (loadScore - 0.6) * 1.25),
    };
  } else if (loadScore > 0.35) {
    loadClass = 'Medium';
    probs = {
      Low: Math.max(0, 0.5 - (loadScore - 0.35) * 1.4),
      Medium: 0.45 + (loadScore - 0.35) * 0.4,
      High: Math.max(0, 0.05 + (loadScore - 0.35) * 0.6),
    };
  } else {
    loadClass = 'Low';
    probs = {
      Low: 0.7 + (0.35 - loadScore) * 0.8,
      Medium: 0.25 - (0.35 - loadScore) * 0.5,
      High: Math.max(0, 0.05 - (0.35 - loadScore) * 0.1),
    };
  }

  // Normalize probabilities to sum to 1
  const total = probs.Low + probs.Medium + probs.High;
  probs.Low /= total;
  probs.Medium /= total;
  probs.High /= total;

  // Calculate SHAP-like contributions (simplified)
  const contributors: ShapContributor[] = features.map((value, idx) => ({
    feature: FEATURE_ORDER[idx],
    value: value,
    impact: value * (idx < 3 ? 0.8 : 0.3), // Higher weight for top 3 features
  }));

  // Sort by impact and take top 3
  contributors.sort((a, b) => b.impact - a.impact);
  const shapTop = contributors.slice(0, 3);

  // Generate explanation
  const explanation = generateExplanation(loadClass, shapTop, probs);

  const result: PredictionResult = {
    probs,
    class: loadClass,
    shapTop,
    explanation,
  };

  log('Prediction:', result);
  return result;
}

/**
 * Generate human-readable explanation
 */
function generateExplanation(
  loadClass: 'Low' | 'Medium' | 'High',
  topContributors: ShapContributor[],
  probs: { Low: number; Medium: number; High: number }
): string {
  const topFeatureName = topContributors[0]?.feature.replace(/_/g, ' ') || 'unknown';
  const confidence = Math.round(probs[loadClass] * 100);

  if (loadClass === 'High') {
    return `High cognitive load detected (${confidence}% confidence). Primary driver: ${topFeatureName}. Consider reducing task complexity.`;
  } else if (loadClass === 'Medium') {
    return `Moderate cognitive load (${confidence}% confidence). Main factor: ${topFeatureName}. User is managing but approaching limits.`;
  } else {
    return `Low cognitive load (${confidence}% confidence). User is comfortable with current task demands.`;
  }
}

/**
 * Get human-readable feature labels
 */
export function getFeatureLabel(featureName: string): string {
  const labels: Record<string, string> = {
    constraint_violation_rate: 'Constraint Violations',
    scheduling_difficulty: 'Scheduling Difficulty',
    budget_management_stress: 'Budget Stress',
    idle_time_ratio: 'Idle Time',
    multitasking_load: 'Multitasking Load',
    drag_attempts: 'Drag Attempts',
    recovery_efficiency: 'Recovery Efficiency',
    mouse_entropy_avg: 'Mouse Entropy',
    action_density: 'Action Density',
    decision_latency_avg: 'Decision Latency',
    click_rate: 'Click Rate',
    edit_rate: 'Edit Rate',
    help_request_rate: 'Help Requests',
    window_switch_rate: 'Window Switches',
    error_rate: 'Error Rate',
    focus_time_avg: 'Focus Time',
  };

  return labels[featureName] || featureName;
}
