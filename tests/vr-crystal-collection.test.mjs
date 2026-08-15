import assert from 'node:assert/strict';
import * as THREE from '../src/vendor/three.js';
import { experienceVrPages } from '../src/content/experienceVrPages.js';
import { calculateVrCrystalSpawnPosition, createVrCrystalCollection,
  VR_CRYSTAL_CONSUME_COLORS } from '../src/xr/createVrCrystalCollection.js';
import { createVrProgressionController } from '../src/xr/progression/createVrProgressionController.js';

const settings = { enabled: true, pullDuration: 0.01,
  scaleMin: 0.25, scaleMax: 0.25, spawnWidth: 1, spawnDepth: 1, minimumSpacing: 0.2, spawnInwardOffset: 0.3,
  materializeDuration: 0.01, materializeStagger: 0, materializeStartScale: 0.2, materializeRise: 0.1,
  materializeYaw: 0.1, holdOffset: { x: 0, y: 0, z: 0 }, holdRotationDegrees: { x: 30, y: 0, z: 0 } };
settings.consumeDuration = 0.5;
settings.consumeParticleCount = 12;
settings.consumeParticleSize = 0.02;
const glyphFrame = {
  glyphWorldPosition: new THREE.Vector3(4, 2.5, 3),
  centerWorldPosition: new THREE.Vector3(1, 2.5, 3)
};

const calculatedSpawn = calculateVrCrystalSpawnPosition({ ...glyphFrame, inwardOffset: 0.3 });
assert.ok(calculatedSpawn.distanceTo(new THREE.Vector3(3.7, 2.5, 3)) < 1e-8,
  'spawn starts at the glyph world position and moves toward the world center');
assert.equal(calculatedSpawn.y, 2.5, 'spawn height is not grounded');

function harness(canGrabController = () => true, canUseReliquary = () => true) {
  const scene = new THREE.Scene();
  const controller = new THREE.Group(); const holdSocket = new THREE.Group(); controller.add(holdSocket); scene.add(controller);
  const record = { controller, holdSocket, currentRayLength: 3, currentCrystalHit: null, currentCrystalHitDistance: null };
  const portalObject = new THREE.Group(); portalObject.visible = true; scene.add(portalObject);
  const portalDisplay = { object: portalObject, insertRadius: 10, getSocketWorldPosition: (out) => out.set(0, 0, 0) };
  const progressionController = createVrProgressionController({ pages: experienceVrPages });
  const feedback = { state: null, history: [] };
  const insertionTarget = { object: Object.assign(new THREE.Group(), { visible: true }), hasValidInsertZone: true,
    portalForward: new THREE.Vector3(0, 0, 1),
    getInsertZoneWorldSphere: () => new THREE.Sphere(new THREE.Vector3(), 10),
    setInsertFeedback: (state) => { feedback.state = state; feedback.history.push(state); } };
  const previews = []; const commits = []; const inserts = [];
  const collection = createVrCrystalCollection({ scene, controllers: [record], portalDisplay, insertionTarget, settings,
    insertFeedbackSettings: { proximityRadiusMultiplier: 1.25, rejectDuration: 0.35, rejectDistance: 0.25 }, pages: experienceVrPages,
    progressionController, assetManager: { cloneGltfScene: () => new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, 0.1)) },
    onPreview: (page) => previews.push(page.id),
    onCommit: (page, event) => commits.push({ pageId: page.id, ...event }),
    onInsertAccepted: (instance) => inserts.push(instance.crystalId), canGrabController, canUseReliquary });
  function insert(instance) {
    collection.update(1); record.currentCrystalHit = instance; record.currentCrystalHitDistance = 0.1;
    collection.grab(record); collection.update(1); scene.updateMatrixWorld(true); collection.release(record);
  }
  return { collection, progressionController, previews, commits, inserts, insert, record, scene, feedback };
}

const stocked = harness();
const crystals = [1, 2, 3].map(() => stocked.collection.spawnOne('creative-ai', glyphFrame));
assert.deepEqual(crystals.map(({ tier }) => tier), [1, 2, 3]);
assert.ok(crystals[0].targetPosition.distanceTo(calculatedSpawn) < 1e-8);
assert.equal(crystals[0].targetPosition.y, 2.5);
for (const crystal of crystals) {
  assert.equal('page' in crystal, false); assert.equal('pageId' in crystal, false); assert.equal('cardId' in crystal, false);
}
stocked.collection.update(1);
stocked.record.currentCrystalHit = crystals[0]; stocked.record.currentCrystalHitDistance = 3.01;
assert.equal(stocked.collection.grab(stocked.record), null, 'a crystal beyond the controller ray cannot be grabbed');
stocked.record.currentCrystalHit = crystals[0]; stocked.record.currentCrystalHitDistance = 2.99;
assert.equal(stocked.collection.grab(stocked.record), crystals[0], 'a targeted crystal within the shared ray range can be grabbed');

const gated = harness(() => false);
const gatedCrystal = gated.collection.spawnOne('creative-ai', glyphFrame); gated.collection.update(1);
gated.record.currentCrystalHit = gatedCrystal; gated.record.currentCrystalHitDistance = 0.1;
assert.equal(gated.collection.grab(gated.record), null, 'optional controller gate reserves squeeze for higher-priority interactions');
gated.collection.dispose();

let reliquaryAllowed = false;
const authoredGate = harness(() => true, () => reliquaryAllowed);
const authoredGateCrystal = authoredGate.collection.spawnOne('creative-ai', glyphFrame);
authoredGate.insert(authoredGateCrystal);
assert.equal(authoredGateCrystal.state, 'available', 'authored gate rejects an otherwise valid insertion');
assert.equal(authoredGate.collection.getInsertedInstance(), null, 'authored rejection leaves the socket empty');
assert.equal(authoredGate.progressionController.getActivatedPageIds().length, 0,
  'authored rejection does not mutate progression');
assert.deepEqual(authoredGate.inserts, [], 'authored rejection has no accepted-insert consequence');
assert.equal(authoredGate.collection.activateInserted(), false, 'authored rejection cannot start preview');
assert.deepEqual(authoredGate.previews, [], 'authored rejection emits no preview consequence');
reliquaryAllowed = true;
authoredGate.insert(authoredGateCrystal);
assert.equal(authoredGateCrystal.state, 'inserted', 'the same valid insertion succeeds when Scenario permits use');
assert.equal(authoredGate.inserts.length, 1, 'permitted insertion retains its accepted consequence');
authoredGate.collection.dispose();
stocked.collection.update(1);
const expectedHoldQuaternion = new THREE.Quaternion().setFromEuler(new THREE.Euler(Math.PI / 6, 0, 0));
assert.ok(stocked.collection.heldByController.get(stocked.record).object.quaternion.angleTo(expectedHoldQuaternion) < 1e-8,
  'pulling interpolates to the configured hold orientation');
stocked.record.controller.position.x = 30; stocked.scene.updateMatrixWorld(true);
stocked.record.controller.dispatchEvent({ type: 'squeezeend' });
stocked.record.controller.position.x = 0; stocked.scene.updateMatrixWorld(true);
assert.equal(stocked.collection.spawnOne('creative-ai', glyphFrame), null);
stocked.insert(crystals[1]);
assert.equal(stocked.inserts.length, 0, 'rejected insertion does not emit an accepted-insert event');
assert.ok(stocked.feedback.history.includes('INVALID'), 'future tier shows invalid feedback before release');
assert.equal(crystals[1].state, 'rejecting', 'future tier insertion starts controlled rejection');
assert.equal(stocked.collection.getInsertedInstance(), null);
assert.equal(stocked.record.currentCrystalHit, null, 'rejecting crystal is not ray-targetable');
assert.equal(stocked.collection.grab(stocked.record), null, 'rejecting crystal is not grabable');
assert.equal(stocked.progressionController.getActivatedPageIds().length, 0, 'rejection does not change progress');
stocked.collection.update(0.4);
assert.equal(crystals[1].state, 'available', 'rejected crystal becomes available after interpolation');
assert.ok(crystals[1].object.position.length() > 10, 'rejection finishes beyond the insert sphere');

stocked.insert(crystals[0]);
assert.equal(stocked.inserts.length, 1, 'accepted insertion emits exactly one semantic event');
assert.equal(stocked.collection.activateInserted(), true);
assert.equal(stocked.previews.length, 1);
assert.equal(stocked.progressionController.getActivatedPageIds().length, 0, 'Activate only previews');
assert.equal(stocked.collection.releaseInserted(), true);
assert.equal(stocked.commits.length, 1);
assert.equal(stocked.commits[0].tierCompleted, false, 'ordinary commit reports no tier completion');
assert.equal(stocked.progressionController.getActivatedPageIds().length, 1, 'Release commits once');
assert.equal(crystals[0].state, 'consuming', 'committed crystal enters consuming');
assert.equal(stocked.collection.getInsertedInstance(), null, 'socket is free before consuming completes');
assert.equal(crystals[0].consumeEffect.points.parent != null, true, 'particles exist during consuming');
assert.equal(crystals[0].consumeEffect.material.color.getHex(), VR_CRYSTAL_CONSUME_COLORS['creative-ai']);
stocked.record.currentCrystalHit = crystals[0]; stocked.record.currentCrystalHitDistance = 0.1;
assert.equal(stocked.collection.grab(stocked.record), null, 'consuming crystal cannot be grabbed');
assert.equal(stocked.collection.releaseInserted(), false);
const consumeStartScale = crystals[0].object.scale.x;
stocked.collection.update(0.25);
assert.ok(crystals[0].object.scale.x < consumeStartScale, 'consuming update shrinks the crystal');
assert.equal(stocked.record.currentCrystalHit, null, 'consuming crystal cannot be targeted');
stocked.collection.update(0.25);
assert.equal(crystals[0].state, 'released', 'crystal is released after consumeDuration');
assert.equal(crystals[0].consumeEffect, null, 'particles are removed after consuming');
assert.equal(crystals[0].object.parent, null, 'consumed crystal is removed from the scene');
stocked.collection.reset();
assert.equal(stocked.collection.instances.length, 0);
assert.equal(stocked.progressionController.getActivatedPageIds().length, 1, 'transient reset preserves progress');

const noActivate = harness();
const crystal = noActivate.collection.spawnOne('ethics-life-protection', glyphFrame); noActivate.insert(crystal);
assert.equal(noActivate.collection.releaseInserted(), true);
assert.equal(crystal.state, 'available');
assert.equal(noActivate.progressionController.getActivatedPageIds().length, 0);
assert.deepEqual(noActivate.commits, []);
assert.equal(crystal.consumeEffect, undefined, 'Release without Activate has no consuming effect');

const resetDuringConsume = harness();
const resetCrystal = resetDuringConsume.collection.spawnOne('ethics-life-protection', glyphFrame);
resetDuringConsume.insert(resetCrystal);
resetDuringConsume.collection.activateInserted();
resetDuringConsume.collection.releaseInserted();
const resetEffect = resetCrystal.consumeEffect;
assert.equal(resetCrystal.state, 'consuming');
resetDuringConsume.collection.reset();
assert.equal(resetEffect.points.parent, null, 'reset removes transient consuming particles');
assert.equal(resetCrystal.consumeEffect, null);
assert.equal(resetDuringConsume.progressionController.getActivatedPageIds().length, 1,
  'reset during consuming preserves committed progression');

const proximity = harness();
const valid = proximity.collection.spawnOne('creative-ai', glyphFrame);
proximity.collection.update(1);
assert.equal(proximity.feedback.state, null, 'feedback starts hidden');
proximity.record.currentCrystalHit = valid; proximity.record.currentCrystalHitDistance = 0.1;
proximity.collection.grab(proximity.record); proximity.collection.update(1);
assert.equal(proximity.feedback.state, 'VALID', 'eligible held crystal shows valid feedback in proximity');
proximity.record.controller.position.set(30, 0, 0); proximity.scene.updateMatrixWorld(true); proximity.collection.update(0);
assert.equal(proximity.feedback.state, null, 'moving away clears feedback');
proximity.collection.reset();
assert.equal(proximity.feedback.state, null, 'reset clears feedback');
console.log('VR crystal collection assertions passed');
