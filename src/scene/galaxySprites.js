import * as THREE from '../vendor/three.js';

export const GALAXY_SPRITES_DEFAULTS = {
  enabled: true,
  texturePaths: [
    '/png/galaxy_01.png',
    '/png/galaxy_02.png',
    '/png/galaxy_03.png',
    '/png/galaxy_04.png',
    '/png/galaxy_05.png'
  ],
  copiesPerTextureMin: 2,
  copiesPerTextureMax: 4,
  totalMax: 14,
  minScale: 1,
  maxScale: 5,
  opacity: 1,
  opacityVariance: 0.18,
  innerRadius: 18,
  outerRadius: 26,
  verticalSpread: 8,
  safeRadius: 6.5,
  orbitSpeedMin: 0.002,
  orbitSpeedMax: 0.005,
  ownSpinSpeedMin: 0.0635,
  ownSpinSpeedMax: 0.0815,
  orbitSpeedMultiplier: 0,
  ownSpinSpeedMultiplier: 1,
  orbitInclinationMin: -0.35,
  orbitInclinationMax: 0.35,
  parallaxStrength: 1,
  randomSeed: 1337,
  additiveBlending: true,
  alphaTest: 1,
  reducedMotionSpeedMultiplier: 0.25
};

const TWO_PI = Math.PI * 2;
const HALF_PI = Math.PI * 0.5;
const CENTRAL_CONE_ATTEMPTS = 18;
const PROGRESSION_EPSILON = 0.0001;

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function readFiniteNumber(value, fallback) {
  if (typeof value === 'string' && value.trim() === '') return fallback;
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
}

function readClampedNumber(value, fallback, min, max) {
  return clamp(readFiniteNumber(value, fallback), min, max);
}

function readClampedInteger(value, fallback, min, max) {
  return clamp(Math.round(readFiniteNumber(value, fallback)), min, max);
}

function normalizeOptions(options = {}) {
  const config = {
    ...GALAXY_SPRITES_DEFAULTS,
    ...options,
    texturePaths: Array.isArray(options.texturePaths)
      ? options.texturePaths.slice()
      : GALAXY_SPRITES_DEFAULTS.texturePaths.slice()
  };

  config.enabled = Boolean(config.enabled);
  config.copiesPerTextureMin = readClampedInteger(config.copiesPerTextureMin, GALAXY_SPRITES_DEFAULTS.copiesPerTextureMin, 0, 10);
  config.copiesPerTextureMax = Math.max(
    config.copiesPerTextureMin,
    readClampedInteger(config.copiesPerTextureMax, GALAXY_SPRITES_DEFAULTS.copiesPerTextureMax, 0, 10)
  );
  config.totalMax = readClampedInteger(config.totalMax, GALAXY_SPRITES_DEFAULTS.totalMax, 0, 30);
  config.minScale = readClampedNumber(config.minScale, GALAXY_SPRITES_DEFAULTS.minScale, 0.01, 12);
  config.maxScale = Math.max(config.minScale, readClampedNumber(config.maxScale, GALAXY_SPRITES_DEFAULTS.maxScale, 0.01, 16));
  config.opacity = readClampedNumber(config.opacity, GALAXY_SPRITES_DEFAULTS.opacity, 0, 1);
  config.opacityVariance = readClampedNumber(config.opacityVariance, GALAXY_SPRITES_DEFAULTS.opacityVariance, 0, 1);
  config.innerRadius = readClampedNumber(config.innerRadius, GALAXY_SPRITES_DEFAULTS.innerRadius, 0, 60);
  config.outerRadius = Math.max(config.innerRadius + 0.1, readClampedNumber(config.outerRadius, GALAXY_SPRITES_DEFAULTS.outerRadius, 0.1, 80));
  config.verticalSpread = readClampedNumber(config.verticalSpread, GALAXY_SPRITES_DEFAULTS.verticalSpread, 0, 30);
  config.safeRadius = readClampedNumber(config.safeRadius, GALAXY_SPRITES_DEFAULTS.safeRadius, 0, 30);
  config.orbitSpeedMin = readClampedNumber(config.orbitSpeedMin, GALAXY_SPRITES_DEFAULTS.orbitSpeedMin, 0, 0.1);
  config.orbitSpeedMax = Math.max(config.orbitSpeedMin, readClampedNumber(config.orbitSpeedMax, GALAXY_SPRITES_DEFAULTS.orbitSpeedMax, 0, 0.1));
  config.ownSpinSpeedMin = readClampedNumber(config.ownSpinSpeedMin, GALAXY_SPRITES_DEFAULTS.ownSpinSpeedMin, 0, 0.1);
  config.ownSpinSpeedMax = Math.max(config.ownSpinSpeedMin, readClampedNumber(config.ownSpinSpeedMax, GALAXY_SPRITES_DEFAULTS.ownSpinSpeedMax, 0, 0.1));
  config.orbitSpeedMultiplier = readClampedNumber(config.orbitSpeedMultiplier, GALAXY_SPRITES_DEFAULTS.orbitSpeedMultiplier, 0, 5);
  config.ownSpinSpeedMultiplier = readClampedNumber(config.ownSpinSpeedMultiplier, GALAXY_SPRITES_DEFAULTS.ownSpinSpeedMultiplier, 0, 5);
  config.orbitInclinationMin = readClampedNumber(config.orbitInclinationMin, GALAXY_SPRITES_DEFAULTS.orbitInclinationMin, -HALF_PI, HALF_PI);
  config.orbitInclinationMax = Math.max(config.orbitInclinationMin, readClampedNumber(config.orbitInclinationMax, GALAXY_SPRITES_DEFAULTS.orbitInclinationMax, -HALF_PI, HALF_PI));
  config.parallaxStrength = readClampedNumber(config.parallaxStrength, GALAXY_SPRITES_DEFAULTS.parallaxStrength, 0, 1);
  config.randomSeed = readFiniteNumber(config.randomSeed, GALAXY_SPRITES_DEFAULTS.randomSeed);
  config.additiveBlending = Boolean(config.additiveBlending);
  config.alphaTest = readClampedNumber(config.alphaTest, GALAXY_SPRITES_DEFAULTS.alphaTest, 0, 1);
  config.reducedMotionSpeedMultiplier = readClampedNumber(config.reducedMotionSpeedMultiplier, GALAXY_SPRITES_DEFAULTS.reducedMotionSpeedMultiplier, 0, 1);

  return config;
}

function createSeededRandom(seed) {
  let state = Number(seed) >>> 0;
  if (state === 0) state = 0x6d2b79f5;
  return () => {
    state += 0x6d2b79f5;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function randomBetween(random, min, max) {
  return min + (max - min) * random();
}

function randomSign(random) {
  return random() < 0.5 ? -1 : 1;
}

function isInCentralReadingCone(position, safeRadius) {
  return Math.abs(position.x) < safeRadius * 0.95
    && Math.abs(position.y) < safeRadius * 0.55
    && position.z > -safeRadius * 1.8
    && position.z < safeRadius * 1.4;
}

function computeOrbitalPosition(state, target) {
  const ellipticalRadius = state.radius * (1 + state.eccentricity * Math.cos(state.orbitAngle + state.eccentricityPhase));
  const x = Math.cos(state.orbitAngle) * ellipticalRadius;
  const z = Math.sin(state.orbitAngle) * ellipticalRadius;
  const tiltedY = state.yOffset + Math.sin(state.orbitAngle) * Math.sin(state.inclination) * state.radius * 0.34;

  target.set(x, tiltedY, z);
}

function makeSpriteMaterial(texture, config, opacity) {
  const material = new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    depthWrite: false,
    depthTest: true,
    opacity,
    blending: config.additiveBlending ? THREE.AdditiveBlending : THREE.NormalBlending,
    alphaTest: config.alphaTest
  });

  if ('toneMapped' in material) material.toneMapped = false;
  return material;
}

function detectReducedMotion() {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function createGalaxySpritesLayer(options = {}, { assetManager = null, deferUntilWarm = false } = {}) {
  const group = new THREE.Group();
  group.name = 'GalaxySpritesLayer';

  const instances = [];
  const ownedTextures = new Set();
  const tempPosition = new THREE.Vector3();
  const tempGroupPosition = new THREE.Vector3();
  let config = normalizeOptions(options);
  let buildId = 0;
  let disposed = false;
  let reducedMotion = detectReducedMotion();
  let progressionMultiplier = 1;
  let revealProgress = 0;
  let hasHydratedDeferred = false;

  function clearInstances({ disposeTextures = true } = {}) {
    while (group.children.length > 0) {
      const child = group.children[group.children.length - 1];
      group.remove(child);
      if (child.material) child.material.dispose();
    }
    instances.length = 0;

    if (disposeTextures) {
      ownedTextures.forEach((texture) => texture.dispose());
      ownedTextures.clear();
    }
  }

  function loadTexture(logicalPath, currentBuildId) {
    const cachedRecord = assetManager?.getAssetByPath?.(logicalPath);
    const cachedTexture = cachedRecord?.texture;
    if (cachedTexture) {
      return Promise.resolve({ texture: cachedTexture, logicalPath, url: cachedRecord.url ?? logicalPath, cached: true });
    }

    if (assetManager?.isPreloadComplete?.()) {
      console.warn(`[galaxySprites] Texture ${logicalPath} was not in AssetManager cache after preload. Skipping late runtime load.`);
      return Promise.resolve(null);
    }

    return Promise.resolve(null);
  }

  function makeInstanceDescriptor(random, textureRecord, textureIndex) {
    const state = {
      orbitAngle: randomBetween(random, 0, TWO_PI),
      radius: randomBetween(random, config.innerRadius, config.outerRadius),
      yOffset: randomBetween(random, -config.verticalSpread, config.verticalSpread),
      scale: randomBetween(random, config.minScale, config.maxScale),
      opacity: clamp(randomBetween(random, 1 - config.opacityVariance, 1 + config.opacityVariance), 0, 2),
      orbitDirection: randomSign(random),
      orbitSpeed: randomBetween(random, config.orbitSpeedMin, config.orbitSpeedMax),
      spinDirection: randomSign(random),
      spinSpeed: randomBetween(random, config.ownSpinSpeedMin, config.ownSpinSpeedMax),
      spinPhase: randomBetween(random, 0, TWO_PI),
      inclination: randomBetween(random, config.orbitInclinationMin, config.orbitInclinationMax),
      eccentricity: randomBetween(random, -0.08, 0.12),
      eccentricityPhase: randomBetween(random, 0, TWO_PI),
      textureIndex,
      texturePath: textureRecord.logicalPath
    };

    for (let attempt = 0; attempt < CENTRAL_CONE_ATTEMPTS; attempt += 1) {
      computeOrbitalPosition(state, tempPosition);
      if (!isInCentralReadingCone(tempPosition, config.safeRadius)) break;
      state.orbitAngle = randomBetween(random, 0, TWO_PI);
      state.radius = randomBetween(random, Math.max(config.innerRadius, config.safeRadius + 1), config.outerRadius);
      state.yOffset = randomBetween(random, -config.verticalSpread, config.verticalSpread);
    }

    return state;
  }

  function createSprite(textureRecord, state) {
    const targetOpacity = clamp(config.opacity * state.opacity * progressionMultiplier, 0, 1);
    const material = makeSpriteMaterial(textureRecord.texture, config, 0);
    material.rotation = state.spinPhase;

    const sprite = new THREE.Sprite(material);
    sprite.name = `GalaxySprite:${state.texturePath}`;
    sprite.userData.nonInteractive = true;
    sprite.scale.setScalar(state.scale);
    computeOrbitalPosition(state, sprite.position);
    group.add(sprite);

    instances.push({ sprite, material, targetOpacity, ...state });
  }

  async function rebuild(nextOptions = {}) {
    config = normalizeOptions({ ...config, ...nextOptions });
    const currentBuildId = ++buildId;
    clearInstances();
    group.visible = config.enabled;

    if (!config.enabled || config.totalMax <= 0 || config.texturePaths.length === 0) return;

    const textureRecords = (await Promise.all(
      config.texturePaths.map((texturePath) => loadTexture(texturePath, currentBuildId))
    )).filter(Boolean);

    if (disposed || currentBuildId !== buildId) return;
    if (textureRecords.length === 0) {
      console.warn('[galaxySprites] No galaxy textures loaded. Layer remains empty until assets are available.');
      return;
    }

    const random = createSeededRandom(config.randomSeed);
    let total = 0;
    textureRecords.forEach((textureRecord, textureIndex) => {
      if (total >= config.totalMax) return;
      const copies = clamp(
        Math.round(randomBetween(random, config.copiesPerTextureMin, config.copiesPerTextureMax + 1)),
        config.copiesPerTextureMin,
        config.copiesPerTextureMax
      );

      for (let i = 0; i < copies && total < config.totalMax; i += 1) {
        createSprite(textureRecord, makeInstanceDescriptor(random, textureRecord, textureIndex));
        total += 1;
      }
    });

    if (import.meta.env?.DEV) {
      console.info(`[galaxySprites] Rebuilt layer: count=${instances.length}, orbitSpeedRange=[${config.orbitSpeedMin}, ${config.orbitSpeedMax}], spinSpeedRange=[${config.ownSpinSpeedMin}, ${config.ownSpinSpeedMax}], orbitMultiplier=${config.orbitSpeedMultiplier}, spinMultiplier=${config.ownSpinSpeedMultiplier}`);
    }
  }

  function applyRuntimeOptions(nextOptions = {}) {
    config = normalizeOptions({ ...config, ...nextOptions });
    group.visible = config.enabled;
    instances.forEach((instance) => {
      const { sprite, material } = instance;
      sprite.scale.setScalar(clamp(instance.scale, config.minScale, config.maxScale) * (0.88 + 0.12 * revealProgress));
      instance.targetOpacity = clamp(instance.opacity * config.opacity * progressionMultiplier, 0, 1);
      material.opacity = instance.targetOpacity * revealProgress;
      material.alphaTest = config.alphaTest;
      material.blending = config.additiveBlending ? THREE.AdditiveBlending : THREE.NormalBlending;
      material.needsUpdate = true;
    });
  }

  function setEnabled(enabled) {
    config.enabled = Boolean(enabled);
    group.visible = config.enabled;
  }

  function update(delta = 0, elapsed = 0, camera = null) {
    if (!config.enabled || disposed) return;

    reducedMotion = detectReducedMotion();
    const speedMultiplier = reducedMotion ? config.reducedMotionSpeedMultiplier : 1;
    const scaledDelta = delta * speedMultiplier;

    const previousReveal = revealProgress;
    revealProgress += (progressionMultiplier - revealProgress) * Math.min(1, scaledDelta / 0.65);
    if (Math.abs(revealProgress - progressionMultiplier) <= PROGRESSION_EPSILON) revealProgress = progressionMultiplier;
    const opacityChanged = Math.abs(revealProgress - previousReveal) > PROGRESSION_EPSILON;
    group.visible = revealProgress > PROGRESSION_EPSILON || progressionMultiplier > PROGRESSION_EPSILON;
    if (!group.visible) return;

    instances.forEach((instance) => {
      const { sprite, material } = instance;
      instance.orbitAngle += instance.orbitSpeed * config.orbitSpeedMultiplier * instance.orbitDirection * scaledDelta;
      instance.spinPhase += instance.spinSpeed * config.ownSpinSpeedMultiplier * instance.spinDirection * scaledDelta;
      computeOrbitalPosition(instance, sprite.position);
      sprite.scale.setScalar(clamp(instance.scale, config.minScale, config.maxScale) * (0.88 + 0.12 * revealProgress));
      material.rotation = instance.spinPhase;
      if (opacityChanged) material.opacity = clamp(instance.opacity * config.opacity, 0, 1) * revealProgress;
    });

    if (camera) {
      tempGroupPosition.copy(camera.position).multiplyScalar(1 - config.parallaxStrength);
      group.position.copy(tempGroupPosition);
    }
  }

  function dispose() {
    disposed = true;
    buildId += 1;
    clearInstances();
  }

  async function hydrateDeferred() {
    if (hasHydratedDeferred) return;
    hasHydratedDeferred = true;
    await rebuild();
  }

  const ready = deferUntilWarm ? Promise.resolve() : hydrateDeferred();

  return {
    group,
    ready,
    update,
    setEnabled,
    rebuild,
    hydrateDeferred,
    dispose,
    applyRuntimeOptions,
    setProgressionMultiplier(nextMultiplier = 1) {
      const next = clamp(Number(nextMultiplier) || 0, 0, 1);
      if (Math.abs(next - progressionMultiplier) > PROGRESSION_EPSILON) progressionMultiplier = next;
    },
    getOptions: () => ({ ...config, texturePaths: config.texturePaths.slice() }),
    getInstanceCount: () => instances.length
  };
}
