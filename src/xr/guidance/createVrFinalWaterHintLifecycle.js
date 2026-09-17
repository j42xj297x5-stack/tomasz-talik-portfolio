import { createVrMandatoryMonkeyCommunication } from './createVrMandatoryMonkeyCommunication.js';
import { VR_MONKEY_DIALOGUE_PRIORITY } from './createVrMonkeyGuide.js';

export const VR_FINAL_WATER_HINT_THRESHOLDS_SECONDS = Object.freeze({ HINT_1: 180, HINT_2: 360, HINT_3: 540 });

export function createVrFinalWaterHintLifecycle({ monkeyGuide, knowledgeResolver, copy, locale = 'en', secondsPerLine,
  isFinalWaterPuzzleActive, isWaterInstalled, hasLearnedFullResonator, isWaterSyncLocked }) {
  const semanticReaders = [isFinalWaterPuzzleActive, isWaterInstalled, hasLearnedFullResonator, isWaterSyncLocked];
  if (semanticReaders.some((reader) => typeof reader !== 'function')) {
    throw new TypeError('Final Water hint lifecycle semantic dependencies must be functions.');
  }

  const decisionOwner = Symbol('VrFinalWaterDecision');
  const offerQuestion = copy.hints['hint.finalWater.solution.offer'].blocks[0];
  const decisionCopy = locale === 'pl'
    ? Object.freeze({ keep: 'JESZCZE SPRÓBUJĘ', show: 'POKAŻ MI' })
    : Object.freeze({ keep: "I'LL KEEP TRYING", show: 'SHOW ME' });
  let elapsedSeconds = 0;
  let active = false;
  let solved = false;
  let hint1Complete = false;
  let hint2Complete = false;
  let automaticEscalationStopped = false;
  let decisionPending = false;

  const makeCommunication = (hintId, { requiresAttention = true, onCompleted = () => {} } = {}) => {
    let communication;
    communication = createVrMandatoryMonkeyCommunication({
      monkeyGuide, blocks: copy.hints[hintId].blocks, secondsPerLine,
      priority: VR_MONKEY_DIALOGUE_PRIORITY.MANDATORY, requiresAttention,
      onTriggered: () => communication.beginPlayback(), onCompleted
    });
    return communication;
  };

  const hint1 = makeCommunication('hint.finalWater.balance.soft', {
    onCompleted: () => { hint1Complete = true; }
  });
  const hint2 = makeCommunication('hint.finalWater.balance.direct', {
    onCompleted: () => {
      hint2Complete = true;
      if (!solved && knowledgeResolver.markFinalWaterBalanceHintTaught()) monkeyGuide.refreshKnowledge();
    }
  });
  const exactSolution = makeCommunication('hint.finalWater.solution.exact', {
    requiresAttention: false,
    onCompleted: () => {
      if (knowledgeResolver.markFinalWaterSolutionRevealed()) monkeyGuide.refreshKnowledge();
    }
  });

  const decisionOverride = Object.freeze({
    options: Object.freeze([
      Object.freeze({ id: 'keep-trying', label: decisionCopy.keep }),
      Object.freeze({ id: 'show-me', label: decisionCopy.show })
    ]),
    onSelect(optionId) {
      if (optionId !== 'keep-trying' && optionId !== 'show-me') return false;
      monkeyGuide.releaseDialogue(decisionOwner);
      monkeyGuide.showMessage('');
      decisionPending = false;
      automaticEscalationStopped = true;
      if (optionId === 'keep-trying') {
        if (knowledgeResolver.makeFinalWaterSolutionOfferAvailable()) monkeyGuide.refreshKnowledge();
      } else {
        exactSolution.beginAttention();
      }
      return true;
    }
  });

  function acquireDecision() {
    if (!decisionPending || solved) return false;
    const acquired = monkeyGuide.tryAcquireDialogue(decisionOwner, decisionOverride, {
      priority: VR_MONKEY_DIALOGUE_PRIORITY.MANDATORY, preemptible: false
    });
    if (acquired) monkeyGuide.showDialogueMessage(decisionOwner, offerQuestion);
    return acquired;
  }

  const hint3 = makeCommunication('hint.finalWater.solution.offer', {
    onCompleted: () => {
      if (solved) return;
      decisionPending = true;
      acquireDecision();
    }
  });
  const communications = [hint1, hint2, hint3, exactSolution];

  function prerequisitesMet() {
    return isFinalWaterPuzzleActive() && isWaterInstalled() && hasLearnedFullResonator()
      && isWaterSyncLocked() !== true;
  }
  function begin() {
    if (active || solved || automaticEscalationStopped || !prerequisitesMet()) return false;
    active = true;
    return true;
  }
  function resolveSolved() {
    solved = true;
    active = false;
    automaticEscalationStopped = true;
    decisionPending = false;
    monkeyGuide.releaseDialogue(decisionOwner);
    monkeyGuide.showMessage('');
    for (const communication of [hint1, hint2, hint3]) {
      if (['IDLE', 'WAITING', 'ATTENTION', 'AUTO_DELAY'].includes(communication.getPhase())) communication.reset();
    }
    if (knowledgeResolver.resolveFinalWaterGuidance()) monkeyGuide.refreshKnowledge();
  }
  function update(deltaSeconds = 0) {
    const delta = Math.max(0, Number.isFinite(deltaSeconds) ? deltaSeconds : 0);
    if (!solved && isWaterSyncLocked() === true) resolveSolved();
    if (active && !solved) {
      elapsedSeconds += delta;
      if (elapsedSeconds >= VR_FINAL_WATER_HINT_THRESHOLDS_SECONDS.HINT_1 && hint1.getPhase() === 'IDLE') {
        hint1.beginAttention();
      } else if (elapsedSeconds >= VR_FINAL_WATER_HINT_THRESHOLDS_SECONDS.HINT_2 && hint1Complete
        && hint2.getPhase() === 'IDLE') {
        hint2.beginAttention();
      } else if (!automaticEscalationStopped && elapsedSeconds >= VR_FINAL_WATER_HINT_THRESHOLDS_SECONDS.HINT_3
        && hint2Complete && !knowledgeResolver.hasFinalWaterSolutionRevealed() && hint3.getPhase() === 'IDLE') {
        hint3.beginAttention();
      }
    }
    communications.forEach((communication) => communication.update(delta));
    if (decisionPending && !monkeyGuide.ownsDialogue(decisionOwner)) acquireDecision();
  }
  function reset() {
    communications.forEach((communication) => communication.reset());
    monkeyGuide.releaseDialogue(decisionOwner);
    monkeyGuide.showMessage('');
    elapsedSeconds = 0;
    active = false;
    solved = false;
    hint1Complete = false;
    hint2Complete = false;
    automaticEscalationStopped = false;
    decisionPending = false;
  }
  function dispose() { reset(); }

  return Object.freeze({ begin, update, reset, dispose });
}
