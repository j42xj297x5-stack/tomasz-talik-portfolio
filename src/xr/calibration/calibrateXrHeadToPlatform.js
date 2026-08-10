import * as THREE from '../../vendor/three.js';

/** Move the rig once so the tracked head reaches the requested platform-local XZ. */
export function calibrateXrHeadToPlatform({ playerRig, xrCamera, platformOrigin, entryDirection,
  targetRadius, targetLocalPosition = null }) {
  playerRig.updateWorldMatrix(true, true);
  platformOrigin.updateWorldMatrix(true, false);
  const actualHeadWorld = xrCamera.getWorldPosition(new THREE.Vector3());
  const actualHeadLocal = platformOrigin.worldToLocal(actualHeadWorld.clone());
  const desiredHeadLocal = targetLocalPosition ? targetLocalPosition.clone() : entryDirection.clone();
  if (!targetLocalPosition) {
    desiredHeadLocal.y = 0;
    if (desiredHeadLocal.lengthSq() < 1e-9) desiredHeadLocal.set(0, 0, 1);
    else desiredHeadLocal.normalize();
    desiredHeadLocal.multiplyScalar(targetRadius);
  }
  // Height is owned by the XR reference space and the user's current physical pose.
  desiredHeadLocal.y = actualHeadLocal.y;
  const desiredHeadWorld = platformOrigin.localToWorld(desiredHeadLocal.clone());
  const correctedRigWorld = playerRig.getWorldPosition(new THREE.Vector3())
    .add(desiredHeadWorld).sub(actualHeadWorld);
  playerRig.parent?.updateWorldMatrix(true, false);
  playerRig.position.copy(playerRig.parent ? playerRig.parent.worldToLocal(correctedRigWorld) : correctedRigWorld);
  playerRig.updateWorldMatrix(true, true);
  return { actualHeadWorld, desiredHeadWorld,
    horizontalDeltaWorld: desiredHeadWorld.clone().sub(actualHeadWorld) };
}
