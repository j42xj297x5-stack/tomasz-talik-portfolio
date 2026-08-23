import * as THREE from '../../vendor/three.js';
import { createVrTargetHalo } from '../createVrTargetHalo.js';
import { VR_ATTRACTOR_BANDS, VR_RIGHT_HAND_MODES } from '../input/createVrHandModeController.js';
import { createVrAttractorScanCone, selectAttractorConeTarget } from '../tools/createVrAttractorScanCone.js';
import { VR_ATTRACTOR_STATES } from '../tools/createVrAttractorTool.js';

const LOCAL_DIRECTION = new THREE.Vector3(0, 0, -1);
const STATE = Object.freeze({ ORBIT: 'ORBIT', PULLING: 'PULLING', CAPTURED: 'CAPTURED', RETURNING: 'RETURNING' });
const clamp01 = (value) => Math.min(1, Math.max(0, value));

export function createVrLargeGlyphAttractorInteraction({ controllers, largeGlyphActor, handModeController,
  semanticInput, attractorTool, protoAstroTuningController, maxTargetDistance, settings, haloSettings,
  canScanLargeGlyphs = () => false, canTargetLargeGlyphs = () => false, canPullLargeGlyphs = () => false,
  isHigherPriorityInteractionActive = () => false, onPullStart = () => {}, onPullCancel = () => {} }) {
  if (!Array.isArray(controllers)) throw new TypeError('controllers must be an array.');
  if (!Array.isArray(largeGlyphActor?.nodes) || !largeGlyphActor?.beginTransient
    || !largeGlyphActor?.getSlotWorldTransform || !largeGlyphActor?.restoreToSlot) {
    throw new TypeError('largeGlyphActor must expose nodes and transient ownership API.');
  }
  const nodes = largeGlyphActor.nodes;
  if (!Number.isFinite(maxTargetDistance) || maxTargetDistance <= 0) throw new TypeError('maxTargetDistance must be positive.');
  ['scanThreshold', 'triggerThreshold', 'pullAcceleration', 'maxPullSpeed', 'captureRadius', 'returnDuration',
    'minimumClearance'].forEach((key) => { if (!Number.isFinite(settings?.[key]) || settings[key] < 0)
      throw new TypeError(`settings.${key} must be non-negative.`); });
  const scanCone = createVrAttractorScanCone({ parent: null, length: maxTargetDistance, settings: settings.scanCone });
  const states = new Map(nodes.map((node) => [node, STATE.ORBIT]));
  const halos = new Map(nodes.map((node) => [node, createVrTargetHalo({ root: node, settings: haloSettings })]));
  const box = new THREE.Box3(), sphere = new THREE.Sphere(), origin = new THREE.Vector3();
  const direction = new THREE.Vector3(), position = new THREE.Vector3(), anchor = new THREE.Vector3();
  const local = new THREE.Vector3(), quaternion = new THREE.Quaternion();
  const worldScale = new THREE.Vector3(), desiredWorldMatrix = new THREE.Matrix4();
  const inverseParentWorldMatrix = new THREE.Matrix4(), localMatrix = new THREE.Matrix4();
  const candidates = nodes.map((node) => ({ target: node, radius: 0, getWorldCenter(result) {
    box.setFromObject(node).getBoundingSphere(sphere); this.radius = sphere.radius; return result.copy(sphere.center); } }));
  let target = null, active = null, returning = null, pullSpeed = 0, pullStartDistance = 1, disposed = false;
  const rightRecord = () => controllers.find(({ handedness }) => handedness === 'right') ?? null;
  const ownsBand = () => handModeController.getAttractorBand() === VR_ATTRACTOR_BANDS.LARGE_GLYPHS
    && handModeController.getRightMode() === VR_RIGHT_HAND_MODES.ASTRO_ATTRACTOR;
  const legal = (node) => states.get(node) === STATE.ORBIT && node?.visible !== false && node.parent
    && canTargetLargeGlyphs() === true && protoAstroTuningController.canAttractLargeGlyph(node.userData.id) === true;
  function setTarget(next) { if (target === next) return; if (target) halos.get(target)?.setVisible(false);
    target = next; if (target) halos.get(target)?.setVisible(true); }
  function setWorldPosition(node, world) { local.copy(world); node.parent.worldToLocal(local); node.position.copy(local); }
  function updateCaptureAnchor(record, node) { record.controller.getWorldQuaternion(quaternion);
    direction.copy(LOCAL_DIRECTION).applyQuaternion(quaternion).normalize();
    attractorTool.getMasterRingWorldPosition(anchor); box.setFromObject(node).getBoundingSphere(sphere);
    anchor.addScaledVector(direction, sphere.radius + settings.minimumClearance); return anchor; }
  function beginReturn(node) { if (!node || returning?.node === node) return;
    onPullCancel({ target: node }); setTarget(null); states.set(node, STATE.RETURNING);
    returning = { node, startPosition: node.getWorldPosition(new THREE.Vector3()),
      startQuaternion: node.getWorldQuaternion(new THREE.Quaternion()),
      startScale: node.getWorldScale(new THREE.Vector3()), elapsed: 0 };
    active = null; pullSpeed = 0; attractorTool.setTarget(null); attractorTool.setPullStrength(0);
    if (ownsBand()) attractorTool.setState(VR_ATTRACTOR_STATES.IDLE);
  }
  function updateReturn(delta) { if (!returning) return;
    const canonical = largeGlyphActor.getSlotWorldTransform(returning.node);
    returning.elapsed += delta; const progress = settings.returnDuration === 0
      ? 1 : clamp01(returning.elapsed / settings.returnDuration);
    const eased = progress * progress * (3 - 2 * progress);
    position.lerpVectors(returning.startPosition, canonical.position, eased);
    quaternion.slerpQuaternions(returning.startQuaternion, canonical.quaternion, eased);
    worldScale.lerpVectors(returning.startScale, canonical.scale, eased);
    returning.node.parent.updateMatrixWorld(true);
    desiredWorldMatrix.compose(position, quaternion, worldScale);
    inverseParentWorldMatrix.copy(returning.node.parent.matrixWorld).invert();
    localMatrix.multiplyMatrices(inverseParentWorldMatrix, desiredWorldMatrix);
    localMatrix.decompose(returning.node.position, returning.node.quaternion, returning.node.scale);
    if (progress === 1) { const node = returning.node; largeGlyphActor.restoreToSlot(node);
      states.set(node, STATE.ORBIT); returning = null; }
  }
  function update(deltaSeconds = 0) {
    if (disposed) return; const delta = Math.max(0, Number.isFinite(deltaSeconds) ? deltaSeconds : 0); updateReturn(delta);
    const right = rightRecord(); const { primaryAction = 0, grabAction = 0 } = semanticInput.getState();
    const scanning = ownsBand() && canScanLargeGlyphs() === true && grabAction > settings.scanThreshold;
    if (!right?.controller || !right.isConnected || !scanning) { scanCone.update(delta, false); setTarget(null);
      if (active) beginReturn(active); return; }
    if (scanCone.object.parent !== right.controller) right.controller.add(scanCone.object); scanCone.update(delta, true);
    if (active) {
      if (primaryAction <= settings.triggerThreshold || canPullLargeGlyphs() !== true
        || !protoAstroTuningController.canAttractLargeGlyph(active.userData.id) || !ownsBand()) { beginReturn(active); return; }
      updateCaptureAnchor(right, active); active.getWorldPosition(position); const distance = position.distanceTo(anchor);
      if (states.get(active) === STATE.CAPTURED || distance <= settings.captureRadius) {
        states.set(active, STATE.CAPTURED); setWorldPosition(active, anchor);
        halos.get(active)?.update(delta); attractorTool.setPullStrength(1); attractorTool.setState(VR_ATTRACTOR_STATES.CAPTURED); return;
      }
      pullSpeed = Math.min(settings.maxPullSpeed, pullSpeed + settings.pullAcceleration * delta);
      position.add(direction.subVectors(anchor, position).normalize().multiplyScalar(Math.min(distance, pullSpeed * delta)));
      setWorldPosition(active, position);
      halos.get(active)?.update(delta); attractorTool.setPullStrength(clamp01(1 - distance / pullStartDistance));
      attractorTool.setState(VR_ATTRACTOR_STATES.PULLING); return;
    }
    if (isHigherPriorityInteractionActive(right) === true || canTargetLargeGlyphs() !== true) { setTarget(null);
      attractorTool.setTarget(null); attractorTool.setPullStrength(0); attractorTool.setState(VR_ATTRACTOR_STATES.IDLE); return; }
    right.controller.getWorldPosition(origin); right.controller.getWorldQuaternion(quaternion);
    direction.copy(LOCAL_DIRECTION).applyQuaternion(quaternion).normalize();
    const hit = selectAttractorConeTarget({ candidates: candidates.filter(({ target: node }) => legal(node)), origin,
      direction, maxDistance: maxTargetDistance, halfAngleRadians: scanCone.halfAngleRadians });
    setTarget(hit?.target ?? null); attractorTool.setTarget(hit ? { target, distance: hit.distance,
      proximity: clamp01(1 - hit.distance / maxTargetDistance) } : null); attractorTool.setPullStrength(0);
    attractorTool.setState(hit ? VR_ATTRACTOR_STATES.TARGETING : VR_ATTRACTOR_STATES.IDLE);
    if (target) halos.get(target)?.update(delta);
    if (target && primaryAction > settings.triggerThreshold && canPullLargeGlyphs() === true) {
      active = target; setTarget(null); largeGlyphActor.beginTransient(active);
      states.set(active, STATE.PULLING); active.getWorldPosition(position); updateCaptureAnchor(right, active);
      pullStartDistance = Math.max(position.distanceTo(anchor), 1e-6); pullSpeed = 0;
      attractorTool.setState(VR_ATTRACTOR_STATES.PULLING); onPullStart({ target: active, targetClass: 'largeGlyph' });
    }
  }
  function reset() { const leased = active ?? returning?.node; if (leased) { onPullCancel({ target: leased }); largeGlyphActor.restoreToSlot(leased);
      states.set(leased, STATE.ORBIT); } active = null; returning = null; pullSpeed = 0; setTarget(null);
    scanCone.update(0, false); halos.forEach((halo) => halo.setVisible(false)); attractorTool.setTarget(null);
    attractorTool.setPullStrength(0); }
  function dispose() { if (disposed) return; reset(); scanCone.dispose(); halos.forEach((halo) => halo.dispose()); halos.clear(); disposed = true; }
  return { scanCone, update, reset, dispose, getTarget: () => target };
}
