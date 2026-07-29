import * as THREE from '../vendor/three.js';

export function applyDeadzone(value, deadzone) {
  if (!Number.isFinite(value) || Math.abs(value) <= deadzone) return 0;
  return Math.sign(value) * (Math.abs(value) - deadzone) / (1 - deadzone);
}

export function createVrLocomotion({ playerRig, renderer, camera, settings }) {
  const forward = new THREE.Vector3();
  const right = new THREE.Vector3();
  let disposed = false;

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
    playerRig.rotation.y -= left.x * settings.turnSpeed * delta;

    const rightStick = axesFor('right');
    const xrCamera = renderer.xr.getCamera(camera);
    xrCamera.getWorldDirection(forward);
    forward.y = 0;
    if (forward.lengthSq() < 1e-8) forward.set(0, 0, -1);
    forward.normalize();
    right.set(-forward.z, 0, forward.x);
    playerRig.position.addScaledVector(forward, -rightStick.y * settings.moveSpeed * delta);
    playerRig.position.addScaledVector(right, rightStick.x * settings.moveSpeed * delta);
    playerRig.position.y = y;
  }

  function reset() {}
  function dispose() { disposed = true; }
  return { update, reset, dispose };
}
