import assert from 'node:assert/strict';
import { VR_EXPERIENCE_SCENARIO_SPINE, vrExperienceScenario } from '../src/xr/progression/vrExperienceScenario.js';
import { reconstructVrScenarioState, validateScenarioSpine } from '../src/xr/progression/reconstructVrScenarioState.js';
import { deriveScenarioSpine, getNextScenarioSpinePointId } from '../src/xr/progression/scenarioSpineNavigation.js';

assert.equal(Object.isFrozen(VR_EXPERIENCE_SCENARIO_SPINE), true);
assert.equal(vrExperienceScenario.spine, VR_EXPERIENCE_SCENARIO_SPINE);
assert.deepEqual(deriveScenarioSpine(vrExperienceScenario), VR_EXPERIENCE_SCENARIO_SPINE);
assert.equal(VR_EXPERIENCE_SCENARIO_SPINE.at(-1), '100.10');
assert.equal(validateScenarioSpine(vrExperienceScenario), true);
assert.equal(getNextScenarioSpinePointId(vrExperienceScenario, '1.100'), '1.110');
assert.equal(getNextScenarioSpinePointId(vrExperienceScenario, '2.40'), '3.10');
assert.equal(getNextScenarioSpinePointId(vrExperienceScenario, '3.80'), '100.10');
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
assert.throws(() => reconstructVrScenarioState(vrExperienceScenario, '100.10'), /canonical reconstruction target/);
assert.throws(() => reconstructVrScenarioState(vrExperienceScenario, 'not-authored'), /canonical reconstruction target/);
console.log('VR Scenario derived Spine reconstruction tests passed.');
