import * as THREE from '../../vendor/three.js';
import { ASTERION_GYRO_STATES, cappedExponentialSlerp, computeClutchedTargetQuaternion, neutralizeControllerQuaternionAgainstFloor, resolveGyroState } from './asterionGyroMath.js';

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

export function createVrAsterionGyroInteraction({ sphere, controllers, progressFloor, worldRoot, renderer, settings, enabled = false }) {
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
  const floorWorldQuaternion = new THREE.Quaternion();
  const gripWorldQuaternion = new THREE.Quaternion();
  let handReferenceValid = false;
  let driveActive = false;
  let maneuverPendingLock = false;
  let lockTimer = 0;
  let state = ASTERION_GYRO_STATES.IDLE;
  let angularError = 0;
  let visualRebaseElapsed = 0;
  let visualRebaseActive = false;
  let disposed = false;

  const response = Math.max(0, Number.isFinite(settings?.response) ? settings.response : 2.5);
  const maxAngularSpeedDegrees = Math.max(0, Number.isFinite(settings?.maxAngularSpeedDegrees) ? settings.maxAngularSpeedDegrees : 55);
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
    if (progressFloor?.object?.quaternion) progressFloor.object.quaternion.identity();
    sphere?.setTargetRingsStabilized?.(false);
    sphere?.syncGimbals?.({ currentQuaternion, targetQuaternion: displayPreviewQuaternion, worldRoot });
  }

  function update(delta = 0) {
    if (disposed || !enabled) return;
    const safeDelta = Math.max(0, Number.isFinite(delta) ? delta : 0);
    const leftRecord = findLeftRecord(controllers);
    if (leftRecord && !sphere?.isEquipped?.()) sphere?.equipTo?.(leftRecord);
    hideLeftRayIfEquipped(leftRecord);
    const triggerDown = getLeftPrimaryAction(renderer) > TRIGGER_THRESHOLD || Boolean(leftRecord?.isSelecting);
    const floorParent = progressFloor?.object?.parent ?? worldRoot ?? null;
    floorParent?.updateWorldMatrix?.(true, false);
    floorParent?.getWorldQuaternion?.(parentWorldQuaternion) ?? parentWorldQuaternion.identity();
    progressFloor?.object?.updateWorldMatrix?.(true, false);
    progressFloor?.object?.getWorldQuaternion?.(floorWorldQuaternion) ?? floorWorldQuaternion.identity();

    if (leftRecord?.grip && sphere?.isEquipped?.()) {
      leftRecord.grip.updateWorldMatrix(true, false);
      leftRecord.grip.getWorldQuaternion(gripWorldQuaternion);
      neutralizeControllerQuaternionAgainstFloor({
        gripWorldQuaternion, floorWorldQuaternion, floorParentWorldQuaternion: parentWorldQuaternion
      }, controllerQuaternionNow);
      if (!handReferenceValid) {
        handReferenceQuaternion.copy(controllerQuaternionNow);
        controlBaseQuaternion.copy(currentQuaternion);
        previewQuaternion.copy(controlBaseQuaternion);
        handReferenceValid = true;
      } else {
        computeClutchedTargetQuaternion({
          controllerQuaternionNow,
          grabStartControllerQuaternion: handReferenceQuaternion,
          grabStartTargetQuaternion: controlBaseQuaternion,
          parentWorldQuaternion
        }, previewQuaternion);
      }
    }

    driveActive = triggerDown;
    if (driveActive) {
      commandQuaternion.copy(previewQuaternion);
      maneuverPendingLock = true;
    }

    let visualRebaseStartedThisFrame = false;
    const previousState = state;
    cappedExponentialSlerp(currentQuaternion, commandQuaternion, { response, deltaSeconds: safeDelta, maxAngularSpeedDegrees });
    if (progressFloor?.object?.quaternion) progressFloor.object.quaternion.copy(currentQuaternion);
    angularError = currentQuaternion.angleTo(commandQuaternion);
    if (!driveActive && angularError < lockThreshold) lockTimer += safeDelta;
    else lockTimer = 0;
    const canHardSettle = !driveActive && lockTimer >= lockDelaySeconds && angularError <= hardSettleThreshold;
    state = canHardSettle
      ? ASTERION_GYRO_STATES.LOCKED
      : resolveGyroState({ clutchActive: driveActive, angularError, lockTimer: 0, lockDelaySeconds });
    if (!driveActive && maneuverPendingLock && previousState !== ASTERION_GYRO_STATES.LOCKED && state === ASTERION_GYRO_STATES.LOCKED) {
      const displayPreviewBeforeRebase = displayPreviewQuaternion.clone();
      currentQuaternion.copy(commandQuaternion).normalize();
      if (progressFloor?.object?.quaternion) progressFloor.object.quaternion.copy(currentQuaternion);
      progressFloor?.object?.updateWorldMatrix?.(true, false);
      progressFloor?.object?.getWorldQuaternion?.(floorWorldQuaternion) ?? floorWorldQuaternion.identity();
      if (leftRecord?.grip && handReferenceValid) {
        leftRecord.grip.updateWorldMatrix(true, false);
        leftRecord.grip.getWorldQuaternion(gripWorldQuaternion);
        neutralizeControllerQuaternionAgainstFloor({
          gripWorldQuaternion, floorWorldQuaternion, floorParentWorldQuaternion: parentWorldQuaternion
        }, controllerQuaternionNow);
      }
      angularError = 0;
      controlBaseQuaternion.copy(currentQuaternion);
      if (handReferenceValid) handReferenceQuaternion.copy(controllerQuaternionNow);
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
      state, driveActive, angularError, previewCommandAngularError: previewQuaternion.angleTo(commandQuaternion)
    };
    sphere?.syncGimbals?.({ currentQuaternion, targetQuaternion: displayPreviewQuaternion, worldRoot });
    hideLeftRayIfEquipped(leftRecord);
  }

  function dispose() { if (disposed) return; disposed = true; reset(); }

  return { update, reset, dispose, getState: () => state, getAngularError: () => angularError,
    getTargetQuaternion: () => commandQuaternion.clone(), getPreviewQuaternion: () => previewQuaternion.clone(), getDisplayPreviewQuaternion: () => displayPreviewQuaternion.clone(), isVisualRebaseActive: () => visualRebaseActive, getCommandQuaternion: () => commandQuaternion.clone(), getCurrentQuaternion: () => currentQuaternion.clone(), getControlBaseQuaternion: () => controlBaseQuaternion.clone(), getHandReferenceQuaternion: () => handReferenceQuaternion.clone(), isDriveActive: () => driveActive, isClutchActive: () => driveActive };
}
