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
const WOOD_AURA_THREAD_COUNT = 7;
const WOOD_AURA_IDLE_OPACITY = 0.0;
const WOOD_AURA_HOVER_OPACITY = 0.7;
const WOOD_AURA_FADE_SPEED = 0.05;
const WOOD_AURA_SCALE_IDLE = 0.98;
const WOOD_AURA_SCALE_HOVER = 1.07;
const WOOD_AURA_SCALE_LERP = 0.05;
const WOOD_AURA_PULSE_SPEED = 0.78;
const WOOD_AURA_SWAY_SPEED_BASE = 0.15;
const WOOD_AURA_SWAY_SPEED_VARIANCE = 0.14;
const WOOD_AURA_SWAY_AMPLITUDE = 0.045;
const WOOD_AURA_COLOR_PRIMARY = '#b8ff6a';
const WOOD_AURA_COLOR_SECONDARY = '#e4ff88';
const WOOD_AURA_COLOR_ACCENT = '#f4ef9a';
const WOOD_AURA_REVEAL_SPEED_BASE = 0.033;
const WOOD_AURA_REVEAL_SPEED_VARIANCE = 0.024;
const WOOD_AURA_REVEAL_DELAY_VARIANCE = 0.28;
const WOOD_AURA_HEIGHT_BASE = 1.12;
const WOOD_AURA_HEIGHT_VARIANCE = 0.52;
const WOOD_AURA_END_GLOW_BOOST = 0.18;
const WOOD_NODE_HOVER_LIGHT_COLOR = '#cbff74';
const WOOD_NODE_HOVER_LIGHT_INTENSITY_TARGET = 3.3;

function createWoodAuraEffect() {
  const auraGroup = new THREE.Group();
  const threadRuntimes = [];

  for (let index = 0; index < WOOD_AURA_THREAD_COUNT; index += 1) {
    const spread = (index / Math.max(1, WOOD_AURA_THREAD_COUNT - 1) - 0.5) * 0.36;
    const sideDirection = index % 2 === 0 ? 1 : -1;
    const startHeight = -0.17 + (index % 3) * 0.02;
    const topHeight = 0.29 + (index % 3) * 0.07;
    const points = [
      new THREE.Vector3(spread * 0.25, startHeight, spread * 0.22),
      new THREE.Vector3(spread * 0.45 + sideDirection * 0.03, -0.03 + (index % 2) * 0.03, spread * 0.38),
      new THREE.Vector3(spread * 0.72 + sideDirection * 0.06, 0.11 + (index % 4) * 0.03, spread * 0.54),
      new THREE.Vector3(spread + sideDirection * 0.1, topHeight, spread * 0.75)
    ];

    const curve = new THREE.CatmullRomCurve3(points);
    const geometry = new THREE.TubeGeometry(curve, 18, 0.007 + (index % 3) * 0.0015, 5, false);
    const color = index % 5 === 0 ? WOOD_AURA_COLOR_ACCENT : index % 2 === 0 ? WOOD_AURA_COLOR_PRIMARY : WOOD_AURA_COLOR_SECONDARY;
    const material = new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    const thread = new THREE.Mesh(geometry, material);
    thread.rotation.y = spread * 0.6;
    thread.scale.y = 0.01;
    auraGroup.add(thread);
    threadRuntimes.push({
      mesh: thread,
      material,
      growthProgress: 0,
      growthSpeed: WOOD_AURA_REVEAL_SPEED_BASE + Math.random() * WOOD_AURA_REVEAL_SPEED_VARIANCE,
      revealDelay: Math.random() * WOOD_AURA_REVEAL_DELAY_VARIANCE,
      maxHeight: WOOD_AURA_HEIGHT_BASE + Math.random() * WOOD_AURA_HEIGHT_VARIANCE,
      swayPhase: Math.random() * Math.PI * 2,
      swaySpeed: WOOD_AURA_SWAY_SPEED_BASE + Math.random() * WOOD_AURA_SWAY_SPEED_VARIANCE,
      swayAmplitude: 0.01 + Math.random() * 0.018,
      baseRotationY: thread.rotation.y,
      isBranch: false
    });

    if (index % 3 === 0) {
      const branchCurve = new THREE.CatmullRomCurve3([
        points[1].clone(),
        points[2].clone().add(new THREE.Vector3(sideDirection * 0.04, 0.04, sideDirection * 0.01)),
        points[2].clone().add(new THREE.Vector3(sideDirection * 0.09, 0.1, sideDirection * 0.04))
      ]);
      const branchGeometry = new THREE.TubeGeometry(branchCurve, 10, 0.0045, 4, false);
      const branchMaterial = material.clone();
      const branch = new THREE.Mesh(branchGeometry, branchMaterial);
      branch.scale.y = 0.01;
      auraGroup.add(branch);
      threadRuntimes.push({
        mesh: branch,
        material: branchMaterial,
        growthProgress: 0,
        growthSpeed: WOOD_AURA_REVEAL_SPEED_BASE * 0.82 + Math.random() * WOOD_AURA_REVEAL_SPEED_VARIANCE,
        revealDelay: 0.06 + Math.random() * (WOOD_AURA_REVEAL_DELAY_VARIANCE + 0.12),
        maxHeight: (WOOD_AURA_HEIGHT_BASE - 0.24) + Math.random() * (WOOD_AURA_HEIGHT_VARIANCE * 0.7),
        swayPhase: Math.random() * Math.PI * 2,
        swaySpeed: WOOD_AURA_SWAY_SPEED_BASE + Math.random() * WOOD_AURA_SWAY_SPEED_VARIANCE,
        swayAmplitude: 0.006 + Math.random() * 0.01,
        baseRotationY: branch.rotation.y,
        isBranch: true
      });
    }
  }

  auraGroup.position.set(0, 0.01, 0);
  auraGroup.scale.setScalar(WOOD_AURA_SCALE_IDLE);

  return {
    auraGroup,
    threadRuntimes,
    auraCurrentOpacity: WOOD_AURA_IDLE_OPACITY,
    auraTargetOpacity: WOOD_AURA_IDLE_OPACITY,
    auraCurrentScale: WOOD_AURA_SCALE_IDLE,
    auraTargetScale: WOOD_AURA_SCALE_IDLE,
    auraPulsePhase: Math.random() * Math.PI * 2
  };
}

function updateWoodAuraEffect(runtime, elapsed) {
  runtime.auraCurrentOpacity = THREE.MathUtils.lerp(
    runtime.auraCurrentOpacity,
    runtime.auraTargetOpacity,
    WOOD_AURA_FADE_SPEED
  );
  runtime.auraCurrentScale = THREE.MathUtils.lerp(runtime.auraCurrentScale, runtime.auraTargetScale, WOOD_AURA_SCALE_LERP);

  const pulse = 0.9 + Math.sin(elapsed * WOOD_AURA_PULSE_SPEED + runtime.auraPulsePhase) * 0.1;
  const auraOpacity = runtime.auraCurrentOpacity * pulse;
  const isRevealing = runtime.auraTargetOpacity > runtime.auraCurrentOpacity;
  runtime.threadRuntimes.forEach((threadRuntime) => {
    const revealTarget = isRevealing ? 1 : 0;
    const delayedTarget = isRevealing
      ? THREE.MathUtils.smoothstep(runtime.auraCurrentOpacity, threadRuntime.revealDelay, 1)
      : revealTarget;
    threadRuntime.growthProgress = THREE.MathUtils.lerp(
      threadRuntime.growthProgress,
      delayedTarget,
      threadRuntime.growthSpeed
    );

    const easedGrowth = THREE.MathUtils.smootherstep(threadRuntime.growthProgress, 0, 1);
    threadRuntime.mesh.scale.y = Math.max(0.01, easedGrowth * threadRuntime.maxHeight);

    const tipBoost = threadRuntime.isBranch ? WOOD_AURA_END_GLOW_BOOST * 0.65 : WOOD_AURA_END_GLOW_BOOST;
    threadRuntime.material.opacity = auraOpacity * (0.78 + easedGrowth * tipBoost);

    threadRuntime.mesh.rotation.y =
      threadRuntime.baseRotationY +
      Math.sin(elapsed * threadRuntime.swaySpeed + threadRuntime.swayPhase) * threadRuntime.swayAmplitude;
  });

  runtime.auraGroup.scale.setScalar(runtime.auraCurrentScale);
  runtime.auraGroup.rotation.y = Math.sin(elapsed * WOOD_AURA_SWAY_SPEED_BASE + runtime.auraPulsePhase * 0.5) * WOOD_AURA_SWAY_AMPLITUDE;
  runtime.auraGroup.rotation.z = Math.sin(elapsed * (WOOD_AURA_SWAY_SPEED_BASE * 0.8) + runtime.auraPulsePhase) * (WOOD_AURA_SWAY_AMPLITUDE * 0.55);
  runtime.auraGroup.visible = auraOpacity > 0.002;
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

        if (node.userData.woodAuraRuntime) {
          updateWoodAuraEffect(node.userData.woodAuraRuntime, elapsed);
        }
      }
    };

    if (item.id === WOOD_NODE_ID) {
      try {
        node.userData.woodAuraRuntime = createWoodAuraEffect();
        node.add(node.userData.woodAuraRuntime.auraGroup);
      } catch (error) {
        console.warn('[orbitNodes] Failed to initialize wood aura effect for AI Guide node.', error);
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
    if (node.userData.woodAuraRuntime) {
      node.userData.woodAuraRuntime.auraTargetOpacity = WOOD_AURA_HOVER_OPACITY;
      node.userData.woodAuraRuntime.auraTargetScale = WOOD_AURA_SCALE_HOVER;
    }
    return;
  }

  node.userData.targetScale = 1;
  node.userData.targetHoverLightIntensity = 0;
  if (node.userData.woodAuraRuntime) {
    node.userData.woodAuraRuntime.auraTargetOpacity = WOOD_AURA_IDLE_OPACITY;
    node.userData.woodAuraRuntime.auraTargetScale = WOOD_AURA_SCALE_IDLE;
  }
}
