import assert from 'node:assert/strict';
import * as THREE from '../src/vendor/three.js';
import { createVrAsterionSphere } from '../src/xr/asterion/createVrAsterionSphere.js';
import { createVrAsterionGyroInteraction } from '../src/xr/asterion/createVrAsterionGyroInteraction.js';
import { computeClutchedTargetQuaternion, exponentialSlerpAlpha } from '../src/xr/asterion/asterionGyroMath.js';

const settings = { targetDiameter: 0.18, holdOffset: { x: 0, y: 0.07, z: -0.11 }, holdRotationDegrees: { x: 0, y: 0, z: 0 }, response: 7, lockThresholdDegrees: 0.5, lockDelaySeconds: 0.18 };

function makeModel() {
  const root = new THREE.Group(); root.name = 'ASTERION_ROOT';
  const current = new THREE.Group(); current.name = 'GIMBAL_CURRENT';
  const target = new THREE.Group(); target.name = 'GIMBAL_TARGET';
  const core = new THREE.Group(); core.name = 'CORE';
  const vertical = new THREE.Group(); vertical.name = 'VERTICAL_SYSTEM';
  const masterPivot = new THREE.Group(); masterPivot.name = 'PIV_master_ring1'; current.add(masterPivot);
  const targetPivot = new THREE.Group(); targetPivot.name = 'PIV_inner_ring1_precession'; target.add(targetPivot);
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(2, 1, 1), new THREE.MeshStandardMaterial({ emissive: 0x224466, emissiveIntensity: 2 }));
  mesh.name = 'AuthoredVisibleMesh'; target.add(mesh); current.add(target); root.add(current, core, vertical);
  const scene = new THREE.Group(); scene.add(root); return scene;
}

function makeIdleClips() {
  return Array.from({ length: 12 }, (_, i) => new THREE.AnimationClip(`ASTERION_IDLE__test_${i + 1}`, 1, [
    new THREE.VectorKeyframeTrack('AuthoredVisibleMesh.scale', [0, 1], [1, 1, 1, 1, 1, 1])
  ]));
}

function worldQuaternionOf(node) {
  node.updateWorldMatrix(true, false);
  return node.getWorldQuaternion(new THREE.Quaternion());
}

function assertQuaternionClose(actual, expected, message) {
  assert.ok(actual.angleTo(expected) < 1e-7, message);
}

{
  const sphere = createVrAsterionSphere({ model: makeModel(), animations: makeIdleClips(), settings, enabled: false });
  assert.equal(sphere.isEquipped(), false, 'normal startup without QA does not equip the sphere');
  assert.equal(sphere.getIdleClipCount(), 12, 'all idle clips are discovered');
  assert.equal(sphere.getStartedIdleClipCount(), 12, 'all non-conflicting idle clips are started');
  assert.ok(sphere.getRequiredNodes().GIMBAL_CURRENT, 'GIMBAL_CURRENT is found');
  assert.ok(sphere.getRequiredNodes().GIMBAL_TARGET, 'GIMBAL_TARGET is found');
  assert.ok(sphere.getRequiredNodes().CORE, 'CORE is found');
  assert.ok(sphere.getRequiredNodes().VERTICAL_SYSTEM, 'VERTICAL_SYSTEM is found');
  sphere.dispose();
}

const worldRoot = new THREE.Group(); worldRoot.name = 'VrWorldRoot';
const progressFloor = { object: new THREE.Group() }; progressFloor.object.name = 'VrTiltableFloorRoot'; worldRoot.add(progressFloor.object);
const leftGrip = new THREE.Group(); const rightGrip = new THREE.Group(); worldRoot.add(leftGrip, rightGrip);
const leftRay = new THREE.Group(); leftRay.visible = true;
const rightRay = new THREE.Group(); rightRay.visible = true;
const left = { handedness: 'left', isConnected: true, grip: leftGrip, ray: leftRay, isSelecting: false };
const right = { handedness: 'right', isConnected: true, grip: rightGrip, ray: rightRay, isSelecting: false };
let leftTrigger = 0;
const renderer = { xr: { getSession: () => ({ inputSources: [{ handedness: 'left', gamepad: { buttons: [{ value: leftTrigger }] } }] }) } };
const sphere = createVrAsterionSphere({ model: makeModel(), animations: makeIdleClips(), settings, enabled: true });
const gyro = createVrAsterionGyroInteraction({ sphere, controllers: [right, left], progressFloor, worldRoot, renderer, settings, enabled: true });

gyro.update(0.016);
assert.equal(sphere.isEquipped(), true, 'QA sphere equips to the resolved left grip');
assert.equal(sphere.socket.parent, leftGrip, 'QA sphere is mounted on left grip, not controller index');
assert.equal(leftRay.visible, false, 'left ordinary ray is hidden while QA sphere is equipped');
assert.equal(rightRay.visible, true, 'right ordinary ray is not touched by Asterion QA');
const initialTarget = gyro.getTargetQuaternion();
leftGrip.quaternion.setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI / 2); worldRoot.updateMatrixWorld(true);
gyro.update(0.016);
assert.ok(gyro.getTargetQuaternion().angleTo(initialTarget) < 1e-12, 'moving the hand without trigger does not change target');

leftTrigger = 1; gyro.update(0.016);
const capturedTarget = gyro.getTargetQuaternion();
assert.ok(capturedTarget.angleTo(initialTarget) < 1e-12, 'trigger down captures without snapping target');
leftGrip.quaternion.setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI); worldRoot.updateMatrixWorld(true); gyro.update(0.016);
const heldTarget = gyro.getTargetQuaternion();
assert.ok(heldTarget.angleTo(capturedTarget) > 0.1, 'controller rotation during trigger hold changes target');
leftTrigger = 0; gyro.update(0.016);
const releasedTarget = gyro.getTargetQuaternion();
leftGrip.quaternion.identity(); worldRoot.updateMatrixWorld(true); gyro.update(0.016);
assert.ok(gyro.getTargetQuaternion().angleTo(releasedTarget) < 1e-12, 'trigger up freezes target while the hand returns');
leftTrigger = 1; gyro.update(0.016);
leftGrip.quaternion.setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI / 2); worldRoot.updateMatrixWorld(true); gyro.update(0.016);
assert.ok(gyro.getTargetQuaternion().angleTo(releasedTarget) > 0.1, 'second clutch starts from existing target and accumulates');

const nodes = sphere.getRequiredNodes();
const neutralWorld = worldQuaternionOf(worldRoot);
leftGrip.position.set(1, 2, 3);
leftGrip.quaternion.setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI / 3);
worldRoot.updateMatrixWorld(true);
sphere.syncGimbals({ currentQuaternion: new THREE.Quaternion(), targetQuaternion: new THREE.Quaternion(), worldRoot });
assertQuaternionClose(worldQuaternionOf(nodes.CORE), neutralWorld, 'CORE keeps neutral world orientation while grip rotates');
assertQuaternionClose(worldQuaternionOf(nodes.VERTICAL_SYSTEM), neutralWorld, 'VERTICAL_SYSTEM keeps neutral world orientation while grip rotates');
assert.ok(sphere.socket.getWorldPosition(new THREE.Vector3()).distanceTo(leftGrip.localToWorld(settings.holdOffset ? new THREE.Vector3(settings.holdOffset.x, settings.holdOffset.y, settings.holdOffset.z) : new THREE.Vector3())) < 1e-10, 'socket translation still follows the grip');
const currentFloorQuaternion = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), Math.PI / 5);
const targetFloorQuaternion = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), -Math.PI / 7);
sphere.syncGimbals({ currentQuaternion: currentFloorQuaternion, targetQuaternion: targetFloorQuaternion, worldRoot });
assertQuaternionClose(worldQuaternionOf(nodes.GIMBAL_CURRENT), neutralWorld.clone().multiply(currentFloorQuaternion), 'GIMBAL_CURRENT world quaternion matches current floor quaternion');
assertQuaternionClose(worldQuaternionOf(nodes.GIMBAL_TARGET), neutralWorld.clone().multiply(targetFloorQuaternion), 'GIMBAL_TARGET world quaternion matches target floor quaternion');
const masterPivotQuaternion = nodes.GIMBAL_CURRENT.getObjectByName('PIV_master_ring1').quaternion.clone();
const targetPivotQuaternion = nodes.GIMBAL_TARGET.getObjectByName('PIV_inner_ring1_precession').quaternion.clone();
sphere.syncGimbals({ currentQuaternion: new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI / 4), targetQuaternion: new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), -Math.PI / 4), worldRoot });
assertQuaternionClose(nodes.GIMBAL_CURRENT.getObjectByName('PIV_master_ring1').quaternion, masterPivotQuaternion, 'runtime does not write master child pivot transform');
assertQuaternionClose(nodes.GIMBAL_TARGET.getObjectByName('PIV_inner_ring1_precession').quaternion, targetPivotQuaternion, 'runtime does not write target child pivot transform');
leftGrip.position.set(0, 0, 0);
leftGrip.quaternion.identity();
worldRoot.updateMatrixWorld(true);
assert.ok(progressFloor.object.quaternion.angleTo(gyro.getCurrentQuaternion()) < 1e-12, 'floor quaternion equals smoothed current quaternion');
assert.equal(worldRoot.position.length(), 0, 'gyro does not move player/world root position in tests');
assert.ok(gyro.getCurrentQuaternion().angleTo(gyro.getTargetQuaternion()) > 0, 'current follows target smoothly instead of snapping');

const oneStep = exponentialSlerpAlpha(7, 1 / 60);
const twoStep = 1 - (1 - exponentialSlerpAlpha(7, 1 / 120)) ** 2;
assert.ok(Math.abs(oneStep - twoStep) < 1e-12, 'exponential response is framerate independent');

gyro.reset();
assert.ok(gyro.getTargetQuaternion().angleTo(new THREE.Quaternion()) < 1e-12, 'reset target returns to identity');
assert.ok(gyro.getCurrentQuaternion().angleTo(new THREE.Quaternion()) < 1e-12, 'reset current returns to identity');
assert.ok(progressFloor.object.quaternion.angleTo(new THREE.Quaternion()) < 1e-12, 'reset floor returns to identity');
assertQuaternionClose(worldQuaternionOf(nodes.GIMBAL_CURRENT), worldQuaternionOf(worldRoot), 'reset returns GIMBAL_CURRENT to identity relative to worldRoot');
assertQuaternionClose(worldQuaternionOf(nodes.GIMBAL_TARGET), worldQuaternionOf(worldRoot), 'reset returns GIMBAL_TARGET to identity relative to worldRoot');
assertQuaternionClose(worldQuaternionOf(nodes.CORE), worldQuaternionOf(worldRoot), 'reset returns CORE to neutral world orientation');
assertQuaternionClose(worldQuaternionOf(nodes.VERTICAL_SYSTEM), worldQuaternionOf(worldRoot), 'reset returns VERTICAL_SYSTEM to neutral world orientation');

const expected = computeClutchedTargetQuaternion({
  controllerQuaternionNow: new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), Math.PI / 4),
  grabStartControllerQuaternion: new THREE.Quaternion(),
  grabStartTargetQuaternion: new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), Math.PI / 4),
  parentWorldQuaternion: new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI / 3)
});
assert.ok(expected.isQuaternion, 'clutch helper returns a quaternion for testable pure math');

gyro.dispose(); sphere.dispose();
console.log('VR Asterion gyro assertions passed');
