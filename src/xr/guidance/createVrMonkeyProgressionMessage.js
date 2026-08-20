const STATE = Object.freeze({ IDLE: 'IDLE', ACTIVE: 'ACTIVE', COMPLETED: 'COMPLETED' });

export function createVrMonkeyProgressionMessage({
  monkeyGuide,
  message,
  secondsPerLine,
  notifyAttention = false,
  beforeShow = () => true,
  onCompleted = () => {}
}) {
  if (!monkeyGuide) throw new TypeError('monkeyGuide is required');
  if (typeof message !== 'string' || !message.trim()) throw new TypeError('message must be a non-empty string');
  if (!Number.isFinite(secondsPerLine) || secondsPerLine <= 0) {
    throw new TypeError('secondsPerLine must be a positive finite number');
  }
  if (typeof beforeShow !== 'function') throw new TypeError('beforeShow must be a function');
  if (typeof onCompleted !== 'function') throw new TypeError('onCompleted must be a function');

  let state = STATE.IDLE;
  let elapsed = 0;
  let displayDuration = 0;
  let completionSent = false;

  function begin() {
    if (state !== STATE.IDLE) return false;
    if (beforeShow() === false) return false;
    if (notifyAttention === true) monkeyGuide.notifyAttention();
    const metrics = monkeyGuide.showMessage(message);
    const lineCount = Math.max(1, metrics.lineCount);
    displayDuration = secondsPerLine * lineCount;
    elapsed = 0;
    state = STATE.ACTIVE;
    return true;
  }

  function update(delta) {
    if (state !== STATE.ACTIVE) return;
    if (Number.isFinite(delta) && delta >= 0) elapsed += delta;
    if (elapsed < displayDuration) return;
    state = STATE.COMPLETED;
    monkeyGuide.showMessage('');
    if (!completionSent) {
      completionSent = true;
      onCompleted();
    }
  }

  function reset() {
    const wasActive = state === STATE.ACTIVE;
    state = STATE.IDLE;
    elapsed = 0;
    displayDuration = 0;
    completionSent = false;
    if (wasActive) monkeyGuide.showMessage('');
  }

  return {
    begin,
    update,
    reset,
    getState: () => state
  };
}
