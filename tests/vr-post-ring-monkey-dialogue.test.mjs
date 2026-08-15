import assert from 'node:assert/strict';
import { createVrPostRingMonkeyDialogue, VR_POST_RING_MONKEY_DIALOGUE_COPY }
  from '../src/xr/guidance/createVrPostRingMonkeyDialogue.js';

function fixture() {
  let override = null; let attention = 0; let completed = 0; let opened = 0; const messages = [];
  const monkeyGuide = {
    setDialogueOverride(value) { override = value; }, hasDialogueOverride: () => Boolean(override),
    notifyAttention() { attention += 1; }, showMessage(value) { messages.push(value); }, open() { opened += 1; }
  };
  const actor = createVrPostRingMonkeyDialogue({ monkeyGuide, onCompleted: () => { completed += 1; } });
  return { actor, getOverride: () => override, messages, getAttention: () => attention,
    getCompleted: () => completed, getOpened: () => opened };
}

const value = fixture();
assert.equal(value.actor.begin(), true); assert.equal(value.actor.begin(), false, 'authored effect is idempotent');
assert.equal(value.getAttention(), 1); assert.equal(value.getCompleted(), 0, 'attention never completes 3.30');
assert.deepEqual(value.getOverride().options, [], 'dialogue stays closed until conscious Monkey interaction');
value.getOverride().onMonkeyPress();
assert.deepEqual(value.messages, [VR_POST_RING_MONKEY_DIALOGUE_COPY[0]]);
value.getOverride().onSelect('post-ring-next'); value.getOverride().onSelect('post-ring-next');
assert.deepEqual(value.messages, VR_POST_RING_MONKEY_DIALOGUE_COPY, 'canonical lines retain exact order and copy');
assert.equal(value.getCompleted(), 0, 'third line awaits acknowledgement');
value.getOverride().onSelect('post-ring-next');
assert.equal(value.getCompleted(), 1); assert.equal(value.getOpened(), 1, 'existing contextual menu is restored');
assert.equal(value.getOverride(), null); assert.equal(value.actor.begin(), false, 'completed dialogue cannot restart');

for (const active of [false, true]) {
  const reset = fixture(); reset.actor.begin(); if (active) reset.getOverride().onMonkeyPress(); reset.actor.reset();
  assert.equal(reset.getOverride(), null); assert.equal(reset.getCompleted(), 0, 'reset never emits completion');
}
assert.deepEqual(VR_POST_RING_MONKEY_DIALOGUE_COPY, [
  'No i świat przestał być uprzejmy.',
  'To, czego potrzebujesz, jest teraz poza zasięgiem.',
  'Na szczęście nie na długo.'
]);
console.log('VR post-ring Monkey dialogue assertions passed.');
