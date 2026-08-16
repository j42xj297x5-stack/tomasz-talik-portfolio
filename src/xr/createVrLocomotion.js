import * as THREE from '../vendor/three.js';

const EPSILON = 1e-9;
const PLATFORM_UP_LOCAL = new THREE.Vector3(0, 1, 0);

export function applyDeadzone(value, deadzone) {
  if (!Number.isFinite(value) || Math.abs(value) <= deadzone) return 0;
  return Math.sign(value) * (Math.abs(value) - deadzone) / (1 - deadzone);
}

export function getHorizontalViewerBasis(xrCamera, forward, right) {
  const viewerCamera = xrCamera.isArrayCamera && xrCamera.cameras.length > 0
    ? xrCamera.cameras[0]
    : xrCamera;
  forward.setFromMatrixColumn(viewerCamera.matrixWorld, 2).negate();
  forward.y = 0;
  if (forward.lengthSq() < 1e-8) forward.set(0, 0, -1);
  forward.normalize();
  right.set(-forward.z, 0, forward.x);
  return { forward, right };
}

export function projectVectorOntoPlane(vector, normal, target = new THREE.Vector3()) {
  return target.copy(vector).addScaledVector(normal, -vector.dot(normal));
}

export function getPlatformViewerBasis({ xrCamera, surfaceRoot, normal, forward, right }) {
  const viewerCamera = xrCamera.isArrayCamera && xrCamera.cameras.length > 0
    ? xrCamera.cameras[0]
    : xrCamera;
  surfaceRoot?.updateWorldMatrix?.(true, false);
  normal.copy(PLATFORM_UP_LOCAL).transformDirection(surfaceRoot?.matrixWorld ?? new THREE.Matrix4()).normalize();
  forward.setFromMatrixColumn(viewerCamera.matrixWorld, 2).negate();
  projectVectorOntoPlane(forward, normal, forward);
  if (forward.lengthSq() < EPSILON) {
    forward.setFromMatrixColumn(viewerCamera.matrixWorld, 0);
    projectVectorOntoPlane(forward, normal, forward);
  }
  if (forward.lengthSq() < EPSILON) forward.set(0, 0, -1).projectOnPlane(normal);
  forward.normalize();
  right.crossVectors(forward, normal).normalize();
  return { normal, forward, right };
}

export function constrainRadialStep(startPosition, desiredDelta, walkRadius, target = new THREE.Vector3()) {
  target.copy(desiredDelta);
  if (walkRadius === Infinity) return target;
  if (!Number.isFinite(walkRadius) || walkRadius <= 0) return target.set(0, 0, 0);
  const radiusSq = walkRadius * walkRadius;
  const startRadiusSq = startPosition.x * startPosition.x + startPosition.z * startPosition.z;
  const desiredX = startPosition.x + target.x;
  const desiredZ = startPosition.z + target.z;
  if (desiredX * desiredX + desiredZ * desiredZ <= radiusSq + EPSILON) return target;

  if (startRadiusSq >= radiusSq - EPSILON) {
    const startRadius = Math.sqrt(Math.max(startRadiusSq, EPSILON));
    const outward = (startPosition.x * target.x + startPosition.z * target.z) / startRadius;
    if (outward > 0) {
      target.x -= (startPosition.x / startRadius) * outward;
      target.z -= (startPosition.z / startRadius) * outward;
    }
    return target;
  }

  const a = target.x * target.x + target.z * target.z;
  const b = 2 * (startPosition.x * target.x + startPosition.z * target.z);
  const c = startRadiusSq - radiusSq;
  const discriminant = Math.max(0, b * b - 4 * a * c);
  const t = a > EPSILON ? Math.max(0, Math.min(1, (-b + Math.sqrt(discriminant)) / (2 * a))) : 0;
  return target.multiplyScalar(t);
}

export function clampPositionToWalkRadius(position, walkRadius) {
  if (walkRadius === Infinity) return position;
  if (!Number.isFinite(walkRadius) || walkRadius <= 0) {
    position.x = 0;
    position.z = 0;
    return position;
  }
  const radius = Math.hypot(position.x, position.z);
  if (radius > walkRadius && radius > EPSILON) {
    const scale = walkRadius / radius;
    position.x *= scale;
    position.z *= scale;
  }
  return position;
}

export function createVrLocomotion({ playerRig, renderer, camera, settings, surfaceRoot = playerRig.parent,
  walkRadius = Infinity, scenarioGlyphRingRadius = null }) {
  const forward = new THREE.Vector3();
  const right = new THREE.Vector3();
  const normal = new THREE.Vector3();
  const movementWorld = new THREE.Vector3();
  const movementLocal = new THREE.Vector3();
  const parentWorldQuaternion = new THREE.Quaternion();
  const constrainedDelta = new THREE.Vector3();
  const initialLocalY = playerRig.position.y;
  const initialWalkRadius = walkRadius;
  let activeWalkRadius = walkRadius;
  let disposed = false;
  let leftYawLocked = false;

  function axesFor(handedness) {
    const sources = renderer.xr.getSession()?.inputSources ?? [];
    const source = Array.from(sources).find((item) => item.handedness === handedness && item.gamepad);
    const axes = source?.gamepad?.axes ?? [];
    return { x: applyDeadzone(axes[2] ?? axes[0] ?? 0, settings.deadzone), y: applyDeadzone(axes[3] ?? axes[1] ?? 0, settings.deadzone) };
  }

  function update(delta) {
    if (disposed || !settings.enabled || !Number.isFinite(delta) || delta <= 0) return;
    const y = playerRig.position.y;
    const left = axesFor('left');
    if (!leftYawLocked) playerRig.rotateY(-left.x * settings.turnSpeed * delta);

    const rightStick = axesFor('right');
    const xrCamera = renderer.xr.getCamera(camera);
    playerRig.updateMatrixWorld(true);
    if (typeof renderer.xr.updateCamera === 'function') renderer.xr.updateCamera(camera);
    else xrCamera.updateMatrixWorld(true);
    getPlatformViewerBasis({ xrCamera, surfaceRoot, normal, forward, right });
    movementWorld.copy(forward).multiplyScalar(-rightStick.y).addScaledVector(right, rightStick.x);
    if (movementWorld.lengthSq() > 1) movementWorld.normalize();
    movementWorld.multiplyScalar(settings.moveSpeed * delta);

    const parent = playerRig.parent;
    parent?.updateWorldMatrix?.(true, false);
    parent?.getWorldQuaternion?.(parentWorldQuaternion) ?? parentWorldQuaternion.identity();
    movementLocal.copy(movementWorld).applyQuaternion(parentWorldQuaternion.invert());
    movementLocal.y = 0;
    constrainRadialStep(playerRig.position, movementLocal, activeWalkRadius, constrainedDelta);
    playerRig.position.addScaledVector(constrainedDelta, 1);
    playerRig.position.y = y;
    clampPositionToWalkRadius(playerRig.position, activeWalkRadius);
    playerRig.position.y = y;
  }

  function setLeftYawLocked(locked) { leftYawLocked = Boolean(locked); }
  function setWalkRadius(nextRadius, { clamp = false } = {}) {
    activeWalkRadius = nextRadius === Infinity || (Number.isFinite(nextRadius) && nextRadius > 0)
      ? nextRadius : initialWalkRadius;
    if (clamp) clampPositionToWalkRadius(playerRig.position, activeWalkRadius);
  }
  function reset() { playerRig.position.y = initialLocalY; leftYawLocked = false; activeWalkRadius = initialWalkRadius; }
  function resetScenarioBaseline() { playerRig.position.y = initialLocalY; leftYawLocked = false; activeWalkRadius = Infinity; }
  function hydrateScenarioState(state) {
    if (state?.boundary !== 'GLYPH_RING' || !Number.isFinite(scenarioGlyphRingRadius) || scenarioGlyphRingRadius <= 0) {
      throw new Error('GLYPH_RING scenario boundary requires scenarioGlyphRingRadius');
    }
    setWalkRadius(scenarioGlyphRingRadius, { clamp: false });
  }
  function teleportLocal(position, lookAt) {
    if (!position?.isVector3 || !lookAt?.isVector3) throw new TypeError('teleportLocal requires local Vector3 positions');
    playerRig.position.copy(position);
    playerRig.position.y = initialLocalY;
    playerRig.lookAt(lookAt.x, playerRig.position.y, lookAt.z);
    clampPositionToWalkRadius(playerRig.position, activeWalkRadius);
  }
  function dispose() { disposed = true; }
  return { update, reset, resetScenarioBaseline, dispose, setLeftYawLocked, setWalkRadius, hydrateScenarioState, teleportLocal,
    getWalkRadius: () => activeWalkRadius };
}
