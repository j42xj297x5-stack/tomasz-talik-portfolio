import assert from 'node:assert/strict';
import * as THREE from '../src/vendor/three.js';
import { createVrGlyphInteraction, findNearestGlyph } from '../src/xr/createVrGlyphInteraction.js';

const meshAt = (x, y, z) => {
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(0.2), new THREE.MeshBasicMaterial());
  mesh.position.set(x, y, z);
  return mesh;
};

// World-space selection honors parent scale/transform and stable array order on ties.
const worldRoot = new THREE.Group();
worldRoot.scale.setScalar(2);
const far = meshAt(0, 0, -4);
const tieFirst = meshAt(-1, 0, -1);
const tieSecond = meshAt(1, 0, -1);
worldRoot.add(far, tieFirst, tieSecond);
worldRoot.updateMatrixWorld(true);
assert.equal(findNearestGlyph([far, tieFirst, tieSecond], new THREE.Vector3(0, 0, 0)), tieFirst);
assert.equal(findNearestGlyph([tieSecond, tieFirst], new THREE.Vector3(0, 0, 0)), tieSecond);

const playerRig = new THREE.Group();
const controllerObjects = [new THREE.Group(), new THREE.Group()];
playerRig.add(...controllerObjects);
const records = controllerObjects.map((controller, index) => ({
  index, controller, handedness: index ? 'right' : 'left', isConnected: true,
  currentHit: null, currentRayLength: 3
}));
const entry = meshAt(0, 0, -2);
const other = meshAt(0, 0, -1);
const root = new THREE.Group();
root.add(entry, other);
let activations = 0;
const interaction = createVrGlyphInteraction({
  controllers: records, nodes: [entry], playerRig, worldRoot: root,
  onEntryGlyphActivated: ({ node, controllerIndex, handedness }) => {
    activations += 1;
    assert.equal(node, entry);
    assert.equal(controllerIndex, 0);
    assert.equal(handedness, 'left');
  }
});

// Local -Z becomes world direction, and only entryNode is raycast (the nearer other glyph is ignored).
interaction.update();
assert.equal(records[0].currentHit, entry);
assert.equal(records[1].currentHit, entry);
assert.equal(interaction.state, 'hovered');
assert.equal(interaction.marker.visible, true);
controllerObjects[1].rotation.y = Math.PI;
interaction.update();
assert.equal(records[0].currentHit, entry);
assert.equal(records[1].currentHit, null);
assert.equal(interaction.state, 'hovered');

// Visible ray length is the hard far limit.
records[0].currentRayLength = 1;
interaction.update();
assert.equal(records[0].currentHit, null);
assert.equal(interaction.state, 'idle');
controllerObjects[0].dispatchEvent({ type: 'selectstart' });
assert.equal(activations, 0);

records[0].currentRayLength = 3;
interaction.update();
controllerObjects[0].dispatchEvent({ type: 'selectstart' });
controllerObjects[0].dispatchEvent({ type: 'selectstart' });
assert.equal(activations, 1);
assert.equal(interaction.state, 'activated');
assert.equal(interaction.marker.material.opacity, 0.48);
interaction.reset();
assert.equal(interaction.state, 'idle');
assert.equal(interaction.marker.visible, false);
assert.ok(records.every(({ currentHit }) => currentHit === null));
interaction.update();
controllerObjects[0].dispatchEvent({ type: 'selectstart' });
assert.equal(activations, 2);
interaction.dispose();
interaction.dispose();
assert.equal(interaction.marker.parent, null);
controllerObjects[0].dispatchEvent({ type: 'selectstart' });
assert.equal(activations, 2);

console.log('VR glyph interaction assertions passed');
