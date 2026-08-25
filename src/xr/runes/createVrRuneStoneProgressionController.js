import { PROTO_ASTRO_NATURAL_FAMILY_CODES } from '../protoAstro/protoAstroRegistry.js';

export function createVrRuneStoneProgressionController() {
  const tunedRuneFamilies = new Set();
  const listeners = new Set();
  let disposed = false;

  const normalizeNaturalFamily = (familyCode) => {
    const family = String(familyCode ?? '').toUpperCase();
    return PROTO_ASTRO_NATURAL_FAMILY_CODES.includes(family) ? family : null;
  };
  const getTunedFamilyCodes = () => Object.freeze([...tunedRuneFamilies]);
  const getSnapshot = () => Object.freeze({ tunedRuneFamilies: getTunedFamilyCodes() });
  const emitChange = () => { const snapshot = getSnapshot(); listeners.forEach((listener) => listener(snapshot)); };
  function commitTunedFamily(familyCode) {
    if (disposed) return false;
    const family = normalizeNaturalFamily(familyCode);
    if (!family) throw new TypeError(`Cannot tune non-natural Rune Stone family: ${familyCode}`);
    if (tunedRuneFamilies.has(family)) return false;
    tunedRuneFamilies.add(family); emitChange(); return true;
  }
  function reset() { if (disposed || tunedRuneFamilies.size === 0) return; tunedRuneFamilies.clear(); emitChange(); }
  function dispose() { if (disposed) return; disposed = true; listeners.clear(); }
  return {
    commitTunedFamily,
    isFamilyTuned: (familyCode) => tunedRuneFamilies.has(String(familyCode ?? '').toUpperCase()),
    getTunedFamilyCodes, getSnapshot,
    subscribe(listener) { if (typeof listener !== 'function') throw new TypeError('Rune progression listener must be a function.'); listeners.add(listener); return () => listeners.delete(listener); },
    reset, dispose
  };
}
