import * as THREE from '../../vendor/three.js';
import { applyWorldTransform } from '../applyWorldTransform.js';
import { drawFurnaceFrame } from './drawVrFurnaceFrame.js';
import { resolveProcessTelemetry, shouldRefreshTelemetry } from './vrFurnaceTelemetry.js';
import { ASTERION_SHELL_PATCHES } from './asterionShellPatchData.js';
import { assemblySegmentVisible, createAsterionPatchGeometry, resolvePatchVisualStates } from './asterionSphereWireframe.js';

export const ASTRO_FURNACE_PANEL_STATES = Object.freeze({
  HIDDEN: 'HIDDEN', APPEARING: 'APPEARING', VISIBLE: 'VISIBLE', DISAPPEARING: 'DISAPPEARING'
});
export const ASTRO_FURNACE_PANEL_SCREENS = Object.freeze({ HOME: 'HOME', ASTERION_SPHERE: 'ASTERION_SPHERE' });
export const asterionPreviewAnimationActive = ({ panelState, screen }) =>
  panelState === ASTRO_FURNACE_PANEL_STATES.VISIBLE && screen === ASTRO_FURNACE_PANEL_SCREENS.ASTERION_SPHERE;
const smoothstep = (value) => value * value * (3 - 2 * value);
export const wireframeDissolveVisible = (segment, progress) => progress < 1 && segment.dissolveOrder >= Math.max(0, progress);

export function createVrAstroFurnacePanel({ parent, furnace, controllers = [], progressionController, processSource, contentSource, settings = {} }) {
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
  const quaternion = new THREE.Quaternion(), furnaceQuaternion = new THREE.Quaternion(), right = new THREE.Vector3();
  const desiredWorldPosition = new THREE.Vector3(), desiredWorldQuaternion = new THREE.Quaternion(), desiredWorldScale = new THREE.Vector3();
  const yawQuaternion = new THREE.Quaternion(), yawAxis = new THREE.Vector3(0, 1, 0);
  const hits = new Map(controllers.map((record) => [record, null]));
  let state = ASTRO_FURNACE_PANEL_STATES.HIDDEN, screen = ASTRO_FURNACE_PANEL_SCREENS.HOME;
  let elapsed = 0, telemetryElapsed = 0, lastTelemetryRedraw = 0, completedUntil = 0, previousProcessState = 'IDLE';
  let hoveredRegion = null, interactiveRegions = [], disposed = false, redrawCount = 0;
  const moduleListeners = new Set();
  // The expensive UV subdivision and cube-face mapping happen exactly once per panel.
  const patchGeometryByAssetId = createAsterionPatchGeometry(ASTERION_SHELL_PATCHES, {
    scaleMultiplier: config.spherePatchVisualScaleMultiplier
  });
  const patchDataByAssetId = Object.fromEntries(ASTERION_SHELL_PATCHES.map((patch) => [patch.assetId, patch]));

  function panelRect(x, y, width, height, options = {}) {
    drawFurnaceFrame(context, { x, y, width, height, cornerSize: options.cornerSize ?? config.frameCornerSizePx, ...options });
  }
  function text(value, x, y, size = 34, color = '#e8f7ff') {
    context.fillStyle = color; context.font = `${size}px sans-serif`; context.fillText(value, x, y);
  }
  function drawHome(progress) {
    text('ASTRO PIEC', 90, 100, 52); text('MODUŁY TRANSFORMACJI', 90, 152, 25, '#83b8d1');
    const cards = [
      ['module-asterion-sphere', 'SFERA ASTERIONOWA', 'Rdzeń żyroskopowy sterowania kręgiem', 'SKORUPY', `${progress.absorbed} / 6   DOSTĘPNE`, true],
      ['module-astro-attractor', 'ASTRO PRZYCIĄGACZ', 'Dostrajanie modułów żywiołów', 'GLIFY', 'W PRZYGOTOWANIU', false],
      ['module-emanation-matrix', 'MATRYCA EMANACJI', 'Przetwarzanie kamieni runicznych', 'KAMIENIE', 'W PRZYGOTOWANIU', false]
    ];
    interactiveRegions = cards.map((card, index) => {
      const rect = { id: card[0], x: 90, y: 205 + index * 245, width: 1356, height: 205, enabled: card[5] };
      const accentColor = [accents.asterion, accents.attractor, accents.emanation][index];
      panelRect(rect.x, rect.y, rect.width, rect.height, { hovered: hoveredRegion === rect.id, active: card[5], locked: !card[5], accentColor });
      text(card[1], rect.x + 42, rect.y + 60, 37, card[5] ? '#f1fbff' : '#78909d');
      text(card[2], rect.x + 42, rect.y + 112, 25, '#91afbe'); text(card[3], rect.x + 42, rect.y + 166, 21, '#6f9db5');
      context.textAlign = 'right'; text(card[4], rect.x + rect.width - 42, rect.y + 166, 22, card[5] ? '#bdefff' : '#647985'); context.textAlign = 'left';
      return rect;
    });
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
      text(`SKORUPA ${String(index + 1).padStart(2, '0')}`, x + 30, y + 45, 24);
      drawShellMiniature(patchDataByAssetId[shell.assetId], x + 202, y + 82, 65, shell.absorbed ? accents.complete : processing ? accents.process : accents.idle, shell.absorbed || processing);
      text(shell.absorbed ? 'ZGROMADZONA' : processing ? 'W PROCESIE' : 'BRAK', x + 30, y + 122, 21, shell.absorbed ? '#c7f5ff' : processing ? accents.process : '#6e8997');
    });
    drawProcessMonitor();
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
    panelRect(x, y, width, height, { variant: 'monitor', active: telemetry.active, completed: telemetry.phase === 'COMPLETE', accentColor: accents[telemetry.colorKey] });
    text('PRZEBIEG ABSORPCJI', x + 28, y + 42, 22, accents[telemetry.colorKey]);
    drawInsertedShellWireframe(telemetry, x + 300, y + 145, 118);
    telemetry.label.split('\n').forEach((line, index) => text(`${index ? '' : 'STATUS // '}${line}`, x + 28, y + 215 + index * 28, 21, accents[telemetry.colorKey]));
    if (telemetry.showProgress) {
      const barX = x + 28, barY = y + 254, barWidth = 555; context.fillStyle = '#18303c'; context.fillRect(barX, barY, barWidth, 16);
      context.fillStyle = accents[telemetry.colorKey]; context.fillRect(barX, barY, barWidth * telemetry.extractionProgress, 16);
      text(`${Math.round(telemetry.extractionProgress * 100)}%`, barX + barWidth + 18, barY + 17, 20, '#b9dce8');
    }
    drawAsterionPreview(progressSnapshot(), telemetry, x + 855, y + 150, 118);
    const contentState = contentSource?.getState?.() ?? 'EMPTY'; const assetId = contentSource?.getInsertedShellAssetId?.();
    const contentLabels = { INSERTED: 'GOTOWY', CONSUMING: 'ABSORPCJA', CONSUMED: 'ZABEZPIECZONO' };
    if (contentLabels[contentState]) { context.textAlign = 'right'; text(`MATERIAŁ // ${contentLabels[contentState]}${assetId ? `  ${assetId.replace('shell-relic-', 'SKORUPA ')}` : ''}`, x + width - 28, y + 267, 19, '#88b8cf'); context.textAlign = 'left'; }
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
    drawPatches(() => true, '#6aa6b8', .1);
    drawPatches((id) => states[id]?.committed, accents.complete, progress.complete ? .94 + Math.sin(telemetryElapsed * 2) * .04 : .9, 9);
    drawPatches((id, fragment) => states[id]?.pending && assemblySegmentVisible(fragment, states[id].assemblyProgress), accents.process, .9, 10);
    context.save(); context.strokeStyle = '#588797'; context.globalAlpha = .22; context.lineWidth = 1.2; context.beginPath(); context.arc(cx, cy, radius, 0, Math.PI * 2); context.stroke(); context.restore();
  }
  function draw() {
    if (!context) return; redrawCount += 1; context.clearRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = 'rgba(3,9,17,.96)'; context.fillRect(0, 0, canvas.width, canvas.height);
    drawFurnaceFrame(context, { x: 18, y: 18, width: canvas.width - 36, height: canvas.height - 36, variant: 'panel', cornerSize: config.frameCornerSizePx * 1.5, accentColor: '#4d89a5', opacity: .8 });
    const progress = progressionController.getAsterionSphereProgress();
    if (screen === ASTRO_FURNACE_PANEL_SCREENS.HOME) drawHome(progress); else drawSphere(progress);
    texture.needsUpdate = true;
  }
  function place() {
    furnace.object.updateWorldMatrix(true, true); furnace.object.getWorldQuaternion(furnaceQuaternion);
    right.set(1, 0, 0).applyQuaternion(furnaceQuaternion).normalize();
    const boundsData = furnace.diagnostics.visibleBounds;
    const bounds = boundsData ? new THREE.Box3(new THREE.Vector3().fromArray(boundsData.min), new THREE.Vector3().fromArray(boundsData.max)) : new THREE.Box3().setFromObject(furnace.object);
    const center = bounds.getCenter(new THREE.Vector3());
    const size = bounds.getSize(new THREE.Vector3());
    const projectedHalfWidth = (Math.abs(right.x) * size.x + Math.abs(right.y) * size.y + Math.abs(right.z) * size.z) / 2;
    desiredWorldPosition.copy(center).addScaledVector(right, projectedHalfWidth + config.gapFromFurnace);
    desiredWorldPosition.y = center.y + config.verticalOffset;
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
  } else if (id === 'back-modules') screen = ASTRO_FURNACE_PANEL_SCREENS.HOME; else return false; hoveredRegion = null; draw(); return true; }
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
    if (screen === ASTRO_FURNACE_PANEL_SCREENS.ASTERION_SPHERE) { const telemetry = readTelemetry();
      const previewAnimating = asterionPreviewAnimationActive({ panelState: state, screen });
      if (shouldRefreshTelemetry({ active: previewAnimating, elapsed: telemetryElapsed, lastRedraw: lastTelemetryRedraw, refreshHz: config.telemetryRefreshHz })) { lastTelemetryRedraw = telemetryElapsed; draw(); } }
  }
  function reset() { state = ASTRO_FURNACE_PANEL_STATES.HIDDEN; screen = ASTRO_FURNACE_PANEL_SCREENS.HOME; elapsed = 0; telemetryElapsed = 0; lastTelemetryRedraw = 0; completedUntil = 0; previousProcessState = 'IDLE'; hoveredRegion = null; renderPlanes.forEach((plane) => { plane.material.opacity = 0; }); hits.forEach((_, record) => hits.set(record, null)); place(); root.visible = false; draw(); }
  const unsubscribe = progressionController.subscribe(() => draw());
  const unsubscribePlacement = furnace.subscribePlacement?.(() => place()) ?? (() => {});
  function dispose() { if (disposed) return; disposed = true; unsubscribe(); unsubscribePlacement(); moduleListeners.clear(); listeners.forEach(({ record, listener }) => record.controller.removeEventListener('selectstart', listener)); root.removeFromParent(); renderPlanes.forEach((plane) => { plane.geometry.dispose(); plane.material.dispose(); }); texture.dispose(); canvas.width = 0; canvas.height = 0; hits.clear(); }
  reset();
  return { object: root, mesh: frontPlane, renderPlanes, canvas, texture, hits, show, hide, toggle, place, update, press, reset, dispose, activateRegion, redraw: draw,
    subscribeModuleActivation(listener) { moduleListeners.add(listener); return () => moduleListeners.delete(listener); },
    isVisible: () => state !== ASTRO_FURNACE_PANEL_STATES.HIDDEN && state !== ASTRO_FURNACE_PANEL_STATES.DISAPPEARING,
    hasCurrentHit: (record) => Boolean(hits.get(record)?.intersection), getState: () => state, getScreen: () => screen,
    getInteractiveRegions: () => interactiveRegions.map((region) => ({ ...region })), getRedrawCount: () => redrawCount };
}
