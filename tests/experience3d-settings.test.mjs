import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { DEFAULT_EXPERIENCE3D_SETTINGS, loadExperience3dSettings, normalizeExperience3dSettings, serializeExperience3dSettings, toRuntimeSettings } from '../src/config/experience3dSettings.js';

const response = (body, ok = true, status = 200) => ({ ok, status, json: async () => body });

const override = normalizeExperience3dSettings({ schemaVersion: 1, fog: { near: 12 }, galaxies: { texturePaths: ['/only.png'] } });
assert.equal(override.fog.near, 12);
assert.equal(override.fog.far, DEFAULT_EXPERIENCE3D_SETTINGS.fog.far);
assert.deepEqual(override.galaxies.texturePaths, ['/only.png'], 'arrays are replaced rather than index-merged');

const invalidField = normalizeExperience3dSettings({ schemaVersion: 1, fog: { near: 'bad', unknown: 42 }, unknownRoot: true });
assert.equal(invalidField.fog.near, DEFAULT_EXPERIENCE3D_SETTINGS.fog.near);
assert.equal('unknown' in invalidField.fog, false);
assert.equal('unknownRoot' in invalidField, false);

const missing = await loadExperience3dSettings({ fetchImpl: async () => response(null, false, 404) });
assert.equal(missing.settingsSource, 'defaults');
const wrongSchema = await loadExperience3dSettings({ fetchImpl: async () => response({ schemaVersion: 99 }) });
assert.equal(wrongSchema.settingsSource, 'defaults');
const server = await loadExperience3dSettings({ fetchImpl: async () => response({ schemaVersion: 1, fog: { near: 14 } }) });
assert.equal(server.settings.fog.near, 14);

const exported = serializeExperience3dSettings(toRuntimeSettings(override));
assert.deepEqual(exported, override, 'canonical export/import round-trip is stable');
for (const forbidden of ['performance', 'progressLevel', 'visitedGateIds', 'tuningMode', 'settingsSource']) assert.equal(JSON.stringify(exported).includes(`"${forbidden}"`), false);

const optionsPanelSource = await readFile(new URL('../src/ui/optionsPanel.js', import.meta.url), 'utf8');
assert.doesNotMatch(optionsPanelSource, /localStorage/, 'the legacy browser settings key is never read');
for (const event of ["owner: 'atmosphere', action: 'full-rebuild'", "owner: 'galaxies', action: 'rebuild'", "owner: 'scene', action: 'fog'", "owner: 'sun', action: 'apply'", "owner: 'moon', action: 'apply'"]) {
  assert.equal(optionsPanelSource.split(event).length - 1, 1, `import dispatches ${event} exactly once`);
}

console.log('Experience 3D settings assertions passed');
