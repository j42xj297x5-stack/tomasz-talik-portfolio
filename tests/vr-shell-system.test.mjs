import assert from 'node:assert/strict';
import * as THREE from '../src/vendor/three.js';
import { createVrShellSystem } from '../src/xr/shells/createVrShellSystem.js';

function makeSystem(radius = 10) {
  const cloned = [];
  const assetManager = { cloneGltfScene(assetId) { cloned.push(assetId); return new THREE.Group(); } };
  const parent = new THREE.Group();
  return { system: createVrShellSystem({ parent, assetManager, baseRadius: radius }), cloned, parent };
}
const first = makeSystem();
assert.equal(first.system.instances.length, 18);
for (let index = 1; index <= 6; index += 1) assert.equal(first.cloned.filter((id) => id === `shell-relic-${index}`).length, 3);
const radii = first.system.instances.map((shell) => shell.userData.shellOrbit.radius);
assert.ok(radii.every((radius) => radius >= 10 && radius <= 20));
assert.ok(new Set(radii).size > 1);
assert.equal(first.system.object.visible, false);
const inactivePosition = first.system.instances[0].position.clone();
first.system.update(2);
assert.deepEqual(first.system.instances[0].position, inactivePosition);
first.system.setActive(true);
first.system.update(2);
assert.notDeepEqual(first.system.instances[0].position, inactivePosition);
const second = makeSystem();
assert.deepEqual(second.system.instances.map((shell) => shell.userData.shellOrbit), first.system.instances.map((shell) => shell.userData.shellOrbit));
const ids = new Set();
first.system.instances.forEach((shell) => {
  assert.equal(shell.userData.attractorTarget, true);
  assert.equal(shell.userData.attractorType, 'shell');
  assert.equal(shell.userData.shellState, 'orbiting');
  ids.add(shell.userData.attractorId);
});
assert.equal(ids.size, 18);
assert.ok(new Set(first.system.instances.map((shell) => shell.userData.shellOrbit.inclination)).size > 1);
first.system.reset();
assert.deepEqual(first.system.instances.map((shell) => shell.position.toArray()), second.system.instances.map((shell) => shell.position.toArray()));
first.system.dispose();
assert.equal(first.parent.children.length, 0);
second.system.dispose();
console.log('VR shell system assertions passed');
