import * as THREE from '../../vendor/three.js';
import { createGlyphVisualNode } from '../../scene/createGlyphVisualNode.js';
import { resolveVrPageProtoAstro } from '../protoAstro/resolveVrPageProtoAstro.js';

const LARGE_GLYPH_COUNT = 5;
export const VR_LARGE_GLYPH_INITIAL_STAGE = 'RING_INITIAL';
export const VR_LARGE_GLYPH_ELEVATED_STAGE = 'RING_ELEVATED';
export const VR_LARGE_GLYPH_EXPANDED_STAGE = 'RING_EXPANDED';
export const VR_LARGE_GLYPH_SPHERE_STAGE = 'SPHERE_FAR';

const SPHERE_DIRECTIONS = Object.freeze([
  new THREE.Vector3(0.36, 0.82, 0.44).normalize(),
  new THREE.Vector3(-0.79, 0.38, 0.48).normalize(),
  new THREE.Vector3(0.91, 0.08, -0.41).normalize(),
  new THREE.Vector3(-0.35, -0.55, -0.76).normalize(),
  new THREE.Vector3(0.21, -0.88, 0.43).normalize()
]);

export function createVrLargeGlyphActor({
  items,
  assetManager = null,
  initialRadius = 8.5,
  worldY = 0,
  scaleMultiplier = 3,
  rotation = { enabled: true, angularSpeed: 0.14, direction: 1 },
  elevation = { offset: 2.4, durationSeconds: 2.5 },
  expansion = { radius: 46, durationSeconds: 2.5 },
  sphere = {
    radius: 80,
    durationSeconds: 2.5,
    angularSpeed: 0.02,
    depthOscillation: { enabled: true, minRadius: 20, maxRadius: 110, periodSeconds: 135 }
  },
  onExpansionCompleted = () => {}
}) {
  if (!Array.isArray(items) || items.length !== LARGE_GLYPH_COUNT) {
    throw new TypeError('VrLargeGlyphActor requires exactly five Large Glyph identities.');
  }
  if (!Number.isFinite(expansion.radius) || expansion.radius <= initialRadius
    || !Number.isFinite(expansion.durationSeconds) || expansion.durationSeconds <= 0) {
    throw new TypeError('VrLargeGlyphActor requires valid expansion settings.');
  }
  if (!Number.isFinite(sphere.radius) || sphere.radius <= expansion.radius
    || !Number.isFinite(sphere.durationSeconds) || sphere.durationSeconds <= 0
    || !Number.isFinite(sphere.angularSpeed) || sphere.angularSpeed < 0) {
    throw new TypeError('VrLargeGlyphActor requires valid sphere settings.');
  }
  const depthOscillation = sphere.depthOscillation ?? {
    enabled: true, minRadius: 20, maxRadius: 110, periodSeconds: 135
  };
  if (typeof depthOscillation.enabled !== 'boolean'
    || !Number.isFinite(depthOscillation.minRadius) || depthOscillation.minRadius <= 0
    || !Number.isFinite(depthOscillation.maxRadius)
    || depthOscillation.maxRadius <= depthOscillation.minRadius
    || !Number.isFinite(depthOscillation.periodSeconds) || depthOscillation.periodSeconds <= 0) {
    throw new TypeError('VrLargeGlyphActor requires valid depth oscillation settings.');
  }
  if (typeof onExpansionCompleted !== 'function') {
    throw new TypeError('VrLargeGlyphActor onExpansionCompleted must be a function.');
  }

  const object = new THREE.Group();
  object.name = 'VrLargeGlyphActor';
  object.position.y = worldY;
  object.userData.stage = VR_LARGE_GLYPH_INITIAL_STAGE;

  const rotationRoot = new THREE.Group();
  rotationRoot.name = 'RotationRoot';
  object.add(rotationRoot);

  const transientRoot = new THREE.Group();
  transientRoot.name = 'TransientRoot';
  object.add(transientRoot);

  const slots = [];
  const canonicalSlots = new Map();
  const transientLeases = new Set();
  const canonicalNodeLocalMatrix = new THREE.Matrix4().compose(
    new THREE.Vector3(),
    new THREE.Quaternion(),
    new THREE.Vector3(scaleMultiplier, scaleMultiplier, scaleMultiplier)
  );
  const assetForward = new THREE.Vector3(0, 0, 1);
  const facingDirection = new THREE.Vector3();
  const lateRadiusCenter = (depthOscillation.minRadius + depthOscillation.maxRadius) * 0.5;
  const lateRadiusAmplitude = (depthOscillation.maxRadius - depthOscillation.minRadius) * 0.5;
  const lateRadiusOmega = Math.PI * 2 / depthOscillation.periodSeconds;
  const nodes = items.map((item, index) => {
    const identity = resolveVrPageProtoAstro({ glyphId: item.id });
    if (!identity) throw new TypeError(`Missing canonical Proto-Astro identity for Large Glyph ${item.id}.`);
    const angle = (Math.PI * 2 * index) / LARGE_GLYPH_COUNT;
    const slot = new THREE.Group();
    slot.name = `Slot_${identity.descriptor.syllable}`;
    slot.position.set(Math.cos(angle) * initialRadius, 0, Math.sin(angle) * initialRadius);
    slot.quaternion.setFromUnitVectors(assetForward, slot.position.clone().normalize().negate());
    slot.userData.item = item;
    slot.userData.identity = identity.descriptor;
    rotationRoot.add(slot);
    slots.push(slot);

    const node = createGlyphVisualNode(item, { assetManager });
    node.name = identity.descriptor.syllable;
    node.position.set(0, 0, 0);
    node.quaternion.identity();
    node.scale.setScalar(scaleMultiplier);
    node.userData.baseScale = scaleMultiplier;
    slot.add(node);
    canonicalSlots.set(node, slot);
    return node;
  });

  const presentationEntries = [];
  nodes.forEach((node) => {
    node.traverse((child) => {
      if (!child.isMesh) return;
      const authoredMaterials = (Array.isArray(child.material) ? child.material : [child.material])
        .map((material) => material.clone());
      const authoredBaselines = authoredMaterials.map((material) => material.clone());
      const farMaterials = authoredMaterials.map((material) => new THREE.MeshBasicMaterial({
        color: 0x000000,
        side: material.side,
        transparent: material.transparent,
        opacity: material.opacity,
        alphaTest: material.alphaTest,
        depthTest: material.depthTest,
        depthWrite: material.depthWrite,
        alphaMap: material.alphaMap ?? null
      }));
      farMaterials.forEach((material, materialIndex) => {
        material.visible = authoredMaterials[materialIndex].visible;
      });
      child.material = Array.isArray(child.material) ? authoredMaterials : authoredMaterials[0];
      presentationEntries.push({ child, authoredMaterials, authoredBaselines, farMaterials });
    });
    const authoredHoverUpdate = node.userData.updateHoverEffects;
    node.userData.updateHoverEffects = (...args) => {
      if (stage === VR_LARGE_GLYPH_SPHERE_STAGE) {
        node.userData.currentHoverLightIntensity = 0;
        node.userData.targetHoverLightIntensity = 0;
        node.userData.hoverPointLight.intensity = 0;
        node.userData.hoverPointLight.visible = false;
        return;
      }
      authoredHoverUpdate(...args);
    };
  });

  const baseline = Object.freeze({ worldY, initialRadius, scaleMultiplier });
  let currentRadius = initialRadius;
  let stage = VR_LARGE_GLYPH_INITIAL_STAGE;
  let elevationElapsed = null;
  let expansionElapsed = null;
  let sphereElapsed = null;
  let lateMotionElapsed = 0;
  let disposed = false;
  function applyStagePresentation(nextStage) {
    const isFar = nextStage === VR_LARGE_GLYPH_SPHERE_STAGE;
    presentationEntries.forEach(({ child, authoredMaterials, authoredBaselines, farMaterials }) => {
      if (!isFar) {
        authoredMaterials.forEach((material, index) => material.copy(authoredBaselines[index]));
      }
      child.material = Array.isArray(child.material)
        ? (isFar ? farMaterials : authoredMaterials)
        : (isFar ? farMaterials[0] : authoredMaterials[0]);
    });
    nodes.forEach((node) => {
      const light = node.userData.hoverPointLight;
      node.userData.currentHoverLightIntensity = 0;
      node.userData.targetHoverLightIntensity = 0;
      light.intensity = 0;
      light.visible = false;
    });
  }
  function settleStage(nextStage) {
    stage = nextStage;
    object.userData.stage = stage;
    object.position.y = baseline.worldY
      + (stage === VR_LARGE_GLYPH_INITIAL_STAGE ? 0 : elevation.offset);
    applyStagePresentation(stage);
  }
  function setCanonicalRadius(radius) {
    currentRadius = radius;
    slots.forEach((slot, index) => {
      const angle = (Math.PI * 2 * index) / LARGE_GLYPH_COUNT;
      slot.position.set(Math.cos(angle) * radius, 0, Math.sin(angle) * radius);
      facingDirection.copy(slot.position).normalize().negate();
      slot.quaternion.setFromUnitVectors(assetForward, facingDirection);
    });
  }
  function getLateRadius(index, elapsedSeconds) {
    if (!depthOscillation.enabled) return sphere.radius;
    const phase = Math.PI * 2 * index / LARGE_GLYPH_COUNT;
    return lateRadiusCenter + lateRadiusAmplitude * Math.sin(lateRadiusOmega * elapsedSeconds + phase);
  }
  function setSphereLayout(progress = 1) {
    currentRadius = 0;
    slots.forEach((slot, index) => {
      const angle = (Math.PI * 2 * index) / LARGE_GLYPH_COUNT;
      const targetRadius = getLateRadius(index, lateMotionElapsed);
      const direction = SPHERE_DIRECTIONS[index];
      slot.position.set(
        THREE.MathUtils.lerp(Math.cos(angle) * expansion.radius, direction.x * targetRadius, progress),
        direction.y * targetRadius * progress,
        THREE.MathUtils.lerp(Math.sin(angle) * expansion.radius, direction.z * targetRadius, progress)
      );
      facingDirection.copy(slot.position).normalize().negate();
      slot.quaternion.setFromUnitVectors(assetForward, facingDirection);
      currentRadius = Math.max(currentRadius, slot.position.length());
    });
  }
  function hydrateScenarioState(state) {
    if (disposed || (state?.stage !== VR_LARGE_GLYPH_INITIAL_STAGE
      && state?.stage !== VR_LARGE_GLYPH_ELEVATED_STAGE
      && state?.stage !== VR_LARGE_GLYPH_EXPANDED_STAGE
      && state?.stage !== VR_LARGE_GLYPH_SPHERE_STAGE)) {
      throw new Error('Unsupported Large Glyph Scenario stage');
    }
    if (transientLeases.size > 0) {
      throw new Error('Cannot hydrate Large Glyph actor during a transient lease.');
    }
    elevationElapsed = null;
    expansionElapsed = null;
    sphereElapsed = null;
    lateMotionElapsed = 0;
    if (state.stage === VR_LARGE_GLYPH_SPHERE_STAGE) setSphereLayout();
    else
    setCanonicalRadius(state.stage === VR_LARGE_GLYPH_EXPANDED_STAGE
      ? expansion.radius : baseline.initialRadius);
    settleStage(state.stage);
  }
  function beginElevation() {
    if (transientLeases.size > 0) {
      throw new Error('Cannot elevate Large Glyph actor during a transient lease.');
    }
    if (disposed || stage !== VR_LARGE_GLYPH_INITIAL_STAGE
      || elevationElapsed !== null || expansionElapsed !== null) return false;
    elevationElapsed = 0;
    return true;
  }
  function beginExpansion() {
    if (transientLeases.size > 0) {
      throw new Error('Cannot expand Large Glyph actor during a transient lease.');
    }
    if (disposed || stage !== VR_LARGE_GLYPH_ELEVATED_STAGE
      || elevationElapsed !== null || expansionElapsed !== null) return false;
    setCanonicalRadius(baseline.initialRadius);
    expansionElapsed = 0;
    return true;
  }
  function beginSphereDistribution() {
    if (transientLeases.size > 0) throw new Error('Cannot distribute Large Glyph actor during a transient lease.');
    if (disposed || stage !== VR_LARGE_GLYPH_EXPANDED_STAGE || sphereElapsed !== null) return false;
    sphereElapsed = 0;
    return true;
  }
  function requireOwnedNode(node) {
    const slot = canonicalSlots.get(node);
    if (!slot) throw new TypeError('Large Glyph node does not belong to this actor.');
    return slot;
  }
  function setCanonicalNodeTransform(node) {
    node.position.set(0, 0, 0);
    node.quaternion.identity();
    node.scale.setScalar(baseline.scaleMultiplier);
  }
  function beginTransient(node) {
    const slot = requireOwnedNode(node);
    if (disposed) throw new Error('Cannot lease a node from a disposed Large Glyph actor.');
    if (transientLeases.has(node)) throw new Error('Large Glyph node already has a transient lease.');
    if (elevationElapsed !== null || expansionElapsed !== null) {
      throw new Error('Cannot lease a Large Glyph node during an actor transition.');
    }
    if (node.parent !== slot) throw new Error('Large Glyph node is outside its canonical slot.');
    transientRoot.attach(node);
    transientLeases.add(node);
    return true;
  }
  function getSlotWorldTransform(node) {
    const slot = requireOwnedNode(node);
    object.updateMatrixWorld(true);
    const matrix = new THREE.Matrix4().multiplyMatrices(slot.matrixWorld, canonicalNodeLocalMatrix);
    const position = new THREE.Vector3();
    const quaternion = new THREE.Quaternion();
    const scale = new THREE.Vector3();
    matrix.decompose(position, quaternion, scale);
    return { position, quaternion, scale };
  }
  function restoreToSlot(node) {
    const slot = requireOwnedNode(node);
    if (!transientLeases.has(node)) throw new Error('Large Glyph node has no transient lease.');
    if (node.parent !== transientRoot) throw new Error('Leased Large Glyph node left the actor TransientRoot.');
    slot.add(node);
    setCanonicalNodeTransform(node);
    transientLeases.delete(node);
    return true;
  }
  function update(deltaSeconds = 0) {
    if (disposed) return;
    const delta = Math.max(0, Number.isFinite(deltaSeconds) ? deltaSeconds : 0);
    if (rotation.enabled) {
      // Three.js Y rotation maps an initial angle to angle - rotation.y, so the
      // negative sign preserves the legacy angle = initialAngle + phase motion.
      const angularSpeed = sphereElapsed !== null || stage === VR_LARGE_GLYPH_SPHERE_STAGE
        ? sphere.angularSpeed : rotation.angularSpeed;
      rotationRoot.rotation.y -= delta * angularSpeed * rotation.direction;
    }
    if (elevationElapsed !== null) {
      elevationElapsed += delta;
      const progress = Math.min(1, elevationElapsed / elevation.durationSeconds);
      const eased = progress * progress * (3 - 2 * progress);
      object.position.y = baseline.worldY + elevation.offset * eased;
      if (progress === 1) {
        elevationElapsed = null;
        settleStage(VR_LARGE_GLYPH_ELEVATED_STAGE);
      }
    }
    if (expansionElapsed !== null) {
      expansionElapsed += delta;
      const progress = Math.min(1, expansionElapsed / expansion.durationSeconds);
      const eased = progress * progress * (3 - 2 * progress);
      setCanonicalRadius(baseline.initialRadius
        + (expansion.radius - baseline.initialRadius) * eased);
      if (progress === 1) {
        expansionElapsed = null;
        setCanonicalRadius(expansion.radius);
        settleStage(VR_LARGE_GLYPH_EXPANDED_STAGE);
        onExpansionCompleted();
      }
    }
    if (sphereElapsed !== null) {
      sphereElapsed += delta;
      const progress = Math.min(1, sphereElapsed / sphere.durationSeconds);
      setSphereLayout(progress * progress * (3 - 2 * progress));
      if (progress === 1) {
        sphereElapsed = null;
        setSphereLayout();
        settleStage(VR_LARGE_GLYPH_SPHERE_STAGE);
      }
    } else if (stage === VR_LARGE_GLYPH_SPHERE_STAGE) {
      lateMotionElapsed += delta;
      setSphereLayout();
    }
  }
  function setPresentationVisible(value) {
    if (disposed) throw new Error('Cannot change presentation visibility of a disposed Large Glyph actor.');
    if (typeof value !== 'boolean') {
      throw new TypeError('Large Glyph actor presentation visibility must be a boolean.');
    }
    object.visible = value;
    return true;
  }
  function reset() {
    [...transientLeases].forEach(restoreToSlot);
    elevationElapsed = null;
    expansionElapsed = null;
    sphereElapsed = null;
    lateMotionElapsed = 0;
    object.position.set(0, baseline.worldY, 0);
    object.quaternion.identity();
    object.scale.set(1, 1, 1);
    object.visible = true;
    settleStage(VR_LARGE_GLYPH_INITIAL_STAGE);
    rotationRoot.position.set(0, 0, 0);
    rotationRoot.quaternion.identity();
    setCanonicalRadius(baseline.initialRadius);
    nodes.forEach((node) => {
      node.position.set(0, 0, 0);
      node.quaternion.identity();
      node.scale.setScalar(baseline.scaleMultiplier);
      node.userData.baseScale = baseline.scaleMultiplier;
    });
  }

  return Object.freeze({
    object,
    rotationRoot,
    slots: Object.freeze(slots),
    transientRoot,
    nodes: Object.freeze(nodes),
    update,
    getStage: () => stage,
    getSpatialExtent: () => currentRadius,
    getTargetingRange: () => depthOscillation.enabled ? depthOscillation.maxRadius : sphere.radius,
    setPresentationVisible,
    beginElevation,
    beginExpansion,
    beginSphereDistribution,
    beginTransient,
    getSlotWorldTransform,
    restoreToSlot,
    hydrateScenarioState,
    reset,
    dispose() {
      if (disposed) return;
      [...transientLeases].forEach(restoreToSlot);
      disposed = true;
      object.removeFromParent();
      nodes.forEach((node) => {
        node.geometry.dispose();
      });
      presentationEntries.forEach(({ authoredMaterials, authoredBaselines, farMaterials }) => {
        [...authoredMaterials, ...authoredBaselines, ...farMaterials].forEach((material) => material.dispose());
      });
    }
  });
}
