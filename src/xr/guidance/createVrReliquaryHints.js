import { createVrMandatoryMonkeyCommunication } from './createVrMandatoryMonkeyCommunication.js';
import { VR_MONKEY_COMMUNICATION_COPY_PL } from './vrMonkeyCommunicationCopy.js';
import { VR_MONKEY_DIALOGUE_PRIORITY } from './createVrMonkeyGuide.js';

export const VR_RELIQUARY_HINT_COPY = Object.freeze({
  pl: Object.freeze({ inserted: VR_MONKEY_COMMUNICATION_COPY_PL.hints['hint.reliquary.inserted'].blocks[0],
    active: VR_MONKEY_COMMUNICATION_COPY_PL.hints['hint.reliquary.active'].blocks[0] }),
  en: Object.freeze({ inserted: 'Activate the Crystal and reveal its meaning.', active: 'It can now be released. It has fulfilled its purpose.' })
});

const PRE_PLAYBACK_PHASES = Object.freeze(['WAITING', 'ATTENTION', 'AUTO_DELAY']);

export function createVrReliquaryHints({ monkeyGuide, knowledgeResolver, getInsertedInstance, onHintTimeout,
  locale = 'en', delay = 15 }) {
  const copy = VR_RELIQUARY_HINT_COPY[locale === 'pl' ? 'pl' : 'en'];
  let instance = null, phase = null, elapsed = 0, fired = false, shown = false, pending = false;
  let communication = null;
  const mutateFallback = (method, ...args) => {
    const changed = knowledgeResolver?.[method]?.(...args) === true;
    if (changed) monkeyGuide.refreshKnowledge();
  };

  function cancelPrePlaybackCommunication() {
    if (!PRE_PLAYBACK_PHASES.includes(communication?.getPhase())) return;
    communication.reset();
    communication = null;
  }
  function clearPhase() {
    cancelPrePlaybackCommunication();
    instance = null; phase = null; elapsed = 0; fired = false; shown = false; pending = false;
  }
  function beginCommunication() {
    if (!pending || !fired || shown || !phase || communication) return false;
    const hintPhase = phase;
    let actor;
    actor = createVrMandatoryMonkeyCommunication({
      monkeyGuide,
      blocks: [copy[hintPhase]],
      priority: VR_MONKEY_DIALOGUE_PRIORITY.OPTIONAL,
      requiresAttention: false,
      autoPlaybackDelaySeconds: 1.0,
      onAutoPlaybackCue: () => monkeyGuide.playAttentionCue(),
      onTriggered() {
        shown = true;
        pending = false;
        actor.beginPlayback();
      },
      onCompleted() {
        mutateFallback('publishTransientHintFallback', 'reliquary-context', `hint.reliquary.${hintPhase}`);
        if (communication === actor) communication = null;
      }
    });
    communication = actor;
    actor.beginAttention();
    return true;
  }
  function update(delta = 0) {
    const current = getInsertedInstance?.() ?? null;
    const currentPhase = ['inserted', 'active'].includes(current?.state) ? current.state : null;
    if (!currentPhase) {
      mutateFallback('withdrawTransientHintFallback', 'reliquary-context');
      clearPhase(); return;
    }
    if (current !== instance || currentPhase !== phase) {
      mutateFallback('withdrawTransientHintFallback', 'reliquary-context');
      cancelPrePlaybackCommunication();
      instance = current; phase = currentPhase; elapsed = 0; fired = false; shown = false; pending = false;
    }
    communication?.update(delta);
    if (fired) { beginCommunication(); return; }
    elapsed += Math.max(0, delta);
    if (elapsed < delay) return;
    fired = true;
    onHintTimeout?.();
  }
  function showHint() {
    if (!fired || shown || !phase) return false;
    pending = true;
    beginCommunication();
    return true;
  }
  function reset() {
    communication?.reset();
    communication = null;
    clearPhase();
  }
  return { update, showHint, reset, getSnapshot: () => ({ instance, phase, elapsed, fired, shown, pending }) };
}
