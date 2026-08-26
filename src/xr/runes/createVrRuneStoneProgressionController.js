import { PROTO_ASTRO_NATURAL_FAMILY_CODES } from '../protoAstro/protoAstroRegistry.js';

export function createVrRuneStoneProgressionController() {
  const tunedRuneFamilies = new Set();
  const installedRuneFamilies = new Set();
  const listeners = new Set();
  let disposed = false;

  const normalizeNaturalFamily = (familyCode) => {
    const family = String(familyCode ?? '').toUpperCase();
    return PROTO_ASTRO_NATURAL_FAMILY_CODES.includes(family) ? family : null;
  };
  const getTunedFamilyCodes = () => Object.freeze([...tunedRuneFamilies]);
  const getInstalledFamilyCodes = () => Object.freeze([...installedRuneFamilies]);
  const getSnapshot = () => Object.freeze({
    tunedRuneFamilies: getTunedFamilyCodes(),
    installedRuneFamilies: getInstalledFamilyCodes()
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
  function reset() {
    if (disposed || (tunedRuneFamilies.size === 0 && installedRuneFamilies.size === 0)) return;
    tunedRuneFamilies.clear(); installedRuneFamilies.clear(); emitChange();
  }
  function dispose() { if (disposed) return; disposed = true; listeners.clear(); }
  return {
    commitTunedFamily,
    commitInstalledFamily,
    isFamilyTuned: (familyCode) => tunedRuneFamilies.has(String(familyCode ?? '').toUpperCase()),
    isFamilyInstalled: (familyCode) => installedRuneFamilies.has(String(familyCode ?? '').toUpperCase()),
    getTunedFamilyCodes, getInstalledFamilyCodes, getSnapshot,
    subscribe(listener) { if (typeof listener !== 'function') throw new TypeError('Rune progression listener must be a function.'); listeners.add(listener); return () => listeners.delete(listener); },
    reset, dispose
  };
}
