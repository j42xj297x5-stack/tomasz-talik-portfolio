import * as THREE from '../vendor/three.js';

export function isEffectivelyVisible(object) {
  for (let current = object; current; current = current.parent) {
    if (current.visible === false) return false;
  }
  return true;
}

export function hashVrPageId(id) {
  let hash = 2166136261;
  for (const character of String(id)) {
    hash ^= character.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

const unit = (hash, shift = 0) => ((hash >>> shift) & 0xff) / 255;

export function calculateVrCrystalSpawnPosition({ glyphWorldPosition, centerWorldPosition, inwardOffset }) {
  const position = glyphWorldPosition.clone();
  const inward = centerWorldPosition.clone().sub(glyphWorldPosition);
  if (inward.lengthSq() > 1e-8) position.addScaledVector(inward.normalize(), inwardOffset);
  return position;
}

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

export function getVrCrystalLayout(pageIds, settings) {
  const count = pageIds.length;
  const rowSizes = count <= 3 ? [count] : count === 4 ? [2, 2] : [3, count - 3];
  const widestRow = Math.max(...rowSizes, 1);
  const horizontalSpacing = widestRow > 1
    ? Math.max(settings.minimumSpacing, settings.spawnWidth / (widestRow - 1) * 0.76)
    : 0;
  const depthSpacing = rowSizes.length > 1
    ? Math.max(settings.minimumSpacing, settings.spawnDepth * 0.5)
    : 0;
  const positions = [];
  rowSizes.forEach((rowSize, rowIndex) => {
    const z = (rowIndex - (rowSizes.length - 1) / 2) * depthSpacing;
    for (let column = 0; column < rowSize; column += 1) {
      positions.push({
        id: pageIds[positions.length],
        x: (column - (rowSize - 1) / 2) * horizontalSpacing,
        z
      });
    }
  });
  return positions;
}

export function createVrCrystalCollection({ scene, assetManager, controllers, portalDisplay, insertionTarget, settings, pages = [], progressionController, onPreview, onCommit }) {
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
  let fallbackAnchor = null;
  let warnedFallbackAnchor = false;

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
    if (inSocket) {
      if (insertedInstance) {
        scene.attach(instance.object);
        instance.state = 'available';
        return instance;
      }
      if (progressionController && !progressionController.canInsertCrystal(instance.branchId, instance.tier)) {
        scene.attach(instance.object);
        instance.state = 'available';
        return instance;
      }
      let anchor = insertionSphere && insertionTarget?.crystalAnchor ? insertionTarget.crystalAnchor : null;
      if (!anchor) {
        if (!warnedFallbackAnchor) {
          console.warn('[Experience VR] Valid reliquary anchor is unavailable; using a visible runtime fallback anchor.');
          warnedFallbackAnchor = true;
        }
        if (!fallbackAnchor) {
          fallbackAnchor = new THREE.Object3D();
          fallbackAnchor.name = 'VrReliquaryCrystalFallbackAnchor';
          (insertionTarget?.object ?? scene).add(fallbackAnchor);
        }
        const worldPosition = insertionSphere?.center ?? portalDisplay.getSocketWorldPosition(scratch);
        fallbackAnchor.position.copy(worldPosition);
        fallbackAnchor.parent?.worldToLocal(fallbackAnchor.position);
        anchor = fallbackAnchor;
      }
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
      if (!isEffectivelyVisible(instance.object)) {
        if (!warnedFallbackAnchor) {
          console.warn('[Experience VR] Inserted crystal inherited an invisible parent; using a visible runtime fallback anchor.');
          warnedFallbackAnchor = true;
        }
        if (!fallbackAnchor) {
          fallbackAnchor = new THREE.Object3D();
          fallbackAnchor.name = 'VrReliquaryCrystalFallbackAnchor';
          fallbackAnchor.visible = true;
          (insertionTarget?.authoredRoot ?? insertionTarget?.object ?? scene).add(fallbackAnchor);
        }
        fallbackAnchor.attach(instance.object);
        instance.object.visible = true;
      }
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

  function spawnOne(branchId, spawnFrame) {
    const requestedDefinition = typeof branchId === 'object' ? branchId : null;
    branchId = requestedDefinition?.glyphId ?? requestedDefinition?.branchId ?? branchId;
    const definition = pages.filter((page) => page.glyphId === branchId)
      .sort((a, b) => a.order - b.order)
      .find((page) => !progressionController?.hasActivatedPage(page.id)
        && !instances.some((instance) => instance.branchId === branchId && instance.tier === page.order && instance.state !== 'released'))
      ?? (requestedDefinition && !instances.some((instance) => instance.branchId === branchId
        && instance.tier === (requestedDefinition.order ?? requestedDefinition.tier ?? 1) && instance.state !== 'released')
        ? requestedDefinition : null);
    if (disposed || !settings.enabled || !definition) return null;
    const center = calculateVrCrystalSpawnPosition({
      glyphWorldPosition: spawnFrame.glyphWorldPosition,
      centerWorldPosition: spawnFrame.centerWorldPosition,
      inwardOffset: settings.spawnInwardOffset
    });
    const forward = spawnFrame.centerWorldPosition.clone().sub(spawnFrame.glyphWorldPosition); forward.y = 0;
    if (forward.lengthSq() < 1e-8) forward.set(0, 0, -1); forward.normalize();
    const right = new THREE.Vector3(-forward.z, 0, forward.x);
    let targetPosition = center.clone();
    for (let slot = 0; slot < 200; slot += 1) {
      const ring = Math.ceil(Math.sqrt(slot));
      const angle = slot * Math.PI * (3 - Math.sqrt(5));
      const candidate = center.clone().addScaledVector(right, Math.cos(angle) * ring * settings.minimumSpacing)
        .addScaledVector(forward, Math.sin(angle) * ring * settings.minimumSpacing);
      if (instances.every(({ state, targetPosition: occupied }) => state === 'released' || candidate.distanceTo(occupied) >= settings.minimumSpacing - 1e-8)) {
        targetPosition = candidate; break;
      }
    }
    {
      const source = assetManager.cloneGltfScene(definition.crystalAssetId);
      if (!source) return null;
      const object = new THREE.Group();
      const tier = definition.order ?? definition.tier ?? 1;
      const crystalId = `vr-crystal-instance-${branchId}-${tier}-${instances.length + 1}`;
      object.name = `VrCrystal:${crystalId}`;
      const model = source.clone(true);
      object.add(model);
      const transform = getDeterministicCrystalTransform(crystalId, settings);
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
      object.position.copy(targetPosition);
      object.position.y -= settings.materializeRise;
      object.scale.setScalar(settings.materializeStartScale);
      const materializeYaw = (unit(hashVrPageId(crystalId), 6) - 0.5) * 2 * settings.materializeYaw;
      object.rotation.y = -materializeYaw;
      scene.add(object);
      const instance = { crystalId, glyphId: branchId, branchId, tier, visualVariant: definition.visualVariant,
        crystalAssetId: definition.crystalAssetId, object, model, state: 'materializing', heldBy: null, highlighted: false,
        materializeElapsed: 0, materializeYaw, targetPosition, initialTransform: object.matrix.clone() };
      instances.push(instance);
      object.traverse((child) => objectToCrystal.set(child, instance));
      return instance;
    }
  }

  function spawn(branchIds, { anchorObject, spawnPosition }) {
    if (disposed || !settings.enabled) return [];
    const anchorCenter = new THREE.Box3().setFromObject(anchorObject).getCenter(new THREE.Vector3());
    const position = new THREE.Vector3(spawnPosition.x, spawnPosition.y, spawnPosition.z);
    return branchIds.map((branchId, index) => {
      const instance = spawnOne(branchId, { glyphWorldPosition: position, centerWorldPosition: anchorCenter });
      if (instance) instance.materializeElapsed = -index * settings.materializeStagger;
      return instance;
    }).filter(Boolean);
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
    const page = progressionController?.getNextPage(insertedInstance.branchId, insertedInstance.tier);
    if (!page) return false;
    insertedInstance.state = 'active';
    insertedInstance.previewPage = page;
    onPreview?.(page);
    return true;
  }

  function releaseInserted() {
    const instance = insertedInstance;
    if (!instance || !['inserted', 'active'].includes(instance.state)) return false;
    if (instance.state === 'inserted') {
      scene.attach(instance.object);
      instance.state = 'available';
    } else {
      const page = instance.previewPage;
      if (!progressionController?.commitPage(page)) return false;
      onCommit?.(page);
      delete instance.previewPage;
      instance.state = 'released';
      instance.object.visible = false;
      instance.object.removeFromParent();
    }
    insertedInstance = null;
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

  return { instances, heldByController, spawn, spawnOne, update, grab, release, getInsertedInstance, activateInserted,
    releaseInserted, reset, dispose };
}
