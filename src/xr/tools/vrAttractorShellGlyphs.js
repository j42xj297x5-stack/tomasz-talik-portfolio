import { resolveProtoAstroAssetUrl, resolveProtoAstroSyllable } from '../protoAstro/protoAstroRegistry.js';

const SHELL_SYLLABLES = Object.freeze({
  shell_01: 'RO',
  shell_02: 'KO',
  shell_03: 'LO',
  shell_04: 'SO',
  shell_05: 'TO',
  shell_06: 'VO'
});

// Compatibility adapter: shell runtime identity stays local, while all language
// semantics and asset paths come from the central Proto-Astro registry.
export const VR_ATTRACTOR_SHELL_GLYPHS = Object.freeze(Object.fromEntries(
  Object.entries(SHELL_SYLLABLES).map(([identity, syllable]) => [identity, resolveProtoAstroSyllable(syllable)])
));

export function resolveAttractorShellIdentity(target) {
  const value = target?.userData?.shellAssetId ?? target?.userData?.attractorId ?? target?.name ?? target;
  const match = String(value ?? '').match(/(?:shell(?:-relic)?[-_]?)(0?[1-6])(?:\D|$)/i);
  return match ? `shell_${String(Number(match[1])).padStart(2, '0')}` : null;
}

export function resolveAttractorShellGlyph(target) {
  const identity = resolveAttractorShellIdentity(target);
  const glyph = identity ? VR_ATTRACTOR_SHELL_GLYPHS[identity] : null;
  return glyph ? { ...glyph, identity, url: resolveProtoAstroAssetUrl(glyph) } : null;
}
