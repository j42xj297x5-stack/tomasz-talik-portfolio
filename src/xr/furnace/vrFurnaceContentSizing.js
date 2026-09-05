import * as THREE from '../../vendor/three.js';

export const VR_FURNACE_CONTENT_SIZE_CLASS = Object.freeze({
  SHELL: 'SHELL',
  SMALL_GLYPH: 'SMALL_GLYPH',
  ASTERION_SPHERE: 'ASTERION_SPHERE',
  ASTRO_ATTRACTOR: 'ASTRO_ATTRACTOR'
});

// A multiplier of 1.0 preserves the supplied natural/canonical world scale.
// It does not imply unit local scale or any form of Furnace-volume fitting.
const WORLD_SCALE_MULTIPLIER_BY_CLASS = Object.freeze({
  [VR_FURNACE_CONTENT_SIZE_CLASS.SHELL]: 1.0,
  [VR_FURNACE_CONTENT_SIZE_CLASS.SMALL_GLYPH]: 0.7,
  [VR_FURNACE_CONTENT_SIZE_CLASS.ASTERION_SPHERE]: 1.3,
  [VR_FURNACE_CONTENT_SIZE_CLASS.ASTRO_ATTRACTOR]: 0.8
});

const WORLD_SCALE_EPSILON = 1e-8;

function requireObject3D(object) {
  if (!object?.isObject3D || !object.scale?.isVector3
    || typeof object.updateWorldMatrix !== 'function' || typeof object.getWorldScale !== 'function') {
    throw new TypeError('Expected a Three.js Object3D with scale and world-matrix support.');
  }
}

function requirePositiveFiniteScale(scale, label) {
  if (!scale?.isVector3 || !['x', 'y', 'z'].every((axis) => Number.isFinite(scale[axis]) && scale[axis] > 0)) {
    throw new TypeError(`${label} must be a Three.js Vector3 with finite, positive components.`);
  }
}

function resolveTarget(target) {
  if (target === undefined) return new THREE.Vector3();
  if (!target?.isVector3) throw new TypeError('Scale target must be a Three.js Vector3.');
  return target;
}

export function getVrFurnaceContentWorldScaleMultiplier(contentClass) {
  if (!Object.hasOwn(WORLD_SCALE_MULTIPLIER_BY_CLASS, contentClass)) {
    throw new RangeError(`Unknown VR Furnace content size class: ${String(contentClass)}`);
  }
  return WORLD_SCALE_MULTIPLIER_BY_CLASS[contentClass];
}

export function getObjectWorldScale(object, target) {
  requireObject3D(object);
  const result = resolveTarget(target);
  object.updateWorldMatrix(true, false);
  return object.getWorldScale(result);
}

export function setObjectWorldScale(object, desiredWorldScale, scratch) {
  requireObject3D(object);
  requirePositiveFiniteScale(desiredWorldScale, 'Desired world scale');
  const inheritedWorldScale = resolveTarget(scratch);
  if (inheritedWorldScale === desiredWorldScale) {
    throw new TypeError('Scratch Vector3 must not be the desired world scale Vector3.');
  }

  const previousLocalScale = object.scale.clone();
  object.scale.set(1, 1, 1);
  object.updateWorldMatrix(true, false);
  object.getWorldScale(inheritedWorldScale);

  if (!['x', 'y', 'z'].every((axis) => Number.isFinite(inheritedWorldScale[axis])
    && Math.abs(inheritedWorldScale[axis]) > WORLD_SCALE_EPSILON)) {
    object.scale.copy(previousLocalScale);
    object.updateWorldMatrix(false, false);
    throw new RangeError('Cannot apply world scale through a parent transform with zero or near-zero scale.');
  }

  object.scale.set(
    desiredWorldScale.x / inheritedWorldScale.x,
    desiredWorldScale.y / inheritedWorldScale.y,
    desiredWorldScale.z / inheritedWorldScale.z
  );
  object.updateWorldMatrix(false, false);
  return object.scale;
}

export function resolveVrFurnaceContentWorldScale({ contentClass, baselineWorldScale, target } = {}) {
  requirePositiveFiniteScale(baselineWorldScale, 'Baseline world scale');
  return resolveTarget(target).copy(baselineWorldScale)
    .multiplyScalar(getVrFurnaceContentWorldScaleMultiplier(contentClass));
}
