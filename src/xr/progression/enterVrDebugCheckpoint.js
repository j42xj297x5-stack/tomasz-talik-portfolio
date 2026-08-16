import { prepareVrScenarioSession } from './prepareVrScenarioSession.js';
import { resolveVrDebugCheckpoint, VR_DEBUG_CHECKPOINT_SPAWN } from './vrDebugCheckpoints.js';

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
    const prepared = prepareSession({
      pointId: checkpoint.pointId, scenario, owners, restoreBaseline, synchronizeDerivedState
    });
    runtime.replaceDirector(prepared.director);
    if (checkpoint.spawn === VR_DEBUG_CHECKPOINT_SPAWN.INTRO) {
      spawnIntro();
      runtime.activateCurrentPoint();
      requestCanonicalXrStartCalibration();
    } else {
      spawnRing();
      runtime.activateCurrentPoint();
    }
    return Object.freeze({ ...prepared, checkpoint });
  };
}
