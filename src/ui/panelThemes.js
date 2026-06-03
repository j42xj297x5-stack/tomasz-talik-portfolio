export const PANEL_THEME_BY_GATE_ID = {
  'ai-guide': 'ai-guide',
  'creative-ai': 'creative-ai',
  'ethics-life-protection': 'ethics',
  'haiku-cosmos': 'haiku-cosmos',
  'spotify-digger': 'spotify-digger'
};

export const GATE_ACCENT_COLOR_BY_GATE_ID = {
  'ai-guide': '#d5be79',
  'creative-ai': '#ffb86f',
  'ethics-life-protection': '#9ce0bb',
  'haiku-cosmos': '#c9a7ff',
  'spotify-digger': '#7fc8ff'
};

export function getPanelThemeForGate(gateId) {
  return PANEL_THEME_BY_GATE_ID[gateId] ?? gateId;
}

export function getGateAccentColor(gateId) {
  return GATE_ACCENT_COLOR_BY_GATE_ID[gateId] ?? GATE_ACCENT_COLOR_BY_GATE_ID['ai-guide'];
}
