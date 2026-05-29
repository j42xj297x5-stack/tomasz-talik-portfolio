import * as THREE from '../vendor/three.js';
import { publicPath } from '../utils/publicPath.js';

export const GALAXY_SPRITES_DEFAULTS = {
  enabled: true,
  texturePaths: [
    '/png/galaxy_01.png',
    '/png/galaxy_02.png',
    '/png/galaxy_03.png',
    '/png/galaxy_04.png',
    '/png/galaxy_05.png'
  ],
  copiesPerTextureMin: 1,
  copiesPerTextureMax: 3,
  totalMax: 14,
  minScale: 0.65,
  maxScale: 2.8,
  opacity: 0.42,
  opacityVariance: 0.18,
  innerRadius: 11,
  outerRadius: 26,
  verticalSpread: 8,
  safeRadius: 6.5,
  orbitSpeedMin: 0.0015,
  orbitSpeedMax: 0.006,
  ownSpinSpeedMin: 0.002,
  ownSpinSpeedMax: 0.012,
  orbitInclinationMin: -0.35,
  orbitInclinationMax: 0.35,
  parallaxStrength: 1,
  randomSeed: 1337,
  additiveBlending: false,
  alphaTest: 0.01,
  reducedMotionSpeedMultiplier: 0.25
};

const TWO_PI = Math.PI * 2;
const HALF_PI = Math.PI * 0.5;
const CENTRAL_CONE_ATTEMPTS = 18;

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
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
  config.copiesPerTextureMin = clamp(Math.round(config.copiesPerTextureMin), 0, 10);
  config.copiesPerTextureMax = Math.max(
    config.copiesPerTextureMin,
    clamp(Math.round(config.copiesPerTextureMax), 0, 10)
  );
  config.totalMax = clamp(Math.round(config.totalMax), 0, 30);
  config.minScale = clamp(config.minScale, 0.01, 12);
  config.maxScale = Math.max(config.minScale, clamp(config.maxScale, 0.01, 16));
  config.opacity = clamp(config.opacity, 0, 1);
  config.opacityVariance = clamp(config.opacityVariance, 0, 1);
  config.innerRadius = clamp(config.innerRadius, 0, 60);
  config.outerRadius = Math.max(config.innerRadius + 0.1, clamp(config.outerRadius, 0.1, 80));
  config.verticalSpread = clamp(config.verticalSpread, 0, 30);
  config.safeRadius = clamp(config.safeRadius, 0, 30);
  config.orbitSpeedMin = clamp(config.orbitSpeedMin, 0, 0.1);
  config.orbitSpeedMax = Math.max(config.orbitSpeedMin, clamp(config.orbitSpeedMax, 0, 0.1));
  config.ownSpinSpeedMin = clamp(config.ownSpinSpeedMin, 0, 0.1);
  config.ownSpinSpeedMax = Math.max(config.ownSpinSpeedMin, clamp(config.ownSpinSpeedMax, 0, 0.1));
  config.orbitInclinationMin = clamp(config.orbitInclinationMin, -HALF_PI, HALF_PI);
  config.orbitInclinationMax = Math.max(config.orbitInclinationMin, clamp(config.orbitInclinationMax, -HALF_PI, HALF_PI));
  config.parallaxStrength = clamp(config.parallaxStrength, 0, 1);
  config.randomSeed = Number.isFinite(Number(config.randomSeed)) ? Number(config.randomSeed) : GALAXY_SPRITES_DEFAULTS.randomSeed;
  config.additiveBlending = Boolean(config.additiveBlending);
  config.alphaTest = clamp(config.alphaTest, 0, 1);
  config.reducedMotionSpeedMultiplier = clamp(config.reducedMotionSpeedMultiplier, 0, 1);

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
  const ellipticalRadius = state.radius * (1 + state.eccentricity * Math.cos(state.angle + state.eccentricityPhase));
  const x = Math.cos(state.angle) * ellipticalRadius;
  const z = Math.sin(state.angle) * ellipticalRadius;
  const tiltedY = state.verticalOffset + Math.sin(state.angle) * Math.sin(state.inclination) * state.radius * 0.34;

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

export function createGalaxySpritesLayer(options = {}) {
  const group = new THREE.Group();
  group.name = 'GalaxySpritesLayer';

  const textureLoader = new THREE.TextureLoader();
  const instances = [];
  const ownedTextures = new Set();
  const tempPosition = new THREE.Vector3();
  const tempGroupPosition = new THREE.Vector3();
  let config = normalizeOptions(options);
  let buildId = 0;
  let disposed = false;
  let reducedMotion = detectReducedMotion();

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
    const url = publicPath(logicalPath);
    return new Promise((resolve) => {
      textureLoader.load(
        url,
        (texture) => {
          if (disposed || currentBuildId !== buildId) {
            texture.dispose();
            resolve(null);
            return;
          }
          texture.colorSpace = THREE.SRGBColorSpace;
          texture.generateMipmaps = true;
          texture.needsUpdate = true;
          ownedTextures.add(texture);
          resolve({ texture, logicalPath, url });
        },
        undefined,
        (error) => {
          console.warn(`[galaxySprites] Failed to load galaxy texture ${logicalPath} from ${url}. Skipping that sprite source.`, error);
          resolve(null);
        }
      );
    });
  }

  function makeInstanceDescriptor(random, textureRecord, textureIndex) {
    const state = {
      angle: randomBetween(random, 0, TWO_PI),
      radius: randomBetween(random, config.innerRadius, config.outerRadius),
      verticalOffset: randomBetween(random, -config.verticalSpread, config.verticalSpread),
      scale: randomBetween(random, config.minScale, config.maxScale),
      opacityMultiplier: randomBetween(random, 1 - config.opacityVariance, 1 + config.opacityVariance),
      orbitDirection: randomSign(random),
      orbitSpeed: randomBetween(random, config.orbitSpeedMin, config.orbitSpeedMax),
      ownSpinDirection: randomSign(random),
      ownSpinSpeed: randomBetween(random, config.ownSpinSpeedMin, config.ownSpinSpeedMax),
      ownSpinPhase: randomBetween(random, 0, TWO_PI),
      inclination: randomBetween(random, config.orbitInclinationMin, config.orbitInclinationMax),
      eccentricity: randomBetween(random, -0.08, 0.12),
      eccentricityPhase: randomBetween(random, 0, TWO_PI),
      textureIndex,
      texturePath: textureRecord.logicalPath
    };

    for (let attempt = 0; attempt < CENTRAL_CONE_ATTEMPTS; attempt += 1) {
      computeOrbitalPosition(state, tempPosition);
      if (!isInCentralReadingCone(tempPosition, config.safeRadius)) break;
      state.angle = randomBetween(random, 0, TWO_PI);
      state.radius = randomBetween(random, Math.max(config.innerRadius, config.safeRadius + 1), config.outerRadius);
      state.verticalOffset = randomBetween(random, -config.verticalSpread, config.verticalSpread);
    }

    return state;
  }

  function createSprite(textureRecord, state) {
    const opacity = clamp(config.opacity * state.opacityMultiplier, 0, 1);
    const material = makeSpriteMaterial(textureRecord.texture, config, opacity);
    material.rotation = state.ownSpinPhase;

    const sprite = new THREE.Sprite(material);
    sprite.name = `GalaxySprite:${state.texturePath}`;
    sprite.userData.nonInteractive = true;
    sprite.scale.setScalar(state.scale);
    computeOrbitalPosition(state, sprite.position);
    group.add(sprite);

    instances.push({ sprite, material, state });
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
  }

  function applyRuntimeOptions(nextOptions = {}) {
    config = normalizeOptions({ ...config, ...nextOptions });
    group.visible = config.enabled;
    instances.forEach(({ sprite, material, state }) => {
      sprite.scale.setScalar(clamp(state.scale, config.minScale, config.maxScale));
      material.opacity = clamp(config.opacity * state.opacityMultiplier, 0, 1);
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

    instances.forEach(({ sprite, material, state }) => {
      state.angle += state.orbitSpeed * state.orbitDirection * scaledDelta;
      computeOrbitalPosition(state, sprite.position);
      material.rotation = state.ownSpinPhase + elapsed * state.ownSpinSpeed * state.ownSpinDirection * speedMultiplier;
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

  void rebuild();

  return {
    group,
    update,
    setEnabled,
    rebuild,
    dispose,
    applyRuntimeOptions,
    getOptions: () => ({ ...config, texturePaths: config.texturePaths.slice() }),
    getInstanceCount: () => instances.length
  };
}
