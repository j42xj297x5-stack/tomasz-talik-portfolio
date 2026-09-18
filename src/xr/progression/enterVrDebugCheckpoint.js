import { prepareVrScenarioSession } from './prepareVrScenarioSession.js';
import { reconstructVrScenarioState } from './reconstructVrScenarioState.js';
import { resolveVrDebugCheckpoint, VR_DEBUG_CHECKPOINT_SPAWN } from './vrDebugCheckpoints.js';

function prepareDebugCheckpointSession({ checkpoint, scenario, owners, restoreBaseline,
  synchronizeDerivedState, prepareSession }) {
  const reconstructionPointId = checkpoint.reconstructionPointId ?? checkpoint.pointId;
  const reconstructionOverlay = checkpoint.reconstructionOverlay;
  const reconstruct = reconstructionOverlay || reconstructionPointId !== checkpoint.pointId
    ? (canonicalScenario) => {
      const canonicalState = reconstructVrScenarioState(canonicalScenario, reconstructionPointId);
      return Object.freeze({ ...canonicalState, ...reconstructionOverlay });
    }
    : undefined;

  return prepareSession({
    pointId: checkpoint.pointId,
    scenario,
    owners,
    restoreBaseline,
    synchronizeDerivedState,
    ...(reconstruct && { reconstruct })
  });
}

export function createVrDebugCheckpointController({ scenario, owners, restoreBaseline, runtime,
  spawnIntro, spawnRing, requestCanonicalXrStartCalibration, synchronizeDerivedState,
  prepareSession = prepareVrScenarioSession }) {
  if (!runtime || typeof runtime.replaceDirector !== 'function') throw new TypeError('runtime.replaceDirector is required');
  if (typeof runtime.activateCurrentPoint !== 'function') throw new TypeError('runtime.activateCurrentPoint is required');
  if (typeof requestCanonicalXrStartCalibration !== 'function') {
    throw new TypeError('requestCanonicalXrStartCalibration is required');
  }
  return function enterVrDebugCheckpoint(checkpointId) {
    const checkpoint = resolveVrDebugCheckpoint(checkpointId);
    const requiresDebugReconstruction = Boolean(checkpoint.reconstructionOverlay
      || (checkpoint.reconstructionPointId && checkpoint.reconstructionPointId !== checkpoint.pointId));
    const prepared = typeof runtime.activatePoint === 'function' && !requiresDebugReconstruction
      ? runtime.activatePoint(checkpoint.pointId)
      : prepareDebugCheckpointSession({ checkpoint, scenario, owners, restoreBaseline,
        synchronizeDerivedState, prepareSession });
    if (typeof runtime.activatePoint !== 'function' || requiresDebugReconstruction) {
      runtime.replaceDirector(prepared.director);
    }
    if (checkpoint.spawn === VR_DEBUG_CHECKPOINT_SPAWN.INTRO) {
      spawnIntro();
      if (typeof runtime.activatePoint !== 'function' || requiresDebugReconstruction) runtime.activateCurrentPoint();
      requestCanonicalXrStartCalibration();
    } else {
      spawnRing();
      if (typeof runtime.activatePoint !== 'function' || requiresDebugReconstruction) runtime.activateCurrentPoint();
    }
    return Object.freeze({ ...prepared, checkpoint });
  };
}
