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
    runOptional('stop VR audio', (audio) => audio.stopVrAudio());
    disposed = true;
  }

  function prepareOneShots(paths) {
    runOptional('prepare VR one-shots', (audio) => audio.prepareVrOneShots(paths));
  }

  function playOneShot(path, bus = 'UI') {
    runOptional(`play ${path} on ${bus}`, (audio) => audio.playVrOneShot(path, bus));
  }

  return { runOptional, prepareOneShots, playOneShot, dispose };
}
