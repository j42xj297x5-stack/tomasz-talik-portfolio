import * as THREE from '../vendor/three.js';

export function smoothstep(progress) {
  const clamped = Math.min(1, Math.max(0, progress));
  return clamped * clamped * (3 - 2 * clamped);
}

export function createVrEntryTransition({
  playerRig,
  renderer,
  camera,
  settings,
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
    rigEndX = rigStartX + settings.target.x - headStartWorld.x;
    rigEndZ = rigStartZ + settings.target.z - headStartWorld.z;
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
