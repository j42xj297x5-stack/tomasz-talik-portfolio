import assert from 'node:assert/strict';
import { ExperienceDirector } from '../src/xr/progression/ExperienceDirector.js';
import { RuntimeExperience } from '../src/xr/progression/RuntimeExperience.js';
import { VR_SCENARIO_EFFECT, VR_SCENARIO_EVENT, vrExperienceScenario } from '../src/xr/progression/vrExperienceScenario.js';

const freeze = (value) => Object.freeze(value);
const scenario = freeze({ initialPointId: 'A', vocabulary: freeze({ events: freeze(['GO', 'IGNORED']),
  capabilities: freeze(['CAN_GO', 'CAN_DONE']), milestones: freeze(['DONE']), effects: freeze(['FIRST', 'SECOND']) }),
points: freeze([
  freeze({ id: 'A', capabilities: freeze(['CAN_GO']), transitions: freeze([
    freeze({ event: 'GO', target: 'B', milestonesToAdd: freeze(['DONE']), effects: freeze(['FIRST', 'SECOND']) })
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
const choiceScenario = freeze({ initialPointId: '2.6.3', vocabulary: freeze({ events: freeze(['SELECTED']),
  capabilities: freeze([]), milestones: freeze([]), effects: freeze(['CHOICE_EFFECT']) }), points: freeze([
  freeze({ id: '2.6.3', capabilities: freeze([]), transitions: freeze([
    freeze({ event: 'SELECTED', choice: 1, target: '2.6.3.1', effects: freeze([]) }),
    freeze({ event: 'SELECTED', choice: 2, target: '7.4.9', effects: freeze(['CHOICE_EFFECT']) })
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
  [VR_SCENARIO_EFFECT.PRESENT_THRESHOLD_CHOICE]: () => productionCalls.push(VR_SCENARIO_EFFECT.PRESENT_THRESHOLD_CHOICE),
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
const productionInvitationPayload = { choice: 2 };
productionRuntime.dispatch(VR_SCENARIO_EVENT.INTRO_INVITATION_SELECTED, productionInvitationPayload);
assert.equal(productionChoicePayloads[0], productionInvitationPayload);
assert.deepEqual(productionCalls, [VR_SCENARIO_EFFECT.BEGIN_INTRO_REVEAL, VR_SCENARIO_EFFECT.BEGIN_POST_REVEAL_SILENCE,
  VR_SCENARIO_EFFECT.BEGIN_CONTROLLER_ONBOARDING, VR_SCENARIO_EFFECT.CONTINUE_CONTROLLER_ONBOARDING,
  VR_SCENARIO_EFFECT.CONTINUE_CONTROLLER_ONBOARDING, VR_SCENARIO_EFFECT.CONTINUE_CONTROLLER_ONBOARDING,
  VR_SCENARIO_EFFECT.CONTINUE_CONTROLLER_ONBOARDING, VR_SCENARIO_EFFECT.CONTINUE_CONTROLLER_ONBOARDING,
  VR_SCENARIO_EFFECT.CONTINUE_INTRO_INVITATION]);
productionRuntime.dispatch(VR_SCENARIO_EVENT.INTRO_INVITATION_SELECTED, { choice: 1 });
productionRuntime.dispatch(VR_SCENARIO_EVENT.MONKEY_REACHED_THRESHOLD);
assert.equal(productionCalls.at(-1), VR_SCENARIO_EFFECT.PRESENT_THRESHOLD_CHOICE,
  'accepted threshold arrival executes the single production Runtime effect');
const productionThresholdPayload = { choice: 2 };
productionRuntime.dispatch(VR_SCENARIO_EVENT.THRESHOLD_SELECTED, productionThresholdPayload);
assert.equal(productionCalls.at(-1), VR_SCENARIO_EFFECT.CONTINUE_THRESHOLD_CHOICE);
assert.equal(productionChoicePayloads.at(-1), productionThresholdPayload, 'Runtime forwards threshold payload unchanged');
console.log('RuntimeExperience assertions passed');
