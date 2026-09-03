import * as THREE from '../../vendor/three.js';
import { ASTERION_GYRO_STATES, computeClutchedTargetQuaternion, computeQuaternionError, resolveGyroState, steerAngularVelocity } from './asterionGyroMath.js';

const TRIGGER_THRESHOLD = 0.1;
const HARD_SETTLE_THRESHOLD_DEGREES = 0.05;
const TARGET_VISUAL_REBASE_SECONDS = 0.5;

function findLeftRecord(controllers) {
  return controllers.find((record) => record.handedness === 'left' && record.isConnected && record.grip) ?? null;
}

function getLeftPrimaryAction(renderer) {
  const sources = renderer?.xr?.getSession?.()?.inputSources ?? [];
  const leftSource = [...sources].find((source) => source.handedness === 'left' && source.gamepad);
  const value = leftSource?.gamepad?.buttons?.[0]?.value ?? 0;
  return Math.min(1, Math.max(0, Number.isFinite(value) ? value : 0));
}

export function createVrAsterionGyroInteraction({ sphere, controllers, progressFloor, playerRig, worldRoot, renderer, settings,
  enabled = false, isInteractionBlocked = () => false }) {
  const previewQuaternion = new THREE.Quaternion();
  const commandQuaternion = new THREE.Quaternion();
  const currentQuaternion = new THREE.Quaternion();
  const displayPreviewQuaternion = new THREE.Quaternion();
  const visualOffsetQuaternion = new THREE.Quaternion();
  const visualOffsetStartQuaternion = new THREE.Quaternion();
  const visualOffsetIdentityQuaternion = new THREE.Quaternion();
  const controlBaseQuaternion = new THREE.Quaternion();
  const handReferenceQuaternion = new THREE.Quaternion();
  const controllerQuaternionNow = new THREE.Quaternion();
  const parentWorldQuaternion = new THREE.Quaternion();
  const playerRigWorldQuaternion = new THREE.Quaternion();
  const gripWorldQuaternion = new THREE.Quaternion();
  const angularVelocity = new THREE.Vector3();
  const errorAxis = new THREE.Vector3();
  const desiredAngularVelocity = new THREE.Vector3();
  const errorQuaternion = new THREE.Quaternion();
  const stepQuaternion = new THREE.Quaternion();
  const stepAxis = new THREE.Vector3();
  let handReferenceValid = false;
  let driveActive = false;
  let maneuverPendingLock = false;
  let lockTimer = 0;
  let state = ASTERION_GYRO_STATES.IDLE;
  let angularError = 0;
  let visualRebaseElapsed = 0;
  let visualRebaseActive = false;
  let wasEquipped = false;
  let disposed = false;

  const maxAngularSpeedDegrees = Math.max(0, Number.isFinite(settings?.maxAngularSpeedDegrees) ? settings.maxAngularSpeedDegrees : 32);
  const angularAccelerationDegrees = Math.max(0, Number.isFinite(settings?.angularAccelerationDegrees) ? settings.angularAccelerationDegrees : 32);
  const angularDecelerationDegrees = Math.max(0, Number.isFinite(settings?.angularDecelerationDegrees) ? settings.angularDecelerationDegrees : 45);
  const settleAngularSpeedDegrees = Math.max(0, Number.isFinite(settings?.settleAngularSpeedDegrees) ? settings.settleAngularSpeedDegrees : 0.15);
  const maxAngularSpeed = THREE.MathUtils.degToRad(maxAngularSpeedDegrees);
  const angularAcceleration = THREE.MathUtils.degToRad(angularAccelerationDegrees);
  const angularDeceleration = THREE.MathUtils.degToRad(angularDecelerationDegrees);
  const settleAngularSpeed = THREE.MathUtils.degToRad(settleAngularSpeedDegrees);
  const lockThreshold = THREE.MathUtils.degToRad(Math.max(0, Number.isFinite(settings?.lockThresholdDegrees) ? settings.lockThresholdDegrees : 0.5));
  const hardSettleThreshold = THREE.MathUtils.degToRad(HARD_SETTLE_THRESHOLD_DEGREES);
  const lockDelaySeconds = Math.max(0, Number.isFinite(settings?.lockDelaySeconds) ? settings.lockDelaySeconds : 0.18);

  function hideLeftRayIfEquipped(leftRecord) {
    if (enabled && sphere?.isEquipped?.() && leftRecord?.ray) leftRecord.ray.visible = false;
  }

  function reset() {
    previewQuaternion.identity();
    commandQuaternion.identity();
    currentQuaternion.identity();
    displayPreviewQuaternion.identity();
    visualOffsetQuaternion.identity();
    visualOffsetStartQuaternion.identity();
    visualRebaseElapsed = 0;
    visualRebaseActive = false;
    controlBaseQuaternion.identity();
    handReferenceQuaternion.identity();
    handReferenceValid = false;
    driveActive = false;
    maneuverPendingLock = false;
    lockTimer = 0;
    state = ASTERION_GYRO_STATES.IDLE;
    angularError = 0;
    angularVelocity.set(0, 0, 0);
    wasEquipped = false;
    if (progressFloor?.object?.quaternion) progressFloor.object.quaternion.identity();
    sphere?.setTargetRingsStabilized?.(false);
    sphere?.syncGimbals?.({ currentQuaternion, targetQuaternion: displayPreviewQuaternion, worldRoot });
  }

  function update(delta = 0) {
    if (disposed || !enabled) return;
    const safeDelta = Math.max(0, Number.isFinite(delta) ? delta : 0);
    const leftRecord = findLeftRecord(controllers);
    hideLeftRayIfEquipped(leftRecord);
    const equipped = Boolean(sphere?.isEquipped?.());
    if (equipped && !wasEquipped) {
      controlBaseQuaternion.copy(currentQuaternion);
      previewQuaternion.copy(currentQuaternion);
      displayPreviewQuaternion.copy(currentQuaternion);
      handReferenceValid = false;
    }
    if (!equipped && wasEquipped) {
      driveActive = false;
      sphere?.setTargetRingsStabilized?.(false);
      handReferenceValid = false;
    }
    wasEquipped = equipped;
    const triggerDown = equipped && !isInteractionBlocked(leftRecord)
      && (getLeftPrimaryAction(renderer) > TRIGGER_THRESHOLD || Boolean(leftRecord?.isSelecting));
    const floorParent = progressFloor?.object?.parent ?? worldRoot ?? null;
    floorParent?.updateWorldMatrix?.(true, false);
    floorParent?.getWorldQuaternion?.(parentWorldQuaternion) ?? parentWorldQuaternion.identity();

    if (triggerDown && !driveActive && leftRecord?.grip) {
      playerRig?.updateWorldMatrix?.(true, false);
      playerRig?.getWorldQuaternion?.(playerRigWorldQuaternion) ?? playerRigWorldQuaternion.identity();
      leftRecord.grip.updateWorldMatrix(true, false);
      leftRecord.grip.getWorldQuaternion(gripWorldQuaternion);
      controllerQuaternionNow.copy(playerRigWorldQuaternion).invert().multiply(gripWorldQuaternion).normalize();
      handReferenceQuaternion.copy(controllerQuaternionNow);
      controlBaseQuaternion.copy(commandQuaternion);
      previewQuaternion.copy(controlBaseQuaternion);
      handReferenceValid = true;
    } else if (triggerDown && handReferenceValid && leftRecord?.grip) {
      playerRig?.updateWorldMatrix?.(true, false);
      playerRig?.getWorldQuaternion?.(playerRigWorldQuaternion) ?? playerRigWorldQuaternion.identity();
      leftRecord.grip.updateWorldMatrix(true, false);
      leftRecord.grip.getWorldQuaternion(gripWorldQuaternion);
      controllerQuaternionNow.copy(playerRigWorldQuaternion).invert().multiply(gripWorldQuaternion).normalize();
      computeClutchedTargetQuaternion({
        controllerQuaternionNow,
        grabStartControllerQuaternion: handReferenceQuaternion,
        grabStartTargetQuaternion: controlBaseQuaternion,
        parentWorldQuaternion,
        controllerFrameWorldQuaternion: playerRigWorldQuaternion
      }, previewQuaternion);
    }

    driveActive = triggerDown && handReferenceValid && Boolean(leftRecord?.grip);
    if (driveActive) {
      commandQuaternion.copy(previewQuaternion);
      maneuverPendingLock = true;
    }

    let visualRebaseStartedThisFrame = false;
    const previousState = state;
    computeQuaternionError(currentQuaternion, commandQuaternion, errorAxis, errorQuaternion);
    angularError = currentQuaternion.angleTo(commandQuaternion);
    if (safeDelta > 0 && angularError > 1e-9 && maxAngularSpeed > 0) {
      const brakingSpeed = angularDeceleration > 0 ? Math.sqrt(Math.max(0, 2 * angularDeceleration * angularError)) : 0;
      const desiredSpeed = angularError <= hardSettleThreshold ? 0 : Math.min(maxAngularSpeed, brakingSpeed);
      desiredAngularVelocity.copy(errorAxis).multiplyScalar(desiredSpeed);
      steerAngularVelocity(angularVelocity, desiredAngularVelocity, {
        acceleration: angularAcceleration,
        deceleration: angularDeceleration,
        deltaSeconds: safeDelta
      });
      const angularSpeedBeforeClamp = angularVelocity.length();
      const maxStep = Math.max(0, angularError - hardSettleThreshold * 0.25);
      const stepAngle = Math.min(angularSpeedBeforeClamp * safeDelta, maxStep);
      if (stepAngle > 1e-9 && angularSpeedBeforeClamp > 1e-9) {
        stepAxis.copy(angularVelocity).multiplyScalar(1 / angularSpeedBeforeClamp);
        stepQuaternion.setFromAxisAngle(stepAxis, stepAngle);
        currentQuaternion.multiply(stepQuaternion).normalize();
        if (stepAngle < angularSpeedBeforeClamp * safeDelta) {
          angularVelocity.copy(errorAxis).multiplyScalar(Math.min(angularVelocity.length(), Math.max(0, stepAngle / safeDelta)));
        }
      }
    } else if (angularError <= 1e-9 || maxAngularSpeed <= 0) {
      desiredAngularVelocity.set(0, 0, 0);
      steerAngularVelocity(angularVelocity, desiredAngularVelocity, {
        acceleration: angularAcceleration,
        deceleration: angularDeceleration,
        deltaSeconds: safeDelta
      });
    }
    if (progressFloor?.object?.quaternion) progressFloor.object.quaternion.copy(currentQuaternion);
    angularError = currentQuaternion.angleTo(commandQuaternion);
    const angularSpeed = angularVelocity.length();
    if (!driveActive && angularError < lockThreshold && angularSpeed <= settleAngularSpeed) lockTimer += safeDelta;
    else lockTimer = 0;
    const canHardSettle = !driveActive && lockTimer >= lockDelaySeconds && angularError <= hardSettleThreshold && angularSpeed <= settleAngularSpeed;
    state = canHardSettle
      ? ASTERION_GYRO_STATES.LOCKED
      : resolveGyroState({ clutchActive: driveActive, angularError, lockTimer: 0, lockDelaySeconds });
    if (!driveActive && maneuverPendingLock && previousState !== ASTERION_GYRO_STATES.LOCKED && state === ASTERION_GYRO_STATES.LOCKED) {
      const displayPreviewBeforeRebase = displayPreviewQuaternion.clone();
      currentQuaternion.copy(commandQuaternion).normalize();
      angularVelocity.set(0, 0, 0);
      if (progressFloor?.object?.quaternion) progressFloor.object.quaternion.copy(currentQuaternion);
      progressFloor?.object?.updateWorldMatrix?.(true, false);
      angularError = 0;
      controlBaseQuaternion.copy(currentQuaternion);
      previewQuaternion.copy(currentQuaternion).normalize();
      visualOffsetStartQuaternion.copy(displayPreviewBeforeRebase).multiply(previewQuaternion.clone().invert()).normalize();
      visualOffsetQuaternion.copy(visualOffsetStartQuaternion);
      visualRebaseElapsed = 0;
      visualRebaseActive = true;
      visualRebaseStartedThisFrame = true;
      maneuverPendingLock = false;
    }
    if (visualRebaseActive) {
      visualRebaseElapsed += visualRebaseStartedThisFrame ? 0 : safeDelta;
      const linearT = TARGET_VISUAL_REBASE_SECONDS > 0 ? Math.min(1, visualRebaseElapsed / TARGET_VISUAL_REBASE_SECONDS) : 1;
      const smoothT = linearT * linearT * (3 - 2 * linearT);
      visualOffsetQuaternion.copy(visualOffsetStartQuaternion).slerp(visualOffsetIdentityQuaternion, smoothT).normalize();
      displayPreviewQuaternion.copy(visualOffsetQuaternion).multiply(previewQuaternion).normalize();
      if (linearT >= 1) {
        visualRebaseActive = false;
        visualOffsetQuaternion.identity();
        visualOffsetStartQuaternion.identity();
        displayPreviewQuaternion.copy(previewQuaternion).normalize();
      }
    } else {
      displayPreviewQuaternion.copy(previewQuaternion).normalize();
    }
    sphere?.setTargetRingsStabilized?.(driveActive);
    if (progressFloor?.object?.userData) progressFloor.object.userData.asterionGyro = {
      state, driveActive, angularError, angularSpeed: angularVelocity.length(), previewCommandAngularError: previewQuaternion.angleTo(commandQuaternion)
    };
    sphere?.syncGimbals?.({ currentQuaternion, targetQuaternion: displayPreviewQuaternion, worldRoot });
    hideLeftRayIfEquipped(leftRecord);
  }

  function dispose() { if (disposed) return; disposed = true; reset(); }

  return { update, reset, dispose, getState: () => state, getAngularError: () => angularError, getAngularVelocity: () => angularVelocity.clone(), getAngularSpeed: () => angularVelocity.length(),
    getTargetQuaternion: () => commandQuaternion.clone(), getPreviewQuaternion: () => previewQuaternion.clone(), getDisplayPreviewQuaternion: () => displayPreviewQuaternion.clone(), isVisualRebaseActive: () => visualRebaseActive, getCommandQuaternion: () => commandQuaternion.clone(), getCurrentQuaternion: () => currentQuaternion.clone(), getControlBaseQuaternion: () => controlBaseQuaternion.clone(), getHandReferenceQuaternion: () => handReferenceQuaternion.clone(), isDriveActive: () => driveActive, isClutchActive: () => driveActive };
}
