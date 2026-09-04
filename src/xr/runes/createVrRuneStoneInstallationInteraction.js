import * as THREE from '../../vendor/three.js';
import { VR_RUNE_BRIDGE_STATES } from './createVrRuneBridgeActor.js';
import { VR_RUNE_STONE_STATE } from './createVrRuneStoneActor.js';

const INSTALLATION_PHASE = Object.freeze({
  APPROACH: 'APPROACH',
  BRIDGE_OPEN: 'BRIDGE_OPEN',
  DESCENT: 'DESCENT'
});
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
  if (!runeBridgeActor?.getStoneHoverAnchor || !runeBridgeActor?.getStoneAnchor) {
    throw new TypeError('[VrRuneStoneInstallationInteraction] RuneBridgeActor anchors are required.');
  }
  if (!runeInstallationReadinessProjection?.isInstallationReady) {
    throw new TypeError('[VrRuneStoneInstallationInteraction] Installation readiness is required.');
  }
  if (!runeStoneProgressionController?.commitInstalledFamily) {
    throw new TypeError('[VrRuneStoneInstallationInteraction] Rune progression truth is required.');
  }
  const duration = settings?.phaseDurationSeconds;
  if (!Number.isFinite(duration) || duration <= 0) {
    throw new TypeError('settings.phaseDurationSeconds must be finite and positive.');
  }
  const installAudioLeadSeconds = settings?.installAudioLeadSeconds;
  if (!Number.isFinite(installAudioLeadSeconds) || installAudioLeadSeconds < 0) {
    throw new TypeError('settings.installAudioLeadSeconds must be finite and non-negative.');
  }

  const targetPosition = new THREE.Vector3();
  const targetQuaternion = new THREE.Quaternion();
  const fromPosition = new THREE.Vector3();
  const fromQuaternion = new THREE.Quaternion();
  const localPosition = new THREE.Vector3();
  const localQuaternion = new THREE.Quaternion();
  let active = null;
  let disposed = false;
  const installAudioCueListeners = new Set();
  const dockingStartedListeners = new Set();
  const installedListeners = new Set();

  function createInstallationEvent(record) {
    return Object.freeze({ branchId: record.branchId, familyCode: record.familyCode,
      assetIdentity: record.descriptor.assetIdentity });
  }

  function emitInstallAudioCueIfDue() {
    if (active.installAudioCueEmitted || duration - active.elapsed > installAudioLeadSeconds) return;
    active.installAudioCueEmitted = true;
    const event = createInstallationEvent(active.record);
    installAudioCueListeners.forEach((listener) => {
      try { listener(event); }
      catch (error) { console.warn('[VrRuneStoneInstallationInteraction] Install audio cue observer failed.', error); }
    });
  }

  function readWorldTransform(anchor, position, quaternion) {
    anchor.updateWorldMatrix(true, false);
    anchor.getWorldPosition(position);
    anchor.getWorldQuaternion(quaternion);
  }

  function applyWorldTransform(root, position, quaternion) {
    root.parent.updateWorldMatrix(true, false);
    const parentQuaternion = root.parent.getWorldQuaternion(localQuaternion).invert();
    localPosition.copy(position);
    root.parent.worldToLocal(localPosition);
    root.position.copy(localPosition);
    root.quaternion.copy(parentQuaternion.multiply(quaternion));
  }

  function tryBeginHandoff(record) {
    if (disposed || active || record?.descriptor?.natural !== true) return false;
    const { branchId, familyCode, root } = record;
    if (runeStoneActor.getState(branchId) !== VR_RUNE_STONE_STATE.CARRIED_ORBIT
      || !runeStoneProgressionController.isFamilyTuned(familyCode)
      || runeStoneProgressionController.isFamilyInstalled(familyCode)
      || runeInstallationReadinessProjection.isInstallationReady(branchId) !== true
      || runeBridgeActor.getState(branchId) !== VR_RUNE_BRIDGE_STATES.DOCKED) return false;

    const hoverAnchor = runeBridgeActor.getStoneHoverAnchor(branchId);
    const installationAnchor = runeBridgeActor.getStoneAnchor(branchId);
    if (!hoverAnchor || !installationAnchor || !runeStoneActor.beginSocketCapture(branchId)) return false;

    root.updateWorldMatrix(true, false);
    active = {
      record,
      hoverAnchor,
      installationAnchor,
      phase: INSTALLATION_PHASE.APPROACH,
      elapsed: 0,
      installAudioCueEmitted: false,
      startPosition: root.getWorldPosition(new THREE.Vector3()),
      startQuaternion: root.getWorldQuaternion(new THREE.Quaternion())
    };
    const event = createInstallationEvent(record);
    dockingStartedListeners.forEach((listener) => {
      try { listener(event); }
      catch (error) { console.warn('[VrRuneStoneInstallationInteraction] Docking-start observer failed.', error); }
    });
    return true;
  }

  function updateApproach(delta) {
    active.elapsed = Math.min(duration, active.elapsed + delta);
    const t = smoothstep(active.elapsed / duration);
    readWorldTransform(active.hoverAnchor, targetPosition, targetQuaternion);
    fromPosition.lerpVectors(active.startPosition, targetPosition, t);
    fromQuaternion.copy(active.startQuaternion).slerp(targetQuaternion, t);
    applyWorldTransform(active.record.root, fromPosition, fromQuaternion);
    if (active.elapsed < duration) return;
    applyWorldTransform(active.record.root, targetPosition, targetQuaternion);
    if (!runeBridgeActor.beginExtension(active.record.branchId)) {
      throw new Error(`[VrRuneStoneInstallationInteraction] Bridge rejected extension for ${active.record.branchId}.`);
    }
    active.phase = INSTALLATION_PHASE.BRIDGE_OPEN;
    active.elapsed = 0;
  }

  function updateBridgeOpen() {
    readWorldTransform(active.hoverAnchor, targetPosition, targetQuaternion);
    applyWorldTransform(active.record.root, targetPosition, targetQuaternion);
    if (runeBridgeActor.getState(active.record.branchId) !== VR_RUNE_BRIDGE_STATES.EXTENDED) return;
    active.phase = INSTALLATION_PHASE.DESCENT;
    active.elapsed = 0;
    emitInstallAudioCueIfDue();
  }

  function updateDescent(delta) {
    active.elapsed = Math.min(duration, active.elapsed + delta);
    emitInstallAudioCueIfDue();
    const t = smoothstep(active.elapsed / duration);
    readWorldTransform(active.hoverAnchor, fromPosition, fromQuaternion);
    readWorldTransform(active.installationAnchor, targetPosition, targetQuaternion);
    fromPosition.lerp(targetPosition, t);
    fromQuaternion.slerp(targetQuaternion, t);
    applyWorldTransform(active.record.root, fromPosition, fromQuaternion);
    if (active.elapsed < duration) return;

    const { record, installationAnchor } = active;
    applyWorldTransform(record.root, targetPosition, targetQuaternion);
    installationAnchor.attach(record.root);
    if (!runeStoneActor.completeInstallation(record.branchId)) {
      throw new Error(`[VrRuneStoneInstallationInteraction] Actor rejected completed installation for ${record.branchId}.`);
    }
    if (!runeBridgeActor.setInstalled(record.branchId)) {
      throw new Error(`[VrRuneStoneInstallationInteraction] Bridge rejected completed installation for ${record.branchId}.`);
    }
    if (!runeStoneProgressionController.commitInstalledFamily(record.familyCode)) {
      throw new Error(`[VrRuneStoneInstallationInteraction] Duplicate installed truth for ${record.familyCode}.`);
    }
    active = null;
    const event = createInstallationEvent(record);
    installedListeners.forEach((listener) => {
      try { listener(event); }
      catch (error) { console.warn('[VrRuneStoneInstallationInteraction] Installed observer failed.', error); }
    });
  }

  function update(deltaSeconds = 0) {
    if (disposed || !active) return;
    const delta = Math.max(0, Number.isFinite(deltaSeconds) ? deltaSeconds : 0);
    if (active.phase === INSTALLATION_PHASE.APPROACH) updateApproach(delta);
    else if (active.phase === INSTALLATION_PHASE.BRIDGE_OPEN) updateBridgeOpen();
    else updateDescent(delta);
  }

  function reset() { active = null; }
  function dispose() {
    if (disposed) return;
    active = null;
    runeStoneActor.getStones().forEach(({ root }) => {
      if (root.parent !== runeStoneActor.object) runeStoneActor.object.attach(root);
    });
    disposed = true;
    installAudioCueListeners.clear();
    dockingStartedListeners.clear();
    installedListeners.clear();
  }

  return { tryBeginHandoff, update, reset, dispose,
    subscribeDockingStarted(listener) {
      if (typeof listener !== 'function') throw new TypeError('Docking-start listener must be a function.');
      dockingStartedListeners.add(listener);
      return () => dockingStartedListeners.delete(listener);
    },
    subscribeInstallAudioCue(listener) {
      if (typeof listener !== 'function') throw new TypeError('Install audio cue listener must be a function.');
      installAudioCueListeners.add(listener);
      return () => installAudioCueListeners.delete(listener);
    },
    subscribeInstalled(listener) {
      if (typeof listener !== 'function') throw new TypeError('Installed listener must be a function.');
      installedListeners.add(listener);
      return () => installedListeners.delete(listener);
    },
    getActiveInstallation: () => active };
}
