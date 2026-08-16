import assert from 'node:assert/strict';
import { ExperienceDirector } from '../src/xr/progression/ExperienceDirector.js';
import { RuntimeExperience } from '../src/xr/progression/RuntimeExperience.js';
import { stateAtVrScenarioPoint } from '../src/xr/progression/reconstructVrScenarioState.js';
import {
  VR_EXPERIENCE_POINT,
  VR_SCENARIO_EFFECT,
  VR_SCENARIO_EVENT,
  vrExperienceScenario
} from '../src/xr/progression/vrExperienceScenario.js';

const entries = new Map([
  [VR_EXPERIENCE_POINT['3.10'], [
    VR_SCENARIO_EFFECT.REVEAL_SHELL_FIELD_PRESENTATION,
    VR_SCENARIO_EFFECT.ELEVATE_MAIN_GLYPHS
  ]],
  [VR_EXPERIENCE_POINT['3.20'], [VR_SCENARIO_EFFECT.BEGIN_OBSERVATION_WINDOW]],
  [VR_EXPERIENCE_POINT['3.30'], [VR_SCENARIO_EFFECT.BEGIN_MONKEY_ATTENTION]],
  [VR_EXPERIENCE_POINT['3.40'], [VR_SCENARIO_EFFECT.BEGIN_FURNACE_INTRO]]
]);

const makeDirector = (pointId) => new ExperienceDirector({
  scenario: vrExperienceScenario,
  startPointId: pointId
});

function makeRuntime(trace) {
  const handlers = Object.fromEntries(vrExperienceScenario.vocabulary.effects.map((effect) => [
    effect,
    () => trace.push(effect)
  ]));
  return new RuntimeExperience({
    director: makeDirector('1.10'),
    effectHandlers: handlers,
    pointLifecycle: {
      restoreBaseline: () => trace.push('baseline'),
      stateAt: (pointId) => stateAtVrScenarioPoint(vrExperienceScenario, pointId),
      hydrate: (state) => trace.push(['hydrate', state]),
      synchronize: () => trace.push('synchronize'),
      createDirector: makeDirector
    }
  });
}

for (const [pointId, expectedEntry] of entries) {
  const trace = [];
  const runtime = makeRuntime(trace);
  const result = runtime.activatePoint(pointId);

  assert.equal(runtime.getCurrentPointId(), pointId);
  assert.deepEqual(result.state, stateAtVrScenarioPoint(vrExperienceScenario, pointId));
  assert.deepEqual(trace.slice(0, 3), ['baseline', ['hydrate', result.state], 'synchronize']);
  assert.deepEqual(trace.slice(3), expectedEntry,
    `${pointId} executes only its target-owned entry from an actor-independent baseline`);
  assert.equal(runtime.activateCurrentPoint(), null, `${pointId} entry is exactly once`);
  assert.deepEqual(trace.slice(3), expectedEntry, `${pointId} does not replay an entry`);
}

const atThreeTen = stateAtVrScenarioPoint(vrExperienceScenario, '3.10');
assert.equal(atThreeTen.postRing, undefined, '3.10 pre-entry state excludes its presentation');

const naturalTrace = [];
const naturalHandlers = Object.fromEntries(vrExperienceScenario.vocabulary.effects.map((effect) => [
  effect,
  () => naturalTrace.push(effect)
]));
const natural = new RuntimeExperience({
  director: makeDirector('3.10'),
  effectHandlers: naturalHandlers
});
assert.deepEqual(natural.activateCurrentPoint()?.effects, entries.get('3.10'));

for (const [event, target] of [
  [VR_SCENARIO_EVENT.POST_RING_WORLD_PRESENTATION_COMPLETED, '3.20'],
  [VR_SCENARIO_EVENT.OBSERVATION_WINDOW_COMPLETED, '3.30'],
  [VR_SCENARIO_EVENT.POST_RING_MONKEY_DIALOGUE_COMPLETED, '3.40']
]) {
  const change = natural.dispatch(event);
  assert.equal(change.currentPointId, target);
  assert.deepEqual(change.effects, entries.get(target),
    `${event} only completes its predecessor; the target contributes the start command`);
}
assert.deepEqual(naturalTrace, [...entries.values()].flat(),
  'natural 3.10–3.40 flow uses the same ordered target-owned entries as direct activation');

for (const pointId of entries.keys()) {
  const point = vrExperienceScenario.points.find(({ id }) => id === pointId);
  assert.deepEqual(point.entryEffects, entries.get(pointId));
  assert.deepEqual(point.transitions[0].effects, [],
    `${pointId} completion does not own the next canonical beat`);
}

console.log('VR M6 direct point activation 3.x regression test passed.');
