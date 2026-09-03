import * as THREE from '../../vendor/three.js';
import { resolveRuneStoneByBranchId } from '../runes/vrRuneStoneRegistry.js';

export const VR_ASTERION_SECTOR_ACQUISITION_STATES = Object.freeze({
  IDLE: 'IDLE',
  ACQUIRING: 'ACQUIRING',
  LOCKED: 'LOCKED'
});

export const SECTOR_LOCK_DWELL_SECONDS = 1.0;

const ACTION_THRESHOLD = 0.1;

export function createVrAsterionSectorAcquisitionInteraction({
  sphere,
  controllers = [],
  semanticInput,
  progressFloor,
  runeStoneProgressionController,
  canUseAdvancedResonator = () => false,
  isInteractionBlocked = () => false
}) {
  const raycaster = new THREE.Raycaster();
  const rayOrigin = new THREE.Vector3();
  const rayDirection = new THREE.Vector3();
  const rayQuaternion = new THREE.Quaternion();
  let state = VR_ASTERION_SECTOR_ACQUISITION_STATES.IDLE;
  let candidateGlyphId = null;
  let lockedGlyphId = null;
  let acquisitionSeconds = 0;
  let gripActive = false;
  let triggerPriority = false;
  let disposed = false;
  const acquisitionStartedListeners = new Set();
  const lockListeners = new Set();

  const getLeftRecord = () => controllers.find(({ handedness }) => handedness === 'left') ?? null;

  function clearSession() {
    state = VR_ASTERION_SECTOR_ACQUISITION_STATES.IDLE;
    candidateGlyphId = null;
    lockedGlyphId = null;
    acquisitionSeconds = 0;
    gripActive = false;
    triggerPriority = false;
  }

  function findPoweredSector(leftRecord) {
    const targetRay = leftRecord?.controller;
    if (!targetRay || !Number.isFinite(leftRecord.currentRayLength) || leftRecord.currentRayLength <= 0) return null;
    targetRay.updateWorldMatrix(true, false);
    targetRay.getWorldPosition(rayOrigin);
    targetRay.getWorldQuaternion(rayQuaternion);
    rayDirection.set(0, 0, -1).applyQuaternion(rayQuaternion).normalize();
    raycaster.set(rayOrigin, rayDirection);
    raycaster.near = 0;
    raycaster.far = leftRecord.currentRayLength;
    const hit = progressFloor.raycastAsterionSectorTarget(raycaster);
    if (hit) {
      const runeStone = resolveRuneStoneByBranchId(hit.branchId);
      const advancedAllowed = hit.branchId !== 'metal' || canUseAdvancedResonator() === true;
      if (runeStone && advancedAllowed
        && runeStoneProgressionController.isFamilyInstalled(runeStone.familyCode)) {
        return { glyphId: hit.glyphId, branchId: hit.branchId };
      }
    }
    return null;
  }

  function update(delta = 0) {
    if (disposed) return;
    const leftRecord = getLeftRecord();
    const input = semanticInput.getState();
    gripActive = input.leftGrabAction > ACTION_THRESHOLD;
    triggerPriority = input.leftPrimaryAction > ACTION_THRESHOLD;
    const equipped = Boolean(sphere?.isEquipped?.());
    const physicallyAvailable = equipped && leftRecord?.isConnected && !isInteractionBlocked(leftRecord);

    if (!gripActive || !physicallyAvailable) {
      clearSession();
      return;
    }
    if (triggerPriority) {
      if (state !== VR_ASTERION_SECTOR_ACQUISITION_STATES.LOCKED) {
        state = VR_ASTERION_SECTOR_ACQUISITION_STATES.IDLE;
        candidateGlyphId = null;
        acquisitionSeconds = 0;
      }
      return;
    }
    if (state === VR_ASTERION_SECTOR_ACQUISITION_STATES.LOCKED) return;

    const candidate = findPoweredSector(leftRecord);
    if (!candidate) {
      state = VR_ASTERION_SECTOR_ACQUISITION_STATES.IDLE;
      candidateGlyphId = null;
      acquisitionSeconds = 0;
      return;
    }
    if (candidateGlyphId !== candidate.glyphId) {
      candidateGlyphId = candidate.glyphId;
      acquisitionSeconds = 0;
      state = VR_ASTERION_SECTOR_ACQUISITION_STATES.ACQUIRING;
      const event = Object.freeze({ glyphId: candidate.glyphId, branchId: candidate.branchId });
      [...acquisitionStartedListeners].forEach((listener) => listener(event));
    }
    state = VR_ASTERION_SECTOR_ACQUISITION_STATES.ACQUIRING;
    acquisitionSeconds += Math.max(0, Number.isFinite(delta) ? delta : 0);
    if (acquisitionSeconds >= SECTOR_LOCK_DWELL_SECONDS) {
      acquisitionSeconds = SECTOR_LOCK_DWELL_SECONDS;
      lockedGlyphId = candidateGlyphId;
      state = VR_ASTERION_SECTOR_ACQUISITION_STATES.LOCKED;
      [...lockListeners].forEach((listener) => listener(Object.freeze({ glyphId: lockedGlyphId })));
    }
  }

  function reset() { if (!disposed) clearSession(); }
  function dispose() {
    if (disposed) return;
    clearSession();
    acquisitionStartedListeners.clear();
    lockListeners.clear();
    disposed = true;
  }

  return {
    update,
    reset,
    dispose,
    getState: () => state,
    getCandidateGlyphId: () => candidateGlyphId,
    getLockedGlyphId: () => lockedGlyphId,
    getAcquisitionProgress: () => Math.min(1, Math.max(0, acquisitionSeconds / SECTOR_LOCK_DWELL_SECONDS)),
    subscribeAcquisitionStarted(listener) {
      if (typeof listener !== 'function' || disposed) return () => {};
      acquisitionStartedListeners.add(listener);
      return () => acquisitionStartedListeners.delete(listener);
    },
    subscribeLocked(listener) {
      if (typeof listener !== 'function' || disposed) return () => {};
      lockListeners.add(listener);
      return () => lockListeners.delete(listener);
    },
    isControlAvailable: () => state === VR_ASTERION_SECTOR_ACQUISITION_STATES.LOCKED
      && gripActive && !triggerPriority && Boolean(sphere?.isEquipped?.())
  };
}
