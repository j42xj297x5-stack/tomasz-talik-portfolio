import assert from 'node:assert/strict';
import * as THREE from '../src/vendor/three.js';
import { calibrateXrHeadToPlatform } from '../src/xr/calibration/calibrateXrHeadToPlatform.js';

function fixture(headOffset) {
  const experienceRoot = new THREE.Group();
  const floor = new THREE.Group(); floor.name = 'VrTiltableFloorRoot'; experienceRoot.add(floor);
  const platformRoot = new THREE.Group(); floor.add(platformRoot);
  const fixtures = new THREE.Group(); floor.add(fixtures);
  const passengerRoot = new THREE.Group(); floor.add(passengerRoot);
  const playerRig = new THREE.Group(); playerRig.position.set(0, 0, 20); passengerRoot.add(playerRig);
  const leftEye = new THREE.PerspectiveCamera(); leftEye.position.x = -0.032;
  const rightEye = new THREE.PerspectiveCamera(); rightEye.position.x = 0.032;
  const xrCamera = new THREE.ArrayCamera([leftEye, rightEye]); xrCamera.position.copy(headOffset); playerRig.add(xrCamera);
  const monkey = new THREE.Group(); monkey.position.set(0, 0, 18); floor.add(monkey);
  const stone = new THREE.Group(); stone.position.set(0.3, 0, -0.2); fixtures.add(stone);
  const ring = new THREE.Group(); experienceRoot.add(ring);
  const portal = new THREE.Group(); portal.position.set(-2, 0, -0.5); fixtures.add(portal);
  experienceRoot.updateMatrixWorld(true);
  return { experienceRoot, floor, platformRoot, playerRig, xrCamera, monkey, stone, ring, portal };
}

const calibrate = (f) => {
  const stable = [f.monkey, f.stone, f.ring, f.portal].map((object) => object.matrixWorld.clone());
  const rigBefore = f.playerRig.position.clone();
  const originalHeadY = f.platformRoot.worldToLocal(f.xrCamera.getWorldPosition(new THREE.Vector3())).y;
  calibrateXrHeadToPlatform({ playerRig: f.playerRig, xrCamera: f.xrCamera, platformRoot: f.platformRoot,
    entryDirection: new THREE.Vector3(0, 0, 1), targetRadius: 20 });
  f.experienceRoot.updateMatrixWorld(true);
  const headLocal = f.platformRoot.worldToLocal(f.xrCamera.getWorldPosition(new THREE.Vector3()));
  assert.ok(Math.abs(Math.hypot(headLocal.x, headLocal.z) - 20) < 1e-9, 'tracked ArrayCamera reaches radius 20');
  assert.ok(Math.abs(headLocal.y - originalHeadY) < 1e-9, 'physical head height is preserved');
  [f.monkey, f.stone, f.ring, f.portal].forEach((object, index) => {
    assert.ok(object.matrixWorld.equals(stable[index]), 'calibration changes no world or fixture transform');
  });
  return { rigBefore, rigAfter: f.playerRig.position.clone() };
};

const centered = fixture(new THREE.Vector3(0, 1.72, 0));
assert.deepEqual(centered.floor.position.toArray(), [0, 0, 0]);
assert.deepEqual(centered.platformRoot.position.toArray(), [0, 0, 0]);
const centeredResult = calibrate(centered);
const offset = fixture(new THREE.Vector3(0.45, 1.72, -0.35));
const offsetResult = calibrate(offset);
assert.notDeepEqual(centeredResult.rigAfter.toArray(), offsetResult.rigAfter.toArray(), 'physical offset changes only rig calibration');
assert.deepEqual(offset.monkey.position.toArray(), [0, 0, 18], 'Monkey start remains canonical');

console.log('VR ArrayCamera start calibration and spatial invariants passed');
