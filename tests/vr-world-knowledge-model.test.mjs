import assert from 'node:assert/strict';
import {
  createVrWorldKnowledgeModel,
  VR_WORLD_KNOWLEDGE_CATEGORIES,
  VR_WORLD_KNOWLEDGE_STAGES,
  VR_WORLD_KNOWLEDGE_STAGE_STATE as STATE
} from '../src/xr/knowledge/createVrWorldKnowledgeModel.js';
import { VR_RUNE_BRIDGE_BRANCH_IDS, VR_RUNE_BRIDGE_STATES } from '../src/xr/runes/createVrRuneBridgeActor.js';

const pages = Object.freeze(Array.from({ length: 10 }, (_, index) => Object.freeze({
  id: `page-${index + 1}`,
  order: index < 5 ? 1 : 2
})));

function observable(extra) {
  const listeners = new Set();
  return {
    ...extra,
    subscribe(listener) { listeners.add(listener); return () => listeners.delete(listener); },
    emit() { [...listeners].forEach((listener) => listener()); }
  };
}

function harness() {
  const truth = {
    tiers: new Set(), activatedPageIds: [], shells: [], sphereComplete: false, extracted: [],
    astroEarned: false, asterionState: 'LOCKED', tuned: [], etherTuned: false,
    etherIntegrated: false, installed: new Set(),
    bridges: Object.fromEntries(VR_RUNE_BRIDGE_BRANCH_IDS.map((id) => [id, VR_RUNE_BRIDGE_STATES.HIDDEN])),
    descriptor: { fieldActive: false, fullActiveCore: false }
  };
  const progressionController = {
    isTierComplete: (tier) => truth.tiers.has(tier),
    getActivatedPageIds: () => [...truth.activatedPageIds]
  };
  const furnaceProgressionController = observable({
    getAbsorbedShellIds: () => [...truth.shells],
    getAsterionSphereProgress: () => ({ complete: truth.sphereComplete }),
    hasAbsorbedShell: (id) => truth.shells.includes(id)
  });
  const protoAstroTuningController = observable({ getExtractedFamilyCodes: () => [...truth.extracted] });
  const astroAttractorProductionController = observable({ isEarned: () => truth.astroEarned });
  const asterionProductionController = observable({ getState: () => truth.asterionState });
  const runeStoneProgressionController = observable({
    getTunedFamilyCodes: () => [...truth.tuned],
    isEtherRuneTuned: () => truth.etherTuned,
    hasWaterInstallationReadinessOverride: () => truth.etherIntegrated,
    isFamilyInstalled: (family) => truth.installed.has(family)
  });
  const runeBridgeActor = observable({ getState: (branchId) => truth.bridges[branchId] });
  const asterionResonatorFieldActor = observable({ getDescriptor: () => ({ ...truth.descriptor }) });
  const model = createVrWorldKnowledgeModel({ progressionController, furnaceProgressionController,
    protoAstroTuningController, astroAttractorProductionController, asterionProductionController,
    runeStoneProgressionController, runeBridgeActor, asterionResonatorFieldActor, pages });
  return { truth, model, owners: { furnaceProgressionController, protoAstroTuningController,
    astroAttractorProductionController, asterionProductionController, runeStoneProgressionController,
    runeBridgeActor, asterionResonatorFieldActor } };
}

assert.equal(VR_WORLD_KNOWLEDGE_STAGES.length, 45, 'the canonical registry contains exactly 45 stages');
assert.deepEqual(VR_WORLD_KNOWLEDGE_CATEGORIES.map(({ stageIds }) => stageIds.length),
  [3, 3, 3, 3, 4, 3, 3, 3, 3, 4, 2, 2, 2, 4, 3], 'canonical category sizes remain stable');

{
  const { model, truth } = harness();
  assert.equal(model.getStageState('01.1'), STATE.LOCKED);
  assert.equal(model.markStageRead('01.1'), false, 'LOCKED cannot become READ');
  assert.equal(model.isCategoryDiscovered('world.five_transformations'), false);
  truth.tiers.add(1); model.synchronize();
  assert.equal(model.getStageState('01.1'), STATE.AVAILABLE, 'LOCKED promotes to AVAILABLE');
  assert.equal(model.isCategoryDiscovered('world.five_transformations'), true, 'first AVAILABLE stage discovers its category');
  assert.deepEqual(model.getUnreadAvailableStages('world.five_transformations').map(({ id }) => id), ['01.1']);
  assert.equal(model.categoryHasUnreadContent('world.five_transformations'), true);
  assert.equal(model.markStageRead('01.1'), true); assert.equal(model.getStageState('01.1'), STATE.READ);
  truth.tiers.clear(); model.synchronize();
  assert.equal(model.getStageState('01.1'), STATE.READ, 'READ is monotonic after source truth changes');
  assert.equal(model.categoryHasUnreadContent('world.five_transformations'), false);
  model.dispose();
}

{
  const { model, truth, owners } = harness();
  let emissions = 0; model.subscribe(() => { emissions += 1; });
  model.synchronize(); assert.equal(emissions, 0, 'unchanged synchronization is silent');
  truth.shells.push('shell-1', 'shell-2'); owners.furnaceProgressionController.emit();
  assert.equal(model.getStageState('03.1'), STATE.AVAILABLE); assert.equal(model.getStageState('03.2'), STATE.LOCKED);
  truth.shells.push('shell-3', 'shell-4'); owners.furnaceProgressionController.emit();
  assert.equal(model.getStageState('03.2'), STATE.AVAILABLE);
  truth.sphereComplete = true; owners.furnaceProgressionController.emit(); assert.equal(model.getStageState('03.3'), STATE.AVAILABLE);
  truth.extracted = ['K', 'T']; owners.protoAstroTuningController.emit(); assert.equal(model.getStageState('04.1'), STATE.AVAILABLE);
  truth.extracted.push('S', 'L'); owners.protoAstroTuningController.emit(); assert.equal(model.getStageState('04.2'), STATE.AVAILABLE);
  truth.extracted.push('R'); owners.protoAstroTuningController.emit(); assert.equal(model.getStageState('04.3'), STATE.AVAILABLE);
  model.dispose();
}

{
  const { model, truth } = harness();
  truth.activatedPageIds = ['page-1', 'page-6', 'unknown']; model.synchronize();
  assert.equal(model.getStageState('06.1'), STATE.AVAILABLE, 'only committed canonical Tier-1 pages count');
  assert.equal(model.getStageState('07.1'), STATE.LOCKED, 'a Tier-2 page and unknown/preview identity do not count');
  truth.activatedPageIds.push('page-2', 'page-3', 'page-4', 'page-5'); model.synchronize();
  assert.equal(model.getStageState('06.3'), STATE.AVAILABLE); assert.equal(model.getStageState('07.3'), STATE.AVAILABLE);
  model.dispose();
}

{
  const { model, truth, owners } = harness();
  truth.tuned = ['K']; owners.runeStoneProgressionController.emit(); assert.equal(model.getStageState('10.1'), STATE.AVAILABLE);
  truth.tuned = ['K', 'T', 'L']; owners.runeStoneProgressionController.emit(); assert.equal(model.getStageState('10.2'), STATE.AVAILABLE);
  truth.tuned = ['K', 'T', 'L', 'R']; truth.etherTuned = true; owners.runeStoneProgressionController.emit();
  assert.equal(model.getStageState('10.3'), STATE.AVAILABLE, 'Ether tuning participates in the total tuned count');
  assert.equal(model.getStageState('10.4'), STATE.LOCKED);
  assert.equal(model.getStageState('14.4'), STATE.LOCKED, 'Ether tuning is not natural Water installation');
  truth.tuned.push('S'); owners.runeStoneProgressionController.emit(); assert.equal(model.getStageState('10.4'), STATE.AVAILABLE);
  assert.equal(model.getStageState('14.4'), STATE.LOCKED, 'Water remains bound to direct installed-family truth');
  truth.installed.add('S'); owners.runeStoneProgressionController.emit(); assert.equal(model.getStageState('14.4'), STATE.AVAILABLE);
  model.dispose();
}

{
  const { model, truth, owners } = harness();
  truth.bridges.earth = VR_RUNE_BRIDGE_STATES.ARRIVING; owners.runeBridgeActor.emit();
  assert.equal(model.getStageState('12.1'), STATE.LOCKED, 'ARRIVING is not established');
  truth.bridges.earth = VR_RUNE_BRIDGE_STATES.DOCKED;
  truth.bridges.fire = VR_RUNE_BRIDGE_STATES.EXTENDING;
  truth.bridges.wood = VR_RUNE_BRIDGE_STATES.EXTENDED;
  owners.runeBridgeActor.emit();
  assert.equal(model.getStageState('12.1'), STATE.AVAILABLE); assert.equal(model.getStageState('12.2'), STATE.AVAILABLE);
  model.dispose();
}

{
  const { model, truth, owners } = harness();
  truth.descriptor.fieldActive = true; owners.asterionResonatorFieldActor.emit();
  assert.equal(model.getStageState('13.2'), STATE.LOCKED, 'fieldActive alone does not unlock full Resonator knowledge');
  truth.descriptor.fullActiveCore = true; owners.asterionResonatorFieldActor.emit();
  assert.equal(model.getStageState('13.2'), STATE.AVAILABLE); assert.equal(model.getStageState('14.1'), STATE.AVAILABLE);
  truth.descriptor.fullActiveCore = false; truth.descriptor.fieldActive = false; owners.asterionResonatorFieldActor.emit();
  assert.equal(model.getStageState('13.2'), STATE.AVAILABLE, 'first fullActiveCore is latched permanently');
  const snapshot = model.getSnapshot(); model.resetBaseline(); assert.equal(model.getStageState('13.2'), STATE.LOCKED);
  model.hydrateKnowledgeState(snapshot); assert.equal(model.getStageState('13.2'), STATE.AVAILABLE, 'knowledge-owned latch hydrates');
  model.dispose();
}

console.log('VR World Knowledge model tests passed.');
