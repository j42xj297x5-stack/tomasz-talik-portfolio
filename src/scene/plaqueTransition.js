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
      materials.push({
        material: copy,
        original: {
          opacity: copy.opacity,
          transparent: copy.transparent,
          depthWrite: copy.depthWrite,
          depthTest: copy.depthTest,
          alphaTest: copy.alphaTest,
          side: copy.side
        }
      });
      return copy;
    });
    child.material = Array.isArray(child.material) ? copies : copies[0];
  });
  return materials;
}

function glyphMaterials(node) {
  const materials = [];
  const visualModel = node.userData.visualModel ?? node;
  visualModel.traverse((child) => {
    if (!child.isMesh || !child.material) return;
    const source = Array.isArray(child.material) ? child.material : [child.material];
    const copies = source.map((material) => {
      const copy = material.clone();
      copy.transparent = true;
      copy.depthWrite = false;
      materials.push({ material: copy, opacity: material.opacity, transparent: material.transparent, depthWrite: material.depthWrite });
      return copy;
    });
    child.material = Array.isArray(child.material) ? copies : copies[0];
  });
  return { visualModel, visible: visualModel.visible, materials };
}

export function createPlaqueTransition({ scene, assetManager }) {
  const instances = new Map();
  const warnedNodeIds = new Set();
  let active = null;

  function nodeIdFor(node) {
    return node?.userData?.id;
  }

  function warn(node, error) {
    const nodeId = nodeIdFor(node) ?? 'unknown';
    if (warnedNodeIds.has(nodeId)) return;
    const nodeLabel = node?.userData?.title ?? nodeId;
    console.warn(`[plaqueTransition] Plaque unavailable for ${nodeLabel} (${nodeId}); continuing with panel fallback.`, error);
    warnedNodeIds.add(nodeId);
  }

  async function ensure(node) {
    const data = node.userData;
    const nodeId = nodeIdFor(node);
    if (!data.plaqueModelPath) return null;
    if (instances.has(nodeId)) return instances.get(nodeId);
    const assetId = `plaque-${nodeId}`;
    const asset = assetManifest.deferredWarm.find((entry) => entry.id === assetId);
    let source = assetManager.getGltf(assetId)?.scene;
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
      new THREE.MeshBasicMaterial({ color: visual.plaqueGlowColor ?? '#FF9C47', transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false })
    );
    glow.raycast = () => {};
    wrapper.add(glow);
    const warmLight = new THREE.PointLight('#ff9c47', 0, Math.max(size.x, size.y, size.z) * 4, 2);
    wrapper.add(warmLight);
    wrapper.visible = false;
    wrapper.userData.plaqueInstance = true;
    wrapper.raycast = () => {};
    scene.add(wrapper);
    const instance = { nodeId, wrapper, model, materials, glyphMaterials: null, glow, warmLight };
    instances.set(nodeId, instance);
    return instance;
  }

  async function prewarm(nodes, camera) {
    const prepared = [];
    for (const node of nodes) {
      try {
        const plaque = await ensure(node);
        if (!plaque) continue;
        plaque.wrapper.position.copy(node.getWorldPosition(new THREE.Vector3()));
        plaque.wrapper.lookAt(camera.position);
        plaque.wrapper.rotateY(node.userData.plaqueVisual?.frontYawOffset ?? 0);
        prepared.push(plaque);
      } catch (error) {
        warn(node, error);
      }
    }
    return prepared;
  }

  function setWarmupVisibility(visible) {
    instances.forEach((plaque) => {
      plaque.wrapper.visible = visible;
      plaque.glow.material.opacity = 0;
      plaque.warmLight.intensity = 0;
    });
  }

  function setWarmupMaterialMode(mode) {
    instances.forEach((plaque) => {
      if (mode === 'fade') setFadeMode(plaque.materials);
      else setStableMode(plaque.materials);
    });
  }

  function setFadeMode(materials) {
    materials.forEach(({ material }) => {
      material.transparent = true;
      material.depthWrite = false;
      material.depthTest = true;
      material.needsUpdate = true;
    });
  }
  function setStableMode(materials) {
    materials.forEach(({ material, original }) => {
      material.opacity = original.opacity;
      material.transparent = original.transparent;
      material.depthWrite = original.depthWrite;
      material.depthTest = original.depthTest;
      material.alphaTest = original.alphaTest;
      material.side = original.side;
      material.needsUpdate = true;
    });
  }
  function setFadeOpacity(materials, amount) {
    materials.forEach(({ material, original }) => {
      material.opacity = original.opacity * amount;
      material.needsUpdate = true;
    });
  }
  function setGlyphFade(glyph, opacity) {
    glyph.materials.forEach(({ material }) => {
      material.transparent = true;
      material.depthWrite = false;
      material.opacity = opacity;
      material.needsUpdate = true;
    });
  }
  function restoreGlyphMaterials(glyph) {
    glyph.materials.forEach(({ material, opacity, transparent, depthWrite }) => {
      material.opacity = opacity;
      material.transparent = transparent;
      material.depthWrite = depthWrite;
      material.needsUpdate = true;
    });
  }

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
      plaque.glyphMaterials.visualModel.visible = true;
      setGlyphFade(plaque.glyphMaterials, 1);
      active = { node, plaque, startedAt: performance.now(), duration: durationFor(false), reverse: false, resolve: null };
      setFadeMode(plaque.materials);
      setFadeOpacity(plaque.materials, 0);
      return new Promise((resolve) => { active.resolve = () => resolve(plaque.wrapper); });
    } catch (error) { warn(node, error); reset(node); return null; }
  }

  function restore(node) {
    const plaque = instances.get(nodeIdFor(node));
    if (!plaque) return Promise.resolve();
    plaque.glyphMaterials ??= glyphMaterials(node);
    plaque.glyphMaterials.visualModel.visible = true;
    setGlyphFade(plaque.glyphMaterials, 0);
    // Dolly-out keeps the original depth-buffer state. Switch only when the
    // reverse fade actually begins, preserving its already-stable first frame.
    setFadeMode(plaque.materials);
    active = { node, plaque, startedAt: performance.now(), duration: durationFor(true), reverse: true, resolve: null };
    return new Promise((resolve) => { active.resolve = resolve; });
  }

  function update() {
    if (!active) return;
    const progress = THREE.MathUtils.clamp((performance.now() - active.startedAt) / active.duration, 0, 1);
    const eased = progress * progress * (3 - 2 * progress);
    const amount = active.reverse ? 1 - eased : eased;
    setFadeOpacity(active.plaque.materials, amount);
    const flash = Math.sin(Math.PI * progress);
    active.plaque.glow.material.opacity = flash * 0.45;
    active.plaque.warmLight.intensity = flash * 2.2;
    active.plaque.model.scale.setScalar(THREE.MathUtils.lerp(0.75, 1, amount));
    setGlyphFade(active.plaque.glyphMaterials, 1 - amount);
    active.node.scale.setScalar(THREE.MathUtils.lerp(0.94, 1, 1 - amount));
    if (progress < 1) return;
    if (!active.reverse) {
      const finished = active;
      // A fully revealed glyph must not leave either color or depth behind.
      finished.plaque.glyphMaterials.visualModel.visible = false;
      // Restore GLB material semantics before plaqueHold and the dolly-in.
      setStableMode(finished.plaque.materials);
      active = null;
      finished.resolve?.();
      return;
    }
    const finished = active;
    finished.plaque.wrapper.visible = false;
    setStableMode(finished.plaque.materials);
    finished.plaque.glow.material.opacity = 0;
    finished.plaque.warmLight.intensity = 0;
    restoreGlyphMaterials(finished.plaque.glyphMaterials);
    finished.plaque.glyphMaterials.visualModel.visible = finished.plaque.glyphMaterials.visible;
    finished.node.scale.setScalar(finished.node.userData.baseScale);
    active = null;
    finished.resolve?.();
  }

  function reset(node) {
    const plaque = instances.get(nodeIdFor(node));
    if (plaque) {
      plaque.wrapper.visible = false;
      setStableMode(plaque.materials);
      plaque.glow.material.opacity = 0;
      plaque.warmLight.intensity = 0;
    }
    if (plaque?.glyphMaterials) {
      restoreGlyphMaterials(plaque.glyphMaterials);
      plaque.glyphMaterials.visualModel.visible = plaque.glyphMaterials.visible;
    }
    if (node) node.scale.setScalar(node.userData.baseScale ?? 1);
    if (active?.node === node) active = null;
  }

  return { prewarm, setWarmupVisibility, setWarmupMaterialMode, reveal, restore, reset, update, getInstanceCount: () => instances.size };
}
