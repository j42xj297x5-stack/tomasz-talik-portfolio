import assert from 'node:assert/strict';
import * as THREE from '../src/vendor/three.js';
import { createVrGlyphOrbit, angularDifference } from '../src/xr/createVrGlyphOrbit.js';
const nodes = Array.from({ length: 5 }, (_, index) => {
  const node = new THREE.Group(); node.position.y = index; node.userData.orbitAngle = Math.PI * 2 * index / 5; node.userData.orbitRadius = 3.8; return node;
});
const settings = { enabled: true, angularSpeed: 0.2, direction: 1, entryAngleThreshold: 0.3, entryAngleHysteresis: 0.05 };
const orbit = createVrGlyphOrbit({ nodes, settings, entryDirection: new THREE.Vector3(0, 0, 1), radius: 7.6 });
assert.equal(orbit.effectiveRadius, 7.6);
assert.ok(8.6 > orbit.effectiveRadius);
const before = nodes[0].position.clone(); const ready = orbit.update(0.5);
assert.notDeepEqual(nodes[0].position, before);
nodes.forEach((node, index) => { assert.equal(node.position.y, index); assert.ok(Math.abs(Math.hypot(node.position.x, node.position.z) - 7.6) < 1e-10); if (index) assert.ok(Math.abs(angularDifference(node.userData.vrOrbitAngle, nodes[index - 1].userData.vrOrbitAngle) - Math.PI * 2 / 5) < 1e-10); });
orbit.update(10); assert.notEqual(orbit.entryReady, ready); // successive glyphs enter the zone
orbit.reset(); assert.equal(orbit.entryReady, null); assert.ok(nodes[0].position.distanceTo(new THREE.Vector3(7.6, 0, 0)) < 1e-10);
orbit.dispose(); orbit.dispose(); orbit.update(1);
console.log('VR glyph orbit assertions passed');
