import * as THREE from '../vendor/three.js';
import { applyWorldTransform } from './applyWorldTransform.js';

export function calculatePortalScale(size, maxWidth, maxHeight) {
  if (size.x <= 0 || size.y <= 0) return 1;
  return Math.min(maxWidth / size.x, maxHeight / size.y);
}

export function findPortalCanvasSurface(model) {
  let candidate = null;
  model?.traverse((object) => {
    if (!candidate && object.name === 'PORTAL_CANVAS_SURFACE') candidate = object;
  });
  const role = candidate?.userData?.portal_role;
  if (!candidate?.isMesh || !candidate.geometry || !candidate.geometry.getAttribute?.('uv')
    || (role !== undefined && role !== 'canvas_surface')) {
    return null;
  }
  return candidate;
}

export function createVrPortalDisplay({ scene, anchorObject, portalModel, spawnPosition, settings }) {
  const socketSettings = settings.socket ?? { xFactor: 0, yFactor: -0.34, zFactor: 0.58, insertRadius: 0.28 };
  const object = new THREE.Group();
  object.name = 'VrPortalDisplay';
  object.visible = false;
  scene.add(object);
  const model = portalModel?.clone(true) ?? null;
  const canvasSurface = findPortalCanvasSurface(model);
  if (model && !canvasSurface) {
    console.warn('[Experience VR] PORTAL_CANVAS_SURFACE is missing or invalid (expected a mesh with geometry, UVs, and portal_role="canvas_surface" when the role is present). Using the portal canvas fallback.');
  }
  const socket = new THREE.Object3D();
  socket.name = 'VrPortalCrystalSocket';
  socket.visible = false;
  object.add(socket);
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
    model.updateMatrixWorld(true);
    const localBounds = new THREE.Box3().setFromObject(model);
    const localSize = localBounds.getSize(new THREE.Vector3());
    const localCenter = localBounds.getCenter(new THREE.Vector3());
    socket.position.set(
      localCenter.x + localSize.x * socketSettings.xFactor,
      localCenter.y + localSize.y * socketSettings.yFactor,
      localBounds.max.z + localSize.z * socketSettings.zFactor
    );
  }

  const anchorCenter = new THREE.Vector3();
  const towardSpawn = new THREE.Vector3();
  const rightFromSpawnView = new THREE.Vector3();
  const direction = new THREE.Vector3();
  const target = new THREE.Vector3();
  const desiredWorldPosition = new THREE.Vector3();
  const desiredWorldQuaternion = new THREE.Quaternion();
  const placementProbe = new THREE.Object3D();
  const configuredSpawn = new THREE.Vector3(spawnPosition?.x ?? 0, spawnPosition?.y ?? 0, spawnPosition?.z ?? 1);
  const localBounds = model ? new THREE.Box3().setFromObject(model) : null;
  let disposed = false;

  function place() {
    if (disposed || !settings.enabled || !model) return false;
    new THREE.Box3().setFromObject(anchorObject).getCenter(anchorCenter);
    towardSpawn.subVectors(configuredSpawn, anchorCenter).setY(0);
    if (towardSpawn.lengthSq() < 1e-8) towardSpawn.set(0, 0, 1);
    towardSpawn.normalize();
    rightFromSpawnView.set(-towardSpawn.z, 0, towardSpawn.x);
    direction.copy(rightFromSpawnView).addScaledVector(towardSpawn, settings.forwardBias).normalize();
    desiredWorldPosition.copy(anchorCenter).addScaledVector(direction, settings.distanceFromAnchor);
    desiredWorldPosition.y = settings.floorOffset - localBounds.min.y;
    target.set(configuredSpawn.x, desiredWorldPosition.y, configuredSpawn.z);
    placementProbe.position.copy(desiredWorldPosition);
    placementProbe.lookAt(target);
    desiredWorldQuaternion.copy(placementProbe.quaternion);
    applyWorldTransform(object, desiredWorldPosition, desiredWorldQuaternion);
    object.visible = true;
    return true;
  }

  function reset() {
    if (disposed) return;
    place();
  }
  function hide() { if (!disposed) object.visible = false; }
  function getSocketWorldPosition(targetVector = new THREE.Vector3()) {
    object.updateWorldMatrix(true, true);
    return socket.getWorldPosition(targetVector);
  }
  function dispose() { if (!disposed) { hide(); disposed = true; object.removeFromParent(); } }
  return { object, model, canvasSurface, socket, insertRadius: socketSettings.insertRadius, getSocketWorldPosition, place, reset, hide, dispose };
}
