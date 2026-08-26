import * as THREE from '../../vendor/three.js';
import { VR_RUNE_BRIDGE_STATES } from './createVrRuneBridgeActor.js';
import { VR_RUNE_STONE_STATE } from './createVrRuneStoneActor.js';

const smoothstep = (value) => value * value * (3 - 2 * value);

export function createVrRuneStoneInstallationInteraction({
  runeStoneActor,
  runeBridgeActor,
  runeInstallationReadinessProjection,
  runeStoneProgressionController,
  settings
}) {
  if (!runeStoneActor?.beginSocketCapture || !runeStoneActor?.completeInstallation) {
    throw new TypeError('[VrRuneStoneInstallationInteraction] RuneStoneActor commands are required.');
  }
  if (!runeBridgeActor?.getStoneCapture || !runeBridgeActor?.getStoneAnchor) {
    throw new TypeError('[VrRuneStoneInstallationInteraction] RuneBridgeActor geometry is required.');
  }
  if (!runeInstallationReadinessProjection?.isInstallationReady) {
    throw new TypeError('[VrRuneStoneInstallationInteraction] Installation readiness is required.');
  }
  if (!runeStoneProgressionController?.commitInstalledFamily) {
    throw new TypeError('[VrRuneStoneInstallationInteraction] Rune progression truth is required.');
  }
  const duration = settings?.socketCaptureDurationSeconds;
  if (!Number.isFinite(duration) || duration <= 0) {
    throw new TypeError('settings.socketCaptureDurationSeconds must be finite and positive.');
  }

  const stonePosition = new THREE.Vector3();
  const capturePosition = new THREE.Vector3();
  const targetPosition = new THREE.Vector3();
  const targetQuaternion = new THREE.Quaternion();
  const localPosition = new THREE.Vector3();
  const localQuaternion = new THREE.Quaternion();
  let active = null;
  let disposed = false;

  function applyWorldTransform(root, position, quaternion) {
    root.parent.updateWorldMatrix(true, false);
    const parentQuaternion = root.parent.getWorldQuaternion(localQuaternion).invert();
    localPosition.copy(position);
    root.parent.worldToLocal(localPosition);
    root.position.copy(localPosition);
    root.quaternion.copy(parentQuaternion.multiply(quaternion));
  }

  function tryBeginCapture(record) {
    if (disposed || active || record?.descriptor?.natural !== true) return false;
    const { branchId, familyCode, root } = record;
    if (runeStoneActor.getState(branchId) !== VR_RUNE_STONE_STATE.CARRIED_ORBIT
      || !runeStoneProgressionController.isFamilyTuned(familyCode)
      || runeStoneProgressionController.isFamilyInstalled(familyCode)
      || runeInstallationReadinessProjection.isInstallationReady(branchId) !== true) return false;

    const bridgeState = runeBridgeActor.getState(branchId);
    if (bridgeState !== VR_RUNE_BRIDGE_STATES.DOCKED) return false;
    const capture = runeBridgeActor.getStoneCapture(branchId);
    const anchor = runeBridgeActor.getStoneAnchor(branchId);
    if (!capture?.node || !Number.isFinite(capture.radius) || capture.radius <= 0 || !anchor) return false;
    root.updateWorldMatrix(true, false);
    capture.node.updateWorldMatrix(true, false);
    root.getWorldPosition(stonePosition);
    capture.node.getWorldPosition(capturePosition);
    if (stonePosition.distanceTo(capturePosition) > capture.radius) return false;

    let extensionStarted = false;
    try {
      runeBridgeActor.beginExtension(branchId);
      extensionStarted = true;
      if (!runeStoneActor.beginSocketCapture(branchId)) {
        runeBridgeActor.cancelExtension(branchId);
        return false;
      }
    } catch (error) {
      if (extensionStarted && runeStoneActor.getState(branchId) !== VR_RUNE_STONE_STATE.SOCKET_CAPTURE) {
        runeBridgeActor.cancelExtension(branchId);
      }
      throw error;
    }

    anchor.updateWorldMatrix(true, false);
    active = {
      record, anchor, elapsed: 0,
      startPosition: root.getWorldPosition(new THREE.Vector3()),
      startQuaternion: root.getWorldQuaternion(new THREE.Quaternion()),
      startScale: root.getWorldScale(new THREE.Vector3()),
      targetPosition: anchor.getWorldPosition(new THREE.Vector3()),
      targetQuaternion: anchor.getWorldQuaternion(new THREE.Quaternion())
    };
    return true;
  }

  function update(deltaSeconds = 0) {
    if (disposed || !active) return;
    active.elapsed = Math.min(duration, active.elapsed
      + Math.max(0, Number.isFinite(deltaSeconds) ? deltaSeconds : 0));
    const t = smoothstep(active.elapsed / duration);
    targetPosition.lerpVectors(active.startPosition, active.targetPosition, t);
    targetQuaternion.copy(active.startQuaternion).slerp(active.targetQuaternion, t);
    applyWorldTransform(active.record.root, targetPosition, targetQuaternion);
    if (active.elapsed < duration) return;

    const { record, anchor } = active;
    anchor.updateWorldMatrix(true, false);
    const finalPosition = anchor.getWorldPosition(new THREE.Vector3());
    const finalQuaternion = anchor.getWorldQuaternion(new THREE.Quaternion());
    applyWorldTransform(record.root, finalPosition, finalQuaternion);
    if (runeBridgeActor.getState(record.branchId) !== VR_RUNE_BRIDGE_STATES.EXTENDED) return;
    anchor.attach(record.root);
    if (!runeStoneActor.completeInstallation(record.branchId)) {
      throw new Error(`[VrRuneStoneInstallationInteraction] Actor rejected completed installation for ${record.branchId}.`);
    }
    runeBridgeActor.setInstalled(record.branchId);
    if (!runeStoneProgressionController.commitInstalledFamily(record.familyCode)) {
      throw new Error(`[VrRuneStoneInstallationInteraction] Duplicate installed truth for ${record.familyCode}.`);
    }
    active = null;
  }

  function reset() { active = null; }
  function dispose() {
    if (disposed) return;
    active = null;
    runeStoneActor.getStones().forEach(({ root }) => {
      if (root.parent !== runeStoneActor.object) runeStoneActor.object.attach(root);
    });
    disposed = true;
  }

  return { tryBeginCapture, update, reset, dispose, getActiveCapture: () => active };
}
