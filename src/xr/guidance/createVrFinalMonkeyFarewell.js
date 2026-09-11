import { createVrMandatoryMonkeyCommunication } from './createVrMandatoryMonkeyCommunication.js';

const SILENCE_SECONDS = 3;

export function createVrFinalMonkeyFarewell({ monkeyGuide, blocks, onTriggered = () => {}, onCompleted = () => {} }) {
  let silenceRemaining = null;
  let completed = false;
  let silenceStartedThisUpdate = false;

  const communication = createVrMandatoryMonkeyCommunication({
    monkeyGuide,
    blocks,
    secondsPerLine: 2,
    onTriggered: () => {
      onTriggered();
      communication.beginPlayback();
    },
    onLastBlockHidden() {
      monkeyGuide.setInteractionEnabled(false);
      silenceRemaining = SILENCE_SECONDS;
      silenceStartedThisUpdate = true;
    }
  });

  function begin() {
    if (completed || !monkeyGuide.isInteractionEnabled()) return false;
    return communication.beginAttention();
  }

  function update(delta) {
    silenceStartedThisUpdate = false;
    communication.update(delta);
    if (silenceRemaining === null || silenceStartedThisUpdate) return;
    silenceRemaining -= Math.max(0, Number.isFinite(delta) ? delta : 0);
    if (silenceRemaining > 0) return;
    silenceRemaining = null;
    completed = true;
    onCompleted();
  }

  function hydrateScenarioState(state) {
    if (state?.completed !== true) throw new Error('Final Monkey farewell hydration requires completed truth');
    communication.reset();
    silenceRemaining = null;
    completed = true;
    monkeyGuide.setInteractionEnabled(false);
  }

  function reset() {
    communication.reset();
    silenceRemaining = null;
    completed = false;
    silenceStartedThisUpdate = false;
    monkeyGuide.setInteractionEnabled(true);
  }

  return { begin, update, reset, hydrateScenarioState };
}
