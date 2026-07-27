import * as THREE from '../../vendor/three.js';

export const ATMOSPHERE_PROGRESSION_LAYER_ORDER = Object.freeze(['stones', 'shells', 'smallGlyphs', 'stars', 'galaxies']);
export const ATMOSPHERE_PROGRESSION_MAPPING = Object.freeze({
  0: Object.freeze(['monkey', 'mainGlyphs', 'sun', 'moon']),
  1: Object.freeze(['stones']),
  2: Object.freeze(['shells']),
  3: Object.freeze(['smallGlyphs']),
  4: Object.freeze(['stars']),
  5: Object.freeze(['galaxies'])
});
export const SUN_MOON_LIGHT_MULTIPLIERS = Object.freeze({
  0: 0.6,
  1: 0.7,
  2: 0.8,
  3: 0.9,
  4: 1,
  5: 1
});

const clampLevel = (value) => THREE.MathUtils.clamp(Math.round(Number(value) || 0), 0, 5);
const clamp01 = (value) => THREE.MathUtils.clamp(Number(value) || 0, 0, 1);
const DEFAULT_TRANSITION_TIMES = Object.freeze({
  stones: 5,
  shells: 5,
  smallGlyphs: 5,
  stars: 5,
  galaxies: 10
});

function createTransitionTimes(overrides = {}) {
  return ATMOSPHERE_PROGRESSION_LAYER_ORDER.reduce((times, key, index) => {
    const legacyKeys = ['starsDust', 'shells', 'miniGlyphs', 'sunMoon', 'finalAura'];
    const fallback = overrides[key] ?? overrides[`threshold${index + 1}`] ?? overrides[legacyKeys[index]] ?? DEFAULT_TRANSITION_TIMES[key];
    const numeric = Number(fallback);
    times[key] = Number.isFinite(numeric) && numeric > 0 ? numeric : DEFAULT_TRANSITION_TIMES[key];
    return times;
  }, {});
}

function createMultiplierState(value = 0) {
  return ATMOSPHERE_PROGRESSION_LAYER_ORDER.reduce((current, key) => {
    current[key] = value;
    return current;
  }, {});
}

export function getSunMoonLightMultiplierForProgress(level, progressionEnabled = true) {
  if (!progressionEnabled) return 1;
  return SUN_MOON_LIGHT_MULTIPLIERS[clampLevel(level)] ?? 1;
}

export function createAtmosphereProgression({ gateIds = [] } = {}) {
  const listeners = new Set();
  const state = {
    progressionEnabled: true,
    autoProgressOnUniqueGateClose: true,
    progressLevel: 0,
    pendingGateId: null,
    isTransitioning: false,
    activeTransitionLayer: null,
    activeTransitionLayerKey: null,
    transitionProgress: 0,
    visitedGateIds: new Set(),
    transitionTimes: createTransitionTimes(),
    current: createMultiplierState(0),
    sunMoonLightMultiplier: SUN_MOON_LIGHT_MULTIPLIERS[0]
  };

  const getTargets = () => {
    if (!state.progressionEnabled) return createMultiplierState(1);
    return ATMOSPHERE_PROGRESSION_LAYER_ORDER.reduce((targets, key, index) => {
      targets[key] = state.progressLevel >= index + 1 ? 1 : 0;
      return targets;
    }, {});
  };

  const notifyProgressionStateChanged = () => listeners.forEach((listener) => listener());

  const syncSunMoonLightMultiplier = () => {
    state.sunMoonLightMultiplier = getSunMoonLightMultiplierForProgress(state.progressLevel, state.progressionEnabled);
  };

  const recalculateTransitionStatus = () => {
    const targets = getTargets();
    const epsilon = 0.001;
    const activeLayerIndex = ATMOSPHERE_PROGRESSION_LAYER_ORDER.findIndex((key) => Math.abs(state.current[key] - targets[key]) > epsilon);
    syncSunMoonLightMultiplier();

    if (activeLayerIndex === -1) {
      state.isTransitioning = false;
      state.activeTransitionLayer = null;
      state.activeTransitionLayerKey = null;
      state.transitionProgress = 0;
      return;
    }

    const layerKey = ATMOSPHERE_PROGRESSION_LAYER_ORDER[activeLayerIndex];
    const target = targets[layerKey];
    state.isTransitioning = true;
    state.activeTransitionLayer = activeLayerIndex + 1;
    state.activeTransitionLayerKey = layerKey;
    state.transitionProgress = target === 1 ? state.current[layerKey] : 1 - state.current[layerKey];
  };

  const setCurrentToTargets = () => {
    const targets = getTargets();
    ATMOSPHERE_PROGRESSION_LAYER_ORDER.forEach((key) => {
      state.current[key] = targets[key];
    });
    recalculateTransitionStatus();
  };

  recalculateTransitionStatus();

  return {
    state,
    getProgressionMultipliers() {
      const sunMoon = state.sunMoonLightMultiplier;
      return {
        ...state.current,
        // Backwards-compatible aliases for existing scene layers.
        starsDust: state.current.stars,
        miniGlyphs: state.current.smallGlyphs,
        finalAura: state.current.galaxies,
        sunMoon
      };
    },
    onStateChange(listener) { listeners.add(listener); return () => listeners.delete(listener); },
    notifyProgressionStateChanged,
    getProgressionDebugState() {
      recalculateTransitionStatus();
      return {
        progressionEnabled: state.progressionEnabled,
        autoProgressOnUniqueGateClose: state.autoProgressOnUniqueGateClose,
        progressLevel: state.progressLevel,
        pendingGateId: state.pendingGateId,
        visitedGateIds: Array.from(state.visitedGateIds),
        effectiveProgressLevel: state.progressionEnabled ? state.progressLevel : 5,
        isTransitioning: state.isTransitioning,
        activeTransitionLayer: state.activeTransitionLayer,
        activeTransitionLayerKey: state.activeTransitionLayerKey,
        transitionProgress: state.transitionProgress,
        layerTransitionProgress: { ...state.current },
        layerTargets: getTargets(),
        transitionTimes: { ...state.transitionTimes },
        mapping: ATMOSPHERE_PROGRESSION_MAPPING,
        sunMoonLightMultiplier: state.sunMoonLightMultiplier,
        sunMoonLightMultipliers: SUN_MOON_LIGHT_MULTIPLIERS
      };
    },
    setProgressionEnabled(value) {
      const enabled = Boolean(value);
      state.progressionEnabled = enabled;
      state.pendingGateId = null;
      if (enabled) {
        state.visitedGateIds.clear();
        state.progressLevel = 0;
      }
      setCurrentToTargets();
      notifyProgressionStateChanged();
    },
    setAutoProgressOnUniqueGateClose(value) { state.autoProgressOnUniqueGateClose = Boolean(value); notifyProgressionStateChanged(); },
    setProgressLevel(level) { state.progressLevel = clampLevel(level); recalculateTransitionStatus(); notifyProgressionStateChanged(); },
    setTransitionTimes(next = {}) {
      state.transitionTimes = createTransitionTimes({ ...state.transitionTimes, ...next });
      notifyProgressionStateChanged();
    },
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
      recalculateTransitionStatus();
      notifyProgressionStateChanged();
      return true;
    },
    handleOverlayClosed() { return this.commitPendingProgression(); },
    resetProgression() {
      state.visitedGateIds.clear();
      state.pendingGateId = null;
      state.progressLevel = 0;
      setCurrentToTargets();
      notifyProgressionStateChanged();
    },
    unlockFullProgression() {
      state.pendingGateId = null;
      gateIds.forEach((id) => state.visitedGateIds.add(id));
      state.progressLevel = 5;
      setCurrentToTargets();
      notifyProgressionStateChanged();
    },
    importProgressionSettings(next = {}) {
      if ('enabled' in next || 'progressionEnabled' in next) state.progressionEnabled = Boolean(next.enabled ?? next.progressionEnabled);
      if ('autoProgressOnUniqueGateClose' in next) state.autoProgressOnUniqueGateClose = Boolean(next.autoProgressOnUniqueGateClose);
      // Exported progression session state is diagnostic only; imports begin at the clean baseline.
      state.visitedGateIds.clear();
      state.progressLevel = 0;
      if (next.transitionSeconds || next.transitionTimes) state.transitionTimes = createTransitionTimes(next.transitionSeconds ?? next.transitionTimes);
      state.pendingGateId = null;
      setCurrentToTargets();
      notifyProgressionStateChanged();
    },
    updateAtmosphereProgression(deltaSeconds = 0) {
      const targets = getTargets();
      const delta = Math.max(0, Number(deltaSeconds) || 0);
      let changed = false;

      ATMOSPHERE_PROGRESSION_LAYER_ORDER.forEach((key) => {
        const target = targets[key];
        const duration = Math.max(0.0001, Number(state.transitionTimes[key]) || DEFAULT_TRANSITION_TIMES[key]);
        const step = delta / duration;
        const current = state.current[key];
        const next = target > current
          ? Math.min(target, current + step)
          : Math.max(target, current - step);
        if (Math.abs(next - current) > 0.000001) changed = true;
        state.current[key] = clamp01(next);
      });

      recalculateTransitionStatus();
      if (changed) notifyProgressionStateChanged();
    }
  };
}
