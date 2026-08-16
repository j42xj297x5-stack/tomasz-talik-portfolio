import { prepareVrScenarioSession } from './prepareVrScenarioSession.js';
import { resolveVrDebugCheckpoint, VR_DEBUG_CHECKPOINT_SPAWN } from './vrDebugCheckpoints.js';

export function createVrDebugCheckpointController({ scenario, owners, restoreBaseline, runtime,
  spawnIntro, spawnRing, startCanonicalIntro, synchronizeDerivedState,
  prepareSession = prepareVrScenarioSession }) {
  if (!runtime || typeof runtime.replaceDirector !== 'function') throw new TypeError('runtime.replaceDirector is required');
  if (typeof runtime.activateCurrentPoint !== 'function') throw new TypeError('runtime.activateCurrentPoint is required');
  return function enterVrDebugCheckpoint(checkpointId) {
    const checkpoint = resolveVrDebugCheckpoint(checkpointId);
    const prepared = prepareSession({
      pointId: checkpoint.pointId, scenario, owners, restoreBaseline, synchronizeDerivedState
    });
    runtime.replaceDirector(prepared.director);
    if (checkpoint.spawn === VR_DEBUG_CHECKPOINT_SPAWN.INTRO) {
      spawnIntro();
      runtime.activateCurrentPoint();
      startCanonicalIntro();
    } else {
      spawnRing();
      runtime.activateCurrentPoint();
    }
    return Object.freeze({ ...prepared, checkpoint });
  };
}
