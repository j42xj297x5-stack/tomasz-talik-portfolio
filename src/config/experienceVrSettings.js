import { publicPath } from '../utils/publicPath.js';

export const EXPERIENCE_VR_SETTINGS_SCHEMA_VERSION = 1;

export const DEFAULT_EXPERIENCE_VR_SETTINGS = Object.freeze({
  schemaVersion: EXPERIENCE_VR_SETTINGS_SCHEMA_VERSION,
  referenceSpaceType: 'local-floor',
  worldScale: 1,
  spawn: {
    position: { x: 0, y: 0, z: 6 },
    lookAt: { x: 0, y: 1, z: 0 }
  },
  renderer: {
    pixelRatioCap: 1.5,
    antialias: true
  },
  controllers: {
    enabled: true,
    rayLength: 3,
    rayOpacity: 0.8,
    idleScale: 1,
    activeScale: 1.2
  },
  entryTransition: {
    enabled: true,
    durationSeconds: 3,
    target: { x: 0, z: 1.8 },
    easing: 'smoothstep'
  },
  spatialPlaque: {
    enabled: true,
    width: 1.35,
    height: 0.85,
    distance: 1.4,
    verticalOffset: -0.05,
    canvasWidth: 1024,
    canvasHeight: 640,
    titleFontSize: 72,
    bodyFontSize: 42,
    maxBodyLines: 6
  }
});

function finiteNumber(value, fallback, { min = -Infinity, max = Infinity } = {}) {
  return Number.isFinite(value) ? Math.min(max, Math.max(min, value)) : fallback;
}

function normalizeVector(candidate, fallback) {
  return {
    x: finiteNumber(candidate?.x, fallback.x),
    y: finiteNumber(candidate?.y, fallback.y),
    z: finiteNumber(candidate?.z, fallback.z)
  };
}

export function normalizeExperienceVrSettings(candidate) {
  const defaults = DEFAULT_EXPERIENCE_VR_SETTINGS;
  if (!candidate || candidate.schemaVersion !== EXPERIENCE_VR_SETTINGS_SCHEMA_VERSION) {
    return structuredClone(defaults);
  }

  return {
    schemaVersion: EXPERIENCE_VR_SETTINGS_SCHEMA_VERSION,
    referenceSpaceType: ['local-floor', 'local'].includes(candidate.referenceSpaceType)
      ? candidate.referenceSpaceType
      : defaults.referenceSpaceType,
    worldScale: finiteNumber(candidate.worldScale, defaults.worldScale, { min: 0.01, max: 100 }),
    spawn: {
      position: normalizeVector(candidate.spawn?.position, defaults.spawn.position),
      lookAt: normalizeVector(candidate.spawn?.lookAt, defaults.spawn.lookAt)
    },
    renderer: {
      pixelRatioCap: finiteNumber(candidate.renderer?.pixelRatioCap, defaults.renderer.pixelRatioCap, { min: 0.5, max: 2 }),
      antialias: typeof candidate.renderer?.antialias === 'boolean'
        ? candidate.renderer.antialias
        : defaults.renderer.antialias
    },
    controllers: {
      enabled: typeof candidate.controllers?.enabled === 'boolean'
        ? candidate.controllers.enabled
        : defaults.controllers.enabled,
      rayLength: finiteNumber(candidate.controllers?.rayLength, defaults.controllers.rayLength, { min: 0.1, max: 20 }),
      rayOpacity: finiteNumber(candidate.controllers?.rayOpacity, defaults.controllers.rayOpacity, { min: 0.05, max: 1 }),
      idleScale: finiteNumber(candidate.controllers?.idleScale, defaults.controllers.idleScale, { min: 0.1, max: 5 }),
      activeScale: finiteNumber(candidate.controllers?.activeScale, defaults.controllers.activeScale, { min: 0.1, max: 5 })
    },
    entryTransition: {
      enabled: typeof candidate.entryTransition?.enabled === 'boolean'
        ? candidate.entryTransition.enabled
        : defaults.entryTransition.enabled,
      durationSeconds: finiteNumber(candidate.entryTransition?.durationSeconds, defaults.entryTransition.durationSeconds, { min: 0.1, max: 30 }),
      target: {
        x: finiteNumber(candidate.entryTransition?.target?.x, defaults.entryTransition.target.x),
        z: finiteNumber(candidate.entryTransition?.target?.z, defaults.entryTransition.target.z)
      },
      easing: candidate.entryTransition?.easing === 'smoothstep'
        ? candidate.entryTransition.easing
        : defaults.entryTransition.easing
    },
    spatialPlaque: {
      enabled: typeof candidate.spatialPlaque?.enabled === 'boolean'
        ? candidate.spatialPlaque.enabled
        : defaults.spatialPlaque.enabled,
      width: finiteNumber(candidate.spatialPlaque?.width, defaults.spatialPlaque.width, { min: 0.5, max: 3 }),
      height: finiteNumber(candidate.spatialPlaque?.height, defaults.spatialPlaque.height, { min: 0.3, max: 2 }),
      distance: finiteNumber(candidate.spatialPlaque?.distance, defaults.spatialPlaque.distance, { min: 0.6, max: 4 }),
      verticalOffset: finiteNumber(candidate.spatialPlaque?.verticalOffset, defaults.spatialPlaque.verticalOffset, { min: -1, max: 1 }),
      canvasWidth: Math.round(finiteNumber(candidate.spatialPlaque?.canvasWidth, defaults.spatialPlaque.canvasWidth, { min: 512, max: 2048 })),
      canvasHeight: Math.round(finiteNumber(candidate.spatialPlaque?.canvasHeight, defaults.spatialPlaque.canvasHeight, { min: 320, max: 1280 })),
      titleFontSize: Math.round(finiteNumber(candidate.spatialPlaque?.titleFontSize, defaults.spatialPlaque.titleFontSize, { min: 36, max: 128 })),
      bodyFontSize: Math.round(finiteNumber(candidate.spatialPlaque?.bodyFontSize, defaults.spatialPlaque.bodyFontSize, { min: 24, max: 72 })),
      maxBodyLines: Math.round(finiteNumber(candidate.spatialPlaque?.maxBodyLines, defaults.spatialPlaque.maxBodyLines, { min: 1, max: 10 }))
    }
  };
}

export async function loadExperienceVrSettings({ fetchImpl = globalThis.fetch, debug = false } = {}) {
  try {
    const response = await fetchImpl(publicPath('data/experience-vr-settings.json'), { cache: 'no-cache' });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const parsed = await response.json();
    if (parsed?.schemaVersion !== EXPERIENCE_VR_SETTINGS_SCHEMA_VERSION) {
      throw new Error(`Unsupported schemaVersion: ${parsed?.schemaVersion}`);
    }
    return { settings: normalizeExperienceVrSettings(parsed), settingsSource: 'server', settingsLoadError: null };
  } catch (error) {
    const settingsLoadError = error instanceof Error ? error.message : String(error);
    if (debug) console.warn('[experience-vr-settings] Using code defaults.', settingsLoadError);
    return { settings: structuredClone(DEFAULT_EXPERIENCE_VR_SETTINGS), settingsSource: 'defaults', settingsLoadError };
  }
}
