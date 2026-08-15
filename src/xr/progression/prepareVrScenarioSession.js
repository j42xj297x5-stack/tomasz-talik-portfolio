import { createVrExperienceDirector } from './createVrExperienceDirector.js';
import { hydrateVrScenarioState } from './hydrateVrScenarioState.js';
import { reconstructVrScenarioState } from './reconstructVrScenarioState.js';

export function prepareVrScenarioSession({ pointId, scenario, owners, restoreBaseline,
  reconstruct = reconstructVrScenarioState, hydrate = hydrateVrScenarioState,
  createDirector = createVrExperienceDirector }) {
  if (typeof restoreBaseline !== 'function') throw new TypeError('restoreBaseline is required');
  restoreBaseline();
  const state = reconstruct(scenario, pointId);
  hydrate(state, owners);
  const director = createDirector({ scenario, startPointId: pointId });
  return Object.freeze({ director, state });
}
