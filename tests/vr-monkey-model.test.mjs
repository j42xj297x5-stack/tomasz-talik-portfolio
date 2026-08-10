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
assert.ok(assembled.scale > 0);
assert.equal(alignment.character.parent, null); assert.equal(alignment.stone.parent, null);

const scene = new THREE.Scene(); const placeholder = createPlaceholder(scene); const assets = makeAssets();
const actor = await loadMonkeyModel({ actorParent: scene, fixtureParent: scene, fallbackObject: placeholder, assetManager: { cloneGltfScene: (id) => id === 'monkey-model' ? assets.character : assets.stone } });
assert.equal(actor.motionRoot.name, 'VrMonkeyMotionRoot'); assert.equal(actor.visualRoot.name, 'VrMonkeyVisualRoot');
assert.equal(actor.stoneRoot.name, 'VrMonkeyStoneRoot'); assert.equal(actor.visualRoot.parent, actor.motionRoot);
assert.equal(actor.characterRoot.parent, actor.visualRoot); assert.equal(actor.stoneRoot.parent, scene);
assert.notEqual(actor.stoneRoot.parent, actor.motionRoot); assert.notEqual(actor.stoneRoot.parent, actor.visualRoot);
assert.equal(actor.interactionRoot, actor.characterRoot); assert.notEqual(actor.interactionRoot, actor.stoneRoot);
assert.deepEqual(actor.motionRoot.scale.toArray(), [1, 1, 1]); assert.deepEqual(actor.motionRoot.position.toArray(), [0, 0, 0]);
assert.equal(actor.dockStoneToCanonicalMonkey(), true);
assert.ok(matricesNear(worldMatrix(actor.characterAnchor), worldMatrix(actor.seatAnchor)), 'full authored anchor matrices dock at canonical pose');
const runtimeMonkeyMaterial = actor.characterRoot.getObjectByName('monkey').material;
assert.notEqual(runtimeMonkeyMaterial, assets.material); actor.setEmergeAlpha(0); assert.equal(runtimeMonkeyMaterial.opacity, 0);
actor.setEmergeAlpha(1); assert.equal(runtimeMonkeyMaterial.opacity, .7);
const stoneBefore = worldMatrix(actor.stoneRoot); const monkeyBefore = actor.characterRoot.getWorldPosition(new THREE.Vector3()); actor.motionRoot.position.x += 10; scene.updateMatrixWorld(true);
assert.ok(Math.abs(actor.characterRoot.getWorldPosition(new THREE.Vector3()).x - monkeyBefore.x - 10) < 1e-9);
assert.ok(matricesNear(worldMatrix(actor.stoneRoot), stoneBefore), 'moving Monkey does not move stone');
actor.motionRoot.position.x -= 10; scene.updateMatrixWorld(true);
assert.ok(matricesNear(worldMatrix(actor.stoneRoot), stoneBefore), 'returning Monkey leaves stone transform unchanged');
assert.ok(matricesNear(worldMatrix(actor.characterAnchor), worldMatrix(actor.seatAnchor)), 'canonical return restores authored docking without a snap');

const fallbackScene = new THREE.Scene(); const fallback = createPlaceholder(fallbackScene); const fallbackActor = await loadMonkeyModel({ actorParent: fallbackScene, fixtureParent: fallbackScene, fallbackObject: fallback });
assert.equal(fallbackActor.model, fallback); assert.equal(fallback.parent, fallbackActor.visualRoot);
console.log('VR authored Monkey and stationary stone assertions passed.');
