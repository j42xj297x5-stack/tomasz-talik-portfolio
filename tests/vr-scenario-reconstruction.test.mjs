import assert from 'node:assert/strict';
import { VR_EXPERIENCE_SCENARIO_SPINE, VR_SCENARIO_CAPABILITY,
  vrExperienceScenario } from '../src/xr/progression/vrExperienceScenario.js';
import { reconstructVrScenarioState, validateScenarioSpine } from '../src/xr/progression/reconstructVrScenarioState.js';
import { deriveScenarioSpine, getNextScenarioSpinePointId } from '../src/xr/progression/scenarioSpineNavigation.js';

assert.equal(Object.isFrozen(VR_EXPERIENCE_SCENARIO_SPINE), true);
assert.equal(vrExperienceScenario.spine, VR_EXPERIENCE_SCENARIO_SPINE);
assert.deepEqual(deriveScenarioSpine(vrExperienceScenario), VR_EXPERIENCE_SCENARIO_SPINE);
assert.equal(VR_EXPERIENCE_SCENARIO_SPINE.at(-1), '100.10');
assert.equal(validateScenarioSpine(vrExperienceScenario), true);
assert.equal(getNextScenarioSpinePointId(vrExperienceScenario, '1.100'), '1.110');
assert.equal(getNextScenarioSpinePointId(vrExperienceScenario, '2.40'), '3.10');
assert.equal(getNextScenarioSpinePointId(vrExperienceScenario, '3.80'), '4.10');
assert.equal(getNextScenarioSpinePointId(vrExperienceScenario, '4.10'), '4.20');
assert.equal(getNextScenarioSpinePointId(vrExperienceScenario, '4.20'), '4.30');
assert.equal(getNextScenarioSpinePointId(vrExperienceScenario, '4.30'), '4.40');
assert.equal(getNextScenarioSpinePointId(vrExperienceScenario, '4.40'), '100.10');
assert.equal(getNextScenarioSpinePointId(vrExperienceScenario, '100.10'), null);

assert.deepEqual(reconstructVrScenarioState(vrExperienceScenario, '1.10'), {});
const atTwoTen = reconstructVrScenarioState(vrExperienceScenario, '2.10');
assert.equal(atTwoTen.intro.phase, 'GLYPH_FREE_EXPLORE');
assert.equal(atTwoTen.portal, undefined);
const atThreeTen = reconstructVrScenarioState(vrExperienceScenario, '3.10');
assert.equal(atThreeTen.progression.tier, 2);
assert.deepEqual(atThreeTen.reliquary, { revealed: true, interactionEnabled: true });
assert.equal(atThreeTen.postRing, undefined, 'target consequences remain exclusive');
assert.equal(Object.isFrozen(atThreeTen), true);
assert.equal(Object.isFrozen(atThreeTen.progression), true);
const atFourTen = reconstructVrScenarioState(vrExperienceScenario, '4.10');
assert.equal(atFourTen.progression.completedTier, 1);
assert.equal(atFourTen.reliquary.revealed, true);
assert.equal(atFourTen.postRing.shellFieldVisible, true);
assert.equal(atFourTen.furnace.revealed, true);
assert.deepEqual(atFourTen.astroProduction, { state: 'EARNED' });
assert.deepEqual(atFourTen.asterionProduction, { state: 'EARNED' });
assert.equal(atFourTen.furnaceProgression.absorbedShellIds.length, 6);
for (const pointId of ['4.10', '4.20', '4.30', '4.40']) {
  const capabilities = vrExperienceScenario.points.find(({ id }) => id === pointId).capabilities;
  assert.equal(capabilities.includes(VR_SCENARIO_CAPABILITY.CAN_SCAN_SHELLS), true,
    `${pointId} preserves shell scanning in P2`);
  assert.equal(capabilities.includes(VR_SCENARIO_CAPABILITY.CAN_TARGET_SHELLS), true,
    `${pointId} preserves shell targeting in P2`);
}
assert.throws(() => reconstructVrScenarioState(vrExperienceScenario, '100.10'), /canonical reconstruction target/);
assert.throws(() => reconstructVrScenarioState(vrExperienceScenario, 'not-authored'), /canonical reconstruction target/);
console.log('VR Scenario derived Spine reconstruction tests passed.');
