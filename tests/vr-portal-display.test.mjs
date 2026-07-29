import assert from 'node:assert/strict';
import * as THREE from '../src/vendor/three.js';
import { calculatePortalScale, createVrPortalDisplay } from '../src/xr/createVrPortalDisplay.js';
import { ASSET_STAGES, getPreloadAssets } from '../src/assets/assetManifest.js';

assert.equal(calculatePortalScale({ x: 4, y: 2 }, 2, 3), 0.5);
assert.deepEqual(
  getPreloadAssets([ASSET_STAGES.DEFERRED_WARM]).find(({ id }) => id === 'vr-portal-model'),
  { id: 'vr-portal-model', label: 'VR arrival portal model', path: '/glb/portal.glb', type: 'model', stage: 'deferredWarm', critical: false }
);
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(); camera.position.set(0, 1.6, 5); scene.add(camera);
const monkey = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1)); scene.add(monkey);
const portalSource = new THREE.Group(); portalSource.add(new THREE.Mesh(new THREE.BoxGeometry(4, 3, 0.3)));
scene.updateMatrixWorld(true);
const portal = createVrPortalDisplay({ scene, camera, renderer: { xr: { getCamera: () => camera } }, anchorObject: monkey, portalModel: portalSource, settings: { enabled: true, maxWidth: 2.8, maxHeight: 3.2, distance: 2, verticalOffset: 0 } });
const canvas = new THREE.Mesh(new THREE.PlaneGeometry(1, 1)); canvas.name = 'VrPortalCanvas'; portal.object.add(canvas);
assert.equal(portal.place(), true);
assert.equal(portal.object.visible, true);
assert.equal(canvas.parent, portal.object);
assert.ok(Math.abs(canvas.getWorldQuaternion(new THREE.Quaternion()).dot(portal.model.getWorldQuaternion(new THREE.Quaternion()))) > 0.999999);
assert.ok(portal.object.position.distanceTo(camera.position) < camera.position.distanceTo(monkey.position));
portal.reset(); assert.equal(portal.object.visible, false);
portal.dispose(); assert.equal(portal.object.parent, null);
console.log('VR portal display assertions passed');
