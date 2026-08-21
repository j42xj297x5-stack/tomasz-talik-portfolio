import * as THREE from '../../vendor/three.js';
import { createVrTargetHalo } from '../createVrTargetHalo.js';
import { VR_ATTRACTOR_BANDS, VR_LEFT_HAND_MODES, VR_RIGHT_HAND_MODES } from '../input/createVrHandModeController.js';
import { calculateAttractorCapturePosition, createVrAttractorScanCone,
  selectAttractorConeTarget } from '../tools/createVrAttractorScanCone.js';
import { VR_ATTRACTOR_STATES } from '../tools/createVrAttractorTool.js';

const LOCAL_DIRECTION = new THREE.Vector3(0, 0, -1);
const INTERACTION_STATE = Object.freeze({ FIELD: 'FIELD', PULLING: 'PULLING',
  CAPTURE_READY: 'CAPTURE_READY', HELD: 'HELD', RETURNING: 'RETURNING' });
const clamp01 = (value) => Math.min(1, Math.max(0, value));

export function createVrSmallGlyphAttractorInteraction({ controllers, smallGlyphSystem, handModeController,
  semanticInput, attractorTool, maxTargetDistance, settings, haloSettings, settledParent,
  canScanSmallGlyphs = () => false, canTargetSmallGlyphs = () => false, canPullSmallGlyphs = () => false,
  isHigherPriorityInteractionActive = () => false,
  isControllerOccupiedByOtherInteraction = () => false }) {
  if (!Array.isArray(controllers)) throw new TypeError('controllers must be an array.');
  if (!smallGlyphSystem?.object?.isObject3D || typeof smallGlyphSystem.object.add !== 'function'
    || typeof smallGlyphSystem.getInstances !== 'function' || typeof smallGlyphSystem.getState !== 'function'
    || typeof smallGlyphSystem.getFieldTransform !== 'function'
    || typeof smallGlyphSystem.restoreInstanceToField !== 'function') {
    throw new TypeError('smallGlyphSystem must expose its Object3D and field transform API.');
  }
  if (typeof handModeController?.getRightMode !== 'function' || typeof handModeController?.getLeftMode !== 'function'
    || typeof handModeController?.getAttractorBand !== 'function') throw new TypeError('Invalid handModeController.');
  if (typeof semanticInput?.getState !== 'function') throw new TypeError('semanticInput.getState must be a function.');
  if (typeof attractorTool?.setTarget !== 'function' || typeof attractorTool?.setPullStrength !== 'function'
    || typeof attractorTool?.setState !== 'function' || typeof attractorTool?.getMasterRingWorldPosition !== 'function') {
    throw new TypeError('Invalid attractorTool interaction API.');
  }
  if (!settledParent?.isObject3D || typeof settledParent.add !== 'function') throw new TypeError('settledParent must be an Object3D.');
  if (!Number.isFinite(maxTargetDistance) || maxTargetDistance <= 0) throw new TypeError('maxTargetDistance must be positive.');
  const ranged = [['scanThreshold', 0, 1], ['triggerThreshold', 0, 1]];
  ranged.forEach(([key, min, max]) => { if (!Number.isFinite(settings?.[key]) || settings[key] < min || settings[key] > max)
    throw new TypeError(`settings.${key} must be finite and between ${min} and ${max}.`); });
  ['captureForwardDistance', 'pullAcceleration', 'maxPullSpeed', 'captureRadius', 'returnDuration'].forEach((key) => {
    if (!Number.isFinite(settings?.[key]) || settings[key] <= 0) throw new TypeError(`settings.${key} must be positive.`);
  });
  if (!settings?.scanCone || typeof settings.scanCone !== 'object') throw new TypeError('settings.scanCone must be an object.');
  [canScanSmallGlyphs, canTargetSmallGlyphs, canPullSmallGlyphs, isHigherPriorityInteractionActive,
    isControllerOccupiedByOtherInteraction].forEach((dependency) => { if (typeof dependency !== 'function')
    throw new TypeError('Small glyph interaction dependencies must be functions.'); });

  const instances = smallGlyphSystem.getInstances();
  if (!Array.isArray(instances) || instances.some((instance) => !instance?.isObject3D))
    throw new TypeError('smallGlyphSystem.getInstances() must return Three.js objects.');
  const states = new Map(instances.map((instance) => [instance, INTERACTION_STATE.FIELD]));
  const scanCone = createVrAttractorScanCone({ parent: null, length: maxTargetDistance, settings: settings.scanCone });
  const captureAnchor = new THREE.Object3D(); captureAnchor.name = 'VrSmallGlyphAttractorCaptureAnchor'; settledParent.add(captureAnchor);
  const halos = new Map();
  const origin = new THREE.Vector3(), direction = new THREE.Vector3(), worldPosition = new THREE.Vector3();
  const anchorWorld = new THREE.Vector3(), movement = new THREE.Vector3(), localPosition = new THREE.Vector3();
  const quaternion = new THREE.Quaternion(), box = new THREE.Box3(), sphere = new THREE.Sphere();
  const raycaster = new THREE.Raycaster();
  const candidates = instances.map((instance) => ({ target: instance, radius: 0, getWorldCenter(result) {
    box.setFromObject(instance).getBoundingSphere(sphere); this.radius = sphere.radius; return result.copy(sphere.center); } }));
  let target = null, activePull = null, captureReady = null, heldGlyph = null, heldByRecord = null;
  let returning = null, leftRayTarget = null, pullSpeed = 0, pullStartDistance = 1, disposed = false;
  const getRightRecord = () => controllers.find(({ handedness }) => handedness === 'right') ?? null;
  const getLeftRecord = () => controllers.find(({ handedness }) => handedness === 'left') ?? null;
  const ownsBand = () => handModeController.getAttractorBand() === VR_ATTRACTOR_BANDS.SMALL_GLYPHS;
  const isEquipped = () => handModeController.getRightMode() === VR_RIGHT_HAND_MODES.ASTRO_ATTRACTOR;
  const ownsEquippedBand = () => ownsBand() && isEquipped();
  function ensureHalos() { instances.forEach((instance) => { if (!halos.has(instance))
    halos.set(instance, createVrTargetHalo({ root: instance, settings: haloSettings })); }); }
  function isFieldCandidate(instance) { if (states.get(instance) !== INTERACTION_STATE.FIELD
    || instance.userData.smallGlyphState !== 'FIELD' || !instance.parent) return false;
    let belongsToField = false;
    for (let current = instance; current; current = current.parent) {
      if (current.visible === false) return false;
      if (current === smallGlyphSystem.object) belongsToField = true;
    }
    return belongsToField; }
  function setTarget(next) { if (target === next) return; if (target) halos.get(target)?.setVisible(false);
    target = next; if (target) halos.get(target)?.setVisible(true); }
  function setWorldPosition(object, position) { localPosition.copy(position); object.parent.worldToLocal(localPosition); object.position.copy(localPosition); }
  function clearLeftSmallGlyphHit() { const record = getLeftRecord(); if (record) {
    record.currentSmallGlyphHit = null; record.currentSmallGlyphHitDistance = null; }
    leftRayTarget = null; }
  function hasCurrentSmallGlyphHit(record) { return Boolean(captureReady && record?.currentSmallGlyphHit === captureReady
    && Number.isFinite(record.currentSmallGlyphHitDistance) && record.currentSmallGlyphHitDistance <= record.currentRayLength); }
  function leftHandIsFree(record = getLeftRecord()) { return Boolean(record?.isConnected
    && handModeController.getLeftMode() === VR_LEFT_HAND_MODES.NORMAL_HAND && !heldGlyph
    && isControllerOccupiedByOtherInteraction(record) !== true); }
  function updateCaptureAnchor(rightRecord) { rightRecord.controller.getWorldQuaternion(quaternion);
    direction.copy(LOCAL_DIRECTION).applyQuaternion(quaternion).normalize();
    attractorTool.getMasterRingWorldPosition(anchorWorld);
    calculateAttractorCapturePosition({ masterRingWorldPosition: anchorWorld, controllerRayDirection: direction,
      captureForwardDistance: settings.captureForwardDistance, target: anchorWorld });
    setWorldPosition(captureAnchor, anchorWorld); }
  function beginReturn(glyph) { if (!glyph || returning?.glyph === glyph) return;
    const fieldTransform = smallGlyphSystem.getFieldTransform(glyph);
    if (!fieldTransform) throw new Error('Small glyph interaction cannot return an unknown field instance.');
    clearLeftSmallGlyphHit(); halos.get(glyph)?.setVisible(false); smallGlyphSystem.object.attach(glyph);
    returning = { glyph, fieldTransform, startPosition: glyph.position.clone(),
      startQuaternion: glyph.quaternion.clone(), startScale: glyph.scale.clone(), elapsed: 0 };
    states.set(glyph, INTERACTION_STATE.RETURNING);
    if (activePull === glyph) activePull = null; if (captureReady === glyph) captureReady = null;
    if (heldGlyph === glyph) { heldGlyph = null; heldByRecord = null; }
    if (target === glyph) target = null; pullSpeed = 0;
    if (ownsEquippedBand()) { attractorTool.setTarget(null); attractorTool.setPullStrength(0);
      attractorTool.setState(VR_ATTRACTOR_STATES.IDLE); }
  }
  function updateReturn(delta) { if (!returning) return; const record = returning; record.elapsed += delta;
    const progress = clamp01(record.elapsed / settings.returnDuration), eased = progress * progress * (3 - 2 * progress);
    record.glyph.position.lerpVectors(record.startPosition, record.fieldTransform.position, eased);
    record.glyph.quaternion.slerpQuaternions(record.startQuaternion, record.fieldTransform.quaternion, eased);
    record.glyph.scale.lerpVectors(record.startScale, record.fieldTransform.scale, eased);
    if (progress !== 1) return; if (!smallGlyphSystem.restoreInstanceToField(record.glyph))
      throw new Error('Small glyph system rejected restoration of its field instance.');
    states.set(record.glyph, INTERACTION_STATE.FIELD); returning = null; }
  function updateLeftHit(record = getLeftRecord()) { clearLeftSmallGlyphHit();
    if (!captureReady || !record?.controller || !record.isConnected
      || handModeController.getLeftMode() !== VR_LEFT_HAND_MODES.NORMAL_HAND
      || !Number.isFinite(record.currentRayLength) || isHigherPriorityInteractionActive(record) === true) return;
    record.controller.getWorldPosition(origin); record.controller.getWorldQuaternion(quaternion);
    direction.copy(LOCAL_DIRECTION).applyQuaternion(quaternion).normalize(); raycaster.set(origin, direction);
    raycaster.near = 0; raycaster.far = record.currentRayLength;
    const hit = raycaster.intersectObject(captureReady, true).find(({ object }) => object.visible !== false);
    if (!hit) return; record.currentSmallGlyphHit = captureReady; record.currentSmallGlyphHitDistance = hit.distance;
    record.reportRayHit?.(hit.distance); leftRayTarget = captureReady; }
  function handoff(record = getLeftRecord()) { if (!captureReady || states.get(captureReady) !== INTERACTION_STATE.CAPTURE_READY
    || !hasCurrentSmallGlyphHit(record) || !leftHandIsFree(record)) return false;
    const glyph = captureReady; record.holdSocket.attach(glyph); heldGlyph = glyph; heldByRecord = record;
    states.set(glyph, INTERACTION_STATE.HELD); captureReady = null; activePull = null; setTarget(null);
    clearLeftSmallGlyphHit(); halos.get(glyph)?.setVisible(false);
    if (ownsEquippedBand()) { attractorTool.setTarget(null); attractorTool.setPullStrength(0);
      attractorTool.setState(VR_ATTRACTOR_STATES.IDLE); } return true; }
  function transferHeldGlyph(glyph) {
    if (!glyph || glyph !== heldGlyph) return false;
    heldGlyph = null; heldByRecord = null; clearLeftSmallGlyphHit();
    if (target === glyph) setTarget(null);
    states.set(glyph, INTERACTION_STATE.FIELD);
    if (ownsEquippedBand()) { attractorTool.setTarget(null); attractorTool.setPullStrength(0);
      attractorTool.setState(VR_ATTRACTOR_STATES.IDLE); }
    return true;
  }
  const squeezeListeners = controllers.filter(({ handedness }) => handedness === 'left').map((record) => {
    const onSqueezeStart = () => handoff(record); const onSqueezeEnd = () => {
      if (heldByRecord === record && heldGlyph) beginReturn(heldGlyph); };
    record.controller.addEventListener('squeezestart', onSqueezeStart); record.controller.addEventListener('squeezeend', onSqueezeEnd);
    return { record, onSqueezeStart, onSqueezeEnd }; });
  function update(deltaSeconds = 0) { if (disposed) return; const delta = Math.max(0, Number.isFinite(deltaSeconds) ? deltaSeconds : 0);
    updateReturn(delta); if (heldGlyph && canPullSmallGlyphs() !== true) beginReturn(heldGlyph);
    const right = getRightRecord(); if (!ownsEquippedBand()) { scanCone.update(delta, false); setTarget(null);
      clearLeftSmallGlyphHit(); if (activePull || captureReady) beginReturn(activePull || captureReady); return; }
    if (!right?.controller || !right.isConnected) { scanCone.update(delta, false); setTarget(null);
      if (activePull || captureReady) beginReturn(activePull || captureReady); else { attractorTool.setTarget(null); attractorTool.setPullStrength(0); attractorTool.setState(VR_ATTRACTOR_STATES.IDLE); } return; }
    if (scanCone.object.parent !== right.controller) right.controller.add(scanCone.object); updateCaptureAnchor(right);
    if (smallGlyphSystem.getState() === 'MATERIALIZED') ensureHalos();
    const { primaryAction = 0, grabAction = 0 } = semanticInput.getState();
    const scanning = smallGlyphSystem.getState() === 'MATERIALIZED' && isEquipped() && canScanSmallGlyphs() === true
      && grabAction > settings.scanThreshold; scanCone.update(delta, scanning);
    if (activePull) { if (!scanning || primaryAction <= settings.triggerThreshold || canPullSmallGlyphs() !== true) {
      beginReturn(activePull); return; }
      if (captureReady) { setWorldPosition(captureReady, anchorWorld); updateLeftHit(); halos.get(captureReady)?.update(delta);
        attractorTool.setPullStrength(1); attractorTool.setState(VR_ATTRACTOR_STATES.CAPTURED); return; }
      captureAnchor.getWorldPosition(anchorWorld); activePull.getWorldPosition(worldPosition);
      const distance = worldPosition.distanceTo(anchorWorld); if (distance <= settings.captureRadius) {
        captureAnchor.attach(activePull); states.set(activePull, INTERACTION_STATE.CAPTURE_READY); captureReady = activePull;
        attractorTool.setPullStrength(1); attractorTool.setState(VR_ATTRACTOR_STATES.CAPTURED); return; }
      pullSpeed = Math.min(settings.maxPullSpeed, pullSpeed + settings.pullAcceleration * delta);
      movement.subVectors(anchorWorld, worldPosition).normalize().multiplyScalar(Math.min(distance, pullSpeed * delta));
      setWorldPosition(activePull, worldPosition.add(movement)); const progress = clamp01(1 - distance / pullStartDistance);
      halos.get(activePull)?.update(delta); attractorTool.setPullStrength(progress); attractorTool.setState(VR_ATTRACTOR_STATES.PULLING); return; }
    clearLeftSmallGlyphHit(); if (!scanning || isHigherPriorityInteractionActive(right) === true || canTargetSmallGlyphs() !== true) {
      setTarget(null); attractorTool.setTarget(null); attractorTool.setPullStrength(0); attractorTool.setState(VR_ATTRACTOR_STATES.IDLE); return; }
    right.controller.getWorldPosition(origin); right.controller.getWorldQuaternion(quaternion);
    direction.copy(LOCAL_DIRECTION).applyQuaternion(quaternion).normalize();
    const hit = selectAttractorConeTarget({ candidates: candidates.filter(({ target: candidate }) => isFieldCandidate(candidate)),
      origin, direction, maxDistance: maxTargetDistance, halfAngleRadians: scanCone.halfAngleRadians });
    setTarget(hit?.target ?? null); if (!hit) { attractorTool.setTarget(null); attractorTool.setPullStrength(0);
      attractorTool.setState(VR_ATTRACTOR_STATES.IDLE); return; }
    halos.get(target)?.update(delta); attractorTool.setTarget({ target, distance: hit.distance,
      proximity: clamp01(1 - hit.distance / maxTargetDistance) }); attractorTool.setPullStrength(0);
    attractorTool.setState(VR_ATTRACTOR_STATES.TARGETING);
    if (!returning && primaryAction > settings.triggerThreshold && canPullSmallGlyphs() === true && leftHandIsFree()) {
      activePull = target; states.set(activePull, INTERACTION_STATE.PULLING); pullSpeed = 0;
      activePull.getWorldPosition(worldPosition); captureAnchor.getWorldPosition(anchorWorld);
      pullStartDistance = Math.max(worldPosition.distanceTo(anchorWorld), 1e-6);
      attractorTool.setPullStrength(0); attractorTool.setState(VR_ATTRACTOR_STATES.PULLING); }
  }
  function restoreTransientGlyphs() { const transient = new Set([activePull, captureReady, heldGlyph, returning?.glyph].filter(Boolean));
    transient.forEach((glyph) => { if (!smallGlyphSystem.restoreInstanceToField(glyph))
      throw new Error('Small glyph system rejected transient glyph restoration.'); states.set(glyph, INTERACTION_STATE.FIELD); }); }
  function reset() { restoreTransientGlyphs(); scanCone.update(0, false); setTarget(null); activePull = null; captureReady = null;
    heldGlyph = null; heldByRecord = null; returning = null; pullSpeed = 0; clearLeftSmallGlyphHit();
    halos.forEach((halo) => halo.setVisible(false)); if (ownsEquippedBand()) { attractorTool.setTarget(null); attractorTool.setPullStrength(0);
      attractorTool.setState(VR_ATTRACTOR_STATES.IDLE); } }
  function dispose() { if (disposed) return; reset(); squeezeListeners.forEach(({ record, onSqueezeStart, onSqueezeEnd }) => {
    record.controller.removeEventListener('squeezestart', onSqueezeStart); record.controller.removeEventListener('squeezeend', onSqueezeEnd); });
    clearLeftSmallGlyphHit(); scanCone.dispose(); halos.forEach((halo) => halo.dispose()); halos.clear();
    captureAnchor.removeFromParent(); disposed = true; }
  return { captureAnchor, scanCone, update, reset, dispose, hasCurrentSmallGlyphHit, transferHeldGlyph,
    isHeldBy: (record) => heldByRecord === record, getTarget: () => target, get heldGlyph() { return heldGlyph; } };
}
