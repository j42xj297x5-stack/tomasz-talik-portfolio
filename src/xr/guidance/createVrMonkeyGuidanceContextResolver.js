import { VR_SCENARIO_CAPABILITY } from '../progression/vrExperienceScenario.js';

export const NONE = 'NONE';
export const ASTERION_SHELL_COLLECTION = 'ASTERION_SHELL_COLLECTION';
export const P2_ASTRO_TUNING = 'P2_ASTRO_TUNING';

export function createVrMonkeyGuidanceContextResolver({ can, getAsterionProductionState,
  getExtractedFamilyCodes }) {
  if (typeof can !== 'function' || typeof getAsterionProductionState !== 'function'
    || typeof getExtractedFamilyCodes !== 'function') {
    throw new TypeError('Monkey guidance context resolver dependencies must be functions.');
  }

  function getCurrentContextId() {
    if (can(VR_SCENARIO_CAPABILITY.CAN_EQUIP_ASTRO) === true
      && getAsterionProductionState() === 'LOCKED') return ASTERION_SHELL_COLLECTION;
    if (can(VR_SCENARIO_CAPABILITY.CAN_SWITCH_ASTRO_BAND) === true
      && can(VR_SCENARIO_CAPABILITY.CAN_EXTRACT_SMALL_GLYPH_ESSENCE) === true
      && getExtractedFamilyCodes().length === 0) return P2_ASTRO_TUNING;
    return NONE;
  }

  return Object.freeze({ getCurrentContextId });
}
