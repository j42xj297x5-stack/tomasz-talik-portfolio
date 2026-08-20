import { createVrMonkeyProgressionMessage } from './createVrMonkeyProgressionMessage.js';

export const VR_POST_RING_MONKEY_DIALOGUE_COPY = Object.freeze([
  'No i świat przestał być uprzejmy.',
  'To, czego potrzebujesz, jest teraz poza zasięgiem.',
  'Na szczęście nie na długo.'
]);

export function createVrPostRingMonkeyDialogue({ monkeyGuide, secondsPerLine, onCompleted = () => {} }) {
  return createVrMonkeyProgressionMessage({
    monkeyGuide,
    message: VR_POST_RING_MONKEY_DIALOGUE_COPY.join('\n'),
    secondsPerLine,
    notifyAttention: true,
    onCompleted
  });
}
