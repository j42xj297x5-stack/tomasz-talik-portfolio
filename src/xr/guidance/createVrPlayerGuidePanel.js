import * as THREE from '../../vendor/three.js';
import { resolveVrPlayerGuideContent } from './vrPlayerGuideContent.js';

const DEFAULT_SETTINGS = Object.freeze({
  enabled: true,
  width: 0.34,
  height: 0.22,
  canvasWidth: 768,
  canvasHeight: 512,
  position: { x: 0.02, y: 0.11, z: -0.18 },
  rotationDegrees: { x: -28, y: 0, z: 0 },
  navigationThreshold: 0.55,
  triggerThreshold: 0.45,
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

export function createVrPlayerGuidePanel({ leftGrip, semanticInput, locale = 'en', settings = {} }) {
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
  let previousNavDirection = 0;
  let previousTriggerPressed = false;
  let disposed = false;

  function draw() {
    const { width, height } = canvas;
    context.clearRect(0, 0, width, height);
    context.fillStyle = config.colors.background; context.fillRect(0, 0, width, height);
    context.strokeStyle = config.colors.border; context.lineWidth = 6; context.strokeRect(18, 18, width - 36, height - 36);
    context.fillStyle = config.colors.text; context.font = '700 44px sans-serif'; context.fillText(content.title, 48, 74);
    content.items.forEach((item, index) => {
      const y = 130 + index * 118;
      if (index === selectedIndex) { context.fillStyle = config.colors.selected; context.fillRect(42, y - 46, width - 84, 92); }
      context.fillStyle = config.colors.text; context.font = '700 34px sans-serif'; context.fillText(item.label, 64, y - 8);
      context.fillStyle = config.colors.muted; context.font = '28px sans-serif'; context.fillText(item.body, 64, y + 30);
    });
    context.fillStyle = config.colors.muted; context.font = '26px sans-serif';
    context.fillText(content.confirm, 48, height - 72); context.fillText(content.close, 48, height - 38);
    texture.needsUpdate = true;
  }

  function setOpen(nextOpen) { open = Boolean(config.enabled && nextOpen); object.visible = open; draw(); }
  function isOpen() { return open; }
  function update() {
    if (disposed) return;
    const input = semanticInput.getState?.() ?? {};
    if (input.togglePlayerGuidePanel) setOpen(!open);
    if (!open) { previousNavDirection = 0; previousTriggerPressed = input.leftPrimaryAction > config.triggerThreshold; return; }
    const axis = input.leftStickY ?? 0;
    const direction = Math.abs(axis) >= config.navigationThreshold ? Math.sign(axis) : 0;
    if (direction && direction !== previousNavDirection) {
      selectedIndex = (selectedIndex + (direction > 0 ? 1 : -1) + content.items.length) % content.items.length;
      draw();
    }
    previousNavDirection = direction;
    const triggerPressed = input.leftPrimaryAction > config.triggerThreshold;
    if (triggerPressed && !previousTriggerPressed) draw();
    previousTriggerPressed = triggerPressed;
  }
  function reset() { selectedIndex = 0; previousNavDirection = 0; previousTriggerPressed = false; setOpen(false); }
  function dispose() { if (disposed) return; disposed = true; object.removeFromParent(); geometry.dispose(); material.dispose(); texture.dispose(); canvas.width = 0; canvas.height = 0; }
  draw();
  return { object, isOpen, update, reset, dispose };
}
