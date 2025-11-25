const DEFAULTS = {
  url: typeof import.meta !== 'undefined' ? import.meta.env.VITE_METRICS_WS_URL : undefined,
  reconnectDelayMs: 1500,
  maxReconnectDelayMs: 12000,
  maxBufferSize: 50,
  protocolVersion: 1,
  mockMode: typeof import.meta !== 'undefined' ? import.meta.env.VITE_USE_MOCK_INFERENCE === 'true' : false,
};

export function resolveTransportConfig(overrides = {}) {
  const resolvedUrl = overrides.url || DEFAULTS.url || 'ws://localhost:8000/ws/metrics';
  return {
    url: resolvedUrl,
    reconnectDelayMs: overrides.reconnectDelayMs ?? DEFAULTS.reconnectDelayMs,
    maxReconnectDelayMs: overrides.maxReconnectDelayMs ?? DEFAULTS.maxReconnectDelayMs,
    maxBufferSize: overrides.maxBufferSize ?? DEFAULTS.maxBufferSize,
    protocolVersion: overrides.protocolVersion ?? DEFAULTS.protocolVersion,
    mockMode: overrides.mockMode ?? DEFAULTS.mockMode,
  };
}
