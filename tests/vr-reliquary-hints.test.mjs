import assert from 'node:assert/strict';
import { createVrReliquaryHints, VR_RELIQUARY_HINT_COPY } from '../src/xr/guidance/createVrReliquaryHints.js';

let crystal = null, attention = 0, override = null, timeouts = 0;
const messages = [];
const monkeyGuide = {
  notifyAttention: () => { attention += 1; },
  setDialogueOverride: (value) => { override = value; },
  showMessage: (value) => messages.push(value)
};
const hints = createVrReliquaryHints({
  monkeyGuide, locale: 'pl', getInsertedInstance: () => crystal,
  onHintTimeout: () => { timeouts += 1; }
});

hints.update(100); assert.equal(timeouts, 0, 'no actionable crystal means no timeout');
crystal = { state: 'inserted' };
hints.update(14.9); assert.equal(timeouts, 0);
hints.update(0.1); assert.equal(timeouts, 1);
assert.equal(attention, 0, 'the semantic timeout does not present Monkey narrative directly');
assert.equal(override, null);
assert.equal(hints.showHint(), true); assert.equal(attention, 1);
assert.equal(hints.showHint(), false, 'accepted continuation is one-shot');
override.onMonkeyPress(); assert.equal(messages.at(-1), VR_RELIQUARY_HINT_COPY.pl.inserted);
hints.update(30); assert.equal(timeouts, 1, 'Activate timeout is one-shot per phase');

crystal.state = 'active';
hints.update(14.9); assert.equal(timeouts, 1, 'Activate starts a fresh Release timer');
hints.update(0.1); assert.equal(timeouts, 2);
assert.equal(attention, 1, 'Release timeout also stops at the semantic seam');
assert.equal(hints.showHint(), true); assert.equal(attention, 2);
override.onMonkeyPress(); assert.equal(messages.at(-1), VR_RELIQUARY_HINT_COPY.pl.active);
crystal = null; hints.update(30); assert.equal(timeouts, 2, 'Release prevents a delayed timeout');

crystal = { state: 'inserted' }; hints.update(14.9); crystal.state = 'active'; hints.update(0.1);
assert.equal(timeouts, 2, 'Activate before timeout cancels its callback');
crystal = null; hints.update(30); assert.equal(timeouts, 2, 'Release before timeout cancels its callback');

crystal = { state: 'inserted' }; hints.update(10); hints.reset(); crystal = null; hints.update(10);
assert.deepEqual(hints.getSnapshot(), { instance: null, phase: null, elapsed: 0, fired: false, shown: false });
crystal = { state: 'inserted' }; hints.update(15);
assert.equal(timeouts, 3, 'reset/re-entry restores readiness for a new cycle');
crystal.state = 'active'; hints.update(0);
assert.equal(hints.showHint(), false, 'a continuation from the previous phase cannot leak after Activate');
assert.equal(attention, 2);
console.log('VR reliquary hint assertions passed');
