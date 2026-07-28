import * as THREE from './vendor/three.js';
import { resolvePortfolioNodes } from './content/resolvePortfolioNodes.js';
import { createCentralObject } from './scene/centralObject.js';
import { addLights } from './scene/lights.js';
import { loadMonkeyModel } from './scene/monkeyModel.js';
import { createOrbitNodes } from './scene/orbitNodes.js';
import { createAssetManager } from './assets/assetManager.js';
import { createLoadingDiagnostics, preloadAssets } from './assets/preloadAssets.js';
import { ASSET_STAGES, getPreloadAssets, INITIAL_PRELOAD_GROUPS } from './assets/assetManifest.js';
import { loadExperienceVrSettings } from './config/experienceVrSettings.js';
import { orientPlayerRig } from './xr/playerRigOrientation.js';

const app = document.querySelector('#app');
if (!app) throw new Error('Missing #app mount element.');

const COPY = {
  pl: {
    title: 'Doświadczenie VR', loading: 'Przygotowywanie minimalnej sceny VR…', ready: 'Scena jest gotowa.',
    enter: 'Wejdź do VR', entering: 'Uruchamianie sesji…', exit: 'Zakończ VR', retry: 'Wejdź ponownie do VR',
    error: 'Nie udało się uruchomić sesji VR. Możesz spróbować ponownie.'
  },
  en: {
    title: 'Experience VR', loading: 'Preparing the minimal VR scene…', ready: 'The scene is ready.',
    enter: 'Enter VR', entering: 'Starting session…', exit: 'Exit VR', retry: 'Enter VR again',
    error: 'The VR session could not be started. You can try again.'
  }
};

const language = document.documentElement.lang === 'pl' ? 'pl' : 'en';
const copy = COPY[language];
app.innerHTML = `
  <main class="vr-runtime" aria-labelledby="vr-runtime-title">
    <canvas id="vr-scene-canvas" class="vr-runtime__canvas"></canvas>
    <section class="vr-runtime__controls">
      <p class="entry-shell__eyebrow">WebXR · Meta Quest 3S</p>
      <h1 id="vr-runtime-title" class="vr-runtime__title">${copy.title}</h1>
      <p class="vr-runtime__status" data-vr-status aria-live="polite">${copy.loading}</p>
      <button class="entry-choice entry-choice--primary" type="button" data-vr-enter disabled>${copy.enter}</button>
      <button class="entry-shell__back" type="button" data-vr-exit hidden>${copy.exit}</button>
    </section>
  </main>
`;

const canvas = app.querySelector('#vr-scene-canvas');
const status = app.querySelector('[data-vr-status]');
const enterButton = app.querySelector('[data-vr-enter]');
const exitButton = app.querySelector('[data-vr-exit]');
const loadedSettings = await loadExperienceVrSettings({ debug: new URLSearchParams(location.search).has('debug') });
const settings = loadedSettings.settings;
const renderer = new THREE.WebGLRenderer({ canvas, antialias: settings.renderer.antialias });
renderer.setPixelRatio(Math.min(devicePixelRatio || 1, settings.renderer.pixelRatioCap));
renderer.xr.enabled = true;

const scene = new THREE.Scene();
scene.background = new THREE.Color('#05070b');
const worldRoot = new THREE.Group();
worldRoot.name = 'VrWorldRoot';
worldRoot.scale.setScalar(settings.worldScale);
scene.add(worldRoot);
const camera = new THREE.PerspectiveCamera(55, 1, 0.1, 100);
const playerRig = new THREE.Group();
playerRig.name = 'VrPlayerRig';
playerRig.position.set(settings.spawn.position.x, settings.spawn.position.y, settings.spawn.position.z);
camera.position.set(0, 1.6, 0);
playerRig.add(camera);
scene.add(playerRig);
orientPlayerRig(playerRig, settings.spawn.lookAt);

addLights(scene);
const centralPlaceholder = createCentralObject();
worldRoot.add(centralPlaceholder);

const vrAssets = getPreloadAssets(INITIAL_PRELOAD_GROUPS)
  .filter(({ id }) => id === 'gltf-loader-module' || id === 'monkey-model' || id.startsWith('glyph-'))
  .map((asset) => ({ ...asset, critical: asset.id === 'gltf-loader-module' }));
const loadingDiagnostics = createLoadingDiagnostics(vrAssets);
const assetManager = createAssetManager({ diagnostics: loadingDiagnostics });
const unsubscribe = loadingDiagnostics.subscribe((snapshot) => {
  status.textContent = `${copy.loading} ${snapshot.completedAssets}/${snapshot.totalAssets}`;
});

await preloadAssets(vrAssets, {
  diagnostics: loadingDiagnostics,
  assetManager,
  concurrency: 2,
  stage: ASSET_STAGES.CRITICAL_INITIAL,
  markComplete: true
});
unsubscribe();
await loadMonkeyModel({ scene: worldRoot, fallbackObject: centralPlaceholder, assetManager });
const { group: glyphRing } = createOrbitNodes(resolvePortfolioNodes(language), { assetManager });
worldRoot.add(glyphRing);

function resize() {
  const width = canvas.clientWidth || innerWidth || 1;
  const height = canvas.clientHeight || innerHeight || 1;
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  renderer.setSize(width, height, false);
}
resize();
window.addEventListener('resize', resize);
renderer.render(scene, camera);

let activeSession = null;
let hasEnteredSession = false;

function renderFrame() {
  renderer.render(scene, camera);
}

function showReadyState({ ended = false } = {}) {
  status.textContent = copy.ready;
  enterButton.textContent = ended ? copy.retry : copy.enter;
  enterButton.disabled = false;
  exitButton.hidden = true;
}

function handleSessionEnd() {
  renderer.setAnimationLoop(null);
  activeSession = null;
  showReadyState({ ended: hasEnteredSession });
}

async function enterVr() {
  if (activeSession) return;
  orientPlayerRig(playerRig, settings.spawn.lookAt);
  enterButton.disabled = true;
  status.textContent = copy.entering;
  let requestedSession = null;
  try {
    requestedSession = await navigator.xr.requestSession('immersive-vr', { optionalFeatures: ['local-floor'] });
    let referenceSpaceType = settings.referenceSpaceType;
    if (referenceSpaceType === 'local-floor') {
      try { await requestedSession.requestReferenceSpace('local-floor'); }
      catch { referenceSpaceType = 'local'; }
    }
    renderer.xr.setReferenceSpaceType(referenceSpaceType);
    requestedSession.addEventListener('end', handleSessionEnd, { once: true });
    await renderer.xr.setSession(requestedSession);
    activeSession = requestedSession;
    hasEnteredSession = true;
    status.textContent = copy.ready;
    exitButton.hidden = false;
    renderer.setAnimationLoop(renderFrame);
  } catch (error) {
    console.warn('[experience-vr] Session start failed.', error);
    if (requestedSession && requestedSession !== activeSession) {
      try { await requestedSession.end(); } catch { /* Session may already be ending. */ }
    }
    activeSession = null;
    renderer.setAnimationLoop(null);
    status.textContent = copy.error;
    enterButton.disabled = false;
    exitButton.hidden = true;
  }
}

enterButton.addEventListener('click', enterVr);
exitButton.addEventListener('click', () => { void activeSession?.end(); });
showReadyState();
