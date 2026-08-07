import * as THREE from '../../vendor/three.js';

export function resolveVrPlatformFixturePositions({ anchorCenter, spawnPosition, portalSettings }) {
  const towardPlayer = new THREE.Vector3(
    (spawnPosition?.x ?? 0) - anchorCenter.x, 0, (spawnPosition?.z ?? 1) - anchorCenter.z
  );
  if (towardPlayer.lengthSq() < 1e-8) towardPlayer.set(0, 0, 1);
  towardPlayer.normalize();
  const lateral = new THREE.Vector3(-towardPlayer.z, 0, towardPlayer.x);
  const legacyDirection = lateral.clone().addScaledVector(towardPlayer, portalSettings.forwardBias).normalize();
  const legacyPortalOffset = legacyDirection.multiplyScalar(portalSettings.distanceFromAnchor);
  const furnaceOffset = legacyPortalOffset.clone().negate();
  const forwardAmount = furnaceOffset.dot(towardPlayer);
  const lateralAmount = furnaceOffset.dot(lateral);
  const portalOffset = towardPlayer.clone().multiplyScalar(forwardAmount)
    .addScaledVector(lateral, -lateralAmount);
  return {
    portalPosition: anchorCenter.clone().add(portalOffset),
    furnacePosition: anchorCenter.clone().add(furnaceOffset),
    towardPlayer,
    lateral
  };
}
