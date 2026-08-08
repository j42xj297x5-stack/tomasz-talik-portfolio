import * as THREE from '../../vendor/three.js';
import { createVrTargetHalo } from '../createVrTargetHalo.js';

export const VR_ASTERION_PRODUCTION_STATES = Object.freeze({
  LOCKED: 'LOCKED', READY: 'READY', BUILDING: 'BUILDING', AVAILABLE: 'AVAILABLE', EARNED: 'EARNED'
});

export function createVrAsterionProductionController({
  progressionController, sphere, essenceAnchor, controllers = [], handModeController = null,
  settings = {}, haloSettings = {}, onBuildStart = () => {}, onBuildStop = () => {}, onStateChange = () => {}
}) {
  const duration = Math.max(0.01, settings.buildDurationSeconds ?? 5);
  const initialScale = Math.min(1, Math.max(0.01, settings.initialScale ?? 0.07));
  const rayMaxDistance = Math.max(0.1, settings.rayMaxDistance ?? 2.3);
  const raycaster = new THREE.Raycaster(), origin = new THREE.Vector3(), direction = new THREE.Vector3(), quaternion = new THREE.Quaternion();
  const hits = new Map(controllers.map((record) => [record, false]));
  const subscribers = new Set();
  let state = progressionController?.getAsterionSphereProgress?.().complete
    ? VR_ASTERION_PRODUCTION_STATES.READY : VR_ASTERION_PRODUCTION_STATES.LOCKED;
  let elapsed = 0, disposed = false, committedBuilds = 0, earnedCommits = 0;
  let modeController = handModeController;
  const sphereWasVisible = sphere?.object?.visible;
  if (sphere?.object) sphere.object.visible = true;
  const halo = sphere?.object ? createVrTargetHalo({ root: sphere.object, settings: haloSettings }) : null;
  if (sphere?.object) sphere.object.visible = sphereWasVisible;

  function emit() { const snapshot = getSnapshot(); subscribers.forEach((listener) => listener(snapshot)); onStateChange(snapshot); }
  function syncGate() {
    const complete = progressionController?.getAsterionSphereProgress?.().complete === true;
    if (state === VR_ASTERION_PRODUCTION_STATES.LOCKED && complete) { state = VR_ASTERION_PRODUCTION_STATES.READY; emit(); }
  }
  const unsubscribeProgress = progressionController?.subscribe?.(syncGate) ?? (() => {});
  function requestCreate() {
    syncGate();
    if (disposed || state !== VR_ASTERION_PRODUCTION_STATES.READY || sphere?.isPresented?.()
      || progressionController?.getAsterionSphereProgress?.().complete !== true || !essenceAnchor) return false;
    state = VR_ASTERION_PRODUCTION_STATES.BUILDING; elapsed = 0;
    sphere.presentAt(essenceAnchor, initialScale); onBuildStart(); emit(); return true;
  }
  function finishBuild() {
    if (disposed || state !== VR_ASTERION_PRODUCTION_STATES.BUILDING) return false;
    elapsed = duration; sphere.setPresentationScale(1); state = VR_ASTERION_PRODUCTION_STATES.AVAILABLE;
    committedBuilds += 1; onBuildStop(false); emit(); return true;
  }
  function clearHits() { hits.forEach((_, record) => hits.set(record, false)); halo?.setVisible(false); }
  function updateRayHits() {
    let leftHit = false;
    sphere?.object?.updateWorldMatrix?.(true, true);
    controllers.forEach((record) => {
      let hit = false;
      if (state === VR_ASTERION_PRODUCTION_STATES.AVAILABLE && record.handedness === 'left'
        && modeController?.getLeftMode?.() === 'NORMAL_HAND' && record.ray?.visible !== false) {
        record.controller.updateWorldMatrix?.(true, false); record.controller.getWorldPosition(origin); record.controller.getWorldQuaternion(quaternion);
        direction.set(0, 0, -1).applyQuaternion(quaternion).normalize(); raycaster.set(origin, direction);
        raycaster.far = Math.min(rayMaxDistance, record.currentRayLength ?? rayMaxDistance);
        const intersection = raycaster.intersectObject(sphere.object, true).find(({ object }) => !object.userData?.vrTargetHalo);
        if (intersection) { hit = true; leftHit = true; record.reportRayHit?.(intersection.distance); }
      }
      hits.set(record, hit);
    });
    halo?.setVisible(leftHit);
  }
  function update(delta = 0) {
    if (disposed) return;
    syncGate();
    const step = Math.max(0, Number.isFinite(delta) ? delta : 0);
    if (state === VR_ASTERION_PRODUCTION_STATES.BUILDING) {
      elapsed = Math.min(duration, elapsed + step);
      const progress = elapsed / duration;
      const eased = progress * progress * (3 - 2 * progress);
      sphere.setPresentationScale(initialScale + (1 - initialScale) * eased);
      sphere.socket.rotation.y += step * (1.8 - 1.2 * progress);
      if (elapsed >= duration) finishBuild();
    } else if (state === VR_ASTERION_PRODUCTION_STATES.AVAILABLE) {
      sphere.socket.rotation.y += step * 0.22;
    }
    updateRayHits(); halo?.update(step);
  }
  function claim(record) {
    if (disposed || state !== VR_ASTERION_PRODUCTION_STATES.AVAILABLE || record?.handedness !== 'left'
      || modeController?.getLeftMode?.() !== 'NORMAL_HAND' || !hits.get(record)) return false;
    state = VR_ASTERION_PRODUCTION_STATES.EARNED; earnedCommits += 1; clearHits(); sphere.clearPresentation(); emit();
    modeController?.equipLeftAsterion?.(); return true;
  }
  const listeners = controllers.map((record) => { const listener = () => claim(record); record.controller.addEventListener?.('squeezestart', listener); return { record, listener }; });
  function resetSession() {
    clearHits();
    if (state === VR_ASTERION_PRODUCTION_STATES.BUILDING) {
      sphere.clearPresentation(); elapsed = 0; state = VR_ASTERION_PRODUCTION_STATES.READY; onBuildStop(true); emit();
    } else if (state === VR_ASTERION_PRODUCTION_STATES.AVAILABLE) sphere.presentAt(essenceAnchor, 1);
    else sphere.clearPresentation();
  }
  function dispose() {
    if (disposed) return; disposed = true;
    if (state === VR_ASTERION_PRODUCTION_STATES.BUILDING) onBuildStop(true);
    unsubscribeProgress(); listeners.forEach(({ record, listener }) => record.controller.removeEventListener?.('squeezestart', listener));
    clearHits(); halo?.dispose(); sphere.clearPresentation(); subscribers.clear();
  }
  function getSnapshot() { return { state, built: [VR_ASTERION_PRODUCTION_STATES.AVAILABLE, VR_ASTERION_PRODUCTION_STATES.EARNED].includes(state), available: state === VR_ASTERION_PRODUCTION_STATES.AVAILABLE, earned: state === VR_ASTERION_PRODUCTION_STATES.EARNED, buildProgress: state === VR_ASTERION_PRODUCTION_STATES.BUILDING ? elapsed / duration : 0 }; }
  return { requestCreate, finishBuild, claim, update, resetSession, dispose, getState: () => state, getSnapshot,
    isEarned: () => state === VR_ASTERION_PRODUCTION_STATES.EARNED, isAvailable: () => state === VR_ASTERION_PRODUCTION_STATES.AVAILABLE,
    hasCurrentHit: (record) => Boolean(hits.get(record)), setHandModeController: (next) => { modeController = next; },
    subscribe(listener) { if (disposed || typeof listener !== 'function') return () => {}; subscribers.add(listener); return () => subscribers.delete(listener); },
    getDiagnostics: () => ({ committedBuilds, earnedCommits, elapsed, duration }) };
}
