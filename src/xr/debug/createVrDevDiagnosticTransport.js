const DIAGNOSTIC_PATH = '__vr-debug/rune';

export function createVrDevDiagnosticTransport({ windowRef = globalThis.window } = {}) {
  if (import.meta.env.DEV !== true) {
    return Object.freeze({ sendBreadcrumb() {}, sendFailure() {} });
  }

  function prepare(record) {
    try {
      const baseUrl = import.meta.env.BASE_URL ?? '/';
      const endpoint = new URL(`${baseUrl.replace(/\/?$/, '/')}${DIAGNOSTIC_PATH}`, windowRef.location.origin);
      return { endpoint: endpoint.href, body: JSON.stringify(record) };
    } catch {
      return null;
    }
  }

  function sendFetch(prepared, keepalive = false) {
    try {
      const request = windowRef.fetch(prepared.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: prepared.body,
        keepalive
      });
      request?.catch?.(() => {});
    } catch { /* Remote diagnostics must stay fail-soft. */ }
  }

  function sendBreadcrumb(record) {
    const prepared = prepare(record);
    if (prepared) sendFetch(prepared);
  }

  function sendFailure(record) {
    const prepared = prepare(record);
    if (!prepared) return;
    try {
      const payload = new Blob([prepared.body], { type: 'application/json' });
      if (windowRef.navigator?.sendBeacon?.(prepared.endpoint, payload) === true) return;
    } catch { /* Fall through to keepalive fetch. */ }
    sendFetch(prepared, true);
  }

  return Object.freeze({ sendBreadcrumb, sendFailure });
}
