import assert from 'node:assert/strict';
import { createVrExperienceDirector } from '../src/xr/progression/createVrExperienceDirector.js';
import { vrExperienceScenario } from '../src/xr/progression/vrExperienceScenario.js';

assert.equal(Object.isFrozen(vrExperienceScenario), true);
assert.equal(Object.isFrozen(vrExperienceScenario.scenes[0]), true);
assert.equal(
  createVrExperienceDirector({ scenario: vrExperienceScenario }).getCurrentSceneId(),
  vrExperienceScenario.initialSceneId
);

const vocabulary = Object.freeze({
  events: Object.freeze(['GO', 'RETURN', 'IGNORED']),
  capabilities: Object.freeze(['CAN_START', 'CAN_FINISH']),
  milestones: Object.freeze(['ARRIVED']),
  effects: Object.freeze(['REVEAL'])
});
const scenario = Object.freeze({
  id: 'test-scenario',
  initialSceneId: 'A',
  vocabulary,
  scenes: Object.freeze([
    Object.freeze({
      id: 'A',
      capabilities: Object.freeze(['CAN_START']),
      transitions: Object.freeze([
        Object.freeze({ event: 'GO', target: 'B', milestonesToAdd: Object.freeze(['ARRIVED']), effects: Object.freeze(['REVEAL']) })
      ])
    }),
    Object.freeze({
      id: 'B',
      capabilities: Object.freeze(['CAN_FINISH']),
      transitions: Object.freeze([
        Object.freeze({ event: 'RETURN', target: 'A', milestonesToAdd: Object.freeze([]), effects: Object.freeze([]) })
      ])
    })
  ])
});
const scenarioBefore = JSON.stringify(scenario);
const director = createVrExperienceDirector({ scenario });

assert.equal(director.getCurrentSceneId(), 'A');
assert.equal(director.can('CAN_START'), true);
assert.equal(director.can('CAN_FINISH'), false);
assert.equal(director.dispatch('IGNORED'), null);
assert.equal(director.getCurrentSceneId(), 'A');

const changes = [];
const unsubscribe = director.subscribe((change) => changes.push(change));
const actor = { calls: 0, reveal() { this.calls += 1; } };
const accepted = director.dispatch('GO', { source: 'fixture' });
assert.equal(director.getCurrentSceneId(), 'B');
assert.equal(director.can('CAN_START'), false);
assert.equal(director.can('CAN_FINISH'), true);
assert.equal(director.hasMilestone('ARRIVED'), true);
assert.deepEqual(accepted.effects, ['REVEAL']);
assert.equal(actor.calls, 0, 'symbolic effects do not execute actors');
assert.equal(changes.length, 1);
assert.deepEqual(changes[0].addedMilestones, ['ARRIVED']);

director.dispatch('RETURN');
director.dispatch('GO');
assert.equal(director.hasMilestone('ARRIVED'), true, 'milestones are monotonic');
assert.deepEqual(changes.at(-1).addedMilestones, [], 'a committed milestone is not added twice');
assert.equal(changes.length, 3, 'only accepted transitions notify subscribers');
assert.equal(JSON.stringify(scenario), scenarioBefore, 'dispatch does not mutate scenario data');

const snapshot = director.getDebugSnapshot();
assert.doesNotThrow(() => JSON.parse(JSON.stringify(snapshot)));
assert.deepEqual(snapshot.lastEvent, { type: 'GO', payload: null });

director.resetSession();
assert.equal(director.getCurrentSceneId(), 'A');
assert.equal(director.hasMilestone('ARRIVED'), true, 'session reset preserves committed history');
director.resetSession({ hard: true });
assert.equal(director.getCurrentSceneId(), 'A');
assert.equal(director.hasMilestone('ARRIVED'), false, 'hard reset starts a new game');
unsubscribe();
director.dispose();

assert.throws(() => createVrExperienceDirector({ scenario: { ...scenario, initialSceneId: 'MISSING' } }), /initial scene/);
assert.throws(() => createVrExperienceDirector({ scenario: {
  ...scenario,
  scenes: [{ id: 'A', capabilities: ['CAN_START'], transitions: [{ event: 'GO', target: 'MISSING' }] }]
} }), /transition target/);
assert.throws(() => createVrExperienceDirector({ scenario: {
  ...scenario,
  scenes: [{ id: 'A', capabilities: ['UNKNOWN'], transitions: [] }]
} }), /unknown capability/);
assert.throws(() => createVrExperienceDirector({ scenario: {
  ...scenario,
  scenes: [{ id: 'A', capabilities: [], transitions: [
    { event: 'GO', target: 'A' },
    { event: 'GO', target: 'A' }
  ] }]
} }), /duplicate transition/);

console.log('VR experience Director assertions passed');
