const STATE = Object.freeze({
  IDLE: 'IDLE',
  ACTIVE: 'ACTIVE',
  COMPLETED: 'COMPLETED'
});

export function createVrP2RadialPresentation({
  glyphOrbit,
  nodes,
  getTargetRadius,
  largeGlyphScaleMultiplier,
  durationSeconds,
  onCompleted = () => {}
}) {
  if (!glyphOrbit || typeof glyphOrbit.getRadius !== 'function'
    || typeof glyphOrbit.setRadius !== 'function') {
    throw new TypeError('P2 radial presentation requires a glyph orbit radius API');
  }
  if (typeof getTargetRadius !== 'function') {
    throw new TypeError('P2 radial presentation requires getTargetRadius');
  }
  if (!Array.isArray(nodes) || nodes.length === 0 || nodes.some((node) => !node?.isObject3D
    || !Number.isFinite(node.userData?.baseScale))) {
    throw new TypeError('P2 radial presentation requires glyph nodes with canonical baseScale');
  }
  if (!Number.isFinite(largeGlyphScaleMultiplier) || largeGlyphScaleMultiplier < 1) {
    throw new TypeError('P2 radial presentation largeGlyphScaleMultiplier must be at least one');
  }
  if (!Number.isFinite(durationSeconds) || durationSeconds <= 0) {
    throw new TypeError('P2 radial presentation durationSeconds must be finite and greater than zero');
  }
  if (typeof onCompleted !== 'function') {
    throw new TypeError('P2 radial presentation onCompleted must be a function');
  }

  let state = STATE.IDLE;
  let elapsed = 0;
  let startRadius = null;
  let targetRadius = null;
  let startScales = null;

  function setNodeBaseScale(node, scale) {
    node.userData.baseScale = scale;
    node.scale.setScalar(scale * (node.userData.targetScale ?? 1));
  }

  function begin() {
    if (state !== STATE.IDLE) return false;
    const nextStartRadius = glyphOrbit.getRadius();
    const nextTargetRadius = getTargetRadius();
    if (!Number.isFinite(nextStartRadius) || !Number.isFinite(nextTargetRadius)
      || nextTargetRadius <= nextStartRadius) return false;
    startRadius = nextStartRadius;
    targetRadius = nextTargetRadius;
    startScales = nodes.map((node) => node.userData.baseScale);
    elapsed = 0;
    state = STATE.ACTIVE;
    return true;
  }

  function update(delta) {
    if (state !== STATE.ACTIVE) return;
    elapsed += Math.max(0, Number.isFinite(delta) ? delta : 0);
    const progress = Math.min(1, Math.max(0, elapsed / durationSeconds));
    const eased = progress * progress * (3 - 2 * progress);
    const radius = startRadius + (targetRadius - startRadius) * eased;
    if (!glyphOrbit.setRadius(radius)) {
      throw new Error('P2 radial presentation could not update the glyph orbit radius');
    }
    nodes.forEach((node, index) => setNodeBaseScale(node,
      startScales[index] + (largeGlyphScaleMultiplier - startScales[index]) * eased));
    if (progress === 1) {
      if (!glyphOrbit.setRadius(targetRadius)) {
        throw new Error('P2 radial presentation could not settle the glyph orbit radius');
      }
      nodes.forEach((node) => setNodeBaseScale(node, largeGlyphScaleMultiplier));
      state = STATE.COMPLETED;
      onCompleted();
    }
  }

  function reset() {
    state = STATE.IDLE;
    elapsed = 0;
    startRadius = null;
    targetRadius = null;
    startScales = null;
    nodes.forEach((node) => setNodeBaseScale(node, 1));
  }

  function hydrateScenarioState(value) {
    if (!value || typeof value !== 'object' || Array.isArray(value)
      || Object.keys(value).length !== 1 || value.mainGlyphsRadial !== true) {
      throw new Error('P2 radial presentation requires settled mainGlyphsRadial truth');
    }
    const hydratedTargetRadius = getTargetRadius();
    if (!Number.isFinite(hydratedTargetRadius) || hydratedTargetRadius <= 0) {
      throw new Error('P2 radial presentation resolved an invalid hydration target radius');
    }
    if (!glyphOrbit.setRadius(hydratedTargetRadius)) {
      throw new Error('P2 radial presentation could not hydrate the glyph orbit radius');
    }
    nodes.forEach((node) => setNodeBaseScale(node, largeGlyphScaleMultiplier));
    elapsed = durationSeconds;
    startRadius = null;
    targetRadius = hydratedTargetRadius;
    startScales = null;
    state = STATE.COMPLETED;
  }

  return { begin, update, reset, hydrateScenarioState, getState: () => state };
}
