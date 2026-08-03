import * as THREE from '../../vendor/three.js';

export const ASTRO_FURNACE_PANEL_STATES = Object.freeze({
  HIDDEN: 'HIDDEN', APPEARING: 'APPEARING', VISIBLE: 'VISIBLE', DISAPPEARING: 'DISAPPEARING'
});
export const ASTRO_FURNACE_PANEL_SCREENS = Object.freeze({ HOME: 'HOME', ASTERION_SPHERE: 'ASTERION_SPHERE' });
const smoothstep = (value) => value * value * (3 - 2 * value);

export function createVrAstroFurnacePanel({ parent, furnace, controllers = [], progressionController, settings = {} }) {
  const config = { width: 1.55, height: 1.05, gapFromFurnace: 0.18, verticalOffset: 0.15,
    canvasWidth: 1536, canvasHeight: 1024, appearDuration: 0.32, disappearDuration: 0.20, ...settings };
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
  let elapsed = 0, hoveredRegion = null, interactiveRegions = [], disposed = false, redrawCount = 0;

  function panelRect(x, y, width, height, active = false) {
    context.fillStyle = active ? '#102a3c' : '#09131f'; context.fillRect(x, y, width, height);
    context.strokeStyle = active ? '#a8e8ff' : '#41677d'; context.lineWidth = active ? 4 : 2; context.strokeRect(x, y, width, height);
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
      panelRect(rect.x, rect.y, rect.width, rect.height, hoveredRegion === rect.id);
      text(card[1], rect.x + 42, rect.y + 60, 37, card[5] ? '#f1fbff' : '#78909d');
      text(card[2], rect.x + 42, rect.y + 112, 25, '#91afbe'); text(card[3], rect.x + 42, rect.y + 166, 21, '#6f9db5');
      context.textAlign = 'right'; text(card[4], rect.x + rect.width - 42, rect.y + 166, 22, card[5] ? '#bdefff' : '#647985'); context.textAlign = 'left';
      return rect;
    });
  }
  function drawSphere(progress) {
    interactiveRegions = [{ id: 'back-modules', x: 90, y: 55, width: 260, height: 70, enabled: true }];
    panelRect(90, 55, 260, 70, hoveredRegion === 'back-modules'); text('← MODUŁY', 120, 102, 27);
    text('SFERA ASTERIONOWA', 90, 190, 48); text('Rdzeń żyroskopowy sterowania kręgiem', 90, 238, 24, '#88b8cf');
    progress.shells.forEach((shell, index) => {
      const col = index % 3, row = Math.floor(index / 3), x = 90 + col * 455, y = 300 + row * 245;
      panelRect(x, y, 405, 195, shell.absorbed); text(`SKORUPA ${String(index + 1).padStart(2, '0')}`, x + 30, y + 62, 26);
      text(shell.absorbed ? '●  ZGROMADZONA' : '○  BRAK', x + 30, y + 138, 25, shell.absorbed ? '#c7f5ff' : '#6e8997');
    });
    text(progress.complete ? 'KOMPLET ZGROMADZONY' : `ZGROMADZONO ${progress.absorbed} / ${progress.required}`, 90, 850, 34);
    text('Piec zachowuje pochłonięte elementy.', 90, 920, 22, '#8fb0c0');
    text('Zgromadź po jednej skorupie każdego typu.', 90, 958, 22, '#8fb0c0');
  }
  function draw() {
    if (!context) return; redrawCount += 1; context.clearRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = 'rgba(3,9,17,.96)'; context.fillRect(0, 0, canvas.width, canvas.height);
    context.strokeStyle = '#4d89a5'; context.lineWidth = 3; context.strokeRect(18, 18, canvas.width - 36, canvas.height - 36);
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
  function activateRegion(id) { if (id === 'module-asterion-sphere') screen = ASTRO_FURNACE_PANEL_SCREENS.ASTERION_SPHERE; else if (id === 'back-modules') screen = ASTRO_FURNACE_PANEL_SCREENS.HOME; else return false; hoveredRegion = null; draw(); return true; }
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
    if (disposed) return; elapsed += Math.max(0, delta);
    if (state === ASTRO_FURNACE_PANEL_STATES.APPEARING) { const t = smoothstep(Math.min(1, elapsed / config.appearDuration)); root.scale.set(0.001 + .999 * t, .92 + .08 * t, 1); material.opacity = t; if (t === 1) state = ASTRO_FURNACE_PANEL_STATES.VISIBLE; }
    else if (state === ASTRO_FURNACE_PANEL_STATES.DISAPPEARING) { const t = smoothstep(Math.min(1, elapsed / config.disappearDuration)); root.scale.set(1 - .999 * t, 1 - .08 * t, 1); material.opacity = 1 - t; if (t === 1) { state = ASTRO_FURNACE_PANEL_STATES.HIDDEN; root.visible = false; } }
    updateHits();
  }
  function reset() { state = ASTRO_FURNACE_PANEL_STATES.HIDDEN; screen = ASTRO_FURNACE_PANEL_SCREENS.HOME; elapsed = 0; hoveredRegion = null; material.opacity = 0; hits.forEach((_, record) => hits.set(record, null)); place(); root.visible = false; draw(); }
  const unsubscribe = progressionController.subscribe(() => draw());
  const unsubscribePlacement = furnace.subscribePlacement?.(() => place()) ?? (() => {});
  function dispose() { if (disposed) return; disposed = true; unsubscribe(); unsubscribePlacement(); listeners.forEach(({ record, listener }) => record.controller.removeEventListener('selectstart', listener)); root.removeFromParent(); geometry.dispose(); material.dispose(); texture.dispose(); canvas.width = 0; canvas.height = 0; hits.clear(); }
  reset();
  return { object: root, mesh, canvas, texture, hits, show, hide, toggle, place, update, press, reset, dispose, activateRegion,
    isVisible: () => state !== ASTRO_FURNACE_PANEL_STATES.HIDDEN && state !== ASTRO_FURNACE_PANEL_STATES.DISAPPEARING,
    hasCurrentHit: (record) => Boolean(hits.get(record)?.intersection), getState: () => state, getScreen: () => screen,
    getInteractiveRegions: () => interactiveRegions.map((region) => ({ ...region })), getRedrawCount: () => redrawCount };
}
