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
import { createCanonicalXrStartCalibration } from './xr/calibration/createCanonicalXrStartCalibration.js';
import { getXrHeadWorldPosition } from './xr/getXrHeadWorldPosition.js';
import { createVrControllers } from './xr/createVrControllers.js';
import { createVrGlyphInteraction } from './xr/createVrGlyphInteraction.js';
import { createVrGlyphOrbit } from './xr/createVrGlyphOrbit.js';
import { createVrSmallGlyphSystem } from './xr/glyphs/createVrSmallGlyphSystem.js';
import { createVrSmallGlyphAttractorInteraction } from './xr/glyphs/createVrSmallGlyphAttractorInteraction.js';
import { createVrGlyphLights } from './xr/createVrGlyphLights.js';
import { createVrSpatialPlaque } from './xr/createVrSpatialPlaque.js';
import { createVrPortalDisplay } from './xr/createVrPortalDisplay.js';
import { createVrLocomotion } from './xr/createVrLocomotion.js';
import { createVrCrystalCollection } from './xr/createVrCrystalCollection.js';
import { createVrCrystalReliquary } from './xr/createVrCrystalReliquary.js';
import { createVrReliquaryActivateButton } from './xr/createVrReliquaryActivateButton.js';
import { createVrReliquaryReleaseButton } from './xr/createVrReliquaryReleaseButton.js';
import { createVrProgressFloor } from './xr/floor/createVrProgressFloor.js';
import { createVrRuneBridgeActor } from './xr/runes/createVrRuneBridgeActor.js';
import { createVrProgressionController } from './xr/progression/createVrProgressionController.js';
import { createVrFirstRingFlow } from './xr/progression/createVrFirstRingFlow.js';
import { createVrProgressionSemanticHandoff } from './xr/progression/createVrProgressionSemanticHandoff.js';
import { createVrProgressionShortcut } from './xr/progression/applyVrProgressionShortcut.js';
import { createVrShellSystem } from './xr/shells/createVrShellSystem.js';
import { createVrShellAttractorInteraction } from './xr/shells/createVrShellAttractorInteraction.js';
import { createVrSemanticInput } from './xr/input/createVrSemanticInput.js';
import { createVrHandModeController } from './xr/input/createVrHandModeController.js';
import { createVrAttractorTool } from './xr/tools/createVrAttractorTool.js';
import { ASTRO_ATTRACTOR_CONSTRUCTION, createVrAstroAttractorProductionController } from './xr/tools/createVrAstroAttractorProductionController.js';
import { createVrAstroFurnace } from './xr/furnace/createVrAstroFurnace.js';
import { createVrAstroFurnaceOpenInteraction } from './xr/furnace/createVrAstroFurnaceOpenInteraction.js';
import { ASTRO_FURNACE_PROCESS_KINDS, createVrAstroFurnaceActivateInteraction } from './xr/furnace/createVrAstroFurnaceActivateInteraction.js';
import { resolveChamberCylinder } from './xr/furnace/vrAstroFurnaceChamberCylinder.js';
import { ASTRO_FURNACE_ACTIVE_MODE, ASTRO_FURNACE_ASTRO_ATTRACTOR_MODE, createVrAstroFurnaceOptionInteraction } from './xr/furnace/createVrAstroFurnaceOptionInteraction.js';
import { createVrAstroFurnacePanel } from './xr/furnace/createVrAstroFurnacePanel.js';
import { createVrAstroFurnaceProcessSource } from './xr/furnace/createVrAstroFurnaceProcessSource.js';
import { createVrAstroFurnaceProgressionController } from './xr/furnace/createVrAstroFurnaceProgressionController.js';
import { createVrAstroFurnaceContentInteraction } from './xr/furnace/createVrAstroFurnaceContentInteraction.js';
import { createVrProtoAstroTuningController } from './xr/protoAstro/createVrProtoAstroTuningController.js';
import { createVrAsterionSphere } from './xr/asterion/createVrAsterionSphere.js';
import { createVrAsterionGyroInteraction } from './xr/asterion/createVrAsterionGyroInteraction.js';
import { createVrAsterionProductionController } from './xr/asterion/createVrAsterionProductionController.js';
import { createVrPlayerGuidePanel } from './xr/guidance/createVrPlayerGuidePanel.js';
import { createVrPlayerGuideProjection } from './xr/guidance/createVrPlayerGuideProjection.js';
import { createVrMonkeyGuide } from './xr/guidance/createVrMonkeyGuide.js';
import { createVrMonkeyKnowledgeResolver } from './xr/guidance/createVrMonkeyKnowledgeResolver.js';
import { createVrPostRingMonkeyDialogue } from './xr/guidance/createVrPostRingMonkeyDialogue.js';
import { createVrFurnaceIntro } from './xr/guidance/createVrFurnaceIntro.js';
import { createVrIntroSequence } from './xr/guidance/createVrIntroSequence.js';
import { createVrIntroCrystalTutorial } from './xr/guidance/createVrIntroCrystalTutorial.js';
import { createVrIntroFogReveal } from './xr/guidance/createVrIntroFogReveal.js';
import { createVrReliquaryHints } from './xr/guidance/createVrReliquaryHints.js';
import { createVrAudioBridge } from './xr/audio/createVrAudioBridge.js';
import { createVrAmbientSequencer } from './xr/audio/createVrAmbientSequencer.js';
import { createVrIntroAmbientSequencer } from './xr/audio/createVrIntroAmbientSequencer.js';
import { ExperienceDirector } from './xr/progression/ExperienceDirector.js';
import { RuntimeExperience } from './xr/progression/RuntimeExperience.js';
import { stateAtVrScenarioPoint } from './xr/progression/reconstructVrScenarioState.js';
import { hydrateVrScenarioState } from './xr/progression/hydrateVrScenarioState.js';
import { createVrDebugCheckpointController } from './xr/progression/enterVrDebugCheckpoint.js';
import { VR_DEBUG_CHECKPOINTS } from './xr/progression/vrDebugCheckpoints.js';
import { createVrPostRingPresentation } from './xr/progression/createVrPostRingPresentation.js';
import { createVrObservationWindow } from './xr/progression/createVrObservationWindow.js';
import { createVrP2RadialPresentation } from './xr/progression/createVrP2RadialPresentation.js';
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
let runtimeExperience = null;
if (audioControl) app.querySelector('[data-vr-audio-slot]').append(audioControl);
const loadedSettings = await loadExperienceVrSettings({ debug: new URLSearchParams(location.search).has('debug') });
const settings = loadedSettings.settings;
const searchParams = new URLSearchParams(location.search);
const debugCheckpointsEnabled = searchParams.has('debug');
const postP1Qa = searchParams.has('p1');
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
  .filter(({ id }) => id === 'vr-asterion-sphere-model' || id === 'vr-rune-bridge-model' || id === 'gltf-loader-module' || id === 'monkey-model' || id === 'monkey-stone-model' || id === 'vr-portal-model' || id === 'vr-astro-attractor-model' || id === 'vr-astro-furnace-model' || id.startsWith('vr-progress-floor-') || id === 'vr-crystal-reliquary-model' || id.startsWith('vr-crystal-reliquary-button-') || id.startsWith('glyph-') || id.startsWith('vr-crystal-') || id.startsWith('shell-relic-') || id.startsWith('small-glyph-relic-'))
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
const runeBridgeActor = createVrRuneBridgeActor({
  assetManager,
  getSectorMount: (branchId) => progressFloor.getRuneBridgeMount(branchId)
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
monkeyActor.captureScenarioFinalPlacement();
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
  emissionSettings: settings.shellAttractor,
  idleMotionSettings: settings.placedObjectIdleMotion,
  direction: settings.shellFieldMotion.direction });
const smallGlyphOrbitRadius = shellSystem.outerRadius + settings.smallGlyphField.radialLayerGap;
const smallGlyphMaxTargetDistance = glyphOrbit.effectiveRadius
  * settings.shellAttractor.targetDistanceRadiusMultiplier;
if (smallGlyphOrbitRadius > smallGlyphMaxTargetDistance) {
  throw new Error('Small Glyph radial layer exceeds the configured Astrolabium target distance.');
}
const largeGlyphTargetRadius = smallGlyphOrbitRadius + settings.smallGlyphField.radialLayerGap;
const smallGlyphSystem = createVrSmallGlyphSystem({
  parent: worldStableRoot,
  assetManager,
  assetIds: [
    'small-glyph-relic-1',
    'small-glyph-relic-2',
    'small-glyph-relic-3',
    'small-glyph-relic-4',
    'small-glyph-relic-5',
    'small-glyph-relic-6'
  ],
  copiesPerVisualVariant: settings.smallGlyphField.copiesPerVisualVariant,
  center: { x: 0, y: settings.spatial.worldStableCenterY, z: 0 },
  orbitRadius: smallGlyphOrbitRadius,
  orbitAngularSpeed: settings.smallGlyphField.orbitAngularSpeed,
  selfRotationSpeed: settings.smallGlyphField.selfRotationSpeed,
  direction: settings.smallGlyphField.direction,
  materializeDurationSeconds: settings.smallGlyphField.materializeDurationSeconds,
  staggerSeconds: settings.smallGlyphField.staggerSeconds,
  idleMotionSettings: settings.placedObjectIdleMotion,
  onPresentationCompleted: () => runtimeExperience.dispatch(
    VR_SCENARIO_EVENT.SMALL_GLYPH_FIELD_PRESENTATION_COMPLETED
  )
});
const protoAstroTuningController = createVrProtoAstroTuningController();
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
  onClaimed: () => runtimeExperience.dispatch(VR_SCENARIO_EVENT.ASTERION_CLAIMED),
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
function resetPortalBaseline() {
  portalDisplay.resetBaseline();
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
  playerRig, renderer, camera, settings: settings.locomotion, surfaceRoot: progressFloor.object,
  walkRadius: floorWalkRadius, scenarioGlyphRingRadius: floorWalkRadius
});
const progressionController = createVrProgressionController({ pages: experienceVrPages });
const ambientSequencer = createVrAmbientSequencer({ bridge: vrAudio });
const introAmbientSequencer = createVrIntroAmbientSequencer({ bridge: vrAudio });
function syncAmbientSequence() {
  const fullThreshold = progressionController.getCurrentTier();
  const shellsComplete = furnaceProgressionController.getAsterionSphereProgress().complete;
  const sphereBuilt = asterionProductionController.getSnapshot().built;
  ambientSequencer.setState({ fullThreshold, asterionSubthreshold: fullThreshold === 2 && shellsComplete && sphereBuilt });
}
function synchronizeReconstructionDerivedState() {
  syncAmbientSequence();
  shellSystem.applyAbsorbedShellIds(furnaceProgressionController.getAbsorbedShellIds());
}
const firstRingFlow = createVrFirstRingFlow({
  progressFloor,
  dispatch: (event, payload) => runtimeExperience.dispatch(event, payload)
});
const progressionSemanticHandoff = createVrProgressionSemanticHandoff({
  dispatch: (event, payload) => runtimeExperience.dispatch(event, payload),
  syncAmbientSequence
});
const unsubscribeAmbientFurnace = furnaceProgressionController.subscribe(syncAmbientSequence);
const unsubscribeAmbientAsterion = asterionProductionController.subscribe(syncAmbientSequence);
function syncQaPostP1WorldState() {
  if (postP1Qa) shellSystem.setActive(true);
}
function resetPlayerRigToSpawn() {
  if (playerRig.parent !== floorPassengerRoot) floorPassengerRoot.add(playerRig);
  playerRig.position.copy(playerRigSpawnLocalPosition);
  playerRig.quaternion.copy(playerRigSpawnLocalQuaternion);
  playerRig.scale.copy(playerRigSpawnLocalScale);
}
function spawnPlayerInsideRingFacingMonkey() {
  const monkeyLocal = monkeyMotionRoot.position.clone();
  const ringCenterLocal = new THREE.Vector3(0, monkeyLocal.y, 0);
  const towardCenter = ringCenterLocal.sub(monkeyLocal).setY(0);
  if (towardCenter.lengthSq() < 1e-8) towardCenter.copy(entryDirection).negate().setY(0);
  const spawnLocal = monkeyLocal.clone().addScaledVector(towardCenter.normalize(), 3);
  locomotion.teleportLocal(spawnLocal, monkeyLocal);
}
const attractorTool = createVrAttractorTool({ model: assetManager.cloneGltfScene('vr-astro-attractor-model') });
const semanticInput = createVrSemanticInput({ renderer });
let shellAttractorInteraction = null;
let smallGlyphAttractorInteraction = null;
const handModeController = createVrHandModeController({
  controllers: vrControllers.controllers,
  semanticInput,
  attractorTool,
  asterionSphere,
  isUnlocked: () => introQaBypass || runtimeExperience.can(VR_SCENARIO_CAPABILITY.CAN_EQUIP_ASTRO),
  canSwitchAttractorBand: () => runtimeExperience?.can(
    VR_SCENARIO_CAPABILITY.CAN_SWITCH_ASTRO_BAND
  ) === true,
  isAsterionAvailable: () => asterionProductionController.isEarned() || asterionSphereQa,
  isLeftToolToggleBlocked: () => {
    const leftRecord = vrControllers.controllers.find(({ handedness }) => handedness === 'left') ?? null;
    return playerGuidePanel.isOpen() || shellAttractorInteraction?.isHeldBy(leftRecord) === true
      || smallGlyphAttractorInteraction?.isHeldBy(leftRecord) === true;
  }
});
asterionProductionController.setHandModeController(handModeController);
const astroAttractorProductionController = createVrAstroAttractorProductionController({
  model: assetManager.cloneGltfScene('vr-astro-attractor-model'),
  contentAnchor: astroFurnace.nodes.VR_FURNACE_CONTENT_ANCHOR,
  chamber: astroFurnace.nodes.komora,
  chamberCylinder: resolveChamberCylinder(astroFurnace.nodes.komora, settings.furnace.content.chamberClearance),
  energyCell: astroFurnace.nodes.energy_cell ?? astroFurnace.nodes.fire_cell,
  controllers: vrControllers.controllers,
  processDriver: {
    startConstruction: (kind) => astroFurnaceActivateInteraction?.startConstruction?.(kind) === true,
    canStartConstruction: (kind) => astroFurnaceActivateInteraction?.canStartConstruction?.(kind) === true,
    getProgress: () => astroFurnaceActivateInteraction?.getProgress?.() ?? 0,
    getProcessKind: () => astroFurnaceActivateInteraction?.getProcessKind?.() ?? null
  },
  getChamberState: () => astroFurnaceOpenInteraction?.getState?.() ?? 'CLOSED',
  getRightMode: () => handModeController.getRightMode(),
  canRequest: () => runtimeExperience.can(VR_SCENARIO_CAPABILITY.CAN_START_FURNACE_PROCESS),
  settings: { ...settings.asterionSphere.production, contentClearance: settings.furnace.content.contentClearance },
  haloSettings: settings.targetHalo,
  onProduced: () => runtimeExperience.dispatch(VR_SCENARIO_EVENT.ASTRO_ATTRACTOR_PRODUCED),
  onClaimed: () => { runtimeExperience.dispatch(VR_SCENARIO_EVENT.ASTRO_ATTRACTOR_CLAIMED);
    handModeController.equipRightAstro(); }
});
const playerGuideProjection = createVrPlayerGuideProjection({
  locale: language,
  getCurrentPointId: () => runtimeExperience?.getCurrentPointId(),
  can: (capability) => runtimeExperience?.can(capability) === true,
  getActivatedPageIds: () => progressionController.getActivatedPageIds()
});
const playerGuidePanel = createVrPlayerGuidePanel({
  leftGrip: vrControllers.controllers[0]?.grip,
  semanticInput,
  locale: language,
  settings: settings.playerGuidePanel,
  projection: playerGuideProjection,
  onOpenChange: (open) => playVrUi(open ? VR_AUDIO.playerOpen : VR_AUDIO.playerClose),
  onPanelClick: () => playVrUi(VR_AUDIO.click),
  debugCheckpoints: debugCheckpointsEnabled ? VR_DEBUG_CHECKPOINTS : [],
  onDebugCheckpoint: (checkpointId) => enterVrDebugCheckpoint?.(checkpointId)
});
const monkeyKnowledgeResolver = createVrMonkeyKnowledgeResolver({
  locale: language,
  hasAstroKnowledge: () => runtimeExperience?.can(
    VR_SCENARIO_CAPABILITY.CAN_EQUIP_ASTRO
  ) === true,
  hasAstroBandSwitchKnowledge: () => runtimeExperience?.can(
    VR_SCENARIO_CAPABILITY.CAN_SWITCH_ASTRO_BAND
  ) === true,
  hasAsterionKnowledge: () => runtimeExperience?.can(
    VR_SCENARIO_CAPABILITY.CAN_EQUIP_ASTERION
  ) === true
});
const monkeyGuide = createVrMonkeyGuide({
  actorRoot: monkeyMotionRoot,
  floorRoot: progressFloor.object,
  visualRoot: monkeyVisualRoot,
  interactionRoot: monkeyInteractionRoot,
  controllers: vrControllers.controllers,
  progressionController,
  knowledgeResolver: monkeyKnowledgeResolver,
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
let introCrystalTutorial = null;
let astroFurnaceActivateInteraction = null;
let astroFurnaceContentInteraction = null;
let astroFurnaceOptionInteraction = null;
const furnacePanel = createVrAstroFurnacePanel({
  parent: platformFixturesRoot, furnace: astroFurnace, controllers: vrControllers.controllers,
  progressionController: furnaceProgressionController, productionController: asterionProductionController,
  astroProductionController: astroAttractorProductionController,
  canUseAstroProduction: () => runtimeExperience?.can(
    VR_SCENARIO_CAPABILITY.CAN_START_FURNACE_PROCESS
  ) === true,
  canUseAstroTuning: () => runtimeExperience?.can(
    VR_SCENARIO_CAPABILITY.CAN_EXTRACT_SMALL_GLYPH_ESSENCE
  ) === true && astroAttractorProductionController?.getState?.() === 'EARNED',
  requestAstroProduction: () => runtimeExperience.dispatch(
    VR_SCENARIO_EVENT.ASTRO_ATTRACTOR_PRODUCTION_REQUESTED
  ) !== null,
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
  isModeActive: () => [ASTRO_FURNACE_ACTIVE_MODE, ASTRO_FURNACE_ASTRO_ATTRACTOR_MODE].includes(astroFurnaceOptionInteraction?.getActiveMode?.()),
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
  isModeActive: () => [ASTRO_FURNACE_ACTIVE_MODE, ASTRO_FURNACE_ASTRO_ATTRACTOR_MODE]
    .includes(astroFurnaceOptionInteraction?.getActiveMode?.()),
  getExtractionProcessKind: () => astroFurnaceContentInteraction?.getInsertedContentKind?.() === 'SMALL_GLYPH'
    ? ASTRO_FURNACE_PROCESS_KINDS.SMALL_GLYPH_ESSENCE_EXTRACTION
    : ASTRO_FURNACE_PROCESS_KINDS.SHELL_EXTRACTION,
  qaAllowWithoutInput: furnaceProcessQa,
  isOrdinaryRayAvailable: ordinaryFurnaceRayAvailable,
  onProcessStart: ({ processKind }) => [ASTRO_FURNACE_PROCESS_KINDS.ASTERION_CONSTRUCTION, ASTRO_ATTRACTOR_CONSTRUCTION].includes(processKind)
    ? vrAudio.startAsterionCreate() : vrAudio.startFurnaceProcess(),
  onProcessStop: ({ processKind }) => [ASTRO_FURNACE_PROCESS_KINDS.ASTERION_CONSTRUCTION, ASTRO_ATTRACTOR_CONSTRUCTION].includes(processKind)
    ? vrAudio.stopAsterionCreate() : vrAudio.stopFurnaceProcess()
});
astroFurnaceContentInteraction = createVrAstroFurnaceContentInteraction({
  furnace: astroFurnace, shellSystem, smallGlyphSystem, protoAstroTuningController,
  openInteraction: astroFurnaceOpenInteraction,
  activateInteraction: astroFurnaceActivateInteraction, progressionController: furnaceProgressionController,
  isModeActive: () => astroFurnaceOptionInteraction?.getActiveMode?.() === ASTRO_FURNACE_ACTIVE_MODE,
  controllers: vrControllers.controllers, settings: settings.furnace.content,
  takeHeldShell: (shell) => shellAttractorInteraction?.transferHeldShell(shell) === true,
  takeHeldSmallGlyph: (glyph) => smallGlyphAttractorInteraction?.transferHeldGlyph(glyph) === true,
  isSmallGlyphModeActive: () => astroFurnaceOptionInteraction?.getActiveMode?.() === ASTRO_FURNACE_ASTRO_ATTRACTOR_MODE,
  canExtractSmallGlyphEssence: () => runtimeExperience?.can(
    VR_SCENARIO_CAPABILITY.CAN_EXTRACT_SMALL_GLYPH_ESSENCE
  ) === true
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
  canUseReliquary: () => runtimeExperience.can(VR_SCENARIO_CAPABILITY.CAN_USE_RELIQUARY),
  onInsertAccepted: () => playVrWorld(VR_AUDIO.reliquaryInsert),
  canGrabController: (record) => {
    if (record.handedness === 'right' && handModeController.getRightMode() === 'ASTRO_ATTRACTOR') return false;
    if (asterionSphere.isEquipped() && record.handedness === 'left') return false;
    if (astroFurnaceOpenInteraction.hasCurrentHit(record)) return false;
    if (astroFurnaceActivateInteraction.hasCurrentHit(record)) return false;
    if (astroFurnaceOptionInteraction.hasCurrentHit(record) || furnacePanel.hasCurrentHit(record)) return false;
    if (monkeyGuide.hasCurrentHit(record)) return false;
    if (shellAttractorInteraction?.hasCurrentShellHit(record)) return false;
    if (smallGlyphAttractorInteraction?.hasCurrentSmallGlyphHit(record)
      || smallGlyphAttractorInteraction?.isHeldBy(record)) return false;
    return true;
  },
  onPreview: (page) => runtimeExperience.dispatch(VR_SCENARIO_EVENT.CRYSTAL_ACTIVATED, { page }),
  onCommit: progressionSemanticHandoff.onPageCommitted
});
createVrProgressionShortcut({ search: location.search, pages: experienceVrPages, progressionController,
  progressFloor, syncQaPostP1WorldState })();
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
  settings: { ...settings.shellAttractor, scanCone: { ...settings.shellAttractor.scanCone,
    color: settings.attractorPresentation.bandColors.shells } },
  haloSettings: settings.targetHalo, settledParent: worldStableRoot,
  crystalHeldByController: crystalCollection.heldByController,
  isControllerOccupiedByOtherInteraction: (record) => smallGlyphAttractorInteraction?.isHeldBy(record) === true,
  canScanShells: () => runtimeExperience?.can(VR_SCENARIO_CAPABILITY.CAN_SCAN_SHELLS) === true,
  canTargetShells: () => runtimeExperience?.can(VR_SCENARIO_CAPABILITY.CAN_TARGET_SHELLS) === true,
  onPullStart: ({ target }) => vrAudio.startAttractor(target.userData.attractorId, 'shell'),
  onPullCancel: ({ target }) => vrAudio.cancelAttractor(target.userData.attractorId),
  onHandoff: ({ target }) => vrAudio.handoffAttractor(target.userData.attractorId),
  isHigherPriorityInteractionActive: (record) => Boolean(activateButton.hits.get(record)
    || releaseButton.hits.get(record) || astroFurnaceOpenInteraction.hasCurrentHit(record)
    || astroFurnaceActivateInteraction.hasCurrentHit(record) || astroFurnaceOptionInteraction.hasCurrentHit(record)
    || furnacePanel.hasCurrentHit(record) || monkeyGuide.hasCurrentHit(record) || record.currentHit)
});
smallGlyphAttractorInteraction = createVrSmallGlyphAttractorInteraction({
  controllers: vrControllers.controllers,
  smallGlyphSystem,
  handModeController,
  semanticInput,
  attractorTool,
  maxTargetDistance: smallGlyphMaxTargetDistance,
  settings: {
    scanThreshold: settings.shellAttractor.scanThreshold,
    triggerThreshold: settings.shellAttractor.triggerThreshold,
    captureForwardDistance: settings.shellAttractor.shellCaptureForwardDistance,
    pullAcceleration: settings.shellAttractor.pullAcceleration,
    maxPullSpeed: settings.shellAttractor.maxPullSpeed,
    captureRadius: settings.shellAttractor.captureRadius,
    returnDuration: settings.shellAttractor.returnDuration,
    scanCone: { ...settings.shellAttractor.scanCone,
      color: settings.attractorPresentation.bandColors.smallGlyphs }
  },
  haloSettings: settings.targetHalo,
  settledParent: worldStableRoot,
  canScanSmallGlyphs: () => runtimeExperience?.can(
    VR_SCENARIO_CAPABILITY.CAN_SCAN_SMALL_GLYPHS
  ) === true,
  canTargetSmallGlyphs: () => runtimeExperience?.can(
    VR_SCENARIO_CAPABILITY.CAN_TARGET_SMALL_GLYPHS
  ) === true,
  canPullSmallGlyphs: () => runtimeExperience?.can(
    VR_SCENARIO_CAPABILITY.CAN_PULL_SMALL_GLYPHS
  ) === true,
  isControllerOccupiedByOtherInteraction: (record) => crystalCollection.heldByController.has(record)
    || shellAttractorInteraction?.isHeldBy(record) === true,
  isHigherPriorityInteractionActive: (record) => Boolean(
    activateButton.hits.get(record)
    || releaseButton.hits.get(record)
    || astroFurnaceOpenInteraction.hasCurrentHit(record)
    || astroFurnaceActivateInteraction.hasCurrentHit(record)
    || astroFurnaceOptionInteraction.hasCurrentHit(record)
    || furnacePanel.hasCurrentHit(record)
    || monkeyGuide.hasCurrentHit(record)
    || record.currentHit
  )
});

const introFogReveal = createVrIntroFogReveal({
  center: progressFloor.object,
  roots: [monkeyVisualRoot, glyphRing, monkeyStoneRoot],
  revealTarget: monkeyVisualRoot,
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
introCrystalTutorial = createVrIntroCrystalTutorial({
  monkeyGuide,
  monkeyRoot: monkeyMotionRoot,
  getWorldPointAtRadius: (radius, options) => introSequence.getWorldPointAtRadius(radius, options),
  crystalCollection,
  crystalDefinition: experienceVrPages.find((page) => page.glyphId === 'haiku-cosmos' && page.order === 1),
  settings: { ...settings.introCrystalTutorial, messageDisplayDuration: settings.intro.messageDisplayDuration },
  locale: language,
  playConsume: () => playVrWorld(VR_AUDIO.reliquaryConsume),
  onHandoffRequested: () => runtimeExperience.dispatch(VR_SCENARIO_EVENT.INTRO_CRYSTAL_HANDOFF_REQUESTED),
  onCompleted: () => runtimeExperience.dispatch(VR_SCENARIO_EVENT.INTRO_CRYSTAL_TUTORIAL_COMPLETED)
});

const experienceDirector = new ExperienceDirector({ scenario: vrExperienceScenario });
const postRingPresentation = createVrPostRingPresentation({ glyphRing, shellSystem,
  settings: settings.postRingPresentation,
  onCompleted: () => runtimeExperience.dispatch(VR_SCENARIO_EVENT.POST_RING_WORLD_PRESENTATION_COMPLETED)
});
const p2RadialPresentation = createVrP2RadialPresentation({
  glyphOrbit,
  getTargetRadius: () => largeGlyphTargetRadius,
  durationSeconds: settings.p2RadialPresentation.durationSeconds,
  onCompleted: () => runtimeExperience.dispatch(VR_SCENARIO_EVENT.P2_RADIAL_PRESENTATION_COMPLETED)
});
const observationWindow = createVrObservationWindow({
  durationSeconds: settings.observationWindow.durationSeconds,
  onCompleted: () => runtimeExperience.dispatch(VR_SCENARIO_EVENT.OBSERVATION_WINDOW_COMPLETED)
});
const postRingMonkeyDialogue = createVrPostRingMonkeyDialogue({
  monkeyGuide,
  secondsPerLine: settings.intro.messageDisplayDuration,
  onCompleted: () => runtimeExperience.dispatch(VR_SCENARIO_EVENT.POST_RING_MONKEY_DIALOGUE_COMPLETED)
});
const furnaceIntro = createVrFurnaceIntro({
  monkeyGuide,
  secondsPerLine: settings.intro.messageDisplayDuration,
  revealFurnace: () => { astroFurnace.object.visible = true; return true; },
  onCompleted: () => runtimeExperience.dispatch(VR_SCENARIO_EVENT.FURNACE_INTRO_COMPLETED)
});
runtimeExperience = new RuntimeExperience({
  director: experienceDirector,
  pointLifecycle: {
    stateAt: (pointId) => stateAtVrScenarioPoint(vrExperienceScenario, pointId),
    hydrate: (state) => hydrateVrScenarioState(state, scenarioOwners),
    restoreBaseline: restoreVrScenarioBaseline,
    synchronize: synchronizeReconstructionDerivedState,
    createDirector: (pointId) => new ExperienceDirector({ scenario: vrExperienceScenario, startPointId: pointId })
  },
  effectHandlers: {
    [VR_SCENARIO_EFFECT.SET_INTRO_AMBIENT_01]: () => { introAmbientSequencer.setCue('01'); },
    [VR_SCENARIO_EFFECT.SET_INTRO_AMBIENT_02]: () => { introAmbientSequencer.setCue('02'); },
    [VR_SCENARIO_EFFECT.SET_INTRO_AMBIENT_03]: () => { introAmbientSequencer.setCue('03'); },
    [VR_SCENARIO_EFFECT.SET_INTRO_AMBIENT_04]: () => { introAmbientSequencer.setCue('04'); },
    [VR_SCENARIO_EFFECT.SET_INTRO_AMBIENT_05]: () => { introAmbientSequencer.setCue('05'); },
    [VR_SCENARIO_EFFECT.BEGIN_MAIN_AMBIENT_SEQUENCE]: () => {
      introAmbientSequencer.stop();
      ambientSequencer.enable();
    },
    [VR_SCENARIO_EFFECT.BEGIN_INTRO_REVEAL]: () => {
      if (!introSequence.beginIntroReveal()) {
        throw new Error('BEGIN_INTRO_REVEAL rejected by Intro actor after accepted Scenario point activation');
      }
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
    [VR_SCENARIO_EFFECT.BEGIN_INTRO_CRYSTAL_TUTORIAL]: () => {
      if (!introCrystalTutorial.begin()) throw new Error('BEGIN_INTRO_CRYSTAL_TUTORIAL rejected by tutorial actor');
    },
    [VR_SCENARIO_EFFECT.ACCEPT_INTRO_CRYSTAL_HANDOFF]: () => {
      if (!introCrystalTutorial.acceptHandoff()) throw new Error('ACCEPT_INTRO_CRYSTAL_HANDOFF rejected by tutorial actor');
    },
    [VR_SCENARIO_EFFECT.BEGIN_INTRO_INVITATION]: () => {
      if (!introSequence.beginInvitation()) throw new Error('BEGIN_INTRO_INVITATION rejected by Intro actor');
    },
    [VR_SCENARIO_EFFECT.CONTINUE_INTRO_INVITATION]: (change, payload) => {
      if (!introSequence.continueInvitation(payload.choice)) {
        throw new Error('CONTINUE_INTRO_INVITATION rejected by Intro actor after accepted Scenario transition');
      }
    },
    [VR_SCENARIO_EFFECT.START_MONKEY_FOLLOW]: () => {
      if (!introSequence.startMonkeyFollow()) {
        throw new Error('START_MONKEY_FOLLOW rejected by Intro actor after accepted Scenario point activation');
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
    [VR_SCENARIO_EFFECT.BEGIN_THRESHOLD_CROSSING]: () => {
      if (!introSequence.beginThresholdCrossing()) {
        throw new Error('BEGIN_THRESHOLD_CROSSING rejected by Intro actor after accepted Scenario point activation');
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
    [VR_SCENARIO_EFFECT.BEGIN_RELIQUARY_REVEAL]: () => {
      if (!introSequence.beginReliquaryReveal()) {
        throw new Error('BEGIN_RELIQUARY_REVEAL rejected by Intro actor after accepted Scenario transition');
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
    },
    [VR_SCENARIO_EFFECT.BEGIN_FIRST_RING_PRESENTATION]: () => {
      firstRingFlow.beginPresentation();
    },
    [VR_SCENARIO_EFFECT.PLAY_FIRST_RING_COMPLETE_FEEDBACK]: () => {
      playVrWorld(VR_AUDIO.tierComplete);
    },
    [VR_SCENARIO_EFFECT.APPLY_TIER_COMPLETE_FEEDBACK]: (change, payload) => {
      if (!Number.isInteger(payload?.tier)) {
        throw new Error('APPLY_TIER_COMPLETE_FEEDBACK requires an integer completed tier');
      }
      if (!progressFloor.completeTier(payload.tier)) {
        throw new Error(`Progress floor rejected accepted canonical Tier ${payload.tier} completion`);
      }
      playVrWorld(VR_AUDIO.tierComplete);
    },
    [VR_SCENARIO_EFFECT.BEGIN_P2_RADIAL_PRESENTATION]: () => {
      if (!p2RadialPresentation.begin()) {
        throw new Error('BEGIN_P2_RADIAL_PRESENTATION rejected by P2 radial presentation actor');
      }
    },
    [VR_SCENARIO_EFFECT.BEGIN_SMALL_GLYPH_FIELD_PRESENTATION]: () => {
      if (!smallGlyphSystem.beginPresentation()) {
        throw new Error('BEGIN_SMALL_GLYPH_FIELD_PRESENTATION rejected by small glyph field actor');
      }
    },
    [VR_SCENARIO_EFFECT.REVEAL_SHELL_FIELD_PRESENTATION]: () => {
      postRingPresentation.revealShellField();
    },
    [VR_SCENARIO_EFFECT.ELEVATE_MAIN_GLYPHS]: () => {
      postRingPresentation.elevateMainGlyphs();
    },
    [VR_SCENARIO_EFFECT.BEGIN_OBSERVATION_WINDOW]: () => { observationWindow.begin(); },
    [VR_SCENARIO_EFFECT.BEGIN_MONKEY_ATTENTION]: () => { postRingMonkeyDialogue.begin(); },
    [VR_SCENARIO_EFFECT.BEGIN_FURNACE_INTRO]: () => {
      if (!furnaceIntro.begin()) throw new Error('BEGIN_FURNACE_INTRO rejected by Furnace intro actor');
    },
    [VR_SCENARIO_EFFECT.BEGIN_ASTRO_ATTRACTOR_CONSTRUCTION]: () => {
      if (!astroAttractorProductionController.beginConstruction()) {
        throw new Error('BEGIN_ASTRO_ATTRACTOR_CONSTRUCTION accepted Scenario command rejected by Astro production actor');
      }
    },
    [VR_SCENARIO_EFFECT.ENABLE_SHELL_FIELD_INTERACTION]: () => {
      if (!postRingPresentation.enableShellFieldInteraction()) {
        throw new Error('ENABLE_SHELL_FIELD_INTERACTION rejected by post-ring owner');
      }
    }
  }
});

const scenarioOwners = Object.freeze({
  monkey: monkeyActor, intro: introSequence, locomotion, reliquary: crystalReliquary,
  portal: portalDisplay,
  progression: progressionController, progressFloor, crystals: crystalCollection,
  postRing: postRingPresentation, p2World: p2RadialPresentation, smallGlyphField: smallGlyphSystem,
  furnace: astroFurnace, furnaceProgression: furnaceProgressionController,
  astroProduction: astroAttractorProductionController, asterionProduction: asterionProductionController,
  protoAstroTuning: protoAstroTuningController
});
const enterVrDebugCheckpoint = createVrDebugCheckpointController({
  scenario: vrExperienceScenario,
  owners: scenarioOwners,
  restoreBaseline: restoreVrScenarioBaseline,
  synchronizeDerivedState: synchronizeReconstructionDerivedState,
  runtime: runtimeExperience,
  spawnIntro: resetPlayerRigToSpawn,
  spawnRing: spawnPlayerInsideRingFacingMonkey,
  requestCanonicalXrStartCalibration: () => xrStartCalibration.request()
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
const readTrackedXrHead = () => getXrHeadWorldPosition({ renderer, camera, playerRig });
const xrStartCalibration = createCanonicalXrStartCalibration({
  readTrackedHead: readTrackedXrHead,
  calibrate: (headWorldPosition) => calibrateXrHeadToPlatform({
    playerRig, headWorldPosition, platformRoot: progressFloor.object, entryDirection,
    targetRadius: settings.spatial.playerStartRadius
  }),
  confirmCalibration: readTrackedXrHead,
  onCalibrated: () => runtimeExperience.dispatch(VR_SCENARIO_EVENT.XR_CALIBRATED)
});

function renderFrame() {
  const delta = clock.getDelta();
  if (xrStartCalibration.processFrame()) {
    renderer.render(scene, camera);
    return;
  }
  vrControllers.beginRayHitFrame();
  handModeController.update(delta);
  playerGuidePanel.update(delta);
  monkeyGuide.update(delta);
  introSequence.update(delta);
  introCrystalTutorial.update(delta);
  crystalReliquary.update(delta);
  portalDisplay.update(delta);
  locomotion.setLeftYawLocked(playerGuidePanel.isOpen());
  astroFurnace.update(delta);
  astroFurnaceOptionInteraction.update(delta);
  astroFurnaceOpenInteraction.update(delta);
  astroFurnaceActivateInteraction.update(delta);
  astroFurnaceContentInteraction.reportHeldShell(shellAttractorInteraction?.heldShell);
  astroFurnaceContentInteraction.reportHeldSmallGlyph(smallGlyphAttractorInteraction?.heldGlyph);
  astroFurnaceContentInteraction.update(delta);
  glyphOrbit.update(delta);
  postRingPresentation.update(delta);
  p2RadialPresentation.update(delta);
  smallGlyphSystem.update(delta);
  observationWindow.update(delta);
  postRingMonkeyDialogue.update(delta);
  furnaceIntro.update(delta);
  shellSystem.update(delta);
  glyphRing.updateMatrixWorld(true);
  glyphInteraction.update(delta);
  crystalCollection.update(delta);
  reliquaryHints.update(delta);
  progressFloor.update(delta);
  firstRingFlow.update(delta);
  activateButton.update(delta);
  releaseButton.update(delta);
  shellAttractorInteraction.update(delta);
  smallGlyphAttractorInteraction.update(delta);
  asterionProductionController.update(delta);
  astroAttractorProductionController.update(delta);
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

// Canonical preparation of the already-bootstrapped runtime for authored point 1.10.
// Keep lifecycle teardown (XR session, render loop, clock and UI) outside this function:
// restoring the Scenario baseline must never recreate or dispose application objects.
function restoreVrScenarioBaseline() {
  runtimeExperience.resetSession();
  ambientSequencer.reset();
  introAmbientSequencer.reset();
  vrAudio.resetAsterionSphereAudio();
  astroFurnace.resetBaseline();
  furnaceProgressionController.resetBaseline();
  furnacePanel.reset();
  playerGuidePanel.reset();
  astroFurnaceOptionInteraction.reset();
  astroFurnaceOpenInteraction.reset();
  astroFurnaceActivateInteraction.reset();
  astroFurnaceContentInteraction.reset();
  protoAstroTuningController.resetBaseline();
  crystalCollection.reset();
  reliquaryHints.reset();
  activateButton.reset();
  releaseButton.reset();
  crystalReliquary.reset();
  resetPortalBaseline();
  locomotion.resetScenarioBaseline();
  resetPlayerRigToSpawn();
  progressionController.reset();
  progressFloor.reset();
  runeBridgeActor.reset();
  glyphOrbit.reset();
  p2RadialPresentation.reset();
  smallGlyphAttractorInteraction.reset();
  smallGlyphSystem.reset();
  postRingPresentation.reset();
  firstRingFlow.reset();
  observationWindow.reset();
  shellAttractorInteraction.reset();
  shellSystem.reset();
  syncQaPostP1WorldState();
  glyphLights.reset();
  glyphInteraction.reset();
  vrControllers.reset();
  asterionGyroInteraction.reset();
  asterionSphere.reset();
  asterionProductionController.resetBaseline();
  astroAttractorProductionController.resetBaseline();
  handModeController.reset();
  postRingMonkeyDialogue.reset();
  furnaceIntro.reset();
  monkeyGuide.reset();
  platformFixturesRoot.visible = true;
  glyphRing.visible = true;
  monkeyStoneRoot.visible = true;
  monkeyVisualRoot.visible = true;
  introSequence.reset();
  introCrystalTutorial.reset();
}

function handleSessionEnd() {
  renderer.setAnimationLoop(null);
  clock.stop();
  activeSession = null;
  xrStartCalibration.cancel();
  restoreVrScenarioBaseline();
  showReadyState({ ended: hasEnteredSession });
}

async function enterVr() {
  if (activeSession) return;
  restoreVrScenarioBaseline();
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
    runtimeExperience.activateCurrentPoint();
    xrStartCalibration.request();
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
    xrStartCalibration.cancel();
    renderer.setAnimationLoop(null);
    clock.stop();
    restoreVrScenarioBaseline();
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
  introCrystalTutorial.dispose();
  introFogReveal.dispose();
  unsubscribeAmbientFurnace();
  unsubscribeAmbientAsterion();
  ambientSequencer.dispose();
  introAmbientSequencer.dispose();
  vrAudio.dispose();
  asterionGyroInteraction.dispose();
  asterionProductionController.dispose();
  astroAttractorProductionController.dispose();
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
  smallGlyphAttractorInteraction.dispose();
  handModeController.dispose();
  activateButton.reset();
  releaseButton.reset();
  activateButton.dispose();
  releaseButton.dispose();
  crystalCollection.dispose();
  crystalReliquary.dispose();
  runeBridgeActor.dispose();
  progressFloor.dispose();
  postRingPresentation.dispose();
  smallGlyphSystem.dispose();
  shellSystem.dispose();
  protoAstroTuningController.dispose();
}, { once: true });
showReadyState();
