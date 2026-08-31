const ACQUIRING = 'ACQUIRING';
const ANGLE_EPSILON_DEGREES = 1e-4;

export function createVrAsterionPlatformEnergyVfxProjection({
  acquisitionInteraction, sectorControlInteraction, progressFloor, platformEnergyVfxActor
}) {
  if (!acquisitionInteraction?.getState || !sectorControlInteraction?.getSectorControlSnapshot
    || !progressFloor?.getSectorBranchId || !platformEnergyVfxActor?.setSectorAcquisitionEnergy
    || !platformEnergyVfxActor?.setFloorDriveEnergy) {
    throw new TypeError('[VrAsterionPlatformEnergyVfxProjection] Read-only sources and VFX commands are required.');
  }
  const previousAngleByGlyphId = new Map();
  let acquisitionBranchId = null;
  let driveBranchId = null;
  let disposed = false;

  function setAcquisition(branchId, strength) {
    if (acquisitionBranchId && acquisitionBranchId !== branchId) {
      platformEnergyVfxActor.setSectorAcquisitionEnergy(acquisitionBranchId, 0);
    }
    acquisitionBranchId = branchId;
    if (branchId) platformEnergyVfxActor.setSectorAcquisitionEnergy(branchId, strength);
  }

  function setDrive(branchId) {
    if (driveBranchId && driveBranchId !== branchId) platformEnergyVfxActor.setFloorDriveEnergy(driveBranchId, false);
    driveBranchId = branchId;
    if (branchId) platformEnergyVfxActor.setFloorDriveEnergy(branchId, true);
  }

  function update() {
    if (disposed) return;
    const candidateGlyphId = acquisitionInteraction.getCandidateGlyphId();
    const nextAcquisitionBranch = acquisitionInteraction.getState() === ACQUIRING && candidateGlyphId
      ? progressFloor.getSectorBranchId(candidateGlyphId) : null;
    setAcquisition(nextAcquisitionBranch, nextAcquisitionBranch ? acquisitionInteraction.getAcquisitionProgress() : 0);

    const movingGlyphId = sectorControlInteraction.getMovingGlyphId();
    let nextDriveBranch = null;
    sectorControlInteraction.getSectorControlSnapshot().forEach(({ glyphId, currentAngleDegrees }) => {
      const previous = previousAngleByGlyphId.get(glyphId);
      if (glyphId === movingGlyphId && Number.isFinite(previous)
        && Math.abs(currentAngleDegrees - previous) > ANGLE_EPSILON_DEGREES) {
        nextDriveBranch = progressFloor.getSectorBranchId(glyphId);
      }
      previousAngleByGlyphId.set(glyphId, currentAngleDegrees);
    });
    setDrive(nextDriveBranch);
  }

  function clear() {
    if (acquisitionBranchId) platformEnergyVfxActor.setSectorAcquisitionEnergy(acquisitionBranchId, 0);
    if (driveBranchId) platformEnergyVfxActor.setFloorDriveEnergy(driveBranchId, false);
    acquisitionBranchId = null;
    driveBranchId = null;
    previousAngleByGlyphId.clear();
  }
  function reset() { if (!disposed) clear(); }
  function dispose() { if (!disposed) { clear(); disposed = true; } }
  return { update, reset, dispose };
}
