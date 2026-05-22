import * as THREE from '../vendor/three.js';

const MONKEY_GLB_URL = '/glb/monkey.glb';
const VENDORED_GLTF_LOADER_PATH = '../../vendor/three/examples/jsm/loaders/GLTFLoader.js';

async function resolveGLTFLoader() {
  try {
    const module = await import(VENDORED_GLTF_LOADER_PATH);
    return module.GLTFLoader;
  } catch (error) {
    console.warn(
      `[monkeyModel] GLTFLoader is missing. Expected loader path: ${VENDORED_GLTF_LOADER_PATH}. ` +
        `Expected model path: ${MONKEY_GLB_URL}. Placeholder fallback retained.`,
      error
    );
    return null;
  }
}

function placeModelAtFallback(model, fallbackObject) {
  const fallbackPosition = new THREE.Vector3();
  fallbackObject.getWorldPosition(fallbackPosition);

  const box = new THREE.Box3().setFromObject(model);
  const size = new THREE.Vector3();
  box.getSize(size);

  const maxDimension = Math.max(size.x, size.y, size.z) || 1;
  const targetDimension = 2.2;
  const uniformScale = targetDimension / maxDimension;

  model.scale.setScalar(uniformScale);
  model.updateMatrixWorld(true);

  const centeredBox = new THREE.Box3().setFromObject(model);
  const center = new THREE.Vector3();
  centeredBox.getCenter(center);

  model.position.sub(center);
  model.position.add(fallbackPosition);

  model.rotation.y = Math.PI;
}

export async function loadMonkeyModel({ scene, fallbackObject }) {
  const GLTFLoader = await resolveGLTFLoader();
  if (!GLTFLoader) return null;

  const loader = new GLTFLoader();

  return new Promise((resolve) => {
    loader.load(
      MONKEY_GLB_URL,
      (gltf) => {
        const model = gltf.scene;
        placeModelAtFallback(model, fallbackObject);
        scene.add(model);
        fallbackObject.visible = false;
        resolve(model);
      },
      undefined,
      (error) => {
        console.warn(
          `[monkeyModel] Failed to load monkey model at ${MONKEY_GLB_URL}. Placeholder fallback retained.`,
          error
        );
        resolve(null);
      }
    );
  });
}
