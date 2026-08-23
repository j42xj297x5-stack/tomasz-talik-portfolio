import * as THREE from '../vendor/three.js';
import { createGlyphVisualNode, TRANSITION_LIGHT_FULL_INTENSITY } from './createGlyphVisualNode.js';

export { TRANSITION_LIGHT_FULL_INTENSITY };

export function createOrbitNodes(nodeContent, { assetManager = null } = {}) {
  const group = new THREE.Group();
  const nodes = [];
  const radius = 3.8;
  const centerPosition = new THREE.Vector3();

  nodeContent.forEach((item, index) => {
    const angle = (Math.PI * 2 * index) / nodeContent.length;
    const node = createGlyphVisualNode(item, { assetManager });
    node.position.set(Math.cos(angle) * radius, 0.65 + Math.sin(index * 1.2) * 0.25, Math.sin(angle) * radius);

    node.userData = {
      ...node.userData,
      orbitAngle: angle,
      orbitRadius: radius,
      yOffset: node.position.y,
    };

    nodes.push(node);
    group.add(node);
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
