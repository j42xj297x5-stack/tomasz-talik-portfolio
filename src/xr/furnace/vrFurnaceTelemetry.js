export const ACTIVE_PROCESS_STATES = Object.freeze(['PRESSING', 'SPINUP', 'STEADY', 'EXTRACTION', 'COOLDOWN']);

const KNOWN_STATES = new Set(['IDLE', ...ACTIVE_PROCESS_STATES, 'COMPLETE']);
const clamp01 = (value) => Math.min(1, Math.max(0, Number.isFinite(value) ? value : 0));

export function resolveProcessTelemetry({ state = 'IDLE', overallProgress = 0, extractionProgress = 0, angularSpeed = 0, processAngle = 0, completed = false,
  contentState = 'EMPTY', chamberState = 'CLOSED' } = {}) {
  const phase = completed ? 'COMPLETE' : KNOWN_STATES.has(state) ? state : 'IDLE';
  const labels = { IDLE: 'GOTOWY — OCZEKIWANIE NA WKŁAD', PRESSING: 'INICJALIZACJA', SPINUP: 'ROZRUCH',
    STEADY: 'STABILIZACJA', EXTRACTION: 'EKSTRAKCJA', COOLDOWN: 'WYGASZANIE',
    COMPLETE: 'ESENCJA ZAPISANA W PAMIĘCI PIECA' };
  let label = labels[phase];
  if (phase === 'IDLE' && contentState === 'INSERTED') label = chamberState === 'OPEN'
    ? 'ZAMKNIJ POKRYWĘ\nI ROZPOCZNIJ EKSTRAKCJĘ' : 'GOTOWY DO EKSTRAKCJI';
  return { phase, label, overallProgress: phase === 'IDLE' ? 0 : clamp01(overallProgress),
    extractionProgress: clamp01(extractionProgress),
    angularSpeed: Math.abs(angularSpeed || 0), processAngle: processAngle || 0,
    active: ACTIVE_PROCESS_STATES.includes(phase), showProgress: phase === 'EXTRACTION',
    silhouetteOpacity: phase === 'COMPLETE' ? 0 : 1,
    colorKey: phase === 'COMPLETE' ? 'complete' : phase === 'IDLE' ? 'idle' : 'process' };
}

export function shouldRefreshTelemetry({ active, elapsed, lastRedraw, refreshHz = 12 }) {
  return Boolean(active) && elapsed - lastRedraw >= 1 / Math.min(30, Math.max(4, refreshHz));
}
