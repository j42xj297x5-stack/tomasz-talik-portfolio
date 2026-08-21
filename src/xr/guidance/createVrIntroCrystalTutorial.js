import * as THREE from '../../vendor/three.js';
import { createVrMonkeyProgressionMessage } from './createVrMonkeyProgressionMessage.js';
import { VR_MONKEY_COMMUNICATION_COPY_PL, VR_MONKEY_MESSAGE_TIMING } from './vrMonkeyCommunicationCopy.js';

export const VR_INTRO_CRYSTAL_TUTORIAL_COPY = Object.freeze({
  pl: Object.freeze({
    seen: VR_MONKEY_COMMUNICATION_COPY_PL.tutorial.crystal.pointerLearned,
    instruction: 'A teraz złap kryształ i podaj go mnie.',
    unavailable: 'Tak, tego jeszcze nie możemy użyć.',
    complete: 'Podstawy poznałeś.'
  }),
  en: Object.freeze({
    seen: Object.freeze(['See?', 'You have already taught the world where you are looking.']),
    instruction: 'Now grab the crystal and hand it to me.',
    unavailable: 'Yes, we cannot use this yet.',
    complete: 'You have learned the basics.'
  })
});

export function createVrIntroCrystalTutorial({ monkeyGuide, monkeyRoot, getWorldPointAtRadius, crystalCollection,
  crystalDefinition, settings, locale = 'en', onHandoffRequested = () => {}, onCompleted = () => {},
  playConsume = () => {} }) {
  const copy = VR_INTRO_CRYSTAL_TUTORIAL_COPY[locale === 'pl' ? 'pl' : 'en'];
  const monkeyPosition = new THREE.Vector3();
  const playerPosition = new THREE.Vector3();
  let crystal = null;
  let active = false;
  let handoffRequested = false;
  let handoffAccepted = false;
  let completionEmitted = false;
  let sequence = null;

  function begin() {
    if (active) return false;
    reset();
    active = true;
    monkeyGuide.setInteractionEnabled?.(false);
    monkeyGuide.setDialogueOverride(null);
    sequence = createVrMonkeyProgressionMessage({ monkeyGuide, blocks: copy.seen,
      secondsPerLine: settings.messageDisplayDuration ?? VR_MONKEY_MESSAGE_TIMING.secondsPerLine,
      gapSeconds: settings.messageGapDuration ?? VR_MONKEY_MESSAGE_TIMING.gapSeconds, onCompleted: spawnAndInstruct });
    sequence.begin();
    return true;
  }
  function spawnAndInstruct() {
    const spawnPosition = getWorldPointAtRadius(settings.spawnRadius, { heightAboveFloor: settings.interactionHeightAboveFloor });
    crystal = crystalCollection.spawnTransientTutorialCrystal(crystalDefinition, spawnPosition);
    if (!crystal) throw new Error('Intro crystal tutorial could not spawn its transient crystal');
    monkeyGuide.showMessage(copy.instruction);
  }
  function acceptHandoff() {
    if (!active || !handoffRequested || handoffAccepted || !crystal) return false;
    if (!crystalCollection.takeoverAndConsumeTransient(crystal)) return false;
    handoffAccepted = true;
    playConsume();
    monkeyGuide.showMessage('');
    sequence = createVrMonkeyProgressionMessage({ monkeyGuide, blocks: [copy.unavailable, copy.complete],
      secondsPerLine: settings.messageDisplayDuration ?? VR_MONKEY_MESSAGE_TIMING.secondsPerLine,
      gapSeconds: settings.messageGapDuration ?? VR_MONKEY_MESSAGE_TIMING.gapSeconds, onCompleted: () => {
      if (!completionEmitted) { completionEmitted = true; active = false; monkeyGuide.setInteractionEnabled?.(true); onCompleted(); }
    } }); sequence.begin();
    return true;
  }
  function update(delta = 0) {
    if (!active) return;
    if (sequence) { sequence.update(delta); if (sequence.getState() === 'COMPLETED') sequence = null; }
    if (!handoffRequested && crystal && crystalCollection.isHeld(crystal)) {
      monkeyRoot.getWorldPosition(monkeyPosition);
      monkeyPosition.add(getWorldPointAtRadius(0, { heightAboveFloor: settings.interactionHeightAboveFloor }))
        .sub(getWorldPointAtRadius(0));
      if (crystalCollection.getWorldPosition(crystal, playerPosition)
        .distanceTo(monkeyPosition) <= settings.handoffDistanceFromMonkey) {
        handoffRequested = true;
        onHandoffRequested();
      }
    }
  }
  function reset() {
    if (crystal) crystalCollection.removeTransientCrystal(crystal);
    sequence?.reset(); sequence = null; crystal = null; active = false;
    handoffRequested = handoffAccepted = completionEmitted = false;
    monkeyGuide.showMessage('');
    monkeyGuide.setInteractionEnabled?.(true);
  }
  function dispose() { reset(); }
  return { begin, acceptHandoff, update, reset, dispose,
    getSnapshot: () => {
      const worldPosition = crystal ? crystalCollection.getWorldPosition(crystal, new THREE.Vector3()) : null;
      let effectivelyVisible = Boolean(crystal?.object?.parent);
      for (let node = crystal?.object; node; node = node.parent) effectivelyVisible &&= node.visible !== false;
      return { active, crystal, crystalState: crystal?.state ?? null, worldPosition: worldPosition?.toArray() ?? null,
        targetPosition: crystal?.targetPosition?.toArray?.() ?? null, effectivelyVisible,
        parentName: crystal?.object?.parent?.name ?? null, assetId: crystal?.crystalAssetId ?? crystalDefinition?.crystalAssetId ?? null,
        handoffRequested, handoffAccepted, completionEmitted };
    } };
}
