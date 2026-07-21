import * as THREE from '../vendor/three.js';
import { assetManifest } from '../assets/assetManifest.js';

const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const coarsePointer = () => window.matchMedia('(pointer: coarse)').matches;
const durationFor = (reverse) => {
  const base = reducedMotion() ? 140 : coarsePointer() ? 430 : 740;
  return reverse ? Math.max(reducedMotion() ? 100 : 180, base * 0.5) : base;
};

function cloneMaterials(root) {
  const materials = [];
  root.traverse((child) => {
    if (!child.isMesh) return;
    child.raycast = () => {};
    const source = Array.isArray(child.material) ? child.material : [child.material];
    const copies = source.map((material) => {
      const copy = material.clone();
      copy.transparent = true;
      copy.opacity = 1;
      copy.depthWrite = false;
      materials.push(copy);
      return copy;
    });
    child.material = Array.isArray(child.material) ? copies : copies[0];
  });
  return materials;
}

function glyphMaterials(node) {
  const materials = [];
  (node.userData.visualModel ?? node).traverse((child) => {
    if (!child.isMesh || !child.material) return;
    const source = Array.isArray(child.material) ? child.material : [child.material];
    const copies = source.map((material) => {
      const copy = material.clone();
      copy.transparent = true;
      materials.push(copy);
      return copy;
    });
    child.material = Array.isArray(child.material) ? copies : copies[0];
  });
  return materials;
}

export function createPlaqueTransition({ scene, assetManager }) {
  let instance = null;
  let active = null;
  let warned = false;

  function warn(error) {
    if (!warned) console.warn('[plaqueTransition] Creative AI plaque unavailable; continuing with panel fallback.', error);
    warned = true;
  }

  async function ensure(node) {
    const data = node.userData;
    if (!data.plaqueModelPath) return null;
    if (instance?.nodeId === data.id) return instance;
    const asset = assetManifest.deferredWarm.find((entry) => entry.id === `plaque-${data.id}`);
    let source = assetManager.getGltf(`plaque-${data.id}`)?.scene;
    if (!source && asset) source = (await assetManager.loadAsset(asset)).scene;
    if (!source) throw new Error('Plaque GLB missing scene.');
    const wrapper = new THREE.Group();
    const model = source.clone(true);
    const materials = cloneMaterials(model);
    if (!materials.length) throw new Error('Plaque GLB has no meshes.');
    const bounds = new THREE.Box3().setFromObject(model);
    const size = bounds.getSize(new THREE.Vector3());
    if (bounds.isEmpty() || Math.max(size.x, size.y, size.z) <= 0) throw new Error('Plaque GLB bounds unavailable.');
    const center = bounds.getCenter(new THREE.Vector3());
    model.position.sub(center);
    const visual = data.plaqueVisual ?? {};
    model.scale.setScalar(visual.scale ?? 1);
    model.position.add(new THREE.Vector3(...(visual.position ?? [0, 0, 0])));
    wrapper.add(model);
    const glow = new THREE.Mesh(
      new THREE.SphereGeometry(Math.max(size.x, size.y, size.z) * 0.55, 20, 16),
      new THREE.MeshBasicMaterial({ color: '#ff9c47', transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false })
    );
    glow.raycast = () => {};
    wrapper.add(glow);
    const warmLight = new THREE.PointLight('#ff9c47', 0, Math.max(size.x, size.y, size.z) * 4, 2);
    wrapper.add(warmLight);
    wrapper.visible = false;
    wrapper.raycast = () => {};
    scene.add(wrapper);
    instance = { nodeId: data.id, wrapper, model, materials, glyphMaterials: null, glow, warmLight };
    return instance;
  }

  function setOpacity(materials, opacity) { materials.forEach((material) => { material.opacity = opacity; material.needsUpdate = true; }); }

  async function reveal(node, camera) {
    try {
      const plaque = await ensure(node);
      if (!plaque) return null;
      const position = node.getWorldPosition(new THREE.Vector3());
      plaque.wrapper.position.copy(position);
      plaque.wrapper.lookAt(camera.position);
      plaque.wrapper.rotateY(node.userData.plaqueVisual?.frontYawOffset ?? 0);
      plaque.wrapper.visible = true;
      plaque.glyphMaterials ??= glyphMaterials(node);
      active = { node, plaque, startedAt: performance.now(), duration: durationFor(false), reverse: false, resolve: null };
      setOpacity(plaque.materials, 0);
      return new Promise((resolve) => { active.resolve = () => resolve(plaque.wrapper); });
    } catch (error) { warn(error); reset(node); return null; }
  }

  function restore(node) {
    if (!instance) return Promise.resolve();
    active = { node, plaque: instance, startedAt: performance.now(), duration: durationFor(true), reverse: true, resolve: null };
    return new Promise((resolve) => { active.resolve = resolve; });
  }

  function update() {
    if (!active) return;
    const progress = THREE.MathUtils.clamp((performance.now() - active.startedAt) / active.duration, 0, 1);
    const eased = progress * progress * (3 - 2 * progress);
    const amount = active.reverse ? 1 - eased : eased;
    setOpacity(active.plaque.materials, amount);
    const flash = Math.sin(Math.PI * progress);
    active.plaque.glow.material.opacity = flash * 0.45;
    active.plaque.warmLight.intensity = flash * 2.2;
    active.plaque.model.scale.setScalar(THREE.MathUtils.lerp(0.75, 1, amount));
    setOpacity(active.plaque.glyphMaterials, 1 - amount);
    active.node.scale.setScalar(THREE.MathUtils.lerp(0.94, 1, 1 - amount));
    if (progress < 1) return;
    if (!active.reverse) { const finished = active; active = null; finished.resolve?.(); return; }
    const finished = active;
    finished.plaque.wrapper.visible = false;
    setOpacity(finished.plaque.materials, 1);
    finished.plaque.glow.material.opacity = 0;
    finished.plaque.warmLight.intensity = 0;
    setOpacity(finished.plaque.glyphMaterials, 1);
    finished.node.scale.setScalar(finished.node.userData.baseScale);
    active = null;
    finished.resolve?.();
  }

  function reset(node) {
    if (instance) { instance.wrapper.visible = false; setOpacity(instance.materials, 1); instance.glow.material.opacity = 0; instance.warmLight.intensity = 0; }
    if (instance?.glyphMaterials) setOpacity(instance.glyphMaterials, 1);
    if (node) node.scale.setScalar(node.userData.baseScale ?? 1);
    active = null;
  }

  return { reveal, restore, reset, update };
}
