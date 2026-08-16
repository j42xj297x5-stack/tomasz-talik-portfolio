import { createVrExperienceDirector } from './createVrExperienceDirector.js';
import { hydrateVrScenarioState } from './hydrateVrScenarioState.js';
import { reconstructVrScenarioState } from './reconstructVrScenarioState.js';

export function prepareVrScenarioSession({ pointId, scenario, owners, restoreBaseline,
  synchronizeDerivedState,
  reconstruct = reconstructVrScenarioState, hydrate = hydrateVrScenarioState,
  createDirector = createVrExperienceDirector }) {
  if (typeof restoreBaseline !== 'function') throw new TypeError('restoreBaseline is required');
  if (synchronizeDerivedState !== undefined && typeof synchronizeDerivedState !== 'function') {
    throw new TypeError('synchronizeDerivedState must be a function');
  }
  restoreBaseline();
  const state = reconstruct(scenario, pointId);
  hydrate(state, owners);
  synchronizeDerivedState?.();
  const director = createDirector({ scenario, startPointId: pointId });
  return Object.freeze({ director, state });
}
