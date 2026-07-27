import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');
const [runtime, passes, galaxies, milkyWay, manifest, atmosphere, settings, interfaceCopy] = await Promise.all([
  read('src/experience3d.js'), read('src/scene/renderScenePasses.js'),
  read('src/scene/galaxySprites.js'), read('src/scene/milkyWayBackground.js'), read('src/assets/assetManifest.js'), read('src/scene/atmosphere.js'),
  read('public/data/experience3d-settings.json'), read('src/i18n/interfaceCopy.js')
]);

assert.match(runtime, /import \{ createExperienceIntro \} from '.\/ui\/experienceIntro\.js'/);
assert.match(runtime, /const experienceIntro = createExperienceIntro\(\{ language: document\.documentElement\.lang \}\)/);
const loaderComplete = runtime.indexOf('await loaderOverlay.complete()');
const introPlay = runtime.indexOf('await experienceIntro.play()');
const fogStart = runtime.lastIndexOf('fogRevealController.start()');
const firstTick = runtime.indexOf('tick();', introPlay);
assert.ok(loaderComplete < introPlay);
assert.ok(introPlay < fogStart);
assert.ok(introPlay < firstTick);
assert.match(runtime, /restoreMilkyWayWarmup\(\);\s*}\s*\/\/[^\n]*\n\s*fogRevealController\.restart\(\);\s*\/\/[^\n]*\n\s*renderScenePasses\(renderer, galaxyBackgroundScene, scene, camera\)/);
assert.match(interfaceCopy, /Całkiem niedawno[\s\S]*w naszej rodzimej galaktyce[\s\S]*Utworzyłem portfolio\./);
assert.match(interfaceCopy, /Not so long ago[\s\S]*in our home galaxy[\s\S]*I created a portfolio\./);

assert.match(runtime, /galaxyBackgroundScene\.add\(galaxyLayer\.group\)/);
assert.ok(runtime.indexOf('galaxyBackgroundScene.add(milkyWayBackground.group)') < runtime.indexOf('galaxyBackgroundScene.add(galaxyLayer.group)'));
assert.match(runtime, /milkyWayBackground\.setProgressionMultiplier\(effectiveLayerMultipliers\.galaxies\)/);
assert.match(manifest, /id: 'milky-way-background'[\s\S]*path: '\/png\/milky_way\.webp'[\s\S]*ASSET_STAGES\.DEFERRED_WARM/);
assert.doesNotMatch(milkyWay, /TextureLoader/);
assert.match(milkyWay, /side: THREE\.BackSide/);
assert.match(milkyWay, /depthWrite: false/);
assert.match(milkyWay, /depthTest: false/);
assert.match(milkyWay, /const visible = group\.visible;[\s\S]*const opacity = mesh\.material\.opacity;[\s\S]*group\.visible = visible;[\s\S]*mesh\.material\.opacity = opacity;/);
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
