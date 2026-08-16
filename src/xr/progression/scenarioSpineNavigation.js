function getScenarioPoints(scenario) {
  return scenario?.points ?? scenario?.scenes;
}

export function deriveScenarioSpine(scenario) {
  const points = getScenarioPoints(scenario);
  if (!scenario || !Array.isArray(points)) throw new TypeError('Scenario must provide points');
  const startPointId = scenario.initialPointId ?? scenario.initialSceneId;
  const terminalPointId = scenario.canonicalTerminalPointId;
  if (typeof startPointId !== 'string' || startPointId.length === 0) {
    throw new TypeError('Scenario canonical mainline start must be a non-empty point ID');
  }
  if (typeof terminalPointId !== 'string' || terminalPointId.length === 0) {
    throw new TypeError('Scenario canonical terminal must be a non-empty point ID');
  }
  const pointsById = new Map(points.map((point) => [point?.id, point]));
  if (!pointsById.has(startPointId)) throw new Error(`Scenario mainline start references unknown point "${startPointId}"`);
  if (!pointsById.has(terminalPointId)) throw new Error(`Scenario canonical terminal references unknown point "${terminalPointId}"`);

  const spine = [];
  const visited = new Set();
  let pointId = startPointId;
  while (true) {
    if (visited.has(pointId)) throw new Error(`Scenario canonical mainline contains a cycle at point "${pointId}"`);
    visited.add(pointId);
    spine.push(pointId);
    if (pointId === terminalPointId) break;

    const point = pointsById.get(pointId);
    const edges = Array.isArray(point.canonicalMainline)
      ? point.canonicalMainline
      : point.canonicalMainline ? [point.canonicalMainline] : [];
    if (edges.length !== 1) {
      throw new Error(`Canonical mainline point "${pointId}" must have exactly one outgoing canonical-mainline edge`);
    }
    const target = edges[0]?.target;
    if (typeof target !== 'string' || target.length === 0 || !pointsById.has(target)) {
      throw new Error(`Canonical mainline edge from "${pointId}" references unknown target "${String(target)}"`);
    }
    pointId = target;
  }
  return spine;
}

export function validateScenarioSpine(scenario) {
  deriveScenarioSpine(scenario);
  return true;
}

export function getNextScenarioSpinePointId(scenario, currentPointId) {
  const spine = deriveScenarioSpine(scenario);
  const currentIndex = spine.indexOf(currentPointId);
  if (currentIndex < 0) throw new Error(`Point "${currentPointId}" does not belong to the Scenario spine`);
  return spine[currentIndex + 1] ?? null;
}
