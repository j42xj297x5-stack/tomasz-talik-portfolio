import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import {
  DEFAULT_EXPERIENCE_VR_SETTINGS,
  loadExperienceVrSettings,
  normalizeExperienceVrSettings
} from '../src/config/experienceVrSettings.js';

assert.deepEqual(normalizeExperienceVrSettings(null), DEFAULT_EXPERIENCE_VR_SETTINGS);
assert.deepEqual(DEFAULT_EXPERIENCE_VR_SETTINGS.spatial, { entryDirection: { x: 0, y: 0, z: 1 }, playerStartRadius: 20, monkeyStartRadius: 18, monkeyFinal: { x: 0, y: 0, z: 0 }, ringRadius: 7.6, worldStableCenterY: 1.05, thresholdOutsideDistance: 1 });
assert.equal(DEFAULT_EXPERIENCE_VR_SETTINGS.glyphInteraction.holdDurationSeconds, 0.5);
assert.equal(DEFAULT_EXPERIENCE_VR_SETTINGS.glyphInteraction.holdLostGraceSeconds, 0.15);
assert.equal(DEFAULT_EXPERIENCE_VR_SETTINGS.controllers.rayLength, 2.3);
assert.equal(DEFAULT_EXPERIENCE_VR_SETTINGS.controllers.rayDiameter, 0.01);
assert.equal(DEFAULT_EXPERIENCE_VR_SETTINGS.playerGuidePanel.position.x, 0.29);
assert.equal(DEFAULT_EXPERIENCE_VR_SETTINGS.playerGuidePanel.rotationDegrees.x, -52);
assert.equal(DEFAULT_EXPERIENCE_VR_SETTINGS.intro.emergeDuration, 12);
assert.equal(DEFAULT_EXPERIENCE_VR_SETTINGS.intro.introRevealDuration, 13);
assert.equal(DEFAULT_EXPERIENCE_VR_SETTINGS.intro.postRevealSilenceDuration, 2);
assert.equal(DEFAULT_EXPERIENCE_VR_SETTINGS.intro.insideSafeMargin, 0.75);
assert.equal(DEFAULT_EXPERIENCE_VR_SETTINGS.intro.glyphFreeExploreDuration, 60);
assert.equal(DEFAULT_EXPERIENCE_VR_SETTINGS.intro.guideTurnDuration, 1);
assert.equal(DEFAULT_EXPERIENCE_VR_SETTINGS.intro.followGraceDistance, 3);
assert.equal(DEFAULT_EXPERIENCE_VR_SETTINGS.intro.messageDisplayDuration, 2);
assert.equal(DEFAULT_EXPERIENCE_VR_SETTINGS.intro.messageGapDuration, 0.5);
assert.equal(DEFAULT_EXPERIENCE_VR_SETTINGS.intro.questionGapDuration, 2);
assert.deepEqual(DEFAULT_EXPERIENCE_VR_SETTINGS.monkeyGuide.attention.radii, [0.08, 0.125, 0.17]);
assert.equal(DEFAULT_EXPERIENCE_VR_SETTINGS.monkeyGuide.attention.thickness, 0.009);
assert.equal(DEFAULT_EXPERIENCE_VR_SETTINGS.monkeyGuide.attention.verticalGap, 0);
assert.equal(DEFAULT_EXPERIENCE_VR_SETTINGS.monkeyGuide.attention.position.z, -0.05);
assert.equal(DEFAULT_EXPERIENCE_VR_SETTINGS.monkeyGuide.message.gapFromAttention, 0.03);
assert.equal(DEFAULT_EXPERIENCE_VR_SETTINGS.monkeyGuide.message.paddingX, 44);
assert.equal(DEFAULT_EXPERIENCE_VR_SETTINGS.monkeyGuide.message.paddingY, 31);
assert.equal(DEFAULT_EXPERIENCE_VR_SETTINGS.monkeyGuide.dialogue.historyGlyphSize, 136);
assert.deepEqual(DEFAULT_EXPERIENCE_VR_SETTINGS.monkeyGuide.dialogue.position, { x: 1.20, y: 0.30, z: 0.50 });
assert.deepEqual(DEFAULT_EXPERIENCE_VR_SETTINGS.monkeyGuide.dialogue.rotationDegrees, { x: -7.5, y: 0, z: 0 });
assert.equal(DEFAULT_EXPERIENCE_VR_SETTINGS.monkeyGuide.colors.messagePanel, '#e99a55');
assert.equal(DEFAULT_EXPERIENCE_VR_SETTINGS.monkeyGuide.colors.dialoguePanel, '#ffaa63');
assert.equal(DEFAULT_EXPERIENCE_VR_SETTINGS.monkeyGuide.colors.dialogueButtonBackground, '#090909');
assert.equal(DEFAULT_EXPERIENCE_VR_SETTINGS.monkeyGuide.colors.dialogueButtonBorder, '#ffaa63');
assert.equal(DEFAULT_EXPERIENCE_VR_SETTINGS.monkeyGuide.colors.dialogueButtonText, '#ffaa63');
assert.equal(DEFAULT_EXPERIENCE_VR_SETTINGS.monkeyGuide.colors.dialogueButtonHoverBackground, '#ffaa63');
assert.equal(DEFAULT_EXPERIENCE_VR_SETTINGS.monkeyGuide.colors.dialogueButtonHoverText, '#090909');
assert.equal(DEFAULT_EXPERIENCE_VR_SETTINGS.targetHalo.thicknessPixels, 3);
assert.deepEqual(DEFAULT_EXPERIENCE_VR_SETTINGS.furnace.optionButton.halo,
  { opacity: 0.52, thicknessPixels: 5, pulseDuration: 1.1 });
assert.equal(DEFAULT_EXPERIENCE_VR_SETTINGS.furnace.optionButton.emissionHover, 5);
assert.equal(DEFAULT_EXPERIENCE_VR_SETTINGS.glyphLights.inwardOffset, 1);
assert.equal(DEFAULT_EXPERIENCE_VR_SETTINGS.crystals.spawnInwardOffset, 0.3);
assert.equal(DEFAULT_EXPERIENCE_VR_SETTINGS.crystals.consumeDuration, 0.55);
assert.deepEqual(DEFAULT_EXPERIENCE_VR_SETTINGS.portal.position, { x: -2.910428, y: 0, z: -0.727607 });
assert.deepEqual(DEFAULT_EXPERIENCE_VR_SETTINGS.furnace.position, { x: 2.910428, y: 0, z: -0.727607 });
const publicOverrides = JSON.parse(await readFile(new URL('../public/data/experience-vr-settings.json', import.meta.url), 'utf8'));
const activeSettings = normalizeExperienceVrSettings(publicOverrides);
assert.deepEqual(activeSettings.portal.position, { x: -2.910428, y: 0, z: -0.727607 });
assert.deepEqual(activeSettings.furnace.position, { x: 2.910428, y: 0, z: -0.727607 });
assert.equal('position' in (publicOverrides.reliquary ?? {}), false, 'public reliquary override does not restore legacy absolute placement');
assert.equal(activeSettings.reliquary.distanceFromPortal, 1.5);
assert.deepEqual(normalizeExperienceVrSettings({ schemaVersion: 2 }), DEFAULT_EXPERIENCE_VR_SETTINGS);

const normalized = normalizeExperienceVrSettings({
  schemaVersion: 1,
  referenceSpaceType: 'local',
  spatial: { entryDirection: { x: 0, y: 'bad', z: 2 }, playerStartRadius: 200, monkeyStartRadius: 0, monkeyFinal: { x: 1, y: 0, z: 2 }, ringRadius: 0, worldStableCenterY: 99, thresholdOutsideDistance: 20 },
  renderer: { pixelRatioCap: 99, antialias: false },
  controllers: { enabled: false, rayLength: 0, rayOpacity: 4, rayDiameter: 2, rayTipFraction: 1, rayRadialSegments: 99 },
  targetHalo: { color: -1, opacity: 4, thicknessPixels: 20, pulseDuration: 9 },
  glyphInteraction: { holdDurationSeconds: 20, holdLostGraceSeconds: 4 },
  glyphLights: { inwardOffset: 20 },
  portal: { enabled: false, maxWidth: 0, maxHeight: 20, floorOffset: -9, appearDuration: 0, appearStartScale: 9 },
  reliquary: { distanceFromPortal: 9, floorOffset: 9,
    activateButton: { placementRadius: 8, placementAngleDegrees: -4, verticalOffset: 7 } },
  portalCanvas: {
    enabled: false, width: 0, height: 9,
    canvasWidth: 3000.6, canvasHeight: 100, titleFontSize: 10, bodyFontSize: 200, maxBodyLines: 0
  },
  crystals: { pullDuration: 0, holdRotationDegrees: { x: -30, y: 5, z: 'bad' } },
  ignored: true
});
assert.equal(normalized.referenceSpaceType, 'local');
assert.deepEqual(normalized.spatial, { entryDirection: { x: 0, y: 0, z: 2 }, playerStartRadius: 100, monkeyStartRadius: 1, monkeyFinal: { x: 1, y: 0, z: 2 }, ringRadius: 1, worldStableCenterY: 10, thresholdOutsideDistance: 10 });
assert.equal(normalized.renderer.pixelRatioCap, 2);
assert.equal(normalized.renderer.antialias, false);
assert.deepEqual(normalized.controllers, {
  enabled: false,
  rayLength: 0.1,
  rayOpacity: 1,
  rayDiameter: 0.04,
  rayTipFraction: 0.1,
  rayRadialSegments: 10
});
assert.deepEqual(normalized.targetHalo, { color: 0, opacity: 0.6, thicknessPixels: 8, pulseDuration: 1.6 });
assert.deepEqual(normalized.glyphInteraction, { holdDurationSeconds: 5, holdLostGraceSeconds: 1 });
assert.deepEqual(normalized.glyphLights, { inwardOffset: 5 });
assert.deepEqual(normalized.portal, {
  enabled: false, position: DEFAULT_EXPERIENCE_VR_SETTINGS.portal.position, rotationDegrees: DEFAULT_EXPERIENCE_VR_SETTINGS.portal.rotationDegrees,
  maxWidth: 0.5, maxHeight: 8, floorOffset: -1,
  appearDuration: 0.05, appearStartScale: 1,
  socket: DEFAULT_EXPERIENCE_VR_SETTINGS.portal.socket
});
assert.deepEqual(normalized.portalCanvas, {
  enabled: false, width: 0.5, height: 2, offset: { x: 0, y: 0.12, z: 0.018 },
  canvasWidth: 2048, canvasHeight: 320, titleFontSize: 36, bodyFontSize: 72, maxBodyLines: 1
});
assert.deepEqual(normalized.reliquary, {
  ...DEFAULT_EXPERIENCE_VR_SETTINGS.reliquary,
  distanceFromPortal: 3,
  heightOffset: 2,
  buttons: { ...DEFAULT_EXPERIENCE_VR_SETTINGS.reliquary.buttons, forwardDistance: 3, lateralOffset: 0, verticalOffset: 1 }
});

const modernPlacement = normalizeExperienceVrSettings({ schemaVersion: 1, reliquary: {
  distanceFromPortal: -9, heightOffset: -9,
  buttons: { scale: 9, forwardDistance: 9, lateralOffset: 9, verticalOffset: -9 }
} }).reliquary;
assert.deepEqual(modernPlacement, {
  ...DEFAULT_EXPERIENCE_VR_SETTINGS.reliquary,
  distanceFromPortal: 0,
  heightOffset: -1,
  buttons: { scale: 1, forwardDistance: 3, lateralOffset: 2, verticalOffset: -1 }
});
assert.deepEqual(normalized.locomotion, DEFAULT_EXPERIENCE_VR_SETTINGS.locomotion);
assert.deepEqual(normalized.crystals, {
  ...DEFAULT_EXPERIENCE_VR_SETTINGS.crystals,
  pullDuration: 0.05,
  holdRotationDegrees: { x: -30, y: 5, z: 0 }
});
assert.equal('ignored' in normalized, false);

const normalizedGuide = normalizeExperienceVrSettings({ schemaVersion: 1, monkeyGuide: {
  dialogue: { rotationDegrees: { x: 4, y: 'bad', z: -2 } },
  colors: { panel: '#123456' }
} }).monkeyGuide;
assert.deepEqual(normalizedGuide.dialogue.rotationDegrees, { x: 4, y: 0, z: -2 });
assert.equal(normalizedGuide.colors.messagePanel, '#123456', 'legacy panel color remains a safe message fallback');
assert.equal(normalizedGuide.colors.dialoguePanel, '#123456', 'legacy panel color remains a safe dialogue fallback');

const server = await loadExperienceVrSettings({
  fetchImpl: async () => ({ ok: true, json: async () => ({ ...DEFAULT_EXPERIENCE_VR_SETTINGS, spatial: { ...DEFAULT_EXPERIENCE_VR_SETTINGS.spatial, ringRadius: 8 } }) })
});
assert.equal(server.settingsSource, 'server');
assert.equal(server.settings.spatial.ringRadius, 8);
assert.equal(server.settingsLoadError, null);

const fallback = await loadExperienceVrSettings({ fetchImpl: async () => { throw new Error('offline'); } });
assert.equal(fallback.settingsSource, 'defaults');
assert.equal(fallback.settingsLoadError, 'offline');
assert.deepEqual(fallback.settings, DEFAULT_EXPERIENCE_VR_SETTINGS);

console.log('Experience VR settings assertions passed');
