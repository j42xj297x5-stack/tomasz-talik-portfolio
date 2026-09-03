export function createVrRuneStoneAttractorBandProjection({
  runeStoneProgressionController
}) {
  const getTargetableFamilyCodes = () => Object.freeze([
    ...runeStoneProgressionController.getTunedFamilyCodes(),
    ...(runeStoneProgressionController.isEtherRuneTuned() ? ['V'] : [])
  ]);
  return {
    isAvailable: () => getTargetableFamilyCodes().length > 0,
    getTargetableFamilyCodes,
    isFamilyTargetable: (familyCode) => String(familyCode ?? '').toUpperCase() === 'V'
      ? runeStoneProgressionController.isEtherRuneTuned()
      : runeStoneProgressionController.isFamilyTuned(familyCode)
  };
}
