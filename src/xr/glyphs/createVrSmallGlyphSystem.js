import * as THREE from '../../vendor/three.js';

const SYSTEM_STATE = Object.freeze({
  HIDDEN: 'HIDDEN',
  MATERIALIZING: 'MATERIALIZING',
  MATERIALIZED: 'MATERIALIZED'
});

const GLYPH_STATE = Object.freeze({
  HIDDEN: 'HIDDEN',
  MATERIALIZING: 'MATERIALIZING',
  FIELD: 'FIELD'
});

function requireFiniteVector(value, name) {
  if (!value || !Number.isFinite(value.x) || !Number.isFinite(value.y) || !Number.isFinite(value.z)) {
    throw new TypeError(`${name} must have finite x, y and z values`);
  }
}

export function createVrSmallGlyphSystem({
  parent,
  assetManager,
  assetIds,
  copiesPerVisualVariant,
  center,
  innerRadius,
  outerRadius,
  materializeDurationSeconds,
  staggerSeconds,
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
  requireFiniteVector(center, 'center');
  if (!Number.isFinite(innerRadius) || innerRadius <= 0) throw new TypeError('innerRadius must be finite and greater than 0');
  if (!Number.isFinite(outerRadius) || outerRadius <= innerRadius) {
    throw new TypeError('outerRadius must be finite and greater than innerRadius');
  }
  if (!Number.isFinite(materializeDurationSeconds) || materializeDurationSeconds <= 0) {
    throw new TypeError('materializeDurationSeconds must be finite and greater than 0');
  }
  if (!Number.isFinite(staggerSeconds) || staggerSeconds < 0) {
    throw new TypeError('staggerSeconds must be finite and greater than or equal to 0');
  }
  if (typeof onPresentationCompleted !== 'function') throw new TypeError('onPresentationCompleted must be a function');

  const object = new THREE.Group();
  object.name = 'VrSmallGlyphField';
  object.visible = false;
  parent.add(object);

  const records = [];
  const instanceCount = assetIds.length * copiesPerVisualVariant;
  const goldenAngle = Math.PI * (3 - Math.sqrt(5));

  assetIds.forEach((assetId, variantIndex) => {
    for (let copyIndex = 0; copyIndex < copiesPerVisualVariant; copyIndex += 1) {
      const index = records.length;
      const instance = assetManager.cloneGltfScene(assetId);
      if (!instance || !instance.position || !instance.quaternion || !instance.scale) {
        throw new Error(`Unable to clone small glyph visual variant: ${assetId}`);
      }
      const t = (index + 1) / (instanceCount + 1);
      const radius = THREE.MathUtils.lerp(innerRadius, outerRadius, t);
      const directionY = 1 - (2 * (index + 0.5)) / instanceCount;
      const horizontal = Math.sqrt(Math.max(0, 1 - directionY * directionY));
      const azimuth = index * goldenAngle;
      instance.position.set(
        center.x + radius * horizontal * Math.cos(azimuth),
        center.y + radius * directionY,
        center.z + radius * horizontal * Math.sin(azimuth)
      );
      const variantLabel = String(variantIndex + 1).padStart(2, '0');
      const copyLabel = String.fromCharCode(97 + copyIndex);
      instance.name = `small-glyph-${variantLabel}-${copyLabel}`;
      instance.userData = {
        smallGlyphAssetId: assetId,
        smallGlyphVisualVariant: variantIndex + 1,
        smallGlyphCopyIndex: copyIndex,
        smallGlyphState: GLYPH_STATE.HIDDEN
      };
      instance.visible = false;
      object.add(instance);
      records.push({
        instance,
        authoredPosition: instance.position.clone(),
        authoredQuaternion: instance.quaternion.clone(),
        authoredScale: instance.scale.clone()
      });
    }
  });

  let state = SYSTEM_STATE.HIDDEN;
  let elapsed = 0;
  let completionSent = false;
  let disposed = false;
  const fullPresentationDuration = materializeDurationSeconds + (instanceCount - 1) * staggerSeconds;

  function restoreRecord(record, glyphState, visible = true) {
    record.instance.position.copy(record.authoredPosition);
    record.instance.quaternion.copy(record.authoredQuaternion);
    record.instance.scale.copy(record.authoredScale);
    record.instance.visible = visible;
    record.instance.userData.smallGlyphState = glyphState;
  }

  function beginPresentation() {
    if (disposed || state !== SYSTEM_STATE.HIDDEN) return false;
    object.visible = true;
    elapsed = 0;
    state = SYSTEM_STATE.MATERIALIZING;
    records.forEach((record) => {
      record.instance.visible = true;
      record.instance.scale.copy(record.authoredScale).multiplyScalar(0);
      record.instance.userData.smallGlyphState = GLYPH_STATE.MATERIALIZING;
    });
    return true;
  }

  function update(delta) {
    if (disposed || state !== SYSTEM_STATE.MATERIALIZING) return;
    elapsed += Math.max(0, Number.isFinite(delta) ? delta : 0);
    let allComplete = true;
    records.forEach((record, index) => {
      const progress = THREE.MathUtils.clamp(
        (elapsed - index * staggerSeconds) / materializeDurationSeconds,
        0,
        1
      );
      const eased = progress * progress * (3 - 2 * progress);
      record.instance.scale.copy(record.authoredScale).multiplyScalar(eased);
      if (progress !== 1) allComplete = false;
    });
    if (!allComplete) return;
    records.forEach((record) => restoreRecord(record, GLYPH_STATE.FIELD));
    state = SYSTEM_STATE.MATERIALIZED;
    if (!completionSent) {
      completionSent = true;
      onPresentationCompleted();
    }
  }

  function reset() {
    if (disposed) return;
    state = SYSTEM_STATE.HIDDEN;
    elapsed = 0;
    completionSent = false;
    object.visible = false;
    records.forEach((record) => restoreRecord(record, GLYPH_STATE.HIDDEN, false));
  }

  function hydrateScenarioState(hydratedState) {
    if (!hydratedState || typeof hydratedState !== 'object'
      || Object.keys(hydratedState).length !== 1 || hydratedState.materialized !== true) {
      throw new TypeError('smallGlyphField state must be exactly { materialized: true }');
    }
    if (disposed) throw new Error('Cannot hydrate a disposed small glyph system');
    object.visible = true;
    state = SYSTEM_STATE.MATERIALIZED;
    elapsed = fullPresentationDuration;
    completionSent = true;
    records.forEach((record) => restoreRecord(record, GLYPH_STATE.FIELD));
  }

  function dispose() {
    if (disposed) return;
    parent.remove(object);
    object.clear();
    records.length = 0;
    disposed = true;
  }

  return {
    object,
    beginPresentation,
    update,
    reset,
    hydrateScenarioState,
    dispose,
    getState: () => state,
    getInstances: () => records.map(({ instance }) => instance)
  };
}
