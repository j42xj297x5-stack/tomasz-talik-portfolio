import { createVrMonkeyProgressionMessage } from './createVrMonkeyProgressionMessage.js';
import { VR_MONKEY_COMMUNICATION_COPY_PL } from './vrMonkeyCommunicationCopy.js';

export const VR_POST_RING_MONKEY_DIALOGUE_COPY = VR_MONKEY_COMMUNICATION_COPY_PL.progression['progression.postRing.changedWorld'].blocks;

export function createVrPostRingMonkeyDialogue({ monkeyGuide, secondsPerLine, onCompleted = () => {} }) {
  return createVrMonkeyProgressionMessage({
    monkeyGuide,
    blocks: VR_POST_RING_MONKEY_DIALOGUE_COPY,
    secondsPerLine,
    notifyAttention: true,
    onCompleted
  });
}
