import * as THREE from '../vendor/three.js';

const VENDORED_GLTF_LOADER_PATH = '../../vendor/three/examples/jsm/loaders/GLTFLoader.js';
const NODE_MODEL_TARGET_DIMENSION = 0.6;
const HOVER_SCALE_TARGET = 1.06;
const HOVER_SCALE_LERP = 0.08;
const HOVER_LIGHT_INTENSITY_TARGET = 2.8;
const HOVER_LIGHT_INTENSITY_LERP = 0.08;
const HOVER_LIGHT_DISTANCE = 5.5;
const HOVER_LIGHT_DECAY = 2;
const HOVER_LIGHT_RADIAL_T = 0.7;

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
  const worldPosition = new THREE.Vector3();
  const centerPosition = new THREE.Vector3();
  const lightPosition = new THREE.Vector3();
  const scaleTarget = new THREE.Vector3(1, 1, 1);

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
    const hoverPointLight = new THREE.PointLight(node.material.color.clone(), 0, HOVER_LIGHT_DISTANCE, HOVER_LIGHT_DECAY);
    hoverPointLight.visible = false;
    node.add(hoverPointLight);

    node.userData = {
      ...item,
      orbitAngle: angle,
      orbitRadius: radius,
      yOffset: node.position.y,
      baseScale: 1,
      targetScale: 1,
      currentHoverLightIntensity: 0,
      targetHoverLightIntensity: 0,
      hoverPointLight,
      baseColor: '#79a6ff',
      hoverColor: '#c8deff',
      baseEmissive: '#21365f',
      hoverEmissive: '#6ba7ff',
      updateHoverEffects: (centerWorldPosition) => {
        node.getWorldPosition(worldPosition);
        lightPosition.copy(centerWorldPosition).lerp(worldPosition, HOVER_LIGHT_RADIAL_T);
        node.worldToLocal(lightPosition);
        hoverPointLight.position.copy(lightPosition);

        scaleTarget.setScalar(node.userData.baseScale * node.userData.targetScale);
        node.scale.lerp(scaleTarget, HOVER_SCALE_LERP);

        node.userData.currentHoverLightIntensity = THREE.MathUtils.lerp(
          node.userData.currentHoverLightIntensity,
          node.userData.targetHoverLightIntensity,
          HOVER_LIGHT_INTENSITY_LERP
        );
        hoverPointLight.intensity = node.userData.currentHoverLightIntensity;
        hoverPointLight.visible = hoverPointLight.intensity > 0.01;

        const hoverBlend = HOVER_LIGHT_INTENSITY_TARGET
          ? THREE.MathUtils.clamp(hoverPointLight.intensity / HOVER_LIGHT_INTENSITY_TARGET, 0, 1)
          : 0;

        node.material.color.set(node.userData.baseColor).lerp(new THREE.Color(node.userData.hoverColor), hoverBlend);
        node.material.emissive.set(node.userData.baseEmissive).lerp(new THREE.Color(node.userData.hoverEmissive), hoverBlend);
        node.material.emissiveIntensity = THREE.MathUtils.lerp(0.45, 0.95, hoverBlend);
      }
    };

    nodes.push(node);
    group.add(node);

    attachNodeModel(node, item);
  });

  group.userData.getCenterWorldPosition = () => group.getWorldPosition(centerPosition);

  return { group, nodes };
}

export function updateOrbitNodes(nodes, elapsed, centerWorldPosition = new THREE.Vector3()) {
  nodes.forEach((node, index) => {
    const angle = node.userData.orbitAngle + elapsed * 0.14;
    const wobble = Math.sin(elapsed * 0.9 + index * 1.8) * 0.08;

    node.position.x = Math.cos(angle) * node.userData.orbitRadius;
    node.position.z = Math.sin(angle) * node.userData.orbitRadius;
    node.position.y = node.userData.yOffset + wobble;
    node.userData.updateHoverEffects(centerWorldPosition);
  });
}

export function setNodeHoverState(node, isHovered) {
  if (isHovered) {
    node.userData.targetScale = HOVER_SCALE_TARGET;
    node.userData.targetHoverLightIntensity = HOVER_LIGHT_INTENSITY_TARGET;
    node.userData.hoverPointLight.color.copy(node.material.color);
    return;
  }

  node.userData.targetScale = 1;
  node.userData.targetHoverLightIntensity = 0;
}
