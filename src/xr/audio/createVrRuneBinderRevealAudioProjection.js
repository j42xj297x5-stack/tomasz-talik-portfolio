export const BINDER_REVEAL_AUDIO = Object.freeze([
  '/audio/creating_01.mp3',
  '/audio/creating_02.mp3',
  '/audio/creating_03.mp3'
]);

export function createVrRuneBinderRevealAudioProjection({ audioBridge }) {
  if (!audioBridge?.playOneShot) {
    throw new TypeError('[VrRuneBinderRevealAudioProjection] VrAudioBridge access is required.');
  }

  const presentedTransitions = new Set();
  let cursor = 0;
  let disposed = false;

  function presentReadinessTransitions(transitions) {
    if (disposed || !Array.isArray(transitions)) return;
    transitions.forEach((transition) => {
      if (transition?.previousState !== 'HIDDEN' || transition?.state !== 'DOCKED') return;
      const branchId = String(transition.branchId ?? '').toLowerCase();
      const key = `${branchId}:HIDDEN:DOCKED`;
      if (presentedTransitions.has(key)) return;

      presentedTransitions.add(key);
      const path = BINDER_REVEAL_AUDIO[cursor];
      cursor = (cursor + 1) % BINDER_REVEAL_AUDIO.length;
      audioBridge.playOneShot(path, 'WORLD');
    });
  }

  function reset() {
    if (disposed) return;
    presentedTransitions.clear();
    cursor = 0;
  }

  function dispose() {
    disposed = true;
    presentedTransitions.clear();
    cursor = 0;
  }

  return { presentReadinessTransitions, reset, dispose };
}
