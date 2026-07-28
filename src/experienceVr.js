import * as THREE from './vendor/three.js';
import { resolvePortfolioNodes } from './content/resolvePortfolioNodes.js';
import { createCentralObject } from './scene/centralObject.js';
import { addLights } from './scene/lights.js';
import { loadMonkeyModel } from './scene/monkeyModel.js';
import { createOrbitNodes } from './scene/orbitNodes.js';
import { createAssetManager } from './assets/assetManager.js';
import { createLoadingDiagnostics, preloadAssets } from './assets/preloadAssets.js';
import { ASSET_STAGES, getPreloadAssets, INITIAL_PRELOAD_GROUPS, DEFERRED_PRELOAD_GROUPS } from './assets/assetManifest.js';
import { loadExperienceVrSettings } from './config/experienceVrSettings.js';
import { orientPlayerRig } from './xr/playerRigOrientation.js';
import { createVrControllers } from './xr/createVrControllers.js';
import { createVrGlyphInteraction } from './xr/createVrGlyphInteraction.js';
import { createVrGlyphOrbit } from './xr/createVrGlyphOrbit.js';
import { createVrGlyphLights } from './xr/createVrGlyphLights.js';
import { createVrEntryTransition } from './xr/createVrEntryTransition.js';
import { createVrSpatialPlaque, resolveVrPlaqueContent } from './xr/createVrSpatialPlaque.js';
import { createVrGlyphPlaque } from './xr/createVrGlyphPlaque.js';

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
const vrControllers = createVrControllers({ renderer, playerRig, settings: settings.controllers });

addLights(scene);
const centralPlaceholder = createCentralObject();
worldRoot.add(centralPlaceholder);

const vrAssets = getPreloadAssets([...INITIAL_PRELOAD_GROUPS, ...DEFERRED_PRELOAD_GROUPS])
  .filter(({ id }) => id === 'gltf-loader-module' || id === 'monkey-model' || id.startsWith('glyph-') || id.startsWith('plaque-'))
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
const monkeyModel = await loadMonkeyModel({ scene: worldRoot, fallbackObject: centralPlaceholder, assetManager });
const { group: glyphRing, nodes } = createOrbitNodes(resolvePortfolioNodes(language), { assetManager });
worldRoot.add(glyphRing);
const entryDirection = new THREE.Vector3(settings.spawn.position.x, 0, settings.spawn.position.z).normalize();
const glyphOrbit = createVrGlyphOrbit({ nodes, settings: settings.glyphRing, entryDirection });
const glyphLights = createVrGlyphLights({ nodes });
const monkeyAnchor = monkeyModel ?? centralPlaceholder;
const spatialPlaque = createVrSpatialPlaque({ scene, camera, renderer, settings: settings.spatialPlaque, anchorObject: monkeyAnchor });
const plaqueAssets = new Map(nodes.map((node) => [node.userData.id, assetManager.cloneGltfScene(`plaque-${node.userData.id}`)]));
plaqueAssets.visuals = new Map(nodes.map((node) => [node.userData.id, node.userData.plaqueVisual]));
const glyphPlaque = createVrGlyphPlaque({ scene, camera, renderer, settings: settings.glyphPlaque, plaqueAssets });
let activatedEntryGlyph = null;
const entryTransition = createVrEntryTransition({
  playerRig,
  renderer,
  camera,
  settings: settings.entryTransition,
  ringCenter: new THREE.Vector3(),
  spawnPosition: settings.spawn.position,
  effectiveRingRadius: glyphOrbit.effectiveRadius,
  onComplete: () => {
    glyphPlaque.showForGlyph(activatedEntryGlyph);
    spatialPlaque.show(resolveVrPlaqueContent(activatedEntryGlyph?.userData));
  }
});
const glyphInteraction = createVrGlyphInteraction({
  controllers: vrControllers.controllers,
  nodes,
  onEntryGlyphActivated: () => {
    activatedEntryGlyph = glyphInteraction.activatedEntryGlyph;
    spatialPlaque.hide();
    glyphPlaque.hide();
    entryTransition.start();
  }
});

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
const clock = new THREE.Clock(false);

function renderFrame() {
  const delta = clock.getDelta();
  const entryReady = activatedEntryGlyph ? null : glyphOrbit.update(delta);
  glyphRing.updateMatrixWorld(true);
  glyphInteraction.update();
  glyphInteraction.setEntryReady(entryReady);
  glyphLights.update({
    hovered: glyphInteraction.hoveredGlyphs,
    entryReady,
    activated: activatedEntryGlyph
  });
  entryTransition.update(delta);
  spatialPlaque.update(delta);
  glyphPlaque.update(delta);
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
  clock.stop();
  activeSession = null;
  entryTransition.reset();
  spatialPlaque.reset();
  glyphPlaque.reset();
  playerRig.position.set(settings.spawn.position.x, settings.spawn.position.y, settings.spawn.position.z);
  orientPlayerRig(playerRig, settings.spawn.lookAt);
  activatedEntryGlyph = null;
  glyphOrbit.reset();
  glyphLights.reset();
  glyphInteraction.reset();
  showReadyState({ ended: hasEnteredSession });
}

async function enterVr() {
  if (activeSession) return;
  entryTransition.reset();
  spatialPlaque.reset();
  glyphPlaque.reset();
  playerRig.position.set(settings.spawn.position.x, settings.spawn.position.y, settings.spawn.position.z);
  orientPlayerRig(playerRig, settings.spawn.lookAt);
  activatedEntryGlyph = null;
  glyphOrbit.reset();
  glyphLights.reset();
  glyphInteraction.reset();
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
    clock.start();
    renderer.setAnimationLoop(renderFrame);
  } catch (error) {
    console.warn('[experience-vr] Session start failed.', error);
    if (requestedSession && requestedSession !== activeSession) {
      try { await requestedSession.end(); } catch { /* Session may already be ending. */ }
    }
    activeSession = null;
    renderer.setAnimationLoop(null);
    clock.stop();
    entryTransition.reset();
    spatialPlaque.reset();
    glyphPlaque.reset();
    status.textContent = copy.error;
    enterButton.disabled = false;
    exitButton.hidden = true;
  }
}

enterButton.addEventListener('click', enterVr);
exitButton.addEventListener('click', () => { void activeSession?.end(); });
showReadyState();
