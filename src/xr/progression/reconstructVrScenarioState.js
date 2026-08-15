function isMainlinePointId(pointId) {
  return typeof pointId === 'string' && /^[1-9]\d*\.[1-9]\d*$/.test(pointId);
}

function assertDeclarativeValue(value, path) {
  if (value === null || typeof value === 'string' || typeof value === 'boolean' || Number.isFinite(value)) return;
  if (Array.isArray(value)) {
    value.forEach((item, index) => assertDeclarativeValue(item, `${path}[${index}]`));
    return;
  }
  if (typeof value === 'object' && Object.getPrototypeOf(value) === Object.prototype) {
    Object.entries(value).forEach(([key, item]) => assertDeclarativeValue(item, `${path}.${key}`));
    return;
  }
  throw new TypeError(`${path} must contain only declarative, serializable values`);
}

function cloneAndFreeze(value) {
  if (Array.isArray(value)) return Object.freeze(value.map(cloneAndFreeze));
  if (value !== null && typeof value === 'object') {
    return Object.freeze(Object.fromEntries(
      Object.entries(value).map(([key, item]) => [key, cloneAndFreeze(item)])
    ));
  }
  return value;
}

export function validateScenarioSpine(scenario) {
  if (!scenario || !Array.isArray(scenario.points) || !Array.isArray(scenario.spine)) {
    throw new TypeError('Scenario must provide points and an authored spine');
  }

  const pointIds = new Set(scenario.points.map(({ id }) => id));
  const spineIds = new Set();
  for (const pointId of scenario.spine) {
    if (!isMainlinePointId(pointId)) {
      throw new Error(`Scenario spine point "${pointId}" must be a two-segment mainline ID`);
    }
    if (spineIds.has(pointId)) throw new Error(`Scenario spine contains duplicate point "${pointId}"`);
    if (!pointIds.has(pointId)) throw new Error(`Scenario spine references unknown point "${pointId}"`);
    spineIds.add(pointId);
  }

  return true;
}

export function reconstructVrScenarioState(scenario, pointId) {
  validateScenarioSpine(scenario);
  const targetIndex = scenario.spine.indexOf(pointId);
  if (targetIndex < 0) {
    throw new Error(`Point "${pointId}" is not a canonical reconstruction target`);
  }

  const pointsById = new Map(scenario.points.map((point) => [point.id, point]));
  const state = {};
  for (const precedingPointId of scenario.spine.slice(0, targetIndex)) {
    const consequences = pointsById.get(precedingPointId).settledConsequences ?? {};
    assertDeclarativeValue(consequences, `settledConsequences for "${precedingPointId}"`);
    if (Object.getPrototypeOf(consequences) !== Object.prototype) {
      throw new TypeError(`settledConsequences for "${precedingPointId}" must be an object`);
    }
    // Authored order is authoritative: a later point replaces an earlier value
    // at the same top-level fact key, while unrelated facts accumulate.
    Object.assign(state, consequences);
  }

  return cloneAndFreeze(state);
}
