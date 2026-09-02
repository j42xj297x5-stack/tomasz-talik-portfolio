export function createVrPlatformEnergyVfxProjection({ platformEnergyVfxActor }) {
  if (!platformEnergyVfxActor?.beginRuneBinderReveal) {
    throw new TypeError('[VrPlatformEnergyVfxProjection] PlatformEnergyVfxActor access is required.');
  }
  const presentedTransitions = new Set();
  let disposed = false;

  function presentReadinessTransitions(transitions) {
    if (disposed || !Array.isArray(transitions)) return;
    transitions.forEach((transition) => {
      if (transition?.previousState !== 'HIDDEN' || transition?.state !== 'ARRIVING') return;
      const branchId = String(transition.branchId ?? '').toLowerCase();
      const key = `${branchId}:HIDDEN:ARRIVING`;
      if (presentedTransitions.has(key)) return;
      if (platformEnergyVfxActor.beginRuneBinderReveal(branchId)) presentedTransitions.add(key);
    });
  }

  function reset() { presentedTransitions.clear(); }
  function dispose() { disposed = true; presentedTransitions.clear(); }
  return { presentReadinessTransitions, reset, dispose };
}
