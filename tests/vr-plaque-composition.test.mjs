import assert from 'node:assert/strict';
import * as THREE from '../src/vendor/three.js';
import { createVrPlaqueComposition } from '../src/xr/createVrPlaqueComposition.js';

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera();
camera.position.set(2, 1.7, 6);
scene.add(camera);
const monkey = new THREE.Mesh(new THREE.BoxGeometry(2, 2, 2));
scene.add(monkey);
scene.updateMatrixWorld(true);
const composition = createVrPlaqueComposition({
  scene, camera, renderer: { xr: { getCamera: () => camera } }, anchorObject: monkey,
  distance: 1.35, verticalOffset: -0.42
});
const stone = new THREE.Group();
const canvas = new THREE.Group();
composition.object.add(stone, canvas);

camera.rotation.y = Math.PI / 2;
assert.equal(composition.place(), true);
const firstPosition = composition.object.position.clone();
const firstQuaternion = composition.object.quaternion.clone();
camera.rotation.y = -Math.PI / 2;
scene.updateMatrixWorld(true);
composition.reset();
composition.place();
assert.ok(composition.object.position.distanceTo(firstPosition) < 1e-12);
assert.ok(1 - Math.abs(composition.object.quaternion.dot(firstQuaternion)) < 1e-12);
assert.ok(composition.object.position.distanceTo(camera.position) < camera.position.distanceTo(monkey.position));
assert.ok(1 - Math.abs(stone.getWorldQuaternion(new THREE.Quaternion()).dot(canvas.getWorldQuaternion(new THREE.Quaternion()))) < 1e-12);

composition.reset();
assert.equal(composition.object.visible, false);
assert.deepEqual(composition.object.position.toArray(), [0, 0, 0]);
assert.equal(scene.children.filter((child) => child.name === 'VrPlaqueComposition').length, 1);
composition.dispose();
assert.equal(composition.object.parent, null);
console.log('VR plaque composition assertions passed');
