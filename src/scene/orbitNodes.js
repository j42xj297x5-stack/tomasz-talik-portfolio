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
const WOOD_NODE_ID = 'ai-guide';
const WOOD_NODE_HOVER_LIGHT_COLOR = '#cbff74';
const WOOD_NODE_HOVER_LIGHT_INTENSITY_TARGET = 3.3;

const WOOD_TREE_EFFECT_MODEL_PATH = '/glb/glyph_1-tree.glb';
const WOOD_TREE_EFFECT_FALLBACK_MODEL_PATH = '/glb/glyph_1.glb';
const WOOD_TREE_ACTIVATION_DURATION = 1.6;
const WOOD_TREE_VERTICAL_SOFTNESS = 0.42;
const WOOD_TREE_EMISSIVE_INTENSITY_ACTIVE = 1.55;
const WOOD_TREE_GLOW_INTENSITY = 1.3;
const WOOD_TREE_PULSE_INTENSITY = 0.16;
const WOOD_TREE_PULSE_SPEED = 1.45;
const WOOD_TREE_SCALE = 0.95;
const WOOD_TREE_Y_OFFSET = -0.14;
const WOOD_TREE_BASE_COLOR = new THREE.Color('#1b2318');
const WOOD_TREE_EMISSIVE_BASE = new THREE.Color('#0f150d');
const WOOD_TREE_EMISSIVE_ACTIVE_BOTTOM = new THREE.Color('#2d8f49');
const WOOD_TREE_EMISSIVE_ACTIVE_TOP = new THREE.Color('#d7aa4e');
const WOOD_TREE_POINT_LIGHT_COLOR = '#9fce70';
const WOOD_TREE_POINT_LIGHT_INTENSITY = 1.15;


function createWoodTreeEffectRuntime() {
  return {
    activationProgress: 0,
    activationTarget: 0,
    treeGroup: null,
    treeMaterials: [],
    minY: -0.5,
    maxY: 0.5,
    treePointLight: null,
    pulsePhase: Math.random() * Math.PI * 2
  };
}

function applyWoodTreeActivation(runtime, elapsed) {
  if (!runtime?.treeGroup || !runtime.treeMaterials.length) return;

  const activationLerp = 1 / Math.max(1, 60 * WOOD_TREE_ACTIVATION_DURATION);
  runtime.activationProgress = THREE.MathUtils.lerp(runtime.activationProgress, runtime.activationTarget, activationLerp);

  const span = Math.max(0.0001, runtime.maxY - runtime.minY);
  const revealY = runtime.minY + span * runtime.activationProgress;
  const pulse = runtime.activationProgress > 0.98
    ? 1 + Math.sin(elapsed * WOOD_TREE_PULSE_SPEED + runtime.pulsePhase) * WOOD_TREE_PULSE_INTENSITY
    : 1;

  runtime.treeMaterials.forEach((entry) => {
    const yRatio = (entry.centerY - runtime.minY) / span;
    const softnessRange = WOOD_TREE_VERTICAL_SOFTNESS * span;
    const fill = THREE.MathUtils.smoothstep(entry.centerY, revealY - softnessRange, revealY + softnessRange);
    const activeColor = WOOD_TREE_EMISSIVE_ACTIVE_BOTTOM.clone().lerp(WOOD_TREE_EMISSIVE_ACTIVE_TOP, yRatio);

    entry.material.color.copy(WOOD_TREE_BASE_COLOR);
    entry.material.emissive.copy(WOOD_TREE_EMISSIVE_BASE).lerp(activeColor, fill);
    entry.material.emissiveIntensity = (0.05 + fill * WOOD_TREE_EMISSIVE_INTENSITY_ACTIVE * WOOD_TREE_GLOW_INTENSITY) * pulse;
  });

  runtime.treeGroup.visible = runtime.activationProgress > 0.001;

  if (runtime.treePointLight) {
    runtime.treePointLight.intensity = runtime.activationProgress * WOOD_TREE_POINT_LIGHT_INTENSITY * pulse;
    runtime.treePointLight.visible = runtime.treePointLight.intensity > 0.01;
  }
}

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

      if (item.id === WOOD_NODE_ID && node.userData.woodTreeEffectRuntime) {
        const treeLoader = new GLTFLoader();
        const attachTreeEffectModel = (path) => treeLoader.load(
          path,
          (treeGltf) => {
            const treeModel = treeGltf.scene;
            fitModelToNode(treeModel);
            treeModel.scale.multiplyScalar(WOOD_TREE_SCALE);
            treeModel.position.y += WOOD_TREE_Y_OFFSET;

            const bounds = new THREE.Box3().setFromObject(treeModel);
            const minY = bounds.min.y;
            const maxY = bounds.max.y;
            const treeMaterials = [];
            const center = new THREE.Vector3();

            treeModel.traverse((child) => {
              if (!child.isMesh || !child.material) return;
              child.material = child.material.clone();
              child.material.transparent = false;
              child.material.depthWrite = true;
              child.getWorldPosition(center);
              treeMaterials.push({ material: child.material, centerY: center.y });
            });

            const runtime = node.userData.woodTreeEffectRuntime;
            runtime.treeGroup = treeModel;
            runtime.treeMaterials = treeMaterials;
            runtime.minY = minY;
            runtime.maxY = maxY;

            const treePointLight = new THREE.PointLight(WOOD_TREE_POINT_LIGHT_COLOR, 0, 2.4, 2);
            treePointLight.position.set(0, -0.06, 0);
            treePointLight.visible = false;
            treeModel.add(treePointLight);
            runtime.treePointLight = treePointLight;

            treeModel.visible = false;
            node.add(treeModel);
            console.info(`[orbitNodes] Loaded wood tree effect model for ${item.id} from ${path}.`);
          },
          undefined,
          (error) => {
            if (path !== WOOD_TREE_EFFECT_FALLBACK_MODEL_PATH) {
              console.warn(`[orbitNodes] Failed to load wood tree effect model for ${item.id} at ${path}. Trying fallback ${WOOD_TREE_EFFECT_FALLBACK_MODEL_PATH}.`, error);
              attachTreeEffectModel(WOOD_TREE_EFFECT_FALLBACK_MODEL_PATH);
              return;
            }

            console.warn(`[orbitNodes] Failed to load fallback wood tree effect model for ${item.id}. Wood tree visual effect disabled safely.`, error);
          }
        );

        attachTreeEffectModel(WOOD_TREE_EFFECT_MODEL_PATH);
      }

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
      updateHoverEffects: (centerWorldPosition, elapsed) => {
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

        if (node.userData.woodTreeEffectRuntime) {
          applyWoodTreeActivation(node.userData.woodTreeEffectRuntime, elapsed);
        }
      }
    };

    if (item.id === WOOD_NODE_ID) {
      try {
        node.userData.woodTreeEffectRuntime = createWoodTreeEffectRuntime();
      } catch (error) {
        console.warn('[orbitNodes] Failed to initialize wood tree effect runtime for AI Guide node.', error);
      }
    }

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
    node.userData.updateHoverEffects(centerWorldPosition, elapsed);
  });
}

export function setNodeHoverState(node, isHovered) {
  if (isHovered) {
    node.userData.targetScale = HOVER_SCALE_TARGET;
    if (node.userData.id === WOOD_NODE_ID) {
      node.userData.targetHoverLightIntensity = WOOD_NODE_HOVER_LIGHT_INTENSITY_TARGET;
      node.userData.hoverPointLight.color.set(WOOD_NODE_HOVER_LIGHT_COLOR);
    } else {
      node.userData.targetHoverLightIntensity = HOVER_LIGHT_INTENSITY_TARGET;
      node.userData.hoverPointLight.color.copy(node.material.color);
    }
    if (node.userData.woodTreeEffectRuntime) {
      node.userData.woodTreeEffectRuntime.activationTarget = 1;
    }
    return;
  }

  node.userData.targetScale = 1;
  node.userData.targetHoverLightIntensity = 0;
  if (node.userData.woodTreeEffectRuntime) {
    node.userData.woodTreeEffectRuntime.activationTarget = 0;
  }
}
