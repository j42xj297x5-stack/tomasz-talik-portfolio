import * as THREE from '../vendor/three.js';

export function calculatePortalScale(size, maxWidth, maxHeight) {
  if (size.x <= 0 || size.y <= 0) return 1;
  return Math.min(maxWidth / size.x, maxHeight / size.y);
}

export function createVrPortalDisplay({ scene, camera, renderer, anchorObject, portalModel, settings }) {
  const object = new THREE.Group();
  object.name = 'VrPortalDisplay';
  object.visible = false;
  scene.add(object);
  const model = portalModel?.clone(true) ?? null;
  if (model) {
    model.name = 'VrPortalModel';
    const bounds = new THREE.Box3().setFromObject(model);
    const size = bounds.getSize(new THREE.Vector3());
    model.scale.setScalar(calculatePortalScale(size, settings.maxWidth, settings.maxHeight));
    model.updateMatrixWorld(true);
    const scaledBounds = new THREE.Box3().setFromObject(model);
    const center = scaledBounds.getCenter(new THREE.Vector3());
    model.position.set(-center.x, -center.y, -center.z);
    object.add(model);
  }

  const head = new THREE.Vector3();
  const anchorCenter = new THREE.Vector3();
  const direction = new THREE.Vector3();
  const target = new THREE.Vector3();
  let disposed = false;

  function place() {
    if (disposed || !settings.enabled || !model) return false;
    const xrCamera = renderer.xr.getCamera(camera);
    xrCamera.updateWorldMatrix(true, false);
    xrCamera.getWorldPosition(head);
    new THREE.Box3().setFromObject(anchorObject).getCenter(anchorCenter);
    direction.set(anchorCenter.x - head.x, 0, anchorCenter.z - head.z);
    if (direction.lengthSq() < 1e-8) direction.set(0, 0, -1);
    direction.normalize();
    object.position.copy(head).addScaledVector(direction, settings.distance);
    object.position.y = head.y + settings.verticalOffset;
    target.set(head.x, object.position.y, head.z);
    object.lookAt(target);
    object.visible = true;
    return true;
  }

  function reset() {
    if (disposed) return;
    object.visible = false;
    object.position.set(0, 0, 0);
    object.rotation.set(0, 0, 0);
  }
  function dispose() { if (!disposed) { reset(); disposed = true; object.removeFromParent(); } }
  return { object, model, place, reset, dispose };
}
