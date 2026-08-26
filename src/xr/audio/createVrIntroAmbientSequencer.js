export const VR_INTRO_AMBIENT_CUES = Object.freeze({
  '01': '/audio/ambient_intro_01.mp3', '02': '/audio/ambient_intro_02.mp3',
  '03': '/audio/ambient_intro_03.mp3', '04': '/audio/ambient_intro_04.mp3',
  '05': '/audio/ambient_intro_05.mp3'
});
export const INTRO_OVERLAP_SECONDS = 5;

export function createVrIntroAmbientSequencer({ bridge, setTimer = setTimeout, clearTimer = clearTimeout } = {}) {
  let activeCue = null, activeLifecycle = null, generation = 0, disposed = false, state = 'idle';
  let pendingController = null;
  const retiring = new Set();

  function stopLifecycle(lifecycle) {
    if (!lifecycle) return;
    if (lifecycle.timer !== null) clearTimer(lifecycle.timer);
    lifecycle.timer = null; retiring.delete(lifecycle);
    try { lifecycle.handle?.stop?.(); } catch (_) { /* optional audio remains fail-soft */ }
    lifecycle.handle = null;
  }
  function retire(lifecycle, fadeSeconds) {
    if (!lifecycle) return;
    if (fadeSeconds <= 0 || !lifecycle.handle) { stopLifecycle(lifecycle); return; }
    retiring.add(lifecycle);
    try { lifecycle.handle.rampTo?.(0, fadeSeconds); } catch (_) { /* cleanup still runs */ }
    lifecycle.timer = setTimer(() => stopLifecycle(lifecycle), fadeSeconds * 1000);
  }
  function setCue(cue) {
    if (disposed || !VR_INTRO_AMBIENT_CUES[cue]
      || (cue === activeCue && !['failed', 'idle'].includes(state))) return false;
    pendingController?.abort();
    const controller = typeof AbortController === 'undefined' ? null : new AbortController();
    pendingController = controller;
    const lifecycle = { cue, handle: null, timer: null };
    const token = ++generation;
    state = 'starting';
    void Promise.resolve(bridge?.startOverlappingLoopSource?.(
      VR_INTRO_AMBIENT_CUES[cue], 'AMBIENT', { overlapSeconds: INTRO_OVERLAP_SECONDS, signal: controller?.signal }
    )).then((outcome) => {
      if (pendingController === controller) pendingController = null;
      if (disposed || token !== generation || outcome.status === 'cancelled') {
        try { outcome.handle?.stop?.(); } catch (_) {} return;
      }
      if (outcome.status !== 'started') { state = 'failed'; return; }
      const previous = activeLifecycle;
      lifecycle.handle = outcome.handle;
      activeCue = cue; activeLifecycle = lifecycle; state = 'playing';
      retire(previous, INTRO_OVERLAP_SECONDS);
    }).catch(() => { if (token === generation) state = 'failed'; });
    return true;
  }
  function stop({ fadeSeconds = INTRO_OVERLAP_SECONDS } = {}) {
    if (disposed && !activeLifecycle) return;
    generation += 1; pendingController?.abort(); pendingController = null; activeCue = null; state = 'idle';
    const lifecycle = activeLifecycle; activeLifecycle = null;
    retire(lifecycle, Math.max(0, Number(fadeSeconds) || 0));
  }
  function reset() {
    generation += 1; pendingController?.abort(); pendingController = null; activeCue = null; state = 'idle';
    stopLifecycle(activeLifecycle); activeLifecycle = null;
    [...retiring].forEach(stopLifecycle);
  }
  function dispose() { if (disposed) return; reset(); disposed = true; }
  return { setCue, stop, reset, dispose, get activeCue() { return activeCue; }, get state() { return state; } };
}
