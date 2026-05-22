import * as THREE from '../vendor/three.js';

const VENDORED_GLTF_LOADER_PATH = '../../vendor/three/examples/jsm/loaders/GLTFLoader.js';
const NODE_MODEL_TARGET_DIMENSION = 0.6;
const HOVER_SCALE_TARGET = 1.06;
const HOVER_SCALE_LERP = 0.08;
const HOVER_LIGHT_INTENSITY_TARGET = 2.8;
const HOVER_LIGHT_INTENSITY_LERP = 0.08;
const HOVER_LIGHT_DISTANCE = 5.5;
const HOVER_LIGHT_DECAY = 2;
const HOVER_LIGHT_RADIAL_T = 0.7;
const WOOD_NODE_ID = 'ai-guide';
const FIRE_NODE_ID = 'creative-ai';
const WOOD_NODE_HOVER_LIGHT_COLOR = '#cbff74';
const WOOD_NODE_HOVER_LIGHT_INTENSITY_TARGET = 3.3;
const FIRE_NODE_HOVER_LIGHT_COLOR = '#ff9f4f';
const FIRE_NODE_HOVER_LIGHT_INTENSITY_TARGET = 3.15;
const FIRE_EFFECT_FADE_IN_DURATION = 0.24;
const FIRE_EFFECT_FADE_OUT_DURATION = 0.2;
const FIRE_SPARK_COUNT = 100;
const FIRE_SPIRAL_HEIGHT = 1.35;
const FIRE_SPIRAL_CENTER_Y = 0.02;
const FIRE_SPIRAL_RADIUS_MIN = 0.08;
const FIRE_SPIRAL_RADIUS_MAX = 0.34;
const FIRE_SPARK_SIZE_MIN = 0.034;
const FIRE_SPARK_SIZE_MAX = 0.072;

const WOOD_TREE_EFFECT_MODEL_PATH = '/glb/glyph_1-tree.glb';
const WOOD_TREE_EFFECT_FALLBACK_MODEL_PATH = '/glb/glyph_1.glb';
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

function createFireEffectRuntime() {
  return {
    group: null,
    lowerEmber: null,
    upperEmber: null,
    sparkMesh: null,
    sparkMaterial: null,
    sparkParams: [],
    activation: 0,
    targetActivation: 0,
    initialized: false
  };
}

function createSoftGlowSpriteMaterial(color = '#ff9b4d', opacity = 0.5) {
  return new THREE.SpriteMaterial({
    color: new THREE.Color(color),
    transparent: true,
    opacity,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    depthTest: true
  });
}

function initializeFireEffect(node, runtime) {
  if (!runtime || runtime.initialized) return;

  const fireGroup = new THREE.Group();
  fireGroup.visible = false;
  fireGroup.userData.isNonInteractiveEffect = true;

  const lowerEmber = new THREE.Sprite(createSoftGlowSpriteMaterial('#ff8c3a', 0));
  lowerEmber.scale.setScalar(0.9);
  lowerEmber.position.set(0, -0.2, 0);
  lowerEmber.renderOrder = 3;

  const upperEmber = new THREE.Sprite(createSoftGlowSpriteMaterial('#ffc16a', 0));
  upperEmber.scale.setScalar(0.58);
  upperEmber.position.set(0, FIRE_SPIRAL_CENTER_Y + FIRE_SPIRAL_HEIGHT * 0.8, 0);
  upperEmber.renderOrder = 4;

  const sparkGeometry = new THREE.PlaneGeometry(1, 1);
  const sparkMaterial = new THREE.MeshBasicMaterial({
    color: '#ffad62',
    transparent: true,
    opacity: 0,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    depthTest: true
  });
  const sparkMesh = new THREE.InstancedMesh(sparkGeometry, sparkMaterial, FIRE_SPARK_COUNT);
  sparkMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  sparkMesh.frustumCulled = false;
  sparkMesh.renderOrder = 5;
  sparkMesh.userData.isNonInteractiveEffect = true;

  const temp = new THREE.Object3D();
  const sparkParams = [];
  for (let i = 0; i < FIRE_SPARK_COUNT; i += 1) {
    sparkParams.push({
      angleOffset: Math.random() * Math.PI * 2,
      angularSpeed: THREE.MathUtils.lerp(4.3, 8.8, Math.random()),
      riseSpeed: THREE.MathUtils.lerp(0.72, 1.25, Math.random()),
      radiusBase: THREE.MathUtils.lerp(FIRE_SPIRAL_RADIUS_MIN, FIRE_SPIRAL_RADIUS_MAX, Math.random()),
      radiusVariation: THREE.MathUtils.lerp(0.03, 0.11, Math.random()),
      phaseOffset: Math.random(),
      pulsePhase: Math.random() * Math.PI * 2,
      pulseSpeed: THREE.MathUtils.lerp(7.5, 13.5, Math.random()),
      pulseAmplitude: THREE.MathUtils.lerp(0.2, 0.5, Math.random()),
      pulseBase: THREE.MathUtils.lerp(0.24, 0.46, Math.random()),
      sizeBase: THREE.MathUtils.lerp(FIRE_SPARK_SIZE_MIN, FIRE_SPARK_SIZE_MAX, Math.random())
    });

    temp.position.set(0, -10, 0);
    temp.scale.setScalar(0.0001);
    temp.rotation.set(0, 0, 0);
    temp.updateMatrix();
    sparkMesh.setMatrixAt(i, temp.matrix);
  }
  sparkMesh.instanceMatrix.needsUpdate = true;

  [lowerEmber, upperEmber, sparkMesh].forEach((object) => {
    object.traverse?.((child) => {
      if (!child.isMesh && !child.isSprite) return;
      child.raycast = () => null;
    });
    object.raycast = () => null;
  });

  fireGroup.add(lowerEmber);
  fireGroup.add(upperEmber);
  fireGroup.add(sparkMesh);
  node.add(fireGroup);

  runtime.group = fireGroup;
  runtime.lowerEmber = lowerEmber;
  runtime.upperEmber = upperEmber;
  runtime.sparkMesh = sparkMesh;
  runtime.sparkMaterial = sparkMaterial;
  runtime.sparkParams = sparkParams;
  runtime.initialized = true;
}

function applyFireActivation(runtime, elapsed) {
  if (!runtime?.initialized) return;
  const fadeDuration = runtime.targetActivation > runtime.activation
    ? FIRE_EFFECT_FADE_IN_DURATION
    : FIRE_EFFECT_FADE_OUT_DURATION;
  const lerp = 1 / Math.max(1, 60 * fadeDuration);
  runtime.activation = THREE.MathUtils.lerp(runtime.activation, runtime.targetActivation, lerp);
  if (Math.abs(runtime.activation - runtime.targetActivation) < 0.001) runtime.activation = runtime.targetActivation;

  const activation = THREE.MathUtils.clamp(runtime.activation, 0, 1);
  const active = activation > 0.001;
  runtime.group.visible = active;
  if (!active) return;

  const activationEase = THREE.MathUtils.smoothstep(activation, 0, 1);
  const pulseHeavy = 0.88 + Math.sin(elapsed * 2.1) * 0.12;
  const pulseUpper = 0.92 + Math.sin(elapsed * 3.4 + 1.2) * 0.16;

  runtime.lowerEmber.material.opacity = 0.28 * activationEase * pulseHeavy;
  runtime.lowerEmber.scale.setScalar(0.84 + activationEase * 0.22 + pulseHeavy * 0.06);

  runtime.upperEmber.material.opacity = 0.34 * activationEase * pulseUpper;
  runtime.upperEmber.scale.setScalar(0.46 + activationEase * 0.2 + pulseUpper * 0.08);

  runtime.sparkMaterial.opacity = 0.22 * activationEase;
  const temp = new THREE.Object3D();
  runtime.sparkParams.forEach((spark, index) => {
    const progress = (elapsed * spark.riseSpeed + spark.phaseOffset) % 1;
    const height = FIRE_SPIRAL_CENTER_Y + progress * FIRE_SPIRAL_HEIGHT;
    const swirl = elapsed * spark.angularSpeed + spark.angleOffset + progress * Math.PI * 5.6;
    const radiusMod = Math.sin(elapsed * 1.8 + index * 0.31) * spark.radiusVariation;
    const taper = 1 - Math.pow(progress - 0.5, 2) * 1.8;
    const radius = Math.max(0.04, spark.radiusBase + radiusMod) * THREE.MathUtils.clamp(taper, 0.45, 1);

    const x = Math.cos(swirl) * radius;
    const z = Math.sin(swirl) * radius;
    const pulse = spark.pulseBase + Math.sin(elapsed * spark.pulseSpeed + spark.pulsePhase) * spark.pulseAmplitude;
    const intensity = THREE.MathUtils.clamp(pulse, 0.08, 1);
    const size = spark.sizeBase * (0.72 + intensity * 0.9) * (0.68 + activationEase * 0.5);

    temp.position.set(x, height, z);
    temp.scale.setScalar(size);
    temp.updateMatrix();
    runtime.sparkMesh.setMatrixAt(index, temp.matrix);
  });
  runtime.sparkMesh.instanceMatrix.needsUpdate = true;
}

function applyWoodTreeActivation(runtime, elapsed) {
  if (!runtime?.treeGroup || !runtime.treeMaterials.length) return;

  if (runtime.revealTarget > 0.5) {
    runtime.phase = runtime.revealProgress >= 0.999 ? 'activeOrbit' : 'revealing';
  } else if (runtime.revealProgress > 0.001) {
    runtime.phase = 'fadingOut';
  } else {
    runtime.phase = 'inactive';
  }

  const revealDuration = runtime.revealTarget > runtime.revealProgress
    ? WOOD_TREE_REVEAL_DURATION_IN
    : WOOD_TREE_REVEAL_DURATION_OUT;
  const revealLerp = 1 / Math.max(1, 60 * revealDuration);
  runtime.revealProgress = THREE.MathUtils.lerp(runtime.revealProgress, runtime.revealTarget, revealLerp);
  if (Math.abs(runtime.revealProgress - runtime.revealTarget) < 0.0005) runtime.revealProgress = runtime.revealTarget;
  const easedProgress = THREE.MathUtils.smoothstep(runtime.revealProgress, 0, 1);
  const revealRadius = THREE.MathUtils.lerp(WOOD_TREE_REVEAL_RADIUS_MIN, WOOD_TREE_REVEAL_RADIUS_MAX, easedProgress);

  const span = Math.max(0.0001, runtime.maxY - runtime.minY);
  const isActiveOrbit = runtime.phase === 'activeOrbit';
  const pulse = runtime.revealTarget > 0.5
    ? 1 + Math.sin(elapsed * WOOD_TREE_PULSE_SPEED + runtime.pulsePhase)
      * (isActiveOrbit ? WOOD_TREE_POST_REVEAL_PULSE_INTENSITY : WOOD_TREE_PULSE_INTENSITY)
    : 1;

  runtime.shaderEntries.forEach((entry) => {
    entry.uniforms.uRevealCenter.value.copy(runtime.revealCenterLocal);
    entry.uniforms.uRevealRadius.value = revealRadius;
    entry.uniforms.uRevealSoftness.value = WOOD_TREE_REVEAL_SOFTNESS;
  });

  runtime.treeMaterials.forEach((entry) => {
    const yRatio = THREE.MathUtils.clamp((entry.centerY - runtime.minY) / span, 0, 1);
    const localYReveal = THREE.MathUtils.smoothstep(yRatio, -0.16 + easedProgress * 0.9, 0.2 + easedProgress * 1.08);
    const fill = THREE.MathUtils.clamp(localYReveal, 0, 1);
    const activeColor = WOOD_TREE_EMISSIVE_ACTIVE_BOTTOM.clone().lerp(WOOD_TREE_EMISSIVE_ACTIVE_TOP, yRatio);

    entry.material.color.copy(WOOD_TREE_BASE_COLOR);
    entry.material.emissive.copy(WOOD_TREE_EMISSIVE_BASE).lerp(activeColor, fill);
    const activeRevealIntensity = fill > 0.001
      ? (0.04 + fill * WOOD_TREE_EMISSIVE_INTENSITY_ACTIVE * WOOD_TREE_GLOW_INTENSITY)
      : 0;
    const postRevealGlow = runtime.revealTarget > 0.5
      ? WOOD_TREE_POST_REVEAL_GLOW_INTENSITY * (0.5 + 0.5 * yRatio)
      : 0;

    entry.material.emissiveIntensity = Math.max(activeRevealIntensity, postRevealGlow) * pulse;
  });

  runtime.treeGroup.visible = runtime.revealProgress > 0.001;

  if (runtime.treePointLight) {
    const baseLightIntensity = runtime.revealTarget > 0.5
      ? WOOD_TREE_POINT_LIGHT_INTENSITY
      : easedProgress * WOOD_TREE_POINT_LIGHT_INTENSITY;
    runtime.treePointLight.intensity = THREE.MathUtils.clamp(baseLightIntensity * pulse, 0, WOOD_TREE_POINT_LIGHT_INTENSITY * 1.25);

    if (WOOD_TREE_ORBIT_ENABLED && isActiveOrbit && runtime.orbitRadius > 0.0001) {
      const delta = runtime.lastElapsed === null ? 0 : Math.max(0, elapsed - runtime.lastElapsed);
      runtime.orbitAngle += WOOD_TREE_ORBIT_SPEED * delta;
      runtime.treePointLight.position.set(
        runtime.orbitCenter.x + Math.cos(runtime.orbitAngle) * runtime.orbitRadius,
        runtime.orbitCenter.y + runtime.orbitHeightOffset + Math.sin(elapsed * WOOD_TREE_ORBIT_BOBBING_SPEED + runtime.pulsePhase) * WOOD_TREE_ORBIT_BOBBING_AMPLITUDE,
        runtime.orbitCenter.z + Math.sin(runtime.orbitAngle) * runtime.orbitRadius
      );
    }

    runtime.treePointLight.visible = runtime.treePointLight.intensity > 0.01;
    runtime.lastElapsed = elapsed;
  }
}


async function resolveGLTFLoader() {
  try {
    const module = await import(VENDORED_GLTF_LOADER_PATH);
    return module.GLTFLoader;
  } catch (error) {
    console.warn(
      `[orbitNodes] GLTFLoader import failed for node model visuals at ${VENDORED_GLTF_LOADER_PATH}. Sphere fallback retained.`,
      error
    );
    return null;
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

async function attachNodeModel(node, item) {
  if (!item.modelPath) return;

  const GLTFLoader = await resolveGLTFLoader();
  if (!GLTFLoader) return;

  const loader = new GLTFLoader();
  loader.load(
    item.modelPath,
    (gltf) => {
      const model = gltf.scene;
      fitModelToNode(model);
      node.add(model);
      node.material.visible = false;
      node.userData.visualModel = model;

      if (item.id === WOOD_NODE_ID && node.userData.woodTreeEffectRuntime) {
        const treeLoader = new GLTFLoader();
        const attachTreeEffectModel = (path) => treeLoader.load(
          path,
          (treeGltf) => {
            const treeModel = treeGltf.scene;
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
            console.info(`[orbitNodes] Loaded wood tree effect model for ${item.id} from ${path}.`);
          },
          undefined,
          (error) => {
            if (path !== WOOD_TREE_EFFECT_FALLBACK_MODEL_PATH) {
              console.warn(`[orbitNodes] Failed to load wood tree effect model for ${item.id} at ${path}. Trying fallback ${WOOD_TREE_EFFECT_FALLBACK_MODEL_PATH}.`, error);
              attachTreeEffectModel(WOOD_TREE_EFFECT_FALLBACK_MODEL_PATH);
              return;
            }

            console.warn(`[orbitNodes] Failed to load fallback wood tree effect model for ${item.id}. Wood tree visual effect disabled safely.`, error);
          }
        );

        attachTreeEffectModel(WOOD_TREE_EFFECT_MODEL_PATH);
      }

      console.info(`[orbitNodes] Loaded node model for ${item.id} from ${item.modelPath}.`);
    },
    undefined,
    (error) => {
      console.warn(
        `[orbitNodes] Failed to load node model for ${item.id} at ${item.modelPath}. Sphere fallback retained.`,
        error
      );
    }
  );
}

export function createOrbitNodes(nodeContent) {
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
      updateHoverEffects: (centerWorldPosition, elapsed) => {
        node.getWorldPosition(worldPosition);
        lightPosition.copy(centerWorldPosition).lerp(worldPosition, HOVER_LIGHT_RADIAL_T);
        node.worldToLocal(lightPosition);
        hoverPointLight.position.copy(lightPosition);

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
          applyWoodTreeActivation(node.userData.woodTreeEffectRuntime, elapsed);
        }
        if (node.userData.fireEffectRuntime) {
          applyFireActivation(node.userData.fireEffectRuntime, elapsed);
        }
      }
    };

    if (item.id === WOOD_NODE_ID) {
      try {
        node.userData.woodTreeEffectRuntime = createWoodTreeEffectRuntime();
      } catch (error) {
        console.warn('[orbitNodes] Failed to initialize wood tree effect runtime for AI Guide node.', error);
      }
    }
    if (item.id === FIRE_NODE_ID) {
      node.userData.fireEffectRuntime = createFireEffectRuntime();
      initializeFireEffect(node, node.userData.fireEffectRuntime);
    }

    nodes.push(node);
    group.add(node);

    attachNodeModel(node, item);
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

export function setNodeHoverState(node, isHovered) {
  if (isHovered) {
    node.userData.targetScale = HOVER_SCALE_TARGET;
    if (node.userData.id === WOOD_NODE_ID) {
      node.userData.targetHoverLightIntensity = WOOD_NODE_HOVER_LIGHT_INTENSITY_TARGET;
      node.userData.hoverPointLight.color.set(WOOD_NODE_HOVER_LIGHT_COLOR);
    } else if (node.userData.id === FIRE_NODE_ID) {
      node.userData.targetHoverLightIntensity = FIRE_NODE_HOVER_LIGHT_INTENSITY_TARGET;
      node.userData.hoverPointLight.color.set(FIRE_NODE_HOVER_LIGHT_COLOR);
    } else {
      node.userData.targetHoverLightIntensity = HOVER_LIGHT_INTENSITY_TARGET;
      node.userData.hoverPointLight.color.copy(node.material.color);
    }
    if (node.userData.woodTreeEffectRuntime) {
      node.userData.woodTreeEffectRuntime.revealTarget = 1;
    }
    if (node.userData.fireEffectRuntime) {
      node.userData.fireEffectRuntime.targetActivation = 1;
    }
    return;
  }

  node.userData.targetScale = 1;
  node.userData.targetHoverLightIntensity = 0;
  if (node.userData.woodTreeEffectRuntime) {
    node.userData.woodTreeEffectRuntime.revealTarget = 0;
    node.userData.woodTreeEffectRuntime.lastElapsed = null;
  }
  if (node.userData.fireEffectRuntime) {
    node.userData.fireEffectRuntime.targetActivation = 0;
  }
}
