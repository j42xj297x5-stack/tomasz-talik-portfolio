import { createVrMonkeyProgressionMessage } from './createVrMonkeyProgressionMessage.js';

export const VR_FURNACE_INTRO_COPY = Object.freeze([
  'Spójrz na Piec.',
  'Tam coś na ciebie czeka.'
]);

export function createVrFurnaceIntro({ monkeyGuide, revealFurnace, secondsPerLine, onCompleted = () => {} }) {
  if (typeof revealFurnace !== 'function') throw new TypeError('revealFurnace is required');
  return createVrMonkeyProgressionMessage({
    monkeyGuide,
    message: VR_FURNACE_INTRO_COPY.join('\n'),
    secondsPerLine,
    beforeShow: revealFurnace,
    onCompleted
  });
}
