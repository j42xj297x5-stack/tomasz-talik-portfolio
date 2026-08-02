export const VR_RIGHT_HAND_MODES = Object.freeze({
  NORMAL_HAND: 'NORMAL_HAND',
  ASTRO_ATTRACTOR: 'ASTRO_ATTRACTOR'
});

export function createVrHandModeController({ controllers, semanticInput, attractorTool, isUnlocked }) {
  let mode = VR_RIGHT_HAND_MODES.NORMAL_HAND;

  function update(deltaSeconds) {
    const input = semanticInput.update();
    const unlocked = Boolean(isUnlocked());
    attractorTool.setUnlocked(unlocked);
    const rightGrip = controllers.find((controller) => controller.handedness === 'right')?.grip ?? null;
    attractorTool.attachToGrip(rightGrip);
    if (!unlocked && mode !== VR_RIGHT_HAND_MODES.NORMAL_HAND) setMode(VR_RIGHT_HAND_MODES.NORMAL_HAND);
    if (unlocked && input.toggleRightTool) {
      setMode(mode === VR_RIGHT_HAND_MODES.NORMAL_HAND
        ? VR_RIGHT_HAND_MODES.ASTRO_ATTRACTOR
        : VR_RIGHT_HAND_MODES.NORMAL_HAND);
    }
    attractorTool.setTrigger(mode === VR_RIGHT_HAND_MODES.ASTRO_ATTRACTOR ? input.primaryAction : 0);
    attractorTool.update(deltaSeconds);
  }

  function setMode(nextMode) {
    mode = nextMode;
    attractorTool.setEquipped(mode === VR_RIGHT_HAND_MODES.ASTRO_ATTRACTOR);
  }

  function reset() {
    mode = VR_RIGHT_HAND_MODES.NORMAL_HAND;
    semanticInput.reset();
    attractorTool.reset();
  }

  function dispose() {
    reset();
    attractorTool.dispose();
  }

  return { update, reset, dispose, getMode: () => mode };
}
