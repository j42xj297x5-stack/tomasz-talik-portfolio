import assert from 'node:assert/strict';
import * as THREE from '../src/vendor/three.js';
import { loadMonkeyModel } from '../src/scene/monkeyModel.js';

function createPlaceholder(scene) {
  const placeholder = new THREE.Mesh(new THREE.BoxGeometry(1, 2, 1), new THREE.MeshBasicMaterial());
  placeholder.position.set(2, 0.5, -3);
  scene.add(placeholder);
  return placeholder;
}

const scene = new THREE.Scene();
const placeholder = createPlaceholder(scene);
const sourceModel = new THREE.Group();
const mesh = new THREE.Mesh(new THREE.BoxGeometry(2, 4, 1), new THREE.MeshBasicMaterial());
mesh.position.set(5, 2, -1);
sourceModel.add(mesh);
const actor = await loadMonkeyModel({ scene, fallbackObject: placeholder,
  assetManager: { cloneGltfScene: () => sourceModel } });

assert.equal(actor.motionRoot.name, 'VrMonkeyMotionRoot');
assert.equal(actor.visualRoot.name, 'VrMonkeyVisualRoot');
assert.notEqual(actor.motionRoot, actor.visualRoot);
assert.equal(actor.visualRoot.parent, actor.motionRoot);
assert.equal(actor.model.parent, actor.visualRoot);
assert.ok(actor.visualRoot.getObjectById(actor.model.id), 'model is a descendant of the visual root');
assert.deepEqual(actor.motionRoot.scale.toArray(), [1, 1, 1]);
assert.deepEqual(actor.motionRoot.position.toArray(), [2, 0.5, -3], 'bbox centering does not enter the motion root');

scene.updateMatrixWorld(true);
const beforeWorld = actor.model.getWorldPosition(new THREE.Vector3());
const correction = actor.model.position.clone();
actor.motionRoot.position.x += 10;
scene.updateMatrixWorld(true);
assert.ok(Math.abs(actor.model.getWorldPosition(new THREE.Vector3()).x - beforeWorld.x - 10) < 1e-9);
assert.deepEqual(actor.model.position.toArray(), correction.toArray(), 'logical motion preserves visual correction');
actor.model.position.y += 3;
assert.deepEqual(actor.motionRoot.position.toArray(), [12, 0.5, -3], 'visual offset cannot alter logical position');

const fallbackScene = new THREE.Scene();
const fallback = createPlaceholder(fallbackScene);
const fallbackActor = await loadMonkeyModel({ scene: fallbackScene, fallbackObject: fallback });
assert.equal(fallbackActor.model, fallback);
assert.equal(fallback.parent, fallbackActor.visualRoot);
assert.equal(fallbackActor.visualRoot.parent, fallbackActor.motionRoot);
assert.notEqual(fallbackActor.motionRoot, fallbackActor.model);

sourceModel.traverse((object) => { object.geometry?.dispose(); object.material?.dispose(); });
fallback.geometry.dispose(); fallback.material.dispose();
console.log('VR monkey model root contract assertions passed.');
