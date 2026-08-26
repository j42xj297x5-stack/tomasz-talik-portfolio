const AMBIENTS = Object.freeze([null, '/audio/ambient_01.mp3', '/audio/ambient_02.mp3',
  '/audio/ambient_03.mp3', '/audio/ambient_04.mp3', '/audio/ambient_05.mp3']);
export const VR_QUIET_QUEUE = Object.freeze(Array.from({ length: 13 }, (_, index) => String(index + 1).padStart(2, '0'))
  .map((id) => `/audio/noise_quiete_loop_${id}.mp3`));
export function createVrAmbientSequencer({ bridge, setTimer = setTimeout, clearTimer = clearTimeout } = {}) {
  let generation = 0, mainAmbient = 0, quietCursor = 0, disposed = false, enabled = false;
  let activeHandle = null, timer = null, timerResolve = null;
  let pendingController = null;

  function cancelWork() {
    generation += 1;
    try { activeHandle?.stop?.(); } catch (_) { /* optional audio must remain fail-soft */ }
    activeHandle = null;
    pendingController?.abort(); pendingController = null;
    if (timer !== null) clearTimer(timer);
    timer = null;
    timerResolve?.(false); timerResolve = null;
  }
  function sleep(milliseconds, token) {
    return new Promise((resolve) => {
      if (token !== generation || disposed) { resolve(false); return; }
      timerResolve = resolve;
      timer = setTimer(() => { timer = null; timerResolve = null; resolve(token === generation && !disposed); }, milliseconds);
    });
  }
  async function play(path, bus, repetitions, token, fades = {}) {
    let handle = null;
    const controller = typeof AbortController === 'undefined' ? null : new AbortController();
    pendingController = controller;
    try { handle = await bridge?.startFiniteSource?.(path, bus, { repetitions, ...fades, signal: controller?.signal }); } catch (_) { return token === generation; }
    if (pendingController === controller) pendingController = null;
    if (token !== generation || disposed) { try { handle?.stop?.(); } catch (_) {} return false; }
    if (!handle) return true;
    activeHandle = handle;
    try { await handle.finished; } catch (_) { /* failed playback advances rather than retrying tightly */ }
    if (activeHandle === handle) activeHandle = null;
    return token === generation && !disposed;
  }
  function nextQuiet() { const path = VR_QUIET_QUEUE[quietCursor]; quietCursor = (quietCursor + 1) % VR_QUIET_QUEUE.length; return path; }
  async function runMain(token) {
    while (token === generation && mainAmbient > 0 && !disposed) {
      if (!await play(AMBIENTS[mainAmbient], 'AMBIENT', 1, token)) return;
      if (!await sleep(10000, token)) return;
      if (!await play(nextQuiet(), 'SPACE', 6, token, { fadeIn: 10, fadeOut: 10 })) return;
      if (!await sleep(10000, token)) return;
    }
  }
  function selectMainAmbient(index) {
    if (disposed) return;
    const nextMainAmbient = Math.min(4, Math.max(1, Math.floor(Number(index) || 0)));
    if (nextMainAmbient === mainAmbient) return;
    cancelWork(); mainAmbient = nextMainAmbient;
    if (!enabled) return;
    const token = generation;
    void runMain(token);
  }
  function enable() {
    if (disposed || enabled) return;
    enabled = true; cancelWork();
    const token = generation;
    if (mainAmbient > 0) void runMain(token);
  }
  function reset() { if (disposed) return; cancelWork(); mainAmbient = 0; quietCursor = 0; enabled = false; }
  function dispose() { if (disposed) return; cancelWork(); disposed = true; }
  return { selectMainAmbient, enable, reset, dispose, get enabled() { return enabled; }, get quietCursor() { return quietCursor; } };
}
