/**
 * Own the single pending XR-start calibration request consumed by an XR frame.
 * Pose reading and rig calibration stay in the composition root so both fresh
 * entry and live debug P0 use the exact same tracked-head mathematics.
 */
export function createCanonicalXrStartCalibration({
  readTrackedHead,
  calibrate,
  confirmCalibration,
  onCalibrated
}) {
  if (typeof readTrackedHead !== 'function') throw new TypeError('readTrackedHead is required');
  if (typeof calibrate !== 'function') throw new TypeError('calibrate is required');
  if (typeof confirmCalibration !== 'function') throw new TypeError('confirmCalibration is required');
  if (typeof onCalibrated !== 'function') throw new TypeError('onCalibrated is required');

  let pending = false;

  return Object.freeze({
    request() { pending = true; },
    cancel() { pending = false; },
    processFrame() {
      if (!pending) return false;
      const headWorldPosition = readTrackedHead();
      calibrate(headWorldPosition);
      confirmCalibration();
      pending = false;
      onCalibrated();
      return true;
    }
  });
}
