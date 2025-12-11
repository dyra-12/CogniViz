import featureOrder from '../telemetry/FEATURE_ORDER.json';
import { debugTelemetryWarn } from '../telemetry/debugLogger';

const resolveEnv = (key) => {
  try {
    if (typeof import.meta !== 'undefined' && import.meta?.env?.[key] !== undefined) {
      return import.meta.env[key];
    }
  } catch {
    // ignore for SSR/build contexts
  }
  if (typeof process !== 'undefined' && process?.env?.[key] !== undefined) {
    return process.env[key];
  }
  return undefined;
};

const FEATURE_KEYS = featureOrder.features.map((entry) => entry.key);
const ZERO_VECTOR = FEATURE_KEYS.map(() => 0);
const safeNumber = (value) => {
  const num = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(num) ? num : 0;
};

const calculators = {
  task1_total_duration_ms: ({ task1 }) => safeNumber(task1?.summary_metrics?.total_time_ms),
  task1_field_interaction_count: ({ task1 }) => safeNumber(task1?.field_interactions?.length || 0),
  task1_error_count: ({ task1 }) => safeNumber(task1?.summary_metrics?.error_count),
  task1_help_requests: ({ task1 }) => safeNumber(task1?.summary_metrics?.help_requests),
  task1_zip_corrections: ({ task1 }) => safeNumber(task1?.task_specific_metrics?.zip_code_corrections),
  task2_total_duration_ms: ({ task2 }) => safeNumber(task2?.summary_metrics?.total_time_ms),
  task2_error_count: ({ task2 }) => safeNumber(task2?.summary_metrics?.error_count),
  task2_filter_resets: ({ task2 }) => safeNumber(task2?.filter_interactions?.filter_resets),
  task2_mouse_entropy: ({ task2 }) => safeNumber(task2?.mouse_analytics?.mouse_entropy),
  task2_decision_time_ms: ({ task2 }) => safeNumber(task2?.decision_making?.decision_time_ms),
  task3_total_actions: ({ task3 }) => safeNumber(task3?.total_actions),
  task3_budget_overruns: ({ task3 }) => safeNumber(task3?.budget?.budget_overrun_events),
  task3_cost_adjustments: ({ task3 }) => safeNumber(task3?.budget?.cost_adjustment_actions),
  task3_idle_periods: ({ task3 }) => safeNumber(task3?.idle_periods?.length || 0),
  task3_mouse_entropy_hotels: ({ task3 }) => safeNumber(task3?.hotels?.mouse_entropy),
  task3_mouse_entropy_meetings: ({ task3 }) => safeNumber(task3?.meetings?.mouse_entropy),
};

export const FEATURE_SCHEMA_VERSION = featureOrder.schemaVersion;
export const FEATURE_VECTOR_LENGTH = FEATURE_KEYS.length;
export const FEATURE_ORDER = featureOrder;
export const FEATURE_KEY_LIST = [...FEATURE_KEYS];

const envSchemaVersion = resolveEnv('VITE_SCHEMA_VERSION');
if (envSchemaVersion && envSchemaVersion !== FEATURE_SCHEMA_VERSION) {
  debugTelemetryWarn('features.schema-version-mismatch', {
    env: envSchemaVersion,
    defined: FEATURE_SCHEMA_VERSION,
  });
}

export function computeEngineeredFeatures({ task1 = null, task2 = null, task3 = null } = {}) {
  if (!task1 && !task2 && !task3) {
    return [...ZERO_VECTOR];
  }
  return FEATURE_KEYS.map((key) => {
    const calculator = calculators[key];
    if (!calculator) return 0;
    try {
      return safeNumber(calculator({ task1, task2, task3 }));
    } catch (err) {
      debugTelemetryWarn('features.compute', { key, err });
      return 0;
    }
  });
}

export function validateFeatureVector(vec) {
  if (!Array.isArray(vec)) return false;
  if (vec.length !== FEATURE_VECTOR_LENGTH) return false;
  return vec.every((value) => typeof value === 'number' && Number.isFinite(value));
}

export default {
  FEATURE_ORDER,
  FEATURE_SCHEMA_VERSION,
  FEATURE_VECTOR_LENGTH,
  FEATURE_KEY_LIST,
  computeEngineeredFeatures,
  validateFeatureVector,
};
