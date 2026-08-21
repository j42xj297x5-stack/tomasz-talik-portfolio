import { publicPath } from '../../utils/publicPath.js';

export const PROTO_ASTRO_FAMILIES = Object.freeze({
  K: Object.freeze({ code: 'K', id: 'earth' }),
  T: Object.freeze({ code: 'T', id: 'metal' }),
  S: Object.freeze({ code: 'S', id: 'water' }),
  L: Object.freeze({ code: 'L', id: 'tree' }),
  R: Object.freeze({ code: 'R', id: 'fire' }),
  V: Object.freeze({ code: 'V', id: 'astro' })
});

export const PROTO_ASTRO_FORMS = Object.freeze({
  A: Object.freeze({ code: 'A', id: 'archetype' }),
  O: Object.freeze({ code: 'O', id: 'shell' }),
  I: Object.freeze({ code: 'I', id: 'small-glyph' }),
  U: Object.freeze({ code: 'U', id: 'runestone' })
});

export const PROTO_ASTRO_NATURAL_FAMILY_CODES = Object.freeze(['K', 'T', 'S', 'L', 'R']);
const NATURAL_FORM_CODES = Object.freeze(['A', 'O', 'I', 'U']);
const SYLLABLE_CODES = Object.freeze([
  ...PROTO_ASTRO_NATURAL_FAMILY_CODES.flatMap((familyCode) => NATURAL_FORM_CODES.map((formCode) => `${familyCode}${formCode}`)),
  'VO', 'VI'
]);

const descriptorsBySyllable = new Map(SYLLABLE_CODES.map((syllable) => {
  const family = PROTO_ASTRO_FAMILIES[syllable[0]];
  const form = PROTO_ASTRO_FORMS[syllable[1]];
  const descriptor = Object.freeze({
    syllable,
    familyCode: family.code,
    familyId: family.id,
    formCode: form.code,
    formId: form.id,
    path: `svg/${syllable}.svg`
  });
  return [syllable, descriptor];
}));

/**
 * Canonical Proto-Astro syllables currently represented by public SVG assets.
 * Crystals are fragments of a family's A archetype (for example, fire belongs
 * to RA); they are not a fifth form and receive no separate syllable.
 */
export const PROTO_ASTRO_SYLLABLES = Object.freeze([...descriptorsBySyllable.values()]);

export function resolveProtoAstroSyllable(syllable) {
  return descriptorsBySyllable.get(String(syllable ?? '').toUpperCase()) ?? null;
}

export function resolveProtoAstroDescriptor(familyCode, formCode) {
  const family = String(familyCode ?? '').toUpperCase();
  const form = String(formCode ?? '').toUpperCase();
  return resolveProtoAstroSyllable(`${family}${form}`);
}

export function resolveProtoAstroAssetUrl(syllableOrDescriptor) {
  const descriptor = typeof syllableOrDescriptor === 'string'
    ? resolveProtoAstroSyllable(syllableOrDescriptor)
    : resolveProtoAstroSyllable(syllableOrDescriptor?.syllable);
  return descriptor ? publicPath(descriptor.path) : null;
}
