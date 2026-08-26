import { resolveRuneStoneByFamilyCode } from './vrRuneStoneRegistry.js';

export function createVrRuneInstalledStateProjection({
  runeStoneProgressionController, runeStoneActor, runeBridgeActor
}) {
  if (!runeStoneProgressionController?.getInstalledFamilyCodes || !runeStoneActor?.restoreInstalled
    || !runeBridgeActor?.restoreInstalled || !runeBridgeActor?.getStoneAnchor) {
    throw new TypeError('[VrRuneInstalledStateProjection] Rune reconstruction access is required.');
  }

  function synchronize() {
    runeStoneProgressionController.getInstalledFamilyCodes().forEach((familyCode) => {
      const descriptor = resolveRuneStoneByFamilyCode(familyCode);
      if (!descriptor?.natural || !descriptor.branchId) {
        throw new Error(`[VrRuneInstalledStateProjection] Missing natural branch for ${familyCode}.`);
      }
      const installationAnchor = runeBridgeActor.getStoneAnchor(descriptor.branchId);
      if (!installationAnchor || !runeStoneActor.restoreInstalled(descriptor.branchId, installationAnchor)
        || !runeBridgeActor.restoreInstalled(descriptor.branchId)) {
        throw new Error(`[VrRuneInstalledStateProjection] Cannot reconstruct installed ${familyCode}.`);
      }
    });
  }

  return Object.freeze({ synchronize });
}
