import * as THREE from '../vendor/three.js';
import { applyWorldTransform } from './applyWorldTransform.js';

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

export function createVrCrystalReliquary({ parent, reliquaryModel, settings }) {
  const object = new THREE.Group();
  object.name = 'VrCrystalReliquary';
  parent.add(object);
  const modelRoot = new THREE.Group();
  modelRoot.name = 'VrCrystalReliquaryModelRoot';
  modelRoot.position.y = settings.heightOffset ?? 0.5;
  object.add(modelRoot);
  const authoredRoot = new THREE.Group();
  authoredRoot.name = 'VrCrystalReliquaryAuthoredRoot';
  modelRoot.add(authoredRoot);
  const companionsRoot = new THREE.Group();
  companionsRoot.name = 'VrCrystalReliquaryCompanionsRoot';
  object.add(companionsRoot);
  const model = reliquaryModel ?? null;
  const insertZone = findNamedObject(model, INSERT_ZONE_NAME);
  const authoredCrystalAnchor = findNamedObject(model, ANCHOR_NAME);
  const hasValidInsertZone = Boolean(insertZone?.isMesh && insertZone.geometry
    && roleIsValid(insertZone, 'crystal_insert_zone'));
  const hasValidAnchor = Boolean(authoredCrystalAnchor && roleIsValid(authoredCrystalAnchor, 'crystal_display_anchor'));
  if (insertZone) insertZone.visible = false;
  const feedbackMaterial = new THREE.MeshStandardMaterial({
    color: 0x49d17d, emissive: 0x49d17d, emissiveIntensity: 0.35,
    transparent: true, opacity: settings.insertFeedback?.opacity ?? 0.2,
    depthWrite: false, blending: THREE.NormalBlending
  });
  const insertFeedback = new THREE.Mesh(new THREE.SphereGeometry(1, 24, 16), feedbackMaterial);
  insertFeedback.name = 'VrReliquaryInsertFeedback';
  insertFeedback.visible = false;
  insertFeedback.userData.feedbackState = null;
  parent.add(insertFeedback);
  if (!model || !hasValidInsertZone || !hasValidAnchor) {
    console.warn('[Experience VR] Crystal reliquary model, insert zone, or anchor is missing or invalid. The portal crystal socket remains available when the insert zone cannot be used.');
  }

  const visibleBounds = getReliquaryVisibleBounds(model, insertZone);
  if (model && !visibleBounds.isEmpty()) {
    const center = visibleBounds.getCenter(new THREE.Vector3());
    authoredRoot.position.set(-center.x, -visibleBounds.min.y, -center.z);
    authoredRoot.add(model);
  }
  const runtimeCrystalAnchor = new THREE.Object3D();
  runtimeCrystalAnchor.name = 'VrReliquaryCrystalDisplayAnchor';
  runtimeCrystalAnchor.visible = true;
  authoredRoot.add(runtimeCrystalAnchor);
  if (authoredCrystalAnchor && model?.parent) {
    authoredRoot.updateWorldMatrix(true, false);
    authoredCrystalAnchor.updateWorldMatrix(true, false);
    const localMatrix = authoredRoot.matrixWorld.clone().invert().multiply(authoredCrystalAnchor.matrixWorld);
    localMatrix.decompose(runtimeCrystalAnchor.position, runtimeCrystalAnchor.quaternion, runtimeCrystalAnchor.scale);
  }

  const portalForward = new THREE.Vector3();
  const portalLeft = new THREE.Vector3();
  const portalQuaternion = new THREE.Quaternion();
  const inversePlacementQuaternion = new THREE.Quaternion();
  const buttonWorldOffset = new THREE.Vector3();
  const worldUp = new THREE.Vector3(0, 1, 0);
  const worldScale = new THREE.Vector3();
  const insertFeedbackWorldScale = new THREE.Vector3();
  const companions = new Map();
  let disposed = false;

  function updateButtonPlacement() {
    companionsRoot.getWorldQuaternion(inversePlacementQuaternion).invert();
    for (const companion of companions.values()) {
      const placement = companion.settings ?? settings.buttons ?? {};
      const sideSign = companion.side === 'right' ? -1 : 1;
      buttonWorldOffset.copy(portalForward).multiplyScalar(placement.forwardDistance ?? 1)
        .addScaledVector(portalLeft, sideSign * (placement.lateralOffset ?? 0.5));
      buttonWorldOffset.y = placement.verticalOffset ?? 0;
      companion.placementRoot.position.copy(buttonWorldOffset).applyQuaternion(inversePlacementQuaternion);
    }
  }

  function place() {
    if (disposed || !settings.enabled || !model || visibleBounds.isEmpty()) {
      object.visible = false;
      return false;
    }
    const position = settings.position ?? { x: 0, y: 0, z: 0 };
    const rotation = settings.rotationDegrees ?? { x: 0, y: 0, z: 0 };
    object.position.set(position.x, position.y, position.z);
    object.rotation.set(
      THREE.MathUtils.degToRad(rotation.x),
      THREE.MathUtils.degToRad(rotation.y),
      THREE.MathUtils.degToRad(rotation.z)
    );
    object.getWorldQuaternion(portalQuaternion);
    portalForward.set(0, 0, 1).applyQuaternion(portalQuaternion).setY(0).normalize();
    portalLeft.crossVectors(portalForward, worldUp).normalize();
    modelRoot.position.y = settings.heightOffset ?? 0.5;
    object.visible = true;
    object.updateWorldMatrix(true, true);
    updateButtonPlacement();
    object.updateWorldMatrix(true, true);
    return true;
  }

  function reset() {
    if (!disposed) {
      setInsertFeedback(null);
      place();
    }
  }

  function attachCompanion({ id, model: companionModel, settings: placementSettings = settings.buttons, side = 'left' }) {
    if (!companionModel || !id || companions.has(id) || !['left', 'right'].includes(side)) return null;
    const placementRoot = new THREE.Group();
    placementRoot.name = `VrReliquary${id[0].toUpperCase()}${id.slice(1)}ButtonPlacementRoot`;
    const scaleRoot = new THREE.Group();
    scaleRoot.name = `VrReliquary${id[0].toUpperCase()}${id.slice(1)}ButtonScaleRoot`;
    placementRoot.add(scaleRoot);
    companionsRoot.add(placementRoot);
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
    if (!hasValidAnchor) return null;
    runtimeCrystalAnchor.updateWorldMatrix(true, false);
    return runtimeCrystalAnchor.getWorldPosition(targetVector);
  }

  function setInsertFeedback(state = null) {
    if (disposed || !['VALID', 'INVALID'].includes(state) || !object.visible) {
      insertFeedback.visible = false;
      insertFeedback.userData.feedbackState = null;
      return false;
    }
    const sphere = getInsertZoneWorldSphere();
    if (!sphere) return false;
    insertFeedbackWorldScale.setScalar(sphere.radius);
    applyWorldTransform(insertFeedback, sphere.center, insertFeedback.quaternion, insertFeedbackWorldScale);
    const color = state === 'VALID' ? 0x49d17d : 0xe05252;
    feedbackMaterial.color.setHex(color);
    feedbackMaterial.emissive.setHex(color);
    insertFeedback.userData.feedbackState = state;
    insertFeedback.visible = true;
    return true;
  }

  function dispose() {
    if (disposed) return;
    disposed = true;
    object.visible = false;
    object.removeFromParent();
    insertFeedback.removeFromParent();
    insertFeedback.geometry.dispose();
    feedbackMaterial.dispose();
  }

  place();
  return { object, modelRoot, authoredRoot, companionsRoot, model, insertZone, authoredCrystalAnchor, crystalAnchor: runtimeCrystalAnchor,
    runtimeCrystalAnchor, hasValidInsertZone, portalForward, portalLeft, place, reset, dispose,
    attachCompanion,
    get buttonPlacementRoot() { return companions.get('activate')?.placementRoot ?? null; },
    insertFeedback, setInsertFeedback, getInsertZoneWorldSphere, getCrystalAnchorWorldPosition };
}
