import * as THREE from '../../vendor/three.js';

export function resolveChamberCylinder(chamber, clearance = 0) {
  const bounds = new THREE.Box3().makeEmpty();
  if (!chamber) return null;
  chamber.updateWorldMatrix(true, true);
  const inverse = chamber.matrixWorld.clone().invert();
  chamber.traverse((node) => {
    if (!node.geometry) return;
    if (!node.geometry.boundingBox) node.geometry.computeBoundingBox();
    if (!node.geometry.boundingBox) return;
    bounds.union(node.geometry.boundingBox.clone().applyMatrix4(
      new THREE.Matrix4().multiplyMatrices(inverse, node.matrixWorld)
    ));
  });
  if (bounds.isEmpty()) return null;
  const center = bounds.getCenter(new THREE.Vector3());
  const size = bounds.getSize(new THREE.Vector3());
  const safeClearance = Math.max(0, Number.isFinite(clearance) ? clearance : 0);
  const radius = Math.max(0, Math.min(size.x, size.z) * 0.5 - safeClearance);
  const halfHeight = Math.max(0, size.y * 0.5 - safeClearance);
  return radius > 0 && halfHeight > 0 ? { center, radius, halfHeight, height: halfHeight * 2, bounds } : null;
}

export function isWorldPointInsideChamberCylinder(point, chamber, cylinder, target = new THREE.Vector3()) {
  if (!point || !chamber || !cylinder) return false;
  chamber.updateWorldMatrix(true, false);
  target.copy(point).applyMatrix4(new THREE.Matrix4().copy(chamber.matrixWorld).invert()).sub(cylinder.center);
  return target.x * target.x + target.z * target.z <= cylinder.radius * cylinder.radius
    && Math.abs(target.y) <= cylinder.halfHeight;
}
