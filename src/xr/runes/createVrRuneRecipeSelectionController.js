import { PROTO_ASTRO_NATURAL_FAMILY_CODES } from '../protoAstro/protoAstroRegistry.js';
import { resolveVrBranchIdByProtoAstroFamily } from '../protoAstro/resolveVrPageProtoAstro.js';
import { resolveVrSmallGlyphProtoAstro } from '../protoAstro/resolveVrSmallGlyphProtoAstro.js';
import { resolveAttractorShellGlyph } from '../tools/vrAttractorShellGlyphs.js';
import { ASTRO_FURNACE_RUNE_RECIPE_SLOT_STATES } from '../furnace/createVrAstroFurnaceRuneRecipeInteraction.js';
import { resolveVrRuneRecipeForTargetFamily } from './resolveVrRuneRecipe.js';

export function createVrRuneRecipeSelectionController({ progressionController, runeRecipeInteraction }) {
  if (typeof progressionController?.isBranchComplete !== 'function')
    throw new TypeError('Rune recipe selection requires branch completion reads.');
  if (typeof runeRecipeInteraction?.getSnapshot !== 'function')
    throw new TypeError('Rune recipe selection requires RuneRecipeInteraction.');
  const listeners = new Set();
  let selectedFamilyCode = null;
  let disposed = false;

  function isFamilyEligible(familyCode) {
    const family = String(familyCode ?? '').toUpperCase();
    if (!PROTO_ASTRO_NATURAL_FAMILY_CODES.includes(family)) return false;
    const branchId = resolveVrBranchIdByProtoAstroFamily(family);
    return Boolean(branchId && progressionController.isBranchComplete(branchId));
  }
  function synchronizeSelection() {
    if (selectedFamilyCode && !isFamilyEligible(selectedFamilyCode)) selectedFamilyCode = null;
    return selectedFamilyCode;
  }
  function getEligibleFamilyCodes() {
    synchronizeSelection();
    return PROTO_ASTRO_NATURAL_FAMILY_CODES.filter(isFamilyEligible);
  }
  function emitChange() { const snapshot = getSnapshot(); listeners.forEach((listener) => listener(snapshot)); }
  function selectFamily(familyCode) {
    const family = String(familyCode ?? '').toUpperCase();
    if (!isFamilyEligible(family)) return false;
    if (selectedFamilyCode !== family) { selectedFamilyCode = family; emitChange(); }
    return true;
  }
  function clearSelection() { if (selectedFamilyCode) { selectedFamilyCode = null; emitChange(); } }
  function getSelectedFamilyCode() { return synchronizeSelection(); }
  function getExpectedRecipe() {
    const selected = getSelectedFamilyCode();
    return selected ? resolveVrRuneRecipeForTargetFamily(selected) : null;
  }
  function resolveIngredients() {
    const slots = runeRecipeInteraction.getSnapshot();
    const glyph = resolveVrSmallGlyphProtoAstro(runeRecipeInteraction.getInsertedSmallGlyph());
    const shell = resolveAttractorShellGlyph(runeRecipeInteraction.getInsertedShell());
    return { slots, smallGlyphFamilyCode: glyph?.descriptor?.familyCode ?? null,
      shellFamilyCode: shell?.familyCode ?? null };
  }
  function isRecipeValid() {
    const recipe = getExpectedRecipe();
    if (!recipe) return false;
    const ingredients = resolveIngredients();
    return ingredients.slots.smallGlyph.state === ASTRO_FURNACE_RUNE_RECIPE_SLOT_STATES.INSERTED
      && ingredients.slots.shell.state === ASTRO_FURNACE_RUNE_RECIPE_SLOT_STATES.INSERTED
      && ingredients.smallGlyphFamilyCode === recipe.smallGlyphFamilyCode
      && ingredients.shellFamilyCode === recipe.shellFamilyCode;
  }
  function getSnapshot() {
    const selected = getSelectedFamilyCode();
    const ingredients = resolveIngredients();
    const recipeValid = isRecipeValid();
    return Object.freeze({ eligibleFamilyCodes: getEligibleFamilyCodes(), selectedFamilyCode: selected,
      expectedRecipe: selected ? resolveVrRuneRecipeForTargetFamily(selected) : null,
      ...ingredients, recipeValid, readyForTuning: recipeValid });
  }
  const unsubscribeInteraction = runeRecipeInteraction.subscribe(() => emitChange());
  function reset() { if (selectedFamilyCode) { selectedFamilyCode = null; emitChange(); } }
  function dispose() { if (disposed) return; reset(); disposed = true; unsubscribeInteraction(); listeners.clear(); }
  return { getEligibleFamilyCodes, isFamilyEligible, selectFamily, clearSelection, getSelectedFamilyCode,
    getExpectedRecipe, getSnapshot, isRecipeValid, isReadyForTuning: isRecipeValid,
    subscribe(listener) { if (typeof listener !== 'function') throw new TypeError('Rune selection listener must be a function.'); listeners.add(listener); return () => listeners.delete(listener); },
    reset, dispose };
}
