export const REQUIRED_ASTERION_SHELLS = Object.freeze([
  'shell-relic-1', 'shell-relic-2', 'shell-relic-3',
  'shell-relic-4', 'shell-relic-5', 'shell-relic-6'
]);

export function createVrAstroFurnaceProgressionController() {
  const absorbedShells = new Set();
  const subscribers = new Set();
  let disposed = false;

  function getAsterionSphereProgress() {
    const shells = REQUIRED_ASTERION_SHELLS.map((assetId) => ({
      assetId, absorbed: absorbedShells.has(assetId)
    }));
    return {
      id: 'asterion-sphere', absorbed: absorbedShells.size,
      required: REQUIRED_ASTERION_SHELLS.length,
      complete: absorbedShells.size === REQUIRED_ASTERION_SHELLS.length,
      shells,
      missing: shells.filter(({ absorbed }) => !absorbed).map(({ assetId }) => assetId)
    };
  }
  const getSnapshot = () => ({ asterionSphere: getAsterionSphereProgress() });
  const hasAbsorbedShell = (assetId) => absorbedShells.has(assetId);
  const canAbsorbShell = (assetId) => !disposed
    && REQUIRED_ASTERION_SHELLS.includes(assetId) && !absorbedShells.has(assetId);
  function commitAbsorbedShell(assetId) {
    if (!canAbsorbShell(assetId)) return false;
    absorbedShells.add(assetId);
    const snapshot = getSnapshot();
    subscribers.forEach((listener) => listener(snapshot));
    return true;
  }
  function subscribe(listener) {
    if (disposed || typeof listener !== 'function') return () => {};
    subscribers.add(listener);
    return () => subscribers.delete(listener);
  }
  function notify() { const snapshot = getSnapshot(); subscribers.forEach((listener) => listener(snapshot)); }
  function resetBaseline() { absorbedShells.clear(); notify(); }
  function hydrateScenarioState(value) {
    if (!value || !Array.isArray(value.absorbedShellIds)
      || value.absorbedShellIds.some((assetId) => !REQUIRED_ASTERION_SHELLS.includes(assetId))) {
      throw new TypeError('furnaceProgression.absorbedShellIds must contain known shell ids');
    }
    absorbedShells.clear(); value.absorbedShellIds.forEach((assetId) => absorbedShells.add(assetId)); notify();
  }
  function dispose() { disposed = true; subscribers.clear(); }
  return { getSnapshot, getAsterionSphereProgress, hasAbsorbedShell, canAbsorbShell,
    commitAbsorbedShell, subscribe, resetBaseline, hydrateScenarioState, dispose };
}
