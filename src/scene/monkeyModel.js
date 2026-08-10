import * as THREE from '../vendor/three.js';

const MONKEY_GLB_PATH = 'glb/monkey.glb';
const MONKEY_TARGET_DIMENSION = 2.0;
const MONKEY_YAW_TO_CAMERA = 0;

function prepareVisualModel(model) {
  const box = new THREE.Box3().setFromObject(model);
  const size = new THREE.Vector3();
  box.getSize(size);

  const maxDimension = Math.max(size.x, size.y, size.z) || 1;
  const uniformScale = MONKEY_TARGET_DIMENSION / maxDimension;

  model.scale.setScalar(uniformScale);
  model.updateMatrixWorld(true);

  const centeredBox = new THREE.Box3().setFromObject(model);
  const center = new THREE.Vector3();
  centeredBox.getCenter(center);

  model.position.sub(center);
  model.rotation.y = MONKEY_YAW_TO_CAMERA;
}

function createMonkeyActor({ scene, fallbackObject, model }) {
  const motionRoot = new THREE.Group();
  motionRoot.name = 'VrMonkeyMotionRoot';
  const visualRoot = new THREE.Group();
  visualRoot.name = 'VrMonkeyVisualRoot';

  fallbackObject.updateWorldMatrix(true, false);
  const worldPosition = fallbackObject.getWorldPosition(new THREE.Vector3());
  const worldQuaternion = fallbackObject.getWorldQuaternion(new THREE.Quaternion());
  scene.add(motionRoot);
  scene.worldToLocal(worldPosition);
  motionRoot.position.copy(worldPosition);
  motionRoot.quaternion.copy(worldQuaternion);
  motionRoot.add(visualRoot);
  if (model === fallbackObject) {
    model.position.set(0, 0, 0);
    model.quaternion.identity();
  }
  visualRoot.add(model);

  return { motionRoot, visualRoot, model };
}

export async function loadMonkeyModel({ scene, fallbackObject, assetManager = null }) {
  const loadedModel = assetManager?.cloneGltfScene?.('monkey-model');
  if (!loadedModel) {
    console.info('[monkeyModel] Placeholder fallback retained because the monkey model was not in AssetManager cache.');
    const actor = createMonkeyActor({ scene, fallbackObject, model: fallbackObject });
    return actor;
  }

  prepareVisualModel(loadedModel);
  const actor = createMonkeyActor({ scene, fallbackObject, model: loadedModel });
  fallbackObject.visible = false;
  console.info('[monkeyModel] Monkey model attached from AssetManager cache. Placeholder hidden.');
  return actor;
}
