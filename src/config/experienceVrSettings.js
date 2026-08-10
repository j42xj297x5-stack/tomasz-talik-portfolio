import { publicPath } from '../utils/publicPath.js';

const THREE_MATH_DEG_TO_RAD = Math.PI / 180;

export const EXPERIENCE_VR_SETTINGS_SCHEMA_VERSION = 1;

export const DEFAULT_EXPERIENCE_VR_SETTINGS = Object.freeze({
  schemaVersion: EXPERIENCE_VR_SETTINGS_SCHEMA_VERSION,
  referenceSpaceType: 'local-floor',
  worldScale: 1,
  spawn: {
    position: { x: 0, y: 0, z: 5.8 },
    lookAt: { x: 0, y: 1, z: 0 }
  },
  renderer: {
    pixelRatioCap: 1.5,
    antialias: true
  },
  furnace: {
    enabled: true,
    placementMode: 'mirror-portal',
    floorOffset: 0,
    position: { x: -2.0, y: 0, z: 1.0 },
    rotationDegrees: { x: 0, y: 0, z: 0 },
    scale: 3,
    debug: false,
    content: {
      enabled: true, snapDuration: 0.42,
      chamberClearance: 0.012, contentClearance: 0.012, rejectDuration: 0.28, rejectDistanceMultiplier: 1.35,
      feedbackOpacity: 0.32, releaseGrace: 0.035, surfaceClearance: 0.006, validColor: 0x49d17d, invalidColor: 0xe05252
    },
    openButton: {
      enabled: true,
      rayMaxDistance: 3,
      emissionInactive: 0,
      emissionHover: 1,
      emissionPressed: 4
    },
    activateButton: {
      enabled: true,
      rayMaxDistance: 3,
      emissionInactive: 0,
      emissionHover: 1,
      emissionPressed: 5
    },
    optionButton: {
      enabled: true, rayMaxDistance: 3, emissionInactive: 0, emissionHover: 5, emissionActive: 3,
      selectionDuration: 0.48, moduleAnglesDegrees: { floor_gyroscope_sphere: 90 },
      halo: { opacity: 0.52, thicknessPixels: 5, pulseDuration: 1.1 }
    },
    panel: {
      enabled: true, width: 1.55, height: 1.05, gapFromFurnace: 0.10, verticalOffset: 0.15, yawDegrees: -12,
      canvasWidth: 1536, canvasHeight: 1024, appearDuration: 0.32, disappearDuration: 0.20,
      telemetryRefreshHz: 12, frameCornerSizePx: 28,
      accents: { asterion: '#72cfe8', attractor: '#c8ac70', emanation: '#a98bd4', idle: '#668493', process: '#9eeaff', complete: '#d9f8ff' }
    },
    process: {
      durationSeconds: 18,
      steadyRpm: 42,
      extractionSpeedMultiplier: 2,
      direction: -1,
      spinupEnd: 1 / 6,
      steadyEnd: 1 / 3,
      extractionEnd: 5 / 6,
      fireCellIdleEmission: 0.15,
      fireCellSteadyEmission: 4,
      fireCellExtractionEmission: 10,
      fireCellPulseMinEmission: 0.05,
      fireCellPulseMaxEmission: 8,
      fireCellPulseHzMin: 0.7,
      fireCellPulseHzMax: 4,
      processLightColor: 0xb8f3ff,
      processLightSteadyIntensity: 18,
      processLightExtractionIntensity: 28,
      processLightDistance: 2.4,
      processLightDecay: 2,
      processLightOrbitRadiusMultiplier: 0.82,
      processLightChamberClearance: 0.012
    },
    chamber: { glassFadeStart: 0.2, glassFadeEnd: 1 }
  },
  asterionSphere: {
    enabled: true,
    qaQueryParam: 'asterionSphere',
    targetDiameter: 0.18,
    holdOffset: { x: 0, y: 0.07, z: -0.11 },
    holdRotationDegrees: { x: 0, y: 0, z: 0 },
    response: 2.5,
    maxAngularSpeedDegrees: 32,
    angularAccelerationDegrees: 32,
    angularDecelerationDegrees: 45,
    settleAngularSpeedDegrees: 0.15,
    targetRingBlendResponse: 12,
    lockThresholdDegrees: 0.5,
    lockDelaySeconds: 0.18,
    production: { buildDurationSeconds: 18, rayMaxDistance: 2.3 }
  },
  playerGuidePanel: {
    enabled: true,
    width: 0.34,
    height: 0.286,
    canvasWidth: 768,
    canvasHeight: 666,
    position: { x: 0.29, y: 0.143, z: -0.18 },
    rotationDegrees: { x: -52, y: 0, z: 0 },
    navigationThreshold: 0.55,
    colors: { background: '#101722', border: '#75d7ff', text: '#eff9ff', muted: '#9ab0bd', selected: '#1f5d78' }
  },
  monkeyGuide: {
    enabled: true,
    rayMaxDistance: 2.3,
    colors: {
      accent: '#ffaa63', messagePanel: '#e99a55', dialoguePanel: '#ffaa63',
      dialogueButtonBackground: '#090909', dialogueButtonBorder: '#ffaa63', dialogueButtonText: '#ffaa63',
      dialogueButtonHoverBackground: '#ffaa63', dialogueButtonHoverText: '#090909',
      hover: '#ffd3ac', text: '#342116', panelOpacity: 0.92
    },
    halo: { color: 0xffaa63, opacity: 0.42, thicknessPixels: 4, pulseDuration: 1.4 },
    attention: {
      position: { x: 0, y: 1.4, z: -0.05 }, radii: [0.08, 0.125, 0.17], thickness: 0.009,
      verticalGap: 0, cycleDuration: 1.35, opacityMin: 0.12, opacityMax: 0.95, scalePulse: 0.025
    },
    message: {
      position: { x: 0, y: 0, z: 0 }, width: 1.7, height: 0.72, gapFromAttention: 0.03,
      canvasWidth: 1280, canvasHeight: 540, paddingX: 44, paddingY: 31, maxBubbleWidthPx: 1150, cornerRadius: 64,
      fontSize: 64, fontWeight: 600, lineHeight: 78, maxLines: 4
    },
    dialogue: {
      position: { x: 1.20, y: 0.30, z: 0.50 }, rotationDegrees: { x: -7.5, y: 0, z: 0 },
      width: 1.65, height: 0.76,
      canvasWidth: 1280, canvasHeight: 590, padding: 42, gap: 24, cornerRadius: 58,
      optionCornerRadius: 36, fontSize: 58, fontWeight: 700,
      menuPaddingX: 24, menuPaddingY: 16,
      historyPageSize: 6, historyColumns: 3, historyGlyphSize: 136, historyStarFontSize: 24,
      historyItemPadding: 18, historyGlyphStarGap: 8,
      navigationWidth: 150
    },
    card: {
      titleFontSize: 58, bodyFontSize: 43, lineHeight: 56, maxLinesPerPage: 6
    }
  },
  controllers: {
    enabled: true,
    rayLength: 2.3,
    rayOpacity: 0.8,
    rayDiameter: 0.010,
    rayTipFraction: 0.08,
    rayRadialSegments: 6
  },
  targetHalo: { color: 0xbfe9ff, opacity: 0.28, thicknessPixels: 3, pulseDuration: 1.45 },
  shellAttractor: {
    targetDistanceRadiusMultiplier: 3,
    scanThreshold: 0.1,
    triggerThreshold: 0.1,
    shellCaptureForwardDistance: 1.3,
    pullAcceleration: 10,
    maxPullSpeed: 8.5,
    captureRadius: 0.28,
    returnDuration: 0.8,
    claimedEmissionMin: 1,
    claimedEmissionMax: 2,
    claimedEmissionPulseDuration: 1.4,
    scanCone: { color: 0x78ff9c, halfAngleDegrees: 2.5, opacityMin: 0.035, opacityMax: 0.065,
      pulseDuration: 1.6, radialSegments: 14 }
  },
  glyphInteraction: { holdDurationSeconds: 0.5, holdLostGraceSeconds: 0.15 },
  glyphLights: { inwardOffset: 1 },
  glyphRing: {
    enabled: true,
    radiusMultiplier: 2,
    angularSpeed: 0.14,
    direction: 1,
    entryAngleThreshold: 0.24,
    entryAngleHysteresis: 0.04
  },
  intro: {
    enabled: true,
    playerStartRadius: 20.0,
    monkeyStartRadius: 18.0,
    thresholdStopOutsideDistance: 1.0,
    guideSpeed: 0.7,
    guideTurnDuration: 1.0,
    pauseDistance: 3.2,
    resumeDistance: 2.4,
    revealProgress: 0.72,
    messageDisplayDuration: 2.0,
    messageGapDuration: 0.5,
    questionGapDuration: 2.0
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
    distanceFromAnchor: 2,
    forwardBias: 0.25,
    floorOffset: 0,
    appearDuration: 0.42,
    appearStartScale: 0.92,
    socket: { xFactor: 0, yFactor: -0.34, zFactor: 0.58, insertRadius: 0.28 }
  },
  reliquary: {
    enabled: true,
    distanceFromPortal: 1.5,
    heightOffset: 0.5,
    insertFeedback: {
      proximityRadiusMultiplier: 1.25,
      opacity: 0.2,
      rejectDuration: 0.35,
      rejectDistance: 0.25
    },
    buttons: { scale: 0.3, forwardDistance: 1, lateralOffset: 0.5, verticalOffset: 0 },
    activateButton: {
      enabled: true,
      rayMaxDistance: 3,
      side: 'left'
    },
    releaseButton: { enabled: true, rayMaxDistance: 3, side: 'right', releaseDelaySeconds: 1, hitAreaScale: 2 }
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
    pullDuration: 0.25,
    scaleMin: 0.22,
    scaleMax: 0.28,
    spawnWidth: 1.45,
    spawnDepth: 0.85,
    minimumSpacing: 0.38,
    spawnInwardOffset: 0.30,
    materializeDuration: 0.55,
    materializeStagger: 0.12,
    materializeStartScale: 0.18,
    materializeRise: 0.12,
    materializeYaw: 0.35,
    consumeDuration: 0.55,
    consumeParticleCount: 14,
    consumeParticleSize: 0.025,
    holdOffset: { x: 0, y: 0, z: -0.09 },
    holdRotationDegrees: { x: 30, y: 0, z: 0 }
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

  const candidateReliquary = candidate.reliquary ?? {};
  const hasLegacyForwardOffset = Number.isFinite(candidateReliquary.forwardOffset);
  const legacyForwardOffset = hasLegacyForwardOffset ? candidateReliquary.forwardOffset : 0;
  const distanceBase = Number.isFinite(candidateReliquary.distanceFromPortal)
    ? candidateReliquary.distanceFromPortal
    : (hasLegacyForwardOffset ? 0.5 : defaults.reliquary.distanceFromPortal);
  const distanceFromPortal = finiteNumber(
    distanceBase + legacyForwardOffset,
    defaults.reliquary.distanceFromPortal,
    { min: 0, max: 5 }
  );
  const legacyButtons = candidateReliquary.buttons ?? candidateReliquary.activateButton ?? {};
  const hasLegacyAngularPlacement = Number.isFinite(legacyButtons.placementRadius)
    || Number.isFinite(legacyButtons.placementAngleDegrees);
  const legacyRadius = finiteNumber(legacyButtons.placementRadius, defaults.reliquary.buttons.forwardDistance, { min: 0, max: 3 });
  const legacyAngle = THREE_MATH_DEG_TO_RAD * finiteNumber(legacyButtons.placementAngleDegrees, 0, { min: 0, max: 89 });
  const processCandidate = candidate.furnace?.process ?? {};
  let spinupEnd = finiteNumber(processCandidate.spinupEnd, defaults.furnace.process.spinupEnd, { min: 0, max: 1 });
  let steadyEnd = finiteNumber(processCandidate.steadyEnd, defaults.furnace.process.steadyEnd, { min: 0, max: 1 });
  let extractionEnd = finiteNumber(processCandidate.extractionEnd, defaults.furnace.process.extractionEnd, { min: 0, max: 1 });
  if (!(spinupEnd < steadyEnd && steadyEnd < extractionEnd)) {
    ({ spinupEnd, steadyEnd, extractionEnd } = defaults.furnace.process);
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
    furnace: {
      enabled: typeof candidate.furnace?.enabled === 'boolean'
        ? candidate.furnace.enabled
        : defaults.furnace.enabled,
      placementMode: ['mirror-portal', 'configured'].includes(candidate.furnace?.placementMode)
        ? candidate.furnace.placementMode
        : defaults.furnace.placementMode,
      floorOffset: finiteNumber(candidate.furnace?.floorOffset, defaults.furnace.floorOffset, { min: -2, max: 2 }),
      position: normalizeVector(candidate.furnace?.position, defaults.furnace.position),
      rotationDegrees: normalizeVector(candidate.furnace?.rotationDegrees, defaults.furnace.rotationDegrees),
      scale: finiteNumber(candidate.furnace?.scale, defaults.furnace.scale, { min: 0.05, max: 10 }),
      debug: typeof candidate.furnace?.debug === 'boolean'
        ? candidate.furnace.debug
        : defaults.furnace.debug,
      content: { ...defaults.furnace.content, ...(candidate.furnace?.content ?? {}) },
      openButton: {
        enabled: typeof candidate.furnace?.openButton?.enabled === 'boolean'
          ? candidate.furnace.openButton.enabled : defaults.furnace.openButton.enabled,
        rayMaxDistance: finiteNumber(candidate.furnace?.openButton?.rayMaxDistance,
          defaults.furnace.openButton.rayMaxDistance, { min: 0.3, max: 5 }),
        emissionInactive: finiteNumber(candidate.furnace?.openButton?.emissionInactive,
          defaults.furnace.openButton.emissionInactive, { min: 0, max: 10 }),
        emissionHover: finiteNumber(candidate.furnace?.openButton?.emissionHover,
          defaults.furnace.openButton.emissionHover, { min: 0, max: 10 }),
        emissionPressed: finiteNumber(candidate.furnace?.openButton?.emissionPressed,
          defaults.furnace.openButton.emissionPressed, { min: 0, max: 10 })
      },
      activateButton: {
        enabled: typeof candidate.furnace?.activateButton?.enabled === 'boolean'
          ? candidate.furnace.activateButton.enabled : defaults.furnace.activateButton.enabled,
        rayMaxDistance: finiteNumber(candidate.furnace?.activateButton?.rayMaxDistance,
          defaults.furnace.activateButton.rayMaxDistance, { min: 0.3, max: 5 }),
        emissionInactive: finiteNumber(candidate.furnace?.activateButton?.emissionInactive,
          defaults.furnace.activateButton.emissionInactive, { min: 0 }),
        emissionHover: finiteNumber(candidate.furnace?.activateButton?.emissionHover,
          defaults.furnace.activateButton.emissionHover, { min: 0 }),
        emissionPressed: finiteNumber(candidate.furnace?.activateButton?.emissionPressed,
          defaults.furnace.activateButton.emissionPressed, { min: 0 })
      },
      optionButton: {
        enabled: typeof candidate.furnace?.optionButton?.enabled === 'boolean' ? candidate.furnace.optionButton.enabled : defaults.furnace.optionButton.enabled,
        rayMaxDistance: finiteNumber(candidate.furnace?.optionButton?.rayMaxDistance, defaults.furnace.optionButton.rayMaxDistance, { min: 0.3, max: 5 }),
        emissionInactive: finiteNumber(candidate.furnace?.optionButton?.emissionInactive, defaults.furnace.optionButton.emissionInactive, { min: 0 }),
        emissionHover: finiteNumber(candidate.furnace?.optionButton?.emissionHover, defaults.furnace.optionButton.emissionHover, { min: 0 }),
        emissionActive: finiteNumber(candidate.furnace?.optionButton?.emissionActive, defaults.furnace.optionButton.emissionActive, { min: 0 }),
        halo: {
          opacity: finiteNumber(candidate.furnace?.optionButton?.halo?.opacity,
            defaults.furnace.optionButton.halo.opacity, { min: 0.05, max: 0.6 }),
          thicknessPixels: finiteNumber(candidate.furnace?.optionButton?.halo?.thicknessPixels,
            defaults.furnace.optionButton.halo.thicknessPixels, { min: 0.5, max: 8 }),
          pulseDuration: finiteNumber(candidate.furnace?.optionButton?.halo?.pulseDuration,
            defaults.furnace.optionButton.halo.pulseDuration, { min: 0.5, max: 2 })
        }
      },
      panel: {
        enabled: typeof candidate.furnace?.panel?.enabled === 'boolean' ? candidate.furnace.panel.enabled : defaults.furnace.panel.enabled,
        width: finiteNumber(candidate.furnace?.panel?.width, defaults.furnace.panel.width, { min: .5, max: 4 }),
        height: finiteNumber(candidate.furnace?.panel?.height, defaults.furnace.panel.height, { min: .3, max: 3 }),
        gapFromFurnace: finiteNumber(candidate.furnace?.panel?.gapFromFurnace, defaults.furnace.panel.gapFromFurnace, { min: 0, max: 2 }),
        verticalOffset: finiteNumber(candidate.furnace?.panel?.verticalOffset, defaults.furnace.panel.verticalOffset, { min: -2, max: 2 }),
        yawDegrees: finiteNumber(candidate.furnace?.panel?.yawDegrees, defaults.furnace.panel.yawDegrees, { min: -45, max: 45 }),
        canvasWidth: finiteNumber(candidate.furnace?.panel?.canvasWidth, defaults.furnace.panel.canvasWidth, { min: 256, max: 4096 }),
        canvasHeight: finiteNumber(candidate.furnace?.panel?.canvasHeight, defaults.furnace.panel.canvasHeight, { min: 256, max: 4096 }),
        appearDuration: finiteNumber(candidate.furnace?.panel?.appearDuration, defaults.furnace.panel.appearDuration, { min: .01, max: 2 }),
        disappearDuration: finiteNumber(candidate.furnace?.panel?.disappearDuration, defaults.furnace.panel.disappearDuration, { min: .01, max: 2 }),
        telemetryRefreshHz: finiteNumber(candidate.furnace?.panel?.telemetryRefreshHz, defaults.furnace.panel.telemetryRefreshHz, { min: 4, max: 30 }),
        frameCornerSizePx: finiteNumber(candidate.furnace?.panel?.frameCornerSizePx, defaults.furnace.panel.frameCornerSizePx, { min: 12, max: 64 }),
        accents: { ...defaults.furnace.panel.accents, ...(candidate.furnace?.panel?.accents ?? {}) }
      },
      process: {
        durationSeconds: finiteNumber(processCandidate.durationSeconds, defaults.furnace.process.durationSeconds, { min: 5, max: 60 }),
        steadyRpm: finiteNumber(processCandidate.steadyRpm, defaults.furnace.process.steadyRpm, { min: 1, max: 180 }),
        extractionSpeedMultiplier: finiteNumber(processCandidate.extractionSpeedMultiplier,
          defaults.furnace.process.extractionSpeedMultiplier, { min: 1, max: 4 }),
        direction: processCandidate.direction === 1 || processCandidate.direction === -1
          ? processCandidate.direction : defaults.furnace.process.direction,
        spinupEnd, steadyEnd, extractionEnd,
        fireCellIdleEmission: finiteNumber(processCandidate.fireCellIdleEmission,
          defaults.furnace.process.fireCellIdleEmission, { min: 0 }),
        fireCellSteadyEmission: finiteNumber(processCandidate.fireCellSteadyEmission,
          defaults.furnace.process.fireCellSteadyEmission, { min: 0 }),
        fireCellExtractionEmission: finiteNumber(processCandidate.fireCellExtractionEmission,
          defaults.furnace.process.fireCellExtractionEmission, { min: 0 }),
        fireCellPulseMinEmission: finiteNumber(processCandidate.fireCellPulseMinEmission,
          defaults.furnace.process.fireCellPulseMinEmission, { min: 0 }),
        fireCellPulseMaxEmission: finiteNumber(processCandidate.fireCellPulseMaxEmission,
          defaults.furnace.process.fireCellPulseMaxEmission, { min: 0 }),
        fireCellPulseHzMin: finiteNumber(processCandidate.fireCellPulseHzMin,
          defaults.furnace.process.fireCellPulseHzMin, { min: 0 }),
        fireCellPulseHzMax: finiteNumber(processCandidate.fireCellPulseHzMax,
          defaults.furnace.process.fireCellPulseHzMax, { min: 0 }),
        processLightColor: Number.isFinite(processCandidate.processLightColor)
          ? processCandidate.processLightColor : defaults.furnace.process.processLightColor,
        processLightSteadyIntensity: finiteNumber(processCandidate.processLightSteadyIntensity,
          defaults.furnace.process.processLightSteadyIntensity, { min: 0 }),
        processLightExtractionIntensity: finiteNumber(processCandidate.processLightExtractionIntensity,
          defaults.furnace.process.processLightExtractionIntensity, { min: 0 }),
        processLightDistance: finiteNumber(processCandidate.processLightDistance,
          defaults.furnace.process.processLightDistance, { min: 0 }),
        processLightDecay: finiteNumber(processCandidate.processLightDecay,
          defaults.furnace.process.processLightDecay, { min: 0 }),
        processLightOrbitRadiusMultiplier: finiteNumber(processCandidate.processLightOrbitRadiusMultiplier,
          defaults.furnace.process.processLightOrbitRadiusMultiplier, { min: 0, max: .99 }),
        processLightChamberClearance: finiteNumber(processCandidate.processLightChamberClearance,
          defaults.furnace.process.processLightChamberClearance, { min: 0 })
      },
      chamber: {
        glassFadeStart: finiteNumber(candidate.furnace?.chamber?.glassFadeStart,
          defaults.furnace.chamber.glassFadeStart, { min: 0, max: 1 }),
        glassFadeEnd: finiteNumber(candidate.furnace?.chamber?.glassFadeEnd,
          defaults.furnace.chamber.glassFadeEnd, { min: 0, max: 1 })
      }
    },
    asterionSphere: {
      enabled: typeof candidate.asterionSphere?.enabled === 'boolean' ? candidate.asterionSphere.enabled : defaults.asterionSphere.enabled,
      qaQueryParam: typeof candidate.asterionSphere?.qaQueryParam === 'string' && candidate.asterionSphere.qaQueryParam.trim()
        ? candidate.asterionSphere.qaQueryParam.trim() : defaults.asterionSphere.qaQueryParam,
      targetDiameter: finiteNumber(candidate.asterionSphere?.targetDiameter, defaults.asterionSphere.targetDiameter, { min: 0.03, max: 0.5 }),
      holdOffset: normalizeVector(candidate.asterionSphere?.holdOffset, defaults.asterionSphere.holdOffset),
      holdRotationDegrees: normalizeVector(candidate.asterionSphere?.holdRotationDegrees, defaults.asterionSphere.holdRotationDegrees),
      response: finiteNumber(candidate.asterionSphere?.response, defaults.asterionSphere.response, { min: 0, max: 40 }),
      maxAngularSpeedDegrees: finiteNumber(candidate.asterionSphere?.maxAngularSpeedDegrees, defaults.asterionSphere.maxAngularSpeedDegrees, { min: 0 }),
      angularAccelerationDegrees: finiteNumber(candidate.asterionSphere?.angularAccelerationDegrees, defaults.asterionSphere.angularAccelerationDegrees, { min: 0 }),
      angularDecelerationDegrees: finiteNumber(candidate.asterionSphere?.angularDecelerationDegrees, defaults.asterionSphere.angularDecelerationDegrees, { min: 0 }),
      settleAngularSpeedDegrees: finiteNumber(candidate.asterionSphere?.settleAngularSpeedDegrees, defaults.asterionSphere.settleAngularSpeedDegrees, { min: 0 }),
      lockThresholdDegrees: finiteNumber(candidate.asterionSphere?.lockThresholdDegrees, defaults.asterionSphere.lockThresholdDegrees, { min: 0, max: 10 }),
      lockDelaySeconds: finiteNumber(candidate.asterionSphere?.lockDelaySeconds, defaults.asterionSphere.lockDelaySeconds, { min: 0, max: 2 }),
      production: {
        buildDurationSeconds: finiteNumber(candidate.asterionSphere?.production?.buildDurationSeconds, defaults.asterionSphere.production.buildDurationSeconds, { min: 18, max: 18 }),
        rayMaxDistance: finiteNumber(candidate.asterionSphere?.production?.rayMaxDistance, defaults.asterionSphere.production.rayMaxDistance, { min: 0.1, max: 2.3 })
      }
    },
    playerGuidePanel: {
      enabled: typeof candidate.playerGuidePanel?.enabled === 'boolean' ? candidate.playerGuidePanel.enabled : defaults.playerGuidePanel.enabled,
      width: finiteNumber(candidate.playerGuidePanel?.width, defaults.playerGuidePanel.width, { min: 0.1, max: 1 }),
      height: finiteNumber(candidate.playerGuidePanel?.height, defaults.playerGuidePanel.height, { min: 0.1, max: 1 }),
      canvasWidth: Math.round(finiteNumber(candidate.playerGuidePanel?.canvasWidth, defaults.playerGuidePanel.canvasWidth, { min: 256, max: 2048 })),
      canvasHeight: Math.round(finiteNumber(candidate.playerGuidePanel?.canvasHeight, defaults.playerGuidePanel.canvasHeight, { min: 256, max: 2048 })),
      position: normalizeVector(candidate.playerGuidePanel?.position, defaults.playerGuidePanel.position),
      rotationDegrees: normalizeVector(candidate.playerGuidePanel?.rotationDegrees, defaults.playerGuidePanel.rotationDegrees),
      navigationThreshold: finiteNumber(candidate.playerGuidePanel?.navigationThreshold, defaults.playerGuidePanel.navigationThreshold, { min: 0.1, max: 1 }),
      colors: { ...defaults.playerGuidePanel.colors, ...(candidate.playerGuidePanel?.colors ?? {}) }
    },
    monkeyGuide: {
      enabled: typeof candidate.monkeyGuide?.enabled === 'boolean' ? candidate.monkeyGuide.enabled : defaults.monkeyGuide.enabled,
      rayMaxDistance: finiteNumber(candidate.monkeyGuide?.rayMaxDistance, defaults.monkeyGuide.rayMaxDistance, { min: 0.3, max: defaults.controllers.rayLength }),
      colors: {
        ...defaults.monkeyGuide.colors,
        ...(candidate.monkeyGuide?.colors ?? {}),
        messagePanel: candidate.monkeyGuide?.colors?.messagePanel
          ?? candidate.monkeyGuide?.colors?.panel ?? defaults.monkeyGuide.colors.messagePanel,
        dialoguePanel: candidate.monkeyGuide?.colors?.dialoguePanel
          ?? candidate.monkeyGuide?.colors?.panel ?? defaults.monkeyGuide.colors.dialoguePanel
      },
      halo: {
        color: Math.round(finiteNumber(candidate.monkeyGuide?.halo?.color, defaults.monkeyGuide.halo.color, { min: 0, max: 0xffffff })),
        opacity: finiteNumber(candidate.monkeyGuide?.halo?.opacity, defaults.monkeyGuide.halo.opacity, { min: 0.05, max: 0.8 }),
        thicknessPixels: finiteNumber(candidate.monkeyGuide?.halo?.thicknessPixels, defaults.monkeyGuide.halo.thicknessPixels, { min: 0.5, max: 8 }),
        pulseDuration: finiteNumber(candidate.monkeyGuide?.halo?.pulseDuration, defaults.monkeyGuide.halo.pulseDuration, { min: 0.5, max: 3 })
      },
      attention: {
        ...defaults.monkeyGuide.attention, ...(candidate.monkeyGuide?.attention ?? {}),
        position: normalizeVector(candidate.monkeyGuide?.attention?.position, defaults.monkeyGuide.attention.position),
        radii: Array.isArray(candidate.monkeyGuide?.attention?.radii) && candidate.monkeyGuide.attention.radii.length === 3
          ? candidate.monkeyGuide.attention.radii.map((radius, index) => finiteNumber(radius, defaults.monkeyGuide.attention.radii[index], { min: 0.03, max: 1 }))
          : [...defaults.monkeyGuide.attention.radii]
      },
      message: {
        ...defaults.monkeyGuide.message, ...(candidate.monkeyGuide?.message ?? {}),
        position: normalizeVector(candidate.monkeyGuide?.message?.position, defaults.monkeyGuide.message.position)
      },
      dialogue: {
        ...defaults.monkeyGuide.dialogue, ...(candidate.monkeyGuide?.dialogue ?? {}),
        position: normalizeVector(candidate.monkeyGuide?.dialogue?.position, defaults.monkeyGuide.dialogue.position),
        rotationDegrees: normalizeVector(candidate.monkeyGuide?.dialogue?.rotationDegrees,
          defaults.monkeyGuide.dialogue.rotationDegrees)
      },
      card: { ...defaults.monkeyGuide.card, ...(candidate.monkeyGuide?.card ?? {}) }
    },
    controllers: {
      enabled: typeof candidate.controllers?.enabled === 'boolean'
        ? candidate.controllers.enabled
        : defaults.controllers.enabled,
      rayLength: finiteNumber(candidate.controllers?.rayLength, defaults.controllers.rayLength, { min: 0.1, max: 20 }),
      rayOpacity: finiteNumber(candidate.controllers?.rayOpacity, defaults.controllers.rayOpacity, { min: 0.05, max: 1 }),
      rayDiameter: finiteNumber(candidate.controllers?.rayDiameter, defaults.controllers.rayDiameter, { min: 0.004, max: 0.04 }),
      rayTipFraction: finiteNumber(candidate.controllers?.rayTipFraction, defaults.controllers.rayTipFraction, { min: 0.05, max: 0.1 }),
      rayRadialSegments: Math.round(finiteNumber(candidate.controllers?.rayRadialSegments,
        defaults.controllers.rayRadialSegments, { min: 4, max: 10 }))
    },
    targetHalo: {
      color: Math.round(finiteNumber(candidate.targetHalo?.color, defaults.targetHalo.color, { min: 0, max: 0xffffff })),
      opacity: finiteNumber(candidate.targetHalo?.opacity, defaults.targetHalo.opacity, { min: 0.05, max: 0.6 }),
      thicknessPixels: finiteNumber(candidate.targetHalo?.thicknessPixels,
        defaults.targetHalo.thicknessPixels, { min: 0.5, max: 8 }),
      pulseDuration: finiteNumber(candidate.targetHalo?.pulseDuration, defaults.targetHalo.pulseDuration, { min: 1.3, max: 1.6 })
    },
    shellAttractor: {
      targetDistanceRadiusMultiplier: finiteNumber(candidate.shellAttractor?.targetDistanceRadiusMultiplier,
        defaults.shellAttractor.targetDistanceRadiusMultiplier, { min: 1, max: 6 }),
      scanThreshold: finiteNumber(candidate.shellAttractor?.scanThreshold,
        defaults.shellAttractor.scanThreshold, { min: 0, max: 1 }),
      triggerThreshold: finiteNumber(candidate.shellAttractor?.triggerThreshold,
        defaults.shellAttractor.triggerThreshold, { min: 0, max: 1 }),
      shellCaptureForwardDistance: finiteNumber(candidate.shellAttractor?.shellCaptureForwardDistance,
        defaults.shellAttractor.shellCaptureForwardDistance, { min: 0.2, max: 3 }),
      pullAcceleration: finiteNumber(candidate.shellAttractor?.pullAcceleration,
        defaults.shellAttractor.pullAcceleration, { min: 1, max: 30 }),
      maxPullSpeed: finiteNumber(candidate.shellAttractor?.maxPullSpeed,
        defaults.shellAttractor.maxPullSpeed, { min: 1, max: 20 }),
      captureRadius: finiteNumber(candidate.shellAttractor?.captureRadius,
        defaults.shellAttractor.captureRadius, { min: 0.05, max: 1 }),
      returnDuration: finiteNumber(candidate.shellAttractor?.returnDuration,
        defaults.shellAttractor.returnDuration, { min: 0.1, max: 2 }),
      claimedEmissionMin: finiteNumber(candidate.shellAttractor?.claimedEmissionMin,
        defaults.shellAttractor.claimedEmissionMin, { min: 0, max: 10 }),
      claimedEmissionMax: finiteNumber(candidate.shellAttractor?.claimedEmissionMax,
        defaults.shellAttractor.claimedEmissionMax, { min: 0, max: 10 }),
      claimedEmissionPulseDuration: finiteNumber(candidate.shellAttractor?.claimedEmissionPulseDuration,
        defaults.shellAttractor.claimedEmissionPulseDuration, { min: 0.2, max: 10 }),
      scanCone: {
        color: Math.round(finiteNumber(candidate.shellAttractor?.scanCone?.color,
          defaults.shellAttractor.scanCone.color, { min: 0, max: 0xffffff })),
        halfAngleDegrees: finiteNumber(candidate.shellAttractor?.scanCone?.halfAngleDegrees,
          defaults.shellAttractor.scanCone.halfAngleDegrees, { min: 0.1, max: 30 }),
        opacityMin: finiteNumber(candidate.shellAttractor?.scanCone?.opacityMin,
          defaults.shellAttractor.scanCone.opacityMin, { min: 0, max: 1 }),
        opacityMax: finiteNumber(candidate.shellAttractor?.scanCone?.opacityMax,
          defaults.shellAttractor.scanCone.opacityMax, { min: 0, max: 1 }),
        pulseDuration: finiteNumber(candidate.shellAttractor?.scanCone?.pulseDuration,
          defaults.shellAttractor.scanCone.pulseDuration, { min: 0.2, max: 10 }),
        radialSegments: Math.round(finiteNumber(candidate.shellAttractor?.scanCone?.radialSegments,
          defaults.shellAttractor.scanCone.radialSegments, { min: 3, max: 32 }))
      }
    },
    glyphInteraction: {
      holdDurationSeconds: finiteNumber(candidate.glyphInteraction?.holdDurationSeconds,
        defaults.glyphInteraction.holdDurationSeconds, { min: 0.1, max: 5 }),
      holdLostGraceSeconds: finiteNumber(candidate.glyphInteraction?.holdLostGraceSeconds,
        defaults.glyphInteraction.holdLostGraceSeconds, { min: 0, max: 1 })
    },
    glyphLights: {
      inwardOffset: finiteNumber(candidate.glyphLights?.inwardOffset,
        defaults.glyphLights.inwardOffset, { min: 0, max: 5 })
    },
    glyphRing: {
      enabled: typeof candidate.glyphRing?.enabled === 'boolean' ? candidate.glyphRing.enabled : defaults.glyphRing.enabled,
      radiusMultiplier: finiteNumber(candidate.glyphRing?.radiusMultiplier, defaults.glyphRing.radiusMultiplier, { min: 0.25, max: 5 }),
      angularSpeed: finiteNumber(candidate.glyphRing?.angularSpeed, defaults.glyphRing.angularSpeed, { min: 0, max: 2 }),
      direction: candidate.glyphRing?.direction === -1 ? -1 : 1,
      entryAngleThreshold: finiteNumber(candidate.glyphRing?.entryAngleThreshold, defaults.glyphRing.entryAngleThreshold, { min: 0.01, max: Math.PI }),
      entryAngleHysteresis: finiteNumber(candidate.glyphRing?.entryAngleHysteresis, defaults.glyphRing.entryAngleHysteresis, { min: 0, max: 0.5 })
    },
    intro: {
      enabled: typeof candidate.intro?.enabled === 'boolean' ? candidate.intro.enabled : defaults.intro.enabled,
      playerStartRadius: finiteNumber(candidate.intro?.playerStartRadius, defaults.intro.playerStartRadius, { min: 1, max: 100 }),
      monkeyStartRadius: finiteNumber(candidate.intro?.monkeyStartRadius, defaults.intro.monkeyStartRadius, { min: 1, max: 100 }),
      thresholdStopOutsideDistance: finiteNumber(candidate.intro?.thresholdStopOutsideDistance,
        defaults.intro.thresholdStopOutsideDistance, { min: 0.05, max: 10 }),
      guideSpeed: finiteNumber(candidate.intro?.guideSpeed, defaults.intro.guideSpeed, { min: 0.1, max: 3 }),
      guideTurnDuration: finiteNumber(candidate.intro?.guideTurnDuration, defaults.intro.guideTurnDuration, { min: 0.1, max: 10 }),
      pauseDistance: finiteNumber(candidate.intro?.pauseDistance, defaults.intro.pauseDistance, { min: 1, max: 10 }),
      resumeDistance: finiteNumber(candidate.intro?.resumeDistance, defaults.intro.resumeDistance, { min: 0.5, max: 9 }),
      revealProgress: finiteNumber(candidate.intro?.revealProgress, defaults.intro.revealProgress, { min: 0.4, max: 1 }),
      messageDisplayDuration: finiteNumber(candidate.intro?.messageDisplayDuration,
        defaults.intro.messageDisplayDuration, { min: 0.5, max: 5 }),
      messageGapDuration: finiteNumber(candidate.intro?.messageGapDuration,
        defaults.intro.messageGapDuration, { min: 0, max: 5 }),
      questionGapDuration: finiteNumber(candidate.intro?.questionGapDuration,
        defaults.intro.questionGapDuration, { min: 0, max: 5 })
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
      distanceFromAnchor: finiteNumber(candidate.portal?.distanceFromAnchor, defaults.portal.distanceFromAnchor, { min: 0.5, max: 5 }),
      forwardBias: finiteNumber(candidate.portal?.forwardBias, defaults.portal.forwardBias, { min: -0.5, max: 1 }),
      floorOffset: finiteNumber(candidate.portal?.floorOffset, defaults.portal.floorOffset, { min: -1, max: 1 }),
      appearDuration: finiteNumber(candidate.portal?.appearDuration, defaults.portal.appearDuration, { min: 0.05, max: 3 }),
      appearStartScale: finiteNumber(candidate.portal?.appearStartScale, defaults.portal.appearStartScale, { min: 0.1, max: 1 }),
      socket: {
        xFactor: finiteNumber(candidate.portal?.socket?.xFactor, defaults.portal.socket.xFactor, { min: -1, max: 1 }),
        yFactor: finiteNumber(candidate.portal?.socket?.yFactor, defaults.portal.socket.yFactor, { min: -1, max: 1 }),
        zFactor: finiteNumber(candidate.portal?.socket?.zFactor, defaults.portal.socket.zFactor, { min: -2, max: 2 }),
        insertRadius: finiteNumber(candidate.portal?.socket?.insertRadius, defaults.portal.socket.insertRadius, { min: 0.05, max: 1 })
      }
    },
    reliquary: {
      enabled: typeof candidateReliquary.enabled === 'boolean' ? candidateReliquary.enabled : defaults.reliquary.enabled,
      distanceFromPortal,
      heightOffset: finiteNumber(candidateReliquary.heightOffset ?? candidateReliquary.floorOffset,
        defaults.reliquary.heightOffset, { min: -1, max: 2 }),
      insertFeedback: {
        proximityRadiusMultiplier: finiteNumber(candidateReliquary.insertFeedback?.proximityRadiusMultiplier,
          defaults.reliquary.insertFeedback.proximityRadiusMultiplier, { min: 1, max: 3 }),
        opacity: finiteNumber(candidateReliquary.insertFeedback?.opacity,
          defaults.reliquary.insertFeedback.opacity, { min: 0.02, max: 0.6 }),
        rejectDuration: finiteNumber(candidateReliquary.insertFeedback?.rejectDuration,
          defaults.reliquary.insertFeedback.rejectDuration, { min: 0.05, max: 2 }),
        rejectDistance: finiteNumber(candidateReliquary.insertFeedback?.rejectDistance,
          defaults.reliquary.insertFeedback.rejectDistance, { min: 0.05, max: 1 })
      },
      buttons: {
        scale: finiteNumber(candidateReliquary.buttons?.scale, defaults.reliquary.buttons.scale, { min: 0.05, max: 1 }),
        forwardDistance: finiteNumber(candidateReliquary.buttons?.forwardDistance
          ?? (hasLegacyAngularPlacement ? Math.cos(legacyAngle) * legacyRadius : undefined),
        defaults.reliquary.buttons.forwardDistance, { min: 0, max: 3 }),
        lateralOffset: finiteNumber(candidateReliquary.buttons?.lateralOffset
          ?? (hasLegacyAngularPlacement ? Math.sin(legacyAngle) * legacyRadius : undefined),
        defaults.reliquary.buttons.lateralOffset, { min: 0, max: 2 }),
        verticalOffset: finiteNumber(candidateReliquary.buttons?.verticalOffset
          ?? candidateReliquary.activateButton?.verticalOffset, defaults.reliquary.buttons.verticalOffset, { min: -1, max: 1 })
      },
      activateButton: {
        enabled: typeof candidate.reliquary?.activateButton?.enabled === 'boolean'
          ? candidate.reliquary.activateButton.enabled : defaults.reliquary.activateButton.enabled,
        rayMaxDistance: finiteNumber(candidate.reliquary?.activateButton?.rayMaxDistance,
          defaults.reliquary.activateButton.rayMaxDistance, { min: 0.3, max: 5 }),
        side: candidate.reliquary?.activateButton?.side === 'right' ? 'right' : 'left'
      },
      releaseButton: {
        enabled: typeof candidate.reliquary?.releaseButton?.enabled === 'boolean'
          ? candidate.reliquary.releaseButton.enabled : defaults.reliquary.releaseButton.enabled,
        rayMaxDistance: finiteNumber(candidate.reliquary?.releaseButton?.rayMaxDistance,
          defaults.reliquary.releaseButton.rayMaxDistance, { min: 0.3, max: 5 }),
        side: candidate.reliquary?.releaseButton?.side === 'left' ? 'left' : 'right',
        releaseDelaySeconds: finiteNumber(candidate.reliquary?.releaseButton?.releaseDelaySeconds,
          defaults.reliquary.releaseButton.releaseDelaySeconds, { min: 0, max: 3 }),
        hitAreaScale: finiteNumber(candidate.reliquary?.releaseButton?.hitAreaScale,
          defaults.reliquary.releaseButton.hitAreaScale, { min: 1, max: 4 })
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
      pullDuration: finiteNumber(candidate.crystals?.pullDuration, defaults.crystals.pullDuration, { min: 0.05, max: 1 }),
      scaleMin: finiteNumber(candidate.crystals?.scaleMin, defaults.crystals.scaleMin, { min: 0.1, max: 0.3 }),
      scaleMax: finiteNumber(candidate.crystals?.scaleMax, defaults.crystals.scaleMax, { min: 0.2, max: 0.4 }),
      spawnWidth: finiteNumber(candidate.crystals?.spawnWidth, defaults.crystals.spawnWidth, { min: 0.5, max: 3 }),
      spawnDepth: finiteNumber(candidate.crystals?.spawnDepth, defaults.crystals.spawnDepth, { min: 0.2, max: 2 }),
      minimumSpacing: finiteNumber(candidate.crystals?.minimumSpacing, defaults.crystals.minimumSpacing, { min: 0.1, max: 1 }),
      spawnInwardOffset: finiteNumber(candidate.crystals?.spawnInwardOffset,
        defaults.crystals.spawnInwardOffset, { min: 0, max: 1 }),
      materializeDuration: finiteNumber(candidate.crystals?.materializeDuration, defaults.crystals.materializeDuration, { min: 0.1, max: 2 }),
      materializeStagger: finiteNumber(candidate.crystals?.materializeStagger, defaults.crystals.materializeStagger, { min: 0, max: 0.5 }),
      materializeStartScale: finiteNumber(candidate.crystals?.materializeStartScale, defaults.crystals.materializeStartScale, { min: 0.05, max: 1 }),
      materializeRise: finiteNumber(candidate.crystals?.materializeRise, defaults.crystals.materializeRise, { min: 0, max: 0.5 }),
      materializeYaw: finiteNumber(candidate.crystals?.materializeYaw, defaults.crystals.materializeYaw, { min: 0, max: 1 }),
      consumeDuration: finiteNumber(candidate.crystals?.consumeDuration, defaults.crystals.consumeDuration, { min: 0.1, max: 2 }),
      consumeParticleCount: Math.round(finiteNumber(candidate.crystals?.consumeParticleCount,
        defaults.crystals.consumeParticleCount, { min: 8, max: 20 })),
      consumeParticleSize: finiteNumber(candidate.crystals?.consumeParticleSize,
        defaults.crystals.consumeParticleSize, { min: 0.005, max: 0.08 }),
      holdOffset: normalizeVector(candidate.crystals?.holdOffset, defaults.crystals.holdOffset),
      holdRotationDegrees: normalizeVector(candidate.crystals?.holdRotationDegrees, defaults.crystals.holdRotationDegrees)
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
