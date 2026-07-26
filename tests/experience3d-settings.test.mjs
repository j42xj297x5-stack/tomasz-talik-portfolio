import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { DEFAULT_EXPERIENCE3D_SETTINGS, loadExperience3dSettings, normalizeExperience3dSettings, serializeExperience3dSettings, toRuntimeSettings } from '../src/config/experience3dSettings.js';
import { createGalaxySpritesLayer } from '../src/scene/galaxySprites.js';
import * as THREE from '../src/vendor/three.js';

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
const galaxyPanelSource = optionsPanelSource.slice(optionsPanelSource.indexOf("section('Galaxies')"), optionsPanelSource.indexOf("section('Fog')"));
for (const label of ['Enabled', 'Radius', 'Minimum size', 'Maximum size', 'Orbit speed', 'Self rotation speed', 'Opacity']) assert.match(galaxyPanelSource, new RegExp(`'${label}'`));
for (const legacyLabel of ['Count', 'Inner radius', 'Outer radius', 'Vertical spread']) assert.doesNotMatch(galaxyPanelSource, new RegExp(`'${legacyLabel}'`));
assert.equal(optionsPanelSource.split("'Light intensity'").length - 1, 1, 'shared Sun/Moon builder exposes Light intensity');
assert.doesNotMatch(optionsPanelSource, /'Light distance'/, 'Sun/Moon panel does not expose Light distance');
for (const event of ["owner: 'atmosphere', action: 'full-rebuild'", "owner: 'galaxies', action: 'rebuild'", "owner: 'scene', action: 'fog-import'", "owner: 'sun', action: 'apply'", "owner: 'moon', action: 'apply'"]) {
  assert.equal(optionsPanelSource.split(event).length - 1, 1, `import dispatches ${event} exactly once`);
}

const oldGalaxyKeys = ['count', 'innerRadius', 'outerRadius', 'verticalSpread', 'copiesPerTextureMin', 'copiesPerTextureMax', 'opacityVariance', 'randomSeed', 'alphaTest', 'additiveBlending'];
for (const key of oldGalaxyKeys) assert.equal(key in exported.galaxies, false, `export omits legacy galaxy key ${key}`);
const migrated = normalizeExperience3dSettings({ schemaVersion: 1, galaxies: { innerRadius: 40, outerRadius: 60, orbitSpeedMin: 0.002, orbitSpeedMax: 0.006, orbitSpeedMultiplier: 2, ownSpinSpeedMin: 0.04, ownSpinSpeedMax: 0.08, ownSpinSpeedMultiplier: 0.5 } });
assert.equal(migrated.galaxies.radius, 50);
assert.equal(migrated.galaxies.orbitSpeed, 0.008);
assert.equal(migrated.galaxies.selfRotationSpeed, 0.03);

const texture = new THREE.Texture();
const layer = createGalaxySpritesLayer({ texturePaths: ['/a.png', '/b.png', '/a.png', '/c.png', '/d.png', '/e.png', '/f.png'] }, { assetManager: { getAssetByPath: () => ({ texture }) } });
await layer.ready;
assert.equal(layer.getInstanceCount(), 5, 'galaxy layer caps unique texture sprites at five');
assert.equal(new Set(layer.getInstanceTexturePaths()).size, layer.getInstanceCount(), 'active galaxy sprites never duplicate a texture path');
assert.ok(layer.group.children.every((sprite) => sprite.position.z === 0), 'all galaxy sprites share one plane');
layer.dispose();

console.log('Experience 3D settings assertions passed');
