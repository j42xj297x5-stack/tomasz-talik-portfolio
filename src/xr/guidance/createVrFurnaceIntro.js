import { createVrMonkeyProgressionMessage } from './createVrMonkeyProgressionMessage.js';
import { VR_MONKEY_COMMUNICATION_COPY_PL } from './vrMonkeyCommunicationCopy.js';

export const VR_FURNACE_INTRO_COPY = VR_MONKEY_COMMUNICATION_COPY_PL.progression['progression.furnace.look'].blocks;

export function createVrFurnaceIntro({ monkeyGuide, revealFurnace, secondsPerLine, onCompleted = () => {} }) {
  if (typeof revealFurnace !== 'function') throw new TypeError('revealFurnace is required');
  return createVrMonkeyProgressionMessage({
    monkeyGuide,
    blocks: VR_FURNACE_INTRO_COPY,
    secondsPerLine,
    beforeShow: revealFurnace,
    onCompleted
  });
}
