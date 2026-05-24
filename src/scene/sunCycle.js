import * as THREE from '../vendor/three.js';

const VENDORED_GLTF_LOADER_PATH = '../../vendor/three/examples/jsm/loaders/GLTFLoader.js';
const SUN_MODEL_PATH = '/glb/sun.glb';

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

function sanitizeSunModelPath(modelPath) {
  return typeof modelPath === 'string' && modelPath.trim() === SUN_MODEL_PATH ? SUN_MODEL_PATH : SUN_MODEL_PATH;
}

function sanitizeSunCycleSettings(settings) {
  settings.modelPath = sanitizeSunModelPath(settings.modelPath);
  return settings;
}

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
  modelPath: SUN_MODEL_PATH,
  center: { x: 0, y: 0, z: 0 },
  radius: 3,
  zOffset: 0,
  startAngle: 0,
  angularSpeed: 0.08,
  direction: 1,
  scale: 0.2,
  selfRotationSpeed: 0.05,
  emissiveColor: '#ffd21f',
  emissiveIntensity: 1.5,
  spotlight: {
    enabled: true,
    color: '#ffd21f',
    intensity: 13.2,
    distance: 20,
    angleDegrees: 90,
    penumbra: 0.45,
    decay: 1.5,
    horizonFade: false,
    horizonFadeHeight: 0.5
  },
  debugVisible: false,
  debugShowFallback: false,
  debugForceBasicMaterial: false,
  debugShowBounds: false,
  debugScaleMultiplier: 1
};

export function createSunCycle(options = {}) {
  let settings = sanitizeSunCycleSettings(deepMerge(SUN_CYCLE_DEFAULTS, options));
  const object3d = new THREE.Group();
  object3d.name = 'SunCycleGroup';
  const center = new THREE.Vector3();
  const centerWorldPosition = new THREE.Vector3();
  const worldSunPosition = new THREE.Vector3();
  let angle = settings.startAngle;
  let sunModel = null;
  let boxHelper = null;
  const debugBasicMaterial = new THREE.MeshBasicMaterial({ color: '#ffd31a' });
  const stableSunMaterial = new THREE.MeshStandardMaterial({
    color: '#ffd21f',
    emissive: '#ffd21f',
    emissiveIntensity: 1.5,
    roughness: 0.65,
    metalness: 0.0,
    transparent: false,
    opacity: 1,
    alphaTest: 0,
    side: THREE.DoubleSide,
    depthWrite: true,
    depthTest: true
  });

  const sunBodyGroup = new THREE.Group();
  sunBodyGroup.name = 'SunCycleBodyGroup';
  object3d.add(sunBodyGroup);

  const debugOrbit = new THREE.LineLoop(
    new THREE.BufferGeometry(),
    new THREE.LineBasicMaterial({ color: 0xffe36e, transparent: true, opacity: 0.35 })
  );
  object3d.add(debugOrbit);

  const spotlight = new THREE.SpotLight();
  const spotlightTarget = new THREE.Object3D();
  sunBodyGroup.add(spotlight);
  object3d.add(spotlightTarget);
  spotlight.target = spotlightTarget;

  const fallbackSphere = new THREE.Mesh(
    new THREE.SphereGeometry(0.25, 16, 16),
    new THREE.MeshBasicMaterial({ color: '#fff200' })
  );
  fallbackSphere.name = 'SunCycleDebugFallbackMarker';
  fallbackSphere.visible = false;
  sunBodyGroup.add(fallbackSphere);

  function applyStableSunMaterial() {
    if (!sunModel) return;
    sunModel.traverse((child) => {
      if (!child.isMesh) return;
      child.material = stableSunMaterial;
      child.visible = true;
      child.castShadow = false;
      child.receiveShadow = false;
      if (child.material) {
        child.material.transparent = false;
        child.material.opacity = 1;
        child.material.alphaTest = 0;
        child.material.depthWrite = true;
        child.material.depthTest = true;
        child.material.side = THREE.DoubleSide;
        child.material.needsUpdate = true;
      }
    });
  }

  function setDebugMaterialState(forceBasic) {
    if (!sunModel) return;
    sunModel.traverse((child) => {
      if (!child.isMesh || !child.material) return;
      if (forceBasic) {
        if (!child.userData._sunCycleOriginalMaterial) child.userData._sunCycleOriginalMaterial = child.material;
        child.material = debugBasicMaterial;
        child.visible = true;
      } else if (child.userData._sunCycleOriginalMaterial) {
        child.material = child.userData._sunCycleOriginalMaterial;
        delete child.userData._sunCycleOriginalMaterial;
      } else {
        child.material = stableSunMaterial;
      }
    });
  }

  function updateDebugState() {
    const debugOn = settings.debugVisible;
    fallbackSphere.visible = debugOn && settings.debugShowFallback;
    if (boxHelper) boxHelper.visible = debugOn && settings.debugShowBounds;
    setDebugMaterialState(debugOn && settings.debugForceBasicMaterial);
  }

  function applyModelEmissive() {
    if (!sunModel) return;
    const emissiveColor = new THREE.Color(settings.emissiveColor);
    sunModel.traverse((child) => {
      if (!child.isMesh || !child.material) return;
      if ('color' in child.material) child.material.color.set(settings.emissiveColor);
      if ('emissive' in child.material) child.material.emissive = emissiveColor.clone();
      if ('emissiveIntensity' in child.material) child.material.emissiveIntensity = settings.emissiveIntensity;
      child.material.transparent = false;
      child.material.opacity = 1;
      child.material.alphaTest = 0;
      child.material.depthWrite = true;
      child.material.depthTest = true;
      child.material.side = THREE.DoubleSide;
      child.material.needsUpdate = true;
    });
  }

  function updateDebugOrbit() {
    const points = [];
    for (let i = 0; i < 64; i += 1) {
      const a = (i / 64) * Math.PI * 2;
      points.push(new THREE.Vector3(
        Math.cos(a) * settings.radius,
        Math.sin(a) * settings.radius,
        settings.zOffset
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
    object3d.position.copy(center);
    const effectiveScale = settings.scale * ((settings.debugVisible && settings.debugScaleMultiplier > 0) ? settings.debugScaleMultiplier : 1);
    if (sunModel) sunModel.scale.setScalar(effectiveScale);
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
    updateDebugState();
  }

  void resolveGLTFLoader().then((GLTFLoader) => {
    if (!GLTFLoader) { fallbackSphere.visible = true; return; }
    const loader = new GLTFLoader();
    loader.load(settings.modelPath, (gltf) => {
      sunModel = gltf.scene;
      sunModel.position.set(0, 0, 0);
      sunBodyGroup.add(sunModel);
      boxHelper = new THREE.BoxHelper(sunModel, 0x00ffff);
      boxHelper.name = 'SunCycleModelBoxHelper';
      boxHelper.visible = false;
      sunBodyGroup.add(boxHelper);
      applyStableSunMaterial();
      if (settings.debugVisible) {
        const meshCount = sunModel ? sunModel.getObjectsByProperty('isMesh', true).length : 0;
        const bbox = new THREE.Box3().setFromObject(sunModel);
        const size = bbox.getSize(new THREE.Vector3());
        const sphere = bbox.getBoundingSphere(new THREE.Sphere());
        const sunGroupWorld = object3d.getWorldPosition(new THREE.Vector3());
        const sunBodyWorld = sunBodyGroup.getWorldPosition(new THREE.Vector3());
        const modelWorld = sunModel.getWorldPosition(new THREE.Vector3());
        sunModel.traverse((child) => {
          if (!child.isMesh) return;
          child.visible = true;
          if (Array.isArray(child.material)) child.material.forEach((m) => { if (m) m.visible = true; });
          else if (child.material) child.material.visible = true;
        });
        console.info('[sunCycle][debug] load success', {
          path: settings.modelPath,
          hasScene: Boolean(gltf.scene),
          meshCount,
          boundingBox: { min: bbox.min.toArray(), max: bbox.max.toArray(), size: size.toArray() },
          boundingSphereRadius: sphere.radius,
          sunGroupWorldPosition: sunGroupWorld.toArray(),
          sunBodyWorldPosition: sunBodyWorld.toArray(),
          modelWorldPosition: modelWorld.toArray(),
          sunGroupScale: object3d.scale.toArray(),
          modelScale: sunModel.scale.toArray(),
          visibleFlags: { sunGroup: object3d.visible, sunModel: sunModel.visible, debugOrbit: debugOrbit.visible, fallback: fallbackSphere.visible },
          sunGroupChildrenCount: object3d.children.length
        });
      }
      applySettings();
    }, undefined, (error) => {
      console.warn(`[sunCycle][debug] Failed to load model from path: ${settings.modelPath}`, error);
      fallbackSphere.visible = true;
    });
  });

  applySettings();

  return {
    object3d,
    update(delta) {
      if (!settings.enabled) return;
      angle += delta * settings.angularSpeed * (settings.direction >= 0 ? 1 : -1);
      sunBodyGroup.position.set(
        Math.cos(angle) * settings.radius,
        Math.sin(angle) * settings.radius,
        settings.zOffset
      );
      spotlight.position.set(0, 0, 0);
      spotlightTarget.position.set(0, 0, 0);
      spotlightTarget.updateMatrixWorld();

      sunBodyGroup.getWorldPosition(worldSunPosition);
      object3d.getWorldPosition(centerWorldPosition);
      const above = worldSunPosition.y > centerWorldPosition.y;
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
      if (boxHelper && settings.debugVisible) boxHelper.update();
    },
    setOptions(partialOptions) {
      settings = sanitizeSunCycleSettings(deepMerge(settings, partialOptions));
      applySettings();
    },
    getOptions() { return settings; },
    dispose() {
      if (boxHelper) {
        sunBodyGroup.remove(boxHelper);
        boxHelper.geometry.dispose();
        boxHelper.material.dispose();
      }
      debugBasicMaterial.dispose();
      stableSunMaterial.dispose();
      debugOrbit.geometry.dispose();
      debugOrbit.material.dispose();
    }
  };
}
