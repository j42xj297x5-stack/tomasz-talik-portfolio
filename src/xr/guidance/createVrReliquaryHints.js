import { VR_MONKEY_COMMUNICATION_COPY_PL } from './vrMonkeyCommunicationCopy.js';
import { VR_MONKEY_DIALOGUE_PRIORITY } from './createVrMonkeyGuide.js';

export const VR_RELIQUARY_HINT_COPY = Object.freeze({
  pl: Object.freeze({ inserted: VR_MONKEY_COMMUNICATION_COPY_PL.hints['hint.reliquary.inserted'].blocks[0],
    active: VR_MONKEY_COMMUNICATION_COPY_PL.hints['hint.reliquary.active'].blocks[0] }),
  en: Object.freeze({ inserted: 'Activate the Crystal and reveal its meaning.', active: 'It can now be released. It has fulfilled its purpose.' })
});

export function createVrReliquaryHints({ monkeyGuide, getInsertedInstance, onHintTimeout, locale = 'en', delay = 15 }) {
  const copy = VR_RELIQUARY_HINT_COPY[locale === 'pl' ? 'pl' : 'en'];
  const owner = Symbol('VrReliquaryHint');
  let instance = null, phase = null, elapsed = 0, fired = false, shown = false, pending = false;
  function clearOverride() {
    monkeyGuide.cancelDialogueAttention(owner);
    monkeyGuide.releaseDialogue(owner);
  }
  function reset() { clearOverride(); instance = null; phase = null; elapsed = 0; fired = false; shown = false; pending = false; }
  function acquireHint() {
    if (!pending || !fired || shown || !phase) return false;
    const hintPhase = phase;
    const override = { onMonkeyPress() {
      if (!monkeyGuide.ownsDialogue(owner)) return true;
      shown = true; pending = false;
      monkeyGuide.showDialogueMessage(owner, copy[hintPhase]);
      monkeyGuide.releaseDialogue(owner);
      return true;
    } };
    const acquired = monkeyGuide.tryAcquireDialogue(owner, override, {
      priority: VR_MONKEY_DIALOGUE_PRIORITY.OPTIONAL,
      onPreempt() {
        if (!monkeyGuide.ownsDialogue(owner)) return;
        monkeyGuide.cancelDialogueAttention(owner);
        monkeyGuide.releaseDialogue(owner);
      }
    });
    if (!acquired) return false;
    monkeyGuide.notifyDialogueAttention(owner);
    return true;
  }
  function update(delta = 0) {
    const current = getInsertedInstance?.() ?? null;
    const currentPhase = ['inserted', 'active'].includes(current?.state) ? current.state : null;
    if (!currentPhase) { reset(); return; }
    if (current !== instance || currentPhase !== phase) {
      clearOverride(); instance = current; phase = currentPhase; elapsed = 0; fired = false; shown = false; pending = false;
    }
    if (fired) { acquireHint(); return; }
    elapsed += Math.max(0, delta);
    if (elapsed < delay) return;
    fired = true;
    onHintTimeout?.();
    acquireHint();
  }
  function showHint() {
    if (!fired || shown || !phase) return false;
    pending = true;
    acquireHint();
    return true;
  }
  return { update, showHint, reset, getSnapshot: () => ({ instance, phase, elapsed, fired, shown, pending }) };
}
