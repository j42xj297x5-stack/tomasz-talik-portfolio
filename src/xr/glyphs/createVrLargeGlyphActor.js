import * as THREE from '../../vendor/three.js';
import { createGlyphVisualNode } from '../../scene/createGlyphVisualNode.js';
import { resolveVrPageProtoAstro } from '../protoAstro/resolveVrPageProtoAstro.js';

const LARGE_GLYPH_COUNT = 5;
export const VR_LARGE_GLYPH_INITIAL_STAGE = 'RING_INITIAL';

export function createVrLargeGlyphActor({
  items,
  assetManager = null,
  initialRadius = 8.5,
  worldY = 0,
  scaleMultiplier = 3,
  rotation = { enabled: true, angularSpeed: 0.14, direction: 1 }
}) {
  if (!Array.isArray(items) || items.length !== LARGE_GLYPH_COUNT) {
    throw new TypeError('VrLargeGlyphActor requires exactly five Large Glyph identities.');
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
  const assetForward = new THREE.Vector3(0, 0, 1);
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
    node.userData.orbitAngle = angle;
    node.userData.orbitRadius = initialRadius;
    node.userData.yOffset = 0;
    node.userData.largeGlyphSlot = slot;
    slot.add(node);
    return node;
  });

  const baseline = Object.freeze({ worldY, initialRadius, scaleMultiplier });
  let currentRadius = initialRadius;
  let disposed = false;
  function setCompatibilityRadius(nextRadius) {
    if (disposed || !Number.isFinite(nextRadius) || nextRadius <= 0) return false;
    currentRadius = nextRadius;
    slots.forEach((slot, index) => {
      const angle = (Math.PI * 2 * index) / LARGE_GLYPH_COUNT;
      slot.position.set(Math.cos(angle) * currentRadius, 0, Math.sin(angle) * currentRadius);
    });
    return true;
  }
  function update(deltaSeconds = 0) {
    if (disposed || !rotation.enabled) return;
    const delta = Math.max(0, Number.isFinite(deltaSeconds) ? deltaSeconds : 0);
    // Three.js Y rotation maps an initial angle to angle - rotation.y, so the
    // negative sign preserves the legacy angle = initialAngle + phase motion.
    rotationRoot.rotation.y -= delta * rotation.angularSpeed * rotation.direction;
  }
  function reset() {
    object.position.set(0, baseline.worldY, 0);
    object.quaternion.identity();
    object.scale.set(1, 1, 1);
    object.visible = true;
    object.userData.stage = VR_LARGE_GLYPH_INITIAL_STAGE;
    rotationRoot.position.set(0, 0, 0);
    rotationRoot.quaternion.identity();
    currentRadius = baseline.initialRadius;
    nodes.forEach((node, index) => {
      const angle = (Math.PI * 2 * index) / LARGE_GLYPH_COUNT;
      slots[index].position.set(Math.cos(angle) * currentRadius, 0, Math.sin(angle) * currentRadius);
      node.position.set(0, 0, 0);
      node.quaternion.identity();
      node.scale.setScalar(baseline.scaleMultiplier);
      node.userData.baseScale = baseline.scaleMultiplier;
      node.userData.orbitAngle = (Math.PI * 2 * index) / LARGE_GLYPH_COUNT;
      node.userData.orbitRadius = baseline.initialRadius;
      node.userData.yOffset = 0;
    });
  }

  return Object.freeze({
    object,
    rotationRoot,
    slots: Object.freeze(slots),
    transientRoot,
    nodes: Object.freeze(nodes),
    update,
    getCompatibilityRadius: () => currentRadius,
    setCompatibilityRadius,
    reset,
    dispose() {
      if (disposed) return;
      disposed = true;
      object.removeFromParent();
      nodes.forEach((node) => {
        node.geometry.dispose();
        node.material.dispose();
      });
    }
  });
}
