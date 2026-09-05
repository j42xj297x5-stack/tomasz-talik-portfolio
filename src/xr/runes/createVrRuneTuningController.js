import { PROTO_ASTRO_NATURAL_FAMILY_CODES } from '../protoAstro/protoAstroRegistry.js';
import { resolveVrSmallGlyphProtoAstro } from '../protoAstro/resolveVrSmallGlyphProtoAstro.js';
import { resolveAttractorShellGlyph } from '../tools/vrAttractorShellGlyphs.js';

export function createVrRuneTuningController({ runeRecipeInteraction, runeRecipeSelectionController,
  runeStoneProgressionController, diagnostics = null }) {
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
    diagnostics?.begin?.(transaction);
    return transaction;
  }
  function completeTuning() {
    let stage = 'PRE_FLIGHT';
    let predicates = null;
    try {
      diagnostics?.stage?.(stage);
      if (!transaction) {
        predicates = { transactionPresent: false };
        diagnostics?.preflight?.({ predicates });
        throw new Error('Cannot complete Rune tuning without a frozen transaction.');
      }
      const frozen = transaction;
      stage = 'RESOLVE_IDENTITIES'; diagnostics?.stage?.(stage);
      const glyphIdentity = resolveVrSmallGlyphProtoAstro(frozen.smallGlyph);
      const shellIdentity = resolveAttractorShellGlyph(frozen.shell);
      const natural = PROTO_ASTRO_NATURAL_FAMILY_CODES.includes(frozen.targetFamilyCode);
      const specialEther = frozen.targetFamilyCode === 'V';
      stage = 'PRE_FLIGHT'; diagnostics?.stage?.(stage);
      const targetKindValid = natural || specialEther;
      predicates = {
        transactionPresent: true,
        targetKindValid,
        familyStillTunable: targetKindValid && (natural
          ? !runeStoneProgressionController.isFamilyTuned(frozen.targetFamilyCode)
          : runeRecipeSelectionController.isEtherTunable()),
        recipeTargetMatches: frozen.expectedRecipe?.targetFamilyCode === frozen.targetFamilyCode,
        recipeKindMatches: frozen.expectedRecipe?.kind === (natural ? 'NATURAL' : 'SPECIAL'),
        smallGlyphSyllableMatches: glyphIdentity?.descriptor?.syllable
          === frozen.expectedRecipe?.smallGlyphDescriptor?.syllable,
        shellSyllableMatches: shellIdentity?.syllable === frozen.expectedRecipe?.shellDescriptor?.syllable,
        smallGlyphFamilyMatches: glyphIdentity?.descriptor?.familyCode === frozen.expectedRecipe?.smallGlyphFamilyCode,
        shellFamilyMatches: shellIdentity?.familyCode === frozen.expectedRecipe?.shellFamilyCode,
        ingredientsConsumable: runeRecipeInteraction.canConsumeInsertedIngredients(frozen)
      };
      diagnostics?.preflight?.({ glyphIdentity, shellIdentity, predicates });
      const failedPredicates = Object.entries(predicates).filter(([, passed]) => !passed).map(([name]) => name);
      if (failedPredicates.length > 0) {
        throw new Error(`Cannot complete Rune tuning: frozen transaction pre-flight failed: ${failedPredicates.join(', ')}`);
      }
      stage = 'CONSUME_RECIPE'; diagnostics?.stage?.(stage);
      if (!runeRecipeInteraction.consumeInsertedIngredients(frozen))
        throw new Error('Rune recipe interaction rejected a pre-flighted ingredient transaction.');
      stage = 'PROGRESSION_COMMIT'; diagnostics?.stage?.(stage);
      const committed = specialEther
        ? runeStoneProgressionController.commitEtherRuneTuned()
        : runeStoneProgressionController.commitTunedFamily(frozen.targetFamilyCode);
      if (!committed)
        throw new Error('Rune progression rejected a newly consumed tuning transaction.');
      stage = 'FINALIZE_TRANSACTION'; diagnostics?.stage?.(stage);
      transaction = null;
      stage = 'CLEAR_SELECTION'; diagnostics?.stage?.(stage);
      runeRecipeSelectionController.clearSelection();
      stage = 'COMPLETE'; diagnostics?.complete?.();
      return true;
    } catch (error) {
      diagnostics?.failure?.(error, { stage, predicates });
      throw error;
    }
  }
  function abortTuning() {
    const aborted = transaction !== null; transaction = null;
    if (aborted) diagnostics?.abort?.();
    return aborted;
  }
  function reset() { abortTuning(); }
  function dispose() { if (disposed) return; abortTuning(); disposed = true; }
  return { canStart, beginTuning, completeTuning, abortTuning, reset, dispose,
    isProcessing: () => transaction !== null,
    getSnapshot: () => Object.freeze({ processing: transaction !== null,
      targetFamilyCode: transaction?.targetFamilyCode ?? null }) };
}
