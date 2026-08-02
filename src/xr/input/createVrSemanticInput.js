const XR_STANDARD_BUTTONS = Object.freeze({
  primaryAction: 0,
  grabAction: 1,
  toggleRightTool: 4
});

const clamp01 = (value) => Math.min(1, Math.max(0, Number.isFinite(value) ? value : 0));

export function createVrSemanticInput({ renderer }) {
  let previousTogglePressed = false;
  const state = {
    toggleRightTool: false,
    primaryAction: 0,
    grabAction: 0
  };

  function update() {
    const sources = renderer?.xr?.getSession?.()?.inputSources ?? [];
    const rightSource = [...sources].find((source) => source.handedness === 'right' && source.gamepad);
    const buttons = rightSource?.gamepad?.buttons ?? [];
    const togglePressed = Boolean(buttons[XR_STANDARD_BUTTONS.toggleRightTool]?.pressed);
    state.toggleRightTool = togglePressed && !previousTogglePressed;
    state.primaryAction = clamp01(buttons[XR_STANDARD_BUTTONS.primaryAction]?.value);
    state.grabAction = clamp01(buttons[XR_STANDARD_BUTTONS.grabAction]?.value);
    previousTogglePressed = togglePressed;
    return state;
  }

  function reset() {
    previousTogglePressed = false;
    state.toggleRightTool = false;
    state.primaryAction = 0;
    state.grabAction = 0;
  }

  return { update, reset, getState: () => state };
}

export { XR_STANDARD_BUTTONS };
