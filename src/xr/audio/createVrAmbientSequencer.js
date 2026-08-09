const AMBIENTS = Object.freeze([null, '/audio/ambient_01.mp3', '/audio/ambient_02.mp3',
  '/audio/ambient_03.mp3', '/audio/ambient_04.mp3', '/audio/ambient_05.mp3']);
export const VR_QUIET_QUEUE = Object.freeze(Array.from({ length: 13 }, (_, index) => String(index + 1).padStart(2, '0'))
  .map((id) => `/audio/noise_quiete_loop_${id}.mp3`));
const SUBTHRESHOLD_AMBIENT = '/audio/ambient_loop_01.mp3';

export function createVrAmbientSequencer({ bridge, setTimer = setTimeout, clearTimer = clearTimeout } = {}) {
  let generation = 0, threshold = 0, subthreshold = false, quietCursor = 0, disposed = false;
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
  async function runFull(token) {
    while (token === generation && threshold > 0 && !subthreshold && !disposed) {
      if (!await play(AMBIENTS[threshold], 'AMBIENT', 1, token)) return;
      if (!await sleep(30000, token)) return;
      if (!await play(nextQuiet(), 'SPACE', 6, token, { fadeIn: 10, fadeOut: 10 })) return;
      if (!await sleep(30000, token)) return;
    }
  }
  async function runSubthreshold(token) {
    while (token === generation && subthreshold && !disposed) {
      if (!await play(SUBTHRESHOLD_AMBIENT, 'AMBIENT', 13, token, { fadeOut: 10 })) return;
      if (!await sleep(30000, token)) return;
      if (!await play(nextQuiet(), 'SPACE', 6, token, { fadeIn: 10, fadeOut: 10 })) return;
      if (!await sleep(30000, token)) return;
    }
  }
  function setState({ fullThreshold = threshold, asterionSubthreshold = subthreshold } = {}) {
    if (disposed) return;
    const nextThreshold = Math.min(5, Math.max(0, Math.floor(Number(fullThreshold) || 0)));
    const nextSubthreshold = Boolean(asterionSubthreshold);
    if (nextThreshold === threshold && nextSubthreshold === subthreshold) return;
    cancelWork(); threshold = nextThreshold; subthreshold = nextSubthreshold;
    const token = generation;
    if (subthreshold) void runSubthreshold(token);
    else if (threshold > 0) void runFull(token);
  }
  function reset() { if (disposed) return; cancelWork(); threshold = 0; subthreshold = false; quietCursor = 0; }
  function dispose() { if (disposed) return; cancelWork(); disposed = true; }
  return { setState, reset, dispose, get quietCursor() { return quietCursor; } };
}
