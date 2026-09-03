import * as THREE from '../../vendor/three.js';

export const VR_ASTERION_SECTOR_CONTROL_PHASES = Object.freeze({
  IDLE: 'IDLE',
  DRIVING: 'DRIVING',
  DETENT_HOLD: 'DETENT_HOLD',
  SETTLING: 'SETTLING'
});

export const VR_ASTERION_SECTOR_CONTROL_EVENTS = Object.freeze({
  DETENT_COMMITTED: 'DETENT_COMMITTED'
});

const DETENT_ANGLES_DEGREES = Object.freeze([0, 13, 23, 36]);
const IDENTITY_POSITION = Object.freeze({ x: 0, y: 0, z: 0 });
const HALF_SECTOR_ANGLE = Math.PI / 5;
const RAD_TO_DEG = 180 / Math.PI;
const EPSILON = 1e-6;

const SECTOR_DEFINITIONS = Object.freeze({
  'ethics-life-protection': Object.freeze({ branchId: 'earth', motionAxis: Object.freeze({ x: Math.sin(HALF_SECTOR_ANGLE), y: 0, z: Math.cos(HALF_SECTOR_ANGLE) }), gestureAxis: Object.freeze({ x: 0, y: 0, z: 1 }), gestureSign: 1, motionSign: 1, hinge: 'ORIGIN' }),
  'ai-guide': Object.freeze({ branchId: 'wood', motionAxis: Object.freeze({ x: -Math.sin(HALF_SECTOR_ANGLE), y: 0, z: Math.cos(HALF_SECTOR_ANGLE) }), gestureAxis: Object.freeze({ x: 0, y: 0, z: 1 }), gestureSign: 1, motionSign: -1, hinge: 'ORIGIN' }),
  'creative-ai': Object.freeze({ branchId: 'fire', motionAxis: Object.freeze({ x: 1, y: 0, z: 0 }), gestureAxis: Object.freeze({ x: 1, y: 0, z: 0 }), gestureSign: -1, motionSign: 1, hinge: 'MIN_Z' })
});

function clampStep(current, target, maximumStep) {
  if (current < target) return Math.min(target, current + maximumStep);
  if (current > target) return Math.max(target, current - maximumStep);
  return target;
}

export function createVrAsterionSectorControlInteraction({
  controllers = [], progressFloor, sectorAcquisitionInteraction, settings = {}
}) {
  const config = {
    angularSpeedDegrees: Math.max(0.1, Number(settings.angularSpeedDegrees) || 16),
    detentPauseSeconds: Math.max(0, Number(settings.detentPauseSeconds) || 0.12),
    gestureMaxDegrees: Math.max(1, Number(settings.gestureMaxDegrees) || 90),
    gestureReleaseDegrees: Math.max(0, Number(settings.gestureReleaseDegrees) || 10)
  };
  const SECTORS = SECTOR_DEFINITIONS;
  const sectorStates = new Map(Object.keys(SECTORS).map((glyphId) => [glyphId, {
    committedLevel: 0,
    currentAngleDegrees: 0,
    pendingSourceLevel: null,
    pendingLevel: null,
    pendingDirection: 0
  }]));
  const listeners = new Set();
  const driveActivityListeners = new Set();
  const neutralControllerQuaternion = new THREE.Quaternion();
  const controlFrameQuaternion = new THREE.Quaternion();
  const currentControllerQuaternion = new THREE.Quaternion();
  const relativeQuaternion = new THREE.Quaternion();
  const neutralRelativeQuaternion = new THREE.Quaternion();
  const deltaQuaternion = new THREE.Quaternion();
  const motionQuaternion = new THREE.Quaternion();
  const axis = new THREE.Vector3();
  const pivot = new THREE.Vector3();
  const rotatedPivot = new THREE.Vector3();
  const motionPosition = new THREE.Vector3();
  let phase = VR_ASTERION_SECTOR_CONTROL_PHASES.IDLE;
  let movingGlyphId = null;
  let lockedGlyphId = null;
  let intent = 0;
  let driveDirection = 0;
  let holdRemaining = 0;
  let controlWasAvailable = false;
  let neutralValid = false;
  let disposed = false;
  let driveActivityGlyphId = null;
  let driveActivityActive = false;

  function setDriveActivity(glyphId, active) {
    const nextActive = Boolean(active && glyphId && SECTORS[glyphId]);
    const nextGlyphId = nextActive ? glyphId : (driveActivityGlyphId ?? glyphId);
    if (driveActivityActive === nextActive && (!nextActive || driveActivityGlyphId === nextGlyphId)) return;
    driveActivityActive = nextActive;
    driveActivityGlyphId = nextActive ? nextGlyphId : null;
    if (!nextGlyphId || !SECTORS[nextGlyphId]) return;
    const event = Object.freeze({ glyphId: nextGlyphId, branchId: SECTORS[nextGlyphId].branchId, active: nextActive });
    [...driveActivityListeners].forEach((listener) => listener(event));
  }

  const getLeftRecord = () => controllers.find(({ handedness, isConnected, grip }) => handedness === 'left' && isConnected && grip) ?? null;

  function applyMotion(glyphId) {
    const descriptor = SECTORS[glyphId];
    const state = sectorStates.get(glyphId);
    if (!descriptor || !state) return false;
    if (Math.abs(state.currentAngleDegrees) <= EPSILON) {
      motionQuaternion.identity();
      return progressFloor.setSectorMotion(glyphId, { position: IDENTITY_POSITION, quaternion: motionQuaternion });
    }
    axis.set(descriptor.motionAxis.x, descriptor.motionAxis.y, descriptor.motionAxis.z);
    motionQuaternion.setFromAxisAngle(axis, THREE.MathUtils.degToRad(state.currentAngleDegrees * descriptor.motionSign));
    if (descriptor.hinge === 'ORIGIN') {
      return progressFloor.setSectorMotion(glyphId, { position: IDENTITY_POSITION, quaternion: motionQuaternion });
    }
    const bounds = progressFloor.getSectorMotionBounds?.(glyphId);
    if (!bounds?.min || !bounds?.max) return false;
    pivot.set(0, bounds.max.y, bounds.min.z);
    rotatedPivot.copy(pivot).applyQuaternion(motionQuaternion);
    motionPosition.copy(pivot).sub(rotatedPivot);
    return progressFloor.setSectorMotion(glyphId, { position: motionPosition, quaternion: motionQuaternion });
  }

  function captureNeutral(glyphId, leftRecord) {
    const frame = progressFloor.getSectorControlFrame?.(glyphId);
    if (!frame?.quaternion || !leftRecord?.grip) {
      neutralValid = false;
      intent = 0;
      return;
    }
    controlFrameQuaternion.copy(frame.quaternion).normalize();
    leftRecord.grip.updateWorldMatrix(true, false);
    leftRecord.grip.getWorldQuaternion(neutralControllerQuaternion).normalize();
    neutralRelativeQuaternion.copy(controlFrameQuaternion).invert().multiply(neutralControllerQuaternion).normalize();
    neutralValid = true;
    intent = 0;
  }

  function readIntent(glyphId, leftRecord) {
    if (!neutralValid || !leftRecord?.grip) return 0;
    leftRecord.grip.updateWorldMatrix(true, false);
    leftRecord.grip.getWorldQuaternion(currentControllerQuaternion).normalize();
    relativeQuaternion.copy(controlFrameQuaternion).invert().multiply(currentControllerQuaternion).normalize();
    deltaQuaternion.copy(neutralRelativeQuaternion).invert().multiply(relativeQuaternion).normalize();
    const descriptor = SECTORS[glyphId];
    const component = deltaQuaternion.x * descriptor.gestureAxis.x
      + deltaQuaternion.y * descriptor.gestureAxis.y + deltaQuaternion.z * descriptor.gestureAxis.z;
    const measuredDegrees = 2 * Math.atan2(component, Math.abs(deltaQuaternion.w))
      * RAD_TO_DEG * descriptor.gestureSign;
    const signedDegrees = THREE.MathUtils.clamp(
      measuredDegrees, -config.gestureMaxDegrees, config.gestureMaxDegrees
    );
    if (signedDegrees > config.gestureReleaseDegrees) return 1;
    if (signedDegrees < -config.gestureReleaseDegrees) return -1;
    return 0;
  }

  function emitDetent(glyphId, previousLevel, level, direction) {
    const event = Object.freeze({
      type: VR_ASTERION_SECTOR_CONTROL_EVENTS.DETENT_COMMITTED,
      glyphId,
      branchId: SECTORS[glyphId].branchId,
      previousLevel,
      level,
      angleDegrees: DETENT_ANGLES_DEGREES[level],
      direction: direction > 0 ? 'UP' : 'DOWN'
    });
    [...listeners].forEach((listener) => listener(event));
  }

  function clearPending(state) {
    state.pendingSourceLevel = null;
    state.pendingLevel = null;
    state.pendingDirection = 0;
  }

  function beginStep(glyphId, direction) {
    const state = sectorStates.get(glyphId);
    const targetLevel = state.committedLevel + direction;
    if (targetLevel < 0 || targetLevel >= DETENT_ANGLES_DEGREES.length) {
      phase = VR_ASTERION_SECTOR_CONTROL_PHASES.IDLE;
      movingGlyphId = null;
      driveDirection = 0;
      return false;
    }
    state.pendingSourceLevel = state.committedLevel;
    state.pendingLevel = targetLevel;
    state.pendingDirection = direction;
    movingGlyphId = glyphId;
    driveDirection = direction;
    phase = VR_ASTERION_SECTOR_CONTROL_PHASES.DRIVING;
    return true;
  }

  function advancePending(delta, activelyDriven, controlAvailable) {
    if (!movingGlyphId) return;
    const state = sectorStates.get(movingGlyphId);
    if (!state || state.pendingLevel === null) return;
    phase = activelyDriven
      ? VR_ASTERION_SECTOR_CONTROL_PHASES.DRIVING
      : VR_ASTERION_SECTOR_CONTROL_PHASES.SETTLING;
    const targetLevel = state.pendingLevel;
    const targetAngle = DETENT_ANGLES_DEGREES[targetLevel];
    state.currentAngleDegrees = clampStep(state.currentAngleDegrees, targetAngle, config.angularSpeedDegrees * delta);
    applyMotion(movingGlyphId);
    if (Math.abs(state.currentAngleDegrees - targetAngle) > EPSILON) return;
    const completedGlyphId = movingGlyphId;
    const previousLevel = state.pendingSourceLevel;
    const direction = state.pendingDirection;
    state.currentAngleDegrees = targetAngle;
    state.committedLevel = targetLevel;
    clearPending(state);
    applyMotion(completedGlyphId);
    emitDetent(completedGlyphId, previousLevel, targetLevel, direction);
    movingGlyphId = null;
    if (controlAvailable) {
      phase = VR_ASTERION_SECTOR_CONTROL_PHASES.DETENT_HOLD;
      holdRemaining = config.detentPauseSeconds;
      driveDirection = direction;
    } else {
      phase = VR_ASTERION_SECTOR_CONTROL_PHASES.IDLE;
      driveDirection = 0;
    }
  }

  function update(delta = 0) {
    if (disposed) return;
    const safeDelta = Math.max(0, Number.isFinite(delta) ? delta : 0);
    const acquisitionGlyphId = sectorAcquisitionInteraction.getLockedGlyphId?.() ?? null;
    const available = sectorAcquisitionInteraction.isControlAvailable?.() === true
      && Boolean(SECTORS[acquisitionGlyphId]);
    const leftRecord = getLeftRecord();

    if (!available) {
      setDriveActivity(movingGlyphId ?? lockedGlyphId, false);
      controlWasAvailable = false;
      neutralValid = false;
      intent = 0;
      if (movingGlyphId) advancePending(safeDelta, false, false);
      else {
        phase = VR_ASTERION_SECTOR_CONTROL_PHASES.IDLE;
        holdRemaining = 0;
        driveDirection = 0;
        if (!acquisitionGlyphId) lockedGlyphId = null;
      }
      return;
    }

    if (movingGlyphId && acquisitionGlyphId !== movingGlyphId) {
      setDriveActivity(movingGlyphId, false);
      intent = 0;
      advancePending(safeDelta, false, false);
      return;
    }

    if (acquisitionGlyphId !== lockedGlyphId || !controlWasAvailable || !neutralValid) {
      lockedGlyphId = acquisitionGlyphId;
      captureNeutral(lockedGlyphId, leftRecord);
    }
    controlWasAvailable = true;
    intent = readIntent(lockedGlyphId, leftRecord);

    if (movingGlyphId) {
      setDriveActivity(movingGlyphId, intent === driveDirection);
      advancePending(safeDelta, intent === driveDirection, true);
      return;
    }
    if (phase === VR_ASTERION_SECTOR_CONTROL_PHASES.DETENT_HOLD) {
      setDriveActivity(lockedGlyphId, intent === driveDirection);
      holdRemaining = Math.max(0, holdRemaining - safeDelta);
      if (holdRemaining > 0) return;
      phase = VR_ASTERION_SECTOR_CONTROL_PHASES.IDLE;
      if (intent !== driveDirection) return;
    }
    if (intent === 0) {
      setDriveActivity(lockedGlyphId, false);
      phase = VR_ASTERION_SECTOR_CONTROL_PHASES.IDLE;
      movingGlyphId = null;
      return;
    }
    if (beginStep(lockedGlyphId, intent)) {
      setDriveActivity(lockedGlyphId, true);
      advancePending(safeDelta, true, true);
    } else setDriveActivity(lockedGlyphId, false);
  }

  function reset() {
    if (disposed) return;
    setDriveActivity(movingGlyphId ?? lockedGlyphId, false);
    sectorStates.forEach((state, glyphId) => {
      state.committedLevel = 0;
      state.currentAngleDegrees = 0;
      clearPending(state);
      progressFloor.resetSectorMotion(glyphId);
    });
    phase = VR_ASTERION_SECTOR_CONTROL_PHASES.IDLE;
    movingGlyphId = null;
    lockedGlyphId = null;
    intent = 0;
    driveDirection = 0;
    holdRemaining = 0;
    controlWasAvailable = false;
    neutralValid = false;
  }

  function dispose() {
    if (disposed) return;
    reset();
    listeners.clear();
    driveActivityListeners.clear();
    disposed = true;
  }

  return {
    update,
    reset,
    dispose,
    getSectorLevel: (glyphId) => sectorStates.get(glyphId)?.committedLevel ?? null,
    getSectorAngleDegrees: (glyphId) => sectorStates.get(glyphId)?.currentAngleDegrees ?? null,
    getSectorControlSnapshot: () => Object.freeze([...sectorStates].map(([glyphId, state]) => Object.freeze({
      glyphId, branchId: SECTORS[glyphId].branchId,
      committedLevel: state.committedLevel, currentAngleDegrees: state.currentAngleDegrees
    }))),
    getMotionPhase: () => phase,
    getMovingGlyphId: () => movingGlyphId,
    isDriveActive: () => driveActivityActive,
    supportsGlyph: (glyphId) => Boolean(SECTORS[glyphId]),
    isMoving: () => phase === VR_ASTERION_SECTOR_CONTROL_PHASES.DRIVING
      || phase === VR_ASTERION_SECTOR_CONTROL_PHASES.SETTLING,
    subscribe(listener) {
      if (disposed || typeof listener !== 'function') return () => {};
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    subscribeDriveActivity(listener) {
      if (disposed || typeof listener !== 'function') return () => {};
      driveActivityListeners.add(listener);
      return () => driveActivityListeners.delete(listener);
    }
  };
}
