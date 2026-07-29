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

function getCompanionVisibleBounds(model, target = new THREE.Box3()) {
  target.makeEmpty();
  model?.updateWorldMatrix(true, true);
  model?.traverse((object) => {
    const technical = object.name?.includes('TRIGGER') || object.userData?.reliquary_role?.includes('trigger')
      || (!object.isMesh && object !== model);
    if (technical || !object.geometry) return;
    if (!object.geometry.boundingBox) object.geometry.computeBoundingBox();
    if (object.geometry.boundingBox) target.union(object.geometry.boundingBox.clone().applyMatrix4(object.matrixWorld));
  });
  return target;
}

export function createVrCrystalReliquary({ scene, reliquaryModel, portalDisplay, spawnPosition, settings }) {
  const object = new THREE.Group();
  object.name = 'VrCrystalReliquary';
  scene.add(object);
  const authoredRoot = new THREE.Group();
  authoredRoot.name = 'VrCrystalReliquaryAuthoredRoot';
  object.add(authoredRoot);
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
    authoredRoot.position.set(-center.x, -visibleBounds.min.y, -center.z);
    authoredRoot.add(model);
  }

  const portalPosition = new THREE.Vector3();
  const direction = new THREE.Vector3();
  const configuredSpawn = new THREE.Vector3(spawnPosition?.x ?? 0, spawnPosition?.y ?? 0, spawnPosition?.z ?? 1);
  const portalForward = new THREE.Vector3();
  const portalLeft = new THREE.Vector3();
  const towardSpawn = new THREE.Vector3();
  const portalQuaternion = new THREE.Quaternion();
  const inversePlacementQuaternion = new THREE.Quaternion();
  const buttonWorldOffset = new THREE.Vector3();
  const worldUp = new THREE.Vector3(0, 1, 0);
  const worldScale = new THREE.Vector3();
  const companions = new Map();
  let disposed = false;

  function updateButtonPlacement() {
    authoredRoot.getWorldQuaternion(inversePlacementQuaternion).invert();
    for (const companion of companions.values()) {
      const placement = companion.settings ?? settings.buttons ?? {};
      const radius = placement.placementRadius ?? 0.9;
      const angle = THREE.MathUtils.degToRad(placement.placementAngleDegrees ?? 60);
      const sideSign = companion.side === 'right' ? -1 : 1;
      buttonWorldOffset.copy(portalLeft).multiplyScalar(sideSign * Math.sin(angle) * radius)
        .addScaledVector(portalForward, Math.cos(angle) * radius);
      buttonWorldOffset.y = placement.verticalOffset ?? 0;
      companion.placementRoot.position.copy(buttonWorldOffset).applyQuaternion(inversePlacementQuaternion);
    }
  }

  function place() {
    if (disposed || !settings.enabled || !model || visibleBounds.isEmpty()) {
      object.visible = false;
      return false;
    }
    portalDisplay.object.updateWorldMatrix(true, false);
    portalDisplay.object.getWorldPosition(portalPosition);
    portalDisplay.object.getWorldQuaternion(portalQuaternion);
    portalForward.set(0, 0, 1).applyQuaternion(portalQuaternion).setY(0);
    towardSpawn.subVectors(configuredSpawn, portalPosition).setY(0);
    if (portalForward.lengthSq() < 1e-8) portalForward.copy(towardSpawn);
    if (portalForward.lengthSq() < 1e-8) portalForward.set(1, 0, 0).applyQuaternion(portalQuaternion).setY(0);
    portalForward.normalize();
    if (towardSpawn.lengthSq() > 1e-8 && portalForward.dot(towardSpawn) < 0) portalForward.negate();
    portalLeft.crossVectors(portalForward, worldUp).normalize();
    direction.copy(towardSpawn);
    if (direction.lengthSq() < 1e-8) direction.copy(portalForward);
    direction.normalize();
    object.position.copy(portalPosition).addScaledVector(direction, settings.distanceFromPortal)
      .addScaledVector(portalForward, settings.forwardOffset ?? 1);
    object.position.y = settings.floorOffset;
    object.quaternion.copy(portalQuaternion);
    object.visible = true;
    object.updateWorldMatrix(true, true);
    updateButtonPlacement();
    object.updateWorldMatrix(true, true);
    return true;
  }

  function reset() { if (!disposed) place(); }

  function attachCompanion({ id, model: companionModel, settings: placementSettings = settings.buttons, side = 'left' }) {
    if (!companionModel || !id || companions.has(id) || !['left', 'right'].includes(side)) return null;
    const placementRoot = new THREE.Group();
    placementRoot.name = `VrReliquary${id[0].toUpperCase()}${id.slice(1)}ButtonPlacementRoot`;
    const scaleRoot = new THREE.Group();
    scaleRoot.name = `VrReliquary${id[0].toUpperCase()}${id.slice(1)}ButtonScaleRoot`;
    placementRoot.add(scaleRoot);
    authoredRoot.add(placementRoot);
    scaleRoot.add(companionModel);
    const companionBounds = getCompanionVisibleBounds(companionModel);
    if (!companionBounds.isEmpty()) {
      const center = companionBounds.getCenter(new THREE.Vector3());
      companionModel.position.x -= center.x;
      companionModel.position.y -= companionBounds.min.y;
      companionModel.position.z -= center.z;
    }
    scaleRoot.scale.setScalar(placementSettings?.scale ?? 0.3);
    const companion = { placementRoot, scaleRoot, model: companionModel, visibleBounds: companionBounds, settings: placementSettings, side };
    companions.set(id, companion);
    object.updateWorldMatrix(true, true);
    updateButtonPlacement();
    return companion;
  }

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
  return { object, authoredRoot, model, insertZone, crystalAnchor, hasValidInsertZone, portalForward, portalLeft, place, reset, dispose,
    attachCompanion,
    get buttonPlacementRoot() { return companions.get('activate')?.placementRoot ?? null; },
    getInsertZoneWorldSphere, getCrystalAnchorWorldPosition };
}
