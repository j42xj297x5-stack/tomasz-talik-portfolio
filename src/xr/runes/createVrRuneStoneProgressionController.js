import { VR_NATURAL_RUNE_STONE_ASSETS } from './vrRuneStoneRegistry.js';

const NATURAL_FAMILY_CODES = Object.freeze(VR_NATURAL_RUNE_STONE_ASSETS.map(({ familyCode }) => familyCode));

export function createVrRuneStoneProgressionController() {
  const tunedRuneFamilies = new Set();
  const installedRuneFamilies = new Set();
  const listeners = new Set();
  let etherRuneTuned = false;
  let waterInstallationReadinessOverride = false;
  let disposed = false;

  const normalizeNaturalFamily = (familyCode) => {
    const family = String(familyCode ?? '').toUpperCase();
    return NATURAL_FAMILY_CODES.includes(family) ? family : null;
  };
  const canonicalFamilies = (families) => NATURAL_FAMILY_CODES.filter((family) => families.has(family));
  const getTunedFamilyCodes = () => Object.freeze(canonicalFamilies(tunedRuneFamilies));
  const getInstalledFamilyCodes = () => Object.freeze(canonicalFamilies(installedRuneFamilies));
  const getSnapshot = () => Object.freeze({
    tunedRuneFamilies: getTunedFamilyCodes(),
    installedRuneFamilies: getInstalledFamilyCodes(),
    etherRuneTuned,
    waterInstallationReadinessOverride
  });
  const emitChange = () => { const snapshot = getSnapshot(); listeners.forEach((listener) => listener(snapshot)); };
  function commitTunedFamily(familyCode) {
    if (disposed) return false;
    const family = normalizeNaturalFamily(familyCode);
    if (!family) throw new TypeError(`Cannot tune non-natural Rune Stone family: ${familyCode}`);
    if (tunedRuneFamilies.has(family)) return false;
    tunedRuneFamilies.add(family); emitChange(); return true;
  }
  function commitInstalledFamily(familyCode) {
    if (disposed) return false;
    const family = normalizeNaturalFamily(familyCode);
    if (!family) throw new TypeError(`Cannot install non-natural Rune Stone family: ${familyCode}`);
    if (!tunedRuneFamilies.has(family)) {
      throw new Error(`Cannot install untuned Rune Stone family: ${family}`);
    }
    if (installedRuneFamilies.has(family)) return false;
    installedRuneFamilies.add(family); emitChange(); return true;
  }
  function commitEtherRuneTuned() {
    if (disposed || etherRuneTuned) return false;
    etherRuneTuned = true; emitChange(); return true;
  }
  function commitWaterInstallationReadinessOverride() {
    if (disposed || waterInstallationReadinessOverride) return false;
    waterInstallationReadinessOverride = true; emitChange(); return true;
  }
  function hydrateScenarioState(state) {
    if (!state || typeof state !== 'object' || Array.isArray(state)
      || Object.keys(state).length !== 4
      || !Object.prototype.hasOwnProperty.call(state, 'tunedRuneFamilies')
      || !Object.prototype.hasOwnProperty.call(state, 'installedRuneFamilies')
      || !Object.prototype.hasOwnProperty.call(state, 'etherRuneTuned')
      || !Object.prototype.hasOwnProperty.call(state, 'waterInstallationReadinessOverride')) {
      throw new TypeError('runeProgression state must contain exactly tunedRuneFamilies, installedRuneFamilies, etherRuneTuned and waterInstallationReadinessOverride');
    }
    const validateFamilies = (value, key) => {
      if (!Array.isArray(value)) throw new TypeError(`${key} must be an array`);
      const normalized = value.map((familyCode) => {
        if (typeof familyCode !== 'string') throw new TypeError(`${key} must contain familyCode strings`);
        const family = normalizeNaturalFamily(familyCode);
        if (!family || family !== familyCode) throw new TypeError(`${key} contains invalid natural familyCode: ${familyCode}`);
        return family;
      });
      if (new Set(normalized).size !== normalized.length) throw new TypeError(`${key} must not contain duplicates`);
      return new Set(normalized);
    };
    const nextTuned = validateFamilies(state.tunedRuneFamilies, 'tunedRuneFamilies');
    const nextInstalled = validateFamilies(state.installedRuneFamilies, 'installedRuneFamilies');
    if (typeof state.etherRuneTuned !== 'boolean') throw new TypeError('etherRuneTuned must be a boolean');
    if (typeof state.waterInstallationReadinessOverride !== 'boolean') {
      throw new TypeError('waterInstallationReadinessOverride must be a boolean');
    }
    nextInstalled.forEach((family) => {
      if (!nextTuned.has(family)) throw new Error(`Cannot hydrate installed untuned Rune Stone family: ${family}`);
    });
    tunedRuneFamilies.clear();
    canonicalFamilies(nextTuned).forEach((family) => tunedRuneFamilies.add(family));
    installedRuneFamilies.clear();
    canonicalFamilies(nextInstalled).forEach((family) => installedRuneFamilies.add(family));
    etherRuneTuned = state.etherRuneTuned;
    waterInstallationReadinessOverride = state.waterInstallationReadinessOverride;
  }
  function reset() {
    if (disposed || (tunedRuneFamilies.size === 0 && installedRuneFamilies.size === 0 && !etherRuneTuned
      && !waterInstallationReadinessOverride)) return;
    tunedRuneFamilies.clear(); installedRuneFamilies.clear(); etherRuneTuned = false;
    waterInstallationReadinessOverride = false; emitChange();
  }
  function dispose() { if (disposed) return; disposed = true; listeners.clear(); }
  return {
    commitTunedFamily,
    commitInstalledFamily,
    commitEtherRuneTuned,
    commitWaterInstallationReadinessOverride,
    hydrateScenarioState,
    isFamilyTuned: (familyCode) => tunedRuneFamilies.has(String(familyCode ?? '').toUpperCase()),
    isFamilyInstalled: (familyCode) => installedRuneFamilies.has(String(familyCode ?? '').toUpperCase()),
    isEtherRuneTuned: () => etherRuneTuned,
    hasWaterInstallationReadinessOverride: () => waterInstallationReadinessOverride,
    getTunedFamilyCodes, getInstalledFamilyCodes, getSnapshot,
    subscribe(listener) { if (typeof listener !== 'function') throw new TypeError('Rune progression listener must be a function.'); listeners.add(listener); return () => listeners.delete(listener); },
    reset, dispose
  };
}
