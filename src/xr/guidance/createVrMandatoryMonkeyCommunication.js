import { createVrMonkeyProgressionMessage } from './createVrMonkeyProgressionMessage.js';
import { VR_MONKEY_DIALOGUE_PRIORITY } from './createVrMonkeyGuide.js';

const PHASE = Object.freeze({
  IDLE: 'IDLE', WAITING: 'WAITING', ATTENTION: 'ATTENTION', AUTO_DELAY: 'AUTO_DELAY',
  PLAYBACK: 'PLAYBACK', COMPLETE: 'COMPLETE'
});

export function createVrMandatoryMonkeyCommunication({ monkeyGuide, blocks, secondsPerLine,
  onTriggered = () => {}, onCompleted = () => {},
  priority = VR_MONKEY_DIALOGUE_PRIORITY.MANDATORY, requiresAttention = true,
  autoPlaybackDelaySeconds = 0, onAutoPlaybackCue = () => {} }) {
  const owner = Symbol('VrMonkeyCommunication');
  let phase = PHASE.IDLE;
  let autoPlaybackDelayRemaining = 0;
  const playback = createVrMonkeyProgressionMessage({ monkeyGuide, owner, blocks, secondsPerLine,
    onCompleted() {
      phase = PHASE.COMPLETE;
      monkeyGuide.releaseDialogue(owner);
      onCompleted();
    }
  });
  const override = { options: [], onMonkeyPress() {
    if (phase !== PHASE.ATTENTION) return true;
    phase = PHASE.PLAYBACK;
    monkeyGuide.updateDialogue(owner, override, { preemptible: false });
    onTriggered();
    return true;
  } };
  function acquireAttention() {
    if (phase !== PHASE.WAITING) return false;
    const acquired = monkeyGuide.tryAcquireDialogue(owner, override, { priority, preemptible: true,
      onPreempt() {
        if (phase !== PHASE.ATTENTION && phase !== PHASE.AUTO_DELAY) return;
        monkeyGuide.cancelDialogueAttention(owner);
        monkeyGuide.releaseDialogue(owner);
        autoPlaybackDelayRemaining = 0;
        phase = PHASE.WAITING;
      } });
    if (!acquired) return false;
    if (!requiresAttention) {
      const delay = Math.max(0, Number.isFinite(autoPlaybackDelaySeconds) ? autoPlaybackDelaySeconds : 0);
      if (delay > 0) {
        phase = PHASE.AUTO_DELAY;
        autoPlaybackDelayRemaining = delay;
        onAutoPlaybackCue();
      } else {
        phase = PHASE.PLAYBACK;
        monkeyGuide.updateDialogue(owner, override, { preemptible: false });
        onTriggered();
      }
    } else {
      phase = PHASE.ATTENTION;
      monkeyGuide.notifyDialogueAttention(owner);
    }
    return true;
  }
  function beginAttention() {
    if (phase !== PHASE.IDLE) return false;
    phase = PHASE.WAITING;
    acquireAttention();
    return true;
  }
  function beginPlayback() {
    if (phase !== PHASE.PLAYBACK) return false;
    monkeyGuide.updateDialogue(owner, override, { preemptible: false });
    return playback.begin();
  }
  function update(delta) {
    if (phase === PHASE.WAITING) acquireAttention();
    if (phase === PHASE.AUTO_DELAY) {
      if (!monkeyGuide.ownsDialogue(owner)) {
        autoPlaybackDelayRemaining = 0;
        phase = PHASE.WAITING;
      } else {
        autoPlaybackDelayRemaining -= Math.max(0, Number.isFinite(delta) ? delta : 0);
        if (autoPlaybackDelayRemaining <= 0) {
          autoPlaybackDelayRemaining = 0;
          phase = PHASE.PLAYBACK;
          monkeyGuide.updateDialogue(owner, override, { preemptible: false });
          onTriggered();
        }
      }
    }
    playback.update(delta);
  }
  function reset() {
    playback.reset();
    monkeyGuide.cancelDialogueAttention(owner);
    monkeyGuide.releaseDialogue(owner);
    autoPlaybackDelayRemaining = 0;
    phase = PHASE.IDLE;
  }
  return { beginAttention, beginPlayback, update, reset, getPhase: () => phase };
}
