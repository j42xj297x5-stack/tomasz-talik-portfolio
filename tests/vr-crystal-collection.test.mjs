import assert from 'node:assert/strict';
import * as THREE from '../src/vendor/three.js';
import { experienceVrPages } from '../src/content/experienceVrPages.js';
import { createVrCrystalCollection } from '../src/xr/createVrCrystalCollection.js';
import { createVrProgressionController } from '../src/xr/progression/createVrProgressionController.js';

const settings = { enabled: true, rayGrabMaxDistance: 2, pullDuration: 0.01, targetScale: 1.04,
  scaleMin: 0.25, scaleMax: 0.25, spawnWidth: 1, spawnDepth: 1, minimumSpacing: 0.2, frontDistance: 1,
  materializeDuration: 0.01, materializeStagger: 0, materializeStartScale: 0.2, materializeRise: 0.1,
  materializeYaw: 0.1, holdOffset: { x: 0, y: 0, z: 0 } };
const viewerFrame = { position: new THREE.Vector3(0, 1.6, 5.8), direction: new THREE.Vector3(0, 0, -1) };

function harness() {
  const scene = new THREE.Scene();
  const controller = new THREE.Group(); const holdSocket = new THREE.Group(); controller.add(holdSocket); scene.add(controller);
  const record = { controller, holdSocket, currentCrystalHit: null, currentCrystalHitDistance: null };
  const portalObject = new THREE.Group(); portalObject.visible = true; scene.add(portalObject);
  const portalDisplay = { object: portalObject, insertRadius: 10, getSocketWorldPosition: (out) => out.set(0, 0, 0) };
  const progressionController = createVrProgressionController({ pages: experienceVrPages });
  const previews = []; const commits = [];
  const collection = createVrCrystalCollection({ scene, controllers: [record], portalDisplay, settings, pages: experienceVrPages,
    progressionController, assetManager: { cloneGltfScene: () => new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, 0.1)) },
    onPreview: (page) => previews.push(page.id), onCommit: (page) => commits.push(page.id) });
  function insert(instance) {
    collection.update(1); record.currentCrystalHit = instance; record.currentCrystalHitDistance = 0.1;
    collection.grab(record); collection.update(1); scene.updateMatrixWorld(true); collection.release(record);
  }
  return { collection, progressionController, previews, commits, insert };
}

const stocked = harness();
const crystals = [1, 2, 3].map(() => stocked.collection.spawnOne('creative-ai', viewerFrame));
assert.deepEqual(crystals.map(({ tier }) => tier), [1, 2, 3]);
for (const crystal of crystals) {
  assert.equal('page' in crystal, false); assert.equal('pageId' in crystal, false); assert.equal('cardId' in crystal, false);
}
assert.equal(stocked.collection.spawnOne('creative-ai', viewerFrame), null);
stocked.insert(crystals[1]);
assert.equal(crystals[1].state, 'available', 'future tier insertion is rejected');
assert.equal(stocked.collection.getInsertedInstance(), null);

stocked.insert(crystals[0]);
assert.equal(stocked.collection.activateInserted(), true);
assert.equal(stocked.previews.length, 1);
assert.equal(stocked.progressionController.getActivatedPageIds().length, 0, 'Activate only previews');
assert.equal(stocked.collection.releaseInserted(), true);
assert.equal(stocked.commits.length, 1);
assert.equal(stocked.progressionController.getActivatedPageIds().length, 1, 'Release commits once');
assert.equal(stocked.collection.releaseInserted(), false);
stocked.collection.reset();
assert.equal(stocked.collection.instances.length, 0);
assert.equal(stocked.progressionController.getActivatedPageIds().length, 1, 'transient reset preserves progress');

const noActivate = harness();
const crystal = noActivate.collection.spawnOne('ethics-life-protection', viewerFrame); noActivate.insert(crystal);
assert.equal(noActivate.collection.releaseInserted(), true);
assert.equal(crystal.state, 'available');
assert.equal(noActivate.progressionController.getActivatedPageIds().length, 0);
assert.deepEqual(noActivate.commits, []);
console.log('VR crystal collection assertions passed');
