import assert from 'node:assert/strict';
import { createVrExperienceDirector } from '../src/xr/progression/createVrExperienceDirector.js';
import { ExperienceDirector } from '../src/xr/progression/ExperienceDirector.js';
import { VR_EXPERIENCE_POINT, VR_SCENARIO_EFFECT, VR_SCENARIO_EVENT, VR_SCENARIO_MILESTONE, vrExperienceScenario } from '../src/xr/progression/vrExperienceScenario.js';

assert.equal(Object.isFrozen(vrExperienceScenario), true);
assert.equal(vrExperienceScenario.points, vrExperienceScenario.scenes);
assert.equal(vrExperienceScenario.initialPointId, vrExperienceScenario.initialSceneId);
assert.deepEqual(vrExperienceScenario.points.map(({ id }) => id), ['1.10', '1.20', '1.30', '1.40', '1.50', '1.60', '1.70', '1.80', '1.100', '1.100.1', '1.110', '1.120', '1.120.1', '1.130', '100.10']);
assert.equal(Object.isFrozen(vrExperienceScenario.points[0]), true);
assert.equal(Object.isFrozen(vrExperienceScenario.points[0].transitions[0]), true);
assert.equal(Object.isFrozen(vrExperienceScenario.points[0].transitions[0].effects), true);
assert.equal(Object.isFrozen(vrExperienceScenario.metadata.authoritativeScope), true);
assert.equal(Object.isFrozen(vrExperienceScenario.points[2].transitions[0]), true);
assert.equal(Object.isFrozen(vrExperienceScenario.points[2].transitions[0].milestonesToAdd), true);
assert.equal(Object.isFrozen(vrExperienceScenario.points[3]), true);
assert.equal(vrExperienceScenario.metadata.stage, 'M1_12_CANONICAL_STORY_REINDEX');
assert.deepEqual(vrExperienceScenario.metadata.authoritativeScope, [
  'XR_CALIBRATED → BEGIN_INTRO_REVEAL',
  'INTRO_REVEAL_COMPLETE → BEGIN_POST_REVEAL_SILENCE',
  'POST_REVEAL_SILENCE_COMPLETE → BEGIN_CONTROLLER_ONBOARDING',
  'PLAYER_OPENED_GUIDE → CONTINUE_CONTROLLER_ONBOARDING',
  'PLAYER_VIEWED_CONTROLS → CONTINUE_CONTROLLER_ONBOARDING',
  'PLAYER_CLOSED_GUIDE → CONTINUE_CONTROLLER_ONBOARDING',
  'MONKEY_HOVERED → CONTINUE_CONTROLLER_ONBOARDING',
  'MONKEY_TRIGGERED → CONTINUE_CONTROLLER_ONBOARDING',
  'INTRO_INVITATION_SELECTED / choice 1 → 1.110',
  'MONKEY_REACHED_THRESHOLD → PRESENT_THRESHOLD_CHOICE → 1.120',
  'THRESHOLD_SELECTED / choice 1 → 1.130',
  'THRESHOLD_SELECTED / choice 2 → 1.120.1',
  'THRESHOLD_SELECTED / choice 3 → 100.10',
  'INTRO_INVITATION_SELECTED / choice 2 → 1.100.1',
  'INTRO_INVITATION_SELECTED / choice 3 → 100.10'
]);
assert.equal(
  createVrExperienceDirector({ scenario: vrExperienceScenario }).getCurrentPointId(),
  vrExperienceScenario.initialPointId
);
const productionDirector = new ExperienceDirector({ scenario: vrExperienceScenario });
const factoryDirector = createVrExperienceDirector({ scenario: vrExperienceScenario });
assert.equal(factoryDirector instanceof ExperienceDirector, true);
const productionChange = productionDirector.dispatch(VR_SCENARIO_EVENT.XR_CALIBRATED);
const factoryChange = factoryDirector.dispatch(VR_SCENARIO_EVENT.XR_CALIBRATED);
assert.deepEqual(factoryChange, productionChange, 'constructor and compatibility factory share semantics');
assert.equal(productionChange.previousPointId, VR_EXPERIENCE_POINT['1.10']);
assert.equal(productionChange.currentPointId, VR_EXPERIENCE_POINT['1.20']);
assert.equal(Object.isFrozen(productionChange), true);
assert.deepEqual(productionChange.addedMilestones, [VR_SCENARIO_MILESTONE.XR_CALIBRATED]);
assert.deepEqual(productionChange.effects, [VR_SCENARIO_EFFECT.BEGIN_INTRO_REVEAL]);
assert.equal(productionDirector.dispatch(VR_SCENARIO_EVENT.XR_CALIBRATED), null);
assert.equal(new ExperienceDirector({ scenario: vrExperienceScenario }).dispatch(VR_SCENARIO_EVENT.POST_REVEAL_SILENCE_COMPLETE), null,
  'silence completion is rejected before its scene');
assert.equal(new ExperienceDirector({ scenario: vrExperienceScenario }).dispatch(VR_SCENARIO_EVENT.PLAYER_OPENED_GUIDE), null,
  'guide opening is rejected before point 1.40');
assert.equal(new ExperienceDirector({ scenario: vrExperienceScenario }).dispatch(VR_SCENARIO_EVENT.PLAYER_VIEWED_CONTROLS), null,
  'controls viewed is rejected before point 1.50');
assert.equal(new ExperienceDirector({ scenario: vrExperienceScenario }).dispatch(VR_SCENARIO_EVENT.PLAYER_CLOSED_GUIDE), null,
  'guide closing is rejected before point 1.60');
assert.equal(new ExperienceDirector({ scenario: vrExperienceScenario }).dispatch(VR_SCENARIO_EVENT.MONKEY_HOVERED), null,
  'Monkey hover is rejected before point 1.70');
assert.equal(new ExperienceDirector({ scenario: vrExperienceScenario }).dispatch(VR_SCENARIO_EVENT.MONKEY_TRIGGERED), null,
  'Monkey trigger is rejected before point 1.80');
const revealCompleteChange = productionDirector.dispatch(VR_SCENARIO_EVENT.INTRO_REVEAL_COMPLETE);
assert.equal(revealCompleteChange.currentPointId, VR_EXPERIENCE_POINT['1.30']);
assert.deepEqual(revealCompleteChange.addedMilestones, [VR_SCENARIO_MILESTONE.INTRO_REVEAL_COMPLETE]);
assert.deepEqual(revealCompleteChange.effects, [VR_SCENARIO_EFFECT.BEGIN_POST_REVEAL_SILENCE]);
assert.equal(productionDirector.dispatch(VR_SCENARIO_EVENT.INTRO_REVEAL_COMPLETE), null, 'completion transition is accepted once');
const silenceCompleteChange = productionDirector.dispatch(VR_SCENARIO_EVENT.POST_REVEAL_SILENCE_COMPLETE);
assert.equal(silenceCompleteChange.currentPointId, VR_EXPERIENCE_POINT['1.40']);
assert.deepEqual(silenceCompleteChange.addedMilestones, [VR_SCENARIO_MILESTONE.POST_REVEAL_SILENCE_COMPLETE]);
assert.deepEqual(silenceCompleteChange.effects, [VR_SCENARIO_EFFECT.BEGIN_CONTROLLER_ONBOARDING]);
assert.equal(productionDirector.dispatch(VR_SCENARIO_EVENT.POST_REVEAL_SILENCE_COMPLETE), null, 'silence completion is accepted once');
const guideOpenChange = productionDirector.dispatch(VR_SCENARIO_EVENT.PLAYER_OPENED_GUIDE);
assert.equal(guideOpenChange.currentPointId, VR_EXPERIENCE_POINT['1.50']);
assert.deepEqual(guideOpenChange.addedMilestones, []);
assert.deepEqual(guideOpenChange.effects, [VR_SCENARIO_EFFECT.CONTINUE_CONTROLLER_ONBOARDING]);
assert.equal(productionDirector.dispatch(VR_SCENARIO_EVENT.PLAYER_OPENED_GUIDE), null, 'guide opening is accepted once');
const controlsViewedChange = productionDirector.dispatch(VR_SCENARIO_EVENT.PLAYER_VIEWED_CONTROLS);
assert.equal(controlsViewedChange.currentPointId, VR_EXPERIENCE_POINT['1.60']);
assert.deepEqual(controlsViewedChange.addedMilestones, [VR_SCENARIO_MILESTONE.PLAYER_VIEWED_CONTROLS]);
assert.deepEqual(controlsViewedChange.effects, [VR_SCENARIO_EFFECT.CONTINUE_CONTROLLER_ONBOARDING]);
assert.equal(productionDirector.dispatch(VR_SCENARIO_EVENT.PLAYER_VIEWED_CONTROLS), null, 'controls viewed is accepted once');
const guideClosedChange = productionDirector.dispatch(VR_SCENARIO_EVENT.PLAYER_CLOSED_GUIDE);
assert.equal(guideClosedChange.currentPointId, VR_EXPERIENCE_POINT['1.70']);
assert.deepEqual(guideClosedChange.addedMilestones, []);
assert.deepEqual(guideClosedChange.effects, [VR_SCENARIO_EFFECT.CONTINUE_CONTROLLER_ONBOARDING]);
assert.equal(productionDirector.dispatch(VR_SCENARIO_EVENT.PLAYER_CLOSED_GUIDE), null, 'guide closing is accepted once');
const monkeyHoveredChange = productionDirector.dispatch(VR_SCENARIO_EVENT.MONKEY_HOVERED);
assert.equal(monkeyHoveredChange.currentPointId, VR_EXPERIENCE_POINT['1.80']);
assert.deepEqual(monkeyHoveredChange.addedMilestones, []);
assert.deepEqual(monkeyHoveredChange.effects, [VR_SCENARIO_EFFECT.CONTINUE_CONTROLLER_ONBOARDING]);
assert.equal(productionDirector.dispatch(VR_SCENARIO_EVENT.MONKEY_HOVERED), null, 'Monkey hover is accepted once');
const monkeyTriggeredChange = productionDirector.dispatch(VR_SCENARIO_EVENT.MONKEY_TRIGGERED);
assert.equal(monkeyTriggeredChange.currentPointId, VR_EXPERIENCE_POINT['1.100']);
assert.deepEqual(monkeyTriggeredChange.addedMilestones, []);
assert.deepEqual(monkeyTriggeredChange.effects, [VR_SCENARIO_EFFECT.CONTINUE_CONTROLLER_ONBOARDING]);
assert.equal(productionDirector.dispatch(VR_SCENARIO_EVENT.MONKEY_TRIGGERED), null, 'Monkey trigger is accepted once and 1.100 is terminal');
for (const payload of [undefined, { choice: 4 }, { choice: '1' }]) assert.equal(productionDirector.dispatch(VR_SCENARIO_EVENT.INTRO_INVITATION_SELECTED, payload), null);
const goChange = productionDirector.dispatch(VR_SCENARIO_EVENT.INTRO_INVITATION_SELECTED, { choice: 1 });
assert.equal(goChange.currentPointId, VR_EXPERIENCE_POINT['1.110']);
assert.deepEqual(goChange.effects, [VR_SCENARIO_EFFECT.CONTINUE_INTRO_INVITATION]);
assert.deepEqual(goChange.addedMilestones, []);
const thresholdChange = productionDirector.dispatch(VR_SCENARIO_EVENT.MONKEY_REACHED_THRESHOLD);
assert.equal(thresholdChange.previousPointId, VR_EXPERIENCE_POINT['1.110']);
assert.equal(thresholdChange.currentPointId, VR_EXPERIENCE_POINT['1.120']);
assert.deepEqual(thresholdChange.addedMilestones, []);
assert.deepEqual(thresholdChange.effects, [VR_SCENARIO_EFFECT.PRESENT_THRESHOLD_CHOICE]);
assert.equal(productionDirector.dispatch(VR_SCENARIO_EVENT.MONKEY_REACHED_THRESHOLD), null, 'threshold arrival is accepted exactly once');
for (const payload of [undefined, {}, { choice: 4 }, { choice: '1' }]) assert.equal(productionDirector.dispatch(VR_SCENARIO_EVENT.THRESHOLD_SELECTED, payload), null);
const crossChange = productionDirector.dispatch(VR_SCENARIO_EVENT.THRESHOLD_SELECTED, { choice: 1 });
assert.equal(crossChange.currentPointId, VR_EXPERIENCE_POINT['1.130']);
assert.deepEqual(crossChange.effects, [VR_SCENARIO_EFFECT.CONTINUE_THRESHOLD_CHOICE]);
assert.deepEqual(crossChange.addedMilestones, []);
assert.equal(productionDirector.dispatch(VR_SCENARIO_EVENT.THRESHOLD_SELECTED, { choice: 1 }), null, 'CROSS terminal rejects duplicates');
const reachInvitation = (director) => {
  director.resetSession();
  for (const event of [VR_SCENARIO_EVENT.XR_CALIBRATED, VR_SCENARIO_EVENT.INTRO_REVEAL_COMPLETE, VR_SCENARIO_EVENT.POST_REVEAL_SILENCE_COMPLETE, VR_SCENARIO_EVENT.PLAYER_OPENED_GUIDE, VR_SCENARIO_EVENT.PLAYER_VIEWED_CONTROLS, VR_SCENARIO_EVENT.PLAYER_CLOSED_GUIDE, VR_SCENARIO_EVENT.MONKEY_HOVERED, VR_SCENARIO_EVENT.MONKEY_TRIGGERED]) assert.notEqual(director.dispatch(event), null);
};
reachInvitation(productionDirector);
assert.equal(productionDirector.dispatch(VR_SCENARIO_EVENT.MONKEY_REACHED_THRESHOLD), null, 'threshold arrival is rejected before FOLLOWING');
assert.equal(productionDirector.dispatch(VR_SCENARIO_EVENT.INTRO_INVITATION_SELECTED, { choice: 2 }).currentPointId, VR_EXPERIENCE_POINT['1.100.1']);
assert.equal(productionDirector.dispatch(VR_SCENARIO_EVENT.MONKEY_REACHED_THRESHOLD), null, 'WHERE branch rejects threshold arrival');
assert.equal(productionDirector.dispatch(VR_SCENARIO_EVENT.INTRO_INVITATION_SELECTED, { choice: 2 }).currentPointId, VR_EXPERIENCE_POINT['1.100.1'], 'choice 2 is an explicit accepted self-loop');
assert.equal(productionDirector.dispatch(VR_SCENARIO_EVENT.INTRO_INVITATION_SELECTED, { choice: 1 }).currentPointId, VR_EXPERIENCE_POINT['1.110']);
assert.notEqual(productionDirector.dispatch(VR_SCENARIO_EVENT.MONKEY_REACHED_THRESHOLD), null);
reachInvitation(productionDirector);
assert.equal(productionDirector.dispatch(VR_SCENARIO_EVENT.INTRO_INVITATION_SELECTED, { choice: 1 }).currentPointId, VR_EXPERIENCE_POINT['1.110']);
assert.notEqual(productionDirector.dispatch(VR_SCENARIO_EVENT.MONKEY_REACHED_THRESHOLD), null, 'reset/re-entry permits threshold arrival again');
reachInvitation(productionDirector);
assert.equal(productionDirector.dispatch(VR_SCENARIO_EVENT.INTRO_INVITATION_SELECTED, { choice: 3 }).currentPointId, VR_EXPERIENCE_POINT['100.10']);
assert.equal(productionDirector.dispatch(VR_SCENARIO_EVENT.INTRO_INVITATION_SELECTED, { choice: 1 }), null, '100.10 is terminal');
assert.equal(productionDirector.dispatch(VR_SCENARIO_EVENT.MONKEY_REACHED_THRESHOLD), null, '100.10 rejects threshold arrival');
reachInvitation(productionDirector);
productionDirector.dispatch(VR_SCENARIO_EVENT.INTRO_INVITATION_SELECTED, { choice: 2 });
assert.equal(productionDirector.dispatch(VR_SCENARIO_EVENT.INTRO_INVITATION_SELECTED, { choice: 3 }).currentPointId, VR_EXPERIENCE_POINT['100.10']);
reachInvitation(productionDirector);
productionDirector.dispatch(VR_SCENARIO_EVENT.INTRO_INVITATION_SELECTED, { choice: 1 });
productionDirector.dispatch(VR_SCENARIO_EVENT.MONKEY_REACHED_THRESHOLD);
assert.equal(productionDirector.dispatch(VR_SCENARIO_EVENT.THRESHOLD_SELECTED, { choice: 2 }).currentPointId, VR_EXPERIENCE_POINT['1.120.1']);
assert.equal(productionDirector.dispatch(VR_SCENARIO_EVENT.THRESHOLD_SELECTED, { choice: 2 }).currentPointId, VR_EXPERIENCE_POINT['1.120.1']);
assert.equal(productionDirector.dispatch(VR_SCENARIO_EVENT.THRESHOLD_SELECTED, { choice: 3 }).currentPointId, VR_EXPERIENCE_POINT['100.10']);
assert.equal(productionDirector.dispatch(VR_SCENARIO_EVENT.THRESHOLD_SELECTED, { choice: 1 }), null);
productionDirector.resetSession();
assert.equal(productionDirector.hasMilestone(VR_SCENARIO_MILESTONE.XR_CALIBRATED), true);
assert.equal(productionDirector.hasMilestone(VR_SCENARIO_MILESTONE.POST_REVEAL_SILENCE_COMPLETE), true);
assert.notEqual(productionDirector.dispatch(VR_SCENARIO_EVENT.XR_CALIBRATED), null);
assert.notEqual(productionDirector.dispatch(VR_SCENARIO_EVENT.INTRO_REVEAL_COMPLETE), null);
assert.notEqual(productionDirector.dispatch(VR_SCENARIO_EVENT.POST_REVEAL_SILENCE_COMPLETE), null,
  'session reset permits the complete chain again');
assert.notEqual(productionDirector.dispatch(VR_SCENARIO_EVENT.PLAYER_OPENED_GUIDE), null,
  'session reset permits the guide-open handoff again');
assert.notEqual(productionDirector.dispatch(VR_SCENARIO_EVENT.PLAYER_VIEWED_CONTROLS), null,
  'session reset permits the controls-viewed handoff again');
assert.notEqual(productionDirector.dispatch(VR_SCENARIO_EVENT.PLAYER_CLOSED_GUIDE), null,
  'session reset permits the complete guide-close handoff again');
assert.notEqual(productionDirector.dispatch(VR_SCENARIO_EVENT.MONKEY_HOVERED), null,
  'session reset permits the Monkey-hover handoff again');
assert.notEqual(productionDirector.dispatch(VR_SCENARIO_EVENT.MONKEY_TRIGGERED), null,
  'session reset permits the Monkey-trigger handoff again');
assert.equal(productionDirector.hasMilestone(VR_SCENARIO_MILESTONE.PLAYER_VIEWED_CONTROLS), true);
productionDirector.resetSession({ hard: true });
assert.equal(productionDirector.hasMilestone(VR_SCENARIO_MILESTONE.XR_CALIBRATED), false);
assert.equal(productionDirector.hasMilestone(VR_SCENARIO_MILESTONE.POST_REVEAL_SILENCE_COMPLETE), false);
assert.equal(productionDirector.hasMilestone(VR_SCENARIO_MILESTONE.PLAYER_VIEWED_CONTROLS), false);

const vocabulary = Object.freeze({
  events: Object.freeze(['GO', 'RETURN', 'IGNORED']),
  capabilities: Object.freeze(['CAN_START', 'CAN_FINISH']),
  milestones: Object.freeze(['ARRIVED']),
  effects: Object.freeze(['REVEAL'])
});
const scenario = Object.freeze({
  id: 'test-scenario',
  initialPointId: 'A',
  vocabulary,
  points: Object.freeze([
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

assert.equal(director.getCurrentPointId(), 'A');
assert.equal(director.can('CAN_START'), true);
assert.equal(director.can('CAN_FINISH'), false);
assert.equal(director.dispatch('IGNORED'), null);
assert.equal(director.getCurrentPointId(), 'A');

const changes = [];
const unsubscribe = director.subscribe((change) => changes.push(change));
const actor = { calls: 0, reveal() { this.calls += 1; } };
const accepted = director.dispatch('GO', { source: 'fixture' });
assert.equal(director.getCurrentPointId(), 'B');
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
assert.equal(snapshot.currentPointId, 'B');
assert.equal('sceneId' in snapshot, false);
assert.deepEqual(snapshot.lastEvent, { type: 'GO', payload: null });

director.resetSession();
assert.equal(director.getCurrentPointId(), 'A');
assert.equal(director.hasMilestone('ARRIVED'), true, 'session reset preserves committed history');
director.resetSession({ hard: true });
assert.equal(director.getCurrentPointId(), 'A');
assert.equal(director.hasMilestone('ARRIVED'), false, 'hard reset starts a new game');
unsubscribe();
director.dispose();

const legacyScenario = Object.freeze({ ...scenario, initialPointId: undefined, points: undefined,
  initialSceneId: scenario.initialPointId, scenes: scenario.points });
const legacyDirector = createVrExperienceDirector({ scenario: legacyScenario });
assert.equal(legacyDirector.getCurrentSceneId(), 'A', 'legacy getter delegates to canonical point state');
assert.equal(legacyDirector.getCurrentPointId(), 'A');
legacyDirector.dispatch('GO');
assert.equal(legacyDirector.getCurrentSceneId(), 'B');

assert.throws(() => createVrExperienceDirector({ scenario: { ...scenario, initialPointId: 'MISSING' } }), /initial point/);
assert.throws(() => createVrExperienceDirector({ scenario: {
  ...scenario,
  points: [{ id: 'A', capabilities: ['CAN_START'], transitions: [{ event: 'GO', target: 'MISSING' }] }]
} }), /transition target/);
assert.throws(() => createVrExperienceDirector({ scenario: {
  ...scenario,
  points: [{ id: 'A', capabilities: ['UNKNOWN'], transitions: [] }]
} }), /unknown capability/);
assert.throws(() => createVrExperienceDirector({ scenario: {
  ...scenario,
  points: [{ id: 'A', capabilities: [], transitions: [
    { event: 'GO', target: 'A' },
    { event: 'GO', target: 'A' }
  ] }]
} }), /duplicate transition/);

const choiceScenario = {
  initialPointId: '2.6.3',
  vocabulary: { events: ['SELECTED'], capabilities: [], milestones: ['SECOND_SELECTED'], effects: ['SECOND_EFFECT'] },
  points: [
    { id: '2.6.3', capabilities: [], transitions: [
      { event: 'SELECTED', choice: 1, target: '2.6.3.1', milestonesToAdd: [], effects: [] },
      { event: 'SELECTED', choice: 2, target: '2.6.3.2', milestonesToAdd: ['SECOND_SELECTED'], effects: ['SECOND_EFFECT'] },
      { event: 'SELECTED', choice: 3, target: '7.4.9', milestonesToAdd: [], effects: [] }
    ] },
    { id: '2.6.3.1', capabilities: [], transitions: [] },
    { id: '2.6.3.2', capabilities: [], transitions: [] },
    { id: '7.4.9', capabilities: [], transitions: [] }
  ]
};
const choiceDirector = new ExperienceDirector({ scenario: choiceScenario });
const choiceChanges = [];
choiceDirector.subscribe((change) => choiceChanges.push(change));
for (const payload of [undefined, null, {}, { choice: 0 }, { choice: -1 }, { choice: 1.5 }, { choice: '2' }, { choice: 4 }]) {
  assert.equal(choiceDirector.dispatch('SELECTED', payload), null);
  assert.equal(choiceDirector.getCurrentPointId(), '2.6.3');
}
assert.equal(choiceChanges.length, 0, 'unmatched choices do not notify subscribers');
const choicePayload = { choice: 2 };
const choiceChange = choiceDirector.dispatch('SELECTED', choicePayload);
assert.equal(choiceChange.currentPointId, '2.6.3.2');
assert.equal(choiceChange.event.type, 'SELECTED');
assert.equal(choiceChange.event.payload, choicePayload);
assert.equal(choiceChange.event.payload.choice, 2);
assert.deepEqual(choiceChange.addedMilestones, ['SECOND_SELECTED']);
assert.deepEqual(choiceChange.effects, ['SECOND_EFFECT']);
assert.equal(choiceChanges.length, 1, 'only an accepted choice notifies subscribers');

const explicitTargetDirector = new ExperienceDirector({ scenario: choiceScenario });
assert.equal(explicitTargetDirector.dispatch('SELECTED', { choice: 3 }).currentPointId, '7.4.9',
  'choice selects the Scenario transition but never derives its target');

const choiceValidationScenario = (transitions) => ({
  initialPointId: 'A',
  vocabulary: { events: ['SELECTED'], capabilities: [], milestones: [], effects: [] },
  points: [{ id: 'A', capabilities: [], transitions }]
});
assert.throws(() => new ExperienceDirector({ scenario: choiceValidationScenario([
  { event: 'SELECTED', choice: 1, target: 'A' }, { event: 'SELECTED', choice: 1, target: 'A' }
]) }), /duplicate transition event and choice/);
assert.throws(() => new ExperienceDirector({ scenario: choiceValidationScenario([
  { event: 'SELECTED', target: 'A' }, { event: 'SELECTED', choice: 1, target: 'A' }
]) }), /cannot mix choice-routed and event-only transitions/);
for (const invalidChoice of [0, -1, 1.5, '1']) {
  assert.throws(() => new ExperienceDirector({ scenario: choiceValidationScenario([
    { event: 'SELECTED', choice: invalidChoice, target: 'A' }
  ]) }), /choice must be a positive integer/);
}

console.log('VR experience Director assertions passed');
