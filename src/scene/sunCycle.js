import * as THREE from '../vendor/three.js';

const VENDORED_GLTF_LOADER_PATH = '../../vendor/three/examples/jsm/loaders/GLTFLoader.js';

function deepMerge(base, patch) {
  const out = { ...base };
  Object.entries(patch ?? {}).forEach(([key, value]) => {
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      out[key] = deepMerge(base[key] ?? {}, value);
    } else {
      out[key] = value;
    }
  });
  return out;
}

function clamp(v, min, max) { return Math.min(max, Math.max(min, v)); }

async function resolveGLTFLoader() {
  try {
    const module = await import(VENDORED_GLTF_LOADER_PATH);
    return module.GLTFLoader;
  } catch (error) {
    console.warn('[sunCycle] GLTFLoader unavailable.', error);
    return null;
  }
}

export const SUN_CYCLE_DEFAULTS = {
  enabled: true,
  modelPath: '/glb/sun.glb',
  center: { x: 0, y: 0, z: 0 },
  radius: 5,
  zOffset: 0,
  startAngle: 0,
  angularSpeed: 0.08,
  direction: 1,
  scale: 1,
  selfRotationSpeed: 0.05,
  emissiveColor: '#ffe36e',
  emissiveIntensity: 1.8,
  spotlight: {
    enabled: true,
    color: '#ffe36e',
    intensity: 2.5,
    distance: 20,
    angleDegrees: 90,
    penumbra: 0.45,
    decay: 1.5,
    horizonFade: false,
    horizonFadeHeight: 0.5
  },
  debugVisible: false
};

export function createSunCycle(options = {}) {
  let settings = deepMerge(SUN_CYCLE_DEFAULTS, options);
  const object3d = new THREE.Group();
  object3d.name = 'SunCycleGroup';
  const center = new THREE.Vector3();
  const sunPosition = new THREE.Vector3();
  let angle = settings.startAngle;
  let sunModel = null;

  const debugOrbit = new THREE.LineLoop(
    new THREE.BufferGeometry(),
    new THREE.LineBasicMaterial({ color: 0xffe36e, transparent: true, opacity: 0.35 })
  );
  object3d.add(debugOrbit);

  const spotlight = new THREE.SpotLight();
  const spotlightTarget = new THREE.Object3D();
  object3d.add(spotlight);
  object3d.add(spotlightTarget);
  spotlight.target = spotlightTarget;

  const fallbackSphere = new THREE.Mesh(
    new THREE.SphereGeometry(0.25, 16, 16),
    new THREE.MeshStandardMaterial({ color: '#ffcc55', emissive: '#ffe36e', emissiveIntensity: 1.2 })
  );
  fallbackSphere.visible = false;
  object3d.add(fallbackSphere);

  function applyModelEmissive() {
    if (!sunModel) return;
    const emissiveColor = new THREE.Color(settings.emissiveColor);
    sunModel.traverse((child) => {
      if (!child.isMesh || !child.material) return;
      const materials = Array.isArray(child.material) ? child.material : [child.material];
      child.material = materials.map((m) => {
        const cloned = m.clone();
        if ('emissive' in cloned) cloned.emissive = emissiveColor.clone();
        if ('emissiveIntensity' in cloned) cloned.emissiveIntensity = settings.emissiveIntensity;
        return cloned;
      });
    });
  }

  function updateDebugOrbit() {
    const points = [];
    for (let i = 0; i < 64; i += 1) {
      const a = (i / 64) * Math.PI * 2;
      points.push(new THREE.Vector3(
        center.x + Math.cos(a) * settings.radius,
        center.y + Math.sin(a) * settings.radius,
        center.z + settings.zOffset
      ));
    }
    debugOrbit.geometry.dispose();
    debugOrbit.geometry = new THREE.BufferGeometry().setFromPoints(points);
  }

  function applySettings() {
    settings.radius = clamp(settings.radius, 1, 30);
    settings.angularSpeed = clamp(settings.angularSpeed, 0, 1);
    settings.scale = clamp(settings.scale, 0.05, 10);
    settings.selfRotationSpeed = clamp(settings.selfRotationSpeed, 0, 1);
    settings.emissiveIntensity = clamp(settings.emissiveIntensity, 0, 10);
    settings.spotlight.intensity = clamp(settings.spotlight.intensity, 0, 20);
    settings.spotlight.angleDegrees = clamp(settings.spotlight.angleDegrees, 1, 120);
    settings.spotlight.penumbra = clamp(settings.spotlight.penumbra, 0, 1);
    settings.spotlight.distance = clamp(settings.spotlight.distance, 0, 100);

    center.set(settings.center.x, settings.center.y, settings.center.z);
    object3d.visible = settings.enabled;
    if (sunModel) sunModel.scale.setScalar(settings.scale);
    fallbackSphere.scale.setScalar(settings.scale);
    spotlight.color.set(settings.spotlight.color);
    spotlight.distance = settings.spotlight.distance;
    spotlight.angle = THREE.MathUtils.degToRad(settings.spotlight.angleDegrees);
    spotlight.penumbra = settings.spotlight.penumbra;
    spotlight.decay = settings.spotlight.decay;
    spotlight.visible = settings.spotlight.enabled;
    debugOrbit.visible = settings.debugVisible;
    updateDebugOrbit();
    applyModelEmissive();
  }

  void resolveGLTFLoader().then((GLTFLoader) => {
    if (!GLTFLoader) { fallbackSphere.visible = true; return; }
    const loader = new GLTFLoader();
    loader.load(settings.modelPath, (gltf) => {
      sunModel = gltf.scene;
      object3d.add(sunModel);
      applySettings();
    }, undefined, (error) => {
      console.warn(`[sunCycle] Failed to load model: ${settings.modelPath}`, error);
      fallbackSphere.visible = true;
    });
  });

  applySettings();

  return {
    object3d,
    update(delta) {
      if (!settings.enabled) return;
      angle += delta * settings.angularSpeed * (settings.direction >= 0 ? 1 : -1);
      sunPosition.set(
        center.x + Math.cos(angle) * settings.radius,
        center.y + Math.sin(angle) * settings.radius,
        center.z + settings.zOffset
      );
      object3d.position.copy(sunPosition);
      spotlight.position.set(0, 0, 0);
      spotlightTarget.position.copy(center).sub(sunPosition);
      spotlightTarget.updateMatrixWorld();

      const above = sunPosition.y > center.y;
      if (settings.spotlight.enabled && above) {
        spotlight.visible = true;
        spotlight.intensity = settings.spotlight.intensity;
      } else {
        spotlight.visible = false;
        spotlight.intensity = 0;
      }

      const spin = delta * settings.selfRotationSpeed;
      if (sunModel) sunModel.rotation.y += spin;
      fallbackSphere.rotation.y += spin;
    },
    setOptions(partialOptions) {
      settings = deepMerge(settings, partialOptions);
      applySettings();
    },
    getOptions() { return settings; },
    dispose() {
      debugOrbit.geometry.dispose();
      debugOrbit.material.dispose();
    }
  };
}
