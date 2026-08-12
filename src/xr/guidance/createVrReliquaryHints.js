export const VR_RELIQUARY_HINT_COPY = Object.freeze({
  pl: Object.freeze({ inserted: 'Aktywuj Kryształ, odsłoń jego znaczenie.', active: 'Można już go uwolnić. Spełnił swoją rolę.' }),
  en: Object.freeze({ inserted: 'Activate the Crystal and reveal its meaning.', active: 'It can now be released. It has fulfilled its purpose.' })
});

export function createVrReliquaryHints({ monkeyGuide, getInsertedInstance, locale = 'en', delay = 15 }) {
  const copy = VR_RELIQUARY_HINT_COPY[locale === 'pl' ? 'pl' : 'en'];
  let instance = null, phase = null, elapsed = 0, fired = false, ownsOverride = false;
  function clearOverride() { if (ownsOverride) { monkeyGuide.setDialogueOverride(null); ownsOverride = false; } }
  function reset() { clearOverride(); instance = null; phase = null; elapsed = 0; fired = false; }
  function update(delta = 0) {
    const current = getInsertedInstance?.() ?? null;
    const currentPhase = ['inserted', 'active'].includes(current?.state) ? current.state : null;
    if (!currentPhase) { reset(); return; }
    if (current !== instance || currentPhase !== phase) {
      clearOverride(); instance = current; phase = currentPhase; elapsed = 0; fired = false;
    }
    if (fired) return;
    elapsed += Math.max(0, delta);
    if (elapsed < delay) return;
    fired = true; monkeyGuide.notifyAttention(); ownsOverride = true;
    monkeyGuide.setDialogueOverride({ onMonkeyPress() {
      monkeyGuide.showMessage(copy[phase]); clearOverride(); return true;
    } });
  }
  return { update, reset, getSnapshot: () => ({ instance, phase, elapsed, fired }) };
}
