import './styles/main.css';
import * as THREE from './vendor/three.js';
import { portfolioNodes } from './content/portfolioNodes.js';
import { createScene } from './scene/createScene.js';
import { addLights } from './scene/lights.js';
import { createCentralObject } from './scene/centralObject.js';
import { createBackgroundAtmosphere } from './scene/atmosphere.js';
import { loadMonkeyModel } from './scene/monkeyModel.js';
import { createOrbitNodes, setNodeHoverState, updateOrbitNodes } from './scene/orbitNodes.js';
import { pickNode } from './scene/raycaster.js';
import { createCameraRig } from './scene/cameraRig.js';
import { createOverlay } from './ui/overlay.js';
import { createHoverLabel } from './ui/hoverLabel.js';
import { createOptionsPanel } from './ui/optionsPanel.js';
import { createSunCycle, SUN_CYCLE_DEFAULTS } from './scene/sunCycle.js';
import { createMoonCycle, MOON_CYCLE_DEFAULTS } from './scene/moonCycle.js';
import { createAtmosphereProgression } from './scene/atmosphere/atmosphereProgression.js';
import { createGalaxySpritesLayer, GALAXY_SPRITES_DEFAULTS } from './scene/galaxySprites.js';

const app = document.querySelector('#app');
if (!app) throw new Error('Missing #app mount element.');

app.innerHTML = `
  <main class="runtime-shell">
    <canvas id="scene-canvas" aria-label="Interactive AI portfolio MVP scene"></canvas>
    <p class="mobile-notice">Desktop-first MVP scene. Mobile interaction fallback is active.</p>
  </main>
`;

const canvas = document.querySelector('#scene-canvas');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);

const scene = createScene();
const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.set(0, 1.8, 6);

addLights(scene);
const centralPlaceholder = createCentralObject();
scene.add(centralPlaceholder);

const sceneRuntimeConfig = {
  sunCycle: {
    ...SUN_CYCLE_DEFAULTS
  },
  moonCycle: {
    ...MOON_CYCLE_DEFAULTS
  },
  galaxySprites: {
    ...GALAXY_SPRITES_DEFAULTS
  },
  backgroundAtmosphere: {
    enabled: true,
    debugVisible: false,
    showShellHelpers: false,
    showAtmosphereLogs: false,
    debugBlendingMode: 'normal',
    debugIgnoreFog: true,
    safeRadius: 5,
    shellInnerRadius: 8,
    shellOuterRadius: 20,
    stoneRelics: { enabled: true, count: 80, models: ['/glb/stone_01.glb','/glb/stone_02.glb','/glb/stone_03.glb','/glb/stone_04.glb','/glb/stone_05.glb','/glb/stone_06.glb'], safeRadius: 3.5, shellInnerRadius: 4.7, shellOuterRadius: 10.3, minScale: 0.5, maxScale: 1, rotationSpeedMin: 0.003, rotationSpeedMax: 0.018, orbitSpeed: 0.003, opacity: 1, debugVisible: false },
    shellRelics: {
      enabled: true,
      count: 100,
      models: ['/glb/shell_01.glb','/glb/shell_02.glb','/glb/shell_03.glb','/glb/shell_04.glb','/glb/shell_05.glb','/glb/shell_06.glb'],
      minScale: 0.3,
      maxScale: 0.7,
      shellInnerRadius: 10,
      shellOuterRadius: 13,
      rotationSpeedMin: 0.024,
      rotationSpeedMax: 0.373,
      orbitSpeed: 0.012,
      opacity: 1,
      debugVisible: false,
      colorPalette: ['#d9a441','#4db6ac','#6ec6ff','#6bcf8e','#9c7bff','#f0a6a6']
    },
    smallGlyphRelics: {
      enabled: true,
      count: 100,
      models: ['/glb/small_glyph_01.glb','/glb/small_glyph_02.glb','/glb/small_glyph_03.glb','/glb/small_glyph_04.glb','/glb/small_glyph_05.glb','/glb/small_glyph_06.glb'],
      minScale: 0.1,
      maxScale: 0.3,
      shellInnerRadius: 5,
      shellOuterRadius: 10,
      rotationSpeedMin: 0.01,
      rotationSpeedMax: 0.028,
      orbitSpeed: 0.005,
      opacity: 0.53,
      debugVisible: false
    },
    dust: {
      enabled: true,
      count: 6000,
      idleOpacity: 1,
      rotationSpeed: 0.018,
      pointSize: 0.055,
      color: '#cfe2ff',
      sizeAttenuation: true,
      depthTest: true
    }
  }
};

const atmosphere = createBackgroundAtmosphere(sceneRuntimeConfig.backgroundAtmosphere);
scene.add(atmosphere.object3d);
const sunCycle = createSunCycle(sceneRuntimeConfig.sunCycle);
scene.add(sunCycle.object3d);
const moonCycle = createMoonCycle(sceneRuntimeConfig.moonCycle);
scene.add(moonCycle.object3d);
const galaxyLayer = createGalaxySpritesLayer(sceneRuntimeConfig.galaxySprites);
scene.add(galaxyLayer.group);

void loadMonkeyModel({ scene, fallbackObject: centralPlaceholder });

const { group: orbitGroup, nodes } = createOrbitNodes(portfolioNodes);
scene.add(orbitGroup);
const atmosphereProgression = createAtmosphereProgression({ gateIds: portfolioNodes.map((node) => node.id) });

const overlay = createOverlay({
  onClose: () => {
    atmosphereProgression.handleOverlayClosed();
  }
});
const hoverLabel = createHoverLabel();

const optionsPanel = createOptionsPanel({
  runtimeState: sceneRuntimeConfig,
  atmosphereProgression,
  gateNodes: portfolioNodes,
  onChange: ({ type }) => {
    atmosphere.applySettings(sceneRuntimeConfig.backgroundAtmosphere, type);
    sunCycle.setOptions(sceneRuntimeConfig.sunCycle);
    moonCycle.setOptions(sceneRuntimeConfig.moonCycle);
    if (type === 'galaxy-sprites-rebuild' || type === 'reset-all' || type === 'rebuild') {
      galaxyLayer.rebuild(sceneRuntimeConfig.galaxySprites);
    } else {
      galaxyLayer.applyRuntimeOptions(sceneRuntimeConfig.galaxySprites);
    }
  },
  onResetAtmosphere: () => {
    atmosphere.applySettings(sceneRuntimeConfig.backgroundAtmosphere, 'rebuild');
  }
});

let hoveredNode = null;

function syncHoverState(nextHoveredNode, event = null) {
  if (hoveredNode && hoveredNode !== nextHoveredNode) {
    setNodeHoverState(hoveredNode, false);
  }

  hoveredNode = nextHoveredNode;

  if (hoveredNode) {
    setNodeHoverState(hoveredNode, true);
    if (event) {
      hoverLabel.show(hoveredNode.userData, event.clientX, event.clientY);
    }
  } else {
    hoverLabel.hide();
  }

  document.body.style.cursor = hoveredNode ? 'pointer' : 'default';
}

const cameraRig = createCameraRig();

window.addEventListener('pointermove', (event) => {
  cameraRig.onPointerMove(event);
  const hit = pickNode(event, canvas, camera, nodes);
  syncHoverState(hit, event);
});

window.addEventListener('click', (event) => {
  const hit = pickNode(event, canvas, camera, nodes);
  if (hit) {
    atmosphereProgression.prepareGateProgression(hit.userData?.id);
    overlay.open(hit.userData);
  }
});

window.addEventListener('pointerleave', () => {
  cameraRig.onPointerLeave();
  syncHoverState(null);
});

canvas.addEventListener('pointerleave', () => {
  syncHoverState(null);
});

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

const clock = new THREE.Clock();
const orbitCenterWorldPosition = new THREE.Vector3();

function tick() {
  const delta = clock.getDelta();
  const elapsed = clock.elapsedTime;
  updateOrbitNodes(nodes, elapsed, orbitGroup.getWorldPosition(orbitCenterWorldPosition));
  cameraRig.update(camera, elapsed);
  atmosphere.update(delta);
  atmosphereProgression.updateAtmosphereProgression(delta);
  const multipliers = atmosphereProgression.getProgressionMultipliers();
  atmosphere.setProgressionMultipliers(multipliers);
  sunCycle.setProgressionMultiplier(multipliers.sunMoon);
  moonCycle.setProgressionMultiplier(multipliers.sunMoon);
  sunCycle.update(delta);
  moonCycle.update(delta, sunCycle.getAngle());
  galaxyLayer.update(delta, elapsed, camera);
  if (sceneRuntimeConfig.backgroundAtmosphere.debugVisible && elapsed < 0.25) {
    console.info('[backgroundAtmosphere][debug] tick/update active', { delta, elapsed });
  }
  renderer.render(scene, camera);
  requestAnimationFrame(tick);
}

tick();
