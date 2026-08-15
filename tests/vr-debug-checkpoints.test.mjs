import assert from 'node:assert/strict';
import { createVrDebugCheckpointController } from '../src/xr/progression/enterVrDebugCheckpoint.js';
import { VR_DEBUG_CHECKPOINTS, resolveVrDebugCheckpoint } from '../src/xr/progression/vrDebugCheckpoints.js';
import { vrExperienceScenario } from '../src/xr/progression/vrExperienceScenario.js';

assert.deepEqual(VR_DEBUG_CHECKPOINTS.map(({ id, pointId }) => [id, pointId]),
  [['P0', '1.10'], ['P1', '2.10'], ['P2', '3.10']]);
assert.equal(VR_DEBUG_CHECKPOINTS.every(({ pointId }) => vrExperienceScenario.spine.includes(pointId)), true);
assert.equal(VR_DEBUG_CHECKPOINTS.some(({ id }) => id === 'P3' || id === 'P4'), false);
assert.throws(() => resolveVrDebugCheckpoint('P3'), /Unknown VR debug checkpoint/);

const order = [];
let currentDirector = null;
const runtime = { replaceDirector(director) { order.push(`replace:${director.pointId}`); currentDirector?.dispose(); currentDirector = director; } };
const enter = createVrDebugCheckpointController({ scenario: vrExperienceScenario, owners: {}, runtime,
  restoreBaseline() {}, spawnIntro() { order.push('spawn:INTRO'); }, spawnRing() { order.push('spawn:RING'); },
  startCanonicalIntro() { order.push('intro:start'); },
  prepareSession({ pointId }) {
    order.push('baseline', `reconstruct:${pointId}`, 'hydrate', `director:${pointId}`);
    return { state: Object.freeze({}), director: { pointId, dispose() {} } };
  }
});
for (const id of ['P0', 'P1', 'P2', 'P0', 'P2', 'P1']) {
  const start = order.length;
  const { checkpoint } = enter(id);
  const spawn = id === 'P0' ? ['spawn:INTRO', 'intro:start'] : ['spawn:RING'];
  assert.deepEqual(order.slice(start), ['baseline', `reconstruct:${checkpoint.pointId}`, 'hydrate',
    `director:${checkpoint.pointId}`, `replace:${checkpoint.pointId}`, ...spawn]);
  assert.equal(currentDirector.pointId, checkpoint.pointId);
}
console.log('VR debug checkpoint registry and switching assertions passed.');
