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
  let scenarioFinalPlacement = null;

  function captureScenarioFinalPlacement() {
    scenarioFinalPlacement = { position: motionRoot.position.clone(), quaternion: motionRoot.quaternion.clone() };
  }

  function hydrateScenarioState(state) {
    if (state?.placement !== 'FINAL_STONE' || !scenarioFinalPlacement) {
      throw new Error('[monkeyModel] FINAL_STONE scenario placement has not been captured');
    }
    motionRoot.position.copy(scenarioFinalPlacement.position);
    motionRoot.quaternion.copy(scenarioFinalPlacement.quaternion);
    visualRoot.visible = state.visible === true;
    stoneRoot.visible = state.stoneVisible === true;
    dockCharacterToStone();
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

  function dockStoneToCharacter() {
    if (!stoneAsset || !characterAnchor || !seatAnchor || !stoneRoot.parent) return false;
    characterAnchor.updateWorldMatrix(true, true);
    stoneRoot.updateWorldMatrix(true, true);
    const seatInStone = matrixRelativeTo(seatAnchor, stoneRoot);
    const seatPosition = new THREE.Vector3();
    const seatQuaternion = new THREE.Quaternion();
    const ignoredSeatScale = new THREE.Vector3();
    seatInStone.decompose(seatPosition, seatQuaternion, ignoredSeatScale);

    const characterPosition = characterAnchor.getWorldPosition(new THREE.Vector3());
    const characterQuaternion = characterAnchor.getWorldQuaternion(new THREE.Quaternion());
    const stoneScale = stoneRoot.getWorldScale(new THREE.Vector3());
    const stoneQuaternion = characterQuaternion.multiply(seatQuaternion.invert());
    const seatWorldOffset = seatPosition.clone().multiply(stoneScale).applyQuaternion(stoneQuaternion);
    const stonePosition = characterPosition.sub(seatWorldOffset);

    const stoneWorld = new THREE.Matrix4().compose(stonePosition, stoneQuaternion, stoneScale);
    const stoneLocal = stoneRoot.parent.matrixWorld.clone().invert().multiply(stoneWorld);
    setMatrix(stoneRoot, stoneLocal);
    stoneRoot.updateWorldMatrix(true, true);
    return true;
  }

  return { motionRoot, visualRoot, characterRoot, interactionRoot: characterRoot, stoneRoot, model,
    characterAnchor, authoredStoneRoot, seatAnchor, dockCharacterToStone, dockStoneToCharacter,
    captureScenarioFinalPlacement, hydrateScenarioState };
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
