import * as THREE from '../vendor/three.js';
import { assetManifest } from '../assets/assetManifest.js';
const NODE_MODEL_TARGET_DIMENSION = 0.6;
const HOVER_SCALE_TARGET = 1.06;
const HOVER_SCALE_LERP = 0.08;
const HOVER_LIGHT_INTENSITY_TARGET = 2.8;
const HOVER_LIGHT_INTENSITY_LERP = 0.08;
const HOVER_LIGHT_DISTANCE = 5.5;
const HOVER_LIGHT_DECAY = 2;
const HOVER_LIGHT_RADIAL_T = 0.7;
const FALLBACK_HOVER_ANIMATION_DURATION = 0.9;
const REDUCED_MOTION_HOVER_ANIMATION_DURATION = 0.22;
const WOOD_TREE_REVEAL_HOLD_DURATION = 1.1;
const FIRE_EMBER_FADE_OUT_DURATION = 0.75;
const prefersReducedMotion = typeof window !== 'undefined'
  && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
const WOOD_NODE_ID = 'ai-guide';
const FIRE_NODE_ID = 'creative-ai';
const WOOD_NODE_HOVER_LIGHT_COLOR = '#cbff74';
const WOOD_NODE_HOVER_LIGHT_INTENSITY_TARGET = 3.3;
const TEST_SPARK_RADIUS = 0.005;
const TEST_SPARK_COUNT = 2;
const TEST_SPARK_PHASE_OFFSETS = [0, Math.PI];
const TEST_SPARK_SEQUENCE_BASE_OFFSETS = [0, Math.PI / 2, -Math.PI / 2];
const TEST_SPARK_BURST_OFFSETS_WITHIN_SEQUENCE = [0, Math.PI / 6, -Math.PI / 6];
const TEST_SPARK_BURST_DELAYS_WITHIN_SEQUENCE = [0, 0.1, 0.2];
const TEST_SPARK_BURST_SEQUENCE = TEST_SPARK_SEQUENCE_BASE_OFFSETS.flatMap((sequenceBaseOffset) =>
  TEST_SPARK_BURST_OFFSETS_WITHIN_SEQUENCE.map((burstOffsetWithinSequence, burstIndex) => ({
    delay: TEST_SPARK_BURST_DELAYS_WITHIN_SEQUENCE[burstIndex] ?? 0,
    angleOffset: sequenceBaseOffset + burstOffsetWithinSequence
  }))
);
const TEST_SPARK_COLOR = '#fff36b';
const TEST_SPARK_DURATION = 1.5;
const TEST_SPARK_SPIRAL_RADIUS = 0.22;
const TEST_SPARK_RADIUS_AT_MID_HEIGHT_FACTOR = 0.72;
const TEST_SPARK_RADIUS_AT_TOP_FACTOR = 1.3;
const TEST_SPARK_SECOND_SPIRAL_OFFSET = Math.PI / 6;
const TEST_SPARK_ANGULAR_SPEED = 2.6 * 0.8;
const TEST_SPARK_BASE_ANGULAR_VELOCITY = (Math.PI * 2 * TEST_SPARK_ANGULAR_SPEED) / TEST_SPARK_DURATION;
const TEST_SPARK_BASE_ROTATION_TURNS = TEST_SPARK_ANGULAR_SPEED;
const TEST_SPARK_RISE_HEIGHT = 1.35;
const TEST_SPARK_START_YOFFSET = -0.2;
const EMBER_SPHERE_ENABLED = true;
const EMBER_SPHERE_IGNITE_DELAY = 2.0;
const EMBER_SPHERE_FADE_IN_DURATION = 0.75;
const EMBER_SPHERE_RADIUS = TEST_SPARK_SPIRAL_RADIUS / 3;
const EMBER_SPHERE_Y_FACTOR = 0.66;
const EMBER_SPHERE_CENTER_COLOR = new THREE.Color('#fff36b');
const EMBER_SPHERE_EDGE_COLOR = new THREE.Color('#ff4a1f');
const EMBER_SPHERE_MAX_OPACITY = 0.72;
const EMBER_SPHERE_PULSE_INTENSITY = 0.0;
const TEST_SPARK_TRAJECTORY_VARIANTS = [
  { rotationDirection: 1, angularSpeedMultiplier: 1 },
  { rotationDirection: -1, angularSpeedMultiplier: 0.5 }
];
const BASELINE_SPARK_LAYER_CONFIG = Object.freeze({
  layerName: 'baseline',
  groupName: 'testSpiralSparkGroup',
  angularSpeedMultiplier: 1,
  rotationTurnsMultiplier: 1,
  radiusProfile: Object.freeze({
    mode: 'baseline',
    baseRadiusMultiplier: 1,
    topRadiusMultiplier: TEST_SPARK_RADIUS_AT_TOP_FACTOR
  }),
  randomness: Object.freeze({
    angleJitter: 0,
    speedJitter: 0,
    radiusJitter: 0,
    startDelayJitter: 0
  })
});
const SLOW_MOTION_SPARK_LAYER_CONFIG = Object.freeze({
  layerName: 'slowmotion',
  groupName: 'slowMotionSparkGroup',
  angularSpeedMultiplier: 1,
  rotationTurnsMultiplier: 0.25,
  radiusProfile: Object.freeze({
    mode: 'cone',
    baseRadiusMultiplier: 2,
    topRadiusRatio: 0.05
  }),
  randomness: Object.freeze({
    angleJitter: 0,
    speedJitter: 0,
    radiusJitter: 0,
    startDelayJitter: 0
  })
});

function getSparkOpacityByHeight(heightProgress) {
  const clampedHeight = THREE.MathUtils.clamp(heightProgress, 0, 1);
  if (clampedHeight <= 0.5) return 1;
  if (clampedHeight <= 0.6) return THREE.MathUtils.lerp(0.9, 0.7, (clampedHeight - 0.5) / 0.1);
  return THREE.MathUtils.lerp(0.7, 0, THREE.MathUtils.smoothstep((clampedHeight - 0.6) / 0.4, 0, 1));
}



function getSpiralRadiusByHeight(heightProgress) {
  const clampedHeight = THREE.MathUtils.clamp(heightProgress, 0, 1);
  const baseRadius = TEST_SPARK_SPIRAL_RADIUS;
  const minRadius = baseRadius * TEST_SPARK_RADIUS_AT_MID_HEIGHT_FACTOR;
  const topRadius = baseRadius * TEST_SPARK_RADIUS_AT_TOP_FACTOR;

  if (clampedHeight <= 0.5) {
    const t = THREE.MathUtils.smoothstep(clampedHeight / 0.5, 0, 1);
    return THREE.MathUtils.lerp(baseRadius, minRadius, t);
  }

  const t = THREE.MathUtils.smoothstep((clampedHeight - 0.5) / 0.5, 0, 1);
  return THREE.MathUtils.lerp(minRadius, topRadius, t);
}

function getSlowMotionSpiralRadius(heightProgress) {
  const clampedHeight = THREE.MathUtils.clamp(heightProgress, 0, 1);
  const baseRadius = TEST_SPARK_SPIRAL_RADIUS * SLOW_MOTION_SPARK_LAYER_CONFIG.radiusProfile.baseRadiusMultiplier;
  const topRadius = baseRadius * SLOW_MOTION_SPARK_LAYER_CONFIG.radiusProfile.topRadiusRatio;
  const t = THREE.MathUtils.smoothstep(clampedHeight, 0, 1);
  return THREE.MathUtils.lerp(baseRadius, topRadius, t);
}

function getSparkLayerRadius(heightProgress, layerConfig) {
  if (layerConfig?.radiusProfile?.mode === 'cone') return getSlowMotionSpiralRadius(heightProgress);
  return getSpiralRadiusByHeight(heightProgress);
}
const WOOD_TREE_EFFECT_MODEL_PATH = 'glb/glyph_1-tree.glb';
const WOOD_TREE_EFFECT_FALLBACK_MODEL_PATH = 'glb/glyph_1.glb';
const WOOD_TREE_REVEAL_DURATION_IN = 9.6;
const WOOD_TREE_REVEAL_DURATION_OUT = 0.7;
const WOOD_TREE_REVEAL_RADIUS_MIN = 0.06;
const WOOD_TREE_REVEAL_RADIUS_MAX = 1.42;
const WOOD_TREE_REVEAL_SOFTNESS = 0.24;
const WOOD_TREE_EMISSIVE_INTENSITY_ACTIVE = 1.35;
const WOOD_TREE_GLOW_INTENSITY = 1.15;
const WOOD_TREE_PULSE_INTENSITY = 0.09;
const WOOD_TREE_PULSE_SPEED = 0.95;
const WOOD_TREE_SCALE = 1.24;
const WOOD_TREE_Y_OFFSET = 0.02;
const WOOD_TREE_BASE_COLOR = new THREE.Color('#162111');
const WOOD_TREE_EMISSIVE_BASE = new THREE.Color('#0f1e0e');
const WOOD_TREE_EMISSIVE_ACTIVE_BOTTOM = new THREE.Color('#1d7f1d');
const WOOD_TREE_EMISSIVE_ACTIVE_TOP = new THREE.Color('#55ff22');
const WOOD_TREE_POINT_LIGHT_COLOR = '#55ff22';
const WOOD_TREE_POINT_LIGHT_INTENSITY = 1.0;
const WOOD_TREE_POST_REVEAL_GLOW_INTENSITY = 0.22;
const WOOD_TREE_POST_REVEAL_PULSE_INTENSITY = 0.04;
const WOOD_TREE_ORBIT_ENABLED = true;
const WOOD_TREE_ORBIT_SPEED = 0.96;
const WOOD_TREE_ORBIT_BOBBING_AMPLITUDE = 0.04;
const WOOD_TREE_ORBIT_BOBBING_SPEED = 0.95;


function createWoodTreeEffectRuntime() {
  return {
    revealProgress: 0,
    revealTarget: 0,
    treeGroup: null,
    treeMaterials: [],
    shaderEntries: [],
    revealCenterLocal: new THREE.Vector3(0, -0.38, 0),
    minY: -0.5,
    maxY: 0.5,
    treePointLight: null,
    pulsePhase: Math.random() * Math.PI * 2,
    branchDelayPhase: Math.random() * 10,
    phase: 'inactive',
    orbitAngle: Math.random() * Math.PI * 2,
    orbitRadius: 0,
    orbitHeightOffset: 0,
    orbitCenter: new THREE.Vector3(0, 0, 0),
    lastElapsed: null
  };
}

function createHoverAnimationRuntime() {
  return {
    state: 'idle',
    startedAt: null,
    progress: 0
  };
}

function createFireSparkRuntime() {
  return {
    layers: [],
    active: false,
    sequenceStartTime: -Infinity,
    pendingStart: false,
    hasLoggedAngularDiagnostics: false,
    emberSphere: null,
    emberIgniteStartTime: -Infinity
  };
}


function createEmberSphere() {
  const geometry = new THREE.SphereGeometry(EMBER_SPHERE_RADIUS, 24, 24);
  const material = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    uniforms: {
      uCenterColor: { value: EMBER_SPHERE_CENTER_COLOR.clone() },
      uEdgeColor: { value: EMBER_SPHERE_EDGE_COLOR.clone() },
      uOpacity: { value: 0 }
    },
    vertexShader: `
      varying vec3 vNormal;
      void main() {
        vNormal = normalize(normalMatrix * normal);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      varying vec3 vNormal;
      uniform vec3 uCenterColor;
      uniform vec3 uEdgeColor;
      uniform float uOpacity;

      void main() {
        float rim = pow(1.0 - abs(dot(vNormal, vec3(0.0, 0.0, 1.0))), 1.5);
        vec3 color = mix(uCenterColor, uEdgeColor, smoothstep(0.2, 0.95, rim));
        float alphaMask = smoothstep(1.0, 0.15, rim);
        gl_FragColor = vec4(color, alphaMask * uOpacity);
      }
    `
  });

  const mesh = new THREE.Mesh(geometry, material);
  mesh.visible = false;
  mesh.renderOrder = 4;
  mesh.raycast = () => {};
  return mesh;
}

function initializeFireSparkSystem(node, runtime) {
  const geometry = new THREE.SphereGeometry(TEST_SPARK_RADIUS, 12, 12);
  const layerConfigs = [
    { ...BASELINE_SPARK_LAYER_CONFIG, radiusProfile: { ...BASELINE_SPARK_LAYER_CONFIG.radiusProfile }, randomness: { ...BASELINE_SPARK_LAYER_CONFIG.randomness } },
    { ...SLOW_MOTION_SPARK_LAYER_CONFIG, radiusProfile: { ...SLOW_MOTION_SPARK_LAYER_CONFIG.radiusProfile }, randomness: { ...SLOW_MOTION_SPARK_LAYER_CONFIG.randomness } }
  ];

  runtime.layers = layerConfigs.map((layerConfig) => {
    const group = new THREE.Group();
    group.name = layerConfig.groupName;
    group.renderOrder = 3;

    const sparkMeshes = [];
    const sparkEntries = [];
    TEST_SPARK_TRAJECTORY_VARIANTS.forEach(({ rotationDirection, angularSpeedMultiplier }) => {
      TEST_SPARK_BURST_SEQUENCE.forEach(({ delay, angleOffset }) => {
        [0, TEST_SPARK_SECOND_SPIRAL_OFFSET].forEach((spiralOffset) => {
          for (let index = 0; index < TEST_SPARK_COUNT; index += 1) {
            const material = new THREE.MeshBasicMaterial({
              color: TEST_SPARK_COLOR,
              transparent: true,
              opacity: 1
            });
            const sparkMesh = new THREE.Mesh(geometry, material);
            sparkMesh.visible = false;
            sparkMesh.raycast = () => {};
            group.add(sparkMesh);
            sparkMeshes.push(sparkMesh);
            sparkEntries.push({
              mesh: sparkMesh,
              phaseOffset: TEST_SPARK_PHASE_OFFSETS[index] ?? 0,
              burstDelay: delay,
              burstAngleOffset: angleOffset + spiralOffset,
              rotationDirection,
              angularSpeedMultiplier,
              startTime: -Infinity
            });
          }
        });
      });
    });
    group.visible = false;
    node.add(group);
    return { config: layerConfig, group, sparkMeshes, sparkEntries };
  });

  if (EMBER_SPHERE_ENABLED) {
    const emberSphere = createEmberSphere();
    emberSphere.position.set(0, TEST_SPARK_START_YOFFSET + TEST_SPARK_RISE_HEIGHT * EMBER_SPHERE_Y_FACTOR, 0);
    node.add(emberSphere);
    runtime.emberSphere = emberSphere;
  }
}

function startFireSparkBurst(runtime, elapsed) {
  if (!runtime?.layers?.length) return;
  runtime.active = true;
  runtime.pendingStart = false;
  runtime.sequenceStartTime = elapsed;
  runtime.emberIgniteStartTime = elapsed + EMBER_SPHERE_IGNITE_DELAY;
  if (runtime.emberSphere) {
    runtime.emberSphere.visible = false;
    runtime.emberSphere.material.uniforms.uOpacity.value = 0;
  }
  runtime.layers.forEach((layer) => {
    layer.group.visible = true;

    if (!runtime.hasLoggedAngularDiagnostics && layer.sparkEntries.length) {
      const diagnosticEntry = layer.sparkEntries[0];
      const effectiveAngularVelocity = TEST_SPARK_BASE_ANGULAR_VELOCITY
        * diagnosticEntry.angularSpeedMultiplier
        * diagnosticEntry.rotationDirection
        * layer.config.angularSpeedMultiplier;
      const effectiveRotationTurns = TEST_SPARK_BASE_ROTATION_TURNS
        * diagnosticEntry.angularSpeedMultiplier
        * diagnosticEntry.rotationDirection
        * layer.config.rotationTurnsMultiplier;
      const sampleAngleAtHalfSecond = 0.5 * effectiveRotationTurns * Math.PI * 2
        + diagnosticEntry.phaseOffset
        + diagnosticEntry.burstAngleOffset;
      console.info('[FireSparkBurst] rotation diagnostics', {
        layerName: layer.config.layerName,
        layerAngularSpeedMultiplier: layer.config.angularSpeedMultiplier,
        layerRotationTurnsMultiplier: layer.config.rotationTurnsMultiplier,
        entryAngularSpeedMultiplier: diagnosticEntry.angularSpeedMultiplier,
        rotationDirection: diagnosticEntry.rotationDirection,
        effectiveAngularVelocity,
        effectiveRotationTurns,
        lifetime: TEST_SPARK_DURATION,
        sampleAngleAtHalfSecond
      });
    }
    layer.sparkEntries.forEach((entry) => {
      entry.startTime = elapsed + entry.burstDelay;
      entry.mesh.visible = false;
      entry.mesh.material.opacity = 1;
      const startAngle = entry.phaseOffset + entry.burstAngleOffset;
      const startRadius = getSparkLayerRadius(0, layer.config);
      entry.mesh.position.set(
        Math.cos(startAngle) * startRadius,
        TEST_SPARK_START_YOFFSET,
        Math.sin(startAngle) * startRadius
      );
    });
  });

  runtime.hasLoggedAngularDiagnostics = true;
}

function updateFireSparkBurst(runtime, elapsed) {
  if (!runtime?.layers?.length) return;
  if (runtime.pendingStart) startFireSparkBurst(runtime, elapsed);
  if (!runtime.active) return;
  let runtimeHasVisibleSparks = false;
  let runtimeHasPendingBursts = false;

  runtime.layers.forEach((layer) => {
    let hasVisibleSparks = false;
    let hasPendingBursts = false;

    layer.sparkEntries.forEach((entry) => {
      const elapsedSinceBurst = elapsed - entry.startTime;
      if (elapsedSinceBurst < 0) {
        hasPendingBursts = true;
        entry.mesh.visible = false;
        return;
      }

      const progress = THREE.MathUtils.clamp(elapsedSinceBurst / TEST_SPARK_DURATION, 0, 1);
      const opacity = getSparkOpacityByHeight(progress);
      const effectiveRotationTurns = TEST_SPARK_BASE_ROTATION_TURNS
        * entry.angularSpeedMultiplier
        * entry.rotationDirection
        * layer.config.rotationTurnsMultiplier;
      const baseAngle = progress * effectiveRotationTurns * Math.PI * 2;
      const y = TEST_SPARK_START_YOFFSET + progress * TEST_SPARK_RISE_HEIGHT;
      const angle = baseAngle + entry.phaseOffset + entry.burstAngleOffset;
      const radius = getSparkLayerRadius(progress, layer.config);

      entry.mesh.visible = progress < 1;
      entry.mesh.position.set(
        Math.cos(angle) * radius,
        y,
        Math.sin(angle) * radius
      );
      entry.mesh.material.opacity = opacity;

      if (progress < 1) hasVisibleSparks = true;
    });

    layer.group.visible = hasVisibleSparks || hasPendingBursts;
    runtimeHasVisibleSparks = runtimeHasVisibleSparks || hasVisibleSparks;
    runtimeHasPendingBursts = runtimeHasPendingBursts || hasPendingBursts;
  });

  if (runtime.emberSphere && EMBER_SPHERE_ENABLED) {
    const igniteT = (elapsed - runtime.emberIgniteStartTime) / Math.max(0.001, EMBER_SPHERE_FADE_IN_DURATION);
    const fadeOutStart = runtime.emberIgniteStartTime + EMBER_SPHERE_FADE_IN_DURATION;
    const fadeOutT = (elapsed - fadeOutStart) / Math.max(0.001, FIRE_EMBER_FADE_OUT_DURATION);
    const opacity = EMBER_SPHERE_MAX_OPACITY
      * THREE.MathUtils.smoothstep(THREE.MathUtils.clamp(igniteT, 0, 1), 0, 1)
      * (1 - THREE.MathUtils.smoothstep(THREE.MathUtils.clamp(fadeOutT, 0, 1), 0, 1));
    runtime.emberSphere.visible = opacity > 0.001;
    runtime.emberSphere.material.uniforms.uOpacity.value = opacity;
  }

  runtime.active = runtimeHasVisibleSparks || runtimeHasPendingBursts || (runtime.emberSphere?.visible ?? false);
}

function applyWoodTreeActivation(runtime, elapsed, isPlaying) {
  if (!runtime?.treeGroup || !runtime.treeMaterials.length) return;

  const elapsedSinceStart = runtime.animationStartedAt === null ? 0 : elapsed - runtime.animationStartedAt;
  const revealEnd = WOOD_TREE_REVEAL_DURATION_IN;
  const fadeStart = revealEnd + WOOD_TREE_REVEAL_HOLD_DURATION;
  const revealProgress = !isPlaying ? 0
    : elapsedSinceStart < revealEnd ? elapsedSinceStart / revealEnd
      : elapsedSinceStart < fadeStart ? 1
        : 1 - THREE.MathUtils.clamp((elapsedSinceStart - fadeStart) / WOOD_TREE_REVEAL_DURATION_OUT, 0, 1);
  runtime.revealProgress = THREE.MathUtils.clamp(revealProgress, 0, 1);
  runtime.phase = runtime.revealProgress <= 0 ? 'inactive'
    : elapsedSinceStart < revealEnd ? 'revealing'
      : elapsedSinceStart < fadeStart ? 'activeOrbit' : 'fadingOut';

  const easedProgress = THREE.MathUtils.smoothstep(runtime.revealProgress, 0, 1);
  const revealRadius = THREE.MathUtils.lerp(WOOD_TREE_REVEAL_RADIUS_MIN, WOOD_TREE_REVEAL_RADIUS_MAX, easedProgress);
  const span = Math.max(0.0001, runtime.maxY - runtime.minY);
  const isActiveOrbit = runtime.phase === 'activeOrbit';
  const pulse = 1 + Math.sin(elapsed * WOOD_TREE_PULSE_SPEED + runtime.pulsePhase)
    * (isActiveOrbit ? WOOD_TREE_POST_REVEAL_PULSE_INTENSITY : WOOD_TREE_PULSE_INTENSITY);

  runtime.shaderEntries.forEach((entry) => {
    entry.uniforms.uRevealCenter.value.copy(runtime.revealCenterLocal);
    entry.uniforms.uRevealRadius.value = revealRadius;
    entry.uniforms.uRevealSoftness.value = WOOD_TREE_REVEAL_SOFTNESS;
  });
  runtime.treeMaterials.forEach((entry) => {
    const yRatio = THREE.MathUtils.clamp((entry.centerY - runtime.minY) / span, 0, 1);
    const fill = THREE.MathUtils.clamp(THREE.MathUtils.smoothstep(yRatio, -0.16 + easedProgress * 0.9, 0.2 + easedProgress * 1.08), 0, 1);
    const activeColor = WOOD_TREE_EMISSIVE_ACTIVE_BOTTOM.clone().lerp(WOOD_TREE_EMISSIVE_ACTIVE_TOP, yRatio);
    entry.material.color.copy(WOOD_TREE_BASE_COLOR);
    entry.material.emissive.copy(WOOD_TREE_EMISSIVE_BASE).lerp(activeColor, fill);
    entry.material.emissiveIntensity = (fill > 0.001 ? 0.04 + fill * WOOD_TREE_EMISSIVE_INTENSITY_ACTIVE * WOOD_TREE_GLOW_INTENSITY : 0) * pulse;
  });
  runtime.treeGroup.visible = runtime.revealProgress > 0.001;
  if (runtime.treePointLight) {
    runtime.treePointLight.intensity = runtime.revealProgress * WOOD_TREE_POINT_LIGHT_INTENSITY * pulse;
    if (WOOD_TREE_ORBIT_ENABLED && isActiveOrbit && runtime.orbitRadius > 0.0001) {
      runtime.orbitAngle += WOOD_TREE_ORBIT_SPEED * Math.max(0, elapsed - (runtime.lastElapsed ?? elapsed));
      runtime.treePointLight.position.set(runtime.orbitCenter.x + Math.cos(runtime.orbitAngle) * runtime.orbitRadius, runtime.orbitCenter.y + runtime.orbitHeightOffset + Math.sin(elapsed * WOOD_TREE_ORBIT_BOBBING_SPEED + runtime.pulsePhase) * WOOD_TREE_ORBIT_BOBBING_AMPLITUDE, runtime.orbitCenter.z + Math.sin(runtime.orbitAngle) * runtime.orbitRadius);
    }
    runtime.treePointLight.visible = runtime.treePointLight.intensity > 0.01;
    runtime.lastElapsed = elapsed;
  }
}

function fitModelToNode(model) {
  const box = new THREE.Box3().setFromObject(model);
  const size = new THREE.Vector3();
  box.getSize(size);

  const maxDimension = Math.max(size.x, size.y, size.z) || 1;
  const uniformScale = NODE_MODEL_TARGET_DIMENSION / maxDimension;
  model.scale.setScalar(uniformScale);
  model.updateMatrixWorld(true);

  const centeredBox = new THREE.Box3().setFromObject(model);
  const center = new THREE.Vector3();
  centeredBox.getCenter(center);
  model.position.sub(center);
}

async function attachWoodTreeEffectModel(node, item, assetManager) {
  if (item.id !== WOOD_NODE_ID || !node.userData.woodTreeEffectRuntime) return;

  const treeAsset = assetManifest.optionalLate.find((asset) => asset.id === 'wood-tree-effect');
  if (!treeAsset || !assetManager) return;

  try {
    await assetManager.loadAsset(treeAsset);
  } catch (error) {
    console.warn(`[orbitNodes] Failed to late-load optional wood tree effect model for ${item.id}. Wood tree visual effect disabled safely.`, error);
    return;
  }

  const treeModel = assetManager.cloneGltfScene(treeAsset.id);

  if (!treeModel) {
    console.warn(`[orbitNodes] Wood tree effect model for ${item.id} is optionalLate and was not available. Wood tree visual effect disabled safely.`);
    return;
  }

  fitModelToNode(treeModel);
  treeModel.scale.multiplyScalar(WOOD_TREE_SCALE);
  treeModel.position.y += WOOD_TREE_Y_OFFSET;

  const bounds = new THREE.Box3().setFromObject(treeModel);
  const minY = bounds.min.y;
  const maxY = bounds.max.y;
  const treeMaterials = [];
  const shaderEntries = [];
  const center = new THREE.Vector3();

  treeModel.traverse((child) => {
    if (!child.isMesh || !child.material) return;
    child.material = child.material.clone();
    child.material.transparent = true;
    child.material.depthWrite = true;
    const shaderUniforms = {
      uRevealCenter: { value: new THREE.Vector3(0, -0.38, 0) },
      uRevealRadius: { value: WOOD_TREE_REVEAL_RADIUS_MIN },
      uRevealSoftness: { value: WOOD_TREE_REVEAL_SOFTNESS }
    };
    child.material.onBeforeCompile = (shader) => {
      shader.uniforms.uRevealCenter = shaderUniforms.uRevealCenter;
      shader.uniforms.uRevealRadius = shaderUniforms.uRevealRadius;
      shader.uniforms.uRevealSoftness = shaderUniforms.uRevealSoftness;
      shader.vertexShader = shader.vertexShader.replace(
        '#include <common>',
        '#include <common>\nvarying vec3 vRevealLocalPosition;'
      ).replace(
        '#include <begin_vertex>',
        '#include <begin_vertex>\nvRevealLocalPosition = transformed;'
      );
      shader.fragmentShader = shader.fragmentShader.replace(
        '#include <common>',
        '#include <common>\nvarying vec3 vRevealLocalPosition;\nuniform vec3 uRevealCenter;\nuniform float uRevealRadius;\nuniform float uRevealSoftness;'
      ).replace(
        '#include <dithering_fragment>',
        `float revealDist = distance(vRevealLocalPosition, uRevealCenter);
float revealMask = 1.0 - smoothstep(uRevealRadius - uRevealSoftness, uRevealRadius + uRevealSoftness, revealDist);
float yMask = smoothstep(uRevealCenter.y - 0.06, uRevealCenter.y + uRevealRadius + 0.08, vRevealLocalPosition.y);
float finalRevealMask = clamp(revealMask * (0.55 + 0.45 * yMask), 0.0, 1.0);
if (finalRevealMask < 0.02) discard;
diffuseColor.rgb = mix(vec3(0.0), diffuseColor.rgb, finalRevealMask);
totalEmissiveRadiance *= finalRevealMask;
#include <dithering_fragment>`
      );
    };
    child.material.needsUpdate = true;
    shaderEntries.push({ uniforms: shaderUniforms });
    child.getWorldPosition(center);
    treeMaterials.push({ material: child.material, centerY: center.y });
  });

  const runtime = node.userData.woodTreeEffectRuntime;
  runtime.treeGroup = treeModel;
  runtime.treeMaterials = treeMaterials;
  runtime.shaderEntries = shaderEntries;
  runtime.minY = minY;
  runtime.maxY = maxY;

  const treePointLight = new THREE.PointLight(WOOD_TREE_POINT_LIGHT_COLOR, 0, 2.4, 2);
  treePointLight.position.set(0, -0.06, 0);
  treePointLight.visible = false;
  treeModel.add(treePointLight);
  runtime.treePointLight = treePointLight;
  runtime.orbitCenter.set(0, 0, 0);
  const orbitOffset = treePointLight.position.clone().sub(runtime.orbitCenter);
  runtime.orbitRadius = Math.max(0.08, Math.sqrt(orbitOffset.x ** 2 + orbitOffset.z ** 2));
  runtime.orbitHeightOffset = orbitOffset.y;
  runtime.orbitAngle = Math.atan2(orbitOffset.z, orbitOffset.x);

  treeModel.visible = false;
  node.add(treeModel);
  console.info(`[orbitNodes] Attached optionalLate wood tree effect model for ${item.id} from AssetManager.`);
}

async function attachNodeModel(node, item, assetManager = null) {
  if (!item.modelPath) return;

  const model = assetManager?.cloneGltfScene?.(`glyph-${item.id}`);
  if (!model) {
    console.info(`[orbitNodes] Sphere fallback retained for ${item.id} because the glyph model was not in AssetManager cache.`);
    return;
  }

  fitModelToNode(model);
  node.add(model);
  node.material.visible = false;
  node.userData.visualModel = model;
  console.info(`[orbitNodes] Attached node model for ${item.id} from AssetManager cache.`);

  await attachWoodTreeEffectModel(node, item, assetManager);
}

function getHoverAnimationDuration(nodeId) {
  if (prefersReducedMotion) return REDUCED_MOTION_HOVER_ANIMATION_DURATION;
  if (nodeId === WOOD_NODE_ID) return WOOD_TREE_REVEAL_DURATION_IN + WOOD_TREE_REVEAL_HOLD_DURATION + WOOD_TREE_REVEAL_DURATION_OUT;
  if (nodeId === FIRE_NODE_ID) return EMBER_SPHERE_IGNITE_DELAY + EMBER_SPHERE_FADE_IN_DURATION + FIRE_EMBER_FADE_OUT_DURATION;
  return FALLBACK_HOVER_ANIMATION_DURATION;
}

function updateNodeHoverAnimation(node, elapsed) {
  const runtime = node.userData.hoverAnimationRuntime;
  if (!runtime || runtime.state !== 'playing') return 0;
  if (runtime.startedAt === null) {
    runtime.startedAt = elapsed;
    if (node.userData.woodTreeEffectRuntime) node.userData.woodTreeEffectRuntime.animationStartedAt = elapsed;
    if (node.userData.fireSparkRuntime && !prefersReducedMotion) node.userData.fireSparkRuntime.pendingStart = true;
  }
  runtime.progress = THREE.MathUtils.clamp((elapsed - runtime.startedAt) / getHoverAnimationDuration(node.userData.id), 0, 1);
  if (runtime.progress >= 1) {
    runtime.state = 'idle';
    runtime.startedAt = null;
  }
  return runtime.progress;
}

export function createOrbitNodes(nodeContent, { assetManager = null } = {}) {
  const group = new THREE.Group();
  const nodes = [];
  const radius = 3.8;
  const worldPosition = new THREE.Vector3();
  const centerPosition = new THREE.Vector3();
  const lightPosition = new THREE.Vector3();
  const scaleTarget = new THREE.Vector3(1, 1, 1);

  nodeContent.forEach((item, index) => {
    const angle = (Math.PI * 2 * index) / nodeContent.length;
    const node = new THREE.Mesh(
      new THREE.SphereGeometry(0.2, 16, 14),
      new THREE.MeshStandardMaterial({
        color: '#79a6ff',
        emissive: '#21365f',
        emissiveIntensity: 0.45,
        roughness: 0.35,
        metalness: 0.2
      })
    );

    node.position.set(Math.cos(angle) * radius, 0.65 + Math.sin(index * 1.2) * 0.25, Math.sin(angle) * radius);
    const hoverPointLight = new THREE.PointLight(node.material.color.clone(), 0, HOVER_LIGHT_DISTANCE, HOVER_LIGHT_DECAY);
    hoverPointLight.visible = false;
    node.add(hoverPointLight);

    node.userData = {
      ...item,
      orbitAngle: angle,
      orbitRadius: radius,
      yOffset: node.position.y,
      baseScale: 1,
      targetScale: 1,
      currentHoverLightIntensity: 0,
      targetHoverLightIntensity: 0,
      hoverPointLight,
      baseColor: '#79a6ff',
      hoverColor: '#c8deff',
      baseEmissive: '#21365f',
      hoverEmissive: '#6ba7ff',
      hoverAnimationRuntime: createHoverAnimationRuntime(),
      updateHoverEffects: (centerWorldPosition, elapsed) => {
        node.getWorldPosition(worldPosition);
        lightPosition.copy(centerWorldPosition).lerp(worldPosition, HOVER_LIGHT_RADIAL_T);
        node.worldToLocal(lightPosition);
        hoverPointLight.position.copy(lightPosition);

        const animationProgress = updateNodeHoverAnimation(node, elapsed);
        const animationPulse = Math.sin(Math.PI * animationProgress);
        const isSpecialEffect = node.userData.id === WOOD_NODE_ID || node.userData.id === FIRE_NODE_ID;
        node.userData.targetScale = 1 + (isSpecialEffect ? 0.035 : HOVER_SCALE_TARGET - 1) * animationPulse;
        node.userData.targetHoverLightIntensity = node.userData.id === WOOD_NODE_ID
          ? WOOD_NODE_HOVER_LIGHT_INTENSITY_TARGET * animationPulse
          : node.userData.id === FIRE_NODE_ID ? 0 : HOVER_LIGHT_INTENSITY_TARGET * animationPulse;
        scaleTarget.setScalar(node.userData.baseScale * node.userData.targetScale);
        node.scale.lerp(scaleTarget, HOVER_SCALE_LERP);

        node.userData.currentHoverLightIntensity = THREE.MathUtils.lerp(
          node.userData.currentHoverLightIntensity,
          node.userData.targetHoverLightIntensity,
          HOVER_LIGHT_INTENSITY_LERP
        );
        hoverPointLight.intensity = node.userData.currentHoverLightIntensity;
        hoverPointLight.visible = hoverPointLight.intensity > 0.01;

        const hoverBlend = HOVER_LIGHT_INTENSITY_TARGET
          ? THREE.MathUtils.clamp(hoverPointLight.intensity / HOVER_LIGHT_INTENSITY_TARGET, 0, 1)
          : 0;

        node.material.color.set(node.userData.baseColor).lerp(new THREE.Color(node.userData.hoverColor), hoverBlend);
        node.material.emissive.set(node.userData.baseEmissive).lerp(new THREE.Color(node.userData.hoverEmissive), hoverBlend);
        node.material.emissiveIntensity = THREE.MathUtils.lerp(0.45, 0.95, hoverBlend);

        if (node.userData.woodTreeEffectRuntime) {
          applyWoodTreeActivation(node.userData.woodTreeEffectRuntime, elapsed, node.userData.hoverAnimationRuntime.state === 'playing' && !prefersReducedMotion);
        }
        if (node.userData.fireSparkRuntime) {
          updateFireSparkBurst(node.userData.fireSparkRuntime, elapsed);
        }
      }
    };

    if (item.id === WOOD_NODE_ID) {
      hoverPointLight.color.set(WOOD_NODE_HOVER_LIGHT_COLOR);
      try {
        node.userData.woodTreeEffectRuntime = createWoodTreeEffectRuntime();
      } catch (error) {
        console.warn('[orbitNodes] Failed to initialize wood tree effect runtime for AI Guide node.', error);
      }
    }
    if (item.id === FIRE_NODE_ID) {
      try {
        node.userData.fireSparkRuntime = createFireSparkRuntime();
        initializeFireSparkSystem(node, node.userData.fireSparkRuntime);
      } catch (error) {
        console.warn('[orbitNodes] Failed to initialize fire spark runtime for Creative AI node.', error);
      }
    }
    nodes.push(node);
    group.add(node);

    void attachNodeModel(node, item, assetManager);
  });

  group.userData.getCenterWorldPosition = () => group.getWorldPosition(centerPosition);

  return { group, nodes };
}

export function updateOrbitNodes(nodes, elapsed, centerWorldPosition = new THREE.Vector3()) {
  nodes.forEach((node, index) => {
    const angle = node.userData.orbitAngle + elapsed * 0.14;
    const wobble = Math.sin(elapsed * 0.9 + index * 1.8) * 0.08;

    node.position.x = Math.cos(angle) * node.userData.orbitRadius;
    node.position.z = Math.sin(angle) * node.userData.orbitRadius;
    node.position.y = node.userData.yOffset + wobble;
    node.userData.updateHoverEffects(centerWorldPosition, elapsed);
  });
}

export function triggerNodeHoverAnimation(node) {
  const runtime = node?.userData?.hoverAnimationRuntime;
  if (!runtime || runtime.state === 'playing') return false;
  runtime.state = 'playing';
  runtime.startedAt = null;
  runtime.progress = 0;
  return true;
}

export function setNodeHoverState(node, isHovered) {
  if (!node?.userData) return;
  // Cursor/label presence is intentionally separate from the one-shot animation lifecycle.
  node.userData.isHovered = isHovered;
}
