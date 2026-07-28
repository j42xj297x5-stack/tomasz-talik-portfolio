import assert from 'node:assert/strict';
import * as THREE from '../src/vendor/three.js';
import {
  createVrSpatialPlaque,
  resolveVrPlaqueContent,
  wrapCanvasText
} from '../src/xr/createVrSpatialPlaque.js';

const measured = { measureText: (text) => ({ width: text.length * 10 }) };
assert.deepEqual(wrapCanvasText(measured, 'one two three', 75, 3), ['one two', 'three']);
assert.deepEqual(wrapCanvasText(measured, '', 75, 3), []);
assert.deepEqual(wrapCanvasText(measured, undefined, 75, 3), []);
assert.deepEqual(wrapCanvasText(measured, 'one two three four five', 75, 2), ['one two', 'three…']);
assert.deepEqual(wrapCanvasText(measured, 'unbreakable', 55, 2), ['unbr…']);
assert.deepEqual(resolveVrPlaqueContent({ title: '', leadText: '' }), {
  title: 'Brama', body: 'Pierwszy znak otwiera drogę do wnętrza kręgu.'
});
assert.deepEqual(resolveVrPlaqueContent({ title: 'Glyph', leadText: 'Short lead', bodyText: 'Long body' }), {
  title: 'Glyph', body: 'Short lead'
});

function fakeCanvas() {
  const gradient = { addColorStop() {} };
  const context = {
    fillStyle: '', strokeStyle: '', lineWidth: 0, textBaseline: '', font: '',
    createLinearGradient: () => gradient,
    fillRect() {}, strokeRect() {}, fillText() {}, clearRect() {},
    measureText: measured.measureText
  };
  return { width: 0, height: 0, getContext: () => context };
}

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera();
camera.position.set(2, 1.7, 3);
camera.rotation.set(0.6, Math.PI / 2, 0);
scene.add(camera);
scene.updateMatrixWorld(true);
const settings = {
  enabled: true, width: 1.35, height: 0.85, distance: 1.4, verticalOffset: -0.05,
  canvasWidth: 1024, canvasHeight: 640, titleFontSize: 72, bodyFontSize: 42, maxBodyLines: 6
};
const plaque = createVrSpatialPlaque({
  scene, camera, renderer: { xr: { getCamera: () => camera } }, settings, canvasFactory: fakeCanvas
});
const sameObject = plaque.object;
assert.equal(plaque.state, 'hidden');
assert.equal(plaque.object.visible, false);
assert.equal(plaque.show({ title: 'Title', body: 'Body' }), true);
assert.equal(plaque.state, 'appearing');
assert.ok(Math.abs(plaque.object.position.x - 0.6) < 1e-9);
assert.ok(Math.abs(plaque.object.position.y - 1.65) < 1e-9);
assert.ok(Math.abs(plaque.object.position.z - 3) < 1e-9);
assert.ok(Math.abs(plaque.object.rotation.x) < 1e-9);
assert.ok(Math.abs(plaque.object.rotation.z) < 1e-9);
const anchoredPosition = plaque.object.position.clone();
camera.position.set(8, 4, 8);
plaque.update(0.21);
assert.deepEqual(plaque.object.position.toArray(), anchoredPosition.toArray());
plaque.update(0.21);
assert.equal(plaque.state, 'visible');
assert.equal(plaque.object.material.opacity, 1);
plaque.show({ title: 'Updated', body: 'Still one mesh' });
assert.equal(plaque.object, sameObject);
assert.equal(scene.children.filter((child) => child.name === 'VrSpatialPlaque').length, 1);
plaque.reset();
assert.equal(plaque.state, 'hidden');
assert.equal(plaque.object.visible, false);
plaque.dispose();
plaque.dispose();
assert.equal(plaque.object.parent, null);
assert.equal(plaque.show({ title: 'No', body: 'No' }), false);

console.log('VR spatial plaque assertions passed');
