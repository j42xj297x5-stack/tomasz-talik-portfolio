function assertStringArray(value, label) {
  if (!Array.isArray(value)) throw new TypeError(`${label} must be an array`);
  const seen = new Set();
  for (const item of value) {
    if (typeof item !== 'string' || item.length === 0) throw new TypeError(`${label} must contain non-empty strings`);
    if (seen.has(item)) throw new Error(`${label} contains duplicate identifier: ${item}`);
    seen.add(item);
  }
  return seen;
}

function validateScenario(scenario) {
  if (!scenario || typeof scenario !== 'object') throw new TypeError('scenario is required');
  if (!scenario.vocabulary || typeof scenario.vocabulary !== 'object') throw new TypeError('scenario vocabulary is required');
  const events = assertStringArray(scenario.vocabulary.events, 'scenario vocabulary events');
  const capabilities = assertStringArray(scenario.vocabulary.capabilities, 'scenario vocabulary capabilities');
  const milestones = assertStringArray(scenario.vocabulary.milestones, 'scenario vocabulary milestones');
  const effects = assertStringArray(scenario.vocabulary.effects, 'scenario vocabulary effects');
  if (!Array.isArray(scenario.scenes) || scenario.scenes.length === 0) throw new TypeError('scenario scenes are required');

  const sceneIds = assertStringArray(scenario.scenes.map((scene) => scene?.id), 'scenario scene ids');
  if (!sceneIds.has(scenario.initialSceneId)) throw new Error(`scenario initial scene does not exist: ${scenario.initialSceneId}`);

  const scenesById = new Map();
  for (const scene of scenario.scenes) {
    const sceneCapabilities = assertStringArray(scene.capabilities, `scene ${scene.id} capabilities`);
    for (const capability of sceneCapabilities) {
      if (!capabilities.has(capability)) throw new Error(`scene ${scene.id} uses unknown capability: ${capability}`);
    }
    if (!Array.isArray(scene.transitions)) throw new TypeError(`scene ${scene.id} transitions must be an array`);
    const transitionEvents = new Set();
    const transitionsByEvent = new Map();
    for (const transition of scene.transitions) {
      if (!transition || typeof transition !== 'object') throw new TypeError(`scene ${scene.id} contains an invalid transition`);
      if (!events.has(transition.event)) throw new Error(`scene ${scene.id} uses unknown event: ${transition.event}`);
      if (transitionEvents.has(transition.event)) throw new Error(`scene ${scene.id} has duplicate transition event: ${transition.event}`);
      transitionEvents.add(transition.event);
      if (!sceneIds.has(transition.target)) throw new Error(`transition target does not exist: ${transition.target}`);
      const transitionMilestones = assertStringArray(transition.milestonesToAdd ?? [], `transition ${transition.event} milestones`);
      const transitionEffects = assertStringArray(transition.effects ?? [], `transition ${transition.event} effects`);
      for (const milestone of transitionMilestones) {
        if (!milestones.has(milestone)) throw new Error(`transition ${transition.event} uses unknown milestone: ${milestone}`);
      }
      for (const effect of transitionEffects) {
        if (!effects.has(effect)) throw new Error(`transition ${transition.event} uses unknown effect: ${effect}`);
      }
      transitionsByEvent.set(transition.event, transition);
    }
    scenesById.set(scene.id, { scene, transitionsByEvent });
  }
  return { scenesById, milestones };
}

export function createVrExperienceDirector({ scenario, initialMilestones = [] }) {
  const { scenesById, milestones: knownMilestones } = validateScenario(scenario);
  const hydratedMilestones = assertStringArray(initialMilestones, 'initial milestones');
  for (const milestone of hydratedMilestones) {
    if (!knownMilestones.has(milestone)) throw new Error(`unknown initial milestone: ${milestone}`);
  }

  const committedMilestones = new Set(hydratedMilestones);
  const listeners = new Set();
  let sceneId = scenario.initialSceneId;
  let lastEvent = null;
  let disposed = false;

  function dispatch(eventType, payload) {
    if (disposed) return null;
    const current = scenesById.get(sceneId);
    const transition = current.transitionsByEvent.get(eventType);
    if (!transition) return null;

    const previousSceneId = sceneId;
    sceneId = transition.target;
    const addedMilestones = [];
    for (const milestone of transition.milestonesToAdd ?? []) {
      if (!committedMilestones.has(milestone)) {
        committedMilestones.add(milestone);
        addedMilestones.push(milestone);
      }
    }
    const effects = [...(transition.effects ?? [])];
    lastEvent = { type: eventType, payload: payload ?? null };
    const change = Object.freeze({
      event: Object.freeze({ ...lastEvent }),
      previousSceneId,
      currentSceneId: sceneId,
      addedMilestones: Object.freeze(addedMilestones),
      effects: Object.freeze(effects)
    });
    for (const listener of [...listeners]) listener(change);
    return change;
  }

  function can(capability) {
    return scenesById.get(sceneId).scene.capabilities.includes(capability);
  }

  function hasMilestone(milestone) { return committedMilestones.has(milestone); }
  function getCurrentSceneId() { return sceneId; }

  function getDebugSnapshot() {
    return {
      sceneId,
      milestones: [...committedMilestones],
      capabilities: [...scenesById.get(sceneId).scene.capabilities],
      lastEvent: lastEvent ? { ...lastEvent } : null
    };
  }

  function subscribe(listener) {
    if (typeof listener !== 'function') throw new TypeError('listener must be a function');
    if (disposed) return () => {};
    listeners.add(listener);
    return () => listeners.delete(listener);
  }

  function resetSession({ hard = false } = {}) {
    sceneId = scenario.initialSceneId;
    lastEvent = null;
    if (hard) committedMilestones.clear();
  }

  function dispose() {
    disposed = true;
    listeners.clear();
  }

  return { dispatch, can, hasMilestone, getCurrentSceneId, getDebugSnapshot, subscribe, resetSession, dispose };
}
