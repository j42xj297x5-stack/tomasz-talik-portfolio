import assert from 'node:assert/strict';
import * as THREE from '../src/vendor/three.js';
import { experienceVrPages, experienceVrPagesByGlyphId, getExperienceVrPages, resolveExperienceVrPage } from '../src/content/experienceVrPages.js';
import { resolvePortfolioNodes } from '../src/content/resolvePortfolioNodes.js';
import { ASSET_STAGES, getPreloadAssets } from '../src/assets/assetManifest.js';
import { createVrCrystalCollection, getDeterministicCrystalTransform } from '../src/xr/createVrCrystalCollection.js';

const expected = {
  'ai-guide': 'crystal-ai_guide', 'creative-ai': 'crystal-creative_ai',
  'spotify-digger': 'crystal-dig_engine', 'ethics-life-protection': 'crystal-ethics',
  'haiku-cosmos': 'crystal-haiku_cosmos'
};
assert.equal(experienceVrPages.length, 15);
for (const [glyphId, filename] of Object.entries(expected)) {
  const pages = getExperienceVrPages(glyphId);
  assert.equal(pages, experienceVrPagesByGlyphId[glyphId]);
  assert.equal(pages.length, 3);
  pages.forEach((page, index) => {
    assert.equal(page.crystalAssetId, `vr-crystal-${glyphId}-${index + 1}`);
    assert.equal(page.crystalModelPath, `/glb/${filename}_${String(index + 1).padStart(2, '0')}.glb`);
  });
}
assert.deepEqual(getExperienceVrPages('unknown'), []);
const localizedNode = resolvePortfolioNodes('en').find(({ id }) => id === 'spotify-digger');
const localizedPages = getExperienceVrPages('spotify-digger').map((page) => resolveExperienceVrPage(page, localizedNode));
assert.ok(localizedPages.every(({ title, body }) => title.length > 0 && body.length > 0));
assert.equal(localizedPages[0].title, localizedNode.title);
assert.equal(localizedPages[0].body, localizedNode.leadText || localizedNode.draftText);
const manifestCrystals = getPreloadAssets([ASSET_STAGES.DEFERRED_WARM]).filter(({ id }) => id.startsWith('vr-crystal-'));
assert.deepEqual(manifestCrystals.map(({ id, path }) => ({ id, path })), experienceVrPages.map((page) => ({ id: page.crystalAssetId, path: page.crystalModelPath })));

const settings = { enabled: true, rayGrabMaxDistance: 1.8, pullDuration: 0.25, targetScale: 1.04, scaleMin: 0.22, scaleMax: 0.28, spawnWidth: 1.45, spawnDepth: 0.85, minimumSpacing: 0.38, frontDistance: 1.55, materializeDuration: 0.55, materializeStagger: 0.12, materializeStartScale: 0.18, materializeRise: 0.12, materializeYaw: 0.35, holdOffset: { x: 0, y: 0, z: -0.09 } };
const transforms = experienceVrPages.map(({ id }) => getDeterministicCrystalTransform(id, settings));
assert.deepEqual(transforms, experienceVrPages.map(({ id }) => getDeterministicCrystalTransform(id, settings)));
assert.ok(transforms.every(({ scale }) => scale >= 0.22 && scale <= 0.28));

const scene = new THREE.Scene();
const makeController = (index) => {
  const controller = new THREE.Group();
  const grip = new THREE.Group();
  const holdSocket = new THREE.Group();
  grip.add(holdSocket); scene.add(controller, grip);
  return { index, controller, grip, holdSocket, currentHit: { glyph: true }, currentCrystalHit: null, currentCrystalHitDistance: null };
};
const left = makeController(0); const right = makeController(1);
left.controller.position.y = 0.1; right.controller.position.set(1, 0.1, 0);
const portalObject = new THREE.Group(); portalObject.visible = true; portalObject.position.set(1, 0, -1); scene.add(portalObject);
const portalDisplay = { object: portalObject, insertRadius: 0.25, getSocketWorldPosition: (target) => target.setFromMatrixPosition(portalObject.matrixWorld) };
const consumed = [];
const collection = createVrCrystalCollection({
  scene, controllers: [left, right], portalDisplay, settings,
  assetManager: { cloneGltfScene: () => new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1)) },
  onConsume: (page) => consumed.push(page.id)
});
const pages = getExperienceVrPages('ai-guide').slice(0, 2);
const spawned = collection.spawn(pages, { anchorObject: new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1)), spawnPosition: { x: 0, y: 0, z: 5 } });
assert.equal(spawned.length, 2);
assert.equal(spawned[0].state, 'materializing');
assert.equal(spawned[0].object.scale.x, settings.materializeStartScale);
assert.ok(spawned.every(({ targetPosition }) => targetPosition.z > 1));
scene.updateMatrixWorld(true); collection.update(0);
assert.equal(left.currentCrystalHit, null);
assert.equal(collection.grab(left), null);
collection.update(settings.materializeDuration);
assert.equal(spawned[0].state, 'available');
assert.equal(spawned[1].state, 'materializing');
assert.equal(spawned[0].object.scale.x, 1);
assert.equal(spawned[0].object.position.y, spawned[0].targetPosition.y);
collection.update(settings.materializeStagger);
assert.equal(spawned[1].state, 'available');
spawned[0].object.position.set(0, 0, -1);
spawned[1].object.position.set(0, 0, -1.5);
scene.updateMatrixWorld(true);
collection.update(0);
assert.equal(left.currentCrystalHit, spawned[0]); // nearest ray intersection on local -Z.
assert.ok(left.currentCrystalHitDistance < 1.8);
assert.deepEqual(left.currentHit, { glyph: true }); // crystal targeting never owns the glyph hit.
assert.equal(spawned[0].object.scale.x, settings.targetScale);

left.controller.dispatchEvent({ type: 'squeezestart' });
assert.equal(spawned[0].state, 'pulling');
assert.equal(spawned[0].object.parent, left.holdSocket);
assert.equal(spawned[0].object.scale.x, 1);
collection.update(settings.pullDuration / 2);
assert.equal(spawned[0].state, 'pulling');
const duringPull = spawned[0].object.getWorldPosition(new THREE.Vector3()).clone();
left.controller.dispatchEvent({ type: 'squeezeend' });
assert.equal(spawned[0].state, 'available');
assert.equal(spawned[0].object.parent, scene);
assert.ok(spawned[0].object.getWorldPosition(new THREE.Vector3()).distanceTo(duringPull) < 1e-8);

// No hit and an out-of-range hit cannot start a grab.
left.controller.rotation.y = Math.PI;
scene.updateMatrixWorld(true); collection.update(0);
assert.equal(collection.grab(left), null);
left.controller.rotation.y = 0; spawned[0].object.position.set(0, 0, -2.2); spawned[1].object.position.set(1, 0, -1.5);
scene.updateMatrixWorld(true); collection.update(0);
assert.ok(left.currentCrystalHitDistance > settings.rayGrabMaxDistance);
assert.equal(collection.grab(left), null);

// Both hands can pull separate available crystals and non-available states leave the raycast set.
spawned[0].object.position.set(0, 0, -1);
spawned[1].object.position.set(1, 0, -1);
scene.updateMatrixWorld(true); collection.update(0);
assert.equal(collection.grab(left), spawned[0]);
assert.equal(collection.grab(right), spawned[1]);
collection.update(settings.pullDuration);
assert.equal(spawned[0].state, 'held');
assert.equal(spawned[1].state, 'held');
assert.ok(spawned[0].object.position.distanceTo(new THREE.Vector3(...Object.values(settings.holdOffset))) < 1e-8);
assert.equal(left.currentCrystalHit, null);
assert.equal(right.currentCrystalHit, null);

left.grip.position.set(0.5, 0, 0); scene.updateMatrixWorld(true);
const beforeRelease = spawned[0].object.getWorldPosition(new THREE.Vector3()).clone();
collection.release(left);
assert.equal(spawned[0].state, 'available');
assert.ok(spawned[0].object.getWorldPosition(new THREE.Vector3()).distanceTo(beforeRelease) < 1e-8);
right.grip.position.copy(portalObject.position).add(new THREE.Vector3(0, 0, 0.09)); scene.updateMatrixWorld(true);
collection.release(right);
assert.equal(spawned[1].state, 'consumed');
assert.equal(spawned[1].object.visible, false);
assert.deepEqual(consumed, [spawned[1].page.id]);

collection.reset();
assert.equal(collection.instances.length, 0);
assert.equal(collection.heldByController.size, 0);
assert.equal(left.currentCrystalHit, null);
assert.equal(left.currentCrystalHitDistance, null);
collection.dispose(); collection.dispose();
console.log('VR crystal collection assertions passed');
