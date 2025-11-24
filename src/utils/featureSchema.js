// Unified feature engineering for cognitive load inference.
// Consumes raw task logger snapshots and produces 16 engineered features.
// Each compute step guards against missing data (undefined/null) to allow progressive adoption.

// Helper: safe length
function len(arr) { return Array.isArray(arr) ? arr.length : 0; }
function sum(arr) { return (Array.isArray(arr) ? arr : []).reduce((a,b)=>a+(typeof b==='number'?b:0),0); }
function avg(arr) { const l = len(arr); return l? sum(arr)/l : 0; }
function msBetween(startISO, endISO) {
  if(!startISO || !endISO) return 0;
  return new Date(endISO).getTime() - new Date(startISO).getTime();
}

// Normalize per minute utility
function perMinute(count, startISO, endISO) {
  const ms = msBetween(startISO, endISO);
  if (!ms) return 0;
  return (count / ms) * 60000;
}

// Z-score like normalization placeholder (will be replaced with model scaler). For now identity.
function pseudoZ(x) { return x; }

export function computeEngineeredFeatures({ task1, task2, task3 }) {
  // Extract timing windows (fallback to task3 if most complex, else earliest start / latest end)
  const starts = [task1?.timestamps?.start, task2?.timestamps?.start, task3?.start_time].filter(Boolean).map(s=>new Date(s).getTime());
  const ends = [task1?.timestamps?.end, task2?.timestamps?.end, task3?.end_time].filter(Boolean).map(s=>new Date(s).getTime());
  const globalStartISO = starts.length? new Date(Math.min(...starts)).toISOString(): null;
  const globalEndISO = ends.length? new Date(Math.max(...ends)).toISOString(): null;

  // -------------------- Form Entry (Task1) --------------------
  const fieldInteractions = task1?.field_interactions || [];
  const totalFieldFocusTime = sum(fieldInteractions.map(f=>f.focus_time_ms));
  const totalEdits = sum(fieldInteractions.map(f=>f.edit_count));
  const totalBackspaces = sum(fieldInteractions.map(f=>f.backspace_count));
  const zipCorrections = task1?.task_specific_metrics?.zip_code_corrections || 0;
  const helpRequests = task1?.summary_metrics?.help_requests || 0;
  const formErrors = task1?.summary_metrics?.error_count || 0;
  const formTotalTimeMs = task1?.summary_metrics?.total_time_ms || msBetween(task1?.timestamps?.start, task1?.timestamps?.end);
  const fieldsCompleted = fieldInteractions.filter(f=>f.edit_count>0).length;
  const requiredFields = len(fieldInteractions); // assuming all enumerated fields required.

  // form_hesitation_index: pauses vs active editing. Approx: (totalFieldFocusTime - (avg edit latency * edits)) / totalFieldFocusTime.
  // Without per-keystroke latency, approximate using backspace+edit density: higher density => lower hesitation.
  const editDensity = (totalEdits + totalBackspaces) / (totalFieldFocusTime/1000 || 1);
  const form_hesitation_index = totalFieldFocusTime ? 1 - Math.min(1, editDensity / 5) : 0; // heuristic scaling.

  // form_efficiency: fields completed per minute adjusted by low error & low backspace.
  const fieldsPerMinute = perMinute(fieldsCompleted, task1?.timestamps?.start, task1?.timestamps?.end);
  const correctionPenalty = 1 + (zipCorrections + formErrors) * 0.1;
  const form_efficiency = fieldsPerMinute / correctionPenalty;

  // form_error_rate: (errors + zip corrections) / (fields completed or 1).
  const form_error_rate = (formErrors + zipCorrections) / (fieldsCompleted || 1);

  // zip_code_struggle: zip corrections normalized by form time minutes.
  const zip_code_struggle = perMinute(zipCorrections, task1?.timestamps?.start, task1?.timestamps?.end);

  // -------------------- Product Exploration (Task2) --------------------
  const productsViewed = task2?.product_exploration?.products_viewed || [];
  const rapidHoverSwitches = task2?.product_exploration?.rapid_hover_switches || 0;
  const comparisons = task2?.decision_making?.comparison_count || 0;
  const filterUses = task2?.filter_interactions?.filter_uses || [];
  const filterResets = task2?.filter_interactions?.filter_resets || 0;
  const timeToFirstFilter = task2?.decision_making?.time_to_first_filter || 0;
  const decisionTimeMs = task2?.decision_making?.decision_time_ms || 0;
  const task2Errors = task2?.summary_metrics?.error_count || 0;
  const task2Start = task2?.timestamps?.start;
  const task2End = task2?.timestamps?.end;
  const uniqueProducts = new Set(productsViewed.map(p=>p.product_id)).size;

  // decision_uncertainty: rapid hover + long decision time normalized by products viewed.
  const decision_uncertainty = (rapidHoverSwitches + (decisionTimeMs/10000)) / (uniqueProducts || 1);

  // exploration_breadth: unique products per minute.
  const exploration_breadth = perMinute(uniqueProducts, task2Start, task2End);

  // rapid_hovers: rapid hover switches per minute.
  const rapid_hovers = perMinute(rapidHoverSwitches, task2Start, task2End);

  // filter_optimization_score: effectiveness; fewer resets & early filter use.
  const filterActions = len(filterUses) || 1;
  const resetPenalty = filterResets / filterActions;
  const timingFactor = timeToFirstFilter ? 1 / (1 + timeToFirstFilter/30000) : 1; // earlier is better
  const filter_optimization_score = timingFactor * (1 - resetPenalty);

  // -------------------- Travel Planning (Task3) --------------------
  const dragAttempts = task3?.meetings?.drag_attempts || [];
  const invalidDragAttempts = dragAttempts.reduce((acc,a)=>acc + a.attempts.filter(t=>t.valid===false).length,0);
  const totalDragAttempts = dragAttempts.reduce((acc,a)=>acc + len(a.attempts),0);
  const avgPlacementDuration = avg(dragAttempts.filter(d=>d.placed).map(d=>d.placement_duration_ms));
  const componentSwitches = task3?.component_switches || [];
  const budget = task3?.budget || {};
  const overrunEvents = budget?.budget_overrun_events || 0;
  const costAdjustments = budget?.cost_adjustment_actions || 0;
  const rapidSelections = task3?.computed_signals?.rapid_selection_changes || 0;
  const totalActions = task3?.total_actions || 0;
  const overrunSelectionBuffer = budget?.overrun_selection_counter || 0;
  const task3Errors = task3?.error_count || 0;
  const task3Start = task3?.start_time;
  const task3End = task3?.end_time;

  // scheduling_difficulty: invalid attempts ratio + normalized placement duration + component switch rate.
  const invalidRatio = totalDragAttempts ? invalidDragAttempts / totalDragAttempts : 0;
  const placementComponent = avgPlacementDuration ? Math.min(1, avgPlacementDuration / 60000) : 0; // cap at 1 for >60s
  const switchRate = perMinute(len(componentSwitches), task3Start, task3End);
  const scheduling_difficulty = invalidRatio * 0.4 + placementComponent * 0.3 + Math.min(1, switchRate/10) * 0.3;

  // constraint_violation_rate: (overrun events + invalid attempts + errors) / (total actions or attempts baseline).
  const constraint_violation_rate = (overrunEvents + invalidDragAttempts + task3Errors) / (totalActions || (totalDragAttempts||1));

  // budget_management_stress: overrun events + cost adjustments per minute.
  const budget_management_stress = perMinute(overrunEvents + costAdjustments, task3Start, task3End);

  // drag_attempts: total drag attempts per minute.
  const drag_attempts = perMinute(totalDragAttempts, task3Start, task3End);

  // multitasking_load: rapid selection changes + component switches per minute.
  const multitasking_load = perMinute(rapidSelections + len(componentSwitches), task3Start, task3End);

  // recovery_efficiency: resolved overruns vs overrun events (cost_adjustments / overrun_events) capped.
  const recovery_efficiency = overrunEvents ? Math.min(1, costAdjustments / overrunEvents) : 1;

  // -------------------- Universal Metrics --------------------
  // mouse_entropy_avg: combine entropies across tasks (Task2 mouse_analytics.mouse_entropy, Task3 category entropies, Task1 derived from path).
  const t2Entropy = task2?.mouse_analytics?.mouse_entropy || 0;
  const t3Entropies = [task3?.flights?.mouse_entropy, task3?.hotels?.mouse_entropy, task3?.transportation?.mouse_entropy, task3?.meetings?.mouse_entropy].filter(e=>typeof e==='number');
  // Task1 entropy: approximate from mouse_data density (not stored as entropy). Use heuristic: unique targets / events.
  const task1Mouse = task1?.mouse_data || [];
  const uniqueMouseTargets = new Set(task1Mouse.map(m=>m.target)).size;
  const task1EntropyApprox = task1Mouse.length? Math.min(5, uniqueMouseTargets / (task1Mouse.length/10 || 1)) : 0;
  const mouse_entropy_avg = avg([t2Entropy, ...t3Entropies, task1EntropyApprox].filter(e=>e>0));

  // idle_time_ratio: total idle ms / total session ms (from Task3 idle_periods; Task1 & Task2 not tracking explicitly).
  const idlePeriods = task3?.idle_periods || [];
  const idleMs = sum(idlePeriods.map(p=>msBetween(p.start, p.end)));
  const totalSessionMs = msBetween(globalStartISO, globalEndISO);
  const idle_time_ratio = totalSessionMs ? idleMs / totalSessionMs : 0;

  // action_density: total actions per minute (Task3 total_actions + Task2 filter uses + Task1 edits/backspaces).
  const actionCountComposite = totalActions + len(filterUses) + totalEdits + totalBackspaces;
  const action_density = perMinute(actionCountComposite, globalStartISO, globalEndISO);

  // Return feature vector object
  return {
    form_hesitation_index: pseudoZ(form_hesitation_index),
    form_efficiency: pseudoZ(form_efficiency),
    form_error_rate: pseudoZ(form_error_rate),
    zip_code_struggle: pseudoZ(zip_code_struggle),
    decision_uncertainty: pseudoZ(decision_uncertainty),
    exploration_breadth: pseudoZ(exploration_breadth),
    rapid_hovers: pseudoZ(rapid_hovers),
    filter_optimization_score: pseudoZ(filter_optimization_score),
    scheduling_difficulty: pseudoZ(scheduling_difficulty),
    constraint_violation_rate: pseudoZ(constraint_violation_rate),
    budget_management_stress: pseudoZ(budget_management_stress),
    drag_attempts: pseudoZ(drag_attempts),
    multitasking_load: pseudoZ(multitasking_load),
    recovery_efficiency: pseudoZ(recovery_efficiency),
    mouse_entropy_avg: pseudoZ(mouse_entropy_avg),
    idle_time_ratio: pseudoZ(idle_time_ratio),
    action_density: pseudoZ(action_density),
  };
}

// Ordered feature list for model alignment
export const FEATURE_ORDER = [
  'form_hesitation_index','form_efficiency','form_error_rate','zip_code_struggle',
  'decision_uncertainty','exploration_breadth','rapid_hovers','filter_optimization_score',
  'scheduling_difficulty','constraint_violation_rate','budget_management_stress','drag_attempts',
  'multitasking_load','recovery_efficiency','mouse_entropy_avg','idle_time_ratio','action_density'
];

// Placeholder validator for downstream preprocessing
export function validateFeatureVector(vec) {
  return FEATURE_ORDER.every(k => typeof vec[k] === 'number');
}
