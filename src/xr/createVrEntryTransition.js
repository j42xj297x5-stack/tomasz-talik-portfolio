import * as THREE from '../vendor/three.js';

export function smoothstep(progress) {
  const clamped = Math.min(1, Math.max(0, progress));
  return clamped * clamped * (3 - 2 * clamped);
}

export function calculateVrEntryTarget({ ringCenter, spawnPosition, effectiveRingRadius, targetRadiusFactor }) {
  const centerX = Number.isFinite(ringCenter?.x) ? ringCenter.x : 0;
  const centerZ = Number.isFinite(ringCenter?.z) ? ringCenter.z : 0;
  let directionX = (spawnPosition?.x ?? 0) - centerX;
  let directionZ = (spawnPosition?.z ?? 0) - centerZ;
  const length = Math.hypot(directionX, directionZ);
  if (length < 1e-8 || !Number.isFinite(length)) { directionX = 0; directionZ = 1; }
  else { directionX /= length; directionZ /= length; }
  const radius = effectiveRingRadius * targetRadiusFactor;
  return { x: centerX + directionX * radius, z: centerZ + directionZ * radius };
}

export function createVrEntryTransition({
  playerRig,
  renderer,
  camera,
  settings,
  ringCenter,
  spawnPosition,
  effectiveRingRadius,
  onComplete = () => {}
}) {
  const headStartWorld = new THREE.Vector3();
  let state = 'idle';
  let elapsedSeconds = 0;
  let rigStartX = 0;
  let rigStartZ = 0;
  let rigEndX = 0;
  let rigEndZ = 0;
  let completionCallback = onComplete;
  let disposed = false;

  function finish() {
    playerRig.position.x = rigEndX;
    playerRig.position.z = rigEndZ;
    state = 'arrived';
    const callback = completionCallback;
    completionCallback = null;
    callback?.();
  }

  function start() {
    if (disposed || state !== 'idle') return false;

    const xrCamera = renderer.xr.getCamera(camera);
    xrCamera.getWorldPosition(headStartWorld);
    rigStartX = playerRig.position.x;
    rigStartZ = playerRig.position.z;
    const target = Number.isFinite(effectiveRingRadius) && effectiveRingRadius > 0
      ? calculateVrEntryTarget({ ringCenter, spawnPosition, effectiveRingRadius, targetRadiusFactor: settings.targetRadiusFactor })
      : settings.target;
    rigEndX = rigStartX + target.x - headStartWorld.x;
    rigEndZ = rigStartZ + target.z - headStartWorld.z;
    elapsedSeconds = 0;

    if (!settings.enabled) {
      finish();
      return true;
    }

    state = 'moving';
    return true;
  }

  function update(delta) {
    if (disposed || state !== 'moving') return;
    elapsedSeconds += Number.isFinite(delta) && delta > 0 ? delta : 0;
    const progress = Math.min(1, elapsedSeconds / settings.durationSeconds);
    const easedProgress = settings.easing === 'smoothstep' ? smoothstep(progress) : progress;
    playerRig.position.x = rigStartX + (rigEndX - rigStartX) * easedProgress;
    playerRig.position.z = rigStartZ + (rigEndZ - rigStartZ) * easedProgress;
    if (progress === 1) finish();
  }

  function reset() {
    if (disposed) return;
    state = 'idle';
    elapsedSeconds = 0;
    completionCallback = onComplete;
  }

  function dispose() {
    if (disposed) return;
    disposed = true;
    state = 'idle';
    elapsedSeconds = 0;
    completionCallback = null;
  }

  return { get state() { return state; }, start, update, reset, dispose };
}
