import * as THREE from '../vendor/three.js';

const VENDORED_GLTF_LOADER_PATH = '../../vendor/three/examples/jsm/loaders/GLTFLoader.js';
const MOON_MODEL_PATH = '/glb/moon.glb';

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

function sanitizeMoonModelPath(modelPath) {
  return typeof modelPath === 'string' && modelPath.trim().length > 0 ? modelPath.trim() : MOON_MODEL_PATH;
}

function sanitizeMoonCycleSettings(settings) {
  settings.modelPath = sanitizeMoonModelPath(settings.modelPath);
  return settings;
}

async function resolveGLTFLoader() {
  try {
    const module = await import(VENDORED_GLTF_LOADER_PATH);
    return module.GLTFLoader;
  } catch (error) {
    console.warn('[moonCycle] GLTFLoader unavailable.', error);
    return null;
  }
}

export const MOON_CYCLE_DEFAULTS = {
  enabled: true,
  modelPath: MOON_MODEL_PATH,
  center: { x: 0, y: 0, z: 0 },
  radius: 3,
  zOffset: 0,
  phaseOffset: Math.PI,
  scale: 0.2,
  selfRotationSpeed: 0.05,
  spotlight: {
    enabled: true,
    color: '#8ecbff',
    intensity: 10,
    distance: 20,
    angleDegrees: 90,
    penumbra: 0.45,
    decay: 1.5
  },
  debugVisible: false,
  debugShowFallback: false,
  debugForceBasicMaterial: false,
  debugShowBounds: false,
  debugScaleMultiplier: 1
};

export function createMoonCycle(options = {}) {
  let settings = sanitizeMoonCycleSettings(deepMerge(MOON_CYCLE_DEFAULTS, options));
  const object3d = new THREE.Group();
  object3d.name = 'MoonCycleGroup';
  const center = new THREE.Vector3();
  const centerWorldPosition = new THREE.Vector3();
  const worldMoonPosition = new THREE.Vector3();
  let moonModel = null;
  let boxHelper = null;
  const debugBasicMaterial = new THREE.MeshBasicMaterial({ color: '#8ecbff' });
  const moonBodyGroup = new THREE.Group();
  moonBodyGroup.name = 'MoonCycleBodyGroup';
  object3d.add(moonBodyGroup);

  const debugOrbit = new THREE.LineLoop(
    new THREE.BufferGeometry(),
    new THREE.LineBasicMaterial({ color: 0x8ecbff, transparent: true, opacity: 0.35 })
  );
  object3d.add(debugOrbit);

  const spotlight = new THREE.SpotLight();
  const spotlightTarget = new THREE.Object3D();
  moonBodyGroup.add(spotlight);
  object3d.add(spotlightTarget);
  spotlight.target = spotlightTarget;

  const fallbackSphere = new THREE.Mesh(
    new THREE.SphereGeometry(0.25, 16, 16),
    new THREE.MeshBasicMaterial({ color: '#8ecbff' })
  );
  fallbackSphere.name = 'MoonCycleDebugFallbackMarker';
  fallbackSphere.visible = false;
  moonBodyGroup.add(fallbackSphere);

  function setDebugMaterialState(forceBasic) { if (!moonModel) return; moonModel.traverse((child) => {
    if (!child.isMesh || !child.material) return;
    if (forceBasic) { if (!child.userData._moonCycleOriginalMaterial) child.userData._moonCycleOriginalMaterial = child.material; child.material = debugBasicMaterial; child.visible = true; } else if (child.userData._moonCycleOriginalMaterial) { child.material = child.userData._moonCycleOriginalMaterial; delete child.userData._moonCycleOriginalMaterial; }
  }); }

  function updateDebugState() {
    const debugOn = settings.debugVisible;
    fallbackSphere.visible = debugOn && settings.debugShowFallback;
    if (boxHelper) boxHelper.visible = debugOn && settings.debugShowBounds;
    setDebugMaterialState(debugOn && settings.debugForceBasicMaterial);
  }

  function enforceMoonMaterialVisibility() {
    if (!moonModel) return;
    moonModel.traverse((child) => {
      if (!child.isMesh) return;
      child.visible = true;
      child.castShadow = false;
      child.receiveShadow = false;
      const materials = Array.isArray(child.material) ? child.material : [child.material];
      materials.forEach((material) => {
        if (!material) return;
        material.visible = true;
        material.transparent = false;
        material.opacity = 1;
        material.depthWrite = true;
        material.depthTest = true;
        material.needsUpdate = true;
      });
    });
  }

  function updateDebugOrbit() {
    const points = [];
    for (let i = 0; i < 64; i += 1) {
      const a = (i / 64) * Math.PI * 2;
      points.push(new THREE.Vector3(Math.cos(a) * settings.radius, Math.sin(a) * settings.radius, settings.zOffset));
    }
    debugOrbit.geometry.dispose();
    debugOrbit.geometry = new THREE.BufferGeometry().setFromPoints(points);
  }

  function applySettings() {
    settings.radius = clamp(settings.radius, 1, 30);
    settings.scale = clamp(settings.scale, 0.05, 10);
    settings.selfRotationSpeed = clamp(settings.selfRotationSpeed, 0, 1);
    settings.debugScaleMultiplier = clamp(settings.debugScaleMultiplier, 0.1, 10);
    settings.spotlight.intensity = clamp(settings.spotlight.intensity, 0, 20);
    settings.spotlight.angleDegrees = clamp(settings.spotlight.angleDegrees, 1, 120);
    settings.spotlight.penumbra = clamp(settings.spotlight.penumbra, 0, 1);
    settings.spotlight.distance = clamp(settings.spotlight.distance, 0, 100);

    center.set(settings.center.x, settings.center.y, settings.center.z);
    object3d.visible = settings.enabled;
    object3d.position.copy(center);
    const effectiveScale = settings.scale * ((settings.debugVisible && settings.debugScaleMultiplier > 0) ? settings.debugScaleMultiplier : 1);
    if (moonModel) moonModel.scale.setScalar(effectiveScale);
    fallbackSphere.scale.setScalar(settings.scale);
    spotlight.color.set(settings.spotlight.color);
    spotlight.distance = settings.spotlight.distance;
    spotlight.angle = THREE.MathUtils.degToRad(settings.spotlight.angleDegrees);
    spotlight.penumbra = settings.spotlight.penumbra;
    spotlight.decay = settings.spotlight.decay;
    spotlight.visible = settings.spotlight.enabled;
    debugOrbit.visible = settings.debugVisible;
    updateDebugOrbit();
    enforceMoonMaterialVisibility();
    updateDebugState();
  }

  void resolveGLTFLoader().then((GLTFLoader) => {
    if (!GLTFLoader) { fallbackSphere.visible = true; return; }
    const loader = new GLTFLoader();
    loader.load(settings.modelPath, (gltf) => {
      moonModel = gltf.scene;
      moonModel.position.set(0, 0, 0);
      moonBodyGroup.add(moonModel);
      boxHelper = new THREE.BoxHelper(moonModel, 0x00ffff);
      boxHelper.name = 'MoonCycleModelBoxHelper';
      boxHelper.visible = false;
      moonBodyGroup.add(boxHelper);
      enforceMoonMaterialVisibility();
      applySettings();
    }, undefined, (error) => {
      console.warn(`[moonCycle][debug] Failed to load model from path: ${settings.modelPath}`, error);
      fallbackSphere.visible = true;
    });
  });

  applySettings();

  return {
    object3d,
    update(delta, sunAngle = 0) {
      if (!settings.enabled) return;
      const angle = sunAngle + settings.phaseOffset;
      moonBodyGroup.position.set(Math.cos(angle) * settings.radius, Math.sin(angle) * settings.radius, settings.zOffset);
      spotlight.position.set(0, 0, 0);
      spotlightTarget.position.set(0, 0, 0);
      spotlightTarget.updateMatrixWorld();
      moonBodyGroup.getWorldPosition(worldMoonPosition);
      object3d.getWorldPosition(centerWorldPosition);
      const above = worldMoonPosition.y > centerWorldPosition.y;
      if (settings.spotlight.enabled && above) {
        spotlight.visible = true;
        spotlight.intensity = settings.spotlight.intensity;
      } else {
        spotlight.visible = false;
        spotlight.intensity = 0;
      }
      const spin = delta * settings.selfRotationSpeed;
      if (moonModel) moonModel.rotation.y += spin;
      fallbackSphere.rotation.y += spin;
      if (boxHelper && settings.debugVisible) boxHelper.update();
    },
    setOptions(partialOptions) {
      settings = sanitizeMoonCycleSettings(deepMerge(settings, partialOptions));
      applySettings();
    },
    getOptions() { return settings; },
    dispose() {
      if (boxHelper) {
        moonBodyGroup.remove(boxHelper);
        boxHelper.geometry.dispose();
        boxHelper.material.dispose();
      }
      debugBasicMaterial.dispose();
      debugOrbit.geometry.dispose();
      debugOrbit.material.dispose();
    }
  };
}
