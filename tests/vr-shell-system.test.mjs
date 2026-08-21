import assert from 'node:assert/strict';
import * as THREE from '../src/vendor/three.js';
import { createVrShellSystem } from '../src/xr/shells/createVrShellSystem.js';

function makeSystem(radius = 10) {
  const cloned = [];
  const assetManager = { cloneGltfScene(assetId) { cloned.push(assetId); const root = new THREE.Group();
    root.add(new THREE.Mesh(new THREE.BoxGeometry(Number(assetId.at(-1)), 1, 1))); return root; } };
  const parent = new THREE.Group();
  return { system: createVrShellSystem({ parent, assetManager, baseRadius: radius }), cloned, parent };
}
const first = makeSystem();
assert.equal(first.system.instances.length, 18);
assert.equal(first.system.panelWireframes.size, 6);
for (let index = 0; index < 6; index += 1) {
  const copies = first.system.records.slice(index * 3, index * 3 + 3);
  assert.ok(copies.every((record) => record.panelWireframe === copies[0].panelWireframe));
}
assert.notDeepEqual(first.system.getPanelWireframe('shell-relic-1'), first.system.getPanelWireframe('shell-relic-2'));
for (let index = 1; index <= 6; index += 1) assert.equal(first.cloned.filter((id) => id === `shell-relic-${index}`).length, 3);
const radii = first.system.instances.map((shell) => shell.userData.shellOrbit.radius);
assert.ok(radii.every((radius) => radius >= 10 && radius <= 20));
assert.ok(new Set(radii).size > 1);
assert.equal(first.system.object.visible, false);
assert.equal(first.system.interactionEnabled, false);
assert.ok(first.system.instances.every((shell) => shell.userData.attractorTarget === false));
first.system.setPresentationVisible(true);
assert.equal(first.system.object.visible, true);
assert.equal(first.system.interactionEnabled, false);
assert.ok(first.system.instances.every((shell) => shell.userData.attractorTarget === false));
first.system.setPresentationVisible(false);
const inactivePosition = first.system.instances[0].position.clone();
first.system.update(2);
assert.deepEqual(first.system.instances[0].position, inactivePosition);
first.system.setActive(true);
const baselineQuaternion = first.system.instances[0].quaternion.clone();
first.system.update(2);
assert.notDeepEqual(first.system.instances[0].position, inactivePosition);
assert.ok(first.system.instances[0].quaternion.angleTo(baselineQuaternion) > 0.01);
assert.ok(first.system.instances.every((shell) => Math.abs(shell.userData.selfRotationAxis.length() - 1) < 1e-12));
assert.ok(first.system.instances.every((shell) => shell.userData.selfRotationSpeed >= 0.10
  && shell.userData.selfRotationSpeed <= 0.22));
const returningShell = first.system.instances[0];
returningShell.userData.shellState = 'capture_ready';
assert.equal(first.system.returnToOrbit(returningShell, 0.1), true);
assert.equal(returningShell.userData.attractorTarget, false);
first.system.update(0.05); assert.equal(returningShell.userData.attractorTarget, false);
first.system.update(0.05);
assert.equal(returningShell.userData.shellState, 'orbiting');
assert.equal(returningShell.userData.attractorTarget, true, 'completed return restores cone eligibility');
const second = makeSystem();
assert.deepEqual(second.system.instances.map((shell) => shell.userData.shellOrbit), first.system.instances.map((shell) => shell.userData.shellOrbit));
assert.deepEqual(second.system.instances.map((shell) => shell.userData.selfRotationAxis.toArray()),
  first.system.instances.map((shell) => shell.userData.selfRotationAxis.toArray()));
const ids = new Set();
first.system.instances.forEach((shell) => {
  assert.equal(shell.userData.attractorTarget, true);
  assert.equal(shell.userData.attractorType, 'shell');
  assert.equal(shell.userData.shellState, 'orbiting');
  ids.add(shell.userData.attractorId);
});
assert.equal(ids.size, 18);
assert.ok(new Set(first.system.instances.map((shell) => shell.userData.shellOrbit.inclination)).size > 1);
const placedShell = first.system.instances[1];
placedShell.position.set(1, 2, 3); placedShell.quaternion.identity();
assert.equal(first.system.placeInstance(placedShell), true);
const placedBaseline = placedShell.position.clone(), placedRotation = placedShell.quaternion.clone();
first.system.update(0);
assert.ok(placedShell.position.distanceTo(placedBaseline) < 1e-12, 'placement starts without a teleport');
first.system.update(1);
assert.ok(Math.abs(placedShell.position.y - placedBaseline.y) <= 0.2, 'placed shell keeps bounded vertical idle motion');
assert.ok(placedShell.quaternion.angleTo(placedRotation) > 0, 'placed shell rotates slowly');
first.system.reset();
assert.ok(first.system.instances[0].quaternion.angleTo(baselineQuaternion) < 1e-12);
assert.deepEqual(first.system.instances.map((shell) => shell.position.toArray()), second.system.instances.map((shell) => shell.position.toArray()));
first.system.dispose();
assert.equal(first.parent.children.length, 0);
second.system.dispose();
console.log('VR shell system assertions passed');
