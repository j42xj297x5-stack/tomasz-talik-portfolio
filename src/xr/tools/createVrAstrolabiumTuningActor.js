import { VR_ATTRACTOR_BANDS } from '../input/createVrHandModeController.js';
import {
  PROTO_ASTRO_FAMILIES,
  PROTO_ASTRO_NATURAL_FAMILY_CODES
} from '../protoAstro/protoAstroRegistry.js';
import { resolveAttractorShellGlyph } from './vrAttractorShellGlyphs.js';

const EMPTY_FAMILY_CODES = Object.freeze([]);

function requireSourceApi(source, sourceName, methods) {
  if (!source || methods.some((method) => typeof source[method] !== 'function')) {
    throw new TypeError(`${sourceName} must provide ${methods.join('(), ')}().`);
  }
}

export function createVrAstrolabiumTuningActor({
  furnaceProgressionController,
  protoAstroTuningController,
  runeStoneProgressionController
}) {
  requireSourceApi(furnaceProgressionController, 'furnaceProgressionController', [
    'getAbsorbedShellIds', 'getAsterionSphereProgress', 'subscribe'
  ]);
  requireSourceApi(protoAstroTuningController, 'protoAstroTuningController', [
    'getExtractedFamilyCodes', 'subscribe'
  ]);
  requireSourceApi(runeStoneProgressionController, 'runeStoneProgressionController', [
    'getTunedFamilyCodes', 'subscribe'
  ]);

  const naturalFamilies = new Set(PROTO_ASTRO_NATURAL_FAMILY_CODES);
  const listeners = new Set();
  let disposed = false;

  function canonicalNaturalFamilies(familyCodes) {
    const presentFamilies = new Set(familyCodes);
    return Object.freeze(PROTO_ASTRO_NATURAL_FAMILY_CODES.filter((familyCode) => presentFamilies.has(familyCode)));
  }

  function deriveSnapshot() {
    const processedFamilies = new Set(furnaceProgressionController.getAbsorbedShellIds().map((assetId) => {
      const descriptor = resolveAttractorShellGlyph(assetId);
      if (!descriptor) throw new Error(`Cannot resolve absorbed Shell identity: ${assetId}`);
      return descriptor.familyCode;
    }).filter((familyCode) => naturalFamilies.has(familyCode)));
    const processedNaturalShellFamilyCodes = canonicalNaturalFamilies(processedFamilies);
    const specialShellUnlocked = processedNaturalShellFamilyCodes.length === PROTO_ASTRO_NATURAL_FAMILY_CODES.length;
    const asterionSphereComplete = furnaceProgressionController.getAsterionSphereProgress().complete === true;
    const shellFamilyCodes = Object.freeze([
      ...PROTO_ASTRO_NATURAL_FAMILY_CODES,
      ...(specialShellUnlocked ? [PROTO_ASTRO_FAMILIES.V.code] : [])
    ]);

    return Object.freeze({
      shellFamilyCodes,
      processedNaturalShellFamilyCodes,
      smallGlyphFamilyCodes: Object.freeze([
        ...processedNaturalShellFamilyCodes,
        ...(asterionSphereComplete ? [PROTO_ASTRO_FAMILIES.V.code] : [])
      ]),
      largeGlyphFamilyCodes: canonicalNaturalFamilies(protoAstroTuningController.getExtractedFamilyCodes()),
      runeStoneFamilyCodes: canonicalNaturalFamilies(runeStoneProgressionController.getTunedFamilyCodes()),
      specialShellUnlocked
    });
  }

  const signatureOf = (value) => JSON.stringify(value);
  let snapshot = deriveSnapshot();
  let semanticSignature = signatureOf(snapshot);

  function synchronize() {
    if (disposed) return snapshot;
    const nextSnapshot = deriveSnapshot();
    const nextSignature = signatureOf(nextSnapshot);
    if (nextSignature === semanticSignature) return snapshot;
    snapshot = nextSnapshot;
    semanticSignature = nextSignature;
    listeners.forEach((listener) => {
      try {
        listener(snapshot);
      } catch (error) {
        console.warn('[VrAstrolabiumTuningActor] Listener failed.', error);
      }
    });
    return snapshot;
  }

  const sourceUnsubscribers = [
    furnaceProgressionController.subscribe(synchronize),
    protoAstroTuningController.subscribe(synchronize),
    runeStoneProgressionController.subscribe(synchronize)
  ];

  function getTargetableFamilyCodes(band) {
    if (band === VR_ATTRACTOR_BANDS.SHELLS) return snapshot.shellFamilyCodes;
    if (band === VR_ATTRACTOR_BANDS.SMALL_GLYPHS) return snapshot.smallGlyphFamilyCodes;
    if (band === VR_ATTRACTOR_BANDS.LARGE_GLYPHS) return snapshot.largeGlyphFamilyCodes;
    if (band === VR_ATTRACTOR_BANDS.RUNESTONES) return snapshot.runeStoneFamilyCodes;
    return EMPTY_FAMILY_CODES;
  }

  function dispose() {
    if (disposed) return;
    sourceUnsubscribers.forEach((unsubscribe) => unsubscribe());
    listeners.clear();
    disposed = true;
  }

  return Object.freeze({
    getSnapshot: () => snapshot,
    getTargetableFamilyCodes,
    isFamilyTargetable: (band, familyCode) => getTargetableFamilyCodes(band).includes(
      String(familyCode ?? '').toUpperCase()
    ),
    isSpecialShellUnlocked: () => snapshot.specialShellUnlocked,
    subscribe(listener) {
      if (typeof listener !== 'function') throw new TypeError('Astrolabium tuning listener must be a function.');
      if (disposed) return () => {};
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    synchronize,
    dispose
  });
}
