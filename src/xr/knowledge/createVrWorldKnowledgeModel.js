import { VR_RUNE_BRIDGE_BRANCH_IDS, VR_RUNE_BRIDGE_STATES } from '../runes/createVrRuneBridgeActor.js';

export const VR_WORLD_KNOWLEDGE_STAGE_STATE = Object.freeze({
  LOCKED: 'LOCKED',
  AVAILABLE: 'AVAILABLE',
  READ: 'READ'
});

const CATEGORY_SPECS = Object.freeze([
  ['world.five_transformations', 3], ['world.proto_astro', 3], ['world.shells', 3],
  ['world.small_glyphs', 3], ['world.large_glyphs', 4], ['world.crystals', 3],
  ['tools.portal_reliquary', 3], ['tools.furnace', 3], ['tools.bond_astrolabe', 3],
  ['world.rune_stones', 4], ['platform.sectors', 2], ['platform.keystone', 2],
  ['tools.asterion_sphere', 2], ['tools.asterion_resonator', 4], ['world.ether', 3]
]);

export const VR_WORLD_KNOWLEDGE_CATEGORIES = Object.freeze(CATEGORY_SPECS.map(([id, stageCount], index) =>
  Object.freeze({
    id,
    order: index + 1,
    stageIds: Object.freeze(Array.from({ length: stageCount }, (_, stageIndex) =>
      `${String(index + 1).padStart(2, '0')}.${stageIndex + 1}`))
  })));

export const VR_WORLD_KNOWLEDGE_STAGES = Object.freeze(VR_WORLD_KNOWLEDGE_CATEGORIES.flatMap((category) =>
  category.stageIds.map((id, index) => Object.freeze({ id, categoryId: category.id, order: index + 1 }))));

const POST_ARRIVAL_BRIDGE_STATES = new Set([
  VR_RUNE_BRIDGE_STATES.DOCKED,
  VR_RUNE_BRIDGE_STATES.EXTENDING,
  VR_RUNE_BRIDGE_STATES.EXTENDED,
  VR_RUNE_BRIDGE_STATES.BOUND
]);

const freezeList = (values) => Object.freeze([...values]);

export function createVrWorldKnowledgeModel({
  progressionController,
  furnaceProgressionController,
  protoAstroTuningController,
  astroAttractorProductionController,
  asterionProductionController,
  runeStoneProgressionController,
  runeBridgeActor,
  asterionResonatorFieldActor,
  pages
}) {
  const categoriesById = new Map(VR_WORLD_KNOWLEDGE_CATEGORIES.map((category) => [category.id, category]));
  const stagesById = new Map(VR_WORLD_KNOWLEDGE_STAGES.map((stage) => [stage.id, stage]));
  const pageById = new Map(pages.map((page) => [page.id, page]));
  const states = new Map(VR_WORLD_KNOWLEDGE_STAGES.map(({ id }) => [id, VR_WORLD_KNOWLEDGE_STAGE_STATE.LOCKED]));
  const listeners = new Set();
  let fullActiveCoreObserved = false;
  let disposed = false;

  const tierComplete = (tier) => progressionController.isTierComplete(tier) === true;
  const absorbedShellCount = () => furnaceProgressionController.getAbsorbedShellIds().length;
  const sphereMaterialsComplete = () => furnaceProgressionController.getAsterionSphereProgress().complete === true;
  const extractedFamilyCount = () => protoAstroTuningController.getExtractedFamilyCodes().length;
  const committedTierOneCount = () => progressionController.getActivatedPageIds()
    .reduce((count, id) => count + Number(pageById.get(id)?.order === 1), 0);
  const totalTunedRuneCount = () => runeStoneProgressionController.getTunedFamilyCodes().length
    + Number(runeStoneProgressionController.isEtherRuneTuned());
  const establishedBridgeCount = () => VR_RUNE_BRIDGE_BRANCH_IDS
    .reduce((count, branchId) => count + Number(POST_ARRIVAL_BRIDGE_STATES.has(runeBridgeActor.getState(branchId))), 0);
  const etherIntegrated = () => runeStoneProgressionController.hasWaterInstallationReadinessOverride() === true;

  const predicates = new Map([
    ['01.1', () => tierComplete(1)], ['01.2', () => tierComplete(2)], ['01.3', () => tierComplete(3)],
    ['02.1', () => tierComplete(1)], ['02.2', () => tierComplete(2)], ['02.3', () => tierComplete(4)],
    ['03.1', () => absorbedShellCount() >= 2], ['03.2', () => absorbedShellCount() >= 4], ['03.3', sphereMaterialsComplete],
    ['04.1', () => extractedFamilyCount() >= 2], ['04.2', () => extractedFamilyCount() >= 4], ['04.3', () => extractedFamilyCount() >= 5],
    ['05.1', () => tierComplete(2)], ['05.2', () => tierComplete(2)], ['05.3', () => tierComplete(3)], ['05.4', () => tierComplete(4)],
    ['06.1', () => committedTierOneCount() >= 1], ['06.2', () => committedTierOneCount() >= 3], ['06.3', () => committedTierOneCount() >= 5],
    ['07.1', () => committedTierOneCount() >= 2], ['07.2', () => committedTierOneCount() >= 4], ['07.3', () => committedTierOneCount() >= 5],
    ['08.1', () => astroAttractorProductionController.isEarned() === true],
    ['08.2', () => asterionProductionController.getState() === 'EARNED'], ['08.3', () => extractedFamilyCount() >= 1],
    ['09.1', () => astroAttractorProductionController.isEarned() === true], ['09.2', sphereMaterialsComplete], ['09.3', () => tierComplete(2)],
    ['10.1', () => totalTunedRuneCount() >= 1], ['10.2', () => totalTunedRuneCount() >= 3],
    ['10.3', () => totalTunedRuneCount() >= 5], ['10.4', () => totalTunedRuneCount() >= 6],
    ['11.1', () => tierComplete(2)], ['11.2', () => tierComplete(3)],
    ['12.1', () => establishedBridgeCount() >= 1], ['12.2', () => establishedBridgeCount() >= 3],
    ['13.1', () => asterionProductionController.getState() === 'EARNED'], ['13.2', () => fullActiveCoreObserved],
    ['14.1', () => fullActiveCoreObserved], ['14.2', () => tierComplete(4)], ['14.3', etherIntegrated],
    ['14.4', () => runeStoneProgressionController.isFamilyInstalled('S') === true],
    ['15.1', () => furnaceProgressionController.hasAbsorbedShell('shell-relic-6') === true],
    ['15.2', () => runeStoneProgressionController.isEtherRuneTuned() === true], ['15.3', etherIntegrated]
  ]);

  function getSnapshot() {
    return Object.freeze({
      availableStageIds: freezeList(VR_WORLD_KNOWLEDGE_STAGES
        .filter(({ id }) => states.get(id) !== VR_WORLD_KNOWLEDGE_STAGE_STATE.LOCKED).map(({ id }) => id)),
      readStageIds: freezeList(VR_WORLD_KNOWLEDGE_STAGES
        .filter(({ id }) => states.get(id) === VR_WORLD_KNOWLEDGE_STAGE_STATE.READ).map(({ id }) => id)),
      fullActiveCoreObserved
    });
  }

  function emit() {
    const snapshot = getSnapshot();
    [...listeners].forEach((listener) => listener(snapshot));
  }

  function synchronize({ notify = true } = {}) {
    if (disposed) return getSnapshot();
    let changed = false;
    if (!fullActiveCoreObserved && asterionResonatorFieldActor.getDescriptor().fullActiveCore === true) {
      fullActiveCoreObserved = true;
      changed = true;
    }
    for (const { id } of VR_WORLD_KNOWLEDGE_STAGES) {
      if (states.get(id) === VR_WORLD_KNOWLEDGE_STAGE_STATE.LOCKED && predicates.get(id)()) {
        states.set(id, VR_WORLD_KNOWLEDGE_STAGE_STATE.AVAILABLE);
        changed = true;
      }
    }
    if (changed && notify) emit();
    return getSnapshot();
  }

  const subscriptions = [furnaceProgressionController, protoAstroTuningController,
    astroAttractorProductionController, asterionProductionController, runeStoneProgressionController,
    runeBridgeActor, asterionResonatorFieldActor]
    .map((owner) => owner.subscribe(() => synchronize()));

  function requireStage(stageId) {
    if (!stagesById.has(stageId)) throw new Error(`Unknown World Knowledge stage: ${stageId}`);
    return stagesById.get(stageId);
  }

  function getStagesForCategory(categoryId) {
    const category = categoriesById.get(categoryId);
    if (!category) return Object.freeze([]);
    return freezeList(category.stageIds.map((id) => stagesById.get(id)));
  }

  function markStageRead(stageId) {
    requireStage(stageId);
    const state = states.get(stageId);
    if (state === VR_WORLD_KNOWLEDGE_STAGE_STATE.LOCKED) return false;
    if (state === VR_WORLD_KNOWLEDGE_STAGE_STATE.READ) return true;
    states.set(stageId, VR_WORLD_KNOWLEDGE_STAGE_STATE.READ);
    emit();
    return true;
  }

  function resetBaseline() {
    let changed = fullActiveCoreObserved;
    fullActiveCoreObserved = false;
    states.forEach((state, id) => {
      if (state !== VR_WORLD_KNOWLEDGE_STAGE_STATE.LOCKED) changed = true;
      states.set(id, VR_WORLD_KNOWLEDGE_STAGE_STATE.LOCKED);
    });
    if (changed) emit();
  }

  function hydrateKnowledgeState(value) {
    if (!value || !Array.isArray(value.availableStageIds) || !Array.isArray(value.readStageIds)
      || typeof value.fullActiveCoreObserved !== 'boolean') {
      throw new TypeError('World Knowledge hydration requires availableStageIds, readStageIds and fullActiveCoreObserved');
    }
    const previousSignature = JSON.stringify(getSnapshot());
    const availableIds = new Set(value.availableStageIds);
    const readIds = new Set(value.readStageIds);
    [...availableIds, ...readIds].forEach(requireStage);
    if ([...readIds].some((id) => !availableIds.has(id))) throw new Error('READ World Knowledge stages must also be available');
    states.forEach((_state, id) => states.set(id, readIds.has(id) ? VR_WORLD_KNOWLEDGE_STAGE_STATE.READ
      : availableIds.has(id) ? VR_WORLD_KNOWLEDGE_STAGE_STATE.AVAILABLE : VR_WORLD_KNOWLEDGE_STAGE_STATE.LOCKED));
    fullActiveCoreObserved = value.fullActiveCoreObserved;
    synchronize({ notify: false });
    if (JSON.stringify(getSnapshot()) !== previousSignature) emit();
  }

  synchronize();

  return Object.freeze({
    getCategories: () => freezeList(VR_WORLD_KNOWLEDGE_CATEGORIES),
    getCategory: (categoryId) => categoriesById.get(categoryId) ?? null,
    getStagesForCategory,
    getStageState(stageId) { requireStage(stageId); return states.get(stageId); },
    getAvailableStages: (categoryId) => freezeList((categoryId ? getStagesForCategory(categoryId) : VR_WORLD_KNOWLEDGE_STAGES)
      .filter(({ id }) => states.get(id) !== VR_WORLD_KNOWLEDGE_STAGE_STATE.LOCKED)),
    getUnreadAvailableStages: (categoryId) => freezeList((categoryId ? getStagesForCategory(categoryId) : VR_WORLD_KNOWLEDGE_STAGES)
      .filter(({ id }) => states.get(id) === VR_WORLD_KNOWLEDGE_STAGE_STATE.AVAILABLE)),
    isCategoryDiscovered(categoryId) {
      const category = categoriesById.get(categoryId);
      return Boolean(category && states.get(category.stageIds[0]) !== VR_WORLD_KNOWLEDGE_STAGE_STATE.LOCKED);
    },
    categoryHasUnreadContent: (categoryId) => getStagesForCategory(categoryId)
      .some(({ id }) => states.get(id) === VR_WORLD_KNOWLEDGE_STAGE_STATE.AVAILABLE),
    markStageRead,
    synchronize,
    getSnapshot,
    hydrateKnowledgeState,
    resetBaseline,
    subscribe(listener) {
      if (typeof listener !== 'function') throw new TypeError('World Knowledge listener must be a function');
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      subscriptions.forEach((unsubscribe) => unsubscribe());
      listeners.clear();
    }
  });
}
