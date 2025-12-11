const resolveEnvFlag = () => {
  try {
    if (typeof import.meta !== 'undefined' && import.meta?.env?.VITE_ENABLE_DEBUG_TELEMETRY !== undefined) {
      return import.meta.env.VITE_ENABLE_DEBUG_TELEMETRY;
    }
  } catch {
    // noop - fall through to process env
  }
  if (typeof process !== 'undefined' && process?.env?.VITE_ENABLE_DEBUG_TELEMETRY !== undefined) {
    return process.env.VITE_ENABLE_DEBUG_TELEMETRY;
  }
  return 'false';
};

const flagValue = resolveEnvFlag();
const isEnabled = String(flagValue).toLowerCase() === 'true';
const prefixFor = (scope) => scope ? `[Telemetry:${scope}]` : '[Telemetry]';
const buildLogger = (method) => (scope, ...args) => {
  if (!isEnabled || typeof console?.[method] !== 'function') return;
  console[method](prefixFor(scope), ...args);
};

export const debugTelemetry = buildLogger('log');
export const debugTelemetryWarn = buildLogger('warn');
export const debugTelemetryError = buildLogger('error');
export const isDebugTelemetryEnabled = () => isEnabled;

export default debugTelemetry;
