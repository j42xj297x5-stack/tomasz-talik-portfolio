import * as THREE from '../vendor/three.js';

const DEG_TO_RAD = Math.PI / 180;

const PIVOT = new THREE.Vector3(0, 0.8, 0);
const CAMERA_RADIUS = 6;
const BASE_HEIGHT = 1.05;

const MAX_YAW_DEG = 45;
const MAX_PITCH_DEG = 30;
const MAX_YAW_RAD = MAX_YAW_DEG * DEG_TO_RAD;
const MAX_PITCH_RAD = MAX_PITCH_DEG * DEG_TO_RAD;
const MOBILE_MAX_YAW_DEG = 24;
const MOBILE_MAX_PITCH_DEG = 16;
const MOBILE_MAX_YAW_RAD = MOBILE_MAX_YAW_DEG * DEG_TO_RAD;
const MOBILE_MAX_PITCH_RAD = MOBILE_MAX_PITCH_DEG * DEG_TO_RAD;

const MOUSE_ORBIT_DAMPING = 0.08;
const MOUSE_RESUME_DURATION_MS = 1500;
const IDLE_DRIFT_DAMPING = 0.02;
const IDLE_YAW_AMPLITUDE_RAD = 4 * DEG_TO_RAD;
const IDLE_PITCH_AMPLITUDE_RAD = 2 * DEG_TO_RAD;

const INVERT_YAW = false;

export function createCameraRig(pointerElement = document.documentElement) {
  const supportsFinePointer = window.matchMedia('(pointer:fine)').matches;

  const state = {
    hasMouseInput: false,
    hasTouchInput: false,
    touchReturnActive: false,
    mouseControlPaused: false,
    mouseResumeTransition: null,
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
    if (event.pointerType === 'touch' || !supportsFinePointer) return;

    const { mouseX, mouseY } = normalizePointer(event);
    const yawDirection = INVERT_YAW ? -1 : 1;

    if (state.mouseControlPaused) return;

    state.targetYaw = mouseX * MAX_YAW_RAD * yawDirection;
    state.targetPitch = -mouseY * MAX_PITCH_RAD;
    state.hasMouseInput = true;
  }

  function setTouchDragTarget({ deltaX, deltaY, width, height }) {
    const normalizedX = THREE.MathUtils.clamp(deltaX / ((width || window.innerWidth || 1) * 0.5), -1, 1);
    const normalizedY = THREE.MathUtils.clamp(deltaY / ((height || window.innerHeight || 1) * 0.5), -1, 1);

    state.targetYaw = normalizedX * MOBILE_MAX_YAW_RAD;
    state.targetPitch = THREE.MathUtils.clamp(-normalizedY * MOBILE_MAX_PITCH_RAD, -MOBILE_MAX_PITCH_RAD, MOBILE_MAX_PITCH_RAD);
    state.hasTouchInput = true;
    state.touchReturnActive = false;
  }

  function releaseTouchTarget() {
    state.hasTouchInput = false;
    state.touchReturnActive = true;
    state.targetYaw = 0;
    state.targetPitch = 0;
  }

  function onPointerLeave() {
    if (state.mouseControlPaused) return;

    state.hasMouseInput = false;
    state.targetYaw = 0;
    state.targetPitch = 0;
  }

  function pauseMouseControl() {
    const mouseTarget = getMouseTarget();
    state.targetYaw = mouseTarget.yaw;
    state.targetPitch = mouseTarget.pitch;
    state.mouseResumeTransition = null;
    state.mouseControlPaused = true;
  }

  function resumeMouseControl(pointerPosition) {
    state.mouseControlPaused = false;

    if (!pointerPosition || !Number.isFinite(pointerPosition.clientX) || !Number.isFinite(pointerPosition.clientY)) {
      state.mouseResumeTransition = null;
      return;
    }

    const { mouseX, mouseY } = normalizePointer(pointerPosition);
    const yawDirection = INVERT_YAW ? -1 : 1;
    const fromYaw = state.targetYaw;
    const fromPitch = state.targetPitch;

    state.targetYaw = mouseX * MAX_YAW_RAD * yawDirection;
    state.targetPitch = -mouseY * MAX_PITCH_RAD;
    state.hasMouseInput = true;
    state.mouseResumeTransition = {
      fromYaw,
      fromPitch,
      startedAt: performance.now()
    };
  }

  function getMouseTarget() {
    const transition = state.mouseResumeTransition;
    if (!transition) {
      return { yaw: state.targetYaw, pitch: state.targetPitch };
    }

    const progress = THREE.MathUtils.clamp((performance.now() - transition.startedAt) / MOUSE_RESUME_DURATION_MS, 0, 1);
    const easedProgress = progress * progress * (3 - 2 * progress);
    const target = {
      yaw: THREE.MathUtils.lerp(transition.fromYaw, state.targetYaw, easedProgress),
      pitch: THREE.MathUtils.lerp(transition.fromPitch, state.targetPitch, easedProgress)
    };

    if (progress === 1) {
      state.mouseResumeTransition = null;
    }

    return target;
  }

  function update(camera, elapsed) {
    const idleYaw = Math.sin(elapsed * 0.25) * IDLE_YAW_AMPLITUDE_RAD;
    const idlePitch = Math.sin(elapsed * 0.32) * IDLE_PITCH_AMPLITUDE_RAD;

    const mouseTarget = getMouseTarget();
    const hasDirectInput = state.hasMouseInput || state.hasTouchInput || state.touchReturnActive;
    const inputDamping = hasDirectInput ? MOUSE_ORBIT_DAMPING : IDLE_DRIFT_DAMPING;

    const desiredYaw = mouseTarget.yaw + idleYaw;
    const desiredPitch = mouseTarget.pitch + idlePitch;

    state.currentYaw = THREE.MathUtils.lerp(state.currentYaw, desiredYaw, inputDamping);
    state.currentPitch = THREE.MathUtils.lerp(state.currentPitch, desiredPitch, inputDamping);

    if (state.touchReturnActive && Math.abs(state.currentYaw - desiredYaw) < 0.002 && Math.abs(state.currentPitch - desiredPitch) < 0.002) {
      state.touchReturnActive = false;
    }

    const x = PIVOT.x + Math.sin(state.currentYaw) * CAMERA_RADIUS;
    const z = PIVOT.z + Math.cos(state.currentYaw) * CAMERA_RADIUS;
    const y = PIVOT.y + BASE_HEIGHT + Math.sin(state.currentPitch) * CAMERA_RADIUS;

    camera.position.set(x, y, z);
    camera.lookAt(PIVOT);
  }

  return {
    onPointerMove,
    onPointerLeave,
    pauseMouseControl,
    resumeMouseControl,
    setTouchDragTarget,
    releaseTouchTarget,
    update
  };
}
