import assert from 'node:assert/strict';
import * as THREE from '../src/vendor/three.js';
import { portfolioNodes } from '../src/content/portfolioNodes.js';
import { calculateUniformPlaqueScale, createVrGlyphPlaque } from '../src/xr/createVrGlyphPlaque.js';
assert.deepEqual(Object.fromEntries(portfolioNodes.map(({ id, plaqueModelPath }) => [id, plaqueModelPath])), {
  'ai-guide': '/glb/plaque_ai_guide.glb', 'spotify-digger': '/glb/plaque_dig_engine.glb',
  'haiku-cosmos': '/glb/plaque_haiku_cosmos.glb', 'creative-ai': '/glb/plaque_creative_ai.glb',
  'ethics-life-protection': '/glb/plaque_ethics.glb'
});
assert.equal(calculateUniformPlaqueScale({ x: 3, y: 1 }, 1.35, 0.9), 0.45);
const sourceMaterial = new THREE.MeshBasicMaterial({ opacity: 0.6, transparent: true, depthWrite: true });
const source = new THREE.Group(); source.add(new THREE.Mesh(new THREE.BoxGeometry(3, 1, 0.2), sourceMaterial));
const assets = new Map([['ai-guide', source]]); assets.visuals = new Map([['ai-guide', { frontYawOffset: 0 }]]);
const scene = new THREE.Scene(); const camera = new THREE.PerspectiveCamera(); camera.position.set(1, 1.6, 3); camera.rotation.x = 0.7; scene.add(camera); scene.updateMatrixWorld(true);
const plaque = createVrGlyphPlaque({ scene, camera, renderer: { xr: { getCamera: () => camera } }, settings: { enabled: true, maxWidth: 1.35, maxHeight: 0.9, distance: 1.35, verticalOffset: -0.42, appearDuration: 0.42, appearStartScale: 0.92 }, plaqueAssets: assets });
const glyph = new THREE.Group(); glyph.userData.id = 'ai-guide';
assert.equal(plaque.showForGlyph(glyph), true); assert.equal(plaque.state, 'appearing'); assert.ok(Math.abs(plaque.object.position.y - 1.18) < 1e-9); assert.ok(Math.abs(plaque.object.rotation.x) < 1e-9);
assert.equal(sourceMaterial.opacity, 0.6); plaque.update(0.42); assert.equal(plaque.state, 'visible');
const mesh = plaque.object.getObjectByProperty('isMesh', true); assert.equal(mesh.material.opacity, 0.6);
plaque.reset(); assert.equal(plaque.object.children.length, 1); plaque.dispose(); plaque.dispose(); assert.equal(plaque.object.parent, null);
console.log('VR glyph plaque assertions passed');
