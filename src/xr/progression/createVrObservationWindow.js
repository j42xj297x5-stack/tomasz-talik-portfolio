export function createVrObservationWindow({ durationSeconds, onCompleted = () => {} }) {
  let elapsed = 0;
  let running = false;
  let completed = false;

  function begin() {
    if (running || completed) return false;
    running = true;
    return true;
  }

  function update(deltaSeconds) {
    if (!running || completed) return;
    elapsed += Math.max(0, Number.isFinite(deltaSeconds) ? deltaSeconds : 0);
    if (elapsed < durationSeconds) return;
    running = false;
    completed = true;
    onCompleted();
  }

  function reset() {
    elapsed = 0;
    running = false;
    completed = false;
  }

  return { begin, update, reset,
    get running() { return running; }, get completed() { return completed; } };
}
