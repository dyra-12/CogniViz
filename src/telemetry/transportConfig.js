// Minimal transport configuration
const DEFAULT_WS = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_WS_URL) || (typeof process !== 'undefined' && process?.env?.VITE_WS_URL) || 'ws://localhost:8000/stream';

export default {
  wsUrl: DEFAULT_WS,
  schemaVersion: (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SCHEMA_VERSION) || (typeof process !== 'undefined' && process?.env?.VITE_SCHEMA_VERSION) || 'v1',
};
