import { createVrMandatoryMonkeyCommunication } from './createVrMandatoryMonkeyCommunication.js';
import { VR_MONKEY_DIALOGUE_PRIORITY } from './createVrMonkeyGuide.js';

const DELAY_SECONDS = 5;

export function createVrRuneResonatorGuidance({ monkeyGuide, copy, secondsPerLine,
  getCurrentPointId, getUnresolvedRuneBranchId, knowledgeResolver,
  onEtherInterventionCompleted = () => {} }) {
  let armed = false;
  let previousPointId = getCurrentPointId();
  let glyphsGoneDue = null;
  let unresolvedSeconds = 0;
  let mediumDue = false;
  let firstRuneInstalled = false;
  let firstSectorLock = false;
  let firstResonator = false;

  const makeCommunication = (blocks, requiresAttention = true, onCompleted = () => {}) => {
    let communication;
    communication = createVrMandatoryMonkeyCommunication({ monkeyGuide, blocks, secondsPerLine,
      priority: VR_MONKEY_DIALOGUE_PRIORITY.ACQUISITION, requiresAttention,
      onTriggered: () => communication.beginPlayback(), onCompleted });
    return communication;
  };
  const glyphsGone = makeCommunication(copy.progression['progression.p3.glyphsGone'].blocks);
  const installed = makeCommunication(copy.progression['progression.p3.firstRuneInstalled'].blocks);
  const sectorLock = makeCommunication(copy.progression['progression.p3.firstSectorLock'].blocks, false);
  const resonator = makeCommunication(copy.progression['progression.p3.resonator'].blocks);
  const etherIntervention = makeCommunication(
    copy.progression['progression.p4.etherIntervention'].blocks,
    true,
    onEtherInterventionCompleted
  );
  const fullResonator = makeCommunication(copy.progression['progression.p4.fullResonator'].blocks);
  const noBinderMedium = makeCommunication(copy.hints['hint.rune.noBinder.medium'].blocks);
  const noBinderSoft = makeCommunication(copy.hints['hint.rune.noBinder.soft'].blocks, true, () => {
    if (getUnresolvedRuneBranchId()) { unresolvedSeconds = 0; mediumDue = true; }
  });
  const communications = [glyphsGone, installed, sectorLock, resonator, etherIntervention, fullResonator,
    noBinderSoft, noBinderMedium];

  function schedule(communication) { communication.beginAttention(); }
  function notifyBridgeTransitions(transitions) {
    if (!armed || knowledgeResolver.hasDiscoveredBinders()) return;
    if (transitions.some(({ previousState, state }) => previousState === 'ARRIVING' && state === 'DOCKED')) {
      knowledgeResolver.unlockBinders();
    }
  }
  function notifyThirdRingCompleted() {
    if (armed && glyphsGoneDue === null && glyphsGone.getPhase() === 'IDLE') glyphsGoneDue = DELAY_SECONDS;
  }
  function notifyRuneProgression(previous, current) {
    if (!armed) return;
    const before = previous?.installedRuneFamilies?.length ?? 0;
    const after = current?.installedRuneFamilies?.length ?? 0;
    if (!firstRuneInstalled && before === 0 && after === 1) {
      firstRuneInstalled = true;
      installed._due = DELAY_SECONDS;
    }
  }
  function notifySectorLocked() {
    if (!armed || firstSectorLock) return;
    firstSectorLock = true;
    sectorLock._due = DELAY_SECONDS;
  }
  function notifyResonatorChanged(previous, current) {
    if (!armed || firstResonator || previous?.resonatorExists || !current?.resonatorExists) return;
    firstResonator = true;
    resonator._due = DELAY_SECONDS;
  }
  function beginEtherIntervention() { return etherIntervention.beginAttention(); }
  function beginFullResonatorCommunication() { return fullResonator.beginAttention(); }
  function update(deltaSeconds = 0) {
    const delta = Math.max(0, Number.isFinite(deltaSeconds) ? deltaSeconds : 0);
    const pointId = getCurrentPointId();
    if (!armed) { armed = true; previousPointId = pointId; return; }
    if (previousPointId === '4.70' && pointId === '4.80') glyphsGoneDue = DELAY_SECONDS;
    previousPointId = pointId;
    if (glyphsGoneDue !== null) {
      glyphsGoneDue -= delta;
      if (glyphsGoneDue <= 0) { glyphsGoneDue = null; schedule(glyphsGone); }
    }
    [installed, sectorLock, resonator].forEach((communication) => {
      if (!Number.isFinite(communication._due)) return;
      communication._due -= delta;
      if (communication._due <= 0) { delete communication._due; schedule(communication); }
    });
    const unresolved = getUnresolvedRuneBranchId();
    if (!unresolved) {
      unresolvedSeconds = 0; mediumDue = false; noBinderSoft.reset(); noBinderMedium.reset();
    } else if (noBinderSoft.getPhase() === 'IDLE' && !mediumDue) {
      unresolvedSeconds += delta;
      if (unresolvedSeconds >= DELAY_SECONDS) { unresolvedSeconds = 0; schedule(noBinderSoft); }
    } else if (mediumDue && noBinderMedium.getPhase() === 'IDLE') {
      unresolvedSeconds += delta;
      if (unresolvedSeconds >= DELAY_SECONDS) { unresolvedSeconds = 0; mediumDue = false; schedule(noBinderMedium); }
    }
    communications.forEach((communication) => communication.update(delta));
  }
  function reset() {
    armed = false; previousPointId = getCurrentPointId(); glyphsGoneDue = null;
    unresolvedSeconds = 0; mediumDue = false; firstRuneInstalled = false; firstSectorLock = false; firstResonator = false;
    communications.forEach((communication) => { delete communication._due; communication.reset(); });
  }
  return { update, reset, notifyThirdRingCompleted, notifyBridgeTransitions, notifyRuneProgression,
    notifySectorLocked, notifyResonatorChanged, beginEtherIntervention, beginFullResonatorCommunication };
}
