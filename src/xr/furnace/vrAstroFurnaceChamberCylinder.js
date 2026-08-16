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

function boundsInAnchor(root, anchor) {
  const worldBounds = new THREE.Box3().setFromObject(root);
  const result = new THREE.Box3().makeEmpty();
  if (worldBounds.isEmpty()) return result;
  anchor.updateWorldMatrix(true, false);
  const inverse = anchor.matrixWorld.clone().invert();
  for (const x of [worldBounds.min.x, worldBounds.max.x]) for (const y of [worldBounds.min.y, worldBounds.max.y]) {
    for (const z of [worldBounds.min.z, worldBounds.max.z]) {
      result.expandByPoint(new THREE.Vector3(x, y, z).applyMatrix4(inverse));
    }
  }
  return result;
}

// Canonical process-zone placement shared by inserted content and every furnace-produced object.
export function resolveFurnaceContentSnapTarget({
  object, visibleRoot = object, anchor, energyCell = null, contentClearance = 0.012,
  desiredWorldScale = null, localGeometryCenter = null, centerVisibleBounds = false, preserveOrientation = false
}) {
  if (!object || !visibleRoot || !anchor) return new THREE.Vector3();
  const savedPosition = object.position.clone(), savedQuaternion = object.quaternion.clone(), savedScale = object.scale.clone();
  object.position.set(0, 0, 0); if (!preserveOrientation) object.quaternion.identity();
  if (desiredWorldScale) {
    object.scale.set(1, 1, 1); object.updateWorldMatrix(true, false);
    const actual = object.getWorldScale(new THREE.Vector3());
    object.scale.set(desiredWorldScale.x / Math.max(Math.abs(actual.x), 1e-8),
      desiredWorldScale.y / Math.max(Math.abs(actual.y), 1e-8), desiredWorldScale.z / Math.max(Math.abs(actual.z), 1e-8));
  }
  object.updateWorldMatrix(true, true);
  const contentBounds = boundsInAnchor(visibleRoot, anchor);
  const energyBounds = energyCell ? boundsInAnchor(energyCell, anchor) : new THREE.Box3().makeEmpty();
  const target = new THREE.Vector3();
  if (!contentBounds.isEmpty() && !energyBounds.isEmpty()) {
    target.y = energyBounds.min.y - Math.max(0, contentClearance) - contentBounds.max.y;
  }
  if (localGeometryCenter) {
    const center = localGeometryCenter.clone().applyMatrix4(object.matrixWorld); anchor.worldToLocal(center);
    target.x -= center.x; target.z -= center.z;
  } else if (centerVisibleBounds && !contentBounds.isEmpty()) {
    const center = contentBounds.getCenter(new THREE.Vector3());
    target.x -= center.x; target.z -= center.z;
  }
  object.position.copy(savedPosition); object.quaternion.copy(savedQuaternion); object.scale.copy(savedScale);
  object.updateWorldMatrix(true, true);
  return target;
}
