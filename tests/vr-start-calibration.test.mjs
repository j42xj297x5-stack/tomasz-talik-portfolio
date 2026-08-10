import assert from 'node:assert/strict';
import * as THREE from '../src/vendor/three.js';
import { calibrateXrHeadToPlatform } from '../src/xr/calibration/calibrateXrHeadToPlatform.js';

const scene = new THREE.Group();
const platformOrigin = new THREE.Group();
platformOrigin.position.set(7, 2, -4); platformOrigin.rotation.y = Math.PI / 3; scene.add(platformOrigin);
const passengerRoot = new THREE.Group();
passengerRoot.position.set(-2, 0.5, 3); passengerRoot.rotation.y = -Math.PI / 5; scene.add(passengerRoot);
const playerRig = new THREE.Group();
playerRig.position.set(1, 0.25, 5); playerRig.rotation.set(0.2, 0.4, -0.1); passengerRoot.add(playerRig);
const head = new THREE.PerspectiveCamera(); head.position.set(1.3, 1.72, -0.8); playerRig.add(head);
scene.updateMatrixWorld(true);
const originalQuaternion = playerRig.quaternion.clone();
const originalLocalY = platformOrigin.worldToLocal(head.getWorldPosition(new THREE.Vector3())).y;

calibrateXrHeadToPlatform({ playerRig, xrCamera: head, platformOrigin,
  entryDirection: new THREE.Vector3(0, 0, 1), targetRadius: 20 });
scene.updateMatrixWorld(true);
const calibratedLocal = platformOrigin.worldToLocal(head.getWorldPosition(new THREE.Vector3()));
assert.ok(Math.abs(Math.hypot(calibratedLocal.x, calibratedLocal.z) - 20) < 1e-9, 'tracked head reaches 20 m');
assert.ok(Math.abs(calibratedLocal.y - originalLocalY) < 1e-9, 'tracking height is preserved in platform space');
assert.ok(playerRig.quaternion.angleTo(originalQuaternion) < 1e-7, 'calibration does not rotate the rig');
assert.notEqual(Math.hypot(playerRig.position.x, playerRig.position.z), 20, 'rig radius is not the head contract');
const rigAfterFirstCalibration = playerRig.position.clone();
head.position.x += 0.4; scene.updateMatrixWorld(true);
assert.ok(playerRig.position.equals(rigAfterFirstCalibration), 'later physical tracking does not recalibrate the rig');
head.position.x -= 0.4; scene.updateMatrixWorld(true);
const restoredHeadLocal = platformOrigin.worldToLocal(head.getWorldPosition(new THREE.Vector3()));
const monkeyLocal = new THREE.Vector3(0, restoredHeadLocal.y, 18);
assert.ok(Math.abs(restoredHeadLocal.distanceTo(monkeyLocal) - 2) < 1e-9, '20 m head and 18 m monkey share a 2 m axis gap');

console.log('VR start calibration assertions passed');
