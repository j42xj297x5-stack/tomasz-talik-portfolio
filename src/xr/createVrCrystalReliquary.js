import * as THREE from '../vendor/three.js';

const INSERT_ZONE_NAME = 'RELIQUARY_CRYSTAL_INSERT_ZONE';
const ANCHOR_NAME = 'RELIQUARY_CRYSTAL_ANCHOR';

function findNamedObject(model, name) {
  let result = null;
  model?.traverse((object) => { if (!result && object.name === name) result = object; });
  return result;
}

function roleIsValid(object, expectedRole) {
  const role = object?.userData?.reliquary_role;
  return role === undefined || role === expectedRole;
}

export function getReliquaryVisibleBounds(model, insertZone, target = new THREE.Box3()) {
  target.makeEmpty();
  model?.updateWorldMatrix(true, true);
  model?.traverse((object) => {
    let ancestor = object;
    while (ancestor && ancestor !== model && ancestor !== insertZone) ancestor = ancestor.parent;
    if (ancestor === insertZone || !object.isMesh || !object.geometry) return;
    if (!object.geometry.boundingBox) object.geometry.computeBoundingBox();
    if (object.geometry.boundingBox) target.union(object.geometry.boundingBox.clone().applyMatrix4(object.matrixWorld));
  });
  return target;
}

export function createVrCrystalReliquary({ scene, reliquaryModel, portalDisplay, spawnPosition, settings }) {
  const object = new THREE.Group();
  object.name = 'VrCrystalReliquary';
  scene.add(object);
  const model = reliquaryModel ?? null;
  const insertZone = findNamedObject(model, INSERT_ZONE_NAME);
  const crystalAnchor = findNamedObject(model, ANCHOR_NAME);
  const hasValidInsertZone = Boolean(insertZone?.isMesh && insertZone.geometry
    && roleIsValid(insertZone, 'crystal_insert_zone'));
  const hasValidAnchor = Boolean(crystalAnchor && roleIsValid(crystalAnchor, 'crystal_display_anchor'));
  if (insertZone) insertZone.visible = false;
  if (!model || !hasValidInsertZone || !hasValidAnchor) {
    console.warn('[Experience VR] Crystal reliquary model, insert zone, or anchor is missing or invalid. The portal crystal socket remains available when the insert zone cannot be used.');
  }

  const visibleBounds = getReliquaryVisibleBounds(model, insertZone);
  if (model && !visibleBounds.isEmpty()) {
    const center = visibleBounds.getCenter(new THREE.Vector3());
    model.position.x -= center.x;
    model.position.y -= visibleBounds.min.y;
    model.position.z -= center.z;
    object.add(model);
  }

  const portalPosition = new THREE.Vector3();
  const direction = new THREE.Vector3();
  const configuredSpawn = new THREE.Vector3(spawnPosition?.x ?? 0, spawnPosition?.y ?? 0, spawnPosition?.z ?? 1);
  const worldScale = new THREE.Vector3();
  let disposed = false;

  function place() {
    if (disposed || !settings.enabled || !model || visibleBounds.isEmpty()) {
      object.visible = false;
      return false;
    }
    portalDisplay.object.updateWorldMatrix(true, false);
    portalDisplay.object.getWorldPosition(portalPosition);
    direction.subVectors(configuredSpawn, portalPosition).setY(0);
    if (direction.lengthSq() < 1e-8) direction.set(0, 0, 1);
    direction.normalize();
    object.position.copy(portalPosition).addScaledVector(direction, settings.distanceFromPortal);
    object.position.y = settings.floorOffset;
    portalDisplay.object.getWorldQuaternion(object.quaternion);
    object.visible = true;
    object.updateWorldMatrix(true, true);
    return true;
  }

  function reset() { if (!disposed) place(); }

  function getInsertZoneWorldSphere(targetSphere = new THREE.Sphere()) {
    if (!hasValidInsertZone) return null;
    if (!insertZone.geometry.boundingSphere) insertZone.geometry.computeBoundingSphere();
    const bounds = insertZone.geometry.boundingSphere;
    if (!bounds) return null;
    insertZone.updateWorldMatrix(true, false);
    targetSphere.center.copy(bounds.center).applyMatrix4(insertZone.matrixWorld);
    insertZone.getWorldScale(worldScale);
    targetSphere.radius = bounds.radius * Math.max(Math.abs(worldScale.x), Math.abs(worldScale.y), Math.abs(worldScale.z));
    return targetSphere;
  }

  function getCrystalAnchorWorldPosition(targetVector = new THREE.Vector3()) {
    if (!crystalAnchor || !hasValidAnchor) return null;
    crystalAnchor.updateWorldMatrix(true, false);
    return crystalAnchor.getWorldPosition(targetVector);
  }

  function dispose() {
    if (disposed) return;
    disposed = true;
    object.visible = false;
    object.removeFromParent();
  }

  place();
  return { object, model, insertZone, crystalAnchor, hasValidInsertZone, place, reset, dispose,
    getInsertZoneWorldSphere, getCrystalAnchorWorldPosition };
}
