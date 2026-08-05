import assert from 'node:assert/strict';
import * as THREE from '../src/vendor/three.js';
import {
  applyDeadzone,
  clampPositionToWalkRadius,
  constrainRadialStep,
  createVrLocomotion,
  getHorizontalViewerBasis,
  getPlatformViewerBasis
} from '../src/xr/createVrLocomotion.js';

const EPSILON = 1e-9;
const SETTINGS = { enabled: true, deadzone: 0.2, moveSpeed: 2, turnSpeed: Math.PI / 2 };

function assertClose(actual, expected, message) {
  assert.ok(Math.abs(actual - expected) < EPSILON, `${message}: expected ${expected}, received ${actual}`);
}

function assertHorizontalPosition(rig, x, z, message) {
  assertClose(rig.position.x, x, `${message} (x)`);
  assertClose(rig.position.z, z, `${message} (z)`);
}

function createFixture({ headYaw = 0, headPitch = 0, rigYaw = 0, position = [0, 2.5, 0], surfaceRoot = null, walkRadius = Infinity } = {}) {
  const rig = new THREE.Group();
  rig.position.fromArray(position);
  rig.rotation.y = rigYaw;
  const baseCamera = new THREE.PerspectiveCamera();
  rig.add(baseCamera);

  // WebXR exposes a tracked ArrayCamera whose eye cameras carry the current viewer pose.
  const eyeCamera = new THREE.PerspectiveCamera();
  eyeCamera.rotation.set(headPitch, headYaw, 0, 'YXZ');
  const xrCamera = new THREE.ArrayCamera([eyeCamera]);

  const sources = [
    { handedness: 'left', gamepad: { axes: [0, 0, 0, 0] } },
    { handedness: 'right', gamepad: { axes: [0, 0, 0, 0] } }
  ];
  const updateCamera = () => {
    xrCamera.matrixWorld.multiplyMatrices(rig.matrixWorld, xrCamera.matrix);
    eyeCamera.matrixWorld.multiplyMatrices(rig.matrixWorld, eyeCamera.matrix);
  };
  const renderer = {
    xr: { getSession: () => ({ inputSources: sources }), getCamera: () => xrCamera, updateCamera }
  };
  rig.updateMatrixWorld(true);
  eyeCamera.updateMatrix();
  updateCamera();
  const locomotion = createVrLocomotion({ playerRig: rig, renderer, camera: baseCamera, settings: SETTINGS, surfaceRoot: surfaceRoot ?? rig.parent, walkRadius });
  return { rig, baseCamera, eyeCamera, xrCamera, sources, locomotion };
}

function setStick(fixture, hand, x, y) {
  fixture.sources.find((source) => source.handedness === hand).gamepad.axes = [0, 0, x, y];
}

function assertCameraLocalsUnchanged(fixture, action) {
  const basePosition = fixture.baseCamera.position.clone();
  const baseQuaternion = fixture.baseCamera.quaternion.clone();
  const eyePosition = fixture.eyeCamera.position.clone();
  const eyeQuaternion = fixture.eyeCamera.quaternion.clone();
  action();
  assert.ok(fixture.baseCamera.position.equals(basePosition));
  assert.ok(fixture.baseCamera.quaternion.equals(baseQuaternion));
  assert.ok(fixture.eyeCamera.position.equals(eyePosition));
  assert.ok(fixture.eyeCamera.quaternion.equals(eyeQuaternion));
}

assert.equal(applyDeadzone(0.1, 0.2), 0);
assert.equal(applyDeadzone(-0.2, 0.2), 0);
assert.ok(applyDeadzone(0.6, 0.2) > 0);

for (const { yaw, forward, right } of [
  { yaw: 0, forward: [0, -2], right: [2, 0] },
  { yaw: Math.PI / 2, forward: [-2, 0], right: [0, -2] },
  { yaw: Math.PI, forward: [0, 2], right: [-2, 0] },
  { yaw: -Math.PI / 2, forward: [2, 0], right: [0, 2] }
]) {
  const forwardFixture = createFixture({ headYaw: yaw });
  setStick(forwardFixture, 'right', 0, -1);
  forwardFixture.locomotion.update(1);
  assertHorizontalPosition(forwardFixture.rig, ...forward, `forward at viewer yaw ${yaw}`);

  const rightFixture = createFixture({ headYaw: yaw });
  setStick(rightFixture, 'right', 1, 0);
  rightFixture.locomotion.update(1);
  assertHorizontalPosition(rightFixture.rig, ...right, `right at viewer yaw ${yaw}`);
}

for (const { x, y, expectedX, expectedZ, label } of [
  { x: 0, y: -1, expectedX: 0, expectedZ: -2, label: 'forward' },
  { x: 0, y: 1, expectedX: 0, expectedZ: 2, label: 'backward' },
  { x: -1, y: 0, expectedX: -2, expectedZ: 0, label: 'left' },
  { x: 1, y: 0, expectedX: 2, expectedZ: 0, label: 'right' }
]) {
  const fixture = createFixture();
  setStick(fixture, 'right', x, y);
  fixture.locomotion.update(1);
  assertHorizontalPosition(fixture.rig, expectedX, expectedZ, label);
  assert.equal(fixture.rig.position.y, 2.5, `${label} preserves rig Y`);
}

const physicalTurn = createFixture({ headYaw: Math.PI / 2, rigYaw: 0 });
setStick(physicalTurn, 'right', 0, -1);
physicalTurn.locomotion.update(1);
assertHorizontalPosition(physicalTurn.rig, -2, 0, 'tracked head orientation differs from playerRig rotation');

const combinedTurn = createFixture({ headYaw: Math.PI / 2 });
setStick(combinedTurn, 'left', -1, 0);
setStick(combinedTurn, 'right', 0, -1);
combinedTurn.locomotion.update(1);
assertClose(combinedTurn.rig.rotation.y, Math.PI / 2, 'left stick smooth yaw');
assertHorizontalPosition(combinedTurn.rig, 0, 2, 'head yaw and same-frame rig yaw are combined');

const pitched = createFixture({ headPitch: Math.PI / 4 });
setStick(pitched, 'right', 0, -1);
pitched.locomotion.update(1);
assertHorizontalPosition(pitched.rig, 0, -2, 'pitch is removed from forward movement');
assert.equal(pitched.rig.position.y, 2.5);

const diagonal = createFixture();
setStick(diagonal, 'right', 1, -1);
diagonal.locomotion.update(1);
assertClose(Math.hypot(diagonal.rig.position.x, diagonal.rig.position.z), SETTINGS.moveSpeed, 'diagonal speed is capped');

const deadzone = createFixture({ position: [1, 2.5, 3] });
setStick(deadzone, 'right', 0.1, -0.1);
setStick(deadzone, 'left', 0.1, 0);
deadzone.locomotion.update(1);
assert.deepEqual(deadzone.rig.position.toArray(), [1, 2.5, 3]);
assert.equal(deadzone.rig.rotation.y, 0);

const cameraIntegrity = createFixture({ headYaw: 0.4, headPitch: 0.2 });
setStick(cameraIntegrity, 'left', 1, 0);
setStick(cameraIntegrity, 'right', 1, -1);
assertCameraLocalsUnchanged(cameraIntegrity, () => cameraIntegrity.locomotion.update(0.5));

const basisFixture = createFixture({ headYaw: Math.PI / 2 });
const basis = getHorizontalViewerBasis(basisFixture.xrCamera, new THREE.Vector3(), new THREE.Vector3());
assertClose(basis.forward.x, -1, 'ArrayCamera eye supplies forward basis');
assertClose(basis.right.z, -1, 'ArrayCamera eye supplies right basis');



const tiltedSurface = new THREE.Group();
tiltedSurface.rotation.z = Math.PI / 4;
tiltedSurface.updateMatrixWorld(true);
const tilted = createFixture({ surfaceRoot: tiltedSurface });
setStick(tilted, 'right', 0, -1);
tilted.locomotion.update(1);
const platformNormal = new THREE.Vector3(0, 1, 0).transformDirection(tiltedSurface.matrixWorld);
assert.ok(Math.abs(tilted.rig.position.clone().sub(new THREE.Vector3(0, 2.5, 0)).dot(platformNormal)) < 1e-9, 'tilted locomotion remains on the platform surface instead of world XZ');
assert.equal(tilted.rig.position.y, 2.5, 'tilted locomotion preserves local rig Y');

const blockedOutward = constrainRadialStep(new THREE.Vector3(2, 0, 0), new THREE.Vector3(1, 0, 0), 2);
assertClose(blockedOutward.x, 0, 'radial boundary blocks outward movement');
const tangentAllowed = constrainRadialStep(new THREE.Vector3(2, 0, 0), new THREE.Vector3(0, 0, 1), 2);
assertClose(tangentAllowed.z, 1, 'radial boundary preserves tangential movement');
const hugeStep = new THREE.Vector3(100, 0, 0);
const constrainedHuge = constrainRadialStep(new THREE.Vector3(0, 0, 0), hugeStep, 2);
assertClose(constrainedHuge.x, 2, 'large delta is constrained to walkRadius');
const clamped = clampPositionToWalkRadius(new THREE.Vector3(3, 4, 0), 2);
assertClose(Math.hypot(clamped.x, clamped.z), 2, 'final clamp keeps player inside walkRadius');

const tiltedBasis = createFixture({ headYaw: 0, surfaceRoot: tiltedSurface });
const basisOnPlatform = getPlatformViewerBasis({
  xrCamera: tiltedBasis.xrCamera,
  surfaceRoot: tiltedSurface,
  normal: new THREE.Vector3(),
  forward: new THREE.Vector3(),
  right: new THREE.Vector3()
});
assert.ok(Math.abs(basisOnPlatform.forward.dot(platformNormal)) < 1e-9, 'viewer forward projects onto platform plane');

const disposed = createFixture();
setStick(disposed, 'left', 1, 0);
setStick(disposed, 'right', 1, -1);
disposed.locomotion.dispose();
disposed.locomotion.update(1);
assert.deepEqual(disposed.rig.position.toArray(), [0, 2.5, 0]);
assert.equal(disposed.rig.rotation.y, 0);

console.log('VR locomotion assertions passed');
