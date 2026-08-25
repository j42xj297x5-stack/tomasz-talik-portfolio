import * as THREE from '../../vendor/three.js';
import { applyWorldTransform } from '../applyWorldTransform.js';
import { drawFurnaceFrame } from './drawVrFurnaceFrame.js';
import { resolveProcessTelemetry, shouldRefreshTelemetry } from './vrFurnaceTelemetry.js';
import { ASTERION_SHELL_PATCHES } from './asterionShellPatchData.js';
import { assemblySegmentVisible, createAsterionModelWireframeMap, createAsterionPatchGeometry, resolveConstructionPatchOpacity, resolvePatchVisualStates } from './asterionSphereWireframe.js';
import { drawMaterialCardVisual } from './drawVrMaterialCard.js';
import { resolveAttractorShellGlyph } from '../tools/vrAttractorShellGlyphs.js';
import { drawVrAstroAttractorPreview } from './drawVrAstroAttractorPreview.js';
import { SMALL_GLYPH_WIREFRAME_DATA } from './smallGlyphWireframeData.js';
import { drawSmallGlyphWireframe } from './drawSmallGlyphWireframe.js';
import { resolveVrSmallGlyphProtoAstro } from '../protoAstro/resolveVrSmallGlyphProtoAstro.js';
import { ASTRO_FURNACE_PROCESS_KINDS } from './createVrAstroFurnaceActivateInteraction.js';
import { ASTRO_FURNACE_RUNE_TUNING_MODE } from './createVrAstroFurnaceOptionInteraction.js';
import { PROTO_ASTRO_FAMILIES, PROTO_ASTRO_NATURAL_FAMILY_CODES } from '../protoAstro/protoAstroRegistry.js';

export const ASTRO_FURNACE_PANEL_STATES = Object.freeze({
  HIDDEN: 'HIDDEN', APPEARING: 'APPEARING', VISIBLE: 'VISIBLE', DISAPPEARING: 'DISAPPEARING'
});
export const ASTRO_FURNACE_PANEL_SCREENS = Object.freeze({
  HOME: 'HOME', ASTERION_SPHERE: 'ASTERION_SPHERE',
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
  runeRecipeInteraction = null, runeRecipeSelectionController = null,
  requestAstroProduction = () => false,
  asterionModel = null, settings = {}, onEnterModule = () => {}, onReturnHome = () => {}, onCreate = () => {} }) {
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
  let elapsed = 0, telemetryElapsed = 0, lastTelemetryRedraw = 0, completedUntil = 0, previousProcessState = 'IDLE';
  let lastSmallGlyphProcessAssetId = null;
  let hoveredRegion = null, interactiveRegions = [], disposed = false, redrawCount = 0;
  const moduleListeners = new Set();
  // The expensive UV subdivision and cube-face mapping happen exactly once per panel.
  const patchGeometryByAssetId = createAsterionPatchGeometry(ASTERION_SHELL_PATCHES, {
    scaleMultiplier: config.spherePatchVisualScaleMultiplier
  });
  const patchDataByAssetId = Object.fromEntries(ASTERION_SHELL_PATCHES.map((patch) => [patch.assetId, patch]));
  const asterionWireframeMap = createAsterionModelWireframeMap(asterionModel);
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

  function panelRect(x, y, width, height, options = {}) {
    drawFurnaceFrame(context, { x, y, width, height, cornerSize: options.cornerSize ?? config.frameCornerSizePx, ...options });
  }
  function text(value, x, y, size = 34, color = '#e8f7ff') {
    context.fillStyle = color; context.font = `${size}px sans-serif`; context.fillText(value, x, y);
  }
  function drawHome(progress) {
    text('ASTRO PIEC', 90, 100, 52); text('MODUŁY TRANSFORMACJI', 90, 152, 25, '#83b8d1');
    const astroProductionState = astroProductionController?.getState?.() ?? 'READY';
    const astroModuleAvailable = canUseAstroProduction() || canUseAstroTuning() || astroProductionState !== 'READY';
    const runeSnapshot = runeRecipeSelectionController?.getSnapshot?.();
    const runeFoundationAvailable = furnace?.capabilities?.runeRecipeAnchorsReady === true
      && Boolean(runeRecipeSelectionController) && (runeSnapshot?.eligibleFamilyCodes?.length ?? 0) > 0;
    const cards = [
      ['module-asterion-sphere', 'SFERA ASTERIONOWA', 'Rdzeń żyroskopowy sterowania kręgiem', 'SKORUPY', `${progress.absorbed} / 6   DOSTĘPNE`, true],
      ['module-astro-attractor', 'ASTROLABIUM WIĘZI', 'Narzędzie przyciągania i synchronizacji', 'STATUS',
        astroProductionState === 'AVAILABLE' ? 'GOTOWE // ODBIERZ' : astroProductionState === 'EARNED' ? 'STROJENIE' : 'WEJDŹ DO MODUŁU',
        astroModuleAvailable],
      ['module-emanation-matrix', 'MATRYCA EMANACJI', 'Przetwarzanie kamieni runicznych', 'KAMIENIE',
        runeFoundationAvailable ? `${runeSnapshot.eligibleFamilyCodes.length} ELIGIBLE` : 'NIEDOSTĘPNE', runeFoundationAvailable]
    ];
    interactiveRegions = cards.map((card, index) => {
      const rect = { id: card[0], x: 90, y: 205 + index * 245, width: 1356, height: 205, enabled: card[5] };
      const accentColor = [accents.asterion, accents.attractor, accents.emanation][index];
      panelRect(rect.x, rect.y, rect.width, rect.height, { hovered: hoveredRegion === rect.id, active: card[5], locked: !card[5], accentColor });
      text(card[1], rect.x + 42, rect.y + 60, 37, card[5] ? '#f1fbff' : '#78909d');
      text(card[2], rect.x + 42, rect.y + 112, 25, '#91afbe'); text(card[3], rect.x + 42, rect.y + 166, 21, '#6f9db5');
      const statusRight = card[0] === 'module-astro-attractor' ? rect.x + rect.width - 385 : rect.x + rect.width - 42;
      context.textAlign = 'right'; text(card[4], statusRight, rect.y + 166, 22, card[5] ? '#bdefff' : '#91afbe'); context.textAlign = 'left';
      if (card[0] === 'module-astro-attractor') drawVrAstroAttractorPreview(context, {
        cx: rect.x + rect.width - 210, cy: rect.y + 103, scale: 84, elapsed: telemetryElapsed,
        color: accents.attractor, bright: hoveredRegion === rect.id
      });
      return rect;
    });
  }
  const runeFamilyLabels = Object.freeze({ earth: 'ZIEMIA', metal: 'METAL', water: 'WODA', tree: 'DREWNO', fire: 'OGIEŃ' });
  const runeLabel = (familyCode) => runeFamilyLabels[PROTO_ASTRO_FAMILIES[familyCode]?.id] ?? familyCode ?? '—';
  function drawRuneTuning() {
    const snapshot = runeRecipeSelectionController?.getSnapshot?.() ?? { eligibleFamilyCodes: [] };
    interactiveRegions = [{ id: 'back-modules', x: 90, y: 55, width: 260, height: 70, enabled: true }];
    panelRect(90, 55, 260, 70, { hovered: hoveredRegion === 'back-modules', accentColor: accents.emanation });
    text('← MODUŁY', 120, 102, 27);
    text('MATRYCA EMANACJI', 90, 180, 46);
    text('WYBIERZ DOCELOWĄ RODZINĘ KAMIENIA', 90, 225, 22, '#b89dd0');
    PROTO_ASTRO_NATURAL_FAMILY_CODES.forEach((familyCode, index) => {
      const eligible = snapshot.eligibleFamilyCodes.includes(familyCode);
      const selected = snapshot.selectedFamilyCode === familyCode;
      const rect = { id: `rune-family-${familyCode}`, x: 90 + index * 270, y: 270, width: 245, height: 125, enabled: eligible };
      interactiveRegions.push(rect);
      panelRect(rect.x, rect.y, rect.width, rect.height, { hovered: hoveredRegion === rect.id, active: selected || eligible,
        locked: !eligible, accentColor: accents.emanation });
      text(runeLabel(familyCode), rect.x + 20, rect.y + 48, 27, eligible ? '#f1eaff' : '#78909d');
      text(selected ? 'SELECTED' : eligible ? 'ELIGIBLE' : 'LOCKED', rect.x + 20, rect.y + 91, 18,
        selected ? accents.complete : eligible ? '#cdb5e4' : '#70828d');
    });
    const recipe = snapshot.expectedRecipe;
    panelRect(90, 440, 650, 440, { variant: 'monitor', active: Boolean(recipe), accentColor: accents.emanation });
    text('RECEPTURA WU XING', 125, 495, 22, '#a990c0');
    text(`TARGET: ${runeLabel(recipe?.targetFamilyCode)}`, 125, 560, 28);
    text(`SMALL GLYPH: ${runeLabel(recipe?.smallGlyphFamilyCode)}`, 125, 625, 25);
    text(`SHELL: ${runeLabel(recipe?.shellFamilyCode)}`, 125, 690, 25);
    panelRect(785, 440, 620, 440, { variant: 'monitor', active: snapshot.readyForTuning, accentColor: accents.emanation });
    text('SLOTY RECEPTURY', 825, 495, 22, '#a990c0');
    const glyphInserted = snapshot.slots?.smallGlyph?.state === 'INSERTED';
    const shellInserted = snapshot.slots?.shell?.state === 'INSERTED';
    text(`SMALL GLYPH: ${glyphInserted ? `INSERTED / ${runeLabel(snapshot.smallGlyphFamilyCode)}` : 'EMPTY'}`, 825, 565, 23);
    text(`SHELL: ${shellInserted ? `INSERTED / ${runeLabel(snapshot.shellFamilyCode)}` : 'EMPTY'}`, 825, 625, 23);
    const status = !snapshot.selectedFamilyCode ? 'BRAK WYBORU' : !glyphInserted || !shellInserted ? 'NIEKOMPLETNA'
      : snapshot.readyForTuning ? 'GOTOWA DO STROJENIA' : 'NIEPRAWIDŁOWA';
    text(`RECIPE: ${status}`, 825, 720, 22, snapshot.readyForTuning ? accents.complete : '#d6b3c3');
  }
  function drawAstrolabiumProduction() {
    interactiveRegions = [{ id: 'back-modules', x: 90, y: 55, width: 260, height: 70, enabled: true }];
    panelRect(90, 55, 260, 70, { hovered: hoveredRegion === 'back-modules', accentColor: accents.attractor });
    text('← MODUŁY', 120, 102, 27);
    text('ASTROLABIUM WIĘZI', 90, 190, 48);
    text('Narzędzie przyciągania i synchronizacji', 90, 238, 24, '#b9a779');

    const production = astroProductionController?.getSnapshot?.() ?? { state: 'READY', constructionProgress: 0 };
    const previewX = 470, previewY = 525;
    panelRect(90, 285, 760, 515, { variant: 'monitor', active: production.state === 'BUILDING',
      completed: ['AVAILABLE', 'EARNED'].includes(production.state), accentColor: accents.attractor });
    drawVrAstroAttractorPreview(context, { cx: previewX, cy: previewY, scale: 235, elapsed: telemetryElapsed,
      color: accents.attractor, bright: production.state !== 'READY' });

    panelRect(900, 285, 505, 515, { variant: 'monitor', active: production.state === 'BUILDING',
      completed: ['AVAILABLE', 'EARNED'].includes(production.state), accentColor: accents.attractor });
    text('STAN PRODUKCJI', 940, 350, 22, '#8fb1c1');
    const labels = {
      READY: ['GOTOWE DO UTWORZENIA', 'Rozpocznij świadomie proces w Piecu.'],
      BUILDING: ['MATERIALIZACJA', 'Proces konstrukcji trwa w komorze.'],
      AVAILABLE: ['ASTROLABIUM GOTOWE', 'Otwórz komorę i odbierz obiekt.'],
      CLAIMING: ['PRZEKAZYWANIE', 'Fizyczny odbiór Astrolabium trwa.']
    };
    const [title, detail] = labels[production.state] ?? ['NIEDOSTĘPNE', 'Stan produkcji jest poza kontraktem modułu.'];
    text(title, 940, 425, 29, production.state === 'AVAILABLE' ? accents.complete : accents.attractor);
    text(detail, 940, 470, 19, '#91afbe');
    if (production.state === 'BUILDING') {
      const progress = Math.max(0, Math.min(1, production.constructionProgress ?? production.buildProgress ?? 0));
      context.fillStyle = '#18303c'; context.fillRect(940, 525, 420, 18);
      context.fillStyle = accents.process; context.fillRect(940, 525, 420 * progress, 18);
      text(`${Math.round(progress * 100)}%`, 940, 580, 25, accents.process);
    }
    if (astroProductionController?.canCreate?.() === true) {
      const create = { id: 'create-astro-attractor', x: 995, y: 670, width: 315, height: 82, enabled: true };
      interactiveRegions.push(create);
      panelRect(create.x, create.y, create.width, create.height, { hovered: hoveredRegion === create.id,
        active: true, accentColor: accents.complete });
      text('UTWÓRZ', create.x + 76, create.y + 53, 32, accents.complete);
    }
  }
  function drawAstrolabiumTuning() {
    interactiveRegions = [{ id: 'back-modules', x: 90, y: 55, width: 260, height: 70, enabled: true }];
    panelRect(90, 55, 260, 70, { hovered: hoveredRegion === 'back-modules', accentColor: accents.attractor });
    text('← MODUŁY', 120, 102, 27);
    text('STROJENIE ASTROLABIUM', 90, 190, 48);
    text('Trwała konfiguracja Astrolabium Więzi', 90, 238, 24, '#b9a779');

    text('MAŁE GLIFY', 90, 282, 31, canUseAstroTuning() ? '#f1fbff' : '#78909d');
    const tuningSnapshot = protoAstroTuningController?.getSnapshot?.() ?? { families: [] };
    const families = new Map(tuningSnapshot.families.map((family) => [family.familyCode, family]));
    const insertedAssetId = contentSource?.getInsertedSmallGlyphAssetId?.() ?? null;
    const contentState = contentSource?.getState?.() ?? 'EMPTY';
    smallGlyphEntries.forEach(({ assetId, protoAstro, image }, index) => {
      const column = index % 3;
      const row = Math.floor(index / 3);
      const x = 90 + column * 455;
      const y = 310 + row * 160;
      const family = families.get(protoAstro.descriptor.familyCode);
      const supported = Boolean(family);
      const extracted = family?.extracted === true;
      const processing = supported && insertedAssetId === assetId
        && ['INSERTED', 'CONSUMING', 'CONSUMED'].includes(contentState);
      const color = extracted ? accents.complete : processing ? accents.process : supported ? accents.attractor : accents.idle;
      panelRect(x, y, 405, 145, { variant: 'monitor', active: supported && !extracted,
        completed: extracted, locked: !supported, accentColor: color });
      text(protoAstro.descriptor.syllable, x + 20, y + 32, 22, color);
      drawMaterialCardVisual(context, { x: x + 8, y: y + 34, width: 389, height: 82,
        glyphRatio: .46, glyphScale: 1.9, padding: 6, glyphImage: image, color,
        drawPreview: ({ cx, cy, scale }) => drawSmallGlyphWireframe(context,
          { assetId, cx, cy, scale, color, alpha: supported ? .95 : .34 }) });
      text(extracted ? 'DOSTROJONY' : processing ? 'PRZETWARZANIE' : supported ? 'GOTOWY' : 'NIEAKTYWNY',
        x + 20, y + 134, 16, color);
    });
    drawSmallGlyphExtractionMonitor();
  }
  function drawSmallGlyphExtractionMonitor() {
    const x = 90, y = 655, width = 1315, height = 300;
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
    const shownTelemetry = concernsSmallGlyph ? telemetry : resolveProcessTelemetry({ contentState: 'EMPTY' });
    const color = accents[shownTelemetry.colorKey];
    panelRect(x, y, width, height, { variant: 'monitor', active: concernsSmallGlyph && shownTelemetry.active,
      completed: concernsSmallGlyph && shownTelemetry.phase === 'COMPLETE', accentColor: color });
    text('PRZEBIEG EKSTRAKCJI', x + 28, y + 42, 22, color);
    drawInsertedSmallGlyphWireframe(protoAstro, shownTelemetry, x + 300, y + 155, 118);
    text(protoAstro && concernsSmallGlyph ? `MAŁY GLIF // ${protoAstro.descriptor.syllable}` : 'MAŁY GLIF // OCZEKIWANIE',
      x + 610, y + 92, 23, protoAstro && concernsSmallGlyph ? color : accents.idle);
    shownTelemetry.label.split('\n').forEach((line, index) => text(`${index ? '' : 'STATUS // '}${line}`,
      x + 610, y + 137 + index * 28, 20, color));
    const progress = shownTelemetry.showProgress ? shownTelemetry.extractionProgress : 0;
    const barX = x + 610, barY = y + 218, barWidth = 560;
    context.fillStyle = '#18303c'; context.fillRect(barX, barY, barWidth, 16);
    context.fillStyle = color; context.fillRect(barX, barY, barWidth * progress, 16);
    text(`${Math.round(progress * 100)}%`, barX + barWidth + 18, barY + 17, 20, '#b9dce8');
    const contentLabels = { INSERTED: 'GOTOWY', CONSUMING: 'EKSTRAKCJA', CONSUMED: 'ZABEZPIECZONO' };
    if (concernsSmallGlyph && contentLabels[contentState]) text(`MATERIAŁ // ${contentLabels[contentState]}`, x + 610, y + 270, 18, '#88b8cf');
  }
  function drawInsertedSmallGlyphWireframe(protoAstro, telemetry, cx, cy, scale) {
    const segments = protoAstro ? SMALL_GLYPH_WIREFRAME_DATA.byAssetId[protoAstro.assetId]?.segments3d : null;
    if (!segments?.length || ['COOLDOWN', 'COMPLETE'].includes(telemetry.phase)) return;
    const dissolve = telemetry.phase === 'EXTRACTION' ? telemetry.extractionProgress : 0;
    const processing = telemetry.active || (contentSource?.getState?.() ?? 'EMPTY') !== 'INSERTED';
    const yaw = telemetryElapsed * (processing ? .38 : .16), cosY = Math.cos(yaw), sinY = Math.sin(yaw);
    const tilt = -.28, cosX = Math.cos(tilt), sinX = Math.sin(tilt);
    const project = (x, y, z) => { const rx = x * cosY + z * sinY, rz = -x * sinY + z * cosY;
      const ry = y * cosX - rz * sinX, depth = 1 / Math.max(.65, 1 + (y * sinX + rz * cosX) * .16);
      return [cx + rx * scale * depth, cy - ry * scale * depth]; };
    context.save(); context.globalAlpha = .78 + .22 * Math.sin(telemetryElapsed * (processing ? 5 : 3));
    context.strokeStyle = accents[telemetry.colorKey]; context.lineWidth = processing ? 2.2 : 1.7;
    context.shadowColor = accents[telemetry.colorKey]; context.shadowBlur = processing ? 12 : 7; context.beginPath();
    segments.forEach((segment) => { if (!wireframeDissolveVisible(segment, dissolve)) return;
      const a = project(segment.ax, segment.ay, segment.az), b = project(segment.bx, segment.by, segment.bz);
      context.moveTo(a[0], a[1]); context.lineTo(b[0], b[1]); });
    context.stroke(); context.restore();
  }
  function drawSphere(progress) {
    interactiveRegions = [{ id: 'back-modules', x: 90, y: 55, width: 260, height: 70, enabled: true }];
    panelRect(90, 55, 260, 70, { hovered: hoveredRegion === 'back-modules', accentColor: accents.asterion }); text('← MODUŁY', 120, 102, 27);
    text('SFERA ASTERIONOWA', 90, 190, 48); text('Rdzeń żyroskopowy sterowania kręgiem', 90, 238, 24, '#88b8cf');
    const currentAssetId = contentSource?.getInsertedShellAssetId?.();
    const currentState = contentSource?.getState?.() ?? 'EMPTY';
    progress.shells.forEach((shell, index) => {
      const col = index % 3, row = Math.floor(index / 3), x = 90 + col * 455, y = 270 + row * 175;
      const processing = shell.assetId === currentAssetId && !shell.absorbed && ['CONSUMING', 'CONSUMED'].includes(currentState);
      panelRect(x, y, 405, 145, { active: shell.absorbed || processing, completed: shell.absorbed, accentColor: shell.absorbed ? accents.asterion : processing ? accents.process : accents.idle });
      const color = shell.absorbed ? accents.complete : processing ? accents.process : accents.idle;
      drawMaterialCardVisual(context, { x, y, width: 405, height: 145, glyphImage: shellGlyphImages[shell.assetId], color,
        drawPreview: ({ cx, cy, scale }) => drawShellMiniature(patchDataByAssetId[shell.assetId], cx, cy, scale, color, shell.absorbed || processing) });
    });
    drawProcessMonitor();
    const productionState = productionController?.getState?.() ?? 'LOCKED';
    if (productionState === 'READY' && productionController?.canCreate?.() === true) {
      const create = { id: 'create-asterion', x: 930, y: 850, width: 410, height: 82, enabled: true };
      interactiveRegions.push(create); panelRect(create.x, create.y, create.width, create.height, { hovered: hoveredRegion === create.id, active: true, accentColor: accents.complete });
      text('UTWÓRZ', create.x + 118, create.y + 53, 32, accents.complete);
    } else if (productionState === 'BUILDING') text('MATERIALIZACJA', 1030, 918, 27, accents.process);
    else if (productionState === 'AVAILABLE') { text('KULA GOTOWA', 1050, 892, 28, accents.complete); text('OTWÓRZ KOMORĘ', 1030, 928, 19, '#88b8cf'); }
    else if (productionState === 'EARNED') { text('AKTYWNA', 1110, 892, 28, accents.complete); text('X // KULA ASTERIONOWA', 1015, 928, 19, '#88b8cf'); }
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
      contentState: contentSource?.getState?.() ?? 'EMPTY', chamberState: contentSource?.getChamberState?.() ?? 'CLOSED' });
  }
  function drawProcessMonitor() {
    const telemetry = readTelemetry(), x = 90, y = 645, width = 1315, height = 325;
    const production = productionController?.getSnapshot?.() ?? { state: 'LOCKED', constructionProgress: 0, formationProgress: 0 };
    const constructing = production.state === 'BUILDING';
    panelRect(x, y, width, height, { variant: 'monitor', active: telemetry.active, completed: telemetry.phase === 'COMPLETE', accentColor: accents[telemetry.colorKey] });
    text(constructing ? 'MATERIALIZACJA KULI' : 'PRZEBIEG ABSORPCJI', x + 28, y + 42, 22, accents[telemetry.colorKey]);
    drawInsertedShellWireframe(telemetry, x + 300, y + 145, 118);
    const constructionLabel = production.constructionProgress < 1 / 6 ? 'INICJACJA' : production.constructionProgress < 1 / 3
      ? 'STABILIZACJA POLA' : production.constructionProgress < 5 / 6 ? 'FORMOWANIE' : 'KONDENSACJA';
    (constructing ? [constructionLabel] : telemetry.label.split('\n')).forEach((line, index) => text(`${index ? '' : 'STATUS // '}${line}`, x + 28, y + 215 + index * 28, 21, accents[telemetry.colorKey]));
    if (telemetry.showProgress || constructing) {
      const barX = x + 28, barY = y + 254, barWidth = 555; context.fillStyle = '#18303c'; context.fillRect(barX, barY, barWidth, 16);
      const shownProgress = constructing ? production.constructionProgress : telemetry.extractionProgress;
      context.fillStyle = accents[telemetry.colorKey]; context.fillRect(barX, barY, barWidth * shownProgress, 16);
      text(`${Math.round(shownProgress * 100)}%`, barX + barWidth + 18, barY + 17, 20, '#b9dce8');
    }
    drawAsterionPreview(progressSnapshot(), telemetry, x + 855, y + 150, 118);
    const contentState = contentSource?.getState?.() ?? 'EMPTY';
    const contentLabels = { INSERTED: 'GOTOWY', CONSUMING: 'ABSORPCJA', CONSUMED: 'ZABEZPIECZONO' };
    if (contentLabels[contentState]) { context.textAlign = 'right'; text(`MATERIAŁ // ${contentLabels[contentState]}`, x + width - 28, y + 267, 19, '#88b8cf'); context.textAlign = 'left'; }
  }
  function drawInsertedShellWireframe(telemetry, cx, cy, scale) {
    const data = contentSource?.getInsertedShellWireframe?.();
    if (!data?.segments?.length || ['COOLDOWN', 'COMPLETE'].includes(telemetry.phase)) return;
    const contentState = contentSource?.getState?.() ?? 'EMPTY';
    if (!['INSERTED', 'CONSUMING', 'CONSUMED'].includes(contentState)) return;
    const processing = telemetry.active || contentState !== 'INSERTED';
    const dissolve = telemetry.phase === 'EXTRACTION' ? telemetry.extractionProgress : 0;
    const rotation = telemetryElapsed * (processing ? .38 : .16);
    const cosY = Math.cos(rotation), sinY = Math.sin(rotation);
    const tilt = -.28, cosX = Math.cos(tilt), sinX = Math.sin(tilt);
    const pulse = .78 + .22 * Math.sin(telemetryElapsed * (processing ? 5 : 3));
    context.save(); context.globalAlpha = pulse; context.strokeStyle = accents[telemetry.colorKey];
    context.lineWidth = processing ? 4.5 : 3.5; context.shadowColor = accents[telemetry.colorKey]; context.shadowBlur = processing ? 15 : 8;
    context.beginPath();
    data.segments.forEach((segment) => {
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
  function progressSnapshot() { return progressionController.getAsterionSphereProgress(); }
  function drawAsterionPreview(progress, telemetry, cx, cy, radius) {
    const yaw = telemetryElapsed * .16, pitch = -.24 + Math.sin(telemetryElapsed * .07) * .08;
    const cosineY = Math.cos(yaw), sineY = Math.sin(yaw), cosineX = Math.cos(pitch), sineX = Math.sin(pitch);
    const assetId = contentSource?.getInsertedShellAssetId?.(), contentState = contentSource?.getState?.() ?? 'EMPTY';
    const states = resolvePatchVisualStates(progress, { assetId, contentState, phase: telemetry.phase, extractionProgress: telemetry.extractionProgress });
    const rotate = ([x, y, z]) => { const rx = x * cosineY + z * sineY, rz = -x * sineY + z * cosineY; return [rx, y * cosineX - rz * sineX, y * sineX + rz * cosineX]; };
    const drawPatches = (predicate, color, alpha, glow = 0) => {
      context.save(); context.strokeStyle = color; context.globalAlpha = alpha; context.lineWidth = 1.6; context.shadowColor = color; context.shadowBlur = glow; context.beginPath();
      ASTERION_SHELL_PATCHES.forEach((patch) => patchGeometryByAssetId[patch.assetId].fragments.forEach((fragment) => {
        if (!predicate(patch.assetId, fragment)) return;
        const a = rotate(fragment.a), b = rotate(fragment.b), depth = (a[2] + b[2]) * .5;
        if (depth <= -.02) return;
        context.moveTo(cx + a[0] * radius, cy - a[1] * radius); context.lineTo(cx + b[0] * radius, cy - b[1] * radius);
      }));
      context.stroke(); context.restore();
    };
    text(`KULA ASTERIONOWA  ${progress.absorbed}/6`, cx - 190, cy - 112, 20, accents.asterion);
    const production = productionController?.getSnapshot?.() ?? { state: 'LOCKED', constructionProgress: 0, formationProgress: 0 };
    const constructing = production.state === 'BUILDING' || production.state === 'AVAILABLE';
    const patchOpacity = production.state === 'AVAILABLE' ? .08 : constructing ? resolveConstructionPatchOpacity(production.formationProgress) : 1;
    drawPatches(() => true, '#6aa6b8', .1 * patchOpacity);
    drawPatches((id) => states[id]?.committed, accents.complete, (progress.complete ? .94 + Math.sin(telemetryElapsed * 2) * .04 : .9) * patchOpacity, 9);
    drawPatches((id, fragment) => states[id]?.pending && assemblySegmentVisible(fragment, states[id].assemblyProgress), accents.process, .9, 10);
    context.save(); context.strokeStyle = '#588797'; context.globalAlpha = .22; context.lineWidth = 1.2; context.beginPath(); context.arc(cx, cy, radius, 0, Math.PI * 2); context.stroke(); context.restore();
    if (constructing) drawAsterionModelContour(cx, cy, radius, production.state === 'AVAILABLE' ? 1 : production.formationProgress);
  }
  function drawAsterionModelContour(cx, cy, radius, reveal) {
    if (!asterionWireframeMap.segments.length || reveal <= 0) return;
    const yaw = telemetryElapsed * .18, pitch = -.24, cyaw = Math.cos(yaw), syaw = Math.sin(yaw), cp = Math.cos(pitch), sp = Math.sin(pitch);
    const project = ([x, y, z]) => { const rx = x * cyaw + z * syaw, rz = -x * syaw + z * cyaw;
      const ry = y * cp - rz * sp, depth = 1 / Math.max(.7, 1 + (y * sp + rz * cp) * .14); return [cx + rx * radius * depth, cy - ry * radius * depth]; };
    context.save(); context.strokeStyle = accents.process; context.globalAlpha = .2 + .8 * reveal; context.lineWidth = 1.35;
    context.shadowColor = accents.process; context.shadowBlur = 7; context.beginPath();
    asterionWireframeMap.segments.forEach((segment) => { if (!assemblySegmentVisible(segment, reveal)) return;
      const a = project(segment.a), b = project(segment.b); context.moveTo(a[0], a[1]); context.lineTo(b[0], b[1]); });
    context.stroke(); context.restore();
  }
  function draw() {
    if (!context) return; redrawCount += 1; context.clearRect(0, 0, canvas.width, canvas.height);
    if (screen === ASTRO_FURNACE_PANEL_SCREENS.ASTROLABIUM_PRODUCTION
      && astroProductionController?.getState?.() === 'EARNED') {
      screen = ASTRO_FURNACE_PANEL_SCREENS.ASTROLABIUM_TUNING;
      hoveredRegion = null;
    }
    context.fillStyle = 'rgba(3,9,17,.96)'; context.fillRect(0, 0, canvas.width, canvas.height);
    drawFurnaceFrame(context, { x: 18, y: 18, width: canvas.width - 36, height: canvas.height - 36, variant: 'panel', cornerSize: config.frameCornerSizePx * 1.5, accentColor: '#4d89a5', opacity: .8 });
    const progress = progressionController.getAsterionSphereProgress();
    if (screen === ASTRO_FURNACE_PANEL_SCREENS.HOME) drawHome(progress);
    else if (screen === ASTRO_FURNACE_PANEL_SCREENS.ASTERION_SPHERE) drawSphere(progress);
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
    moduleListeners.forEach((listener) => listener('floor_gyroscope_sphere'));
    onEnterModule();
  } else if (id === 'module-astro-attractor') {
    screen = astroProductionController?.getState?.() === 'EARNED'
      ? ASTRO_FURNACE_PANEL_SCREENS.ASTROLABIUM_TUNING
      : ASTRO_FURNACE_PANEL_SCREENS.ASTROLABIUM_PRODUCTION;
    moduleListeners.forEach((listener) => listener('astro_attractor'));
    onEnterModule();
  } else if (id === 'module-emanation-matrix') {
    if (!runeRecipeSelectionController || furnace?.capabilities?.runeRecipeAnchorsReady !== true
      || runeRecipeSelectionController.getEligibleFamilyCodes().length === 0) return false;
    screen = ASTRO_FURNACE_PANEL_SCREENS.RUNE_TUNING;
    moduleListeners.forEach((listener) => listener(ASTRO_FURNACE_RUNE_TUNING_MODE));
    onEnterModule();
  } else if (id.startsWith('rune-family-')) {
    if (runeRecipeSelectionController?.selectFamily(id.slice('rune-family-'.length)) !== true) return false;
  } else if (id === 'back-modules') { screen = ASTRO_FURNACE_PANEL_SCREENS.HOME; onReturnHome(); }
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
  function reset() { state = ASTRO_FURNACE_PANEL_STATES.HIDDEN; screen = ASTRO_FURNACE_PANEL_SCREENS.HOME; elapsed = 0; telemetryElapsed = 0; lastTelemetryRedraw = 0; completedUntil = 0; previousProcessState = 'IDLE'; hoveredRegion = null; renderPlanes.forEach((plane) => { plane.material.opacity = 0; }); hits.forEach((_, record) => hits.set(record, null)); place(); root.visible = false; draw(); }
  const unsubscribe = progressionController.subscribe(() => draw());
  const unsubscribeProduction = productionController?.subscribe?.(() => draw()) ?? (() => {});
  const unsubscribeAstroProduction = astroProductionController?.subscribe?.(() => draw()) ?? (() => {});
  const unsubscribeProtoAstroTuning = protoAstroTuningController?.subscribe?.(() => draw()) ?? (() => {});
  const unsubscribeRuneSelection = runeRecipeSelectionController?.subscribe?.(() => draw()) ?? (() => {});
  const unsubscribeRuneRecipe = runeRecipeInteraction?.subscribe?.(() => draw()) ?? (() => {});
  const unsubscribePlacement = furnace.subscribePlacement?.(() => place()) ?? (() => {});
  function dispose() { if (disposed) return; disposed = true; unsubscribe(); unsubscribeProduction(); unsubscribeAstroProduction(); unsubscribeProtoAstroTuning(); unsubscribeRuneSelection(); unsubscribeRuneRecipe(); unsubscribePlacement(); moduleListeners.clear(); listeners.forEach(({ record, listener }) => record.controller.removeEventListener('selectstart', listener)); root.removeFromParent(); renderPlanes.forEach((plane) => { plane.geometry.dispose(); plane.material.dispose(); }); texture.dispose(); canvas.width = 0; canvas.height = 0; hits.clear(); }
  reset();
  return { object: root, mesh: frontPlane, renderPlanes, canvas, texture, hits, show, hide, toggle, place, update, press, reset, dispose, activateRegion, redraw: draw,
    subscribeModuleActivation(listener) { moduleListeners.add(listener); return () => moduleListeners.delete(listener); },
    isVisible: () => state !== ASTRO_FURNACE_PANEL_STATES.HIDDEN && state !== ASTRO_FURNACE_PANEL_STATES.DISAPPEARING,
    hasCurrentHit: (record) => Boolean(hits.get(record)?.intersection), getState: () => state, getScreen: () => screen,
    getInteractiveRegions: () => interactiveRegions.map((region) => ({ ...region })), getRedrawCount: () => redrawCount,
    getAsterionWireframeMap: () => asterionWireframeMap };
}
