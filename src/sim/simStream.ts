/**
 * Simulation stream that generates synthetic cognitive load feature data
 * Emits values every 500-800ms with 16 features matching FEATURE_ORDER.json
 */

import FEATURE_ORDER from '../telemetry/FEATURE_ORDER.json';

type FeatureData = {
  ts: number;
  features: number[];
};

type StreamCallback = (data: FeatureData) => void;

let intervalId: number | null = null;
let isRunning = false;
let callbacks: Set<StreamCallback> = new Set();

// Simulation state for smooth transitions
let simulationTime = 0;
const DEBUG = (import.meta as any).env.VITE_ENABLE_DEBUG_TELEMETRY === 'true';

// Activity tracking
let recentClicks = 0;
let recentKeyPresses = 0;
let recentMouseMoves = 0;
let lastActivityTime = Date.now();
let activityLevel = 0; // 0 = idle, 1 = max activity
let manualActivity = 0; // manual bumps from tasks

// Decay activity over time
const ACTIVITY_DECAY_RATE = 0.95; // Decay per tick
const ACTIVITY_HISTORY_WINDOW = 5000; // 5 seconds

function log(...args: any[]) {
  if (DEBUG) {
    console.log('[simStream]', ...args);
  }
}

// Track user interactions
if (typeof window !== 'undefined') {
  window.addEventListener('click', () => {
    recentClicks++;
    lastActivityTime = Date.now();
  });
  
  window.addEventListener('keydown', () => {
    recentKeyPresses++;
    lastActivityTime = Date.now();
  });
  
  let mouseMoveThrottle: number | null = null;
  window.addEventListener('mousemove', () => {
    if (!mouseMoveThrottle) {
      recentMouseMoves++;
      lastActivityTime = Date.now();
      mouseMoveThrottle = window.setTimeout(() => {
        mouseMoveThrottle = null;
      }, 100);
    }
  });
  
  window.addEventListener('input', () => {
    recentKeyPresses++;
    lastActivityTime = Date.now();
  });
}

/**
 * Calculate current activity level based on recent interactions
 */
function calculateActivityLevel(): number {
  const timeSinceActivity = Date.now() - lastActivityTime;
  
  // If idle for more than 2 seconds, start decaying
  if (timeSinceActivity > 2000) {
    activityLevel *= 0.98; // Faster decay when idle
  } else {
    // Calculate activity score based on recent actions
    const clickScore = Math.min(recentClicks * 0.15, 0.4);
    const keyScore = Math.min(recentKeyPresses * 0.10, 0.4);
    const mouseScore = Math.min(recentMouseMoves * 0.02, 0.2);
    
    const targetActivity = Math.min(clickScore + keyScore + mouseScore, 1.0);
    
    // Smooth transition to target
    activityLevel = activityLevel * 0.7 + targetActivity * 0.3;
  }
  
  // Reset counters periodically
  recentClicks = Math.floor(recentClicks * 0.9);
  recentKeyPresses = Math.floor(recentKeyPresses * 0.9);
  recentMouseMoves = Math.floor(recentMouseMoves * 0.85);
  
  return Math.max(0, Math.min(1, activityLevel));
}

/**
 * Generate random value with smooth sine-wave oscillation
 */

  // Manual activity injection (e.g., task components signaling effort)
  if (manualActivity > activityLevel) {
    activityLevel = manualActivity;
  }
function generateFeatureValue(baseValue: number, amplitude: number, frequency: number): number {
  const noise = (Math.random() - 0.5) * 0.03; // Reduced from 0.2 to 0.03
  const wave = Math.sin(simulationTime * frequency) * amplitude;
  return Math.max(0, Math.min(1, baseValue + wave + noise));
}
  manualActivity *= 0.85;

/**
 * Generate all 16 feature values for current simulation tick

/**
 * Allow React components to manually signal activity spikes.
 * Useful when certain flows (e.g., form submissions) don't emit enough browser-level events.
 */
export function registerSimActivitySpike(intensity: number = 0.35) {
  manualActivity = Math.min(1, manualActivity + intensity);
  lastActivityTime = Date.now();
}
 */
function generateFeatures(): number[] {
  // Calculate activity-based modulation
  const activity = calculateActivityLevel();
  
  // Activity influences key cognitive load features
  // Low activity (0) = low cognitive load values
  // High activity (1) = high cognitive load values
  const activityBoost = activity * 0.5; // Max boost of 0.5
  
  // Create varying patterns for different features
  // Key features for "High" load detection: constraint_violation_rate, scheduling_difficulty, idle_time_ratio
  
  const features: number[] = [
    generateFeatureValue(0.10 + activityBoost, 0.08, 0.015),  // constraint_violation_rate - increases with activity
    generateFeatureValue(0.15 + activityBoost, 0.10, 0.012),  // scheduling_difficulty - increases with activity
    generateFeatureValue(0.15 + activity * 0.3, 0.08, 0.018),  // budget_management_stress
    generateFeatureValue(0.15 + activityBoost * 0.6, 0.06, 0.015),  // idle_time_ratio - increases with activity
    generateFeatureValue(0.20 + activity * 0.4, 0.06, 0.020),  // multitasking_load
    generateFeatureValue(0.05 + activity * 0.3, 0.04, 0.022),  // drag_attempts
    generateFeatureValue(0.75 - activity * 0.2, 0.08, 0.018),  // recovery_efficiency (decreases with high load)
    generateFeatureValue(0.15 + activity * 0.35, 0.08, 0.015),  // mouse_entropy_avg
    generateFeatureValue(0.15 + activity * 0.4, 0.06, 0.018),  // action_density - increases with activity
    generateFeatureValue(0.15 + activity * 0.3, 0.08, 0.020),  // decision_latency_avg
    generateFeatureValue(0.20 + activity * 0.35, 0.06, 0.022),  // click_rate - increases with activity
    generateFeatureValue(0.10 + activity * 0.4, 0.06, 0.018),  // edit_rate - increases with typing
    generateFeatureValue(0.03 + activity * 0.15, 0.03, 0.025),  // help_request_rate
    generateFeatureValue(0.10 + activity * 0.25, 0.05, 0.020),  // window_switch_rate
    generateFeatureValue(0.05 + activity * 0.2, 0.04, 0.022),  // error_rate
    generateFeatureValue(0.80 - activity * 0.25, 0.10, 0.018),  // focus_time_avg (decreases with high load)
  ];

  if (DEBUG && activity > 0.3) {
    log('Activity level:', activity.toFixed(2), 'Clicks:', recentClicks, 'Keys:', recentKeyPresses);
  }

  return features;
}

/**
 * Emit data to all registered callbacks
 */
function emit() {
  if (!isRunning) return;

  const data: FeatureData = {
    ts: Date.now(),
    features: generateFeatures(),
  };

  log('Emitting:', data);
  
  callbacks.forEach(callback => {
    try {
      callback(data);
    } catch (err) {
      console.error('[simStream] Callback error:', err);
    }
  });

  simulationTime += 0.03; // Advance simulation time more slowly (reduced from 0.1 to 0.03)

  // Schedule next emission with random delay
  const delay = 500 + Math.random() * 300; // 500-800ms
  intervalId = window.setTimeout(emit, delay);
}

/**
 * Start the simulation stream
 */
export function startSimStream(callback: StreamCallback): () => void {
  callbacks.add(callback);
  
  if (!isRunning) {
    isRunning = true;
    log('Starting simulation stream');
    emit();
  }

  // Return unsubscribe function
  return () => {
    callbacks.delete(callback);
    if (callbacks.size === 0) {
      stopSimStream();
    }
  };
}

/**
 * Stop the simulation stream
 */
export function stopSimStream(): void {
  if (intervalId !== null) {
    clearTimeout(intervalId);
    intervalId = null;
  }
  isRunning = false;
  callbacks.clear();
  log('Simulation stream stopped');
}

/**
 * Check if simulation is running
 */
export function isSimStreamRunning(): boolean {
  return isRunning;
}
