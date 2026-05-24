import * as THREE from '../vendor/three.js';

// NOTE: This local config can be moved to a shared scene config once one exists.
// Ultra subtle preset (previous): count 500, opacity 0.06, pointSize 0.025, shell 5.0-13.0, color #9aa9be.
const DEFAULT_BACKGROUND_ATMOSPHERE_CONFIG = Object.freeze({
  enabled: true,
  debugVisible: false,
  debugBlendingMode: 'normal',
  debugIgnoreFog: true,
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

const DEBUG_VISIBLE_PRESET = Object.freeze({
  safeRadius: 3.0,
  shellInnerRadius: 3.8,
  shellOuterRadius: 7.0,
  dust: Object.freeze({
    count: 1200,
    idleOpacity: 0.92,
    rotationSpeed: 0.012,
    pointSize: 0.16,
    color: '#e8f7ff',
    transparent: true,
    sizeAttenuation: false,
    depthTest: false,
    depthWrite: false
  })
});

const ARTISTIC_IDLE_PRESET = Object.freeze({
  safeRadius: 3.5,
  shellInnerRadius: 4.8,
  shellOuterRadius: 10.5,
  dust: Object.freeze({
    count: 1000,
    idleOpacity: 0.12,
    rotationSpeed: 0.012,
    pointSize: 0.055,
    color: '#b8c6da',
    transparent: true,
    sizeAttenuation: true,
    depthTest: true,
    depthWrite: false
  })
});

function resolveAtmosphereConfig(overrides = {}) {
  const useDebugPreset = overrides?.debugVisible === true;
  const preset = useDebugPreset ? DEBUG_VISIBLE_PRESET : ARTISTIC_IDLE_PRESET;
  return {
    ...DEFAULT_BACKGROUND_ATMOSPHERE_CONFIG,
    ...preset,
    ...overrides,
    dust: {
      ...DEFAULT_BACKGROUND_ATMOSPHERE_CONFIG.dust,
      ...preset.dust,
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
  let minDistance = Number.POSITIVE_INFINITY;
  let maxDistance = 0;

  for (let i = 0; i < config.count; i += 1) {
    const idx = i * 3;
    let point = randomPointInShell(config.shellInnerRadius, config.shellOuterRadius);

    // Defensive guard keeps center clean even if shell config changes.
    while (point.length() < config.safeRadius) {
      point = randomPointInShell(config.shellInnerRadius, config.shellOuterRadius);
    }
    const distance = point.length();
    minDistance = Math.min(minDistance, distance);
    maxDistance = Math.max(maxDistance, distance);

    positions[idx] = point.x;
    positions[idx + 1] = point.y;
    positions[idx + 2] = point.z;
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.computeBoundingSphere();

  const material = new THREE.PointsMaterial({
    color: config.color,
    size: config.pointSize,
    transparent: config.transparent ?? true,
    opacity: config.idleOpacity,
    blending: config.debugBlendingMode === 'additive' ? THREE.AdditiveBlending : THREE.NormalBlending,
    sizeAttenuation: config.sizeAttenuation ?? true,
    depthTest: config.depthTest ?? true,
    depthWrite: config.depthWrite ?? false,
    fog: config.debugIgnoreFog ? !config.debugVisible : true
  });

  const points = new THREE.Points(geometry, material);
  points.name = 'backgroundDustField';
  points.raycast = () => {};
  if (config.debugVisible) {
    console.info('[backgroundAtmosphere][debug] dust stats', {
      pointCount: config.count,
      minDistance,
      maxDistance,
      safeRadius: config.safeRadius,
      shellInnerRadius: config.shellInnerRadius,
      shellOuterRadius: config.shellOuterRadius,
      boundingSphereRadius: geometry.boundingSphere?.radius ?? null
    });
  }
  return { points, minDistance, maxDistance };
}

function createShellDebugHelpers(config) {
  const helperGroup = new THREE.Group();
  helperGroup.name = 'backgroundAtmosphereDebugHelpers';
  const createSphereHelper = (radius, colorHex) => {
    const geometry = new THREE.SphereGeometry(radius, 24, 18);
    const material = new THREE.MeshBasicMaterial({
      color: colorHex,
      wireframe: true,
      transparent: true,
      opacity: 0.35,
      depthTest: false,
      depthWrite: false
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.renderOrder = 50;
    return mesh;
  };
  helperGroup.add(createSphereHelper(config.shellInnerRadius, 0x66e0ff));
  helperGroup.add(createSphereHelper(config.shellOuterRadius, 0xffffff));
  return helperGroup;
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
  const dust = createDustField(config);
  root.add(dust.points);
  if (config.debugVisible) {
    root.add(createShellDebugHelpers(config));
    console.info('[backgroundAtmosphere][debug] atmosphere config', {
      enabled: config.enabled,
      dustEnabled: config.dust.enabled,
      safeRadius: config.safeRadius,
      shellInnerRadius: config.shellInnerRadius,
      shellOuterRadius: config.shellOuterRadius,
      rootVisible: root.visible,
      rootScale: root.scale.toArray()
    });
  }

  return {
    object3d: root,
    update(deltaSeconds = 0) {
      root.rotation.y += config.dust.rotationSpeed * deltaSeconds;
      if (config.debugVisible) {
        root.updateMatrixWorld(true);
      }
    }
  };
}
