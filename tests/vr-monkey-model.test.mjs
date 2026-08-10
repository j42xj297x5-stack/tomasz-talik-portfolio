import assert from 'node:assert/strict';
import * as THREE from '../src/vendor/three.js';
import { assembleMonkeyAssets, loadMonkeyModel } from '../src/scene/monkeyModel.js';

function createPlaceholder(scene) { const object = new THREE.Mesh(new THREE.BoxGeometry(1, 2, 1), new THREE.MeshBasicMaterial()); object.position.set(2, .5, -3); scene.add(object); return object; }
function makeAssets() {
  const character = new THREE.Group(); const anchor = new THREE.Group(); anchor.name = 'MONKEY_ANCHOR';
  anchor.position.set(.3, .7, -.2); anchor.rotation.set(.2, -.3, .1); anchor.scale.set(1.2, .8, 1.1);
  const material = new THREE.MeshBasicMaterial({ opacity: .7 }); const monkey = new THREE.Mesh(new THREE.BoxGeometry(2, 4, 1), material); monkey.name = 'monkey'; anchor.add(monkey); character.add(anchor);
  const stone = new THREE.Group(); const root = new THREE.Group(); root.name = 'MONKEY_STONE_ROOT';
  root.position.set(-.4, .2, .5); root.rotation.set(-.1, .4, .2); root.scale.set(.9, 1.3, .7);
  const seat = new THREE.Group(); seat.name = 'MONKEY_SEAT_ANCHOR'; seat.position.set(.1, .6, -.3); seat.rotation.set(.15, .25, -.2); seat.scale.set(.75, 1.1, 1.4);
  root.add(new THREE.Mesh(new THREE.BoxGeometry(3, .5, 2), new THREE.MeshBasicMaterial()), seat); stone.add(root);
  return { character, stone, anchor, seat, material };
}
const worldMatrix = (object) => { object.updateWorldMatrix(true, false); return object.matrixWorld.clone(); };
const matricesNear = (a, b) => a.elements.every((value, index) => Math.abs(value - b.elements[index]) < 1e-10);

const alignment = makeAssets(); const assembled = assembleMonkeyAssets({ characterAsset: alignment.character, stoneAsset: alignment.stone });
assert.equal(assembled.assemblyRoot.name, 'VrMonkeyAssemblyRoot');
assert.ok(matricesNear(worldMatrix(alignment.anchor), worldMatrix(alignment.seat)), 'full nonzero anchor TRS coincides');
const uniform = assembled.assemblyRoot.scale.x; assert.ok(uniform > 0); assert.deepEqual(assembled.assemblyRoot.scale.toArray(), [uniform, uniform, uniform]);
assert.ok(matricesNear(worldMatrix(alignment.anchor), worldMatrix(alignment.seat)), 'coincidence survives uniform assembly scale');
assert.equal(alignment.stone.parent, assembled.assemblyRoot); assert.equal(alignment.character.parent, assembled.assemblyRoot);

const scene = new THREE.Scene(); const placeholder = createPlaceholder(scene); const assets = makeAssets();
const actor = await loadMonkeyModel({ scene, fallbackObject: placeholder, assetManager: { cloneGltfScene: (id) => id === 'monkey-model' ? assets.character : assets.stone } });
assert.equal(actor.motionRoot.name, 'VrMonkeyMotionRoot'); assert.equal(actor.visualRoot.name, 'VrMonkeyVisualRoot');
assert.equal(actor.assemblyRoot.parent, actor.visualRoot); assert.equal(actor.visualRoot.parent, actor.motionRoot);
assert.equal(actor.interactionRoot, actor.characterRoot); assert.notEqual(actor.interactionRoot, actor.stoneRoot);
assert.deepEqual(actor.motionRoot.scale.toArray(), [1, 1, 1]); assert.deepEqual(actor.motionRoot.position.toArray(), [2, .5, -3]);
const runtimeMonkeyMaterial = actor.characterRoot.getObjectByName('monkey').material;
assert.notEqual(runtimeMonkeyMaterial, assets.material); actor.setEmergeAlpha(0); assert.equal(runtimeMonkeyMaterial.opacity, 0);
actor.setEmergeAlpha(1); assert.equal(runtimeMonkeyMaterial.opacity, .7);
const before = actor.assemblyRoot.getWorldPosition(new THREE.Vector3()); actor.motionRoot.position.x += 10; scene.updateMatrixWorld(true);
assert.ok(Math.abs(actor.assemblyRoot.getWorldPosition(new THREE.Vector3()).x - before.x - 10) < 1e-9);

const fallbackScene = new THREE.Scene(); const fallback = createPlaceholder(fallbackScene); const fallbackActor = await loadMonkeyModel({ scene: fallbackScene, fallbackObject: fallback });
assert.equal(fallbackActor.model, fallback); assert.equal(fallback.parent, fallbackActor.visualRoot);
console.log('VR authored Monkey assembly assertions passed.');
