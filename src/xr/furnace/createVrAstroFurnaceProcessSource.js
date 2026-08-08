export function createVrAstroFurnaceProcessSource(getInteraction) {
  const interaction = () => getInteraction?.();
  return {
    getState: () => interaction()?.getState?.() ?? 'IDLE',
    getProgress: () => interaction()?.getProgress?.() ?? 0,
    getExtractionProgress: () => interaction()?.getExtractionProgress?.() ?? 0,
    getAngularSpeed: () => interaction()?.getAngularSpeed?.() ?? 0,
    getProcessAngle: () => interaction()?.getProcessAngle?.() ?? 0
    , getProcessKind: () => interaction()?.getProcessKind?.() ?? null
  };
}
