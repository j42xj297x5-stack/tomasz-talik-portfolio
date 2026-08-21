import { VR_EXPERIENCE_SCENARIO_SPINE } from './vrExperienceScenario.js';

export const VR_DEBUG_CHECKPOINT_SPAWN = Object.freeze({ INTRO: 'INTRO', RING: 'RING' });

export const VR_DEBUG_CHECKPOINTS = Object.freeze([
  Object.freeze({ id: 'P1', pointId: '2.10', label: 'P1', spawn: VR_DEBUG_CHECKPOINT_SPAWN.RING }),
  Object.freeze({ id: 'P2', pointId: '3.10', label: 'P2', spawn: VR_DEBUG_CHECKPOINT_SPAWN.RING }),
  Object.freeze({ id: 'P3', pointId: '4.10', label: 'P3', spawn: VR_DEBUG_CHECKPOINT_SPAWN.RING }),
  Object.freeze({ id: 'P4', pointId: '4.30', label: 'P4', spawn: VR_DEBUG_CHECKPOINT_SPAWN.RING }),
  Object.freeze({ id: 'P5', pointId: '4.40', label: 'P5', spawn: VR_DEBUG_CHECKPOINT_SPAWN.RING })
]);

const CHECKPOINTS_BY_ID = new Map(VR_DEBUG_CHECKPOINTS.map((checkpoint) => [checkpoint.id, checkpoint]));
for (const checkpoint of VR_DEBUG_CHECKPOINTS) {
  if (!VR_EXPERIENCE_SCENARIO_SPINE.includes(checkpoint.pointId)) {
    throw new Error(`Debug checkpoint ${checkpoint.id} targets a point outside the canonical Spine`);
  }
}

export function resolveVrDebugCheckpoint(checkpointId) {
  const checkpoint = CHECKPOINTS_BY_ID.get(checkpointId);
  if (!checkpoint) throw new Error(`Unknown VR debug checkpoint: ${String(checkpointId)}`);
  return checkpoint;
}
