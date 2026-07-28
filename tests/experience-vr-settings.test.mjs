import assert from 'node:assert/strict';
import {
  DEFAULT_EXPERIENCE_VR_SETTINGS,
  loadExperienceVrSettings,
  normalizeExperienceVrSettings
} from '../src/config/experienceVrSettings.js';

assert.deepEqual(normalizeExperienceVrSettings(null), DEFAULT_EXPERIENCE_VR_SETTINGS);
assert.deepEqual(normalizeExperienceVrSettings({ schemaVersion: 2 }), DEFAULT_EXPERIENCE_VR_SETTINGS);

const normalized = normalizeExperienceVrSettings({
  schemaVersion: 1,
  referenceSpaceType: 'local',
  worldScale: 2,
  spawn: { position: { x: 1, y: 'bad', z: 5 }, lookAt: { x: 0, y: 2, z: 0 } },
  renderer: { pixelRatioCap: 99, antialias: false },
  controllers: { enabled: false, rayLength: 0, rayOpacity: 4, idleScale: 'bad', activeScale: 99 },
  entryTransition: { enabled: false, durationSeconds: 99, target: { x: 2, z: 'bad' }, easing: 'linear' },
  ignored: true
});
assert.equal(normalized.referenceSpaceType, 'local');
assert.deepEqual(normalized.spawn.position, { x: 1, y: 0, z: 5 });
assert.equal(normalized.renderer.pixelRatioCap, 2);
assert.equal(normalized.renderer.antialias, false);
assert.deepEqual(normalized.controllers, {
  enabled: false,
  rayLength: 0.1,
  rayOpacity: 1,
  idleScale: 1,
  activeScale: 5
});
assert.deepEqual(normalized.entryTransition, {
  enabled: false,
  durationSeconds: 30,
  target: { x: 2, z: 1.8 },
  easing: 'smoothstep'
});
assert.equal('ignored' in normalized, false);

const server = await loadExperienceVrSettings({
  fetchImpl: async () => ({ ok: true, json: async () => ({ ...DEFAULT_EXPERIENCE_VR_SETTINGS, worldScale: 1.25 }) })
});
assert.equal(server.settingsSource, 'server');
assert.equal(server.settings.worldScale, 1.25);
assert.equal(server.settingsLoadError, null);

const fallback = await loadExperienceVrSettings({ fetchImpl: async () => { throw new Error('offline'); } });
assert.equal(fallback.settingsSource, 'defaults');
assert.equal(fallback.settingsLoadError, 'offline');
assert.deepEqual(fallback.settings, DEFAULT_EXPERIENCE_VR_SETTINGS);

console.log('Experience VR settings assertions passed');
