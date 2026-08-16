import assert from 'node:assert/strict';
import { ExperienceDirector } from '../src/xr/progression/ExperienceDirector.js';
import { RuntimeExperience } from '../src/xr/progression/RuntimeExperience.js';
import { stateAtVrScenarioPoint } from '../src/xr/progression/reconstructVrScenarioState.js';
import {
  VR_EXPERIENCE_POINT, VR_SCENARIO_EFFECT, VR_SCENARIO_EVENT, vrExperienceScenario
} from '../src/xr/progression/vrExperienceScenario.js';

const stateAt = (pointId) => stateAtVrScenarioPoint(vrExperienceScenario, pointId);
assert.deepEqual(stateAt('1.10'), {}, 'stateAt(initial) has no current-point or historical state');
assert.deepEqual(stateAt('1.130'), {}, 'stateAt is exclusive of the target consequences');
assert.equal(stateAt('2.10').intro.phase, 'GLYPH_FREE_EXPLORE');
assert.equal(stateAt('2.10').monkey.placement, 'FINAL_STONE');
assert.equal(stateAt('2.20').reliquary, undefined,
  'the reveal handshake at 2.20 is not prematurely included in its pre-entry state');
assert.equal(stateAt('2.30').reliquary.revealed, true);
assert.throws(() => stateAt('100.10'), /canonical reconstruction target/,
  'local early exits cannot become mainline reconstruction targets');

const historyEffects = [];
const hydratedStates = [];
let stableWorld = {};
const makeDirector = (pointId) => new ExperienceDirector({ scenario: vrExperienceScenario, startPointId: pointId });
const runtime = new RuntimeExperience({
  director: makeDirector('1.10'),
  effectHandlers: {
    [VR_SCENARIO_EFFECT.BEGIN_INTRO_REVEAL]: () => historyEffects.push('1.20'),
    [VR_SCENARIO_EFFECT.BEGIN_POST_REVEAL_SILENCE]: () => historyEffects.push('1.30'),
    [VR_SCENARIO_EFFECT.BEGIN_CONTROLLER_ONBOARDING]: () => historyEffects.push('1.40')
  },
  pointLifecycle: {
    stateAt,
    restoreBaseline() { stableWorld = {}; },
    hydrate(state) { hydratedStates.push(state); stableWorld = state; },
    createDirector: makeDirector
  }
});
const direct = runtime.activatePoint('1.40');
assert.equal(runtime.getCurrentPointId(), '1.40');
assert.deepEqual(direct.activation.effects, [VR_SCENARIO_EFFECT.BEGIN_CONTROLLER_ONBOARDING]);
assert.deepEqual(historyEffects, ['1.40'], 'direct activation executes only the requested entry behavior');
assert.deepEqual(stableWorld, stateAt('1.40'), 'owners receive deterministic pre-entry state before activation');
assert.equal(hydratedStates.length, 1);
assert.equal(runtime.activateCurrentPoint(), null, 'entry behavior is exactly once for one activation');

const naturalEffects = [];
const natural = new RuntimeExperience({ director: makeDirector('1.10'), effectHandlers: {
  [VR_SCENARIO_EFFECT.BEGIN_INTRO_REVEAL]: () => naturalEffects.push('1.20'),
  [VR_SCENARIO_EFFECT.BEGIN_POST_REVEAL_SILENCE]: () => naturalEffects.push('1.30'),
  [VR_SCENARIO_EFFECT.BEGIN_CONTROLLER_ONBOARDING]: () => naturalEffects.push('1.40')
} });
natural.dispatch(VR_SCENARIO_EVENT.XR_CALIBRATED);
natural.dispatch(VR_SCENARIO_EVENT.INTRO_REVEAL_COMPLETE);
natural.dispatch(VR_SCENARIO_EVENT.POST_REVEAL_SILENCE_COMPLETE);
assert.equal(natural.getCurrentPointId(), '1.40');
assert.deepEqual(stableWorld, stateAt('1.40'),
  'direct hydration and settled natural history agree before the current beat');
assert.deepEqual(naturalEffects, ['1.20', '1.30', '1.40']);

const calibrationBoundary = makeDirector('1.10');
assert.equal(calibrationBoundary.dispatch(VR_SCENARIO_EVENT.INTRO_REVEAL_COMPLETE), null);
assert.equal(calibrationBoundary.getCurrentPointId(), '1.10', 'production P0 cannot bypass XR calibration');
assert.equal(calibrationBoundary.dispatch(VR_SCENARIO_EVENT.XR_CALIBRATED).currentPointId, '1.20');

const beforePostLoop = stateAt(VR_EXPERIENCE_POINT['3.10']);
assert.equal(beforePostLoop.progression.completedTier, 1);
assert.equal(beforePostLoop.progression.activatedPageIds.length, 5,
  '3.10 follows the completed first five-card loop');
assert.equal(beforePostLoop.postRing, undefined, '3.10 entry presentation is exclusive of stateAt(3.10)');
const point310 = vrExperienceScenario.points.find(({ id }) => id === '3.10');
assert.deepEqual(point310.entryEffects, [
  VR_SCENARIO_EFFECT.REVEAL_SHELL_FIELD_PRESENTATION,
  VR_SCENARIO_EFFECT.ELEVATE_MAIN_GLYPHS
]);
console.log('VR M3B canonical point lifecycle regression test passed.');
