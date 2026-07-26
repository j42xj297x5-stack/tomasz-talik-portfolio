import { publicPath } from '../utils/publicPath.js';

export const EXPERIENCE3D_SETTINGS_SCHEMA_VERSION = 1;

export const DEFAULT_EXPERIENCE3D_SETTINGS = Object.freeze({
  schemaVersion: EXPERIENCE3D_SETTINGS_SCHEMA_VERSION,
  atmosphere: {
    stones: { enabled: true, count: 30, models: ['/glb/stone_01.glb','/glb/stone_02.glb','/glb/stone_03.glb','/glb/stone_04.glb','/glb/stone_05.glb','/glb/stone_06.glb'], safeRadius: 3.5, minScale: 2, maxScale: 5, innerRadius: 18, outerRadius: 20, rotationSpeedMin: 0.05, rotationSpeedMax: 0.09, selfRotationSpeedMultiplier: 1, orbitSpeed: 0.003, opacity: 1 },
    shells: { enabled: true, count: 100, models: ['/glb/shell_01.glb','/glb/shell_02.glb','/glb/shell_03.glb','/glb/shell_04.glb','/glb/shell_05.glb','/glb/shell_06.glb'], colorPalette: ['#d9a441','#4db6ac','#6ec6ff','#6bcf8e','#9c7bff','#f0a6a6'], minScale: 0.4, maxScale: 0.7, innerRadius: 10, outerRadius: 13, rotationSpeedMin: 0.047, rotationSpeedMax: 0.486, selfRotationSpeedMultiplier: 1, orbitSpeed: 0.013, opacity: 1 },
    smallGlyphs: { enabled: true, count: 50, models: ['/glb/small_glyph_01.glb','/glb/small_glyph_02.glb','/glb/small_glyph_03.glb','/glb/small_glyph_04.glb','/glb/small_glyph_05.glb','/glb/small_glyph_06.glb'], minScale: 0.3, maxScale: 0.5, innerRadius: 13, outerRadius: 15, rotationSpeedMin: 0.291, rotationSpeedMax: 0.5, selfRotationSpeedMultiplier: 1, orbitSpeed: 0.031, opacity: 0.62 },
    dust: { enabled: true, count: 6000, innerRadius: 15, outerRadius: 25, safeRadius: 3, pointSize: 0.07, rotationSpeed: 0.018, opacity: 1, color: '#cfe2ff', sizeAttenuation: true, depthTest: true, depthWrite: false }
  },
  galaxies: { enabled: true, texturePaths: ['/png/galaxy_01.png','/png/galaxy_02.png','/png/galaxy_03.png','/png/galaxy_04.png','/png/galaxy_05.png'], count: 14, minScale: 1, maxScale: 5, opacity: 1, opacityVariance: 0.18, innerRadius: 18, outerRadius: 26, verticalSpread: 8, safeRadius: 6.5, orbitSpeedMin: 0.002, orbitSpeedMax: 0.005, ownSpinSpeedMin: 0.0635, ownSpinSpeedMax: 0.0815, orbitSpeedMultiplier: 0, ownSpinSpeedMultiplier: 1, orbitInclinationMin: -0.35, orbitInclinationMax: 0.35, parallaxStrength: 1, randomSeed: 1337, additiveBlending: true, alphaTest: 1, reducedMotionSpeedMultiplier: 0.25 },
  fog: { enabled: true, color: '#05070b', near: 10, far: 28 },
  sun: { enabled: true, modelPath: '/glb/sun.glb', center: { x: 0, y: 0, z: 0 }, radius: 3, zOffset: 0, startAngle: 0, angularSpeed: 0.08, direction: 1, scale: 0.2, selfRotationSpeed: 0, lockFacing: true, frontRotation: { x: 0, y: 0, z: 0 }, emissiveColor: '#ffd21f', emissiveIntensity: 1.5, spotlight: { enabled: true, color: '#ffd21f', intensity: 13.2, distance: 20, angleDegrees: 90, penumbra: 0.45, decay: 1.5, fadeDurationSeconds: 3, cameraOffsetFactor: 0.2, radialOffsetMultiplier: 1.25, horizonFade: false, horizonFadeHeight: 0.5 } },
  moon: { enabled: true, modelPath: '/glb/moon.glb', center: { x: 0, y: 0, z: 0 }, radius: 3, zOffset: 0, phaseOffset: Math.PI, scale: 0.2, selfRotationSpeed: 0, lockFacing: true, frontRotation: { x: 0, y: 0, z: 0 }, spotlight: { enabled: true, color: '#8ecbff', intensity: 10, distance: 20, angleDegrees: 90, penumbra: 0.45, decay: 1.5, fadeDurationSeconds: 3, cameraOffsetFactor: 0.2, radialOffsetMultiplier: 1.25 } }
});

export function deepClone(value) { return value === undefined ? undefined : JSON.parse(JSON.stringify(value)); }

function normalizeKnown(defaultValue, candidate) {
  if (Array.isArray(defaultValue)) return Array.isArray(candidate) && candidate.every((item) => typeof item === typeof defaultValue[0]) ? deepClone(candidate) : deepClone(defaultValue);
  if (defaultValue && typeof defaultValue === 'object') {
    const input = candidate && typeof candidate === 'object' && !Array.isArray(candidate) ? candidate : {};
    return Object.fromEntries(Object.entries(defaultValue).map(([key, fallback]) => [key, normalizeKnown(fallback, input[key])]));
  }
  if (typeof candidate !== typeof defaultValue) return defaultValue;
  if (typeof defaultValue === 'number' && !Number.isFinite(candidate)) return defaultValue;
  return candidate;
}

export function normalizeExperience3dSettings(candidate) {
  if (!candidate || candidate.schemaVersion !== EXPERIENCE3D_SETTINGS_SCHEMA_VERSION) return deepClone(DEFAULT_EXPERIENCE3D_SETTINGS);
  return normalizeKnown(DEFAULT_EXPERIENCE3D_SETTINGS, candidate);
}

export function mergeExperience3dSettings(candidate) { return normalizeExperience3dSettings(candidate); }

export function toRuntimeSettings(settings) {
  const value = normalizeExperience3dSettings(settings);
  const layer = (item) => ({ ...deepClone(item), shellInnerRadius: item.innerRadius, shellOuterRadius: item.outerRadius, debugVisible: false });
  return {
    fog: deepClone(value.fog),
    sunCycle: { ...deepClone(value.sun), debugVisible: false, debugShowFallback: false, debugForceBasicMaterial: false, debugShowBounds: false, debugScaleMultiplier: 1 },
    moonCycle: { ...deepClone(value.moon), debugVisible: false, debugShowFallback: false, debugForceBasicMaterial: false, debugShowBounds: false, debugScaleMultiplier: 1 },
    galaxySprites: { ...deepClone(value.galaxies), totalMax: value.galaxies.count },
    backgroundAtmosphere: { enabled: true, debugVisible: false, showShellHelpers: false, showAtmosphereLogs: false, debugBlendingMode: 'normal', debugIgnoreFog: true, safeRadius: 3, shellInnerRadius: 15, shellOuterRadius: 25, stoneRelics: layer(value.atmosphere.stones), shellRelics: layer(value.atmosphere.shells), smallGlyphRelics: layer(value.atmosphere.smallGlyphs), dust: { ...deepClone(value.atmosphere.dust), idleOpacity: value.atmosphere.dust.opacity } }
  };
}

export function serializeExperience3dSettings(runtimeState) {
  const relic = (item) => { const result = deepClone(item); result.innerRadius = result.shellInnerRadius; result.outerRadius = result.shellOuterRadius; delete result.shellInnerRadius; delete result.shellOuterRadius; delete result.debugVisible; return result; };
  const galaxies = deepClone(runtimeState.galaxySprites); galaxies.count = galaxies.totalMax; delete galaxies.totalMax;
  const dust = deepClone(runtimeState.backgroundAtmosphere.dust); dust.opacity = dust.idleOpacity; delete dust.idleOpacity;
  return normalizeExperience3dSettings({ schemaVersion: 1, atmosphere: { stones: relic(runtimeState.backgroundAtmosphere.stoneRelics), shells: relic(runtimeState.backgroundAtmosphere.shellRelics), smallGlyphs: relic(runtimeState.backgroundAtmosphere.smallGlyphRelics), dust }, galaxies, fog: runtimeState.fog, sun: runtimeState.sunCycle, moon: runtimeState.moonCycle });
}

export async function loadExperience3dSettings({ fetchImpl = globalThis.fetch, debug = false } = {}) {
  try {
    const response = await fetchImpl(publicPath('data/experience3d-settings.json'), { cache: 'no-cache' });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const parsed = await response.json();
    if (parsed?.schemaVersion !== EXPERIENCE3D_SETTINGS_SCHEMA_VERSION) throw new Error(`Unsupported schemaVersion: ${parsed?.schemaVersion}`);
    return { settings: normalizeExperience3dSettings(parsed), settingsSource: 'server', settingsLoadError: null };
  } catch (error) {
    const settingsLoadError = error instanceof Error ? error.message : String(error);
    if (debug) console.warn('[experience3d-settings] Using code defaults.', settingsLoadError);
    return { settings: deepClone(DEFAULT_EXPERIENCE3D_SETTINGS), settingsSource: 'defaults', settingsLoadError };
  }
}
