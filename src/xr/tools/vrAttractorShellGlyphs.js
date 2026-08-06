import { publicPath } from '../../utils/publicPath.js';

export const VR_ATTRACTOR_SHELL_GLYPHS = Object.freeze({
  shell_01: Object.freeze({ syllable: 'RO', path: 'svg/RO.svg' }),
  shell_02: Object.freeze({ syllable: 'KO', path: 'svg/KO.svg' }),
  shell_03: Object.freeze({ syllable: 'LO', path: 'svg/LO.svg' }),
  shell_04: Object.freeze({ syllable: 'SO', path: 'svg/SO.svg' }),
  shell_05: Object.freeze({ syllable: 'TO', path: 'svg/TO.svg' }),
  shell_06: Object.freeze({ syllable: 'VO', path: 'svg/VO.svg' })
});

export function resolveAttractorShellIdentity(target) {
  const value = target?.userData?.shellAssetId ?? target?.userData?.attractorId ?? target?.name ?? target;
  const match = String(value ?? '').match(/(?:shell(?:-relic)?[-_]?)(0?[1-6])(?:\D|$)/i);
  return match ? `shell_${String(Number(match[1])).padStart(2, '0')}` : null;
}

export function resolveAttractorShellGlyph(target) {
  const identity = resolveAttractorShellIdentity(target);
  const glyph = identity ? VR_ATTRACTOR_SHELL_GLYPHS[identity] : null;
  return glyph ? { ...glyph, identity, url: publicPath(glyph.path) } : null;
}
