import { VR_SCENARIO_EVENT } from './vrExperienceScenario.js';

export const VR_FIRST_RING_PRESENTATION_DURATION_SECONDS = 0.24;

export function createVrFirstRingFlow({ progressFloor, dispatch,
  presentationDurationSeconds = VR_FIRST_RING_PRESENTATION_DURATION_SECONDS }) {
  if (!progressFloor || typeof dispatch !== 'function') {
    throw new TypeError('First-ring flow requires progressFloor and dispatch.');
  }
  if (!Number.isFinite(presentationDurationSeconds) || presentationDurationSeconds <= 0) {
    throw new TypeError('First-ring presentation duration must be positive.');
  }
  let presentationActive = false;
  let presentationCompleted = false;
  let presentationElapsed = 0;

  function beginPresentation() {
    if (presentationActive || presentationCompleted) return false;
    progressFloor.completeTier(1);
    presentationActive = true;
    presentationElapsed = 0;
    return true;
  }

  function update(delta) {
    if (!presentationActive || presentationCompleted) return;
    presentationElapsed += Math.max(0, Number.isFinite(delta) ? delta : 0);
    if (presentationElapsed < presentationDurationSeconds) return;
    presentationActive = false;
    presentationCompleted = true;
    dispatch(VR_SCENARIO_EVENT.FIRST_RING_PRESENTATION_COMPLETED);
  }

  function reset() {
    presentationActive = false;
    presentationCompleted = false;
    presentationElapsed = 0;
  }

  return { beginPresentation, update, reset,
    get presentationActive() { return presentationActive; },
    get presentationCompleted() { return presentationCompleted; } };
}
