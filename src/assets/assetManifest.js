import { portfolioNodes } from '../content/portfolioNodes.js';

export const GLYPH_PANEL_BACKGROUNDS = Object.freeze({
  'ai-guide': '/png/ai_guide.png',
  'creative-ai': '/png/creative_ai.png'
});

export const GALAXY_SPRITE_PATHS = Object.freeze([
  '/png/galaxy_01.png',
  '/png/galaxy_02.png',
  '/png/galaxy_03.png',
  '/png/galaxy_04.png',
  '/png/galaxy_05.png'
]);

const glyphModelAssets = portfolioNodes.map((node) => ({
  id: `glyph-${node.id}`,
  label: `${node.title} glyph model`,
  path: node.modelPath,
  type: 'model',
  critical: true
}));

const glyphPanelAssets = Object.entries(GLYPH_PANEL_BACKGROUNDS).map(([nodeId, path]) => ({
  id: `panel-bg-${nodeId}`,
  label: `${nodeId} panel background`,
  path,
  type: 'image',
  critical: true,
  decode: true
}));

export const assetManifest = Object.freeze({
  coreScene: Object.freeze([
    { id: 'gltf-loader-module', label: 'Vendored GLTFLoader module', path: '/vendor/three/examples/jsm/loaders/GLTFLoader.js', type: 'script', critical: true },
    { id: 'monkey-model', label: 'Central monkey model', path: '/glb/monkey.glb', type: 'model', critical: true },
    ...glyphModelAssets,
    { id: 'sun-model', label: 'Sun model', path: '/glb/sun.glb', type: 'model', critical: true },
    { id: 'moon-model', label: 'Moon model', path: '/glb/moon.glb', type: 'model', critical: true },
    ...GALAXY_SPRITE_PATHS.map((path, index) => ({
      id: `galaxy-sprite-${index + 1}`,
      label: `Galaxy sprite ${index + 1}`,
      path,
      type: 'texture',
      critical: true,
      decode: true
    }))
  ]),
  glyphPanels: Object.freeze(glyphPanelAssets),
  atmosphere: Object.freeze([
    ...['stone', 'shell'].flatMap((prefix) => Array.from({ length: 6 }, (_, index) => ({
      id: `${prefix}-relic-${index + 1}`,
      label: `${prefix} relic ${index + 1}`,
      path: `/glb/${prefix}_${String(index + 1).padStart(2, '0')}.glb`,
      type: 'model',
      critical: true
    }))),
    ...Array.from({ length: 6 }, (_, index) => ({
      id: `small-glyph-relic-${index + 1}`,
      label: `small glyph relic ${index + 1}`,
      path: `/glb/small_glyph_${String(index + 1).padStart(2, '0')}.glb`,
      type: 'model',
      critical: true
    }))
  ]),
  optionalLate: Object.freeze([
    { id: 'wood-tree-effect', label: 'Wood glyph tree effect', path: '/glb/glyph_1-tree.glb', type: 'model', critical: false }
  ])
});

export const INITIAL_PRELOAD_GROUPS = Object.freeze(['coreScene', 'glyphPanels', 'atmosphere']);

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
