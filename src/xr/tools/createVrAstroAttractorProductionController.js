import * as THREE from '../../vendor/three.js';
import { createVrTargetHalo } from '../createVrTargetHalo.js';
import { resolveFurnaceContentSnapTarget } from '../furnace/vrAstroFurnaceChamberCylinder.js';

export const VR_ASTRO_ATTRACTOR_PRODUCTION_STATES = Object.freeze({
  READY: 'READY', BUILDING: 'BUILDING', AVAILABLE: 'AVAILABLE', CLAIMING: 'CLAIMING', EARNED: 'EARNED'
});
export const ASTRO_ATTRACTOR_CONSTRUCTION = 'ASTRO_ATTRACTOR_CONSTRUCTION';
const clamp01 = (value) => THREE.MathUtils.clamp(value, 0, 1);
const CHAMBER_FILL = .90;
const MODEL_AIM_AXIS = new THREE.Vector3(0, 1, 0);
const XR_AIM_AXIS = new THREE.Vector3(0, 0, -1);
const HORIZONTAL_QUATERNION = new THREE.Quaternion().setFromUnitVectors(MODEL_AIM_AXIS, XR_AIM_AXIS);

function boundsRelativeTo(root, reference) {
  const bounds = new THREE.Box3().makeEmpty();
  reference.updateWorldMatrix(true, false); root.updateWorldMatrix(true, true);
  const inverse = reference.matrixWorld.clone().invert();
  root.traverse((node) => {
    if (!node.visible || !node.geometry) return;
    if (!node.geometry.boundingBox) node.geometry.computeBoundingBox();
    if (node.geometry.boundingBox) bounds.union(node.geometry.boundingBox.clone().applyMatrix4(
      new THREE.Matrix4().multiplyMatrices(inverse, node.matrixWorld)
    ));
  });
  return bounds;
}

export function createVrAstroAttractorProductionController({ model, contentAnchor, chamber, chamberCylinder, energyCell = null, controllers = [],
  processDriver, getChamberState = () => 'CLOSED', getRightMode = () => 'NORMAL_HAND', canRequest = () => false,
  settings = {}, haloSettings = {}, onRequested = () => {}, onProduced = () => {}, onClaimed = () => {} }) {
  if (!model || !contentAnchor || !chamber || !chamberCylinder) {
    throw new TypeError('model, contentAnchor, chamber and chamberCylinder are required');
  }
  if (!(Number.isFinite(chamberCylinder.radius) && chamberCylinder.radius > 0
    && Number.isFinite(chamberCylinder.halfHeight) && chamberCylinder.halfHeight > 0)) {
    throw new Error('Invalid Astro furnace chamber cylinder contract');
  }
  const authoritativeVisualRoot = model.getObjectByName('VR_ATTRACTOR_ROOT');
  if (!authoritativeVisualRoot) throw new Error('Astro production asset contract requires VR_ATTRACTOR_ROOT');
  model.updateWorldMatrix(true, true); const authoredTransform = authoritativeVisualRoot.matrixWorld.clone();
  authoritativeVisualRoot.removeFromParent();
  const object = new THREE.Group(); object.name = 'vr-astro-attractor-production'; object.add(authoritativeVisualRoot);
  authoredTransform.decompose(authoritativeVisualRoot.position, authoritativeVisualRoot.quaternion, authoritativeVisualRoot.scale);
  object.visible = false; contentAnchor.add(object);
  const ownedMaterials = new Set();
  object.traverse((node) => { if (!node.isMesh || !node.material) return; const source = Array.isArray(node.material) ? node.material : [node.material];
    const clones = source.map((material) => { const clone = material.clone(); ownedMaterials.add(clone); return clone; });
    node.material = Array.isArray(node.material) ? clones : clones[0]; });
  const halo = createVrTargetHalo({ root: object, settings: haloSettings });
  const raycaster = new THREE.Raycaster(), origin = new THREE.Vector3(), direction = new THREE.Vector3(), quaternion = new THREE.Quaternion();
  const hits = new Map(controllers.map((record) => [record, false]));
  const subscribers = new Set(); let presentationScale = null, visibleChamberSize = null;
  let state = 'READY', progress = 0, handoffElapsed = 0, disposed = false, claimedCount = 0, producedCount = 0;
  const handoffDuration = Math.max(.01, settings.handoffDurationSeconds ?? .4);
  function snapshot() { return { state, buildProgress: state === 'BUILDING' ? progress : 0, constructionProgress: progress,
    available: state === 'AVAILABLE', earned: state === 'EARNED' }; }
  function emit() { const value = snapshot(); subscribers.forEach((listener) => listener(value)); }
  function setFormation(value) { const t = clamp01(value); object.visible = t > 0; object.scale.setScalar(presentationScale * Math.max(.001, t));
    ownedMaterials.forEach((material) => { if ('transparent' in material) material.transparent = t < 1; if ('opacity' in material) material.opacity = t; }); }
  function place() {
    if (object.parent !== contentAnchor) contentAnchor.add(object);
    object.position.set(0, 0, 0); object.quaternion.copy(HORIZONTAL_QUATERNION); object.scale.setScalar(1);
    const orientedBounds = boundsRelativeTo(authoritativeVisualRoot, chamber);
    if (orientedBounds.isEmpty()) throw new Error('VR_ATTRACTOR_ROOT must contain visible bounded geometry');
    const center = orientedBounds.getCenter(new THREE.Vector3()); let maxRadialExtent = 0, maxVerticalExtent = 0;
    for (const x of [orientedBounds.min.x, orientedBounds.max.x]) for (const y of [orientedBounds.min.y, orientedBounds.max.y]) {
      for (const z of [orientedBounds.min.z, orientedBounds.max.z]) {
        maxRadialExtent = Math.max(maxRadialExtent, Math.hypot(x - center.x, z - center.z));
        maxVerticalExtent = Math.max(maxVerticalExtent, Math.abs(y - center.y));
      }
    }
    presentationScale = Math.min(chamberCylinder.radius * CHAMBER_FILL / maxRadialExtent,
      chamberCylinder.halfHeight * CHAMBER_FILL / maxVerticalExtent);
    if (!(Number.isFinite(presentationScale) && presentationScale > 0)) {
      throw new Error('Cannot fit VR_ATTRACTOR_ROOT within the Astro furnace chamber');
    }
    object.scale.setScalar(presentationScale); object.updateWorldMatrix(true, true);
    visibleChamberSize = boundsRelativeTo(authoritativeVisualRoot, chamber).getSize(new THREE.Vector3());
    object.position.copy(resolveFurnaceContentSnapTarget({ object, visibleRoot: authoritativeVisualRoot,
      anchor: contentAnchor, energyCell, contentClearance: settings.contentClearance ?? .012,
      centerVisibleBounds: true, preserveOrientation: true }));
  }
  function canCreate() { return !disposed && state === 'READY' && canRequest() && getChamberState() === 'CLOSED'
    && processDriver?.canStartConstruction?.(ASTRO_ATTRACTOR_CONSTRUCTION) === true; }
  function requestCreate() { if (!canCreate() || processDriver.startConstruction(ASTRO_ATTRACTOR_CONSTRUCTION) !== true) return false;
    place(); progress = 0; setFormation(0); state = 'BUILDING'; onRequested(); emit(); return true; }
  function clearHits() { hits.forEach((_, record) => hits.set(record, false)); halo.setVisible(false); }
  function updateHits() { let hovered = false; controllers.forEach((record) => { let hit = false;
    if (state === 'AVAILABLE' && getChamberState() === 'OPEN' && record.handedness === 'right'
      && getRightMode() === 'NORMAL_HAND' && record.ray?.visible !== false) {
      record.controller.updateWorldMatrix?.(true, false); record.controller.getWorldPosition(origin); record.controller.getWorldQuaternion(quaternion);
      direction.set(0, 0, -1).applyQuaternion(quaternion).normalize(); raycaster.set(origin, direction);
      raycaster.far = Math.min(settings.rayMaxDistance ?? 2.3, record.currentRayLength ?? settings.rayMaxDistance ?? 2.3);
      const intersection = raycaster.intersectObject(object, true).find(({ object: target }) => !target.userData?.vrTargetHalo);
      if (intersection) { hit = true; hovered = true; record.reportRayHit?.(intersection.distance); }
    } hits.set(record, hit); }); halo.setVisible(hovered); }
  function claim(record) { if (state !== 'AVAILABLE' || getChamberState() !== 'OPEN' || record?.handedness !== 'right'
    || getRightMode() !== 'NORMAL_HAND' || !hits.get(record)) return false;
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
  const listeners = controllers.map((record) => { const listener = () => claim(record); record.controller.addEventListener?.('selectstart', listener); return { record, listener }; });
  function resetSession() { clearHits(); if (state === 'BUILDING') { state = 'READY'; progress = 0; object.visible = false; object.removeFromParent(); }
    else if (state === 'AVAILABLE') { place(); setFormation(1); } else if (state === 'CLAIMING') { state = 'AVAILABLE'; place(); setFormation(1); } emit(); }
  function dispose() { if (disposed) return; disposed = true; listeners.forEach(({ record, listener }) => record.controller.removeEventListener?.('selectstart', listener));
    clearHits(); halo.dispose(); object.removeFromParent(); ownedMaterials.forEach((material) => material.dispose()); subscribers.clear(); }
  return { object, requestCreate, canCreate, claim, update, resetSession, dispose, getState: () => state, getSnapshot: snapshot,
    isEarned: () => state === 'EARNED', hasCurrentHit: (record) => hits.get(record) === true,
    subscribe(listener) { subscribers.add(listener); return () => subscribers.delete(listener); },
    getDiagnostics: () => ({ state, producedCount, claimedCount, visualRootName: authoritativeVisualRoot.name,
      presentationScale, horizontalPresentation: MODEL_AIM_AXIS.clone().applyQuaternion(object.quaternion).distanceTo(XR_AIM_AXIS) < 1e-8,
      parentIsContentAnchor: object.parent === contentAnchor, visibleChamberSize: visibleChamberSize?.toArray() ?? null,
      processKind: processDriver?.getProcessKind?.() ?? null }) };
}
