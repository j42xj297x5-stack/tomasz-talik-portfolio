import assert from 'node:assert/strict';
import { ExperienceDirector } from '../src/xr/progression/ExperienceDirector.js';
import { RuntimeExperience } from '../src/xr/progression/RuntimeExperience.js';
import { VR_SCENARIO_EFFECT, VR_SCENARIO_EVENT, vrExperienceScenario } from '../src/xr/progression/vrExperienceScenario.js';

const freeze = (value) => Object.freeze(value);
const scenario = freeze({ initialPointId: 'A', canonicalTerminalPointId: 'B', vocabulary: freeze({ events: freeze(['GO', 'IGNORED']),
  capabilities: freeze(['CAN_GO', 'CAN_DONE']), milestones: freeze(['DONE']), effects: freeze(['FIRST', 'SECOND']) }),
points: freeze([
  freeze({ id: 'A', canonicalMainline: freeze({ target: 'B' }), capabilities: freeze(['CAN_GO']), transitions: freeze([
    freeze({ kind: 'EXPLICIT', event: 'GO', target: 'B', milestonesToAdd: freeze(['DONE']), effects: freeze(['FIRST', 'SECOND']) })
  ]) }), freeze({ id: 'B', capabilities: freeze(['CAN_DONE']), transitions: freeze([]) })
]) });
const calls = []; const payload = { nested: { retained: true } };
const director = new ExperienceDirector({ scenario });
const runtime = new RuntimeExperience({ director, effectHandlers: {
  FIRST: (change, received) => calls.push(['FIRST', change, received]),
  SECOND: (change, received) => calls.push(['SECOND', change, received])
} });
assert.equal(runtime.can('CAN_GO'), true); assert.equal(runtime.getCurrentPointId(), 'A');
assert.equal(runtime.getCurrentSceneId(), 'A', 'legacy runtime getter delegates to point API');
assert.equal(runtime.dispatch('IGNORED'), null); assert.deepEqual(calls, []);
const change = runtime.dispatch('GO', payload);
assert.deepEqual(calls.map(([effect]) => effect), ['FIRST', 'SECOND']);
assert.equal(calls[0][1], change); assert.equal(calls[0][2], payload); assert.equal(calls[1][2], payload);
assert.equal(Object.isFrozen(change), true); assert.equal(runtime.can('CAN_DONE'), true);
assert.equal(runtime.hasMilestone('DONE'), true); assert.equal(runtime.getCurrentPointId(), 'B');
assert.deepEqual(runtime.getDebugSnapshot(), director.getDebugSnapshot());
runtime.resetSession(); assert.equal(runtime.hasMilestone('DONE'), true); assert.notEqual(runtime.dispatch('GO'), null);
runtime.resetSession({ hard: true }); assert.equal(runtime.hasMilestone('DONE'), false);
const choicePayload = { choice: 2, source: 'fixture' }; const choiceCalls = [];
const choiceScenario = freeze({ initialPointId: '2.6.3', canonicalTerminalPointId: '2.6.3', vocabulary: freeze({ events: freeze(['SELECTED']),
  capabilities: freeze([]), milestones: freeze([]), effects: freeze(['CHOICE_EFFECT']) }), points: freeze([
  freeze({ id: '2.6.3', capabilities: freeze([]), transitions: freeze([
    freeze({ kind: 'EXPLICIT', event: 'SELECTED', choice: 1, target: '2.6.3.1', effects: freeze([]) }),
    freeze({ kind: 'EXPLICIT', event: 'SELECTED', choice: 2, target: '7.4.9', effects: freeze(['CHOICE_EFFECT']) })
  ]) }), freeze({ id: '2.6.3.1', capabilities: freeze([]), transitions: freeze([]) }),
  freeze({ id: '7.4.9', capabilities: freeze([]), transitions: freeze([]) })
]) });
const choiceRuntime = new RuntimeExperience({ director: new ExperienceDirector({ scenario: choiceScenario }),
  effectHandlers: { CHOICE_EFFECT: (acceptedChoice, receivedPayload) => choiceCalls.push([acceptedChoice, receivedPayload]) } });
const choiceRuntimeChange = choiceRuntime.dispatch('SELECTED', choicePayload);
assert.equal(choiceRuntimeChange.currentPointId, '7.4.9');
assert.equal(choiceRuntimeChange.event.payload, choicePayload);
assert.equal(choiceCalls.length, 1); assert.equal(choiceCalls[0][0], choiceRuntimeChange);
assert.equal(choiceCalls[0][1], choicePayload, 'Runtime forwards the exact numeric-choice payload to effect handlers');
const missing = new RuntimeExperience({ director: new ExperienceDirector({ scenario }), effectHandlers: { FIRST() {} } });
assert.throws(() => missing.dispatch('GO'), /Missing effect handler: SECOND/);
let disposeCalls = 0; let dispatchCalls = 0;
const ownedDirector = { dispatch() { dispatchCalls += 1; return freeze({ effects: freeze([]) }); }, can() {}, hasMilestone() {},
  getCurrentPointId() {}, getDebugSnapshot() {}, resetSession() {}, dispose() { disposeCalls += 1; } };
const disposable = new RuntimeExperience({ director: ownedDirector }); disposable.dispose(); disposable.dispose();
assert.equal(disposeCalls, 1); assert.equal(disposable.dispatch('GO'), null); assert.equal(dispatchCalls, 0);
const productionCalls = []; const productionChoicePayloads = [];
const productionRuntime = new RuntimeExperience({ director: new ExperienceDirector({ scenario: vrExperienceScenario }), effectHandlers: {
  [VR_SCENARIO_EFFECT.BEGIN_INTRO_REVEAL]: () => productionCalls.push(VR_SCENARIO_EFFECT.BEGIN_INTRO_REVEAL),
  [VR_SCENARIO_EFFECT.BEGIN_POST_REVEAL_SILENCE]: () => productionCalls.push(VR_SCENARIO_EFFECT.BEGIN_POST_REVEAL_SILENCE),
  [VR_SCENARIO_EFFECT.BEGIN_CONTROLLER_ONBOARDING]: () => productionCalls.push(VR_SCENARIO_EFFECT.BEGIN_CONTROLLER_ONBOARDING),
  [VR_SCENARIO_EFFECT.CONTINUE_CONTROLLER_ONBOARDING]: () => productionCalls.push(VR_SCENARIO_EFFECT.CONTINUE_CONTROLLER_ONBOARDING),
  [VR_SCENARIO_EFFECT.BEGIN_INTRO_CRYSTAL_TUTORIAL]: () => productionCalls.push(VR_SCENARIO_EFFECT.BEGIN_INTRO_CRYSTAL_TUTORIAL),
  [VR_SCENARIO_EFFECT.BEGIN_INTRO_INVITATION]: () => productionCalls.push(VR_SCENARIO_EFFECT.BEGIN_INTRO_INVITATION),
  [VR_SCENARIO_EFFECT.PRESENT_THRESHOLD_CHOICE]: () => productionCalls.push(VR_SCENARIO_EFFECT.PRESENT_THRESHOLD_CHOICE),
  [VR_SCENARIO_EFFECT.APPLY_FOLLOW_PAUSE_STATE]: (change, payload) => { productionCalls.push(VR_SCENARIO_EFFECT.APPLY_FOLLOW_PAUSE_STATE); productionChoicePayloads.push(payload); },
  [VR_SCENARIO_EFFECT.CONTINUE_THRESHOLD_CHOICE]: (change, payload) => { productionCalls.push(VR_SCENARIO_EFFECT.CONTINUE_THRESHOLD_CHOICE); productionChoicePayloads.push(payload); },
  [VR_SCENARIO_EFFECT.CONTINUE_INTRO_INVITATION]: (change, payload) => { productionCalls.push(VR_SCENARIO_EFFECT.CONTINUE_INTRO_INVITATION); productionChoicePayloads.push(payload); }
} });
productionRuntime.dispatch(VR_SCENARIO_EVENT.XR_CALIBRATED);
productionRuntime.dispatch(VR_SCENARIO_EVENT.INTRO_REVEAL_COMPLETE);
productionRuntime.dispatch(VR_SCENARIO_EVENT.POST_REVEAL_SILENCE_COMPLETE);
productionRuntime.dispatch(VR_SCENARIO_EVENT.PLAYER_OPENED_GUIDE);
productionRuntime.dispatch(VR_SCENARIO_EVENT.PLAYER_VIEWED_CONTROLS);
productionRuntime.dispatch(VR_SCENARIO_EVENT.PLAYER_CLOSED_GUIDE);
productionRuntime.dispatch(VR_SCENARIO_EVENT.MONKEY_HOVERED);
productionRuntime.dispatch(VR_SCENARIO_EVENT.MONKEY_TRIGGERED);
productionRuntime.dispatch(VR_SCENARIO_EVENT.INTRO_CRYSTAL_TUTORIAL_COMPLETED);
const productionInvitationPayload = { choice: 2 };
productionRuntime.dispatch(VR_SCENARIO_EVENT.INTRO_INVITATION_SELECTED, productionInvitationPayload);
assert.equal(productionChoicePayloads[0], productionInvitationPayload);
assert.deepEqual(productionCalls, [VR_SCENARIO_EFFECT.BEGIN_INTRO_REVEAL, VR_SCENARIO_EFFECT.BEGIN_POST_REVEAL_SILENCE,
  VR_SCENARIO_EFFECT.BEGIN_CONTROLLER_ONBOARDING, VR_SCENARIO_EFFECT.CONTINUE_CONTROLLER_ONBOARDING,
  VR_SCENARIO_EFFECT.CONTINUE_CONTROLLER_ONBOARDING, VR_SCENARIO_EFFECT.CONTINUE_CONTROLLER_ONBOARDING,
  VR_SCENARIO_EFFECT.CONTINUE_CONTROLLER_ONBOARDING, VR_SCENARIO_EFFECT.BEGIN_INTRO_CRYSTAL_TUTORIAL,
  VR_SCENARIO_EFFECT.BEGIN_INTRO_INVITATION, VR_SCENARIO_EFFECT.CONTINUE_INTRO_INVITATION]);
productionRuntime.dispatch(VR_SCENARIO_EVENT.INTRO_INVITATION_SELECTED, { choice: 1 });
assert.equal(productionCalls.filter((effect) => effect === VR_SCENARIO_EFFECT.CONTINUE_INTRO_INVITATION).length, 2,
  'natural 1.110 entry executes the follow-Monkey command exactly once after the earlier STAY command');
const followPayload = { paused: true };
productionRuntime.dispatch(VR_SCENARIO_EVENT.FOLLOW_PAUSE_CHANGED, followPayload);
assert.equal(productionChoicePayloads.at(-1), followPayload);
productionRuntime.dispatch(VR_SCENARIO_EVENT.FOLLOW_PAUSE_CHANGED, { paused: false });
productionRuntime.dispatch(VR_SCENARIO_EVENT.MONKEY_REACHED_THRESHOLD);
assert.equal(productionCalls.at(-1), VR_SCENARIO_EFFECT.PRESENT_THRESHOLD_CHOICE,
  'accepted threshold arrival executes the single production Runtime effect');
const productionThresholdPayload = { choice: 2 };
productionRuntime.dispatch(VR_SCENARIO_EVENT.THRESHOLD_SELECTED, productionThresholdPayload);
assert.equal(productionCalls.at(-1), VR_SCENARIO_EFFECT.CONTINUE_THRESHOLD_CHOICE);
assert.equal(productionChoicePayloads.at(-1), productionThresholdPayload, 'Runtime forwards threshold payload unchanged');

const entryCalls = [];
const entryRuntime = new RuntimeExperience({
  director: new ExperienceDirector({ scenario: vrExperienceScenario, startPointId: '3.10' }),
  effectHandlers: {
    [VR_SCENARIO_EFFECT.REVEAL_SHELL_FIELD_PRESENTATION]: () => entryCalls.push(VR_SCENARIO_EFFECT.REVEAL_SHELL_FIELD_PRESENTATION),
    [VR_SCENARIO_EFFECT.ELEVATE_MAIN_GLYPHS]: () => entryCalls.push(VR_SCENARIO_EFFECT.ELEVATE_MAIN_GLYPHS)
  }
});
const entryChange = entryRuntime.activateCurrentPoint();
assert.deepEqual(entryCalls, entryChange.effects, 'Runtime executes arbitrary-start entry effects through its canonical adapter');
assert.equal(entryRuntime.activateCurrentPoint(), null);
assert.equal(entryCalls.length, 2, 'repeated activation executes no effects');

const introEntryCalls = [];
const introEntryRuntime = new RuntimeExperience({
  director: new ExperienceDirector({ scenario: vrExperienceScenario, startPointId: '1.50' }),
  effectHandlers: {
    [VR_SCENARIO_EFFECT.CONTINUE_CONTROLLER_ONBOARDING]: () => introEntryCalls.push(VR_SCENARIO_EFFECT.CONTINUE_CONTROLLER_ONBOARDING)
  }
});
const introEntryChange = introEntryRuntime.activateCurrentPoint();
assert.deepEqual(introEntryChange.effects, [VR_SCENARIO_EFFECT.CONTINUE_CONTROLLER_ONBOARDING],
  'Runtime direct activation executes the authored 1.50 entry contract');
assert.equal(introEntryRuntime.activateCurrentPoint(), null);
assert.deepEqual(introEntryCalls, [VR_SCENARIO_EFFECT.CONTINUE_CONTROLLER_ONBOARDING],
  'Runtime executes the 1.50 entry command exactly once');

const controlsEntryCalls = [];
const controlsEntryRuntime = new RuntimeExperience({
  director: new ExperienceDirector({ scenario: vrExperienceScenario, startPointId: '1.60' }),
  effectHandlers: {
    [VR_SCENARIO_EFFECT.CONTINUE_CONTROLLER_ONBOARDING]: () => controlsEntryCalls.push(VR_SCENARIO_EFFECT.CONTINUE_CONTROLLER_ONBOARDING)
  }
});
const controlsEntryChange = controlsEntryRuntime.activateCurrentPoint();
assert.deepEqual(controlsEntryChange.effects, [VR_SCENARIO_EFFECT.CONTINUE_CONTROLLER_ONBOARDING],
  'Runtime direct activation executes the authored 1.60 entry contract');
assert.equal(controlsEntryRuntime.activateCurrentPoint(), null);
assert.deepEqual(controlsEntryCalls, [VR_SCENARIO_EFFECT.CONTINUE_CONTROLLER_ONBOARDING],
  'Runtime executes the 1.60 entry command exactly once');

const pointerEntryCalls = [];
const pointerEntryRuntime = new RuntimeExperience({
  director: new ExperienceDirector({ scenario: vrExperienceScenario, startPointId: '1.70' }),
  effectHandlers: {
    [VR_SCENARIO_EFFECT.CONTINUE_CONTROLLER_ONBOARDING]: () => pointerEntryCalls.push(VR_SCENARIO_EFFECT.CONTINUE_CONTROLLER_ONBOARDING)
  }
});
const pointerEntryChange = pointerEntryRuntime.activateCurrentPoint();
assert.deepEqual(pointerEntryChange.effects, [VR_SCENARIO_EFFECT.CONTINUE_CONTROLLER_ONBOARDING],
  'Runtime direct activation executes the authored 1.70 entry contract');
assert.equal(pointerEntryRuntime.activateCurrentPoint(), null);
assert.deepEqual(pointerEntryCalls, [VR_SCENARIO_EFFECT.CONTINUE_CONTROLLER_ONBOARDING],
  'Runtime executes the 1.70 entry command exactly once');

const monkeyHoverEntryCalls = [];
const monkeyHoverEntryRuntime = new RuntimeExperience({
  director: new ExperienceDirector({ scenario: vrExperienceScenario, startPointId: '1.80' }),
  effectHandlers: {
    [VR_SCENARIO_EFFECT.CONTINUE_CONTROLLER_ONBOARDING]: () => monkeyHoverEntryCalls.push(VR_SCENARIO_EFFECT.CONTINUE_CONTROLLER_ONBOARDING)
  }
});
const monkeyHoverEntryChange = monkeyHoverEntryRuntime.activateCurrentPoint();
assert.deepEqual(monkeyHoverEntryChange.effects, [VR_SCENARIO_EFFECT.CONTINUE_CONTROLLER_ONBOARDING],
  'Runtime direct activation executes the authored 1.80 entry contract');
assert.equal(monkeyHoverEntryRuntime.activateCurrentPoint(), null);
assert.deepEqual(monkeyHoverEntryCalls, [VR_SCENARIO_EFFECT.CONTINUE_CONTROLLER_ONBOARDING],
  'Runtime executes the 1.80 entry command exactly once');

const monkeyTriggerEntryCalls = [];
const monkeyTriggerEntryRuntime = new RuntimeExperience({
  director: new ExperienceDirector({ scenario: vrExperienceScenario, startPointId: '1.100' }),
  effectHandlers: {
    [VR_SCENARIO_EFFECT.BEGIN_INTRO_INVITATION]: () => monkeyTriggerEntryCalls.push(VR_SCENARIO_EFFECT.BEGIN_INTRO_INVITATION)
  }
});
const monkeyTriggerEntryChange = monkeyTriggerEntryRuntime.activateCurrentPoint();
assert.deepEqual(monkeyTriggerEntryChange.effects, [VR_SCENARIO_EFFECT.BEGIN_INTRO_INVITATION],
  'Runtime direct activation executes the authored 1.100 entry contract');
assert.equal(monkeyTriggerEntryRuntime.activateCurrentPoint(), null);
assert.deepEqual(monkeyTriggerEntryCalls, [VR_SCENARIO_EFFECT.BEGIN_INTRO_INVITATION],
  'Runtime executes the 1.100 entry command exactly once');

const followEntryCalls = [];
const followEntryRuntime = new RuntimeExperience({
  director: new ExperienceDirector({ scenario: vrExperienceScenario, startPointId: '1.110' }),
  effectHandlers: {
    [VR_SCENARIO_EFFECT.CONTINUE_INTRO_INVITATION]: () => followEntryCalls.push(VR_SCENARIO_EFFECT.CONTINUE_INTRO_INVITATION)
  }
});
const followEntryChange = followEntryRuntime.activateCurrentPoint();
assert.deepEqual(followEntryChange.effects, [VR_SCENARIO_EFFECT.CONTINUE_INTRO_INVITATION],
  'Runtime direct activation executes the authored 1.110 entry contract');
assert.equal(followEntryRuntime.activateCurrentPoint(), null);
assert.deepEqual(followEntryCalls, [VR_SCENARIO_EFFECT.CONTINUE_INTRO_INVITATION],
  'Runtime executes the 1.110 entry command exactly once');
console.log('RuntimeExperience assertions passed');
