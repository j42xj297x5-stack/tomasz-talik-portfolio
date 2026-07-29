import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import * as THREE from '../src/vendor/three.js';
import { ASSET_STAGES, getPreloadAssets } from '../src/assets/assetManifest.js';
import { createVrCrystalReliquary, getReliquaryVisibleBounds } from '../src/xr/createVrCrystalReliquary.js';
import { createVrCrystalCollection } from '../src/xr/createVrCrystalCollection.js';
import { DEFAULT_EXPERIENCE_VR_SETTINGS, normalizeExperienceVrSettings } from '../src/config/experienceVrSettings.js';

const reliquaryAsset = getPreloadAssets([ASSET_STAGES.DEFERRED_WARM]).find(({ id }) => id === 'vr-crystal-reliquary-model');
assert.equal(reliquaryAsset.path, '/glb/portal_crystal_reliquary.glb');
assert.equal(reliquaryAsset.type, 'model');
const runtime = await readFile(new URL('../src/experienceVr.js', import.meta.url), 'utf8');
assert.match(runtime, /cloneGltfScene\('vr-crystal-reliquary-model'\)/);
assert.match(runtime, /insertionTarget: crystalReliquary/);
assert.equal(DEFAULT_EXPERIENCE_VR_SETTINGS.reliquary.forwardOffset, 1);
assert.deepEqual(DEFAULT_EXPERIENCE_VR_SETTINGS.reliquary.activateButton, {
  enabled: true, rayMaxDistance: 3, side: 'left'
});
const normalized = normalizeExperienceVrSettings({ schemaVersion: 1, reliquary: { enabled: false, distanceFromPortal: 0.75,
  forwardOffset: 9, floorOffset: 0.1, activateButton: { enabled: false, rayMaxDistance: 9, placementRadius: -2,
    placementAngleDegrees: 120, verticalOffset: -2 } } });
assert.deepEqual(normalized.reliquary.buttons, { scale: 0.3, placementRadius: 0, placementAngleDegrees: 89, verticalOffset: -1 });
assert.deepEqual(normalized.reliquary.activateButton, { enabled: false, rayMaxDistance: 5, side: 'left' });

const scene = new THREE.Scene();
const portalObject = new THREE.Group();
portalObject.position.set(2, 1, -3);
portalObject.rotation.set(0, 0.65, 0);
scene.add(portalObject);
const portalDisplay = { object: portalObject };
const source = new THREE.Group();
source.scale.set(1.25, 0.8, 1.1);
const stone = new THREE.Mesh(new THREE.BoxGeometry(2, 4, 2));
stone.position.set(3, 4, -2);
source.add(stone);
const insertZone = new THREE.Mesh(new THREE.SphereGeometry(6));
insertZone.name = 'RELIQUARY_CRYSTAL_INSERT_ZONE';
insertZone.userData.reliquary_role = 'crystal_insert_zone';
insertZone.position.set(20, 30, 40);
insertZone.scale.set(0.5, 2, 1.25);
source.add(insertZone);
const anchor = new THREE.Object3D();
anchor.name = 'RELIQUARY_CRYSTAL_ANCHOR';
anchor.userData.reliquary_role = 'crystal_display_anchor';
anchor.position.set(3, 7, -2);
source.add(anchor);

const visibleBounds = getReliquaryVisibleBounds(source, insertZone);
assert.ok(visibleBounds.max.x < 10, 'technical sphere is excluded from visible bounds');
const sourceScale = source.scale.clone();
const stoneScale = stone.scale.clone();
const reliquary = createVrCrystalReliquary({
  scene, reliquaryModel: source, portalDisplay, spawnPosition: { x: 2, y: 0, z: 7 },
  settings: DEFAULT_EXPERIENCE_VR_SETTINGS.reliquary
});
assert.equal(reliquary.object.name, 'VrCrystalReliquary');
assert.equal(reliquary.insertZone, insertZone);
assert.equal(reliquary.crystalAnchor, anchor);
assert.equal(reliquary.hasValidInsertZone, true);
assert.equal(reliquary.authoredRoot.name, 'VrCrystalReliquaryAuthoredRoot');
assert.equal(source.parent, reliquary.authoredRoot);
const companion = new THREE.Group(); companion.position.set(4, 5, 6); companion.rotation.set(0.1, 0.2, 0.3); companion.scale.set(2, 3, 4);
const companionTransform = { position: companion.position.toArray(), rotation: companion.rotation.toArray(), scale: companion.scale.toArray() };
const attached = reliquary.attachCompanion({ id: 'activate', model: companion, settings: DEFAULT_EXPERIENCE_VR_SETTINGS.reliquary.buttons, side: 'left' });
assert.equal(attached.model, companion);
assert.equal(reliquary.buttonPlacementRoot.name, 'VrReliquaryActivateButtonPlacementRoot');
assert.equal(reliquary.buttonPlacementRoot.parent, reliquary.authoredRoot);
assert.equal(companion.parent, attached.scaleRoot);
assert.deepEqual(companion.position.toArray(), companionTransform.position);
assert.deepEqual(companion.rotation.toArray(), companionTransform.rotation);
assert.deepEqual(companion.scale.toArray(), companionTransform.scale);
assert.equal(insertZone.visible, false);
assert.deepEqual(source.scale.toArray(), sourceScale.toArray());
assert.deepEqual(stone.scale.toArray(), stoneScale.toArray());
assert.deepEqual(reliquary.object.scale.toArray(), [1, 1, 1]);
const portalPosition = portalObject.getWorldPosition(new THREE.Vector3());
const basePosition = portalPosition.clone().add(new THREE.Vector3(0, 0, 1).multiplyScalar(0.5)).setY(0);
const reliquaryOffset = reliquary.object.position.clone().sub(basePosition);
assert.ok(Math.abs(reliquaryOffset.length() - 1) < 1e-10);
assert.ok(reliquaryOffset.distanceTo(reliquary.portalForward) < 1e-10);
assert.ok(reliquaryOffset.dot(new THREE.Vector3(0, 0, 1)) > 0, 'forward offset points toward configured spawn');
assert.equal(reliquary.object.position.y, 0);
assert.ok(Math.abs(reliquary.object.quaternion.dot(portalObject.getWorldQuaternion(new THREE.Quaternion()))) > 0.999999);
const grounded = getReliquaryVisibleBounds(reliquary.object, insertZone);
assert.ok(Math.abs(grounded.min.y) < 1e-8);

scene.updateMatrixWorld(true);
const sphere = reliquary.getInsertZoneWorldSphere();
const expectedCenter = insertZone.geometry.boundingSphere.center.clone().applyMatrix4(insertZone.matrixWorld);
const insertWorldScale = insertZone.getWorldScale(new THREE.Vector3());
assert.ok(sphere.center.distanceTo(expectedCenter) < 1e-8);
assert.ok(Math.abs(sphere.radius - insertZone.geometry.boundingSphere.radius * Math.max(...insertWorldScale.toArray().map(Math.abs))) < 1e-8);
assert.ok(reliquary.getCrystalAnchorWorldPosition().distanceTo(anchor.getWorldPosition(new THREE.Vector3())) < 1e-8);
const childCount = scene.children.length;
const placementPosition = reliquary.buttonPlacementRoot.getWorldPosition(new THREE.Vector3());
const buttonOffset = placementPosition.sub(reliquary.authoredRoot.getWorldPosition(new THREE.Vector3()));
assert.ok(Math.abs(buttonOffset.dot(reliquary.portalLeft) - Math.sin(Math.PI / 3) * 0.9) < 1e-8);
assert.ok(Math.abs(buttonOffset.dot(reliquary.portalForward) - Math.cos(Math.PI / 3) * 0.9) < 1e-8);
assert.ok(Math.abs(Math.hypot(buttonOffset.x, buttonOffset.z) - 0.9) < 1e-8);
const placedOnce = reliquary.object.position.clone();
const companionWorldOnce = companion.getWorldPosition(new THREE.Vector3());
reliquary.reset(); reliquary.reset();
assert.equal(scene.children.length, childCount, 'reset does not duplicate the wrapper');
assert.equal(reliquary.authoredRoot.children.filter(({ name }) => name === 'VrReliquaryActivateButtonPlacementRoot').length, 1);
assert.ok(reliquary.object.position.distanceTo(placedOnce) < 1e-10, 'reset does not accumulate the reliquary offset');
assert.ok(companion.getWorldPosition(new THREE.Vector3()).distanceTo(companionWorldOnce) < 1e-10, 'reset does not accumulate the button offset');

function controllerRecord() {
  const controller = new THREE.Group();
  const holdSocket = new THREE.Group();
  controller.add(holdSocket); scene.add(controller);
  return { controller, holdSocket, currentCrystalHit: null, currentCrystalHitDistance: null };
}
const crystalSettings = { enabled: true, rayGrabMaxDistance: 2, pullDuration: 0.01, targetScale: 1.04,
  scaleMin: 0.25, scaleMax: 0.25, spawnWidth: 1, spawnDepth: 1, minimumSpacing: 0.2, frontDistance: 1,
  materializeDuration: 0.01, materializeStagger: 0, materializeStartScale: 0.2, materializeRise: 0.1,
  materializeYaw: 0.1, holdOffset: { x: 0, y: 0, z: 0 } };

function testRelease({ target, releasePosition, expectedState }) {
  const controller = controllerRecord();
  const consumed = [];
  const portal = { object: new THREE.Group(), insertRadius: 0.25, getSocketWorldPosition: (out) => out.set(50, 0, 50) };
  portal.object.visible = true; scene.add(portal.object);
  const collection = createVrCrystalCollection({ scene, controllers: [controller], portalDisplay: portal,
    insertionTarget: target, settings: crystalSettings, onConsume: (page) => consumed.push(page.id),
    assetManager: { cloneGltfScene: () => new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, 0.1)) } });
  const [instance] = collection.spawn([{ id: `page-${expectedState}` }], { anchorObject: portal.object, spawnPosition: { x: 0, y: 0, z: 2 } });
  collection.update(1);
  controller.currentCrystalHit = instance; controller.currentCrystalHitDistance = 0.5;
  collection.grab(controller); collection.update(1);
  controller.controller.position.copy(releasePosition); scene.updateMatrixWorld(true);
  collection.release(controller);
  assert.equal(instance.state, expectedState);
  assert.equal(consumed.length, expectedState === 'consumed' ? 1 : 0);
  collection.dispose();
}

testRelease({ target: { object: Object.assign(new THREE.Group(), { visible: true }), hasValidInsertZone: true,
  getInsertZoneWorldSphere: () => new THREE.Sphere(new THREE.Vector3(4, 0, 0), 1) },
releasePosition: new THREE.Vector3(4, 0, 0), expectedState: 'inserted' });
testRelease({ target: { object: Object.assign(new THREE.Group(), { visible: true }), hasValidInsertZone: true,
  getInsertZoneWorldSphere: () => new THREE.Sphere(new THREE.Vector3(4, 0, 0), 0.1) },
releasePosition: new THREE.Vector3(0, 0, 0), expectedState: 'available' });
testRelease({ target: { object: Object.assign(new THREE.Group(), { visible: false }), hasValidInsertZone: false },
releasePosition: new THREE.Vector3(50, 0, 50), expectedState: 'inserted' });

reliquary.dispose();
assert.equal(reliquary.object.parent, null);
console.log('VR crystal reliquary assertions passed');
