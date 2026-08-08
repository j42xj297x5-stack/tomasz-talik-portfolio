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
  const ATTRACTOR_PATHS = Object.freeze({
    smallGlyph: '/audio/noise_laud_loop_01.mp3',
    shell: '/audio/noise_laud_loop_02.mp3',
    largeGlyph: '/audio/noise_laud_loop_03.mp3',
    runeStone1: '/audio/noise_laud_loop_04.mp3',
    runeStone2: '/audio/noise_laud_loop_05.mp3',
    runeStone3: '/audio/noise_laud_loop_06.mp3',
    runeStone4: '/audio/noise_laud_loop_07.mp3',
    runeStone5: '/audio/noise_laud_loop_08.mp3'
  });
  let attractorState = 'idle', attractorId = null, attractorClass = null, attractorHandle = null;
  let attractorToken = 0, attractorTimer = null;
  const FURNACE_PROCESS_PATH = '/audio/astro_piec_work_01.mp3';
  let furnaceHandle = null, furnaceToken = 0, furnacePending = false;
  const ASTERION_CREATE_PATH = '/audio/astro_piec_work_create_01.mp3';
  let asterionCreateHandle = null, asterionCreateToken = 0, asterionCreatePending = false;

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
    stopAttractorLifecycle();
    stopFurnaceProcess();
    stopAsterionCreate();
    runOptional('stop VR audio', (audio) => audio.stopVrAudio());
    disposed = true;
  }

  function stopFurnaceProcess() {
    furnaceToken += 1;
    furnacePending = false;
    const handle = furnaceHandle; furnaceHandle = null;
    try { handle?.stop?.(); } catch (error) { reportFailure('stop Astro Furnace process', error); }
  }

  function startFurnaceProcess() {
    if (disposed || furnaceHandle || furnacePending) return false;
    const token = ++furnaceToken;
    furnacePending = true;
    runOptional('start Astro Furnace process', (audio) => Promise.resolve(
      audio.startVrProcessSource(FURNACE_PROCESS_PATH, 'DEVICE', { loop: false })
    ).then((handle) => {
      furnacePending = false;
      if (!handle) return;
      if (disposed || token !== furnaceToken) { handle.stop?.(); return; }
      furnaceHandle = handle;
      handle.onEnded?.(() => { if (furnaceHandle === handle) furnaceHandle = null; });
    }).catch((error) => { if (token === furnaceToken) furnacePending = false; throw error; }));
    return true;
  }

  function stopAsterionCreate() {
    asterionCreateToken += 1; asterionCreatePending = false;
    const handle = asterionCreateHandle; asterionCreateHandle = null;
    try { handle?.stop?.(); } catch (error) { reportFailure('stop Asterion creation', error); }
  }
  function startAsterionCreate() {
    if (disposed || asterionCreateHandle || asterionCreatePending) return false;
    const token = ++asterionCreateToken; asterionCreatePending = true;
    runOptional('start Asterion creation', (audio) => Promise.resolve(
      audio.startVrProcessSource(ASTERION_CREATE_PATH, 'DEVICE', { loop: false })
    ).then((handle) => {
      asterionCreatePending = false;
      if (!handle) return;
      if (disposed || token !== asterionCreateToken) { handle.stop?.(); return; }
      asterionCreateHandle = handle;
      handle.onEnded?.(() => { if (asterionCreateHandle === handle) asterionCreateHandle = null; });
    }).catch((error) => { if (token === asterionCreateToken) asterionCreatePending = false; throw error; }));
    return true;
  }

  function prepareOneShots(paths) {
    runOptional('prepare VR one-shots', (audio) => audio.prepareVrOneShots(paths));
  }

  function prepareAttractorLoops() { prepareOneShots(Object.values(ATTRACTOR_PATHS)); }

  function clearAttractorTimer() { if (attractorTimer !== null) clearTimeout(attractorTimer); attractorTimer = null; }
  function stopAttractorHandle(handle = attractorHandle) {
    if (!handle) return;
    if (attractorHandle === handle) attractorHandle = null;
    try { handle.stop?.(); } catch (error) { reportFailure('stop Astro Attractor', error); }
  }
  function stopAttractorLifecycle() {
    attractorToken += 1; clearAttractorTimer(); stopAttractorHandle();
    attractorId = null; attractorClass = null; attractorState = 'idle';
  }
  function replaceAttractorLifecycle() {
    attractorToken += 1; clearAttractorTimer();
    const handle = attractorHandle; attractorHandle = null;
    try { handle?.rampTo?.(0, 0.2); } catch (error) { reportFailure('replace Astro Attractor', error); }
    if (handle) setTimeout(() => stopAttractorHandle(handle), 200);
    attractorId = null; attractorClass = null; attractorState = 'idle';
  }
  function finishAttractor(duration, state, operation) {
    clearAttractorTimer(); attractorToken += 1; attractorState = state;
    const handle = attractorHandle;
    try { handle?.rampTo?.(0, duration); } catch (error) { reportFailure(operation, error); }
    attractorTimer = setTimeout(() => {
      attractorTimer = null; stopAttractorHandle(handle);
      if (!attractorHandle) { attractorId = null; attractorClass = null; attractorState = 'idle'; }
    }, duration * 1000);
  }
  function startAttractor(nextId, soundClass) {
    if (disposed || !nextId || !ATTRACTOR_PATHS[soundClass]) return;
    if (attractorId === nextId && attractorState === 'active') return;
    if (attractorId === nextId && attractorState === 'recovering') {
      clearAttractorTimer(); attractorState = 'active';
      try { attractorHandle?.rampTo?.(1, 0.1); } catch (error) { reportFailure('resume Astro Attractor', error); }
      return;
    }
    if (attractorId) replaceAttractorLifecycle();
    attractorId = nextId; attractorClass = soundClass; attractorState = 'active';
    const token = attractorToken;
    runOptional('start Astro Attractor', (audio) => {
      let request;
      try { request = audio.startVrProcessSource(ATTRACTOR_PATHS[soundClass], 'DEVICE', { loop: true }); }
      catch (error) { if (token === attractorToken) stopAttractorLifecycle(); throw error; }
      return Promise.resolve(request).then((handle) => {
      if (!handle) return;
      if (disposed || token !== attractorToken || !['active', 'recovering'].includes(attractorState)) { stopAttractorHandle(handle); return; }
      attractorHandle = handle;
      if (attractorState === 'recovering') handle.rampTo?.(0, 1);
      }).catch((error) => { if (token === attractorToken) stopAttractorLifecycle(); throw error; });
    });
  }
  function missAttractor(targetId) {
    if (disposed || attractorState !== 'active' || attractorId !== targetId) return;
    attractorState = 'recovering';
    try { attractorHandle?.rampTo?.(0, 1); } catch (error) { reportFailure('recover Astro Attractor', error); }
    clearAttractorTimer(); const token = attractorToken, handle = attractorHandle;
    attractorTimer = setTimeout(() => {
      attractorTimer = null;
      if (token !== attractorToken || attractorState !== 'recovering' || attractorId !== targetId) return;
      stopAttractorHandle(handle); attractorId = null; attractorClass = null; attractorState = 'idle'; attractorToken += 1;
    }, 1000);
  }
  function cancelAttractor(targetId) { if (attractorId === targetId) finishAttractor(0.2, 'cancelFade', 'cancel Astro Attractor'); }
  function handoffAttractor(targetId) { if (attractorId === targetId) finishAttractor(0.5, 'handoffFade', 'handoff Astro Attractor'); }

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

  return { runOptional, prepareOneShots, prepareAttractorLoops, playOneShot, startFurnaceProcess, stopFurnaceProcess, startAsterionCreate, stopAsterionCreate,
    startGlyphAcquisition, missGlyphAcquisition,
    cancelGlyphAcquisition, completeGlyphAcquisition, dispose,
    startAttractor, missAttractor, cancelAttractor, handoffAttractor,
    get glyphAcquisitionState() { return glyphState; }, get attractorState() { return attractorState; } };
}
