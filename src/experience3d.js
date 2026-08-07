import * as THREE from './vendor/three.js';
import { resolvePortfolioNodes } from './content/resolvePortfolioNodes.js';
import { createScene } from './scene/createScene.js';
import { createFogRevealController } from './scene/fogRevealController.js';
import { addLights } from './scene/lights.js';
import { createCentralObject } from './scene/centralObject.js';
import { createBackgroundAtmosphere } from './scene/atmosphere.js';
import { loadMonkeyModel } from './scene/monkeyModel.js';
import { createOrbitNodes, fadeNodeTransitionLight, resetNodeTransitionLight, setNodeHoverState, startNodeTransitionLight, triggerNodeHoverAnimation, updateOrbitNodes } from './scene/orbitNodes.js';
import { pickNode } from './scene/raycaster.js';
import { createCameraRig } from './scene/cameraRig.js';
import { createPlaqueTransition } from './scene/plaqueTransition.js';
import { createOverlay } from './ui/overlay.js';
import { createHoverLabel } from './ui/hoverLabel.js';
import { createOptionsPanel } from './ui/optionsPanel.js';
import { createSunCycle } from './scene/sunCycle.js';
import { createMoonCycle } from './scene/moonCycle.js';
import { createAtmosphereProgression } from './scene/atmosphere/atmosphereProgression.js';
import { createGalaxySpritesLayer } from './scene/galaxySprites.js';
import { createMilkyWayBackground } from './scene/milkyWayBackground.js';
import { EXPERIENCE_BACKGROUND_COLOR, renderScenePasses } from './scene/renderScenePasses.js';
import { ASSET_STAGES, INITIAL_PRELOAD_GROUPS, DEFERRED_PRELOAD_GROUPS, OPTIONAL_PRELOAD_GROUPS, getPreloadAssets, getAllPreloadAssets } from './assets/assetManifest.js';
import { createLoadingDiagnostics, preloadAssets } from './assets/preloadAssets.js';
import { createAssetManager } from './assets/assetManager.js';
import { createLoaderOverlay } from './ui/loaderOverlay.js';
import { createExperienceIntro } from './ui/experienceIntro.js';
import { createRuntimeDiagnostics } from './utils/runtimeDiagnostics.js';
import { routeOptionsEvent } from './utils/optionsEventRouter.js';
import { loadExperience3dSettings, toRuntimeSettings } from './config/experience3dSettings.js';
import { audioManager } from './audio/audioManager.js';

const app = document.querySelector('#app');
if (!app) throw new Error('Missing #app mount element.');

const portfolioNodes = resolvePortfolioNodes(document.documentElement.lang);

app.innerHTML = `
  <main class="runtime-shell runtime-shell--loading">
    <canvas id="scene-canvas" aria-label="Interactive AI portfolio MVP scene"></canvas>
  </main>
`;

const canvas = document.querySelector('#scene-canvas');
const shell = document.querySelector('.runtime-shell');
const debugLoading = new URLSearchParams(window.location.search).has('debug');
const debugInput = debugLoading;
const criticalAssetsList = getPreloadAssets(INITIAL_PRELOAD_GROUPS);
const deferredWarmAssetsList = getPreloadAssets(DEFERRED_PRELOAD_GROUPS);
const optionalLateAssetsList = getPreloadAssets(OPTIONAL_PRELOAD_GROUPS);
const loadingDiagnostics = createLoadingDiagnostics(getAllPreloadAssets());
loadingDiagnostics.markEvent('appStart');
const mobileQuery = window.matchMedia('(pointer: coarse), (max-width: 767px)');
const fineHoverQuery = window.matchMedia('(hover: hover) and (pointer: fine)');
const isMobileRuntime = mobileQuery.matches;
const preloadConcurrency = isMobileRuntime ? 2 : 4;
const assetManager = createAssetManager({ diagnostics: loadingDiagnostics });
const loaderOverlay = createLoaderOverlay({ debug: debugLoading });
const experienceIntro = createExperienceIntro({ language: document.documentElement.lang });
const unsubscribeLoaderDiagnostics = loadingDiagnostics.subscribe((snapshot) => loaderOverlay.update(snapshot));
const loadedSettings = await loadExperience3dSettings({ debug: debugLoading });
let settingsSource = loadedSettings.settingsSource;
const settingsLoadError = loadedSettings.settingsLoadError;
const sceneRuntimeConfig = toRuntimeSettings(loadedSettings.settings);

try {
  loadingDiagnostics.markEvent('criticalPreloadStart');
  await preloadAssets(criticalAssetsList, {
    diagnostics: loadingDiagnostics,
    assetManager,
    concurrency: preloadConcurrency,
    stage: ASSET_STAGES.CRITICAL_INITIAL
  });
  loadingDiagnostics.markEvent('criticalPreloadEnd');
  loadingDiagnostics.markEvent('deferredWarmStart');
  await preloadAssets(deferredWarmAssetsList, {
    diagnostics: loadingDiagnostics,
    assetManager,
    concurrency: preloadConcurrency,
    stage: ASSET_STAGES.DEFERRED_WARM
  });
  loadingDiagnostics.markEvent('deferredWarmEnd');
  await preloadAssets(optionalLateAssetsList, {
    diagnostics: loadingDiagnostics,
    assetManager,
    concurrency: 1,
    stage: ASSET_STAGES.OPTIONAL_LATE,
    markComplete: true
  });
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  loaderOverlay.showError('Nie udało się załadować krytycznych zasobów. Odśwież stronę lub sprawdź połączenie.');
  console.warn('[loading] Critical asset preload failed. Scene reveal blocked.', { message, diagnostics: loadingDiagnostics.getSnapshot() });
  throw error;
}

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.autoClear = false;
renderer.info.autoReset = false;
renderer.setClearColor(EXPERIENCE_BACKGROUND_COLOR, 1);

const scene = createScene(sceneRuntimeConfig.fog);
const fogRevealController = createFogRevealController({ scene, settings: sceneRuntimeConfig.fog });
const galaxyBackgroundScene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 100);
camera.position.set(0, 1.8, 6);

addLights(scene);
const centralPlaceholder = createCentralObject();
scene.add(centralPlaceholder);

loadingDiagnostics.markEvent('sceneAttachStart');
const atmosphere = createBackgroundAtmosphere(sceneRuntimeConfig.backgroundAtmosphere, { assetManager, deferRelicsUntilWarm: true });
scene.add(atmosphere.object3d);
const sunCycle = createSunCycle(sceneRuntimeConfig.sunCycle, { assetManager, camera });
scene.add(sunCycle.object3d);
const moonCycle = createMoonCycle(sceneRuntimeConfig.moonCycle, { assetManager, camera });
scene.add(moonCycle.object3d);
const galaxyLayer = createGalaxySpritesLayer(sceneRuntimeConfig.galaxySprites, { assetManager, deferUntilWarm: true });
const milkyWayBackground = createMilkyWayBackground({ assetManager });
milkyWayBackground.update(0, camera);
galaxyBackgroundScene.add(milkyWayBackground.group);
galaxyBackgroundScene.add(galaxyLayer.group);

await loadMonkeyModel({ scene, fallbackObject: centralPlaceholder, assetManager });

const { group: orbitGroup, nodes, orbit } = createOrbitNodes(portfolioNodes, { assetManager });
scene.add(orbitGroup);
const plaqueTransition = createPlaqueTransition({ scene, assetManager });
const atmosphereProgression = createAtmosphereProgression({ gateIds: portfolioNodes.map((node) => node.id) });
let lastAudioProgressLevel = atmosphereProgression.state.progressLevel;
atmosphereProgression.onStateChange(() => {
  const nextLevel = atmosphereProgression.state.progressLevel;
  if (nextLevel === lastAudioProgressLevel) return;
  lastAudioProgressLevel = nextLevel;
  audioManager.setProgressLevel(nextLevel);
});
const initialProgressionMultipliers = atmosphereProgression.getProgressionMultipliers();
atmosphere.setProgressionMultipliers(initialProgressionMultipliers);
sunCycle.setProgressionMultiplier(initialProgressionMultipliers.sunMoon);
moonCycle.setProgressionMultiplier(initialProgressionMultipliers.sunMoon);
galaxyLayer.setProgressionMultiplier(initialProgressionMultipliers.galaxies);
milkyWayBackground.setProgressionMultiplier(initialProgressionMultipliers.galaxies);
let tuningMode = debugLoading;
let effectiveLayerMultipliers = { ...initialProgressionMultipliers };
let lastPanelEvent = null;
loadingDiagnostics.markEvent('sceneAttachEnd');

let interactionState = 'booting';
const runtimeDiagnostics = createRuntimeDiagnostics({
  enabled: debugLoading,
  renderer,
  scene,
  getRuntimeState: () => interactionState,
  getLayerSnapshot: () => ({ ...atmosphere.getPerformanceSnapshot(), galaxiesVisible: galaxyLayer.group.visible, tuningMode, effectiveLayerMultipliers: { ...effectiveLayerMultipliers }, lastPanelEvent, settingsSource, ...(settingsLoadError ? { settingsLoadError } : {}) }),
  getGalaxyCount: galaxyLayer.getInstanceCount,
  getPlaqueCount: plaqueTransition.getInstanceCount,
  getLifecycleCounts: () => ({ ...atmosphere.getLifecycleCounts(), ...galaxyLayer.getLifecycleCounts(), plaqueInstancesBuilt: plaqueTransition.getInstanceCount() }),
  getFogRevealSnapshot: fogRevealController.getSnapshot
});
runtimeDiagnostics.count('criticalPreload');
runtimeDiagnostics.count('deferredPreload');
runtimeDiagnostics.count('optionalPreload');
runtimeDiagnostics.count('atmosphereCreate');
runtimeDiagnostics.count('galaxyCreate');
runtimeDiagnostics.census('sceneAttach');

const overlay = createOverlay({
  language: document.documentElement.lang,
  onClose: () => {
    if (activePanelNode?.userData?.plaqueTransitionReady) {
      void audioManager.playGlyphPanel(activePanelNode.userData?.id, 'close');
    }
    void returnFromNodePanel();
  }
});
const hoverLabel = createHoverLabel();

const optionsPanel = createOptionsPanel({
  runtimeState: sceneRuntimeConfig,
  loadingDiagnostics,
  getPerformanceSnapshot: runtimeDiagnostics.getSnapshot,
  atmosphereProgression,
  gateNodes: portfolioNodes,
  getTuningMode: () => tuningMode,
  debugMode: debugLoading,
  audioManager,
  onSettingsImported: () => { settingsSource = 'imported-session'; },
  onChange: (event) => {
    const handled = routeOptionsEvent(event, {
      atmosphere: ({ action }) => atmosphere.applySettings(sceneRuntimeConfig.backgroundAtmosphere, action),
      sun: ({ action }) => action === 'apply' ? (sunCycle.setOptions(sceneRuntimeConfig.sunCycle), true) : false,
      moon: ({ action }) => action === 'apply' ? (moonCycle.setOptions(sceneRuntimeConfig.moonCycle), true) : false,
      galaxies: ({ action }) => {
        if (action === 'rebuild') { void galaxyLayer.rebuild(sceneRuntimeConfig.galaxySprites); return true; }
        if (action === 'runtime') { galaxyLayer.applyRuntimeOptions(sceneRuntimeConfig.galaxySprites); return true; }
        return false;
      },
      scene: ({ action }) => {
        if (action === 'fog') { fogRevealController.applySettings(sceneRuntimeConfig.fog); return true; }
        if (action === 'fog-restart') { fogRevealController.applySettings(sceneRuntimeConfig.fog); fogRevealController.restart(); fogRevealController.start(); return true; }
        if (action === 'fog-skip') { fogRevealController.skipToEnd(); return true; }
        if (action === 'fog-import') { fogRevealController.applySettings(sceneRuntimeConfig.fog, { restartReveal: true }); return true; }
        return false;
      },
      progression: ({ action, value }) => {
        if (action === 'tuning-mode') { tuningMode = Boolean(value); return true; }
        return action === 'state-change';
      }
    }, { debug: debugLoading });
    if (!handled) {
      if (debugLoading) console.warn('[options] Event had no owner/action receiver.', event);
      return;
    }
    lastPanelEvent = { owner: event.owner, action: event.action };
    if (event.action.includes('rebuild')) runtimeDiagnostics.count(`options:${event.owner}:${event.action}`);
  }
});

let hoveredNode = null;
let activePanelNode = null;
let hoverExitTimer = null;
const HOVER_RAYCAST_GRACE_MS = 100;

function glyphId(node) {
  return node?.userData?.id ?? null;
}

function syncHoverState(nextHoveredNode, event = null, { immediateExit = false } = {}) {
  const previousHoveredNode = hoveredNode;
  const previousId = glyphId(previousHoveredNode);
  const nextId = glyphId(nextHoveredNode);

  if (nextHoveredNode && hoverExitTimer) {
    window.clearTimeout(hoverExitTimer);
    hoverExitTimer = null;
  }

  if (!nextHoveredNode && previousHoveredNode && !immediateExit) {
    if (!hoverExitTimer) {
      hoverExitTimer = window.setTimeout(() => {
        hoverExitTimer = null;
        syncHoverState(null, null, { immediateExit: true });
      }, HOVER_RAYCAST_GRACE_MS);
    }
    return;
  }

  if (previousId !== null && previousId === nextId) {
    if (event) hoverLabel.show(previousHoveredNode.userData, event.clientX, event.clientY);
    return;
  }

  if (previousHoveredNode && previousHoveredNode !== nextHoveredNode) {
    setNodeHoverState(hoveredNode, false);
    audioManager.stopGlyphHover();
  }

  hoveredNode = nextHoveredNode;

  if (hoveredNode) {
    setNodeHoverState(hoveredNode, true);
    if (hoveredNode !== previousHoveredNode) {
      triggerNodeHoverAnimation(hoveredNode);
      void audioManager.startGlyphHover();
    }
    if (event) {
      hoverLabel.show(hoveredNode.userData, event.clientX, event.clientY);
    }
  } else {
    hoverLabel.hide();
  }

  document.body.style.cursor = hoveredNode ? 'pointer' : 'default';
}

const cameraRig = createCameraRig(canvas);
const TAP_MOVE_THRESHOLD_PX = 10;
const MAX_TAP_DURATION_MS = 500;
const coarsePointerQuery = window.matchMedia('(pointer: coarse)');
let activePointer = null;
let lastFinePointerPosition = null;
let orientationResizeTimer = null;
let orientationResizeSettledTimer = null;

function debugInteraction(message, details = {}) {
  if (debugInput) {
    console.info(`[interaction][debug] ${message}`, details);
  }
}

function openNodePanel(node) {
  if (!node || interactionState !== 'idle') return;
  debugInteraction('raycast hit', {
    objectName: node.name || null,
    objectId: node.id,
    nodeId: node.userData?.id ?? null
  });
  void focusNodePanel(node);
}

function clearInteractiveHover() {
  if (hoverExitTimer) window.clearTimeout(hoverExitTimer);
  hoverExitTimer = null;
  syncHoverState(null, null, { immediateExit: true });
  document.body.style.cursor = 'default';
}

function releaseActivePointer() {
  if (!activePointer) return;
  if (canvas.releasePointerCapture && canvas.hasPointerCapture?.(activePointer.id)) canvas.releasePointerCapture(activePointer.id);
  activePointer = null;
}

function restoreInteractionSafely() {
  plaqueTransition.reset(activePanelNode);
  if (activePanelNode?.userData) {
    resetNodeTransitionLight(activePanelNode);
    activePanelNode.userData.plaqueTransitionReady = false;
  }
  activePanelNode = null;
  interactionState = 'idle';
  cameraRig.resetHomePose(camera);
  cameraRig.setInteractionLocked(false);
  orbit.resumeOrbit();
  cameraRig.resumeMouseControl(lastFinePointerPosition);
}

async function focusNodePanel(node) {
  interactionState = 'focusing';
  clearInteractiveHover();
  releaseActivePointer();
  orbit.pauseOrbit();
  cameraRig.pauseMouseControl();
  cameraRig.setInteractionLocked(true);
  atmosphereProgression.prepareGateProgression(node.userData?.id);
  activePanelNode = node;
  // Start independently of camera focus, so every orbit side receives the
  // complete neutral-light ramp before the plaque sequence needs it.
  startNodeTransitionLight(node);

  try {
    await cameraRig.focusOnNode(camera, node);
    if (interactionState !== 'focusing') return;
    if (node.userData?.plaqueModelPath && plaqueTransition.hasInstance(node)) {
      interactionState = 'revealingPlaque';
      void audioManager.playGlyphPanel(node.userData?.id, 'open');
      const plaque = await plaqueTransition.reveal(node, camera);
      if (plaque) {
        node.userData.plaqueTransitionReady = true;
        interactionState = 'plaqueHold';
        await new Promise((resolve) => window.setTimeout(resolve, window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 120 : 500));
        if (interactionState !== 'plaqueHold') return;
        interactionState = 'dollyIn';
        await cameraRig.dollyToPlaque(camera, plaque);
      } else {
        // Keep the click light active for the fallback panel path as well.
      }
    }
    if (!activePanelNode) return;
    overlay.open(node.userData);
    interactionState = 'panelOpen';
    runtimeDiagnostics.markPlaqueOpen(node.userData?.id ?? 'unknown');
  } catch (error) {
    console.warn('[interaction] Failed to focus selected glyph.', error);
    restoreInteractionSafely();
  }
}

async function returnFromNodePanel() {
  if (interactionState !== 'panelOpen') return;
  const node = activePanelNode;
  interactionState = node?.userData?.plaqueTransitionReady ? 'dollyOut' : 'returning';
  clearInteractiveHover();
  try {
    if (node?.userData?.plaqueTransitionReady) {
      await cameraRig.dollyOut(camera);
      interactionState = 'restoringGlyph';
      fadeNodeTransitionLight(node);
      await plaqueTransition.restore(node);
      node.userData.plaqueTransitionReady = false;
    } else if (node) {
      fadeNodeTransitionLight(node);
    }
    interactionState = 'returning';
    await cameraRig.returnHome(camera);
    if (interactionState !== 'returning') return;
    orbit.resumeOrbit();
    cameraRig.setInteractionLocked(false);
    cameraRig.resumeMouseControl(lastFinePointerPosition);
    interactionState = 'idle';
    activePanelNode = null;
    atmosphereProgression.handleOverlayClosed();
  } catch (error) {
    console.warn('[interaction] Failed to return camera home after closing panel.', error);
    restoreInteractionSafely();
    atmosphereProgression.handleOverlayClosed();
  }
}

function rememberFinePointerPosition(event) {
  if (event.pointerType !== 'mouse' || !window.matchMedia('(pointer: fine)').matches) return;

  lastFinePointerPosition = {
    clientX: event.clientX,
    clientY: event.clientY
  };
}

function getPointerDistanceFromStart(event) {
  if (!activePointer) return 0;
  return Math.hypot(event.clientX - activePointer.startX, event.clientY - activePointer.startY);
}

function isTouchCameraPointer(event) {
  return event.pointerType === 'touch' || coarsePointerQuery.matches;
}

function getCanvasRectSize() {
  const rect = canvas.getBoundingClientRect();
  return {
    width: rect.width || window.innerWidth || 1,
    height: rect.height || window.innerHeight || 1
  };
}

function handlePointerDown(event) {
  if (!event.isPrimary || activePointer || interactionState !== 'idle') return;

  activePointer = {
    id: event.pointerId,
    pointerType: event.pointerType,
    startX: event.clientX,
    startY: event.clientY,
    startTime: performance.now(),
    dragged: false,
    suppressTap: false,
    usesTouchCameraDrag: isTouchCameraPointer(event)
  };

  debugInteraction('pointer down', { pointerType: event.pointerType });

  if (canvas.setPointerCapture) {
    canvas.setPointerCapture(event.pointerId);
  }
}

function handlePointerMove(event) {
  if (interactionState !== 'idle') return;
  cameraRig.onPointerMove(event);

  if (activePointer?.id === event.pointerId) {
    const distance = getPointerDistanceFromStart(event);
    if (distance > TAP_MOVE_THRESHOLD_PX) {
      activePointer.dragged = true;
      activePointer.suppressTap = true;
      clearInteractiveHover();
    }

    if (activePointer.usesTouchCameraDrag && activePointer.dragged) {
      const { width, height } = getCanvasRectSize();
      cameraRig.setTouchDragTarget({
        deltaX: event.clientX - activePointer.startX,
        deltaY: event.clientY - activePointer.startY,
        width,
        height
      });
    }
  }

  if (event.pointerType === 'mouse' && fineHoverQuery.matches && !activePointer?.dragged) {
    const hit = pickNode(event, canvas, camera, nodes);
    syncHoverState(hit, event);
  }
}

function finishPointer(event, { cancelled = false } = {}) {
  if (interactionState !== 'idle') return;
  if (activePointer?.id !== event.pointerId) return;

  const distance = getPointerDistanceFromStart(event);
  const duration = performance.now() - activePointer.startTime;
  const isTap = !cancelled && !activePointer.suppressTap && !activePointer.dragged && distance <= TAP_MOVE_THRESHOLD_PX && duration <= MAX_TAP_DURATION_MS;

  if (activePointer.usesTouchCameraDrag) {
    cameraRig.releaseTouchTarget();
  }

  if (canvas.releasePointerCapture && canvas.hasPointerCapture?.(event.pointerId)) {
    canvas.releasePointerCapture(event.pointerId);
  }

  if (isTap) {
    debugInteraction('tap detected', { pointerType: activePointer.pointerType, distance, duration });
    openNodePanel(pickNode(event, canvas, camera, nodes));
  } else {
    debugInteraction(cancelled ? 'pointer cancelled' : 'drag detected', {
      pointerType: activePointer.pointerType,
      distance,
      duration
    });
  }

  activePointer = null;
}

function handleResize({ fromOrientationChange = false } = {}) {
  const rect = shell?.getBoundingClientRect();
  const width = rect?.width || canvas.clientWidth || window.innerWidth || 1;
  const height = rect?.height || canvas.clientHeight || window.innerHeight || 1;
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setSize(width, height, false);

  if (fromOrientationChange) {
    debugInteraction('orientation resize', { width, height, pixelRatio: renderer.getPixelRatio() });
  }
}

canvas.addEventListener('pointerdown', handlePointerDown);
canvas.addEventListener('pointermove', handlePointerMove);
canvas.addEventListener('pointerup', (event) => finishPointer(event));
canvas.addEventListener('pointercancel', (event) => finishPointer(event, { cancelled: true }));

window.addEventListener('pointerleave', () => {
  cameraRig.onPointerLeave();
  if (interactionState === 'idle') syncHoverState(null, null, { immediateExit: true });
});

canvas.addEventListener('pointerleave', () => {
  if (interactionState === 'idle') syncHoverState(null, null, { immediateExit: true });
});

window.addEventListener('pointermove', rememberFinePointerPosition);
window.addEventListener('pointerdown', rememberFinePointerPosition);

window.addEventListener('resize', () => handleResize());
window.addEventListener('orientationchange', () => {
  window.clearTimeout(orientationResizeTimer);
  window.clearTimeout(orientationResizeSettledTimer);
  orientationResizeTimer = window.setTimeout(() => handleResize({ fromOrientationChange: true }), 250);
  orientationResizeSettledTimer = window.setTimeout(() => handleResize({ fromOrientationChange: true }), 600);
});
handleResize();
await Promise.all([atmosphere.ready, galaxyLayer.ready]);
loadingDiagnostics.markEvent('sceneHydrationStart');
runtimeDiagnostics.count('atmosphereHydration');
runtimeDiagnostics.count('galaxyHydration');
await Promise.all([atmosphere.hydrateDeferredRelics?.(), galaxyLayer.hydrateDeferred?.()]);
loadingDiagnostics.markEvent('sceneHydrationEnd');
runtimeDiagnostics.census('deferredHydration');
loadingDiagnostics.markEvent('plaquePrewarmStart');
runtimeDiagnostics.count('plaquePrewarm');
await plaqueTransition.prewarm(nodes, camera);
loadingDiagnostics.markEvent('plaquePrewarmEnd');
runtimeDiagnostics.census('plaquePrewarm');
loadingDiagnostics.markEvent('rendererCompileStart');
const compileStartedAt = performance.now();
plaqueTransition.setWarmupVisibility(true);
const restoreAtmosphereWarmup = atmosphere.showAllForWarmup();
const restoreGalaxyWarmup = galaxyLayer.showForWarmup();
const restoreMilkyWayWarmup = milkyWayBackground.showForWarmup();
try {
  plaqueTransition.setWarmupMaterialMode('fade');
  runtimeDiagnostics.count('shaderCompile:fade');
  if (typeof renderer.compileAsync === 'function') await Promise.all([renderer.compileAsync(galaxyBackgroundScene, camera), renderer.compileAsync(scene, camera)]);
  else { renderer.compile(galaxyBackgroundScene, camera); renderer.compile(scene, camera); }
  plaqueTransition.setWarmupMaterialMode('stable');
  runtimeDiagnostics.count('shaderCompile:stable');
  if (typeof renderer.compileAsync === 'function') await Promise.all([renderer.compileAsync(galaxyBackgroundScene, camera), renderer.compileAsync(scene, camera)]);
  else { renderer.compile(galaxyBackgroundScene, camera); renderer.compile(scene, camera); }
  assetManager.markWarmup({ shaderCompileComplete: true, mobileWarmupReduced: isMobileRuntime });
  runtimeDiagnostics.count('warmupRender');
  renderScenePasses(renderer, galaxyBackgroundScene, scene, camera);
} finally {
  plaqueTransition.setWarmupMaterialMode('stable');
  plaqueTransition.setWarmupVisibility(false);
  restoreAtmosphereWarmup();
  restoreGalaxyWarmup();
  restoreMilkyWayWarmup();
}
// Warm-up may use the final shader variant, but it never consumes intro time.
fogRevealController.restart();
// Replace the warm-up buffer (which exposed hidden layers) before either overlay is removed.
renderScenePasses(renderer, galaxyBackgroundScene, scene, camera);
loadingDiagnostics.markEvent('rendererCompileEnd');
assetManager.markWarmup({ warmupFrameComplete: true, compileWarmupMs: performance.now() - compileStartedAt });
loadingDiagnostics.markEvent('firstWarmupRender');
runtimeDiagnostics.markWarmupComplete();
runtimeDiagnostics.census('warmupComplete');

const orbitCenterWorldPosition = new THREE.Vector3();
function tick(timestamp) {
  timer.update(timestamp);
  const delta = timer.getDelta();
  const elapsed = timer.getElapsed();
  fogRevealController.update(delta);
  const orbitPhase = orbit.update(delta);
  updateOrbitNodes(nodes, elapsed, orbitGroup.getWorldPosition(orbitCenterWorldPosition), orbitPhase);
  plaqueTransition.update();
  cameraRig.update(camera, elapsed);
  atmosphereProgression.updateAtmosphereProgression(delta);
  const progressionMultipliers = atmosphereProgression.getProgressionMultipliers();
  effectiveLayerMultipliers = tuningMode
    ? { ...progressionMultipliers, stones: 1, shells: 1, smallGlyphs: 1, stars: 1, galaxies: 1, starsDust: 1, miniGlyphs: 1, finalAura: 1 }
    : progressionMultipliers;
  atmosphere.setProgressionMultipliers(effectiveLayerMultipliers);
  atmosphere.update(delta);
  sunCycle.setProgressionMultiplier(progressionMultipliers.sunMoon);
  moonCycle.setProgressionMultiplier(progressionMultipliers.sunMoon);
  sunCycle.update(delta);
  moonCycle.update(delta, sunCycle.getAngle());
  galaxyLayer.setProgressionMultiplier(effectiveLayerMultipliers.galaxies);
  galaxyLayer.update(delta, elapsed, camera);
  milkyWayBackground.setProgressionMultiplier(effectiveLayerMultipliers.galaxies);
  milkyWayBackground.update(delta, camera);
  if (sceneRuntimeConfig.backgroundAtmosphere.debugVisible && elapsed < 0.25) {
    console.info('[backgroundAtmosphere][debug] tick/update active', { delta, elapsed });
  }
  renderScenePasses(renderer, galaxyBackgroundScene, scene, camera);
  runtimeDiagnostics.frame(timestamp);
  requestAnimationFrame(tick);
}

// The attempt is bounded by the optional fetch/decode operations; every failure
// settles inside the manager and therefore cannot block interaction readiness.
await audioManager.preloadExperienceEffects();
loadingDiagnostics.markEvent('loaderFadeStart');
runtimeDiagnostics.count('loaderComplete');
shell?.classList.remove('runtime-shell--loading');
await loaderOverlay.complete();
unsubscribeLoaderDiagnostics();
loadingDiagnostics.markEvent('loaderFadeEnd');
interactionState = 'intro';
loadingDiagnostics.markEvent('introStart');
audioManager.startExperienceSequence();
await experienceIntro.play();
loadingDiagnostics.markEvent('introEnd');
interactionState = 'idle';
loadingDiagnostics.markEvent('interactionReady');
runtimeDiagnostics.markInteractionReady();
runtimeDiagnostics.census('interactionReady');
runtimeDiagnostics.count('tickStart');
const timer = new THREE.Timer();
timer.connect(document);
fogRevealController.start();
tick();
