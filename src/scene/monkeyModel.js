import * as THREE from '../vendor/three.js';

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

  return { characterRoot: characterAsset, stoneAsset, characterAnchor, authoredStoneRoot, seatAnchor, scale: 1 };
}

function createMonkeyActor({ actorParent, fixtureParent, fallbackObject, model, characterRoot = model, stoneAsset = null,
  characterAnchor = null, authoredStoneRoot = null, seatAnchor = null, scale = 1 }) {
  const motionRoot = new THREE.Group();
  motionRoot.name = 'VrMonkeyMotionRoot';
  const visualRoot = new THREE.Group();
  visualRoot.name = 'VrMonkeyVisualRoot';
  const stoneRoot = new THREE.Group();
  stoneRoot.name = 'VrMonkeyStoneRoot';

  actorParent.add(motionRoot);
  motionRoot.add(visualRoot);
  if (model === fallbackObject) { model.position.set(0, 0, 0); model.quaternion.identity(); }
  visualRoot.add(characterRoot);
  visualRoot.scale.setScalar(scale);
  if (stoneAsset) { fixtureParent.add(stoneRoot); stoneRoot.add(stoneAsset); stoneRoot.scale.setScalar(scale); }

  if (stoneAsset && authoredStoneRoot) {
    const authoredRootInAsset = matrixRelativeTo(authoredStoneRoot, stoneAsset);
    setMatrix(stoneAsset, authoredRootInAsset.invert());
  }

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

  function dockCharacterToStone() {
    if (!stoneAsset || !characterAnchor || !seatAnchor || !stoneRoot.parent) return false;
    motionRoot.updateWorldMatrix(true, true);
    stoneRoot.updateWorldMatrix(true, true);
    const anchorInVisual = matrixRelativeTo(characterAnchor, visualRoot);
    const anchorPosition = new THREE.Vector3();
    const anchorQuaternion = new THREE.Quaternion();
    const ignoredAnchorScale = new THREE.Vector3();
    anchorInVisual.decompose(anchorPosition, anchorQuaternion, ignoredAnchorScale);

    const seatPosition = seatAnchor.getWorldPosition(new THREE.Vector3());
    const seatQuaternion = seatAnchor.getWorldQuaternion(new THREE.Quaternion());
    const visualScale = visualRoot.getWorldScale(new THREE.Vector3());
    const visualQuaternion = seatQuaternion.multiply(anchorQuaternion.invert());
    const visualPosition = anchorPosition.clone().multiply(visualScale).applyQuaternion(visualQuaternion);
    visualPosition.multiplyScalar(-1).add(seatPosition);

    const visualWorld = new THREE.Matrix4().compose(visualPosition, visualQuaternion, visualScale);
    const visualLocal = motionRoot.matrixWorld.clone().invert().multiply(visualWorld);
    setMatrix(visualRoot, visualLocal);
    visualRoot.updateWorldMatrix(true, true);
    return true;
  }

  return { motionRoot, visualRoot, characterRoot, interactionRoot: characterRoot, stoneRoot, model,
    characterAnchor, authoredStoneRoot, seatAnchor, dockCharacterToStone, setEmergeAlpha, getEmergeAlpha: () => emergeAlpha,
    disposeEmergenceMaterials() { emergenceMaterials.forEach(({ material }) => material.dispose()); } };
}

export async function loadMonkeyModel({ actorParent, fixtureParent = actorParent, fallbackObject, assetManager = null }) {
  const characterAsset = assetManager?.cloneGltfScene?.('monkey-model');
  const stoneAsset = assetManager?.cloneGltfScene?.('monkey-stone-model');
  if (!characterAsset || !stoneAsset) {
    console.info('[monkeyModel] Placeholder fallback retained because the authored Monkey assets were not in AssetManager cache.');
    return createMonkeyActor({ actorParent, fixtureParent, fallbackObject, model: fallbackObject });
  }

  const composition = assembleMonkeyAssets({ characterAsset, stoneAsset });
  const actor = createMonkeyActor({ actorParent, fixtureParent, fallbackObject, model: characterAsset, ...composition });
  fallbackObject.visible = false;
  console.info('[monkeyModel] Authored Monkey actor and stationary stone fixture attached from AssetManager cache. Placeholder hidden.');
  return actor;
}
