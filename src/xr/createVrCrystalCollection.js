import * as THREE from '../vendor/three.js';
import { createVrTargetHalo } from './createVrTargetHalo.js';

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

// Matches the stable element colors used by the five progress-floor sectors.
export const VR_CRYSTAL_CONSUME_COLORS = Object.freeze({
  'ethics-life-protection': 0xc8752a,
  'creative-ai': 0xff4b2b,
  'ai-guide': 0x29e86f,
  'spotify-digger': 0x8cd1ff,
  'haiku-cosmos': 0x35a9ff
});

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

export function createVrCrystalCollection({ scene, assetManager, controllers, portalDisplay, insertionTarget, settings,
  haloSettings = {}, insertFeedbackSettings = {}, pages = [], progressionController, onPreview, onCommit,
  onInsertAccepted = () => {}, canGrabController = () => true, canUseReliquary = () => true }) {
  const instances = [];
  const listeners = [];
  const heldByController = new Map();
  const objectToCrystal = new Map();
  const raycaster = new THREE.Raycaster();
  const rayOrigin = new THREE.Vector3();
  const rayDirection = new THREE.Vector3();
  const rayQuaternion = new THREE.Quaternion();
  const scratch = new THREE.Vector3();
  const holdRotationDegrees = settings.holdRotationDegrees ?? { x: 0, y: 0, z: 0 };
  const targetQuaternion = new THREE.Quaternion().setFromEuler(new THREE.Euler(
    THREE.MathUtils.degToRad(holdRotationDegrees.x),
    THREE.MathUtils.degToRad(holdRotationDegrees.y),
    THREE.MathUtils.degToRad(holdRotationDegrees.z)
  ));
  const crystalCenterScratch = new THREE.Vector3();
  let disposed = false;
  let insertedInstance = null;
  let fallbackAnchor = null;
  let warnedFallbackAnchor = false;

  function removeConsumeEffect(instance) {
    const effect = instance.consumeEffect;
    if (!effect) return;
    effect.points.removeFromParent();
    effect.geometry.dispose();
    effect.material.dispose();
    instance.consumeEffect = null;
  }

  function createConsumeEffect(instance) {
    const count = Math.max(1, Math.round(settings.consumeParticleCount ?? 14));
    const positions = new Float32Array(count * 3);
    const phases = new Float32Array(count);
    const radii = new Float32Array(count);
    const heights = new Float32Array(count);
    const seed = hashVrPageId(instance.crystalId);
    for (let index = 0; index < count; index += 1) {
      phases[index] = (index / count) * Math.PI * 2 + unit(seed, index % 24) * 0.35;
      radii[index] = 0.075 + unit(seed, (index * 5) % 24) * 0.045;
      heights[index] = (unit(seed, (index * 7) % 24) - 0.5) * 0.16;
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const material = new THREE.PointsMaterial({
      color: VR_CRYSTAL_CONSUME_COLORS[instance.branchId] ?? 0xffffff,
      size: settings.consumeParticleSize ?? 0.025,
      transparent: true,
      opacity: 0.9,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });
    const points = new THREE.Points(geometry, material);
    points.name = `VrCrystalConsumeEffect:${instance.crystalId}`;
    instance.object.parent.add(points);
    points.position.copy(instance.object.position);
    points.quaternion.copy(instance.object.quaternion);
    instance.consumeEffect = { points, geometry, material, positions, phases, radii, heights };
  }

  function clearControllerHit(controllerRecord) {
    controllerRecord.currentCrystalHit = null;
    controllerRecord.currentCrystalHitDistance = null;
  }

  function setHighlighted(instance, highlighted) {
    if (!instance || instance.highlighted === highlighted) return;
    instance.highlighted = highlighted;
    instance.halo.setVisible(highlighted);
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
      raycaster.near = 0;
      raycaster.far = controllerRecord.currentRayLength;
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
          controllerRecord.reportRayHit?.(intersection.distance);
          targeted.add(instance);
          break;
        }
      }
    }
    for (const instance of instances) setHighlighted(instance, instance.state === 'available' && targeted.has(instance));
  }

  function grab(controllerRecord) {
    if (disposed || heldByController.has(controllerRecord) || !canGrabController(controllerRecord)) return null;
    const instance = controllerRecord.currentCrystalHit;
    if (!instance || instance.state !== 'available'
      || controllerRecord.currentCrystalHitDistance == null
      || controllerRecord.currentCrystalHitDistance > controllerRecord.currentRayLength
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
    insertionTarget?.setInsertFeedback?.(null);
    if (instance.state === 'pulling') {
      scene.attach(instance.object);
      instance.state = 'available';
      return instance;
    }
    if (instance.transient) {
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
      if (!canUseReliquary()) {
        scene.attach(instance.object);
        instance.state = 'available';
        return instance;
      }
      if (insertedInstance) {
        scene.attach(instance.object);
        instance.state = 'available';
        return instance;
      }
      if (progressionController && !progressionController.canInsertCrystal(instance.branchId, instance.tier)) {
        scene.attach(instance.object);
        instance.state = 'rejecting';
        instance.rejectElapsed = 0;
        instance.rejectStartPosition = instance.object.position.clone();
        const rejectSphere = insertionSphere ?? new THREE.Sphere(
          portalDisplay.getSocketWorldPosition(new THREE.Vector3()), portalDisplay.insertRadius);
        const direction = crystalCenter.clone().sub(rejectSphere.center);
        if (direction.lengthSq() < 1e-8) direction.copy(insertionTarget?.portalForward ?? new THREE.Vector3(0, 0, 1));
        direction.normalize();
        const endCenter = rejectSphere.center.clone().addScaledVector(direction,
          rejectSphere.radius + (insertFeedbackSettings.rejectDistance ?? 0.25));
        instance.rejectEndPosition = instance.object.position.clone().add(endCenter.sub(crystalCenter));
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
      onInsertAccepted(instance);
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
      instance.halo = createVrTargetHalo({ root: model, settings: haloSettings });
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

  function spawnTransientTutorialCrystal(definition, spawnPosition) {
    if (!definition || instances.some((instance) => instance.transient && instance.state !== 'released')) return null;
    const instance = spawnOne(definition, {
      glyphWorldPosition: spawnPosition,
      centerWorldPosition: spawnPosition
    });
    if (!instance) return null;
    instance.transient = true;
    instance.progressionEligible = false;
    delete instance.glyphId;
    delete instance.tier;
    instance.targetPosition.copy(spawnPosition);
    instance.object.position.x = spawnPosition.x;
    instance.object.position.z = spawnPosition.z;
    return instance;
  }

  function isHeld(instance) {
    return Boolean(instance?.transient && instance.heldBy && heldByController.get(instance.heldBy) === instance
      && ['pulling', 'held'].includes(instance.state));
  }

  function getWorldPosition(instance, target = new THREE.Vector3()) {
    return instance?.object?.getWorldPosition(target) ?? target.setScalar(Infinity);
  }

  function takeoverAndConsumeTransient(instance) {
    if (!instance?.transient || instance.state === 'consuming' || instance.state === 'released') return false;
    if (!isHeld(instance)) return false;
    heldByController.delete(instance.heldBy);
    instance.heldBy = null;
    scene.attach(instance.object);
    instance.state = 'consuming';
    instance.consumeElapsed = 0;
    instance.consumeStartScale = instance.object.scale.clone();
    instance.consumeStartYaw = instance.object.rotation.y;
    createConsumeEffect(instance);
    return true;
  }

  function removeTransientCrystal(instance) {
    if (!instance?.transient) return false;
    if (instance.heldBy) heldByController.delete(instance.heldBy);
    instance.heldBy = null;
    setHighlighted(instance, false);
    removeConsumeEffect(instance);
    instance.halo.dispose();
    instance.state = 'released';
    instance.object.visible = false;
    instance.object.removeFromParent();
    instance.object.traverse((child) => objectToCrystal.delete(child));
    const index = instances.indexOf(instance);
    if (index >= 0) instances.splice(index, 1);
    controllers.forEach((record) => { if (record.currentCrystalHit === instance) clearControllerHit(record); });
    return true;
  }

  function update(delta = 0) {
    if (disposed || !instances.length) {
      controllers.forEach(clearControllerHit);
      insertionTarget?.setInsertFeedback?.(null);
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
    for (const instance of instances) {
      if (instance.state !== 'rejecting') continue;
      instance.rejectElapsed += elapsedDelta;
      const progress = Math.min(1, instance.rejectElapsed / (insertFeedbackSettings.rejectDuration ?? 0.35));
      const eased = 1 - ((1 - progress) ** 3);
      instance.object.position.lerpVectors(instance.rejectStartPosition, instance.rejectEndPosition, eased);
      if (progress === 1) instance.state = 'available';
    }
    for (const instance of instances) {
      if (instance.state !== 'consuming') continue;
      instance.consumeElapsed += elapsedDelta;
      const progress = Math.min(1, instance.consumeElapsed / settings.consumeDuration);
      const eased = progress * progress * (3 - 2 * progress);
      instance.object.scale.copy(instance.consumeStartScale).multiplyScalar(Math.max(0, 1 - eased));
      instance.object.rotation.y = instance.consumeStartYaw + eased * 0.12;
      const effect = instance.consumeEffect;
      if (effect) {
        const expansion = 1 + eased * 0.45;
        for (let index = 0; index < effect.phases.length; index += 1) {
          const angle = effect.phases[index] + progress * Math.PI * 1.8;
          const radius = effect.radii[index] * expansion;
          effect.positions[index * 3] = Math.cos(angle) * radius;
          effect.positions[index * 3 + 1] = effect.heights[index] + Math.sin(angle * 1.7) * 0.025;
          effect.positions[index * 3 + 2] = Math.sin(angle) * radius;
        }
        effect.geometry.attributes.position.needsUpdate = true;
        effect.material.opacity = 0.9 * (1 - eased);
        effect.points.rotation.y = progress * 0.7;
      }
      if (progress === 1) {
        removeConsumeEffect(instance);
        instance.state = 'released';
        instance.object.visible = false;
        instance.object.removeFromParent();
      }
    }
    updateTargets();
    instances.forEach(({ halo }) => halo.update(elapsedDelta));
    let feedbackState = null;
    for (const instance of heldByController.values()) {
      if (!['pulling', 'held'].includes(instance.state)) continue;
      if (instance.state === 'pulling') {
        instance.pullElapsed += Math.max(0, delta);
        const progress = Math.min(1, instance.pullElapsed / settings.pullDuration);
        const eased = progress * progress * (3 - 2 * progress);
        instance.object.position.lerpVectors(instance.pullStartPosition, settings.holdOffset, eased);
        instance.object.quaternion.slerpQuaternions(instance.pullStartQuaternion, targetQuaternion, eased);
        if (progress === 1) instance.state = 'held';
      }
      instance.model.updateWorldMatrix(true, true);
      const sphere = insertionTarget?.hasValidInsertZone && insertionTarget.object.visible
        ? insertionTarget.getInsertZoneWorldSphere?.() : null;
      const center = new THREE.Box3().setFromObject(instance.model).getCenter(crystalCenterScratch);
      if (sphere && center.distanceTo(sphere.center) <= sphere.radius
        * (insertFeedbackSettings.proximityRadiusMultiplier ?? 1.25)) {
        feedbackState = canUseReliquary() && !insertedInstance && (!progressionController
          || progressionController.canInsertCrystal(instance.branchId, instance.tier)) ? 'VALID' : 'INVALID';
      }
    }
    insertionTarget?.setInsertFeedback?.(feedbackState);
  }

  function reset() {
    insertionTarget?.setInsertFeedback?.(null);
    controllers.forEach(clearControllerHit);
    heldByController.clear();
    for (const instance of instances) {
      setHighlighted(instance, false);
      removeConsumeEffect(instance);
      instance.halo.dispose();
      instance.heldBy = null;
      instance.state = 'available';
      instance.object.visible = false;
      instance.object.removeFromParent();
    }
    objectToCrystal.clear();
    instances.length = 0;
    insertedInstance = null;
  }

  function hydrateScenarioState(state) {
    if (state?.consumedTier !== 1) throw new Error('Crystal collection only supports consumed Tier 1 hydration');
    reset();
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
      onCommit?.(page, { tierCompleted: progressionController.isTierComplete(page.order) });
      delete instance.previewPage;
      instance.state = 'consuming';
      instance.consumeElapsed = 0;
      instance.consumeStartScale = instance.object.scale.clone();
      instance.consumeStartYaw = instance.object.rotation.y;
      createConsumeEffect(instance);
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

  return { instances, heldByController, spawn, spawnOne, spawnTransientTutorialCrystal, isHeld, getWorldPosition,
    takeoverAndConsumeTransient, removeTransientCrystal, update, grab, release, getInsertedInstance, activateInserted,
    releaseInserted, reset, hydrateScenarioState, dispose };
}
