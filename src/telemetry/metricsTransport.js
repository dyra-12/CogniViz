const BACKOFF_FACTOR = 1.6;
const PING_INTERVAL_MS = 20000;

function defaultMockResponder(packet) {
  const loadLevels = ['Low', 'Medium', 'High'];
  const scheduling = packet.features?.features?.scheduling_difficulty || 0;
  const idx = Math.min(loadLevels.length - 1, Math.floor(scheduling * 3));
  const level = loadLevels[idx] || 'Medium';
  return {
    type: 'prediction',
    payload: {
      loadClass: level,
      probabilities: { Low: level === 'Low' ? 0.7 : 0.15, Medium: level === 'Medium' ? 0.65 : 0.2, High: level === 'High' ? 0.65 : 0.15 },
      source: 'mock',
      receivedAt: Date.now(),
    },
  };
}

export class MetricsTransport {
  constructor(config) {
    this.url = config.url;
    this.protocolVersion = config.protocolVersion || 1;
    this.maxBufferSize = config.maxBufferSize || 50;
    this.reconnectDelayMs = config.reconnectDelayMs || 1500;
    this.maxReconnectDelayMs = config.maxReconnectDelayMs || 12000;
    this.mockMode = !!config.mockMode;
    this.buffer = [];
    this.socket = null;
    this.status = this.mockMode ? 'mock' : 'idle';
    this.stateListeners = new Set();
    this.predictionHandler = null;
    this.mockResponder = defaultMockResponder;
    this.nextReconnectDelay = this.reconnectDelayMs;
    this.reconnectTimeout = null;
    this.pingTimer = null;
    this.packetCounter = 0;
    if (!this.mockMode) {
      this.connect();
    }
  }

  setPredictionHandler(handler) {
    this.predictionHandler = typeof handler === 'function' ? handler : null;
  }

  onStateChange(listener) {
    if (typeof listener !== 'function') return () => {};
    this.stateListeners.add(listener);
    try {
      listener(this.status);
    } catch (_) {}
    return () => this.stateListeners.delete(listener);
  }

  setState(next) {
    if (this.status === next) return;
    this.status = next;
    this.stateListeners.forEach((listener) => {
      try {
        listener(next);
      } catch (err) {
        console.warn('[MetricsTransport] state listener error', err);
      }
    });
  }

  setMockResponder(fn) {
    if (typeof fn === 'function') {
      this.mockResponder = fn;
    }
  }

  getState() {
    return this.status;
  }

  connect() {
    if (typeof window === 'undefined' || typeof window.WebSocket === 'undefined') {
      console.warn('[MetricsTransport] WebSocket unavailable; staying offline.');
      this.setState('unsupported');
      return;
    }
    try {
      this.socket = new WebSocket(this.url);
      this.setState('connecting');
      this.socket.addEventListener('open', () => this.handleOpen());
      this.socket.addEventListener('close', (evt) => this.handleClose(evt));
      this.socket.addEventListener('error', (err) => this.handleError(err));
      this.socket.addEventListener('message', (msg) => this.handleMessage(msg));
    } catch (err) {
      console.error('[MetricsTransport] failed to open WebSocket', err);
      this.scheduleReconnect();
    }
  }

  handleOpen() {
    this.setState('online');
    this.nextReconnectDelay = this.reconnectDelayMs;
    this.flush();
    this.startPing();
  }

  handleClose(event) {
    this.stopPing();
    if (this.status !== 'terminated') {
      this.setState('offline');
      this.scheduleReconnect();
    }
  }

  handleError(err) {
    console.warn('[MetricsTransport] socket error', err);
  }

  handleMessage(event) {
    try {
      const parsed = JSON.parse(event.data);
      if (parsed?.type === 'prediction' && this.predictionHandler) {
        this.predictionHandler(parsed.payload || parsed);
      }
    } catch (err) {
      console.warn('[MetricsTransport] failed to parse message', err);
    }
  }

  enqueue(payload) {
    if (!payload) return;
    const featurePayload = payload.features && payload.schemaVersion
      ? payload
      : {
          schemaVersion: payload.schemaVersion || 1,
          features: payload.features || payload,
          source: payload.source,
          emittedAt: payload.emittedAt,
          intervalMs: payload.intervalMs,
        };

    const packet = {
      id: ++this.packetCounter,
      type: 'metrics',
      protocolVersion: this.protocolVersion,
      sentAt: Date.now(),
      features: featurePayload,
    };
    this.buffer.push(packet);
    if (this.buffer.length > this.maxBufferSize) {
      this.buffer.shift();
    }
    if (this.mockMode) {
      const response = this.mockResponder(packet);
      if (this.predictionHandler) {
        this.predictionHandler(response.payload);
      }
      return;
    }
    this.flush();
  }

  flush() {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      return;
    }
    while (this.buffer.length) {
      const packet = this.buffer.shift();
      this.socket.send(JSON.stringify(packet));
    }
  }

  startPing() {
    this.stopPing();
    this.pingTimer = setInterval(() => {
      if (this.socket && this.socket.readyState === WebSocket.OPEN) {
        try {
          this.socket.send(JSON.stringify({ type: 'ping', at: Date.now() }));
        } catch (_) {}
      }
    }, PING_INTERVAL_MS);
  }

  stopPing() {
    if (this.pingTimer) {
      clearInterval(this.pingTimer);
      this.pingTimer = null;
    }
  }

  scheduleReconnect() {
    if (this.mockMode || this.status === 'terminated') return;
    if (this.reconnectTimeout) return;
    this.reconnectTimeout = setTimeout(() => {
      this.reconnectTimeout = null;
      this.connect();
    }, this.nextReconnectDelay);
    this.nextReconnectDelay = Math.min(this.nextReconnectDelay * BACKOFF_FACTOR, this.maxReconnectDelayMs);
    this.setState('reconnecting');
  }

  close() {
    this.stopPing();
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    if (this.socket) {
      this.setState('terminated');
      this.socket.close();
      this.socket = null;
    }
  }
}
