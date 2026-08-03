import assert from 'node:assert/strict';
import * as THREE from '../src/vendor/three.js';
import { calculateMirroredHorizontalPosition, createVrAstroFurnace } from '../src/xr/furnace/createVrAstroFurnace.js';
import { normalizeExperienceVrSettings } from '../src/config/experienceVrSettings.js';

const center = new THREE.Vector3(1, 4, -2);
assert.deepEqual(calculateMirroredHorizontalPosition(center, new THREE.Vector3(-2, 20, 3)).toArray(), [4, 4, -7]);
const normalized = normalizeExperienceVrSettings({ schemaVersion: 1, furnace: {
  placementMode: 'unknown', floorOffset: 20, scale: 99
} }).furnace;
assert.equal(normalized.placementMode, 'mirror-portal');
assert.equal(normalized.floorOffset, 2);
assert.equal(normalized.scale, 10);

const parent = new THREE.Group();
const anchor = new THREE.Mesh(new THREE.BoxGeometry(2, 2, 2)); anchor.position.set(1, 1, -2);
const portal = new THREE.Group(); portal.position.set(-2, 9, 3);
const model = new THREE.Group(); model.add(new THREE.Mesh(new THREE.BoxGeometry(1, 2, 1)));
parent.add(anchor, portal);
const settings = { enabled: true, placementMode: 'mirror-portal', floorOffset: 0,
  position: { x: 0, y: 0, z: 0 }, rotationDegrees: { x: 0, y: 0, z: 0 }, scale: 3, debug: false };
const furnace = createVrAstroFurnace({ parent, model, settings, anchorObject: anchor, mirrorObject: portal,
  spawnPosition: { x: 0, y: 0, z: 5 } });
assert.deepEqual(furnace.object.position.toArray(), [4, 3, -7]);
assert.equal(furnace.object.scale.x, 3);
assert.ok(Math.abs(new THREE.Box3().setFromObject(furnace.object).min.y) < 1e-10);
portal.position.x = -3;
furnace.reset();
assert.equal(furnace.object.position.x, 5);
assert.equal(parent.children.filter((child) => child.name === 'VrAstroFurnace').length, 1);
assert.deepEqual(furnace.diagnostics.anchorCenter, [1, 1, -2]);
assert.deepEqual(furnace.diagnostics.mirrorPosition, [-3, 9, 3]);
furnace.dispose();
console.log('VR Astro furnace assertions passed');
