import * as THREE from '../../vendor/three.js';

const clampLevel = (value) => THREE.MathUtils.clamp(Math.round(value), 0, 5);
const layerOrder = ['starsDust', 'shells', 'miniGlyphs', 'sunMoon', 'finalAura'];

export function createAtmosphereProgression({ gateIds = [] } = {}) {
  const state = {
    progressionEnabled: true,
    autoProgressOnUniqueGateClick: true,
    progressLevel: 0,
    visitedGateIds: new Set(),
    transitionTimes: { starsDust: 2.5, shells: 3.8, miniGlyphs: 4.2, sunMoon: 5, finalAura: 5.5 },
    current: { starsDust: 0, shells: 0, miniGlyphs: 0, sunMoon: 0, finalAura: 0 }
  };

  const getTargets = () => {
    if (!state.progressionEnabled) return { starsDust: 1, shells: 1, miniGlyphs: 1, sunMoon: 1, finalAura: 1 };
    return {
      starsDust: state.progressLevel >= 1 ? 1 : 0,
      shells: state.progressLevel >= 2 ? 1 : 0,
      miniGlyphs: state.progressLevel >= 3 ? 1 : 0,
      sunMoon: state.progressLevel >= 4 ? 1 : 0,
      finalAura: state.progressLevel >= 5 ? 1 : 0
    };
  };

  return {
    state,
    getProgressionMultipliers() { return { ...state.current }; },
    setProgressionEnabled(value) { state.progressionEnabled = Boolean(value); },
    setAutoProgressOnUniqueGateClick(value) { state.autoProgressOnUniqueGateClick = Boolean(value); },
    setProgressLevel(level) { state.progressLevel = clampLevel(level); },
    handleGateVisited(gateId) {
      if (!state.progressionEnabled || !state.autoProgressOnUniqueGateClick || !gateId) return false;
      if (state.visitedGateIds.has(gateId)) return false;
      state.visitedGateIds.add(gateId);
      state.progressLevel = clampLevel(state.visitedGateIds.size);
      return true;
    },
    resetProgression() { state.visitedGateIds.clear(); state.progressLevel = 0; },
    unlockFullProgression() { gateIds.forEach((id) => state.visitedGateIds.add(id)); state.progressLevel = 5; },
    updateAtmosphereProgression(deltaSeconds = 0) {
      const targets = getTargets();
      layerOrder.forEach((key) => {
        const tau = Math.max(0.0001, state.transitionTimes[key] ?? 3);
        const a = 1 - Math.exp(-deltaSeconds / tau);
        state.current[key] = THREE.MathUtils.lerp(state.current[key], targets[key], a);
      });
    }
  };
}
