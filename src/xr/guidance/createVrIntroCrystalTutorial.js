import * as THREE from '../../vendor/three.js';

export const VR_INTRO_CRYSTAL_TUTORIAL_COPY = Object.freeze({
  pl: Object.freeze({
    seen: Object.freeze(['Widzisz?', 'Już nauczyłeś świat, gdzie patrzysz.']),
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
  let queue = [];
  let current = null;
  let elapsed = 0;
  let active = false;
  let handoffRequested = false;
  let handoffAccepted = false;
  let completionEmitted = false;

  function showNext() {
    current = queue.shift() ?? null;
    if (!current) return;
    monkeyGuide.showMessage(current.text);
    elapsed = 0;
  }
  function enqueue(items) {
    queue.push(...items);
    if (!current) showNext();
  }
  function begin() {
    if (active) return false;
    reset();
    active = true;
    monkeyGuide.setDialogueOverride(null);
    enqueue(copy.seen.map((text, index) => ({ text, after: index === copy.seen.length - 1 ? spawnAndInstruct : null })));
    return true;
  }
  function spawnAndInstruct() {
    const spawnPosition = getWorldPointAtRadius(settings.spawnRadius);
    crystal = crystalCollection.spawnTransientTutorialCrystal(crystalDefinition, spawnPosition);
    if (!crystal) throw new Error('Intro crystal tutorial could not spawn its transient crystal');
    enqueue([{ text: copy.instruction }]);
  }
  function acceptHandoff() {
    if (!active || !handoffRequested || handoffAccepted || !crystal) return false;
    if (!crystalCollection.takeoverAndConsumeTransient(crystal)) return false;
    handoffAccepted = true;
    playConsume();
    enqueue([{ text: copy.unavailable }, { text: copy.complete, after: () => {
      if (!completionEmitted) { completionEmitted = true; active = false; onCompleted(); }
    } }]);
    return true;
  }
  function update(delta = 0) {
    if (!active) return;
    if (current) {
      elapsed += Math.max(0, delta);
      const duration = settings.messageDisplayDuration;
      if (elapsed >= duration) {
        const finished = current;
        current = null;
        monkeyGuide.showMessage('');
        finished?.after?.();
        if (queue.length) showNext();
      }
    }
    if (!handoffRequested && crystal && crystalCollection.isHeld(crystal)) {
      monkeyRoot.getWorldPosition(monkeyPosition);
      if (crystalCollection.getWorldPosition(crystal, playerPosition)
        .distanceTo(monkeyPosition) <= settings.handoffDistanceFromMonkey) {
        handoffRequested = true;
        onHandoffRequested();
      }
    }
  }
  function reset() {
    if (crystal) crystalCollection.removeTransientCrystal(crystal);
    crystal = null; queue = []; current = null; elapsed = 0; active = false;
    handoffRequested = handoffAccepted = completionEmitted = false;
    monkeyGuide.showMessage('');
  }
  function dispose() { reset(); }
  return { begin, acceptHandoff, update, reset, dispose,
    getSnapshot: () => ({ active, crystal, handoffRequested, handoffAccepted, completionEmitted }) };
}
