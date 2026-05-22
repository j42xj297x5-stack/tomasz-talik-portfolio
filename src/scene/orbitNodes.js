import * as THREE from '../vendor/three.js';

const VENDORED_GLTF_LOADER_PATH = '../../vendor/three/examples/jsm/loaders/GLTFLoader.js';
const NODE_MODEL_TARGET_DIMENSION = 0.6;

async function resolveGLTFLoader() {
  try {
    const module = await import(VENDORED_GLTF_LOADER_PATH);
    return module.GLTFLoader;
  } catch (error) {
    console.warn(
      `[orbitNodes] GLTFLoader import failed for node model visuals at ${VENDORED_GLTF_LOADER_PATH}. Sphere fallback retained.`,
      error
    );
    return null;
  }
}

function fitModelToNode(model) {
  const box = new THREE.Box3().setFromObject(model);
  const size = new THREE.Vector3();
  box.getSize(size);

  const maxDimension = Math.max(size.x, size.y, size.z) || 1;
  const uniformScale = NODE_MODEL_TARGET_DIMENSION / maxDimension;
  model.scale.setScalar(uniformScale);
  model.updateMatrixWorld(true);

  const centeredBox = new THREE.Box3().setFromObject(model);
  const center = new THREE.Vector3();
  centeredBox.getCenter(center);
  model.position.sub(center);
}

async function attachNodeModel(node, item) {
  if (!item.modelPath) return;

  const GLTFLoader = await resolveGLTFLoader();
  if (!GLTFLoader) return;

  const loader = new GLTFLoader();
  loader.load(
    item.modelPath,
    (gltf) => {
      const model = gltf.scene;
      fitModelToNode(model);
      node.add(model);
      node.material.visible = false;
      node.userData.visualModel = model;
      console.info(`[orbitNodes] Loaded node model for ${item.id} from ${item.modelPath}.`);
    },
    undefined,
    (error) => {
      console.warn(
        `[orbitNodes] Failed to load node model for ${item.id} at ${item.modelPath}. Sphere fallback retained.`,
        error
      );
    }
  );
}

export function createOrbitNodes(nodeContent) {
  const group = new THREE.Group();
  const nodes = [];
  const radius = 3.8;

  nodeContent.forEach((item, index) => {
    const angle = (Math.PI * 2 * index) / nodeContent.length;
    const node = new THREE.Mesh(
      new THREE.SphereGeometry(0.2, 16, 14),
      new THREE.MeshStandardMaterial({
        color: '#79a6ff',
        emissive: '#21365f',
        emissiveIntensity: 0.45,
        roughness: 0.35,
        metalness: 0.2
      })
    );

    node.position.set(Math.cos(angle) * radius, 0.65 + Math.sin(index * 1.2) * 0.25, Math.sin(angle) * radius);
    node.userData = { ...item, orbitAngle: angle, orbitRadius: radius, yOffset: node.position.y };

    nodes.push(node);
    group.add(node);

    attachNodeModel(node, item);
  });

  return { group, nodes };
}

export function updateOrbitNodes(nodes, elapsed) {
  nodes.forEach((node, index) => {
    const angle = node.userData.orbitAngle + elapsed * 0.14;
    const wobble = Math.sin(elapsed * 0.9 + index * 1.8) * 0.08;

    node.position.x = Math.cos(angle) * node.userData.orbitRadius;
    node.position.z = Math.sin(angle) * node.userData.orbitRadius;
    node.position.y = node.userData.yOffset + wobble;
  });
}

export function setNodeHoverState(node, isHovered) {
  const material = node.material;
  if (isHovered) {
    material.emissive.set('#6ba7ff');
    material.emissiveIntensity = 0.95;
    material.color.set('#c8deff');
    node.scale.setScalar(1.25);
    return;
  }

  material.emissive.set('#21365f');
  material.emissiveIntensity = 0.45;
  material.color.set('#79a6ff');
  node.scale.setScalar(1);
}
