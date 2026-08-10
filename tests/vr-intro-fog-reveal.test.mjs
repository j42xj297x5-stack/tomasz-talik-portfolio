import assert from 'node:assert/strict';
import * as THREE from '../src/vendor/three.js';
import { createVrIntroFogReveal } from '../src/xr/guidance/createVrIntroFogReveal.js';

const material = new THREE.MeshBasicMaterial();
const root = new THREE.Group();
root.add(new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), material));
const originalCompile = material.onBeforeCompile;
const origin = new THREE.Vector3(3, 1.7, 4);
const target = new THREE.Vector3(-9, 0, 9);
const reveal = createVrIntroFogReveal({
  getOriginPosition: () => origin.clone(),
  getTargetPosition: () => target.clone(),
  roots: [root],
  duration: 10
});

assert.notEqual(material.onBeforeCompile, originalCompile, 'fog shader patch covers the Monkey material root before reveal');
origin.set(5, 1.8, 7); target.set(-7, 0, 12);
reveal.start();
let snapshot = reveal.getSnapshot();
assert.deepEqual(snapshot.center.toArray(), origin.toArray(), 'reveal starts at the calibrated runtime head position');
assert.equal(snapshot.revealRadius, 13, 'radius is computed from runtime head and Monkey XZ positions');
assert.equal(snapshot.duration, 10);
reveal.update(9.999);
snapshot = reveal.getSnapshot();
assert.ok(snapshot.progress < 1); assert.equal(snapshot.active, true);
assert.notEqual(material.onBeforeCompile, originalCompile, 'black fog remains installed until ten seconds elapse');
reveal.update(0.001);
snapshot = reveal.getSnapshot();
assert.equal(snapshot.progress, 1); assert.equal(snapshot.elapsed, 10); assert.equal(snapshot.active, false);
assert.equal(material.onBeforeCompile, originalCompile, 'shader patch is removed at reveal completion');

console.log('VR intro fog runtime-distance and ten-second reveal assertions passed.');
