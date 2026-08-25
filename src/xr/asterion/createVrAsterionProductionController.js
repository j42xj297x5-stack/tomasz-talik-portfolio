import * as THREE from '../../vendor/three.js';
import { createVrTargetHalo } from '../createVrTargetHalo.js';
import { centerPresentationInProductVolume, productBoundsFitVolume, resolveProductVolumeBounds } from '../furnace/vrFurnaceProductVolume.js';

export const VR_ASTERION_PRODUCTION_STATES = Object.freeze({
  LOCKED: 'LOCKED', READY: 'READY', BUILDING: 'BUILDING', AVAILABLE: 'AVAILABLE', EARNED: 'EARNED'
});
const CONSTRUCTION_KIND = 'ASTERION_CONSTRUCTION';
const clamp01 = (value) => THREE.MathUtils.clamp(value, 0, 1);
const PRESENTATION_LEVITATION_AMPLITUDE = 0.02;
const PRESENTATION_LEVITATION_PERIOD = 2.1;
const PRESENTATION_LEVITATION_AXIS = new THREE.Vector3(0, 1, 0);
export const resolveAsterionFormationProgress = (constructionProgress) => clamp01((constructionProgress - 1 / 3) / (1 / 2));

export function createVrAsterionProductionController({
  progressionController, sphere, productVolume, controllers = [], handModeController = null,
  processDriver = null, getChamberState = () => 'CLOSED', getContentState = () => 'EMPTY', settings = {}, haloSettings = {},
  onBuildStart = () => {}, onBuildStop = () => {}, onStateChange = () => {}, onClaimed = () => {}
}) {
  const duration = Math.max(18, settings.buildDurationSeconds ?? 18);
  const rayMaxDistance = Math.max(0.1, settings.rayMaxDistance ?? 2.3);
  const raycaster = new THREE.Raycaster(), origin = new THREE.Vector3(), direction = new THREE.Vector3(), quaternion = new THREE.Quaternion();
  const hits = new Map(controllers.map((record) => [record, false]));
  const subscribers = new Set();
  let state = progressionController?.getAsterionSphereProgress?.().complete ? 'READY' : 'LOCKED';
  let disposed = false, committedBuilds = 0, earnedCommits = 0, modeController = handModeController;
  let constructionProgress = 0, presentationElapsed = 0, presentationTarget = null;
  let presentedProductBounds = null, effectiveLevitationAmplitude = 0;
  if (!productVolume) throw new TypeError('VR_FURNACE_PRODUCT_VOLUME is required');
  const productVolumeBounds = resolveProductVolumeBounds(productVolume);
  const sphereWasVisible = sphere?.object?.visible;
  if (sphere?.object) sphere.object.visible = true;
  const halo = sphere?.object ? createVrTargetHalo({ root: sphere.object, settings: haloSettings }) : null;
  if (sphere?.object) sphere.object.visible = sphereWasVisible;

  function getSnapshot() { const formationProgress = resolveAsterionFormationProgress(constructionProgress); return {
    state, built: ['AVAILABLE', 'EARNED'].includes(state), available: state === 'AVAILABLE', earned: state === 'EARNED',
    buildProgress: state === 'BUILDING' ? constructionProgress : 0, constructionProgress, formationProgress
  }; }
  function emit() { const snapshot = getSnapshot(); subscribers.forEach((listener) => listener(snapshot)); onStateChange(snapshot); }
  function syncGate() { if (state === 'LOCKED' && progressionController?.getAsterionSphereProgress?.().complete === true) { state = 'READY'; emit(); } }
  const unsubscribeProgress = progressionController?.subscribe?.(syncGate) ?? (() => {});
  function canCreate() { return !disposed && state === 'READY' && !sphere?.isPresented?.() && productVolume
    && progressionController?.getAsterionSphereProgress?.().complete === true && getChamberState() === 'CLOSED'
    && getContentState() === 'EMPTY' && processDriver?.canStartConstruction?.() === true; }
  function presentInProductVolume() {
    if (!sphere?.presentAt?.(productVolume, 1, new THREE.Vector3())) return false;
    presentedProductBounds = centerPresentationInProductVolume({ presentationRoot: sphere.socket,
      visibleRoot: sphere.object, productVolume, volumeBounds: productVolumeBounds });
    if (!productBoundsFitVolume(presentedProductBounds, productVolumeBounds)) {
      throw new Error('Asterion presentation at scale 1 does not fit VR_FURNACE_PRODUCT_VOLUME');
    }
    presentationTarget = sphere.socket.position.clone();
    const verticalClearance = Math.min(productVolumeBounds.max.y - presentedProductBounds.max.y,
      presentedProductBounds.min.y - productVolumeBounds.min.y);
    effectiveLevitationAmplitude = Math.min(PRESENTATION_LEVITATION_AMPLITUDE, Math.max(0, verticalClearance));
    presentationElapsed = 0;
    return true;
  }
  function clearPresentation() {
    presentationTarget = null; presentedProductBounds = null; effectiveLevitationAmplitude = 0;
    presentationElapsed = 0; sphere?.clearPresentation?.();
  }
  function requestCreate() {
    syncGate(); if (!canCreate() || processDriver?.startConstruction?.() !== true) return false;
    state = 'BUILDING'; constructionProgress = 0;
    presentInProductVolume(); sphere.setMaterializationProgress?.(0);
    onBuildStart(); emit(); return true;
  }
  function finishBuild() {
    if (disposed || state !== 'BUILDING' || constructionProgress < 1) return false;
    sphere.restorePresentationMaterials?.(); state = 'AVAILABLE'; committedBuilds += 1;
    onBuildStop(false); emit(); return true;
  }
  function clearHits() { hits.forEach((_, record) => hits.set(record, false)); halo?.setVisible(false); }
  function hasNormalHandMode(record) {
    return record?.handedness === 'left' ? modeController?.getLeftMode?.() === 'NORMAL_HAND'
      : record?.handedness === 'right' && modeController?.getRightMode?.() === 'NORMAL_HAND';
  }
  function updateRayHits() {
    let hovered = false; sphere?.object?.updateWorldMatrix?.(true, true);
    controllers.forEach((record) => { let hit = false;
      if (state === 'AVAILABLE' && getChamberState() === 'OPEN' && hasNormalHandMode(record) && record.ray?.visible !== false) {
        record.controller.updateWorldMatrix?.(true, false); record.controller.getWorldPosition(origin); record.controller.getWorldQuaternion(quaternion);
        direction.set(0, 0, -1).applyQuaternion(quaternion).normalize(); raycaster.set(origin, direction);
        raycaster.far = Math.min(rayMaxDistance, record.currentRayLength ?? rayMaxDistance);
        const intersection = raycaster.intersectObject(sphere.object, true).find(({ object }) => !object.userData?.vrTargetHalo);
        if (intersection) { hit = true; hovered = true; record.reportRayHit?.(intersection.distance); }
      } hits.set(record, hit);
    }); halo?.setVisible(hovered);
  }
  function update(delta = 0) {
    if (disposed) return; syncGate(); const step = Math.max(0, Number.isFinite(delta) ? delta : 0);
    if (state === 'BUILDING') {
      if (processDriver?.getProcessKind?.() === CONSTRUCTION_KIND) constructionProgress = clamp01(processDriver.getProgress?.() ?? 0);
      const formation = resolveAsterionFormationProgress(constructionProgress);
      sphere.setMaterializationProgress?.(formation);
      sphere.socket.rotation.y += step * (0.4 - 0.18 * constructionProgress);
      if (constructionProgress >= 1) finishBuild();
    } else if (state === 'AVAILABLE') {
      presentationElapsed += step; sphere.socket.rotation.y += step * .22;
      if (presentationTarget) sphere.socket.position.copy(presentationTarget).addScaledVector(
        PRESENTATION_LEVITATION_AXIS, effectiveLevitationAmplitude * Math.sin(presentationElapsed * Math.PI * 2 / PRESENTATION_LEVITATION_PERIOD));
    }
    updateRayHits(); halo?.update(step);
  }
  function claim(record) { if (disposed || state !== 'AVAILABLE' || getChamberState() !== 'OPEN'
    || !hasNormalHandMode(record) || !hits.get(record)) return false;
    state = 'EARNED'; earnedCommits += 1; clearHits(); sphere.restorePresentationMaterials?.(); clearPresentation(); emit();
    modeController?.equipLeftAsterion?.(); onClaimed(); return true; }
  const listeners = controllers.map((record) => { const listener = () => claim(record); record.controller.addEventListener?.('squeezestart', listener); return { record, listener }; });
  function resetSession() { clearHits(); if (state === 'BUILDING') { sphere.restorePresentationMaterials?.(); clearPresentation(); constructionProgress = 0;
      state = 'READY'; onBuildStop(true); emit(); }
    else if (state === 'AVAILABLE') {
      presentInProductVolume(); sphere.restorePresentationMaterials?.();
    } else clearPresentation(); }
  function resetBaseline() {
    clearHits();
    if (state === 'BUILDING') onBuildStop(true);
    sphere.restorePresentationMaterials?.();
    clearPresentation();
    constructionProgress = 0; presentationElapsed = 0; state = 'LOCKED';
    emit();
  }
  function hydrateScenarioState(value) {
    if (!value || value.state !== 'EARNED') throw new TypeError('asterionProduction state must be EARNED');
    clearHits(); sphere.restorePresentationMaterials?.(); clearPresentation();
    constructionProgress = 1; presentationElapsed = 0; state = 'EARNED'; emit();
  }
  function dispose() { if (disposed) return; disposed = true; if (state === 'BUILDING') onBuildStop(true); unsubscribeProgress();
    listeners.forEach(({ record, listener }) => record.controller.removeEventListener?.('squeezestart', listener)); clearHits(); halo?.dispose(); sphere.restorePresentationMaterials?.(); clearPresentation(); subscribers.clear(); }
  return { canCreate, requestCreate, finishBuild, claim, update, resetSession, resetBaseline, hydrateScenarioState, dispose, getState: () => state, getSnapshot,
    isEarned: () => state === 'EARNED', isAvailable: () => state === 'AVAILABLE', hasCurrentHit: (record) => Boolean(hits.get(record)),
    setHandModeController: (next) => { modeController = next; }, subscribe(listener) { if (disposed || typeof listener !== 'function') return () => {};
      subscribers.add(listener); return () => subscribers.delete(listener); },
    getDiagnostics: () => ({ state, committedBuilds, earnedCommits, duration, constructionProgress, formationProgress: resolveAsterionFormationProgress(constructionProgress),
      parentIsProductVolume: sphere?.socket?.parent === productVolume, productVolumeName: productVolume.name,
      productVolumeBounds: productVolumeBounds ? { min: productVolumeBounds.min.toArray(), max: productVolumeBounds.max.toArray(),
        size: productVolumeBounds.getSize(new THREE.Vector3()).toArray() } : null,
      productCenterInsideVolume: presentedProductBounds
        ? productVolumeBounds.containsPoint(presentedProductBounds.getCenter(new THREE.Vector3())) : null,
      productFitsVolume: presentedProductBounds ? productBoundsFitVolume(presentedProductBounds, productVolumeBounds) : null,
      effectiveLevitationAmplitude, ...sphere?.getDiagnostics?.() }) };
}
