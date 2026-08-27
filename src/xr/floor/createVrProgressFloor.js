import {
  createVrProgressFloorActor,
  VR_PROGRESS_FLOOR_EMISSION,
  VR_PROGRESS_FLOOR_RINGS,
  VR_PROGRESS_FLOOR_SOURCE_CONTRACTS
} from './createVrProgressFloorActor.js';

export { VR_PROGRESS_FLOOR_EMISSION, VR_PROGRESS_FLOOR_RINGS, VR_PROGRESS_FLOOR_SOURCE_CONTRACTS };

const PANEL_COUNT_BY_GLYPH_ID = new Map([
  ['spotify-digger', VR_PROGRESS_FLOOR_SOURCE_CONTRACTS.metal.panelNames.length],
  ['haiku-cosmos', VR_PROGRESS_FLOOR_SOURCE_CONTRACTS.water.panelNames.length],
  ['ai-guide', VR_PROGRESS_FLOOR_SOURCE_CONTRACTS.wood.panelNames.length],
  ['creative-ai', VR_PROGRESS_FLOOR_SOURCE_CONTRACTS.creative.panelNames.length],
  ['ethics-life-protection', VR_PROGRESS_FLOOR_SOURCE_CONTRACTS.ethics.panelNames.length]
]);

export function createVrProgressFloor({
  parent, creativeSectorModel, ethicsSectorModel, haikuSectorModel, digSectorModel, aiGuideSectorModel,
  emission = {}, rings = {}
}) {
  const actor = createVrProgressFloorActor({
    parent, emission, rings,
    sourceModels: { creative: creativeSectorModel, ethics: ethicsSectorModel, water: haikuSectorModel, metal: digSectorModel, wood: aiGuideSectorModel }
  });
  const activatedEntries = new Map();
  const completedTiers = new Set();
  let disposed = false;

  function activatePage(page) {
    const glyphId = page?.glyphId;
    const order = page?.order;
    const key = `${glyphId}:${order}`;
    const panelCount = PANEL_COUNT_BY_GLYPH_ID.get(glyphId);
    if (disposed || !Number.isInteger(order) || order < 1 || order > panelCount || activatedEntries.has(key)) return false;
    const isFirstActivatedPage = ![...activatedEntries.values()].some((entry) => entry.glyphId === glyphId);
    if (isFirstActivatedPage && !actor.revealSector(glyphId)) return false;
    if (!actor.activatePanel(glyphId, order)) return false;
    activatedEntries.set(key, { glyphId, order });
    return true;
  }
  function completeTier(tier) {
    if (disposed || !Number.isInteger(tier) || tier < 1 || tier > 5 || completedTiers.has(tier)) return false;
    if (!actor.completeTier(tier)) return false;
    completedTiers.add(tier); return true;
  }
  function hydrateScenarioState(state) {
    if (!Array.isArray(state?.activatedPages) || !Number.isInteger(state.completedTier) || state.completedTier < 1 || state.completedTier > 5) {
      throw new Error('Progress floor requires a canonical completed tier from 1 through 5');
    }
    const hydratedEntries = new Set();
    state.activatedPages.forEach((page) => {
      const key = `${page?.glyphId}:${page?.order}`;
      if (!Number.isInteger(page?.order) || page.order < 1 || page.order > 5 || page.order > state.completedTier || hydratedEntries.has(key)) {
        throw new Error(`Progress floor received invalid activated page ${key}`);
      }
      hydratedEntries.add(key);
      if (!activatePage(page)) throw new Error(`Progress floor could not hydrate activated page ${key}`);
    });
    for (let tier = 1; tier <= state.completedTier; tier += 1) if (!completeTier(tier)) throw new Error(`Progress floor could not hydrate completed Tier ${tier}`);
    actor.update(10);
  }
  function reset() { if (disposed) return; activatedEntries.clear(); completedTiers.clear(); actor.reset(); }
  function dispose() { if (disposed) return; disposed = true; activatedEntries.clear(); completedTiers.clear(); actor.dispose(); }

  return {
    object: actor.object, geometryRoot: actor.geometryRoot, activatePage, completeTier, hydrateScenarioState, reset,
    update: (delta) => actor.update(delta),
    setSectorMotion: (glyphId, transform) => !disposed && actor.setSectorMotion(glyphId, transform),
    getSectorMotionTransform: (glyphId) => disposed ? null : actor.getSectorMotionTransform(glyphId),
    getSectorControlFrame: (glyphId) => disposed ? null : actor.getSectorControlFrame(glyphId),
    resetSectorMotion: (glyphId) => !disposed && actor.resetSectorMotion(glyphId),
    getActivatedEntries: () => [...activatedEntries.values()].map(({ glyphId, order }) => ({ glyphId, order })),
    getRevealedSectorIds: () => [...new Set([...activatedEntries.values()].map(({ glyphId }) => glyphId))],
    getCompletedTiers: () => [...completedTiers],
    getRuneInstallationFrame: (branchId) => actor.getRuneInstallationFrame(branchId),
    getSectorEnergyVfxMount: (branchId) => actor.getSectorEnergyVfxMount(branchId),
    getSectorEnergyVfxBounds: (branchId) => actor.getSectorEnergyVfxBounds(branchId), dispose
  };
}
