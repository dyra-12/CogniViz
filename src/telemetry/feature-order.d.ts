declare module './FEATURE_ORDER.json' {
  export interface FeatureOrderEntry {
    key:
      | 'task1_total_duration_ms'
      | 'task1_field_interaction_count'
      | 'task1_error_count'
      | 'task1_help_requests'
      | 'task1_zip_corrections'
      | 'task2_total_duration_ms'
      | 'task2_error_count'
      | 'task2_filter_resets'
      | 'task2_mouse_entropy'
      | 'task2_decision_time_ms'
      | 'task3_total_actions'
      | 'task3_budget_overruns'
      | 'task3_cost_adjustments'
      | 'task3_idle_periods'
      | 'task3_mouse_entropy_hotels'
      | 'task3_mouse_entropy_meetings';
    index: number;
    description: string;
    source: string;
  }

  export interface FeatureOrder {
    schemaVersion: 'v1';
    features: FeatureOrderEntry[];
  }

  const value: FeatureOrder;
  export default value;
}

export type TelemetryFeatureKey =
  | 'task1_total_duration_ms'
  | 'task1_field_interaction_count'
  | 'task1_error_count'
  | 'task1_help_requests'
  | 'task1_zip_corrections'
  | 'task2_total_duration_ms'
  | 'task2_error_count'
  | 'task2_filter_resets'
  | 'task2_mouse_entropy'
  | 'task2_decision_time_ms'
  | 'task3_total_actions'
  | 'task3_budget_overruns'
  | 'task3_cost_adjustments'
  | 'task3_idle_periods'
  | 'task3_mouse_entropy_hotels'
  | 'task3_mouse_entropy_meetings';

export type TelemetryFeatureVector = [
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number
];
