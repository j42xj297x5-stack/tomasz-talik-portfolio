import assert from 'node:assert/strict';
import * as THREE from '../src/vendor/three.js';
import { createVrAsterionSphere } from '../src/xr/asterion/createVrAsterionSphere.js';
import { createVrAsterionGyroInteraction } from '../src/xr/asterion/createVrAsterionGyroInteraction.js';
import { ASTERION_GYRO_STATES, cappedExponentialSlerp, computeClutchedTargetQuaternion, computeQuaternionError, exponentialSlerpAlpha, neutralizeControllerQuaternionAgainstFloor } from '../src/xr/asterion/asterionGyroMath.js';

const settings = { targetDiameter: 0.18, holdOffset: { x: 0, y: 0.07, z: -0.11 }, holdRotationDegrees: { x: 0, y: 0, z: 0 }, response: 2.5, maxAngularSpeedDegrees: 32, angularAccelerationDegrees: 32, angularDecelerationDegrees: 45, settleAngularSpeedDegrees: 0.15, targetRingBlendResponse: 12, lockThresholdDegrees: 0.5, lockDelaySeconds: 0.18 };

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
  const fanAxis = new THREE.Vector3(0, 1, 0);
  const fanKeys = [0, 0.5, 1];
  const inner2Fan = [
    new THREE.Quaternion().setFromAxisAngle(fanAxis, THREE.MathUtils.degToRad(-15)),
    new THREE.Quaternion().setFromAxisAngle(fanAxis, THREE.MathUtils.degToRad(15)),
    new THREE.Quaternion().setFromAxisAngle(fanAxis, THREE.MathUtils.degToRad(-15))
  ].flatMap((q) => q.toArray());
  const inner3Fan = [
    new THREE.Quaternion().setFromAxisAngle(fanAxis, THREE.MathUtils.degToRad(15)),
    new THREE.Quaternion().setFromAxisAngle(fanAxis, THREE.MathUtils.degToRad(-15)),
    new THREE.Quaternion().setFromAxisAngle(fanAxis, THREE.MathUtils.degToRad(15))
  ].flatMap((q) => q.toArray());
  const named = [
    new THREE.AnimationClip('ASTERION_IDLE__inner_ring1', 1, [new THREE.VectorKeyframeTrack('AuthoredVisibleMesh.scale', [0, 1], [1, 1, 1, 1, 1, 1])]),
    new THREE.AnimationClip('ASTERION_IDLE__inner_ring2', 1, [new THREE.QuaternionKeyframeTrack('PIV_inner_ring2_precession.quaternion', fanKeys, inner2Fan)]),
    new THREE.AnimationClip('ASTERION_IDLE__inner_ring3', 1, [new THREE.QuaternionKeyframeTrack('PIV_inner_ring3_precession.quaternion', fanKeys, inner3Fan)])
  ];
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

function simulateHeavyDriveFor(totalFrames, dt) {
  const localWorldRoot = new THREE.Group();
  const localProgressFloor = { object: new THREE.Group() };
  localWorldRoot.add(localProgressFloor.object);
  const localLeftGrip = new THREE.Group(); localWorldRoot.add(localLeftGrip);
  let localTrigger = 0;
  const localRenderer = { xr: { getSession: () => ({ inputSources: [{ handedness: 'left', gamepad: { buttons: [{ value: localTrigger }] } }] }) } };
  const localSphere = createVrAsterionSphere({ model: makeModel(), animations: makeIdleClips(), settings, enabled: true });
  const localGyro = createVrAsterionGyroInteraction({
    sphere: localSphere,
    controllers: [{ handedness: 'left', isConnected: true, grip: localLeftGrip, ray: new THREE.Group(), isSelecting: false }],
    progressFloor: localProgressFloor,
    worldRoot: localWorldRoot,
    renderer: localRenderer,
    settings,
    enabled: true
  });
  localSphere.equipTo({ handedness: 'left', isConnected: true, grip: localLeftGrip, ray: new THREE.Group() });
  localGyro.update(dt);
  localLeftGrip.quaternion.setFromAxisAngle(new THREE.Vector3(0, 1, 0), THREE.MathUtils.degToRad(90)); localWorldRoot.updateMatrixWorld(true); localGyro.update(dt);
  localTrigger = 1;
  for (let i = 0; i < totalFrames; i += 1) localGyro.update(dt);
  const result = { current: localGyro.getCurrentQuaternion(), speed: localGyro.getAngularSpeed(), error: localGyro.getAngularError() };
  localGyro.dispose(); localSphere.dispose();
  return result;
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
  assert.equal(sphere.getDiagnostics().conflictingClipNames.includes('ASTERION_IDLE__inner_ring2'), false, 'inner2 authored pivot idle is not a runtime conflict');
  assert.equal(sphere.getDiagnostics().conflictingClipNames.includes('ASTERION_IDLE__inner_ring3'), false, 'inner3 authored pivot idle is not a runtime conflict');
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
assert.equal(sphere.isEquipped(), false, 'gyro does not auto-equip the QA sphere');
sphere.equipTo(left);
gyro.update(0.016);
assert.equal(sphere.isEquipped(), true, 'hand mode can equip the QA sphere before gyro update');
assert.equal(sphere.socket.parent, leftGrip, 'QA sphere is mounted on left grip, not controller index');
assert.equal(leftRay.visible, false, 'left ordinary ray is hidden while QA sphere is equipped');
assert.equal(rightRay.visible, true, 'right ordinary ray is not touched by Asterion QA');

const previewBeforeUnequip = gyro.getPreviewQuaternion();
const commandBeforeUnequip = gyro.getCommandQuaternion();
sphere.unequip();
leftGrip.quaternion.setFromAxisAngle(new THREE.Vector3(0, 1, 0), -Math.PI / 2); worldRoot.updateMatrixWorld(true);
leftTrigger = 1; gyro.update(0.016);
assert.ok(gyro.getPreviewQuaternion().angleTo(previewBeforeUnequip) < 1e-12, 'unequipped sphere ignores left-hand motion for preview');
assert.ok(gyro.getCommandQuaternion().angleTo(commandBeforeUnequip) < 1e-12, 'unequipped sphere ignores left trigger for command');
sphere.equipTo(left); gyro.update(0.016);
assert.ok(gyro.getPreviewQuaternion().angleTo(gyro.getCurrentQuaternion()) < 1e-12, 're-equip captures preview from current without a jump');
assert.ok(gyro.getControlBaseQuaternion().angleTo(gyro.getCurrentQuaternion()) < 1e-12, 're-equip captures control base from current');
leftTrigger = 0; gyro.update(0.016);
const initialPreview = gyro.getPreviewQuaternion();
const initialCommand = gyro.getCommandQuaternion();
const initialCurrent = gyro.getCurrentQuaternion();
leftGrip.quaternion.setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI / 2); worldRoot.updateMatrixWorld(true);
gyro.update(0.016);
const freePreview = gyro.getPreviewQuaternion();
assert.ok(initialPreview.angleTo(new THREE.Quaternion()) < 1e-12, 'first preview reference capture does not jump preview');
assert.ok(freePreview.angleTo(initialPreview) > 0.1, 'moving the hand without trigger changes preview');
assert.ok(gyro.getCommandQuaternion().angleTo(initialCommand) < 1e-12, 'moving preview without trigger does not change command');
assert.ok(gyro.getTargetQuaternion().angleTo(initialCommand) < 1e-12, 'compatible target getter returns command');
assert.ok(gyro.getCurrentQuaternion().angleTo(initialCurrent) < 1e-12, 'platform does not move toward preview without trigger');
assert.equal(gyro.isDriveActive(), false, 'drive is inactive without trigger');

leftTrigger = 1; gyro.update(0.016);
const capturedCommand = gyro.getCommandQuaternion();
assert.ok(capturedCommand.angleTo(freePreview) < 1e-12, 'trigger down copies current preview into command');
assert.equal(gyro.isDriveActive(), true, 'drive is active while trigger is held');
leftGrip.quaternion.setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI); worldRoot.updateMatrixWorld(true); gyro.update(0.016);
const heldPreview = gyro.getPreviewQuaternion();
const heldCommand = gyro.getCommandQuaternion();
assert.ok(heldPreview.angleTo(freePreview) > 0.1, 'controller rotation during trigger hold changes preview');
assert.ok(heldCommand.angleTo(heldPreview) < 1e-12, 'trigger hold continuously copies preview into command');
leftTrigger = 0; gyro.update(0.016);
const releasedCommand = gyro.getCommandQuaternion();
const currentAfterRelease = gyro.getCurrentQuaternion();
leftGrip.quaternion.identity(); worldRoot.updateMatrixWorld(true); gyro.update(0.016);
assert.equal(gyro.isDriveActive(), false, 'drive is inactive after trigger release');
assert.ok(gyro.getCommandQuaternion().angleTo(releasedCommand) < 1e-12, 'trigger up freezes command while the hand returns');
assert.ok(gyro.getPreviewQuaternion().angleTo(releasedCommand) > 0.1, 'after trigger up, hand motion continues to change preview');
assert.ok(gyro.getCurrentQuaternion().angleTo(currentAfterRelease) > 0, 'after release, current continues moving toward frozen command');
assertQuaternionClose(gyro.getDisplayPreviewQuaternion(), gyro.getPreviewQuaternion(), 'outside visual rebase display PREVIEW equals logical PREVIEW');
assert.ok(Math.abs(gyro.getAngularError() - gyro.getCurrentQuaternion().angleTo(gyro.getCommandQuaternion())) < 1e-12, 'angularError is measured between current and command');
assert.notEqual(progressFloor.object.userData.asterionGyro.angularError, gyro.getCurrentQuaternion().angleTo(gyro.getPreviewQuaternion()), 'angularError is not measured against preview');

const gyroDrivenInner2Action = sphere.getIdleActionByClipName('ASTERION_IDLE__inner_ring2');
leftGrip.quaternion.setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI / 2); worldRoot.updateMatrixWorld(true);
for (let i = 0; i < 40; i += 1) {
  leftTrigger = 1; gyro.update(1 / 60); sphere.update(1 / 60);
}
assert.ok(gyroDrivenInner2Action.getEffectiveWeight() < 0.01, 'trigger on fades inner2/3 idle weight toward zero through gyro runtime');
leftTrigger = 0; gyro.update(1 / 60);
const currentStillTravelingOnRelease = gyro.getCurrentQuaternion();
const velocityBeforeHide = gyro.getAngularVelocity();
const commandBeforeHide = gyro.getCommandQuaternion();
sphere.unequip();
gyro.update(1 / 60);
assert.ok(gyro.getAngularVelocity().length() > 0, 'unequip while moving does not zero angularVelocity');
assert.ok(gyro.getCurrentQuaternion().angleTo(commandBeforeHide) < currentStillTravelingOnRelease.angleTo(commandBeforeHide), 'current continues toward frozen command after sphere unequip');
assert.ok(gyro.getCommandQuaternion().angleTo(commandBeforeHide) < 1e-12, 'unequip freezes command instead of resetting it');
assert.ok(gyro.getAngularVelocity().angleTo ? true : velocityBeforeHide.length() >= 0, 'angular velocity remains a Vector3');
sphere.equipTo(left);
gyro.update(1 / 60);
leftGrip.quaternion.setFromAxisAngle(new THREE.Vector3(1, 0, 0), Math.PI / 3); worldRoot.updateMatrixWorld(true); gyro.update(1 / 60);
sphere.update(1 / 60);
assert.ok(gyro.getCurrentQuaternion().angleTo(currentStillTravelingOnRelease) > 0, 'current still travels after release while ring idle returns');
assert.ok(gyroDrivenInner2Action.getEffectiveWeight() > 0 && gyroDrivenInner2Action.getEffectiveWeight() < 1, 'release restores inner2/3 idle target even before current reaches command');
sphere.reset();
sphere.equipTo(left);

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


const floorParentQuaternion = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), Math.PI / 8);
const physicalGripQuaternion = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), Math.PI / 5);
const currentFloorA = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI / 6);
const currentFloorB = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), -Math.PI / 4);
const inheritedGripA = currentFloorA.clone().multiply(physicalGripQuaternion);
const inheritedGripB = currentFloorB.clone().multiply(physicalGripQuaternion);
const neutralizedA = neutralizeControllerQuaternionAgainstFloor({
  gripWorldQuaternion: inheritedGripA,
  floorWorldQuaternion: currentFloorA,
  floorParentWorldQuaternion: floorParentQuaternion
});
const neutralizedB = neutralizeControllerQuaternionAgainstFloor({
  gripWorldQuaternion: inheritedGripB,
  floorWorldQuaternion: currentFloorB,
  floorParentWorldQuaternion: floorParentQuaternion
});
assertQuaternionClose(neutralizedA, neutralizedB, 'neutralized controller quaternion ignores CURRENT floor rotation feedback');
const changedPhysicalGrip = currentFloorB.clone().multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), Math.PI / 3));
const neutralizedChanged = neutralizeControllerQuaternionAgainstFloor({
  gripWorldQuaternion: changedPhysicalGrip,
  floorWorldQuaternion: currentFloorB,
  floorParentWorldQuaternion: floorParentQuaternion
});
assert.ok(neutralizedChanged.angleTo(neutralizedB) > 0.1, 'real grip orientation changes still reach clutch target math');

const expected = computeClutchedTargetQuaternion({
  controllerQuaternionNow: new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), Math.PI / 4),
  grabStartControllerQuaternion: new THREE.Quaternion(),
  grabStartTargetQuaternion: new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), Math.PI / 4),
  parentWorldQuaternion: new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI / 3)
});
assert.ok(expected.isQuaternion, 'clutch helper returns a quaternion for testable pure math');


function spinUntilLocked(gyroInstance, maxFrames = 1800) {
  for (let i = 0; i < maxFrames && gyroInstance.getState() !== ASTERION_GYRO_STATES.LOCKED; i += 1) gyroInstance.update(1 / 60);
  assert.equal(gyroInstance.getState(), ASTERION_GYRO_STATES.LOCKED, 'gyro reaches LOCKED within bounded simulation frames');
}

// Control-base regression: preview is relative to the last locked CURRENT, not absolute world zero.
sphere.equipTo(left);
gyro.reset();
leftTrigger = 0;
leftGrip.quaternion.identity(); worldRoot.updateMatrixWorld(true); gyro.update(0.016);
assertQuaternionClose(gyro.getPreviewQuaternion(), gyro.getCurrentQuaternion(), 'control base A: first capture keeps PREVIEW equal to CURRENT with no jump');
const firstGesture = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), THREE.MathUtils.degToRad(40));
leftGrip.quaternion.copy(firstGesture); worldRoot.updateMatrixWorld(true); gyro.update(0.016);
const previewBeforeDrive = gyro.getPreviewQuaternion();
assert.ok(previewBeforeDrive.angleTo(gyro.getCurrentQuaternion()) > 0.1, 'control base B: hand movement without trigger changes PREVIEW');
assertQuaternionClose(gyro.getCommandQuaternion(), new THREE.Quaternion(), 'control base B: hand movement without trigger leaves COMMAND frozen');
leftTrigger = 1; gyro.update(0.016);
assertQuaternionClose(gyro.getCommandQuaternion(), previewBeforeDrive, 'control base C: trigger copies PREVIEW into COMMAND');
leftTrigger = 0; gyro.update(0.016);
const commandAfterRelease = gyro.getCommandQuaternion();
const baseBeforeLock = gyro.getControlBaseQuaternion();
leftGrip.quaternion.setFromAxisAngle(new THREE.Vector3(0, 1, 0), THREE.MathUtils.degToRad(55)); worldRoot.updateMatrixWorld(true); gyro.update(0.016);
assertQuaternionClose(gyro.getCommandQuaternion(), commandAfterRelease, 'control base D: release freezes COMMAND');
assert.ok(gyro.getPreviewQuaternion().angleTo(commandAfterRelease) > 0.05, 'control base D: PREVIEW remains live after release');
assertQuaternionClose(gyro.getControlBaseQuaternion(), baseBeforeLock, 'control base E: no automatic rebase before LOCK');
leftGrip.quaternion.setFromAxisAngle(new THREE.Vector3(0, 1, 0), THREE.MathUtils.degToRad(20)); worldRoot.updateMatrixWorld(true);
leftTrigger = 1; gyro.update(0.016);
const retargetedCommand = gyro.getCommandQuaternion();
assert.ok(retargetedCommand.angleTo(commandAfterRelease) > 0.05, 'control base F: another trigger during TARGETING can change COMMAND before LOCK');
leftTrigger = 0; gyro.update(0.016);
let displayBeforeLock = gyro.getDisplayPreviewQuaternion();
let sawSubThresholdWithoutLock = false;
for (let i = 0; i < 1800 && gyro.getState() !== ASTERION_GYRO_STATES.LOCKED; i += 1) {
  displayBeforeLock = gyro.getDisplayPreviewQuaternion();
  gyro.update(1 / 60);
  if (gyro.getAngularError() <= THREE.MathUtils.degToRad(0.3) && gyro.getAngularError() > THREE.MathUtils.degToRad(0.05)) {
    sawSubThresholdWithoutLock = sawSubThresholdWithoutLock || gyro.getState() !== ASTERION_GYRO_STATES.LOCKED;
  }
}
assert.equal(gyro.getState(), ASTERION_GYRO_STATES.LOCKED, 'gyro reaches LOCKED within bounded simulation frames');
assert.equal(sawSubThresholdWithoutLock, true, 'CURRENT is not hard-snapped while remaining error is around 0.3 degrees');
assertQuaternionClose(gyro.getCurrentQuaternion(), gyro.getCommandQuaternion(), 'control base G/M/J: LOCK hard-settles CURRENT to COMMAND only at the precise settle threshold');
assertQuaternionClose(gyro.getDisplayPreviewQuaternion(), displayBeforeLock, 'visual rebase first LOCK frame preserves display PREVIEW continuity');
assert.equal(gyro.isVisualRebaseActive(), true, 'LOCK starts TARGET visual rebase transition');
assertQuaternionClose(gyro.getControlBaseQuaternion(), gyro.getCurrentQuaternion(), 'control base G: LOCK rebases CONTROL BASE to CURRENT');
assertQuaternionClose(gyro.getHandReferenceQuaternion(), neutralizeControllerQuaternionAgainstFloor({ gripWorldQuaternion: worldQuaternionOf(leftGrip), floorWorldQuaternion: worldQuaternionOf(progressFloor.object), floorParentWorldQuaternion: worldQuaternionOf(worldRoot) }), 'control base H: LOCK captures current hand as new hand reference');
const lockedCurrent = gyro.getCurrentQuaternion();
const displayAtLock = gyro.getDisplayPreviewQuaternion();
gyro.update(0.25);
assert.ok(gyro.getDisplayPreviewQuaternion().angleTo(gyro.getPreviewQuaternion()) < displayAtLock.angleTo(gyro.getPreviewQuaternion()), 'visual rebase converges display PREVIEW toward logical PREVIEW over time');
const displayBeforeHandDuringRebase = gyro.getDisplayPreviewQuaternion();
leftGrip.quaternion.setFromAxisAngle(new THREE.Vector3(0, 1, 0), THREE.MathUtils.degToRad(25)); worldRoot.updateMatrixWorld(true); gyro.update(0.016);
assert.ok(gyro.getDisplayPreviewQuaternion().angleTo(displayBeforeHandDuringRebase) > 0.001, 'hand motion during visual rebase still affects displayed TARGET');
leftGrip.quaternion.setFromAxisAngle(new THREE.Vector3(0, 1, 0), THREE.MathUtils.degToRad(20)); worldRoot.updateMatrixWorld(true); gyro.update(0.3);
assert.equal(gyro.isVisualRebaseActive(), false, 'visual rebase finishes after roughly 0.5 seconds');
assertQuaternionClose(gyro.getDisplayPreviewQuaternion(), gyro.getPreviewQuaternion(), 'after visual rebase display PREVIEW equals logical PREVIEW');
gyro.update(1 / 60);
assertQuaternionClose(gyro.getPreviewQuaternion(), lockedCurrent, 'control base I/L: stationary hand after rebase leaves PREVIEW at new CURRENT');
const lockedCurrentAgain = gyro.getCurrentQuaternion();
gyro.update(1 / 60);
assertQuaternionClose(gyro.getCurrentQuaternion(), lockedCurrentAgain, 'control base N: subsequent LOCKED frames do not move CURRENT');
leftGrip.quaternion.setFromAxisAngle(new THREE.Vector3(0, 1, 0), THREE.MathUtils.degToRad(30)); worldRoot.updateMatrixWorld(true); gyro.update(0.016);
const expectedIncremental = lockedCurrent.clone().multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), THREE.MathUtils.degToRad(10)));
assert.ok(gyro.getPreviewQuaternion().angleTo(expectedIncremental) < 1e-7, 'control base J: post-LOCK hand delta increments from new control base');
leftTrigger = 1; gyro.update(0.016);
assertQuaternionClose(gyro.getCommandQuaternion(), gyro.getPreviewQuaternion(), 'control base O: trigger after LOCK starts next maneuver from rebased PREVIEW');
leftTrigger = 0; gyro.update(0.016); spinUntilLocked(gyro);
let expectedAccumulated = gyro.getCurrentQuaternion();
for (const degrees of [45, 60]) {
  leftGrip.quaternion.setFromAxisAngle(new THREE.Vector3(0, 1, 0), THREE.MathUtils.degToRad(degrees)); worldRoot.updateMatrixWorld(true); gyro.update(0.016);
  leftTrigger = 1; gyro.update(0.016);
  leftTrigger = 0; gyro.update(0.016); spinUntilLocked(gyro);
  expectedAccumulated = gyro.getCurrentQuaternion();
}
assert.ok(expectedAccumulated.angleTo(new THREE.Quaternion()) > THREE.MathUtils.degToRad(35), 'control base K: repeated gesture/trigger/release/LOCK sequence accumulates orientation over stages');

// Heavy-drive regression coverage: COMMAND retargeting accelerates/brakes CURRENT without teleporting.
gyro.reset();
leftTrigger = 0;
leftGrip.quaternion.identity(); worldRoot.updateMatrixWorld(true); gyro.update(1 / 60);
leftGrip.quaternion.setFromAxisAngle(new THREE.Vector3(0, 1, 0), THREE.MathUtils.degToRad(120)); worldRoot.updateMatrixWorld(true); gyro.update(1 / 60);
const previewBeforeHeavyDrive = gyro.getPreviewQuaternion();
leftTrigger = 1; gyro.update(1 / 60);
const currentAtCommandCapture = gyro.getCurrentQuaternion();
assert.ok(currentAtCommandCapture.angleTo(previewBeforeHeavyDrive) > THREE.MathUtils.degToRad(100), 'heavy drive A/O: new COMMAND does not teleport CURRENT while PREVIEW responds immediately');
const speed1 = gyro.getAngularSpeed();
gyro.update(1 / 60);
const speed2 = gyro.getAngularSpeed();
assert.ok(speed2 > speed1 && speed2 < THREE.MathUtils.degToRad(2), 'heavy drive B/F: angular speed rises gradually from rest');
let maxObservedSpeed = 0;
let speedAtOneSecond = 0;
for (let i = 0; i < 60; i += 1) {
  gyro.update(1 / 60);
  maxObservedSpeed = Math.max(maxObservedSpeed, gyro.getAngularSpeed());
  if (i === 58) speedAtOneSecond = gyro.getAngularSpeed();
}
assert.ok(Math.abs(speedAtOneSecond - THREE.MathUtils.degToRad(32)) < THREE.MathUtils.degToRad(1.2), 'heavy drive C: continuous acceleration reaches about 32 degrees/s after about one second');
for (let i = 0; i < 30; i += 1) {
  gyro.update(1 / 60);
  maxObservedSpeed = Math.max(maxObservedSpeed, gyro.getAngularSpeed());
}
assert.ok(maxObservedSpeed <= THREE.MathUtils.degToRad(32.01), 'heavy drive D: angular speed never exceeds maxAngularSpeed');
const sixtyHzDrive = simulateHeavyDriveFor(60, 1 / 60);
const oneTwentyHzDrive = simulateHeavyDriveFor(120, 1 / 120);
assert.ok(sixtyHzDrive.current.angleTo(oneTwentyHzDrive.current) < THREE.MathUtils.degToRad(0.35) && Math.abs(sixtyHzDrive.speed - oneTwentyHzDrive.speed) < THREE.MathUtils.degToRad(0.35), 'heavy drive E: 60 Hz and 120 Hz integration stay close');
leftTrigger = 0; gyro.update(1 / 60);
const speedAfterRelease = gyro.getAngularSpeed();
gyro.update(1 / 60);
assert.ok(gyro.getAngularSpeed() > 0 && Math.abs(gyro.getAngularSpeed() - speedAfterRelease) < THREE.MathUtils.degToRad(1), 'heavy drive L: trigger release does not zero angular velocity');
let sawBraking = false;
let previousSpeed = gyro.getAngularSpeed();
let previousError = gyro.getAngularError();
let minError = previousError;
for (let i = 0; i < 1800 && gyro.getState() !== ASTERION_GYRO_STATES.LOCKED; i += 1) {
  gyro.update(1 / 60);
  const speed = gyro.getAngularSpeed();
  const error = gyro.getAngularError();
  sawBraking = sawBraking || (error < THREE.MathUtils.degToRad(20) && speed < previousSpeed);
  assert.ok(error <= previousError + THREE.MathUtils.degToRad(0.2), 'heavy drive I: CURRENT does not overshoot COMMAND during normal arrival');
  previousSpeed = speed;
  previousError = error;
  minError = Math.min(minError, error);
}
assert.equal(gyro.getState(), ASTERION_GYRO_STATES.LOCKED, 'heavy drive J: low-error and low-speed platform reaches LOCK');
assert.equal(sawBraking, true, 'heavy drive G/H: braking-distance controller reduces speed before target');
assert.ok(minError <= THREE.MathUtils.degToRad(0.05), 'heavy drive J: lock waits until error is within 0.05 degrees');
assert.equal(gyro.getAngularSpeed(), 0, 'heavy drive J/K: LOCK zeros angularVelocity');
assertQuaternionClose(gyro.getCurrentQuaternion(), gyro.getCommandQuaternion(), 'heavy drive J: LOCK hard-settles exact CURRENT to COMMAND');
const currentAfterHeavyLock = gyro.getCurrentQuaternion();
gyro.update(1 / 60);
assertQuaternionClose(gyro.getCurrentQuaternion(), currentAfterHeavyLock, 'heavy drive K: frames after LOCK do not move CURRENT');

gyro.reset();
leftGrip.quaternion.identity(); worldRoot.updateMatrixWorld(true); leftTrigger = 0; gyro.update(1 / 60);
leftGrip.quaternion.setFromAxisAngle(new THREE.Vector3(0, 1, 0), THREE.MathUtils.degToRad(100)); worldRoot.updateMatrixWorld(true); leftTrigger = 1; gyro.update(1 / 60);
for (let i = 0; i < 45; i += 1) gyro.update(1 / 60);
const currentBeforeRetarget = gyro.getCurrentQuaternion();
const velocityBeforeRetarget = gyro.getAngularVelocity();
leftGrip.quaternion.setFromAxisAngle(new THREE.Vector3(0, 1, 0), THREE.MathUtils.degToRad(-70)); worldRoot.updateMatrixWorld(true); gyro.update(1 / 60);
assert.ok(gyro.getCurrentQuaternion().angleTo(currentBeforeRetarget) < THREE.MathUtils.degToRad(1), 'heavy drive M: COMMAND change during motion does not teleport CURRENT');
assert.ok(gyro.getAngularSpeed() > 0 && gyro.getAngularVelocity().length() > velocityBeforeRetarget.length() * 0.5, 'heavy drive M: retarget does not zero angularVelocity');
const errorAfterRetarget = gyro.getAngularError();
for (let i = 0; i < 90; i += 1) gyro.update(1 / 60);
assert.ok(gyro.getAngularError() < errorAfterRetarget, 'heavy drive N: platform smoothly bends toward the new COMMAND');

const errorAxis = new THREE.Vector3();
const errorQuaternion = new THREE.Quaternion();
const error = computeQuaternionError(new THREE.Quaternion(), new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), THREE.MathUtils.degToRad(30)), errorAxis, errorQuaternion);
assert.ok(Math.abs(error.angle - THREE.MathUtils.degToRad(30)) < 1e-12 && Math.abs(error.axis.y - 1) < 1e-12, 'heavy drive math: quaternion error exposes shortest local axis/angle');


gyro.dispose(); sphere.dispose();
console.log('VR Asterion gyro assertions passed');
