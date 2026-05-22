import './styles/main.css';
import * as THREE from './vendor/three.js';
import { portfolioNodes } from './content/portfolioNodes.js';
import { createScene } from './scene/createScene.js';
import { addLights } from './scene/lights.js';
import { createCentralObject } from './scene/centralObject.js';
import { createParticles } from './scene/particles.js';
import { createOrbitNodes, setNodeHoverState, updateOrbitNodes } from './scene/orbitNodes.js';
import { pickNode } from './scene/raycaster.js';
import { updateCameraDrift } from './scene/cameraRig.js';
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
scene.add(createCentralObject());
scene.add(createParticles());

const { group: orbitGroup, nodes } = createOrbitNodes(portfolioNodes);
scene.add(orbitGroup);

const overlay = createOverlay();
const hoverLabel = createHoverLabel();

let hoveredNode = null;

window.addEventListener('pointermove', (event) => {
  const hit = pickNode(event, canvas, camera, nodes);

  if (hoveredNode && hoveredNode !== hit) {
    setNodeHoverState(hoveredNode, false);
    hoveredNode = null;
    hoverLabel.hide();
    document.body.style.cursor = 'default';
  }

  if (hit) {
    if (hoveredNode !== hit) {
      hoveredNode = hit;
      setNodeHoverState(hoveredNode, true);
    }
    hoverLabel.show(hit.userData, event.clientX, event.clientY);
    document.body.style.cursor = 'pointer';
  }
});

window.addEventListener('click', (event) => {
  const hit = pickNode(event, canvas, camera, nodes);
  if (hit) {
    overlay.open(hit.userData);
  }
});

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

const clock = new THREE.Clock();

function tick() {
  const elapsed = clock.getElapsedTime();
  updateOrbitNodes(nodes, elapsed);
  updateCameraDrift(camera, elapsed);
  renderer.render(scene, camera);
  requestAnimationFrame(tick);
}

tick();
