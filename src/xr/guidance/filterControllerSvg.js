export const CONTROLLER_SEMANTIC_IDS = Object.freeze(['trigger', 'grab', 'rotate', 'move', 'A', 'B', 'X', 'Y']);
export const INITIAL_VISIBLE_CONTROL_IDS = Object.freeze(['trigger', 'grab', 'rotate', 'move', 'Y']);

export function normalizeVisibleControlIds(ids) {
  const requested = new Set(ids ?? []);
  return CONTROLLER_SEMANTIC_IDS.filter((id) => requested.has(id));
}

export function filterControllerSvg(svgText, enabledIds) {
  const document = new DOMParser().parseFromString(svgText, 'image/svg+xml');
  if (document.querySelector('parsererror') || document.documentElement?.localName !== 'svg') {
    throw new Error('Invalid controller SVG');
  }
  const enabled = new Set(normalizeVisibleControlIds(enabledIds));
  for (const id of CONTROLLER_SEMANTIC_IDS) {
    const element = document.getElementById(id);
    if (!element) throw new Error(`Missing controller SVG semantic ID: ${id}`);
    element.setAttribute('display', enabled.has(id) ? 'inline' : 'none');
  }
  return new XMLSerializer().serializeToString(document);
}
