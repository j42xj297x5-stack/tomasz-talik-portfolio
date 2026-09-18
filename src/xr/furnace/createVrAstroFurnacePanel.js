import * as THREE from '../../vendor/three.js';
import { applyWorldTransform } from '../applyWorldTransform.js';
import { drawFurnaceFrame } from './drawVrFurnaceFrame.js';
import { resolveProcessTelemetry, shouldRefreshTelemetry } from './vrFurnaceTelemetry.js';
import { resolveVrFurnaceCopy } from './vrFurnaceCopy.js';
import { ASTERION_SHELL_PATCHES } from './asterionShellPatchData.js';
import { assemblySegmentVisible, createAsterionModelWireframeMap, createAsterionPatchGeometry, resolvePatchVisualStates } from './asterionSphereWireframe.js';
import { drawMaterialCardVisual } from './drawVrMaterialCard.js';
import { resolveAttractorShellGlyph } from '../tools/vrAttractorShellGlyphs.js';
import { createVrFurnaceCurvePresentation, drawVrFurnaceCurvePresentation } from './drawVrAstroAttractorPreview.js';
import { SMALL_GLYPH_WIREFRAME_DATA } from './smallGlyphWireframeData.js';
import { drawSmallGlyphWireframe } from './drawSmallGlyphWireframe.js';
import { resolveVrSmallGlyphProtoAstro } from '../protoAstro/resolveVrSmallGlyphProtoAstro.js';
import { ASTRO_FURNACE_PROCESS_KINDS } from './createVrAstroFurnaceActivateInteraction.js';
import { ASTRO_FURNACE_RUNE_TUNING_MODE } from './createVrAstroFurnaceOptionInteraction.js';
import { PROTO_ASTRO_FAMILIES, PROTO_ASTRO_NATURAL_FAMILY_CODES, resolveProtoAstroAssetUrl, resolveProtoAstroDescriptor } from '../protoAstro/protoAstroRegistry.js';
import { resolveVrRuneStonePreviewModel } from '../runes/createVrRuneStoneActor.js';

export const ASTRO_FURNACE_PANEL_STATES = Object.freeze({
  HIDDEN: 'HIDDEN', APPEARING: 'APPEARING', VISIBLE: 'VISIBLE', DISAPPEARING: 'DISAPPEARING'
});
export const ASTRO_FURNACE_PANEL_SCREENS = Object.freeze({
  HOME: 'HOME', ASTERION_SPHERE: 'ASTERION_SPHERE',
  ASTROLABIUM_MENU: 'ASTROLABIUM_MENU',
  ASTROLABIUM_PRODUCTION: 'ASTROLABIUM_PRODUCTION', ASTROLABIUM_TUNING: 'ASTROLABIUM_TUNING',
  RUNE_TUNING: 'RUNE_TUNING'
});
export const asterionPreviewAnimationActive = ({ panelState, screen }) =>
  panelState === ASTRO_FURNACE_PANEL_STATES.VISIBLE && screen === ASTRO_FURNACE_PANEL_SCREENS.ASTERION_SPHERE;
export const furnacePanelAnimationActive = ({ panelState, screen }) => panelState === ASTRO_FURNACE_PANEL_STATES.VISIBLE
  && [ASTRO_FURNACE_PANEL_SCREENS.HOME, ASTRO_FURNACE_PANEL_SCREENS.ASTERION_SPHERE,
    ASTRO_FURNACE_PANEL_SCREENS.ASTROLABIUM_PRODUCTION, ASTRO_FURNACE_PANEL_SCREENS.ASTROLABIUM_TUNING,
    ASTRO_FURNACE_PANEL_SCREENS.RUNE_TUNING].includes(screen);
const smoothstep = (value) => value * value * (3 - 2 * value);
export const wireframeDissolveVisible = (segment, progress) => progress < 1 && segment.dissolveOrder >= Math.max(0, progress);

export function createVrAstroFurnacePanel({ parent, furnace, controllers = [], progressionController, processSource, contentSource,
  productionController = null, astroProductionController = null, protoAstroTuningController = null, canUseAstroProduction = () => false,
  canUseAstroTuning = () => false,
  runeRecipeInteraction = null, runeRecipeSelectionController = null, runeTuningController = null,
  requestAstroProduction = () => false,
  asterionPreviewModel, astrolabiumPreviewModel, settings = {}, locale = 'pl', onEnterModule = () => {}, onReturnHome = () => {}, onCreate = () => {} }) {
  const copy = resolveVrFurnaceCopy(locale);
  const config = { width: 1.55, height: 1.05, gapFromFurnace: 0.10, verticalOffset: 0.15, yawDegrees: -12,
    canvasWidth: 1536, canvasHeight: 1024, appearDuration: 0.32, disappearDuration: 0.20,
    telemetryRefreshHz: 12, frameCornerSizePx: 28, spherePatchVisualScaleMultiplier: 1.10, accents: {}, ...settings };
  config.telemetryRefreshHz = Math.min(30, Math.max(4, config.telemetryRefreshHz));
  config.frameCornerSizePx = Math.min(64, Math.max(12, config.frameCornerSizePx));
  const accents = { asterion: '#72cfe8', attractor: '#c8ac70', emanation: '#a98bd4', idle: '#668493', process: '#9eeaff', complete: '#d9f8ff', ...config.accents };
  const root = new THREE.Group(); root.name = 'VrAstroFurnacePanelRoot';
  const canvas = document.createElement('canvas'); canvas.width = config.canvasWidth; canvas.height = config.canvasHeight;
  const context = canvas.getContext('2d');
  const texture = new THREE.CanvasTexture(canvas); texture.colorSpace = THREE.SRGBColorSpace;
  texture.minFilter = THREE.LinearFilter; texture.magFilter = THREE.LinearFilter;
  const createMaterial = () => new THREE.MeshBasicMaterial({ map: texture, side: THREE.FrontSide, transparent: true, depthWrite: false, opacity: 0 });
  const frontMaterial = createMaterial(), backMaterial = createMaterial();
  const frontGeometry = new THREE.PlaneGeometry(config.width, config.height);
  const backGeometry = new THREE.PlaneGeometry(config.width, config.height);
  const frontPlane = new THREE.Mesh(frontGeometry, frontMaterial); frontPlane.name = 'VrAstroFurnacePanelFrontPlane';
  const backPlane = new THREE.Mesh(backGeometry, backMaterial); backPlane.name = 'VrAstroFurnacePanelBackPlane';
  frontPlane.position.set(config.width / 2, 0, 0.0005);
  backPlane.position.set(config.width / 2, 0, -0.0005); backPlane.rotation.y = Math.PI;
  const renderPlanes = [frontPlane, backPlane];
  root.add(...renderPlanes); (parent ?? furnace?.object?.parent)?.add(root);
  const raycaster = new THREE.Raycaster(), origin = new THREE.Vector3(), direction = new THREE.Vector3();
  const quaternion = new THREE.Quaternion(), furnaceQuaternion = new THREE.Quaternion();
  const right = new THREE.Vector3(), up = new THREE.Vector3();
  const desiredWorldPosition = new THREE.Vector3(), desiredWorldQuaternion = new THREE.Quaternion(), desiredWorldScale = new THREE.Vector3();
  const yawQuaternion = new THREE.Quaternion(), yawAxis = new THREE.Vector3(0, 1, 0);
  const hits = new Map(controllers.map((record) => [record, null]));
  let state = ASTRO_FURNACE_PANEL_STATES.HIDDEN, screen = ASTRO_FURNACE_PANEL_SCREENS.HOME;
  let returnScreen = ASTRO_FURNACE_PANEL_SCREENS.HOME;
  let elapsed = 0, telemetryElapsed = 0, lastTelemetryRedraw = 0, completedUntil = 0, previousProcessState = 'IDLE';
  let lastSmallGlyphProcessAssetId = null;
  let lastRuneProcessRecipe = null, runeCompletedUntil = 0, previousRuneProcessState = 'IDLE';
  let hoveredRegion = null, interactiveRegions = [], disposed = false, redrawCount = 0;
  const moduleListeners = new Set();
  const patchGeometryByAssetId = createAsterionPatchGeometry(ASTERION_SHELL_PATCHES, {
    scaleMultiplier: config.spherePatchVisualScaleMultiplier
  });
  const patchDataByAssetId = Object.fromEntries(ASTERION_SHELL_PATCHES.map((patch) => [patch.assetId, patch]));
  const asterionCurvePresentation = createVrFurnaceCurvePresentation(asterionPreviewModel);
  const astrolabiumCurvePresentation = createVrFurnaceCurvePresentation(astrolabiumPreviewModel);
  const astrolabiumHomeCurvePresentation = astrolabiumCurvePresentation.home;
  const shellGlyphImages = Object.fromEntries(ASTERION_SHELL_PATCHES.map(({ assetId }) => {
    const glyph = resolveAttractorShellGlyph(assetId);
    const image = new Image();
    image.onload = () => { if (!disposed) draw(); };
    if (glyph) image.src = glyph.url;
    return [assetId, image];
  }));
  const smallGlyphEntries = Object.keys(SMALL_GLYPH_WIREFRAME_DATA.byAssetId).map((assetId) => {
    const protoAstro = resolveVrSmallGlyphProtoAstro(assetId);
    if (!protoAstro) throw new Error(`Missing canonical Proto-Astro identity for Small Glyph "${assetId}".`);
    const image = new Image();
    image.onload = () => { if (!disposed) draw(); };
    image.src = protoAstro.assetUrl;
    return Object.freeze({ assetId, protoAstro, image });
  });
  const FAMILY_GRID_CODES = Object.freeze(['L', 'R', 'K', 'T', 'S', 'V']);
  const FAMILY_GRID = Object.freeze({ x: 90, y: 300, columns: 3, cellWidth: 405, cellHeight: 165, columnGap: 50, rowGap: 20 });
  const familyGridRect = (index, prefix, enabled = true) => ({ id: `${prefix}-${FAMILY_GRID_CODES[index]}`,
    x: FAMILY_GRID.x + index % FAMILY_GRID.columns * (FAMILY_GRID.cellWidth + FAMILY_GRID.columnGap),
    y: FAMILY_GRID.y + Math.floor(index / FAMILY_GRID.columns) * (FAMILY_GRID.cellHeight + FAMILY_GRID.rowGap),
    width: FAMILY_GRID.cellWidth, height: FAMILY_GRID.cellHeight, enabled });
  const smallGlyphByFamily = new Map(smallGlyphEntries.map((entry) => [entry.protoAstro.descriptor.familyCode, entry]));
  const runeStoneWireframeByFamily = new Map(FAMILY_GRID_CODES.map((familyCode) => [familyCode,
    createAsterionModelWireframeMap(resolveVrRuneStonePreviewModel(familyCode), { maxSegments: 420, minLength: .006, thresholdAngle: 20 })]));
  const protoAstroImageCache = new Map();

  function panelRect(x, y, width, height, options = {}) {
    drawFurnaceFrame(context, { x, y, width, height, cornerSize: options.cornerSize ?? config.frameCornerSizePx, ...options });
  }
  function text(value, x, y, size = 34, color = '#e8f7ff') {
    context.fillStyle = color; context.font = `${size}px sans-serif`; context.fillText(value, x, y);
  }
  function drawProcessWireframe({ segments, cx, cy, scale, yaw, pitch, dissolve, color, alpha, lineWidth, shadowBlur }) {
    const cosY = Math.cos(yaw), sinY = Math.sin(yaw), cosX = Math.cos(pitch), sinX = Math.sin(pitch);
    context.save(); context.globalAlpha = alpha; context.strokeStyle = color; context.lineWidth = lineWidth;
    context.shadowColor = color; context.shadowBlur = shadowBlur; context.beginPath();
    segments.forEach((segment) => {
      if (!wireframeDissolveVisible(segment, dissolve)) return;
      const arx = segment.ax * cosY + segment.az * sinY, arz = -segment.ax * sinY + segment.az * cosY;
      const ary = segment.ay * cosX - arz * sinX, ad = 1 / Math.max(.65, 1 + (segment.ay * sinX + arz * cosX) * .16);
      const brx = segment.bx * cosY + segment.bz * sinY, brz = -segment.bx * sinY + segment.bz * cosY;
      const bry = segment.by * cosX - brz * sinX, bd = 1 / Math.max(.65, 1 + (segment.by * sinX + brz * cosX) * .16);
      context.moveTo(cx + arx * scale * ad, cy - ary * scale * ad);
      context.lineTo(cx + brx * scale * bd, cy - bry * scale * bd);
    });
    context.stroke(); context.restore();
  }
  function getProtoAstroImage(descriptor) {
    if (!descriptor?.syllable) return null;
    let image = protoAstroImageCache.get(descriptor.syllable);
    if (image) return image;
    const url = resolveProtoAstroAssetUrl(descriptor);
    if (!url) return null;
    image = new Image();
    image.onload = () => { if (!disposed) draw(); };
    image.src = url;
    protoAstroImageCache.set(descriptor.syllable, image);
    return image;
  }
  function drawRuneStoneWireframe(familyCode, cx, cy, scale, color, alpha = .9) {
    const wireframe = runeStoneWireframeByFamily.get(familyCode);
    if (!wireframe?.segments?.length) return;
    const yaw = telemetryElapsed * .20, pitch = -.24;
    const cyaw = Math.cos(yaw), syaw = Math.sin(yaw), cp = Math.cos(pitch), sp = Math.sin(pitch);
    const project = ([x, y, z]) => {
      const rx = x * cyaw + z * syaw, rz = -x * syaw + z * cyaw;
      const ry = y * cp - rz * sp, depth = 1 / Math.max(.7, 1 + (y * sp + rz * cp) * .14);
      return [cx + rx * scale * depth, cy - ry * scale * depth];
    };
    context.save(); context.strokeStyle = color; context.globalAlpha = alpha; context.lineWidth = 1.55;
    context.shadowColor = color; context.shadowBlur = 7; context.beginPath();
    wireframe.segments.forEach((segment) => {
      const a = project(segment.a), b = project(segment.b);
      context.moveTo(a[0], a[1]); context.lineTo(b[0], b[1]);
    });
    context.stroke(); context.restore();
  }
  function drawHome(progress) {
    text(copy.home.title, 90, 100, 52); text(copy.home.eyebrow, 90, 152, 25, '#83b8d1');
    const asterionProductionState = productionController?.getState?.() ?? 'LOCKED';
    const asterionFinalState = copy.home.asterionStates[asterionProductionState];
    const astroProductionState = astroProductionController?.getState?.() ?? 'READY';
    const astroModuleAvailable = canUseAstroProduction() || canUseAstroTuning() || astroProductionState !== 'READY';
    const cards = [
      ['module-asterion-sphere', copy.asterion.title, copy.asterion.detail,
        asterionFinalState ? copy.home.asterionStatusMetric : copy.home.asterionMetric,
        asterionFinalState ?? copy.home.asterionAvailable(progress.absorbed), true],
      ['module-astro-attractor', copy.astrolabium.title, copy.astrolabium.detail, copy.home.astrolabiumMetric,
        copy.home.astrolabiumStates[astroProductionState] ?? copy.home.astrolabiumStates.DEFAULT,
        astroModuleAvailable]
    ];
    interactiveRegions = cards.map((card, index) => {
      const rect = { id: card[0], x: 90, y: 245 + index * 285, width: 1356, height: 235, enabled: card[5] };
      const accentColor = [accents.asterion, accents.attractor][index];
      panelRect(rect.x, rect.y, rect.width, rect.height, { hovered: hoveredRegion === rect.id, active: card[5], locked: !card[5], accentColor });
      text(card[1], rect.x + 42, rect.y + 70, 39, card[5] ? '#f1fbff' : '#78909d');
      text(card[2], rect.x + 42, rect.y + 128, 25, '#91afbe'); text(card[3], rect.x + 42, rect.y + 190, 21, '#6f9db5');
      const statusRight = card[0] === 'module-astro-attractor' ? rect.x + rect.width - 385 : rect.x + rect.width - 42;
      context.textAlign = 'right'; text(card[4], statusRight, rect.y + 190, 22, card[5] ? '#bdefff' : '#91afbe'); context.textAlign = 'left';
      if (card[0] === 'module-astro-attractor') drawVrFurnaceCurvePresentation(context, astrolabiumHomeCurvePresentation, {
        cx: rect.x + rect.width - 210, cy: rect.y + 118, scale: 88, elapsed: telemetryElapsed,
        color: accents.attractor, bright: hoveredRegion === rect.id
      });
      return rect;
    });
  }
  function drawAstrolabiumMenu() {
    interactiveRegions = [{ id: 'back-modules', x: 90, y: 55, width: 260, height: 70, enabled: true }];
    panelRect(90, 55, 260, 70, { hovered: hoveredRegion === 'back-modules', accentColor: accents.attractor });
    text(copy.navigation.backModules, 120, 102, 27); text(copy.astrolabium.title, 90, 190, 48);
    text(copy.astrolabium.menuEyebrow, 90, 238, 24, '#b9a779');
    const entries = [
      ['astrolabium-create', ...copy.astrolabium.menu.create],
      ['astrolabium-glyph-tuning', ...copy.astrolabium.menu.glyphTuning],
      ['astrolabium-rune-tuning', ...copy.astrolabium.menu.runeTuning]
    ];
    entries.forEach(([id, title, detail], index) => {
      const enabled = id !== 'astrolabium-rune-tuning' || (furnace?.capabilities?.runeRecipeAnchorsReady === true
        && Boolean(runeRecipeSelectionController));
      const rect = { id, x: 90, y: 285 + index * 215, width: 1315, height: 175, enabled };
      interactiveRegions.push(rect); panelRect(rect.x, rect.y, rect.width, rect.height, { hovered: hoveredRegion === id,
        active: enabled, locked: !enabled, accentColor: accents.attractor });
      text(title, rect.x + 38, rect.y + 70, 32, enabled ? '#f1fbff' : '#78909d');
      text(detail, rect.x + 38, rect.y + 122, 22, enabled ? '#91afbe' : '#667681');
    });
  }
  const runeFamilyLabels = copy.runeTuning.families;
  const runeLabel = (familyCode) => runeFamilyLabels[PROTO_ASTRO_FAMILIES[familyCode]?.id] ?? familyCode ?? '—';
  function drawRuneTuning() {
    const snapshot = runeRecipeSelectionController?.getSnapshot?.() ?? { availableFamilyCodes: [] };
    const tuning = runeTuningController?.getSnapshot?.() ?? { processing: false, targetFamilyCode: null };
    interactiveRegions = [{ id: 'back-modules', x: 90, y: 55, width: 260, height: 70, enabled: true }];
    panelRect(90, 55, 260, 70, { hovered: hoveredRegion === 'back-modules', accentColor: accents.emanation });
    text(copy.navigation.backModules, 120, 102, 27);
    text(copy.runeTuning.title, 90, 180, 43);
    text(copy.runeTuning.instruction, 90, 225, 22, '#b89dd0');
    FAMILY_GRID_CODES.forEach((familyCode, index) => {
      const natural = PROTO_ASTRO_NATURAL_FAMILY_CODES.includes(familyCode);
      const available = natural ? snapshot.availableFamilyCodes.includes(familyCode) : snapshot.etherAvailable === true;
      const tuned = natural ? snapshot.tunedFamilyCodes?.includes(familyCode) === true : snapshot.etherTuned === true;
      const tunable = natural ? snapshot.tunableFamilyCodes?.includes(familyCode) === true : snapshot.etherTunable === true;
      const selected = snapshot.selectedFamilyCode === familyCode;
      const rect = familyGridRect(index, 'rune-family', tunable && !tuning.processing);
      interactiveRegions.push(rect);
      panelRect(rect.x, rect.y, rect.width, rect.height, { hovered: hoveredRegion === rect.id, active: selected || available,
        locked: !available, accentColor: accents.emanation });
      const runeDescriptor = resolveProtoAstroDescriptor(familyCode, 'U');
      const runeImage = getProtoAstroImage(runeDescriptor);
      const color = selected || tuned ? accents.complete : available ? accents.emanation : accents.idle;
      text(copy.runeTuning.familyCard(runeLabel(familyCode), runeDescriptor?.syllable ?? familyCode), rect.x + 20, rect.y + 32, 22,
        available ? '#f1eaff' : '#78909d');
      drawMaterialCardVisual(context, { x: rect.x + 5, y: rect.y + 25, width: rect.width - 10, height: rect.height - 52,
        glyphRatio: .62, padding: 3, glyphImage: runeImage, color,
        drawPreview: ({ cx, cy, scale }) => drawRuneStoneWireframe(familyCode, cx, cy, scale, color, natural ? .94 : .55) });
      text(tuned ? copy.runeTuning.familyStates.tuned : selected ? copy.runeTuning.familyStates.selected : !natural ? copy.runeTuning.familyStates.special : copy.runeTuning.familyStates.available, rect.x + 20, rect.y + 118, 18,
        tuned || selected ? accents.complete : available ? '#cdb5e4' : '#70828d');
    });

    drawRuneTuningProcessMonitor(snapshot, tuning);
  }
  function drawRuneTuningProcessMonitor(snapshot, tuning) {
    const x = 58, y = 675, width = 1420, height = 295;
    const liveRecipe = snapshot.expectedRecipe;
    const glyphInserted = snapshot.slots?.smallGlyph?.state === 'INSERTED';
    const shellInserted = snapshot.slots?.shell?.state === 'INSERTED';
    const runeProcess = processSource?.getProcessKind?.() === ASTRO_FURNACE_PROCESS_KINDS.RUNE_TUNING;
    const rawProcessState = processSource?.getState?.() ?? 'IDLE';
    if (liveRecipe && liveRecipe !== lastRuneProcessRecipe) {
      lastRuneProcessRecipe = liveRecipe;
      runeCompletedUntil = 0;
    }
    if (runeProcess && !liveRecipe && rawProcessState === 'COMPLETE' && previousRuneProcessState !== 'COMPLETE') {
      runeCompletedUntil = telemetryElapsed + 1.6;
    }
    previousRuneProcessState = runeProcess ? rawProcessState : 'IDLE';
    const completing = runeProcess && !liveRecipe && rawProcessState === 'COMPLETE'
      && runeCompletedUntil > telemetryElapsed && Boolean(lastRuneProcessRecipe);
    if (!runeProcess || (rawProcessState === 'COMPLETE' && !completing && !liveRecipe)) lastRuneProcessRecipe = null;
    const recipe = liveRecipe ?? (completing ? lastRuneProcessRecipe : null);
    const processing = runeProcess && tuning.processing === true;
    const telemetry = processing ? readTelemetry() : null;
    const phase = completing ? 'COMPLETE' : telemetry?.phase ?? 'IDLE';
    const processColor = completing ? accents.complete : processing ? accents.process : accents.emanation;
    const progress = completing ? 1 : processing ? Math.max(0, Math.min(1, processSource?.getProgress?.() ?? 0)) : 0;
    const dissolve = phase === 'EXTRACTION'
      ? Math.max(0, Math.min(1, processSource?.getExtractionProgress?.() ?? 0)) : 0;
    const showWireframes = !['COOLDOWN', 'COMPLETE'].includes(phase);
    panelRect(x, y, width, height, { variant: 'monitor', active: !completing && (processing || snapshot.readyForTuning),
      completed: completing, accentColor: processColor });
    text(copy.runeTuning.monitorHeading, x + 28, y + 38, 21, processColor);

    const drawIngredient = ({ descriptor, familyCode, kind, identityX, signX, previewX, segments, inserted }) => {
      const image = getProtoAstroImage(descriptor);
      const identity = recipe
        ? `${kind} — ${copy.runeTuning.familyCard(runeLabel(familyCode), descriptor?.syllable ?? familyCode)}`
        : `${kind} — —`;
      text(identity, identityX, y + 38, 17, recipe ? '#b89dd0' : '#667681');
      if (recipe) drawMaterialCardVisual(context, { x: signX, y: y + 58, width: 164, height: 125,
        glyphRatio: 1, padding: 5, glyphImage: image, color: inserted ? processColor : accents.emanation });
      if (!recipe || !showWireframes || !segments?.length) return;
      const pulse = inserted || processing ? .78 + .22 * Math.sin(telemetryElapsed * (processing ? 5 : 3)) : .38;
      drawProcessWireframe({ segments, cx: previewX, cy: y + 151, scale: 105,
        yaw: telemetryElapsed * (processing ? .38 : .16), pitch: -.28, dissolve,
        color: processColor, alpha: pulse, lineWidth: processing || inserted ? 3.2 : 2.2,
        shadowBlur: processing || inserted ? 12 : 5 });
    };

    const glyph = recipe ? smallGlyphByFamily.get(recipe.smallGlyphFamilyCode) : null;
    const shellWireframe = showWireframes && recipe
      ? runeRecipeInteraction?.getInsertedShell?.()?.userData?.panelWireframe : null;
    drawIngredient({ descriptor: recipe?.smallGlyphDescriptor, familyCode: recipe?.smallGlyphFamilyCode,
      kind: copy.runeTuning.slots.glyph, identityX: x + 310, signX: x + 28, previewX: x + 450,
      segments: glyph ? SMALL_GLYPH_WIREFRAME_DATA.byAssetId[glyph.assetId]?.segments3d : null, inserted: glyphInserted });
    drawIngredient({ descriptor: recipe?.shellDescriptor, familyCode: recipe?.shellFamilyCode,
      kind: copy.runeTuning.slots.shell, identityX: x + 1010, signX: x + 730, previewX: x + 1150,
      segments: shellWireframe?.segments, inserted: shellInserted });

    const status = completing ? copy.runeTuning.status.complete
      : processing ? copy.extraction.status(telemetry.label)
      : !recipe || !glyphInserted || !shellInserted ? copy.runeTuning.status.waiting
      : snapshot.readyForTuning ? copy.runeTuning.status.ready : copy.runeTuning.status.invalid;
    text(status, x + 28, y + 235, 19, completing ? accents.complete
      : processing ? accents.process : snapshot.readyForTuning ? accents.complete : '#d6b3c3');
    const barX = x + 28, barY = y + 256, barWidth = width - 135;
    context.fillStyle = '#18303c'; context.fillRect(barX, barY, barWidth, 16);
    context.fillStyle = processColor; context.fillRect(barX, barY, barWidth * progress, 16);
    text(copy.runeTuning.progress(Math.round(progress * 100)), barX + barWidth + 18, barY + 17, 19,
      completing ? accents.complete : '#b9dce8');
  }
  function drawAstrolabiumProduction() {
    interactiveRegions = [{ id: 'back-modules', x: 90, y: 55, width: 260, height: 70, enabled: true }];
    panelRect(90, 55, 260, 70, { hovered: hoveredRegion === 'back-modules', accentColor: accents.attractor });
    text(copy.navigation.backModules, 120, 102, 27);
    text(copy.astrolabium.title, 90, 190, 48);
    text(copy.astrolabium.detail, 90, 238, 24, '#b9a779');

    const production = astroProductionController?.getSnapshot?.() ?? { state: 'READY', constructionProgress: 0 };
    const previewX = 470, previewY = 525;
    panelRect(90, 285, 760, 515, { variant: 'monitor', active: production.state === 'BUILDING',
      completed: ['AVAILABLE', 'EARNED'].includes(production.state), accentColor: accents.attractor });
    const constructionProgress = production.state === 'BUILDING'
      ? Math.max(0, Math.min(1, production.constructionProgress ?? 0))
      : ['AVAILABLE', 'EARNED'].includes(production.state) ? 1 : 0;
    drawVrFurnaceCurvePresentation(context, astrolabiumCurvePresentation, {
      cx: previewX, cy: previewY, scale: 235, elapsed: telemetryElapsed, progress: constructionProgress,
      color: accents.attractor, bright: production.state !== 'READY'
    });

    panelRect(900, 285, 505, 515, { variant: 'monitor', active: production.state === 'BUILDING',
      completed: ['AVAILABLE', 'EARNED'].includes(production.state), accentColor: accents.attractor });
    text(copy.production.heading, 940, 350, 22, '#8fb1c1');
    const [title, detail] = copy.production.states[production.state] ?? copy.production.states.DEFAULT;
    text(title, 940, 425, 29, production.state === 'AVAILABLE' ? accents.complete : accents.attractor);
    text(detail, 940, 470, 19, '#91afbe');
    if (production.state === 'BUILDING') {
      const progress = Math.max(0, Math.min(1, production.constructionProgress ?? production.buildProgress ?? 0));
      context.fillStyle = '#18303c'; context.fillRect(940, 525, 420, 18);
      context.fillStyle = accents.process; context.fillRect(940, 525, 420 * progress, 18);
      text(copy.production.progress(Math.round(progress * 100)), 940, 580, 25, accents.process);
    }
    if (astroProductionController?.canCreate?.() === true) {
      const create = { id: 'create-astro-attractor', x: 995, y: 670, width: 315, height: 82, enabled: true };
      interactiveRegions.push(create);
      panelRect(create.x, create.y, create.width, create.height, { hovered: hoveredRegion === create.id,
        active: true, accentColor: accents.complete });
      text(copy.action.create, create.x + 76, create.y + 53, 32, accents.complete);
    }
  }
  function drawAstrolabiumTuning() {
    interactiveRegions = [{ id: 'back-modules', x: 90, y: 55, width: 260, height: 70, enabled: true }];
    panelRect(90, 55, 260, 70, { hovered: hoveredRegion === 'back-modules', accentColor: accents.attractor });
    text(copy.navigation.backModules, 120, 102, 27);
    text(copy.glyphTuning.title, 90, 190, 48);
    text(copy.glyphTuning.detail, 90, 238, 24, '#b9a779');

    text(copy.glyphTuning.section, 90, 282, 31, canUseAstroTuning() ? '#f1fbff' : '#78909d');
    const tuningSnapshot = protoAstroTuningController?.getSnapshot?.() ?? { families: [] };
    const families = new Map(tuningSnapshot.families.map((family) => [family.familyCode, family]));
    const insertedAssetId = contentSource?.getInsertedSmallGlyphAssetId?.() ?? null;
    const contentState = contentSource?.getState?.() ?? 'EMPTY';
    FAMILY_GRID_CODES.forEach((familyCode, index) => {
      const { assetId, protoAstro, image } = smallGlyphByFamily.get(familyCode);
      const { x, y, width, height } = familyGridRect(index, 'small-glyph', false);
      const family = families.get(protoAstro.descriptor.familyCode);
      const supported = Boolean(family);
      const extracted = family?.extracted === true;
      const processing = supported && insertedAssetId === assetId
        && ['INSERTED', 'CONSUMING', 'CONSUMED'].includes(contentState);
      const color = extracted ? accents.complete : processing ? accents.process : supported ? accents.attractor : accents.idle;
      panelRect(x, y, width, height, { variant: 'monitor', active: supported && !extracted,
        completed: extracted, locked: !supported, accentColor: color });
      text(copy.runeTuning.familyCard(runeLabel(protoAstro.descriptor.familyCode), protoAstro.descriptor.syllable),
        x + 20, y + 32, 22, color);
      drawMaterialCardVisual(context, { x: x + 5, y: y + 25, width: width - 10, height: height - 34,
        glyphRatio: .68, glyphScale: 2.75, padding: 3, glyphImage: image, color,
        drawPreview: ({ cx, cy, scale }) => drawSmallGlyphWireframe(context,
          { assetId, cx, cy, scale, color, alpha: supported ? .95 : .34, yaw: telemetryElapsed * .20, pitch: -.24 }) });
      text(extracted ? copy.glyphTuning.states.tuned : processing ? copy.glyphTuning.states.processing : supported ? copy.glyphTuning.states.ready : copy.glyphTuning.states.inactive,
        x + 20, y + height - 12, 16, color);
    });
    drawSmallGlyphExtractionMonitor();
  }
  function drawSmallGlyphExtractionMonitor() {
    const x = 58, y = 675, width = 1420, height = 295;
    const currentAssetId = contentSource?.getInsertedSmallGlyphAssetId?.() ?? null;
    const contentState = contentSource?.getState?.() ?? 'EMPTY';
    const processKind = processSource?.getProcessKind?.() ?? null;
    const telemetry = readTelemetry();
    const smallGlyphProcess = processKind === ASTRO_FURNACE_PROCESS_KINDS.SMALL_GLYPH_ESSENCE_EXTRACTION;
    if (currentAssetId) lastSmallGlyphProcessAssetId = currentAssetId;
    else if ((processKind && !smallGlyphProcess) || telemetry.phase === 'IDLE')
      lastSmallGlyphProcessAssetId = null;
    const presentationAssetId = currentAssetId ?? lastSmallGlyphProcessAssetId;
    const presentationTail = Boolean(presentationAssetId && telemetry.phase === 'COMPLETE');
    const concernsSmallGlyph = Boolean(currentAssetId || smallGlyphProcess || presentationTail);
    const protoAstro = concernsSmallGlyph ? resolveVrSmallGlyphProtoAstro(presentationAssetId) : null;
    const shownTelemetry = concernsSmallGlyph ? telemetry : resolveProcessTelemetry({ contentState: 'EMPTY' }, copy.telemetry);
    const color = accents[shownTelemetry.colorKey];
    panelRect(x, y, width, height, { variant: 'monitor', active: concernsSmallGlyph && shownTelemetry.active,
      completed: concernsSmallGlyph && shownTelemetry.phase === 'COMPLETE', accentColor: color });
    text(copy.extraction.heading, x + 28, y + 42, 22, color);
    drawInsertedSmallGlyphWireframe(protoAstro, shownTelemetry, x + 300, y + 145, 112);
    text(protoAstro && concernsSmallGlyph ? copy.extraction.glyph(protoAstro.descriptor.syllable) : copy.extraction.glyphWaiting,
      x + 610, y + 92, 23, protoAstro && concernsSmallGlyph ? color : accents.idle);
    shownTelemetry.label.split('\n').forEach((line, index) => text(index ? line : copy.extraction.status(line),
      x + 610, y + 137 + index * 28, 20, color));
    const progress = shownTelemetry.showProgress ? shownTelemetry.extractionProgress : 0;
    const barX = x + 610, barY = y + 232, barWidth = 560;
    context.fillStyle = '#18303c'; context.fillRect(barX, barY, barWidth, 16);
    context.fillStyle = color; context.fillRect(barX, barY, barWidth * progress, 16);
    text(copy.extraction.progress(Math.round(progress * 100)), barX + barWidth + 18, barY + 17, 20, '#b9dce8');
    const contentLabels = copy.extraction.materialStates;
    if (concernsSmallGlyph && contentLabels[contentState]) text(contentLabels[contentState], x + 610, y + 277, 18, '#88b8cf');
  }
  function drawInsertedSmallGlyphWireframe(protoAstro, telemetry, cx, cy, scale) {
    const segments = protoAstro ? SMALL_GLYPH_WIREFRAME_DATA.byAssetId[protoAstro.assetId]?.segments3d : null;
    if (!segments?.length || ['COOLDOWN', 'COMPLETE'].includes(telemetry.phase)) return;
    const dissolve = telemetry.phase === 'EXTRACTION' ? telemetry.extractionProgress : 0;
    const processing = telemetry.active || (contentSource?.getState?.() ?? 'EMPTY') !== 'INSERTED';
    drawProcessWireframe({ segments, cx, cy, scale, yaw: telemetryElapsed * (processing ? .38 : .16), pitch: -.28,
      dissolve, color: accents[telemetry.colorKey], alpha: .78 + .22 * Math.sin(telemetryElapsed * (processing ? 5 : 3)),
      lineWidth: processing ? 2.2 : 1.7, shadowBlur: processing ? 12 : 7 });
  }
  function drawSphere(progress) {
    interactiveRegions = [{ id: 'back-modules', x: 90, y: 55, width: 260, height: 70, enabled: true }];
    panelRect(90, 55, 260, 70, { hovered: hoveredRegion === 'back-modules', accentColor: accents.asterion }); text(copy.navigation.backModules, 120, 102, 27);
    text(copy.asterion.title, 90, 190, 48); text(copy.asterion.detail, 90, 238, 24, '#88b8cf');
    const currentAssetId = contentSource?.getInsertedShellAssetId?.();
    const currentState = contentSource?.getState?.() ?? 'EMPTY';
    const shellsByFamily = new Map(progress.shells.map((shell) => [resolveAttractorShellGlyph(shell.assetId)?.familyCode, shell]));
    FAMILY_GRID_CODES.forEach((familyCode, index) => {
      const shell = shellsByFamily.get(familyCode) ?? progress.shells[index];
      if (!shell) return;
      const rect = familyGridRect(index, 'shell', false);
      const { x, y, width, height } = rect;
      const processing = shell.assetId === currentAssetId && !shell.absorbed && ['CONSUMING', 'CONSUMED'].includes(currentState);
      panelRect(x, y, width, height, { active: shell.absorbed || processing, completed: shell.absorbed, accentColor: shell.absorbed ? accents.asterion : processing ? accents.process : accents.idle });
      const color = shell.absorbed ? accents.complete : processing ? accents.process : accents.idle;
      const shellDescriptor = resolveAttractorShellGlyph(shell.assetId);
      text(copy.runeTuning.familyCard(runeLabel(shellDescriptor?.familyCode), shellDescriptor?.syllable ?? familyCode),
        rect.x + 20, rect.y + 32, 22, shell.absorbed || processing ? '#f1eaff' : '#78909d');
      drawMaterialCardVisual(context, { x: rect.x + 5, y: rect.y + 25, width: rect.width - 10, height: rect.height - 34,
        glyphRatio: .68, padding: 3,
        glyphImage: shellGlyphImages[shell.assetId], color,
        drawPreview: ({ cx, cy, scale }) => drawShellMiniature(patchDataByAssetId[shell.assetId], cx, cy, scale, color, shell.absorbed || processing) });
    });
    drawProcessMonitor();
    const productionState = productionController?.getState?.() ?? 'LOCKED';
    if (productionState === 'READY' && productionController?.canCreate?.() === true) {
      const create = { id: 'create-asterion', x: 930, y: 858, width: 410, height: 82, enabled: true };
      interactiveRegions.push(create); panelRect(create.x, create.y, create.width, create.height, { hovered: hoveredRegion === create.id, active: true, accentColor: accents.complete });
      text(copy.action.create, create.x + 118, create.y + 53, 32, accents.complete);
    } else if (productionState === 'BUILDING') text(copy.sphere.productionStates.BUILDING, 1030, 918, 27, accents.process);
    else if (productionState === 'AVAILABLE') { text(copy.sphere.productionStates.AVAILABLE[0], 1050, 892, 28, accents.complete); text(copy.sphere.productionStates.AVAILABLE[1], 1030, 928, 19, '#88b8cf'); }
    else if (productionState === 'EARNED') { text(copy.sphere.productionStates.EARNED[0], 1110, 892, 28, accents.complete); text(copy.sphere.productionStates.EARNED[1], 1015, 928, 19, '#88b8cf'); }
  }
  function drawShellMiniature(patch, cx, cy, scale, color, bright) {
    if (!patch) return;
    context.save(); context.strokeStyle = color; context.globalAlpha = bright ? .92 : .25; context.lineWidth = bright ? 1.8 : 1.2;
    context.shadowColor = bright ? color : 'transparent'; context.shadowBlur = bright ? 7 : 0; context.beginPath();
    patch.segments2d.forEach(([ax, ay, bx, by]) => { context.moveTo(cx + ax * scale, cy - ay * scale); context.lineTo(cx + bx * scale, cy - by * scale); });
    context.stroke(); context.restore();
  }
  function readTelemetry() {
    const rawState = processSource?.getState?.() ?? 'IDLE';
    if (rawState === 'COMPLETE' && previousProcessState !== 'COMPLETE') completedUntil = telemetryElapsed + 1.6;
    previousProcessState = rawState;
    const completed = completedUntil > telemetryElapsed;
    return resolveProcessTelemetry({ state: rawState === 'COMPLETE' && !completed ? 'IDLE' : rawState,
      overallProgress: processSource?.getProgress?.() ?? 0, extractionProgress: processSource?.getExtractionProgress?.() ?? 0,
      angularSpeed: processSource?.getAngularSpeed?.() ?? 0, processAngle: processSource?.getProcessAngle?.() ?? 0, completed,
      contentState: contentSource?.getState?.() ?? 'EMPTY', chamberState: contentSource?.getChamberState?.() ?? 'CLOSED' }, copy.telemetry);
  }
  function drawProcessMonitor() {
    const telemetry = readTelemetry(), x = 58, y = 675, width = 1420, height = 295;
    const production = productionController?.getSnapshot?.() ?? { state: 'LOCKED', constructionProgress: 0, formationProgress: 0 };
    const constructing = production.state === 'BUILDING';
    const earned = production.state === 'EARNED';
    panelRect(x, y, width, height, { variant: 'monitor', active: telemetry.active || constructing,
      completed: earned || telemetry.phase === 'COMPLETE', accentColor: earned ? accents.complete : accents[telemetry.colorKey] });
    text(earned ? copy.sphere.completed[0] : constructing ? copy.sphere.monitorHeading.constructing : copy.sphere.monitorHeading.absorbing,
      x + 28, y + 42, 22, earned ? accents.complete : accents[telemetry.colorKey]);
    if (!earned) drawInsertedShellWireframe(telemetry, x + 300, y + 136, 108);
    const constructionLabel = production.constructionProgress < 1 / 6 ? copy.sphere.constructionStates[0] : production.constructionProgress < 1 / 3
      ? copy.sphere.constructionStates[1] : production.constructionProgress < 5 / 6 ? copy.sphere.constructionStates[2] : copy.sphere.constructionStates[3];
    (earned ? [copy.sphere.completed[1]] : constructing ? [constructionLabel] : telemetry.label.split('\n')).forEach((line, index) =>
      text(earned || constructing || index ? line : copy.sphere.monitorStatus(line), x + 28, y + 212 + index * 28, 21,
        earned ? accents.complete : accents[telemetry.colorKey]));
    if (!earned && (telemetry.showProgress || constructing)) {
      const barX = x + 28, barY = y + 255, barWidth = 555; context.fillStyle = '#18303c'; context.fillRect(barX, barY, barWidth, 16);
      const shownProgress = constructing ? production.constructionProgress : telemetry.extractionProgress;
      context.fillStyle = accents[telemetry.colorKey]; context.fillRect(barX, barY, barWidth * shownProgress, 16);
      text(copy.sphere.progress(Math.round(shownProgress * 100)), barX + barWidth + 18, barY + 17, 20, '#b9dce8');
    }
    drawAsterionPreview(progressSnapshot(), telemetry, x + 855, y + 140, 112);
    const contentState = contentSource?.getState?.() ?? 'EMPTY';
    const contentLabels = copy.sphere.materialStates;
    if (!earned && contentLabels[contentState]) { context.textAlign = 'right'; text(contentLabels[contentState], x + width - 28, y + 278, 19, '#88b8cf'); context.textAlign = 'left'; }
  }
  function drawInsertedShellWireframe(telemetry, cx, cy, scale) {
    const data = contentSource?.getInsertedShellWireframe?.();
    if (!data?.segments?.length || ['COOLDOWN', 'COMPLETE'].includes(telemetry.phase)) return;
    const contentState = contentSource?.getState?.() ?? 'EMPTY';
    if (!['INSERTED', 'CONSUMING', 'CONSUMED'].includes(contentState)) return;
    const processing = telemetry.active || contentState !== 'INSERTED';
    const dissolve = telemetry.phase === 'EXTRACTION' ? telemetry.extractionProgress : 0;
    const pulse = .78 + .22 * Math.sin(telemetryElapsed * (processing ? 5 : 3));
    drawProcessWireframe({ segments: data.segments, cx, cy, scale, yaw: telemetryElapsed * (processing ? .38 : .16), pitch: -.28,
      dissolve, color: accents[telemetry.colorKey], alpha: pulse, lineWidth: processing ? 4.5 : 3.5,
      shadowBlur: processing ? 15 : 8 });
  }
  function progressSnapshot() { return progressionController.getAsterionSphereProgress(); }
  function drawAsterionPreview(progress, telemetry, cx, cy, radius) {
    const yaw = telemetryElapsed * .16, pitch = -.24 + Math.sin(telemetryElapsed * .07) * .08;
    const cosineY = Math.cos(yaw), sineY = Math.sin(yaw), cosineX = Math.cos(pitch), sineX = Math.sin(pitch);
    const assetId = contentSource?.getInsertedShellAssetId?.(), contentState = contentSource?.getState?.() ?? 'EMPTY';
    const states = resolvePatchVisualStates(progress, { assetId, contentState, phase: telemetry.phase, extractionProgress: telemetry.extractionProgress });
    const rotate = ([x, y, z]) => { const rx = x * cosineY + z * sineY, rz = -x * sineY + z * cosineY; return [rx, y * cosineX - rz * sineX, y * sineX + rz * cosineX]; };
    const drawPatches = (predicate, color, alpha, glow = 0) => {
      if (alpha <= 0) return;
      context.save(); context.strokeStyle = color; context.globalAlpha = alpha; context.lineWidth = 1.6; context.shadowColor = color; context.shadowBlur = glow; context.beginPath();
      ASTERION_SHELL_PATCHES.forEach((patch) => patchGeometryByAssetId[patch.assetId].fragments.forEach((fragment) => {
        if (!predicate(patch.assetId, fragment)) return;
        const a = rotate(fragment.a), b = rotate(fragment.b), depth = (a[2] + b[2]) * .5;
        if (depth <= -.02) return;
        context.moveTo(cx + a[0] * radius, cy - a[1] * radius); context.lineTo(cx + b[0] * radius, cy - b[1] * radius);
      }));
      context.stroke(); context.restore();
    };
    text(copy.sphere.preview(progress.absorbed), cx - 190, cy - 108, 20, accents.asterion);
    const production = productionController?.getSnapshot?.() ?? { state: 'LOCKED', constructionProgress: 0, formationProgress: 0 };
    const building = production.state === 'BUILDING';
    const available = production.state === 'AVAILABLE';
    const earned = production.state === 'EARNED';
    const finalProduct = available || earned;
    const formationProgress = Math.max(0, Math.min(1, production.formationProgress ?? 0));
    const extracting = telemetry.phase === 'EXTRACTION';

    if (!building && !finalProduct && !extracting) drawPatches(() => true, '#6aa6b8', .1);
    drawPatches((id, fragment) => states[id]?.committed
      && (!building || fragment.assemblyOrder <= 1 - formationProgress), accents.complete,
      finalProduct ? 0 : (progress.complete ? .94 + Math.sin(telemetryElapsed * 2) * .04 : .9), 9);
    if (!finalProduct) drawPatches((id, fragment) => states[id]?.pending
      && assemblySegmentVisible(fragment, states[id].assemblyProgress), accents.process, .9, 10);

    context.save(); context.strokeStyle = '#588797'; context.globalAlpha = .22; context.lineWidth = 1.2; context.beginPath(); context.arc(cx, cy, radius, 0, Math.PI * 2); context.stroke(); context.restore();
    if (building || finalProduct) drawAsterionModelContour(cx, cy, radius, finalProduct ? 1 : formationProgress);
  }
  function drawAsterionModelContour(cx, cy, radius, reveal) {
    drawVrFurnaceCurvePresentation(context, asterionCurvePresentation, {
      cx, cy, scale: radius, elapsed: telemetryElapsed, progress: reveal, color: accents.process,
      bright: true, rotationSpeed: .18, pitch: -.24
    });
  }
  function draw() {
    if (!context) return; redrawCount += 1; context.clearRect(0, 0, canvas.width, canvas.height);
    if (screen === ASTRO_FURNACE_PANEL_SCREENS.ASTROLABIUM_PRODUCTION
      && astroProductionController?.getState?.() === 'EARNED') {
      screen = ASTRO_FURNACE_PANEL_SCREENS.HOME;
      returnScreen = ASTRO_FURNACE_PANEL_SCREENS.HOME;
      hoveredRegion = null;
    }
    context.fillStyle = 'rgba(3,9,17,.96)'; context.fillRect(0, 0, canvas.width, canvas.height);
    drawFurnaceFrame(context, { x: 18, y: 18, width: canvas.width - 36, height: canvas.height - 36, variant: 'panel', cornerSize: config.frameCornerSizePx * 1.5, accentColor: '#4d89a5', opacity: .8 });
    const progress = progressionController.getAsterionSphereProgress();
    if (screen === ASTRO_FURNACE_PANEL_SCREENS.HOME) drawHome(progress);
    else if (screen === ASTRO_FURNACE_PANEL_SCREENS.ASTERION_SPHERE) drawSphere(progress);
    else if (screen === ASTRO_FURNACE_PANEL_SCREENS.ASTROLABIUM_MENU) drawAstrolabiumMenu();
    else if (screen === ASTRO_FURNACE_PANEL_SCREENS.ASTROLABIUM_PRODUCTION) drawAstrolabiumProduction();
    else if (screen === ASTRO_FURNACE_PANEL_SCREENS.RUNE_TUNING) drawRuneTuning();
    else drawAstrolabiumTuning();
    texture.needsUpdate = true;
  }
  function place() {
    furnace.object.updateWorldMatrix(true, true); furnace.object.getWorldQuaternion(furnaceQuaternion);
    right.set(1, 0, 0).applyQuaternion(furnaceQuaternion).normalize();
    up.set(0, 1, 0).applyQuaternion(furnaceQuaternion).normalize();
    const boundsData = furnace.diagnostics.visibleBounds;
    const bounds = boundsData ? new THREE.Box3(new THREE.Vector3().fromArray(boundsData.min), new THREE.Vector3().fromArray(boundsData.max)) : new THREE.Box3().setFromObject(furnace.object);
    const center = bounds.getCenter(new THREE.Vector3());
    const size = bounds.getSize(new THREE.Vector3());
    const projectedHalfWidth = (Math.abs(right.x) * size.x + Math.abs(right.y) * size.y + Math.abs(right.z) * size.z) / 2;
    desiredWorldPosition.copy(center).addScaledVector(right, projectedHalfWidth + config.gapFromFurnace);
    desiredWorldPosition.addScaledVector(up, config.verticalOffset);
    yawQuaternion.setFromAxisAngle(yawAxis, THREE.MathUtils.degToRad(config.yawDegrees));
    desiredWorldQuaternion.copy(furnaceQuaternion).multiply(yawQuaternion);
    desiredWorldScale.set(0.001, 0.92, 1);
    applyWorldTransform(root, desiredWorldPosition, desiredWorldQuaternion, desiredWorldScale);
    root.visible = state !== ASTRO_FURNACE_PANEL_STATES.HIDDEN;
  }
  function show() { screen = ASTRO_FURNACE_PANEL_SCREENS.HOME; hoveredRegion = null; state = ASTRO_FURNACE_PANEL_STATES.APPEARING; elapsed = 0; root.visible = true; draw(); }
  function hide() { if (state === ASTRO_FURNACE_PANEL_STATES.HIDDEN) return; state = ASTRO_FURNACE_PANEL_STATES.DISAPPEARING; elapsed = 0; }
  function toggle() { if (state === ASTRO_FURNACE_PANEL_STATES.HIDDEN || state === ASTRO_FURNACE_PANEL_STATES.DISAPPEARING) show(); else hide(); }
  function activateRegion(id) { if (id === 'module-asterion-sphere') {
    screen = ASTRO_FURNACE_PANEL_SCREENS.ASTERION_SPHERE;
    returnScreen = ASTRO_FURNACE_PANEL_SCREENS.HOME;
    moduleListeners.forEach((listener) => listener('floor_gyroscope_sphere'));
    onEnterModule();
  } else if (id === 'module-astro-attractor') {
    screen = ASTRO_FURNACE_PANEL_SCREENS.ASTROLABIUM_MENU;
    moduleListeners.forEach((listener) => listener('astro_attractor'));
    onEnterModule();
  } else if (id === 'astrolabium-create') {
    screen = ASTRO_FURNACE_PANEL_SCREENS.ASTROLABIUM_PRODUCTION; returnScreen = ASTRO_FURNACE_PANEL_SCREENS.ASTROLABIUM_MENU;
  } else if (id === 'astrolabium-glyph-tuning') {
    screen = ASTRO_FURNACE_PANEL_SCREENS.ASTROLABIUM_TUNING; returnScreen = ASTRO_FURNACE_PANEL_SCREENS.ASTROLABIUM_MENU;
  } else if (id === 'astrolabium-rune-tuning') {
    screen = ASTRO_FURNACE_PANEL_SCREENS.RUNE_TUNING; returnScreen = ASTRO_FURNACE_PANEL_SCREENS.ASTROLABIUM_MENU;
    moduleListeners.forEach((listener) => listener(ASTRO_FURNACE_RUNE_TUNING_MODE)); onEnterModule();
  } else if (id.startsWith('rune-family-')) {
    if (runeRecipeSelectionController?.selectFamily(id.slice('rune-family-'.length)) !== true) return false;
  } else if (id === 'back-modules') {
    if (screen === ASTRO_FURNACE_PANEL_SCREENS.ASTROLABIUM_MENU) { screen = ASTRO_FURNACE_PANEL_SCREENS.HOME; onReturnHome(); }
    else { screen = returnScreen; if (returnScreen === ASTRO_FURNACE_PANEL_SCREENS.HOME) onReturnHome(); }
  }
  else if (id === 'create-asterion') { if (!productionController?.requestCreate?.()) return false; onCreate(); }
  else if (id === 'create-astro-attractor') { if (astroProductionController?.canCreate?.() !== true
    || requestAstroProduction() !== true) return false; onCreate(); }
  else return false; hoveredRegion = null; draw(); return true; }
  function updateHits() {
    let nextHover = null;
    controllers.forEach((record) => {
      let result = null;
      if (state === ASTRO_FURNACE_PANEL_STATES.VISIBLE) {
        record.controller.updateWorldMatrix(true, false); record.controller.getWorldPosition(origin); record.controller.getWorldQuaternion(quaternion);
        direction.set(0, 0, -1).applyQuaternion(quaternion).normalize(); raycaster.set(origin, direction);
        raycaster.far = record.currentRayLength ?? 3; const intersection = raycaster.intersectObjects(renderPlanes, false)[0];
        if (intersection) { record.reportRayHit?.(intersection.distance); const x = intersection.uv.x * canvas.width, y = (1 - intersection.uv.y) * canvas.height;
          const region = interactiveRegions.find((item) => item.enabled && x >= item.x && x <= item.x + item.width && y >= item.y && y <= item.y + item.height);
          result = { intersection, region: region ?? null }; if (region) nextHover = region.id; }
      }
      hits.set(record, result);
    });
    if (nextHover !== hoveredRegion) { hoveredRegion = nextHover; draw(); }
  }
  function press(record) { const hit = hits.get(record); return state === ASTRO_FURNACE_PANEL_STATES.VISIBLE && hit?.region ? activateRegion(hit.region.id) : false; }
  const listeners = controllers.map((record) => { const listener = () => press(record); record.controller.addEventListener('selectstart', listener); return { record, listener }; });
  function update(delta = 0) {
    if (disposed) return; const step = Math.max(0, delta); elapsed += step; telemetryElapsed += step;
    if (state === ASTRO_FURNACE_PANEL_STATES.APPEARING) { const t = smoothstep(Math.min(1, elapsed / config.appearDuration)); root.scale.set(0.001 + .999 * t, .92 + .08 * t, 1); renderPlanes.forEach((plane) => { plane.material.opacity = t; }); if (t === 1) state = ASTRO_FURNACE_PANEL_STATES.VISIBLE; }
    else if (state === ASTRO_FURNACE_PANEL_STATES.DISAPPEARING) { const t = smoothstep(Math.min(1, elapsed / config.disappearDuration)); root.scale.set(1 - .999 * t, 1 - .08 * t, 1); renderPlanes.forEach((plane) => { plane.material.opacity = 1 - t; }); if (t === 1) { state = ASTRO_FURNACE_PANEL_STATES.HIDDEN; root.visible = false; } }
    updateHits();
    if (screen === ASTRO_FURNACE_PANEL_SCREENS.ASTERION_SPHERE) readTelemetry();
    const previewAnimating = furnacePanelAnimationActive({ panelState: state, screen });
    if (shouldRefreshTelemetry({ active: previewAnimating, elapsed: telemetryElapsed, lastRedraw: lastTelemetryRedraw, refreshHz: config.telemetryRefreshHz })) { lastTelemetryRedraw = telemetryElapsed; draw(); }
  }
  function reset() { state = ASTRO_FURNACE_PANEL_STATES.HIDDEN; screen = ASTRO_FURNACE_PANEL_SCREENS.HOME; elapsed = 0; telemetryElapsed = 0; lastTelemetryRedraw = 0; completedUntil = 0; previousProcessState = 'IDLE'; lastRuneProcessRecipe = null; runeCompletedUntil = 0; previousRuneProcessState = 'IDLE'; hoveredRegion = null; renderPlanes.forEach((plane) => { plane.material.opacity = 0; }); hits.forEach((_, record) => hits.set(record, null)); place(); root.visible = false; draw(); }
  const unsubscribe = progressionController.subscribe(() => draw());
  const unsubscribeProduction = productionController?.subscribe?.(() => draw()) ?? (() => {});
  const unsubscribeAstroProduction = astroProductionController?.subscribe?.(() => draw()) ?? (() => {});
  const unsubscribeProtoAstroTuning = protoAstroTuningController?.subscribe?.(() => draw()) ?? (() => {});
  const unsubscribeRuneSelection = runeRecipeSelectionController?.subscribe?.(() => draw()) ?? (() => {});
  const unsubscribeRuneRecipe = runeRecipeInteraction?.subscribe?.(() => draw()) ?? (() => {});
  const unsubscribePlacement = furnace.subscribePlacement?.(() => place()) ?? (() => {});
  function dispose() { if (disposed) return; disposed = true; lastRuneProcessRecipe = null; runeCompletedUntil = 0; previousRuneProcessState = 'IDLE'; unsubscribe(); unsubscribeProduction(); unsubscribeAstroProduction(); unsubscribeProtoAstroTuning(); unsubscribeRuneSelection(); unsubscribeRuneRecipe(); unsubscribePlacement(); moduleListeners.clear(); listeners.forEach(({ record, listener }) => record.controller.removeEventListener('selectstart', listener)); root.removeFromParent(); renderPlanes.forEach((plane) => { plane.geometry.dispose(); plane.material.dispose(); }); texture.dispose(); canvas.width = 0; canvas.height = 0; hits.clear(); protoAstroImageCache.clear(); }
  reset();
  return { object: root, mesh: frontPlane, renderPlanes, canvas, texture, hits, show, hide, toggle, place, update, press, reset, dispose, activateRegion, redraw: draw,
    subscribeModuleActivation(listener) { moduleListeners.add(listener); return () => moduleListeners.delete(listener); },
    isVisible: () => state !== ASTRO_FURNACE_PANEL_STATES.HIDDEN && state !== ASTRO_FURNACE_PANEL_STATES.DISAPPEARING,
    hasCurrentHit: (record) => Boolean(hits.get(record)?.intersection), getState: () => state, getScreen: () => screen,
    getInteractiveRegions: () => interactiveRegions.map((region) => ({ ...region })), getRedrawCount: () => redrawCount,
    getAsterionCurvePresentation: () => asterionCurvePresentation };
}
