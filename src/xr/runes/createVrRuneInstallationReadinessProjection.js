import { VR_NATURAL_RUNE_STONE_ASSETS } from './vrRuneStoneRegistry.js';

const PROGRESSION_BRANCH_BY_RUNE_BRANCH = Object.freeze({
  earth: 'ethics-life-protection',
  fire: 'creative-ai',
  wood: 'ai-guide',
  metal: 'spotify-digger',
  water: 'haiku-cosmos'
});

const LEGAL_READINESS_STATES = new Set(['HIDDEN', 'DOCKED']);

export function createVrRuneInstallationReadinessProjection({
  isBranchComplete,
  getWaterInstallationReadinessOverride = () => false
}) {
  if (typeof isBranchComplete !== 'function') {
    throw new TypeError('[VrRuneInstallationReadinessProjection] Branch-completion access is required.');
  }
  if (typeof getWaterInstallationReadinessOverride !== 'function') {
    throw new TypeError('[VrRuneInstallationReadinessProjection] Water override access must be a function.');
  }

  const branchIds = VR_NATURAL_RUNE_STONE_ASSETS.map(({ branchId }) => branchId);

  function isInstallationReady(branchId) {
    const normalizedBranchId = String(branchId ?? '').toLowerCase();
    const progressionBranchId = PROGRESSION_BRANCH_BY_RUNE_BRANCH[normalizedBranchId];
    if (!progressionBranchId) return false;
    const normalSectorReadiness = isBranchComplete(progressionBranchId) === true;
    return normalSectorReadiness
      || (normalizedBranchId === 'water' && getWaterInstallationReadinessOverride() === true);
  }

  function getReadyBranchIds() {
    return branchIds.filter(isInstallationReady);
  }

  function synchronizeBridges(runeBridgeActor) {
    if (!runeBridgeActor?.getState || !runeBridgeActor?.setInstallationReady) {
      throw new TypeError('[VrRuneInstallationReadinessProjection] RuneBridgeActor access is required.');
    }
    branchIds.forEach((branchId) => {
      const state = runeBridgeActor.getState(branchId);
      const ready = isInstallationReady(branchId);
      if (!LEGAL_READINESS_STATES.has(state)) return;
      if ((state === 'DOCKED') === ready) return;
      runeBridgeActor.setInstallationReady(branchId, ready);
    });
  }

  return { isInstallationReady, getReadyBranchIds, synchronizeBridges };
}
