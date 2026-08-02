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
import { createVrSpatialPlaque } from './xr/createVrSpatialPlaque.js';
import { createVrPortalDisplay } from './xr/createVrPortalDisplay.js';
import { createVrLocomotion } from './xr/createVrLocomotion.js';
import { createVrCrystalCollection } from './xr/createVrCrystalCollection.js';
import { createVrCrystalReliquary } from './xr/createVrCrystalReliquary.js';
import { createVrReliquaryActivateButton } from './xr/createVrReliquaryActivateButton.js';
import { createVrReliquaryReleaseButton } from './xr/createVrReliquaryReleaseButton.js';
import { createVrProgressFloor, FLOOR_WORLD_Y_OFFSET } from './xr/floor/createVrProgressFloor.js';
import { createVrProgressionController } from './xr/progression/createVrProgressionController.js';
import { createVrProgressionShortcut } from './xr/progression/applyVrProgressionShortcut.js';
import { createVrShellSystem } from './xr/shells/createVrShellSystem.js';
import { createVrShellAttractorInteraction } from './xr/shells/createVrShellAttractorInteraction.js';
import { createVrSemanticInput } from './xr/input/createVrSemanticInput.js';
import { createVrHandModeController } from './xr/input/createVrHandModeController.js';
import { createVrAttractorTool } from './xr/tools/createVrAttractorTool.js';
import { experienceVrPages, getExperienceVrPages, resolveExperienceVrPage } from './content/experienceVrPages.js';

const app = document.querySelector('#app');
if (!app) throw new Error('Missing #app mount element.');

const COPY = {
  pl: {
    title: 'Doświadczenie VR', loading: 'Przygotowywanie minimalnej sceny VR…', ready: 'Scena jest gotowa.',
    enter: 'Wejdź do VR', entering: 'Uruchamianie sesji…', exit: 'Zakończ VR', retry: 'Wejdź ponownie do VR',
    error: 'Nie udało się uruchomić sesji VR. Możesz spróbować ponownie.',
    crystalInstructionTitle: 'Portal czeka', crystalInstructionBody: 'Umieść kryształ w relikwiarzu i uruchom go przyciskiem.'
  },
  en: {
    title: 'Experience VR', loading: 'Preparing the minimal VR scene…', ready: 'The scene is ready.',
    enter: 'Enter VR', entering: 'Starting session…', exit: 'Exit VR', retry: 'Enter VR again',
    error: 'The VR session could not be started. You can try again.',
    crystalInstructionTitle: 'The portal is waiting', crystalInstructionBody: 'Place a crystal in the reliquary and activate it with the button.'
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
  .filter(({ id }) => id === 'gltf-loader-module' || id === 'monkey-model' || id === 'vr-portal-model' || id === 'vr-astro-attractor-model' || id.startsWith('vr-progress-floor-') || id === 'vr-crystal-reliquary-model' || id.startsWith('vr-crystal-reliquary-button-') || id.startsWith('glyph-') || id.startsWith('vr-crystal-') || id.startsWith('shell-relic-'))
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
const progressFloor = createVrProgressFloor({
  parent: worldRoot,
  creativeSectorModel: assetManager.cloneGltfScene('vr-progress-floor-creative-model'),
  ethicsSectorModel: assetManager.cloneGltfScene('vr-progress-floor-ethics-model'),
  haikuSectorModel: assetManager.cloneGltfScene('vr-progress-floor-haiku-model'),
  digSectorModel: assetManager.cloneGltfScene('vr-progress-floor-dig-model'),
  aiGuideSectorModel: assetManager.cloneGltfScene('vr-progress-floor-ai-guide-model'),
  worldYOffset: FLOOR_WORLD_Y_OFFSET
});
const monkeyModel = await loadMonkeyModel({ scene: worldRoot, fallbackObject: centralPlaceholder, assetManager });
const resolvedPortfolioNodes = resolvePortfolioNodes(language);
const { group: glyphRing, nodes } = createOrbitNodes(resolvedPortfolioNodes, { assetManager });
worldRoot.add(glyphRing);
const entryDirection = new THREE.Vector3(settings.spawn.position.x, 0, settings.spawn.position.z).normalize();
const glyphOrbit = createVrGlyphOrbit({ nodes, settings: settings.glyphRing, entryDirection });
const shellSystem = createVrShellSystem({ parent: worldRoot, assetManager, baseRadius: glyphOrbit.effectiveRadius });
const glyphLights = createVrGlyphLights({ nodes, settings: settings.glyphLights });
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
const progressionController = createVrProgressionController({ pages: experienceVrPages });
function syncTierOneWorldState() { shellSystem.setActive(progressionController.isTierComplete(1)); }
const attractorTool = createVrAttractorTool({ model: assetManager.cloneGltfScene('vr-astro-attractor-model') });
const semanticInput = createVrSemanticInput({ renderer });
const handModeController = createVrHandModeController({
  controllers: vrControllers.controllers,
  semanticInput,
  attractorTool,
  isUnlocked: () => progressionController.isTierComplete(1)
});
const crystalCollection = createVrCrystalCollection({
  scene, assetManager, controllers: vrControllers.controllers, portalDisplay, insertionTarget: crystalReliquary,
  settings: settings.crystals, haloSettings: settings.targetHalo, insertFeedbackSettings: settings.reliquary.insertFeedback,
  pages: experienceVrPages, progressionController,
  onPreview: (page) => portalCanvas.show(resolveExperienceVrPage(page, language)),
  onCommit: (page) => {
    progressFloor.activatePage(page);
    if (progressionController.isTierComplete(page.order)) progressFloor.completeTier(page.order);
    syncTierOneWorldState();
  }
});
createVrProgressionShortcut({ search: location.search, pages: experienceVrPages, progressionController,
  progressFloor, syncTierOneWorldState })();
const activateButtonGltf = assetManager.getGltf('vr-crystal-reliquary-button-activate-model');
const activateButtonModel = assetManager.cloneGltfScene('vr-crystal-reliquary-button-activate-model');
crystalReliquary.attachCompanion({ id: 'activate', model: activateButtonModel, settings: settings.reliquary.buttons,
  side: settings.reliquary.activateButton.side });
const activateButton = createVrReliquaryActivateButton({
  buttonModel: activateButtonModel,
  animations: activateButtonGltf?.animations ?? [],
  reliquary: crystalReliquary,
  controllers: vrControllers.controllers,
  settings: settings.reliquary.activateButton,
  canActivate: () => crystalCollection.getInsertedInstance()?.state === 'inserted',
  onActivate: () => crystalCollection.activateInserted()
});
const releaseButtonGltf = assetManager.getGltf('vr-crystal-reliquary-button-release-model');
const releaseButtonModel = assetManager.cloneGltfScene('vr-crystal-reliquary-button-release-model');
crystalReliquary.attachCompanion({ id: 'release', model: releaseButtonModel, settings: settings.reliquary.buttons,
  side: settings.reliquary.releaseButton.side });
const releaseButton = createVrReliquaryReleaseButton({
  buttonModel: releaseButtonModel,
  animations: releaseButtonGltf?.animations ?? [],
  reliquary: crystalReliquary,
  controllers: vrControllers.controllers,
  settings: settings.reliquary.releaseButton,
  canRelease: () => ['inserted', 'active'].includes(crystalCollection.getInsertedInstance()?.state),
  onRelease: () => crystalCollection.releaseInserted(),
  onReleaseComplete: () => activateButton.reset()
});
function getNextCrystalTier(node) {
  const branchId = node?.userData?.id;
  return [...getExperienceVrPages(branchId)].sort((a, b) => a.order - b.order)
    .find((page) => !progressionController.hasActivatedPage(page.id)
      && !crystalCollection.instances.some((instance) => instance.branchId === branchId
        && instance.tier === page.order && instance.state !== 'released'))?.order ?? null;
}
function isGlyphActive(node) { return getNextCrystalTier(node) !== null; }
const glyphInteraction = createVrGlyphInteraction({
  controllers: vrControllers.controllers,
  nodes,
  settings: settings.glyphInteraction,
  haloSettings: settings.targetHalo,
  isGlyphActive,
  onGlyphHoldComplete: ({ node }) => {
    if (getNextCrystalTier(node) === null) return;
    node.updateWorldMatrix(true, false);
    monkeyAnchor.updateWorldMatrix(true, false);
    const glyphWorldPosition = node.getWorldPosition(new THREE.Vector3());
    const centerWorldPosition = monkeyAnchor.getWorldPosition(new THREE.Vector3());
    crystalCollection.spawnOne(node.userData.id, { glyphWorldPosition, centerWorldPosition });
  }
});
const shellAttractorInteraction = createVrShellAttractorInteraction({
  controllers: vrControllers.controllers, shellSystem, handModeController, semanticInput, attractorTool,
  settings: settings.shellAttractor, haloSettings: settings.targetHalo,
  isHigherPriorityInteractionActive: (record) => Boolean(activateButton.hits.get(record)
    || releaseButton.hits.get(record) || record.currentHit || record.currentCrystalHit)
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
  vrControllers.beginRayHitFrame();
  glyphOrbit.update(delta);
  shellSystem.update(delta);
  glyphRing.updateMatrixWorld(true);
  glyphInteraction.update(delta);
  crystalCollection.update(delta);
  progressFloor.update(delta);
  activateButton.update(delta);
  releaseButton.update(delta);
  handModeController.update(delta);
  shellAttractorInteraction.update(delta);
  vrControllers.resolveVisualRayLength();
  glyphLights.update({
    hovered: glyphInteraction.hoveredGlyphs,
    exhausted: new Set(nodes.filter((node) => !isGlyphActive(node)))
  });
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
  crystalCollection.reset();
  activateButton.reset();
  releaseButton.reset();
  crystalReliquary.reset();
  restorePortalWaitingState();
  locomotion.reset();
  playerRig.position.set(settings.spawn.position.x, settings.spawn.position.y, settings.spawn.position.z);
  orientPlayerRig(playerRig, settings.spawn.lookAt);
  glyphOrbit.reset();
  shellAttractorInteraction.reset();
  shellSystem.reset();
  syncTierOneWorldState();
  glyphLights.reset();
  glyphInteraction.reset();
  vrControllers.reset();
  handModeController.reset();
  showReadyState({ ended: hasEnteredSession });
}

async function enterVr() {
  if (activeSession) return;
  crystalCollection.reset();
  activateButton.reset();
  releaseButton.reset();
  crystalReliquary.reset();
  restorePortalWaitingState();
  locomotion.reset();
  playerRig.position.set(settings.spawn.position.x, settings.spawn.position.y, settings.spawn.position.z);
  orientPlayerRig(playerRig, settings.spawn.lookAt);
  glyphOrbit.reset();
  shellAttractorInteraction.reset();
  shellSystem.reset();
  syncTierOneWorldState();
  glyphLights.reset();
  glyphInteraction.reset();
  vrControllers.reset();
  handModeController.reset();
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
    const trackedHead = renderer.xr.getCamera(camera).getWorldPosition(new THREE.Vector3());
    playerRig.position.x += settings.spawn.position.x - trackedHead.x;
    playerRig.position.z += settings.spawn.position.z - trackedHead.z;
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
    crystalCollection.reset();
    activateButton.reset();
    releaseButton.reset();
    crystalReliquary.reset();
    restorePortalWaitingState();
    locomotion.reset();
    vrControllers.reset();
    shellAttractorInteraction.reset();
    handModeController.reset();
    status.textContent = copy.error;
    enterButton.disabled = false;
    exitButton.hidden = true;
  }
}

enterButton.addEventListener('click', enterVr);
exitButton.addEventListener('click', () => { void activeSession?.end(); });
window.addEventListener('pagehide', () => {
  shellAttractorInteraction.dispose();
  handModeController.dispose();
  activateButton.reset();
  releaseButton.reset();
  activateButton.dispose();
  releaseButton.dispose();
  crystalCollection.dispose();
  crystalReliquary.dispose();
  progressFloor.dispose();
  shellSystem.dispose();
}, { once: true });
showReadyState();
