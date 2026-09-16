import { VR_FURNACE_COPY } from './vrFurnaceCopy.js';

export const ACTIVE_PROCESS_STATES = Object.freeze(['PRESSING', 'SPINUP', 'STEADY', 'EXTRACTION', 'COOLDOWN']);

const KNOWN_STATES = new Set(['IDLE', ...ACTIVE_PROCESS_STATES, 'COMPLETE']);
const clamp01 = (value) => Math.min(1, Math.max(0, Number.isFinite(value) ? value : 0));

export function resolveProcessTelemetry({ state = 'IDLE', overallProgress = 0, extractionProgress = 0, angularSpeed = 0, processAngle = 0, completed = false,
  contentState = 'EMPTY', chamberState = 'CLOSED' } = {}, telemetryCopy = VR_FURNACE_COPY.pl.telemetry) {
  const phase = completed ? 'COMPLETE' : KNOWN_STATES.has(state) ? state : 'IDLE';
  let label = telemetryCopy[phase];
  if (phase === 'IDLE' && contentState === 'INSERTED') label = chamberState === 'OPEN'
    ? telemetryCopy.INSERTED_OPEN : telemetryCopy.INSERTED_CLOSED;
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
