import * as THREE from '../vendor/three.js';

export function hashVrPageId(id) {
  let hash = 2166136261;
  for (const character of String(id)) {
    hash ^= character.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

const unit = (hash, shift = 0) => ((hash >>> shift) & 0xff) / 255;

export function getDeterministicCrystalTransform(pageId, settings) {
  const hash = hashVrPageId(pageId);
  return {
    scale: settings.scaleMin + unit(hash) * (settings.scaleMax - settings.scaleMin),
    x: (unit(hash, 8) - 0.5) * settings.spawnWidth,
    z: (unit(hash, 16) - 0.5) * settings.spawnDepth,
    yaw: (unit(hash, 4) - 0.5) * 0.34,
    tiltX: (unit(hash, 12) - 0.5) * 0.08,
    tiltZ: (unit(hash, 20) - 0.5) * 0.08
  };
}

export function createVrCrystalCollection({ scene, assetManager, controllers, portalDisplay, insertionTarget, settings, onActivate, onConsume }) {
  const instances = [];
  const listeners = [];
  const heldByController = new Map();
  const objectToCrystal = new Map();
  const raycaster = new THREE.Raycaster();
  const rayOrigin = new THREE.Vector3();
  const rayDirection = new THREE.Vector3();
  const rayQuaternion = new THREE.Quaternion();
  const scratch = new THREE.Vector3();
  const targetQuaternion = new THREE.Quaternion();
  let disposed = false;
  let insertedInstance = null;
  const activationCallback = onActivate ?? onConsume;

  function clearControllerHit(controllerRecord) {
    controllerRecord.currentCrystalHit = null;
    controllerRecord.currentCrystalHitDistance = null;
  }

  function setHighlighted(instance, highlighted) {
    if (!instance || instance.highlighted === highlighted) return;
    instance.highlighted = highlighted;
    instance.object.scale.setScalar(highlighted ? settings.targetScale : 1);
  }

  function updateTargets() {
    const targeted = new Set();
    const raycastObjects = instances.filter(({ state, object }) => state === 'available' && object.visible).map(({ object }) => object);
    for (const controllerRecord of controllers) {
      clearControllerHit(controllerRecord);
      if (!raycastObjects.length) continue;
      controllerRecord.controller.updateWorldMatrix(true, false);
      controllerRecord.controller.getWorldPosition(rayOrigin);
      controllerRecord.controller.getWorldQuaternion(rayQuaternion);
      rayDirection.set(0, 0, -1).applyQuaternion(rayQuaternion).normalize();
      raycaster.set(rayOrigin, rayDirection);
      const intersections = raycaster.intersectObjects(raycastObjects, true);
      for (const intersection of intersections) {
        let object = intersection.object;
        let instance = null;
        while (object && !instance) {
          instance = objectToCrystal.get(object) ?? null;
          object = object.parent;
        }
        if (instance?.state === 'available') {
          controllerRecord.currentCrystalHit = instance;
          controllerRecord.currentCrystalHitDistance = intersection.distance;
          targeted.add(instance);
          break;
        }
      }
    }
    for (const instance of instances) setHighlighted(instance, instance.state === 'available' && targeted.has(instance));
  }

  function grab(controllerRecord) {
    if (disposed || heldByController.has(controllerRecord)) return null;
    const instance = controllerRecord.currentCrystalHit;
    if (!instance || instance.state !== 'available'
      || controllerRecord.currentCrystalHitDistance == null
      || controllerRecord.currentCrystalHitDistance > settings.rayGrabMaxDistance
      || instance.heldBy) return null;
    setHighlighted(instance, false);
    instance.state = 'pulling';
    instance.heldBy = controllerRecord;
    heldByController.set(controllerRecord, instance);
    controllerRecord.holdSocket.attach(instance.object);
    instance.pullElapsed = 0;
    instance.pullStartPosition = instance.object.position.clone();
    instance.pullStartQuaternion = instance.object.quaternion.clone();
    clearControllerHit(controllerRecord);
    return instance;
  }

  function release(controllerRecord) {
    const instance = heldByController.get(controllerRecord);
    if (!instance) return null;
    instance.object.updateWorldMatrix(true, false);
    heldByController.delete(controllerRecord);
    instance.heldBy = null;
    if (instance.state === 'pulling') {
      scene.attach(instance.object);
      instance.state = 'available';
      return instance;
    }
    instance.model.updateWorldMatrix(true, true);
    const crystalCenter = new THREE.Box3().setFromObject(instance.model).getCenter(rayOrigin);
    const insertionSphere = insertionTarget?.hasValidInsertZone
      ? insertionTarget.getInsertZoneWorldSphere?.()
      : null;
    const inSocket = insertionSphere && insertionTarget.object.visible
      ? insertionSphere.containsPoint(crystalCenter)
      : portalDisplay.object.visible
        && crystalCenter.distanceTo(portalDisplay.getSocketWorldPosition(scratch)) <= portalDisplay.insertRadius;
    if (inSocket && insertionSphere && insertionTarget?.crystalAnchor) {
      if (insertedInstance) {
        scene.attach(instance.object);
        instance.state = 'available';
        return instance;
      }
      const anchor = insertionTarget.crystalAnchor;
      anchor.attach(instance.object);
      anchor.updateWorldMatrix(true, true);
      instance.model.updateWorldMatrix(true, true);
      const worldCenter = new THREE.Box3().setFromObject(instance.model).getCenter(new THREE.Vector3());
      const localCenter = anchor.worldToLocal(worldCenter);
      instance.object.position.sub(localCenter);
      instance.object.updateWorldMatrix(true, true);
      instance.state = 'inserted';
      instance.object.visible = true;
      insertedInstance = instance;
    } else if (inSocket) {
      console.warn('[Experience VR] Valid reliquary anchor is unavailable; using immediate portal-socket crystal activation fallback.');
      instance.state = 'consumed';
      instance.object.visible = false;
      instance.object.removeFromParent();
      activationCallback?.(instance.page);
    } else {
      scene.attach(instance.object);
      instance.state = 'available';
    }
    return instance;
  }

  controllers.forEach((controllerRecord) => {
    clearControllerHit(controllerRecord);
    const squeezeStart = () => grab(controllerRecord);
    const squeezeEnd = () => release(controllerRecord);
    controllerRecord.controller.addEventListener('squeezestart', squeezeStart);
    controllerRecord.controller.addEventListener('squeezeend', squeezeEnd);
    listeners.push({ controllerRecord, squeezeStart, squeezeEnd });
  });

  function spawn(pages, { anchorObject, spawnPosition }) {
    reset();
    if (disposed || !settings.enabled) return [];
    const anchorCenter = new THREE.Box3().setFromObject(anchorObject).getCenter(new THREE.Vector3());
    const configuredSpawn = new THREE.Vector3(spawnPosition.x, spawnPosition.y, spawnPosition.z);
    const forward = new THREE.Vector3().subVectors(configuredSpawn, anchorCenter);
    forward.y = 0;
    if (forward.lengthSq() < 1e-8) forward.set(0, 0, -1);
    forward.normalize();
    const right = new THREE.Vector3(-forward.z, 0, forward.x);
    const center = anchorCenter.clone().addScaledVector(forward, settings.frontDistance);
    center.y = 0;
    const occupied = [];
    pages.forEach((page, index) => {
      const source = assetManager.cloneGltfScene(page.crystalAssetId);
      if (!source) return;
      const object = new THREE.Group();
      object.name = `VrCrystal:${page.id}`;
      const model = source.clone(true);
      object.add(model);
      const transform = getDeterministicCrystalTransform(page.id, settings);
      model.scale.setScalar(transform.scale);
      model.rotation.set(transform.tiltX, transform.yaw, transform.tiltZ);
      model.updateMatrixWorld(true);
      let bounds = new THREE.Box3().setFromObject(model);
      const modelCenter = bounds.getCenter(new THREE.Vector3());
      model.position.x -= modelCenter.x;
      model.position.z -= modelCenter.z;
      model.updateMatrixWorld(true);
      bounds = new THREE.Box3().setFromObject(model);
      model.position.y -= bounds.min.y;
      let x = transform.x;
      let z = transform.z;
      for (let attempt = 0; occupied.some((point) => Math.hypot(point.x - x, point.z - z) < settings.minimumSpacing) && attempt < 8; attempt += 1) {
        const angle = (hashVrPageId(page.id) * 0.00001) + attempt * 2.399;
        x = Math.max(-settings.spawnWidth / 2, Math.min(settings.spawnWidth / 2, transform.x + Math.cos(angle) * settings.minimumSpacing));
        z = Math.max(-settings.spawnDepth / 2, Math.min(settings.spawnDepth / 2, transform.z + Math.sin(angle) * settings.minimumSpacing));
      }
      occupied.push({ x, z });
      const targetPosition = center.clone().addScaledVector(right, x).addScaledVector(forward, z + (index % 2) * 0.035);
      targetPosition.y = 0;
      object.position.copy(targetPosition);
      object.position.y -= settings.materializeRise;
      object.scale.setScalar(settings.materializeStartScale);
      const materializeYaw = (unit(hashVrPageId(page.id), 6) - 0.5) * 2 * settings.materializeYaw;
      object.rotation.y = -materializeYaw;
      scene.add(object);
      const instance = { page, object, model, state: 'materializing', heldBy: null, highlighted: false,
        materializeElapsed: -index * settings.materializeStagger, materializeYaw, targetPosition, initialTransform: object.matrix.clone() };
      instances.push(instance);
      object.traverse((child) => objectToCrystal.set(child, instance));
    });
    return [...instances];
  }

  function update(delta = 0) {
    if (disposed || !instances.length) {
      controllers.forEach(clearControllerHit);
      return;
    }
    const elapsedDelta = Math.max(0, delta);
    for (const instance of instances) {
      if (instance.state !== 'materializing') continue;
      instance.materializeElapsed += elapsedDelta;
      const progress = Math.max(0, Math.min(1, instance.materializeElapsed / settings.materializeDuration));
      const eased = progress * progress * (3 - 2 * progress);
      instance.object.scale.setScalar(settings.materializeStartScale + (1 - settings.materializeStartScale) * eased);
      instance.object.position.y = instance.targetPosition.y - settings.materializeRise * (1 - eased);
      instance.object.rotation.y = instance.materializeYaw * (eased - 1);
      if (progress === 1) instance.state = 'available';
    }
    updateTargets();
    for (const instance of heldByController.values()) {
      if (instance.state !== 'pulling') continue;
      instance.pullElapsed += Math.max(0, delta);
      const progress = Math.min(1, instance.pullElapsed / settings.pullDuration);
      const eased = progress * progress * (3 - 2 * progress);
      instance.object.position.lerpVectors(instance.pullStartPosition, settings.holdOffset, eased);
      instance.object.quaternion.slerpQuaternions(instance.pullStartQuaternion, targetQuaternion, eased);
      if (progress === 1) instance.state = 'held';
    }
  }

  function reset() {
    controllers.forEach(clearControllerHit);
    heldByController.clear();
    for (const instance of instances) {
      setHighlighted(instance, false);
      instance.heldBy = null;
      instance.state = 'available';
      instance.object.visible = false;
      instance.object.removeFromParent();
    }
    objectToCrystal.clear();
    instances.length = 0;
    insertedInstance = null;
  }

  function getInsertedInstance() { return insertedInstance; }

  function activateInserted() {
    if (!insertedInstance || insertedInstance.state !== 'inserted') return false;
    insertedInstance.state = 'active';
    activationCallback?.(insertedInstance.page);
    return true;
  }

  function dispose() {
    if (disposed) return;
    reset();
    disposed = true;
    for (const { controllerRecord, squeezeStart, squeezeEnd } of listeners) {
      controllerRecord.controller.removeEventListener('squeezestart', squeezeStart);
      controllerRecord.controller.removeEventListener('squeezeend', squeezeEnd);
    }
    listeners.length = 0;
  }

  return { instances, heldByController, spawn, update, grab, release, getInsertedInstance, activateInserted, reset, dispose };
}
