import { createVrDevDiagnosticTransport } from './createVrDevDiagnosticTransport.js';

const SCHEMA_VERSION = 1;
const now = () => new Date().toISOString();
const createSessionId = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;

function serializeError(error) {
  return {
    name: error?.name ?? typeof error,
    message: error?.message ?? String(error),
    stack: typeof error?.stack === 'string' ? error.stack : null
  };
}

export function createVrIntroProgressionDiagnosticCapture({
  windowRef = globalThis.window, locale = 'en', recordingEnabled = true, transport: suppliedTransport = null
} = {}) {
  if (!recordingEnabled) {
    const inert = () => {};
    return Object.freeze({ configureSources: inert, begin: inert, record: inert, failure: inert, dispose: inert });
  }

  const transport = suppliedTransport ?? createVrDevDiagnosticTransport({ windowRef, channel: 'intro' });
  const sessionId = createSessionId();
  let sequence = 0;
  let active = false;
  let getIntroState = () => null;
  let getScenarioPoint = () => null;

  function snapshot(kind, details = {}) {
    const latestBreadcrumbSequence = sequence;
    sequence += 1;
    return {
      schemaVersion: SCHEMA_VERSION,
      sessionId,
      eventSequence: sequence,
      clientTimestamp: now(),
      locale,
      kind,
      introState: getIntroState?.() ?? null,
      scenarioPoint: getScenarioPoint?.() ?? null,
      ...details,
      ...(kind === 'DIAGNOSTIC_FAILURE' ? { latestBreadcrumbSequence } : {})
    };
  }

  function record(kind, details = {}) {
    if (!active) return;
    try { transport.sendBreadcrumb(snapshot(kind, details)); } catch { /* Diagnostics stay fail-soft. */ }
  }

  function begin() {
    if (active) return;
    active = true;
    record('INTRO_DIAGNOSTIC_BEGIN');
  }

  function failure(error, source = 'synchronous') {
    if (!active) return;
    try { transport.sendFailure(snapshot('DIAGNOSTIC_FAILURE', { source, error: serializeError(error) })); }
    catch { /* Diagnostics must never replace the original error. */ }
  }

  const onError = (event) => failure(event?.error ?? event?.message, 'window.error');
  const onUnhandledRejection = (event) => failure(event?.reason, 'unhandledrejection');
  try {
    windowRef?.addEventListener?.('error', onError);
    windowRef?.addEventListener?.('unhandledrejection', onUnhandledRejection);
  } catch { /* Diagnostics stay fail-soft. */ }

  return Object.freeze({
    configureSources(sources = {}) {
      getIntroState = typeof sources.getIntroState === 'function' ? sources.getIntroState : getIntroState;
      getScenarioPoint = typeof sources.getScenarioPoint === 'function' ? sources.getScenarioPoint : getScenarioPoint;
    },
    begin, record, failure,
    dispose() {
      try {
        windowRef?.removeEventListener?.('error', onError);
        windowRef?.removeEventListener?.('unhandledrejection', onUnhandledRejection);
      } catch { /* Diagnostics stay fail-soft. */ }
    }
  });
}
