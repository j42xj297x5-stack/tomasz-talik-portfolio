export const ACTIVE_PROCESS_STATES = Object.freeze(['PRESSING', 'SPINUP', 'STEADY', 'EXTRACTION', 'COOLDOWN']);
export const PROCESS_ASCII_FRAMES = Object.freeze({
  IDLE: [['        ·', '    ·   ◇   ·', '        ·']],
  PRESSING: [['[·      ]'], ['[··     ]'], ['[···    ]'], ['[ ···   ]']],
  SPINUP: [['      │', '    ╲ ◇ ╱', '    ─   ─'], ['    ╲ │ ╱', '  ──  ◇  ──', '    ╱ │ ╲']],
  STEADY: [['     ╲  │  ╱', '  ───   ◉   ───', '     ╱  │  ╲'], ['     ╱  ─  ╲', '  ││   ◉   ││', '     ╲  ─  ╱']],
  EXTRACTION: [['  <<<(( ◉ ))>>>', ' ==≋==≋==≋==≋==', '  >>>(( ◉ ))<<<'], [' * * * ╲ │ ╱ * * *', ' >>>> [ CORE ] <<<<', ' * * * ╱ │ ╲ * * *']],
  COOLDOWN: [['    ╲ │ ╱', '      ◉', '    ╱ │ ╲'], ['      │', '    ──◇──', '      │'], ['      ·', '      ◇', '      ·']],
  COMPLETE: [['        ◈', '   ───[ ✓ ]───', ' MODUŁ ZAKTUALIZOWANY']]
});
const clamp01 = (value) => Math.min(1, Math.max(0, Number.isFinite(value) ? value : 0));
export function buildProgressBar(progress, length = 18) { const value = clamp01(progress), count = Math.round(value * length);
  return `[${'█'.repeat(count)}${'░'.repeat(length - count)}] ${String(Math.round(value * 100)).padStart(3, ' ')}%`; }
export function resolveProcessTelemetry({ state = 'IDLE', progress = 0, angularSpeed = 0, processAngle = 0, completed = false } = {}) {
  const phase = completed ? 'COMPLETE' : PROCESS_ASCII_FRAMES[state] ? state : 'IDLE';
  const labels = { IDLE: 'OCZEKIWANIE', PRESSING: 'INICJALIZACJA', SPINUP: 'ROZRUCH', STEADY: 'STABILIZACJA', EXTRACTION: 'EKSTRAKCJA', COOLDOWN: 'WYGASZANIE', COMPLETE: 'ABSORPCJA ZAKOŃCZONA' };
  return { phase, label: labels[phase], progress: clamp01(progress), angularSpeed: Math.abs(angularSpeed || 0), processAngle: processAngle || 0,
    active: ACTIVE_PROCESS_STATES.includes(phase), colorKey: phase === 'COMPLETE' ? 'complete' : phase === 'IDLE' ? 'idle' : 'process' };
}
export function resolveAsciiFrame(telemetry, timeSeconds = 0) { const frames = PROCESS_ASCII_FRAMES[telemetry.phase] ?? PROCESS_ASCII_FRAMES.IDLE;
  if (frames.length === 1 || telemetry.angularSpeed === 0 && telemetry.phase !== 'PRESSING') return frames[0];
  const rate = telemetry.phase === 'PRESSING' ? 4 : Math.min(14, .8 + telemetry.angularSpeed * 1.4);
  const index = Math.floor((timeSeconds * rate + Math.abs(telemetry.processAngle) / (Math.PI / 2)) % frames.length); return frames[index]; }
export function shouldRefreshTelemetry({ active, elapsed, lastRedraw, refreshHz = 12 }) {
  return Boolean(active) && elapsed - lastRedraw >= 1 / Math.min(30, Math.max(4, refreshHz));
}
