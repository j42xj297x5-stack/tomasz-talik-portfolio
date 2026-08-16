import assert from 'node:assert/strict';
import * as THREE from '../src/vendor/three.js';
import { calculatePortalScale, createVrPortalDisplay, findPortalCanvasSurface } from '../src/xr/createVrPortalDisplay.js';
import { createVrSpatialPlaque } from '../src/xr/createVrSpatialPlaque.js';
import { ASSET_STAGES, getPreloadAssets } from '../src/assets/assetManifest.js';

assert.equal(calculatePortalScale({ x: 4, y: 2 }, 2, 3), 0.5);
assert.deepEqual(
  getPreloadAssets([ASSET_STAGES.DEFERRED_WARM]).find(({ id }) => id === 'vr-portal-model'),
  { id: 'vr-portal-model', label: 'VR arrival portal model', path: '/glb/portal.glb', type: 'model', stage: 'deferredWarm', critical: false }
);
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(); camera.position.set(0, 1.6, 5); scene.add(camera);
const monkey = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1)); scene.add(monkey);
const portalSource = new THREE.Group();
const frameMaterial = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0.65 });
portalSource.add(new THREE.Mesh(new THREE.BoxGeometry(4, 3, 0.3), frameMaterial));
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
const runtimeFrameMaterial = portal.model.children[0].material;
const fakeCanvas = () => {
  const context = {
    createLinearGradient: () => ({ addColorStop() {} }), fillRect() {}, strokeRect() {}, fillText() {}, clearRect() {},
    measureText: (text) => ({ width: text.length * 10 })
  };
  return { width: 0, height: 0, getContext: () => context };
};
const plaque = createVrSpatialPlaque({
  scene, parent: portal.object, surface: portal.canvasSurface, canvasFactory: fakeCanvas,
  settings: { enabled: true, width: 1.6, height: 0.9, offset: { x: 0, y: 0, z: 0 }, canvasWidth: 1024,
    canvasHeight: 640, titleFontSize: 72, bodyFontSize: 42, maxBodyLines: 6 }
});
const canvasMaterial = plaque.object.material;
assert.notEqual(canvasMaterial, blenderSurface.material, 'plaque takes ownership of the cloned canvas surface material');
portal.hide();
assert.equal(runtimeFrameMaterial.opacity, 0, 'portal starts the shared reveal transparent');
assert.equal(canvasMaterial.opacity, 0, 'portal hide does not override plaque-owned opacity');
portal.reveal(3);
plaque.show({ title: 'Brama', body: 'Place the crystal in the vessel.' }, { duration: 3, animateScale: false });
portal.update(1.5); plaque.update(1.5);
assert.ok(Math.abs(runtimeFrameMaterial.opacity - 0.325) < 1e-8, 'portal fades over the same three seconds');
assert.ok(Math.abs(canvasMaterial.opacity - 0.5) < 1e-8, 'canvas independently fades during the shared reveal');
assert.deepEqual(plaque.object.scale.toArray(), blenderSurface.scale.toArray(), 'waiting reveal does not animate canvas scale');
portal.update(1.5); plaque.update(1.5);
assert.ok(Math.abs(runtimeFrameMaterial.opacity - 0.65) < 1e-8, 'portal restores authored material opacity');
assert.equal(canvasMaterial.opacity, 1, 'canvas reaches full opacity');
portal.update(1);
assert.equal(canvasMaterial.opacity, 1, 'portal updates never overwrite plaque-owned opacity');
assert.equal(portal.object.scale.x, 1, 'portal reveal does not animate scale');
portal.hide();
portal.hydrateScenarioState({ visible: true });
assert.equal(portal.object.visible, true, 'settled hydration materializes the portal immediately');
assert.equal(runtimeFrameMaterial.opacity, 0.65, 'settled hydration does not replay the reveal animation');
portal.update(1);
assert.equal(runtimeFrameMaterial.opacity, 0.65, 'hydrated portal remains settled');
assert.equal(canvasMaterial.opacity, 1, 'portal hydration leaves PortalCanvas owned by the plaque');
plaque.dispose();
portal.dispose(); assert.equal(portal.object.parent, null);
console.log('VR portal display assertions passed');
