import {
  PROTO_ASTRO_NATURAL_FAMILY_CODES,
  resolveProtoAstroAssetUrl,
  resolveProtoAstroSyllable
} from './protoAstroRegistry.js';
import { resolveVrPageProtoAstro } from './resolveVrPageProtoAstro.js';

export const VR_SMALL_GLYPH_PROTO_ASTRO_SYLLABLE_BY_ASSET_ID = Object.freeze({
  'small-glyph-relic-1': 'SI',
  'small-glyph-relic-2': 'KI',
  'small-glyph-relic-3': 'TI',
  'small-glyph-relic-4': 'RI',
  'small-glyph-relic-5': 'LI',
  'small-glyph-relic-6': 'VI'
});

export function resolveVrSmallGlyphProtoAstro(target) {
  const assetId = typeof target === 'string' ? target : target?.userData?.smallGlyphAssetId;
  const syllable = VR_SMALL_GLYPH_PROTO_ASTRO_SYLLABLE_BY_ASSET_ID[assetId];
  if (!syllable) return null;
  const descriptor = resolveProtoAstroSyllable(syllable);
  if (!descriptor || descriptor.formCode !== 'I' || descriptor.formId !== 'small-glyph') {
    throw new Error(`Small glyph Proto-Astro mapping for "${assetId}" must resolve to form I / small-glyph.`);
  }
  return Object.freeze({ assetId, descriptor, assetUrl: resolveProtoAstroAssetUrl(descriptor) });
}

export function resolveVrSmallGlyphLargeGlyphCompatibility(smallGlyph, largeGlyphIdentity) {
  const small = resolveVrSmallGlyphProtoAstro(smallGlyph);
  const largeIdentity = typeof largeGlyphIdentity === 'string' ? { glyphId: largeGlyphIdentity } : largeGlyphIdentity;
  const large = resolveVrPageProtoAstro(largeIdentity);
  if (!small || !large) return null;
  const compatible = small.descriptor.familyCode === large.descriptor.familyCode
    && small.descriptor.formCode === 'I' && large.descriptor.formCode === 'A';
  return Object.freeze({
    small,
    large,
    compatible,
    p2Tunable: compatible && PROTO_ASTRO_NATURAL_FAMILY_CODES.includes(small.descriptor.familyCode)
  });
}
