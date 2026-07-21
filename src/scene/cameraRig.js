import * as THREE from '../vendor/three.js';

const DEG_TO_RAD = Math.PI / 180;
const PIVOT = new THREE.Vector3(0, 0.8, 0);
const CAMERA_RADIUS = 6;
const BASE_HEIGHT = 1.05;
const MAX_YAW_RAD = 45 * DEG_TO_RAD;
const MAX_PITCH_RAD = 30 * DEG_TO_RAD;
const MOBILE_MAX_YAW_RAD = 24 * DEG_TO_RAD;
const MOBILE_MAX_PITCH_RAD = 16 * DEG_TO_RAD;
const MOUSE_ORBIT_DAMPING = 0.08;
const MOUSE_RESUME_DURATION_MS = 1500;
const IDLE_DRIFT_DAMPING = 0.02;
const IDLE_YAW_AMPLITUDE_RAD = 4 * DEG_TO_RAD;
const IDLE_PITCH_AMPLITUDE_RAD = 2 * DEG_TO_RAD;
const INVERT_YAW = false;

const smoothstep = (value) => value * value * (3 - 2 * value);

export function createCameraRig(pointerElement = document.documentElement) {
  const supportsFinePointer = window.matchMedia('(pointer:fine)').matches;
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const state = { hasMouseInput: false, hasTouchInput: false, touchReturnActive: false, mouseControlPaused: false, interactionLocked: false, mouseResumeTransition: null, targetYaw: 0, targetPitch: 0, currentYaw: 0, currentPitch: 0, transition: null };

  function normalizePointer(event) {
    const rect = pointerElement.getBoundingClientRect();
    const width = rect.width || window.innerWidth || 1;
    const height = rect.height || window.innerHeight || 1;
    return { mouseX: THREE.MathUtils.clamp(((event.clientX - rect.left) / width) * 2 - 1, -1, 1), mouseY: THREE.MathUtils.clamp(((event.clientY - rect.top) / height) * 2 - 1, -1, 1) };
  }

  function onPointerMove(event) {
    if (event.pointerType === 'touch' || !supportsFinePointer || state.mouseControlPaused || state.interactionLocked) return;
    const { mouseX, mouseY } = normalizePointer(event);
    state.targetYaw = mouseX * MAX_YAW_RAD * (INVERT_YAW ? -1 : 1);
    state.targetPitch = -mouseY * MAX_PITCH_RAD;
    state.hasMouseInput = true;
  }

  function setTouchDragTarget({ deltaX, deltaY, width, height }) {
    if (state.interactionLocked) return;
    state.targetYaw = THREE.MathUtils.clamp(deltaX / ((width || window.innerWidth || 1) * 0.5), -1, 1) * MOBILE_MAX_YAW_RAD;
    state.targetPitch = THREE.MathUtils.clamp(-deltaY / ((height || window.innerHeight || 1) * 0.5), -1, 1) * MOBILE_MAX_PITCH_RAD;
    state.hasTouchInput = true;
    state.touchReturnActive = false;
  }

  function releaseTouchTarget() {
    if (state.interactionLocked) return;
    state.hasTouchInput = false;
    state.touchReturnActive = true;
    state.targetYaw = 0;
    state.targetPitch = 0;
  }

  function onPointerLeave() {
    if (state.mouseControlPaused || state.interactionLocked) return;
    state.hasMouseInput = false;
    state.targetYaw = 0;
    state.targetPitch = 0;
  }

  function pauseMouseControl() {
    const target = getMouseTarget();
    state.targetYaw = target.yaw;
    state.targetPitch = target.pitch;
    state.mouseResumeTransition = null;
    state.mouseControlPaused = true;
  }

  function resumeMouseControl(pointerPosition) {
    state.mouseControlPaused = false;
    if (!pointerPosition || !Number.isFinite(pointerPosition.clientX) || !Number.isFinite(pointerPosition.clientY)) return;
    const { mouseX, mouseY } = normalizePointer(pointerPosition);
    const fromYaw = state.targetYaw;
    const fromPitch = state.targetPitch;
    state.targetYaw = mouseX * MAX_YAW_RAD * (INVERT_YAW ? -1 : 1);
    state.targetPitch = -mouseY * MAX_PITCH_RAD;
    state.hasMouseInput = true;
    state.mouseResumeTransition = { fromYaw, fromPitch, startedAt: performance.now() };
  }

  function getMouseTarget() {
    const transition = state.mouseResumeTransition;
    if (!transition) return { yaw: state.targetYaw, pitch: state.targetPitch };
    const progress = THREE.MathUtils.clamp((performance.now() - transition.startedAt) / MOUSE_RESUME_DURATION_MS, 0, 1);
    const eased = smoothstep(progress);
    if (progress === 1) state.mouseResumeTransition = null;
    return { yaw: THREE.MathUtils.lerp(transition.fromYaw, state.targetYaw, eased), pitch: THREE.MathUtils.lerp(transition.fromPitch, state.targetPitch, eased) };
  }

  function startTransition(camera, { targetPosition, targetLookAt, duration, arcCenter }) {
    if (state.transition) return Promise.reject(new Error('Camera transition already in progress.'));
    return new Promise((resolve) => {
      const startPosition = camera.position.clone();
      const startAzimuth = arcCenter ? Math.atan2(startPosition.x - arcCenter.x, startPosition.z - arcCenter.z) : 0;
      const targetAzimuth = arcCenter ? Math.atan2(targetPosition.x - arcCenter.x, targetPosition.z - arcCenter.z) : 0;
      let azimuthDelta = targetAzimuth - startAzimuth;
      if (azimuthDelta > Math.PI) azimuthDelta -= Math.PI * 2;
      if (azimuthDelta < -Math.PI) azimuthDelta += Math.PI * 2;
      state.transition = { startedAt: performance.now(), duration: prefersReducedMotion ? Math.min(duration, 150) : duration, startPosition, startLookAt: new THREE.Vector3().add(camera.getWorldDirection(new THREE.Vector3()).multiplyScalar(CAMERA_RADIUS)).add(camera.position), targetPosition, targetLookAt, arcCenter, startAzimuth, azimuthDelta, resolve };
    });
  }

  function focusOnNode(camera, node, centerWorldPosition = PIVOT, { duration = supportsFinePointer ? 1050 : 550 } = {}) {
    if (!node) return Promise.reject(new Error('Cannot focus camera without a node.'));
    const nodePosition = node.getWorldPosition(new THREE.Vector3());
    const center = centerWorldPosition.clone();
    const azimuth = Math.atan2(nodePosition.x - center.x, nodePosition.z - center.z);
    const targetPosition = new THREE.Vector3(center.x + Math.sin(azimuth) * CAMERA_RADIUS, center.y + BASE_HEIGHT, center.z + Math.cos(azimuth) * CAMERA_RADIUS);
    return startTransition(camera, { targetPosition, targetLookAt: nodePosition, duration, arcCenter: center });
  }

  function returnHome(camera, centerWorldPosition = PIVOT, { duration = supportsFinePointer ? 600 : 550 } = {}) {
    const center = centerWorldPosition.clone();
    const targetPosition = new THREE.Vector3(center.x, center.y + BASE_HEIGHT, center.z + CAMERA_RADIUS);
    return startTransition(camera, { targetPosition, targetLookAt: center, duration, arcCenter: center });
  }

  function updateTransition(camera) {
    const transition = state.transition;
    if (!transition) return false;
    const progress = THREE.MathUtils.clamp((performance.now() - transition.startedAt) / Math.max(1, transition.duration), 0, 1);
    const eased = smoothstep(progress);
    if (transition.arcCenter) {
      const startRadius = Math.hypot(transition.startPosition.x - transition.arcCenter.x, transition.startPosition.z - transition.arcCenter.z);
      const targetRadius = Math.hypot(transition.targetPosition.x - transition.arcCenter.x, transition.targetPosition.z - transition.arcCenter.z);
      const radius = THREE.MathUtils.lerp(startRadius, targetRadius, eased);
      const azimuth = transition.startAzimuth + transition.azimuthDelta * eased;
      camera.position.set(transition.arcCenter.x + Math.sin(azimuth) * radius, THREE.MathUtils.lerp(transition.startPosition.y, transition.targetPosition.y, eased), transition.arcCenter.z + Math.cos(azimuth) * radius);
    } else {
      camera.position.lerpVectors(transition.startPosition, transition.targetPosition, eased);
    }
    const lookAt = transition.startLookAt.clone().lerp(transition.targetLookAt, eased);
    camera.lookAt(lookAt);
    if (progress < 1) return true;
    camera.position.copy(transition.targetPosition);
    camera.lookAt(transition.targetLookAt);
    state.currentYaw = 0;
    state.currentPitch = 0;
    state.transition = null;
    transition.resolve();
    return true;
  }

  function update(camera, elapsed) {
    if (updateTransition(camera)) return;
    const idleYaw = Math.sin(elapsed * 0.25) * IDLE_YAW_AMPLITUDE_RAD;
    const idlePitch = Math.sin(elapsed * 0.32) * IDLE_PITCH_AMPLITUDE_RAD;
    const mouseTarget = getMouseTarget();
    const damping = state.hasMouseInput || state.hasTouchInput || state.touchReturnActive ? MOUSE_ORBIT_DAMPING : IDLE_DRIFT_DAMPING;
    state.currentYaw = THREE.MathUtils.lerp(state.currentYaw, mouseTarget.yaw + idleYaw, damping);
    state.currentPitch = THREE.MathUtils.lerp(state.currentPitch, mouseTarget.pitch + idlePitch, damping);
    if (state.touchReturnActive && Math.abs(state.currentYaw - (mouseTarget.yaw + idleYaw)) < 0.002 && Math.abs(state.currentPitch - (mouseTarget.pitch + idlePitch)) < 0.002) state.touchReturnActive = false;
    camera.position.set(PIVOT.x + Math.sin(state.currentYaw) * CAMERA_RADIUS, PIVOT.y + BASE_HEIGHT + Math.sin(state.currentPitch) * CAMERA_RADIUS, PIVOT.z + Math.cos(state.currentYaw) * CAMERA_RADIUS);
    camera.lookAt(PIVOT);
  }

  return { onPointerMove, onPointerLeave, pauseMouseControl, resumeMouseControl, setTouchDragTarget, releaseTouchTarget, setInteractionLocked: (locked) => { state.interactionLocked = locked; }, focusOnNode, returnHome, isTransitioning: () => Boolean(state.transition), update };
}
