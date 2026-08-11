import assert from 'node:assert/strict';
import * as THREE from '../src/vendor/three.js';
import { createVrIntroFogReveal } from '../src/xr/guidance/createVrIntroFogReveal.js';

const platform = new THREE.Group();
platform.position.set(3, 2, -4); platform.rotation.set(.4, .7, -.2);
const material = new THREE.MeshBasicMaterial();
const root = new THREE.Group(); root.add(new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), material));
platform.add(root); platform.updateWorldMatrix(true, true);
const originalCompile = material.onBeforeCompile;
const reveal = createVrIntroFogReveal({ center: platform, roots: [root], duration: 10 });

assert.notEqual(material.onBeforeCompile, originalCompile, 'fog is installed before the first renderable frame');
assert.deepEqual(reveal.getSnapshot().worldToPlatform.elements, platform.matrixWorld.clone().invert().elements,
  'fog radial coordinates use the complete platform transform');
assert.equal(reveal.getSnapshot().radius, 20);
reveal.start();
reveal.update(5); assert.equal(reveal.getSnapshot().radius, 18.5);
reveal.update(5); assert.equal(reveal.getSnapshot().radius, 17);
reveal.update(100); assert.equal(reveal.getSnapshot().radius, 17, 'completed reveal holds its radius and shader patch');
reveal.setRadius(6); assert.equal(reveal.getSnapshot().radius, 6);
reveal.setRadius(0); assert.equal(reveal.getSnapshot().radius, 0);
reveal.dispose(); assert.equal(material.onBeforeCompile, originalCompile, 'dispose restores the material lifecycle');

console.log('VR intro platform-radial fog assertions passed.');
