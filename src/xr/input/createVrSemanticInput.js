const XR_STANDARD_BUTTONS = Object.freeze({
  primaryAction: 0,
  grabAction: 1,
  toggleLeftTool: 4,
  togglePlayerGuidePanel: 5,
  toggleRightTool: 4,
  switchRightToolBand: 5
});

const clamp01 = (value) => Math.min(1, Math.max(0, Number.isFinite(value) ? value : 0));
const applyAxisDeadzone = (value, deadzone = 0.1) => {
  const axis = Number.isFinite(value) ? value : 0;
  return Math.abs(axis) <= deadzone ? 0 : axis;
};

export function createVrSemanticInput({ renderer }) {
  let previousLeftTogglePressed = false;
  let previousRightTogglePressed = false;
  let previousPlayerGuideTogglePressed = false;
  let previousRightBandSwitchPressed = false;
  const state = {
    toggleLeftTool: false,
    toggleRightTool: false,
    togglePlayerGuidePanel: false,
    switchRightToolBand: false,
    primaryAction: 0,
    grabAction: 0,
    leftPrimaryAction: 0,
    leftGrabAction: 0,
    leftStickX: 0,
    leftStickY: 0
  };

  function update() {
    const sources = renderer?.xr?.getSession?.()?.inputSources ?? [];
    const leftSource = [...sources].find((source) => source.handedness === 'left' && source.gamepad);
    const rightSource = [...sources].find((source) => source.handedness === 'right' && source.gamepad);
    const leftButtons = leftSource?.gamepad?.buttons ?? [];
    const rightButtons = rightSource?.gamepad?.buttons ?? [];
    const leftTogglePressed = Boolean(leftButtons[XR_STANDARD_BUTTONS.toggleLeftTool]?.pressed);
    const rightTogglePressed = Boolean(rightButtons[XR_STANDARD_BUTTONS.toggleRightTool]?.pressed);
    const playerGuideTogglePressed = Boolean(leftButtons[XR_STANDARD_BUTTONS.togglePlayerGuidePanel]?.pressed);
    const rightBandSwitchPressed = Boolean(rightButtons[XR_STANDARD_BUTTONS.switchRightToolBand]?.pressed);
    const leftAxes = leftSource?.gamepad?.axes ?? [];
    state.toggleLeftTool = leftTogglePressed && !previousLeftTogglePressed;
    state.toggleRightTool = rightTogglePressed && !previousRightTogglePressed;
    state.togglePlayerGuidePanel = playerGuideTogglePressed && !previousPlayerGuideTogglePressed;
    state.switchRightToolBand = rightBandSwitchPressed && !previousRightBandSwitchPressed;
    state.primaryAction = clamp01(rightButtons[XR_STANDARD_BUTTONS.primaryAction]?.value);
    state.grabAction = clamp01(rightButtons[XR_STANDARD_BUTTONS.grabAction]?.value);
    state.leftPrimaryAction = clamp01(leftButtons[XR_STANDARD_BUTTONS.primaryAction]?.value);
    state.leftGrabAction = clamp01(leftButtons[XR_STANDARD_BUTTONS.grabAction]?.value);
    state.leftStickX = applyAxisDeadzone(leftAxes[2] ?? leftAxes[0] ?? 0);
    state.leftStickY = applyAxisDeadzone(leftAxes[3] ?? leftAxes[1] ?? 0);
    previousLeftTogglePressed = leftTogglePressed;
    previousRightTogglePressed = rightTogglePressed;
    previousPlayerGuideTogglePressed = playerGuideTogglePressed;
    previousRightBandSwitchPressed = rightBandSwitchPressed;
    return state;
  }

  function reset() {
    previousLeftTogglePressed = false;
    previousRightTogglePressed = false;
    previousPlayerGuideTogglePressed = false;
    previousRightBandSwitchPressed = false;
    state.toggleLeftTool = false;
    state.toggleRightTool = false;
    state.togglePlayerGuidePanel = false;
    state.switchRightToolBand = false;
    state.primaryAction = 0;
    state.grabAction = 0;
    state.leftPrimaryAction = 0;
    state.leftGrabAction = 0;
    state.leftStickX = 0;
    state.leftStickY = 0;
  }

  return { update, reset, getState: () => state };
}

export { XR_STANDARD_BUTTONS };
