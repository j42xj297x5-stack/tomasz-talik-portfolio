import { getNextScenarioSpinePointId, validateScenarioSpine } from './scenarioSpineNavigation.js';
import { VR_SCENARIO_TRANSITION_KIND } from './vrExperienceScenario.js';

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

function hasChoice(transition) {
  return Object.prototype.hasOwnProperty.call(transition, 'choice');
}

function hasTarget(transition) {
  return Object.prototype.hasOwnProperty.call(transition, 'target');
}

function validateScenario(scenario) {
  if (!scenario || typeof scenario !== 'object') throw new TypeError('scenario is required');
  if (!scenario.vocabulary || typeof scenario.vocabulary !== 'object') throw new TypeError('scenario vocabulary is required');
  const events = assertStringArray(scenario.vocabulary.events, 'scenario vocabulary events');
  const capabilities = assertStringArray(scenario.vocabulary.capabilities, 'scenario vocabulary capabilities');
  const milestones = assertStringArray(scenario.vocabulary.milestones, 'scenario vocabulary milestones');
  const effects = assertStringArray(scenario.vocabulary.effects, 'scenario vocabulary effects');
  const points = scenario.points ?? scenario.scenes;
  if (!Array.isArray(points) || points.length === 0) throw new TypeError('scenario points are required');
  const pointIds = assertStringArray(points.map((point) => point?.id), 'scenario point ids');
  validateScenarioSpine(scenario);
  const initialPointId = scenario.spine[0];
  for (const [alias, value] of [['initialPointId', scenario.initialPointId], ['initialSceneId', scenario.initialSceneId]]) {
    if (value !== undefined && value !== initialPointId) {
      throw new Error(`scenario ${alias} compatibility alias must equal spine[0]: ${initialPointId}`);
    }
  }
  const pointsById = new Map();
  for (const point of points) {
    const pointCapabilities = assertStringArray(point.capabilities, `point ${point.id} capabilities`);
    for (const capability of pointCapabilities) if (!capabilities.has(capability)) throw new Error(`point ${point.id} uses unknown capability: ${capability}`);
    if (!Array.isArray(point.transitions)) throw new TypeError(`point ${point.id} transitions must be an array`);
    const transitionsByEvent = new Map();
    for (const transition of point.transitions) {
      if (!transition || typeof transition !== 'object') throw new TypeError(`point ${point.id} contains an invalid transition`);
      if (!events.has(transition.event)) throw new Error(`point ${point.id} uses unknown event: ${transition.event}`);
      const transitionHasChoice = hasChoice(transition);
      if (transitionHasChoice && (!Number.isInteger(transition.choice) || transition.choice <= 0)) {
        throw new TypeError(`point ${point.id} transition ${transition.event} choice must be a positive integer`);
      }
      const hasTransitionTarget = hasTarget(transition);
      switch (transition.kind) {
        case VR_SCENARIO_TRANSITION_KIND.STAY:
          if (hasTransitionTarget) throw new Error(`STAY transition at point ${point.id} must not define target`);
          break;
        case VR_SCENARIO_TRANSITION_KIND.COMPLETE: {
          if (hasTransitionTarget) throw new Error(`COMPLETE transition at point ${point.id} must not define target`);
          const nextPointId = getNextScenarioSpinePointId(scenario, point.id);
          if (nextPointId === null) {
            throw new Error(`point ${point.id} cannot complete through Spine.next() because it is the last spine point`);
          }
          break;
        }
        case VR_SCENARIO_TRANSITION_KIND.EXPLICIT:
          if (!hasTransitionTarget) throw new Error(`EXPLICIT transition at point ${point.id} must define target`);
          if (!pointIds.has(transition.target)) throw new Error(`transition target does not exist: ${transition.target}`);
          break;
        default:
          throw new Error(`point ${point.id} transition ${transition.event} has unknown or missing kind: ${String(transition.kind)}`);
      }
      const transitionMilestones = assertStringArray(transition.milestonesToAdd ?? [], `transition ${transition.event} milestones`);
      const transitionEffects = assertStringArray(transition.effects ?? [], `transition ${transition.event} effects`);
      for (const milestone of transitionMilestones) if (!milestones.has(milestone)) throw new Error(`transition ${transition.event} uses unknown milestone: ${milestone}`);
      for (const effect of transitionEffects) if (!effects.has(effect)) throw new Error(`transition ${transition.event} uses unknown effect: ${effect}`);
      const existing = transitionsByEvent.get(transition.event);
      if (!existing) {
        transitionsByEvent.set(transition.event, transitionHasChoice
          ? { choices: new Map([[transition.choice, transition]]) }
          : { transition });
      } else if (transitionHasChoice !== Boolean(existing.choices)) {
        throw new Error(`point ${point.id} cannot mix choice-routed and event-only transitions for event: ${transition.event}`);
      } else if (!transitionHasChoice) {
        throw new Error(`point ${point.id} has duplicate transition event: ${transition.event}`);
      } else if (existing.choices.has(transition.choice)) {
        throw new Error(`point ${point.id} has duplicate transition event and choice: ${transition.event} + ${transition.choice}`);
      } else {
        existing.choices.set(transition.choice, transition);
      }
    }
    pointsById.set(point.id, { point, transitionsByEvent });
  }
  return { pointsById, milestones, initialPointId };
}

export class ExperienceDirector {
  constructor({ scenario, initialMilestones = [] }) {
    const { pointsById, milestones, initialPointId } = validateScenario(scenario);
    const hydrated = assertStringArray(initialMilestones, 'initial milestones');
    for (const milestone of hydrated) if (!milestones.has(milestone)) throw new Error(`unknown initial milestone: ${milestone}`);
    this.scenario = scenario;
    this.pointsById = pointsById;
    this.initialPointId = initialPointId;
    this.committedMilestones = new Set(hydrated);
    this.listeners = new Set();
    this.currentPointId = initialPointId;
    this.lastEvent = null;
    this.disposed = false;
  }

  dispatch(eventType, payload) {
    if (this.disposed) return null;
    const route = this.pointsById.get(this.currentPointId).transitionsByEvent.get(eventType);
    if (!route) return null;
    const transition = route.transition ?? (
      Number.isInteger(payload?.choice) && payload.choice > 0 ? route.choices.get(payload.choice) : null
    );
    if (!transition) return null;
    const previousPointId = this.currentPointId;
    switch (transition.kind) {
      case VR_SCENARIO_TRANSITION_KIND.STAY:
        this.currentPointId = previousPointId;
        break;
      case VR_SCENARIO_TRANSITION_KIND.COMPLETE:
        this.currentPointId = getNextScenarioSpinePointId(this.scenario, previousPointId);
        break;
      case VR_SCENARIO_TRANSITION_KIND.EXPLICIT:
        this.currentPointId = transition.target;
        break;
    }
    const addedMilestones = [];
    for (const milestone of transition.milestonesToAdd ?? []) if (!this.committedMilestones.has(milestone)) {
      this.committedMilestones.add(milestone); addedMilestones.push(milestone);
    }
    this.lastEvent = Object.freeze({ type: eventType, payload: payload ?? null });
    const change = Object.freeze({ event: this.lastEvent, transitionKind: transition.kind,
      previousPointId, currentPointId: this.currentPointId,
      addedMilestones: Object.freeze(addedMilestones), effects: Object.freeze([...(transition.effects ?? [])]) });
    for (const listener of [...this.listeners]) listener(change);
    return change;
  }

  can(capability) { return this.pointsById.get(this.currentPointId).point.capabilities.includes(capability); }
  hasMilestone(milestone) { return this.committedMilestones.has(milestone); }
  getCurrentPointId() { return this.currentPointId; }
  getCurrentSceneId() { return this.getCurrentPointId(); }
  getDebugSnapshot() { return { currentPointId: this.currentPointId, milestones: [...this.committedMilestones],
    capabilities: [...this.pointsById.get(this.currentPointId).point.capabilities],
    lastEvent: this.lastEvent ? { ...this.lastEvent } : null }; }
  subscribe(listener) {
    if (typeof listener !== 'function') throw new TypeError('listener must be a function');
    if (this.disposed) return () => {};
    this.listeners.add(listener); return () => this.listeners.delete(listener);
  }
  resetSession({ hard = false } = {}) {
    this.currentPointId = this.initialPointId; this.lastEvent = null;
    if (hard) this.committedMilestones.clear();
  }
  dispose() { if (this.disposed) return; this.disposed = true; this.listeners.clear(); }
}
