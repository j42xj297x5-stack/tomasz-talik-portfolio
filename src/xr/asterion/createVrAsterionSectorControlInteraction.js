import * as THREE from '../../vendor/three.js';
import { ASTERION_METAL_CONTROL_TUNING } from './asterionMetalControlConfig.js';

export const VR_ASTERION_SECTOR_CONTROL_PHASES = Object.freeze({
  IDLE: 'IDLE', DRIVING: 'DRIVING', DETENT_HOLD: 'DETENT_HOLD', SETTLING: 'SETTLING'
});

export const VR_ASTERION_SECTOR_CONTROL_EVENTS = Object.freeze({ DETENT_COMMITTED: 'DETENT_COMMITTED' });

const DETENT_ANGLES_DEGREES = Object.freeze([0, 13, 23, 36]);
const IDENTITY_POSITION = Object.freeze({ x: 0, y: 0, z: 0 });
const HALF_SECTOR_ANGLE = Math.PI / 5;
const RAD_TO_DEG = 180 / Math.PI;
const EPSILON = 1e-6;

const SECTOR_DEFINITIONS = Object.freeze({
  'ethics-life-protection': Object.freeze({ branchId: 'earth', motionAxis: Object.freeze({ x: Math.sin(HALF_SECTOR_ANGLE), y: 0, z: Math.cos(HALF_SECTOR_ANGLE) }), gestureAxis: Object.freeze({ x: 0, y: 0, z: 1 }), gestureSign: 1, motionSign: 1, hinge: 'ORIGIN' }),
  'ai-guide': Object.freeze({ branchId: 'wood', motionAxis: Object.freeze({ x: -Math.sin(HALF_SECTOR_ANGLE), y: 0, z: Math.cos(HALF_SECTOR_ANGLE) }), gestureAxis: Object.freeze({ x: 0, y: 0, z: 1 }), gestureSign: 1, motionSign: -1, hinge: 'ORIGIN' }),
  'creative-ai': Object.freeze({ branchId: 'fire', motionAxis: Object.freeze({ x: 1, y: 0, z: 0 }), gestureAxis: Object.freeze({ x: 1, y: 0, z: 0 }), gestureSign: -1, motionSign: 1, hinge: 'MIN_Z' }),
  [ASTERION_METAL_CONTROL_TUNING.glyphId]: Object.freeze({
    branchId: ASTERION_METAL_CONTROL_TUNING.branchId,
    dofs: ASTERION_METAL_CONTROL_TUNING.dofs,
    hinge: 'ORIGIN'
  })
});

function createDofState() {
  return { committedLevel: 0, currentAngleDegrees: 0, pendingSourceLevel: null, pendingLevel: null, pendingDirection: 0 };
}

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
  const sectorStates = new Map(Object.keys(SECTOR_DEFINITIONS).map((glyphId) => [glyphId,
    glyphId === ASTERION_METAL_CONTROL_TUNING.glyphId
      ? { dofs: { ANGLE: createDofState(), TILT: createDofState() } }
      : createDofState()]));
  const listeners = new Set();
  const driveActivityListeners = new Set();
  const neutralControllerQuaternion = new THREE.Quaternion();
  const controlFrameQuaternion = new THREE.Quaternion();
  const currentControllerQuaternion = new THREE.Quaternion();
  const relativeQuaternion = new THREE.Quaternion();
  const neutralRelativeQuaternion = new THREE.Quaternion();
  const deltaQuaternion = new THREE.Quaternion();
  const motionQuaternion = new THREE.Quaternion();
  const secondaryMotionQuaternion = new THREE.Quaternion();
  const axis = new THREE.Vector3();
  const pivot = new THREE.Vector3();
  const rotatedPivot = new THREE.Vector3();
  const motionPosition = new THREE.Vector3();
  let phase = VR_ASTERION_SECTOR_CONTROL_PHASES.IDLE;
  let movingGlyphId = null;
  let movingDof = null;
  let lockedGlyphId = null;
  let intent = null;
  let driveDirection = 0;
  let holdRemaining = 0;
  let controlWasAvailable = false;
  let neutralValid = false;
  let disposed = false;
  let driveActivityGlyphId = null;
  let driveActivityActive = false;

  const getLeftRecord = () => controllers.find(({ handedness, isConnected, grip }) => handedness === 'left' && isConnected && grip) ?? null;
  const getDofState = (glyphId, dof = null) => {
    const state = sectorStates.get(glyphId);
    return dof ? state?.dofs?.[dof] ?? null : state;
  };

  function setDriveActivity(glyphId, active) {
    const nextActive = Boolean(active && glyphId && SECTOR_DEFINITIONS[glyphId]);
    const nextGlyphId = nextActive ? glyphId : (driveActivityGlyphId ?? glyphId);
    if (driveActivityActive === nextActive && (!nextActive || driveActivityGlyphId === nextGlyphId)) return;
    driveActivityActive = nextActive;
    driveActivityGlyphId = nextActive ? nextGlyphId : null;
    if (!nextGlyphId || !SECTOR_DEFINITIONS[nextGlyphId]) return;
    const event = Object.freeze({ glyphId: nextGlyphId, branchId: SECTOR_DEFINITIONS[nextGlyphId].branchId, active: nextActive });
    [...driveActivityListeners].forEach((listener) => listener(event));
  }

  function applyMotion(glyphId) {
    const descriptor = SECTOR_DEFINITIONS[glyphId];
    const state = sectorStates.get(glyphId);
    if (!descriptor || !state) return false;
    motionPosition.set(0, 0, 0);
    if (descriptor.dofs) {
      const angle = descriptor.dofs.ANGLE;
      const tilt = descriptor.dofs.TILT;
      axis.set(angle.motionAxis.x, angle.motionAxis.y, angle.motionAxis.z);
      motionQuaternion.setFromAxisAngle(axis,
        THREE.MathUtils.degToRad(state.dofs.ANGLE.currentAngleDegrees * angle.motionSign));
      axis.set(tilt.motionAxis.x, tilt.motionAxis.y, tilt.motionAxis.z);
      secondaryMotionQuaternion.setFromAxisAngle(axis,
        THREE.MathUtils.degToRad(state.dofs.TILT.currentAngleDegrees * tilt.motionSign));
      motionQuaternion.multiply(secondaryMotionQuaternion).normalize();
      return progressFloor.setSectorMotion(glyphId, { position: IDENTITY_POSITION, quaternion: motionQuaternion });
    }
    axis.set(descriptor.motionAxis.x, descriptor.motionAxis.y, descriptor.motionAxis.z);
    motionQuaternion.setFromAxisAngle(axis,
      THREE.MathUtils.degToRad(state.currentAngleDegrees * descriptor.motionSign));
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
      intent = null;
      return;
    }
    controlFrameQuaternion.copy(frame.quaternion).normalize();
    leftRecord.grip.updateWorldMatrix(true, false);
    leftRecord.grip.getWorldQuaternion(neutralControllerQuaternion).normalize();
    neutralRelativeQuaternion.copy(controlFrameQuaternion).invert().multiply(neutralControllerQuaternion).normalize();
    neutralValid = true;
    intent = null;
  }

  function measureGestureDegrees(definition) {
    const component = deltaQuaternion.x * definition.gestureAxis.x
      + deltaQuaternion.y * definition.gestureAxis.y + deltaQuaternion.z * definition.gestureAxis.z;
    return THREE.MathUtils.clamp(
      2 * Math.atan2(component, Math.abs(deltaQuaternion.w)) * RAD_TO_DEG * definition.gestureSign,
      -config.gestureMaxDegrees, config.gestureMaxDegrees
    );
  }

  function readIntent(glyphId, leftRecord) {
    if (!neutralValid || !leftRecord?.grip) return null;
    leftRecord.grip.updateWorldMatrix(true, false);
    leftRecord.grip.getWorldQuaternion(currentControllerQuaternion).normalize();
    relativeQuaternion.copy(controlFrameQuaternion).invert().multiply(currentControllerQuaternion).normalize();
    deltaQuaternion.copy(neutralRelativeQuaternion).invert().multiply(relativeQuaternion).normalize();
    const descriptor = SECTOR_DEFINITIONS[glyphId];
    if (!descriptor.dofs) {
      const degrees = measureGestureDegrees(descriptor);
      return Math.abs(degrees) > config.gestureReleaseDegrees
        ? { direction: Math.sign(degrees), dof: null } : null;
    }
    const measurements = Object.entries(descriptor.dofs).map(([dof, definition]) => ({
      dof, degrees: measureGestureDegrees(definition)
    })).filter(({ degrees }) => Math.abs(degrees) > config.gestureReleaseDegrees)
      .sort((a, b) => Math.abs(b.degrees) - Math.abs(a.degrees));
    if (!measurements.length) return null;
    if (measurements[1]
      && Math.abs(measurements[0].degrees) - Math.abs(measurements[1].degrees)
        < ASTERION_METAL_CONTROL_TUNING.dominanceMarginDegrees) return null;
    return { direction: Math.sign(measurements[0].degrees), dof: measurements[0].dof };
  }

  function emitDetent(glyphId, dof, previousLevel, level, direction) {
    const event = {
      type: VR_ASTERION_SECTOR_CONTROL_EVENTS.DETENT_COMMITTED,
      glyphId,
      branchId: SECTOR_DEFINITIONS[glyphId].branchId,
      previousLevel,
      level,
      angleDegrees: DETENT_ANGLES_DEGREES[level],
      direction: direction > 0 ? 'UP' : 'DOWN'
    };
    if (dof) event.dof = dof;
    const frozenEvent = Object.freeze(event);
    [...listeners].forEach((listener) => listener(frozenEvent));
  }

  function clearPending(state) {
    state.pendingSourceLevel = null;
    state.pendingLevel = null;
    state.pendingDirection = 0;
  }

  function beginStep(glyphId, direction, dof) {
    const state = getDofState(glyphId, dof);
    const targetLevel = state.committedLevel + direction;
    if (targetLevel < 0 || targetLevel >= DETENT_ANGLES_DEGREES.length) {
      phase = VR_ASTERION_SECTOR_CONTROL_PHASES.IDLE;
      movingGlyphId = null;
      movingDof = null;
      driveDirection = 0;
      return false;
    }
    state.pendingSourceLevel = state.committedLevel;
    state.pendingLevel = targetLevel;
    state.pendingDirection = direction;
    movingGlyphId = glyphId;
    movingDof = dof;
    driveDirection = direction;
    phase = VR_ASTERION_SECTOR_CONTROL_PHASES.DRIVING;
    return true;
  }

  function advancePending(delta, activelyDriven, controlAvailable) {
    if (!movingGlyphId) return;
    const state = getDofState(movingGlyphId, movingDof);
    if (!state || state.pendingLevel === null) return;
    phase = activelyDriven ? VR_ASTERION_SECTOR_CONTROL_PHASES.DRIVING : VR_ASTERION_SECTOR_CONTROL_PHASES.SETTLING;
    const targetLevel = state.pendingLevel;
    const targetAngle = DETENT_ANGLES_DEGREES[targetLevel];
    state.currentAngleDegrees = clampStep(state.currentAngleDegrees, targetAngle, config.angularSpeedDegrees * delta);
    applyMotion(movingGlyphId);
    if (Math.abs(state.currentAngleDegrees - targetAngle) > EPSILON) return;
    const completedGlyphId = movingGlyphId;
    const completedDof = movingDof;
    const previousLevel = state.pendingSourceLevel;
    const direction = state.pendingDirection;
    state.currentAngleDegrees = targetAngle;
    state.committedLevel = targetLevel;
    clearPending(state);
    applyMotion(completedGlyphId);
    emitDetent(completedGlyphId, completedDof, previousLevel, targetLevel, direction);
    movingGlyphId = null;
    movingDof = null;
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
      && Boolean(SECTOR_DEFINITIONS[acquisitionGlyphId]);
    const leftRecord = getLeftRecord();
    if (!available) {
      setDriveActivity(movingGlyphId ?? lockedGlyphId, false);
      controlWasAvailable = false;
      neutralValid = false;
      intent = null;
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
      intent = null;
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
      const ownsStep = intent?.direction === driveDirection && intent?.dof === movingDof;
      setDriveActivity(movingGlyphId, ownsStep);
      advancePending(safeDelta, ownsStep, true);
      return;
    }
    if (phase === VR_ASTERION_SECTOR_CONTROL_PHASES.DETENT_HOLD) {
      setDriveActivity(lockedGlyphId, intent?.direction === driveDirection);
      holdRemaining = Math.max(0, holdRemaining - safeDelta);
      if (holdRemaining > 0) return;
      phase = VR_ASTERION_SECTOR_CONTROL_PHASES.IDLE;
      if (intent?.direction !== driveDirection) return;
    }
    if (!intent) {
      setDriveActivity(lockedGlyphId, false);
      phase = VR_ASTERION_SECTOR_CONTROL_PHASES.IDLE;
      return;
    }
    if (beginStep(lockedGlyphId, intent.direction, intent.dof)) {
      setDriveActivity(lockedGlyphId, true);
      advancePending(safeDelta, true, true);
    } else setDriveActivity(lockedGlyphId, false);
  }

  function reset() {
    if (disposed) return;
    setDriveActivity(movingGlyphId ?? lockedGlyphId, false);
    sectorStates.forEach((state, glyphId) => {
      const states = state.dofs ? Object.values(state.dofs) : [state];
      states.forEach((dofState) => {
        dofState.committedLevel = 0;
        dofState.currentAngleDegrees = 0;
        clearPending(dofState);
      });
      progressFloor.resetSectorMotion(glyphId);
    });
    phase = VR_ASTERION_SECTOR_CONTROL_PHASES.IDLE;
    movingGlyphId = null;
    movingDof = null;
    lockedGlyphId = null;
    intent = null;
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

  const metalState = sectorStates.get(ASTERION_METAL_CONTROL_TUNING.glyphId);
  return {
    update, reset, dispose,
    getSectorLevel: (glyphId) => sectorStates.get(glyphId)?.committedLevel ?? null,
    getSectorAngleDegrees: (glyphId) => sectorStates.get(glyphId)?.currentAngleDegrees ?? null,
    getMetalAngleLevel: () => metalState.dofs.ANGLE.committedLevel,
    getMetalTiltLevel: () => metalState.dofs.TILT.committedLevel,
    getSectorControlSnapshot: () => Object.freeze([...sectorStates].map(([glyphId, state]) => Object.freeze(
      state.dofs ? {
        glyphId, branchId: SECTOR_DEFINITIONS[glyphId].branchId,
        angleLevel: state.dofs.ANGLE.committedLevel,
        tiltLevel: state.dofs.TILT.committedLevel,
        angleDegrees: state.dofs.ANGLE.currentAngleDegrees,
        tiltDegrees: state.dofs.TILT.currentAngleDegrees
      } : {
        glyphId, branchId: SECTOR_DEFINITIONS[glyphId].branchId,
        committedLevel: state.committedLevel, currentAngleDegrees: state.currentAngleDegrees
      }
    ))),
    getMotionPhase: () => phase,
    getMovingGlyphId: () => movingGlyphId,
    isDriveActive: () => driveActivityActive,
    supportsGlyph: (glyphId) => Boolean(SECTOR_DEFINITIONS[glyphId]),
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
