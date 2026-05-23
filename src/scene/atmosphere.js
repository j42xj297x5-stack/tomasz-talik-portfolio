import * as THREE from '../vendor/three.js';

// NOTE: This local config can be moved to a shared scene config once one exists.
// Ultra subtle preset (previous): count 500, opacity 0.06, pointSize 0.025, shell 5.0-13.0, color #9aa9be.
const DEFAULT_BACKGROUND_ATMOSPHERE_CONFIG = Object.freeze({
  enabled: true,
  safeRadius: 3.5,
  shellInnerRadius: 4.8,
  shellOuterRadius: 10.5,
  dust: Object.freeze({
    enabled: true,
    count: 1000,
    idleOpacity: 0.12,
    rotationSpeed: 0.012,
    pointSize: 0.055,
    color: '#b8c6da'
  })
});

function resolveAtmosphereConfig(overrides = {}) {
  return {
    ...DEFAULT_BACKGROUND_ATMOSPHERE_CONFIG,
    ...overrides,
    dust: {
      ...DEFAULT_BACKGROUND_ATMOSPHERE_CONFIG.dust,
      ...(overrides?.dust ?? {})
    }
  };
}

function randomPointInShell(innerRadius, outerRadius) {
  const direction = new THREE.Vector3(
    Math.random() * 2 - 1,
    Math.random() * 2 - 1,
    Math.random() * 2 - 1
  ).normalize();
  const radius = Math.cbrt(Math.random() * (outerRadius ** 3 - innerRadius ** 3) + innerRadius ** 3);
  return direction.multiplyScalar(radius);
}

function createDustField(config) {
  const positions = new Float32Array(config.count * 3);

  for (let i = 0; i < config.count; i += 1) {
    const idx = i * 3;
    let point = randomPointInShell(config.shellInnerRadius, config.shellOuterRadius);

    // Defensive guard keeps center clean even if shell config changes.
    while (point.length() < config.safeRadius) {
      point = randomPointInShell(config.shellInnerRadius, config.shellOuterRadius);
    }

    positions[idx] = point.x;
    positions[idx + 1] = point.y;
    positions[idx + 2] = point.z;
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

  const material = new THREE.PointsMaterial({
    color: config.color,
    size: config.pointSize,
    transparent: true,
    opacity: config.idleOpacity,
    blending: THREE.NormalBlending,
    sizeAttenuation: true,
    depthTest: true,
    depthWrite: false
  });

  const points = new THREE.Points(geometry, material);
  points.name = 'backgroundDustField';
  points.raycast = () => {};
  return points;
}

export function createBackgroundAtmosphere(configOverrides = {}) {
  const config = resolveAtmosphereConfig(configOverrides);

  if (!config.enabled || !config.dust.enabled) {
    return {
      object3d: null,
      update: () => {}
    };
  }

  const root = new THREE.Group();
  root.name = 'backgroundAtmosphere';
  root.add(createDustField(config));

  return {
    object3d: root,
    update(deltaSeconds = 0) {
      root.rotation.y += config.dust.rotationSpeed * deltaSeconds;
    }
  };
}
