import assert from 'node:assert/strict';
import { createVrReliquaryHints, VR_RELIQUARY_HINT_COPY } from '../src/xr/guidance/createVrReliquaryHints.js';

let crystal = null, attention = 0, override = null;
const messages = [];
const monkeyGuide = {
  notifyAttention: () => { attention += 1; },
  setDialogueOverride: (value) => { override = value; },
  showMessage: (value) => messages.push(value)
};
const hints = createVrReliquaryHints({ monkeyGuide, locale: 'pl', getInsertedInstance: () => crystal });

hints.update(100); assert.equal(attention, 0, 'no actionable crystal means no hint');
crystal = { state: 'inserted' };
hints.update(14.9); assert.equal(attention, 0);
hints.update(0.1); assert.equal(attention, 1);
override.onMonkeyPress(); assert.equal(messages.at(-1), VR_RELIQUARY_HINT_COPY.pl.inserted);
hints.update(30); assert.equal(attention, 1, 'Activate hint is one-shot per cycle');

crystal.state = 'active';
hints.update(14.9); assert.equal(attention, 1, 'Activate starts a fresh Release timer');
hints.update(0.1); assert.equal(attention, 2);
override.onMonkeyPress(); assert.equal(messages.at(-1), VR_RELIQUARY_HINT_COPY.pl.active);
crystal = null; hints.update(30); assert.equal(attention, 2, 'Release prevents a delayed hint');

crystal = { state: 'inserted' }; hints.update(14.9); crystal.state = 'active'; hints.update(0.1);
assert.equal(attention, 2, 'Activate before timeout cancels its hint');
crystal = null; hints.update(30); assert.equal(attention, 2, 'Release before timeout cancels its hint');

crystal = { state: 'inserted' }; hints.update(10); hints.reset(); crystal = null; hints.update(10);
assert.deepEqual(hints.getSnapshot(), { instance: null, phase: null, elapsed: 0, fired: false });
assert.equal(attention, 2, 'session reset clears timers and one-shot flags');
console.log('VR reliquary hint assertions passed');
