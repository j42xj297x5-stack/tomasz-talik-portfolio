import { VR_SCENARIO_EVENT } from './vrExperienceScenario.js';

export function createVrProgressionSemanticHandoff({ dispatch }) {
  if (typeof dispatch !== 'function') {
    throw new TypeError('Progression semantic handoff requires dispatch.');
  }

  function onPageCommitted(page, { tierCompleted }) {
    dispatch(VR_SCENARIO_EVENT.CARD_COMMITTED, { page });
    if (tierCompleted !== true) return;

    if (page.order === 1) {
      dispatch(VR_SCENARIO_EVENT.FIRST_RING_COMPLETED, { page });
    } else if (page.order > 1) {
      dispatch(VR_SCENARIO_EVENT.TIER_COMPLETED, { tier: page.order });
    }
  }

  return { onPageCommitted };
}
