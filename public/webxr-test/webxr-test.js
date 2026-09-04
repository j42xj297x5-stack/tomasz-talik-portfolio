(() => {
  'use strict';

  const PREFIX = '[webxr-native-test]';
  const startButton = document.querySelector('#start');
  const endButton = document.querySelector('#end');
  const logElement = document.querySelector('#log');
  const canvas = document.querySelector('#xr-canvas');

  let sequence = 0;
  let session = null;
  let gl = null;
  let baseLayer = null;
  let referenceSpace = null;

  function safeJson(value) {
    try {
      return JSON.stringify(value);
    } catch (error) {
      return `[unserializable: ${error.name}: ${error.message}]`;
    }
  }

  function log(message, details) {
    sequence += 1;
    const suffix = details === undefined ? '' : ` ${safeJson(details)}`;
    const entry = `${sequence}. ${PREFIX} ${message}${suffix}`;
    logElement.append(`${entry}\n`);
    logElement.scrollTop = logElement.scrollHeight;
    console.log(entry);
  }

  function errorDetails(error) {
    return {
      name: error?.name ?? 'UnknownError',
      message: error?.message ?? String(error),
      ...(error?.stack ? { stack: error.stack } : {}),
    };
  }

  function logException(operation, error, extra = {}) {
    log(`${operation}:failure`, { ...errorDetails(error), ...extra });
  }

  function safeContextState() {
    const state = {};

    try {
      state.isContextLost = gl?.isContextLost();
    } catch (error) {
      state.isContextLostError = errorDetails(error);
    }

    try {
      state.contextAttributes = gl?.getContextAttributes() ?? null;
    } catch (error) {
      state.contextAttributesError = errorDetails(error);
    }

    return state;
  }

  async function endCurrentSession(operation) {
    if (!session) return;

    const sessionToEnd = session;
    log(`${operation}:call`);
    try {
      await sessionToEnd.end();
      log(`${operation}:success`);
    } catch (error) {
      logException(operation, error);
    }
  }

  function attachSessionListeners(activeSession) {
    activeSession.addEventListener(
      'end',
      () => {
        log('session-event', { type: 'end' });
        if (session === activeSession) {
          session = null;
          gl = null;
          baseLayer = null;
          referenceSpace = null;
          startButton.disabled = false;
          endButton.disabled = true;
        }
      },
      { passive: true },
    );

    activeSession.addEventListener(
      'visibilitychange',
      () => log('session-event', {
        type: 'visibilitychange',
        visibilityState: activeSession.visibilityState,
      }),
      { passive: true },
    );

    activeSession.addEventListener(
      'inputsourceschange',
      (event) => log('session-event', {
        type: 'inputsourceschange',
        added: event.added.length,
        removed: event.removed.length,
        total: activeSession.inputSources.length,
      }),
      { passive: true },
    );
  }

  async function resolveReferenceSpace(activeSession) {
    log('requestReferenceSpace:local-floor:start');
    try {
      const space = await activeSession.requestReferenceSpace('local-floor');
      log('requestReferenceSpace:success', { effectiveType: 'local-floor' });
      return space;
    } catch (error) {
      logException('requestReferenceSpace:local-floor', error);
    }

    log('requestReferenceSpace:local:start');
    try {
      const space = await activeSession.requestReferenceSpace('local');
      log('requestReferenceSpace:success', { effectiveType: 'local' });
      return space;
    } catch (error) {
      logException('requestReferenceSpace:local', error);
      return null;
    }
  }

  function attachContextListeners() {
    for (const type of ['webglcontextlost', 'webglcontextrestored']) {
      canvas.addEventListener(
        type,
        (event) => log('webgl-context-event', {
          type: event.type,
          ...safeContextState(),
          defaultPrevented: event.defaultPrevented,
        }),
        { passive: true, once: true },
      );
    }
  }

  function logRendererInformation() {
    try {
      log('webgl-renderer', {
        vendor: gl.getParameter(gl.VENDOR),
        renderer: gl.getParameter(gl.RENDERER),
      });
    } catch (error) {
      logException('webgl-renderer', error);
    }

    try {
      const extension = gl.getExtension('WEBGL_debug_renderer_info');
      if (!extension) {
        log('WEBGL_debug_renderer_info:unavailable');
        return;
      }
      log('WEBGL_debug_renderer_info:available', {
        unmaskedVendor: gl.getParameter(extension.UNMASKED_VENDOR_WEBGL),
        unmaskedRenderer: gl.getParameter(extension.UNMASKED_RENDERER_WEBGL),
      });
    } catch (error) {
      logException('WEBGL_debug_renderer_info', error);
    }
  }

  async function startTest() {
    if (session) {
      log('start:ignored-session-already-active');
      return;
    }

    startButton.disabled = true;
    log('start');

    if (!navigator.xr) {
      log('navigator.xr:unavailable');
      startButton.disabled = false;
      return;
    }
    log('navigator.xr:available');

    let supported;
    try {
      supported = await navigator.xr.isSessionSupported('immersive-vr');
      log('isSessionSupported:result', { mode: 'immersive-vr', supported });
    } catch (error) {
      logException('isSessionSupported', error);
      startButton.disabled = false;
      return;
    }

    if (!supported) {
      startButton.disabled = false;
      return;
    }

    log('requestSession:start');
    try {
      session = await navigator.xr.requestSession('immersive-vr', {
        optionalFeatures: ['local-floor'],
      });
      log('requestSession:success');
    } catch (error) {
      logException('requestSession', error);
      session = null;
      startButton.disabled = false;
      return;
    }

    const activeSession = session;
    attachSessionListeners(activeSession);
    endButton.disabled = false;

    referenceSpace = await resolveReferenceSpace(activeSession);
    if (!referenceSpace) {
      await endCurrentSession('session.end-after-reference-space-failure');
      return;
    }

    const attributes = {
      alpha: true,
      depth: true,
      stencil: false,
      antialias: true,
      premultipliedAlpha: true,
      preserveDrawingBuffer: false,
      powerPreference: 'default',
      failIfMajorPerformanceCaveat: false,
      xrCompatible: true,
    };

    log('webgl2-context:create:start', attributes);
    try {
      gl = canvas.getContext('webgl2', attributes);
    } catch (error) {
      logException('webgl2-context:create', error);
      await endCurrentSession('session.end-after-webgl2-exception');
      return;
    }

    if (!gl) {
      log('webgl2-context:create:failure', { reason: 'getContext returned null' });
      await endCurrentSession('session.end-after-webgl2-null');
      return;
    }

    log('webgl2-context:create:success');
    const initialState = safeContextState();
    log('webgl2-context:actual', {
      ...initialState,
      xrCompatible: initialState.contextAttributes?.xrCompatible ?? null,
    });
    logRendererInformation();
    attachContextListeners();

    if (initialState.contextAttributes?.xrCompatible === true) {
      log('makeXRCompatible:skipped-already-compatible');
    } else {
      log('makeXRCompatible:start');
      try {
        await gl.makeXRCompatible();
        log('makeXRCompatible:success', safeContextState());
      } catch (error) {
        logException('makeXRCompatible', error, safeContextState());
        await endCurrentSession('session.end-after-makeXRCompatible-failure');
        return;
      }
    }

    log('XRWebGLLayer:create:start');
    try {
      baseLayer = new XRWebGLLayer(activeSession, gl);
      log('XRWebGLLayer:success');
    } catch (error) {
      logException('XRWebGLLayer', error);
      await endCurrentSession('session.end-after-XRWebGLLayer-failure');
      return;
    }

    log('updateRenderState:start');
    try {
      await activeSession.updateRenderState({ baseLayer });
      log('updateRenderState:success');
    } catch (error) {
      logException('updateRenderState', error);
      await endCurrentSession('session.end-after-updateRenderState-failure');
      return;
    }

    try {
      activeSession.requestAnimationFrame(() => {
        try {
          gl.bindFramebuffer(gl.FRAMEBUFFER, baseLayer.framebuffer);
          gl.viewport(0, 0, baseLayer.framebufferWidth, baseLayer.framebufferHeight);
          gl.clearColor(0.12, 0.05, 0.45, 1.0);
          gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
          log('xr-frame:success');
        } catch (error) {
          logException('xr-frame', error);
        }
      });
      log('requestAnimationFrame:success');
    } catch (error) {
      logException('requestAnimationFrame', error);
      await endCurrentSession('session.end-after-requestAnimationFrame-failure');
    }
  }

  startButton.addEventListener('click', () => {
    startTest().catch((error) => {
      logException('start-flow', error);
      if (!session) startButton.disabled = false;
    });
  });

  endButton.addEventListener('click', () => {
    endCurrentSession('end-button').catch((error) => logException('end-button', error));
  });

  log('page:ready');
})();
