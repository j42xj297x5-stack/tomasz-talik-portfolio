const descriptor = (
  assetIdentity,
  familyCode,
  familyId,
  branchId,
  natural,
  physicalPresentationScale
) => Object.freeze({
  assetIdentity,
  assetId: `vr-rune-stone-${assetIdentity.slice(-2)}-model`,
  path: `/glb/${assetIdentity}.glb`,
  familyCode,
  familyId,
  branchId,
  natural,
  special: !natural,
  physicalPresentationScale
});

export const VR_RUNE_STONE_ASSETS = Object.freeze([
  descriptor('stone_01', 'R', 'fire', 'fire', true, 1.20),
  descriptor('stone_02', 'T', 'metal', 'metal', true, 1.00),
  descriptor('stone_03', 'K', 'earth', 'earth', true, 1.80),
  descriptor('stone_04', 'L', 'tree', 'wood', true, 1.30),
  descriptor('stone_05', 'S', 'water', 'water', true, 2.30),
  descriptor('stone_06', 'V', 'astro', null, false, 1.00)
]);

export const VR_NATURAL_RUNE_STONE_ASSETS = Object.freeze(
  VR_RUNE_STONE_ASSETS.filter(({ natural }) => natural)
);

const byFamilyCode = new Map(VR_RUNE_STONE_ASSETS.map((item) => [item.familyCode, item]));
const byBranchId = new Map(VR_NATURAL_RUNE_STONE_ASSETS.map((item) => [item.branchId, item]));
const byAssetIdentity = new Map(VR_RUNE_STONE_ASSETS.map((item) => [item.assetIdentity, item]));

export function resolveRuneStoneByFamilyCode(familyCode) {
  return byFamilyCode.get(String(familyCode ?? '').toUpperCase()) ?? null;
}

export function resolveRuneStoneByBranchId(branchId) {
  return byBranchId.get(String(branchId ?? '').toLowerCase()) ?? null;
}

export function resolveRuneStoneByAssetIdentity(assetIdentity) {
  return byAssetIdentity.get(String(assetIdentity ?? '').toLowerCase()) ?? null;
}
