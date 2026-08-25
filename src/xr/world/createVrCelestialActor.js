import * as THREE from '../../vendor/three.js';

const STAR_COLORS = Object.freeze(['#ffffff', '#dce9ff', '#bfd5ff', '#ffedcf', '#ffd8a6']);
const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5));

function validateLayer(layer) {
  if (!layer || !Number.isFinite(layer.innerRadius) || !Number.isFinite(layer.outerRadius)
    || layer.innerRadius < 0 || layer.outerRadius <= layer.innerRadius) {
    throw new TypeError('VrCelestialActor requires a valid resolved STARS layer');
  }
}

function createGenerator(seed = 0x51f15e) {
  let state = seed >>> 0;
  return () => {
    state += 0x6d2b79f5;
    let value = state;
    value = Math.imul(value ^ value >>> 15, value | 1);
    value ^= value + Math.imul(value ^ value >>> 7, value | 61);
    return ((value ^ value >>> 14) >>> 0) / 0x100000000;
  };
}

function sampleDirection(random, target = new THREE.Vector3()) {
  const y = random() * 2 - 1;
  const azimuth = random() * Math.PI * 2;
  const horizontal = Math.sqrt(Math.max(0, 1 - y * y));
  return target.set(Math.cos(azimuth) * horizontal, y, Math.sin(azimuth) * horizontal);
}

function sampleVolumeRadius(random, innerRadius, outerRadius) {
  return Math.cbrt(innerRadius ** 3 + random() * (outerRadius ** 3 - innerRadius ** 3));
}

function createStarField(layer, settings) {
  const random = createGenerator();
  const positions = new Float32Array(settings.count * 3);
  const colors = new Float32Array(settings.count * 3);
  const sizes = new Float32Array(settings.count);
  const centers = Array.from({ length: settings.clusterCount }, (_, index) => {
    const y = 1 - 2 * (index + 0.5) / settings.clusterCount;
    const horizontal = Math.sqrt(Math.max(0, 1 - y * y));
    const azimuth = GOLDEN_ANGLE * index;
    const radius = sampleVolumeRadius(random, layer.innerRadius, layer.outerRadius);
    return new THREE.Vector3(Math.cos(azimuth) * horizontal, y, Math.sin(azimuth) * horizontal)
      .multiplyScalar(radius);
  });
  const clusteredCount = Math.round(settings.count * settings.clusteredFraction);
  const direction = new THREE.Vector3();
  const tangentA = new THREE.Vector3();
  const tangentB = new THREE.Vector3();
  const color = new THREE.Color();

  for (let index = 0; index < settings.count; index += 1) {
    let radius;
    if (index < clusteredCount) {
      const center = centers[index % centers.length];
      direction.copy(center).normalize();
      tangentA.set(0, Math.abs(direction.y) < 0.9 ? 1 : 0, Math.abs(direction.y) < 0.9 ? 0 : 1)
        .cross(direction).normalize();
      tangentB.crossVectors(direction, tangentA).normalize();
      const spread = settings.clusterAngularSpreadRadians * Math.sqrt(random());
      const angle = random() * Math.PI * 2;
      direction.addScaledVector(tangentA, Math.cos(angle) * spread)
        .addScaledVector(tangentB, Math.sin(angle) * spread).normalize();
      radius = THREE.MathUtils.clamp(center.length()
        + (random() + random() - 1) * settings.clusterRadialSpreadMeters,
      layer.innerRadius, layer.outerRadius);
    } else {
      sampleDirection(random, direction);
      radius = sampleVolumeRadius(random, layer.innerRadius, layer.outerRadius);
    }
    positions[index * 3] = direction.x * radius;
    positions[index * 3 + 1] = direction.y * radius;
    positions[index * 3 + 2] = direction.z * radius;
    color.set(STAR_COLORS[Math.floor(random() * STAR_COLORS.length)]);
    colors[index * 3] = color.r;
    colors[index * 3 + 1] = color.g;
    colors[index * 3 + 2] = color.b;
    sizes[index] = THREE.MathUtils.lerp(settings.pointSizeMinPx, settings.pointSizeMaxPx, random());
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
  const material = new THREE.ShaderMaterial({
    uniforms: { opacity: { value: 0 } },
    vertexShader: 'attribute float size; varying vec3 vColor; void main(){ vColor=color; vec4 mvPosition=modelViewMatrix*vec4(position,1.0); gl_PointSize=size; gl_Position=projectionMatrix*mvPosition; }',
    fragmentShader: 'uniform float opacity; varying vec3 vColor; void main(){ vec2 p=gl_PointCoord-vec2(0.5); float alpha=smoothstep(0.25,0.0,dot(p,p))*opacity; if(alpha<=0.0) discard; gl_FragColor=vec4(vColor,alpha); }',
    vertexColors: true,
    transparent: true,
    depthTest: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending
  });
  const points = new THREE.Points(geometry, material);
  points.name = 'VrCelestialStarField';
  points.frustumCulled = false;
  return { points, geometry, material };
}

export function createVrCelestialActor({ parent, assetManager, keyLight, layer, settings }) {
  if (!parent?.add || !assetManager?.cloneGltfScene || !keyLight?.isDirectionalLight || !settings) {
    throw new TypeError('VrCelestialActor requires parent, assetManager, keyLight and settings');
  }
  if (!Number.isFinite(settings.sun?.scale) || settings.sun.scale <= 0) {
    throw new TypeError('VrCelestialActor requires settings.sun.scale to be positive and finite');
  }
  validateLayer(layer);
  const sunModel = assetManager.cloneGltfScene('sun-model');
  if (!sunModel) throw new Error('VrCelestialActor requires cached sun-model');
  const root = new THREE.Group();
  root.name = 'VrCelestialActor';
  parent.add(root);
  const sunRoot = new THREE.Group();
  sunRoot.name = 'VrCelestialSunRoot';
  sunRoot.scale.setScalar(settings.sun.scale);
  sunRoot.add(sunModel);
  root.add(sunRoot);

  root.updateWorldMatrix(true, false);
  keyLight.updateWorldMatrix(true, false);
  const centerWorld = parent.getWorldPosition(new THREE.Vector3());
  const lightWorld = keyLight.getWorldPosition(new THREE.Vector3());
  const sunDirection = lightWorld.clone().sub(centerWorld).normalize();
  const sunWorld = centerWorld.clone().addScaledVector(
    sunDirection, settings.sun.distanceFromWorldCenter
  );
  sunRoot.position.copy(root.worldToLocal(sunWorld));
  sunRoot.lookAt(centerWorld);
  const correction = settings.sun.facingCorrectionDegrees;
  sunRoot.rotateX(THREE.MathUtils.degToRad(correction.x));
  sunRoot.rotateY(THREE.MathUtils.degToRad(correction.y));
  sunRoot.rotateZ(THREE.MathUtils.degToRad(correction.z));

  const sunMaterials = [];
  sunModel.traverse((node) => {
    if (!node.isMesh || !node.material) return;
    const originals = Array.isArray(node.material) ? node.material : [node.material];
    const clones = originals.map((original) => {
      const material = original.clone();
      sunMaterials.push({ material, baseOpacity: original.opacity });
      material.transparent = true;
      if (material.emissive?.isColor) {
        material.emissive.set(settings.sun.emissiveColor);
        material.emissiveIntensity = settings.sun.emissiveIntensity;
      }
      return material;
    });
    node.material = Array.isArray(node.material) ? clones : clones[0];
  });
  root.updateWorldMatrix(true, true);
  const sunBounds = new THREE.Box3().setFromObject(sunRoot);
  const sunBoundingSphere = sunBounds.getBoundingSphere(new THREE.Sphere());
  const boundingRadius = sunBoundingSphere.radius;
  const requiredRadius = boundingRadius * 1.15;
  const lightOffsetFromSun = Math.max(3, requiredRadius * 2.5);
  const sunLightRig = new THREE.Group();
  sunLightRig.name = 'VrCelestialSunLightRig';
  const sunLight = new THREE.SpotLight(
    settings.sun.light.color,
    settings.sun.light.intensity,
    settings.sun.light.distance,
    Math.asin(requiredRadius / lightOffsetFromSun)
  );
  sunLight.name = 'VrCelestialSunLight';
  sunLight.intensity = settings.sun.light.intensity;
  sunLight.decay = settings.sun.light.decay;
  sunLight.distance = settings.sun.light.distance;
  sunLight.castShadow = false;
  const lightTarget = new THREE.Object3D();
  lightTarget.name = 'VrCelestialSunLightTarget';
  lightTarget.position.copy(root.worldToLocal(sunWorld.clone()));
  sunLight.position.copy(root.worldToLocal(
    sunWorld.clone().addScaledVector(sunDirection, -lightOffsetFromSun)
  ));
  sunLight.target = lightTarget;
  sunLightRig.add(sunLight, lightTarget);
  root.add(sunLightRig);
  const starField = createStarField(layer, settings.stars);
  root.add(starField.points);
  let opacity = 0;
  let transition = null;
  let revealStarted = false;
  let disposed = false;

  function applyOpacity(value) {
    opacity = THREE.MathUtils.clamp(value, 0, 1);
    for (const entry of sunMaterials) entry.material.opacity = entry.baseOpacity * opacity;
    sunLight.intensity = settings.sun.light.intensity * opacity;
    starField.material.uniforms.opacity.value = opacity;
  }
  function beginReveal() {
    if (disposed || revealStarted) return false;
    revealStarted = true;
    transition = { from: opacity, to: 1, elapsed: 0, duration: settings.revealDurationSeconds };
    return true;
  }
  function beginFadeOut(durationSeconds) {
    if (!Number.isFinite(durationSeconds) || durationSeconds <= 0) {
      throw new TypeError('durationSeconds must be positive and finite');
    }
    if (disposed) return false;
    transition = { from: opacity, to: 0, elapsed: 0, duration: durationSeconds };
    return true;
  }
  function update(delta = 0) {
    if (disposed || !transition) return;
    transition.elapsed += Math.max(0, Number.isFinite(delta) ? delta : 0);
    const progress = Math.min(1, transition.elapsed / transition.duration);
    applyOpacity(THREE.MathUtils.lerp(transition.from, transition.to, progress));
    if (progress >= 1) transition = null;
  }
  function reset() { transition = null; revealStarted = false; applyOpacity(0); }
  function hydrateScenarioState(state) {
    if (state?.active === true) { transition = null; revealStarted = true; applyOpacity(1); }
  }
  function dispose() {
    if (disposed) return;
    disposed = true;
    transition = null;
    parent.remove(root);
    starField.geometry.dispose();
    starField.material.dispose();
    for (const entry of sunMaterials) entry.material.dispose();
    root.clear();
  }
  reset();
  return {
    object: root,
    requiredCameraFar: settings.sun.distanceFromWorldCenter + boundingRadius + 5,
    beginReveal,
    beginFadeOut,
    update,
    reset,
    hydrateScenarioState,
    dispose
  };
}
