import { PROTO_ASTRO_NATURAL_FAMILY_CODES } from '../protoAstro/protoAstroRegistry.js';
import { resolveVrSmallGlyphProtoAstro } from '../protoAstro/resolveVrSmallGlyphProtoAstro.js';
import { resolveAttractorShellGlyph } from '../tools/vrAttractorShellGlyphs.js';
import { ASTRO_FURNACE_RUNE_RECIPE_SLOT_STATES } from '../furnace/createVrAstroFurnaceRuneRecipeInteraction.js';
import { resolveVrRuneRecipeForTargetFamily } from './resolveVrRuneRecipe.js';

export function createVrRuneRecipeSelectionController({ runeRecipeInteraction,
  runeStoneProgressionController, prepareRecipeChange, canTuneEtherRune = () => false }) {
  if (typeof runeRecipeInteraction?.getSnapshot !== 'function')
    throw new TypeError('Rune recipe selection requires RuneRecipeInteraction.');
  if (typeof runeStoneProgressionController?.isFamilyTuned !== 'function')
    throw new TypeError('Rune recipe selection requires RuneStoneProgressionController.');
  if (typeof prepareRecipeChange !== 'function')
    throw new TypeError('Rune recipe selection requires prepareRecipeChange.');
  const listeners = new Set();
  let selectedFamilyCode = null;
  let disposed = false;

  function isFamilyAvailable(familyCode) {
    const family = String(familyCode ?? '').toUpperCase();
    return PROTO_ASTRO_NATURAL_FAMILY_CODES.includes(family);
  }
  const isEtherAvailable = () => canTuneEtherRune() === true;
  const isEtherTuned = () => runeStoneProgressionController.isEtherRuneTuned() === true;
  const isEtherTunable = () => isEtherAvailable() && !isEtherTuned();
  function synchronizeSelection() {
    if (selectedFamilyCode && !isFamilyTunable(selectedFamilyCode)) selectedFamilyCode = null;
    return selectedFamilyCode;
  }
  function getAvailableFamilyCodes() {
    synchronizeSelection();
    return [...PROTO_ASTRO_NATURAL_FAMILY_CODES];
  }
  function isFamilyTuned(familyCode) { return runeStoneProgressionController.isFamilyTuned(familyCode); }
  function isFamilyTunable(familyCode) {
    const family = String(familyCode ?? '').toUpperCase();
    return family === 'V' ? isEtherTunable() : isFamilyAvailable(family) && !isFamilyTuned(family);
  }
  function getTunableFamilyCodes() { return PROTO_ASTRO_NATURAL_FAMILY_CODES.filter(isFamilyTunable); }
  function emitChange() { const snapshot = getSnapshot(); listeners.forEach((listener) => listener(snapshot)); }
  function selectFamily(familyCode) {
    const family = String(familyCode ?? '').toUpperCase();
    if (!isFamilyTunable(family)) return false;
    if (selectedFamilyCode === family) return true;
    if (selectedFamilyCode !== null && prepareRecipeChange(selectedFamilyCode, family) !== true) return false;
    selectedFamilyCode = family; emitChange();
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
    return Object.freeze({ availableFamilyCodes: getAvailableFamilyCodes(), tunableFamilyCodes: getTunableFamilyCodes(),
      tunedFamilyCodes: runeStoneProgressionController.getTunedFamilyCodes(), selectedFamilyCode: selected,
      etherAvailable: isEtherAvailable(), etherTunable: isEtherTunable(), etherTuned: isEtherTuned(),
      expectedRecipe: selected ? resolveVrRuneRecipeForTargetFamily(selected) : null,
      ...ingredients, recipeValid, readyForTuning: recipeValid });
  }
  const unsubscribeInteraction = runeRecipeInteraction.subscribe(() => emitChange());
  const unsubscribeProgression = runeStoneProgressionController.subscribe(() => { synchronizeSelection(); emitChange(); });
  function reset() { if (selectedFamilyCode) { selectedFamilyCode = null; emitChange(); } }
  function dispose() { if (disposed) return; reset(); disposed = true; unsubscribeInteraction(); unsubscribeProgression(); listeners.clear(); }
  return { getAvailableFamilyCodes, getTunableFamilyCodes, isFamilyAvailable, isFamilyTuned, isFamilyTunable,
    isEtherAvailable, isEtherTunable, isEtherTuned,
    selectFamily, clearSelection, getSelectedFamilyCode,
    getExpectedRecipe, getSnapshot, isRecipeValid, isReadyForTuning: isRecipeValid,
    subscribe(listener) { if (typeof listener !== 'function') throw new TypeError('Rune selection listener must be a function.'); listeners.add(listener); return () => listeners.delete(listener); },
    reset, dispose };
}
