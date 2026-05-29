import * as THREE from '../vendor/three.js';

const DEG_TO_RAD = Math.PI / 180;

const PIVOT = new THREE.Vector3(0, 0.8, 0);
const CAMERA_RADIUS = 6;
const BASE_HEIGHT = 1.05;

const MAX_YAW_DEG = 45;
const MAX_PITCH_DEG = 30;
const MAX_YAW_RAD = MAX_YAW_DEG * DEG_TO_RAD;
const MAX_PITCH_RAD = MAX_PITCH_DEG * DEG_TO_RAD;

const MOUSE_ORBIT_DAMPING = 0.08;
const IDLE_DRIFT_DAMPING = 0.02;
const IDLE_YAW_AMPLITUDE_RAD = 4 * DEG_TO_RAD;
const IDLE_PITCH_AMPLITUDE_RAD = 2 * DEG_TO_RAD;

const INVERT_YAW = false;

export function createCameraRig(pointerElement = document.documentElement) {
  const supportsFinePointer = window.matchMedia('(pointer:fine)').matches;

  const state = {
    hasMouseInput: false,
    targetYaw: 0,
    targetPitch: 0,
    currentYaw: 0,
    currentPitch: 0
  };

  function normalizePointer(event) {
    const rect = pointerElement.getBoundingClientRect();
    const width = rect.width || window.innerWidth || 1;
    const height = rect.height || window.innerHeight || 1;
    const mouseX = ((event.clientX - rect.left) / width) * 2 - 1;
    const mouseY = ((event.clientY - rect.top) / height) * 2 - 1;
    return {
      mouseX: THREE.MathUtils.clamp(mouseX, -1, 1),
      mouseY: THREE.MathUtils.clamp(mouseY, -1, 1)
    };
  }

  function onPointerMove(event) {
    if (!supportsFinePointer) return;

    const { mouseX, mouseY } = normalizePointer(event);
    const yawDirection = INVERT_YAW ? -1 : 1;

    state.targetYaw = mouseX * MAX_YAW_RAD * yawDirection;
    state.targetPitch = -mouseY * MAX_PITCH_RAD;
    state.hasMouseInput = true;
  }

  function onPointerLeave() {
    state.hasMouseInput = false;
    state.targetYaw = 0;
    state.targetPitch = 0;
  }

  function update(camera, elapsed) {
    const idleYaw = Math.sin(elapsed * 0.25) * IDLE_YAW_AMPLITUDE_RAD;
    const idlePitch = Math.sin(elapsed * 0.32) * IDLE_PITCH_AMPLITUDE_RAD;

    const inputDamping = state.hasMouseInput ? MOUSE_ORBIT_DAMPING : IDLE_DRIFT_DAMPING;

    const desiredYaw = state.targetYaw + idleYaw;
    const desiredPitch = state.targetPitch + idlePitch;

    state.currentYaw = THREE.MathUtils.lerp(state.currentYaw, desiredYaw, inputDamping);
    state.currentPitch = THREE.MathUtils.lerp(state.currentPitch, desiredPitch, inputDamping);

    const x = PIVOT.x + Math.sin(state.currentYaw) * CAMERA_RADIUS;
    const z = PIVOT.z + Math.cos(state.currentYaw) * CAMERA_RADIUS;
    const y = PIVOT.y + BASE_HEIGHT + Math.sin(state.currentPitch) * CAMERA_RADIUS;

    camera.position.set(x, y, z);
    camera.lookAt(PIVOT);
  }

  return {
    onPointerMove,
    onPointerLeave,
    update
  };
}
