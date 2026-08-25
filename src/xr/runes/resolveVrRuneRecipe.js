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
  const creator = CREATOR_FAMILY_BY_TARGET_FAMILY[target];
  if (!creator) return null;
  return Object.freeze({
    targetFamilyCode: target,
    smallGlyphFamilyCode: creator,
    shellFamilyCode: target,
    smallGlyphDescriptor: resolveProtoAstroDescriptor(creator, 'I'),
    shellDescriptor: resolveProtoAstroDescriptor(target, 'O'),
    runeDescriptor: resolveProtoAstroDescriptor(target, 'U')
  });
}
