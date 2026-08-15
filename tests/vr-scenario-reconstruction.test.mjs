import assert from 'node:assert/strict';
import {
  VR_EXPERIENCE_SCENARIO_SPINE,
  vrExperienceScenario
} from '../src/xr/progression/vrExperienceScenario.js';
import {
  reconstructVrScenarioState,
  validateScenarioSpine
} from '../src/xr/progression/reconstructVrScenarioState.js';
import { getNextScenarioSpinePointId } from '../src/xr/progression/scenarioSpineNavigation.js';

const removedHintPointIds = ['2.10.1', '2.30.1', '2.40.1'];

assert.equal(Object.isFrozen(VR_EXPERIENCE_SCENARIO_SPINE), true);
assert.equal(vrExperienceScenario.spine, VR_EXPERIENCE_SCENARIO_SPINE);
assert.deepEqual(VR_EXPERIENCE_SCENARIO_SPINE, [
  '1.10', '1.20', '1.30', '1.40', '1.50', '1.60', '1.70', '1.80',
  '1.100', '1.110', '1.120', '1.130', '2.10', '2.20', '2.30', '2.40',
  '3.10', '3.20', '3.30', '3.40', '3.50', '3.60', '3.70', '3.80'
]);
assert.equal(validateScenarioSpine(vrExperienceScenario), true);
const pointIds = new Set(vrExperienceScenario.points.map(({ id }) => id));
assert.equal(VR_EXPERIENCE_SCENARIO_SPINE.every((id) => pointIds.has(id)), true);
assert.equal(removedHintPointIds.some((id) => pointIds.has(id)), false,
  'hint transient state is not represented by Scenario points');
assert.equal(vrExperienceScenario.points
  .filter(({ id }) => VR_EXPERIENCE_SCENARIO_SPINE.includes(id))
  .every(({ settledConsequences }) => Object.isFrozen(settledConsequences)), true);
assert.equal(VR_EXPERIENCE_SCENARIO_SPINE.includes('100.10'), false, 'EARLY EXIT is not reconstruction history');
assert.equal(getNextScenarioSpinePointId(vrExperienceScenario, '1.100'), '1.110');
assert.equal(getNextScenarioSpinePointId(vrExperienceScenario, '2.40'), '3.10');
assert.equal(getNextScenarioSpinePointId(vrExperienceScenario, '3.40'), '3.50');
assert.equal(getNextScenarioSpinePointId(vrExperienceScenario, '3.80'), null,
  'the physical Astro claim is the authored stop boundary');
assert.throws(() => getNextScenarioSpinePointId(vrExperienceScenario, '1.130.1'), /does not belong/);
for (const [index, pointId] of VR_EXPERIENCE_SCENARIO_SPINE.entries()) {
  const nextPointId = VR_EXPERIENCE_SCENARIO_SPINE[index + 1];
  if (!nextPointId) continue;
  const point = vrExperienceScenario.points.find(({ id }) => id === pointId);
  assert.equal(point.transitions.some(({ target }) => target === nextPointId), false,
    `${pointId} must not duplicate its authored mainline successor as an explicit target`);
}
assert.throws(
  () => validateScenarioSpine({ ...vrExperienceScenario, spine: Object.freeze(['1.10', '1.10']) }),
  /duplicate point/
);
assert.throws(
  () => validateScenarioSpine({ ...vrExperienceScenario, spine: Object.freeze(['1.10', '9.90']) }),
  /unknown point/
);
assert.deepEqual(reconstructVrScenarioState(vrExperienceScenario, '1.10'), {});
const productionAtTwoTen = reconstructVrScenarioState(vrExperienceScenario, '2.10');
assert.deepEqual(productionAtTwoTen, {
  monkey: { placement: 'FINAL_STONE', visible: true, stoneVisible: true },
  intro: { phase: 'GLYPH_FREE_EXPLORE', fog: 'CLEARED', glyphRingVisible: true,
    progressionFixturesVisible: true, guideInteractionEnabled: true },
  locomotion: { boundary: 'GLYPH_RING' }
});
assert.equal(Object.isFrozen(productionAtTwoTen), true);
assert.equal(Object.isFrozen(productionAtTwoTen.intro), true);
assert.deepEqual(reconstructVrScenarioState(vrExperienceScenario, '2.10'), productionAtTwoTen,
  'production reconstruction is deterministic');
assert.equal(vrExperienceScenario.points.find(({ id }) => id === '2.10').settledConsequences.intro, undefined,
  '2.10 does not contribute its own state at entry');
const productionAtThreeTen = reconstructVrScenarioState(vrExperienceScenario, '3.10');
assert.equal(productionAtThreeTen.progression.tier, 2);
assert.equal(productionAtThreeTen.progression.activatedPageIds.length, 5);
assert.equal(productionAtThreeTen.progressFloor.activatedPages.length, 5);
assert.deepEqual(productionAtThreeTen.reliquary, { revealed: true, interactionEnabled: true });
assert.deepEqual(productionAtThreeTen.crystals, { consumedTier: 1 });
assert.deepEqual(productionAtThreeTen.postRing, { shellFieldVisible: true,
  shellInteractionEnabled: false, mainGlyphsElevated: true });
assert.equal(Object.isFrozen(productionAtThreeTen.progression.activatedPageIds), true);
assert.deepEqual(reconstructVrScenarioState(vrExperienceScenario, '3.10'), productionAtThreeTen);
assert.deepEqual(vrExperienceScenario.points.find(({ id }) => id === '3.10').settledConsequences, {});

const point = (id, settledConsequences = Object.freeze({})) => Object.freeze({
  id,
  settledConsequences
});
const alpha = Object.freeze({ alpha: Object.freeze({ settled: true }) });
const beta = Object.freeze({ beta: Object.freeze(['earned']) });
const proofScenario = Object.freeze({
  points: Object.freeze([
    point('1.10', alpha),
    point('1.20', beta),
    point('1.30')
  ]),
  spine: Object.freeze(['1.10', '1.20', '1.30'])
});

const addressOrderProof = Object.freeze({
  points: Object.freeze([point('100.500'), point('2.1'), point('alpha')]),
  spine: Object.freeze(['100.500', '2.1', 'alpha'])
});
assert.equal(getNextScenarioSpinePointId(addressOrderProof, '100.500'), '2.1',
  'navigation follows authored order rather than numeric-looking ID values');

const atB = reconstructVrScenarioState(proofScenario, '1.20');
assert.deepEqual(atB, { alpha: { settled: true } });
assert.equal('beta' in atB, false, 'the target point consequence is exclusive');
const afterB = reconstructVrScenarioState(proofScenario, '1.30');
assert.deepEqual(afterB, { alpha: { settled: true }, beta: ['earned'] });
assert.equal(Object.isFrozen(afterB), true);
assert.equal(Object.isFrozen(afterB.alpha), true);
assert.equal(Object.isFrozen(afterB.beta), true);

const insertedScenario = Object.freeze({
  points: Object.freeze([
    ...proofScenario.points,
    point('1.15', Object.freeze({ inserted: true }))
  ]),
  spine: Object.freeze(['1.10', '1.15', '1.20', '1.30'])
});
assert.deepEqual(reconstructVrScenarioState(insertedScenario, '1.20'), {
  alpha: { settled: true },
  inserted: true
});

const repeated = reconstructVrScenarioState(proofScenario, '1.30');
assert.deepEqual(repeated, afterB, 'reconstruction is deterministic');
assert.notEqual(repeated, afterB, 'each result has independent identity');
assert.notEqual(afterB.alpha, alpha.alpha, 'nested authored data is not returned by reference');
assert.deepEqual(proofScenario.points[0].settledConsequences, { alpha: { settled: true } });
assert.throws(() => { afterB.beta.push('mutation'); }, TypeError);
assert.deepEqual(atB, { alpha: { settled: true } }, 'a later reconstruction does not mutate an earlier result');
assert.throws(() => reconstructVrScenarioState(proofScenario, '9.90'), /not a canonical reconstruction target/);
assert.throws(() => reconstructVrScenarioState(vrExperienceScenario, '1.130.1'), /not a canonical reconstruction target/);

const replacementScenario = Object.freeze({
  points: Object.freeze([
    point('1.10', Object.freeze({ status: 'alpha', untouched: true })),
    point('1.20', Object.freeze({ status: 'beta' })),
    point('1.30')
  ]),
  spine: Object.freeze(['1.10', '1.20', '1.30'])
});
assert.deepEqual(reconstructVrScenarioState(replacementScenario, '1.30'), {
  status: 'beta',
  untouched: true
}, 'later top-level keys replace earlier keys and unrelated facts accumulate');

console.log('VR Scenario Spine reconstruction tests passed.');
