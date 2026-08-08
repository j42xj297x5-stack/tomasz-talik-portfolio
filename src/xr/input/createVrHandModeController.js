export const VR_RIGHT_HAND_MODES = Object.freeze({
  NORMAL_HAND: 'NORMAL_HAND',
  ASTRO_ATTRACTOR: 'ASTRO_ATTRACTOR'
});

export const VR_LEFT_HAND_MODES = Object.freeze({
  NORMAL_HAND: 'NORMAL_HAND',
  ASTERION_SPHERE: 'ASTERION_SPHERE'
});

export function createVrHandModeController({
  controllers,
  semanticInput,
  attractorTool,
  asterionSphere = null,
  isUnlocked,
  isAsterionAvailable = () => false,
  isLeftToolToggleBlocked = () => false
}) {
  let rightMode = VR_RIGHT_HAND_MODES.NORMAL_HAND;
  let leftMode = VR_LEFT_HAND_MODES.NORMAL_HAND;

  function update(deltaSeconds) {
    const input = semanticInput.update();
    const unlocked = Boolean(isUnlocked());
    const asterionAvailable = Boolean(isAsterionAvailable());
    const rightRecord = findRecord('right');
    const leftRecord = findRecord('left');

    attractorTool.setUnlocked(unlocked);
    attractorTool.attachToTargetRay(rightRecord?.controller ?? null);

    if (!unlocked && rightMode !== VR_RIGHT_HAND_MODES.NORMAL_HAND) setRightMode(VR_RIGHT_HAND_MODES.NORMAL_HAND);
    if (!asterionAvailable && leftMode !== VR_LEFT_HAND_MODES.NORMAL_HAND) setLeftMode(VR_LEFT_HAND_MODES.NORMAL_HAND);

    if (unlocked && input.toggleRightTool) {
      setRightMode(rightMode === VR_RIGHT_HAND_MODES.NORMAL_HAND
        ? VR_RIGHT_HAND_MODES.ASTRO_ATTRACTOR
        : VR_RIGHT_HAND_MODES.NORMAL_HAND);
    }
    if (input.toggleLeftTool && !isLeftToolToggleBlocked()) {
      if (leftMode === VR_LEFT_HAND_MODES.ASTERION_SPHERE) setLeftMode(VR_LEFT_HAND_MODES.NORMAL_HAND);
      else if (asterionAvailable) setLeftMode(VR_LEFT_HAND_MODES.ASTERION_SPHERE);
    }

    if (rightMode === VR_RIGHT_HAND_MODES.NORMAL_HAND) attractorTool.setEquipped(false);
    attractorTool.setTrigger(rightMode === VR_RIGHT_HAND_MODES.ASTRO_ATTRACTOR ? input.primaryAction : 0);
    syncRightRay(rightRecord);
    syncLeftEquipment(leftRecord);
    syncLeftRay(leftRecord);
    attractorTool.update(deltaSeconds);
  }

  function findRecord(handedness) {
    return controllers.find((record) => record.handedness === handedness) ?? null;
  }

  function syncRightRay(rightRecord = findRecord('right')) {
    if (rightRecord?.ray) rightRecord.ray.visible = rightRecord.isConnected && rightMode === VR_RIGHT_HAND_MODES.NORMAL_HAND;
  }

  function syncLeftRay(leftRecord = findRecord('left')) {
    if (leftRecord?.ray) leftRecord.ray.visible = leftRecord.isConnected && leftMode === VR_LEFT_HAND_MODES.NORMAL_HAND;
  }

  function syncLeftEquipment(leftRecord = findRecord('left')) {
    if (leftMode === VR_LEFT_HAND_MODES.ASTERION_SPHERE) {
      if (leftRecord?.isConnected) asterionSphere?.equipTo?.(leftRecord);
    } else {
      asterionSphere?.unequip?.();
    }
  }

  function setRightMode(nextMode) {
    rightMode = nextMode;
    attractorTool.setEquipped(rightMode === VR_RIGHT_HAND_MODES.ASTRO_ATTRACTOR);
    syncRightRay();
  }

  function setLeftMode(nextMode) {
    leftMode = nextMode;
    syncLeftEquipment();
    syncLeftRay();
  }

  function equipLeftAsterion() {
    if (!isAsterionAvailable() || isLeftToolToggleBlocked()) return false;
    setLeftMode(VR_LEFT_HAND_MODES.ASTERION_SPHERE);
    return leftMode === VR_LEFT_HAND_MODES.ASTERION_SPHERE;
  }

  function reset() {
    leftMode = VR_LEFT_HAND_MODES.NORMAL_HAND;
    rightMode = VR_RIGHT_HAND_MODES.NORMAL_HAND;
    semanticInput.reset();
    attractorTool.reset();
    asterionSphere?.unequip?.();
    syncLeftRay();
    syncRightRay();
  }

  function dispose() {
    reset();
    attractorTool.dispose();
  }

  return {
    update,
    reset,
    dispose,
    getMode: () => rightMode,
    getRightMode: () => rightMode,
    getLeftMode: () => leftMode,
    equipLeftAsterion
  };
}
