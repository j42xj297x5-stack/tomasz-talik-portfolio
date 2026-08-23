import assert from 'node:assert/strict';
import { ExperienceDirector } from '../src/xr/progression/ExperienceDirector.js';
import { RuntimeExperience } from '../src/xr/progression/RuntimeExperience.js';
import { hydrateVrScenarioState } from '../src/xr/progression/hydrateVrScenarioState.js';
import { stateAtVrScenarioPoint } from '../src/xr/progression/reconstructVrScenarioState.js';
import {
  VR_SCENARIO_EFFECT, VR_SCENARIO_EVENT, vrExperienceScenario
} from '../src/xr/progression/vrExperienceScenario.js';

const stateAt = (id) => stateAtVrScenarioPoint(vrExperienceScenario, id);
const atReveal = stateAt('1.30');
assert.deepEqual(atReveal.intro, {
  stage: 'REVEALED', fog: 'CLEARED', largeGlyphsVisible: true,
  progressionFixturesVisible: true, guideInteractionEnabled: false
}, 'the completed reveal belongs to 1.20 and is visible after that point');
assert.equal(stateAt('1.20').intro, undefined, 'the target point remains exclusive');
assert.deepEqual(stateAt('1.40'), atReveal,
  'silence completion adds no invented persistent presentation or timer state');

const afterOnboarding = stateAt('2.10');
assert.equal(afterOnboarding.intro.stage, 'GLYPH_FREE_EXPLORE');
assert.equal(afterOnboarding.monkey.placement, 'FINAL_STONE');
assert.equal(afterOnboarding.locomotion.boundary, 'GLYPH_RING');
assert.equal(afterOnboarding.reliquary, undefined);

const laterFirstLoop = stateAt('2.40');
assert.equal(laterFirstLoop.reliquary.revealed, true);
assert.equal(laterFirstLoop.progression.completedTier, 1);
assert.equal(laterFirstLoop.progressFloor.activatedPages.length, 5);
assert.equal(laterFirstLoop.crystals.consumedTier, 1);

const atThreeTen = stateAt('3.10');
assert.deepEqual(atThreeTen, laterFirstLoop, '3.10 accumulates exactly the completed P0-P2 history');
assert.equal(atThreeTen.postRing, undefined, '3.10 entry presentation is not reconstructed early');
const serialized = JSON.stringify(atThreeTen);
for (const transient of ['WAIT_RUNTIME', 'timer', 'elapsed', 'animation', 'hover', 'target']) {
  assert.equal(serialized.includes(transient), false, `transient ${transient} is absent`);
}

const hydrated = [];
const owners = Object.fromEntries(Object.keys(atThreeTen).map((key) => [key, {
  hydrateScenarioState(value) { hydrated.push([key, structuredClone(value)]); }
}]));
hydrateVrScenarioState(atThreeTen, owners);
assert.deepEqual(new Set(hydrated.map(([key]) => key)), new Set(Object.keys(atThreeTen)),
  'public owner hydration receives every stable section without semantic events');

const effects = [];
const makeDirector = (pointId) => new ExperienceDirector({ scenario: vrExperienceScenario, startPointId: pointId });
const runtime = new RuntimeExperience({
  director: makeDirector('1.10'),
  effectHandlers: {
    [VR_SCENARIO_EFFECT.BEGIN_POST_REVEAL_SILENCE]: () => effects.push('current-entry'),
    [VR_SCENARIO_EFFECT.REVEAL_SHELL_FIELD_PRESENTATION]: () => effects.push('3.10-shell'),
    [VR_SCENARIO_EFFECT.ELEVATE_MAIN_GLYPHS]: () => effects.push('3.10-glyphs')
  },
  pointLifecycle: {
    stateAt,
    restoreBaseline() { effects.push('baseline'); },
    hydrate(state) { effects.push(['hydrate', structuredClone(state)]); },
    synchronize() { effects.push('synchronize'); },
    createDirector: makeDirector
  }
});
const direct = runtime.activatePoint('1.30');
assert.deepEqual(direct.state, atReveal);
assert.deepEqual(effects, ['baseline', ['hydrate', atReveal], 'synchronize', 'current-entry'],
  'direct entry hydrates stable history and executes only the requested entry');

const natural = makeDirector('1.10');
natural.dispatch(VR_SCENARIO_EVENT.XR_CALIBRATED);
natural.dispatch(VR_SCENARIO_EVENT.INTRO_REVEAL_COMPLETE);
assert.equal(natural.getCurrentPointId(), '1.30');
assert.deepEqual(stateAt(natural.getCurrentPointId()), direct.state,
  'natural and direct routes share the same declarative pre-entry state');

effects.length = 0;
runtime.activatePoint('3.10');
assert.deepEqual(effects, ['baseline', ['hydrate', atThreeTen], 'synchronize', '3.10-shell', '3.10-glyphs'],
  'historical effects are not replayed and 3.10 entry executes exactly once');

console.log('VR M4 settled consequences regression test passed.');
