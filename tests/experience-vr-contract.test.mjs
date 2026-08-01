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
assert.doesNotMatch(crystalCollection, /CANNON|Ammo|Rapier|gravity|throwVelocity|linearVelocity|angularVelocity/i);
assert.doesNotMatch(vrControllers, /controller\.(position|rotation|quaternion)\.(set|copy)/);

const controllerObjects = [new THREE.Group(), new THREE.Group()];
const controllerGrips = [new THREE.Group(), new THREE.Group()];
const playerRig = new THREE.Group();
const controllerSystem = createVrControllers({
  renderer: { xr: { getController: (index) => controllerObjects[index], getControllerGrip: (index) => controllerGrips[index] } },
  playerRig,
  settings: { enabled: true, rayLength: 2, rayOpacity: 0.7, idleScale: 0.8, activeScale: 1.4 }
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
assert.equal(left.currentRayLength, 1.6);
left.controller.dispatchEvent({ type: 'selectstart' });
assert.equal(left.isSelecting, true);
assert.equal(left.ray.scale.z, 1.4);
assert.equal(left.currentRayLength, 2.8);
assert.equal(right.isSelecting, false);
left.controller.dispatchEvent({ type: 'selectend' });
assert.equal(left.isSelecting, false);
assert.equal(left.ray.scale.z, 0.8);
left.controller.dispatchEvent({ type: 'disconnected' });
assert.equal(left.ray.visible, false);
assert.equal(left.isConnected, false);
assert.equal('xrInput' in left.controller.userData, false);
controllerSystem.dispose();
controllerSystem.dispose();
assert.equal(playerRig.children.length, 0);
left.controller.dispatchEvent({ type: 'connected', data: { handedness: 'left' } });
assert.equal(left.isConnected, false);

console.log('Experience VR static contract assertions passed');
