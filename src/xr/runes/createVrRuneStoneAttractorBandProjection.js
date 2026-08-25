export function createVrRuneStoneAttractorBandProjection({
  runeStoneProgressionController
}) {
  return {
    isAvailable: () => runeStoneProgressionController.getTunedFamilyCodes().length > 0,
    getTargetableFamilyCodes: () => runeStoneProgressionController.getTunedFamilyCodes(),
    isFamilyTargetable: (familyCode) => runeStoneProgressionController.isFamilyTuned(familyCode)
  };
}
