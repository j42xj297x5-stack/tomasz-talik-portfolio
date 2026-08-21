import { VR_MONKEY_MESSAGE_TIMING } from './vrMonkeyCommunicationCopy.js';
const STATE = Object.freeze({ IDLE: 'IDLE', DISPLAY: 'DISPLAY', GAP: 'GAP', COMPLETED: 'COMPLETED' });

export function createVrMonkeyProgressionMessage({
  monkeyGuide,
  message, blocks = message ? [message] : null,
  secondsPerLine = VR_MONKEY_MESSAGE_TIMING.secondsPerLine,
  gapSeconds = VR_MONKEY_MESSAGE_TIMING.gapSeconds,
  notifyAttention = false,
  beforeShow = () => true,
  onCompleted = () => {}
}) {
  if (!monkeyGuide) throw new TypeError('monkeyGuide is required');
  if (!Array.isArray(blocks) || !blocks.length || blocks.some((block) => typeof block !== 'string' || !block.trim())) throw new TypeError('blocks must contain non-empty strings');
  if (!Number.isFinite(secondsPerLine) || secondsPerLine <= 0) {
    throw new TypeError('secondsPerLine must be a positive finite number');
  }
  if (typeof beforeShow !== 'function') throw new TypeError('beforeShow must be a function');
  if (typeof onCompleted !== 'function') throw new TypeError('onCompleted must be a function');
  if (!Number.isFinite(gapSeconds) || gapSeconds < 0) throw new TypeError('gapSeconds must be a non-negative finite number');

  let state = STATE.IDLE;
  let elapsed = 0;
  let displayDuration = 0;
  let completionSent = false;
  let blockIndex = 0;

  function displayBlock() {
    const metrics = monkeyGuide.showMessage(blocks[blockIndex]);
    displayDuration = secondsPerLine * Math.max(1, metrics?.lineCount ?? 1);
    elapsed = 0; state = STATE.DISPLAY;
  }

  function begin() {
    if (state !== STATE.IDLE) return false;
    if (beforeShow() === false) return false;
    if (notifyAttention === true) monkeyGuide.notifyAttention();
    blockIndex = 0; displayBlock();
    return true;
  }

  function update(delta) {
    if (![STATE.DISPLAY, STATE.GAP].includes(state)) return;
    if (Number.isFinite(delta) && delta >= 0) elapsed += delta;
    const duration = state === STATE.DISPLAY ? displayDuration : gapSeconds;
    if (elapsed < duration) return;
    elapsed -= duration;
    if (state === STATE.DISPLAY) { monkeyGuide.showMessage(''); state = STATE.GAP; return; }
    blockIndex += 1;
    if (blockIndex < blocks.length) { displayBlock(); return; }
    state = STATE.COMPLETED;
    if (!completionSent) {
      completionSent = true;
      onCompleted();
    }
  }

  function reset() {
    const ownedBubble = state === STATE.DISPLAY;
    state = STATE.IDLE;
    elapsed = 0;
    displayDuration = 0;
    completionSent = false;
    blockIndex = 0;
    if (ownedBubble) monkeyGuide.showMessage('');
  }

  return {
    begin,
    update,
    reset,
    getState: () => state
  };
}
