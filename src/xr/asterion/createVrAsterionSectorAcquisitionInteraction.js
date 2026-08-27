import * as THREE from '../../vendor/three.js';
import { resolveRuneStoneByBranchId } from '../runes/vrRuneStoneRegistry.js';

export const VR_ASTERION_SECTOR_ACQUISITION_STATES = Object.freeze({
  IDLE: 'IDLE',
  ACQUIRING: 'ACQUIRING',
  LOCKED: 'LOCKED'
});

export const SECTOR_LOCK_DWELL_SECONDS = 1.0;

const ACTION_THRESHOLD = 0.1;
const SECTOR_ROOT_PREFIX = 'VrProgressFloorSectorActorRoot:';

export function createVrAsterionSectorAcquisitionInteraction({
  sphere,
  controllers = [],
  semanticInput,
  progressFloor,
  runeStoneProgressionController,
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

  const getLeftRecord = () => controllers.find(({ handedness }) => handedness === 'left') ?? null;

  function clearSession() {
    state = VR_ASTERION_SECTOR_ACQUISITION_STATES.IDLE;
    candidateGlyphId = null;
    lockedGlyphId = null;
    acquisitionSeconds = 0;
    gripActive = false;
    triggerPriority = false;
  }

  function resolveSectorRoot(object) {
    let current = object;
    while (current && current !== progressFloor?.geometryRoot?.parent) {
      if (current.name?.startsWith(SECTOR_ROOT_PREFIX)
        && current.userData?.glyphId && current.userData?.branchId) return current;
      current = current.parent;
    }
    return null;
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
    const hits = raycaster.intersectObject(progressFloor.geometryRoot, true);
    for (const hit of hits) {
      const sectorRoot = resolveSectorRoot(hit.object);
      if (!sectorRoot) continue;
      const runeStone = resolveRuneStoneByBranchId(sectorRoot.userData.branchId);
      if (runeStone && runeStoneProgressionController.isFamilyInstalled(runeStone.familyCode)) {
        return { glyphId: sectorRoot.userData.glyphId };
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
    }
    state = VR_ASTERION_SECTOR_ACQUISITION_STATES.ACQUIRING;
    acquisitionSeconds += Math.max(0, Number.isFinite(delta) ? delta : 0);
    if (acquisitionSeconds >= SECTOR_LOCK_DWELL_SECONDS) {
      acquisitionSeconds = SECTOR_LOCK_DWELL_SECONDS;
      lockedGlyphId = candidateGlyphId;
      state = VR_ASTERION_SECTOR_ACQUISITION_STATES.LOCKED;
    }
  }

  function reset() { if (!disposed) clearSession(); }
  function dispose() { if (disposed) return; clearSession(); disposed = true; }

  return {
    update,
    reset,
    dispose,
    getState: () => state,
    getCandidateGlyphId: () => candidateGlyphId,
    getLockedGlyphId: () => lockedGlyphId,
    getAcquisitionProgress: () => Math.min(1, Math.max(0, acquisitionSeconds / SECTOR_LOCK_DWELL_SECONDS)),
    isControlAvailable: () => state === VR_ASTERION_SECTOR_ACQUISITION_STATES.LOCKED
      && gripActive && !triggerPriority && Boolean(sphere?.isEquipped?.())
  };
}
