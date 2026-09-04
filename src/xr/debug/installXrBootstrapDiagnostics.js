const PREFIX = '[experience-vr][xr-bootstrap]';

let sequence = 0;
let requestSessionInstalled = false;
const instrumentedSessions = new WeakSet();
const instrumentedXrManagers = new WeakSet();
const instrumentedGlContexts = new WeakSet();
const instrumentedCanvases = new WeakSet();

function log(boundary, details) {
  sequence += 1;
  console.log(PREFIX, sequence, boundary, details);
}

function errorDetails(error) {
  return {
    name: error?.name,
    message: error?.message,
    ...(error?.stack ? { stack: error.stack } : {})
  };
}

function logFailure(boundary, error, details = {}) {
  sequence += 1;
  console.error(PREFIX, sequence, boundary, { ...errorDetails(error), ...details });
}

function logUnavailable(boundary) {
  log(`${boundary}:unavailable`);
}

function webGlSnapshot(gl) {
  const snapshot = {};
  try {
    if (typeof gl?.isContextLost === 'function') snapshot.isContextLost = gl.isContextLost();
  } catch (error) {
    snapshot.isContextLost = { unavailable: errorDetails(error) };
  }
  try {
    if (typeof gl?.getContextAttributes === 'function') {
      snapshot.contextAttributes = gl.getContextAttributes();
    }
  } catch (error) {
    snapshot.contextAttributes = { unavailable: errorDetails(error) };
  }
  return snapshot;
}

function findPropertyDescriptor(target, propertyName) {
  let owner = target;
  while (owner) {
    const descriptor = Object.getOwnPropertyDescriptor(owner, propertyName);
    if (descriptor) return descriptor;
    owner = Object.getPrototypeOf(owner);
  }
  return null;
}

function installMethod(target, methodName, wrapperFactory, boundary) {
  let original;
  try {
    original = target?.[methodName];
  } catch (error) {
    logFailure(`${boundary}:unavailable`, error);
    return false;
  }
  if (typeof original !== 'function') {
    logUnavailable(boundary);
    return false;
  }

  const wrapper = wrapperFactory(original);
  try {
    target[methodName] = wrapper;
  } catch (error) {
    logFailure(`${boundary}:unavailable`, error);
    return false;
  }

  let installedMethod;
  try {
    installedMethod = target[methodName];
  } catch (error) {
    logFailure(`${boundary}:unavailable`, error);
    return false;
  }
  if (installedMethod !== wrapper) {
    logUnavailable(boundary);
    return false;
  }
  return true;
}

function inputSourceSnapshot(session) {
  try {
    return Array.from(session.inputSources, (source) => ({
      handedness: source.handedness,
      targetRayMode: source.targetRayMode,
      profiles: Array.from(source.profiles ?? [])
    }));
  } catch (error) {
    return { unavailable: errorDetails(error) };
  }
}

function sessionSnapshot(session) {
  const snapshot = {};
  try {
    snapshot.visibilityState = session.visibilityState;
  } catch (error) {
    snapshot.visibilityState = { unavailable: errorDetails(error) };
  }

  let exposesEnabledFeatures = false;
  try {
    exposesEnabledFeatures = 'enabledFeatures' in session;
  } catch (error) {
    snapshot.enabledFeatures = { unavailable: errorDetails(error) };
  }
  if (exposesEnabledFeatures) {
    try {
      snapshot.enabledFeatures = Array.from(session.enabledFeatures);
    } catch (error) {
      snapshot.enabledFeatures = { unavailable: errorDetails(error) };
    }
  }
  return snapshot;
}

function instrumentSession(session) {
  if (!session || instrumentedSessions.has(session)) return;
  instrumentedSessions.add(session);

  log('session:available', sessionSnapshot(session));

  if (typeof session.addEventListener === 'function') {
    try {
      session.addEventListener('end', () => log('session:event:end', sessionSnapshot(session)));
      session.addEventListener('visibilitychange', () => {
        log('session:event:visibilitychange', sessionSnapshot(session));
      });
      session.addEventListener('inputsourceschange', () => {
        log('session:event:inputsourceschange', inputSourceSnapshot(session));
      });
    } catch (error) {
      logFailure('session:event-listeners:unavailable', error);
    }
  } else {
    logUnavailable('session:event-listeners');
  }

  installMethod(session, 'requestReferenceSpace', (original) => function (...args) {
    log('requestReferenceSpace:start', { type: args[0] });
    let result;
    try {
      result = Reflect.apply(original, this, args);
    } catch (error) {
      logFailure('requestReferenceSpace:failure', error);
      throw error;
    }
    return result.then(
      (referenceSpace) => {
        log('requestReferenceSpace:success', { type: args[0] });
        return referenceSpace;
      },
      (error) => {
        logFailure('requestReferenceSpace:failure', error);
        throw error;
      }
    );
  }, 'requestReferenceSpace');

  installMethod(session, 'end', (original) => function (...args) {
    log('session.end:called');
    return Reflect.apply(original, this, args);
  }, 'session.end');
}

function installRequestSessionDiagnostics() {
  if (requestSessionInstalled) return;
  const xr = navigator.xr;
  if (!xr) {
    logUnavailable('requestSession');
    return;
  }

  requestSessionInstalled = installMethod(xr, 'requestSession', (original) => function (...args) {
    log('requestSession:start', { mode: args[0], sessionInit: args[1] });
    let result;
    try {
      result = Reflect.apply(original, this, args);
    } catch (error) {
      logFailure('requestSession:failure', error);
      throw error;
    }
    return result.then(
      (session) => {
        log('requestSession:success', { mode: args[0] });
        instrumentSession(session);
        return session;
      },
      (error) => {
        logFailure('requestSession:failure', error);
        throw error;
      }
    );
  }, 'requestSession');
}

function installCanvasContextDiagnostics(canvas, gl) {
  if (!canvas || instrumentedCanvases.has(canvas)) return;
  if (typeof canvas.addEventListener !== 'function') {
    logUnavailable('webgl-context-events');
    return;
  }

  try {
    const logContextEvent = (event) => {
      const details = { eventType: event?.type, ...webGlSnapshot(gl) };
      try {
        if (event && 'defaultPrevented' in event) details.defaultPrevented = event.defaultPrevented;
      } catch (error) {
        details.defaultPrevented = { unavailable: errorDetails(error) };
      }
      log(event?.type ?? 'webgl-context-event', details);
    };
    canvas.addEventListener('webglcontextlost', logContextEvent);
    canvas.addEventListener('webglcontextrestored', logContextEvent);
    instrumentedCanvases.add(canvas);
  } catch (error) {
    logFailure('webgl-context-events:unavailable', error);
  }
}

function installMakeXrCompatibleDiagnostics(gl) {
  if (!gl) {
    logUnavailable('makeXRCompatible');
    return;
  }
  if (instrumentedGlContexts.has(gl)) return;

  let descriptor;
  try {
    descriptor = findPropertyDescriptor(gl, 'makeXRCompatible');
  } catch (error) {
    logFailure('makeXRCompatible:unavailable', error);
    return;
  }
  if (!descriptor || descriptor.configurable === false
    || ('writable' in descriptor && descriptor.writable === false)
    || (!('writable' in descriptor) && typeof descriptor.set !== 'function')) {
    logUnavailable('makeXRCompatible');
    return;
  }

  const installed = installMethod(gl, 'makeXRCompatible', (original) => function (...args) {
    log('makeXRCompatible:start', webGlSnapshot(gl));
    let result;
    try {
      result = Reflect.apply(original, this, args);
    } catch (error) {
      logFailure('makeXRCompatible:failure', error, webGlSnapshot(gl));
      throw error;
    }
    return result.then(
      (value) => {
        log('makeXRCompatible:success', webGlSnapshot(gl));
        return value;
      },
      (error) => {
        logFailure('makeXRCompatible:failure', error, webGlSnapshot(gl));
        throw error;
      }
    );
  }, 'makeXRCompatible');

  if (installed) {
    instrumentedGlContexts.add(gl);
    log('makeXRCompatible:hook-installed');
  }
}

function installRendererSessionDiagnostics(renderer, gl) {
  const xrManager = renderer?.xr;
  if (!xrManager || instrumentedXrManagers.has(xrManager)) return;

  const installed = installMethod(xrManager, 'setSession', (original) => function (...args) {
    log('renderer.xr.setSession:start', webGlSnapshot(gl));
    let result;
    try {
      result = Reflect.apply(original, this, args);
    } catch (error) {
      logFailure('renderer.xr.setSession:failure', error, webGlSnapshot(gl));
      throw error;
    }
    return result.then(
      (value) => {
        log('renderer.xr.setSession:success', webGlSnapshot(gl));
        return value;
      },
      (error) => {
        logFailure('renderer.xr.setSession:failure', error, webGlSnapshot(gl));
        throw error;
      }
    );
  }, 'renderer.xr.setSession');

  if (installed) instrumentedXrManagers.add(xrManager);
}

export function installXrBootstrapDiagnostics() {
  if (new URLSearchParams(window.location.search).get('xrdebug') !== '1') {
    return { attachRenderer() {} };
  }

  installRequestSessionDiagnostics();

  return {
    attachRenderer(renderer) {
      let gl;
      try {
        gl = renderer?.getContext?.();
      } catch (error) {
        logFailure('webgl-context:unavailable', error);
      }

      log('webgl-context:available', webGlSnapshot(gl));
      installCanvasContextDiagnostics(renderer?.domElement, gl);
      installMakeXrCompatibleDiagnostics(gl);
      installRendererSessionDiagnostics(renderer, gl);
    }
  };
}
