import assert from 'node:assert/strict';
import * as THREE from '../src/vendor/three.js';
import { calculateMirroredHorizontalPosition, createVrAstroFurnace } from '../src/xr/furnace/createVrAstroFurnace.js';
import { ASTRO_FURNACE_STATES, createVrAstroFurnaceOpenInteraction } from '../src/xr/furnace/createVrAstroFurnaceOpenInteraction.js';
import { normalizeExperienceVrSettings } from '../src/config/experienceVrSettings.js';

const center = new THREE.Vector3(1, 4, -2);
assert.deepEqual(calculateMirroredHorizontalPosition(center, new THREE.Vector3(-2, 20, 3)).toArray(), [4, 4, -7]);
const normalized = normalizeExperienceVrSettings({ schemaVersion: 1, furnace: {
  placementMode: 'unknown', floorOffset: 20, scale: 99,
  openButton: { rayMaxDistance: 30, emissionPressed: 3 }, chamber: { glassFadeStart: -1 }
} }).furnace;
assert.equal(normalized.placementMode, 'mirror-portal');
assert.equal(normalized.floorOffset, 2);
assert.equal(normalized.scale, 10);
assert.equal(normalized.openButton.rayMaxDistance, 5);
assert.equal(normalized.openButton.emissionPressed, 3);
assert.equal(normalized.chamber.glassFadeStart, 0);

const parent = new THREE.Group();
const anchor = new THREE.Mesh(new THREE.BoxGeometry(2, 2, 2)); anchor.position.set(1, 1, -2);
const portal = new THREE.Group(); portal.position.set(-2, 9, 3);
const placementModel = new THREE.Group(); placementModel.add(new THREE.Mesh(new THREE.BoxGeometry(1, 2, 1)));
parent.add(anchor, portal);
const placementSettings = { enabled: true, placementMode: 'mirror-portal', floorOffset: 0,
  position: { x: 0, y: 0, z: 0 }, rotationDegrees: { x: 0, y: 0, z: 0 }, scale: 3, debug: false };
const placedFurnace = createVrAstroFurnace({ parent, model: placementModel, settings: placementSettings,
  anchorObject: anchor, mirrorObject: portal, spawnPosition: { x: 0, y: 0, z: 5 } });
assert.deepEqual(placedFurnace.object.position.toArray(), [4, 3, -7]);
assert.equal(placedFurnace.object.scale.x, 3);
assert.ok(Math.abs(new THREE.Box3().setFromObject(placedFurnace.object).min.y) < 1e-10);
portal.position.x = -3;
placedFurnace.reset();
assert.equal(placedFurnace.object.position.x, 5);
assert.equal(parent.children.filter((child) => child.name === 'VrAstroFurnace').length, 1);
placedFurnace.dispose();

const clipNames = {
  PIVOT_BUTTON_OPEN: 'AstroFurnace_ButtonOpen_Press',
  PIVOT_FURNACE_LATCH_LEFT: 'AstroFurnace_Chamber_Open_LatchLeft',
  PIVOT_FURNACE_LATCH_RIGHT: 'AstroFurnace_Chamber_Open_LatchRight',
  PIVOT_FURNACE_LATCH_TOP: 'AstroFurnace_Chamber_Open_LatchTop',
  PIVOT_FURNACE_LID_Z: 'AstroFurnace_Chamber_Open_Lid',
  PIVOT_FURNACE_CHAMBER_Z: 'AstroFurnace_Chamber_Open_Chamber'
};
function buildInteractiveFurnace({ omitClip = null } = {}) {
  const model = new THREE.Group(); model.name = 'ASTRO_FURNACE_ROOT';
  Object.keys(clipNames).forEach((name) => { const pivot = new THREE.Group(); pivot.name = name; model.add(pivot); });
  const button = new THREE.Group(); button.name = 'button_open';
  button.add(new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.2, 0.05), new THREE.MeshStandardMaterial())); model.add(button);
  const chamber = new THREE.Group(); chamber.name = 'komora';
  chamber.add(new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 0.5), new THREE.MeshStandardMaterial({
    transparent: true, opacity: 0.6, depthWrite: false
  }))); model.add(chamber);
  const animations = Object.entries(clipNames).filter(([, clipName]) => clipName !== omitClip).map(([node, clipName]) => {
    const values = node === 'PIVOT_BUTTON_OPEN'
      ? [0, 0, 0, 0, 0, -0.02, 0, 0, 0]
      : [0, 0, 0, 0.1, 0, 0];
    const times = node === 'PIVOT_BUTTON_OPEN' ? [0, 0.05, 0.1] : [0, 0.2];
    return new THREE.AnimationClip(clipName, -1, [new THREE.VectorKeyframeTrack(`${node}.position`, times, values)]);
  });
  const settings = { enabled: true, placementMode: 'configured', floorOffset: 0, position: { x: 0, y: 0, z: 0 },
    rotationDegrees: { x: 0, y: 0, z: 0 }, scale: 1, debug: false };
  return createVrAstroFurnace({ parent: new THREE.Group(), model, animations, settings, spawnPosition: { x: 0, z: 1 } });
}
const controller = new THREE.Group();
const record = { controller, handedness: 'left', currentRayLength: 3, reportRayHit() {} };
const furnace = buildInteractiveFurnace();
const interaction = createVrAstroFurnaceOpenInteraction({ furnace, controllers: [record], settings: {
  enabled: true, rayMaxDistance: 3, emissionInactive: 0, emissionHover: 1, emissionPressed: 4,
  chamber: { glassFadeStart: 0.2, glassFadeEnd: 1 }
} });
assert.equal(interaction.getState(), ASTRO_FURNACE_STATES.CLOSED);
assert.equal(interaction.isOpen(), false);
assert.equal(interaction.canInsert(), false);
interaction.hits.set(record, true);
assert.equal(interaction.press(record), true);
assert.equal(interaction.getState(), ASTRO_FURNACE_STATES.OPENING);
assert.equal(interaction.press(record), false, 'a second press is ignored during opening');
interaction.update(0.1);
assert.ok(furnace.nodes.komora.children[0].material.opacity < 0.6);
interaction.update(0.2);
assert.equal(interaction.getState(), ASTRO_FURNACE_STATES.OPEN);
assert.equal(interaction.canInsert(), true);
interaction.hits.set(record, true);
assert.equal(interaction.press(record), true);
assert.equal(interaction.getState(), ASTRO_FURNACE_STATES.CLOSING);
interaction.update(0.3);
assert.equal(interaction.getState(), ASTRO_FURNACE_STATES.CLOSED);
assert.equal(furnace.nodes.komora.children[0].material.opacity, 0.6);
assert.deepEqual(furnace.nodes.PIVOT_FURNACE_LATCH_LEFT.position.toArray(), [0, 0, 0]);
interaction.reset(); interaction.reset();
assert.equal(controller._listeners.selectstart.length, 1, 'reset does not duplicate controller listeners');
interaction.dispose(); furnace.dispose();

const warnings = [];
const originalWarn = console.warn;
console.warn = (...args) => warnings.push(args);
const incompleteFurnace = buildInteractiveFurnace({ omitClip: 'AstroFurnace_Chamber_Open_Lid' });
const incomplete = createVrAstroFurnaceOpenInteraction({ furnace: incompleteFurnace, controllers: [], settings: { enabled: true } });
console.warn = originalWarn;
assert.equal(incomplete.capabilityReady, false);
assert.equal(incomplete.getState(), ASTRO_FURNACE_STATES.CLOSED);
assert.ok(incompleteFurnace.object.visible, 'missing clip disables only open/close capability');
assert.equal(warnings.filter(([message]) => String(message).includes('open/close interaction is disabled')).length, 1);
incomplete.dispose(); incompleteFurnace.dispose();
console.log('VR Astro furnace assertions passed');
