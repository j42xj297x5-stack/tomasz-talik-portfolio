import * as THREE from '../vendor/three.js';

export function createVrPlaqueComposition({ scene, camera, renderer, anchorObject, distance, verticalOffset }) {
  const object = new THREE.Group();
  object.name = 'VrPlaqueComposition';
  object.visible = false;
  scene.add(object);

  const head = new THREE.Vector3();
  const anchorCenter = new THREE.Vector3();
  const direction = new THREE.Vector3();
  const facingTarget = new THREE.Vector3();
  const bounds = new THREE.Box3();
  let disposed = false;

  function place() {
    if (disposed) return false;
    const xrCamera = renderer.xr.getCamera(camera);
    xrCamera.updateWorldMatrix(true, false);
    xrCamera.getWorldPosition(head);
    bounds.setFromObject(anchorObject).getCenter(anchorCenter);
    direction.set(anchorCenter.x - head.x, 0, anchorCenter.z - head.z);
    if (direction.lengthSq() < 1e-8) direction.set(0, 0, -1);
    direction.normalize();
    object.position.copy(head).addScaledVector(direction, distance);
    object.position.y = head.y + verticalOffset;
    facingTarget.set(head.x, object.position.y, head.z);
    object.lookAt(facingTarget);
    object.visible = true;
    return true;
  }

  function reset() {
    if (disposed) return;
    object.visible = false;
    object.position.set(0, 0, 0);
    object.rotation.set(0, 0, 0);
  }

  function dispose() {
    if (disposed) return;
    reset();
    disposed = true;
    object.removeFromParent();
  }

  return { object, place, reset, dispose };
}
