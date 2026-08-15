import { prepareVrScenarioSession } from './prepareVrScenarioSession.js';
import { resolveVrDebugCheckpoint, VR_DEBUG_CHECKPOINT_SPAWN } from './vrDebugCheckpoints.js';

export function createVrDebugCheckpointController({ scenario, owners, restoreBaseline, runtime,
  spawnIntro, spawnRing, startCanonicalIntro, prepareSession = prepareVrScenarioSession }) {
  if (!runtime || typeof runtime.replaceDirector !== 'function') throw new TypeError('runtime.replaceDirector is required');
  return function enterVrDebugCheckpoint(checkpointId) {
    const checkpoint = resolveVrDebugCheckpoint(checkpointId);
    const prepared = prepareSession({ pointId: checkpoint.pointId, scenario, owners, restoreBaseline });
    runtime.replaceDirector(prepared.director);
    if (checkpoint.spawn === VR_DEBUG_CHECKPOINT_SPAWN.INTRO) {
      spawnIntro();
      startCanonicalIntro();
    } else {
      spawnRing();
    }
    return Object.freeze({ ...prepared, checkpoint });
  };
}
