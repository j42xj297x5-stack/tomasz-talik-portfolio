import * as THREE from '../../vendor/three.js';
import { createVrSphericalLayerActor } from '../world/createVrSphericalLayerActor.js';

const PRESENTATION_STATE = Object.freeze({
  IDLE: 'IDLE',
  PRESENTING: 'PRESENTING',
  PRESENTED: 'PRESENTED'
});

const GLYPH_STATE = Object.freeze({
  HIDDEN: 'HIDDEN',
  FIELD: 'FIELD',
  PLACED: 'PLACED',
  CONSUMED: 'CONSUMED'
});

export function createVrSmallGlyphSystem({
  parent,
  assetManager,
  assetIds,
  copiesPerVisualVariant,
  layer,
  angularSpeed,
  selfRotationSpeed,
  direction,
  materializeDurationSeconds,
  staggerSeconds,
  revealDurationSeconds,
  idleMotionSettings = {},
  onPresentationCompleted = () => {}
}) {
  if (!parent || typeof parent.add !== 'function') throw new TypeError('parent.add must be a function');
  if (!assetManager || typeof assetManager.cloneGltfScene !== 'function') {
    throw new TypeError('assetManager.cloneGltfScene must be a function');
  }
  if (!Array.isArray(assetIds) || assetIds.length < 1
    || assetIds.some((id) => typeof id !== 'string' || id.trim() === '')
    || new Set(assetIds).size !== assetIds.length) {
    throw new TypeError('assetIds must contain unique, non-empty strings');
  }
  if (!Number.isInteger(copiesPerVisualVariant) || copiesPerVisualVariant < 1) {
    throw new TypeError('copiesPerVisualVariant must be an integer greater than or equal to 1');
  }
  if (!Number.isFinite(selfRotationSpeed) || selfRotationSpeed < 0)
    throw new TypeError('selfRotationSpeed must be finite and greater than or equal to 0');
  if (direction !== 1 && direction !== -1) throw new TypeError('direction must be 1 or -1');
  if (!Number.isFinite(materializeDurationSeconds) || materializeDurationSeconds <= 0) {
    throw new TypeError('materializeDurationSeconds must be finite and greater than 0');
  }
  if (!Number.isFinite(staggerSeconds) || staggerSeconds < 0) {
    throw new TypeError('staggerSeconds must be finite and greater than or equal to 0');
  }
  if (!Number.isFinite(revealDurationSeconds) || revealDurationSeconds <= 0) {
    throw new TypeError('revealDurationSeconds must be finite and greater than 0');
  }
  if (typeof onPresentationCompleted !== 'function') throw new TypeError('onPresentationCompleted must be a function');

  const instanceCount = assetIds.length * copiesPerVisualVariant;
  const layerActor = createVrSphericalLayerActor({ parent, layer, slotCount: instanceCount, angularSpeed, direction });
  const object = new THREE.Group();
  object.name = 'VrSmallGlyphField';
  object.visible = false;
  layerActor.object.add(object);

  const records = [];
  const ownedMaterials = new Set();
  const goldenAngle = Math.PI * (3 - Math.sqrt(5));
  const idleAmplitude = idleMotionSettings.verticalAmplitude ?? 0.20;
  const idleAngularSpeed = Math.PI * 2 / (idleMotionSettings.verticalCycleDuration ?? 4.8);
  const idleRotationSpeed = idleMotionSettings.rotationSpeed ?? 0.12;

  assetIds.forEach((assetId, variantIndex) => {
    for (let copyIndex = 0; copyIndex < copiesPerVisualVariant; copyIndex += 1) {
      const index = records.length;
      const visualModel = assetManager.cloneGltfScene(assetId);
      if (!visualModel || !visualModel.position || !visualModel.quaternion || !visualModel.scale) {
        throw new Error(`Unable to clone small glyph visual variant: ${assetId}`);
      }
      const opacityBaselines = [];
      visualModel.traverse((node) => {
        if (!node.isMesh || !node.material) return;
        const cloneMaterial = (material) => {
          const clone = material.clone();
          ownedMaterials.add(clone);
          opacityBaselines.push({ material: clone, opacity: clone.opacity ?? 1, transparent: clone.transparent });
          return clone;
        };
        node.material = Array.isArray(node.material)
          ? node.material.map(cloneMaterial) : cloneMaterial(node.material);
      });
      const instance = new THREE.Group();
      instance.add(visualModel);
      object.add(instance);
      instance.updateMatrixWorld(true);
      const boundingSphere = new THREE.Box3().setFromObject(visualModel).getBoundingSphere(new THREE.Sphere());
      const visualBounds = new THREE.Box3().setFromObject(visualModel);
      if (visualBounds.isEmpty()) throw new Error(`Small glyph visual has empty bounds: ${assetId}`);
      const visualCenter = visualBounds.getCenter(new THREE.Vector3());
      if (![visualCenter.x, visualCenter.y, visualCenter.z].every(Number.isFinite)) {
        throw new Error(`Small glyph visual has invalid bounds: ${assetId}`);
      }
      instance.worldToLocal(visualCenter);
      visualModel.position.sub(visualCenter);
      instance.updateMatrixWorld(true);
      const variantLabel = String(variantIndex + 1).padStart(2, '0');
      const copyLabel = String.fromCharCode(97 + copyIndex);
      instance.name = `small-glyph-${variantLabel}-${copyLabel}`;
      instance.userData = {
        attractorId: instance.name,
        smallGlyphAssetId: assetId,
        smallGlyphVisualVariant: variantIndex + 1,
        smallGlyphCopyIndex: copyIndex,
        smallGlyphState: GLYPH_STATE.HIDDEN
      };
      instance.visible = false;
      records.push({
        instance,
        opacityBaselines,
        authoredQuaternion: instance.quaternion.clone(),
        authoredScale: instance.scale.clone(),
        slotIndex: index,
        boundingRadius: boundingSphere.radius,
        fieldPosition: new THREE.Vector3(),
        fieldQuaternion: new THREE.Quaternion(),
        placedPosition: new THREE.Vector3(),
        placedQuaternion: new THREE.Quaternion(),
        placedAt: 0,
        idlePhase: (index * goldenAngle) % (Math.PI * 2),
        idleAxis: new THREE.Vector3(Math.sin((index + 1) * 1.37), 0.65,
          Math.cos((index + 1) * 1.91)).normalize()
      });
    }
  });

  let presentationState = PRESENTATION_STATE.IDLE;
  let fieldReady = false;
  let elapsed = 0;
  let presentationElapsed = 0;
  let fieldElapsed = 0;
  let completionSent = false;
  let presentationVisible = false;
  let revealOpacity = 0;
  let revealTransition = null;
  let disposed = false;
  const idleQuaternion = new THREE.Quaternion();
  const fieldRotationQuaternion = new THREE.Quaternion();
  const fullPresentationDuration = materializeDurationSeconds + (instanceCount - 1) * staggerSeconds;

  function updateCanonicalFieldTransform(record) {
    try { record.fieldPosition.copy(layerActor.getSlotTransform(record.slotIndex, record.boundingRadius).position); }
    catch (error) { throw new Error(`Small Glyph layer ${layer.id}, asset ${record.instance.userData.smallGlyphAssetId}, bounding radius ${record.boundingRadius}, available thickness ${layer.thickness}: ${error.message}`); }
    record.fieldQuaternion.copy(record.authoredQuaternion).multiply(fieldRotationQuaternion.setFromAxisAngle(
      record.idleAxis, fieldElapsed * selfRotationSpeed * direction));
  }

  records.forEach(updateCanonicalFieldTransform);

  function applyRevealOpacity(value) {
    revealOpacity = THREE.MathUtils.clamp(value, 0, 1);
    records.forEach((record) => record.opacityBaselines.forEach((baseline) => {
      baseline.material.transparent = revealOpacity < 1 || baseline.transparent;
      baseline.material.opacity = baseline.opacity * revealOpacity;
    }));
  }

  function beginWorldReveal() {
    if (disposed || revealTransition || presentationVisible) return false;
    presentationVisible = true;
    object.visible = true;
    records.forEach((record) => {
      const glyphState = record.instance.userData.smallGlyphState;
      if (glyphState === GLYPH_STATE.HIDDEN || glyphState === GLYPH_STATE.FIELD) {
        restoreRecord(record, fieldReady ? GLYPH_STATE.FIELD : GLYPH_STATE.HIDDEN);
      }
    });
    applyRevealOpacity(0);
    revealTransition = { elapsed: 0 };
    return true;
  }

  function restoreRecord(record, glyphState, visible = true) {
    if (record.instance.parent !== object) object.add(record.instance);
    updateCanonicalFieldTransform(record);
    record.instance.position.copy(record.fieldPosition);
    record.instance.quaternion.copy(record.fieldQuaternion);
    record.instance.scale.copy(record.authoredScale);
    record.instance.visible = visible;
    record.instance.userData.smallGlyphState = glyphState;
  }

  function getFieldTransform(instance) {
    const record = records.find((candidate) => candidate.instance === instance);
    if (!record) return null;
    updateCanonicalFieldTransform(record);
    return { position: record.fieldPosition.clone(), quaternion: record.fieldQuaternion.clone(),
      scale: record.authoredScale.clone() };
  }

  function restoreInstanceToField(instance) {
    if (disposed) return false;
    const record = records.find((candidate) => candidate.instance === instance);
    if (!record) return false;
    restoreRecord(record, fieldReady ? GLYPH_STATE.FIELD : GLYPH_STATE.HIDDEN, presentationVisible);
    return true;
  }

  function setFieldReady(ready) {
    if (disposed || typeof ready !== 'boolean') return false;
    if (fieldReady === ready) return true;
    fieldReady = ready;
    records.forEach((record) => {
      const glyphState = record.instance.userData.smallGlyphState;
      if (glyphState !== GLYPH_STATE.HIDDEN && glyphState !== GLYPH_STATE.FIELD) return;
      restoreRecord(record, fieldReady ? GLYPH_STATE.FIELD : GLYPH_STATE.HIDDEN, presentationVisible);
    });
    return true;
  }

  function consumeInstance(instance) {
    if (disposed) return false;
    const record = records.find((candidate) => candidate.instance === instance);
    if (!record) return false;
    if (instance.parent !== object) object.add(instance);
    instance.visible = false;
    instance.userData.smallGlyphState = GLYPH_STATE.CONSUMED;
    return true;
  }

  function beginPresentation() {
    if (disposed || presentationState !== PRESENTATION_STATE.IDLE) return false;
    presentationElapsed = 0;
    presentationState = PRESENTATION_STATE.PRESENTING;
    return true;
  }

  function updatePlacedRecords() { records.forEach((record) => {
    if (record.instance.userData.smallGlyphState !== GLYPH_STATE.PLACED) return;
    const idleElapsed = elapsed - record.placedAt;
    const yOffset = idleAmplitude * 0.5 * (Math.sin(record.idlePhase + idleElapsed * idleAngularSpeed)
      - Math.sin(record.idlePhase));
    record.instance.position.copy(record.placedPosition); record.instance.position.y += yOffset;
    record.instance.quaternion.copy(record.placedQuaternion).multiply(
      idleQuaternion.setFromAxisAngle(record.idleAxis, idleElapsed * idleRotationSpeed));
  }); }

  function update(delta) {
    if (disposed) return;
    const safeDelta = Math.max(0, Number.isFinite(delta) ? delta : 0);
    elapsed += safeDelta;
    const fieldMotionActive = presentationVisible;
    if (fieldMotionActive) fieldElapsed += safeDelta;
    layerActor.update(fieldMotionActive ? safeDelta : 0);
    records.forEach((record) => {
      updateCanonicalFieldTransform(record);
      const glyphState = record.instance.userData.smallGlyphState;
      const followsField = glyphState === GLYPH_STATE.FIELD
        || (glyphState === GLYPH_STATE.HIDDEN && presentationVisible);
      if (!followsField) return;
      record.instance.position.copy(record.fieldPosition);
      record.instance.quaternion.copy(record.fieldQuaternion);
    });
    updatePlacedRecords();
    if (revealTransition) {
      revealTransition.elapsed += safeDelta;
      applyRevealOpacity(revealTransition.elapsed / revealDurationSeconds);
      if (revealOpacity >= 1) revealTransition = null;
    }
    if (presentationState !== PRESENTATION_STATE.PRESENTING) return;
    presentationElapsed += safeDelta;
    if (presentationElapsed < fullPresentationDuration) return;
    presentationState = PRESENTATION_STATE.PRESENTED;
    if (!completionSent) {
      completionSent = true;
      onPresentationCompleted();
    }
  }

  function placeInstance(instance) {
    if (disposed || !fieldReady) return false;
    const record = records.find((candidate) => candidate.instance === instance); if (!record) return false;
    record.placedPosition.copy(instance.position); record.placedQuaternion.copy(instance.quaternion); record.placedAt = elapsed;
    instance.userData.smallGlyphState = GLYPH_STATE.PLACED; instance.visible = true; return true;
  }

  function reset() {
    if (disposed) return;
    presentationState = PRESENTATION_STATE.IDLE;
    fieldReady = false;
    presentationVisible = false;
    revealOpacity = 0;
    revealTransition = null;
    elapsed = 0;
    presentationElapsed = 0;
    fieldElapsed = 0;
    layerActor.reset();
    completionSent = false;
    object.visible = false;
    records.forEach((record) => restoreRecord(record, GLYPH_STATE.HIDDEN, false));
    applyRevealOpacity(0);
  }

  function hydrateScenarioState(hydratedState) {
    if (!hydratedState || typeof hydratedState !== 'object'
      || hydratedState.presentationVisible !== true || typeof hydratedState.presentationCompleted !== 'boolean') {
      throw new TypeError('smallGlyphField state must include presentationVisible true and boolean presentationCompleted');
    }
    if (disposed) throw new Error('Cannot hydrate a disposed small glyph system');
    object.visible = true;
    presentationVisible = true;
    revealTransition = null;
    presentationState = hydratedState.presentationCompleted ? PRESENTATION_STATE.PRESENTED : PRESENTATION_STATE.IDLE;
    presentationElapsed = hydratedState.presentationCompleted ? fullPresentationDuration : 0;
    fieldElapsed = 0;
    layerActor.reset();
    completionSent = hydratedState.presentationCompleted;
    applyRevealOpacity(1);
    records.forEach((record) => {
      const glyphState = record.instance.userData.smallGlyphState;
      if (glyphState === GLYPH_STATE.HIDDEN || glyphState === GLYPH_STATE.FIELD) {
        restoreRecord(record, glyphState, true);
      }
    });
  }

  function dispose() {
    if (disposed) return;
    object.clear(); layerActor.dispose(); ownedMaterials.forEach((material) => material.dispose()); ownedMaterials.clear();
    records.length = 0;
    disposed = true;
  }

  return {
    object, layerActor,
    beginWorldReveal,
    beginPresentation,
    update,
    reset,
    hydrateScenarioState,
    dispose,
    getPresentationState: () => presentationState,
    setFieldReady,
    isFieldReady: () => fieldReady,
    getFieldTransform,
    restoreInstanceToField,
    consumeInstance,
    placeInstance,
    getInstances: () => records.map(({ instance }) => instance)
  };
}
