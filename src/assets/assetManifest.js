import { portfolioNodes } from '../content/portfolioNodes.js';

export const ASSET_STAGES = Object.freeze({
  CRITICAL_INITIAL: 'criticalInitial',
  DEFERRED_WARM: 'deferredWarm',
  OPTIONAL_LATE: 'optionalLate'
});

export const GLYPH_PANEL_BACKGROUNDS = Object.freeze({
  'ai-guide': '/png/ai_guide.png',
  'creative-ai': '/png/creative_ai.png',
  'ethics-life-protection': '/png/ai_ethics.png',
  'spotify-digger': '/png/digger.png',
  'haiku-cosmos': '/png/haiku_cosmos.png'
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

const glyphPanelAssets = Object.entries(GLYPH_PANEL_BACKGROUNDS).map(([nodeId, path]) => withStage({
  id: `panel-bg-${nodeId}`,
  label: `${nodeId} panel background`,
  path,
  type: 'image',
  decode: true
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

const criticalInitialAssets = Object.freeze([
    withStage({ id: 'gltf-loader-module', label: 'Vendored GLTFLoader module', path: '/vendor/three/examples/jsm/loaders/GLTFLoader.js', type: 'script' }, ASSET_STAGES.CRITICAL_INITIAL),
    withStage({ id: 'monkey-model', label: 'Central monkey model', path: '/glb/monkey.glb', type: 'model' }, ASSET_STAGES.CRITICAL_INITIAL),
    ...glyphModelAssets,
    withStage({ id: 'sun-model', label: 'Sun model', path: '/glb/sun.glb', type: 'model' }, ASSET_STAGES.CRITICAL_INITIAL),
    withStage({ id: 'moon-model', label: 'Moon model', path: '/glb/moon.glb', type: 'model' }, ASSET_STAGES.CRITICAL_INITIAL),
    ...glyphPanelAssets
]);

const deferredWarmAssets = Object.freeze([
    ...atmosphereRelicAssets,
    ...galaxySpriteAssets
]);

const optionalLateAssets = Object.freeze([
    withStage({ id: 'wood-tree-effect', label: 'Wood glyph tree effect', path: '/glb/glyph_1-tree.glb', type: 'model' }, ASSET_STAGES.OPTIONAL_LATE)
]);

export const assetManifest = Object.freeze({
  criticalInitial: criticalInitialAssets,
  deferredWarm: deferredWarmAssets,
  optionalLate: optionalLateAssets,

  // Backwards-compatible group aliases. Prefer stage names for new preload code.
  coreScene: criticalInitialAssets,
  glyphPanels: Object.freeze(glyphPanelAssets),
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
