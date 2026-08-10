import * as THREE from '../vendor/three.js';

const MONKEY_TARGET_DIMENSION = 2.0;

function findUniqueNode(root, name) {
  const matches = [];
  root.traverse((object) => { if (object.name === name) matches.push(object); });
  if (matches.length !== 1) throw new Error(`[monkeyModel] Expected exactly one ${name}; found ${matches.length}.`);
  return matches[0];
}

function matrixRelativeTo(node, root) {
  root.updateWorldMatrix(true, true);
  return new THREE.Matrix4().copy(root.matrixWorld).invert().multiply(node.matrixWorld);
}

function setMatrix(object, matrix) {
  object.matrix.copy(matrix);
  object.matrixAutoUpdate = false;
}

export function assembleMonkeyAssets({ characterAsset, stoneAsset }) {
  const characterAnchor = findUniqueNode(characterAsset, 'MONKEY_ANCHOR');
  const monkeyMesh = findUniqueNode(characterAsset, 'monkey');
  const authoredStoneRoot = findUniqueNode(stoneAsset, 'MONKEY_STONE_ROOT');
  const seatAnchor = findUniqueNode(stoneAsset, 'MONKEY_SEAT_ANCHOR');
  if (!characterAnchor.getObjectById(monkeyMesh.id)) throw new Error('[monkeyModel] MONKEY_ANCHOR must be an ancestor of monkey.');
  if (!authoredStoneRoot.getObjectById(seatAnchor.id)) throw new Error('[monkeyModel] MONKEY_SEAT_ANCHOR must belong to MONKEY_STONE_ROOT.');

  const characterSize = new THREE.Box3().setFromObject(characterAsset).getSize(new THREE.Vector3());
  const maxDimension = Math.max(characterSize.x, characterSize.y, characterSize.z) || 1;
  const scale = MONKEY_TARGET_DIMENSION / maxDimension;
  return { characterRoot: characterAsset, stoneAsset, characterAnchor, seatAnchor, scale };
}

function createMonkeyActor({ scene, fallbackObject, model, characterRoot = model, stoneAsset = null,
  characterAnchor = null, seatAnchor = null, scale = 1 }) {
  const motionRoot = new THREE.Group();
  motionRoot.name = 'VrMonkeyMotionRoot';
  const visualRoot = new THREE.Group();
  visualRoot.name = 'VrMonkeyVisualRoot';
  const stoneRoot = new THREE.Group();
  stoneRoot.name = 'VrMonkeyStoneRoot';

  fallbackObject.updateWorldMatrix(true, false);
  const worldPosition = fallbackObject.getWorldPosition(new THREE.Vector3());
  const worldQuaternion = fallbackObject.getWorldQuaternion(new THREE.Quaternion());
  scene.add(motionRoot);
  scene.worldToLocal(worldPosition);
  motionRoot.position.copy(worldPosition);
  motionRoot.quaternion.copy(worldQuaternion);
  motionRoot.add(visualRoot);
  if (model === fallbackObject) { model.position.set(0, 0, 0); model.quaternion.identity(); }
  visualRoot.add(characterRoot);
  visualRoot.scale.setScalar(scale);
  if (stoneAsset) { scene.add(stoneRoot); stoneRoot.add(stoneAsset); stoneRoot.scale.setScalar(scale); }

  const emergenceMaterials = [];
  visualRoot.traverse((object) => {
    if (!object.isMesh || !object.material) return;
    const sourceMaterials = Array.isArray(object.material) ? object.material : [object.material];
    const runtimeMaterials = sourceMaterials.map((source) => {
      const material = source.clone();
      emergenceMaterials.push({ material, baseOpacity: material.opacity,
        baseTransparent: material.transparent, baseDepthWrite: material.depthWrite });
      return material;
    });
    object.material = Array.isArray(object.material) ? runtimeMaterials : runtimeMaterials[0];
  });

  let emergeAlpha = 1;
  function setEmergeAlpha(value) {
    emergeAlpha = THREE.MathUtils.clamp(Number.isFinite(value) ? value : 1, 0, 1);
    emergenceMaterials.forEach(({ material, baseOpacity, baseTransparent, baseDepthWrite }) => {
      material.opacity = baseOpacity * emergeAlpha;
      material.transparent = emergeAlpha < 1 || baseTransparent;
      material.depthWrite = emergeAlpha < 1 ? false : baseDepthWrite;
      material.needsUpdate = true;
    });
  }

  function dockStoneToCanonicalMonkey() {
    if (!stoneAsset || !characterAnchor || !seatAnchor || !stoneRoot.parent) return false;
    motionRoot.updateWorldMatrix(true, true);
    stoneRoot.updateWorldMatrix(true, true);
    const anchorWorld = characterAnchor.matrixWorld.clone();
    const seatInStone = matrixRelativeTo(seatAnchor, stoneRoot);
    stoneRoot.parent.updateWorldMatrix(true, false);
    const stoneLocal = stoneRoot.parent.matrixWorld.clone().invert().multiply(anchorWorld).multiply(seatInStone.invert());
    setMatrix(stoneRoot, stoneLocal);
    stoneRoot.updateWorldMatrix(true, true);
    return true;
  }

  return { motionRoot, visualRoot, characterRoot, interactionRoot: characterRoot, stoneRoot, model,
    characterAnchor, seatAnchor, dockStoneToCanonicalMonkey, setEmergeAlpha, getEmergeAlpha: () => emergeAlpha,
    disposeEmergenceMaterials() { emergenceMaterials.forEach(({ material }) => material.dispose()); } };
}

export async function loadMonkeyModel({ scene, fallbackObject, assetManager = null }) {
  const characterAsset = assetManager?.cloneGltfScene?.('monkey-model');
  const stoneAsset = assetManager?.cloneGltfScene?.('monkey-stone-model');
  if (!characterAsset || !stoneAsset) {
    console.info('[monkeyModel] Placeholder fallback retained because the authored Monkey assets were not in AssetManager cache.');
    return createMonkeyActor({ scene, fallbackObject, model: fallbackObject });
  }

  const composition = assembleMonkeyAssets({ characterAsset, stoneAsset });
  const actor = createMonkeyActor({ scene, fallbackObject, model: characterAsset, ...composition });
  fallbackObject.visible = false;
  console.info('[monkeyModel] Authored Monkey actor and stationary stone fixture attached from AssetManager cache. Placeholder hidden.');
  return actor;
}
