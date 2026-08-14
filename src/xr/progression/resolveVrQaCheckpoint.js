import { VR_EXPERIENCE_POINT, VR_SCENARIO_MILESTONE } from './vrExperienceScenario.js';

export const VR_QA_CHECKPOINT = Object.freeze({ NORMAL: 'NORMAL', P0: 'P0' });

export function resolveVrQaCheckpoint(search = '') {
  const params = new URLSearchParams(search);
  if (params.has('p0')) return VR_QA_CHECKPOINT.P0;
  return VR_QA_CHECKPOINT.NORMAL;
}

export function getVrQaCheckpointHydration(checkpoint) {
  if (checkpoint !== VR_QA_CHECKPOINT.P0) return Object.freeze({
    checkpoint: VR_QA_CHECKPOINT.NORMAL, skipIntro: false, initialPointId: undefined,
    initialMilestones: Object.freeze([])
  });
  return Object.freeze({
    checkpoint, skipIntro: true, initialPointId: VR_EXPERIENCE_POINT['2.10'],
    initialMilestones: Object.freeze([
      VR_SCENARIO_MILESTONE.PLAYER_ENTERED_RING,
      VR_SCENARIO_MILESTONE.MONKEY_SETTLED
    ])
  });
}

export function getVrQaPlayerRadius(checkpoint, { ringRadius, insideSafeMargin }) {
  if (checkpoint !== VR_QA_CHECKPOINT.P0) return null;
  return Math.max(0, ringRadius - insideSafeMargin);
}
