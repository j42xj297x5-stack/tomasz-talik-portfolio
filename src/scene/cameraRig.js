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
const DOLLY_NEAR_PLANE_MARGIN = 0.15;

const smoothstep = (value) => value * value * (3 - 2 * value);
const shortestAngularDelta = (from, to) => Math.atan2(Math.sin(to - from), Math.cos(to - from));

export function createCameraRig(pointerElement = document.documentElement) {
  const supportsFinePointer = window.matchMedia('(pointer:fine)').matches;
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const pose = { yaw: 0, pitch: 0, radius: CAMERA_RADIUS, pivot: PIVOT.clone(), lookAt: PIVOT.clone() };
  const state = { hasMouseInput: false, hasTouchInput: false, touchReturnActive: false, mouseControlPaused: false, interactionLocked: false, mode: 'interactive', targetYaw: 0, targetPitch: 0, transition: null, resume: null, currentYaw: 0, currentPitch: 0, suppressInteractiveStep: false };

  function normalizePointer(event) {
    const rect = pointerElement.getBoundingClientRect();
    const width = rect.width || window.innerWidth || 1;
    const height = rect.height || window.innerHeight || 1;
    return { mouseX: THREE.MathUtils.clamp(((event.clientX - rect.left) / width) * 2 - 1, -1, 1), mouseY: THREE.MathUtils.clamp(((event.clientY - rect.top) / height) * 2 - 1, -1, 1) };
  }

  function pointerTarget(event) {
    const { mouseX, mouseY } = normalizePointer(event);
    return { yaw: mouseX * MAX_YAW_RAD * (INVERT_YAW ? -1 : 1), pitch: -mouseY * MAX_PITCH_RAD };
  }

  function applyPose(camera) {
    camera.position.set(pose.pivot.x + Math.sin(pose.yaw) * pose.radius, pose.pivot.y + BASE_HEIGHT + Math.sin(pose.pitch) * pose.radius, pose.pivot.z + Math.cos(pose.yaw) * pose.radius);
    camera.lookAt(pose.lookAt);
  }

  function setHomePose(camera) {
    const interruptedTransition = state.transition;
    pose.yaw = 0;
    pose.pitch = 0;
    pose.radius = CAMERA_RADIUS;
    pose.pivot.copy(PIVOT);
    pose.lookAt.copy(PIVOT);
    state.currentYaw = 0;
    state.currentPitch = 0;
    state.targetYaw = 0;
    state.targetPitch = 0;
    state.transition = null;
    state.resume = null;
    state.mode = 'interactive';
    state.hasMouseInput = false;
    state.hasTouchInput = false;
    state.touchReturnActive = false;
    state.suppressInteractiveStep = false;
    applyPose(camera);
    interruptedTransition?.resolve();
  }

  function onPointerMove(event) {
    if (event.pointerType === 'touch' || !supportsFinePointer || state.mouseControlPaused || state.interactionLocked) return;
    const target = pointerTarget(event);
    if (state.mode === 'resume') {
      state.resume.targetYaw = target.yaw;
      state.resume.targetPitch = target.pitch;
      return;
    }
    if (state.mode !== 'interactive') return;
    state.targetYaw = target.yaw;
    state.targetPitch = target.pitch;
    state.hasMouseInput = true;
  }

  function setTouchDragTarget({ deltaX, deltaY, width, height }) {
    if (state.interactionLocked || state.mode !== 'interactive') return;
    state.targetYaw = THREE.MathUtils.clamp(deltaX / ((width || window.innerWidth || 1) * 0.5), -1, 1) * MOBILE_MAX_YAW_RAD;
    state.targetPitch = THREE.MathUtils.clamp(-deltaY / ((height || window.innerHeight || 1) * 0.5), -1, 1) * MOBILE_MAX_PITCH_RAD;
    state.hasTouchInput = true;
    state.touchReturnActive = false;
  }

  function releaseTouchTarget() {
    if (state.interactionLocked || state.mode !== 'interactive') return;
    state.hasTouchInput = false;
    state.touchReturnActive = true;
    state.targetYaw = 0;
    state.targetPitch = 0;
  }

  function onPointerLeave() {
    if (state.mouseControlPaused || state.interactionLocked || state.mode !== 'interactive') return;
    state.hasMouseInput = false;
    state.targetYaw = 0;
    state.targetPitch = 0;
  }

  function pauseMouseControl() {
    state.mouseControlPaused = true;
    state.resume = null;
  }

  function resumeMouseControl(pointerPosition) {
    state.mouseControlPaused = false;
    if (!pointerPosition || !Number.isFinite(pointerPosition.clientX) || !Number.isFinite(pointerPosition.clientY)) return;
    const target = pointerTarget(pointerPosition);
    state.hasMouseInput = true;
    state.resume = { startedAt: performance.now(), duration: prefersReducedMotion ? Math.min(MOUSE_RESUME_DURATION_MS, 150) : MOUSE_RESUME_DURATION_MS, startYaw: pose.yaw, startPitch: pose.pitch, targetYaw: target.yaw, targetPitch: target.pitch };
    state.mode = 'resume';
  }

  function startTransition(kind, targetPose, duration) {
    if (state.transition || state.mode === 'resume') return Promise.reject(new Error('Camera transition already in progress.'));
    const startPose = { yaw: pose.yaw, pitch: pose.pitch, radius: pose.radius, pivot: pose.pivot.clone(), lookAt: pose.lookAt.clone() };
    return new Promise((resolve) => {
      state.mode = kind;
      state.transition = { startedAt: performance.now(), duration: prefersReducedMotion ? Math.min(duration, 150) : duration, startPose, targetPose, yawDelta: shortestAngularDelta(startPose.yaw, targetPose.yaw), resolve };
    });
  }

  function focusOnNode(camera, node, { duration = supportsFinePointer ? 1050 : 550 } = {}) {
    if (!node) return Promise.reject(new Error('Cannot focus camera without a node.'));
    const nodePosition = node.getWorldPosition(new THREE.Vector3());
    const yaw = Math.atan2(nodePosition.x - PIVOT.x, nodePosition.z - PIVOT.z);
    return startTransition('focus', { yaw, pitch: 0, radius: CAMERA_RADIUS, pivot: PIVOT, lookAt: nodePosition }, duration);
  }

  function returnHome(camera, { duration = supportsFinePointer ? 600 : 550 } = {}) {
    return startTransition('return', { yaw: 0, pitch: 0, radius: CAMERA_RADIUS, pivot: PIVOT, lookAt: PIVOT }, duration);
  }

  function dollyToPlaque(camera, plaque, { duration = supportsFinePointer ? 800 : 450, cover = 1.1 } = {}) {
    if (!plaque) return Promise.reject(new Error('Cannot dolly without plaque.'));
    const bounds = new THREE.Box3().setFromObject(plaque);
    const size = bounds.getSize(new THREE.Vector3());
    if (bounds.isEmpty() || size.x <= 0 || size.y <= 0) return Promise.reject(new Error('Plaque bounds unavailable.'));
    const verticalFov = THREE.MathUtils.degToRad(camera.fov);
    const horizontalFov = 2 * Math.atan(Math.tan(verticalFov / 2) * camera.aspect);
    const requiredCameraToPlaqueDistance = Math.max(
      size.y / (2 * Math.tan(verticalFov / 2)),
      size.x / (2 * Math.tan(horizontalFov / 2))
    ) / cover;
    const plaqueCenter = bounds.getCenter(new THREE.Vector3());
    // Camera radius is measured from the immutable pivot, whereas the cover
    // distance is measured from the plaque. Keeping them separate preserves
    // the focused side of the orbit and prevents crossing the plaque plane.
    const plaqueRadialDistance = Math.hypot(plaqueCenter.x - PIVOT.x, plaqueCenter.z - PIVOT.z);
    const safeRadius = plaqueRadialDistance + requiredCameraToPlaqueDistance;
    const distance = Math.max(safeRadius, plaqueRadialDistance + camera.near + DOLLY_NEAR_PLANE_MARGIN);
    const focusPose = { yaw: pose.yaw, pitch: pose.pitch, radius: pose.radius, pivot: pose.pivot.clone(), lookAt: pose.lookAt.clone() };
    return startTransition('dollyIn', { yaw: pose.yaw, pitch: pose.pitch, radius: distance, pivot: PIVOT, lookAt: plaqueCenter, focusPose }, duration);
  }

  function dollyOut(camera, { duration = supportsFinePointer ? 800 : 450 } = {}) {
    const focusPose = state.lastFocusPose;
    if (!focusPose) return Promise.reject(new Error('No stored focus pose for dolly out.'));
    return startTransition('dollyOut', focusPose, duration);
  }

  function updateCinematic(camera) {
    const transition = state.transition;
    if (!transition) return false;
    const progress = THREE.MathUtils.clamp((performance.now() - transition.startedAt) / Math.max(1, transition.duration), 0, 1);
    const eased = smoothstep(progress);
    pose.yaw = transition.startPose.yaw + transition.yawDelta * eased;
    pose.pitch = THREE.MathUtils.lerp(transition.startPose.pitch, transition.targetPose.pitch, eased);
    pose.radius = THREE.MathUtils.lerp(transition.startPose.radius, transition.targetPose.radius, eased);
    pose.pivot.copy(PIVOT);
    pose.lookAt.lerpVectors(transition.startPose.lookAt, transition.targetPose.lookAt, eased);
    applyPose(camera);
    if (progress < 1) return true;
    pose.yaw = transition.targetPose.yaw;
    pose.pitch = transition.targetPose.pitch;
    pose.radius = transition.targetPose.radius;
    pose.pivot.copy(transition.targetPose.pivot);
    pose.lookAt.copy(transition.targetPose.lookAt);
    if (state.mode === 'dollyIn') state.lastFocusPose = transition.targetPose.focusPose;
    if (state.mode === 'return') setHomePose(camera);
    else {
      state.currentYaw = pose.yaw;
      state.currentPitch = pose.pitch;
      state.transition = null;
      state.mode = 'locked';
    }
    transition.resolve();
    return true;
  }

  function updateResume(camera) {
    const resume = state.resume;
    const progress = THREE.MathUtils.clamp((performance.now() - resume.startedAt) / Math.max(1, resume.duration), 0, 1);
    const eased = smoothstep(progress);
    pose.yaw = THREE.MathUtils.lerp(resume.startYaw, resume.targetYaw, eased);
    pose.pitch = THREE.MathUtils.lerp(resume.startPitch, resume.targetPitch, eased);
    pose.radius = CAMERA_RADIUS;
    pose.pivot.copy(PIVOT);
    pose.lookAt.copy(PIVOT);
    applyPose(camera);
    if (progress < 1) return;
    state.currentYaw = pose.yaw;
    state.currentPitch = pose.pitch;
    state.targetYaw = resume.targetYaw;
    state.targetPitch = resume.targetPitch;
    state.resume = null;
    state.mode = 'interactive';
    state.suppressInteractiveStep = true;
  }

  function update(camera, elapsed) {
    if (state.transition) return updateCinematic(camera);
    if (state.mode === 'resume' && state.resume) return updateResume(camera);
    if (state.mode === 'locked') {
      applyPose(camera);
      return;
    }
    if (state.suppressInteractiveStep) {
      state.suppressInteractiveStep = false;
      applyPose(camera);
      return;
    }
    const idleYaw = Math.sin(elapsed * 0.25) * IDLE_YAW_AMPLITUDE_RAD;
    const idlePitch = Math.sin(elapsed * 0.32) * IDLE_PITCH_AMPLITUDE_RAD;
    const damping = state.hasMouseInput || state.hasTouchInput || state.touchReturnActive ? MOUSE_ORBIT_DAMPING : IDLE_DRIFT_DAMPING;
    state.currentYaw = THREE.MathUtils.lerp(state.currentYaw, state.targetYaw + idleYaw, damping);
    state.currentPitch = THREE.MathUtils.lerp(state.currentPitch, state.targetPitch + idlePitch, damping);
    if (state.touchReturnActive && Math.abs(state.currentYaw - (state.targetYaw + idleYaw)) < 0.002 && Math.abs(state.currentPitch - (state.targetPitch + idlePitch)) < 0.002) state.touchReturnActive = false;
    pose.yaw = state.currentYaw;
    pose.pitch = state.currentPitch;
    pose.radius = CAMERA_RADIUS;
    pose.pivot.copy(PIVOT);
    pose.lookAt.copy(PIVOT);
    applyPose(camera);
  }

  return { onPointerMove, onPointerLeave, pauseMouseControl, resumeMouseControl, setTouchDragTarget, releaseTouchTarget, setInteractionLocked: (locked) => { state.interactionLocked = locked; }, focusOnNode, dollyToPlaque, dollyOut, returnHome, resetHomePose: setHomePose, isTransitioning: () => Boolean(state.transition), update };
}
