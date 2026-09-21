import * as THREE from '../vendor/three.js';
import { publicPath } from '../utils/publicPath.js';

const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const transitionDuration = (reverse) => reducedMotion() ? 120 : reverse ? 360 : 720;

function findCanvasSurface(root) {
  let surface = null;
  root?.traverse((object) => {
    if (!surface && object.name === 'PORTAL_CANVAS_SURFACE') surface = object;
  });
  const role = surface?.userData?.portal_role;
  return surface?.isMesh && surface.geometry?.getAttribute?.('uv')
    && (role === undefined || role === 'canvas_surface') ? surface : null;
}

function loadImage(path) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error(`Logo image unavailable: ${path}`));
    image.src = publicPath(path);
  });
}

export function createOrangeMonkeyPortalTransition({ scene, assetManager }) {
  let instance = null;
  let active = null;
  let warned = false;

  function setOpacity(value) {
    instance?.materials.forEach(({ material, opacity }) => {
      material.opacity = opacity * value;
      material.needsUpdate = true;
    });
  }

  async function ensure() {
    if (instance) return instance;
    let ownedMaterials = [];
    let ownedTexture = null;
    let ownedCanvas = null;
    try {
      const source = assetManager.getGltf('vr-portal-model')?.scene;
      if (!source) throw new Error('Deferred vr-portal-model is unavailable.');
      const wrapper = new THREE.Group();
      wrapper.name = 'Experience3dOrangeMonkeyPortal';
      const model = source.clone(true);
      const surface = findCanvasSurface(model);
      if (!surface) throw new Error('PORTAL_CANVAS_SURFACE is missing, invalid, or has no UVs.');
      const materials = ownedMaterials;
      model.traverse((child) => {
        if (!child.isMesh || !child.material) return;
        child.raycast = () => {};
        const sourceMaterials = Array.isArray(child.material) ? child.material : [child.material];
        const owned = sourceMaterials.map((material) => {
          const copy = material.clone();
          copy.transparent = true;
          copy.depthWrite = false;
          materials.push({ material: copy, opacity: material.opacity });
          return copy;
        });
        child.material = Array.isArray(child.material) ? owned : owned[0];
      });
      const canvas = document.createElement('canvas');
      ownedCanvas = canvas;
      canvas.width = 1024;
      canvas.height = 640;
      const context = canvas.getContext('2d');
      if (!context) throw new Error('2D canvas context is unavailable.');
      const logo = await loadImage('/png/orange_monkey.webp');
      context.fillStyle = '#000000';
      context.fillRect(0, 0, canvas.width, canvas.height);
      const margin = 0.16;
      const scale = Math.min(canvas.width * (1 - margin * 2) / logo.naturalWidth, canvas.height * (1 - margin * 2) / logo.naturalHeight);
      const width = logo.naturalWidth * scale;
      const height = logo.naturalHeight * scale;
      context.drawImage(logo, (canvas.width - width) / 2, (canvas.height - height) / 2, width, height);
      const texture = new THREE.CanvasTexture(canvas);
      ownedTexture = texture;
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.minFilter = THREE.LinearFilter;
      texture.magFilter = THREE.LinearFilter;
      const surfaceMaterial = new THREE.MeshBasicMaterial({ map: texture, transparent: true, opacity: 1, side: THREE.FrontSide, depthWrite: false });
      const replaced = Array.isArray(surface.material) ? surface.material : [surface.material];
      replaced.forEach((material) => {
        const index = materials.findIndex((entry) => entry.material === material);
        if (index >= 0) {
          materials[index].material.dispose();
          materials.splice(index, 1);
        }
      });
      surface.material = surfaceMaterial;
      materials.push({ material: surfaceMaterial, opacity: 1 });
      const bounds = new THREE.Box3().setFromObject(model);
      const size = bounds.getSize(new THREE.Vector3());
      if (bounds.isEmpty() || size.x <= 0 || size.y <= 0) throw new Error('Portal bounds are unavailable.');
      const center = bounds.getCenter(new THREE.Vector3());
      model.position.sub(center);
      model.scale.setScalar(Math.min(2.5 / size.x, 2.25 / size.y));
      wrapper.add(model);
      wrapper.visible = false;
      scene.add(wrapper);
      instance = { wrapper, model, surface, materials, texture, canvas };
      return instance;
    } catch (error) {
      ownedMaterials.forEach(({ material }) => material.dispose());
      ownedTexture?.dispose();
      if (ownedCanvas) {
        ownedCanvas.width = 0;
        ownedCanvas.height = 0;
      }
      if (!warned) console.warn('[orangeMonkeyPortal] Portal unavailable; opening the information overlay directly.', error);
      warned = true;
      reset();
      return null;
    }
  }

  async function reveal(monkeyRoot, camera) {
    const portal = await ensure();
    if (!portal) return null;
    const monkeyPosition = monkeyRoot.getWorldPosition(new THREE.Vector3());
    portal.wrapper.position.copy(monkeyPosition);
    portal.wrapper.position.y += 1.25;
    portal.wrapper.lookAt(camera.position);
    portal.wrapper.visible = true;
    portal.wrapper.scale.setScalar(0.88);
    setOpacity(0);
    active = { reverse: false, startedAt: performance.now(), duration: transitionDuration(false), resolve: null };
    return new Promise((resolve) => { active.resolve = () => resolve(portal.wrapper); });
  }

  function hide() {
    if (!instance?.wrapper.visible) return Promise.resolve();
    active = { reverse: true, startedAt: performance.now(), duration: transitionDuration(true), resolve: null };
    return new Promise((resolve) => { active.resolve = resolve; });
  }

  function update() {
    if (!active || !instance) return;
    const progress = THREE.MathUtils.clamp((performance.now() - active.startedAt) / Math.max(1, active.duration), 0, 1);
    const eased = progress * progress * (3 - 2 * progress);
    const amount = active.reverse ? 1 - eased : eased;
    setOpacity(amount);
    instance.wrapper.scale.setScalar(THREE.MathUtils.lerp(0.88, 1, amount));
    if (progress < 1) return;
    const finished = active;
    active = null;
    if (finished.reverse) instance.wrapper.visible = false;
    finished.resolve?.();
  }

  function reset() {
    if (instance) {
      instance.wrapper.visible = false;
      instance.wrapper.scale.setScalar(1);
      setOpacity(1);
    }
    const interrupted = active;
    active = null;
    interrupted?.resolve?.();
  }

  function dispose() {
    reset();
    if (!instance) return;
    instance.wrapper.removeFromParent();
    instance.materials.forEach(({ material }) => material.dispose());
    instance.texture.dispose();
    instance.canvas.width = 0;
    instance.canvas.height = 0;
    instance = null;
  }

  return { ensure, reveal, hide, reset, update, dispose };
}
