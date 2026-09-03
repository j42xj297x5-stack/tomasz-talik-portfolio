import { resolveProtoAstroDescriptor } from '../protoAstro/protoAstroRegistry.js';

const CREATOR_FAMILY_BY_TARGET_FAMILY = Object.freeze({
  T: 'K',
  S: 'T',
  L: 'S',
  R: 'L',
  K: 'R'
});

export function resolveVrRuneRecipeForTargetFamily(targetFamilyCode) {
  const target = String(targetFamilyCode ?? '').toUpperCase();
  if (target === 'V') {
    return Object.freeze({
      kind: 'SPECIAL',
      targetFamilyCode: 'V',
      smallGlyphFamilyCode: 'V',
      shellFamilyCode: 'V',
      smallGlyphDescriptor: resolveProtoAstroDescriptor('V', 'I'),
      shellDescriptor: resolveProtoAstroDescriptor('V', 'O'),
      runeDescriptor: resolveProtoAstroDescriptor('V', 'U')
    });
  }
  const creator = CREATOR_FAMILY_BY_TARGET_FAMILY[target];
  if (!creator) return null;
  return Object.freeze({
    kind: 'NATURAL',
    targetFamilyCode: target,
    smallGlyphFamilyCode: creator,
    shellFamilyCode: target,
    smallGlyphDescriptor: resolveProtoAstroDescriptor(creator, 'I'),
    shellDescriptor: resolveProtoAstroDescriptor(target, 'O'),
    runeDescriptor: resolveProtoAstroDescriptor(target, 'U')
  });
}
