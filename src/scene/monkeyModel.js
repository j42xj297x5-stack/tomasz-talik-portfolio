import * as THREE from '../vendor/three.js';

const MONKEY_GLB_PATH = 'glb/monkey.glb';
const MONKEY_TARGET_DIMENSION = 2.0;
const MONKEY_YAW_TO_CAMERA = 0;

function placeModelAtFallback(model, fallbackObject) {
  const fallbackPosition = new THREE.Vector3();
  fallbackObject.getWorldPosition(fallbackPosition);

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
  model.position.add(fallbackPosition);

  model.rotation.y = MONKEY_YAW_TO_CAMERA;
}

export async function loadMonkeyModel({ scene, fallbackObject, assetManager = null }) {
  const model = assetManager?.cloneGltfScene?.('monkey-model');
  if (!model) {
    console.info('[monkeyModel] Placeholder fallback retained because the monkey model was not in AssetManager cache.');
    return null;
  }

  placeModelAtFallback(model, fallbackObject);
  scene.add(model);
  fallbackObject.visible = false;
  console.info('[monkeyModel] Monkey model attached from AssetManager cache. Placeholder hidden.');
  return model;
}
