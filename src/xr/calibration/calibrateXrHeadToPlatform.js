import * as THREE from '../../vendor/three.js';

/** Move the rig once so the tracked head reaches the requested platform-local XZ. */
export function calibrateXrHeadToPlatform({ playerRig, headWorldPosition, platformRoot, entryDirection, targetRadius }) {
  playerRig.updateWorldMatrix(true, true);
  platformRoot.updateWorldMatrix(true, false);
  const actualHeadWorld = headWorldPosition.clone();
  const actualHeadLocal = platformRoot.worldToLocal(actualHeadWorld.clone());
  const desiredHeadLocal = entryDirection.clone();
  desiredHeadLocal.y = 0;
  if (desiredHeadLocal.lengthSq() < 1e-9) desiredHeadLocal.set(0, 0, 1);
  else desiredHeadLocal.normalize();
  desiredHeadLocal.multiplyScalar(targetRadius);
  // Height is owned by the XR reference space and the user's current physical pose.
  desiredHeadLocal.y = actualHeadLocal.y;
  const desiredHeadWorld = platformRoot.localToWorld(desiredHeadLocal.clone());
  const correctedRigWorld = playerRig.getWorldPosition(new THREE.Vector3())
    .add(desiredHeadWorld).sub(actualHeadWorld);
  playerRig.parent?.updateWorldMatrix(true, false);
  playerRig.position.copy(playerRig.parent ? playerRig.parent.worldToLocal(correctedRigWorld) : correctedRigWorld);
  playerRig.updateWorldMatrix(true, true);
  return { actualHeadWorld, desiredHeadWorld,
    horizontalDeltaWorld: desiredHeadWorld.clone().sub(actualHeadWorld) };
}
