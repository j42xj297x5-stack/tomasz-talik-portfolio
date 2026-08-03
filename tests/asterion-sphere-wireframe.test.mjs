import assert from 'node:assert/strict';
import { ASTERION_SHELL_PATCHES } from '../src/xr/furnace/asterionShellPatchData.js';
import { assemblyOrderForIndex, assemblySegmentVisible, createAsterionPatchGeometry, cubeFaceToSphere, resolvePatchVisualStates, subdivideSegment, transformPatchUv } from '../src/xr/furnace/asterionSphereWireframe.js';

const expected = [
  ['shell-relic-1', '+X', 0, .84, false, false], ['shell-relic-2', '-X', 180, .84, false, true],
  ['shell-relic-3', '+Z', 90, .84, false, false], ['shell-relic-4', '-Z', -90, .84, true, false],
  ['shell-relic-5', '+Y', 0, .82, false, false], ['shell-relic-6', '-Y', 180, .82, true, false]
];
assert.deepEqual(ASTERION_SHELL_PATCHES.map(({ assetId, face, rotationDegrees, scale, flipU, flipV }) => [assetId, face, rotationDegrees, scale, flipU, flipV]), expected);
assert.deepEqual(transformPatchUv(.5, -.25, ASTERION_SHELL_PATCHES[0]), [.42, -.21]);
assert.deepEqual(transformPatchUv(.5, -.25, ASTERION_SHELL_PATCHES[1]).map((value) => Math.round(value * 100) / 100), [-.42, -.21]);
for (const face of ['+X', '-X', '+Y', '-Y', '+Z', '-Z']) assert.ok(Math.abs(Math.hypot(...cubeFaceToSphere(face, .4, -.2)) - 1) < 1e-12);

const points = subdivideSegment([-.8, 0, .8, 0]);
assert.ok(points.length > 2); assert.deepEqual(points[0], [-.8, 0]); assert.deepEqual(points.at(-1), [.8, 0]);
const mapped = points.map(([u, v]) => cubeFaceToSphere('+Z', u, v));
mapped.forEach((point) => assert.ok(Math.abs(Math.hypot(...point) - 1) < 1e-12));
assert.deepEqual(mapped[0], cubeFaceToSphere('+Z', -.8, 0)); assert.deepEqual(mapped.at(-1), cubeFaceToSphere('+Z', .8, 0));

const cache = createAsterionPatchGeometry(ASTERION_SHELL_PATCHES);
assert.equal(Object.keys(cache).length, 6); assert.ok(Object.isFrozen(cache['shell-relic-1'].fragments));
assert.deepEqual(Array.from({ length: 80 }, (_, index) => assemblyOrderForIndex(index, 80)), Array.from({ length: 80 }, (_, index) => assemblyOrderForIndex(index, 80)));
const sourceSegments = Array.from({ length: 80 }, (_, index) => ({ assemblyOrder: assemblyOrderForIndex(index, 80) }));
assert.equal(sourceSegments.filter((segment) => assemblySegmentVisible(segment, 0)).length, 0);
assert.ok(Math.abs(sourceSegments.filter((segment) => assemblySegmentVisible(segment, .5)).length - 40) <= 1);
assert.equal(sourceSegments.filter((segment) => assemblySegmentVisible(segment, 1)).length, 80);

const progress = { shells: expected.map(([assetId]) => ({ assetId, absorbed: assetId === 'shell-relic-4' })) };
let states = resolvePatchVisualStates(progress);
assert.equal(states['shell-relic-4'].committed, true); assert.equal(states['shell-relic-1'].committed, false);
states = resolvePatchVisualStates(progress, { assetId: 'shell-relic-2', contentState: 'CONSUMING', phase: 'EXTRACTION', extractionProgress: .5 });
assert.equal(states['shell-relic-2'].committed, false); assert.equal(states['shell-relic-2'].assemblyProgress, .5);
const shell2 = cache['shell-relic-2'];
const activeSources = new Set(shell2.fragments.filter((segment) => assemblySegmentVisible(segment, .5)).map((segment) => segment.sourceIndex));
assert.ok(Math.abs(activeSources.size - shell2.sourceSegmentCount / 2) <= 1);
console.log('Asterion sphere wireframe helper tests passed.');
