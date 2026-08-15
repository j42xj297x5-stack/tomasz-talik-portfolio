import * as THREE from '../../vendor/three.js';
import { publicPath } from '../../utils/publicPath.js';
import { resolveVrPlayerGuideContent } from './vrPlayerGuideContent.js';
import { filterControllerSvg, INITIAL_VISIBLE_CONTROL_IDS, normalizeVisibleControlIds } from './filterControllerSvg.js';

const DEFAULT_SETTINGS = Object.freeze({
  enabled: true,
  width: 0.34,
  height: 0.286,
  canvasWidth: 768,
  canvasHeight: 666,
  position: { x: 0.29, y: 0.143, z: -0.18 },
  rotationDegrees: { x: -52, y: 0, z: 0 },
  navigationThreshold: 0.55,
  colors: { background: '#101722', border: '#75d7ff', text: '#eff9ff', muted: '#9ab0bd', selected: '#1f5d78' }
});

const degToRad = (degrees) => degrees * Math.PI / 180;
const finite = (value, fallback) => Number.isFinite(value) ? value : fallback;

function normalizeSettings(settings = {}) {
  return {
    ...DEFAULT_SETTINGS,
    ...settings,
    position: { ...DEFAULT_SETTINGS.position, ...(settings.position ?? {}) },
    rotationDegrees: { ...DEFAULT_SETTINGS.rotationDegrees, ...(settings.rotationDegrees ?? {}) },
    colors: { ...DEFAULT_SETTINGS.colors, ...(settings.colors ?? {}) }
  };
}

function drawWrappedText(context, text, x, y, maxWidth, lineHeight, maxLines = Infinity) {
  const words = String(text).split(/\s+/).filter(Boolean);
  let line = '';
  let lines = 0;
  for (const word of words) {
    const testLine = line ? `${line} ${word}` : word;
    if (context.measureText(testLine).width > maxWidth && line) {
      context.fillText(line, x, y);
      y += lineHeight;
      lines += 1;
      line = word;
      if (lines >= maxLines) return y;
    } else {
      line = testLine;
    }
  }
  if (line && lines < maxLines) {
    context.fillText(line, x, y);
    y += lineHeight;
  }
  return y;
}

export function createVrPlayerGuidePanel({ leftGrip, semanticInput, locale = 'en', settings = {},
  onOpenChange = () => {}, onPanelClick = () => {}, debugCheckpoints = [],
  onDebugCheckpoint = () => {} }) {
  const config = normalizeSettings(settings);
  const content = resolveVrPlayerGuideContent(locale);
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(finite(config.canvasWidth, DEFAULT_SETTINGS.canvasWidth));
  canvas.height = Math.round(finite(config.canvasHeight, DEFAULT_SETTINGS.canvasHeight));
  const context = canvas.getContext('2d');
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const material = new THREE.MeshBasicMaterial({ map: texture, transparent: true, side: THREE.DoubleSide });
  const geometry = new THREE.PlaneGeometry(finite(config.width, DEFAULT_SETTINGS.width), finite(config.height, DEFAULT_SETTINGS.height));
  const object = new THREE.Mesh(geometry, material);
  object.name = 'VrPlayerGuidePanel';
  object.visible = false;
  object.position.set(config.position.x, config.position.y, config.position.z);
  object.rotation.set(degToRad(config.rotationDegrees.x), degToRad(config.rotationDegrees.y), degToRad(config.rotationDegrees.z));
  leftGrip?.add?.(object);

  let open = false;
  let selectedIndex = 0;
  const VIEW_STATE = Object.freeze({ MENU: 'MENU', DETAIL: 'DETAIL' });
  let viewState = VIEW_STATE.MENU;
  let activeSectionId = null;
  let previousNavDirection = 0;
  let previousHorizontalDirection = 0;
  let selectedDebugIndex = 0;
  let previousConfirmPressed = false;
  let suppressOpenNotification = false;
  let disposed = false;
  let controllersImageLoaded = false;
  let controllersImageFailed = false;
  const controllersImage = new Image();
  const controllersSvgUrl = publicPath(locale === 'pl' ? 'svg/controllers_pl.svg' : 'svg/controllers_en.svg');
  let visibleControlIds = normalizeVisibleControlIds(INITIAL_VISIBLE_CONTROL_IDS);
  let controllerObjectUrl = null;
  let loadVersion = 0;

  function releaseControllerObjectUrl() {
    if (controllerObjectUrl) URL.revokeObjectURL(controllerObjectUrl);
    controllerObjectUrl = null;
  }

  async function loadControllersImage() {
    const version = ++loadVersion;
    controllersImageLoaded = false; controllersImageFailed = false;
    try {
      const response = await fetch(controllersSvgUrl);
      if (!response.ok) throw new Error(`Controller SVG request failed: ${response.status}`);
      const filtered = filterControllerSvg(await response.text(), visibleControlIds);
      if (disposed || version !== loadVersion) return;
      releaseControllerObjectUrl();
      controllerObjectUrl = URL.createObjectURL(new Blob([filtered], { type: 'image/svg+xml' }));
      controllersImage.src = controllerObjectUrl;
    } catch {
      if (disposed || version !== loadVersion) return;
      releaseControllerObjectUrl(); controllersImageFailed = true; draw();
    }
  }

  function setVisibleControlIds(ids) {
    const next = normalizeVisibleControlIds(ids);
    if (next.length === visibleControlIds.length && next.every((id, index) => id === visibleControlIds[index])) return;
    visibleControlIds = next;
    void loadControllersImage();
  }

  function drawFrame(width, height) {
    context.clearRect(0, 0, width, height);
    context.fillStyle = config.colors.background;
    context.fillRect(0, 0, width, height);
    context.strokeStyle = config.colors.border;
    context.lineWidth = 5;
    context.strokeRect(10, 10, width - 20, height - 20);
  }

  function drawHeader() {
    context.fillStyle = config.colors.text;
    context.font = '700 40px sans-serif';
    context.fillText(content.title, 28, 60);
    context.fillStyle = config.colors.muted;
    context.font = '23px sans-serif';
    context.fillText(viewState === VIEW_STATE.MENU ? content.menuHint : content.detailHint, 28, canvas.height - 30);
  }

  function drawMainMenu() {
    const boxWidth = canvas.width - 72;
    const boxHeight = 132;
    const gap = 34;
    const startY = 154;
    content.items.forEach((item, index) => {
      const x = 36;
      const y = startY + index * (boxHeight + gap);
      if (index === selectedIndex) {
        context.fillStyle = config.colors.selected;
        context.fillRect(x, y, boxWidth, boxHeight);
      }
      context.strokeStyle = index === selectedIndex ? config.colors.border : 'rgba(117, 215, 255, 0.35)';
      context.lineWidth = 4;
      context.strokeRect(x, y, boxWidth, boxHeight);
      context.fillStyle = config.colors.text;
      context.font = '700 38px sans-serif';
      context.textAlign = 'center';
      context.textBaseline = 'middle';
      context.fillText(item.label, x + boxWidth / 2, y + boxHeight / 2);
      context.textAlign = 'start';
      context.textBaseline = 'alphabetic';
    });
    if (debugCheckpoints.length) {
      const selected = selectedIndex === content.items.length;
      const y = canvas.height - 132;
      context.strokeStyle = selected ? config.colors.border : 'rgba(117, 215, 255, 0.35)';
      context.lineWidth = 3;
      context.beginPath?.(); context.moveTo?.(36, y - 18); context.lineTo?.(canvas.width - 36, y - 18); context.stroke?.();
      context.fillStyle = config.colors.muted; context.font = '700 22px sans-serif';
      context.fillText('DEBUG', 36, y + 12);
      const width = 86; const gap = 10; const start = 36;
      debugCheckpoints.forEach((checkpoint, index) => {
        const x = start + index * (width + gap);
        if (selected && index === selectedDebugIndex) { context.fillStyle = config.colors.selected; context.fillRect(x, y + 26, width, 48); }
        context.strokeStyle = selected && index === selectedDebugIndex ? config.colors.border : 'rgba(117, 215, 255, 0.35)';
        context.strokeRect(x, y + 26, width, 48);
        context.fillStyle = config.colors.text; context.font = '700 24px sans-serif'; context.textAlign = 'center';
        context.fillText(checkpoint.label, x + width / 2, y + 58); context.textAlign = 'start';
      });
    }
  }

  function drawCurrentTaskCard(item) {
    context.fillStyle = config.colors.text;
    context.font = '700 31px sans-serif';
    context.fillText(item.label, 36, 186);
    context.fillStyle = config.colors.muted;
    context.font = '27px sans-serif';
    drawWrappedText(context, item.body, 36, 230, canvas.width - 72, 38, 5);
  }

  function drawControlsCard(item) {
    const padding = 34;
    const top = 112;
    const bottom = canvas.height - 72;
    context.fillStyle = config.colors.text;
    context.font = '700 30px sans-serif';
    context.fillText(item.label, padding, top);

    const imageBox = { x: padding, y: top + 20, width: canvas.width - padding * 2, height: bottom - top - 20 };
    if (controllersImageLoaded) {
      const ratio = Math.min(imageBox.width / controllersImage.naturalWidth, imageBox.height / controllersImage.naturalHeight);
      const drawWidth = controllersImage.naturalWidth * ratio;
      const drawHeight = controllersImage.naturalHeight * ratio;
      context.drawImage(
        controllersImage,
        imageBox.x + (imageBox.width - drawWidth) / 2,
        imageBox.y + (imageBox.height - drawHeight) / 2,
        drawWidth,
        drawHeight
      );
    } else if (controllersImageFailed) {
      context.fillStyle = config.colors.muted;
      context.font = '22px sans-serif';
      context.fillText(content.controllersFallback, imageBox.x, imageBox.y + 36);
    }
  }

  function draw() {
    const { width, height } = canvas;
    drawFrame(width, height);
    drawHeader();
    if (viewState === VIEW_STATE.MENU) {
      drawMainMenu();
    } else {
      const activeItem = content.items.find((item) => item.id === activeSectionId) ?? content.items[0];
      if (activeItem?.id === 'controls') drawControlsCard(activeItem);
      else drawCurrentTaskCard(activeItem);
    }
    texture.needsUpdate = true;
  }

  function setOpen(nextOpen, { notify = true } = {}) {
    const previous = open;
    open = Boolean(config.enabled && nextOpen); object.visible = open; draw();
    if (notify && !suppressOpenNotification && open !== previous) onOpenChange(open);
  }
  function isOpen() { return open; }
  function update() {
    if (disposed) return;
    const input = semanticInput.getState?.() ?? {};
    if (input.togglePlayerGuidePanel) {
      if (open && viewState === VIEW_STATE.DETAIL) {
        viewState = VIEW_STATE.MENU;
        activeSectionId = null;
        draw();
        onPanelClick();
      } else {
        setOpen(!open);
      }
    }
    if (!open) { previousNavDirection = 0; previousConfirmPressed = false; return; }
    const axis = input.leftStickY ?? 0;
    const direction = Math.abs(axis) >= config.navigationThreshold ? Math.sign(axis) : 0;
    if (viewState === VIEW_STATE.MENU && direction && direction !== previousNavDirection) {
      const rowCount = content.items.length + (debugCheckpoints.length ? 1 : 0);
      selectedIndex = (selectedIndex + (direction > 0 ? 1 : -1) + rowCount) % rowCount;
      draw();
      onPanelClick();
    }
    previousNavDirection = direction;
    const horizontalAxis = input.leftStickX ?? 0;
    const horizontalDirection = Math.abs(horizontalAxis) >= config.navigationThreshold ? Math.sign(horizontalAxis) : 0;
    if (viewState === VIEW_STATE.MENU && selectedIndex === content.items.length && horizontalDirection
      && horizontalDirection !== previousHorizontalDirection) {
      selectedDebugIndex = (selectedDebugIndex + (horizontalDirection > 0 ? 1 : -1)
        + debugCheckpoints.length) % debugCheckpoints.length;
      draw(); onPanelClick();
    }
    previousHorizontalDirection = horizontalDirection;
    const confirmPressed = Boolean(input.toggleLeftTool);
    if (confirmPressed && !previousConfirmPressed) {
      if (viewState === VIEW_STATE.MENU) {
        if (selectedIndex === content.items.length && debugCheckpoints.length) {
          onDebugCheckpoint(debugCheckpoints[selectedDebugIndex].id);
          setOpen(false);
          onPanelClick();
        } else {
          activeSectionId = content.items[selectedIndex]?.id ?? activeSectionId;
          viewState = VIEW_STATE.DETAIL;
          draw(); onPanelClick();
        }
      }
    }
    previousConfirmPressed = confirmPressed;
  }
  function reset() { selectedIndex = 0; selectedDebugIndex = 0; viewState = VIEW_STATE.MENU; activeSectionId = null; previousNavDirection = 0; previousHorizontalDirection = 0; previousConfirmPressed = false;
    suppressOpenNotification = true; setOpen(false); suppressOpenNotification = false; }
  function dispose() {
    if (disposed) return;
    disposed = true;
    controllersImage.onload = null;
    controllersImage.onerror = null;
    loadVersion += 1; releaseControllerObjectUrl();
    object.removeFromParent(); geometry.dispose(); material.dispose(); texture.dispose(); canvas.width = 0; canvas.height = 0;
  }

  controllersImage.onload = () => { if (disposed) return; controllersImageLoaded = true; draw(); };
  controllersImage.onerror = () => { if (disposed) return; controllersImageFailed = true; draw(); };
  void loadControllersImage();
  draw();
  return { object, isOpen, update, reset, dispose, setVisibleControlIds,
    getVisibleControlIds: () => [...visibleControlIds], getViewState: () => viewState,
    getSelectedIndex: () => selectedIndex, getSelectedDebugIndex: () => selectedDebugIndex,
    getActiveSectionId: () => activeSectionId };
}
