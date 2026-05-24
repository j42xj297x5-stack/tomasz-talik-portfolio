import * as THREE from '../vendor/three.js';

const DEFAULT_BACKGROUND_ATMOSPHERE_CONFIG = Object.freeze({
  enabled: true,
  debugVisible: false,
  debugBlendingMode: 'normal',
  debugIgnoreFog: true,
  showShellHelpers: false,
  showAtmosphereLogs: false,
  safeRadius: 3.5,
  shellInnerRadius: 4.8,
  shellOuterRadius: 10.5,
  dust: Object.freeze({
    enabled: true,
    count: 1000,
    idleOpacity: 0.12,
    rotationSpeed: 0.012,
    pointSize: 0.055,
    color: '#b8c6da',
    sizeAttenuation: true,
    depthTest: true,
    depthWrite: false
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
  const direction = new THREE.Vector3(Math.random() * 2 - 1, Math.random() * 2 - 1, Math.random() * 2 - 1).normalize();
  const radius = Math.cbrt(Math.random() * (outerRadius ** 3 - innerRadius ** 3) + innerRadius ** 3);
  return direction.multiplyScalar(radius);
}

function createDustField(config) {
  const positions = new Float32Array(config.dust.count * 3);
  for (let i = 0; i < config.dust.count; i += 1) {
    const idx = i * 3;
    let point = randomPointInShell(config.shellInnerRadius, config.shellOuterRadius);
    while (point.length() < config.safeRadius) {
      point = randomPointInShell(config.shellInnerRadius, config.shellOuterRadius);
    }
    positions[idx] = point.x;
    positions[idx + 1] = point.y;
    positions[idx + 2] = point.z;
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.computeBoundingSphere();

  const material = new THREE.PointsMaterial();
  const points = new THREE.Points(geometry, material);
  points.name = 'backgroundDustField';
  points.raycast = () => {};

  return { points, material, geometry };
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
  let config = resolveAtmosphereConfig(configOverrides);
  const root = new THREE.Group();
  root.name = 'backgroundAtmosphere';

  let dustField = null;
  let helperGroup = null;

  function applyDustMaterialOptions() {
    if (!dustField) return;
    dustField.material.color.set(config.dust.color);
    dustField.material.size = config.dust.pointSize;
    dustField.material.transparent = true;
    dustField.material.opacity = config.dust.idleOpacity;
    dustField.material.blending = config.debugBlendingMode === 'additive' ? THREE.AdditiveBlending : THREE.NormalBlending;
    dustField.material.sizeAttenuation = config.dust.sizeAttenuation;
    dustField.material.depthTest = config.dust.depthTest;
    dustField.material.depthWrite = config.dust.depthWrite;
    dustField.material.fog = config.debugIgnoreFog ? !config.debugVisible : true;
    dustField.material.needsUpdate = true;
  }

  function setHelpersVisible() {
    if (helperGroup) {
      helperGroup.visible = Boolean(config.showShellHelpers || config.debugVisible);
    }
  }

  function clearRoot() {
    while (root.children.length > 0) {
      const child = root.children.pop();
      if (child.geometry) child.geometry.dispose();
      if (child.material) {
        if (Array.isArray(child.material)) child.material.forEach((m) => m.dispose());
        else child.material.dispose();
      }
    }
  }

  function rebuild() {
    clearRoot();
    dustField = null;
    helperGroup = null;

    if (!config.enabled || !config.dust.enabled) return;

    dustField = createDustField(config);
    root.add(dustField.points);
    applyDustMaterialOptions();

    helperGroup = createShellDebugHelpers(config);
    root.add(helperGroup);
    setHelpersVisible();

    if (config.showAtmosphereLogs) {
      console.info('[backgroundAtmosphere][debug] rebuilt', {
        enabled: config.enabled,
        dustEnabled: config.dust.enabled,
        count: config.dust.count,
        safeRadius: config.safeRadius,
        shellInnerRadius: config.shellInnerRadius,
        shellOuterRadius: config.shellOuterRadius
      });
    }
  }

  function applySettings(nextConfigOverrides = {}, updateType = 'rebuild') {
    config = resolveAtmosphereConfig({ ...config, ...nextConfigOverrides });
    if (updateType === 'material') {
      applyDustMaterialOptions();
      return;
    }
    if (updateType === 'helpers') {
      setHelpersVisible();
      return;
    }
    rebuild();
  }

  rebuild();

  return {
    object3d: root,
    applySettings,
    rebuild,
    update(deltaSeconds = 0) {
      if (!dustField || !root.parent) return;
      root.rotation.y += config.dust.rotationSpeed * deltaSeconds;
    }
  };
}
