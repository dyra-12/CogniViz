import { debugTelemetry, debugTelemetryWarn, debugTelemetryError } from './debugLogger';

const resolveEnv = (key, fallback = undefined) => {
  try {
    if (typeof import.meta !== 'undefined' && import.meta?.env?.[key] !== undefined) {
      return import.meta.env[key];
    }
  } catch {
    // Swallow - fall through to process env lookup
  }
  if (typeof process !== 'undefined' && process?.env?.[key] !== undefined) {
    return process.env[key];
  }
  return fallback;
};

const supportsWebSocket = () => typeof window !== 'undefined' && typeof window.WebSocket === 'function';
const DEFAULT_WS_URL = resolveEnv('VITE_WS_URL', 'ws://localhost:8000/stream');
const DEFAULT_PROTOCOL_VERSION = '2024.12';

const defaultOptions = {
  autoConnect: true,
  reconnectDelayMs: 2500,
  maxReconnectDelayMs: 15000,
  pingIntervalMs: 12000,
  maxBufferSize: 32,
  protocolVersion: DEFAULT_PROTOCOL_VERSION,
  wsUrl: DEFAULT_WS_URL,
};

export class MetricsWSClient {
  constructor(options = {}) {
    this.options = { ...defaultOptions, ...options };
    this.url = this.options.wsUrl;
    this.protocolVersion = this.options.protocolVersion;
    this.status = 'idle';
    this.socket = null;
    this.buffer = [];
    this.pingTimer = null;
    this.reconnectTimeout = null;
    this.packetCounter = 0;
    this.predictionHandler = null;
    this.stateListeners = new Set();
    this.messageListeners = new Set();
    this.mockResponder = null;
    this.nextReconnectDelay = this.options.reconnectDelayMs;

    if (supportsWebSocket() && this.options.autoConnect) {
      this.connect();
    } else if (!supportsWebSocket()) {
      this.setState('unsupported');
      debugTelemetryWarn('ws.unsupported', 'WebSocket API missing in current environment.');
    }
  }

  setMockResponder(responder) {
    if (typeof responder === 'function') {
      this.mockResponder = responder;
    }
  }

  setPredictionHandler(handler) {
    if (typeof handler === 'function') {
      this.predictionHandler = handler;
    }
    return () => {
      if (this.predictionHandler === handler) {
        this.predictionHandler = null;
      }
    };
  }

  onStateChange(listener) {
    if (typeof listener !== 'function') return () => {};
    this.stateListeners.add(listener);
    try {
      listener(this.status);
    } catch (err) {
      debugTelemetryWarn('ws.listener', err);
    }
    return () => this.stateListeners.delete(listener);
  }

  onMessage(listener) {
    if (typeof listener !== 'function') return () => {};
    this.messageListeners.add(listener);
    return () => this.messageListeners.delete(listener);
  }

  setState(next) {
    if (this.status === next) return;
    this.status = next;
    this.stateListeners.forEach((listener) => {
      try {
        listener(next);
      } catch (err) {
        debugTelemetryWarn('ws.state-listener', err);
      }
    });
  }

  connect() {
    if (!supportsWebSocket()) {
      this.setState('unsupported');
      return;
    }
    if (this.socket && (this.socket.readyState === WebSocket.OPEN || this.socket.readyState === WebSocket.CONNECTING)) {
      return;
    }
    try {
      this.socket = new WebSocket(this.url);
      this.setState('connecting');
      this.socket.addEventListener('open', () => this.handleOpen());
      this.socket.addEventListener('message', (event) => this.handleMessage(event));
      this.socket.addEventListener('close', (event) => this.handleClose(event));
      this.socket.addEventListener('error', (event) => this.handleError(event));
    } catch (err) {
      debugTelemetryError('ws.connect', err);
      this.scheduleReconnect();
    }
  }

  disconnect(code = 1000, reason = 'manual-close') {
    this.setState('terminated');
    this.stopPing();
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    if (this.socket) {
      try {
        this.socket.close(code, reason);
      } catch (err) {
        debugTelemetryWarn('ws.disconnect', err);
      }
      this.socket = null;
    }
  }

  handleOpen() {
    this.setState('online');
    this.nextReconnectDelay = this.options.reconnectDelayMs;
    this.flush();
    this.startPing();
    debugTelemetry('ws.open', `Connected to ${this.url}`);
  }

  handleClose(event) {
    this.stopPing();
    if (this.status !== 'terminated') {
      this.setState('offline');
      debugTelemetryWarn('ws.close', { code: event?.code, reason: event?.reason });
      this.scheduleReconnect();
    }
  }

  handleError(event) {
    debugTelemetryWarn('ws.error', event?.message || event);
  }

  handleMessage(event) {
    let payload;
    try {
      payload = JSON.parse(event.data);
    } catch (err) {
      debugTelemetryWarn('ws.message.parse', err);
      return;
    }
    this.messageListeners.forEach((listener) => {
      try {
        listener(payload);
      } catch (err) {
        debugTelemetryWarn('ws.message-listener', err);
      }
    });
    if (payload?.type === 'prediction' && this.predictionHandler) {
      try {
        this.predictionHandler(payload.payload || payload);
      } catch (err) {
        debugTelemetryWarn('ws.prediction-handler', err);
      }
    }
  }

  sendPacket(packet) {
    if (!packet || typeof packet !== 'object') return;
    const enriched = {
      ...packet,
      id: packet.id || ++this.packetCounter,
      protocolVersion: this.protocolVersion,
      sentAt: Date.now(),
    };
    this.buffer.push(enriched);
    if (this.buffer.length > this.options.maxBufferSize) {
      this.buffer.shift();
    }
    if (this.mockResponder && typeof this.mockResponder === 'function') {
      const mockResponse = this.mockResponder(enriched);
      if (mockResponse && this.predictionHandler) {
        this.predictionHandler(mockResponse.payload || mockResponse);
      }
      return;
    }
    this.flush();
  }

  sendMetrics(featuresPayload) {
    if (!featuresPayload) return;
    this.sendPacket({ type: 'metrics', features: featuresPayload });
  }

  flush() {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) return;
    while (this.buffer.length > 0) {
      const packet = this.buffer.shift();
      try {
        this.socket.send(JSON.stringify(packet));
      } catch (err) {
        debugTelemetryError('ws.flush', err);
        this.buffer.unshift(packet);
        break;
      }
    }
  }

  scheduleReconnect() {
    if (this.options.autoConnect === false) return;
    if (this.status === 'terminated') return;
    if (this.reconnectTimeout) return;
    this.reconnectTimeout = setTimeout(() => {
      this.reconnectTimeout = null;
      this.connect();
    }, this.nextReconnectDelay);
    this.nextReconnectDelay = Math.min(this.nextReconnectDelay * 2, this.options.maxReconnectDelayMs);
    this.setState('reconnecting');
  }

  startPing() {
    this.stopPing();
    this.pingTimer = setInterval(() => {
      if (!this.socket || this.socket.readyState !== WebSocket.OPEN) return;
      try {
        this.socket.send(JSON.stringify({ type: 'ping', at: Date.now() }));
      } catch (err) {
        debugTelemetryWarn('ws.ping', err);
      }
    }, this.options.pingIntervalMs);
  }

  stopPing() {
    if (this.pingTimer) {
      clearInterval(this.pingTimer);
      this.pingTimer = null;
    }
  }
}

export const createWSClient = (options = {}) => new MetricsWSClient(options);
let sharedClient;
export const getSharedWSClient = () => {
  if (sharedClient) return sharedClient;
  if (!supportsWebSocket()) return null;
  sharedClient = new MetricsWSClient();
  return sharedClient;
};

export default MetricsWSClient;
