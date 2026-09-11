import { createVrMonkeyProgressionMessage } from './createVrMonkeyProgressionMessage.js';
import { VR_MONKEY_DIALOGUE_PRIORITY } from './createVrMonkeyGuide.js';
import { VR_MONKEY_COMMUNICATION_COPY_PL } from './vrMonkeyCommunicationCopy.js';

export const VR_FURNACE_INTRO_COPY = VR_MONKEY_COMMUNICATION_COPY_PL.progression['progression.furnace.look'].blocks;

export function createVrFurnaceIntro({ monkeyGuide, revealFurnace, secondsPerLine, onCompleted = () => {} }) {
  if (typeof revealFurnace !== 'function') throw new TypeError('revealFurnace is required');
  const owner = Symbol('VrFurnaceIntro');
  let active = false;
  const messageActor = createVrMonkeyProgressionMessage({
    monkeyGuide,
    owner,
    blocks: VR_FURNACE_INTRO_COPY,
    secondsPerLine,
    beforeShow: revealFurnace,
    onCompleted() {
      active = false;
      monkeyGuide.releaseDialogue(owner);
      onCompleted();
    }
  });
  function begin() {
    if (active) return false;
    const acquired = monkeyGuide.tryAcquireDialogue(owner, { options: [] }, {
      priority: VR_MONKEY_DIALOGUE_PRIORITY.MANDATORY,
      preemptible: false
    });
    if (!acquired) return false;
    if (!messageActor.begin()) {
      monkeyGuide.releaseDialogue(owner);
      return false;
    }
    active = true;
    return true;
  }
  function reset() {
    messageActor.reset();
    monkeyGuide.releaseDialogue(owner);
    active = false;
  }
  return { begin, update: messageActor.update, reset, cancel: reset, getState: messageActor.getState };
}
