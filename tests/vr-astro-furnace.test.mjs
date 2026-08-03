import assert from 'node:assert/strict';
import * as THREE from '../src/vendor/three.js';
import { calculateMirroredHorizontalPosition, createVrAstroFurnace } from '../src/xr/furnace/createVrAstroFurnace.js';
import { ASTRO_FURNACE_STATES, createVrAstroFurnaceOpenInteraction } from '../src/xr/furnace/createVrAstroFurnaceOpenInteraction.js';
import { ASTRO_FURNACE_PROCESS_STATES, createVrAstroFurnaceActivateInteraction, processRotationPulse01 } from '../src/xr/furnace/createVrAstroFurnaceActivateInteraction.js';
import { createVrAstroFurnaceOptionInteraction } from '../src/xr/furnace/createVrAstroFurnaceOptionInteraction.js';
import { normalizeExperienceVrSettings } from '../src/config/experienceVrSettings.js';

const colorDistanceToWhite = (color) => Math.hypot(1 - color.r, 1 - color.g, 1 - color.b);
const signedOrbitAngle = (point, center) => Math.atan2(point.z - center.z, point.x - center.x);
const signedAngleDelta = (from, to) => Math.atan2(Math.sin(to - from), Math.cos(to - from));

assert.equal(processRotationPulse01(0), 0);
assert.equal(processRotationPulse01(Math.PI), 1);
assert.ok(processRotationPulse01(Math.PI * 2) < 1e-12);

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
assert.equal(normalized.activateButton.emissionPressed, 5);
assert.equal(normalized.process.durationSeconds, 18);
assert.equal(normalized.process.spinupEnd, 0.14);
assert.equal(normalized.process.steadyEnd, 0.60);
assert.equal(normalized.process.extractionEnd, 0.84);
assert.equal(normalized.process.fireCellSteadyEmission, 4);
assert.equal(normalized.process.fireCellExtractionEmission, 10);
assert.ok(Math.abs((1 - normalized.process.extractionEnd) * normalized.process.durationSeconds - 2.88) < 1e-10,
  'cooldown occupies 16% of the 18 second process');
const normalizedProcess = normalizeExperienceVrSettings({ schemaVersion: 1, furnace: { process: {
  durationSeconds: 100, steadyRpm: 0, extractionSpeedMultiplier: 9, direction: 0,
  spinupEnd: 0.8, steadyEnd: 0.2, extractionEnd: -1,
  fireCellIdleEmission: -1, fireCellPulseHzMax: Number.NaN
} } }).furnace.process;
assert.equal(normalizedProcess.durationSeconds, 60);
assert.equal(normalizedProcess.steadyRpm, 1);
assert.equal(normalizedProcess.extractionSpeedMultiplier, 4);
assert.equal(normalizedProcess.direction, -1);
assert.ok(normalizedProcess.spinupEnd < normalizedProcess.steadyEnd
  && normalizedProcess.steadyEnd < normalizedProcess.extractionEnd);
assert.equal(normalizedProcess.fireCellIdleEmission, 0);
assert.equal(normalizedProcess.fireCellPulseHzMax, 4);

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
  const activateButton = new THREE.Group(); activateButton.name = 'button_activate';
  activateButton.add(new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.2, 0.05), new THREE.MeshStandardMaterial())); model.add(activateButton);
  const activatePivot = new THREE.Group(); activatePivot.name = 'PIVOT_BUTTON_ACTIVATE'; model.add(activatePivot);
  const spinPivot = new THREE.Group(); spinPivot.name = 'PIVOT_FURNACE_PROCESS_SPIN'; model.add(spinPivot);
  const lid = new THREE.Group(); lid.name = 'pokrywa'; lid.rotation.x = 0.37; model.add(lid);
  const fireCell = new THREE.Group(); fireCell.name = 'fire_cell';
  fireCell.add(new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, 0.1), new THREE.MeshStandardMaterial({
    color: new THREE.Color(0.4, 0.2, 0.1), emissive: new THREE.Color(0.3, 0.05, 0.01), emissiveIntensity: 0.25
  })));
  model.add(fireCell);
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
  if (omitClip !== 'AstroFurnace_ButtonActivate_Lock') animations.push(new THREE.AnimationClip(
    'AstroFurnace_ButtonActivate_Lock', 0.1,
    [new THREE.VectorKeyframeTrack('PIVOT_BUTTON_ACTIVATE.position', [0, 0.1], [0, 0, 0, 0, 0, -0.02])]
  ));
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

const processController = new THREE.Group(); processController.position.z = 1;
const processRecord = { controller: processController, handedness: 'left', currentRayLength: 3,
  hitReports: [], reportRayHit(distance) { this.hitReports.push(distance); } };
const processFurnace = buildInteractiveFurnace();
processFurnace.nodes.button_activate.getWorldPosition(processController.position);
processController.position.z += 1;
let allowInput = false;
let activateInteraction = null;
const processOpen = createVrAstroFurnaceOpenInteraction({
  furnace: processFurnace, controllers: [processRecord], settings: { enabled: true, rayMaxDistance: 3 },
  canToggle: () => !activateInteraction?.isProcessing(),
  onOpeningStart: () => activateInteraction?.releaseForOpening()
});
activateInteraction = createVrAstroFurnaceActivateInteraction({
  furnace: processFurnace, controllers: [processRecord], openInteraction: processOpen,
  settings: { enabled: true, rayMaxDistance: 3, emissionInactive: 0, emissionHover: 1, emissionPressed: 5 },
  processSettings: { durationSeconds: 1, steadyRpm: 60, extractionSpeedMultiplier: 2, direction: -1,
    spinupEnd: 0.14, steadyEnd: 0.60, extractionEnd: 0.84, fireCellIdleEmission: 0.15,
    fireCellSteadyEmission: 4, fireCellExtractionEmission: 10, fireCellPulseHzMin: 0.7, fireCellPulseHzMax: 4 },
  canActivateInput: () => allowInput
});
const fireMaterial = processFurnace.nodes.fire_cell.children[0].material;
const baseFireColor = fireMaterial.color.clone();
const baseFireEmissive = fireMaterial.emissive.clone();
const baseFireIntensity = fireMaterial.emissiveIntensity;
assert.equal(activateInteraction.canActivate(), false, 'production activation requires an input');
processOpen.update(0);
assert.equal(processOpen.halo.visible, true, 'open button has a halo in stable CLOSED state');
activateInteraction.update(0);
assert.equal(activateInteraction.halo.visible, false, 'forbidden activate hit has no halo');
allowInput = true;
activateInteraction.update(0);
assert.equal(activateInteraction.hasCurrentHit(processRecord), true);
assert.equal(activateInteraction.halo.visible, true, 'allowed ordinary-ray hit has a halo');
assert.ok(processRecord.hitReports.length > 0);
assert.equal(activateInteraction.press(processRecord), true);
assert.equal(activateInteraction.getState(), ASTRO_FURNACE_PROCESS_STATES.PRESSING);
assert.equal(activateInteraction.halo.visible, false);
assert.equal(processOpen.press(processRecord), false, 'open is blocked while the process is pressing');
activateInteraction.update(0.11);
assert.equal(activateInteraction.getState(), ASTRO_FURNACE_PROCESS_STATES.SPINUP,
  'process starts from the exact lock action finished event');
const lidQuaternion = processFurnace.nodes.pokrywa.quaternion.clone();
activateInteraction.update(0.10);
assert.equal(activateInteraction.getState(), ASTRO_FURNACE_PROCESS_STATES.SPINUP, 'spinup remains smooth but ends at 14%');
assert.notEqual(processFurnace.nodes.fire_cell.children[0].material.emissiveIntensity, 0.25,
  'fire cell emission responds to process speed');
activateInteraction.update(0.06);
assert.equal(activateInteraction.getState(), ASTRO_FURNACE_PROCESS_STATES.STEADY);
assert.ok(activateInteraction.processLight.visible && activateInteraction.processLight.intensity > 0);
assert.equal(activateInteraction.processLight.castShadow, false);
assert.equal(activateInteraction.processLight.parent, processFurnace.object, 'process light uses the stable furnace root');
assert.notEqual(activateInteraction.processLight.parent, processFurnace.nodes.komora);
assert.ok(Math.abs(activateInteraction.processLight.userData.lightAngle + activateInteraction.getProcessAngle()) < 1e-12,
  'process light angle is exactly the negative process angle');
const steadySpeed = Math.abs(activateInteraction.getAngularSpeed());
const steadyAngle = activateInteraction.getProcessAngle();
const expectedSteadyPulse = THREE.MathUtils.lerp(0.05, 4, processRotationPulse01(steadyAngle));
assert.ok(Math.abs(fireMaterial.emissiveIntensity - expectedSteadyPulse) < 1e-10,
  'fire-cell pulse is derived from the accumulated process angle');
const orbitCenter = activateInteraction.processLight.userData.orbitCenter;
const chamberOrbitBefore = signedOrbitAngle(activateInteraction.processLight.userData.chamberOrbitPosition, orbitCenter);
const lightOrbitBefore = signedOrbitAngle(activateInteraction.processLight.position, orbitCenter);
activateInteraction.update(0.02);
const chamberOrbitDelta = signedAngleDelta(chamberOrbitBefore,
  signedOrbitAngle(activateInteraction.processLight.userData.chamberOrbitPosition, orbitCenter));
const lightOrbitDelta = signedAngleDelta(lightOrbitBefore, signedOrbitAngle(activateInteraction.processLight.position, orbitCenter));
assert.ok(chamberOrbitDelta * lightOrbitDelta < 0, 'chamber and PointLight have opposite signed motion in the stable furnace root');
assert.ok(Math.abs(Math.abs(chamberOrbitDelta) - Math.abs(lightOrbitDelta)) < 1e-10,
  'both stable-space orbits have the same absolute angular speed');
assert.ok(colorDistanceToWhite(fireMaterial.emissive) < colorDistanceToWhite(baseFireEmissive),
  'steady emission color moves toward white');
const steadyAngleBeforeStep = activateInteraction.getProcessAngle();
activateInteraction.update(0.4);
const steadyAngleStep = Math.abs(activateInteraction.getProcessAngle() - steadyAngleBeforeStep);
activateInteraction.update(0.05);
assert.equal(activateInteraction.getState(), ASTRO_FURNACE_PROCESS_STATES.EXTRACTION);
activateInteraction.update(0.08);
assert.ok(Math.abs(activateInteraction.getAngularSpeed()) > steadySpeed * 1.8,
  'extraction approaches twice the steady RPM');
const extractionAngleBeforeStep = activateInteraction.getProcessAngle();
activateInteraction.update(0.04);
const extractionAngleStep = Math.abs(activateInteraction.getProcessAngle() - extractionAngleBeforeStep);
assert.ok(extractionAngleStep / 0.04 > steadyAngleStep / 0.4,
  'angle-driven pulse frequency rises with extraction RPM');
assert.ok(fireMaterial.emissiveIntensity >= 0.05, 'extraction emission stays within the configured angle pulse');
assert.ok(colorDistanceToWhite(fireMaterial.emissive) < 0.1,
  'extraction emissive color becomes nearly white');
assert.ok(processFurnace.nodes.pokrywa.quaternion.equals(lidQuaternion), 'the lid never rotates during processing');
const beforeCooldownQuaternion = processFurnace.nodes.PIVOT_FURNACE_PROCESS_SPIN.quaternion.clone();
activateInteraction.update(0.11);
assert.equal(activateInteraction.getState(), ASTRO_FURNACE_PROCESS_STATES.COOLDOWN);
assert.ok(beforeCooldownQuaternion.angleTo(processFurnace.nodes.PIVOT_FURNACE_PROCESS_SPIN.quaternion) < Math.PI,
  'entering cooldown does not introduce a quaternion snap');
assert.ok(Math.abs(activateInteraction.getAngularSpeed()) > steadySpeed,
  'cooldown begins with substantial extraction inertia');
activateInteraction.update(0.16);
assert.equal(activateInteraction.getState(), ASTRO_FURNACE_PROCESS_STATES.COMPLETE);
assert.equal(activateInteraction.processLight.visible, false); assert.equal(activateInteraction.processLight.intensity, 0);
assert.ok(processFurnace.nodes.PIVOT_FURNACE_PROCESS_SPIN.quaternion.equals(new THREE.Quaternion()),
  'spin pivot returns exactly to its base quaternion');
assert.equal(activateInteraction.action.time, activateInteraction.action.getClip().duration,
  'activate remains pressed in COMPLETE');
assert.ok(fireMaterial.color.equals(baseFireColor), 'COMPLETE restores the exact base material color');
assert.ok(fireMaterial.emissive.equals(baseFireEmissive), 'COMPLETE restores the exact base emissive color');
assert.equal(fireMaterial.emissiveIntensity, baseFireIntensity, 'COMPLETE restores the exact base emissive intensity');
processOpen.hits.set(processRecord, true);
assert.equal(processOpen.press(processRecord), true, 'open is enabled again in COMPLETE');
assert.equal(processOpen.getState(), ASTRO_FURNACE_STATES.OPENING);
assert.equal(activateInteraction.action.timeScale, -1, 'opening immediately starts reverse release');
activateInteraction.update(0.11);
assert.equal(activateInteraction.getState(), ASTRO_FURNACE_PROCESS_STATES.IDLE);
activateInteraction.reset(); activateInteraction.reset();
assert.equal(activateInteraction.processLight.visible, false, 'process light is inactive in IDLE');
assert.ok(fireMaterial.color.equals(baseFireColor) && fireMaterial.emissive.equals(baseFireEmissive)
  && fireMaterial.emissiveIntensity === baseFireIntensity, 'reset restores every fire-cell material base value');
assert.equal(processController._listeners.selectstart.length, 2, 'resets do not duplicate open and activate listeners');
activateInteraction.dispose();
assert.equal(processController._listeners.selectstart.length, 1, 'activate disposal removes only its own listener');
processOpen.dispose(); processFurnace.dispose();

const qaFurnace = buildInteractiveFurnace();
const qaOpen = createVrAstroFurnaceOpenInteraction({ furnace: qaFurnace, controllers: [], settings: { enabled: true } });
const qaInteraction = createVrAstroFurnaceActivateInteraction({ furnace: qaFurnace, controllers: [],
  openInteraction: qaOpen, settings: { enabled: true }, qaAllowWithoutInput: true });
assert.equal(qaInteraction.canActivate(), true, 'QA mode permits activation without an implemented input');
qaInteraction.dispose(); qaOpen.dispose(); qaFurnace.dispose();

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

{
  const optionFurnace = buildInteractiveFurnace(); let moduleListener = null;
  optionFurnace.nodes.PIVOT_BUTTON_OPTION = new THREE.Group(); optionFurnace.object.add(optionFurnace.nodes.PIVOT_BUTTON_OPTION);
  const panel = { isVisible: () => false, toggle() {}, subscribeModuleActivation(listener) { moduleListener = listener; return () => { moduleListener = null; }; } };
  const option = createVrAstroFurnaceOptionInteraction({ furnace: optionFurnace, panel, controllers: [],
    settings: { enabled: true, selectionDuration: .5, moduleAnglesDegrees: { floor_gyroscope_sphere: 90 } } });
  assert.equal(moduleListener('floor_gyroscope_sphere'), true); option.update(.25);
  assert.ok(optionFurnace.nodes.PIVOT_BUTTON_OPTION.rotation.y > 0 && optionFurnace.nodes.PIVOT_BUTTON_OPTION.rotation.y < Math.PI / 2);
  assert.ok(Math.abs(optionFurnace.nodes.PIVOT_BUTTON_OPTION.rotation.z) < 1e-12, 'option tween uses local Three.js Y only');
  option.update(.25); assert.ok(Math.abs(optionFurnace.nodes.PIVOT_BUTTON_OPTION.rotation.y - Math.PI / 2) < 1e-7);
  assert.equal(option.getActiveMode(), 'floor_gyroscope_sphere');
  assert.equal(moduleListener('floor_gyroscope_sphere'), true); option.update(.5);
  assert.ok(Math.abs(optionFurnace.nodes.PIVOT_BUTTON_OPTION.rotation.y - Math.PI / 2) < 1e-7, 'reselection is idempotent');
  option.dispose(); optionFurnace.dispose();
}
console.log('VR Astro furnace assertions passed');
