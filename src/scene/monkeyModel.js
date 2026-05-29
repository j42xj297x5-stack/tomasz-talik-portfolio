import * as THREE from '../vendor/three.js';
import { resolveVendoredGLTFLoader } from '../utils/gltfLoader.js';
import { publicPath } from '../utils/publicPath.js';

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

export async function loadMonkeyModel({ scene, fallbackObject }) {
  const monkeyUrl = publicPath(MONKEY_GLB_PATH);
  const GLTFLoader = await resolveVendoredGLTFLoader('monkeyModel');
  if (!GLTFLoader) {
    console.info(`[monkeyModel] Placeholder fallback retained because GLTFLoader was unavailable. Expected model URL: ${monkeyUrl}`);
    return null;
  }

  const loader = new GLTFLoader();
  console.info(`[monkeyModel] Monkey GLB load URL: ${monkeyUrl}`);

  return new Promise((resolve) => {
    loader.load(
      monkeyUrl,
      (gltf) => {
        const model = gltf.scene;
        placeModelAtFallback(model, fallbackObject);
        scene.add(model);
        fallbackObject.visible = false;
        console.info(`[monkeyModel] Monkey model loaded from ${monkeyUrl}. Placeholder hidden.`);
        resolve(model);
      },
      undefined,
      (error) => {
        console.warn(
          `[monkeyModel] Failed to load monkey model at ${monkeyUrl}. Placeholder fallback retained.`,
          error
        );
        resolve(null);
      }
    );
  });
}
