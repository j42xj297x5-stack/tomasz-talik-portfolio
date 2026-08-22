import * as THREE from '../../vendor/three.js';

const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5));
const RADIAL_CONJUGATE = (Math.sqrt(5) - 1) / 2;

function stableHash(value) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function unitPhase(seed, salt) {
  return stableHash(`${seed}:${salt}`) / 0x100000000;
}

export const VR_SPHERICAL_LAYER_IDS = Object.freeze({
  SHELLS: 'SHELLS', SMALL_GLYPHS: 'SMALL_GLYPHS', RUNE_STONES: 'RUNE_STONES',
  STARS: 'STARS', HIDDEN_GLYPHS: 'HIDDEN_GLYPHS'
});

export function resolveVrSphericalLayerRanges({ baseRadius, layers }) {
  if (!Number.isFinite(baseRadius) || baseRadius <= 0) throw new TypeError('baseRadius must be positive and finite');
  if (!Array.isArray(layers) || layers.length < 1) throw new TypeError('layers must be a non-empty array');
  let cursor = baseRadius;
  return Object.freeze(layers.map(({ id, thickness, status }) => {
    if (typeof id !== 'string' || !id || !Number.isFinite(thickness) || thickness <= 0) {
      throw new TypeError('Every spherical layer requires an id and positive finite thickness');
    }
    const range = Object.freeze({ id, thickness, innerRadius: cursor, outerRadius: cursor + thickness, status });
    cursor = range.outerRadius;
    return range;
  }));
}

export function createVrSphericalLayerActor({ parent, layer, slotCount, angularSpeed = 0, direction = 1 }) {
  if (!parent?.add || !layer || !Number.isInteger(slotCount) || slotCount < 1) {
    throw new TypeError('VrSphericalLayerActor requires parent, layer and a positive slotCount');
  }
  if (direction !== 1 && direction !== -1) throw new TypeError('direction must be 1 or -1');
  if (!Number.isFinite(angularSpeed) || angularSpeed < 0) throw new TypeError('angularSpeed must be finite and non-negative');
  const { id, innerRadius, outerRadius, thickness } = layer;
  if (!Number.isFinite(innerRadius) || !Number.isFinite(outerRadius) || outerRadius <= innerRadius
    || thickness !== outerRadius - innerRadius) throw new TypeError(`Invalid spherical layer range: ${id}`);
  const object = new THREE.Group(); object.name = `VrSphericalLayer:${id}`; parent.add(object);
  const phase = unitPhase(id, 'direction') * Math.PI * 2;
  const radialPhase = unitPhase(id, 'radial');
  const axis = new THREE.Vector3(unitPhase(id, 'axis-x') * 2 - 1, unitPhase(id, 'axis-y') * 2 - 1,
    unitPhase(id, 'axis-z') * 2 - 1).normalize();
  const baseline = new THREE.Quaternion().setFromAxisAngle(axis, unitPhase(id, 'orientation') * Math.PI * 2);
  let elapsed = 0, disposed = false;
  const motion = new THREE.Quaternion();

  function getSlotTransform(index, clearance = 0) {
    if (!Number.isInteger(index) || index < 0 || index >= slotCount) throw new RangeError(`Invalid ${id} slot index: ${index}`);
    if (!Number.isFinite(clearance) || clearance < 0) throw new TypeError('clearance must be finite and non-negative');
    const effectiveInner = innerRadius + clearance, effectiveOuter = outerRadius - clearance;
    if (effectiveOuter <= effectiveInner) throw new Error(`Spherical layer ${id}: clearance ${clearance} exceeds available thickness ${thickness}`);
    const y = 1 - 2 * (index + 0.5) / slotCount;
    const horizontal = Math.sqrt(Math.max(0, 1 - y * y));
    const theta = GOLDEN_ANGLE * index + phase;
    const directionVector = new THREE.Vector3(Math.cos(theta) * horizontal, y, Math.sin(theta) * horizontal).normalize();
    const u = (radialPhase + (index + 0.5) * RADIAL_CONJUGATE) % 1;
    const radius = Math.cbrt(effectiveInner ** 3 + u * (effectiveOuter ** 3 - effectiveInner ** 3));
    return { position: directionVector.multiplyScalar(radius), quaternion: new THREE.Quaternion(), radius,
      clearance, effectiveInner, effectiveOuter };
  }
  function update(delta = 0) { if (disposed) return; elapsed += Math.max(0, Number.isFinite(delta) ? delta : 0);
    object.quaternion.copy(baseline).multiply(motion.setFromAxisAngle(axis, elapsed * angularSpeed * direction)); }
  function reset() { elapsed = 0; object.quaternion.copy(baseline); }
  function dispose() { if (!disposed) { disposed = true; parent.remove(object); object.clear(); } }
  reset();
  return { object, id, center: Object.freeze({ x: 0, y: 0, z: 0 }), innerRadius, outerRadius, thickness,
    slotCount, getSlotTransform, update, reset, dispose };
}
