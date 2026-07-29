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
import { createVrSpatialPlaque } from './xr/createVrSpatialPlaque.js';
import { createVrPortalDisplay } from './xr/createVrPortalDisplay.js';
import { createVrLocomotion } from './xr/createVrLocomotion.js';
import { createVrCrystalCollection } from './xr/createVrCrystalCollection.js';
import { createVrCrystalReliquary } from './xr/createVrCrystalReliquary.js';
import { getExperienceVrPages, resolveExperienceVrPage } from './content/experienceVrPages.js';

const app = document.querySelector('#app');
if (!app) throw new Error('Missing #app mount element.');

const COPY = {
  pl: {
    title: 'Doświadczenie VR', loading: 'Przygotowywanie minimalnej sceny VR…', ready: 'Scena jest gotowa.',
    enter: 'Wejdź do VR', entering: 'Uruchamianie sesji…', exit: 'Zakończ VR', retry: 'Wejdź ponownie do VR',
    error: 'Nie udało się uruchomić sesji VR. Możesz spróbować ponownie.',
    crystalInstructionTitle: 'Portal czeka', crystalInstructionBody: 'Umieść kryształ w dolnym gnieździe portalu.'
  },
  en: {
    title: 'Experience VR', loading: 'Preparing the minimal VR scene…', ready: 'The scene is ready.',
    enter: 'Enter VR', entering: 'Starting session…', exit: 'Exit VR', retry: 'Enter VR again',
    error: 'The VR session could not be started. You can try again.',
    crystalInstructionTitle: 'The portal is waiting', crystalInstructionBody: 'Place a crystal in the lower portal socket.'
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
  .filter(({ id }) => id === 'gltf-loader-module' || id === 'monkey-model' || id === 'vr-portal-model' || id === 'vr-crystal-reliquary-model' || id.startsWith('glyph-') || id.startsWith('vr-crystal-'))
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
const resolvedPortfolioNodes = resolvePortfolioNodes(language);
const { group: glyphRing, nodes } = createOrbitNodes(resolvedPortfolioNodes, { assetManager });
worldRoot.add(glyphRing);
const entryDirection = new THREE.Vector3(settings.spawn.position.x, 0, settings.spawn.position.z).normalize();
const glyphOrbit = createVrGlyphOrbit({ nodes, settings: settings.glyphRing, entryDirection });
const glyphLights = createVrGlyphLights({ nodes });
const monkeyAnchor = monkeyModel ?? centralPlaceholder;
const portalDisplay = createVrPortalDisplay({
  scene, anchorObject: monkeyAnchor, spawnPosition: settings.spawn.position,
  portalModel: assetManager.cloneGltfScene('vr-portal-model'), settings: settings.portal
});
const portalCanvas = createVrSpatialPlaque({
  scene,
  parent: portalDisplay.object,
  surface: portalDisplay.canvasSurface,
  settings: settings.portalCanvas
});
function restorePortalWaitingState() {
  portalDisplay.reset();
  portalCanvas.reset();
  portalCanvas.show({ title: copy.crystalInstructionTitle, body: copy.crystalInstructionBody });
}
restorePortalWaitingState();
const crystalReliquary = createVrCrystalReliquary({
  scene,
  reliquaryModel: assetManager.cloneGltfScene('vr-crystal-reliquary-model'),
  portalDisplay,
  spawnPosition: settings.spawn.position,
  settings: settings.reliquary
});
const locomotion = createVrLocomotion({ playerRig, renderer, camera, settings: settings.locomotion });
const crystalCollection = createVrCrystalCollection({
  scene, assetManager, controllers: vrControllers.controllers, portalDisplay, insertionTarget: crystalReliquary, settings: settings.crystals,
  onConsume: (page) => {
    const node = resolvedPortfolioNodes.find(({ id }) => id === page.glyphId);
    portalCanvas.show(resolveExperienceVrPage(page, node));
  }
});
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
    const glyphId = activatedEntryGlyph?.userData?.id;
    crystalCollection.spawn(getExperienceVrPages(glyphId), {
      anchorObject: monkeyAnchor,
      spawnPosition: settings.spawn.position
    });
  }
});
const glyphInteraction = createVrGlyphInteraction({
  controllers: vrControllers.controllers,
  nodes,
  onEntryGlyphActivated: () => {
    activatedEntryGlyph = glyphInteraction.activatedEntryGlyph;
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
  const orbitEntryReady = glyphOrbit.update(delta);
  const entryReady = activatedEntryGlyph ? null : orbitEntryReady;
  glyphRing.updateMatrixWorld(true);
  glyphInteraction.update();
  crystalCollection.update(delta);
  glyphInteraction.setEntryReady(entryReady);
  glyphLights.update({
    hovered: glyphInteraction.hoveredGlyphs,
    entryReady,
    activated: activatedEntryGlyph
  });
  entryTransition.update(delta);
  locomotion.update(delta);
  portalCanvas.update(delta);
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
  crystalCollection.reset();
  crystalReliquary.reset();
  restorePortalWaitingState();
  locomotion.reset();
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
  crystalCollection.reset();
  crystalReliquary.reset();
  restorePortalWaitingState();
  locomotion.reset();
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
    crystalCollection.reset();
    crystalReliquary.reset();
    restorePortalWaitingState();
    locomotion.reset();
    status.textContent = copy.error;
    enterButton.disabled = false;
    exitButton.hidden = true;
  }
}

enterButton.addEventListener('click', enterVr);
exitButton.addEventListener('click', () => { void activeSession?.end(); });
showReadyState();
