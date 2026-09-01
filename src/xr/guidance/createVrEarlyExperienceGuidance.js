import { createVrMandatoryMonkeyCommunication } from './createVrMandatoryMonkeyCommunication.js';
import { VR_MONKEY_DIALOGUE_PRIORITY } from './createVrMonkeyGuide.js';
import { VR_MONKEY_MESSAGE_TIMING } from './vrMonkeyCommunicationCopy.js';

export function createVrEarlyExperienceGuidance({ monkeyGuide, copy, getCurrentPointId,
  hasProtoAstroTuning, onFirstCrystalResponseCompleted = () => {} }) {
  const pending = [];
  let active = null;
  let glyphElapsed = null;
  let firstCrystal = null;
  let crystalPickupElapsed = 0;
  let pickupHintStage = 0;
  let pickupHintPending = false;
  let revealElapsed = null;
  let cardElapsed = null;
  let tuningElapsed = null;
  let firstCrystalExtracted = false;
  let thresholdShown = false;
  let firstCrystalResponseShown = false;
  let firstCardShown = false;
  let tuningResolved = false;
  let firstCrystalRevealDue = false;

  const enqueue = (descriptor) => {
    if (active?.descriptor.id === descriptor.id || pending.some(({ id }) => id === descriptor.id)) return;
    pending.push(descriptor);
    pending.sort((a, b) => b.priority - a.priority);
  };
  const automatic = (id, blocks, isStillRelevant = () => true) => enqueue({
    id, blocks, isStillRelevant, requiresAttention: false,
    priority: VR_MONKEY_DIALOGUE_PRIORITY.ACQUISITION
  });
  const optional = (id, blocks, isStillRelevant, onCompleted = () => {}) => enqueue({
    id, blocks, isStillRelevant, onCompleted, requiresAttention: true,
    priority: VR_MONKEY_DIALOGUE_PRIORITY.OPTIONAL
  });
  function discardIrrelevant() {
    for (let index = pending.length - 1; index >= 0; index -= 1) {
      if (!pending[index].isStillRelevant()) pending.splice(index, 1);
    }
    if (['WAITING', 'ATTENTION'].includes(active?.actor.getPhase()) && !active.descriptor.isStillRelevant()) {
      active.actor.reset(); active = null;
    }
  }
  function beginNext() {
    if (active || !pending.length || monkeyGuide.isOpen()) return;
    const descriptor = pending.shift();
    let actor;
    actor = createVrMandatoryMonkeyCommunication({ monkeyGuide, blocks: descriptor.blocks,
      secondsPerLine: VR_MONKEY_MESSAGE_TIMING.secondsPerLine, priority: descriptor.priority,
      requiresAttention: descriptor.requiresAttention, openMenuOnCompleted: false,
      onTriggered: () => actor.beginPlayback(), onCompleted: () => {
        descriptor.onCompleted?.();
        if (active?.actor === actor) active = null;
      } });
    active = { actor, descriptor }; actor.beginAttention();
  }
  const crystalUnclaimed = () => firstCrystal?.state === 'available';
  const crystalFlowUnadvanced = () => Boolean(firstCrystal
    && !['inserted', 'active', 'released', 'consuming'].includes(firstCrystal.state));

  function notifyGlyphFreeExploreStarted() {
    if (!thresholdShown) {
      thresholdShown = true;
      automatic('threshold-crossed', copy.progression['progression.threshold.crossed'].blocks);
    }
    if (!firstCrystalExtracted && glyphElapsed === null) glyphElapsed = 0;
  }
  function notifyCrystalCreated(crystal) {
    if (firstCrystalExtracted) return;
    firstCrystalExtracted = true; glyphElapsed = null; firstCrystal = crystal;
    if (!firstCrystalResponseShown) {
      firstCrystalResponseShown = true;
      enqueue({ id: 'first-crystal-response',
        blocks: copy.progression['progression.crystal.firstCreated'].blocks,
        isStillRelevant: () => true, requiresAttention: false,
        priority: VR_MONKEY_DIALOGUE_PRIORITY.ACQUISITION,
        onCompleted: () => { if (firstCrystalRevealDue) onFirstCrystalResponseCompleted(); } });
    }
  }
  function notifyFirstCrystalRevealDue() { firstCrystalRevealDue = true; }
  function notifyReliquaryRevealCompleted() { if (firstCrystal && crystalFlowUnadvanced()) revealElapsed = 0; }
  function notifyCardCommitted() { if (!firstCardShown && cardElapsed === null) cardElapsed = 0; }

  function update(delta = 0) {
    const step = Math.max(0, Number.isFinite(delta) ? delta : 0);
    if (glyphElapsed !== null && !firstCrystalExtracted) {
      glyphElapsed += step;
      if (glyphElapsed >= 60 && glyphElapsed - step < 60) optional('first-glyph-soft', copy.hints['hint.glyphs.how.soft'].blocks, () => !firstCrystalExtracted);
      if (glyphElapsed >= 180) {
        optional('first-glyph-strong', copy.hints['hint.glyphs.how.strong'].blocks, () => !firstCrystalExtracted);
        glyphElapsed = null;
      }
    }
    if (crystalUnclaimed() && pickupHintStage < 2 && !pickupHintPending) {
      crystalPickupElapsed += step;
      if (crystalPickupElapsed >= 30) {
        const stage = pickupHintStage;
        crystalPickupElapsed = 0; pickupHintPending = true;
        const id = stage === 0 ? 'first-crystal-pickup-soft' : 'first-crystal-pickup-medium';
        const key = stage === 0 ? 'hint.crystal.whatNow.soft' : 'hint.crystal.grab.medium';
        optional(id, copy.hints[key].blocks, crystalUnclaimed, () => {
          pickupHintPending = false; pickupHintStage += 1;
        });
      }
    } else if (!crystalUnclaimed()) crystalPickupElapsed = 0;
    if (revealElapsed !== null) {
      if (!crystalFlowUnadvanced()) revealElapsed = null;
      else if ((revealElapsed += step) >= 60) {
        revealElapsed = null;
        optional('first-crystal-reliquary', copy.hints['hint.reliquary.firstCrystal'].blocks, crystalFlowUnadvanced);
      }
    }
    if (cardElapsed !== null && (cardElapsed += step) >= 5) {
      cardElapsed = null; firstCardShown = true;
      automatic('first-card', copy.progression['progression.card.first'].blocks);
    }
    if (!tuningResolved && getCurrentPointId() === '4.70') {
      if (hasProtoAstroTuning()) tuningResolved = true;
      else if ((tuningElapsed = (tuningElapsed ?? 0) + step) >= 180) {
        tuningElapsed = null; tuningResolved = true;
        optional('proto-astro-tuning', copy.hints['hint.protoAstro.tuning'].blocks,
          () => getCurrentPointId() === '4.70' && !hasProtoAstroTuning());
      }
    } else if (getCurrentPointId() !== '4.70') tuningElapsed = null;
    discardIrrelevant(); active?.actor.update(step); beginNext();
  }
  function reset() {
    active?.actor.reset(); active = null; pending.length = 0;
    glyphElapsed = firstCrystal = revealElapsed = cardElapsed = tuningElapsed = null;
    crystalPickupElapsed = pickupHintStage = 0; pickupHintPending = false;
    firstCrystalExtracted = thresholdShown = firstCrystalResponseShown = firstCardShown = tuningResolved = false;
    firstCrystalRevealDue = false;
  }
  return { update, reset, notifyGlyphFreeExploreStarted, notifyCrystalCreated, notifyFirstCrystalRevealDue,
    notifyReliquaryRevealCompleted, notifyCardCommitted };
}
