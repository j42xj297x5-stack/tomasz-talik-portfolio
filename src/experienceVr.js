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
import { createVrAstroFurnace } from './xr/furnace/createVrAstroFurnace.js';
import { createVrAstroFurnaceOpenInteraction } from './xr/furnace/createVrAstroFurnaceOpenInteraction.js';
import { ASTRO_FURNACE_PROCESS_KINDS, createVrAstroFurnaceActivateInteraction } from './xr/furnace/createVrAstroFurnaceActivateInteraction.js';
import { resolveChamberCylinder } from './xr/furnace/vrAstroFurnaceChamberCylinder.js';
import { ASTRO_FURNACE_ACTIVE_MODE, createVrAstroFurnaceOptionInteraction } from './xr/furnace/createVrAstroFurnaceOptionInteraction.js';
import { createVrAstroFurnacePanel } from './xr/furnace/createVrAstroFurnacePanel.js';
import { createVrAstroFurnaceProcessSource } from './xr/furnace/createVrAstroFurnaceProcessSource.js';
import { createVrAstroFurnaceProgressionController } from './xr/furnace/createVrAstroFurnaceProgressionController.js';
import { createVrAstroFurnaceContentInteraction } from './xr/furnace/createVrAstroFurnaceContentInteraction.js';
import { createVrAsterionSphere } from './xr/asterion/createVrAsterionSphere.js';
import { createVrAsterionGyroInteraction } from './xr/asterion/createVrAsterionGyroInteraction.js';
import { createVrAsterionProductionController } from './xr/asterion/createVrAsterionProductionController.js';
import { createVrPlayerGuidePanel } from './xr/guidance/createVrPlayerGuidePanel.js';
import { createVrMonkeyGuide } from './xr/guidance/createVrMonkeyGuide.js';
import { createVrIntroSequence, VR_INTRO_STATE } from './xr/guidance/createVrIntroSequence.js';
import { createVrSceneLayoutPrototype } from './xr/layout/createVrSceneLayoutPrototype.js';
import { createVrAudioBridge } from './xr/audio/createVrAudioBridge.js';
import { createVrAmbientSequencer } from './xr/audio/createVrAmbientSequencer.js';
import { experienceVrPages, getExperienceVrPages, resolveExperienceVrPage } from './content/experienceVrPages.js';
import { publicPath } from './utils/publicPath.js';

const app = document.querySelector('#app');
if (!app) throw new Error('Missing #app mount element.');

const COPY = {
  pl: {
    title: 'Doświadczenie VR', loading: 'Przygotowywanie minimalnej sceny VR…', ready: 'Scena jest gotowa.',
    enter: 'Wejdź do VR', entering: 'Uruchamianie sesji…', exit: 'Zakończ VR', retry: 'Wejdź ponownie do VR',
    error: 'Nie udało się uruchomić sesji VR. Możesz spróbować ponownie.',
    controllersAlt: 'Instrukcja sterowania kontrolerami VR',
    crystalInstructionTitle: 'Portal czeka', crystalInstructionBody: 'Umieść kryształ w relikwiarzu i uruchom go przyciskiem.'
  },
  en: {
    title: 'Experience VR', loading: 'Preparing the minimal VR scene…', ready: 'The scene is ready.',
    enter: 'Enter VR', entering: 'Starting session…', exit: 'Exit VR', retry: 'Enter VR again',
    error: 'The VR session could not be started. You can try again.',
    controllersAlt: 'VR controller instructions',
    crystalInstructionTitle: 'The portal is waiting', crystalInstructionBody: 'Place a crystal in the reliquary and activate it with the button.'
  }
};

const language = document.documentElement.lang === 'pl' ? 'pl' : 'en';
const copy = COPY[language];
const vrAudio = createVrAudioBridge();
const VR_AUDIO = Object.freeze({
  playerOpen: '/audio/bell_01.mp3', playerClose: '/audio/bell_02.mp3', click: '/audio/click_panel_01.mp3',
  monkeyOpen: '/audio/panel_sound_long_01.mp3', monkeyClose: '/audio/panel_sound_long_02.mp3',
  furnaceOpen: '/audio/panel_sound_01.mp3', furnaceDeeper: '/audio/panel_sound_02.mp3',
  reliquaryInsert: '/audio/turn_page_01.mp3', reliquaryActivate: '/audio/creating_short_01.mp3',
  reliquaryConsume: '/audio/reliquiary_consume.mp3',
  tierComplete: '/audio/floor_panel_activate.mp3', monkeyThinking: '/audio/monkey_thinking_01.mp3',
  chamberOpen: '/audio/astro_piec_open.mp3', chamberClose: '/audio/astro_piec_close.mp3',
  furnaceProcess: '/audio/astro_piec_work_01.mp3',
  asterionCreate: '/audio/astro_piec_work_create_01.mp3',
  glyphProcess: '/audio/glif_hover_loop.mp3'
});
const GLYPH_COMPLETION_AUDIO = Object.freeze({
  'ethics-life-protection': ['/audio/glif_earth_4s_01.mp3', '/audio/glif_earth_4s_02.mp3', '/audio/glif_earth_4s_03.mp3'],
  'creative-ai': ['/audio/glif_fire_4s_01.mp3', '/audio/glif_fire_4s_02.mp3', '/audio/glif_fire_4s_03.mp3'],
  'ai-guide': ['/audio/glif_wood_4s_01.mp3', '/audio/glif_wood_4s_02.mp3', '/audio/glif_wood_4s_01.mp3'],
  'spotify-digger': ['/audio/glif_metal_4s_01.mp3', '/audio/glif_metal_4s_02.mp3', '/audio/glif_metal_4s_03.mp3', '/audio/glif_metal_4s_04.mp3'],
  'haiku-cosmos': ['/audio/glif_water_4s_01.mp3', '/audio/glif_water_4s_02.mp3', '/audio/glif_water_4s_03.mp3', '/audio/glif_water_4s_04.mp3', '/audio/glif_water_4s_01.mp3']
});
vrAudio.prepareOneShots([...Object.values(VR_AUDIO), ...Object.values(GLYPH_COMPLETION_AUDIO).flat()]);
vrAudio.prepareAttractorLoops();
const playVrUi = (path) => vrAudio.playOneShot(path, 'UI');
const playVrWorld = (path) => vrAudio.playOneShot(path, 'WORLD');
const playVrDevice = (path) => vrAudio.playOneShot(path, 'DEVICE');
app.innerHTML = `
  <main class="vr-runtime" aria-label="${copy.title}">
    <canvas id="vr-scene-canvas" class="vr-runtime__canvas"></canvas>
    <section class="vr-runtime__controls">
      <div class="vr-runtime__controllers-visual">
        <img src="${publicPath(`/svg/controllers_${language}.svg`)}" alt="${copy.controllersAlt}">
      </div>
      <p class="vr-runtime__status" data-vr-status aria-live="polite">${copy.loading}</p>
      <div class="vr-runtime__audio-slot" data-vr-audio-slot></div>
      <button class="entry-choice entry-choice--primary" type="button" data-vr-enter disabled>${copy.enter}</button>
      <button class="entry-shell__back" type="button" data-vr-exit hidden>${copy.exit}</button>
    </section>
  </main>
`;

const canvas = app.querySelector('#vr-scene-canvas');
const status = app.querySelector('[data-vr-status]');
const enterButton = app.querySelector('[data-vr-enter]');
const exitButton = app.querySelector('[data-vr-exit]');
const controls = app.querySelector('.vr-runtime__controls');
const audioControl = document.querySelector('[data-audio-control]');
if (audioControl) app.querySelector('[data-vr-audio-slot]').append(audioControl);
const loadedSettings = await loadExperienceVrSettings({ debug: new URLSearchParams(location.search).has('debug') });
const settings = loadedSettings.settings;
const searchParams = new URLSearchParams(location.search);
const sceneLayoutQa = searchParams.has('sceneLayout');
const sceneLayoutDebug = sceneLayoutQa && searchParams.has('layoutDebug');
const furnaceProcessQa = searchParams.has('furnaceProcess');
const introQaBypass = ['p1', 'asterionSphere', 'furnaceProcess', 'sceneLayout', 'layoutDebug', 'furnace', 'layout']
  .some((key) => searchParams.has(key));
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

const asterionSphereQa = settings.asterionSphere.enabled && searchParams.has(settings.asterionSphere.qaQueryParam);
const vrAssets = getPreloadAssets([...INITIAL_PRELOAD_GROUPS, ...DEFERRED_PRELOAD_GROUPS])
  .filter(({ id }) => id === 'vr-asterion-sphere-model' || id === 'gltf-loader-module' || id === 'monkey-model' || id === 'vr-portal-model' || id === 'vr-astro-attractor-model' || id === 'vr-astro-furnace-model' || id.startsWith('vr-progress-floor-') || id === 'vr-crystal-reliquary-model' || id.startsWith('vr-crystal-reliquary-button-') || id.startsWith('glyph-') || id.startsWith('vr-crystal-') || id.startsWith('shell-relic-'))
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
let sceneLayoutAsset = null;
if (sceneLayoutQa) {
  try {
    sceneLayoutAsset = await assetManager.loadAsset({
      id: 'vr-scene-layout-prototype', path: '/glb/uklad_sceny.glb', type: 'model'
    });
  } catch (error) {
    console.warn('[Experience VR] Prototype scene layout failed to load; using legacy placement.', error);
  }
}
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
let sceneLayout = null;
if (sceneLayoutAsset?.gltf?.scene) {
  try {
    sceneLayout = createVrSceneLayoutPrototype(sceneLayoutAsset.gltf.scene);
    if (!sceneLayout.getNode('VR_ROOM_LAYOUT_ROOT') || !sceneLayout.getNode('ANCHOR_FLOOR_ROOT')) {
      throw new Error('VR_ROOM_LAYOUT_ROOT or ANCHOR_FLOOR_ROOT is missing.');
    }
  } catch (error) {
    sceneLayout = null;
    console.warn('[Experience VR] Prototype scene layout is invalid; using legacy placement.', error);
  }
}
const platformFixturesRoot = new THREE.Group();
platformFixturesRoot.name = 'VrPlatformFixturesRoot';
platformFixturesRoot.position.set(0, 0, 0);
platformFixturesRoot.quaternion.identity();
platformFixturesRoot.scale.set(1, 1, 1);
progressFloor.object.add(platformFixturesRoot);
const platformOrigin = new THREE.Group();
platformOrigin.name = 'VrPlatformOrigin';
platformOrigin.position.set(0, 0, 0);
platformOrigin.quaternion.identity();
platformOrigin.scale.set(1, 1, 1);
progressFloor.object.add(platformOrigin);
const floorPassengerRoot = new THREE.Group();
floorPassengerRoot.name = 'VrFloorPassengerRoot';
floorPassengerRoot.position.set(0, 0, 0);
floorPassengerRoot.quaternion.identity();
floorPassengerRoot.scale.set(1, 1, 1);
progressFloor.object.add(floorPassengerRoot);
const monkeyActor = await loadMonkeyModel({ scene: worldRoot, fallbackObject: centralPlaceholder, assetManager });
const { motionRoot: monkeyMotionRoot, visualRoot: monkeyVisualRoot, model: monkeyModel } = monkeyActor;
progressFloor.object.attach(monkeyMotionRoot);
const resolvedPortfolioNodes = resolvePortfolioNodes(language);
const { group: glyphRing, nodes } = createOrbitNodes(resolvedPortfolioNodes, { assetManager });
worldRoot.add(glyphRing);
const entryDirection = new THREE.Vector3(settings.spawn.position.x, 0, settings.spawn.position.z).normalize();
const glyphOrbit = createVrGlyphOrbit({ nodes, settings: settings.glyphRing, entryDirection });
const floorWalkRadius = glyphOrbit.effectiveRadius;
floorPassengerRoot.attach(playerRig);
if (sceneLayout) {
  const spawnApplied = sceneLayout.applyTransform({ layoutNode: 'ANCHOR_PLAYER_SPAWN',
    layoutReference: 'ANCHOR_FLOOR_ROOT', runtimeObject: playerRig,
    runtimeReference: progressFloor.object, applyRotation: false });
  if (!spawnApplied) console.warn('[Experience VR] Layout anchor ANCHOR_PLAYER_SPAWN is missing; using legacy player spawn.');
}
const playerRigSpawnLocalPosition = playerRig.position.clone();
const playerRigSpawnLocalQuaternion = playerRig.quaternion.clone();
const playerRigSpawnLocalScale = playerRig.scale.clone();
const shellSystem = createVrShellSystem({ parent: worldRoot, assetManager, baseRadius: glyphOrbit.effectiveRadius,
  emissionSettings: settings.shellAttractor });
const asterionSphereGltf = assetManager.getGltf('vr-asterion-sphere-model');
const asterionSphere = createVrAsterionSphere({
  model: assetManager.cloneGltfScene('vr-asterion-sphere-model'),
  animations: asterionSphereGltf?.animations ?? [],
  settings: settings.asterionSphere,
  enabled: settings.asterionSphere.enabled,
  debug: searchParams.has('debug') || asterionSphereQa
});
const asterionGyroInteraction = createVrAsterionGyroInteraction({
  sphere: asterionSphere, controllers: vrControllers.controllers, progressFloor, worldRoot, renderer,
  settings: settings.asterionSphere, enabled: settings.asterionSphere.enabled
});
const glyphLights = createVrGlyphLights({ nodes, settings: settings.glyphLights });
const portalDisplay = createVrPortalDisplay({
  scene, platformOrigin, spawnPosition: settings.spawn.position,
  portalModel: assetManager.cloneGltfScene('vr-portal-model'), settings: settings.portal
});
const astroFurnaceGltf = assetManager.getGltf('vr-astro-furnace-model');
const astroFurnace = createVrAstroFurnace({
  parent: worldRoot,
  model: assetManager.cloneGltfScene('vr-astro-furnace-model'),
  animations: astroFurnaceGltf?.animations ?? [],
  settings: settings.furnace,
  platformOrigin,
  spawnPosition: settings.spawn.position
});
const furnaceProgressionController = createVrAstroFurnaceProgressionController();
const asterionProductionController = createVrAsterionProductionController({
  progressionController: furnaceProgressionController, sphere: asterionSphere,
  contentAnchor: astroFurnace.nodes.VR_FURNACE_CONTENT_ANCHOR,
  chamber: astroFurnace.nodes.komora,
  chamberCylinder: resolveChamberCylinder(astroFurnace.nodes.komora, settings.furnace.content.chamberClearance),
  energyCell: astroFurnace.nodes.energy_cell ?? astroFurnace.nodes.fire_cell,
  controllers: vrControllers.controllers, settings: { ...settings.asterionSphere.production,
    contentClearance: settings.furnace.content.contentClearance },
  haloSettings: settings.targetHalo,
  processDriver: {
    startConstruction: () => astroFurnaceActivateInteraction?.startConstruction?.() === true,
    canStartConstruction: () => astroFurnaceActivateInteraction?.canStartConstruction?.() === true,
    getState: () => astroFurnaceActivateInteraction?.getState?.() ?? 'IDLE',
    getProgress: () => astroFurnaceActivateInteraction?.getProgress?.() ?? 0,
    getProcessKind: () => astroFurnaceActivateInteraction?.getProcessKind?.() ?? null
  },
  getChamberState: () => astroFurnaceOpenInteraction?.getState?.() ?? 'CLOSED',
  getContentState: () => astroFurnaceContentInteraction?.getState?.() ?? 'EMPTY'
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
platformFixturesRoot.attach(portalDisplay.object);
platformFixturesRoot.attach(astroFurnace.object);
const crystalReliquary = createVrCrystalReliquary({
  scene,
  reliquaryModel: assetManager.cloneGltfScene('vr-crystal-reliquary-model'),
  portalDisplay,
  spawnPosition: settings.spawn.position,
  settings: settings.reliquary
});
platformFixturesRoot.attach(crystalReliquary.object);
platformFixturesRoot.attach(crystalReliquary.insertFeedback);
const locomotion = createVrLocomotion({
  playerRig, renderer, camera, settings: settings.locomotion, surfaceRoot: progressFloor.object, walkRadius: floorWalkRadius
});
const progressionController = createVrProgressionController({ pages: experienceVrPages });
const ambientSequencer = createVrAmbientSequencer({ bridge: vrAudio });
function syncAmbientSequence() {
  const fullThreshold = progressionController.getCurrentTier();
  const shellsComplete = furnaceProgressionController.getAsterionSphereProgress().complete;
  const sphereBuilt = asterionProductionController.getSnapshot().built;
  ambientSequencer.setState({ fullThreshold, asterionSubthreshold: fullThreshold === 2 && shellsComplete && sphereBuilt });
}
const unsubscribeAmbientFurnace = furnaceProgressionController.subscribe(syncAmbientSequence);
const unsubscribeAmbientAsterion = asterionProductionController.subscribe(syncAmbientSequence);
function syncTierOneWorldState() { shellSystem.setActive(progressionController.isTierComplete(1)); }
function resetPlayerRigToSpawn() {
  if (playerRig.parent !== floorPassengerRoot) floorPassengerRoot.attach(playerRig);
  playerRig.position.copy(playerRigSpawnLocalPosition);
  playerRig.quaternion.copy(playerRigSpawnLocalQuaternion);
  playerRig.scale.copy(playerRigSpawnLocalScale);
}
const attractorTool = createVrAttractorTool({ model: assetManager.cloneGltfScene('vr-astro-attractor-model') });
const semanticInput = createVrSemanticInput({ renderer });
const handModeController = createVrHandModeController({
  controllers: vrControllers.controllers,
  semanticInput,
  attractorTool,
  asterionSphere,
  isUnlocked: () => progressionController.isTierComplete(1),
  isAsterionAvailable: () => asterionProductionController.isEarned() || asterionSphereQa,
  isLeftToolToggleBlocked: () => playerGuidePanel.isOpen()
});
asterionProductionController.setHandModeController(handModeController);
const playerGuidePanel = createVrPlayerGuidePanel({
  leftGrip: vrControllers.controllers[0]?.grip,
  semanticInput,
  locale: language,
  settings: settings.playerGuidePanel,
  onOpenChange: (open) => playVrUi(open ? VR_AUDIO.playerOpen : VR_AUDIO.playerClose),
  onPanelClick: () => playVrUi(VR_AUDIO.click)
});
const monkeyGuide = createVrMonkeyGuide({
  actorRoot: monkeyMotionRoot,
  visualRoot: monkeyVisualRoot,
  controllers: vrControllers.controllers,
  progressionController,
  locale: language,
  settings: settings.monkeyGuide,
  onOpenChange: (open) => playVrUi(open ? VR_AUDIO.monkeyOpen : VR_AUDIO.monkeyClose),
  onPanelClick: () => playVrUi(VR_AUDIO.click),
  onAttentionStart: () => playVrWorld(VR_AUDIO.monkeyThinking),
  isOrdinaryRayAvailable: (record) => !(record.handedness === 'right'
    && handModeController.getRightMode() === 'ASTRO_ATTRACTOR')
    && !(asterionSphere.isEquipped() && record.handedness === 'left')
});
let introSequence = null;
let astroFurnaceActivateInteraction = null;
let astroFurnaceContentInteraction = null;
let astroFurnaceOptionInteraction = null;
const furnacePanel = createVrAstroFurnacePanel({
  parent: worldRoot, furnace: astroFurnace, controllers: vrControllers.controllers,
  progressionController: furnaceProgressionController, productionController: asterionProductionController,
  asterionModel: asterionSphere.object, settings: settings.furnace.panel,
  processSource: createVrAstroFurnaceProcessSource(() => astroFurnaceActivateInteraction),
  contentSource: {
    getState: () => astroFurnaceContentInteraction?.getState?.() ?? 'EMPTY',
    getInsertedShellAssetId: () => astroFurnaceContentInteraction?.getInsertedShellAssetId?.() ?? null,
    getInsertedShellWireframe: () => astroFurnaceContentInteraction?.getInsertedShellWireframe?.() ?? null,
    getChamberState: () => astroFurnaceOpenInteraction?.getState?.() ?? 'CLOSED'
  },
  onEnterModule: () => playVrUi(VR_AUDIO.furnaceDeeper),
  onReturnHome: () => playVrUi(VR_AUDIO.click)
});
platformFixturesRoot.attach(furnacePanel.object);
const ordinaryFurnaceRayAvailable = (record) => !(record.handedness === 'right'
  && handModeController.getRightMode() === 'ASTRO_ATTRACTOR')
  && !(asterionSphere.isEquipped() && record.handedness === 'left');
const astroFurnaceOpenInteraction = createVrAstroFurnaceOpenInteraction({
  furnace: astroFurnace,
  controllers: vrControllers.controllers,
  settings: { ...settings.furnace.openButton, chamber: settings.furnace.chamber },
  haloSettings: settings.targetHalo,
  isOrdinaryRayAvailable: ordinaryFurnaceRayAvailable,
  canToggle: () => !astroFurnaceActivateInteraction?.isProcessing(),
  isModeActive: () => astroFurnaceOptionInteraction?.getActiveMode?.() === ASTRO_FURNACE_ACTIVE_MODE,
  onOpeningStart: () => {
    astroFurnaceActivateInteraction?.releaseForOpening();
    playVrDevice(VR_AUDIO.chamberOpen);
  },
  onClosingStart: () => playVrDevice(VR_AUDIO.chamberClose)
});
astroFurnaceActivateInteraction = createVrAstroFurnaceActivateInteraction({
  furnace: astroFurnace,
  controllers: vrControllers.controllers,
  settings: settings.furnace.activateButton,
  processSettings: settings.furnace.process,
  haloSettings: settings.targetHalo,
  openInteraction: astroFurnaceOpenInteraction,
  canActivateInput: () => astroFurnaceContentInteraction?.hasValidInsertedContent() === true,
  isModeActive: () => astroFurnaceOptionInteraction?.getActiveMode?.() === ASTRO_FURNACE_ACTIVE_MODE,
  qaAllowWithoutInput: furnaceProcessQa,
  isOrdinaryRayAvailable: ordinaryFurnaceRayAvailable,
  onProcessStart: ({ processKind }) => processKind === ASTRO_FURNACE_PROCESS_KINDS.ASTERION_CONSTRUCTION
    ? vrAudio.startAsterionCreate() : vrAudio.startFurnaceProcess(),
  onProcessStop: ({ processKind }) => processKind === ASTRO_FURNACE_PROCESS_KINDS.ASTERION_CONSTRUCTION
    ? vrAudio.stopAsterionCreate() : vrAudio.stopFurnaceProcess()
});
let shellAttractorInteraction = null;
astroFurnaceContentInteraction = createVrAstroFurnaceContentInteraction({
  furnace: astroFurnace, shellSystem, openInteraction: astroFurnaceOpenInteraction,
  activateInteraction: astroFurnaceActivateInteraction, progressionController: furnaceProgressionController,
  isModeActive: () => astroFurnaceOptionInteraction?.getActiveMode?.() === ASTRO_FURNACE_ACTIVE_MODE,
  controllers: vrControllers.controllers, settings: settings.furnace.content,
  takeHeldShell: (shell) => shellAttractorInteraction?.transferHeldShell(shell) === true
});
astroFurnaceContentInteraction.subscribe(() => furnacePanel.redraw());
astroFurnaceOptionInteraction = createVrAstroFurnaceOptionInteraction({
  furnace: astroFurnace, panel: furnacePanel, controllers: vrControllers.controllers,
  settings: settings.furnace.optionButton,
  haloSettings: { ...settings.targetHalo, ...settings.furnace.optionButton.halo },
  isOrdinaryRayAvailable: ordinaryFurnaceRayAvailable,
  isHigherPriorityInteractionActive: (record) => furnacePanel.hasCurrentHit(record),
  onPanelOpen: () => playVrUi(VR_AUDIO.furnaceOpen)
});
const crystalCollection = createVrCrystalCollection({
  scene, assetManager, controllers: vrControllers.controllers, portalDisplay, insertionTarget: crystalReliquary,
  settings: settings.crystals, haloSettings: settings.targetHalo, insertFeedbackSettings: settings.reliquary.insertFeedback,
  pages: experienceVrPages, progressionController,
  onInsertAccepted: () => playVrWorld(VR_AUDIO.reliquaryInsert),
  canGrabController: (record) => {
    if (record.handedness === 'right' && handModeController.getRightMode() === 'ASTRO_ATTRACTOR') return false;
    if (asterionSphere.isEquipped() && record.handedness === 'left') return false;
    if (astroFurnaceOpenInteraction.hasCurrentHit(record)) return false;
    if (astroFurnaceActivateInteraction.hasCurrentHit(record)) return false;
    if (astroFurnaceOptionInteraction.hasCurrentHit(record) || furnacePanel.hasCurrentHit(record)) return false;
    if (monkeyGuide.hasCurrentHit(record)) return false;
    if (shellAttractorInteraction?.hasCurrentShellHit(record)) return false;
    return true;
  },
  onPreview: (page) => portalCanvas.show(resolveExperienceVrPage(page, language)),
  onCommit: (page, { tierCompleted }) => {
    progressFloor.activatePage(page);
    if (tierCompleted) progressFloor.completeTier(page.order);
    syncTierOneWorldState();
    syncAmbientSequence();
    playVrWorld(VR_AUDIO.reliquaryConsume);
    if (tierCompleted) playVrWorld(VR_AUDIO.tierComplete);
    monkeyGuide.notifyAttention();
  }
});
createVrProgressionShortcut({ search: location.search, pages: experienceVrPages, progressionController,
  progressFloor, syncTierOneWorldState })();
const activateButtonGltf = assetManager.getGltf('vr-crystal-reliquary-button-activate-model');
const activateButtonModel = assetManager.cloneGltfScene('vr-crystal-reliquary-button-activate-model');
const activateCompanion = crystalReliquary.attachCompanion({ id: 'activate', model: activateButtonModel, settings: settings.reliquary.buttons,
  side: settings.reliquary.activateButton.side });
const activateButton = createVrReliquaryActivateButton({
  buttonModel: activateButtonModel,
  animations: activateButtonGltf?.animations ?? [],
  reliquary: crystalReliquary,
  controllers: vrControllers.controllers,
  settings: settings.reliquary.activateButton,
  canActivate: () => crystalCollection.getInsertedInstance()?.state === 'inserted',
  onActivate: () => {
    const accepted = crystalCollection.activateInserted();
    if (accepted) playVrWorld(VR_AUDIO.reliquaryActivate);
    return accepted;
  }
});
const releaseButtonGltf = assetManager.getGltf('vr-crystal-reliquary-button-release-model');
const releaseButtonModel = assetManager.cloneGltfScene('vr-crystal-reliquary-button-release-model');
const releaseCompanion = crystalReliquary.attachCompanion({ id: 'release', model: releaseButtonModel, settings: settings.reliquary.buttons,
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
function isGlyphActive(node) {
  const introState = introSequence?.getState();
  const introAllowsGameplay = introState === VR_INTRO_STATE.INSIDE_RING_READY || introState === VR_INTRO_STATE.BYPASSED;
  return introAllowsGameplay && getNextCrystalTier(node) !== null;
}
const glyphInteraction = createVrGlyphInteraction({
  controllers: vrControllers.controllers,
  nodes,
  settings: settings.glyphInteraction,
  haloSettings: settings.targetHalo,
  isGlyphActive: (node) => isGlyphActive(node),
  onGlyphHoldStart: ({ node }) => vrAudio.startGlyphAcquisition(node.userData.id),
  onGlyphHitLost: ({ node }) => vrAudio.missGlyphAcquisition(node.userData.id),
  onGlyphHitResumed: ({ node }) => vrAudio.startGlyphAcquisition(node.userData.id),
  onGlyphHoldCancelled: ({ node }) => vrAudio.cancelGlyphAcquisition(node.userData.id),
  onGlyphHoldComplete: ({ node }) => {
    const tier = getNextCrystalTier(node);
    if (tier === null) return;
    node.updateWorldMatrix(true, false);
    platformOrigin.updateWorldMatrix(true, false);
    const glyphWorldPosition = node.getWorldPosition(new THREE.Vector3());
    const centerWorldPosition = platformOrigin.getWorldPosition(new THREE.Vector3());
    const crystal = crystalCollection.spawnOne(node.userData.id, { glyphWorldPosition, centerWorldPosition });
    if (crystal) vrAudio.completeGlyphAcquisition(node.userData.id, GLYPH_COMPLETION_AUDIO[node.userData.id]?.[tier - 1]);
  }
});
shellAttractorInteraction = createVrShellAttractorInteraction({
  controllers: vrControllers.controllers, shellSystem, handModeController, semanticInput, attractorTool,
  settings: settings.shellAttractor, haloSettings: settings.targetHalo, settledParent: worldRoot,
  crystalHeldByController: crystalCollection.heldByController,
  onPullStart: ({ target }) => vrAudio.startAttractor(target.userData.attractorId, 'shell'),
  onPullCancel: ({ target }) => vrAudio.cancelAttractor(target.userData.attractorId),
  onHandoff: ({ target }) => vrAudio.handoffAttractor(target.userData.attractorId),
  isHigherPriorityInteractionActive: (record) => Boolean(activateButton.hits.get(record)
    || releaseButton.hits.get(record) || astroFurnaceOpenInteraction.hasCurrentHit(record)
    || astroFurnaceActivateInteraction.hasCurrentHit(record) || astroFurnaceOptionInteraction.hasCurrentHit(record)
    || furnacePanel.hasCurrentHit(record) || monkeyGuide.hasCurrentHit(record) || record.currentHit)
});

const warnedLayoutAnchors = new Set();
let sceneLayoutDebugLogged = false;
function applySceneLayoutPrototype() {
  if (!sceneLayout) return false;
  const rows = [];
  const apply = ({ anchor, target, runtimeObject, layoutReference = 'ANCHOR_FLOOR_ROOT',
    runtimeReference = progressFloor.object, fallback = false, offsetPosition = null, applyRotation = true }) => {
    try {
      const resolved = sceneLayout.applyTransform({ layoutNode: anchor, layoutReference, runtimeObject,
        runtimeReference, offsetPosition, applyRotation });
      if (!resolved) {
        if (!warnedLayoutAnchors.has(anchor)) {
          warnedLayoutAnchors.add(anchor);
          console.warn(`[Experience VR] Layout anchor ${anchor} is missing; retaining legacy transform for ${target}.`);
        }
        return false;
      }
      rows.push({
        anchor, target,
        localPosition: resolved.localPosition.toArray().map((value) => Number(value.toFixed(4))).join(', '),
        worldPosition: resolved.worldPosition.toArray().map((value) => Number(value.toFixed(4))).join(', '),
        quaternion: resolved.quaternion.toArray().map((value) => Number(value.toFixed(4))).join(', '),
        fallback
      });
      return true;
    } catch (error) {
      console.warn(`[Experience VR] Could not apply layout anchor ${anchor}; retaining legacy transform for ${target}.`, error);
      return false;
    }
  };

  apply({ anchor: 'ANCHOR_MONKEY', target: 'monkeyMotionRoot', runtimeObject: monkeyMotionRoot });
  apply({ anchor: 'ANCHOR_MONKEY_ATTENTION', target: 'monkeyGuide.attentionRoot',
    runtimeObject: monkeyGuide.attentionRoot, layoutReference: 'ANCHOR_MONKEY', runtimeReference: monkeyMotionRoot });
  const speechProxy = sceneLayout.getNode('PROXY_MONKEY_SPEECH_MAX_ENVELOPE');
  apply({
    anchor: speechProxy ? 'PROXY_MONKEY_SPEECH_MAX_ENVELOPE' : 'ANCHOR_MONKEY_SPEECH_BASE',
    target: 'monkeyGuide.messagePanel.group', runtimeObject: monkeyGuide.messagePanel.group,
    layoutReference: 'ANCHOR_MONKEY', runtimeReference: monkeyMotionRoot, fallback: !speechProxy,
    offsetPosition: speechProxy ? null : { x: 0, y: settings.monkeyGuide.message.height / 2, z: 0 }
  });
  apply({ anchor: 'ANCHOR_MONKEY_DIALOGUE', target: 'monkeyGuide.dialoguePanel.group',
    runtimeObject: monkeyGuide.dialoguePanel.group, layoutReference: 'ANCHOR_MONKEY', runtimeReference: monkeyMotionRoot });
  apply({ anchor: 'ANCHOR_PORTAL', target: 'portalDisplay.object', runtimeObject: portalDisplay.object });
  const furnaceApplied = apply({ anchor: 'ANCHOR_FURNACE', target: 'astroFurnace.object', runtimeObject: astroFurnace.object });
  if (furnaceApplied) {
    astroFurnace.object.updateWorldMatrix(true, true);
    astroFurnace.refreshVisibleBounds();
    furnacePanel.place();
  }
  apply({ anchor: 'ANCHOR_RELIQUARY', target: 'crystalReliquary.object', runtimeObject: crystalReliquary.object });
  apply({ anchor: 'ANCHOR_RELIQUARY_BUTTON_ACTIVATE', target: 'activateCompanion.placementRoot',
    runtimeObject: activateCompanion?.placementRoot });
  apply({ anchor: 'ANCHOR_RELIQUARY_BUTTON_RELEASE', target: 'releaseCompanion.placementRoot',
    runtimeObject: releaseCompanion?.placementRoot });
  const floorPivots = { metal: 'PIVOT_FLOOR_METAL', water: 'PIVOT_FLOOR_WATER', wood: 'PIVOT_FLOOR_WOOD',
    fire: 'PIVOT_FLOOR_FIRE', earth: 'PIVOT_FLOOR_EARTH' };
  progressFloor.object.children.filter((object) => object.userData?.branchId).forEach((sector) => {
    apply({ anchor: floorPivots[sector.userData.branchId], target: `floor sector ${sector.userData.branchId}`,
      runtimeObject: sector });
  });
  apply({ anchor: 'ANCHOR_PLAYER_SPAWN', target: 'playerRig', runtimeObject: playerRig, applyRotation: false });

  if (sceneLayoutDebug && !sceneLayoutDebugLogged) {
    sceneLayoutDebugLogged = true;
    console.groupCollapsed('[Experience VR] Blender scene layout prototype');
    console.table(rows);
    console.groupEnd();
  }
  return true;
}

applySceneLayoutPrototype();

const introEntryDirection = new THREE.Vector3(settings.spawn.position.x, 0, settings.spawn.position.z);
if (introEntryDirection.lengthSq() < 1e-6) introEntryDirection.set(0, 0, 1);
introEntryDirection.normalize();
introSequence = createVrIntroSequence({
  monkeyGuide, monkeyMotionRoot, monkeyVisualRoot, platformOrigin, playerRig, glyphRing, progressFloor,
  platformFixturesRoot, locomotion, setMonkeyEmergeAlpha: monkeyActor.setEmergeAlpha,
  ringRadius: glyphOrbit.effectiveRadius, entryDirection: introEntryDirection,
  settings: { ...settings.intro, locale: language }, bypass: introQaBypass,
  getHeadPosition: () => {
    return renderer.xr.getCamera(camera).getWorldPosition(new THREE.Vector3());
  },
  onEndSession: () => { void activeSession?.end(); }
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
  handModeController.update(delta);
  playerGuidePanel.update(delta);
  monkeyGuide.update(delta);
  introSequence.update(delta);
  locomotion.setLeftYawLocked(playerGuidePanel.isOpen());
  astroFurnace.update(delta);
  astroFurnaceOptionInteraction.update(delta);
  astroFurnaceOpenInteraction.update(delta);
  astroFurnaceActivateInteraction.update(delta);
  astroFurnaceContentInteraction.reportHeldShell(shellAttractorInteraction?.heldShell);
  astroFurnaceContentInteraction.update(delta);
  glyphOrbit.update(delta);
  shellSystem.update(delta);
  glyphRing.updateMatrixWorld(true);
  glyphInteraction.update(delta);
  crystalCollection.update(delta);
  progressFloor.update(delta);
  activateButton.update(delta);
  releaseButton.update(delta);
  shellAttractorInteraction.update(delta);
  asterionProductionController.update(delta);
  furnacePanel.update(delta);
  asterionSphere.update(delta);
  asterionGyroInteraction.update(delta);
  vrAudio.setAsterionSphereState({
    equipped: asterionSphere.isEquipped(),
    driveActive: asterionGyroInteraction.isDriveActive()
  });
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
  controls.hidden = false;
  status.textContent = copy.ready;
  enterButton.textContent = ended ? copy.retry : copy.enter;
  enterButton.disabled = false;
  exitButton.hidden = true;
}

function handleSessionEnd() {
  ambientSequencer.reset();
  vrAudio.resetAsterionSphereAudio();
  renderer.setAnimationLoop(null);
  clock.stop();
  activeSession = null;
  astroFurnace.reset();
  furnacePanel.reset();
  playerGuidePanel.reset();
  astroFurnaceOptionInteraction.reset();
  astroFurnaceOpenInteraction.reset();
  astroFurnaceActivateInteraction.reset();
  astroFurnaceContentInteraction.reset();
  crystalCollection.reset();
  activateButton.reset();
  releaseButton.reset();
  crystalReliquary.reset();
  restorePortalWaitingState();
  locomotion.reset();
  resetPlayerRigToSpawn();
  glyphOrbit.reset();
  shellAttractorInteraction.reset();
  shellSystem.reset();
  syncTierOneWorldState();
  glyphLights.reset();
  glyphInteraction.reset();
  vrControllers.reset();
  asterionGyroInteraction.reset();
  asterionSphere.reset();
  asterionProductionController.resetSession();
  handModeController.reset();
  playerGuidePanel.reset();
  applySceneLayoutPrototype();
  monkeyGuide.reset();
  introSequence.reset();
  showReadyState({ ended: hasEnteredSession });
}

async function enterVr() {
  ambientSequencer.reset();
  vrAudio.resetAsterionSphereAudio();
  if (activeSession) return;
  astroFurnace.reset();
  furnacePanel.reset();
  playerGuidePanel.reset();
  astroFurnaceOptionInteraction.reset();
  astroFurnaceOpenInteraction.reset();
  astroFurnaceActivateInteraction.reset();
  astroFurnaceContentInteraction.reset();
  crystalCollection.reset();
  activateButton.reset();
  releaseButton.reset();
  crystalReliquary.reset();
  restorePortalWaitingState();
  locomotion.reset();
  resetPlayerRigToSpawn();
  glyphOrbit.reset();
  shellAttractorInteraction.reset();
  shellSystem.reset();
  syncTierOneWorldState();
  glyphLights.reset();
  glyphInteraction.reset();
  vrControllers.reset();
  asterionGyroInteraction.reset();
  asterionSphere.reset();
  asterionProductionController.resetSession();
  handModeController.reset();
  playerGuidePanel.reset();
  applySceneLayoutPrototype();
  monkeyGuide.reset();
  introSequence.reset();
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
    if (sceneLayout) {
      playerRig.updateWorldMatrix(true, false);
      const alignedRigWorldPosition = playerRig.getWorldPosition(new THREE.Vector3());
      alignedRigWorldPosition.x += alignedRigWorldPosition.x - trackedHead.x;
      alignedRigWorldPosition.z += alignedRigWorldPosition.z - trackedHead.z;
      playerRig.parent.worldToLocal(alignedRigWorldPosition);
      playerRig.position.copy(alignedRigWorldPosition);
    } else {
      const desiredX = playerRig.position.x; const desiredZ = playerRig.position.z;
      playerRig.position.x += desiredX - trackedHead.x;
      playerRig.position.z += desiredZ - trackedHead.z;
    }
    activeSession = requestedSession;
    syncAmbientSequence();
    hasEnteredSession = true;
    status.textContent = copy.ready;
    exitButton.hidden = false;
    controls.hidden = true;
    clock.start();
    renderer.setAnimationLoop(renderFrame);
  } catch (error) {
    console.warn('[experience-vr] Session start failed.', error);
    if (requestedSession && requestedSession !== activeSession) {
      try { await requestedSession.end(); } catch { /* Session may already be ending. */ }
    }
    activeSession = null;
    vrAudio.resetAsterionSphereAudio();
    renderer.setAnimationLoop(null);
    clock.stop();
    astroFurnace.reset();
    furnacePanel.reset();
    playerGuidePanel.reset();
    monkeyGuide.reset();
    introSequence.reset();
    astroFurnaceOptionInteraction.reset();
    astroFurnaceOpenInteraction.reset();
    astroFurnaceActivateInteraction.reset();
    astroFurnaceContentInteraction.reset();
    crystalCollection.reset();
    activateButton.reset();
    releaseButton.reset();
    crystalReliquary.reset();
    restorePortalWaitingState();
    locomotion.reset();
    vrControllers.reset();
    shellAttractorInteraction.reset();
    asterionGyroInteraction.reset();
    asterionSphere.reset();
    asterionProductionController.resetSession();
    handModeController.reset();
    playerGuidePanel.reset();
    controls.hidden = false;
    status.textContent = copy.error;
    enterButton.disabled = false;
    exitButton.hidden = true;
  }
}

enterButton.addEventListener('click', enterVr);
exitButton.addEventListener('click', () => { void activeSession?.end(); });
window.addEventListener('pagehide', () => {
  unsubscribeAmbientFurnace();
  unsubscribeAmbientAsterion();
  ambientSequencer.dispose();
  vrAudio.dispose();
  asterionGyroInteraction.dispose();
  asterionProductionController.dispose();
  asterionSphere.dispose();
  astroFurnaceOpenInteraction.dispose();
  astroFurnaceActivateInteraction.dispose();
  astroFurnaceContentInteraction.dispose();
  astroFurnaceOptionInteraction.dispose();
  playerGuidePanel.dispose();
  monkeyGuide.dispose();
  monkeyActor.disposeEmergenceMaterials();
  furnacePanel.dispose();
  furnaceProgressionController.dispose();
  astroFurnace.dispose();
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
