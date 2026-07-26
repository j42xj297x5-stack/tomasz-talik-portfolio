import * as THREE from '../vendor/three.js';
import { DEFAULT_EXPERIENCE3D_SETTINGS, deepClone, normalizeExperience3dSettings } from '../config/experience3dSettings.js';

const clamp01 = (value) => Math.min(1, Math.max(0, value));
export const fogRevealEasing = (name, value) => {
  const t = clamp01(value);
  return name === 'linear' ? t : t * t * (3 - 2 * t);
};

function normalizeFog(settings) {
  return normalizeExperience3dSettings({ schemaVersion: 1, fog: settings }).fog;
}

export function createFogRevealController({ scene, settings = DEFAULT_EXPERIENCE3D_SETTINGS.fog }) {
  let config = normalizeFog(settings);
  let elapsedSeconds = 0;
  let progress = 0;
  let started = false;
  let completed = false;
  let currentNear = config.reveal.startNear;
  let currentFar = config.reveal.startFar;

  function ensureFog() {
    if (!config.enabled) { scene.fog = null; return null; }
    if (!scene.fog) scene.fog = new THREE.Fog(config.color, currentNear, currentFar);
    scene.fog.color.set(config.color);
    return scene.fog;
  }
  function write(near, far) {
    currentNear = near; currentFar = far;
    const fog = ensureFog();
    if (fog) { fog.near = near; fog.far = far; }
  }
  function applyProgress() {
    const eased = fogRevealEasing(config.reveal.easing, progress);
    write(
      config.reveal.startNear + (config.near - config.reveal.startNear) * eased,
      config.reveal.startFar + (config.far - config.reveal.startFar) * eased
    );
  }
  function finish() {
    progress = 1; elapsedSeconds = config.reveal.durationSeconds; completed = true; started = false;
    write(config.near, config.far);
  }
  function restart() {
    elapsedSeconds = 0; progress = 0; completed = false; started = false;
    if (!config.enabled) { scene.fog = null; return; }
    if (!config.reveal.enabled || config.reveal.durationSeconds === 0) finish();
    else write(config.reveal.startNear, config.reveal.startFar);
  }
  function start() {
    if (!config.enabled || !config.reveal.enabled || completed) return;
    if (config.reveal.durationSeconds === 0) finish(); else started = true;
  }
  function update(deltaSeconds) {
    if (!started || completed || !config.enabled || !config.reveal.enabled) return;
    elapsedSeconds = Math.min(config.reveal.durationSeconds, elapsedSeconds + Math.max(0, Number(deltaSeconds) || 0));
    progress = config.reveal.durationSeconds === 0 ? 1 : clamp01(elapsedSeconds / config.reveal.durationSeconds);
    if (progress === 1) finish(); else applyProgress();
  }
  function applySettings(nextSettings, { restartReveal = false } = {}) {
    const previousProgress = progress;
    config = normalizeFog(nextSettings);
    if (restartReveal) { restart(); start(); return; }
    if (!config.enabled) { started = false; scene.fog = null; return; }
    if (!config.reveal.enabled || config.reveal.durationSeconds === 0) { finish(); return; }
    progress = previousProgress; elapsedSeconds = progress * config.reveal.durationSeconds;
    completed = progress >= 1; if (completed) started = false;
    applyProgress();
  }
  function getSnapshot() {
    return { enabled: config.enabled && config.reveal.enabled, running: started && !completed, completed, progress, elapsedSeconds, durationSeconds: config.reveal.durationSeconds, currentNear, currentFar, targetNear: config.near, targetFar: config.far };
  }

  restart();
  return { start, update, applySettings, restart, skipToEnd: finish, getSnapshot, getSettings: () => deepClone(config) };
}
