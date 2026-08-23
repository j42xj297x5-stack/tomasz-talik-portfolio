export function createVrAstroFurnaceContentSource({ getInteraction, getChamberState = () => 'CLOSED' }) {
  const interaction = () => getInteraction?.();
  return {
    getState: () => interaction()?.getState?.() ?? 'EMPTY',
    getInsertedContentKind: () => interaction()?.getInsertedContentKind?.() ?? null,
    getInsertedShellAssetId: () => interaction()?.getInsertedShellAssetId?.() ?? null,
    getInsertedShellWireframe: () => interaction()?.getInsertedShellWireframe?.() ?? null,
    getInsertedSmallGlyphAssetId: () => interaction()?.getInsertedSmallGlyphAssetId?.() ?? null,
    getChamberState: () => getChamberState?.() ?? 'CLOSED'
  };
}
