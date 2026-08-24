import { createVrMandatoryMonkeyCommunication } from './createVrMandatoryMonkeyCommunication.js';
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

  function enqueue(blocks) {
    pendingMessages.push(blocks);
  }

  function beginNextMessage() {
    if (activeMessage || !pendingMessages.length || monkeyGuide.hasDialogueOverride()) return;
    activeMessage = createVrMandatoryMonkeyCommunication({
      monkeyGuide,
      blocks: pendingMessages.shift(),
      secondsPerLine: VR_MONKEY_MESSAGE_TIMING.secondsPerLine,
      onCompleted() { activeMessage = null; }
    });
    activeMessage.beginAttention();
  }

  function notifyAstroAvailable() {
    if (astroAvailableResolved || astroAvailableElapsed !== null) return;
    astroAvailableElapsed = 0;
  }

  function notifyAstroClaimed() {
    astroAvailableResolved = true;
    astroAvailableElapsed = null;
    delayedAcquisitions.push({ elapsed: 0, blocks: copy.acquisition.astro.blocks });
  }

  function notifyAsterionClaimed() {
    delayedAcquisitions.push({ elapsed: 0, blocks: copy.acquisition.asterion.blocks });
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
          enqueue(copy.hints['hint.furnace.astroStart'].blocks);
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
          enqueue(copy.hints['hint.furnace.astroAvailable'].blocks);
        }
      }
    }

    for (let index = delayedAcquisitions.length - 1; index >= 0; index -= 1) {
      const acquisition = delayedAcquisitions[index];
      acquisition.elapsed += step;
      if (acquisition.elapsed >= ACQUISITION_DELAY_SECONDS) {
        enqueue(acquisition.blocks);
        delayedAcquisitions.splice(index, 1);
      }
    }
    activeMessage?.update(step);
    beginNextMessage();
  }

  function reset() {
    activeMessage?.reset();
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
