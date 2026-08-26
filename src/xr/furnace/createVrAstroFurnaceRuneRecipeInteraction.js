import * as THREE from '../../vendor/three.js';
import { resolveVrSmallGlyphProtoAstro } from '../protoAstro/resolveVrSmallGlyphProtoAstro.js';
import { resolveAttractorShellGlyph } from '../tools/vrAttractorShellGlyphs.js';
import { isWorldPointInsideChamberCylinder, resolveChamberCylinder } from './vrAstroFurnaceChamberCylinder.js';

export const ASTRO_FURNACE_RUNE_RECIPE_SLOT_STATES = Object.freeze({
  EMPTY: 'EMPTY',
  SNAPPING: 'SNAPPING',
  INSERTED: 'INSERTED'
});

const clamp01 = (value) => THREE.MathUtils.clamp(value, 0, 1);
const smoothstep = (value) => { const t = clamp01(value); return t * t * (3 - 2 * t); };

export function createVrAstroFurnaceRuneRecipeInteraction({
  furnace,
  shellSystem,
  smallGlyphSystem,
  openInteraction,
  activateInteraction,
  settings = {},
  takeHeldShell,
  takeHeldSmallGlyph,
  isModeActive,
  getExpectedRecipe
}) {
  [takeHeldShell, takeHeldSmallGlyph, isModeActive, getExpectedRecipe].forEach((dependency) => {
    if (typeof dependency !== 'function') throw new TypeError('Rune recipe interaction dependencies must be functions.');
  });
  if (typeof shellSystem?.restoreInstanceToOrbit !== 'function')
    throw new TypeError('shellSystem must expose restoreInstanceToOrbit.');
  if (typeof smallGlyphSystem?.restoreInstanceToField !== 'function')
    throw new TypeError('smallGlyphSystem must expose restoreInstanceToField.');
  if (typeof shellSystem?.consumeInstance !== 'function' || typeof smallGlyphSystem?.consumeInstance !== 'function')
    throw new TypeError('Rune recipe domain systems must expose consumeInstance.');

  const states = ASTRO_FURNACE_RUNE_RECIPE_SLOT_STATES;
  const config = { enabled: true, snapDuration: .42, chamberClearance: .012, ...settings };
  const volume = furnace?.nodes?.VR_FURNACE_INSERT_VOLUME;
  const chamber = furnace?.nodes?.komora;
  const chamberCylinder = resolveChamberCylinder(chamber, config.chamberClearance);
  const anchorsReady = furnace?.capabilities?.runeRecipeAnchorsReady === true;
  const enabled = config.enabled !== false && anchorsReady && Boolean(volume && chamberCylinder);
  const listeners = new Set();
  const local = new THREE.Vector3();
  const center = new THREE.Vector3();
  let reportedHeldShell = null;
  let reportedHeldSmallGlyph = null;
  let disposed = false;

  const smallGlyph = createSlot(furnace?.nodes?.RUNE_RECIPE_SMALL_GLYPH_SLOT, (content) => {
    if (!smallGlyphSystem.restoreInstanceToField(content))
      throw new Error('Small glyph system rejected rune recipe ingredient restoration.');
  });
  const shell = createSlot(furnace?.nodes?.RUNE_RECIPE_SHELL_SLOT, (content) => {
    if (!shellSystem.restoreInstanceToOrbit(content))
      throw new Error('Shell system rejected rune recipe ingredient restoration.');
  });

  function createSlot(anchor, restore) {
    return { anchor, restore, state: states.EMPTY, content: null, elapsed: 0,
      startPosition: new THREE.Vector3(), startQuaternion: new THREE.Quaternion() };
  }
  function slotSnapshot(slot) {
    return { state: slot.state, occupied: slot.content !== null, content: slot.content };
  }
  function getSnapshot() {
    const smallGlyphSnapshot = slotSnapshot(smallGlyph);
    const shellSnapshot = slotSnapshot(shell);
    const occupiedCount = Number(smallGlyphSnapshot.occupied) + Number(shellSnapshot.occupied);
    return { smallGlyph: smallGlyphSnapshot, shell: shellSnapshot,
      occupiedCount, complete: occupiedCount === 2 };
  }
  function emitChange() {
    const snapshot = getSnapshot();
    listeners.forEach((listener) => listener(snapshot));
  }
  function isNear(content) {
    if (!content || !enabled) return false;
    content.updateWorldMatrix(true, true);
    const bounds = new THREE.Box3().setFromObject(content);
    if (bounds.isEmpty()) content.getWorldPosition(center); else bounds.getCenter(center);
    return isWorldPointInsideChamberCylinder(center, chamber, chamberCylinder, local);
  }
  function canAccept(slot, content, resolveFamilyCode, expectedFamilyKey) {
    if (disposed || !enabled || slot.state !== states.EMPTY || !content
      || isModeActive() !== true || openInteraction?.getState?.() !== 'OPEN'
      || activateInteraction?.getState?.() !== 'IDLE' || !isNear(content)) return false;
    const expectedRecipe = getExpectedRecipe();
    return expectedRecipe !== null
      && resolveFamilyCode(content) === expectedRecipe[expectedFamilyKey];
  }
  function accept(slot, content, takeHeld, resolveFamilyCode, expectedFamilyKey) {
    if (!canAccept(slot, content, resolveFamilyCode, expectedFamilyKey) || takeHeld(content) !== true) return false;
    slot.content = content;
    slot.anchor.attach(content);
    slot.startPosition.copy(content.position);
    slot.startQuaternion.copy(content.quaternion);
    slot.elapsed = 0;
    slot.state = config.snapDuration > 0 ? states.SNAPPING : states.INSERTED;
    if (slot.state === states.INSERTED) {
      content.position.set(0, 0, 0);
      content.quaternion.identity();
    }
    emitChange();
    return true;
  }
  function updateSlot(slot, delta) {
    if (slot.state !== states.SNAPPING || !slot.content) return;
    slot.elapsed = Math.min(config.snapDuration, slot.elapsed + delta);
    const progress = smoothstep(slot.elapsed / Math.max(config.snapDuration, 1e-6));
    slot.content.position.lerpVectors(slot.startPosition, new THREE.Vector3(), progress);
    slot.content.quaternion.slerpQuaternions(slot.startQuaternion, new THREE.Quaternion(), progress);
    if (slot.elapsed < config.snapDuration) return;
    slot.content.position.set(0, 0, 0);
    slot.content.quaternion.identity();
    slot.state = states.INSERTED;
    emitChange();
  }
  function update(delta = 0) {
    if (disposed) return;
    const step = Math.max(0, Number.isFinite(delta) ? delta : 0);
    accept(shell, reportedHeldShell, takeHeldShell,
      (content) => resolveAttractorShellGlyph(content)?.familyCode ?? null, 'shellFamilyCode');
    accept(smallGlyph, reportedHeldSmallGlyph, takeHeldSmallGlyph,
      (content) => resolveVrSmallGlyphProtoAstro(content)?.descriptor?.familyCode ?? null, 'smallGlyphFamilyCode');
    updateSlot(shell, step);
    updateSlot(smallGlyph, step);
    reportedHeldShell = null;
    reportedHeldSmallGlyph = null;
  }
  function restoreSlot(slot) {
    const content = slot.content;
    slot.content = null;
    slot.state = states.EMPTY;
    slot.elapsed = 0;
    if (content) slot.restore(content);
    return Boolean(content);
  }
  function resetSession() {
    if (disposed) return;
    reportedHeldShell = null;
    reportedHeldSmallGlyph = null;
    const restoredSmallGlyph = restoreSlot(smallGlyph);
    const restoredShell = restoreSlot(shell);
    if (restoredSmallGlyph || restoredShell) emitChange();
  }
  function resetBaseline() { resetSession(); }
  function canConsumeInsertedIngredients(expected = {}) {
    return !disposed && smallGlyph.state === states.INSERTED && shell.state === states.INSERTED
      && smallGlyph.content !== null && shell.content !== null
      && (!expected.smallGlyph || expected.smallGlyph === smallGlyph.content)
      && (!expected.shell || expected.shell === shell.content)
      && smallGlyphSystem.getInstances().includes(smallGlyph.content)
      && shellSystem.getRecord(shell.content) !== null;
  }
  function consumeInsertedIngredients(expected = {}) {
    if (!canConsumeInsertedIngredients(expected)) return false;
    const glyph = smallGlyph.content;
    const insertedShell = shell.content;
    if (!smallGlyphSystem.consumeInstance(glyph))
      throw new Error('Small glyph system rejected a known rune recipe ingredient.');
    if (!shellSystem.consumeInstance(insertedShell))
      throw new Error('Shell system rejected a known rune recipe ingredient.');
    smallGlyph.content = null; smallGlyph.state = states.EMPTY; smallGlyph.elapsed = 0;
    shell.content = null; shell.state = states.EMPTY; shell.elapsed = 0;
    emitChange();
    return true;
  }
  function dispose() {
    if (disposed) return;
    resetSession();
    disposed = true;
    listeners.clear();
  }

  return {
    reportHeldShell: (content) => { reportedHeldShell = content ?? null; },
    reportHeldSmallGlyph: (content) => { reportedHeldSmallGlyph = content ?? null; },
    update,
    resetSession,
    resetBaseline,
    canConsumeInsertedIngredients,
    consumeInsertedIngredients,
    dispose,
    subscribe(listener) {
      if (typeof listener !== 'function') throw new TypeError('Rune recipe listener must be a function.');
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    getSnapshot,
    hasSmallGlyph: () => smallGlyph.content !== null,
    hasShell: () => shell.content !== null,
    hasBothIngredients: () => smallGlyph.content !== null && shell.content !== null,
    getInsertedSmallGlyph: () => smallGlyph.content,
    getInsertedShell: () => shell.content,
    diagnostics: {
      enabled,
      anchorsReady,
      get active() { return !disposed && isModeActive() === true; },
      get smallGlyphOccupied() { return smallGlyph.content !== null; },
      get shellOccupied() { return shell.content !== null; },
      get complete() { return smallGlyph.content !== null && shell.content !== null; },
      get smallGlyphParentName() { return smallGlyph.content?.parent?.name ?? null; },
      get shellParentName() { return shell.content?.parent?.name ?? null; }
    }
  };
}
