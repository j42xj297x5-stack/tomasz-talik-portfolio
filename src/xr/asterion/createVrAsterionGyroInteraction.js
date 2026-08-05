import * as THREE from '../../vendor/three.js';
import { ASTERION_GYRO_STATES, cappedExponentialSlerp, computeClutchedTargetQuaternion, resolveGyroState } from './asterionGyroMath.js';

const TRIGGER_THRESHOLD = 0.1;

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
  const targetQuaternion = new THREE.Quaternion();
  const currentQuaternion = new THREE.Quaternion();
  const grabStartControllerQuaternion = new THREE.Quaternion();
  const grabStartTargetQuaternion = new THREE.Quaternion();
  const controllerQuaternionNow = new THREE.Quaternion();
  const parentWorldQuaternion = new THREE.Quaternion();
  let triggerWasDown = false;
  let clutchActive = false;
  let lockTimer = 0;
  let state = ASTERION_GYRO_STATES.IDLE;
  let angularError = 0;
  let disposed = false;

  const response = Math.max(0, Number.isFinite(settings?.response) ? settings.response : 2.5);
  const maxAngularSpeedDegrees = Math.max(0, Number.isFinite(settings?.maxAngularSpeedDegrees) ? settings.maxAngularSpeedDegrees : 55);
  const lockThreshold = THREE.MathUtils.degToRad(Math.max(0, Number.isFinite(settings?.lockThresholdDegrees) ? settings.lockThresholdDegrees : 0.5));
  const lockDelaySeconds = Math.max(0, Number.isFinite(settings?.lockDelaySeconds) ? settings.lockDelaySeconds : 0.18);

  function hideLeftRayIfEquipped(leftRecord) {
    if (enabled && sphere?.isEquipped?.() && leftRecord?.ray) leftRecord.ray.visible = false;
  }

  function reset() {
    targetQuaternion.identity();
    currentQuaternion.identity();
    grabStartControllerQuaternion.identity();
    grabStartTargetQuaternion.identity();
    triggerWasDown = false;
    clutchActive = false;
    lockTimer = 0;
    state = ASTERION_GYRO_STATES.IDLE;
    angularError = 0;
    if (progressFloor?.object?.quaternion) progressFloor.object.quaternion.identity();
    sphere?.setTargetRingsStabilized?.(false);
    sphere?.syncGimbals?.({ currentQuaternion, targetQuaternion, worldRoot });
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

    if (triggerDown && !triggerWasDown && leftRecord?.grip) {
      leftRecord.grip.updateWorldMatrix(true, false);
      leftRecord.grip.getWorldQuaternion(grabStartControllerQuaternion);
      grabStartTargetQuaternion.copy(targetQuaternion);
      clutchActive = true;
    } else if (!triggerDown && triggerWasDown) {
      clutchActive = false;
    }

    if (triggerDown && clutchActive && leftRecord?.grip) {
      leftRecord.grip.updateWorldMatrix(true, false);
      leftRecord.grip.getWorldQuaternion(controllerQuaternionNow);
      computeClutchedTargetQuaternion({ controllerQuaternionNow, grabStartControllerQuaternion, grabStartTargetQuaternion, parentWorldQuaternion }, targetQuaternion);
    }

    triggerWasDown = triggerDown;
    cappedExponentialSlerp(currentQuaternion, targetQuaternion, { response, deltaSeconds: safeDelta, maxAngularSpeedDegrees });
    if (progressFloor?.object?.quaternion) progressFloor.object.quaternion.copy(currentQuaternion);
    angularError = currentQuaternion.angleTo(targetQuaternion);
    if (!triggerDown && angularError < lockThreshold) lockTimer += safeDelta;
    else lockTimer = 0;
    state = resolveGyroState({ clutchActive: triggerDown, angularError: angularError < lockThreshold ? 0 : angularError, lockTimer, lockDelaySeconds });
    sphere?.setTargetRingsStabilized?.(triggerDown || state === ASTERION_GYRO_STATES.TARGETING);
    if (progressFloor?.object?.userData) progressFloor.object.userData.asterionGyro = { state, angularError };
    sphere?.syncGimbals?.({ currentQuaternion, targetQuaternion, worldRoot });
    hideLeftRayIfEquipped(leftRecord);
  }

  function dispose() { if (disposed) return; disposed = true; reset(); }

  return { update, reset, dispose, getState: () => state, getAngularError: () => angularError,
    getTargetQuaternion: () => targetQuaternion.clone(), getCurrentQuaternion: () => currentQuaternion.clone(), isClutchActive: () => clutchActive };
}
