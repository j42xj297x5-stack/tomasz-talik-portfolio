import assert from 'node:assert/strict';
import { hydrateVrScenarioState } from '../src/xr/progression/hydrateVrScenarioState.js';
import { prepareVrScenarioSession } from '../src/xr/progression/prepareVrScenarioSession.js';
import { reconstructVrScenarioState } from '../src/xr/progression/reconstructVrScenarioState.js';
import { createVrExperienceDirector } from '../src/xr/progression/createVrExperienceDirector.js';
import { VR_SCENARIO_CAPABILITY, vrExperienceScenario } from '../src/xr/progression/vrExperienceScenario.js';

const calls = [];
const snapshots = {};
const owner = (name) => ({ hydrateScenarioState(value) { calls.push(name); snapshots[name] = structuredClone(value); } });
const owners = { monkey: owner('monkey'), intro: owner('intro'), locomotion: owner('locomotion'), unused: owner('unused') };
const state = Object.freeze({ monkey: Object.freeze({ visible: true }), intro: Object.freeze({ phase: 'done' }) });
hydrateVrScenarioState(state, owners);
assert.deepEqual(calls, ['monkey', 'intro']);
assert.deepEqual(snapshots, { monkey: { visible: true }, intro: { phase: 'done' } });
assert.equal('unused' in snapshots, false, 'an owner without a state section is untouched');

const order = [];
const events = [];
const effects = [];
const hydrated = {};
const verticalOwners = Object.fromEntries(['monkey', 'intro', 'locomotion'].map((name) => [name, {
  hydrateScenarioState(value) { order.push(`hydrate:${name}`); hydrated[name] = structuredClone(value); }
}]));
const result = prepareVrScenarioSession({
  pointId: '2.10', scenario: vrExperienceScenario, owners: verticalOwners,
  restoreBaseline() { order.push('baseline'); },
  reconstruct(scenario, pointId) {
    order.push(`reconstruct:${pointId}`);
    return reconstructVrScenarioState(scenario, pointId);
  },
  hydrate(value, targetOwners) { order.push('hydrate'); hydrateVrScenarioState(value, targetOwners); },
  createDirector(options) { order.push('director'); return createVrExperienceDirector(options); }
});
assert.deepEqual(order, ['baseline', 'reconstruct:2.10', 'hydrate', 'hydrate:monkey', 'hydrate:intro', 'hydrate:locomotion', 'director']);
assert.equal(result.director.currentPointId, '2.10');
assert.equal(result.director.can(VR_SCENARIO_CAPABILITY.CAN_USE_GLYPHS), true);
assert.deepEqual(events, []); assert.deepEqual(effects, []);
const firstHydration = structuredClone(hydrated);
for (const key of Object.keys(hydrated)) delete hydrated[key];
hydrateVrScenarioState(result.state, verticalOwners);
assert.deepEqual(hydrated, firstHydration, 'repeated hydration materializes the same settled facts');

const p2Calls = [];
const p2Owners = Object.fromEntries(['monkey', 'intro', 'locomotion', 'reliquary', 'progression',
  'progressFloor', 'crystals', 'postRing'].map((name) => [name, {
  hydrateScenarioState(value) { p2Calls.push([name, structuredClone(value)]); }
}]));
hydrateVrScenarioState(reconstructVrScenarioState(vrExperienceScenario, '3.10'), p2Owners);
assert.deepEqual(p2Calls.map(([name]) => name), Object.keys(p2Owners));

console.log('VR Scenario hydration and session preparation assertions passed.');
