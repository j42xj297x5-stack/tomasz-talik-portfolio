import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { calculatePlayerRigYaw } from '../src/xr/playerRigOrientation.js';
import * as THREE from '../src/vendor/three.js';
import { createVrControllers } from '../src/xr/createVrControllers.js';
import { applyWorldTransform } from '../src/xr/applyWorldTransform.js';
import { createVrSemanticInput, XR_STANDARD_BUTTONS } from '../src/xr/input/createVrSemanticInput.js';
import { createVrHandModeController, VR_LEFT_HAND_MODES } from '../src/xr/input/createVrHandModeController.js';

const [main, vr, experience3d, vrControllers, glyphInteraction, entryTransition, spatialPlaque, crystalCollection, locomotion, portalDisplay, crystalReliquary, astroFurnace, furnacePanel, semanticInputSource, playerGuidePanelSource, playerGuideContentSource] = await Promise.all([
  readFile(new URL('../src/main.js', import.meta.url), 'utf8'),
  readFile(new URL('../src/experienceVr.js', import.meta.url), 'utf8'),
  readFile(new URL('../src/experience3d.js', import.meta.url), 'utf8'),
  readFile(new URL('../src/xr/createVrControllers.js', import.meta.url), 'utf8'),
  readFile(new URL('../src/xr/createVrGlyphInteraction.js', import.meta.url), 'utf8'),
  readFile(new URL('../src/xr/createVrEntryTransition.js', import.meta.url), 'utf8'),
  readFile(new URL('../src/xr/createVrSpatialPlaque.js', import.meta.url), 'utf8'),
  readFile(new URL('../src/xr/createVrCrystalCollection.js', import.meta.url), 'utf8'),
  readFile(new URL('../src/xr/createVrLocomotion.js', import.meta.url), 'utf8'),
  readFile(new URL('../src/xr/createVrPortalDisplay.js', import.meta.url), 'utf8'),
  readFile(new URL('../src/xr/createVrCrystalReliquary.js', import.meta.url), 'utf8'),
  readFile(new URL('../src/xr/furnace/createVrAstroFurnace.js', import.meta.url), 'utf8'),
  readFile(new URL('../src/xr/furnace/createVrAstroFurnacePanel.js', import.meta.url), 'utf8'),
  readFile(new URL('../src/xr/input/createVrSemanticInput.js', import.meta.url), 'utf8'),
  readFile(new URL('../src/xr/guidance/createVrPlayerGuidePanel.js', import.meta.url), 'utf8'),
  readFile(new URL('../src/xr/guidance/vrPlayerGuideContent.js', import.meta.url), 'utf8')
]);

assert.match(main, /await import\('\.\/experienceVr\.js'\)/);
assert.doesNotMatch(main, /^import .*experienceVr/m);
assert.match(vr, /renderer\.xr\.enabled = true/);
assert.match(vr, /requestSession\('immersive-vr'/);
assert.match(vr, /renderer\.setAnimationLoop\(renderFrame\)/);
assert.match(vr, /renderer\.setAnimationLoop\(null\)/);
assert.doesNotMatch(vr, /requestAnimationFrame/);
assert.match(vr, /await renderer\.xr\.setSession\(requestedSession\);\s*xrStartCalibrationPending = true;/,
  'session entry defers start calibration to an XR animation frame');
assert.match(vr, /if \(xrStartCalibrationPending\)[\s\S]*renderer\.xr\.updateCamera\(camera\)[\s\S]*calibrateXrHeadToPlatform/,
  'the pending frame refreshes the tracked camera before calibration');
assert.match(vr, /xrStartCalibrationPending = false;\s*introSequence\.beginAfterXrCalibration\(\);\s*if \(introQaBypass\) vrControllers\.setRaysEnabled\(true\);\s*renderer\.render\(scene, camera\);\s*return;/,
  'calibration is one-shot and skips ordinary locomotion/update work in that frame');
assert.match(vr, /function handleSessionEnd\(\)[\s\S]*xrStartCalibrationPending = false;[\s\S]*introSequence\.reset\(\)/,
  'session end clears pending calibration and resets the intro for re-entry');
assert.doesNotMatch(vr, /const trackedHead = renderer\.xr\.getCamera\(camera\)/,
  'the stale immediate post-setSession correction is removed');
assert.doesNotMatch(entryTransition, /requestAnimationFrame|performance\.now/);
assert.match(spatialPlaque, /new THREE\.CanvasTexture\(canvas\)/);
assert.match(spatialPlaque, /new THREE\.PlaneGeometry/);
assert.match(vr, /surface: portalDisplay\.canvasSurface/);
assert.doesNotMatch(spatialPlaque, /Raycaster|requestAnimationFrame|tween/i);
assert.doesNotMatch(spatialPlaque, /DOMOverlay|iframe|createElement\(['"](?:div|style)/i);
assert.doesNotMatch(vr, /cameraRig|createOverlay|createBackgroundAtmosphere|createGalaxySpritesLayer/);
assert.doesNotMatch(experience3d, /renderer\.xr|VRButton|immersive-vr|setAnimationLoop/);

const forwardFromYaw = (yaw) => ({ x: -Math.sin(yaw), z: -Math.cos(yaw) });
const assertFacesTarget = (position, lookAt) => {
  const yaw = calculatePlayerRigYaw(position, lookAt);
  const forward = forwardFromYaw(yaw);
  const targetLength = Math.hypot(lookAt.x - position.x, lookAt.z - position.z);
  assert.ok(targetLength > 0);
  assert.ok(Math.abs(forward.x - (lookAt.x - position.x) / targetLength) < 1e-12);
  assert.ok(Math.abs(forward.z - (lookAt.z - position.z) / targetLength) < 1e-12);
};

assertFacesTarget({ x: 0, y: 0, z: 6 }, { x: 0, y: 1, z: 0 });
assertFacesTarget({ x: -4, y: 2, z: 3 }, { x: 2, y: -5, z: -1 });
assert.equal(calculatePlayerRigYaw({ x: 1, y: 0, z: 1 }, { x: 1, y: 9, z: 1 }), 0);
assert.match(vr, /orientPlayerRig\(playerRig, settings\.spawn\.lookAt\)/);
assert.doesNotMatch(vr, /camera\.rotation|camera\.quaternion|camera\.lookAt/);
assert.doesNotMatch(entryTransition, /camera\.(position|rotation|quaternion)\.(set|copy)|playerRig\.rotation/);
assert.doesNotMatch(vr, /createVrEntryTransition|activatedEntryGlyph|entryReady/);
assert.match(vr, /onGlyphHoldComplete:[\s\S]*crystalCollection\.spawnOne/);
const glyphSpawnContract = vr.match(/onGlyphHoldComplete:[\s\S]*?\n  }\n}/)?.[0] ?? '';
assert.match(glyphSpawnContract, /node\.getWorldPosition/);
assert.match(glyphSpawnContract, /platformOrigin\.getWorldPosition/);
assert.doesNotMatch(glyphSpawnContract, /monkeyMotionRoot\.getWorldPosition/);
assert.doesNotMatch(glyphSpawnContract, /renderer\.xr|getCamera|getWorldDirection/);
assert.match(vr, /crystalCollection\.reset\(\);\s*activateButton\.reset\(\);\s*releaseButton\.reset\(\);\s*crystalReliquary\.reset\(\);\s*restorePortalWaitingState\(\);\s*locomotion\.reset\(\);\s*resetPlayerRigToSpawn\(\);/);
assert.match(vr, /function handleSessionEnd\(\)[\s\S]*restorePortalWaitingState\(\)/);
assert.match(vr, /crystalCollection\.update\(delta\)/);
assert.match(vr, /glyphOrbit\.update\(delta\)/);
assert.doesNotMatch(vr.match(/onComplete:[\s\S]*?\n  }\n}/)?.[0] ?? '', /portalDisplay\.place|portalCanvas\.hide/);
assert.match(vr, /function restorePortalWaitingState\(\)[\s\S]*portalCanvas\.show/);
assert.match(vr, /locomotion\.setLeftYawLocked\(playerGuidePanel\.isOpen\(\)\)/);
assert.match(vr, /locomotion\.update\(delta\)/);
assert.match(locomotion, /renderer\.xr\.getCamera\(camera\)/);
assert.match(locomotion, /renderer\.xr\.updateCamera\(camera\)/);
assert.match(locomotion, /xrCamera\.isArrayCamera/);
assert.match(locomotion, /playerRig\.position\.addScaledVector/);
assert.match(locomotion, /getPlatformViewerBasis/);
assert.match(locomotion, /constrainRadialStep/);
assert.match(locomotion, /setLeftYawLocked/);
assert.match(locomotion, /if \(!leftYawLocked\) playerRig\.rotateY/);
assert.doesNotMatch(locomotion, /(?:camera|xrCamera|viewerCamera)\.(?:position|rotation|quaternion)\.(?:set|copy|add)/);
assert.doesNotMatch(vr, /createVrGlyphPlaque|createVrPlaqueComposition/);
assert.match(vrControllers, /renderer\.xr\.getController\(0\)/);
assert.match(vrControllers, /renderer\.xr\.getController\(1\)/);
assert.match(glyphInteraction, /new THREE\.Raycaster\(\)/);
assert.match(glyphInteraction, /intersectObjects\(allRaycastObjects, true\)/);
assert.match(glyphInteraction, /objectToGlyph/);
assert.match(crystalCollection, /new THREE\.Raycaster\(\)/);
assert.match(crystalCollection, /currentCrystalHitDistance/);
assert.doesNotMatch(crystalCollection, /currentHit\s*=/);
assert.doesNotMatch(glyphInteraction, /SphereGeometry\(0\.31|VrEntryGlyphMarker|playerRig\.position|playerRig\.rotation/);
assert.doesNotMatch(`${vr}\n${vrControllers}`, /XRControllerModelFactory/);
assert.match(vr, /onPreview: \(page\) => portalCanvas\.show\(resolveExperienceVrPage\(page, language\)\)/);
assert.match(vr, /onCommit: \(page, \{ tierCompleted \}\)[\s\S]*progressFloor\.activatePage\(page\);[\s\S]*if \(tierCompleted\) progressFloor\.completeTier\(page\.order\)/);
assert.match(vr, /const monkeyActor = await loadMonkeyModel\(\{ scene: worldRoot, fallbackObject: centralPlaceholder, assetManager \}\);[\s\S]*motionRoot: monkeyMotionRoot[\s\S]*visualRoot: monkeyVisualRoot[\s\S]*stoneRoot: monkeyStoneRoot[\s\S]*model: monkeyModel[\s\S]*progressFloor\.object\.attach\(monkeyMotionRoot\);[\s\S]*progressFloor\.object\.attach\(monkeyStoneRoot\);/);
assert.match(vr, /apply\(\{ anchor: 'ANCHOR_MONKEY'[\s\S]*monkeyActor\.dockStoneToCanonicalMonkey\(\);/);
assert.doesNotMatch(vr, /progressFloor\.object\.add\(monkeyMotionRoot\)/);
assert.match(vr, /createVrPortalDisplay\([\s\S]*platformOrigin/);
assert.doesNotMatch(vr, /createVrPortalDisplay\([\s\S]*anchorObject: monkeyMotionRoot/);

assert.equal(XR_STANDARD_BUTTONS.togglePlayerGuidePanel, 5, 'LEFT Y uses the standard Y button slot');
assert.equal(XR_STANDARD_BUTTONS.toggleLeftTool, 4, 'LEFT X mapping is preserved');
assert.equal(XR_STANDARD_BUTTONS.toggleRightTool, 4, 'RIGHT A mapping is preserved');
const leftButtons = Array.from({ length: 6 }, () => ({ pressed: false, value: 0 }));
const rightButtons = Array.from({ length: 5 }, () => ({ pressed: false, value: 0 }));
const semanticInputRuntime = createVrSemanticInput({ renderer: { xr: { getSession: () => ({ inputSources: [
  { handedness: 'left', gamepad: { buttons: leftButtons, axes: [0, 0, 0, -0.8] } },
  { handedness: 'right', gamepad: { buttons: rightButtons, axes: [0, 0, 0, 0] } }
] }) } } });
leftButtons[5].pressed = true;
leftButtons[0].value = 0.72;
rightButtons[4].pressed = true;
rightButtons[0].value = 0.33;
rightButtons[1].value = 0.44;
let semanticState = semanticInputRuntime.update();
assert.equal(semanticState.togglePlayerGuidePanel, true, 'LEFT Y is edge-triggered');
assert.equal(semanticState.toggleRightTool, true, 'RIGHT A edge remains available');
assert.equal(semanticState.toggleLeftTool, false, 'LEFT X does not share the Y edge');
assert.equal(semanticState.leftPrimaryAction, 0.72, 'left trigger is exposed separately');
assert.equal(semanticState.primaryAction, 0.33, 'right trigger is preserved');
assert.equal(semanticState.grabAction, 0.44, 'right grab is preserved');
assert.equal(semanticState.leftStickY, -0.8, 'left joystick vertical axis is exposed');
semanticState = semanticInputRuntime.update();
assert.equal(semanticState.togglePlayerGuidePanel, false, 'held LEFT Y does not retrigger');
leftButtons[5].pressed = false;
semanticInputRuntime.update();
leftButtons[4].pressed = true;
semanticState = semanticInputRuntime.update();
assert.equal(semanticState.toggleLeftTool, true, 'LEFT X edge still works after Y release');
semanticInputRuntime.reset();
assert.equal(semanticInputRuntime.getState().leftPrimaryAction, 0);
assert.match(playerGuidePanelSource, /new THREE\.CanvasTexture\(canvas\)/);
assert.match(playerGuidePanelSource, /leftGrip\?\.add\?\.\(object\)/);
assert.match(playerGuidePanelSource, /togglePlayerGuidePanel/);
assert.doesNotMatch(playerGuidePanelSource, /leftPrimaryAction/, 'panel confirm must not use the left trigger/primary action');
assert.match(playerGuidePanelSource, /leftStickY/);
assert.match(playerGuideContentSource, /pl:[\s\S]*id: 'controls'[\s\S]*id: 'current-task'/, 'PL guide orders controls before current task');
assert.match(playerGuideContentSource, /en:[\s\S]*id: 'controls'[\s\S]*id: 'current-task'/, 'EN guide orders controls before current task');
assert.doesNotMatch(vr, /isPlayerGuidePanelOpen\(\) && record\.handedness === 'left'/, 'open panel alone must not block ordinary left interactions');
assert.match(vr, /playerGuidePanel\.reset\(\)/);
assert.match(vr, /playerGuidePanel\.dispose\(\)/);

assert.match(playerGuidePanelSource, /VIEW_STATE = Object\.freeze\(\{ MENU: 'MENU', DETAIL: 'DETAIL' \}\)/, 'panel uses explicit menu/detail state');
assert.match(playerGuidePanelSource, /viewState = VIEW_STATE\.MENU/);
assert.match(playerGuidePanelSource, /activeSectionId = null/, 'panel does not automatically open the first card');
assert.match(playerGuidePanelSource, /content\.menuHint/);
assert.match(playerGuidePanelSource, /content\.detailHint/);
assert.match(playerGuidePanelSource, /locale === 'pl' \? 'svg\/controllers_pl\.svg' : 'svg\/controllers_en\.svg'/, 'localized controller SVGs are loaded through base-safe publicPath');
assert.doesNotMatch(playerGuideContentSource, /Prawy drążek — ruch|Right stick — move/, 'duplicated controls list copy is removed');
assert.match(playerGuideContentSource, /Lewy drążek — wybór · X — otwórz · Y — zamknij/);
assert.match(playerGuideContentSource, /Left stick — select · X — open · Y — close/);
assert.match(playerGuideContentSource, /Lewy drążek — wybór · X — otwórz · Y — wróć/);
assert.match(playerGuideContentSource, /Left stick — select · X — open · Y — back/);
assert.match(playerGuidePanelSource, /controllersImage\.onload = null;\s*controllersImage\.onerror = null;/, 'panel dispose clears SVG image callbacks');
assert.match(playerGuidePanelSource, /function reset\(\)[\s\S]*setOpen\(false\)/, 'panel reset closes without recreating resources');
assert.match(vr, /isLeftToolToggleBlocked: \(\) => playerGuidePanel\.isOpen\(\)/, 'LEFT X is context-arbitrated by panel openness');
assert.doesNotMatch(vr, /isPlayerGuidePanelOpen\(\)[\s\S]{0,160}activateButton|isPlayerGuidePanelOpen\(\)[\s\S]{0,160}crystalCollection|isPlayerGuidePanelOpen\(\)[\s\S]{0,160}glyphInteraction/, 'panel openness is not used as a trigger/grip interaction blocker');

const leftToggleCalls = [];
const mockSemantic = {
  input: { toggleLeftTool: false, toggleRightTool: false, primaryAction: 0 },
  update() { return this.input; },
  reset() { this.input.toggleLeftTool = false; }
};
const handController = createVrHandModeController({
  controllers: [{ handedness: 'left', isConnected: true, ray: { visible: true } }, { handedness: 'right', isConnected: true, ray: { visible: true } }],
  semanticInput: mockSemantic,
  attractorTool: {
    setUnlocked() {}, attachToTargetRay() {}, setEquipped() {}, setTrigger() {}, update() {}, reset() {}, dispose() {}
  },
  asterionSphere: { equipTo: () => leftToggleCalls.push('equip'), unequip: () => leftToggleCalls.push('unequip') },
  isUnlocked: () => true,
  isAsterionAvailable: () => true,
  isLeftToolToggleBlocked: () => true
});
mockSemantic.input.toggleLeftTool = true;
handController.update(0.016);
assert.equal(handController.getLeftMode(), VR_LEFT_HAND_MODES.NORMAL_HAND, 'open panel X does not toggle Asterion');
assert.deepEqual(leftToggleCalls, ['unequip'], 'blocked X only keeps current left equipment synced');
const handControllerClosed = createVrHandModeController({
  controllers: [{ handedness: 'left', isConnected: true, ray: { visible: true } }, { handedness: 'right', isConnected: true, ray: { visible: true } }],
  semanticInput: mockSemantic,
  attractorTool: {
    setUnlocked() {}, attachToTargetRay() {}, setEquipped() {}, setTrigger() {}, update() {}, reset() {}, dispose() {}
  },
  asterionSphere: { equipTo: () => {}, unequip: () => {} },
  isUnlocked: () => true,
  isAsterionAvailable: () => true,
  isLeftToolToggleBlocked: () => false
});
handControllerClosed.update(0.016);
assert.equal(handControllerClosed.getLeftMode(), VR_LEFT_HAND_MODES.ASTERION_SPHERE, 'closed panel X toggles Asterion again');


assert.match(vr, /createVrAstroFurnace\([\s\S]*platformOrigin/);
assert.doesNotMatch(vr, /createVrAstroFurnace\([\s\S]*anchorObject: monkeyMotionRoot/);

assert.match(vr, /const platformFixturesRoot = new THREE\.Group\(\);\s*platformFixturesRoot\.name = 'VrPlatformFixturesRoot';[\s\S]*progressFloor\.object\.add\(platformFixturesRoot\);/);
assert.match(vr, /const platformOrigin = new THREE\.Group\(\);\s*platformOrigin\.name = 'VrPlatformOrigin';\s*platformOrigin\.position\.set\(0, 0, 0\);\s*platformOrigin\.quaternion\.identity\(\);\s*platformOrigin\.scale\.set\(1, 1, 1\);\s*progressFloor\.object\.add\(platformOrigin\);/);
assert.match(vr, /const floorPassengerRoot = new THREE\.Group\(\);\s*floorPassengerRoot\.name = 'VrFloorPassengerRoot';[\s\S]*progressFloor\.object\.add\(floorPassengerRoot\);/);
assert.match(vr, /const floorWalkRadius = glyphOrbit\.effectiveRadius;\s*floorPassengerRoot\.attach\(playerRig\);/);
assert.match(vr, /walkRadius: floorWalkRadius/);
assert.match(vr, /restorePortalWaitingState\(\);\s*platformFixturesRoot\.attach\(portalDisplay\.object\);\s*platformFixturesRoot\.attach\(astroFurnace\.object\);/);
assert.match(vr, /platformFixturesRoot\.attach\(crystalReliquary\.object\);\s*platformFixturesRoot\.attach\(crystalReliquary\.insertFeedback\);/);
assert.match(vr, /platformFixturesRoot\.attach\(furnacePanel\.object\);/);
assert.match(vr, /parent: portalDisplay\.object,[\s\S]*surface: portalDisplay\.canvasSurface/);
assert.match(vr, /crystalReliquary\.attachCompanion\(\{ id: 'activate'/);
assert.match(vr, /crystalReliquary\.attachCompanion\(\{ id: 'release'/);
assert.doesNotMatch(vr, /platformFixturesRoot\.attach\(monkeyMotionRoot\)|platformFixturesRoot\.add\(monkeyMotionRoot\)/);
assert.doesNotMatch(vr, /platformFixturesRoot\.(?:attach|add)\(playerRig\)/);
assert.doesNotMatch(vr, /progressFloor\.object\.(?:attach|add)\(playerRig\)/);
assert.doesNotMatch(vr, /platformFixturesRoot\.(?:attach|add)\(glyphRing\)|platformFixturesRoot\.(?:attach|add)\(shellSystem/);
assert.match(portalDisplay, /applyWorldTransform\(object, desiredWorldPosition, desiredWorldQuaternion\)/);
assert.match(crystalReliquary, /portalDisplay\.object\.getWorldPosition\(portalPosition\);[\s\S]*portalDisplay\.object\.getWorldQuaternion\(portalQuaternion\);[\s\S]*applyWorldTransform\(object, desiredWorldPosition, portalQuaternion\)/);
assert.match(crystalReliquary, /applyWorldTransform\(insertFeedback, sphere\.center, insertFeedback\.quaternion, insertFeedbackWorldScale\)/);
assert.match(astroFurnace, /resolveVrPlatformFixtureWorldPosition\([\s\S]*fixturePosition: settings\.position[\s\S]*applyWorldTransform\(object, desiredWorldPosition, desiredWorldQuaternion, desiredWorldScale\)/);
assert.doesNotMatch(astroFurnace, /mirrorObject/, 'furnace does not depend on the placed portal object');
assert.doesNotMatch(astroFurnace, /object\.position\.y = 0;[\s\S]*worldToLocal\(object\.position\)/);
assert.match(furnacePanel, /return \{ object: root/);
assert.match(furnacePanel, /applyWorldTransform\(root, desiredWorldPosition, desiredWorldQuaternion, desiredWorldScale\)/);

const assertFixturesAttachContract = () => {
  const sceneRoot = new THREE.Group();
  const floorRoot = new THREE.Group();
  floorRoot.name = 'VrTiltableFloorRoot';
  const fixturesRoot = new THREE.Group();
  fixturesRoot.name = 'VrPlatformFixturesRoot';
  floorRoot.add(fixturesRoot);
  sceneRoot.add(floorRoot);
  const fixtures = ['portal', 'reliquary', 'furnace', 'panel'].map((name, index) => {
    const fixture = new THREE.Group();
    fixture.name = name;
    fixture.position.set(index + 1, 0.25 * index, -index - 0.5);
    fixture.quaternion.setFromEuler(new THREE.Euler(0.1 * index, -0.2 * index, 0.05 * index));
    fixture.scale.setScalar(1 + index * 0.1);
    sceneRoot.add(fixture);
    return fixture;
  });
  sceneRoot.updateMatrixWorld(true);
  const before = fixtures.map((fixture) => ({
    position: fixture.getWorldPosition(new THREE.Vector3()),
    quaternion: fixture.getWorldQuaternion(new THREE.Quaternion()),
    scale: fixture.getWorldScale(new THREE.Vector3())
  }));
  fixtures.forEach((fixture) => fixturesRoot.attach(fixture));
  sceneRoot.updateMatrixWorld(true);
  fixtures.forEach((fixture, index) => {
    assert.equal(fixture.parent, fixturesRoot);
    assert.ok(fixture.getWorldPosition(new THREE.Vector3()).distanceTo(before[index].position) < 1e-12);
    assert.ok(fixture.getWorldQuaternion(new THREE.Quaternion()).angleTo(before[index].quaternion) < 1e-7);
    assert.ok(fixture.getWorldScale(new THREE.Vector3()).distanceTo(before[index].scale) < 1e-12);
  });
  floorRoot.quaternion.setFromEuler(new THREE.Euler(0.25, 0.4, -0.12));
  sceneRoot.updateMatrixWorld(true);
  fixtures.forEach((fixture, index) => {
    assert.ok(fixture.getWorldPosition(new THREE.Vector3()).distanceTo(before[index].position) > 1e-3);
    assert.ok(fixture.getWorldQuaternion(new THREE.Quaternion()).angleTo(before[index].quaternion) > 1e-3);
  });
  const desiredWorldPosition = new THREE.Vector3(0.8, 0.6, -1.1);
  const desiredWorldQuaternion = new THREE.Quaternion().setFromEuler(new THREE.Euler(0.3, -0.5, 0.1));
  const desiredWorldScale = new THREE.Vector3(1.2, 0.9, 1.1);
  applyWorldTransform(fixtures[0], desiredWorldPosition, desiredWorldQuaternion, desiredWorldScale);
  sceneRoot.updateMatrixWorld(true);
  assert.equal(fixtures[0].parent, fixturesRoot);
  assert.ok(fixtures[0].getWorldPosition(new THREE.Vector3()).distanceTo(desiredWorldPosition) < 1e-12);
  assert.ok(fixtures[0].getWorldQuaternion(new THREE.Quaternion()).angleTo(desiredWorldQuaternion) < 1e-7);
  assert.ok(fixtures[0].getWorldScale(new THREE.Vector3()).distanceTo(desiredWorldScale) < 1e-12);
};
assertFixturesAttachContract();


const assertPassengerAttachContract = () => {
  const sceneRoot = new THREE.Group();
  const floorRoot = new THREE.Group();
  floorRoot.name = 'VrTiltableFloorRoot';
  const passengerRoot = new THREE.Group();
  passengerRoot.name = 'VrFloorPassengerRoot';
  passengerRoot.position.set(0, 0, 0);
  passengerRoot.quaternion.identity();
  passengerRoot.scale.set(1, 1, 1);
  floorRoot.add(passengerRoot);
  sceneRoot.add(floorRoot);
  const rig = new THREE.Group(); rig.name = 'VrPlayerRig';
  const camera = new THREE.PerspectiveCamera();
  const controller = new THREE.Group();
  const grip = new THREE.Group();
  rig.add(camera, controller, grip);
  sceneRoot.add(rig);
  rig.position.set(0.5, 1.6, 2.5);
  rig.quaternion.setFromEuler(new THREE.Euler(0, 0.4, 0));
  rig.scale.setScalar(1.1);
  sceneRoot.updateMatrixWorld(true);
  const beforePosition = rig.getWorldPosition(new THREE.Vector3());
  const beforeQuaternion = rig.getWorldQuaternion(new THREE.Quaternion());
  const beforeScale = rig.getWorldScale(new THREE.Vector3());
  passengerRoot.attach(rig);
  sceneRoot.updateMatrixWorld(true);
  assert.equal(passengerRoot.parent, floorRoot, 'VrFloorPassengerRoot is a child of VrTiltableFloorRoot');
  assert.deepEqual(passengerRoot.position.toArray(), [0, 0, 0], 'VrFloorPassengerRoot has identity position');
  assert.ok(passengerRoot.quaternion.angleTo(new THREE.Quaternion()) < 1e-12, 'VrFloorPassengerRoot has identity rotation');
  assert.deepEqual(passengerRoot.scale.toArray(), [1, 1, 1], 'VrFloorPassengerRoot has identity scale');
  assert.equal(rig.parent, passengerRoot, 'playerRig is parented under passenger root');
  assert.equal(camera.parent, rig, 'camera remains child of playerRig');
  assert.equal(controller.parent, rig, 'controller remains child of playerRig');
  assert.equal(grip.parent, rig, 'grip remains child of playerRig');
  assert.ok(rig.getWorldPosition(new THREE.Vector3()).distanceTo(beforePosition) < 1e-12, 'attach preserves rig world position');
  assert.ok(rig.getWorldQuaternion(new THREE.Quaternion()).angleTo(beforeQuaternion) < 1e-7, 'attach preserves rig world quaternion');
  assert.ok(rig.getWorldScale(new THREE.Vector3()).distanceTo(beforeScale) < 1e-12, 'attach preserves rig world scale');
  floorRoot.quaternion.setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI / 4);
  sceneRoot.updateMatrixWorld(true);
  assert.ok(rig.getWorldQuaternion(new THREE.Quaternion()).angleTo(beforeQuaternion) > 1e-3, 'platform rotation carries playerRig as passenger');
};
assertPassengerAttachContract();

const assertMonkeyFloorAttachContract = (monkeyAnchor) => {
  const sceneRoot = new THREE.Group();
  const floorRoot = new THREE.Group();
  floorRoot.name = 'VrTiltableFloorRoot';
  floorRoot.position.set(0, -1.05, 0);
  floorRoot.rotation.set(0.1, 0.2, -0.05);
  sceneRoot.add(floorRoot);
  sceneRoot.add(monkeyAnchor);
  monkeyAnchor.position.set(1.25, 0.4, -2.5);
  monkeyAnchor.quaternion.setFromEuler(new THREE.Euler(0.3, -0.4, 0.2));
  monkeyAnchor.scale.setScalar(1.2);
  sceneRoot.updateMatrixWorld(true);
  const worldPositionBefore = monkeyAnchor.getWorldPosition(new THREE.Vector3());
  const worldQuaternionBefore = monkeyAnchor.getWorldQuaternion(new THREE.Quaternion());
  const worldScaleBefore = monkeyAnchor.getWorldScale(new THREE.Vector3());

  floorRoot.attach(monkeyAnchor);
  sceneRoot.updateMatrixWorld(true);

  assert.equal(monkeyAnchor.parent, floorRoot);
  assert.ok(monkeyAnchor.getWorldPosition(new THREE.Vector3()).distanceTo(worldPositionBefore) < 1e-12);
  assert.ok(monkeyAnchor.getWorldQuaternion(new THREE.Quaternion()).angleTo(worldQuaternionBefore) < 1e-7);
  assert.ok(monkeyAnchor.getWorldScale(new THREE.Vector3()).distanceTo(worldScaleBefore) < 1e-12);

  floorRoot.quaternion.multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI / 5));
  sceneRoot.updateMatrixWorld(true);

  assert.ok(monkeyAnchor.getWorldPosition(new THREE.Vector3()).distanceTo(worldPositionBefore) > 1e-3);
  assert.ok(monkeyAnchor.getWorldQuaternion(new THREE.Quaternion()).angleTo(worldQuaternionBefore) > 1e-3);
};
assertMonkeyFloorAttachContract(new THREE.Group());
assertMonkeyFloorAttachContract(new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshBasicMaterial()));
assert.doesNotMatch(crystalCollection, /CANNON|Ammo|Rapier|gravity|throwVelocity|linearVelocity|angularVelocity/i);
assert.doesNotMatch(vrControllers, /controller\.(position|rotation|quaternion)\.(set|copy)/);

const controllerObjects = [new THREE.Group(), new THREE.Group()];
const controllerGrips = [new THREE.Group(), new THREE.Group()];
const playerRig = new THREE.Group();
const controllerSystem = createVrControllers({
  renderer: { xr: { getController: (index) => controllerObjects[index], getControllerGrip: (index) => controllerGrips[index] } },
  playerRig,
  settings: { enabled: true, rayLength: 2.3, rayOpacity: 0.7, rayDiameter: 0.01, rayTipFraction: 0.08, rayRadialSegments: 6 }
});
assert.equal(controllerSystem.controllers.length, 2);
assert.equal(playerRig.children.length, 4);
const [left, right] = controllerSystem.controllers;
assert.equal(left.ray.visible, false);
assert.equal(left.grip, controllerGrips[0]);
assert.equal(left.holdSocket.parent, left.grip);
left.controller.dispatchEvent({ type: 'connected', data: { handedness: 'left', targetRayMode: 'tracked-pointer', profiles: ['meta-quest-touch-plus'] } });
right.controller.dispatchEvent({ type: 'connected', data: { targetRayMode: 'tracked-pointer' } });
assert.equal(left.handedness, 'left');
assert.deepEqual(left.controller.userData.xrInput.profiles, ['meta-quest-touch-plus']);
assert.equal(right.handedness, '');
assert.equal(left.ray.visible, false, 'connected ray remains hidden behind the global gate');
controllerSystem.setRaysEnabled(true);
assert.equal(left.ray.visible, true); assert.equal(right.ray.visible, true);
assert.equal(left.currentRayLength, 2.3);
assert.equal(left.ray.children.length, 2, 'ray uses a shaft and tapered mesh tip');
assert.equal(left.ray.children[0].geometry.parameters.radiusTop * 2, 0.01, 'ray shaft uses configured diameter');
controllerSystem.beginRayHitFrame();
left.reportRayHit(1.5);
left.reportRayHit(0.9);
right.reportRayHit(1.2);
controllerSystem.resolveVisualRayLength();
assert.equal(left.visualRayLength, 0.9, 'the nearest valid hit controls visual length');
assert.equal(right.visualRayLength, 1.2);
assert.equal(left.ray.children[0].scale.x, 1, 'shaft diameter scale remains constant');
assert.equal(left.ray.children[0].scale.z, 1, 'shaft diameter scale remains constant');
assert.ok(Math.abs(left.ray.children[1].position.z
  - left.ray.children[1].geometry.parameters.height * left.ray.children[1].scale.y / 2 + 0.9) < 1e-12,
  'tip ends at the resolved visual distance');
controllerSystem.beginRayHitFrame();
controllerSystem.resolveVisualRayLength();
assert.equal(left.visualRayLength, 2.3, 'a frame without hits restores maximum length');
left.controller.dispatchEvent({ type: 'selectstart' });
assert.equal(left.isSelecting, true);
assert.equal(left.ray.scale.z, 1);
assert.equal(left.currentRayLength, 2.3, 'select does not extend interaction range');
assert.equal(right.isSelecting, false);
left.controller.dispatchEvent({ type: 'selectend' });
assert.equal(left.isSelecting, false);
assert.equal(left.ray.scale.z, 1);
left.controller.dispatchEvent({ type: 'disconnected' });
assert.equal(left.ray.visible, false);
controllerSystem.setRaysEnabled(true); assert.equal(left.ray.visible, false, 'disconnected ray ignores the enabled gate');
assert.equal(left.isConnected, false);
assert.equal(left.nearestRayHitDistance, null);
assert.equal(left.visualRayLength, 2.3, 'disconnect clears shortened visual state');
assert.equal('xrInput' in left.controller.userData, false);
controllerSystem.dispose();
controllerSystem.dispose();
assert.equal(playerRig.children.length, 0);
left.controller.dispatchEvent({ type: 'connected', data: { handedness: 'left' } });
assert.equal(left.isConnected, false);

console.log('Experience VR static contract assertions passed');
