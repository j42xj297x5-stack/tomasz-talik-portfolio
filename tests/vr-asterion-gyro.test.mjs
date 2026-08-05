import assert from 'node:assert/strict';
import * as THREE from '../src/vendor/three.js';
import { createVrAsterionSphere } from '../src/xr/asterion/createVrAsterionSphere.js';
import { createVrAsterionGyroInteraction } from '../src/xr/asterion/createVrAsterionGyroInteraction.js';
import { cappedExponentialSlerp, computeClutchedTargetQuaternion, exponentialSlerpAlpha } from '../src/xr/asterion/asterionGyroMath.js';

const settings = { targetDiameter: 0.18, holdOffset: { x: 0, y: 0.07, z: -0.11 }, holdRotationDegrees: { x: 0, y: 0, z: 0 }, response: 2.5, maxAngularSpeedDegrees: 55, targetRingBlendResponse: 12, lockThresholdDegrees: 0.5, lockDelaySeconds: 0.18 };

function makeModel() {
  const root = new THREE.Group(); root.name = 'ASTERION_ROOT';
  const current = new THREE.Group(); current.name = 'GIMBAL_CURRENT';
  const target = new THREE.Group(); target.name = 'GIMBAL_TARGET';
  const core = new THREE.Group(); core.name = 'CORE';
  const vertical = new THREE.Group(); vertical.name = 'VERTICAL_SYSTEM';
  const masterPivot = new THREE.Group(); masterPivot.name = 'PIV_master_ring1'; current.add(masterPivot);
  const targetPivot = new THREE.Group(); targetPivot.name = 'PIV_inner_ring1_precession'; target.add(targetPivot);
  const inner2Pivot = new THREE.Group(); inner2Pivot.name = 'PIV_inner_ring2_precession'; target.add(inner2Pivot);
  const inner3Pivot = new THREE.Group(); inner3Pivot.name = 'PIV_inner_ring3_precession'; target.add(inner3Pivot);
  const targetAxis = new THREE.Group(); targetAxis.name = 'PIV_TARGET_AXIS';
  targetAxis.quaternion.setFromAxisAngle(new THREE.Vector3(0, 0, 1), Math.PI / 11);
  const targetAxisMesh = new THREE.Group(); targetAxisMesh.name = 'srodek'; targetAxis.add(targetAxisMesh); target.add(targetAxis);
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(2, 1, 1), new THREE.MeshStandardMaterial({ emissive: 0x224466, emissiveIntensity: 2 }));
  mesh.name = 'AuthoredVisibleMesh'; target.add(mesh); current.add(target); root.add(current, core, vertical);
  const scene = new THREE.Group(); scene.add(root); return scene;
}

function makeIdleClips() {
  const named = ['inner_ring1', 'inner_ring2', 'inner_ring3'].map((name) => new THREE.AnimationClip(`ASTERION_IDLE__${name}`, 1, [
    new THREE.VectorKeyframeTrack('AuthoredVisibleMesh.scale', [0, 1], [1, 1, 1, 1, 1, 1])
  ]));
  const generic = Array.from({ length: 9 }, (_, i) => new THREE.AnimationClip(`ASTERION_IDLE__test_${i + 1}`, 1, [
    new THREE.VectorKeyframeTrack('AuthoredVisibleMesh.scale', [0, 1], [1, 1, 1, 1, 1, 1])
  ]));
  return [...named, ...generic];
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
  assert.ok(sphere.getRequiredNodes().PIV_TARGET_AXIS, 'PIV_TARGET_AXIS is found');
  assert.ok(sphere.getRequiredNodes().srodek, 'srodek target axis mesh is found');
  assert.equal(sphere.getRequiredNodes().srodek.parent, sphere.getRequiredNodes().PIV_TARGET_AXIS, 'srodek remains a child of PIV_TARGET_AXIS');
  assert.notEqual(sphere.getRequiredNodes().srodek.parent, sphere.getRequiredNodes().CORE, 'runtime does not reparent srodek to CORE');
  assert.equal(sphere.getRequiredNodes().GIMBAL_CURRENT.getObjectByName('PIV_inner_ring1_precession')?.name, 'PIV_inner_ring1_precession', 'inner_ring1 precession pivot is reparented under GIMBAL_CURRENT');
  assert.equal(sphere.getIdleActionByClipName('ASTERION_IDLE__inner_ring1').getEffectiveWeight(), 0, 'inner_ring1 idle action has zero effective weight');
  assert.equal(sphere.getIdleActionByClipName('ASTERION_IDLE__inner_ring2').getEffectiveWeight(), 1, 'inner_ring2 idles with full effective weight');
  assert.equal(sphere.getIdleActionByClipName('ASTERION_IDLE__inner_ring3').getEffectiveWeight(), 1, 'inner_ring3 idles with full effective weight');
  sphere.dispose();
}


{
  const protectedClip = new THREE.AnimationClip('ASTERION_IDLE__target_axis_conflict', 1, [
    new THREE.QuaternionKeyframeTrack('PIV_TARGET_AXIS.quaternion', [0, 1], [0, 0, 0, 1, 0, 0, 0, 1])
  ]);
  const sphere = createVrAsterionSphere({ model: makeModel(), animations: [...makeIdleClips(), protectedClip], settings, enabled: false });
  assert.equal(sphere.getDiagnostics().conflictingClipNames.includes('ASTERION_IDLE__target_axis_conflict'), true, 'PIV_TARGET_AXIS animation tracks are rejected as runtime conflicts');
  assert.equal(sphere.getIdleActionByClipName('ASTERION_IDLE__target_axis_conflict'), null, 'conflicting PIV_TARGET_AXIS idle action is not started');
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
const targetAxisLocalRestQuaternion = nodes.PIV_TARGET_AXIS.quaternion.clone();
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
assertQuaternionClose(worldQuaternionOf(nodes.PIV_TARGET_AXIS), neutralWorld.clone().multiply(targetFloorQuaternion).multiply(targetAxisLocalRestQuaternion), 'PIV_TARGET_AXIS inherits GIMBAL_TARGET world quaternion with authored local rest');
assertQuaternionClose(worldQuaternionOf(nodes.srodek), worldQuaternionOf(nodes.PIV_TARGET_AXIS), 'srodek world quaternion follows PIV_TARGET_AXIS');
const masterPivotQuaternion = nodes.GIMBAL_CURRENT.getObjectByName('PIV_master_ring1').quaternion.clone();
const targetPivotQuaternion = nodes.GIMBAL_CURRENT.getObjectByName('PIV_inner_ring1_precession').quaternion.clone();
const inner2PivotQuaternion = nodes.GIMBAL_TARGET.getObjectByName('PIV_inner_ring2_precession').quaternion.clone();
const inner3PivotQuaternion = nodes.GIMBAL_TARGET.getObjectByName('PIV_inner_ring3_precession').quaternion.clone();
const targetAxisQuaternionBefore = nodes.PIV_TARGET_AXIS.quaternion.clone();
const targetAxisWorldBeforeCurrentOnly = worldQuaternionOf(nodes.PIV_TARGET_AXIS);
sphere.syncGimbals({ currentQuaternion: new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI / 4), targetQuaternion: targetFloorQuaternion, worldRoot });
assertQuaternionClose(nodes.GIMBAL_CURRENT.getObjectByName('PIV_master_ring1').quaternion, masterPivotQuaternion, 'runtime does not write master child pivot transform');
assertQuaternionClose(nodes.GIMBAL_CURRENT.getObjectByName('PIV_inner_ring1_precession').quaternion, targetPivotQuaternion, 'runtime does not write inner_ring1 child pivot transform');
assertQuaternionClose(nodes.GIMBAL_TARGET.getObjectByName('PIV_inner_ring2_precession').quaternion, inner2PivotQuaternion, 'runtime does not write inner_ring2 child pivot transform');
assertQuaternionClose(nodes.GIMBAL_TARGET.getObjectByName('PIV_inner_ring3_precession').quaternion, inner3PivotQuaternion, 'runtime does not write inner_ring3 child pivot transform');
assertQuaternionClose(nodes.PIV_TARGET_AXIS.quaternion, targetAxisQuaternionBefore, 'runtime does not write PIV_TARGET_AXIS local quaternion');
assertQuaternionClose(worldQuaternionOf(nodes.PIV_TARGET_AXIS), targetAxisWorldBeforeCurrentOnly, 'changing currentQuaternion alone does not change TARGET axis');
assertQuaternionClose(worldQuaternionOf(nodes.srodek), targetAxisWorldBeforeCurrentOnly, 'changing currentQuaternion alone does not change srodek target axis');
const changedTargetQuaternion = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), Math.PI / 6);
sphere.syncGimbals({ currentQuaternion: new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI / 4), targetQuaternion: changedTargetQuaternion, worldRoot });
assert.ok(worldQuaternionOf(nodes.srodek).angleTo(targetAxisWorldBeforeCurrentOnly) > 0.1, 'changing targetQuaternion changes srodek world orientation with target frame');
assertQuaternionClose(worldQuaternionOf(nodes.PIV_TARGET_AXIS), worldQuaternionOf(nodes.srodek), 'target axis and srodek continue to rotate together after target changes');
leftGrip.position.set(0, 0, 0);
leftGrip.quaternion.identity();
worldRoot.updateMatrixWorld(true);

const inner2Action = sphere.getIdleActionByClipName('ASTERION_IDLE__inner_ring2');
const inner3Action = sphere.getIdleActionByClipName('ASTERION_IDLE__inner_ring3');
assert.equal(inner2Action.getEffectiveWeight(), 1, 'inner2 target ring starts drifting in idle');
assert.equal(inner3Action.getEffectiveWeight(), 1, 'inner3 target ring starts drifting in idle');
const inner2TimeBeforeWeightChange = inner2Action.time;
sphere.setTargetRingsStabilized(true);
sphere.update(1 / 60);
assert.ok(inner2Action.getEffectiveWeight() < 1 && inner2Action.getEffectiveWeight() > 0, 'targeting smoothly fades inner2/3 weight toward stable target');
assert.equal(inner2Action.getEffectiveWeight(), inner3Action.getEffectiveWeight(), 'inner2 and inner3 share the same smoothed weight');
assert.ok(inner2Action.time > inner2TimeBeforeWeightChange, 'changing target ring weight does not restart action time');
for (let i = 0; i < 40; i += 1) sphere.update(1 / 60);
assert.ok(inner2Action.getEffectiveWeight() < 0.01, 'targeting convergence drives target ring weight near zero');
const inner2TimeBeforeDriftReturn = inner2Action.time;
sphere.setTargetRingsStabilized(false);
sphere.update(1 / 60);
assert.ok(inner2Action.getEffectiveWeight() > 0 && inner2Action.getEffectiveWeight() < 1, 'locked/idle smoothly restores target ring drift weight');
assert.ok(inner2Action.time > inner2TimeBeforeDriftReturn, 'restoring target ring weight does not restart action time');
for (let i = 0; i < 40; i += 1) sphere.update(1 / 60);
assert.ok(inner2Action.getEffectiveWeight() > 0.99, 'locked/idle convergence restores target ring weight near one');

assert.ok(progressFloor.object.quaternion.angleTo(gyro.getCurrentQuaternion()) < 1e-12, 'floor quaternion equals smoothed current quaternion');
assert.equal(worldRoot.position.length(), 0, 'gyro does not move player/world root position in tests');
assert.ok(gyro.getCurrentQuaternion().angleTo(gyro.getTargetQuaternion()) > 0, 'current follows target smoothly instead of snapping');

const oneStep = exponentialSlerpAlpha(2.5, 1 / 60);
const twoStep = 1 - (1 - exponentialSlerpAlpha(2.5, 1 / 120)) ** 2;
assert.ok(Math.abs(oneStep - twoStep) < 1e-12, 'exponential response is framerate independent');

const cappedCurrent = new THREE.Quaternion();
const cappedTarget = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI);
cappedExponentialSlerp(cappedCurrent, cappedTarget, { response: 99, deltaSeconds: 1, maxAngularSpeedDegrees: 55 });
assert.ok(Math.abs(cappedCurrent.angleTo(new THREE.Quaternion()) - THREE.MathUtils.degToRad(55)) < 1e-12, 'current angular speed is capped at maxAngularSpeedDegrees');
const nearCurrentA = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), THREE.MathUtils.degToRad(1));
const nearCurrentB = nearCurrentA.clone();
const nearTarget = new THREE.Quaternion();
cappedExponentialSlerp(nearCurrentA, nearTarget, { response: 2.5, deltaSeconds: 1 / 60, maxAngularSpeedDegrees: 55 });
cappedExponentialSlerp(nearCurrentB, nearTarget, { response: 2.5, deltaSeconds: 1 / 120, maxAngularSpeedDegrees: 55 });
cappedExponentialSlerp(nearCurrentB, nearTarget, { response: 2.5, deltaSeconds: 1 / 120, maxAngularSpeedDegrees: 55 });
assert.ok(Math.abs(nearCurrentA.angleTo(nearTarget) - nearCurrentB.angleTo(nearTarget)) < 1e-9, 'capped exponential convergence is FPS-independent near target');


gyro.reset();
assert.ok(gyro.getTargetQuaternion().angleTo(new THREE.Quaternion()) < 1e-12, 'reset target returns to identity');
assert.ok(gyro.getCurrentQuaternion().angleTo(new THREE.Quaternion()) < 1e-12, 'reset current returns to identity');
assert.ok(progressFloor.object.quaternion.angleTo(new THREE.Quaternion()) < 1e-12, 'reset floor returns to identity');
assertQuaternionClose(worldQuaternionOf(nodes.GIMBAL_CURRENT), worldQuaternionOf(worldRoot), 'reset returns GIMBAL_CURRENT to identity relative to worldRoot');
assertQuaternionClose(worldQuaternionOf(nodes.GIMBAL_TARGET), worldQuaternionOf(worldRoot), 'reset returns GIMBAL_TARGET to identity relative to worldRoot');
assertQuaternionClose(worldQuaternionOf(nodes.CORE), worldQuaternionOf(worldRoot), 'reset returns CORE to neutral world orientation');
assertQuaternionClose(worldQuaternionOf(nodes.VERTICAL_SYSTEM), worldQuaternionOf(worldRoot), 'reset returns VERTICAL_SYSTEM to neutral world orientation');
assert.equal(nodes.GIMBAL_CURRENT.getObjectByName('PIV_inner_ring1_precession')?.name, 'PIV_inner_ring1_precession', 'reset keeps inner_ring1 under GIMBAL_CURRENT');
assert.equal(nodes.srodek.parent, nodes.PIV_TARGET_AXIS, 'reset keeps srodek under PIV_TARGET_AXIS');
assertQuaternionClose(nodes.PIV_TARGET_AXIS.quaternion, targetAxisLocalRestQuaternion, 'reset preserves PIV_TARGET_AXIS authored local rest quaternion');
sphere.reset();
assert.equal(sphere.getIdleActionByClipName('ASTERION_IDLE__inner_ring1').getEffectiveWeight(), 0, 'sphere reset keeps inner1 action weight zero');
assert.equal(sphere.getIdleActionByClipName('ASTERION_IDLE__inner_ring2').getEffectiveWeight(), 1, 'sphere reset restores inner2 action weight one');
assert.equal(sphere.getIdleActionByClipName('ASTERION_IDLE__inner_ring3').getEffectiveWeight(), 1, 'sphere reset restores inner3 action weight one');

const expected = computeClutchedTargetQuaternion({
  controllerQuaternionNow: new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), Math.PI / 4),
  grabStartControllerQuaternion: new THREE.Quaternion(),
  grabStartTargetQuaternion: new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), Math.PI / 4),
  parentWorldQuaternion: new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI / 3)
});
assert.ok(expected.isQuaternion, 'clutch helper returns a quaternion for testable pure math');

gyro.dispose(); sphere.dispose();
console.log('VR Asterion gyro assertions passed');
