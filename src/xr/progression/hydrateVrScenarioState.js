const OWNER_SECTIONS = Object.freeze(['monkey', 'intro', 'locomotion', 'reliquary', 'portal', 'progression',
  'progressFloor', 'crystals', 'postRing', 'p2World', 'smallGlyphField', 'furnace', 'furnaceProgression', 'astroProduction',
  'asterionProduction', 'protoAstroTuning', 'audio']);

// Canonical baseline restoration is an explicit precondition. This seam only
// delegates owner-scoped facts; it never creates owners or emits story events.
export function hydrateVrScenarioState(state, owners) {
  if (!state || typeof state !== 'object') throw new TypeError('state is required');
  if (!owners || typeof owners !== 'object') throw new TypeError('owners are required');
  for (const section of OWNER_SECTIONS) {
    if (!Object.prototype.hasOwnProperty.call(state, section)) continue;
    const owner = owners[section];
    if (!owner || typeof owner.hydrateScenarioState !== 'function') {
      throw new TypeError(`${section} owner must implement hydrateScenarioState`);
    }
    owner.hydrateScenarioState(state[section]);
  }
}
