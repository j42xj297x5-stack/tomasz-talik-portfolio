import assert from 'node:assert/strict';
import * as THREE from '../src/vendor/three.js';
import { calculatePortalScale, createVrPortalDisplay, findPortalCanvasSurface } from '../src/xr/createVrPortalDisplay.js';
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
const blenderSurface = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 0.9));
blenderSurface.name = 'PORTAL_CANVAS_SURFACE';
blenderSurface.userData.portal_role = 'canvas_surface';
blenderSurface.position.set(0.2, 0.3, 0.4);
portalSource.add(blenderSurface);
assert.equal(findPortalCanvasSurface(portalSource), blenderSurface);
const noGeometry = new THREE.Object3D(); noGeometry.name = 'PORTAL_CANVAS_SURFACE';
assert.equal(findPortalCanvasSurface(noGeometry), null);
const noUvs = new THREE.Mesh(new THREE.BufferGeometry()); noUvs.name = 'PORTAL_CANVAS_SURFACE';
noUvs.geometry.setAttribute('position', new THREE.Float32BufferAttribute([0, 0, 0], 3));
assert.equal(findPortalCanvasSurface(noUvs), null);
scene.updateMatrixWorld(true);
const portal = createVrPortalDisplay({ parent: scene, portalModel: portalSource, settings: { enabled: true, position: { x: -2, y: 0, z: -0.5 }, maxWidth: 2.8, maxHeight: 3.2, floorOffset: 0 } });
assert.equal(portal.canvasSurface.name, 'PORTAL_CANVAS_SURFACE');
assert.equal(portal.canvasSurface.parent, portal.model);
assert.deepEqual(portal.canvasSurface.position.toArray(), blenderSurface.position.toArray());
const canvas = new THREE.Mesh(new THREE.PlaneGeometry(1, 1)); canvas.name = 'VrPortalCanvas'; portal.object.add(canvas);
assert.equal(portal.place(), true);
assert.equal(portal.object.visible, true);
assert.equal(canvas.parent, portal.object);
assert.ok(Math.abs(canvas.getWorldQuaternion(new THREE.Quaternion()).dot(portal.model.getWorldQuaternion(new THREE.Quaternion()))) > 0.999999);
const firstPosition = portal.object.position.clone();
assert.equal(firstPosition.x, -2);
assert.equal(firstPosition.z, -0.5);
monkey.position.set(10, 0, 4);
portal.place(); assert.ok(portal.object.position.distanceTo(firstPosition) < 1e-8,
  'portal place never reads the monkey transform');
camera.position.set(99, 12, -40); camera.rotation.set(1, 2, 3);
portal.place(); assert.ok(portal.object.position.distanceTo(firstPosition) < 1e-8);
const floorBound = new THREE.Box3().setFromObject(portal.model);
assert.ok(Math.abs(floorBound.min.y) < 1e-8);
const portalForward = new THREE.Vector3(0, 0, 1).applyQuaternion(portal.object.quaternion);
assert.deepEqual(portalForward.toArray(), [0, 0, 1], 'fixture rotation is a direct canonical local transform');
portal.reset(); assert.equal(portal.object.visible, true); assert.ok(portal.object.position.distanceTo(firstPosition) < 1e-8);
portal.dispose(); assert.equal(portal.object.parent, null);
console.log('VR portal display assertions passed');
