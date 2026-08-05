import * as THREE from '../../vendor/three.js';

export const ASTERION_GYRO_STATES = Object.freeze({ IDLE: 'IDLE', TARGETING: 'TARGETING', LOCKED: 'LOCKED' });

const EPSILON = 1e-9;

export function exponentialSlerpAlpha(response, deltaSeconds) {
  const safeResponse = Math.max(0, Number.isFinite(response) ? response : 0);
  const safeDelta = Math.max(0, Number.isFinite(deltaSeconds) ? deltaSeconds : 0);
  return 1 - Math.exp(-safeResponse * safeDelta);
}

export function computeControllerDeltaWorld(controllerQuaternionNow, grabStartControllerQuaternion, target = new THREE.Quaternion()) {
  return target.copy(controllerQuaternionNow).multiply(grabStartControllerQuaternion.clone().invert()).normalize();
}

export function convertWorldDeltaToParentLocal(controllerDeltaWorld, parentWorldQuaternion, target = new THREE.Quaternion()) {
  const parentInverse = parentWorldQuaternion.clone().invert();
  return target.copy(parentInverse).multiply(controllerDeltaWorld).multiply(parentWorldQuaternion).normalize();
}

export function computeClutchedTargetQuaternion({ controllerQuaternionNow, grabStartControllerQuaternion, grabStartTargetQuaternion, parentWorldQuaternion }, target = new THREE.Quaternion()) {
  const controllerDeltaWorld = computeControllerDeltaWorld(controllerQuaternionNow, grabStartControllerQuaternion);
  const deltaLocal = convertWorldDeltaToParentLocal(controllerDeltaWorld, parentWorldQuaternion);
  return target.copy(deltaLocal).multiply(grabStartTargetQuaternion).normalize();
}

export function computeGimbalLocalQuaternion({ desiredWorldQuaternion, nodeParentWorldQuaternion }, target = new THREE.Quaternion()) {
  return target.copy(nodeParentWorldQuaternion).invert().multiply(desiredWorldQuaternion).normalize();
}

export function resolveGyroState({ clutchActive, angularError, lockTimer, lockDelaySeconds }) {
  if (clutchActive || angularError > EPSILON) {
    const safeDelay = Math.max(0, Number.isFinite(lockDelaySeconds) ? lockDelaySeconds : 0);
    const thresholdMet = angularError <= EPSILON || lockTimer >= safeDelay;
    if (!clutchActive && thresholdMet) return ASTERION_GYRO_STATES.LOCKED;
    return ASTERION_GYRO_STATES.TARGETING;
  }
  return lockTimer >= Math.max(0, Number.isFinite(lockDelaySeconds) ? lockDelaySeconds : 0)
    ? ASTERION_GYRO_STATES.LOCKED
    : ASTERION_GYRO_STATES.IDLE;
}
