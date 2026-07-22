import * as THREE from '../vendor/three.js';

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
  selfRotationSpeed: 0,
  lockFacing: true,
  frontRotation: { x: 0, y: 0, z: 0 },
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
    fadeDurationSeconds: 3,
    cameraOffsetFactor: 0.2,
    radialOffsetMultiplier: 1.25,
    horizonFade: false,
    horizonFadeHeight: 0.5
  },
  debugVisible: false,
  debugShowFallback: false,
  debugForceBasicMaterial: false,
  debugShowBounds: false,
  debugScaleMultiplier: 1
};

export function createSunCycle(options = {}, { assetManager = null, camera = null } = {}) {
  let settings = sanitizeSunCycleSettings(deepMerge(SUN_CYCLE_DEFAULTS, options));
  let progressionMultiplier = 1;
  const object3d = new THREE.Group();
  object3d.name = 'SunCycleGroup';
  const center = new THREE.Vector3();
  const centerWorldPosition = new THREE.Vector3();
  const worldSunPosition = new THREE.Vector3();
  let angle = settings.startAngle;
  let sunModel = null;
  let boxHelper = null;
  let visualRadius = 0.25;
  let lastVisualScale = null;
  let horizonLightFactor = 1;
  let horizonTargetFactor = 1;
  const cameraWorldPosition = new THREE.Vector3();
  const radial = new THREE.Vector3();
  const cameraSide = new THREE.Vector3();
  const lightWorldPosition = new THREE.Vector3();
  const debugBasicMaterial = new THREE.MeshBasicMaterial({ color: '#ffd31a' });
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
      }
    });
  }

  function updateDebugState() {
    const debugOn = settings.debugVisible;
    fallbackSphere.visible = debugOn && settings.debugShowFallback;
    if (boxHelper) boxHelper.visible = debugOn && settings.debugShowBounds;
    setDebugMaterialState(debugOn && settings.debugForceBasicMaterial);
  }

  function enforceSunMaterialVisibility() {
    if (!sunModel) return;
    sunModel.traverse((child) => {
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
        material.side = THREE.DoubleSide;
        material.needsUpdate = true;
      });
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

  function updateVisualRadius(effectiveScale) {
    if (lastVisualScale === effectiveScale) return;
    lastVisualScale = effectiveScale;
    if (sunModel) {
      sunModel.updateWorldMatrix(true, true);
      const bounds = new THREE.Box3().setFromObject(sunModel);
      const sphere = new THREE.Sphere();
      bounds.getBoundingSphere(sphere);
      visualRadius = sphere.radius;
    } else {
      visualRadius = 0.25 * effectiveScale;
    }
  }

  function applySettings() {
    settings.radius = clamp(settings.radius, 1, 30);
    settings.angularSpeed = clamp(settings.angularSpeed, 0, 1);
    settings.scale = clamp(settings.scale, 0.05, 10);
    settings.selfRotationSpeed = clamp(settings.selfRotationSpeed, 0, 1);
    settings.lockFacing = settings.lockFacing !== false;
    settings.emissiveIntensity = clamp(settings.emissiveIntensity, 0, 10);
    settings.spotlight.intensity = clamp(settings.spotlight.intensity, 0, 20);
    settings.spotlight.angleDegrees = clamp(settings.spotlight.angleDegrees, 1, 120);
    settings.spotlight.penumbra = clamp(settings.spotlight.penumbra, 0, 1);
    settings.spotlight.distance = clamp(settings.spotlight.distance, 0, 100);
    settings.spotlight.fadeDurationSeconds = clamp(settings.spotlight.fadeDurationSeconds, 0, 10);
    settings.spotlight.cameraOffsetFactor = clamp(settings.spotlight.cameraOffsetFactor, 0, 0.5);
    settings.spotlight.radialOffsetMultiplier = clamp(settings.spotlight.radialOffsetMultiplier, 1, 4);

    center.set(settings.center.x, settings.center.y, settings.center.z);
    object3d.visible = settings.enabled;
    object3d.position.copy(center);
    const effectiveScale = settings.scale * ((settings.debugVisible && settings.debugScaleMultiplier > 0) ? settings.debugScaleMultiplier : 1);
    if (sunModel) sunModel.scale.setScalar(effectiveScale);
    updateVisualRadius(effectiveScale);
    if (sunModel && settings.lockFacing) {
      sunModel.rotation.set(settings.frontRotation.x, settings.frontRotation.y, settings.frontRotation.z);
    }
    fallbackSphere.scale.setScalar(effectiveScale);
    spotlight.color.set(settings.spotlight.color);
    spotlight.distance = settings.spotlight.distance;
    spotlight.angle = THREE.MathUtils.degToRad(settings.spotlight.angleDegrees);
    spotlight.penumbra = settings.spotlight.penumbra;
    spotlight.decay = settings.spotlight.decay;
    debugOrbit.visible = settings.debugVisible;
    updateDebugOrbit();
    enforceSunMaterialVisibility();
    updateDebugState();
  }

  const cachedModel = assetManager?.cloneGltfScene?.('sun-model');
  if (cachedModel) {
    sunModel = cachedModel;
    sunModel.position.set(0, 0, 0);
    sunBodyGroup.add(sunModel);
    boxHelper = new THREE.BoxHelper(sunModel, 0x00ffff);
    boxHelper.name = 'SunCycleModelBoxHelper';
    boxHelper.visible = false;
    sunBodyGroup.add(boxHelper);
    enforceSunMaterialVisibility();
    console.info('[sunCycle] Sun model attached from AssetManager cache.');
  } else {
    fallbackSphere.visible = true;
    console.info('[sunCycle] Fallback sphere active because the sun model was not in AssetManager cache.');
  }

  applySettings();

  return {
    object3d,
    update(delta, forcedAngle = null) {
      if (!settings.enabled) return;
      if (typeof forcedAngle === 'number') angle = forcedAngle;
      else angle += delta * settings.angularSpeed * (settings.direction >= 0 ? 1 : -1);
      sunBodyGroup.position.set(
        Math.cos(angle) * settings.radius,
        Math.sin(angle) * settings.radius,
        settings.zOffset
      );
      spotlightTarget.position.set(0, 0, 0);
      object3d.updateMatrixWorld(true);
      spotlightTarget.updateMatrixWorld();

      sunBodyGroup.getWorldPosition(worldSunPosition);
      object3d.getWorldPosition(centerWorldPosition);
      radial.subVectors(worldSunPosition, centerWorldPosition).normalize();
      if (camera) {
        camera.getWorldPosition(cameraWorldPosition);
        cameraSide.subVectors(cameraWorldPosition, centerWorldPosition);
        cameraSide.addScaledVector(radial, -cameraSide.dot(radial));
      }
      if (cameraSide.lengthSq() < 1e-8) {
        cameraSide.set(0, 0, 1).addScaledVector(radial, -radial.z);
        if (cameraSide.lengthSq() < 1e-8) cameraSide.set(1, 0, 0).addScaledVector(radial, -radial.x);
      }
      cameraSide.normalize();
      const cameraDistance = camera ? cameraWorldPosition.distanceTo(centerWorldPosition) : 0;
      lightWorldPosition.copy(worldSunPosition)
        .addScaledVector(radial, visualRadius * settings.spotlight.radialOffsetMultiplier)
        .addScaledVector(cameraSide, cameraDistance * settings.spotlight.cameraOffsetFactor);
      spotlight.position.copy(sunBodyGroup.worldToLocal(lightWorldPosition));

      const horizonEpsilon = 0.01;
      const height = worldSunPosition.y - centerWorldPosition.y;
      if (height > horizonEpsilon) horizonTargetFactor = 1;
      else if (height < -horizonEpsilon) horizonTargetFactor = 0;
      const fadeDuration = settings.spotlight.fadeDurationSeconds;
      const factorStep = fadeDuration > 0 ? delta / fadeDuration : 1;
      horizonLightFactor += clamp(horizonTargetFactor - horizonLightFactor, -factorStep, factorStep);
      const easedHorizonFactor = horizonLightFactor * horizonLightFactor * (3 - 2 * horizonLightFactor);
      spotlight.intensity = settings.spotlight.intensity * progressionMultiplier * easedHorizonFactor;
      spotlight.visible = settings.spotlight.enabled && spotlight.intensity > 0.001;

      const spin = delta * settings.selfRotationSpeed;
      if (sunModel) {
        if (settings.lockFacing) {
          sunModel.rotation.set(settings.frontRotation.x, settings.frontRotation.y, settings.frontRotation.z);
        } else {
          sunModel.rotation.y += spin;
        }
      }
      if (!settings.lockFacing) fallbackSphere.rotation.y += spin;
      if (boxHelper && settings.debugVisible) boxHelper.update();
    },
    setProgressionMultiplier(nextMultiplier = 1) {
      progressionMultiplier = clamp(nextMultiplier, 0, 1);
    },
    setOptions(partialOptions) {
      settings = sanitizeSunCycleSettings(deepMerge(settings, partialOptions));
      applySettings();
    },
    getAngle() { return angle; },
    getOptions() { return settings; },
    dispose() {
      if (boxHelper) {
        sunBodyGroup.remove(boxHelper);
        boxHelper.geometry.dispose();
        boxHelper.material.dispose();
      }
      debugBasicMaterial.dispose();
      debugOrbit.geometry.dispose();
      debugOrbit.material.dispose();
    }
  };
}
