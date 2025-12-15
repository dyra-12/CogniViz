/**
 * WebSocket client for streaming telemetry data to backend
 * Reads VITE_WS_URL from environment and handles reconnection logic
 * In simulation mode, uses simStream and simPredict instead of real WebSocket
 */

import { startSimStream, stopSimStream, registerSimActivitySpike } from '../sim/simStream';
import { predictFromFeatures } from '../sim/simPredict';

let ws = null;
let reconnectTimer = null;
let simUnsubscribe = null;
const RECONNECT_DELAY = 3000;

const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:8000/stream';
const DEBUG_TELEMETRY = import.meta.env.VITE_ENABLE_DEBUG_TELEMETRY === 'true';
const COG_LOAD_MODE = import.meta.env.VITE_COG_LOAD_MODE || 'simulation';

// Listeners for prediction updates
const predictionListeners = new Set();

function log(...args) {
  if (DEBUG_TELEMETRY) {
    console.log('[wsClient]', ...args);
  }
}

function connect() {
  if (ws?.readyState === WebSocket.OPEN || ws?.readyState === WebSocket.CONNECTING) {
    return;
  }

  try {
    log('Connecting to', WS_URL);
    ws = new WebSocket(WS_URL);

    ws.onopen = () => {
      log('Connected');
      if (reconnectTimer) {
        clearTimeout(reconnectTimer);
        reconnectTimer = null;
      }
    };

    ws.onclose = () => {
      log('Disconnected');
      ws = null;
      // Auto-reconnect after delay
      if (!reconnectTimer) {
        reconnectTimer = setTimeout(() => {
          reconnectTimer = null;
          connect();
        }, RECONNECT_DELAY);
      }
    };

    ws.onerror = (err) => {
      log('Error:', err);
    };

    ws.onmessage = (event) => {
      log('Received:', event.data);
      try {
        const data = JSON.parse(event.data);
        // Notify prediction listeners
        predictionListeners.forEach(listener => {
          try {
            listener(data);
          } catch (err) {
            console.error('[wsClient] Listener error:', err);
          }
        });
      } catch (err) {
        log('Parse error:', err);
      }
    };
  } catch (err) {
    log('Connection failed:', err);
  }
}

export function sendMetrics(data) {
  if (!ws || ws.readyState !== WebSocket.OPEN) {
    log('Cannot send, not connected');
    return false;
  }
  try {
    ws.send(JSON.stringify(data));
    log('Sent:', data);
    return true;
  } catch (err) {
    log('Send error:', err);
    return false;
  }
}

export function disconnect() {
  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }
  if (ws) {
    ws.close();
    ws = null;
  }
}

export function initWebSocket() {
  if (COG_LOAD_MODE === 'live') {
    connect();
  } else {
    startSimulation();
  }
}

export function boostSimulationActivity(intensity = 0.35) {
  if (COG_LOAD_MODE !== 'simulation') return;
  try {
    registerSimActivitySpike(intensity);
  } catch (err) {
    log('Failed to boost simulation activity', err);
  }
}

/**
 * Subscribe to prediction updates (works in both live and simulation mode)
 */
export function subscribeToPredictions(listener) {
  predictionListeners.add(listener);
  log('Prediction listener added, total:', predictionListeners.size);
  
  return () => {
    predictionListeners.delete(listener);
    log('Prediction listener removed');
  };
}

/**
 * Start simulation mode
 */
function startSimulation() {
  if (simUnsubscribe) return;
  
  log('Starting simulation mode');
  simUnsubscribe = startSimStream((data) => {
    // Convert features to prediction
    const prediction = predictFromFeatures(data.features);
    
    // Add timestamp and features to result
    const fullResult = {
      ...prediction,
      ts: data.ts,
      features: data.features,
    };
    
    // Notify all listeners
    predictionListeners.forEach(listener => {
      try {
        listener(fullResult);
      } catch (err) {
        console.error('[wsClient] Listener error:', err);
      }
    });
  });
}

/**
 * Stop simulation mode
 */
function stopSimulation() {
  if (simUnsubscribe) {
    simUnsubscribe();
    simUnsubscribe = null;
    log('Simulation stopped');
  }
}

// Auto-start on import
if (COG_LOAD_MODE === 'live') {
  log('Auto-connecting in live mode');
  connect();
} else {
  log('Simulation mode - starting sim stream');
  startSimulation();
}

export default { initWebSocket, sendMetrics, disconnect, subscribeToPredictions, boostSimulationActivity };
