import { deriveScenarioSpine } from './scenarioSpineNavigation.js';
import {
  VR_LARGE_GLYPH_ELEVATED_STAGE,
  VR_LARGE_GLYPH_EXPANDED_STAGE,
  VR_LARGE_GLYPH_INITIAL_STAGE
} from '../glyphs/createVrLargeGlyphActor.js';

const ASTRO_ACQUISITION_POINTS = Object.freeze(['3.50', '3.60', '3.70']);
const PRESERVED_RING_1_POINTS = new Set(['2.40', '3.10', '3.20', '3.30', '3.40']);
const PRESERVED_RING_2_POINTS = new Set(['4.20', '4.30', '4.40', '4.50', '4.60']);

export function createVrScenarioProgressReconciler({
  scenario,
  runtimeExperience,
  progressionController,
  progressFloor,
  pages,
  astroAttractorProductionController,
  asterionProductionController,
  asterionResonatorFieldActor,
  largeGlyphActor,
  postRingPresentation,
  reliquaryHints,
  progressionSemanticHandoff
}) {
  const spine = deriveScenarioSpine(scenario);
  const spineIndex = new Map(spine.map((pointId, index) => [pointId, index]));
  const pageById = new Map(pages.map((page) => [page.id, page]));
  const warnedInconsistencies = new Set();
  let suspended = false;
  let disposed = false;
  let running = false;
  let requested = false;

  const indexOf = (pointId) => {
    const index = spineIndex.get(pointId);
    if (index === undefined) throw new Error(`Scenario reconciliation references non-spine point "${pointId}"`);
    return index;
  };
  const isBefore = (pointId, target) => indexOf(pointId) < indexOf(target);

  function synchronizeProgressFloor() {
    const existing = new Set(progressFloor.getActivatedEntries()
      .map(({ glyphId, order }) => `${glyphId}:${order}`));
    for (const pageId of progressionController.getActivatedPageIds()) {
      const page = pageById.get(pageId);
      if (!page) throw new Error(`Scenario reconciliation cannot resolve activated page "${pageId}"`);
      if (!(page.order <= 3)) continue;
      const key = `${page.glyphId}:${page.order}`;
      if (existing.has(key)) continue;
      if (progressFloor.activatePage(page) !== true) {
        throw new Error(`Scenario reconciliation could not present activated page "${pageId}"`);
      }
      existing.add(key);
    }
  }

  function warnStage(pointId, expected, actual) {
    const key = `${pointId}:${expected}:${actual}`;
    if (warnedInconsistencies.has(key)) return;
    warnedInconsistencies.add(key);
    console.warn(`[VrScenarioProgressReconciler] Cannot enter ${pointId}: Large Glyph stage is ${actual}, expected ${expected}.`);
  }

  function catchUp(targetPointId, includeDestinationEntryEffects) {
    return runtimeExperience.catchUpToPoint(targetPointId, { includeDestinationEntryEffects }) !== null;
  }

  function reconcilePass() {
    const pointId = runtimeExperience.getCurrentPointId();
    const pointIndex = indexOf(pointId);
    if (pointIndex < indexOf('2.30') || pointIndex > indexOf('5.10')) return false;

    synchronizeProgressFloor();
    const currentTier = progressionController.getCurrentTier();
    const glyph = largeGlyphActor.getTransitionState();

    if (currentTier >= 2 && isBefore(pointId, '2.40')) {
      reliquaryHints.reset();
      return catchUp('2.40', true);
    }
    if (PRESERVED_RING_1_POINTS.has(pointId)) {
      if (pointId === '3.10' && glyph.stage === VR_LARGE_GLYPH_INITIAL_STAGE
        && glyph.transition === null && glyph.transientActive === false) {
        postRingPresentation.elevateMainGlyphs();
      }
      return false;
    }

    if (ASTRO_ACQUISITION_POINTS.includes(pointId)) {
      const astroState = astroAttractorProductionController.getSnapshot().state;
      if (astroState === 'BUILDING' && pointId === '3.50') return catchUp('3.60', false);
      if ((astroState === 'AVAILABLE' || astroState === 'CLAIMING') && isBefore(pointId, '3.70')) {
        return catchUp('3.70', false);
      }
      if (astroState === 'EARNED') return catchUp('4.10', true);
      return false;
    }

    if (pointId === '4.10' && currentTier >= 3) {
      if (glyph.transition !== null || glyph.transientActive) return false;
      if (glyph.stage !== VR_LARGE_GLYPH_ELEVATED_STAGE) {
        warnStage('4.20', VR_LARGE_GLYPH_ELEVATED_STAGE, glyph.stage);
        return false;
      }
      reliquaryHints.reset();
      return catchUp('4.20', true);
    }
    if (PRESERVED_RING_2_POINTS.has(pointId)) {
      if (pointId === '4.20' && glyph.stage === VR_LARGE_GLYPH_ELEVATED_STAGE
        && glyph.transition === null && glyph.transientActive === false) {
        largeGlyphActor.beginExpansion();
      }
      return false;
    }

    if (pointId === '4.70' && currentTier >= 4) {
      if (glyph.transition !== null || glyph.transientActive) return false;
      if (glyph.stage !== VR_LARGE_GLYPH_EXPANDED_STAGE) {
        warnStage('4.75', VR_LARGE_GLYPH_EXPANDED_STAGE, glyph.stage);
        return false;
      }
      reliquaryHints.reset();
      return catchUp('4.75', true);
    }
    if (pointId === '4.75') {
      if (glyph.stage === VR_LARGE_GLYPH_EXPANDED_STAGE
        && glyph.transition === null && glyph.transientActive === false) {
        largeGlyphActor.beginSphereDistribution();
      }
      return false;
    }
    if (pointId === '3.80') {
      if (asterionProductionController.getSnapshot().state === 'EARNED') return catchUp('4.80', true);
      return false;
    }
    if (pointId === '4.80') {
      const descriptor = asterionResonatorFieldActor.getDescriptor();
      if (descriptor.resonatorExists === true) progressionSemanticHandoff.onResonatorStateChanged(descriptor);
    }
    return false;
  }

  function request() {
    if (disposed || suspended) return;
    requested = true;
    if (running) return;
    running = true;
    try {
      while (requested && !disposed && !suspended) {
        requested = false;
        if (reconcilePass()) requested = true;
      }
    } finally {
      running = false;
    }
  }

  return Object.freeze({
    request,
    suspend() { if (!disposed) { suspended = true; requested = false; } },
    resume() { if (!disposed) { suspended = false; requested = false; } },
    dispose() { disposed = true; suspended = true; requested = false; warnedInconsistencies.clear(); }
  });
}
