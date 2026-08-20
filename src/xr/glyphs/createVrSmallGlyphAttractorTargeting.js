import * as THREE from '../../vendor/three.js';
import { createVrTargetHalo } from '../createVrTargetHalo.js';
import { VR_ATTRACTOR_BANDS, VR_RIGHT_HAND_MODES } from '../input/createVrHandModeController.js';
import { createVrAttractorScanCone, selectAttractorConeTarget } from '../tools/createVrAttractorScanCone.js';
import { VR_ATTRACTOR_STATES } from '../tools/createVrAttractorTool.js';

const LOCAL_DIRECTION = new THREE.Vector3(0, 0, -1);
const clamp01 = (value) => Math.min(1, Math.max(0, value));

export function createVrSmallGlyphAttractorTargeting({
  controllers,
  smallGlyphSystem,
  handModeController,
  semanticInput,
  attractorTool,
  maxTargetDistance,
  scanThreshold,
  scanConeSettings,
  haloSettings,
  canScanSmallGlyphs = () => false,
  canTargetSmallGlyphs = () => false,
  isHigherPriorityInteractionActive = () => false
}) {
  if (!Array.isArray(controllers)) throw new TypeError('controllers must be an array.');
  if (typeof smallGlyphSystem?.getInstances !== 'function'
    || typeof smallGlyphSystem?.getState !== 'function') {
    throw new TypeError('smallGlyphSystem must expose getInstances and getState functions.');
  }
  if (typeof handModeController?.getRightMode !== 'function'
    || typeof handModeController?.getAttractorBand !== 'function') {
    throw new TypeError('handModeController must expose getRightMode and getAttractorBand functions.');
  }
  if (typeof semanticInput?.getState !== 'function') throw new TypeError('semanticInput.getState must be a function.');
  if (typeof attractorTool?.setTarget !== 'function' || typeof attractorTool?.setPullStrength !== 'function'
    || typeof attractorTool?.setState !== 'function') {
    throw new TypeError('attractorTool must expose setTarget, setPullStrength and setState functions.');
  }
  if (!Number.isFinite(maxTargetDistance) || maxTargetDistance <= 0) {
    throw new TypeError('maxTargetDistance must be finite and greater than 0.');
  }
  if (!Number.isFinite(scanThreshold) || scanThreshold < 0 || scanThreshold > 1) {
    throw new TypeError('scanThreshold must be finite and between 0 and 1.');
  }
  if (!scanConeSettings || typeof scanConeSettings !== 'object') {
    throw new TypeError('scanConeSettings must be an object.');
  }
  if (typeof canScanSmallGlyphs !== 'function' || typeof canTargetSmallGlyphs !== 'function'
    || typeof isHigherPriorityInteractionActive !== 'function') {
    throw new TypeError('Small glyph targeting permission dependencies must be functions.');
  }

  const instances = smallGlyphSystem.getInstances();
  if (!Array.isArray(instances) || instances.some((instance) => !instance?.isObject3D)) {
    throw new TypeError('smallGlyphSystem.getInstances() must return Three.js objects.');
  }
  const scanCone = createVrAttractorScanCone({ parent: null, length: maxTargetDistance, settings: scanConeSettings });
  const halos = new Map();
  const origin = new THREE.Vector3();
  const direction = new THREE.Vector3();
  const quaternion = new THREE.Quaternion();
  const box = new THREE.Box3();
  const sphere = new THREE.Sphere();
  const candidates = instances.map((instance) => ({
    target: instance,
    radius: 0,
    getWorldCenter(result) {
      box.setFromObject(instance).getBoundingSphere(sphere);
      this.radius = sphere.radius;
      return result.copy(sphere.center);
    }
  }));
  let target = null;
  let disposed = false;

  const getRightRecord = () => controllers.find((record) => record.handedness === 'right') ?? null;
  const ownsBand = () => handModeController.getAttractorBand() === VR_ATTRACTOR_BANDS.SMALL_GLYPHS;
  function ensureHalos() {
    instances.forEach((instance) => {
      if (!halos.has(instance)) halos.set(instance, createVrTargetHalo({ root: instance, settings: haloSettings }));
    });
  }
  function isVisibleInField(instance) {
    if (instance.userData.smallGlyphState !== 'FIELD' || !instance.parent) return false;
    for (let current = instance; current; current = current.parent) {
      if (current.visible === false) return false;
    }
    return true;
  }
  function setTarget(nextTarget) {
    if (target === nextTarget) return;
    if (target) halos.get(target)?.setVisible(false);
    target = nextTarget;
    if (target) halos.get(target)?.setVisible(true);
  }
  function clearLocalState() {
    scanCone.update(0, false);
    setTarget(null);
    halos.forEach((halo) => halo.setVisible(false));
  }
  function clearOwnedTool() {
    attractorTool.setTarget(null);
    attractorTool.setPullStrength(0);
    attractorTool.setState(VR_ATTRACTOR_STATES.IDLE);
  }

  function update(deltaSeconds = 0) {
    if (disposed) return;
    const delta = Math.max(0, Number.isFinite(deltaSeconds) ? deltaSeconds : 0);
    if (!ownsBand()) {
      clearLocalState();
      return;
    }
    const rightRecord = getRightRecord();
    if (rightRecord?.controller && scanCone.object.parent !== rightRecord.controller) {
      rightRecord.controller.add(scanCone.object);
    }
    const scanning = smallGlyphSystem.getState() === 'MATERIALIZED'
      && handModeController.getRightMode() === VR_RIGHT_HAND_MODES.ASTRO_ATTRACTOR
      && canScanSmallGlyphs() === true
      && rightRecord?.isConnected === true
      && (semanticInput.getState().grabAction ?? 0) > scanThreshold;
    if (smallGlyphSystem.getState() === 'MATERIALIZED') ensureHalos();
    scanCone.update(delta, scanning);
    if (!scanning || isHigherPriorityInteractionActive(rightRecord)) {
      setTarget(null);
      clearOwnedTool();
      return;
    }
    if (canTargetSmallGlyphs() !== true) {
      setTarget(null);
      clearOwnedTool();
      return;
    }
    rightRecord.controller.getWorldPosition(origin);
    rightRecord.controller.getWorldQuaternion(quaternion);
    direction.copy(LOCAL_DIRECTION).applyQuaternion(quaternion).normalize();
    const hit = selectAttractorConeTarget({
      candidates: candidates.filter(({ target: candidate }) => isVisibleInField(candidate)),
      origin,
      direction,
      maxDistance: maxTargetDistance,
      halfAngleRadians: scanCone.halfAngleRadians
    });
    setTarget(hit?.target ?? null);
    if (!hit) {
      clearOwnedTool();
      return;
    }
    halos.get(target)?.update(delta);
    attractorTool.setTarget({ target, distance: hit.distance,
      proximity: clamp01(1 - hit.distance / maxTargetDistance) });
    attractorTool.setPullStrength(0);
    attractorTool.setState(VR_ATTRACTOR_STATES.TARGETING);
  }

  function reset() {
    clearLocalState();
  }
  function dispose() {
    if (disposed) return;
    reset();
    disposed = true;
    scanCone.dispose();
    halos.forEach((halo) => halo.dispose());
    halos.clear();
  }

  return { update, reset, dispose, getTarget: () => target, scanCone };
}
