import * as THREE from '../vendor/three.js';

const parentWorldQuaternion = new THREE.Quaternion();
const parentWorldScale = new THREE.Vector3();

export function applyWorldTransform(object, desiredWorldPosition, desiredWorldQuaternion, desiredWorldScale = null) {
  object.updateWorldMatrix(true, false);
  const parent = object.parent;
  if (!parent) {
    object.position.copy(desiredWorldPosition);
    object.quaternion.copy(desiredWorldQuaternion);
    if (desiredWorldScale) object.scale.copy(desiredWorldScale);
    object.updateMatrixWorld(true);
    return object;
  }
  parent.updateWorldMatrix(true, false);
  object.position.copy(desiredWorldPosition);
  parent.worldToLocal(object.position);
  parent.getWorldQuaternion(parentWorldQuaternion).invert();
  object.quaternion.copy(parentWorldQuaternion).multiply(desiredWorldQuaternion);
  if (desiredWorldScale) {
    parent.getWorldScale(parentWorldScale);
    object.scale.set(
      parentWorldScale.x ? desiredWorldScale.x / parentWorldScale.x : desiredWorldScale.x,
      parentWorldScale.y ? desiredWorldScale.y / parentWorldScale.y : desiredWorldScale.y,
      parentWorldScale.z ? desiredWorldScale.z / parentWorldScale.z : desiredWorldScale.z
    );
  }
  object.updateMatrixWorld(true);
  return object;
}
