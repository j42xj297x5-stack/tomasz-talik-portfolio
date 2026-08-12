import assert from 'node:assert/strict';
import { createVrExperienceDirector } from '../src/xr/progression/createVrExperienceDirector.js';
import { ExperienceDirector } from '../src/xr/progression/ExperienceDirector.js';
import { VR_EXPERIENCE_SCENE, VR_SCENARIO_EFFECT, VR_SCENARIO_EVENT, VR_SCENARIO_MILESTONE, vrExperienceScenario } from '../src/xr/progression/vrExperienceScenario.js';

assert.equal(Object.isFrozen(vrExperienceScenario), true);
assert.equal(Object.isFrozen(vrExperienceScenario.scenes[0]), true);
assert.equal(Object.isFrozen(vrExperienceScenario.scenes[0].transitions[0]), true);
assert.equal(Object.isFrozen(vrExperienceScenario.scenes[0].transitions[0].effects), true);
assert.equal(Object.isFrozen(vrExperienceScenario.metadata.authoritativeScope), true);
assert.equal(Object.isFrozen(vrExperienceScenario.scenes[2].transitions[0]), true);
assert.equal(Object.isFrozen(vrExperienceScenario.scenes[2].transitions[0].milestonesToAdd), true);
assert.equal(Object.isFrozen(vrExperienceScenario.scenes[3]), true);
assert.equal(vrExperienceScenario.metadata.stage, 'M1_3_POST_REVEAL_SILENCE_COMPLETION_HANDOFF');
assert.deepEqual(vrExperienceScenario.metadata.authoritativeScope, [
  'XR_CALIBRATED → BEGIN_INTRO_REVEAL',
  'INTRO_REVEAL_COMPLETE → BEGIN_POST_REVEAL_SILENCE',
  'POST_REVEAL_SILENCE_COMPLETE → BEGIN_CONTROLLER_ONBOARDING'
]);
assert.equal(
  createVrExperienceDirector({ scenario: vrExperienceScenario }).getCurrentSceneId(),
  vrExperienceScenario.initialSceneId
);
const productionDirector = new ExperienceDirector({ scenario: vrExperienceScenario });
const factoryDirector = createVrExperienceDirector({ scenario: vrExperienceScenario });
assert.equal(factoryDirector instanceof ExperienceDirector, true);
const productionChange = productionDirector.dispatch(VR_SCENARIO_EVENT.XR_CALIBRATED);
const factoryChange = factoryDirector.dispatch(VR_SCENARIO_EVENT.XR_CALIBRATED);
assert.deepEqual(factoryChange, productionChange, 'constructor and compatibility factory share semantics');
assert.equal(productionChange.currentSceneId, VR_EXPERIENCE_SCENE.P0_LEGACY_SEQUENCE_ACTIVE);
assert.deepEqual(productionChange.addedMilestones, [VR_SCENARIO_MILESTONE.XR_CALIBRATED]);
assert.deepEqual(productionChange.effects, [VR_SCENARIO_EFFECT.BEGIN_INTRO_REVEAL]);
assert.equal(productionDirector.dispatch(VR_SCENARIO_EVENT.XR_CALIBRATED), null);
assert.equal(new ExperienceDirector({ scenario: vrExperienceScenario }).dispatch(VR_SCENARIO_EVENT.POST_REVEAL_SILENCE_COMPLETE), null,
  'silence completion is rejected before its scene');
const revealCompleteChange = productionDirector.dispatch(VR_SCENARIO_EVENT.INTRO_REVEAL_COMPLETE);
assert.equal(revealCompleteChange.currentSceneId, VR_EXPERIENCE_SCENE.P0_LEGACY_POST_REVEAL_ACTIVE);
assert.deepEqual(revealCompleteChange.addedMilestones, [VR_SCENARIO_MILESTONE.INTRO_REVEAL_COMPLETE]);
assert.deepEqual(revealCompleteChange.effects, [VR_SCENARIO_EFFECT.BEGIN_POST_REVEAL_SILENCE]);
assert.equal(productionDirector.dispatch(VR_SCENARIO_EVENT.INTRO_REVEAL_COMPLETE), null, 'completion transition is accepted once');
const silenceCompleteChange = productionDirector.dispatch(VR_SCENARIO_EVENT.POST_REVEAL_SILENCE_COMPLETE);
assert.equal(silenceCompleteChange.currentSceneId, VR_EXPERIENCE_SCENE.P0_LEGACY_CONTROLLER_ONBOARDING_ACTIVE);
assert.deepEqual(silenceCompleteChange.addedMilestones, [VR_SCENARIO_MILESTONE.POST_REVEAL_SILENCE_COMPLETE]);
assert.deepEqual(silenceCompleteChange.effects, [VR_SCENARIO_EFFECT.BEGIN_CONTROLLER_ONBOARDING]);
assert.equal(productionDirector.dispatch(VR_SCENARIO_EVENT.POST_REVEAL_SILENCE_COMPLETE), null, 'silence completion is accepted once');
productionDirector.resetSession();
assert.equal(productionDirector.hasMilestone(VR_SCENARIO_MILESTONE.XR_CALIBRATED), true);
assert.equal(productionDirector.hasMilestone(VR_SCENARIO_MILESTONE.POST_REVEAL_SILENCE_COMPLETE), true);
assert.notEqual(productionDirector.dispatch(VR_SCENARIO_EVENT.XR_CALIBRATED), null);
assert.notEqual(productionDirector.dispatch(VR_SCENARIO_EVENT.INTRO_REVEAL_COMPLETE), null);
assert.notEqual(productionDirector.dispatch(VR_SCENARIO_EVENT.POST_REVEAL_SILENCE_COMPLETE), null,
  'session reset permits the complete chain again');
productionDirector.resetSession({ hard: true });
assert.equal(productionDirector.hasMilestone(VR_SCENARIO_MILESTONE.XR_CALIBRATED), false);
assert.equal(productionDirector.hasMilestone(VR_SCENARIO_MILESTONE.POST_REVEAL_SILENCE_COMPLETE), false);

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
