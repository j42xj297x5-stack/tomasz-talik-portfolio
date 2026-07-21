import * as THREE from '../vendor/three.js';

const NODE_MODEL_TARGET_DIMENSION = 0.6;
const HOVER_SCALE_TARGET = 1.06;
const HOVER_SCALE_LERP = 0.08;
export const TRANSITION_LIGHT_FULL_INTENSITY = 3;
const HOVER_LIGHT_INTENSITY_TARGET = 2.8;
const HOVER_LIGHT_INTENSITY_LERP = 0.08;
const HOVER_LIGHT_DISTANCE = 5.5;
const HOVER_LIGHT_DECAY = 2;
const HOVER_LIGHT_RADIAL_T = 1.16;
const TRANSITION_LIGHT_RAMP_DURATION_MS = 1000;
const TRANSITION_LIGHT_FADE_DURATION_MS = 370;
const SHARED_GLYPH_LIGHT_COLOR = '#fffaf2';
const HOVER_ANIMATION_DURATION = 0.9;
const REDUCED_MOTION_HOVER_ANIMATION_DURATION = 0.22;
const prefersReducedMotion = typeof window !== 'undefined'
  && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

function createHoverAnimationRuntime() {
  return { state: 'idle', startedAt: null, progress: 0 };
}

function fitModelToNode(model) {
  const box = new THREE.Box3().setFromObject(model);
  const size = new THREE.Vector3();
  box.getSize(size);
  const uniformScale = NODE_MODEL_TARGET_DIMENSION / (Math.max(size.x, size.y, size.z) || 1);
  model.scale.setScalar(uniformScale);
  model.updateMatrixWorld(true);

  const centeredBox = new THREE.Box3().setFromObject(model);
  const center = new THREE.Vector3();
  centeredBox.getCenter(center);
  model.position.sub(center);
}

async function attachNodeModel(node, item, assetManager = null) {
  if (!item.modelPath) return;
  const model = assetManager?.cloneGltfScene?.(`glyph-${item.id}`);
  if (!model) {
    console.info(`[orbitNodes] Sphere fallback retained for ${item.id} because the glyph model was not in AssetManager cache.`);
    return;
  }

  fitModelToNode(model);
  node.add(model);
  node.material.visible = false;
  node.userData.visualModel = model;
  console.info(`[orbitNodes] Attached node model for ${item.id} from AssetManager cache.`);
}

function updateNodeHoverAnimation(node, elapsed) {
  const runtime = node.userData.hoverAnimationRuntime;
  if (!runtime || runtime.state !== 'playing') return 0;
  if (runtime.startedAt === null) runtime.startedAt = elapsed;

  const duration = prefersReducedMotion
    ? REDUCED_MOTION_HOVER_ANIMATION_DURATION
    : HOVER_ANIMATION_DURATION;
  runtime.progress = THREE.MathUtils.clamp((elapsed - runtime.startedAt) / duration, 0, 1);
  if (runtime.progress >= 1) {
    runtime.state = 'idle';
    runtime.startedAt = null;
  }
  return runtime.progress;
}

export function createOrbitNodes(nodeContent, { assetManager = null } = {}) {
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
        color: '#79a6ff', emissive: '#21365f', emissiveIntensity: 0.45, roughness: 0.35, metalness: 0.2
      })
    );
    node.position.set(Math.cos(angle) * radius, 0.65 + Math.sin(index * 1.2) * 0.25, Math.sin(angle) * radius);

    const hoverPointLight = new THREE.PointLight(SHARED_GLYPH_LIGHT_COLOR, 0, HOVER_LIGHT_DISTANCE, HOVER_LIGHT_DECAY);
    hoverPointLight.visible = false;
    node.add(hoverPointLight);

    node.userData = {
      ...item,
      orbitAngle: angle,
      orbitRadius: radius,
      yOffset: node.position.y,
      baseScale: 1,
      transitionActive: false,
      transitionLightState: 'idle',
      transitionLightStartedAt: 0,
      transitionLightStartIntensity: 0,
      targetScale: 1,
      currentHoverLightIntensity: 0,
      targetHoverLightIntensity: 0,
      hoverPointLight,
      baseColor: '#79a6ff',
      hoverColor: '#c8deff',
      baseEmissive: '#21365f',
      hoverEmissive: '#6ba7ff',
      hoverAnimationRuntime: createHoverAnimationRuntime(),
      updateHoverEffects: (centerWorldPosition, elapsed) => {
        node.getWorldPosition(worldPosition);
        lightPosition.copy(centerWorldPosition).lerp(worldPosition, HOVER_LIGHT_RADIAL_T);
        node.worldToLocal(lightPosition);
        hoverPointLight.position.copy(lightPosition);

        const animationProgress = updateNodeHoverAnimation(node, elapsed);
        if (node.userData.transitionActive || node.userData.transitionLightState === 'fading') {
          node.scale.setScalar(node.userData.baseScale);
          const duration = node.userData.transitionLightState === 'fading'
            ? TRANSITION_LIGHT_FADE_DURATION_MS : TRANSITION_LIGHT_RAMP_DURATION_MS;
          const progress = THREE.MathUtils.clamp((performance.now() - node.userData.transitionLightStartedAt) / duration, 0, 1);
          const eased = progress * progress * (3 - 2 * progress);
          const intensity = node.userData.transitionLightState === 'fading'
            ? THREE.MathUtils.lerp(node.userData.transitionLightStartIntensity, 0, eased)
            : THREE.MathUtils.lerp(node.userData.transitionLightStartIntensity, TRANSITION_LIGHT_FULL_INTENSITY, eased);
          node.userData.currentHoverLightIntensity = intensity;
          hoverPointLight.intensity = intensity;
          hoverPointLight.visible = intensity > 0.01;
          if (progress >= 1 && node.userData.transitionLightState === 'fading') node.userData.transitionLightState = 'idle';
          return;
        }

        const animationPulse = Math.sin(Math.PI * animationProgress);
        node.userData.targetScale = 1 + (HOVER_SCALE_TARGET - 1) * animationPulse;
        node.userData.targetHoverLightIntensity = HOVER_LIGHT_INTENSITY_TARGET * animationPulse;
        scaleTarget.setScalar(node.userData.baseScale * node.userData.targetScale);
        node.scale.lerp(scaleTarget, HOVER_SCALE_LERP);
        node.userData.currentHoverLightIntensity = THREE.MathUtils.lerp(
          node.userData.currentHoverLightIntensity,
          node.userData.targetHoverLightIntensity,
          HOVER_LIGHT_INTENSITY_LERP
        );
        hoverPointLight.intensity = node.userData.currentHoverLightIntensity;
        hoverPointLight.visible = hoverPointLight.intensity > 0.01;

        const hoverBlend = THREE.MathUtils.clamp(hoverPointLight.intensity / HOVER_LIGHT_INTENSITY_TARGET, 0, 1);
        node.material.color.set(node.userData.baseColor).lerp(new THREE.Color(node.userData.hoverColor), hoverBlend);
        node.material.emissive.set(node.userData.baseEmissive).lerp(new THREE.Color(node.userData.hoverEmissive), hoverBlend);
        node.material.emissiveIntensity = THREE.MathUtils.lerp(0.45, 0.95, hoverBlend);
      }
    };

    nodes.push(node);
    group.add(node);
    void attachNodeModel(node, item, assetManager);
  });

  group.userData.getCenterWorldPosition = () => group.getWorldPosition(centerPosition);
  return { group, nodes, orbit: createOrbitController() };
}

export function createOrbitController() {
  let orbitPhase = 0;
  let isPaused = false;
  return {
    pauseOrbit() { isPaused = true; },
    resumeOrbit() { isPaused = false; },
    update(delta) {
      if (!isPaused) orbitPhase += Math.max(0, delta);
      return orbitPhase;
    },
    isPaused: () => isPaused
  };
}

export function updateOrbitNodes(nodes, elapsed, centerWorldPosition = new THREE.Vector3(), orbitPhase = elapsed) {
  nodes.forEach((node, index) => {
    const angle = node.userData.orbitAngle + orbitPhase * 0.14;
    const wobble = Math.sin(orbitPhase * 0.9 + index * 1.8) * 0.08;
    node.position.x = Math.cos(angle) * node.userData.orbitRadius;
    node.position.z = Math.sin(angle) * node.userData.orbitRadius;
    node.position.y = node.userData.yOffset + wobble;
    node.userData.updateHoverEffects(centerWorldPosition, elapsed);
  });
}

export function triggerNodeHoverAnimation(node) {
  const runtime = node?.userData?.hoverAnimationRuntime;
  if (!runtime || runtime.state === 'playing' || node.userData.transitionActive || node.userData.transitionLightState !== 'idle') return false;
  runtime.state = 'playing';
  runtime.startedAt = null;
  runtime.progress = 0;
  return true;
}

export function setNodeHoverState(node, isHovered) {
  if (!node?.userData) return;
  node.userData.isHovered = isHovered;
}

export function startNodeTransitionLight(node) {
  if (!node?.userData) return;
  node.userData.transitionActive = true;
  node.userData.transitionLightState = 'ramping';
  node.userData.transitionLightStartedAt = performance.now();
  node.userData.transitionLightStartIntensity = node.userData.currentHoverLightIntensity ?? 0;
}

export function fadeNodeTransitionLight(node) {
  if (!node?.userData) return;
  node.userData.transitionActive = false;
  node.userData.transitionLightState = 'fading';
  node.userData.transitionLightStartedAt = performance.now();
  node.userData.transitionLightStartIntensity = node.userData.currentHoverLightIntensity ?? 0;
}

export function resetNodeTransitionLight(node) {
  if (!node?.userData) return;
  node.userData.transitionActive = false;
  node.userData.transitionLightState = 'idle';
  node.userData.transitionLightStartIntensity = 0;
  node.userData.currentHoverLightIntensity = 0;
  node.userData.targetHoverLightIntensity = 0;
  node.userData.hoverPointLight.intensity = 0;
  node.userData.hoverPointLight.visible = false;
}
