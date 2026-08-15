import * as THREE from './vendor/three.js';
import { resolvePortfolioNodes } from './content/resolvePortfolioNodes.js';
import { createCentralObject } from './scene/centralObject.js';
import { addLights } from './scene/lights.js';
import { loadMonkeyModel } from './scene/monkeyModel.js';
import { createOrbitNodes } from './scene/orbitNodes.js';
import { createAssetManager } from './assets/assetManager.js';
import { createLoadingDiagnostics, preloadAssets } from './assets/preloadAssets.js';
import { ASSET_STAGES, getPreloadAssets, INITIAL_PRELOAD_GROUPS, DEFERRED_PRELOAD_GROUPS } from './assets/assetManifest.js';
import { loadExperienceVrSettings, VR_BACKGROUND_COLOR } from './config/experienceVrSettings.js';
import { orientPlayerRig } from './xr/playerRigOrientation.js';
import { calibrateXrHeadToPlatform } from './xr/calibration/calibrateXrHeadToPlatform.js';
import { getXrHeadWorldPosition } from './xr/getXrHeadWorldPosition.js';
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
import { createVrProgressFloor } from './xr/floor/createVrProgressFloor.js';
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
import { createVrIntroSequence } from './xr/guidance/createVrIntroSequence.js';
import { createVrIntroFogReveal } from './xr/guidance/createVrIntroFogReveal.js';
import { createVrReliquaryHints } from './xr/guidance/createVrReliquaryHints.js';
import { createVrAudioBridge } from './xr/audio/createVrAudioBridge.js';
import { createVrAmbientSequencer } from './xr/audio/createVrAmbientSequencer.js';
import { ExperienceDirector } from './xr/progression/ExperienceDirector.js';
import { RuntimeExperience } from './xr/progression/RuntimeExperience.js';
import { VR_SCENARIO_CAPABILITY, VR_SCENARIO_EFFECT, VR_SCENARIO_EVENT, vrExperienceScenario } from './xr/progression/vrExperienceScenario.js';
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
    crystalInstructionTitle: 'Portal czeka', crystalInstructionBody: 'Osadź kryształ w naczyniu.'
  },
  en: {
    title: 'Experience VR', loading: 'Preparing the minimal VR scene…', ready: 'The scene is ready.',
    enter: 'Enter VR', entering: 'Starting session…', exit: 'Exit VR', retry: 'Enter VR again',
    error: 'The VR session could not be started. You can try again.',
    controllersAlt: 'VR controller instructions',
    crystalInstructionTitle: 'The portal is waiting', crystalInstructionBody: 'Place the crystal in the vessel.'
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
const furnaceProcessQa = searchParams.has('furnaceProcess');
const introQaBypass = ['p1', 'asterionSphere', 'furnaceProcess', 'furnace']
  .some((key) => searchParams.has(key));
const renderer = new THREE.WebGLRenderer({ canvas, antialias: settings.renderer.antialias });
renderer.setPixelRatio(Math.min(devicePixelRatio || 1, settings.renderer.pixelRatioCap));
renderer.xr.enabled = true;

const scene = new THREE.Scene();
scene.background = new THREE.Color(VR_BACKGROUND_COLOR);
const experienceRoot = new THREE.Group();
experienceRoot.name = 'ExperienceVrRoot';
scene.add(experienceRoot);
const worldStableRoot = new THREE.Group();
worldStableRoot.name = 'WorldStableRoot';
experienceRoot.add(worldStableRoot);
const entryDirection = new THREE.Vector3(
  settings.spatial.entryDirection.x, settings.spatial.entryDirection.y, settings.spatial.entryDirection.z
).normalize();
const camera = new THREE.PerspectiveCamera(55, 1, 0.1, 100);
const playerRig = new THREE.Group();
playerRig.name = 'VrPlayerRig';
playerRig.position.copy(entryDirection).multiplyScalar(settings.spatial.playerStartRadius);
camera.position.set(0, 1.6, 0);
playerRig.add(camera);
orientPlayerRig(playerRig, settings.spatial.monkeyFinal);
const vrControllers = createVrControllers({ renderer, playerRig, settings: settings.controllers });

addLights(scene);
const centralPlaceholder = createCentralObject();
worldStableRoot.add(centralPlaceholder);

const asterionSphereQa = settings.asterionSphere.enabled && searchParams.has(settings.asterionSphere.qaQueryParam);
const vrAssets = getPreloadAssets([...INITIAL_PRELOAD_GROUPS, ...DEFERRED_PRELOAD_GROUPS])
  .filter(({ id }) => id === 'vr-asterion-sphere-model' || id === 'gltf-loader-module' || id === 'monkey-model' || id === 'monkey-stone-model' || id === 'vr-portal-model' || id === 'vr-astro-attractor-model' || id === 'vr-astro-furnace-model' || id.startsWith('vr-progress-floor-') || id === 'vr-crystal-reliquary-model' || id.startsWith('vr-crystal-reliquary-button-') || id.startsWith('glyph-') || id.startsWith('vr-crystal-') || id.startsWith('shell-relic-'))
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
  parent: experienceRoot,
  creativeSectorModel: assetManager.cloneGltfScene('vr-progress-floor-creative-model'),
  ethicsSectorModel: assetManager.cloneGltfScene('vr-progress-floor-ethics-model'),
  haikuSectorModel: assetManager.cloneGltfScene('vr-progress-floor-haiku-model'),
  digSectorModel: assetManager.cloneGltfScene('vr-progress-floor-dig-model'),
  aiGuideSectorModel: assetManager.cloneGltfScene('vr-progress-floor-ai-guide-model')
});
const platformFixturesRoot = new THREE.Group();
platformFixturesRoot.name = 'VrPlatformFixturesRoot';
platformFixturesRoot.position.set(0, 0, 0);
platformFixturesRoot.quaternion.identity();
platformFixturesRoot.scale.set(1, 1, 1);
progressFloor.object.add(platformFixturesRoot);
const floorPassengerRoot = new THREE.Group();
floorPassengerRoot.name = 'VrFloorPassengerRoot';
floorPassengerRoot.position.set(0, 0, 0);
floorPassengerRoot.quaternion.identity();
floorPassengerRoot.scale.set(1, 1, 1);
progressFloor.object.add(floorPassengerRoot);
floorPassengerRoot.add(playerRig);
const monkeyActor = await loadMonkeyModel({ actorParent: progressFloor.object, fixtureParent: progressFloor.object,
  fallbackObject: centralPlaceholder, assetManager });
const { motionRoot: monkeyMotionRoot, visualRoot: monkeyVisualRoot, interactionRoot: monkeyInteractionRoot,
  stoneRoot: monkeyStoneRoot, model: monkeyModel } = monkeyActor;
monkeyMotionRoot.position.set(settings.spatial.monkeyFinal.x, settings.spatial.monkeyFinal.y, settings.spatial.monkeyFinal.z);
monkeyActor.dockCharacterToStone();
const resolvedPortfolioNodes = resolvePortfolioNodes(language);
const { group: glyphRing, nodes } = createOrbitNodes(resolvedPortfolioNodes, { assetManager });
worldStableRoot.add(glyphRing);
const glyphOrbit = createVrGlyphOrbit({ nodes, center: new THREE.Vector3(0, settings.spatial.worldStableCenterY, 0),
  settings: settings.glyphRing, entryDirection, radius: settings.spatial.ringRadius });
const floorWalkRadius = glyphOrbit.effectiveRadius;
const playerRigSpawnLocalPosition = playerRig.position.clone();
const playerRigSpawnLocalQuaternion = playerRig.quaternion.clone();
const playerRigSpawnLocalScale = playerRig.scale.clone();
const shellSystem = createVrShellSystem({ parent: worldStableRoot, assetManager, baseRadius: glyphOrbit.effectiveRadius,
  centerY: settings.spatial.worldStableCenterY,
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
  sphere: asterionSphere, controllers: vrControllers.controllers, progressFloor, worldRoot: worldStableRoot, renderer,
  settings: settings.asterionSphere, enabled: settings.asterionSphere.enabled
});
const glyphLights = createVrGlyphLights({ nodes, settings: settings.glyphLights });
const portalDisplay = createVrPortalDisplay({
  parent: platformFixturesRoot,
  portalModel: assetManager.cloneGltfScene('vr-portal-model'), settings: settings.portal
});
const astroFurnaceGltf = assetManager.getGltf('vr-astro-furnace-model');
const astroFurnace = createVrAstroFurnace({
  parent: platformFixturesRoot,
  model: assetManager.cloneGltfScene('vr-astro-furnace-model'),
  animations: astroFurnaceGltf?.animations ?? [],
  settings: settings.furnace
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
const crystalReliquary = createVrCrystalReliquary({
  parent: platformFixturesRoot,
  portalAnchor: portalDisplay.object,
  reliquaryModel: assetManager.cloneGltfScene('vr-crystal-reliquary-model'),
  settings: settings.reliquary
});
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
  if (playerRig.parent !== floorPassengerRoot) floorPassengerRoot.add(playerRig);
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
  floorRoot: progressFloor.object,
  visualRoot: monkeyVisualRoot,
  interactionRoot: monkeyInteractionRoot,
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
  parent: platformFixturesRoot, furnace: astroFurnace, controllers: vrControllers.controllers,
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
  onPreview: (page) => runtimeExperience.dispatch(VR_SCENARIO_EVENT.CRYSTAL_ACTIVATED, { page }),
  onCommit: (page, { tierCompleted }) => {
    runtimeExperience.dispatch(VR_SCENARIO_EVENT.CARD_COMMITTED, { page });
    if (tierCompleted) {
      if (page.order === 1) runtimeExperience.dispatch(VR_SCENARIO_EVENT.FIRST_RING_COMPLETED, { page });
      progressFloor.completeTier(page.order);
      syncTierOneWorldState();
      syncAmbientSequence();
      playVrWorld(VR_AUDIO.tierComplete);
    }
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
  canActivate: () => (introQaBypass
    || runtimeExperience.can(VR_SCENARIO_CAPABILITY.CAN_ACTIVATE_RELIQUARY))
    && crystalReliquary.isInteractionEnabled()
    && crystalCollection.getInsertedInstance()?.state === 'inserted',
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
  canRelease: () => (introQaBypass
    || runtimeExperience.can(VR_SCENARIO_CAPABILITY.CAN_RELEASE_RELIQUARY))
    && crystalReliquary.isInteractionEnabled()
    && crystalCollection.getInsertedInstance()?.state === 'active',
  onRelease: () => {
    return crystalCollection.releaseInserted();
  },
  onReleaseComplete: () => activateButton.reset()
});
const reliquaryHints = createVrReliquaryHints({
  monkeyGuide, locale: language, getInsertedInstance: () => crystalCollection.getInsertedInstance(),
  onHintTimeout: () => runtimeExperience.dispatch(VR_SCENARIO_EVENT.RELIQUARY_HINT_TIMEOUT)
});
function getNextCrystalTier(node) {
  const branchId = node?.userData?.id;
  return [...getExperienceVrPages(branchId)].sort((a, b) => a.order - b.order)
    .find((page) => !progressionController.hasActivatedPage(page.id)
      && !crystalCollection.instances.some((instance) => instance.branchId === branchId
        && instance.tier === page.order && instance.state !== 'released'))?.order ?? null;
}
function isGlyphActive(node) {
  const introAllowsGameplay = introQaBypass || runtimeExperience.can(VR_SCENARIO_CAPABILITY.CAN_USE_GLYPHS);
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
    progressFloor.object.updateWorldMatrix(true, false);
    const glyphWorldPosition = node.getWorldPosition(new THREE.Vector3());
    const centerWorldPosition = progressFloor.object.getWorldPosition(new THREE.Vector3());
    const crystal = crystalCollection.spawnOne(node.userData.id, { glyphWorldPosition, centerWorldPosition });
    if (crystal) {
      runtimeExperience.dispatch(VR_SCENARIO_EVENT.FIRST_CRYSTAL_DISCOVERED);
      vrAudio.completeGlyphAcquisition(node.userData.id, GLYPH_COMPLETION_AUDIO[node.userData.id]?.[tier - 1]);
    }
  }
});
shellAttractorInteraction = createVrShellAttractorInteraction({
  controllers: vrControllers.controllers, shellSystem, handModeController, semanticInput, attractorTool,
  settings: settings.shellAttractor, haloSettings: settings.targetHalo, settledParent: worldStableRoot,
  crystalHeldByController: crystalCollection.heldByController,
  onPullStart: ({ target }) => vrAudio.startAttractor(target.userData.attractorId, 'shell'),
  onPullCancel: ({ target }) => vrAudio.cancelAttractor(target.userData.attractorId),
  onHandoff: ({ target }) => vrAudio.handoffAttractor(target.userData.attractorId),
  isHigherPriorityInteractionActive: (record) => Boolean(activateButton.hits.get(record)
    || releaseButton.hits.get(record) || astroFurnaceOpenInteraction.hasCurrentHit(record)
    || astroFurnaceActivateInteraction.hasCurrentHit(record) || astroFurnaceOptionInteraction.hasCurrentHit(record)
    || furnacePanel.hasCurrentHit(record) || monkeyGuide.hasCurrentHit(record) || record.currentHit)
});

const introFogReveal = createVrIntroFogReveal({
  center: progressFloor.object,
  roots: [monkeyVisualRoot, glyphRing, monkeyStoneRoot],
  color: VR_BACKGROUND_COLOR,
  duration: settings.intro.introRevealDuration
});

introSequence = createVrIntroSequence({
  monkeyGuide, monkeyMotionRoot, monkeyVisualRoot, monkeyStoneRoot, playerRig, glyphRing, progressFloor,
  platformFixturesRoot, locomotion, playerGuidePanel, fogReveal: introFogReveal,
  spatial: settings.spatial,
  settings: { ...settings.intro, locale: language }, bypass: introQaBypass,
  onIntroRevealComplete: () => runtimeExperience.dispatch(VR_SCENARIO_EVENT.INTRO_REVEAL_COMPLETE),
  onPostRevealSilenceComplete: () => runtimeExperience.dispatch(VR_SCENARIO_EVENT.POST_REVEAL_SILENCE_COMPLETE),
  onPlayerOpenedGuide: () => runtimeExperience.dispatch(VR_SCENARIO_EVENT.PLAYER_OPENED_GUIDE),
  onPlayerViewedControls: () => runtimeExperience.dispatch(VR_SCENARIO_EVENT.PLAYER_VIEWED_CONTROLS),
  onPlayerClosedGuide: () => runtimeExperience.dispatch(VR_SCENARIO_EVENT.PLAYER_CLOSED_GUIDE),
  onMonkeyHovered: () => runtimeExperience.dispatch(VR_SCENARIO_EVENT.MONKEY_HOVERED),
  onMonkeyTriggered: () => runtimeExperience.dispatch(VR_SCENARIO_EVENT.MONKEY_TRIGGERED),
  onInvitationSelected: (choice) => runtimeExperience.dispatch(VR_SCENARIO_EVENT.INTRO_INVITATION_SELECTED, { choice }),
  onFollowPauseChanged: (paused) => runtimeExperience.dispatch(VR_SCENARIO_EVENT.FOLLOW_PAUSE_CHANGED, { paused }),
  onMonkeyReachedThreshold: () => runtimeExperience.dispatch(VR_SCENARIO_EVENT.MONKEY_REACHED_THRESHOLD),
  onThresholdSelected: (choice) => runtimeExperience.dispatch(VR_SCENARIO_EVENT.THRESHOLD_SELECTED, { choice }),
  onPlayerEnteredRing: (crossing) => runtimeExperience.dispatch(VR_SCENARIO_EVENT.PLAYER_ENTERED_RING, crossing),
  onMonkeySettled: (crossing) => runtimeExperience.dispatch(VR_SCENARIO_EVENT.MONKEY_SETTLED, crossing),
  onGlyphHintTimeout: () => runtimeExperience.dispatch(VR_SCENARIO_EVENT.GLYPH_HINT_TIMEOUT),
  onReliquaryRevealCompleted: () => runtimeExperience.dispatch(VR_SCENARIO_EVENT.RELIQUARY_REVEAL_COMPLETED),
  onOpeningRaysReady: () => vrControllers.setRaysEnabled(true),
  onProgressionFixturesHidden: () => { portalDisplay.hide(); astroFurnace.object.visible = false; crystalReliquary.reset(); },
  onBypassFixturesVisible: () => { restorePortalWaitingState(); astroFurnace.reset(); crystalReliquary.reveal(0); },
  onReliquaryReveal: (duration) => {
    portalDisplay.reveal(duration);
    crystalReliquary.reveal(duration);
    portalCanvas.show(
      { title: copy.crystalInstructionTitle, body: copy.crystalInstructionBody },
      { duration, animateScale: false }
    );
  },
  getHeadPosition: () => {
    return getXrHeadWorldPosition({ renderer, camera, playerRig });
  },
  onEndSession: () => { void activeSession?.end(); }
});

const experienceDirector = new ExperienceDirector({ scenario: vrExperienceScenario });
const runtimeExperience = new RuntimeExperience({
  director: experienceDirector,
  effectHandlers: {
    [VR_SCENARIO_EFFECT.BEGIN_INTRO_REVEAL]: () => {
      introSequence.beginAfterXrCalibration();
      if (introQaBypass) vrControllers.setRaysEnabled(true);
    },
    [VR_SCENARIO_EFFECT.BEGIN_POST_REVEAL_SILENCE]: () => {
      if (!introSequence.beginPostRevealSilence()) {
        throw new Error('BEGIN_POST_REVEAL_SILENCE rejected by Intro actor after accepted Scenario transition');
      }
    },
    [VR_SCENARIO_EFFECT.BEGIN_CONTROLLER_ONBOARDING]: () => {
      if (!introSequence.beginControllerOnboarding()) {
        throw new Error('BEGIN_CONTROLLER_ONBOARDING rejected by Intro actor after accepted Scenario transition');
      }
    },
    [VR_SCENARIO_EFFECT.CONTINUE_CONTROLLER_ONBOARDING]: () => {
      if (!introSequence.continueControllerOnboarding()) {
        throw new Error('CONTINUE_CONTROLLER_ONBOARDING rejected by Intro actor after accepted Scenario transition');
      }
    },
    [VR_SCENARIO_EFFECT.CONTINUE_INTRO_INVITATION]: (change, payload) => {
      if (!introSequence.continueInvitation(payload.choice)) {
        throw new Error('CONTINUE_INTRO_INVITATION rejected by Intro actor after accepted Scenario transition');
      }
    },
    [VR_SCENARIO_EFFECT.APPLY_FOLLOW_PAUSE_STATE]: (change, payload) => {
      if (!introSequence.continueFollowPauseChanged(payload.paused)) {
        throw new Error('APPLY_FOLLOW_PAUSE_STATE rejected by Intro actor after accepted Scenario transition');
      }
    },
    [VR_SCENARIO_EFFECT.PRESENT_THRESHOLD_CHOICE]: () => {
      if (!introSequence.presentThresholdChoice()) {
        throw new Error('PRESENT_THRESHOLD_CHOICE rejected by Intro actor after accepted Scenario transition');
      }
    },
    [VR_SCENARIO_EFFECT.CONTINUE_THRESHOLD_CHOICE]: (change, payload) => {
      if (!introSequence.continueThresholdChoice(payload.choice)) {
        throw new Error('CONTINUE_THRESHOLD_CHOICE rejected by Intro actor after accepted Scenario transition');
      }
    },
    [VR_SCENARIO_EFFECT.BEGIN_GLYPH_FREE_EXPLORE]: () => {
      if (!introSequence.beginGlyphFreeExplore()) {
        throw new Error('BEGIN_GLYPH_FREE_EXPLORE rejected by Intro actor after accepted Scenario transition');
      }
    },
    [VR_SCENARIO_EFFECT.SHOW_GLYPH_HINT]: () => {
      if (!introSequence.showGlyphHint()) {
        throw new Error('SHOW_GLYPH_HINT rejected by Intro actor after accepted Scenario transition');
      }
    },
    [VR_SCENARIO_EFFECT.REVEAL_RELIQUARY]: () => {
      if (!introSequence.beginFirstCrystalDiscovery()) {
        throw new Error('REVEAL_RELIQUARY rejected by Intro actor after accepted Scenario transition');
      }
    },
    [VR_SCENARIO_EFFECT.COMPLETE_RELIQUARY_REVEAL]: () => {
      if (!introSequence.completeReliquaryReveal()) {
        throw new Error('COMPLETE_RELIQUARY_REVEAL rejected by Intro actor after accepted Scenario transition');
      }
    },
    [VR_SCENARIO_EFFECT.SHOW_RELIQUARY_CONTEXT_HINT]: () => {
      if (!reliquaryHints.showHint()) {
        throw new Error('SHOW_RELIQUARY_CONTEXT_HINT rejected by Guidance actor after accepted Scenario transition');
      }
    },
    [VR_SCENARIO_EFFECT.PRESENT_ACTIVE_CARD_PREVIEW]: (change, payload) => {
      portalCanvas.show(resolveExperienceVrPage(payload.page, language));
    },
    [VR_SCENARIO_EFFECT.UPDATE_COMMITTED_CARD_PRESENTATION]: (change, payload) => {
      progressFloor.activatePage(payload.page);
    },
    [VR_SCENARIO_EFFECT.PLAY_CARD_COMMIT_FEEDBACK]: () => {
      playVrWorld(VR_AUDIO.reliquaryConsume);
    }
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
let xrStartCalibrationPending = false;
const clock = new THREE.Clock(false);

function renderFrame() {
  const delta = clock.getDelta();
  if (xrStartCalibrationPending) {
    const headWorldPosition = getXrHeadWorldPosition({ renderer, camera, playerRig });
    calibrateXrHeadToPlatform({ playerRig, headWorldPosition, platformRoot: progressFloor.object, entryDirection,
      targetRadius: settings.spatial.playerStartRadius });
    getXrHeadWorldPosition({ renderer, camera, playerRig });
    xrStartCalibrationPending = false;
    runtimeExperience.dispatch(VR_SCENARIO_EVENT.XR_CALIBRATED);
    renderer.render(scene, camera);
    return;
  }
  vrControllers.beginRayHitFrame();
  handModeController.update(delta);
  playerGuidePanel.update(delta);
  monkeyGuide.update(delta);
  introSequence.update(delta);
  crystalReliquary.update(delta);
  portalDisplay.update(delta);
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
  reliquaryHints.update(delta);
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
  runtimeExperience.resetSession();
  ambientSequencer.reset();
  vrAudio.resetAsterionSphereAudio();
  renderer.setAnimationLoop(null);
  clock.stop();
  activeSession = null;
  xrStartCalibrationPending = false;
  astroFurnace.reset();
  furnacePanel.reset();
  playerGuidePanel.reset();
  astroFurnaceOptionInteraction.reset();
  astroFurnaceOpenInteraction.reset();
  astroFurnaceActivateInteraction.reset();
  astroFurnaceContentInteraction.reset();
  crystalCollection.reset();
  reliquaryHints.reset();
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
  monkeyGuide.reset();
  introSequence.reset();
  showReadyState({ ended: hasEnteredSession });
}

async function enterVr() {
  ambientSequencer.reset();
  vrAudio.resetAsterionSphereAudio();
  if (activeSession) return;
  runtimeExperience.resetSession();
  astroFurnace.reset();
  furnacePanel.reset();
  playerGuidePanel.reset();
  astroFurnaceOptionInteraction.reset();
  astroFurnaceOpenInteraction.reset();
  astroFurnaceActivateInteraction.reset();
  astroFurnaceContentInteraction.reset();
  crystalCollection.reset();
  reliquaryHints.reset();
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
    xrStartCalibrationPending = true;
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
    xrStartCalibrationPending = false;
    runtimeExperience.resetSession();
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
    reliquaryHints.reset();
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
  runtimeExperience.dispose();
  introFogReveal.dispose();
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
