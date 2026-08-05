const XR_STANDARD_BUTTONS = Object.freeze({
  primaryAction: 0,
  grabAction: 1,
  toggleLeftTool: 4,
  toggleRightTool: 4
});

const clamp01 = (value) => Math.min(1, Math.max(0, Number.isFinite(value) ? value : 0));

export function createVrSemanticInput({ renderer }) {
  let previousLeftTogglePressed = false;
  let previousRightTogglePressed = false;
  const state = {
    toggleLeftTool: false,
    toggleRightTool: false,
    primaryAction: 0,
    grabAction: 0
  };

  function update() {
    const sources = renderer?.xr?.getSession?.()?.inputSources ?? [];
    const leftSource = [...sources].find((source) => source.handedness === 'left' && source.gamepad);
    const rightSource = [...sources].find((source) => source.handedness === 'right' && source.gamepad);
    const leftButtons = leftSource?.gamepad?.buttons ?? [];
    const rightButtons = rightSource?.gamepad?.buttons ?? [];
    const leftTogglePressed = Boolean(leftButtons[XR_STANDARD_BUTTONS.toggleLeftTool]?.pressed);
    const rightTogglePressed = Boolean(rightButtons[XR_STANDARD_BUTTONS.toggleRightTool]?.pressed);
    state.toggleLeftTool = leftTogglePressed && !previousLeftTogglePressed;
    state.toggleRightTool = rightTogglePressed && !previousRightTogglePressed;
    state.primaryAction = clamp01(rightButtons[XR_STANDARD_BUTTONS.primaryAction]?.value);
    state.grabAction = clamp01(rightButtons[XR_STANDARD_BUTTONS.grabAction]?.value);
    previousLeftTogglePressed = leftTogglePressed;
    previousRightTogglePressed = rightTogglePressed;
    return state;
  }

  function reset() {
    previousLeftTogglePressed = false;
    previousRightTogglePressed = false;
    state.toggleLeftTool = false;
    state.toggleRightTool = false;
    state.primaryAction = 0;
    state.grabAction = 0;
  }

  return { update, reset, getState: () => state };
}

export { XR_STANDARD_BUTTONS };
