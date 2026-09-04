import * as THREE from '../../vendor/three.js';
import { createVrTargetHalo } from '../createVrTargetHalo.js';
import { VR_ATTRACTOR_VISUAL_CONFIG } from './createVrAttractorTool.js';
import {
  getObjectWorldScale,
  resolveVrFurnaceContentWorldScale,
  setObjectWorldScale,
  VR_FURNACE_CONTENT_SIZE_CLASS
} from '../furnace/vrFurnaceContentSizing.js';
import { centerPresentationInProductVolume, productBoundsFitVolume,
  resolveProductVolumeBounds } from '../furnace/vrFurnaceProductVolume.js';

export const VR_ASTRO_ATTRACTOR_PRODUCTION_STATES = Object.freeze({
  READY: 'READY', BUILDING: 'BUILDING', AVAILABLE: 'AVAILABLE', CLAIMING: 'CLAIMING', EARNED: 'EARNED'
});
export const ASTRO_ATTRACTOR_CONSTRUCTION = 'ASTRO_ATTRACTOR_CONSTRUCTION';
const clamp01 = (value) => THREE.MathUtils.clamp(value, 0, 1);
const MODEL_AIM_AXIS = new THREE.Vector3(0, 1, 0);
const XR_AIM_AXIS = new THREE.Vector3(0, 0, -1);
const HORIZONTAL_QUATERNION = new THREE.Quaternion().setFromUnitVectors(MODEL_AIM_AXIS, XR_AIM_AXIS);

export function createVrAstroAttractorProductionController({ model, productVolume, controllers = [],
  processDriver, getChamberState = () => 'CLOSED', getRightMode = () => 'NORMAL_HAND', getLeftMode = () => 'NORMAL_HAND', canRequest = () => false,
  settings = {}, haloSettings = {}, onProduced = () => {}, onClaimed = () => {} }) {
  if (!model || !productVolume) throw new TypeError('model and VR_FURNACE_PRODUCT_VOLUME are required');
  const productVolumeBounds = resolveProductVolumeBounds(productVolume);
  const authoritativeVisualRoot = model.getObjectByName('VR_ATTRACTOR_ROOT');
  if (!authoritativeVisualRoot) throw new Error('Astro production asset contract requires VR_ATTRACTOR_ROOT');
  model.updateWorldMatrix(true, true); const authoredTransform = authoritativeVisualRoot.matrixWorld.clone();
  authoritativeVisualRoot.removeFromParent();
  const object = new THREE.Group(); object.name = 'vr-astro-attractor-production'; object.add(authoritativeVisualRoot);
  authoredTransform.decompose(authoritativeVisualRoot.position, authoritativeVisualRoot.quaternion, authoritativeVisualRoot.scale);
  object.scale.setScalar(VR_ATTRACTOR_VISUAL_CONFIG.modelScale);
  const canonicalBaselineWorldScale = getObjectWorldScale(object);
  const furnacePresentationWorldScale = resolveVrFurnaceContentWorldScale({
    contentClass: VR_FURNACE_CONTENT_SIZE_CLASS.ASTRO_ATTRACTOR,
    baselineWorldScale: canonicalBaselineWorldScale
  });
  const inheritedWorldScale = new THREE.Vector3();
  object.visible = false;
  const ownedMaterials = new Set();
  object.traverse((node) => { if (!node.isMesh || !node.material) return; const source = Array.isArray(node.material) ? node.material : [node.material];
    const clones = source.map((material) => { const clone = material.clone(); ownedMaterials.add(clone); return clone; });
    node.material = Array.isArray(node.material) ? clones : clones[0]; });
  const halo = createVrTargetHalo({ root: object, settings: haloSettings });
  const raycaster = new THREE.Raycaster(), origin = new THREE.Vector3(), direction = new THREE.Vector3(), quaternion = new THREE.Quaternion();
  const hits = new Map(controllers.map((record) => [record, false]));
  const subscribers = new Set(); let presentedProductBounds = null;
  let state = 'READY', progress = 0, handoffElapsed = 0, disposed = false, claimedCount = 0, producedCount = 0;
  const handoffDuration = Math.max(.01, settings.handoffDurationSeconds ?? .4);
  function snapshot() { return { state, buildProgress: state === 'BUILDING' ? progress : 0, constructionProgress: progress,
    available: state === 'AVAILABLE', earned: state === 'EARNED' }; }
  function emit() { const value = snapshot(); subscribers.forEach((listener) => listener(value)); }
  function setFormation(value) { const t = clamp01(value); object.visible = t > 0;
    ownedMaterials.forEach((material) => { if ('transparent' in material) material.transparent = t < 1; if ('opacity' in material) material.opacity = t; }); }
  function place() {
    if (object.parent !== productVolume) productVolume.add(object);
    object.position.set(0, 0, 0); object.quaternion.copy(HORIZONTAL_QUATERNION);
    setObjectWorldScale(object, furnacePresentationWorldScale, inheritedWorldScale);
    presentedProductBounds = centerPresentationInProductVolume({ presentationRoot: object,
      visibleRoot: authoritativeVisualRoot, productVolume, volumeBounds: productVolumeBounds });
  }
  function canCreate() { return !disposed && state === 'READY' && canRequest() && getChamberState() === 'CLOSED'
    && processDriver?.canStartConstruction?.(ASTRO_ATTRACTOR_CONSTRUCTION) === true; }
  function beginConstruction() {
    if (disposed || state !== 'READY' || getChamberState() !== 'CLOSED'
      || processDriver?.canStartConstruction?.(ASTRO_ATTRACTOR_CONSTRUCTION) !== true
      || processDriver.startConstruction(ASTRO_ATTRACTOR_CONSTRUCTION) !== true) return false;
    place(); progress = 0; setFormation(0); state = 'BUILDING'; emit(); return true;
  }
  function clearHits() { hits.forEach((_, record) => hits.set(record, false)); halo.setVisible(false); }
  function hasNormalHandMode(record) {
    return record?.handedness === 'left' ? getLeftMode() === 'NORMAL_HAND'
      : record?.handedness === 'right' && getRightMode() === 'NORMAL_HAND';
  }
  function updateHits() { let hovered = false; controllers.forEach((record) => { let hit = false;
    if (state === 'AVAILABLE' && getChamberState() === 'OPEN' && hasNormalHandMode(record) && record.ray?.visible !== false) {
      record.controller.updateWorldMatrix?.(true, false); record.controller.getWorldPosition(origin); record.controller.getWorldQuaternion(quaternion);
      direction.set(0, 0, -1).applyQuaternion(quaternion).normalize(); raycaster.set(origin, direction);
      raycaster.far = Math.min(settings.rayMaxDistance ?? 2.3, record.currentRayLength ?? settings.rayMaxDistance ?? 2.3);
      const intersection = raycaster.intersectObject(object, true).find(({ object: target }) => !target.userData?.vrTargetHalo);
      if (intersection) { hit = true; hovered = true; record.reportRayHit?.(intersection.distance); }
    } hits.set(record, hit); }); halo.setVisible(hovered); }
  function claim(record) { if (state !== 'AVAILABLE' || getChamberState() !== 'OPEN'
    || !hasNormalHandMode(record) || !hits.get(record)) return false;
    state = 'CLAIMING'; handoffElapsed = 0; clearHits(); object.updateWorldMatrix(true, true); record.controller.attach(object); emit(); return true; }
  function update(delta = 0) { if (disposed) return; const step = Math.max(0, delta);
    if (state === 'BUILDING' && processDriver?.getProcessKind?.() === ASTRO_ATTRACTOR_CONSTRUCTION) {
      progress = clamp01(processDriver.getProgress?.() ?? 0); setFormation(progress);
      if (progress >= 1) { setFormation(1); state = 'AVAILABLE'; producedCount += 1; onProduced(); emit(); }
    } else if (state === 'CLAIMING') { handoffElapsed += step; const t = clamp01(handoffElapsed / handoffDuration); const eased = 1 - (1 - t) ** 3;
      object.position.lerp(new THREE.Vector3(0, 0, -.08), eased); object.quaternion.slerp(new THREE.Quaternion(), eased);
      if (t >= 1) { object.visible = false; object.removeFromParent(); state = 'EARNED'; claimedCount += 1; onClaimed(); emit(); }
    }
    updateHits(); halo.update(step);
  }
  const listeners = controllers.map((record) => { const listener = () => claim(record); record.controller.addEventListener?.('squeezestart', listener); return { record, listener }; });
  function resetSession() { clearHits(); if (state === 'BUILDING') { state = 'READY'; progress = 0; object.visible = false; object.removeFromParent(); }
    else if (state === 'AVAILABLE') { place(); setFormation(1); } else if (state === 'CLAIMING') { state = 'AVAILABLE'; place(); setFormation(1); } emit(); }
  function resetBaseline() { clearHits(); state = 'READY'; progress = 0; handoffElapsed = 0;
    object.visible = false; object.removeFromParent(); emit(); }
  function hydrateScenarioState(value) {
    if (!value || value.state !== 'EARNED') throw new TypeError('astroProduction state must be EARNED');
    clearHits(); state = 'EARNED'; progress = 1; handoffElapsed = 0;
    object.visible = false; object.removeFromParent(); emit();
  }
  function dispose() { if (disposed) return; disposed = true; listeners.forEach(({ record, listener }) => record.controller.removeEventListener?.('squeezestart', listener));
    clearHits(); halo.dispose(); object.removeFromParent(); ownedMaterials.forEach((material) => material.dispose()); subscribers.clear(); }
  return { object, beginConstruction, canCreate, claim, update, resetSession, resetBaseline, hydrateScenarioState, dispose, getState: () => state, getSnapshot: snapshot,
    isEarned: () => state === 'EARNED', hasCurrentHit: (record) => hits.get(record) === true,
    subscribe(listener) { subscribers.add(listener); return () => subscribers.delete(listener); },
    getDiagnostics: () => ({ state, producedCount, claimedCount, visualRootName: authoritativeVisualRoot.name,
      canonicalBaselineWorldScale: canonicalBaselineWorldScale.toArray(),
      furnacePresentationWorldScale: furnacePresentationWorldScale.toArray(),
      horizontalPresentation: MODEL_AIM_AXIS.clone().applyQuaternion(object.quaternion).distanceTo(XR_AIM_AXIS) < 1e-8,
      parentIsProductVolume: object.parent === productVolume, productVolumeName: productVolume.name,
      productVolumeBounds: productVolumeBounds ? { min: productVolumeBounds.min.toArray(), max: productVolumeBounds.max.toArray(),
        size: productVolumeBounds.getSize(new THREE.Vector3()).toArray() } : null,
      productCenterInsideVolume: presentedProductBounds
        ? productVolumeBounds.containsPoint(presentedProductBounds.getCenter(new THREE.Vector3())) : null,
      productFitsVolume: presentedProductBounds ? productBoundsFitVolume(presentedProductBounds, productVolumeBounds) : null,
      processKind: processDriver?.getProcessKind?.() ?? null }) };
}
