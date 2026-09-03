import * as THREE from '../../vendor/three.js';

export const ASTERION_GYRO_STATES = Object.freeze({ IDLE: 'IDLE', TARGETING: 'TARGETING', LOCKED: 'LOCKED' });

const EPSILON = 1e-9;

export function exponentialSlerpAlpha(response, deltaSeconds) {
  const safeResponse = Math.max(0, Number.isFinite(response) ? response : 0);
  const safeDelta = Math.max(0, Number.isFinite(deltaSeconds) ? deltaSeconds : 0);
  return 1 - Math.exp(-safeResponse * safeDelta);
}

export function cappedExponentialSlerp(current, target, { response, deltaSeconds, maxAngularSpeedDegrees, epsilon = EPSILON } = {}) {
  const safeDelta = Math.max(0, Number.isFinite(deltaSeconds) ? deltaSeconds : 0);
  const safeMaxDegrees = Math.max(0, Number.isFinite(maxAngularSpeedDegrees) ? maxAngularSpeedDegrees : Infinity);
  const angle = current.angleTo(target);
  const responseStep = angle * exponentialSlerpAlpha(response, safeDelta);
  const maxStep = THREE.MathUtils.degToRad(safeMaxDegrees) * safeDelta;
  const actualStep = Math.min(responseStep, maxStep);
  const alpha = angle > epsilon ? actualStep / angle : 1;
  return current.slerp(target, alpha).normalize();
}

export function computeQuaternionError(current, target, axisTarget = new THREE.Vector3(), quaternionTarget = new THREE.Quaternion()) {
  quaternionTarget.copy(current).invert().multiply(target).normalize();
  if (quaternionTarget.w < 0) {
    quaternionTarget.x *= -1;
    quaternionTarget.y *= -1;
    quaternionTarget.z *= -1;
    quaternionTarget.w *= -1;
  }
  const clampedW = THREE.MathUtils.clamp(quaternionTarget.w, -1, 1);
  const angle = 2 * Math.acos(clampedW);
  const sinHalfAngle = Math.sqrt(Math.max(0, 1 - clampedW * clampedW));
  if (sinHalfAngle > EPSILON && angle > EPSILON) {
    axisTarget.set(quaternionTarget.x / sinHalfAngle, quaternionTarget.y / sinHalfAngle, quaternionTarget.z / sinHalfAngle).normalize();
  } else {
    axisTarget.set(0, 0, 0);
  }
  return { angle, axis: axisTarget, quaternion: quaternionTarget };
}

export function steerAngularVelocity(currentVelocity, desiredVelocity, { acceleration, deceleration, deltaSeconds } = {}) {
  const safeDelta = Math.max(0, Number.isFinite(deltaSeconds) ? deltaSeconds : 0);
  const safeAcceleration = Math.max(0, Number.isFinite(acceleration) ? acceleration : 0);
  const safeDeceleration = Math.max(0, Number.isFinite(deceleration) ? deceleration : safeAcceleration);
  const currentSpeed = currentVelocity.length();
  const desiredSpeed = desiredVelocity.length();
  const limit = desiredSpeed < currentSpeed || currentVelocity.dot(desiredVelocity) < 0
    ? safeDeceleration * safeDelta
    : safeAcceleration * safeDelta;
  const deltaX = desiredVelocity.x - currentVelocity.x;
  const deltaY = desiredVelocity.y - currentVelocity.y;
  const deltaZ = desiredVelocity.z - currentVelocity.z;
  const deltaLength = Math.sqrt(deltaX * deltaX + deltaY * deltaY + deltaZ * deltaZ);
  if (deltaLength <= limit || deltaLength <= EPSILON) return currentVelocity.copy(desiredVelocity);
  currentVelocity.x += deltaX * (limit / deltaLength);
  currentVelocity.y += deltaY * (limit / deltaLength);
  currentVelocity.z += deltaZ * (limit / deltaLength);
  return currentVelocity;
}

export function computeControllerDeltaWorld(controllerQuaternionNow, grabStartControllerQuaternion, target = new THREE.Quaternion()) {
  return target.copy(controllerQuaternionNow).multiply(grabStartControllerQuaternion.clone().invert()).normalize();
}

export function convertWorldDeltaToParentLocal(controllerDeltaWorld, parentWorldQuaternion, target = new THREE.Quaternion()) {
  const parentInverse = parentWorldQuaternion.clone().invert();
  return target.copy(parentInverse).multiply(controllerDeltaWorld).multiply(parentWorldQuaternion).normalize();
}


export function neutralizeControllerQuaternionAgainstFloor({ gripWorldQuaternion, floorWorldQuaternion, floorParentWorldQuaternion }, target = new THREE.Quaternion()) {
  const floorInverse = floorWorldQuaternion.clone().invert();
  const gripRelativeToFloor = floorInverse.multiply(gripWorldQuaternion);
  return target.copy(floorParentWorldQuaternion).multiply(gripRelativeToFloor).normalize();
}

export function computeClutchedTargetQuaternion({ controllerQuaternionNow, grabStartControllerQuaternion,
  grabStartTargetQuaternion, parentWorldQuaternion, controllerFrameWorldQuaternion = null }, target = new THREE.Quaternion()) {
  const controllerDelta = computeControllerDeltaWorld(controllerQuaternionNow, grabStartControllerQuaternion);
  const controllerDeltaWorld = controllerFrameWorldQuaternion
    ? controllerFrameWorldQuaternion.clone().multiply(controllerDelta).multiply(controllerFrameWorldQuaternion.clone().invert()).normalize()
    : controllerDelta;
  const deltaLocal = convertWorldDeltaToParentLocal(controllerDeltaWorld, parentWorldQuaternion);
  return target.copy(deltaLocal).multiply(grabStartTargetQuaternion).normalize();
}

export function computeNodeLocalQuaternionForWorldOrientation({ desiredWorldQuaternion, nodeParentWorldQuaternion }, target = new THREE.Quaternion()) {
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

export const computeGimbalLocalQuaternion = computeNodeLocalQuaternionForWorldOrientation;
