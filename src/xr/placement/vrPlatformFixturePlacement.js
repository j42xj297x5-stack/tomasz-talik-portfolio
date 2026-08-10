import * as THREE from '../../vendor/three.js';

// Fixture positions are authored in the platform coordinate system. The origin is
// deliberately a transform reference only: no geometry or actor bounds take part.
export function resolveVrPlatformFixtureWorldPosition({ platformOrigin, fixturePosition, target = new THREE.Vector3() }) {
  target.set(fixturePosition?.x ?? 0, fixturePosition?.y ?? 0, fixturePosition?.z ?? 0);
  platformOrigin?.updateWorldMatrix(true, false);
  return platformOrigin ? platformOrigin.localToWorld(target) : target;
}
