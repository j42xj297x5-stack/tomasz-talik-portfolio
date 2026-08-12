import assert from 'node:assert/strict';
import { ExperienceDirector } from '../src/xr/progression/ExperienceDirector.js';
import { RuntimeExperience } from '../src/xr/progression/RuntimeExperience.js';
import { VR_SCENARIO_EFFECT, VR_SCENARIO_EVENT, vrExperienceScenario } from '../src/xr/progression/vrExperienceScenario.js';

const freeze = (value) => Object.freeze(value);
const scenario = freeze({ initialSceneId: 'A', vocabulary: freeze({ events: freeze(['GO', 'IGNORED']),
  capabilities: freeze(['CAN_GO', 'CAN_DONE']), milestones: freeze(['DONE']), effects: freeze(['FIRST', 'SECOND']) }),
scenes: freeze([
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
assert.equal(runtime.can('CAN_GO'), true); assert.equal(runtime.getCurrentSceneId(), 'A');
assert.equal(runtime.dispatch('IGNORED'), null); assert.deepEqual(calls, []);
const change = runtime.dispatch('GO', payload);
assert.deepEqual(calls.map(([effect]) => effect), ['FIRST', 'SECOND']);
assert.equal(calls[0][1], change); assert.equal(calls[0][2], payload); assert.equal(calls[1][2], payload);
assert.equal(Object.isFrozen(change), true); assert.equal(runtime.can('CAN_DONE'), true);
assert.equal(runtime.hasMilestone('DONE'), true); assert.equal(runtime.getCurrentSceneId(), 'B');
assert.deepEqual(runtime.getDebugSnapshot(), director.getDebugSnapshot());
runtime.resetSession(); assert.equal(runtime.hasMilestone('DONE'), true); assert.notEqual(runtime.dispatch('GO'), null);
runtime.resetSession({ hard: true }); assert.equal(runtime.hasMilestone('DONE'), false);
const missing = new RuntimeExperience({ director: new ExperienceDirector({ scenario }), effectHandlers: { FIRST() {} } });
assert.throws(() => missing.dispatch('GO'), /Missing effect handler: SECOND/);
let disposeCalls = 0; let dispatchCalls = 0;
const ownedDirector = { dispatch() { dispatchCalls += 1; return freeze({ effects: freeze([]) }); }, can() {}, hasMilestone() {},
  getCurrentSceneId() {}, getDebugSnapshot() {}, resetSession() {}, dispose() { disposeCalls += 1; } };
const disposable = new RuntimeExperience({ director: ownedDirector }); disposable.dispose(); disposable.dispose();
assert.equal(disposeCalls, 1); assert.equal(disposable.dispatch('GO'), null); assert.equal(dispatchCalls, 0);
const productionCalls = [];
const productionRuntime = new RuntimeExperience({ director: new ExperienceDirector({ scenario: vrExperienceScenario }), effectHandlers: {
  [VR_SCENARIO_EFFECT.BEGIN_INTRO_REVEAL]: () => productionCalls.push(VR_SCENARIO_EFFECT.BEGIN_INTRO_REVEAL),
  [VR_SCENARIO_EFFECT.BEGIN_POST_REVEAL_SILENCE]: () => productionCalls.push(VR_SCENARIO_EFFECT.BEGIN_POST_REVEAL_SILENCE),
  [VR_SCENARIO_EFFECT.BEGIN_CONTROLLER_ONBOARDING]: () => productionCalls.push(VR_SCENARIO_EFFECT.BEGIN_CONTROLLER_ONBOARDING)
} });
productionRuntime.dispatch(VR_SCENARIO_EVENT.XR_CALIBRATED);
productionRuntime.dispatch(VR_SCENARIO_EVENT.INTRO_REVEAL_COMPLETE);
productionRuntime.dispatch(VR_SCENARIO_EVENT.POST_REVEAL_SILENCE_COMPLETE);
assert.deepEqual(productionCalls, [VR_SCENARIO_EFFECT.BEGIN_INTRO_REVEAL, VR_SCENARIO_EFFECT.BEGIN_POST_REVEAL_SILENCE,
  VR_SCENARIO_EFFECT.BEGIN_CONTROLLER_ONBOARDING]);
console.log('RuntimeExperience assertions passed');
