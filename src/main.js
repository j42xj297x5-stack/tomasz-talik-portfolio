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
  backgroundAtmosphere: {
    enabled: true,
    debugVisible: false,
    showShellHelpers: false,
    showAtmosphereLogs: false,
    debugBlendingMode: 'normal',
    debugIgnoreFog: true,
    safeRadius: 4.0,
    shellInnerRadius: 6.1,
    shellOuterRadius: 14.6,
    stoneRelics: { enabled: true, count: 18, models: ['/glb/stone_01.glb','/glb/stone_02.glb','/glb/stone_03.glb','/glb/stone_04.glb','/glb/stone_05.glb','/glb/stone_06.glb'], safeRadius: 3.5, shellInnerRadius: 5.2, shellOuterRadius: 11.0, minScale: 0.035, maxScale: 0.12, rotationSpeedMin: 0.003, rotationSpeedMax: 0.018, orbitSpeed: 0.003, opacity: 0.85, debugVisible: false },
    shellRelics: {
      enabled: true,
      count: 35,
      models: ['/glb/shell_01.glb','/glb/shell_02.glb','/glb/shell_03.glb','/glb/shell_04.glb','/glb/shell_05.glb','/glb/shell_06.glb'],
      minScale: 2,
      maxScale: 5,
      shellInnerRadius: 3,
      shellOuterRadius: 8,
      rotationSpeedMin: 0.005,
      rotationSpeedMax: 0.08,
      orbitSpeed: 0.03,
      opacity: 0.85,
      debugVisible: false,
      colorPalette: ['#d9a441','#4db6ac','#6ec6ff','#6bcf8e','#9c7bff','#f0a6a6']
    },
    dust: {
      enabled: true,
      count: 2650,
      idleOpacity: 0.85,
      rotationSpeed: 0.02,
      pointSize: 0.07,
      sizeAttenuation: true,
      depthTest: true
    }
  }
};

const atmosphere = createBackgroundAtmosphere(sceneRuntimeConfig.backgroundAtmosphere);
scene.add(atmosphere.object3d);

void loadMonkeyModel({ scene, fallbackObject: centralPlaceholder });

const { group: orbitGroup, nodes } = createOrbitNodes(portfolioNodes);
scene.add(orbitGroup);

const overlay = createOverlay();
const hoverLabel = createHoverLabel();

const optionsPanel = createOptionsPanel({
  runtimeState: sceneRuntimeConfig,
  onChange: ({ type }) => {
    atmosphere.applySettings(sceneRuntimeConfig.backgroundAtmosphere, type);
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
  if (sceneRuntimeConfig.backgroundAtmosphere.debugVisible && elapsed < 0.25) {
    console.info('[backgroundAtmosphere][debug] tick/update active', { delta, elapsed });
  }
  renderer.render(scene, camera);
  requestAnimationFrame(tick);
}

tick();
