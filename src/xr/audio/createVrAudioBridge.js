import { audioManager } from '../../audio/audioManager.js';

const WARNING_PREFIX = '[vr-audio] Optional audio operation failed:';

export function createVrAudioBridge({ manager = audioManager, warn = console.warn } = {}) {
  let disposed = false;

  function reportFailure(operation, error) {
    try {
      warn(`${WARNING_PREFIX} ${operation}`, error);
    } catch (_) {
      // Diagnostics must not turn an optional audio failure into a VR runtime failure.
    }
  }

  function runOptional(operation, request) {
    if (disposed) return;

    try {
      const result = request(manager);
      if (result && typeof result.then === 'function') {
        void Promise.resolve(result).catch((error) => reportFailure(operation, error));
      }
    } catch (error) {
      reportFailure(operation, error);
    }
  }

  function dispose() {
    if (disposed) return;
    disposed = true;
  }

  return { runOptional, dispose };
}
