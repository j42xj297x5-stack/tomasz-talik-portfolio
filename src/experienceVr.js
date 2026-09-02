import * as THREE from './vendor/three.js';
import { resolvePortfolioNodes } from './content/resolvePortfolioNodes.js';
import { createCentralObject } from './scene/centralObject.js';
import { addLights } from './scene/lights.js';
import { loadMonkeyModel } from './scene/monkeyModel.js';
import { createAssetManager } from './assets/assetManager.js';
import { createLoadingDiagnostics, preloadAssets } from './assets/preloadAssets.js';
import { ASSET_STAGES, getPreloadAssets, INITIAL_PRELOAD_GROUPS, DEFERRED_PRELOAD_GROUPS } from './assets/assetManifest.js';
import { loadExperienceVrSettings, VR_BACKGROUND_COLOR } from './config/experienceVrSettings.js';
import { orientPlayerRig } from './xr/playerRigOrientation.js';
import { calibrateXrHeadToPlatform } from './xr/calibration/calibrateXrHeadToPlatform.js';
import { createCanonicalXrStartCalibration } from './xr/calibration/createCanonicalXrStartCalibration.js';
import { getXrHeadWorldPose, getXrHeadWorldPosition } from './xr/getXrHeadWorldPosition.js';
import { createVrControllers } from './xr/createVrControllers.js';
import { createVrGlyphInteraction } from './xr/createVrGlyphInteraction.js';
import { createVrSmallGlyphSystem } from './xr/glyphs/createVrSmallGlyphSystem.js';
import { createVrSmallGlyphAttractorInteraction } from './xr/glyphs/createVrSmallGlyphAttractorInteraction.js';
import { createVrLargeGlyphAttractorInteraction } from './xr/glyphs/createVrLargeGlyphAttractorInteraction.js';
import { createVrLargeGlyphActor } from './xr/glyphs/createVrLargeGlyphActor.js';
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
import { createVrRuneInstallationReadinessProjection } from './xr/runes/createVrRuneInstallationReadinessProjection.js';
import { createVrPlatformEnergyVfxActor } from './xr/vfx/createVrPlatformEnergyVfxActor.js';
import { createVrPlatformEnergyVfxProjection } from './xr/vfx/createVrPlatformEnergyVfxProjection.js';
import { createVrAsterionPlatformEnergyVfxProjection } from './xr/vfx/createVrAsterionPlatformEnergyVfxProjection.js';
import { createVrRuneInstalledStateProjection } from './xr/runes/createVrRuneInstalledStateProjection.js';
import { createVrRuneStoneActor } from './xr/runes/createVrRuneStoneActor.js';
import { createVrRuneStoneAttractorInteraction } from './xr/runes/createVrRuneStoneAttractorInteraction.js';
import { createVrRuneStoneInstallationInteraction } from './xr/runes/createVrRuneStoneInstallationInteraction.js';
import { createVrProgressionController } from './xr/progression/createVrProgressionController.js';
import { createVrFirstRingFlow } from './xr/progression/createVrFirstRingFlow.js';
import { createVrProgressionSemanticHandoff } from './xr/progression/createVrProgressionSemanticHandoff.js';
import { createVrProgressionShortcut } from './xr/progression/applyVrProgressionShortcut.js';
import { createVrShellSystem } from './xr/shells/createVrShellSystem.js';
import { resolveVrSphericalLayerRanges, VR_SPHERICAL_LAYER_IDS } from './xr/world/createVrSphericalLayerActor.js';
import { createVrCelestialActor } from './xr/world/createVrCelestialActor.js';
import { createVrShellAttractorInteraction } from './xr/shells/createVrShellAttractorInteraction.js';
import { createVrSemanticInput } from './xr/input/createVrSemanticInput.js';
import { createVrHandModeController, VR_ATTRACTOR_BANDS } from './xr/input/createVrHandModeController.js';
import { createVrAttractorTool } from './xr/tools/createVrAttractorTool.js';
import { ASTRO_ATTRACTOR_CONSTRUCTION, createVrAstroAttractorProductionController } from './xr/tools/createVrAstroAttractorProductionController.js';
import { createVrAstroFurnace } from './xr/furnace/createVrAstroFurnace.js';
import { createVrAstroFurnaceOpenInteraction } from './xr/furnace/createVrAstroFurnaceOpenInteraction.js';
import { ASTRO_FURNACE_PROCESS_KINDS, createVrAstroFurnaceActivateInteraction } from './xr/furnace/createVrAstroFurnaceActivateInteraction.js';
import { resolveChamberCylinder } from './xr/furnace/vrAstroFurnaceChamberCylinder.js';
import { ASTRO_FURNACE_ACTIVE_MODE, ASTRO_FURNACE_ASTRO_ATTRACTOR_MODE, ASTRO_FURNACE_RUNE_TUNING_MODE, createVrAstroFurnaceOptionInteraction } from './xr/furnace/createVrAstroFurnaceOptionInteraction.js';
import { createVrAstroFurnacePanel } from './xr/furnace/createVrAstroFurnacePanel.js';
import { createVrAstroFurnaceProcessSource } from './xr/furnace/createVrAstroFurnaceProcessSource.js';
import { createVrAstroFurnaceContentSource } from './xr/furnace/createVrAstroFurnaceContentSource.js';
import { createVrAstroFurnaceProgressionController } from './xr/furnace/createVrAstroFurnaceProgressionController.js';
import { createVrAstroFurnaceContentInteraction } from './xr/furnace/createVrAstroFurnaceContentInteraction.js';
import { createVrAstroFurnaceRuneRecipeInteraction } from './xr/furnace/createVrAstroFurnaceRuneRecipeInteraction.js';
import { createVrRuneRecipeSelectionController } from './xr/runes/createVrRuneRecipeSelectionController.js';
import { createVrRuneStoneProgressionController } from './xr/runes/createVrRuneStoneProgressionController.js';
import { createVrRuneStoneAttractorBandProjection } from './xr/runes/createVrRuneStoneAttractorBandProjection.js';
import { createVrRuneTuningController } from './xr/runes/createVrRuneTuningController.js';
import { createVrProtoAstroTuningController } from './xr/protoAstro/createVrProtoAstroTuningController.js';
import { createVrAsterionSphere } from './xr/asterion/createVrAsterionSphere.js';
import { createVrAsterionGyroInteraction } from './xr/asterion/createVrAsterionGyroInteraction.js';
import { createVrAsterionSectorAcquisitionInteraction } from './xr/asterion/createVrAsterionSectorAcquisitionInteraction.js';
import { createVrAsterionSectorControlInteraction } from './xr/asterion/createVrAsterionSectorControlInteraction.js';
import { createVrAsterionSectorAcquisitionPresentation } from './xr/asterion/createVrAsterionSectorAcquisitionPresentation.js';
import { createVrAsterionResonatorFieldActor } from './xr/asterion/createVrAsterionResonatorFieldActor.js';
import { createVrAsterionResonatorFieldPresentation } from './xr/asterion/createVrAsterionResonatorFieldPresentation.js';
import { createVrAsterionResonatorTargetAcquisitionActor } from './xr/asterion/createVrAsterionResonatorTargetAcquisitionActor.js';
import { createVrAsterionResonatorTargetResponsePresentation } from './xr/asterion/createVrAsterionResonatorTargetResponsePresentation.js';
import { resolveVrPageProtoAstro } from './xr/protoAstro/resolveVrPageProtoAstro.js';
import { createVrAsterionProductionController } from './xr/asterion/createVrAsterionProductionController.js';
import { createVrPlayerGuidePanel } from './xr/guidance/createVrPlayerGuidePanel.js';
import { createVrCurrentObjectiveProjection } from './xr/guidance/createVrCurrentObjectiveProjection.js';
import { createVrPlayerGuideProjection } from './xr/guidance/createVrPlayerGuideProjection.js';
import { createVrMonkeyGuide } from './xr/guidance/createVrMonkeyGuide.js';
import { createVrMonkeyKnowledgeResolver } from './xr/guidance/createVrMonkeyKnowledgeResolver.js';
import { createVrMandatoryMonkeyCommunication } from './xr/guidance/createVrMandatoryMonkeyCommunication.js';
import { createVrToolGuidanceLifecycle } from './xr/guidance/createVrToolGuidanceLifecycle.js';
import { createVrEarlyExperienceGuidance } from './xr/guidance/createVrEarlyExperienceGuidance.js';
import { createVrRuneResonatorGuidance } from './xr/guidance/createVrRuneResonatorGuidance.js';
import { VR_MONKEY_COMMUNICATION_COPY_PL } from './xr/guidance/vrMonkeyCommunicationCopy.js';
import { createVrFurnaceIntro } from './xr/guidance/createVrFurnaceIntro.js';
import { createVrIntroSequence } from './xr/guidance/createVrIntroSequence.js';
import { createVrIntroCrystalTutorial } from './xr/guidance/createVrIntroCrystalTutorial.js';
import { createVrIntroFogReveal } from './xr/guidance/createVrIntroFogReveal.js';
import { createVrReliquaryHints } from './xr/guidance/createVrReliquaryHints.js';
import { createVrAudioBridge } from './xr/audio/createVrAudioBridge.js';
import { createVrAstroFurnaceAudioProjection } from './xr/audio/createVrAstroFurnaceAudioProjection.js';
import { createVrRuneStoneAudioProjection, VR_RUNE_STONE_INSTALL_AUDIO } from './xr/audio/createVrRuneStoneAudioProjection.js';
import { BINDER_REVEAL_AUDIO, createVrRuneBinderRevealAudioProjection } from './xr/audio/createVrRuneBinderRevealAudioProjection.js';
import { ASTERION_SECTOR_ACQUISITION_AUDIO, ASTERION_SECTOR_DRIVE_AUDIO,
  createVrAsterionSectorAudioProjection } from './xr/audio/createVrAsterionSectorAudioProjection.js';
import { createVrAmbientSequencer, VR_MAIN_AMBIENT_PROGRAMS } from './xr/audio/createVrAmbientSequencer.js';
import { createVrIntroAmbientSequencer } from './xr/audio/createVrIntroAmbientSequencer.js';
import { ExperienceDirector } from './xr/progression/ExperienceDirector.js';
import { RuntimeExperience } from './xr/progression/RuntimeExperience.js';
import { stateAtVrScenarioPoint } from './xr/progression/reconstructVrScenarioState.js';
import { hydrateVrScenarioState } from './xr/progression/hydrateVrScenarioState.js';
import { createVrDebugCheckpointController } from './xr/progression/enterVrDebugCheckpoint.js';
import { VR_DEBUG_CHECKPOINTS } from './xr/progression/vrDebugCheckpoints.js';
import { createVrPostRingPresentation } from './xr/progression/createVrPostRingPresentation.js';
import { createVrObservationWindow } from './xr/progression/createVrObservationWindow.js';
import { VR_SCENARIO_CAPABILITY, VR_SCENARIO_EFFECT, VR_SCENARIO_EVENT, vrExperienceScenario } from './xr/progression/vrExperienceScenario.js';
import { experienceVrPages, resolveExperienceVrPage } from './content/experienceVrPages.js';
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
  runeTuningProcess: '/audio/astro_piec_work_03.mp3',
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
const REQUIRED_VR_AUDIO = Object.freeze([
  ...Object.values(VR_AUDIO),
  ...Object.values(GLYPH_COMPLETION_AUDIO).flat(),
  ...BINDER_REVEAL_AUDIO,
  ...Object.values(ASTERION_SECTOR_ACQUISITION_AUDIO),
  ...new Set(Object.values(ASTERION_SECTOR_DRIVE_AUDIO))
  , ...VR_RUNE_STONE_INSTALL_AUDIO
]);
const playVrUi = (path) => vrAudio.playOneShot(path, 'UI');
const playVrWorld = (path) => vrAudio.playOneShot(path, 'WORLD');
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
let toolGuidanceLifecycle = null;
let earlyExperienceGuidance = null;
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

const sceneLights = addLights(scene);
const centralPlaceholder = createCentralObject();
worldStableRoot.add(centralPlaceholder);

const asterionSphereQa = settings.asterionSphere.enabled && searchParams.has(settings.asterionSphere.qaQueryParam);
const vrAssets = getPreloadAssets([...INITIAL_PRELOAD_GROUPS, ...DEFERRED_PRELOAD_GROUPS])
  .filter(({ id }) => id === 'sun-model' || id === 'vr-asterion-sphere-model' || id === 'vr-rune-bridge-model' || id === 'gltf-loader-module' || id === 'monkey-model' || id === 'monkey-silhouette-model' || id === 'monkey-stone-model' || id === 'vr-portal-model' || id === 'vr-astro-attractor-model' || id === 'vr-astro-furnace-model' || id.startsWith('vr-progress-floor-') || id === 'vr-crystal-reliquary-model' || id.startsWith('vr-crystal-reliquary-button-') || id.startsWith('glyph-') || id.startsWith('vr-crystal-') || id.startsWith('vr-rune-stone-') || id.startsWith('shell-relic-') || id.startsWith('small-glyph-relic-') || id.startsWith('proto-astro-'))
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
await vrAudio.prepareRuntimeAudio(REQUIRED_VR_AUDIO);
unsubscribe();
const progressFloor = createVrProgressFloor({
  parent: experienceRoot,
  forwardDirection: settings.spatial.entryDirection,
  spatialAudioRadiusMeters: settings.runeStoneSpatialAudio.platformRadiusMeters,
  creativeSectorModel: assetManager.cloneGltfScene('vr-progress-floor-creative-model'),
  ethicsSectorModel: assetManager.cloneGltfScene('vr-progress-floor-ethics-model'),
  haikuSectorModel: assetManager.cloneGltfScene('vr-progress-floor-haiku-model'),
  digSectorModel: assetManager.cloneGltfScene('vr-progress-floor-dig-model'),
  aiGuideSectorModel: assetManager.cloneGltfScene('vr-progress-floor-ai-guide-model')
});
const runeBridgeActor = createVrRuneBridgeActor({
  assetManager,
  getSectorMount: (branchId) => progressFloor.getRuneInstallationFrame(branchId),
  extensionDurationSeconds: settings.runeStoneInstallation.phaseDurationSeconds,
  hoverHeightMeters: settings.runeStoneInstallation.hoverHeightMeters,
  presentationScale: settings.runeBridge.presentationScale,
  radialPresentationOffsetMeters: settings.runeBridge.radialPresentationOffsetMeters,
  arrivalDistanceMeters: settings.runeBridge.arrivalDistanceMeters,
  arrivalDurationSeconds: settings.runeBridge.arrivalDurationSeconds
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
const largeGlyphActor = createVrLargeGlyphActor({
  items: resolvedPortfolioNodes,
  assetManager,
  initialRadius: settings.largeGlyphs.initialRadius,
  worldY: settings.spatial.worldStableCenterY,
  scaleMultiplier: settings.largeGlyphs.scaleMultiplier,
  rotation: settings.largeGlyphs.rotation,
  elevation: settings.largeGlyphs.elevation,
  expansion: settings.largeGlyphs.expansion,
  sphere: settings.largeGlyphs.sphere,
  onExpansionCompleted: () => runtimeExperience.dispatch(
    VR_SCENARIO_EVENT.P2_RADIAL_PRESENTATION_COMPLETED)
});
const { nodes } = largeGlyphActor;
worldStableRoot.add(largeGlyphActor.object);
const worldBaseRadius = settings.spatial.worldBaseRadius;
const floorWalkRadius = worldBaseRadius;
const sphericalLayerRanges = resolveVrSphericalLayerRanges({
  baseRadius: settings.sphericalLayers.innerRadius,
  defaultGapRadiusMultiplier: settings.sphericalLayers.defaultGapRadiusMultiplier,
  layers: [
    { id: VR_SPHERICAL_LAYER_IDS.SHELLS, ...settings.sphericalLayers.shells, status: 'IMPLEMENTED' },
    { id: VR_SPHERICAL_LAYER_IDS.SMALL_GLYPHS, ...settings.sphericalLayers.smallGlyphs, status: 'IMPLEMENTED' },
    { id: VR_SPHERICAL_LAYER_IDS.RUNE_STONES, ...settings.sphericalLayers.runeStones, status: 'IMPLEMENTED' },
    { id: VR_SPHERICAL_LAYER_IDS.STARS, ...settings.sphericalLayers.stars, status: 'IMPLEMENTED' },
    { id: VR_SPHERICAL_LAYER_IDS.HIDDEN_GLYPHS, ...settings.sphericalLayers.hiddenGlyphs, status: 'RESERVED' }
  ]
});
const sphericalLayer = (id) => sphericalLayerRanges.find((range) => range.id === id);
const runeStoneActor = createVrRuneStoneActor({
  parent: worldStableRoot,
  assetManager,
  layer: sphericalLayer(VR_SPHERICAL_LAYER_IDS.RUNE_STONES)
});
const starLayer = sphericalLayer(VR_SPHERICAL_LAYER_IDS.STARS);
const celestialActor = createVrCelestialActor({
  parent: worldStableRoot,
  assetManager,
  keyLight: sceneLights.key,
  layer: starLayer,
  settings: settings.celestial
});
camera.far = Math.max(camera.far, starLayer.outerRadius + 5, celestialActor.requiredCameraFar);
camera.updateProjectionMatrix();
const playerRigSpawnLocalPosition = playerRig.position.clone();
const playerRigSpawnLocalQuaternion = playerRig.quaternion.clone();
const playerRigSpawnLocalScale = playerRig.scale.clone();
const shellSystem = createVrShellSystem({ parent: worldStableRoot, assetManager,
  layer: sphericalLayer(VR_SPHERICAL_LAYER_IDS.SHELLS),
  angularSpeed: settings.sphericalLayers.shells.angularSpeed,
  emissionSettings: settings.shellAttractor,
  idleMotionSettings: settings.placedObjectIdleMotion,
  direction: settings.shellFieldMotion.direction });
const smallGlyphLayer = sphericalLayer(VR_SPHERICAL_LAYER_IDS.SMALL_GLYPHS);
const smallGlyphMaxTargetDistance = smallGlyphLayer.outerRadius;
const largeGlyphMaxTargetDistance = largeGlyphActor.getTargetingRange() + floorWalkRadius;
const runeStoneMaxTargetDistance = sphericalLayer(VR_SPHERICAL_LAYER_IDS.RUNE_STONES).outerRadius;
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
  layer: smallGlyphLayer,
  angularSpeed: settings.sphericalLayers.smallGlyphs.angularSpeed,
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
let monkeyGuide = null;
const asterionGyroInteraction = createVrAsterionGyroInteraction({
  sphere: asterionSphere, controllers: vrControllers.controllers, progressFloor, worldRoot: worldStableRoot, renderer,
  settings: settings.asterionSphere, enabled: settings.asterionSphere.enabled,
  isInteractionBlocked: (record) => monkeyGuide?.hasCurrentHit(record) === true
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
const furnaceAudioProjection = createVrAstroFurnaceAudioProjection({
  audioBridge: vrAudio,
  getEmitterAnchor: () => astroFurnace.getSpatialAudioAnchor(),
  spatialSettings: settings.furnaceSpatialAudio
});
const furnaceProgressionController = createVrAstroFurnaceProgressionController();
const asterionProductionController = createVrAsterionProductionController({
  progressionController: furnaceProgressionController, sphere: asterionSphere,
  productVolume: astroFurnace.nodes.VR_FURNACE_PRODUCT_VOLUME,
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
  onClaimed: () => { runtimeExperience.dispatch(VR_SCENARIO_EVENT.ASTERION_CLAIMED);
    toolGuidanceLifecycle?.notifyAsterionClaimed(); },
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
const runeInstallationReadinessProjection = createVrRuneInstallationReadinessProjection({
  isBranchComplete: (branchId) => progressionController.isBranchComplete(branchId)
});
const platformEnergyVfxActor = createVrPlatformEnergyVfxActor({
  getSectorMount: (branchId) => progressFloor.getSectorEnergyVfxMount(branchId),
  getSectorBounds: (branchId) => progressFloor.getSectorEnergyVfxBounds(branchId),
  runeBridgeActor,
  settings: settings.platformEnergyVfx
});
const platformEnergyVfxProjection = createVrPlatformEnergyVfxProjection({ platformEnergyVfxActor });
const runeBinderRevealAudioProjection = createVrRuneBinderRevealAudioProjection({ audioBridge: vrAudio, runeBridgeActor });
const synchronizeRuneBridgeReadiness = () => runeInstallationReadinessProjection.synchronizeBridges(runeBridgeActor);
function presentLiveRuneBridgeReadinessTransitions() {
  const transitions = runeInstallationReadinessProjection.synchronizeBridges(runeBridgeActor, { live: true });
  platformEnergyVfxProjection.presentReadinessTransitions(transitions);
}
const ambientSequencer = createVrAmbientSequencer({ bridge: vrAudio });
const introAmbientSequencer = createVrIntroAmbientSequencer({ bridge: vrAudio });
const ambientScenarioOwner = Object.freeze({
  hydrateScenarioState(state) {
    if (!state || typeof state !== 'object' || Array.isArray(state)
      || Object.keys(state).length !== 1 || state.mainAmbientActive !== true) {
      throw new TypeError('audio state must be exactly { mainAmbientActive: true }');
    }
    introAmbientSequencer.stop();
  }
});
function synchronizeReconstructionDerivedState() {
  synchronizeRuneBridgeReadiness();
  runeInstalledStateProjection.synchronize();
  runeStoneAudioProjection?.synchronizeInstalledEmitters();
  asterionResonatorFieldActor.synchronize();
  furnacePanel?.redraw();
  shellSystem.applyAbsorbedShellIds(furnaceProgressionController.getAbsorbedShellIds());
}
const firstRingFlow = createVrFirstRingFlow({
  progressFloor,
  dispatch: (event, payload) => runtimeExperience.dispatch(event, payload)
});
const progressionSemanticHandoff = createVrProgressionSemanticHandoff({
  dispatch: (event, payload) => runtimeExperience.dispatch(event, payload)
});
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
const attractorBandPresentations = Object.freeze({
  [VR_ATTRACTOR_BANDS.SHELLS]: { url: publicPath('/svg/band_01.svg'),
    presentationColor: settings.attractorPresentation.bandColors.shells },
  [VR_ATTRACTOR_BANDS.SMALL_GLYPHS]: { url: publicPath('/svg/band_02.svg'),
    presentationColor: settings.attractorPresentation.bandColors.smallGlyphs },
  [VR_ATTRACTOR_BANDS.LARGE_GLYPHS]: { url: publicPath('/svg/band_03.svg'),
    presentationColor: settings.attractorPresentation.bandColors.largeGlyphs },
  [VR_ATTRACTOR_BANDS.RUNESTONES]: { url: publicPath('/svg/band_04.svg'),
    presentationColor: settings.attractorPresentation.bandColors.shells }
});
const semanticInput = createVrSemanticInput({ renderer });
const runeStoneProgressionController = createVrRuneStoneProgressionController();
let previousRuneProgressionSnapshot = runeStoneProgressionController.getSnapshot();
const runeInstalledStateProjection = createVrRuneInstalledStateProjection({
  runeStoneProgressionController, runeStoneActor, runeBridgeActor
});
synchronizeRuneBridgeReadiness();
const runeStoneAttractorBandProjection = createVrRuneStoneAttractorBandProjection({
  runeStoneProgressionController
});
let shellAttractorInteraction = null;
let smallGlyphAttractorInteraction = null;
let largeGlyphAttractorInteraction = null;
let runeStoneAttractorInteraction = null;
let runeStoneAudioProjection = null;
let runeStoneInstallationInteraction = null;
let runeResonatorGuidance = null;
let monkeyKnowledgeResolver = null;
const handModeController = createVrHandModeController({
  controllers: vrControllers.controllers,
  semanticInput,
  attractorTool,
  getAttractorBandPresentation: (band) => attractorBandPresentations[band] ?? attractorBandPresentations.SHELLS,
  asterionSphere,
  isUnlocked: () => introQaBypass || runtimeExperience.can(VR_SCENARIO_CAPABILITY.CAN_EQUIP_ASTRO),
  canSwitchAttractorBand: () => runtimeExperience?.can(
    VR_SCENARIO_CAPABILITY.CAN_SWITCH_ASTRO_BAND
  ) === true,
  getAvailableAttractorBands: () => {
    const bands = [VR_ATTRACTOR_BANDS.SHELLS, VR_ATTRACTOR_BANDS.SMALL_GLYPHS];
    if (runtimeExperience?.can(VR_SCENARIO_CAPABILITY.CAN_SCAN_LARGE_GLYPHS) === true
      && protoAstroTuningController.getExtractedFamilyCodes().length > 0) bands.push(VR_ATTRACTOR_BANDS.LARGE_GLYPHS);
    if (runeStoneAttractorBandProjection.isAvailable()) bands.push(VR_ATTRACTOR_BANDS.RUNESTONES);
    return bands;
  },
  isAsterionAvailable: () => asterionProductionController.isEarned() || asterionSphereQa,
  isLeftToolToggleBlocked: () => {
    const leftRecord = vrControllers.controllers.find(({ handedness }) => handedness === 'left') ?? null;
    return playerGuidePanel.isOpen() || shellAttractorInteraction?.isHeldBy(leftRecord) === true
      || smallGlyphAttractorInteraction?.isHeldBy(leftRecord) === true;
  }
});
const asterionSectorAcquisitionInteraction = createVrAsterionSectorAcquisitionInteraction({
  sphere: asterionSphere,
  controllers: vrControllers.controllers,
  semanticInput,
  progressFloor,
  runeStoneProgressionController,
  isInteractionBlocked: (record) => playerGuidePanel.isOpen() || monkeyGuide?.hasCurrentHit(record) === true
});
const asterionSectorControlInteraction = createVrAsterionSectorControlInteraction({
  controllers: vrControllers.controllers,
  progressFloor,
  sectorAcquisitionInteraction: asterionSectorAcquisitionInteraction,
  settings: settings.asterionSectorControl
});
const asterionSectorAudioProjection = createVrAsterionSectorAudioProjection({
  audioBridge: vrAudio,
  acquisitionInteraction: asterionSectorAcquisitionInteraction,
  sectorControlInteraction: asterionSectorControlInteraction
});
const asterionSectorAcquisitionPresentation = createVrAsterionSectorAcquisitionPresentation({
  parent: scene,
  sphere: asterionSphere,
  acquisitionInteraction: asterionSectorAcquisitionInteraction,
  progressFloor,
  settings: settings.asterionSectorBeam
});
const asterionPlatformEnergyVfxProjection = createVrAsterionPlatformEnergyVfxProjection({
  acquisitionInteraction: asterionSectorAcquisitionInteraction,
  sectorControlInteraction: asterionSectorControlInteraction,
  progressFloor,
  platformEnergyVfxActor
});
const asterionResonatorFieldActor = createVrAsterionResonatorFieldActor({
  runeStoneProgressionController,
  sectorControlInteraction: asterionSectorControlInteraction
});
const asterionResonatorFieldPresentation = createVrAsterionResonatorFieldPresentation({
  parent: progressFloor.getAsterionResonatorFieldFrame(),
  fieldActor: asterionResonatorFieldActor
});
const asterionResonatorTargetAcquisitionActor = createVrAsterionResonatorTargetAcquisitionActor({
  fieldActor: asterionResonatorFieldActor,
  fieldFrame: progressFloor.getAsterionResonatorFieldFrame()
});
largeGlyphActor.nodes.forEach((node) => {
  asterionResonatorTargetAcquisitionActor.registerTarget({ id: node.userData.id, anchor: node });
});
const asterionResonatorTargetResponsePresentation = createVrAsterionResonatorTargetResponsePresentation({
  parent: scene,
  acquisitionActor: asterionResonatorTargetAcquisitionActor,
  getPlayerHeadWorldPosition: (target) => getXrHeadWorldPosition({ renderer, camera, playerRig, target }),
  settings: settings.asterionTargetResponse
});
largeGlyphActor.nodes.forEach((node) => {
  const id = node.userData.id;
  const protoAstro = resolveVrPageProtoAstro({ glyphId: id });
  const signImage = protoAstro ? assetManager.getAssetByPath(protoAstro.descriptor.path)?.image : null;
  if (!protoAstro || !signImage) throw new Error(`Missing prepared canonical Proto-Astro sign image for target: ${id}`);
  const color = settings.asterionTargetResponse.familyColors[protoAstro.descriptor.familyCode];
  asterionResonatorTargetResponsePresentation.registerTarget({ id, anchor: node, protoAstro, signImage, color });
});
const unsubscribeResonatorScenarioHandoff = runeStoneProgressionController.subscribe(() => {
  progressionSemanticHandoff.onResonatorStateChanged(asterionResonatorFieldActor.getDescriptor());
});
const unsubscribeRuneGuidance = runeStoneProgressionController.subscribe((snapshot) => {
  runeResonatorGuidance?.notifyRuneProgression(previousRuneProgressionSnapshot, snapshot);
  previousRuneProgressionSnapshot = snapshot;
});
let previousResonatorDescriptor = asterionResonatorFieldActor.getDescriptor();
const unsubscribeResonatorGuidance = asterionResonatorFieldActor.subscribe((descriptor) => {
  runeResonatorGuidance?.notifyResonatorChanged(previousResonatorDescriptor, descriptor);
  previousResonatorDescriptor = descriptor;
});
const unsubscribeSectorLockGuidance = asterionSectorAcquisitionInteraction.subscribeLocked(() => {
  runeResonatorGuidance?.notifySectorLocked();
});
const unsubscribeRuneBridgeGuidance = runeBridgeActor.subscribe((event) => {
  if (event?.type === 'ARRIVAL_COMPLETED') runeResonatorGuidance?.notifyBridgeTransitions([event]);
});
asterionProductionController.setHandModeController(handModeController);
const astroAttractorProductionController = createVrAstroAttractorProductionController({
  model: assetManager.cloneGltfScene('vr-astro-attractor-model'),
  productVolume: astroFurnace.nodes.VR_FURNACE_PRODUCT_VOLUME,
  controllers: vrControllers.controllers,
  processDriver: {
    startConstruction: (kind) => astroFurnaceActivateInteraction?.startConstruction?.(kind) === true,
    canStartConstruction: (kind) => astroFurnaceActivateInteraction?.canStartConstruction?.(kind) === true,
    getProgress: () => astroFurnaceActivateInteraction?.getProgress?.() ?? 0,
    getProcessKind: () => astroFurnaceActivateInteraction?.getProcessKind?.() ?? null
  },
  getChamberState: () => astroFurnaceOpenInteraction?.getState?.() ?? 'CLOSED',
  getRightMode: () => handModeController.getRightMode(),
  getLeftMode: () => handModeController.getLeftMode(),
  canRequest: () => runtimeExperience.can(VR_SCENARIO_CAPABILITY.CAN_START_FURNACE_PROCESS),
  settings: { ...settings.asterionSphere.production, contentClearance: settings.furnace.content.contentClearance },
  haloSettings: settings.targetHalo,
  onProduced: () => { runtimeExperience.dispatch(VR_SCENARIO_EVENT.ASTRO_ATTRACTOR_PRODUCED);
    toolGuidanceLifecycle?.notifyAstroAvailable(); },
  onClaimed: () => { runtimeExperience.dispatch(VR_SCENARIO_EVENT.ASTRO_ATTRACTOR_CLAIMED);
    toolGuidanceLifecycle?.notifyAstroClaimed();
    handModeController.equipRightAstro(); }
});
const currentObjectiveProjection = createVrCurrentObjectiveProjection({
  locale: language,
  getCurrentPointId: () => runtimeExperience?.getCurrentPointId(),
  getActivatedPageIds: () => progressionController.getActivatedPageIds(),
  getAsterionProductionState: () => asterionProductionController.getState(),
  getAsterionSphereProgress: () => furnaceProgressionController.getAsterionSphereProgress(),
  getExtractedFamilyCodes: () => protoAstroTuningController.getExtractedFamilyCodes(),
  getRuneProgressionSnapshot: () => runeStoneProgressionController.getSnapshot(),
  getResonatorDescriptor: () => asterionResonatorFieldActor.getDescriptor()
});
const playerGuideProjection = createVrPlayerGuideProjection({
  locale: language,
  can: (capability) => runtimeExperience?.can(capability) === true,
  getCurrentObjective: () => currentObjectiveProjection.getCurrentObjective(),
  isFurnaceRevealed: () => astroFurnace.object.visible === true,
  isShellFieldRevealed: () => shellSystem.active === true,
  hasReadRuneStones: () => monkeyKnowledgeResolver?.hasReadStones() === true,
  hasDiscoveredBinders: () => monkeyKnowledgeResolver?.hasDiscoveredBinders() === true,
  hasInstalledRune: () => runeStoneProgressionController.getInstalledFamilyCodes().length > 0
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
monkeyKnowledgeResolver = createVrMonkeyKnowledgeResolver({
  locale: language,
  getCurrentObjective: () => currentObjectiveProjection.getCurrentObjective(),
  isPostRingStoneGuidance: () => runtimeExperience?.getCurrentPointId() === '4.80'
    && asterionResonatorFieldActor.getDescriptor().resonatorExists === false
});
monkeyGuide = createVrMonkeyGuide({
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
  onAttentionStart: () => playVrWorld(VR_AUDIO.monkeyThinking)
});
runeResonatorGuidance = createVrRuneResonatorGuidance({
  monkeyGuide, copy: VR_MONKEY_COMMUNICATION_COPY_PL,
  secondsPerLine: settings.intro.messageDisplayDuration,
  getCurrentPointId: () => runtimeExperience?.getCurrentPointId?.() ?? null,
  getUnresolvedRuneBranchId: () => {
    const stone = runeStoneAttractorInteraction?.getLockedStone?.();
    return stone && runeStoneActor.getState(stone.branchId) === 'CARRIED_ORBIT'
      && runeInstallationReadinessProjection.isInstallationReady(stone.branchId) !== true
      ? stone.branchId : null;
  },
  knowledgeResolver: monkeyKnowledgeResolver
});
toolGuidanceLifecycle = createVrToolGuidanceLifecycle({
  monkeyGuide,
  copy: VR_MONKEY_COMMUNICATION_COPY_PL,
  canStartAstroProduction: () => language === 'pl' && runtimeExperience?.can(
    VR_SCENARIO_CAPABILITY.CAN_START_FURNACE_PROCESS
  ) === true,
  getAstroProductionState: () => astroAttractorProductionController.getState()
});
earlyExperienceGuidance = createVrEarlyExperienceGuidance({
  monkeyGuide,
  copy: VR_MONKEY_COMMUNICATION_COPY_PL,
  getCurrentPointId: () => runtimeExperience?.getCurrentPointId?.() ?? null,
  hasProtoAstroTuning: () => protoAstroTuningController.getExtractedFamilyCodes().length > 0,
  onFirstCrystalResponseCompleted: () => introSequence?.beginFirstCrystalDiscovery()
});
let introSequence = null;
let introCrystalTutorial = null;
let astroFurnaceActivateInteraction = null;
let astroFurnaceContentInteraction = null;
let astroFurnaceOptionInteraction = null;
const runeOpenInteractionSource = { getState: () => astroFurnaceOpenInteraction?.getState?.() ?? 'CLOSED' };
const runeActivateInteractionSource = { getState: () => astroFurnaceActivateInteraction?.getState?.() ?? 'IDLE' };
let runeRecipeSelectionController = null;
const runeRecipeSelectionSource = {
  getExpectedRecipe: () => runeRecipeSelectionController?.getExpectedRecipe?.() ?? null
};
const astroFurnaceRuneRecipeInteraction = createVrAstroFurnaceRuneRecipeInteraction({
  furnace: astroFurnace, shellSystem, smallGlyphSystem,
  openInteraction: runeOpenInteractionSource, activateInteraction: runeActivateInteractionSource,
  isModeActive: () => astroFurnaceOptionInteraction?.getActiveMode?.() === ASTRO_FURNACE_RUNE_TUNING_MODE,
  getExpectedRecipe: runeRecipeSelectionSource.getExpectedRecipe,
  settledParent: worldStableRoot,
  getPlayerWorldPosition: (target) => getXrHeadWorldPosition({ renderer, camera, playerRig, target }),
  settleEjectedSmallGlyph: (glyph) => smallGlyphAttractorInteraction?.settleTransferredGlyph(glyph) === true,
  takeHeldShell: (shell) => shellAttractorInteraction?.transferHeldShell(shell) === true,
  takeHeldSmallGlyph: (glyph) => smallGlyphAttractorInteraction?.transferHeldGlyph(glyph) === true
});
runeRecipeSelectionController = createVrRuneRecipeSelectionController({
  runeRecipeInteraction: astroFurnaceRuneRecipeInteraction,
  runeStoneProgressionController,
  prepareRecipeChange: () => astroFurnaceRuneRecipeInteraction.ejectInsertedIngredients()
});
const runeTuningController = createVrRuneTuningController({
  runeRecipeInteraction: astroFurnaceRuneRecipeInteraction,
  runeRecipeSelectionController,
  runeStoneProgressionController
});
const furnaceContentSource = createVrAstroFurnaceContentSource({
  getInteraction: () => astroFurnaceContentInteraction,
  getChamberState: () => astroFurnaceOpenInteraction?.getState?.() ?? 'CLOSED'
});
const furnacePanel = createVrAstroFurnacePanel({
  parent: platformFixturesRoot, furnace: astroFurnace, controllers: vrControllers.controllers,
  progressionController: furnaceProgressionController, productionController: asterionProductionController,
  astroProductionController: astroAttractorProductionController,
  protoAstroTuningController,
  runeRecipeInteraction: astroFurnaceRuneRecipeInteraction,
  runeRecipeSelectionController,
  runeTuningController,
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
  contentSource: furnaceContentSource,
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
  isModeActive: () => [ASTRO_FURNACE_ACTIVE_MODE, ASTRO_FURNACE_ASTRO_ATTRACTOR_MODE, ASTRO_FURNACE_RUNE_TUNING_MODE]
    .includes(astroFurnaceOptionInteraction?.getActiveMode?.()),
  onOpeningStart: () => {
    astroFurnaceActivateInteraction?.releaseForOpening();
    furnaceAudioProjection.playPhysicalOneShot(VR_AUDIO.chamberOpen);
  },
  onClosingStart: () => furnaceAudioProjection.playPhysicalOneShot(VR_AUDIO.chamberClose)
});
astroFurnaceActivateInteraction = createVrAstroFurnaceActivateInteraction({
  furnace: astroFurnace,
  controllers: vrControllers.controllers,
  settings: settings.furnace.activateButton,
  processSettings: settings.furnace.process,
  haloSettings: settings.targetHalo,
  openInteraction: astroFurnaceOpenInteraction,
  canActivateInput: () => astroFurnaceOptionInteraction?.getActiveMode?.() === ASTRO_FURNACE_RUNE_TUNING_MODE
    ? runeTuningController.canStart()
    : astroFurnaceContentInteraction?.hasValidInsertedContent() === true,
  isModeActive: () => [ASTRO_FURNACE_ACTIVE_MODE, ASTRO_FURNACE_ASTRO_ATTRACTOR_MODE,
    ASTRO_FURNACE_RUNE_TUNING_MODE]
    .includes(astroFurnaceOptionInteraction?.getActiveMode?.()),
  getActivationProcessKind: () => astroFurnaceOptionInteraction?.getActiveMode?.() === ASTRO_FURNACE_RUNE_TUNING_MODE
    ? ASTRO_FURNACE_PROCESS_KINDS.RUNE_TUNING
    : astroFurnaceContentInteraction?.getInsertedContentKind?.() === 'SMALL_GLYPH'
      ? ASTRO_FURNACE_PROCESS_KINDS.SMALL_GLYPH_ESSENCE_EXTRACTION
      : ASTRO_FURNACE_PROCESS_KINDS.SHELL_EXTRACTION,
  qaAllowWithoutInput: furnaceProcessQa,
  isOrdinaryRayAvailable: ordinaryFurnaceRayAvailable,
  onProcessStart: ({ processKind }) => {
    if (processKind === ASTRO_FURNACE_PROCESS_KINDS.RUNE_TUNING) {
      runeTuningController.beginTuning(); furnaceAudioProjection.startProcess('runeTuning'); return;
    }
    if ([ASTRO_FURNACE_PROCESS_KINDS.ASTERION_CONSTRUCTION, ASTRO_ATTRACTOR_CONSTRUCTION].includes(processKind))
      furnaceAudioProjection.startProcess('construction');
    else furnaceAudioProjection.startProcess('ordinary');
  },
  onProcessStop: ({ completed, processKind }) => {
    if (processKind === ASTRO_FURNACE_PROCESS_KINDS.RUNE_TUNING) {
      furnaceAudioProjection.stopProcess('runeTuning');
      if (completed) runeTuningController.completeTuning(); else runeTuningController.abortTuning();
      return;
    }
    if ([ASTRO_FURNACE_PROCESS_KINDS.ASTERION_CONSTRUCTION, ASTRO_ATTRACTOR_CONSTRUCTION].includes(processKind))
      furnaceAudioProjection.stopProcess('construction');
    else furnaceAudioProjection.stopProcess('ordinary');
  }
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
  onCommit: (page, meta) => {
    earlyExperienceGuidance.notifyCardCommitted();
    progressionSemanticHandoff.onPageCommitted(page, meta);
    presentLiveRuneBridgeReadinessTransitions();
  }
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
  const currentTier = progressionController.getCurrentTier();
  const page = progressionController.getNextPage(branchId, currentTier);
  if (!page) return null;
  const hasUnresolvedCrystal = crystalCollection.instances.some((instance) => instance.branchId === branchId
    && instance.tier === currentTier && instance.state !== 'released');
  return hasUnresolvedCrystal ? null : page.order;
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
      earlyExperienceGuidance.notifyCrystalCreated(crystal);
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
  onPullStart: ({ target }) => vrAudio.startAttractor(target.userData.attractorId, 'smallGlyph'),
  onPullCancel: ({ target }) => vrAudio.cancelAttractor(target.userData.attractorId),
  onHandoff: ({ target }) => vrAudio.handoffAttractor(target.userData.attractorId),
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
largeGlyphAttractorInteraction = createVrLargeGlyphAttractorInteraction({
  controllers: vrControllers.controllers, largeGlyphActor, handModeController, semanticInput, attractorTool,
  protoAstroTuningController, maxTargetDistance: largeGlyphMaxTargetDistance,
  settings: { scanThreshold: settings.shellAttractor.scanThreshold,
    triggerThreshold: settings.shellAttractor.triggerThreshold,
    pullAcceleration: settings.shellAttractor.pullAcceleration, maxPullSpeed: settings.shellAttractor.maxPullSpeed,
    captureRadius: settings.shellAttractor.captureRadius, returnDuration: settings.shellAttractor.returnDuration,
    minimumClearance: settings.largeGlyphAttractor.minimumClearance,
    scanCone: { ...settings.shellAttractor.scanCone, color: settings.attractorPresentation.bandColors.largeGlyphs } },
  haloSettings: settings.targetHalo,
  canScanLargeGlyphs: () => runtimeExperience?.can(VR_SCENARIO_CAPABILITY.CAN_SCAN_LARGE_GLYPHS) === true,
  canTargetLargeGlyphs: () => runtimeExperience?.can(VR_SCENARIO_CAPABILITY.CAN_TARGET_LARGE_GLYPHS) === true,
  canPullLargeGlyphs: () => runtimeExperience?.can(VR_SCENARIO_CAPABILITY.CAN_PULL_LARGE_GLYPHS) === true,
  onPullStart: ({ target }) => vrAudio.startAttractor(target.userData.id, 'largeGlyph'),
  onPullCancel: ({ target }) => vrAudio.cancelAttractor(target.userData.id),
  isHigherPriorityInteractionActive: (record) => Boolean(activateButton.hits.get(record)
    || releaseButton.hits.get(record) || astroFurnaceOpenInteraction.hasCurrentHit(record)
    || astroFurnaceActivateInteraction.hasCurrentHit(record) || astroFurnaceOptionInteraction.hasCurrentHit(record)
    || furnacePanel.hasCurrentHit(record) || monkeyGuide.hasCurrentHit(record) || record.currentHit)
});
runeStoneInstallationInteraction = createVrRuneStoneInstallationInteraction({
  runeStoneActor,
  runeBridgeActor,
  runeInstallationReadinessProjection,
  runeStoneProgressionController,
  settings: settings.runeStoneInstallation
});
const listenerPosition = new THREE.Vector3();
const listenerQuaternion = new THREE.Quaternion();
const listenerForward = new THREE.Vector3();
const listenerUp = new THREE.Vector3();
const listenerPose = Object.freeze({ position: listenerPosition, forward: listenerForward, up: listenerUp });
runeStoneAudioProjection = createVrRuneStoneAudioProjection({
  audioBridge: vrAudio, runeStoneActor, runeStoneProgressionController,
  getEmitterAnchor: (branchId) => progressFloor.getRuneStoneSpatialAudioAnchor(branchId),
  spatialSettings: settings.runeStoneSpatialAudio
});
const unsubscribeRuneStoneInstallAudioCue = runeStoneInstallationInteraction
  .subscribeInstallAudioCue((event) => runeStoneAudioProjection.presentInstallAudioCue(event));
const unsubscribeRuneStoneInstalledAudio = runeStoneInstallationInteraction
  .subscribeInstalled((event) => runeStoneAudioProjection.presentInstalled(event));
runeStoneAttractorInteraction = createVrRuneStoneAttractorInteraction({
  controllers: vrControllers.controllers, runeStoneActor, runeStoneAttractorBandProjection,
  handModeController, semanticInput, attractorTool, maxTargetDistance: runeStoneMaxTargetDistance,
  settings: { scanThreshold: settings.shellAttractor.scanThreshold,
    triggerThreshold: settings.shellAttractor.triggerThreshold,
    pullAcceleration: settings.shellAttractor.pullAcceleration,
    maxPullSpeed: settings.shellAttractor.maxPullSpeed,
    handoffRadiusMeters: settings.runeStoneInstallation.handoffRadiusMeters,
    scanCone: { ...settings.shellAttractor.scanCone,
      color: settings.attractorPresentation.bandColors.shells } },
  haloSettings: settings.targetHalo,
  platformCenter: progressFloor.object,
  getPlayerWorldPosition: (target) => getXrHeadWorldPosition({ renderer, camera, playerRig, target }),
  tryBeginInstallationHandoff: (record) => runeStoneInstallationInteraction.tryBeginHandoff(record),
  onPullStart: (record) => vrAudio.startAttractor(record.descriptor.assetIdentity,
    `runeStone${record.descriptor.assetIdentity.slice(-2).replace(/^0/, '')}`),
  onPullCancel: (record) => vrAudio.cancelAttractor(record.descriptor.assetIdentity),
  onHandoff: (record) => vrAudio.handoffAttractor(record.descriptor.assetIdentity),
  isHigherPriorityInteractionActive: (record) => Boolean(activateButton.hits.get(record)
    || releaseButton.hits.get(record) || astroFurnaceOpenInteraction.hasCurrentHit(record)
    || astroFurnaceActivateInteraction.hasCurrentHit(record) || astroFurnaceOptionInteraction.hasCurrentHit(record)
    || furnacePanel.hasCurrentHit(record) || monkeyGuide.hasCurrentHit(record) || record.currentHit)
});

const introFogReveal = createVrIntroFogReveal({
  center: progressFloor.object,
  roots: [monkeyVisualRoot, largeGlyphActor.object, monkeyStoneRoot],
  revealTarget: monkeyVisualRoot,
  color: VR_BACKGROUND_COLOR,
  duration: settings.intro.introRevealDuration
});

introSequence = createVrIntroSequence({
  monkeyGuide, monkeyMotionRoot, monkeyVisualRoot, monkeyStoneRoot, playerRig, largeGlyphActor, progressFloor,
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
  onGlyphHintTimeout: () => {},
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
const postRingPresentation = createVrPostRingPresentation({ largeGlyphActor, shellSystem,
  settings: settings.postRingPresentation,
  onCompleted: () => runtimeExperience.dispatch(VR_SCENARIO_EVENT.POST_RING_WORLD_PRESENTATION_COMPLETED)
});
const observationWindow = createVrObservationWindow({
  durationSeconds: settings.observationWindow.durationSeconds,
  onCompleted: () => runtimeExperience.dispatch(VR_SCENARIO_EVENT.OBSERVATION_WINDOW_COMPLETED)
});
const p2ObservationWindow = createVrObservationWindow({
  durationSeconds: settings.observationWindow.durationSeconds,
  onCompleted: () => runtimeExperience.dispatch(VR_SCENARIO_EVENT.P2_OBSERVATION_WINDOW_COMPLETED)
});
const postRingMonkeyDialogue = createVrMandatoryMonkeyCommunication({ monkeyGuide,
  blocks: VR_MONKEY_COMMUNICATION_COPY_PL.progression['progression.postRing.changedWorld'].blocks,
  secondsPerLine: settings.intro.messageDisplayDuration,
  openMenuOnCompleted: false,
  onTriggered: () => runtimeExperience.dispatch(VR_SCENARIO_EVENT.MONKEY_TRIGGERED),
  onCompleted: () => runtimeExperience.dispatch(VR_SCENARIO_EVENT.POST_RING_MONKEY_DIALOGUE_COMPLETED)
});
const p2MonkeyDialogue = createVrMandatoryMonkeyCommunication({ monkeyGuide,
  blocks: VR_MONKEY_COMMUNICATION_COPY_PL.progression['progression.p2.smallGlyphsIntro'].blocks,
  secondsPerLine: settings.intro.messageDisplayDuration,
  openMenuOnCompleted: false,
  onTriggered: () => runtimeExperience.dispatch(VR_SCENARIO_EVENT.MONKEY_TRIGGERED),
  onCompleted: () => runtimeExperience.dispatch(VR_SCENARIO_EVENT.P2_MONKEY_DIALOGUE_COMPLETED)
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
    [VR_SCENARIO_EFFECT.SET_MAIN_AMBIENT_01]: () => {
      introAmbientSequencer.stop();
      ambientSequencer.setProgram(VR_MAIN_AMBIENT_PROGRAMS.ambient01);
    },
    [VR_SCENARIO_EFFECT.SET_MAIN_AMBIENT_02]: () => { ambientSequencer.setProgram(VR_MAIN_AMBIENT_PROGRAMS.ambient02); },
    [VR_SCENARIO_EFFECT.SET_MAIN_AMBIENT_03]: () => { ambientSequencer.setProgram(VR_MAIN_AMBIENT_PROGRAMS.ambient03); },
    [VR_SCENARIO_EFFECT.SET_MAIN_AMBIENT_04]: () => { ambientSequencer.setProgram(VR_MAIN_AMBIENT_PROGRAMS.ambient04); },
    [VR_SCENARIO_EFFECT.CHECK_RESONATOR_JOIN]: () => {
      progressionSemanticHandoff.onResonatorStateChanged(asterionResonatorFieldActor.getDescriptor());
    },
    [VR_SCENARIO_EFFECT.BEGIN_CELESTIAL_REVEAL]: () => { celestialActor.beginReveal(); },
    [VR_SCENARIO_EFFECT.REVEAL_NATURAL_RUNE_STONES]: () => {
      runeStoneActor.setPresentationVisible(true);
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
      earlyExperienceGuidance.notifyGlyphFreeExploreStarted();
    },
    [VR_SCENARIO_EFFECT.SHOW_GLYPH_HINT]: () => {
      if (!introSequence.showGlyphHint()) {
        throw new Error('SHOW_GLYPH_HINT rejected by Intro actor after accepted Scenario transition');
      }
    },
    [VR_SCENARIO_EFFECT.REVEAL_RELIQUARY]: () => {
      earlyExperienceGuidance.notifyFirstCrystalRevealDue();
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
      earlyExperienceGuidance.notifyReliquaryRevealCompleted();
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
      presentLiveRuneBridgeReadinessTransitions();
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
      if (change.previousPointId === '4.70') runeResonatorGuidance.notifyThirdRingCompleted();
    },
    [VR_SCENARIO_EFFECT.BEGIN_P2_RADIAL_PRESENTATION]: () => {
      if (!largeGlyphActor.beginExpansion()) {
        throw new Error('BEGIN_P2_RADIAL_PRESENTATION rejected by Large Glyph actor');
      }
    },
    [VR_SCENARIO_EFFECT.DISTRIBUTE_LARGE_GLYPHS_ON_SPHERE]: () => {
      if (!largeGlyphActor.beginSphereDistribution()) {
        throw new Error('DISTRIBUTE_LARGE_GLYPHS_ON_SPHERE rejected by Large Glyph actor');
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
    [VR_SCENARIO_EFFECT.BEGIN_MONKEY_ATTENTION]: () => { postRingMonkeyDialogue.beginAttention(); },
    [VR_SCENARIO_EFFECT.BEGIN_POST_RING_MONKEY_DIALOGUE]: () => { postRingMonkeyDialogue.beginPlayback(); },
    [VR_SCENARIO_EFFECT.BEGIN_P2_OBSERVATION_WINDOW]: () => { p2ObservationWindow.begin(); },
    [VR_SCENARIO_EFFECT.BEGIN_P2_MONKEY_ATTENTION]: () => { p2MonkeyDialogue.beginAttention(); },
    [VR_SCENARIO_EFFECT.BEGIN_P2_MONKEY_DIALOGUE]: () => { p2MonkeyDialogue.beginPlayback(); },
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
  postRing: postRingPresentation, largeGlyphs: largeGlyphActor, smallGlyphField: smallGlyphSystem,
  furnace: astroFurnace, furnaceProgression: furnaceProgressionController,
  astroProduction: astroAttractorProductionController, asterionProduction: asterionProductionController,
  protoAstroTuning: protoAstroTuningController,
  audio: ambientScenarioOwner,
  celestial: celestialActor,
  runeStones: runeStoneActor,
  runeProgression: runeStoneProgressionController
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
  asterionSectorAcquisitionInteraction.update(delta);
  asterionSectorControlInteraction.update(delta);
  asterionSectorAcquisitionPresentation.update(delta);
  asterionPlatformEnergyVfxProjection.update(delta);
  asterionResonatorFieldPresentation.update(delta);
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
  astroFurnaceRuneRecipeInteraction.reportHeldShell(shellAttractorInteraction?.heldShell);
  astroFurnaceRuneRecipeInteraction.reportHeldSmallGlyph(smallGlyphAttractorInteraction?.heldGlyph);
  astroFurnaceRuneRecipeInteraction.update(delta);
  largeGlyphActor.update(delta);
  largeGlyphAttractorInteraction.update(delta);
  postRingPresentation.update(delta);
  smallGlyphSystem.update(delta);
  runeStoneActor.update(delta);
  runeStoneAttractorInteraction.update(delta);
  runeBridgeActor.update(delta);
  platformEnergyVfxActor.update(delta);
  runeStoneInstallationInteraction.update(delta);
  if (renderer.xr.isPresenting) {
    getXrHeadWorldPose({
      renderer, camera, playerRig, positionTarget: listenerPosition, quaternionTarget: listenerQuaternion
    });
    listenerForward.set(0, 0, -1).applyQuaternion(listenerQuaternion).normalize();
    listenerUp.set(0, 1, 0).applyQuaternion(listenerQuaternion).normalize();
    vrAudio.setSpatialListenerPose(listenerPose);
  }
  runeStoneAudioProjection.update();
  furnaceAudioProjection.update();
  celestialActor.update(delta);
  observationWindow.update(delta);
  p2ObservationWindow.update(delta);
  postRingMonkeyDialogue.update(delta);
  p2MonkeyDialogue.update(delta);
  furnaceIntro.update(delta);
  shellSystem.update(delta);
  largeGlyphActor.object.updateMatrixWorld(true);
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
  toolGuidanceLifecycle.update(delta);
  earlyExperienceGuidance.update(delta);
  runeResonatorGuidance.update(delta);
  furnacePanel.update(delta);
  asterionSphere.update(delta);
  asterionGyroInteraction.update(delta);
  asterionResonatorTargetAcquisitionActor.update(delta);
  asterionResonatorTargetResponsePresentation.update(delta);
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
  celestialActor.reset();
  // The gyro owns the platform quaternion. Neutralize it before platform fixtures
  // reconstruct their authored local transforms.
  asterionGyroInteraction.reset();
  asterionSectorAcquisitionInteraction.reset();
  asterionSectorControlInteraction.reset();
  asterionSectorAudioProjection.reset();
  asterionSectorAcquisitionPresentation.reset();
  asterionPlatformEnergyVfxProjection.reset();
  ambientSequencer.reset();
  introAmbientSequencer.reset();
  vrAudio.resetAsterionSphereAudio();
  astroFurnace.resetBaseline();
  furnaceAudioProjection.reset();
  furnaceProgressionController.resetBaseline();
  furnacePanel.reset();
  playerGuidePanel.reset();
  runeResonatorGuidance.reset();
  monkeyKnowledgeResolver.reset();
  astroFurnaceOptionInteraction.reset();
  astroFurnaceOpenInteraction.reset();
  astroFurnaceActivateInteraction.reset();
  runeTuningController.reset();
  astroFurnaceContentInteraction.reset();
  astroFurnaceRuneRecipeInteraction.resetBaseline();
  runeRecipeSelectionController.reset();
  runeStoneProgressionController.reset();
  runeStoneAudioProjection.reset();
  asterionResonatorFieldActor.reset();
  asterionResonatorTargetAcquisitionActor.reset();
  asterionResonatorTargetResponsePresentation.reset();
  asterionResonatorFieldPresentation.reset();
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
  platformEnergyVfxActor.reset();
  platformEnergyVfxProjection.reset();
  runeBinderRevealAudioProjection.reset();
  runeStoneInstallationInteraction.reset();
  runeBridgeActor.reset();
  synchronizeRuneBridgeReadiness();
  runeStoneActor.reset();
  runeStoneAttractorInteraction.reset();
  largeGlyphAttractorInteraction.reset();
  largeGlyphActor.reset();
  smallGlyphAttractorInteraction.reset();
  smallGlyphSystem.reset();
  postRingPresentation.reset();
  firstRingFlow.reset();
  observationWindow.reset();
  p2ObservationWindow.reset();
  shellAttractorInteraction.reset();
  shellSystem.reset();
  syncQaPostP1WorldState();
  glyphLights.reset();
  glyphInteraction.reset();
  vrControllers.reset();
  asterionSphere.reset();
  asterionProductionController.resetBaseline();
  astroAttractorProductionController.resetBaseline();
  handModeController.reset();
  postRingMonkeyDialogue.reset();
  p2MonkeyDialogue.reset();
  furnaceIntro.reset();
  toolGuidanceLifecycle.reset();
  earlyExperienceGuidance.reset();
  monkeyGuide.reset();
  platformFixturesRoot.visible = true;
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
  celestialActor.dispose();
  introCrystalTutorial.dispose();
  introFogReveal.dispose();
  ambientSequencer.dispose();
  introAmbientSequencer.dispose();
  unsubscribeRuneStoneInstallAudioCue();
  unsubscribeRuneStoneInstalledAudio();
  runeStoneAudioProjection.dispose();
  furnaceAudioProjection.dispose();
  vrAudio.dispose();
  asterionGyroInteraction.dispose();
  asterionSectorAcquisitionInteraction.dispose();
  asterionSectorControlInteraction.dispose();
  asterionSectorAudioProjection.dispose();
  asterionSectorAcquisitionPresentation.dispose();
  asterionPlatformEnergyVfxProjection.dispose();
  unsubscribeResonatorScenarioHandoff();
  unsubscribeRuneGuidance();
  unsubscribeResonatorGuidance();
  unsubscribeSectorLockGuidance();
  unsubscribeRuneBridgeGuidance();
  asterionResonatorFieldPresentation.dispose();
  asterionResonatorTargetResponsePresentation.dispose();
  asterionResonatorTargetAcquisitionActor.dispose();
  asterionResonatorFieldActor.dispose();
  asterionProductionController.dispose();
  astroAttractorProductionController.dispose();
  asterionSphere.dispose();
  astroFurnaceOpenInteraction.dispose();
  astroFurnaceActivateInteraction.dispose();
  astroFurnaceContentInteraction.dispose();
  astroFurnaceRuneRecipeInteraction.dispose();
  runeTuningController.dispose();
  runeRecipeSelectionController.dispose();
  astroFurnaceOptionInteraction.dispose();
  playerGuidePanel.dispose();
  toolGuidanceLifecycle.dispose();
  earlyExperienceGuidance.reset();
  monkeyGuide.dispose();
  furnacePanel.dispose();
  furnaceProgressionController.dispose();
  astroFurnace.dispose();
  shellAttractorInteraction.dispose();
  smallGlyphAttractorInteraction.dispose();
  largeGlyphAttractorInteraction.dispose();
  runeStoneAttractorInteraction.dispose();
  runeStoneInstallationInteraction.dispose();
  runeStoneProgressionController.dispose();
  handModeController.dispose();
  activateButton.reset();
  releaseButton.reset();
  activateButton.dispose();
  releaseButton.dispose();
  crystalCollection.dispose();
  crystalReliquary.dispose();
  runeBinderRevealAudioProjection.dispose();
  platformEnergyVfxProjection.dispose();
  platformEnergyVfxActor.dispose();
  runeBridgeActor.dispose();
  runeStoneActor.dispose();
  progressFloor.dispose();
  postRingPresentation.dispose();
  p2ObservationWindow.reset();
  p2MonkeyDialogue.reset();
  largeGlyphActor.dispose();
  smallGlyphSystem.dispose();
  shellSystem.dispose();
  protoAstroTuningController.dispose();
}, { once: true });
showReadyState();
