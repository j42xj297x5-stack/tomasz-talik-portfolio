import * as THREE from '../vendor/three.js';
import { DEFAULT_EXPERIENCE3D_SETTINGS } from '../config/experience3dSettings.js';

export const GALAXY_SPRITES_DEFAULTS = { ...DEFAULT_EXPERIENCE3D_SETTINGS.galaxies };

const TWO_PI = Math.PI * 2;
const MAX_TEXTURES = 5;
const PHASE_OFFSET = Math.PI / 2;
const PROGRESSION_EPSILON = 0.0001;
const GALAXY_ALPHA_CUTOFF = 0.05;

function clamp(value, min, max) { return Math.min(max, Math.max(min, value)); }
function finite(value, fallback) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function normalizeOptions(options = {}) {
  const config = { ...GALAXY_SPRITES_DEFAULTS, ...options };
  const paths = Array.isArray(options.texturePaths) ? options.texturePaths : GALAXY_SPRITES_DEFAULTS.texturePaths;
  config.texturePaths = [...new Set(paths.filter((path) => typeof path === 'string' && path.length > 0))].slice(0, MAX_TEXTURES);
  config.enabled = Boolean(config.enabled);
  config.radius = clamp(finite(config.radius, GALAXY_SPRITES_DEFAULTS.radius), 1, 90);
  config.minScale = clamp(finite(config.minScale, GALAXY_SPRITES_DEFAULTS.minScale), 0.01, 24);
  config.maxScale = clamp(finite(config.maxScale, GALAXY_SPRITES_DEFAULTS.maxScale), config.minScale, 30);
  config.orbitSpeed = clamp(finite(config.orbitSpeed, GALAXY_SPRITES_DEFAULTS.orbitSpeed), -0.1, 0.1);
  config.selfRotationSpeed = clamp(finite(config.selfRotationSpeed, GALAXY_SPRITES_DEFAULTS.selfRotationSpeed), -1, 1);
  config.opacity = clamp(finite(config.opacity, GALAXY_SPRITES_DEFAULTS.opacity), 0, 1);
  return config;
}

function positionOnPlane(instance, radius) {
  instance.sprite.position.set(Math.cos(instance.angle) * radius, Math.sin(instance.angle) * radius, 0);
}

function makeSpriteMaterial(texture) {
  // The source PNGs contain pale RGB values in nearly transparent pixels.
  // Premultiplication plus a small cutoff removes that fringe while retaining
  // the useful soft edge.
  if (!texture.premultiplyAlpha) {
    texture.premultiplyAlpha = true;
    texture.needsUpdate = true;
  }
  const material = new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    depthTest: true,
    depthWrite: false,
    blending: THREE.NormalBlending,
    alphaTest: GALAXY_ALPHA_CUTOFF,
    premultipliedAlpha: true
  });
  if ('toneMapped' in material) material.toneMapped = false;
  return material;
}

export function createGalaxySpritesLayer(options = {}, { assetManager = null, deferUntilWarm = false } = {}) {
  const group = new THREE.Group();
  group.name = 'GalaxySpritesLayer';
  const instances = [];
  let config = normalizeOptions(options);
  let buildId = 0;
  let disposed = false;
  let progressionMultiplier = 1;
  let revealProgress = 0;
  let hasHydratedDeferred = false;
  const lifecycleCounts = { galaxyRebuilds: 0, galaxyHydrations: 0 };

  function clearInstances() {
    instances.forEach(({ sprite, material }) => { group.remove(sprite); material.dispose(); });
    instances.length = 0;
  }

  function loadTexture(texturePath) {
    const record = assetManager?.getAssetByPath?.(texturePath);
    if (record?.texture) return { texture: record.texture, texturePath };
    if (assetManager?.isPreloadComplete?.()) console.warn(`[galaxySprites] Texture ${texturePath} was not in AssetManager cache. Skipping it.`);
    return null;
  }

  function scaleForIndex(index, count) {
    if (count <= 1) return (config.minScale + config.maxScale) / 2;
    return config.minScale + (config.maxScale - config.minScale) * (index / (count - 1));
  }

  async function rebuild(nextOptions = {}) {
    lifecycleCounts.galaxyRebuilds += 1;
    config = normalizeOptions({ ...config, ...nextOptions });
    const currentBuildId = ++buildId;
    clearInstances();
    group.visible = config.enabled;
    if (!config.enabled || config.texturePaths.length === 0) return;

    const textures = config.texturePaths.map(loadTexture).filter(Boolean);
    if (disposed || currentBuildId !== buildId) return;
    textures.forEach((record, index) => {
      const material = makeSpriteMaterial(record.texture);
      material.opacity = config.opacity * revealProgress;
      const sprite = new THREE.Sprite(material);
      const angle = PHASE_OFFSET + (index / textures.length) * TWO_PI;
      const scale = scaleForIndex(index, textures.length);
      sprite.name = `GalaxySprite:${record.texturePath}`;
      sprite.userData.nonInteractive = true;
      sprite.userData.texturePath = record.texturePath;
      sprite.scale.setScalar(scale);
      const instance = { sprite, material, texturePath: record.texturePath, angle, rotation: angle, scale };
      positionOnPlane(instance, config.radius);
      material.rotation = instance.rotation;
      group.add(sprite);
      instances.push(instance);
    });
  }

  function applyRuntimeOptions(nextOptions = {}) {
    config = normalizeOptions({ ...config, ...nextOptions });
    group.visible = config.enabled && (revealProgress > PROGRESSION_EPSILON || progressionMultiplier > PROGRESSION_EPSILON);
    instances.forEach((instance) => {
      positionOnPlane(instance, config.radius);
      instance.material.opacity = config.opacity * revealProgress;
    });
  }

  function update(delta = 0) {
    if (!config.enabled || disposed) return;
    revealProgress += (progressionMultiplier - revealProgress) * Math.min(1, delta / 0.65);
    if (Math.abs(revealProgress - progressionMultiplier) <= PROGRESSION_EPSILON) revealProgress = progressionMultiplier;
    group.visible = revealProgress > PROGRESSION_EPSILON || progressionMultiplier > PROGRESSION_EPSILON;
    if (!group.visible) return;
    instances.forEach((instance) => {
      instance.angle += config.orbitSpeed * delta;
      instance.rotation += config.selfRotationSpeed * delta;
      positionOnPlane(instance, config.radius);
      instance.material.rotation = instance.rotation;
      instance.material.opacity = config.opacity * revealProgress;
    });
  }

  async function hydrateDeferred() {
    lifecycleCounts.galaxyHydrations += 1;
    if (hasHydratedDeferred) return;
    hasHydratedDeferred = true;
    await rebuild();
  }

  const ready = deferUntilWarm ? Promise.resolve() : hydrateDeferred();
  return {
    group, ready, update, rebuild, hydrateDeferred, applyRuntimeOptions,
    setEnabled(enabled) { applyRuntimeOptions({ enabled }); },
    setProgressionMultiplier(value = 1) { progressionMultiplier = clamp(finite(value, 0), 0, 1); },
    getOptions: () => ({ ...config, texturePaths: config.texturePaths.slice() }),
    getInstanceCount: () => instances.length,
    getInstanceTexturePaths: () => instances.map(({ texturePath }) => texturePath),
    getLifecycleCounts: () => ({ ...lifecycleCounts }),
    showForWarmup() { const visible = group.visible; group.visible = true; return () => { group.visible = visible; }; },
    dispose() { disposed = true; buildId += 1; clearInstances(); }
  };
}
