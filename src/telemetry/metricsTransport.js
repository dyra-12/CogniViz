// Minimal stub for legacy metrics transport used by older modules.
// This provides a small, backward-compatible surface but does not implement
// real transport logic — prefer `wsClient.js` for production.

class MetricsTransport {
  constructor(options = {}) {
    this.status = 'idle';
    this.url = options.url || (typeof import.meta !== 'undefined' ? import.meta.env?.VITE_WS_URL : process?.env?.VITE_WS_URL);
    this.buffer = [];
    this.stateListeners = new Set();
  }

  onStateChange(listener) {
    if (typeof listener !== 'function') return () => {};
    this.stateListeners.add(listener);
    try { listener(this.status); } catch { /* ignore listener errors */ }
    return () => this.stateListeners.delete(listener); /* ignore listener errors */
  }

  setMockResponder() {}

  connect() {
    this.status = 'online';
    this.stateListeners.forEach((l) => { try { l(this.status); } catch { /* ignore listener error */ } });
  }

  disconnect() {
    this.status = 'terminated';
    this.stateListeners.forEach((l) => { try { l(this.status); } catch { /* ignore listener error */ } });
  }

  sendMetrics(payload) {
    // Buffer locally; no-op for now
    this.buffer.push(payload);
  }
}

export default MetricsTransport;
export const createMetricsTransport = (opts) => new MetricsTransport(opts);
