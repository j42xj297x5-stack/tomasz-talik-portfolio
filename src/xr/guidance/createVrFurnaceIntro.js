export const VR_FURNACE_INTRO_COPY = Object.freeze([
  'Spójrz na Piec.',
  'Tam coś na ciebie czeka.'
]);

const NEXT = Object.freeze({ id: 'furnace-intro-next', label: 'DALEJ' });

// This actor continues the already-open authored Monkey moment. It owns only
// presentation/acknowledgement state; the Furnace and Scenario remain external.
export function createVrFurnaceIntro({ monkeyGuide, revealFurnace, onCompleted = () => {} }) {
  if (!monkeyGuide) throw new TypeError('monkeyGuide is required');
  if (typeof revealFurnace !== 'function') throw new TypeError('revealFurnace is required');
  let state = 'IDLE', lineIndex = -1, completionSent = false, override = null;

  function install() {
    override = { options: [NEXT], onMonkeyPress: () => false, onSelect(id) {
      if (state !== 'ACTIVE' || id !== NEXT.id) return false;
      if (lineIndex === 0) { lineIndex = 1; monkeyGuide.showMessage(VR_FURNACE_INTRO_COPY[1]); return true; }
      state = 'COMPLETED'; monkeyGuide.setDialogueOverride(null); override = null;
      if (!completionSent) { completionSent = true; onCompleted(); }
      return true;
    } };
    monkeyGuide.setDialogueOverride(override);
  }

  function begin() {
    if (state !== 'IDLE') return false;
    // Reveal precedes the first line so the referenced object is already visible.
    if (revealFurnace() === false) return false;
    state = 'ACTIVE'; lineIndex = 0; monkeyGuide.showMessage(VR_FURNACE_INTRO_COPY[0]); install();
    return true;
  }
  function reset() {
    if (override && monkeyGuide.hasDialogueOverride?.()) monkeyGuide.setDialogueOverride(null);
    state = 'IDLE'; lineIndex = -1; completionSent = false; override = null;
  }
  return { begin, reset, getState: () => state, getLineIndex: () => lineIndex, getCopy: () => [...VR_FURNACE_INTRO_COPY] };
}
