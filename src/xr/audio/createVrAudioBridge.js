import { audioManager } from '../../audio/audioManager.js';

const WARNING_PREFIX = '[vr-audio] Optional audio operation failed:';

export function createVrAudioBridge({ manager = audioManager, warn = console.warn } = {}) {
  let disposed = false;
  let glyphState = 'idle';
  let glyphId = null;
  let glyphHandle = null;
  let glyphToken = 0;
  let glyphStartPending = false;
  let finishTimer = null;
  const GLYPH_PROCESS_PATH = '/audio/glif_hover_loop.mp3';

  function reportFailure(operation, error) {
    try {
      warn(`${WARNING_PREFIX} ${operation}`, error);
    } catch (_) {
      // Diagnostics must not turn an optional audio failure into a VR runtime failure.
    }
  }

  function runOptional(operation, request) {
    if (disposed) return;

    try {
      const result = request(manager);
      if (result && typeof result.then === 'function') {
        void Promise.resolve(result).catch((error) => reportFailure(operation, error));
      }
    } catch (error) {
      reportFailure(operation, error);
    }
  }

  function dispose() {
    if (disposed) return;
    stopGlyphLifecycle();
    runOptional('stop VR audio', (audio) => audio.stopVrAudio());
    disposed = true;
  }

  function prepareOneShots(paths) {
    runOptional('prepare VR one-shots', (audio) => audio.prepareVrOneShots(paths));
  }

  function playOneShot(path, bus = 'UI') {
    runOptional(`play ${path} on ${bus}`, (audio) => audio.playVrOneShot(path, bus));
  }

  function clearFinishTimer() {
    if (finishTimer !== null) clearTimeout(finishTimer);
    finishTimer = null;
  }

  function stopHandle(handle = glyphHandle) {
    if (!handle) return;
    if (glyphHandle === handle) glyphHandle = null;
    try { handle.stop?.(); } catch (error) { reportFailure('stop glyph acquisition', error); }
  }

  function stopGlyphLifecycle() {
    glyphToken += 1;
    clearFinishTimer();
    stopHandle();
    glyphId = null;
    glyphState = 'idle';
  }

  function retireGlyphForReplacement() {
    glyphToken += 1;
    clearFinishTimer();
    const handle = glyphHandle;
    glyphHandle = null;
    try { handle?.rampTo?.(0, 0.2); } catch (error) { reportFailure('replace glyph acquisition', error); }
    if (handle) setTimeout(() => stopHandle(handle), 200);
    glyphId = null;
    glyphState = 'idle';
  }

  function fadeAndFinish(duration) {
    clearFinishTimer();
    const handle = glyphHandle;
    glyphState = 'fading';
    try { handle?.rampTo?.(0, duration); } catch (error) { reportFailure('fade glyph acquisition', error); }
    finishTimer = setTimeout(() => {
      finishTimer = null;
      stopHandle(handle);
      if (glyphHandle === null) { glyphId = null; glyphState = 'idle'; }
    }, duration * 1000);
  }

  function startGlyphSource(token) {
    if (glyphStartPending) return;
    runOptional('start glyph acquisition', (audio) => {
      glyphStartPending = true;
      let request;
      try { request = audio.startVrProcessSource(GLYPH_PROCESS_PATH, 'WORLD'); }
      catch (error) { glyphStartPending = false; throw error; }
      return Promise.resolve(request).then((handle) => {
        if (!handle) return;
        if (disposed || token !== glyphToken || !['active', 'recovering'].includes(glyphState)) { stopHandle(handle); return; }
        glyphHandle = handle;
        if (glyphState === 'recovering') handle.rampTo?.(0, 1);
        handle.onEnded?.(() => {
          if (glyphHandle !== handle) return;
          glyphHandle = null;
          if (!disposed && glyphState === 'active' && token === glyphToken) startGlyphSource(token);
        });
      }).finally(() => {
        glyphStartPending = false;
        if (!disposed && glyphState === 'active' && !glyphHandle && token !== glyphToken) startGlyphSource(glyphToken);
      });
    });
  }

  function startGlyphAcquisition(nextGlyphId) {
    if (disposed || !nextGlyphId) return;
    if (glyphId === nextGlyphId && glyphState === 'recovering') {
      clearFinishTimer();
      glyphState = 'active';
      try { glyphHandle?.rampTo?.(1, 0.1); } catch (error) { reportFailure('resume glyph acquisition', error); }
      if (!glyphHandle) startGlyphSource(glyphToken);
      return;
    }
    if (glyphId === nextGlyphId && glyphState === 'active') return;
    if (glyphId && glyphId !== nextGlyphId) retireGlyphForReplacement();
    else stopGlyphLifecycle();
    glyphId = nextGlyphId;
    glyphState = 'active';
    const token = glyphToken;
    startGlyphSource(token);
  }

  function missGlyphAcquisition(targetGlyphId) {
    if (disposed || glyphState !== 'active' || glyphId !== targetGlyphId) return;
    glyphState = 'recovering';
    try { glyphHandle?.rampTo?.(0, 1); } catch (error) { reportFailure('recover glyph acquisition', error); }
    clearFinishTimer();
    const handle = glyphHandle;
    finishTimer = setTimeout(() => {
      finishTimer = null;
      if (glyphState !== 'recovering' || glyphId !== targetGlyphId) return;
      stopHandle(handle);
      glyphId = null;
      glyphState = 'idle';
      glyphToken += 1;
    }, 1000);
  }

  function cancelGlyphAcquisition(targetGlyphId) {
    if (glyphId !== targetGlyphId) return;
    fadeAndFinish(0.2);
    glyphToken += 1;
  }

  function completeGlyphAcquisition(targetGlyphId, completionPath) {
    if (glyphId === targetGlyphId) {
      fadeAndFinish(0.2);
      glyphToken += 1;
    }
    if (completionPath) playOneShot(completionPath, 'WORLD');
  }

  return { runOptional, prepareOneShots, playOneShot, startGlyphAcquisition, missGlyphAcquisition,
    cancelGlyphAcquisition, completeGlyphAcquisition, dispose,
    get glyphAcquisitionState() { return glyphState; } };
}
