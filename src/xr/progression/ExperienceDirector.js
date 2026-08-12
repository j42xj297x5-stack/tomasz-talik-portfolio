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
    for (const capability of sceneCapabilities) if (!capabilities.has(capability)) throw new Error(`scene ${scene.id} uses unknown capability: ${capability}`);
    if (!Array.isArray(scene.transitions)) throw new TypeError(`scene ${scene.id} transitions must be an array`);
    const transitionsByEvent = new Map();
    for (const transition of scene.transitions) {
      if (!transition || typeof transition !== 'object') throw new TypeError(`scene ${scene.id} contains an invalid transition`);
      if (!events.has(transition.event)) throw new Error(`scene ${scene.id} uses unknown event: ${transition.event}`);
      if (transitionsByEvent.has(transition.event)) throw new Error(`scene ${scene.id} has duplicate transition event: ${transition.event}`);
      if (!sceneIds.has(transition.target)) throw new Error(`transition target does not exist: ${transition.target}`);
      const transitionMilestones = assertStringArray(transition.milestonesToAdd ?? [], `transition ${transition.event} milestones`);
      const transitionEffects = assertStringArray(transition.effects ?? [], `transition ${transition.event} effects`);
      for (const milestone of transitionMilestones) if (!milestones.has(milestone)) throw new Error(`transition ${transition.event} uses unknown milestone: ${milestone}`);
      for (const effect of transitionEffects) if (!effects.has(effect)) throw new Error(`transition ${transition.event} uses unknown effect: ${effect}`);
      transitionsByEvent.set(transition.event, transition);
    }
    scenesById.set(scene.id, { scene, transitionsByEvent });
  }
  return { scenesById, milestones };
}

export class ExperienceDirector {
  constructor({ scenario, initialMilestones = [] }) {
    const { scenesById, milestones } = validateScenario(scenario);
    const hydrated = assertStringArray(initialMilestones, 'initial milestones');
    for (const milestone of hydrated) if (!milestones.has(milestone)) throw new Error(`unknown initial milestone: ${milestone}`);
    this.scenario = scenario;
    this.scenesById = scenesById;
    this.committedMilestones = new Set(hydrated);
    this.listeners = new Set();
    this.sceneId = scenario.initialSceneId;
    this.lastEvent = null;
    this.disposed = false;
  }

  dispatch(eventType, payload) {
    if (this.disposed) return null;
    const transition = this.scenesById.get(this.sceneId).transitionsByEvent.get(eventType);
    if (!transition) return null;
    const previousSceneId = this.sceneId;
    this.sceneId = transition.target;
    const addedMilestones = [];
    for (const milestone of transition.milestonesToAdd ?? []) if (!this.committedMilestones.has(milestone)) {
      this.committedMilestones.add(milestone); addedMilestones.push(milestone);
    }
    this.lastEvent = Object.freeze({ type: eventType, payload: payload ?? null });
    const change = Object.freeze({ event: this.lastEvent, previousSceneId, currentSceneId: this.sceneId,
      addedMilestones: Object.freeze(addedMilestones), effects: Object.freeze([...(transition.effects ?? [])]) });
    for (const listener of [...this.listeners]) listener(change);
    return change;
  }

  can(capability) { return this.scenesById.get(this.sceneId).scene.capabilities.includes(capability); }
  hasMilestone(milestone) { return this.committedMilestones.has(milestone); }
  getCurrentSceneId() { return this.sceneId; }
  getDebugSnapshot() { return { sceneId: this.sceneId, milestones: [...this.committedMilestones],
    capabilities: [...this.scenesById.get(this.sceneId).scene.capabilities],
    lastEvent: this.lastEvent ? { ...this.lastEvent } : null }; }
  subscribe(listener) {
    if (typeof listener !== 'function') throw new TypeError('listener must be a function');
    if (this.disposed) return () => {};
    this.listeners.add(listener); return () => this.listeners.delete(listener);
  }
  resetSession({ hard = false } = {}) {
    this.sceneId = this.scenario.initialSceneId; this.lastEvent = null;
    if (hard) this.committedMilestones.clear();
  }
  dispose() { if (this.disposed) return; this.disposed = true; this.listeners.clear(); }
}
