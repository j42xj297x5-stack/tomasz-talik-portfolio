const DEFAULT_CONFIG = Object.freeze({
  debugMode: false,
  recording: Object.freeze({ enabled: false, scopes: Object.freeze([]) })
});

let launchConfig = DEFAULT_CONFIG;

export function setVrDebugLaunchConfig({ debugMode = false, recording = {} } = {}) {
  const enabled = recording.enabled === true;
  launchConfig = Object.freeze({
    debugMode: debugMode === true,
    recording: Object.freeze({
      enabled,
      scopes: Object.freeze(enabled ? [...new Set(recording.scopes ?? [])] : [])
    })
  });
  return launchConfig;
}

export function getVrDebugLaunchConfig() {
  return launchConfig;
}
