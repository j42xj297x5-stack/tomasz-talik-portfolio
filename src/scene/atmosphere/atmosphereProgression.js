import * as THREE from '../../vendor/three.js';

const clampLevel = (value) => THREE.MathUtils.clamp(Math.round(value), 0, 5);
const layerOrder = ['starsDust', 'shells', 'miniGlyphs', 'sunMoon', 'finalAura'];

export function createAtmosphereProgression({ gateIds = [] } = {}) {
  const listeners = new Set();
  const state = {
    progressionEnabled: true,
    autoProgressOnUniqueGateClose: true,
    progressLevel: 0,
    pendingGateId: null,
    isTransitioning: false,
    activeTransitionLayer: null,
    transitionProgress: 0,
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

  const notifyProgressionStateChanged = () => listeners.forEach((listener) => listener());

  const recalculateTransitionStatus = () => {
    const targets = getTargets();
    const epsilon = 0.001;
    const activeLayerIndex = layerOrder.findIndex((key) => Math.abs(state.current[key] - targets[key]) > epsilon);
    if (activeLayerIndex === -1) {
      state.isTransitioning = false;
      state.activeTransitionLayer = null;
      state.transitionProgress = 0;
      return;
    }
    state.isTransitioning = true;
    state.activeTransitionLayer = activeLayerIndex + 1;
    const layerKey = layerOrder[activeLayerIndex];
    const target = targets[layerKey];
    state.transitionProgress = target === 1 ? state.current[layerKey] : 1 - state.current[layerKey];
  };

  return {
    state,
    getProgressionMultipliers() { return { ...state.current }; },
    onStateChange(listener) { listeners.add(listener); return () => listeners.delete(listener); },
    notifyProgressionStateChanged,
    getProgressionDebugState() {
      return {
        progressionEnabled: state.progressionEnabled,
        autoProgressOnUniqueGateClose: state.autoProgressOnUniqueGateClose,
        progressLevel: state.progressLevel,
        pendingGateId: state.pendingGateId,
        visitedGateIds: Array.from(state.visitedGateIds),
        effectiveProgressLevel: state.progressionEnabled ? state.progressLevel : 5,
        isTransitioning: state.isTransitioning,
        activeTransitionLayer: state.activeTransitionLayer,
        transitionProgress: state.transitionProgress
      };
    },
    setProgressionEnabled(value) { state.progressionEnabled = Boolean(value); state.pendingGateId = null; notifyProgressionStateChanged(); },
    setAutoProgressOnUniqueGateClose(value) { state.autoProgressOnUniqueGateClose = Boolean(value); notifyProgressionStateChanged(); },
    setProgressLevel(level) { state.progressLevel = clampLevel(level); notifyProgressionStateChanged(); },
    prepareGateProgression(gateId) {
      if (!state.progressionEnabled || !state.autoProgressOnUniqueGateClose || !gateId || state.visitedGateIds.has(gateId)) return false;
      state.pendingGateId = gateId;
      notifyProgressionStateChanged();
      return true;
    },
    clearPendingProgression() { state.pendingGateId = null; notifyProgressionStateChanged(); },
    commitPendingProgression() {
      if (!state.pendingGateId) return false;
      if (!state.visitedGateIds.has(state.pendingGateId)) {
        state.visitedGateIds.add(state.pendingGateId);
        state.progressLevel = clampLevel(state.visitedGateIds.size);
      }
      state.pendingGateId = null;
      notifyProgressionStateChanged();
      return true;
    },
    handleOverlayClosed() { return this.commitPendingProgression(); },
    resetProgression() { state.visitedGateIds.clear(); state.pendingGateId = null; state.progressLevel = 0; notifyProgressionStateChanged(); },
    unlockFullProgression() { state.pendingGateId = null; gateIds.forEach((id) => state.visitedGateIds.add(id)); state.progressLevel = 5; notifyProgressionStateChanged(); },
    updateAtmosphereProgression(deltaSeconds = 0) {
      const targets = getTargets();
      layerOrder.forEach((key) => {
        const tau = Math.max(0.0001, state.transitionTimes[key] ?? 3);
        const a = 1 - Math.exp(-deltaSeconds / tau);
        state.current[key] = THREE.MathUtils.lerp(state.current[key], targets[key], a);
      });
      recalculateTransitionStatus();
    }
  };
}
