import assert from 'node:assert/strict';
import { deriveScenarioSpine } from '../src/xr/progression/scenarioSpineNavigation.js';
import { stateAtVrScenarioPoint } from '../src/xr/progression/reconstructVrScenarioState.js';
import { vrExperienceScenario } from '../src/xr/progression/vrExperienceScenario.js';

const expected = [
  '1.10', '1.20', '1.30', '1.40', '1.50', '1.60', '1.70', '1.80',
  '1.100', '1.110', '1.120', '1.130', '2.10', '2.20', '2.30', '2.40',
  '3.10', '3.20', '3.30', '3.40', '3.50', '3.60', '3.70', '3.80', '100.10'
];
assert.deepEqual(deriveScenarioSpine(vrExperienceScenario), expected);
assert.deepEqual(vrExperienceScenario.spine, expected, 'compatibility value is a derived projection');
assert.equal(expected.at(-1), '100.10');
assert.equal(vrExperienceScenario.points.find(({ id }) => id === '100.10').canonicalMainline, undefined);

const point = (id, target, settledConsequences = {}) => ({ id, settledConsequences,
  ...(target === undefined ? {} : { canonicalMainline: { target } }) });
const graph = (points) => ({ initialPointId: 'z-start', canonicalTerminalPointId: 'a-terminal', points });
const authored = graph([
  point('middle-2', 'a-terminal', { second: true }),
  point('a-terminal'),
  point('z-start', 'middle-10', { first: true }),
  point('local-exit'),
  point('middle-10', 'middle-2', { targetOwnConsequence: true })
]);
assert.deepEqual(deriveScenarioSpine(authored), ['z-start', 'middle-10', 'middle-2', 'a-terminal'],
  'point declaration order and pointId sorting do not define the mainline');
assert.equal(deriveScenarioSpine(authored).includes('local-exit'), false);
assert.deepEqual(stateAtVrScenarioPoint(authored, 'middle-10'), { first: true },
  'stateAt uses exclusive history from the derived mainline');
assert.equal('targetOwnConsequence' in stateAtVrScenarioPoint(authored, 'middle-10'), false);
assert.throws(() => deriveScenarioSpine(graph([
  { id: 'z-start', canonicalMainline: [{ target: 'one' }, { target: 'two' }] },
  point('one'), point('two'), point('a-terminal')
])), /exactly one outgoing canonical-mainline edge/);
assert.throws(() => deriveScenarioSpine(graph([point('z-start', 'missing'), point('a-terminal')])), /unknown target/);
assert.throws(() => deriveScenarioSpine(graph([
  point('z-start', 'middle'), point('middle', 'z-start'), point('a-terminal')
])), /cycle/);
console.log('VR M3C derived canonical Spine regression test passed.');
