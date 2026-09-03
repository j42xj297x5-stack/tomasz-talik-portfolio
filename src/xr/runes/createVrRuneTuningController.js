import { PROTO_ASTRO_NATURAL_FAMILY_CODES } from '../protoAstro/protoAstroRegistry.js';
import { resolveVrSmallGlyphProtoAstro } from '../protoAstro/resolveVrSmallGlyphProtoAstro.js';
import { resolveAttractorShellGlyph } from '../tools/vrAttractorShellGlyphs.js';

export function createVrRuneTuningController({ runeRecipeInteraction, runeRecipeSelectionController,
  runeStoneProgressionController }) {
  let transaction = null;
  let disposed = false;

  function canStart() {
    const target = runeRecipeSelectionController.getSelectedFamilyCode();
    return !disposed && !transaction && Boolean(target)
      && runeRecipeSelectionController.isReadyForTuning() === true
      && runeRecipeSelectionController.isFamilyTunable(target) === true
      && runeRecipeInteraction.canConsumeInsertedIngredients() === true;
  }
  function beginTuning() {
    if (!canStart()) throw new Error('Cannot begin Rune tuning: recipe transaction invariants are not satisfied.');
    const targetFamilyCode = runeRecipeSelectionController.getSelectedFamilyCode();
    const expectedRecipe = runeRecipeSelectionController.getExpectedRecipe();
    transaction = Object.freeze({ targetFamilyCode, expectedRecipe,
      smallGlyph: runeRecipeInteraction.getInsertedSmallGlyph(),
      shell: runeRecipeInteraction.getInsertedShell() });
    return transaction;
  }
  function completeTuning() {
    if (!transaction) throw new Error('Cannot complete Rune tuning without a frozen transaction.');
    const frozen = transaction;
    const glyphIdentity = resolveVrSmallGlyphProtoAstro(frozen.smallGlyph);
    const shellIdentity = resolveAttractorShellGlyph(frozen.shell);
    const natural = PROTO_ASTRO_NATURAL_FAMILY_CODES.includes(frozen.targetFamilyCode);
    const specialEther = frozen.targetFamilyCode === 'V';
    const valid = (natural || specialEther)
      && (natural ? !runeStoneProgressionController.isFamilyTuned(frozen.targetFamilyCode)
        : runeRecipeSelectionController.isEtherTunable())
      && frozen.expectedRecipe?.targetFamilyCode === frozen.targetFamilyCode
      && frozen.expectedRecipe?.kind === (natural ? 'NATURAL' : 'SPECIAL')
      && glyphIdentity?.descriptor?.syllable === frozen.expectedRecipe.smallGlyphDescriptor?.syllable
      && shellIdentity?.descriptor?.syllable === frozen.expectedRecipe.shellDescriptor?.syllable
      && glyphIdentity?.descriptor?.familyCode === frozen.expectedRecipe.smallGlyphFamilyCode
      && shellIdentity?.familyCode === frozen.expectedRecipe.shellFamilyCode
      && runeRecipeInteraction.canConsumeInsertedIngredients(frozen);
    if (!valid) throw new Error('Cannot complete Rune tuning: frozen transaction pre-flight failed.');
    if (!runeRecipeInteraction.consumeInsertedIngredients(frozen))
      throw new Error('Rune recipe interaction rejected a pre-flighted ingredient transaction.');
    const committed = specialEther
      ? runeStoneProgressionController.commitEtherRuneTuned()
      : runeStoneProgressionController.commitTunedFamily(frozen.targetFamilyCode);
    if (!committed)
      throw new Error('Rune progression rejected a newly consumed tuning transaction.');
    transaction = null;
    runeRecipeSelectionController.clearSelection();
    return true;
  }
  function abortTuning() { const aborted = transaction !== null; transaction = null; return aborted; }
  function reset() { abortTuning(); }
  function dispose() { if (disposed) return; abortTuning(); disposed = true; }
  return { canStart, beginTuning, completeTuning, abortTuning, reset, dispose,
    isProcessing: () => transaction !== null,
    getSnapshot: () => Object.freeze({ processing: transaction !== null,
      targetFamilyCode: transaction?.targetFamilyCode ?? null }) };
}
