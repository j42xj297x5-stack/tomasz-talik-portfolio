import assert from 'node:assert/strict';
import * as THREE from '../src/vendor/three.js';
import { createVrSceneLayoutPrototype } from '../src/xr/layout/createVrSceneLayoutPrototype.js';

const layoutScene = new THREE.Group();
const layoutContainer = new THREE.Group();
layoutContainer.position.set(7, -2, 4);
layoutContainer.rotation.y = 0.35;
const floorRoot = new THREE.Group(); floorRoot.name = 'ANCHOR_FLOOR_ROOT';
floorRoot.position.set(2, 1, -3); floorRoot.rotation.y = 0.2;
const anchor = new THREE.Group(); anchor.name = 'ANCHOR_TEST';
anchor.position.set(3, 2, -1); anchor.rotation.set(0.1, -0.4, 0.2);
floorRoot.add(anchor); layoutContainer.add(floorRoot); layoutScene.add(layoutContainer);

const renderedScene = new THREE.Scene();
const runtimeFloor = new THREE.Group();
runtimeFloor.position.set(-5, 3, 8); runtimeFloor.rotation.y = -0.6;
const nestedParent = new THREE.Group();
nestedParent.position.set(1, 0.5, -2); nestedParent.rotation.x = 0.25;
const runtimeObject = new THREE.Group(); runtimeObject.scale.set(2, 3, 4);
nestedParent.add(runtimeObject); runtimeFloor.add(nestedParent); renderedScene.add(runtimeFloor);

const layout = createVrSceneLayoutPrototype(layoutScene);
const result = layout.applyTransform({ layoutNode: 'ANCHOR_TEST', layoutReference: 'ANCHOR_FLOOR_ROOT',
  runtimeObject, runtimeReference: runtimeFloor });

layoutScene.updateWorldMatrix(true, true); runtimeFloor.updateWorldMatrix(true, true);
const relative = floorRoot.matrixWorld.clone().invert().multiply(anchor.matrixWorld);
const expectedWorld = runtimeFloor.matrixWorld.clone().multiply(relative);
const actualWorldPosition = new THREE.Vector3(); const actualWorldQuaternion = new THREE.Quaternion();
runtimeObject.matrixWorld.decompose(actualWorldPosition, actualWorldQuaternion, new THREE.Vector3());
const expectedPosition = new THREE.Vector3(); const expectedQuaternion = new THREE.Quaternion();
expectedWorld.decompose(expectedPosition, expectedQuaternion, new THREE.Vector3());
assert.ok(actualWorldPosition.distanceTo(expectedPosition) < 1e-9, 'uses the floor-relative matrix with a nested runtime parent');
assert.ok(1 - Math.abs(actualWorldQuaternion.dot(expectedQuaternion)) < 1e-9, 'copies the resolved rotation');
assert.deepEqual(runtimeObject.scale.toArray(), [2, 3, 4], 'preserves runtime-owned scale');
assert.ok(result?.localPosition && result?.worldPosition && result?.quaternion);
assert.equal(layout.applyTransform({ layoutNode: 'MISSING', layoutReference: floorRoot,
  runtimeObject, runtimeReference: runtimeFloor }), null, 'a missing optional anchor is local failure only');
assert.equal(layoutScene.parent, null, 'layout data does not need to be attached to the rendered scene');
assert.equal(renderedScene.children.includes(layoutScene), false);

console.log('VR scene layout prototype tests passed.');
