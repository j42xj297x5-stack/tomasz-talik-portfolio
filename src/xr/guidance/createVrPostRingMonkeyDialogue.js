export const VR_POST_RING_MONKEY_DIALOGUE_COPY = Object.freeze([
  'No i świat przestał być uprzejmy.',
  'To, czego potrzebujesz, jest teraz poza zasięgiem.',
  'Na szczęście nie na długo.'
]);

const NEXT_OPTION = Object.freeze({ id: 'post-ring-next', label: 'DALEJ' });

export function createVrPostRingMonkeyDialogue({ monkeyGuide, onCompleted = () => {} }) {
  if (!monkeyGuide) throw new TypeError('monkeyGuide is required');
  let state = 'IDLE';
  let lineIndex = -1;
  let completionSent = false;
  let override = null;

  function installOverride(options = []) {
    override = {
      options,
      onMonkeyPress() {
        if (state !== 'AVAILABLE') return false;
        state = 'ACTIVE';
        lineIndex = 0;
        monkeyGuide.showMessage(VR_POST_RING_MONKEY_DIALOGUE_COPY[lineIndex]);
        installOverride([NEXT_OPTION]);
        return true;
      },
      onSelect(id) {
        if (state !== 'ACTIVE' || id !== NEXT_OPTION.id) return false;
        if (lineIndex < VR_POST_RING_MONKEY_DIALOGUE_COPY.length - 1) {
          lineIndex += 1;
          monkeyGuide.showMessage(VR_POST_RING_MONKEY_DIALOGUE_COPY[lineIndex]);
          return true;
        }
        state = 'COMPLETED';
        monkeyGuide.setDialogueOverride(null);
        monkeyGuide.open();
        if (!completionSent) { completionSent = true; onCompleted(); }
        return true;
      }
    };
    monkeyGuide.setDialogueOverride(override);
  }

  function begin() {
    if (state !== 'IDLE') return false;
    state = 'AVAILABLE';
    installOverride();
    monkeyGuide.notifyAttention();
    return true;
  }

  function reset() {
    if (override && monkeyGuide.hasDialogueOverride()) monkeyGuide.setDialogueOverride(null);
    override = null;
    state = 'IDLE';
    lineIndex = -1;
    completionSent = false;
  }

  return {
    begin, reset,
    getState: () => state,
    getLineIndex: () => lineIndex
  };
}
