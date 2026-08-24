import { createVrMonkeyProgressionMessage } from './createVrMonkeyProgressionMessage.js';

const PHASE = Object.freeze({ IDLE: 'IDLE', ATTENTION: 'ATTENTION', PLAYBACK: 'PLAYBACK', COMPLETE: 'COMPLETE' });

export function createVrMandatoryMonkeyCommunication({ monkeyGuide, blocks, secondsPerLine,
  onTriggered = () => {}, onCompleted = () => {}, openMenuOnCompleted = true }) {
  let phase = PHASE.IDLE;
  const playback = createVrMonkeyProgressionMessage({ monkeyGuide, blocks, secondsPerLine,
    onCompleted() {
      phase = PHASE.COMPLETE;
      monkeyGuide.setDialogueOverride(null);
      if (openMenuOnCompleted) monkeyGuide.open();
      onCompleted();
    }
  });
  const lock = () => monkeyGuide.setDialogueOverride({ options: [], onMonkeyPress() {
    if (phase !== PHASE.ATTENTION) return true;
    phase = PHASE.PLAYBACK;
    onTriggered();
    return true;
  } });
  function beginAttention() {
    if (phase !== PHASE.IDLE) return false;
    phase = PHASE.ATTENTION;
    lock();
    monkeyGuide.notifyAttention();
    return true;
  }
  function beginPlayback() {
    if (phase !== PHASE.PLAYBACK) return false;
    lock();
    return playback.begin();
  }
  function reset() {
    playback.reset();
    if (phase !== PHASE.IDLE) monkeyGuide.setDialogueOverride(null);
    phase = PHASE.IDLE;
  }
  return { beginAttention, beginPlayback, update: playback.update, reset, getPhase: () => phase };
}
