import { createVrMandatoryMonkeyCommunication } from './createVrMandatoryMonkeyCommunication.js';
import { VR_MONKEY_DIALOGUE_PRIORITY } from './createVrMonkeyGuide.js';
import { VR_MONKEY_MESSAGE_TIMING } from './vrMonkeyCommunicationCopy.js';

const ASTRO_START_DELAY_SECONDS = 180;
const ASTRO_AVAILABLE_DELAY_SECONDS = 60;
const ACQUISITION_DELAY_SECONDS = 5;

export function createVrToolGuidanceLifecycle({ monkeyGuide, copy, canStartAstroProduction,
  getAstroProductionState }) {
  if (!monkeyGuide || !copy) throw new TypeError('Monkey guide and guidance copy are required.');
  if (typeof canStartAstroProduction !== 'function' || typeof getAstroProductionState !== 'function') {
    throw new TypeError('Tool guidance lifecycle state dependencies must be functions.');
  }

  let disposed = false;
  let astroStartElapsed = 0;
  let astroStartResolved = false;
  let astroAvailableElapsed = null;
  let astroAvailableResolved = false;
  const delayedAcquisitions = [];
  const pendingMessages = [];
  let activeMessage = null;

  function enqueue(message) {
    if (activeMessage?.descriptor.id === message.id
      || pendingMessages.some(({ id }) => id === message.id)) return;
    pendingMessages.push(message);
    pendingMessages.sort((a, b) => b.priority - a.priority);
  }

  function discardIrrelevantMessages() {
    for (let index = pendingMessages.length - 1; index >= 0; index -= 1) {
      if (!pendingMessages[index].isStillRelevant()) pendingMessages.splice(index, 1);
    }
    if (['WAITING', 'ATTENTION'].includes(activeMessage?.actor.getPhase())
      && !activeMessage.descriptor.isStillRelevant()) {
      activeMessage.actor.reset();
      activeMessage = null;
    }
  }

  function beginNextMessage() {
    if (activeMessage || !pendingMessages.length || monkeyGuide.isOpen()) return;
    const descriptor = pendingMessages.shift();
    let actor = null;
    actor = createVrMandatoryMonkeyCommunication({
      monkeyGuide,
      blocks: descriptor.blocks,
      secondsPerLine: VR_MONKEY_MESSAGE_TIMING.secondsPerLine,
      priority: descriptor.priority,
      onTriggered() { actor.beginPlayback(); },
      onCompleted() { if (activeMessage?.actor === actor) activeMessage = null; }
    });
    activeMessage = { descriptor, actor };
    actor.beginAttention();
  }

  function yieldToHigherPriorityPendingMessage() {
    if (!activeMessage || !pendingMessages.length) return;
    const phase = activeMessage.actor.getPhase();
    if (!['WAITING', 'ATTENTION'].includes(phase)
      || pendingMessages[0].priority <= activeMessage.descriptor.priority) return;
    const descriptor = activeMessage.descriptor;
    activeMessage.actor.reset();
    activeMessage = null;
    enqueue(descriptor);
  }

  function notifyAstroAvailable() {
    if (astroAvailableResolved || astroAvailableElapsed !== null) return;
    astroAvailableElapsed = 0;
  }

  function notifyAstroClaimed() {
    astroAvailableResolved = true;
    astroAvailableElapsed = null;
    delayedAcquisitions.push({
      elapsed: 0,
      message: { id: 'acquisition-astro', blocks: copy.acquisition.astro.blocks,
        priority: VR_MONKEY_DIALOGUE_PRIORITY.ACQUISITION,
        isStillRelevant: () => true }
    });
  }

  function notifyAsterionClaimed() {
    delayedAcquisitions.push({
      elapsed: 0,
      message: { id: 'acquisition-asterion', blocks: copy.acquisition.asterion.blocks,
        priority: VR_MONKEY_DIALOGUE_PRIORITY.ACQUISITION,
        isStillRelevant: () => true }
    });
  }

  function update(delta = 0) {
    if (disposed) return;
    const step = Math.max(0, Number.isFinite(delta) ? delta : 0);
    const astroState = getAstroProductionState();

    if (!astroStartResolved && canStartAstroProduction()) {
      if (astroState !== 'READY') astroStartResolved = true;
      else {
        astroStartElapsed += step;
        if (astroStartElapsed >= ASTRO_START_DELAY_SECONDS) {
          astroStartResolved = true;
          enqueue({
            id: 'furnace-astro-start',
            blocks: copy.hints['hint.furnace.astroStart'].blocks,
            priority: VR_MONKEY_DIALOGUE_PRIORITY.OPTIONAL,
            isStillRelevant: () => getAstroProductionState() === 'READY'
          });
        }
      }
    }

    if (astroState === 'AVAILABLE' && astroAvailableElapsed === null && !astroAvailableResolved) notifyAstroAvailable();
    if (astroAvailableElapsed !== null) {
      if (astroState !== 'AVAILABLE') {
        astroAvailableResolved = true;
        astroAvailableElapsed = null;
      } else {
        astroAvailableElapsed += step;
        if (astroAvailableElapsed >= ASTRO_AVAILABLE_DELAY_SECONDS) {
          astroAvailableResolved = true;
          astroAvailableElapsed = null;
          enqueue({
            id: 'furnace-astro-available',
            blocks: copy.hints['hint.furnace.astroAvailable'].blocks,
            priority: VR_MONKEY_DIALOGUE_PRIORITY.OPTIONAL,
            isStillRelevant: () => getAstroProductionState() === 'AVAILABLE'
          });
        }
      }
    }

    for (let index = delayedAcquisitions.length - 1; index >= 0; index -= 1) {
      const acquisition = delayedAcquisitions[index];
      acquisition.elapsed += step;
      if (acquisition.elapsed >= ACQUISITION_DELAY_SECONDS) {
        enqueue(acquisition.message);
        delayedAcquisitions.splice(index, 1);
      }
    }
    discardIrrelevantMessages();
    yieldToHigherPriorityPendingMessage();
    activeMessage?.actor.update(step);
    beginNextMessage();
  }

  function reset() {
    if (activeMessage) {
      activeMessage.actor.reset();
    }
    activeMessage = null;
    pendingMessages.length = 0;
    delayedAcquisitions.length = 0;
    astroStartElapsed = 0;
    astroStartResolved = false;
    astroAvailableElapsed = null;
    astroAvailableResolved = false;
  }

  function dispose() { if (!disposed) { reset(); disposed = true; } }

  return { update, reset, dispose, notifyAstroAvailable, notifyAstroClaimed, notifyAsterionClaimed };
}
