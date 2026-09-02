import { audioManager } from '../../audio/audioManager.js';

const WARNING_PREFIX = '[vr-audio] Optional audio operation failed:';
const STARTED = 'started';
const FAILED = 'failed';
const CANCELLED = 'cancelled';
const REQUIRED_LONG_FORM_PATHS = Object.freeze([
  ...Array.from({ length: 5 }, (_, index) => `/audio/ambient_intro_0${index + 1}.mp3`),
  ...Array.from({ length: 4 }, (_, index) => `/audio/ambient_0${index + 1}.mp3`),
  ...Array.from({ length: 13 }, (_, index) => `/audio/noise_quiete_loop_${String(index + 1).padStart(2, '0')}.mp3`)
]);

export function createVrAudioBridge({ manager = audioManager, warn = console.warn, setTimer = setTimeout, clearTimer = clearTimeout } = {}) {
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
  const RUNE_TUNING_PROCESS_PATH = '/audio/astro_piec_work_03.mp3';
  let runeTuningHandle = null, runeTuningToken = 0, runeTuningPending = false;
  const ASTERION_CREATE_PATH = '/audio/astro_piec_work_create_01.mp3';
  let asterionCreateHandle = null, asterionCreateToken = 0, asterionCreatePending = false;
  const ASTERION_BACKGROUND_PATH = '/audio/asterion_sphere_background.mp3';
  const ASTERION_WORK_PATH = '/audio/asterion_sphere_work.mp3';
  let asterionEquipped = false, asterionDriveActive = false;
  let asterionBackgroundHandle = null, asterionBackgroundToken = 0, asterionBackgroundPending = false;
  let asterionWorkHandle = null, asterionWorkToken = 0, asterionWorkPending = false, asterionWorkTimer = null;
  let sectorDriveIdentity = null, sectorDriveHandle = null, sectorDriveToken = 0;
  let sectorDrivePending = false, sectorDriveActive = false, sectorDriveTimer = null, sectorDriveExhausted = false;

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

  async function prepareRuntimeAudio(paths = []) {
    if (disposed) throw new Error('Cannot prepare disposed VR audio.');
    const required = [...REQUIRED_LONG_FORM_PATHS, ...paths, GLYPH_PROCESS_PATH,
      FURNACE_PROCESS_PATH, RUNE_TUNING_PROCESS_PATH, ASTERION_CREATE_PATH,
      ASTERION_BACKGROUND_PATH, ASTERION_WORK_PATH, ...Object.values(ATTRACTOR_PATHS)];
    try {
      await manager.prepareVrAudio(required);
      return true;
    } catch (error) {
      reportFailure('prepare required VR audio', error);
      throw error;
    }
  }

  function dispose() {
    if (disposed) return;
    stopGlyphLifecycle();
    stopAttractorLifecycle();
    stopFurnaceProcess();
    stopRuneTuningProcess();
    stopAsterionCreate();
    resetAsterionSphereAudio();
    resetSectorDriveAudio();
    runOptional('stop VR audio', (audio) => audio.stopVrAudio());
    disposed = true;
  }

  function stopAsterionBackground() {
    asterionBackgroundToken += 1; asterionBackgroundPending = false;
    const handle = asterionBackgroundHandle; asterionBackgroundHandle = null;
    try { handle?.stop?.(); } catch (error) { reportFailure('stop Asterion Sphere background', error); }
  }
  function startAsterionBackground() {
    if (disposed || !asterionEquipped || asterionBackgroundHandle || asterionBackgroundPending) return;
    const token = ++asterionBackgroundToken; asterionBackgroundPending = true;
    runOptional('start Asterion Sphere background', (audio) => Promise.resolve(
      audio.startVrProcessSource(ASTERION_BACKGROUND_PATH, 'DEVICE', { loop: true })
    ).then((handle) => {
      if (token === asterionBackgroundToken) asterionBackgroundPending = false;
      if (!handle) return;
      if (disposed || token !== asterionBackgroundToken || !asterionEquipped) { handle.stop?.(); return; }
      asterionBackgroundHandle = handle;
    }).catch((error) => { if (token === asterionBackgroundToken) asterionBackgroundPending = false; throw error; }));
  }
  function clearAsterionWorkTimer() {
    if (asterionWorkTimer !== null) clearTimer(asterionWorkTimer);
    asterionWorkTimer = null;
  }
  function stopAsterionWork() {
    asterionWorkToken += 1; asterionWorkPending = false; clearAsterionWorkTimer();
    const handle = asterionWorkHandle; asterionWorkHandle = null;
    try { handle?.stop?.(); } catch (error) { reportFailure('stop Asterion Sphere work', error); }
  }
  function startAsterionWork() {
    const wasFading = asterionWorkTimer !== null;
    clearAsterionWorkTimer();
    if (asterionWorkHandle) {
      if (wasFading) {
        try { asterionWorkHandle.rampTo?.(1, 0.1); } catch (error) { reportFailure('resume Asterion Sphere work', error); }
      }
      return;
    }
    if (disposed || !asterionEquipped || !asterionDriveActive || asterionWorkPending) return;
    const token = ++asterionWorkToken; asterionWorkPending = true;
    runOptional('start Asterion Sphere work', (audio) => Promise.resolve(
      audio.startVrProcessSource(ASTERION_WORK_PATH, 'DEVICE', { loop: true })
    ).then((handle) => {
      if (token === asterionWorkToken) asterionWorkPending = false;
      if (!handle) return;
      if (disposed || token !== asterionWorkToken || !asterionEquipped || !asterionDriveActive) { handle.stop?.(); return; }
      asterionWorkHandle = handle;
    }).catch((error) => { if (token === asterionWorkToken) asterionWorkPending = false; throw error; }));
  }
  function fadeAsterionWork() {
    if (!asterionWorkHandle || asterionWorkTimer !== null) return;
    const handle = asterionWorkHandle;
    try { handle.rampTo?.(0, 2); } catch (error) { reportFailure('fade Asterion Sphere work', error); }
    asterionWorkTimer = setTimer(() => {
      asterionWorkTimer = null;
      if (asterionDriveActive || !asterionEquipped || asterionWorkHandle !== handle) return;
      stopAsterionWork();
    }, 2000);
  }
  function setAsterionSphereState({ equipped = false, driveActive = false } = {}) {
    if (disposed) return;
    const nextEquipped = Boolean(equipped), nextDriveActive = nextEquipped && Boolean(driveActive);
    asterionEquipped = nextEquipped; asterionDriveActive = nextDriveActive;
    if (!nextEquipped) { stopAsterionBackground(); stopAsterionWork(); return; }
    startAsterionBackground();
    if (nextDriveActive) startAsterionWork(); else fadeAsterionWork();
  }
  function resetAsterionSphereAudio() {
    asterionEquipped = false; asterionDriveActive = false;
    stopAsterionBackground(); stopAsterionWork();
  }

  function clearSectorDriveTimer() { if (sectorDriveTimer !== null) clearTimer(sectorDriveTimer); sectorDriveTimer = null; }
  function retireSectorDrive() {
    sectorDriveToken += 1; sectorDrivePending = false; clearSectorDriveTimer();
    const handle = sectorDriveHandle; sectorDriveHandle = null;
    try { handle?.stop?.(); } catch (error) { reportFailure('stop sector drive', error); }
    sectorDriveIdentity = null; sectorDriveActive = false; sectorDriveExhausted = false;
  }
  function startSectorDrive(identity, path) {
    if (disposed || !identity || !path) return;
    if (sectorDriveIdentity && sectorDriveIdentity !== identity) retireSectorDrive();
    sectorDriveActive = true;
    if (sectorDriveIdentity === identity) {
      if (sectorDriveTimer !== null && sectorDriveHandle) {
        clearSectorDriveTimer();
        try { sectorDriveHandle.rampTo?.(1, 0.2); } catch (error) { reportFailure('resume sector drive', error); }
      }
      return;
    }
    sectorDriveIdentity = identity; sectorDriveExhausted = false;
    const token = ++sectorDriveToken; sectorDrivePending = true;
    runOptional('start sector drive', (audio) => Promise.resolve(
      audio.startVrProcessSource(path, 'DEVICE', { loop: false })
    ).then((handle) => {
      if (token === sectorDriveToken) sectorDrivePending = false;
      if (!handle) return;
      if (disposed || token !== sectorDriveToken || sectorDriveIdentity !== identity) { handle.stop?.(); return; }
      sectorDriveHandle = handle;
      handle.onEnded?.(() => {
        if (sectorDriveHandle !== handle) return;
        sectorDriveHandle = null; clearSectorDriveTimer(); sectorDriveExhausted = true;
        if (!sectorDriveActive) retireSectorDrive();
      });
      if (!sectorDriveActive) fadeSectorDrive(identity);
    }).catch((error) => { if (token === sectorDriveToken) sectorDrivePending = false; throw error; }));
  }
  function fadeSectorDrive(identity) {
    if (disposed || sectorDriveIdentity !== identity) return;
    sectorDriveActive = false;
    if (sectorDriveExhausted || (!sectorDriveHandle && !sectorDrivePending)) { retireSectorDrive(); return; }
    if (!sectorDriveHandle || sectorDriveTimer !== null) return;
    const handle = sectorDriveHandle, token = sectorDriveToken;
    try { handle.rampTo?.(0, 1); } catch (error) { reportFailure('fade sector drive', error); }
    sectorDriveTimer = setTimer(() => {
      sectorDriveTimer = null;
      if (token === sectorDriveToken && !sectorDriveActive && sectorDriveHandle === handle) retireSectorDrive();
    }, 1000);
  }
  function resetSectorDriveAudio() { retireSectorDrive(); }

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

  function stopRuneTuningProcess() {
    runeTuningToken += 1; runeTuningPending = false;
    const handle = runeTuningHandle; runeTuningHandle = null;
    try { handle?.stop?.(); } catch (error) { reportFailure('stop Rune tuning process', error); }
  }
  function startRuneTuningProcess() {
    if (disposed || runeTuningHandle || runeTuningPending) return false;
    const token = ++runeTuningToken; runeTuningPending = true;
    runOptional('start Rune tuning process', (audio) => Promise.resolve(
      audio.startVrProcessSource(RUNE_TUNING_PROCESS_PATH, 'DEVICE', { loop: false })
    ).then((handle) => {
      runeTuningPending = false;
      if (!handle) return;
      if (disposed || token !== runeTuningToken) { handle.stop?.(); return; }
      runeTuningHandle = handle;
      handle.onEnded?.(() => { if (runeTuningHandle === handle) runeTuningHandle = null; });
    }).catch((error) => { if (token === runeTuningToken) runeTuningPending = false; throw error; }));
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
    attractorId = nextId; attractorClass = soundClass; attractorState = 'starting';
    const token = attractorToken;
    runOptional('start Astro Attractor', (audio) => {
      let request;
      try { request = audio.startVrProcessSource(ATTRACTOR_PATHS[soundClass], 'DEVICE', { loop: true }); }
      catch (error) { if (token === attractorToken) stopAttractorLifecycle(); throw error; }
      return Promise.resolve(request).then((handle) => {
      if (!handle) { if (token === attractorToken) stopAttractorLifecycle(); return; }
      if (disposed || token !== attractorToken || attractorState !== 'starting') { stopAttractorHandle(handle); return; }
      attractorHandle = handle;
      attractorState = 'active';
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

  function startSpatialProcessSource(path, bus, options) {
    if (disposed) return Promise.resolve(null);
    try {
      return Promise.resolve(manager.startVrSpatialProcessSource(path, bus, options))
        .catch((error) => { reportFailure(`start spatial ${path}`, error); return null; });
    } catch (error) {
      reportFailure(`start spatial ${path}`, error);
      return Promise.resolve(null);
    }
  }

  function setSpatialListenerPose(pose) {
    runOptional('update spatial listener pose', (audio) => audio.setVrSpatialListenerPose(pose));
  }

  function startFiniteSource(path, bus, options) {
    if (disposed || options?.signal?.aborted) return Promise.resolve({ status: CANCELLED });
    try {
      return Promise.resolve(manager.startVrFiniteSource(path, bus, options))
        .then((handle) => {
          if (options?.signal?.aborted || disposed) { try { handle?.stop?.(); } catch (_) {} return { status: CANCELLED }; }
          return handle ? { status: STARTED, handle } : { status: FAILED };
        })
        .catch((error) => { reportFailure(`start finite ${path}`, error); return { status: FAILED }; });
    } catch (error) {
      reportFailure(`start finite ${path}`, error);
      return Promise.resolve({ status: FAILED });
    }
  }

  function startOverlappingLoopSource(path, bus, options) {
    if (disposed || options?.signal?.aborted) return Promise.resolve({ status: CANCELLED });
    try {
      return Promise.resolve(manager.startVrOverlappingLoopSource(path, bus, options))
        .then((handle) => {
          if (options?.signal?.aborted || disposed) { try { handle?.stop?.(); } catch (_) {} return { status: CANCELLED }; }
          return handle ? { status: STARTED, handle } : { status: FAILED };
        })
        .catch((error) => { reportFailure(`start overlapping loop ${path}`, error); return { status: FAILED }; });
    } catch (error) {
      reportFailure(`start overlapping loop ${path}`, error);
      return Promise.resolve({ status: FAILED });
    }
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
        if (!handle) { if (token === glyphToken) { glyphId = null; glyphState = 'idle'; } return; }
        if (disposed || token !== glyphToken || glyphState !== 'starting') { stopHandle(handle); return; }
        glyphHandle = handle;
        glyphState = 'active';
        handle.onEnded?.(() => {
          if (glyphHandle !== handle) return;
          glyphHandle = null;
          if (!disposed && glyphState === 'active' && token === glyphToken) {
            glyphState = 'starting';
            startGlyphSource(token);
          }
        });
      }).finally(() => {
        glyphStartPending = false;
        if (!disposed && glyphState === 'starting' && !glyphHandle && token !== glyphToken) startGlyphSource(glyphToken);
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
    glyphState = 'starting';
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

  return { runOptional, prepareRuntimeAudio, prepareOneShots, prepareAttractorLoops, playOneShot, startFiniteSource, startOverlappingLoopSource, startFurnaceProcess, stopFurnaceProcess, startRuneTuningProcess, stopRuneTuningProcess, startAsterionCreate, stopAsterionCreate,
    startGlyphAcquisition, missGlyphAcquisition, setAsterionSphereState, resetAsterionSphereAudio,
    cancelGlyphAcquisition, completeGlyphAcquisition, startSectorDrive, fadeSectorDrive, resetSectorDriveAudio, dispose,
    startAttractor, missAttractor, cancelAttractor, handoffAttractor,
    startSpatialProcessSource, setSpatialListenerPose,
    get glyphAcquisitionState() { return glyphState; }, get attractorState() { return attractorState; } };
}
