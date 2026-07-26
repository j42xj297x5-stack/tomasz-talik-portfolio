import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');
const [runtime, passes, galaxies, atmosphere, settings] = await Promise.all([
  read('src/experience3d.js'), read('src/scene/renderScenePasses.js'),
  read('src/scene/galaxySprites.js'), read('src/scene/atmosphere.js'),
  read('public/data/experience3d-settings.json')
]);

assert.match(runtime, /galaxyBackgroundScene\.add\(galaxyLayer\.group\)/);
assert.ok(passes.indexOf('renderer.render(galaxyBackgroundScene, camera)') < passes.indexOf('renderer.clearDepth()'));
assert.ok(passes.indexOf('renderer.clearDepth()') < passes.indexOf('renderer.render(mainScene, camera)'));
assert.equal((runtime.match(/new THREE\.WebGLRenderer/g) ?? []).length, 1);
assert.equal((runtime.match(/<canvas/g) ?? []).length, 1);

const cutoff = Number(galaxies.match(/GALAXY_ALPHA_CUTOFF = ([\d.]+)/)?.[1]);
assert.ok(cutoff > 0 && cutoff < 0.1);
assert.match(galaxies, /premultipliedAlpha: true/);
assert.match(atmosphere, /opacity>=RELIC_DEPTH_WRITE_OPACITY_THRESHOLD/);
assert.match(atmosphere, /RELIC_DEPTH_WRITE_OPACITY_THRESHOLD = 0\.98/);

const publicSettings = JSON.parse(settings);
assert.equal(publicSettings.atmosphere.dust.depthTest, true);
assert.equal(publicSettings.atmosphere.dust.depthWrite, false);
assert.equal(publicSettings.galaxies.radius, 43.9);

console.log('Experience 3D render contract tests passed.');
