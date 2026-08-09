import * as THREE from '../../vendor/three.js';
import { createVrTargetHalo } from '../createVrTargetHalo.js';
import { isWorldPointInsideChamberCylinder, resolveFurnaceContentSnapTarget } from '../furnace/vrAstroFurnaceChamberCylinder.js';

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
  progressionController, sphere, contentAnchor, chamber = null, chamberCylinder = null, energyCell = null, controllers = [], handModeController = null,
  processDriver = null, getChamberState = () => 'CLOSED', getContentState = () => 'EMPTY', settings = {}, haloSettings = {},
  onBuildStart = () => {}, onBuildStop = () => {}, onStateChange = () => {}
}) {
  const duration = Math.max(18, settings.buildDurationSeconds ?? 18);
  const rayMaxDistance = Math.max(0.1, settings.rayMaxDistance ?? 2.3);
  const raycaster = new THREE.Raycaster(), origin = new THREE.Vector3(), direction = new THREE.Vector3(), quaternion = new THREE.Quaternion();
  const center = new THREE.Vector3(), chamberLocalCenter = new THREE.Vector3();
  const hits = new Map(controllers.map((record) => [record, false]));
  const subscribers = new Set();
  let state = progressionController?.getAsterionSphereProgress?.().complete ? 'READY' : 'LOCKED';
  let disposed = false, committedBuilds = 0, earnedCommits = 0, modeController = handModeController;
  let constructionProgress = 0, presentationElapsed = 0, presentationTarget = null;
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
  function isCenterInsideChamber() {
    if (!sphere?.object || !chamber || !chamberCylinder) return null;
    sphere.object.updateWorldMatrix(true, true); chamber.updateWorldMatrix(true, false);
    new THREE.Box3().setFromObject(sphere.object).getCenter(center);
    return isWorldPointInsideChamberCylinder(center, chamber, chamberCylinder, chamberLocalCenter);
  }
  function canCreate() { return !disposed && state === 'READY' && !sphere?.isPresented?.() && contentAnchor
    && progressionController?.getAsterionSphereProgress?.().complete === true && getChamberState() === 'CLOSED'
    && getContentState() === 'EMPTY' && processDriver?.canStartConstruction?.() === true; }
  // Every furnace-produced object is first parented to VR_FURNACE_CONTENT_ANCHOR and then
  // positioned by the same geometry/energy-cell contract used for inserted content.
  function presentAtFurnaceSnapTarget() {
    if (!sphere?.presentAt?.(contentAnchor, 1, new THREE.Vector3())) return false;
    presentationTarget = resolveFurnaceContentSnapTarget({ object: sphere.socket, visibleRoot: sphere.object,
      anchor: contentAnchor, energyCell, contentClearance: settings.contentClearance ?? .012, centerVisibleBounds: true });
    sphere.socket.position.copy(presentationTarget); presentationElapsed = 0;
    return true;
  }
  function clearPresentation() {
    presentationTarget = null; presentationElapsed = 0; sphere?.clearPresentation?.();
  }
  function requestCreate() {
    syncGate(); if (!canCreate() || processDriver?.startConstruction?.() !== true) return false;
    state = 'BUILDING'; constructionProgress = 0;
    presentAtFurnaceSnapTarget(); sphere.setMaterializationProgress?.(0);
    onBuildStart(); emit(); return true;
  }
  function finishBuild() {
    if (disposed || state !== 'BUILDING' || constructionProgress < 1) return false;
    sphere.restorePresentationMaterials?.(); state = 'AVAILABLE'; committedBuilds += 1;
    onBuildStop(false); emit(); return true;
  }
  function clearHits() { hits.forEach((_, record) => hits.set(record, false)); halo?.setVisible(false); }
  function updateRayHits() {
    let leftHit = false; sphere?.object?.updateWorldMatrix?.(true, true);
    controllers.forEach((record) => { let hit = false;
      if (state === 'AVAILABLE' && getChamberState() === 'OPEN' && record.handedness === 'left'
        && modeController?.getLeftMode?.() === 'NORMAL_HAND' && record.ray?.visible !== false) {
        record.controller.updateWorldMatrix?.(true, false); record.controller.getWorldPosition(origin); record.controller.getWorldQuaternion(quaternion);
        direction.set(0, 0, -1).applyQuaternion(quaternion).normalize(); raycaster.set(origin, direction);
        raycaster.far = Math.min(rayMaxDistance, record.currentRayLength ?? rayMaxDistance);
        const intersection = raycaster.intersectObject(sphere.object, true).find(({ object }) => !object.userData?.vrTargetHalo);
        if (intersection) { hit = true; leftHit = true; record.reportRayHit?.(intersection.distance); }
      } hits.set(record, hit);
    }); halo?.setVisible(leftHit);
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
        PRESENTATION_LEVITATION_AXIS, PRESENTATION_LEVITATION_AMPLITUDE * Math.sin(presentationElapsed * Math.PI * 2 / PRESENTATION_LEVITATION_PERIOD));
    }
    updateRayHits(); halo?.update(step);
  }
  function claim(record) { if (disposed || state !== 'AVAILABLE' || getChamberState() !== 'OPEN' || record?.handedness !== 'left'
    || modeController?.getLeftMode?.() !== 'NORMAL_HAND' || !hits.get(record)) return false;
    state = 'EARNED'; earnedCommits += 1; clearHits(); sphere.restorePresentationMaterials?.(); clearPresentation(); emit();
    modeController?.equipLeftAsterion?.(); return true; }
  const listeners = controllers.map((record) => { const listener = () => claim(record); record.controller.addEventListener?.('squeezestart', listener); return { record, listener }; });
  function resetSession() { clearHits(); if (state === 'BUILDING') { sphere.restorePresentationMaterials?.(); clearPresentation(); constructionProgress = 0;
      state = 'READY'; onBuildStop(true); emit(); }
    else if (state === 'AVAILABLE') {
      presentAtFurnaceSnapTarget(); sphere.restorePresentationMaterials?.();
    } else clearPresentation(); }
  function dispose() { if (disposed) return; disposed = true; if (state === 'BUILDING') onBuildStop(true); unsubscribeProgress();
    listeners.forEach(({ record, listener }) => record.controller.removeEventListener?.('squeezestart', listener)); clearHits(); halo?.dispose(); sphere.restorePresentationMaterials?.(); clearPresentation(); subscribers.clear(); }
  return { canCreate, requestCreate, finishBuild, claim, update, resetSession, dispose, getState: () => state, getSnapshot,
    isEarned: () => state === 'EARNED', isAvailable: () => state === 'AVAILABLE', hasCurrentHit: (record) => Boolean(hits.get(record)),
    setHandModeController: (next) => { modeController = next; }, subscribe(listener) { if (disposed || typeof listener !== 'function') return () => {};
      subscribers.add(listener); return () => subscribers.delete(listener); },
    getDiagnostics: () => ({ state, committedBuilds, earnedCommits, duration, constructionProgress, formationProgress: resolveAsterionFormationProgress(constructionProgress),
      parentIsContentAnchor: sphere?.socket?.parent === contentAnchor, centerInsideChamber: isCenterInsideChamber(), ...sphere?.getDiagnostics?.() }) };
}
