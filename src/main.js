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
    safeRadius: 3.5,
    shellInnerRadius: 5.0,
    shellOuterRadius: 13.0,
    dust: {
      enabled: true,
      count: 500,
      idleOpacity: 0.06,
      rotationSpeed: 0.015,
      pointSize: 0.025
    }
  }
};

const atmosphere = createBackgroundAtmosphere(sceneRuntimeConfig.backgroundAtmosphere);
if (atmosphere.object3d) scene.add(atmosphere.object3d);

void loadMonkeyModel({ scene, fallbackObject: centralPlaceholder });

const { group: orbitGroup, nodes } = createOrbitNodes(portfolioNodes);
scene.add(orbitGroup);

const overlay = createOverlay();
const hoverLabel = createHoverLabel();

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
  renderer.render(scene, camera);
  requestAnimationFrame(tick);
}

tick();
