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

const settings = { enabled: true, grabRadius: 0.4, scaleMin: 0.22, scaleMax: 0.28, spawnWidth: 1.45, spawnDepth: 0.85, minimumSpacing: 0.38, holdOffset: { x: 0, y: 0, z: -0.09 } };
const transforms = experienceVrPages.map(({ id }) => getDeterministicCrystalTransform(id, settings));
assert.deepEqual(transforms, experienceVrPages.map(({ id }) => getDeterministicCrystalTransform(id, settings)));
assert.ok(transforms.every(({ scale }) => scale >= 0.22 && scale <= 0.28));
assert.ok(new Set(transforms.map(({ x, z }) => `${x}:${z}`)).size > 3);
assert.ok(transforms.some(({ x }) => Math.abs(x) > 0.01) && transforms.some(({ z }) => Math.abs(z) > 0.01));

const scene = new THREE.Scene();
const makeController = (index) => {
  const controller = new THREE.Group();
  const grip = new THREE.Group();
  const holdSocket = new THREE.Group();
  grip.add(holdSocket); scene.add(controller, grip);
  return { index, controller, grip, holdSocket };
};
const left = makeController(0); const right = makeController(1);
const portalObject = new THREE.Group(); portalObject.visible = true; portalObject.position.set(0, 0, -1); scene.add(portalObject);
const portalDisplay = { object: portalObject, insertRadius: 0.25, getSocketWorldPosition: (target) => target.setFromMatrixPosition(portalObject.matrixWorld) };
const consumed = [];
const collection = createVrCrystalCollection({
  scene, controllers: [left, right], portalDisplay, settings,
  assetManager: { cloneGltfScene: () => new THREE.Mesh(new THREE.BoxGeometry(1, 2, 1)) },
  onConsume: (page) => consumed.push(page.id)
});
const pages = getExperienceVrPages('ai-guide').slice(0, 2); // runtime accepts a variable page count.
const spawned = collection.spawn(pages, { playerPosition: new THREE.Vector3(0, 0, 1), portalPosition: new THREE.Vector3(0, 0, -1) });
assert.equal(spawned.length, 2);
spawned.forEach(({ object }) => {
  object.updateWorldMatrix(true, true);
  assert.ok(Math.abs(new THREE.Box3().setFromObject(object).min.y) < 1e-8);
});
spawned[0].object.position.set(0.1, 0, 0); spawned[1].object.position.set(0.25, 0, 0);
left.grip.position.set(0, 0, 0); right.grip.position.set(0.25, 0, 0); scene.updateMatrixWorld(true);
assert.equal(collection.grab(left), spawned[0]);
assert.equal(spawned[0].object.parent, left.holdSocket);
assert.equal(collection.grab(right), spawned[1]);
assert.equal(collection.grab(right), null);
assert.notEqual(spawned[0].heldBy, spawned[1].heldBy);

left.grip.position.set(0.5, 0, 0); scene.updateMatrixWorld(true);
const beforeRelease = spawned[0].object.getWorldPosition(new THREE.Vector3()).clone();
collection.release(left);
assert.equal(spawned[0].object.parent, scene);
assert.ok(spawned[0].object.getWorldPosition(new THREE.Vector3()).distanceTo(beforeRelease) < 1e-8);
assert.equal(spawned[0].state, 'available');

right.grip.position.copy(portalObject.position).add(new THREE.Vector3(0, 0, 0.09)); scene.updateMatrixWorld(true);
collection.release(right);
assert.equal(spawned[1].state, 'consumed');
assert.equal(spawned[1].object.visible, false);
assert.deepEqual(consumed, [spawned[1].page.id]);
right.grip.position.set(0.25, 0, 0); scene.updateMatrixWorld(true);
assert.notEqual(collection.grab(right), spawned[1]);
collection.reset(); assert.equal(collection.instances.length, 0); assert.equal(collection.heldByController.size, 0);
collection.dispose(); collection.dispose();

console.log('VR crystal collection assertions passed');
