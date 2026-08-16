export class RuntimeExperience {
  constructor({ director, effectHandlers = {}, pointLifecycle = null }) {
    if (!director) throw new TypeError('director is required');
    this.director = director;
    this.effectHandlers = effectHandlers instanceof Map ? new Map(effectHandlers) : new Map(Object.entries(effectHandlers));
    this.pointLifecycle = pointLifecycle;
    this.disposed = false;
  }
  dispatch(eventType, payload) {
    if (this.disposed) return null;
    const change = this.director.dispatch(eventType, payload);
    if (!change) return null;
    this.#executeEffects(change, payload);
    return change;
  }
  activateCurrentPoint() {
    if (this.disposed) return null;
    const change = this.director.activateCurrentPoint();
    if (!change) return null;
    this.#executeEffects(change);
    return change;
  }
  activatePoint(pointId) {
    if (this.disposed) return null;
    const lifecycle = this.pointLifecycle;
    if (!lifecycle || typeof lifecycle.stateAt !== 'function'
      || typeof lifecycle.hydrate !== 'function' || typeof lifecycle.createDirector !== 'function') {
      throw new Error('arbitrary point activation requires the canonical point lifecycle');
    }
    lifecycle.restoreBaseline?.();
    const state = lifecycle.stateAt(pointId);
    lifecycle.hydrate(state);
    lifecycle.synchronize?.();
    this.replaceDirector(lifecycle.createDirector(pointId));
    const activation = this.activateCurrentPoint();
    return Object.freeze({ state, activation });
  }
  #executeEffects(change, payload) {
    for (const effect of change.effects) {
      const handler = this.effectHandlers.get(effect);
      if (typeof handler !== 'function') throw new Error(`Missing effect handler: ${effect}`);
      handler(change, payload);
    }
  }
  can(capability) { return this.director.can(capability); }
  hasMilestone(milestone) { return this.director.hasMilestone(milestone); }
  getCurrentPointId() { return this.director.getCurrentPointId(); }
  getCurrentSceneId() { return this.getCurrentPointId(); }
  getDebugSnapshot() { return this.director.getDebugSnapshot(); }
  resetSession(options) { return this.director.resetSession(options); }
  replaceDirector(director) {
    if (this.disposed) throw new Error('cannot replace Director on a disposed RuntimeExperience');
    if (!director) throw new TypeError('director is required');
    const previous = this.director;
    this.director = director;
    if (previous !== director) previous.dispose();
    return previous;
  }
  dispose() { if (this.disposed) return; this.disposed = true; this.effectHandlers.clear(); this.director.dispose(); }
}
