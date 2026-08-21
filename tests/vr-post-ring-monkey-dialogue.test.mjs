import assert from 'node:assert/strict';
import { createVrPostRingMonkeyDialogue, VR_POST_RING_MONKEY_DIALOGUE_COPY } from '../src/xr/guidance/createVrPostRingMonkeyDialogue.js';

const messages = []; let attention = 0; let completed = 0;
const actor = createVrPostRingMonkeyDialogue({ monkeyGuide: {
  notifyAttention: () => attention++, showMessage(text) { messages.push(text); return { lineCount: text ? text.split('\n').length : 0 }; }
}, secondsPerLine: 2, onCompleted: () => completed++ });
assert.deepEqual(VR_POST_RING_MONKEY_DIALOGUE_COPY, ['No i świat przestał być uprzejmy.',
  'To, czego potrzebujesz, jest teraz poza zasięgiem.\nNa szczęście nie na długo.']);
assert.equal(actor.begin(), true); assert.equal(attention, 1); assert.equal(messages.at(-1), VR_POST_RING_MONKEY_DIALOGUE_COPY[0]);
actor.update(2); assert.equal(messages.at(-1), ''); actor.update(.5);
assert.equal(messages.at(-1), VR_POST_RING_MONKEY_DIALOGUE_COPY[1]);
actor.update(3.999); assert.equal(messages.at(-1), VR_POST_RING_MONKEY_DIALOGUE_COPY[1]);
actor.update(.001); assert.equal(messages.at(-1), ''); assert.equal(completed, 0);
actor.update(.5); assert.equal(completed, 1, 'completion follows the final canonical gap');
console.log('VR post-ring Monkey dialogue assertions passed.');
