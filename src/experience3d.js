import * as THREE from './vendor/three.js';
import { portfolioNodes } from './content/portfolioNodes.js';
import { createScene } from './scene/createScene.js';
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
import { createSunCycle, SUN_CYCLE_DEFAULTS } from './scene/sunCycle.js';
import { createMoonCycle, MOON_CYCLE_DEFAULTS } from './scene/moonCycle.js';
import { createAtmosphereProgression } from './scene/atmosphere/atmosphereProgression.js';
import { createGalaxySpritesLayer, GALAXY_SPRITES_DEFAULTS } from './scene/galaxySprites.js';
import { ASSET_STAGES, INITIAL_PRELOAD_GROUPS, DEFERRED_PRELOAD_GROUPS, OPTIONAL_PRELOAD_GROUPS, getPreloadAssets, getAllPreloadAssets } from './assets/assetManifest.js';
import { createLoadingDiagnostics, preloadAssets } from './assets/preloadAssets.js';
import { createAssetManager } from './assets/assetManager.js';
import { createLoaderOverlay } from './ui/loaderOverlay.js';

const app = document.querySelector('#app');
if (!app) throw new Error('Missing #app mount element.');

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
loadingDiagnostics.subscribe((snapshot) => loaderOverlay.update(snapshot));

try {
  loadingDiagnostics.markEvent('criticalPreloadStart');
  await preloadAssets(criticalAssetsList, {
    diagnostics: loadingDiagnostics,
    assetManager,
    concurrency: preloadConcurrency,
    stage: ASSET_STAGES.CRITICAL_INITIAL
  });
  loadingDiagnostics.markEvent('criticalPreloadEnd');
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  loaderOverlay.showError('Nie udało się załadować krytycznych zasobów. Odśwież stronę lub sprawdź połączenie.');
  console.warn('[loading] Critical asset preload failed. Scene reveal blocked.', { message, diagnostics: loadingDiagnostics.getSnapshot() });
  throw error;
}

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });


const scene = createScene();
const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 100);
camera.position.set(0, 1.8, 6);

addLights(scene);
const centralPlaceholder = createCentralObject();
scene.add(centralPlaceholder);

const sceneRuntimeConfig = {
  sunCycle: { ...SUN_CYCLE_DEFAULTS },
  moonCycle: { ...MOON_CYCLE_DEFAULTS },
  galaxySprites: { ...GALAXY_SPRITES_DEFAULTS },
  backgroundAtmosphere: {
    enabled: true, debugVisible: false, showShellHelpers: false, showAtmosphereLogs: false,
    debugBlendingMode: 'normal', debugIgnoreFog: true, safeRadius: 3, shellInnerRadius: 15, shellOuterRadius: 25,
    stoneRelics: { enabled: true, count: 80, models: ['glb/stone_01.glb','glb/stone_02.glb','glb/stone_03.glb','glb/stone_04.glb','glb/stone_05.glb','glb/stone_06.glb'], safeRadius: 3.5, shellInnerRadius: 15, shellOuterRadius: 18, minScale: 3, maxScale: 4.27, rotationSpeedMin: 0.05, rotationSpeedMax: 0.09, orbitSpeed: 0.003, opacity: 1, debugVisible: false },
    shellRelics: { enabled: true, count: 100, models: ['glb/shell_01.glb','glb/shell_02.glb','glb/shell_03.glb','glb/shell_04.glb','glb/shell_05.glb','glb/shell_06.glb'], minScale: 0.4, maxScale: 0.7, shellInnerRadius: 10, shellOuterRadius: 13, rotationSpeedMin: 0.047, rotationSpeedMax: 0.486, orbitSpeed: 0.013, opacity: 1, debugVisible: false, colorPalette: ['#d9a441','#4db6ac','#6ec6ff','#6bcf8e','#9c7bff','#f0a6a6'] },
    smallGlyphRelics: { enabled: true, count: 50, models: ['glb/small_glyph_01.glb','glb/small_glyph_02.glb','glb/small_glyph_03.glb','glb/small_glyph_04.glb','glb/small_glyph_05.glb','glb/small_glyph_06.glb'], minScale: 0.5, maxScale: 0.8, shellInnerRadius: 8, shellOuterRadius: 10, rotationSpeedMin: 0.01, rotationSpeedMax: 0.028, orbitSpeed: 0.005, opacity: 0.53, debugVisible: false },
    dust: { enabled: true, count: 6000, idleOpacity: 1, rotationSpeed: 0.018, pointSize: 0.07, color: '#cfe2ff', sizeAttenuation: true, depthTest: true }
  }
};

loadingDiagnostics.markEvent('sceneAttachStart');
const atmosphere = createBackgroundAtmosphere(sceneRuntimeConfig.backgroundAtmosphere, { assetManager, deferRelicsUntilWarm: true });
scene.add(atmosphere.object3d);
const sunCycle = createSunCycle(sceneRuntimeConfig.sunCycle, { assetManager });
scene.add(sunCycle.object3d);
const moonCycle = createMoonCycle(sceneRuntimeConfig.moonCycle, { assetManager });
scene.add(moonCycle.object3d);
const galaxyLayer = createGalaxySpritesLayer(sceneRuntimeConfig.galaxySprites, { assetManager, deferUntilWarm: true });
scene.add(galaxyLayer.group);

await loadMonkeyModel({ scene, fallbackObject: centralPlaceholder, assetManager });

const { group: orbitGroup, nodes, orbit } = createOrbitNodes(portfolioNodes, { assetManager });
scene.add(orbitGroup);
const plaqueTransition = createPlaqueTransition({ scene, assetManager });
const atmosphereProgression = createAtmosphereProgression({ gateIds: portfolioNodes.map((node) => node.id) });
const initialProgressionMultipliers = atmosphereProgression.getProgressionMultipliers();
atmosphere.setProgressionMultipliers(initialProgressionMultipliers);
sunCycle.setProgressionMultiplier(initialProgressionMultipliers.sunMoon);
moonCycle.setProgressionMultiplier(initialProgressionMultipliers.sunMoon);
galaxyLayer.setProgressionMultiplier(initialProgressionMultipliers.galaxies);
loadingDiagnostics.markEvent('sceneAttachEnd');

const overlay = createOverlay({
  onClose: () => void returnFromNodePanel()
});
const hoverLabel = createHoverLabel();

const optionsPanel = createOptionsPanel({
  runtimeState: sceneRuntimeConfig,
  loadingDiagnostics,
  atmosphereProgression,
  gateNodes: portfolioNodes,
  onChange: ({ type }) => {
    atmosphere.applySettings(sceneRuntimeConfig.backgroundAtmosphere, type);
    sunCycle.setOptions(sceneRuntimeConfig.sunCycle);
    moonCycle.setOptions(sceneRuntimeConfig.moonCycle);
    if (type === 'galaxy-sprites-rebuild' || type === 'reset-all' || type === 'rebuild') {
      galaxyLayer.rebuild(sceneRuntimeConfig.galaxySprites);
    } else {
      galaxyLayer.applyRuntimeOptions(sceneRuntimeConfig.galaxySprites);
    }
  },
  onResetAtmosphere: () => {
    atmosphere.applySettings(sceneRuntimeConfig.backgroundAtmosphere, 'rebuild');
  }
});

let hoveredNode = null;
let interactionState = 'idle';
let activePanelNode = null;

function syncHoverState(nextHoveredNode, event = null) {
  const previousHoveredNode = hoveredNode;

  if (previousHoveredNode && previousHoveredNode !== nextHoveredNode) {
    setNodeHoverState(hoveredNode, false);
  }

  hoveredNode = nextHoveredNode;

  if (hoveredNode) {
    setNodeHoverState(hoveredNode, true);
    if (hoveredNode !== previousHoveredNode) {
      triggerNodeHoverAnimation(hoveredNode);
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
  syncHoverState(null);
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
    if (node.userData?.plaqueModelPath) {
      interactionState = 'revealingPlaque';
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

  if (event.pointerType === 'mouse' && fineHoverQuery.matches) {
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
  if (interactionState === 'idle') syncHoverState(null);
});

canvas.addEventListener('pointerleave', () => {
  if (interactionState === 'idle') syncHoverState(null);
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
loadingDiagnostics.markEvent('rendererCompileStart');
const compileStartedAt = performance.now();
if (isMobileRuntime) {
  assetManager.markWarmup({ shaderCompileComplete: false, mobileWarmupReduced: true });
} else {
  renderer.compile(scene, camera);
  assetManager.markWarmup({ shaderCompileComplete: true, mobileWarmupReduced: false });
}
loadingDiagnostics.markEvent('rendererCompileEnd');
renderer.render(scene, camera);
assetManager.markWarmup({ warmupFrameComplete: true, compileWarmupMs: performance.now() - compileStartedAt });
loadingDiagnostics.markEvent('firstWarmupRender');

const timer = new THREE.Timer();
timer.connect(document);
const orbitCenterWorldPosition = new THREE.Vector3();

function tick(timestamp) {
  timer.update(timestamp);
  const delta = timer.getDelta();
  const elapsed = timer.getElapsed();
  const orbitPhase = orbit.update(delta);
  updateOrbitNodes(nodes, elapsed, orbitGroup.getWorldPosition(orbitCenterWorldPosition), orbitPhase);
  plaqueTransition.update();
  cameraRig.update(camera, elapsed);
  atmosphere.update(delta);
  atmosphereProgression.updateAtmosphereProgression(delta);
  const multipliers = atmosphereProgression.getProgressionMultipliers();
  atmosphere.setProgressionMultipliers(multipliers);
  sunCycle.setProgressionMultiplier(multipliers.sunMoon);
  moonCycle.setProgressionMultiplier(multipliers.sunMoon);
  sunCycle.update(delta);
  moonCycle.update(delta, sunCycle.getAngle());
  galaxyLayer.setProgressionMultiplier(multipliers.galaxies);
  galaxyLayer.update(delta, elapsed, camera);
  if (sceneRuntimeConfig.backgroundAtmosphere.debugVisible && elapsed < 0.25) {
    console.info('[backgroundAtmosphere][debug] tick/update active', { delta, elapsed });
  }
  renderer.render(scene, camera);
  requestAnimationFrame(tick);
}

loadingDiagnostics.markEvent('loaderFadeStart');
shell?.classList.remove('runtime-shell--loading');
await loaderOverlay.complete();
loadingDiagnostics.markEvent('loaderFadeEnd');
tick();

queueMicrotask(() => {
  loadingDiagnostics.markEvent('deferredWarmStart');
  preloadAssets(deferredWarmAssetsList, {
    diagnostics: loadingDiagnostics,
    assetManager,
    concurrency: preloadConcurrency,
    stage: ASSET_STAGES.DEFERRED_WARM
  })
    .then(async () => {
      loadingDiagnostics.markEvent('deferredWarmEnd');
      await Promise.all([atmosphere.hydrateDeferredRelics?.(), galaxyLayer.hydrateDeferred?.()]);
      assetManager.markPreloadComplete();
      return preloadAssets(optionalLateAssetsList, {
        diagnostics: loadingDiagnostics,
        assetManager,
        concurrency: 1,
        stage: ASSET_STAGES.OPTIONAL_LATE,
        markComplete: true
      });
    })
    .catch((error) => {
      console.warn('[loading] Deferred warm preload failed after reveal.', error);
      assetManager.markPreloadComplete();
    });
});
