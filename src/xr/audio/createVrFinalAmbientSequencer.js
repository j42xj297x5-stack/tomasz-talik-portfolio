const FINAL_AMBIENT_PATHS = Object.freeze({
  waiting: '/audio/ambient_intro_06.mp3',
  farewell: '/audio/ambient_intro_07.mp3',
  final: '/audio/ambient_intro_08.mp3'
});
const OVERLAP_SECONDS = 5;
const FINAL_LOOP_AT_SECONDS = 20;

export function createVrFinalAmbientSequencer({ bridge, onWaitingStarted = () => {},
  setTimer = setTimeout, clearTimer = clearTimeout } = {}) {
  let generation = 0, disposed = false, waiting = null, farewell = null, finalLoop = null;
  let waitingPending = false, farewellPending = false, finalPending = false, finalRequested = false, elapsed = null;
  const controllers = new Set(), retiring = new Set();

  function stopHandle(handle) { try { handle?.stop?.(); } catch (_) { /* optional audio remains fail-soft */ } }
  function retire(handle, seconds) {
    if (!handle) return;
    const lifecycle = { handle, timer: null };
    retiring.add(lifecycle);
    try { handle.rampTo?.(0, seconds); } catch (_) { /* cleanup still runs */ }
    lifecycle.timer = setTimer(() => { retiring.delete(lifecycle); stopHandle(handle); }, seconds * 1000);
  }
  function request(path, kind, options, accept, settle) {
    const token = generation;
    const controller = typeof AbortController === 'undefined' ? null : new AbortController();
    if (controller) controllers.add(controller);
    const starter = kind === 'loop' ? bridge?.startOverlappingLoopSource : bridge?.startFiniteSource;
    void Promise.resolve(starter?.call(bridge, path, 'AMBIENT', { ...options, signal: controller?.signal }))
      .then((outcome) => {
        controllers.delete(controller);
        if (disposed || token !== generation || outcome?.status === 'cancelled') { stopHandle(outcome?.handle); return; }
        if (outcome?.status === 'started') accept(outcome.handle);
      }).catch(() => { controllers.delete(controller); })
      .finally(() => { if (!disposed && token === generation) settle(); });
  }
  function beginWaitingForFarewell() {
    if (disposed || waiting || waitingPending || elapsed !== null || finalLoop) return false;
    waitingPending = true;
    request(FINAL_AMBIENT_PATHS.waiting, 'loop', { overlapSeconds: OVERLAP_SECONDS }, (handle) => {
      if (elapsed !== null || finalRequested) { stopHandle(handle); return; }
      waiting = handle; onWaitingStarted();
    }, () => { waitingPending = false; });
    return true;
  }
  function beginFarewell() {
    if (disposed || elapsed !== null || finalLoop) return false;
    elapsed = 0;
    if (!farewellPending && !farewell) {
      farewellPending = true;
      request(FINAL_AMBIENT_PATHS.farewell, 'finite', { repetitions: 1, fadeOut: 10 }, (handle) => {
        farewell = handle;
        const outgoing = waiting; waiting = null; retire(outgoing, OVERLAP_SECONDS);
        void handle.finished?.then(() => { if (farewell === handle) farewell = null; });
      }, () => { farewellPending = false; });
    }
    return true;
  }
  function synchronizeAfterFarewell(elapsedSeconds = 15) {
    if (disposed || elapsed !== null || finalLoop || finalRequested) return false;
    elapsed = Math.max(0, Number(elapsedSeconds) || 0);
    return true;
  }
  function ensureFinalLoop() {
    if (disposed || finalLoop || finalRequested) return false;
    finalRequested = true; finalPending = true;
    request(FINAL_AMBIENT_PATHS.final, 'loop', { overlapSeconds: OVERLAP_SECONDS }, (handle) => {
      finalLoop = handle;
    }, () => { finalPending = false; });
    return true;
  }
  function update(delta) {
    if (elapsed === null || finalLoop || finalPending || finalRequested) return;
    elapsed += Math.max(0, Number.isFinite(delta) ? delta : 0);
    if (elapsed >= FINAL_LOOP_AT_SECONDS) ensureFinalLoop();
  }
  function reset() {
    generation += 1; controllers.forEach((controller) => controller.abort()); controllers.clear();
    waitingPending = false; farewellPending = false; finalPending = false; finalRequested = false; elapsed = null;
    stopHandle(waiting); stopHandle(farewell); stopHandle(finalLoop);
    waiting = null; farewell = null; finalLoop = null;
    retiring.forEach((lifecycle) => { clearTimer(lifecycle.timer); stopHandle(lifecycle.handle); }); retiring.clear();
  }
  function dispose() { if (disposed) return; reset(); disposed = true; }
  return { beginWaitingForFarewell, beginFarewell, synchronizeAfterFarewell, ensureFinalLoop,
    update, reset, dispose };
}
