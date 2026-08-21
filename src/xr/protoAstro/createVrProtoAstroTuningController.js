import {
  PROTO_ASTRO_NATURAL_FAMILY_CODES,
  resolveProtoAstroDescriptor
} from './protoAstroRegistry.js';
import { resolveVrPageProtoAstro } from './resolveVrPageProtoAstro.js';
import { resolveVrSmallGlyphProtoAstro } from './resolveVrSmallGlyphProtoAstro.js';

const NATURAL_FAMILIES = new Set(PROTO_ASTRO_NATURAL_FAMILY_CODES);

export function createVrProtoAstroTuningController() {
  const extractedFamilyCodes = new Set();
  const listeners = new Set();
  let disposed = false;

  function getExtractedFamilyCodes() {
    return Object.freeze(PROTO_ASTRO_NATURAL_FAMILY_CODES.filter((code) => extractedFamilyCodes.has(code)));
  }
  function getSnapshot() {
    const families = PROTO_ASTRO_NATURAL_FAMILY_CODES.map((familyCode) => {
      const small = resolveProtoAstroDescriptor(familyCode, 'I');
      const large = resolveProtoAstroDescriptor(familyCode, 'A');
      if (!small || !large) throw new Error(`Missing natural Proto-Astro descriptors for family "${familyCode}".`);
      return Object.freeze({ familyCode, familyId: small.familyId, smallGlyphSyllable: small.syllable,
        largeGlyphSyllable: large.syllable, extracted: extractedFamilyCodes.has(familyCode) });
    });
    return Object.freeze({ extractedFamilyCodes: getExtractedFamilyCodes(), families: Object.freeze(families) });
  }
  function notify() { const snapshot = getSnapshot(); listeners.forEach((listener) => listener(snapshot)); }
  function hasFamilyEssence(familyCode) { return extractedFamilyCodes.has(String(familyCode ?? '').toUpperCase()); }
  function canExtractSmallGlyph(target) {
    if (disposed) return false;
    const resolved = resolveVrSmallGlyphProtoAstro(target);
    return Boolean(resolved && resolved.descriptor.formCode === 'I'
      && NATURAL_FAMILIES.has(resolved.descriptor.familyCode)
      && !extractedFamilyCodes.has(resolved.descriptor.familyCode));
  }
  function commitExtractedSmallGlyph(target) {
    if (!canExtractSmallGlyph(target)) return false;
    extractedFamilyCodes.add(resolveVrSmallGlyphProtoAstro(target).descriptor.familyCode); notify(); return true;
  }
  function canAttractLargeGlyph(largeGlyphIdentity) {
    if (disposed) return false;
    const identity = typeof largeGlyphIdentity === 'string' ? { glyphId: largeGlyphIdentity } : largeGlyphIdentity;
    const large = resolveVrPageProtoAstro(identity);
    return Boolean(large?.descriptor?.formCode === 'A' && extractedFamilyCodes.has(large.descriptor.familyCode));
  }
  function resetBaseline() { if (disposed) return; extractedFamilyCodes.clear(); notify(); }
  function hydrateScenarioState(value) {
    if (!value || typeof value !== 'object' || Array.isArray(value)
      || Object.keys(value).length !== 1 || !Array.isArray(value.extractedFamilyCodes)) {
      throw new TypeError('protoAstroTuning state must be exactly { extractedFamilyCodes: [...] }.');
    }
    const values = value.extractedFamilyCodes;
    if (new Set(values).size !== values.length || values.some((code) => !NATURAL_FAMILIES.has(code))) {
      throw new TypeError('protoAstroTuning extractedFamilyCodes must be unique natural Proto-Astro family codes.');
    }
    extractedFamilyCodes.clear(); values.forEach((code) => extractedFamilyCodes.add(code)); notify();
  }
  function subscribe(listener) {
    if (typeof listener !== 'function') throw new TypeError('listener must be a function.');
    if (disposed) return () => {};
    listeners.add(listener); return () => listeners.delete(listener);
  }
  function dispose() { if (disposed) return; listeners.clear(); extractedFamilyCodes.clear(); disposed = true; }
  return { getSnapshot, getExtractedFamilyCodes, hasFamilyEssence, canExtractSmallGlyph,
    commitExtractedSmallGlyph, canAttractLargeGlyph, resetBaseline, hydrateScenarioState, subscribe, dispose };
}
