import { resolveProtoAstroAssetUrl, resolveProtoAstroDescriptor } from './protoAstroRegistry.js';

export const VR_PAGE_PROTO_ASTRO_FAMILY_BY_GLYPH_ID = Object.freeze({
  'ethics-life-protection': 'K',
  'spotify-digger': 'T',
  'haiku-cosmos': 'S',
  'ai-guide': 'L',
  'creative-ai': 'R'
});

export function resolveVrPageProtoAstro(page) {
  const familyCode = VR_PAGE_PROTO_ASTRO_FAMILY_BY_GLYPH_ID[page?.glyphId ?? page?.branchId];
  if (!familyCode) return null;
  const descriptor = resolveProtoAstroDescriptor(familyCode, 'A');
  return descriptor ? Object.freeze({ descriptor, assetUrl: resolveProtoAstroAssetUrl(descriptor) }) : null;
}
