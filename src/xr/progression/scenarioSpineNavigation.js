function getScenarioPoints(scenario) {
  return scenario?.points ?? scenario?.scenes;
}

export function validateScenarioSpine(scenario) {
  const points = getScenarioPoints(scenario);
  if (!scenario || !Array.isArray(points) || !Array.isArray(scenario.spine)) {
    throw new TypeError('Scenario must provide points and an authored spine');
  }
  if (scenario.spine.length === 0) throw new Error('Scenario spine must not be empty');

  const pointIds = new Set(points.map(({ id }) => id));
  const spineIds = new Set();
  for (const pointId of scenario.spine) {
    if (typeof pointId !== 'string' || pointId.length === 0) {
      throw new TypeError('Scenario spine must contain non-empty point IDs');
    }
    if (spineIds.has(pointId)) throw new Error(`Scenario spine contains duplicate point "${pointId}"`);
    if (!pointIds.has(pointId)) throw new Error(`Scenario spine references unknown point "${pointId}"`);
    spineIds.add(pointId);
  }

  return true;
}

export function getNextScenarioSpinePointId(scenario, currentPointId) {
  validateScenarioSpine(scenario);
  const currentIndex = scenario.spine.indexOf(currentPointId);
  if (currentIndex < 0) throw new Error(`Point "${currentPointId}" does not belong to the Scenario spine`);
  return scenario.spine[currentIndex + 1] ?? null;
}
