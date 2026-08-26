export const VR_MAIN_AMBIENT_PROGRAMS = Object.freeze({
  ambient01: Object.freeze({ id: 'ambient01', path: '/audio/ambient_01.mp3', tail: false }),
  ambient02: Object.freeze({ id: 'ambient02', path: '/audio/ambient_02.mp3', tail: false }),
  ambient03: Object.freeze({ id: 'ambient03', path: '/audio/ambient_03.mp3', tail: false }),
  ambient04: Object.freeze({ id: 'ambient04', path: '/audio/ambient_04.mp3', tail: false }),
  ambient05: Object.freeze({ id: 'ambient05', path: '/audio/ambient_05.mp3', tail: true })
});
const POST_MAIN_TAIL = Object.freeze([
  '/audio/ambient_loop_01.mp3', '/audio/ambient_loop_02.mp3',
  '/audio/ambient_loop_03.mp3', '/audio/ambient_loop_04.mp3'
]);
export const VR_QUIET_QUEUE = Object.freeze(Array.from({ length: 13 }, (_, index) => String(index + 1).padStart(2, '0'))
  .map((id) => `/audio/noise_quiete_loop_${id}.mp3`));

export function createVrAmbientSequencer({ bridge, setTimer = setTimeout, clearTimer = clearTimeout } = {}) {
  let generation = 0, requestGeneration = 0, quietCursor = 0, disposed = false;
  let committedProgram = null, activeHandle = null, timer = null, timerResolve = null;
  let pendingController = null, candidateController = null, state = 'idle';

  function cancelPlayback() {
    generation += 1;
    try { activeHandle?.stop?.(); } catch (_) { /* optional audio remains fail-soft */ }
    activeHandle = null;
    pendingController?.abort(); pendingController = null;
    if (timer !== null) clearTimer(timer);
    timer = null;
    timerResolve?.(false); timerResolve = null;
  }
  function sleep(milliseconds, token) {
    state = 'silence';
    return new Promise((resolve) => {
      if (token !== generation || disposed) { resolve(false); return; }
      timerResolve = resolve;
      timer = setTimer(() => { timer = null; timerResolve = null; resolve(token === generation && !disposed); }, milliseconds);
    });
  }
  async function start(path, bus, repetitions, controller, fades = {}) {
    return bridge.startFiniteSource(path, bus, { repetitions, ...fades, signal: controller?.signal });
  }
  async function playSegment(path, bus, repetitions, token, fades = {}) {
    const controller = typeof AbortController === 'undefined' ? null : new AbortController();
    pendingController = controller;
    state = 'starting';
    const outcome = await start(path, bus, repetitions, controller, fades);
    if (pendingController === controller) pendingController = null;
    if (token !== generation || disposed || outcome.status === 'cancelled') {
      try { outcome.handle?.stop?.(); } catch (_) {}
      return 'cancelled';
    }
    if (outcome.status !== 'started') { state = 'failed'; return 'failed'; }
    const handle = outcome.handle;
    activeHandle = handle; state = 'playing';
    try { await handle.finished; } catch (_) { state = 'failed'; return 'failed'; }
    if (activeHandle === handle) activeHandle = null;
    if (token !== generation || disposed) return 'cancelled';
    return 'ended';
  }
  async function playQuiet(token) {
    const path = VR_QUIET_QUEUE[quietCursor];
    const controller = typeof AbortController === 'undefined' ? null : new AbortController();
    pendingController = controller; state = 'starting';
    const outcome = await start(path, 'SPACE', 6, controller, { fadeIn: 10, fadeOut: 10 });
    if (pendingController === controller) pendingController = null;
    if (token !== generation || disposed || outcome.status === 'cancelled') {
      try { outcome.handle?.stop?.(); } catch (_) {}
      return 'cancelled';
    }
    if (outcome.status !== 'started') { state = 'failed'; return 'failed'; }
    quietCursor = (quietCursor + 1) % VR_QUIET_QUEUE.length;
    const handle = outcome.handle; activeHandle = handle; state = 'playing';
    try { await handle.finished; } catch (_) { state = 'failed'; return 'failed'; }
    if (activeHandle === handle) activeHandle = null;
    return token === generation && !disposed ? 'ended' : 'cancelled';
  }
  async function runMain(token, firstHandle) {
    let handle = firstHandle;
    while (token === generation && !disposed) {
      if (handle) {
        activeHandle = handle; state = 'playing';
        try { await handle.finished; } catch (_) { state = 'failed'; return; }
        if (activeHandle === handle) activeHandle = null;
        if (token !== generation || disposed) return;
        handle = null;
      } else if (await playSegment(committedProgram.path, 'AMBIENT', 1, token) !== 'ended') return;
      if (!await sleep(10000, token)) return;
      if (await playQuiet(token) !== 'ended') return;
      if (!await sleep(10000, token)) return;
    }
  }
  async function runPostMainTail(token, firstHandle) {
    activeHandle = firstHandle; state = 'playing';
    try { await firstHandle.finished; } catch (_) { state = 'failed'; return; }
    if (activeHandle === firstHandle) activeHandle = null;
    for (const tailAmbient of POST_MAIN_TAIL) {
      if (!await sleep(10000, token)) return;
      if (await playQuiet(token) !== 'ended') return;
      if (!await sleep(10000, token)) return;
      if (await playSegment(tailAmbient, 'AMBIENT', 6, token) !== 'ended') return;
    }
    if (token === generation) state = 'idle';
  }
  function setProgram(program) {
    if (disposed || !program?.id || !program?.path) return false;
    if (committedProgram?.id === program.id && !['failed', 'idle'].includes(state)) return false;
    const requestToken = ++requestGeneration;
    candidateController?.abort();
    const controller = typeof AbortController === 'undefined' ? null : new AbortController();
    candidateController = controller;
    void start(program.path, 'AMBIENT', 1, controller).then((outcome) => {
      if (candidateController === controller) candidateController = null;
      if (disposed || requestToken !== requestGeneration || outcome.status === 'cancelled') {
        try { outcome.handle?.stop?.(); } catch (_) {}
        return;
      }
      if (outcome.status !== 'started') { if (!committedProgram || committedProgram.id === program.id) state = 'failed'; return; }
      cancelPlayback();
      committedProgram = program;
      const token = generation;
      if (program.tail) void runPostMainTail(token, outcome.handle);
      else void runMain(token, outcome.handle);
    });
    return true;
  }
  function reset() {
    if (disposed) return;
    requestGeneration += 1; candidateController?.abort(); candidateController = null;
    cancelPlayback(); committedProgram = null; quietCursor = 0; state = 'idle';
  }
  function dispose() { if (disposed) return; reset(); disposed = true; }
  return { setProgram, reset, dispose, get state() { return state; },
    get committedProgram() { return committedProgram; }, get quietCursor() { return quietCursor; } };
}
