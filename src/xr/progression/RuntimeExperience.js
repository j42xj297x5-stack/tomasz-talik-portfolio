export class RuntimeExperience {
  constructor({ director, effectHandlers = {} }) {
    if (!director) throw new TypeError('director is required');
    this.director = director;
    this.effectHandlers = effectHandlers instanceof Map ? new Map(effectHandlers) : new Map(Object.entries(effectHandlers));
    this.disposed = false;
  }
  dispatch(eventType, payload) {
    if (this.disposed) return null;
    const change = this.director.dispatch(eventType, payload);
    if (!change) return null;
    for (const effect of change.effects) {
      const handler = this.effectHandlers.get(effect);
      if (typeof handler !== 'function') throw new Error(`Missing effect handler: ${effect}`);
      handler(change, payload);
    }
    return change;
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
