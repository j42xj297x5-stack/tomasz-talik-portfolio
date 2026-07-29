import * as THREE from '../vendor/three.js';
import { resolveVrGlyphPlaqueAsset } from './resolveVrGlyphPlaqueAsset.js';

export function calculateUniformPlaqueScale(size, maxWidth, maxHeight) {
  return Math.min(maxWidth / size.x, maxHeight / size.y);
}

export function createVrGlyphPlaque({ scene, parent = scene, settings, plaqueAssets }) {
  const object = new THREE.Group();
  object.name = 'VrGlyphPlaque'; object.visible = false; parent.add(object);
  const instances = new Map();
  const ownedMaterials = [];
  let state = 'hidden'; let elapsed = 0; let active = null; let disposed = false;

  plaqueAssets.forEach((source, id) => {
    if (!source) return;
    const model = source.clone(true);
    const materials = [];
    model.traverse((child) => {
      if (!child.isMesh || !child.material) return;
      const sourceMaterials = Array.isArray(child.material) ? child.material : [child.material];
      const clones = sourceMaterials.map((material) => {
        const clone = material.clone(); ownedMaterials.push(clone);
        materials.push({ material: clone, opacity: material.opacity, transparent: material.transparent, depthWrite: material.depthWrite });
        return clone;
      });
      child.material = Array.isArray(child.material) ? clones : clones[0];
    });
    const bounds = new THREE.Box3().setFromObject(model);
    const size = bounds.getSize(new THREE.Vector3());
    if (bounds.isEmpty() || size.x <= 0 || size.y <= 0 || !materials.length) return;
    const scale = calculateUniformPlaqueScale(size, settings.maxWidth, settings.maxHeight);
    model.scale.setScalar(scale); model.updateMatrixWorld(true);
    const scaledBounds = new THREE.Box3().setFromObject(model);
    model.position.sub(scaledBounds.getCenter(new THREE.Vector3()));
    model.rotation.y += plaqueAssets.visuals?.get(id)?.frontYawOffset ?? 0;
    model.visible = false; object.add(model); model.updateMatrixWorld(true);
    const localBounds = new THREE.Box3().setFromObject(model);
    instances.set(id, { model, materials, localBounds });
  });

  function restore(record, amount = 1) {
    record?.materials.forEach((entry) => {
      entry.material.opacity = entry.opacity * amount;
      entry.material.transparent = amount < 1 ? true : entry.transparent;
      entry.material.depthWrite = amount < 1 ? false : entry.depthWrite;
    });
  }
  function hide() {
    if (disposed) return; elapsed = 0; state = 'hidden'; object.visible = false;
    instances.forEach((record) => { restore(record); record.model.visible = false; }); active = null;
  }
  function showForGlyph(glyphNode) {
    if (disposed || !settings.enabled) return false;
    const source = resolveVrGlyphPlaqueAsset(glyphNode, plaqueAssets);
    const id = glyphNode?.userData?.id; const record = source ? instances.get(id) : null;
    if (!record) { hide(); return false; }
    instances.forEach((item) => { item.model.visible = item === record; }); active = record;
    object.position.set(0, 0, 0); object.rotation.set(0, 0, 0);
    elapsed = 0; state = 'appearing'; object.visible = true; object.scale.setScalar(settings.appearStartScale); restore(record, 0); return true;
  }
  function update(delta) {
    if (disposed || state !== 'appearing') return;
    elapsed += Number.isFinite(delta) && delta > 0 ? delta : 0;
    const progress = Math.min(1, elapsed / settings.appearDuration); const eased = progress * progress * (3 - 2 * progress);
    object.scale.setScalar(settings.appearStartScale + (1 - settings.appearStartScale) * eased); restore(active, eased);
    if (progress === 1) state = 'visible';
  }
  function reset() { hide(); }
  function dispose() { if (disposed) return; hide(); disposed = true; object.clear(); object.removeFromParent(); ownedMaterials.forEach((m) => m.dispose()); instances.clear(); }
  function getActiveBounds(target = new THREE.Box3()) {
    if (!active) return target.makeEmpty();
    return target.copy(active.localBounds);
  }
  return { object, get state() { return state; }, showForGlyph, getActiveBounds, hide, update, reset, dispose };
}
