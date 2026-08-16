import assert from 'node:assert/strict';
import * as THREE from '../src/vendor/three.js';
import { createCanonicalXrStartCalibration } from '../src/xr/calibration/createCanonicalXrStartCalibration.js';
import { calibrateXrHeadToPlatform } from '../src/xr/calibration/calibrateXrHeadToPlatform.js';
import { getXrHeadWorldPosition } from '../src/xr/getXrHeadWorldPosition.js';
import { createVrDebugCheckpointController } from '../src/xr/progression/enterVrDebugCheckpoint.js';

function lifecycleFixture() {
  const platformRoot = new THREE.Group();
  const playerRig = new THREE.Group();
  playerRig.position.set(0, 0, 20);
  platformRoot.add(playerRig);
  const camera = new THREE.PerspectiveCamera();
  camera.position.set(0.45, 1.72, -0.35);
  playerRig.add(camera);
  const xrCamera = new THREE.ArrayCamera([]);
  const renderer = { xr: {
    updateCamera(appCamera) {
      playerRig.updateWorldMatrix(true, true);
      xrCamera.matrixWorld.multiplyMatrices(playerRig.matrixWorld, appCamera.matrix);
    },
    getCamera() { return xrCamera; }
  } };
  platformRoot.updateMatrixWorld(true);
  const order = [];
  let dispatches = 0;
  const readTrackedHead = () => {
    order.push('tracked-pose');
    return getXrHeadWorldPosition({ renderer, camera, playerRig });
  };
  const calibration = createCanonicalXrStartCalibration({
    readTrackedHead,
    calibrate(headWorldPosition) {
      order.push('calibrate');
      calibrateXrHeadToPlatform({ playerRig, headWorldPosition, platformRoot,
        entryDirection: new THREE.Vector3(0, 0, 1), targetRadius: 20 });
    },
    confirmCalibration() { order.push('confirm'); readTrackedHead(); },
    onCalibrated() { order.push('dispatch:XR_CALIBRATED'); dispatches += 1; }
  });
  return { calibration, order, playerRig, get dispatches() { return dispatches; } };
}

const fresh = lifecycleFixture();
fresh.calibration.request();
assert.deepEqual(fresh.order, [], 'a fresh request waits for an XR frame and tracked pose');
assert.equal(fresh.calibration.processFrame(), true);
assert.deepEqual(fresh.order, ['tracked-pose', 'calibrate', 'confirm', 'tracked-pose', 'dispatch:XR_CALIBRATED']);
assert.equal(fresh.calibration.processFrame(), false, 'one request is consumed only once');
assert.equal(fresh.dispatches, 1);

const debug = lifecycleFixture();
let director;
const enterP0 = createVrDebugCheckpointController({
  scenario: {}, owners: {}, restoreBaseline() {}, synchronizeDerivedState() {},
  runtime: {
    replaceDirector(next) { director = next; },
    activateCurrentPoint() {}
  },
  spawnIntro() {}, spawnRing() {},
  requestCanonicalXrStartCalibration: () => debug.calibration.request(),
  prepareSession: () => ({ state: Object.freeze({}), director: { pointId: '1.10', dispose() {} } })
});
enterP0('P0');
assert.equal(director.pointId, '1.10');
assert.deepEqual(debug.order, [], 'P0 also waits for the next tracked XR frame');
assert.equal(debug.calibration.processFrame(), true);
assert.deepEqual(debug.order, fresh.order, 'fresh and P0 execute the same production lifecycle seam');
assert.deepEqual(debug.playerRig.position.toArray(), fresh.playerRig.position.toArray(),
  'the same tracked pose produces the same calibrated rig');
assert.equal(debug.dispatches, 1);

const cancelled = lifecycleFixture();
cancelled.calibration.request();
cancelled.calibration.cancel();
assert.equal(cancelled.calibration.processFrame(), false);
assert.deepEqual(cancelled.order, []);
assert.equal(cancelled.dispatches, 0, 'cancellation emits no XR_CALIBRATED event');

console.log('Canonical fresh/P0 XR start calibration lifecycle assertions passed.');
