import assert from 'node:assert/strict';
import * as THREE from '../src/vendor/three.js';
import { createVrSmallGlyphAttractorInteraction } from '../src/xr/glyphs/createVrSmallGlyphAttractorInteraction.js';
import { createVrSemanticInput, XR_STANDARD_BUTTONS } from '../src/xr/input/createVrSemanticInput.js';
import { createVrHandModeController, VR_ATTRACTOR_BANDS,
  VR_LEFT_HAND_MODES, VR_RIGHT_HAND_MODES } from '../src/xr/input/createVrHandModeController.js';

function button({ pressed = false, value = 0 } = {}) { return { pressed, value }; }
function source(handedness, buttons = []) { return { handedness, gamepad: { buttons } }; }
function rendererFor(getSources) { return { xr: { getSession: () => ({ inputSources: getSources() }) } }; }

{
  let leftButtons = [];
  let rightButtons = [];
  const semanticInput = createVrSemanticInput({ renderer: rendererFor(() => [source('left', leftButtons), source('right', rightButtons)]) });
  leftButtons[XR_STANDARD_BUTTONS.toggleLeftTool] = button({ pressed: false });
  rightButtons[XR_STANDARD_BUTTONS.toggleRightTool] = button({ pressed: false });
  assert.equal(semanticInput.update().toggleLeftTool, false, 'released X does not toggle left tool');
  leftButtons[XR_STANDARD_BUTTONS.toggleLeftTool] = button({ pressed: true });
  let input = semanticInput.update();
  assert.equal(input.toggleLeftTool, true, 'left X toggles on rising edge');
  assert.equal(input.toggleRightTool, false, 'left X does not toggle right tool');
  assert.equal(semanticInput.update().toggleLeftTool, false, 'holding X does not toggle left tool again');
  assert.equal(semanticInput.update().toggleLeftTool, false, 'holding X across many updates emits one toggle');
  leftButtons[XR_STANDARD_BUTTONS.toggleLeftTool] = button({ pressed: false });
  assert.equal(semanticInput.update().toggleLeftTool, false, 'X release does not toggle');
  leftButtons[XR_STANDARD_BUTTONS.toggleLeftTool] = button({ pressed: true });
  assert.equal(semanticInput.update().toggleLeftTool, true, 'pressing X again after release emits a second toggle');
  leftButtons[XR_STANDARD_BUTTONS.toggleLeftTool] = button({ pressed: false });
  semanticInput.update();
  rightButtons[XR_STANDARD_BUTTONS.toggleRightTool] = button({ pressed: true });
  input = semanticInput.update();
  assert.equal(input.toggleRightTool, true, 'right toggle still works independently');
  assert.equal(input.toggleLeftTool, false, 'right toggle does not toggle left tool');
  semanticInput.reset();
  rightButtons[XR_STANDARD_BUTTONS.toggleRightTool] = button({ pressed: true });
  assert.equal(semanticInput.update().toggleRightTool, true, 'reset clears right rising-edge memory');
}

function makeControllerHarness({ asterionAvailable = true, rightUnlocked = true } = {}) {
  let input = { toggleLeftTool: false, toggleRightTool: false, primaryAction: 0, grabAction: 0 };
  const leftRay = { visible: true };
  const rightRay = { visible: true };
  const left = { handedness: 'left', isConnected: true, grip: {}, controller: {}, ray: leftRay };
  const right = { handedness: 'right', isConnected: true, grip: {}, controller: {}, ray: rightRay };
  const attractor = {
    equipped: false,
    trigger: 0,
    resetCalled: false,
    setUnlocked(value) { this.unlocked = value; },
    attachToTargetRay(target) { this.target = target; },
    setEquipped(value) { this.equipped = value; },
    setTrigger(value) { this.trigger = value; },
    update() {},
    reset() { this.resetCalled = true; this.equipped = false; this.trigger = 0; },
    dispose() {}
  };
  const sphere = {
    equipped: false,
    equippedRecord: null,
    equipTo(record) { this.equipped = true; this.equippedRecord = record; return true; },
    unequip() { this.equipped = false; this.equippedRecord = null; },
    isEquipped() { return this.equipped; }
  };
  const controller = createVrHandModeController({
    controllers: [left, right],
    semanticInput: { update: () => input, reset: () => { input = { toggleLeftTool: false, toggleRightTool: false, primaryAction: 0, grabAction: 0 }; } },
    attractorTool: attractor,
    asterionSphere: sphere,
    isUnlocked: () => rightUnlocked,
    isAsterionAvailable: () => asterionAvailable
  });
  return { controller, sphere, attractor, left, right, setInput: (next) => { input = { ...input, ...next }; } };
}

{
  const h = makeControllerHarness();
  assert.equal(h.controller.getLeftMode(), VR_LEFT_HAND_MODES.NORMAL_HAND, 'left starts normal');
  assert.equal(h.controller.getRightMode(), VR_RIGHT_HAND_MODES.NORMAL_HAND, 'right starts normal');
  h.setInput({ toggleLeftTool: true }); h.controller.update(0.016);
  assert.equal(h.controller.getLeftMode(), VR_LEFT_HAND_MODES.ASTERION_SPHERE, 'X switches left to Asterion Sphere');
  assert.equal(h.controller.getRightMode(), VR_RIGHT_HAND_MODES.NORMAL_HAND, 'X leaves right mode unchanged');
  assert.equal(h.sphere.equipped, true, 'Asterion mode equips sphere');
  assert.equal(h.sphere.equippedRecord, h.left, 'Asterion equips to left record');
  assert.equal(h.left.ray.visible, false, 'Asterion mode hides left ray');
  assert.equal(h.right.ray.visible, true, 'Asterion mode does not affect right ray');
  h.setInput({ toggleLeftTool: false, toggleRightTool: true }); h.controller.update(0.016);
  assert.equal(h.controller.getRightMode(), VR_RIGHT_HAND_MODES.ASTRO_ATTRACTOR, 'right toggle switches right to Astro Attractor');
  assert.equal(h.controller.getLeftMode(), VR_LEFT_HAND_MODES.ASTERION_SPHERE, 'right toggle leaves left Asterion equipped');
  assert.equal(h.right.ray.visible, false, 'Astro Attractor hides right ray');
  assert.equal(h.left.ray.visible, false, 'right toggle does not affect left ray');
  h.setInput({ toggleLeftTool: true, toggleRightTool: false }); h.controller.update(0.016);
  assert.equal(h.controller.getLeftMode(), VR_LEFT_HAND_MODES.NORMAL_HAND, 'second X switches left back to normal');
  assert.equal(h.sphere.equipped, false, 'normal left mode unequips sphere');
  assert.equal(h.left.ray.visible, true, 'normal left mode restores connected left ray');
  assert.equal(h.controller.getRightMode(), VR_RIGHT_HAND_MODES.ASTRO_ATTRACTOR, 'left unequip leaves right mode unchanged');
  assert.equal(h.controller.getMode(), h.controller.getRightMode(), 'getMode remains a right-mode compatibility alias');
  h.controller.reset();
  assert.equal(h.controller.getLeftMode(), VR_LEFT_HAND_MODES.NORMAL_HAND, 'reset restores left normal');
  assert.equal(h.controller.getRightMode(), VR_RIGHT_HAND_MODES.NORMAL_HAND, 'reset restores right normal');
}

{
  const parent = new THREE.Group(), rightController = new THREE.Group(); parent.add(rightController);
  const toolCalls = [];
  const interaction = createVrSmallGlyphAttractorInteraction({
    controllers: [{ handedness: 'right', controller: rightController, isConnected: true }],
    smallGlyphSystem: { object: parent, getInstances: () => [], getState: () => 'MATERIALIZED',
      getFieldTransform: () => null, restoreInstanceToField: () => false, placeInstance: () => false },
    handModeController: { getRightMode: () => VR_RIGHT_HAND_MODES.NORMAL_HAND,
      getLeftMode: () => VR_LEFT_HAND_MODES.NORMAL_HAND,
      getAttractorBand: () => VR_ATTRACTOR_BANDS.SMALL_GLYPHS },
    semanticInput: { getState: () => ({ primaryAction: 0, grabAction: 0 }) },
    attractorTool: { setTarget: (value) => toolCalls.push(['target', value]),
      setPullStrength: (value) => toolCalls.push(['strength', value]),
      setState: (value) => toolCalls.push(['state', value]),
      getMasterRingWorldPosition: (target) => target.set(0, 0, 0) },
    maxTargetDistance: 10,
    settings: { scanThreshold: 0.1, triggerThreshold: 0.1, captureForwardDistance: 1.3,
      pullAcceleration: 10, maxPullSpeed: 8.5, captureRadius: 0.28, returnDuration: 0.8,
      scanCone: { color: 0xffff00, halfAngleDegrees: 2.5, opacityMin: 0.035,
        opacityMax: 0.065, pulseDuration: 1.6, radialSegments: 14 } },
    haloSettings: {}, settledParent: parent
  });
  interaction.update(0.016);
  assert.deepEqual(toolCalls, [], 'small-glyph actor cannot mutate or reveal unequipped Astro in NORMAL_HAND');
  assert.equal(interaction.scanCone.object.visible, false, 'NORMAL_HAND clears the small-glyph scan cone');
  interaction.dispose();
}

{
  const h = makeControllerHarness({ asterionAvailable: false });
  h.setInput({ toggleLeftTool: true }); h.controller.update(0.016);
  assert.equal(h.controller.getLeftMode(), VR_LEFT_HAND_MODES.NORMAL_HAND, 'unavailable Asterion cannot be equipped by X');
  assert.equal(h.sphere.equipped, false, 'unavailable Asterion does not call equip');
  assert.equal(h.left.ray.visible, true, 'left ray remains visible when Asterion is unavailable');
}

{
  const h = makeControllerHarness();
  assert.equal(h.controller.equipLeftAsterion(), true, 'earned claim can request first equip through controller');
  assert.equal(h.controller.getLeftMode(), VR_LEFT_HAND_MODES.ASTERION_SPHERE);
  const unavailable = makeControllerHarness({ asterionAvailable: false });
  assert.equal(unavailable.controller.equipLeftAsterion(), false, 'public equip respects gameplay availability');
}
