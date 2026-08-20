import { portfolioNodes } from '../content/portfolioNodes.js';
import { experienceVrPages } from '../content/experienceVrPages.js';

export const ASSET_STAGES = Object.freeze({
  CRITICAL_INITIAL: 'criticalInitial',
  DEFERRED_WARM: 'deferredWarm',
  OPTIONAL_LATE: 'optionalLate'
});

export const GALAXY_SPRITE_PATHS = Object.freeze([
  '/png/galaxy_01.png',
  '/png/galaxy_02.png',
  '/png/galaxy_03.png',
  '/png/galaxy_04.png',
  '/png/galaxy_05.png'
]);

const withStage = (asset, stage) => ({
  ...asset,
  stage,
  critical: stage === ASSET_STAGES.CRITICAL_INITIAL
});

const glyphModelAssets = portfolioNodes.map((node) => withStage({
  id: `glyph-${node.id}`,
  label: `${node.title} glyph model`,
  path: node.modelPath,
  type: 'model'
}, ASSET_STAGES.CRITICAL_INITIAL));

const atmosphereRelicAssets = Object.freeze([
  ...['stone', 'shell'].flatMap((prefix) => Array.from({ length: 6 }, (_, index) => withStage({
    id: `${prefix}-relic-${index + 1}`,
    label: `${prefix} relic ${index + 1}`,
    path: `/glb/${prefix}_${String(index + 1).padStart(2, '0')}.glb`,
    type: 'model'
  }, ASSET_STAGES.DEFERRED_WARM))),
  ...Array.from({ length: 6 }, (_, index) => withStage({
    id: `small-glyph-relic-${index + 1}`,
    label: `small glyph relic ${index + 1}`,
    path: `/glb/small_glyph_${String(index + 1).padStart(2, '0')}.glb`,
    type: 'model'
  }, ASSET_STAGES.DEFERRED_WARM))
]);

const galaxySpriteAssets = GALAXY_SPRITE_PATHS.map((path, index) => withStage({
  id: `galaxy-sprite-${index + 1}`,
  label: `Galaxy sprite ${index + 1}`,
  path,
  type: 'texture',
  decode: true
}, ASSET_STAGES.DEFERRED_WARM));

const milkyWayBackgroundAsset = withStage({
  id: 'milky-way-background',
  label: 'Milky Way inner-sphere background',
  path: '/png/milky_way.webp',
  type: 'texture'
}, ASSET_STAGES.DEFERRED_WARM);

const criticalInitialAssets = Object.freeze([
  withStage({ id: 'gltf-loader-module', label: 'Vendored GLTFLoader module', path: '/vendor/three/examples/jsm/loaders/GLTFLoader.js', type: 'script' }, ASSET_STAGES.CRITICAL_INITIAL),
  withStage({ id: 'monkey-model', label: 'Central monkey model', path: '/glb/monkey.glb', type: 'model' }, ASSET_STAGES.CRITICAL_INITIAL),
  withStage({ id: 'monkey-stone-model', label: 'Monkey stone model', path: '/glb/monkey_stone.glb', type: 'model' }, ASSET_STAGES.CRITICAL_INITIAL),
  ...glyphModelAssets,
  withStage({ id: 'sun-model', label: 'Sun model', path: '/glb/sun.glb', type: 'model' }, ASSET_STAGES.CRITICAL_INITIAL),
  withStage({ id: 'moon-model', label: 'Moon model', path: '/glb/moon.glb', type: 'model' }, ASSET_STAGES.CRITICAL_INITIAL)
]);

const deferredWarmAssets = Object.freeze([
  withStage({ id: 'vr-astro-attractor-model', label: 'VR Astro attractor tool', path: '/glb/astro_grabber.glb', type: 'model' }, ASSET_STAGES.DEFERRED_WARM),
  withStage({ id: 'vr-astro-furnace-model', label: 'VR Astro furnace', path: '/glb/astral_stove.glb', type: 'model' }, ASSET_STAGES.DEFERRED_WARM),
  withStage({ id: 'vr-asterion-sphere-model', label: 'VR Asterion Sphere physical prototype', path: '/glb/asterion_sphere.glb', type: 'model' }, ASSET_STAGES.DEFERRED_WARM),
  withStage({ id: 'vr-progress-floor-creative-model', label: 'VR Creative progress floor sector model', path: '/glb/floor_creative.glb', type: 'model' }, ASSET_STAGES.DEFERRED_WARM),
  withStage({ id: 'vr-progress-floor-ethics-model', label: 'VR Ethics progress floor sector model', path: '/glb/floor_ethic.glb', type: 'model' }, ASSET_STAGES.DEFERRED_WARM),
  withStage({ id: 'vr-progress-floor-haiku-model', label: 'VR Haiku Cosmos progress floor sector model', path: '/glb/floor_haiku_cosmos.glb', type: 'model' }, ASSET_STAGES.DEFERRED_WARM),
  withStage({ id: 'vr-progress-floor-dig-model', label: 'VR DIG Engine progress floor sector model', path: '/glb/floor_dig_engine.glb', type: 'model' }, ASSET_STAGES.DEFERRED_WARM),
  withStage({ id: 'vr-progress-floor-ai-guide-model', label: 'VR AI Guide progress floor sector model', path: '/glb/floor_ai_guide.glb', type: 'model' }, ASSET_STAGES.DEFERRED_WARM),
  withStage({ id: 'vr-rune-bridge-model', label: 'VR rune bridge model', path: '/glb/bridge.glb', type: 'model' }, ASSET_STAGES.DEFERRED_WARM),
  withStage({ id: 'vr-portal-model', label: 'VR arrival portal model', path: '/glb/portal.glb', type: 'model' }, ASSET_STAGES.DEFERRED_WARM),
  withStage({ id: 'vr-crystal-reliquary-model', label: 'VR crystal reliquary model', path: '/glb/portal_crystal_reliquary.glb', type: 'model' }, ASSET_STAGES.DEFERRED_WARM),
  withStage({ id: 'vr-crystal-reliquary-button-activate-model', label: 'VR crystal reliquary activate button', path: '/glb/portal_crystal_reliquary_button_activate.glb', type: 'model' }, ASSET_STAGES.DEFERRED_WARM),
  withStage({ id: 'vr-crystal-reliquary-button-release-model', label: 'VR crystal reliquary release button', path: '/glb/portal_crystal_reliquary_button_release.glb', type: 'model' }, ASSET_STAGES.DEFERRED_WARM),
  ...experienceVrPages.map((page) => withStage({
    id: page.crystalAssetId,
    label: `${page.glyphId} VR crystal page ${page.order}`,
    path: page.crystalModelPath,
    type: 'model'
  }, ASSET_STAGES.DEFERRED_WARM)),
  ...portfolioNodes.filter((node) => node.plaqueModelPath).map((node) => withStage({
    id: `plaque-${node.id}`,
    label: `${node.title} plaque model`,
    path: node.plaqueModelPath,
    type: 'model'
  }, ASSET_STAGES.DEFERRED_WARM)),
    ...atmosphereRelicAssets,
    ...galaxySpriteAssets,
    milkyWayBackgroundAsset
]);

const optionalLateAssets = Object.freeze([]);

export const assetManifest = Object.freeze({
  criticalInitial: criticalInitialAssets,
  deferredWarm: deferredWarmAssets,
  optionalLate: optionalLateAssets,

  // Backwards-compatible group aliases. Prefer stage names for new preload code.
  coreScene: criticalInitialAssets,
  atmosphere: atmosphereRelicAssets
});

export const INITIAL_PRELOAD_GROUPS = Object.freeze([ASSET_STAGES.CRITICAL_INITIAL]);
export const DEFERRED_PRELOAD_GROUPS = Object.freeze([ASSET_STAGES.DEFERRED_WARM]);
export const OPTIONAL_PRELOAD_GROUPS = Object.freeze([ASSET_STAGES.OPTIONAL_LATE]);

export function getPreloadAssets(groupNames = INITIAL_PRELOAD_GROUPS) {
  const seen = new Set();
  return groupNames
    .flatMap((groupName) => assetManifest[groupName] ?? [])
    .filter((asset) => {
      const key = `${asset.type}:${asset.path}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}

export function getAllPreloadAssets() {
  return getPreloadAssets([ASSET_STAGES.CRITICAL_INITIAL, ASSET_STAGES.DEFERRED_WARM, ASSET_STAGES.OPTIONAL_LATE]);
}
