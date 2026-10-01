import * as THREE from '../../vendor/three.js';

export const VR_FURNACE_EXTRACTION_PRESENTATION = Object.freeze({
  drainEnd: 0.30,
  fadeStart: 0.72
});

const clamp01 = (value) => THREE.MathUtils.clamp(Number.isFinite(value) ? value : 0, 0, 1);
const smoothstep = (value) => {
  const t = clamp01(value);
  return t * t * (3 - 2 * t);
};

export function createVrFurnaceExtractionMaterialEffect(object) {
  if (!object?.isObject3D || typeof object.traverse !== 'function') {
    throw new TypeError('Furnace extraction material effect requires an Object3D.');
  }

  const baselines = [];
  const capturedMaterials = new Set();
  object.traverse((node) => {
    if (!node.isMesh || !node.material) return;
    const materials = Array.isArray(node.material) ? node.material : [node.material];
    materials.forEach((material) => {
      if (!material || capturedMaterials.has(material)) return;
      capturedMaterials.add(material);
      baselines.push({
        material,
        color: material.color?.clone() ?? null,
        emissive: material.emissive?.clone() ?? null,
        emissiveIntensity: material.emissiveIntensity,
        opacity: material.opacity ?? 1,
        transparent: material.transparent ?? false
      });
    });
  });

  let released = false;
  function restore() {
    if (released) return false;
    baselines.forEach(({ material, color, emissive, emissiveIntensity, opacity, transparent }) => {
      if (material.color && color) material.color.copy(color);
      if (material.emissive && emissive) material.emissive.copy(emissive);
      if (emissiveIntensity !== undefined && 'emissiveIntensity' in material) {
        material.emissiveIntensity = emissiveIntensity;
      }
      material.opacity = opacity;
      material.transparent = transparent;
    });
    return true;
  }

  function apply(progress) {
    if (released) return false;
    const normalized = clamp01(progress);
    const drain = smoothstep(normalized / VR_FURNACE_EXTRACTION_PRESENTATION.drainEnd);
    const fade = smoothstep((normalized - VR_FURNACE_EXTRACTION_PRESENTATION.fadeStart)
      / (1 - VR_FURNACE_EXTRACTION_PRESENTATION.fadeStart));
    baselines.forEach(({ material, color, emissive, emissiveIntensity, opacity, transparent }) => {
      if (material.color && color) material.color.copy(color).multiplyScalar(1 - drain);
      if (material.emissive && emissive) material.emissive.copy(emissive).multiplyScalar(1 - drain);
      if (emissiveIntensity !== undefined && 'emissiveIntensity' in material) {
        material.emissiveIntensity = THREE.MathUtils.lerp(emissiveIntensity, 0, drain);
      }
      material.opacity = opacity * (1 - fade);
      material.transparent = fade > 0 || transparent;
    });
    return true;
  }

  function release() {
    if (released) return;
    released = true;
    baselines.length = 0;
    capturedMaterials.clear();
  }

  return { apply, restore, release };
}
