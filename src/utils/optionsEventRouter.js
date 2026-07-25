export function routeOptionsEvent(event, handlers, { debug = false } = {}) {
  const owner = event?.owner;
  const action = event?.action;
  const handler = handlers?.[owner];

  if (!owner || !action || typeof handler !== 'function') {
    if (debug) console.warn('[options] Ignoring unknown panel event.', { owner, action });
    return false;
  }

  const handled = handler(event);
  if (handled === false) {
    if (debug) console.warn('[options] Ignoring unknown action for panel owner.', { owner, action });
    return false;
  }
  return true;
}
