import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { calculatePlayerRigYaw } from '../src/xr/playerRigOrientation.js';
import * as THREE from '../src/vendor/three.js';
import { createVrControllers } from '../src/xr/createVrControllers.js';

const [main, vr, experience3d, vrControllers, glyphInteraction, entryTransition, spatialPlaque, crystalCollection, locomotion] = await Promise.all([
  readFile(new URL('../src/main.js', import.meta.url), 'utf8'),
  readFile(new URL('../src/experienceVr.js', import.meta.url), 'utf8'),
  readFile(new URL('../src/experience3d.js', import.meta.url), 'utf8'),
  readFile(new URL('../src/xr/createVrControllers.js', import.meta.url), 'utf8'),
  readFile(new URL('../src/xr/createVrGlyphInteraction.js', import.meta.url), 'utf8'),
  readFile(new URL('../src/xr/createVrEntryTransition.js', import.meta.url), 'utf8'),
  readFile(new URL('../src/xr/createVrSpatialPlaque.js', import.meta.url), 'utf8'),
  readFile(new URL('../src/xr/createVrCrystalCollection.js', import.meta.url), 'utf8'),
  readFile(new URL('../src/xr/createVrLocomotion.js', import.meta.url), 'utf8')
]);

assert.match(main, /await import\('\.\/experienceVr\.js'\)/);
assert.doesNotMatch(main, /^import .*experienceVr/m);
assert.match(vr, /renderer\.xr\.enabled = true/);
assert.match(vr, /requestSession\('immersive-vr'/);
assert.match(vr, /renderer\.setAnimationLoop\(renderFrame\)/);
assert.match(vr, /renderer\.setAnimationLoop\(null\)/);
assert.doesNotMatch(vr, /requestAnimationFrame/);
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
assert.match(glyphSpawnContract, /monkeyAnchor\.getWorldPosition/);
assert.doesNotMatch(glyphSpawnContract, /renderer\.xr|getCamera|getWorldDirection/);
assert.match(vr, /crystalCollection\.reset\(\);\s*activateButton\.reset\(\);\s*releaseButton\.reset\(\);\s*crystalReliquary\.reset\(\);\s*restorePortalWaitingState\(\);\s*locomotion\.reset\(\);\s*playerRig\.position\.set\(settings\.spawn\.position\.x/);
assert.match(vr, /function handleSessionEnd\(\)[\s\S]*restorePortalWaitingState\(\)/);
assert.match(vr, /crystalCollection\.update\(delta\)/);
assert.match(vr, /glyphOrbit\.update\(delta\)/);
assert.doesNotMatch(vr.match(/onComplete:[\s\S]*?\n  }\n}/)?.[0] ?? '', /portalDisplay\.place|portalCanvas\.hide/);
assert.match(vr, /function restorePortalWaitingState\(\)[\s\S]*portalCanvas\.show/);
assert.match(vr, /locomotion\.update\(delta\)/);
assert.match(locomotion, /renderer\.xr\.getCamera\(camera\)/);
assert.match(locomotion, /renderer\.xr\.updateCamera\(camera\)/);
assert.match(locomotion, /xrCamera\.isArrayCamera/);
assert.match(locomotion, /playerRig\.position\.addScaledVector/);
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
assert.match(vr, /progressFloor\.activatePage\(page\);[\s\S]*progressionController\.isTierComplete\(page\.order\)[\s\S]*progressFloor\.completeTier\(page\.order\)/);
assert.match(vr, /const monkeyModel = await loadMonkeyModel\(\{ scene: worldRoot, fallbackObject: centralPlaceholder, assetManager \}\);\nconst monkeyAnchor = monkeyModel \?\? centralPlaceholder;\nprogressFloor\.object\.attach\(monkeyAnchor\);/);
assert.equal((vr.match(/const monkeyAnchor = monkeyModel \?\? centralPlaceholder/g) ?? []).length, 1);
assert.doesNotMatch(vr, /progressFloor\.object\.add\(monkeyAnchor\)/);
assert.match(vr, /createVrPortalDisplay\([\s\S]*anchorObject: monkeyAnchor/);
assert.match(vr, /createVrAstroFurnace\([\s\S]*anchorObject: monkeyAnchor/);

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
assert.equal(left.ray.visible, true);
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
