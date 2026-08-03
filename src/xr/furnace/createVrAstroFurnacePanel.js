import * as THREE from '../../vendor/three.js';
import { drawFurnaceFrame } from './drawVrFurnaceFrame.js';
import { resolveProcessTelemetry, shouldRefreshTelemetry } from './vrFurnaceTelemetry.js';

export const ASTRO_FURNACE_PANEL_STATES = Object.freeze({
  HIDDEN: 'HIDDEN', APPEARING: 'APPEARING', VISIBLE: 'VISIBLE', DISAPPEARING: 'DISAPPEARING'
});
export const ASTRO_FURNACE_PANEL_SCREENS = Object.freeze({ HOME: 'HOME', ASTERION_SPHERE: 'ASTERION_SPHERE' });
const smoothstep = (value) => value * value * (3 - 2 * value);

export function createVrAstroFurnacePanel({ parent, furnace, controllers = [], progressionController, processSource, contentSource, settings = {} }) {
  const config = { width: 1.55, height: 1.05, gapFromFurnace: 0.18, verticalOffset: 0.15,
    canvasWidth: 1536, canvasHeight: 1024, appearDuration: 0.32, disappearDuration: 0.20,
    telemetryRefreshHz: 12, frameCornerSizePx: 28, accents: {}, ...settings };
  config.telemetryRefreshHz = Math.min(30, Math.max(4, config.telemetryRefreshHz));
  config.frameCornerSizePx = Math.min(64, Math.max(12, config.frameCornerSizePx));
  const accents = { asterion: '#72cfe8', attractor: '#c8ac70', emanation: '#a98bd4', idle: '#668493', process: '#9eeaff', complete: '#d9f8ff', ...config.accents };
  const root = new THREE.Group(); root.name = 'VrAstroFurnacePanelRoot';
  const canvas = document.createElement('canvas'); canvas.width = config.canvasWidth; canvas.height = config.canvasHeight;
  const context = canvas.getContext('2d');
  const texture = new THREE.CanvasTexture(canvas); texture.colorSpace = THREE.SRGBColorSpace;
  texture.minFilter = THREE.LinearFilter; texture.magFilter = THREE.LinearFilter;
  const material = new THREE.MeshBasicMaterial({ map: texture, transparent: true, depthWrite: false, opacity: 0 });
  const geometry = new THREE.PlaneGeometry(config.width, config.height);
  const mesh = new THREE.Mesh(geometry, material); mesh.name = 'VrAstroFurnacePanelMesh'; mesh.position.x = config.width / 2;
  root.add(mesh); (parent ?? furnace?.object?.parent)?.add(root);
  const raycaster = new THREE.Raycaster(), origin = new THREE.Vector3(), direction = new THREE.Vector3();
  const quaternion = new THREE.Quaternion(), furnaceQuaternion = new THREE.Quaternion(), right = new THREE.Vector3();
  const hits = new Map(controllers.map((record) => [record, null]));
  let state = ASTRO_FURNACE_PANEL_STATES.HIDDEN, screen = ASTRO_FURNACE_PANEL_SCREENS.HOME;
  let elapsed = 0, telemetryElapsed = 0, lastTelemetryRedraw = 0, completedUntil = 0, previousProcessState = 'IDLE';
  let hoveredRegion = null, interactiveRegions = [], disposed = false, redrawCount = 0;
  const moduleListeners = new Set();

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
    progress.shells.forEach((shell, index) => {
      const col = index % 3, row = Math.floor(index / 3), x = 90 + col * 455, y = 270 + row * 175;
      panelRect(x, y, 405, 145, { active: shell.absorbed, completed: shell.absorbed, accentColor: shell.absorbed ? accents.asterion : accents.idle });
      text(`SKORUPA ${String(index + 1).padStart(2, '0')}`, x + 30, y + 45, 24);
      context.textAlign = 'center'; text(shell.absorbed ? '◆' : '◇', x + 202, y + 87, 28, shell.absorbed ? '#d9f8ff' : '#6e8997'); context.textAlign = 'left';
      text(shell.absorbed ? 'ZGROMADZONA' : 'BRAK', x + 30, y + 122, 21, shell.absorbed ? '#c7f5ff' : '#6e8997');
    });
    drawProcessMonitor();
  }
  function readTelemetry() {
    const rawState = processSource?.getState?.() ?? 'IDLE';
    if (rawState === 'COMPLETE' && previousProcessState !== 'COMPLETE') completedUntil = telemetryElapsed + 1.6;
    previousProcessState = rawState;
    const completed = completedUntil > telemetryElapsed;
    return resolveProcessTelemetry({ state: rawState === 'COMPLETE' && !completed ? 'IDLE' : rawState, progress: processSource?.getProgress?.() ?? 0,
      angularSpeed: processSource?.getAngularSpeed?.() ?? 0, processAngle: processSource?.getProcessAngle?.() ?? 0, completed });
  }
  function drawProcessMonitor() {
    const telemetry = readTelemetry(), x = 90, y = 645, width = 1315, height = 325;
    panelRect(x, y, width, height, { variant: 'monitor', active: telemetry.active, completed: telemetry.phase === 'COMPLETE', accentColor: accents[telemetry.colorKey] });
    text('PRZEBIEG ABSORPCJI', x + 28, y + 42, 22, accents[telemetry.colorKey]);
    const pulse = .72 + .28 * Math.sin(telemetryElapsed * 4), shellX = x + 300, shellY = y + 145;
    context.save(); context.globalAlpha = telemetry.silhouetteOpacity * pulse; context.strokeStyle = accents[telemetry.colorKey];
    context.lineWidth = 4; context.beginPath();
    for (let ring = 0; ring < 4; ring++) context.ellipse(shellX, shellY, 112 - ring * 18, 70 + ring * 8,
      telemetry.processAngle * .08 + ring * .55, 0, Math.PI * 2);
    context.stroke(); context.restore();
    text(`STATUS // ${telemetry.label}`, x + 28, y + 225, 21, accents[telemetry.colorKey]);
    if (telemetry.showProgress) {
      const barX = x + 28, barY = y + 254, barWidth = 555; context.fillStyle = '#18303c'; context.fillRect(barX, barY, barWidth, 16);
      context.fillStyle = accents[telemetry.colorKey]; context.fillRect(barX, barY, barWidth * telemetry.progress, 16);
      text(`${Math.round(telemetry.progress * 100)}%`, barX + barWidth + 18, barY + 17, 20, '#b9dce8');
    }
    drawAsterionPreview(progressSnapshot(), x + 855, y + 150, 118);
    const contentState = contentSource?.getState?.() ?? 'EMPTY'; const assetId = contentSource?.getInsertedShellAssetId?.();
    const contentLabels = { INSERTED: 'GOTOWY', CONSUMING: 'ABSORPCJA', CONSUMED: 'ZABEZPIECZONO' };
    if (contentLabels[contentState]) { context.textAlign = 'right'; text(`MATERIAŁ // ${contentLabels[contentState]}${assetId ? `  ${assetId.replace('shell-relic-', 'SKORUPA ')}` : ''}`, x + width - 28, y + 267, 19, '#88b8cf'); context.textAlign = 'left'; }
  }
  function progressSnapshot() { return progressionController.getAsterionSphereProgress(); }
  function drawAsterionPreview(progress, cx, cy, radius) {
    const rotation = telemetryElapsed * .22; text(`KULA ASTERIONOWA  ${progress.absorbed}/6`, cx - 190, cy - 112, 20, accents.asterion);
    context.save(); context.lineWidth = 3;
    for (let segment = 0; segment < 6; segment++) {
      const start = rotation + segment * Math.PI / 3, end = start + Math.PI / 3 - .08;
      context.strokeStyle = segment < progress.absorbed ? '#c8f6ff' : '#355766';
      context.shadowColor = segment < progress.absorbed ? accents.asterion : 'transparent'; context.shadowBlur = segment < progress.absorbed ? 14 : 0;
      context.beginPath(); context.arc(cx, cy, radius, start, end); context.stroke();
    }
    context.shadowBlur = 0; context.strokeStyle = '#588797'; context.lineWidth = 2;
    context.beginPath(); context.ellipse(cx, cy, radius, radius * .34, rotation, 0, Math.PI * 2); context.stroke();
    context.beginPath(); context.ellipse(cx, cy, radius * .34, radius, -rotation * .7, 0, Math.PI * 2); context.stroke(); context.restore();
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
    root.position.copy(center).addScaledVector(right, projectedHalfWidth + config.gapFromFurnace);
    root.position.y = center.y + config.verticalOffset; root.quaternion.copy(furnaceQuaternion); root.scale.set(0.001, 0.92, 1);
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
        raycaster.far = record.currentRayLength ?? 3; const intersection = raycaster.intersectObject(mesh, false)[0];
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
    if (state === ASTRO_FURNACE_PANEL_STATES.APPEARING) { const t = smoothstep(Math.min(1, elapsed / config.appearDuration)); root.scale.set(0.001 + .999 * t, .92 + .08 * t, 1); material.opacity = t; if (t === 1) state = ASTRO_FURNACE_PANEL_STATES.VISIBLE; }
    else if (state === ASTRO_FURNACE_PANEL_STATES.DISAPPEARING) { const t = smoothstep(Math.min(1, elapsed / config.disappearDuration)); root.scale.set(1 - .999 * t, 1 - .08 * t, 1); material.opacity = 1 - t; if (t === 1) { state = ASTRO_FURNACE_PANEL_STATES.HIDDEN; root.visible = false; } }
    updateHits();
    if (screen === ASTRO_FURNACE_PANEL_SCREENS.ASTERION_SPHERE) { const telemetry = readTelemetry();
      if (shouldRefreshTelemetry({ active: telemetry.active || completedUntil > telemetryElapsed, elapsed: telemetryElapsed, lastRedraw: lastTelemetryRedraw, refreshHz: config.telemetryRefreshHz })) { lastTelemetryRedraw = telemetryElapsed; draw(); } }
  }
  function reset() { state = ASTRO_FURNACE_PANEL_STATES.HIDDEN; screen = ASTRO_FURNACE_PANEL_SCREENS.HOME; elapsed = 0; telemetryElapsed = 0; lastTelemetryRedraw = 0; completedUntil = 0; previousProcessState = 'IDLE'; hoveredRegion = null; material.opacity = 0; hits.forEach((_, record) => hits.set(record, null)); place(); root.visible = false; draw(); }
  const unsubscribe = progressionController.subscribe(() => draw());
  const unsubscribePlacement = furnace.subscribePlacement?.(() => place()) ?? (() => {});
  function dispose() { if (disposed) return; disposed = true; unsubscribe(); unsubscribePlacement(); moduleListeners.clear(); listeners.forEach(({ record, listener }) => record.controller.removeEventListener('selectstart', listener)); root.removeFromParent(); geometry.dispose(); material.dispose(); texture.dispose(); canvas.width = 0; canvas.height = 0; hits.clear(); }
  reset();
  return { object: root, mesh, canvas, texture, hits, show, hide, toggle, place, update, press, reset, dispose, activateRegion, redraw: draw,
    subscribeModuleActivation(listener) { moduleListeners.add(listener); return () => moduleListeners.delete(listener); },
    isVisible: () => state !== ASTRO_FURNACE_PANEL_STATES.HIDDEN && state !== ASTRO_FURNACE_PANEL_STATES.DISAPPEARING,
    hasCurrentHit: (record) => Boolean(hits.get(record)?.intersection), getState: () => state, getScreen: () => screen,
    getInteractiveRegions: () => interactiveRegions.map((region) => ({ ...region })), getRedrawCount: () => redrawCount };
}
