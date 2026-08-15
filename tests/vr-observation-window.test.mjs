import assert from 'node:assert/strict';
import { createVrObservationWindow } from '../src/xr/progression/createVrObservationWindow.js';

let completions = 0;
const observation = createVrObservationWindow({ durationSeconds: 10, onCompleted: () => { completions += 1; } });

assert.equal(observation.begin(), true);
assert.equal(observation.running, true);
observation.update(9.99);
assert.equal(completions, 0, 'completion waits for the full duration');
assert.equal(observation.begin(), false, 'repeated begin does not restart a running window');
observation.update(0.01);
assert.equal(completions, 1);
assert.equal(observation.completed, true);
assert.equal(observation.begin(), false, 'a completed window cannot begin again in the same session');
observation.update(20);
assert.equal(completions, 1, 'completion remains one-shot');

observation.reset();
assert.equal(observation.begin(), true);
observation.update(4);
observation.reset();
observation.update(20);
assert.equal(completions, 1, 'reset cancels a running window without a late completion');
assert.equal(observation.running, false);
assert.equal(observation.completed, false);

assert.equal(observation.begin(), true);
observation.update(10);
assert.equal(completions, 2, 'reset permits a new full run');
observation.reset();
assert.equal(observation.begin(), true);
observation.update(10);
assert.equal(completions, 3, 'reset after completion prepares another session');

console.log('VR observation window assertions passed');
