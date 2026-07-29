import { publicPath } from '../utils/publicPath.js';

export const EXPERIENCE_VR_SETTINGS_SCHEMA_VERSION = 1;

export const DEFAULT_EXPERIENCE_VR_SETTINGS = Object.freeze({
  schemaVersion: EXPERIENCE_VR_SETTINGS_SCHEMA_VERSION,
  referenceSpaceType: 'local-floor',
  worldScale: 1,
  spawn: {
    position: { x: 0, y: 0, z: 8.6 },
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
  glyphRing: {
    enabled: true,
    radiusMultiplier: 2,
    angularSpeed: 0.14,
    direction: 1,
    entryAngleThreshold: 0.24,
    entryAngleHysteresis: 0.04
  },
  entryTransition: {
    enabled: true,
    durationSeconds: 3,
    targetRadiusFactor: 0.76,
    target: { x: 0, z: 1.8 },
    easing: 'smoothstep'
  },
  portal: {
    enabled: true,
    maxWidth: 2.8,
    maxHeight: 3.2,
    distance: 2.15,
    verticalOffset: -0.15,
    appearDuration: 0.42,
    appearStartScale: 0.92,
    socket: { xFactor: 0, yFactor: -0.34, zFactor: 0.58, insertRadius: 0.28 }
  },
  portalCanvas: {
    enabled: true,
    width: 1.35,
    height: 0.85,
    offset: { x: 0, y: 0.12, z: 0.018 },
    canvasWidth: 1024,
    canvasHeight: 640,
    titleFontSize: 72,
    bodyFontSize: 42,
    maxBodyLines: 6
  },
  crystals: {
    enabled: true,
    grabRadius: 0.32,
    scaleMin: 0.22,
    scaleMax: 0.28,
    spawnWidth: 1.45,
    spawnDepth: 0.85,
    minimumSpacing: 0.38,
    holdOffset: { x: 0, y: 0, z: -0.09 }
  },
  locomotion: {
    enabled: true,
    deadzone: 0.18,
    moveSpeed: 1.8,
    turnSpeed: 1.35
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
    glyphRing: {
      enabled: typeof candidate.glyphRing?.enabled === 'boolean' ? candidate.glyphRing.enabled : defaults.glyphRing.enabled,
      radiusMultiplier: finiteNumber(candidate.glyphRing?.radiusMultiplier, defaults.glyphRing.radiusMultiplier, { min: 0.25, max: 5 }),
      angularSpeed: finiteNumber(candidate.glyphRing?.angularSpeed, defaults.glyphRing.angularSpeed, { min: 0, max: 2 }),
      direction: candidate.glyphRing?.direction === -1 ? -1 : 1,
      entryAngleThreshold: finiteNumber(candidate.glyphRing?.entryAngleThreshold, defaults.glyphRing.entryAngleThreshold, { min: 0.01, max: Math.PI }),
      entryAngleHysteresis: finiteNumber(candidate.glyphRing?.entryAngleHysteresis, defaults.glyphRing.entryAngleHysteresis, { min: 0, max: 0.5 })
    },
    entryTransition: {
      enabled: typeof candidate.entryTransition?.enabled === 'boolean'
        ? candidate.entryTransition.enabled
        : defaults.entryTransition.enabled,
      durationSeconds: finiteNumber(candidate.entryTransition?.durationSeconds, defaults.entryTransition.durationSeconds, { min: 0.1, max: 30 }),
      targetRadiusFactor: finiteNumber(candidate.entryTransition?.targetRadiusFactor, defaults.entryTransition.targetRadiusFactor, { min: 0.2, max: 0.8 }),
      target: {
        x: finiteNumber(candidate.entryTransition?.target?.x, defaults.entryTransition.target.x),
        z: finiteNumber(candidate.entryTransition?.target?.z, defaults.entryTransition.target.z)
      },
      easing: candidate.entryTransition?.easing === 'smoothstep'
        ? candidate.entryTransition.easing
        : defaults.entryTransition.easing
    },
    portal: {
      enabled: typeof candidate.portal?.enabled === 'boolean' ? candidate.portal.enabled : defaults.portal.enabled,
      maxWidth: finiteNumber(candidate.portal?.maxWidth, defaults.portal.maxWidth, { min: 0.5, max: 8 }),
      maxHeight: finiteNumber(candidate.portal?.maxHeight, defaults.portal.maxHeight, { min: 0.5, max: 8 }),
      distance: finiteNumber(candidate.portal?.distance, defaults.portal.distance, { min: 0.6, max: 6 }),
      verticalOffset: finiteNumber(candidate.portal?.verticalOffset, defaults.portal.verticalOffset, { min: -3, max: 3 }),
      appearDuration: finiteNumber(candidate.portal?.appearDuration, defaults.portal.appearDuration, { min: 0.05, max: 3 }),
      appearStartScale: finiteNumber(candidate.portal?.appearStartScale, defaults.portal.appearStartScale, { min: 0.1, max: 1 }),
      socket: {
        xFactor: finiteNumber(candidate.portal?.socket?.xFactor, defaults.portal.socket.xFactor, { min: -1, max: 1 }),
        yFactor: finiteNumber(candidate.portal?.socket?.yFactor, defaults.portal.socket.yFactor, { min: -1, max: 1 }),
        zFactor: finiteNumber(candidate.portal?.socket?.zFactor, defaults.portal.socket.zFactor, { min: -2, max: 2 }),
        insertRadius: finiteNumber(candidate.portal?.socket?.insertRadius, defaults.portal.socket.insertRadius, { min: 0.05, max: 1 })
      }
    },
    portalCanvas: {
      enabled: typeof candidate.portalCanvas?.enabled === 'boolean' ? candidate.portalCanvas.enabled : defaults.portalCanvas.enabled,
      width: finiteNumber(candidate.portalCanvas?.width, defaults.portalCanvas.width, { min: 0.5, max: 3 }),
      height: finiteNumber(candidate.portalCanvas?.height, defaults.portalCanvas.height, { min: 0.3, max: 2 }),
      offset: normalizeVector(candidate.portalCanvas?.offset, defaults.portalCanvas.offset),
      canvasWidth: Math.round(finiteNumber(candidate.portalCanvas?.canvasWidth, defaults.portalCanvas.canvasWidth, { min: 512, max: 2048 })),
      canvasHeight: Math.round(finiteNumber(candidate.portalCanvas?.canvasHeight, defaults.portalCanvas.canvasHeight, { min: 320, max: 1280 })),
      titleFontSize: Math.round(finiteNumber(candidate.portalCanvas?.titleFontSize, defaults.portalCanvas.titleFontSize, { min: 36, max: 128 })),
      bodyFontSize: Math.round(finiteNumber(candidate.portalCanvas?.bodyFontSize, defaults.portalCanvas.bodyFontSize, { min: 24, max: 72 })),
      maxBodyLines: Math.round(finiteNumber(candidate.portalCanvas?.maxBodyLines, defaults.portalCanvas.maxBodyLines, { min: 1, max: 10 }))
    },
    crystals: {
      enabled: typeof candidate.crystals?.enabled === 'boolean' ? candidate.crystals.enabled : defaults.crystals.enabled,
      grabRadius: finiteNumber(candidate.crystals?.grabRadius, defaults.crystals.grabRadius, { min: 0.05, max: 1 }),
      scaleMin: finiteNumber(candidate.crystals?.scaleMin, defaults.crystals.scaleMin, { min: 0.1, max: 0.3 }),
      scaleMax: finiteNumber(candidate.crystals?.scaleMax, defaults.crystals.scaleMax, { min: 0.2, max: 0.4 }),
      spawnWidth: finiteNumber(candidate.crystals?.spawnWidth, defaults.crystals.spawnWidth, { min: 0.5, max: 3 }),
      spawnDepth: finiteNumber(candidate.crystals?.spawnDepth, defaults.crystals.spawnDepth, { min: 0.2, max: 2 }),
      minimumSpacing: finiteNumber(candidate.crystals?.minimumSpacing, defaults.crystals.minimumSpacing, { min: 0.1, max: 1 }),
      holdOffset: normalizeVector(candidate.crystals?.holdOffset, defaults.crystals.holdOffset)
    },
    locomotion: {
      enabled: typeof candidate.locomotion?.enabled === 'boolean' ? candidate.locomotion.enabled : defaults.locomotion.enabled,
      deadzone: finiteNumber(candidate.locomotion?.deadzone, defaults.locomotion.deadzone, { min: 0, max: 0.9 }),
      moveSpeed: finiteNumber(candidate.locomotion?.moveSpeed, defaults.locomotion.moveSpeed, { min: 0, max: 10 }),
      turnSpeed: finiteNumber(candidate.locomotion?.turnSpeed, defaults.locomotion.turnSpeed, { min: 0, max: 6 })
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
