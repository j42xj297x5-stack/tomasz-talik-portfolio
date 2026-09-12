import * as THREE from '../../vendor/three.js';
import { publicPath } from '../../utils/publicPath.js';

const CREDITS_SECONDS = 12;
const BRAND_HOLD_SECONDS = 4;
const LOGO_SPIN_SECONDS = 0.8;
const BRAND_FADE_SECONDS = 2;
const BRAND_TOTAL_SECONDS = BRAND_HOLD_SECONDS + LOGO_SPIN_SECONDS + BRAND_FADE_SECONDS;
const ORANGE = '#f28c18';
const DARK = '#111111';
const PRESENTATION_SCALE = 1.5;
const CANVAS_WIDTH = 1600;
const CANVAS_HEIGHT = 1000;

const CREDIT_SECTIONS = Object.freeze([
  ['Wizja', 'Tomasz Talik'],
  ['Architekt', 'ChatGPT'],
  ['Wykonawca', 'Codex'],
  ['Siatki 3D', 'Meshy AI'],
  ['Dźwięki', 'Adobe Firefly, ElevenLabs'],
  ['Silnik 3D', 'Three.js'],
  ['Obróbka 2D / 3D', 'Blender, Inkscape, GIMP'],
  ['Audio mix / master', 'Ableton Live'],
  ['Efekty wizualne / VFX', 'Autorskie implementacje w Three.js'],
  ['VR', 'Virtual Desktop'],
  ['Licencja publicznej edycji', 'Creative Commons Attribution-ShareAlike']
]);

const PHASE = Object.freeze({ IDLE: 'IDLE', CREDITS: 'CREDITS', BRAND: 'BRAND', COMPLETE: 'COMPLETE' });
const clamp01 = (value) => Math.max(0, Math.min(1, value));

export function createVrEndCreditsPresentation({ worldRoot, getViewingPose, onCreditsCompleted, onBrandCompleted }) {
  if (!worldRoot?.add || typeof getViewingPose !== 'function'
    || typeof onCreditsCompleted !== 'function' || typeof onBrandCompleted !== 'function') {
    throw new TypeError('[VrEndCreditsPresentation] Required presentation seams are unavailable.');
  }

  const canvas = document.createElement('canvas');
  canvas.width = CANVAS_WIDTH * PRESENTATION_SCALE;
  canvas.height = CANVAS_HEIGHT * PRESENTATION_SCALE;
  const context = canvas.getContext('2d');
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const material = new THREE.MeshBasicMaterial({
    map: texture, transparent: true, opacity: 1, depthTest: false, depthWrite: false, toneMapped: false
  });
  const object = new THREE.Mesh(new THREE.PlaneGeometry(12, 7.5), material);
  object.name = 'VrEndCreditsPresentation';
  object.renderOrder = 100001;
  object.visible = false;
  worldRoot.add(object);

  const logo = new Image();
  let logoLoaded = false;
  logo.onload = () => {
    logoLoaded = true;
    if (phase === PHASE.BRAND) drawBrand(currentLogoRotation());
  };
  logo.src = publicPath('/png/orange_monkey.webp');

  let phase = PHASE.IDLE;
  let elapsed = 0;
  let completionSent = false;
  let disposed = false;
  let anchored = false;
  const viewPosition = new THREE.Vector3();
  const viewQuaternion = new THREE.Quaternion();
  const forward = new THREE.Vector3();
  const anchorPosition = new THREE.Vector3();

  function ensureWorldAnchor() {
    if (anchored) return;
    getViewingPose(viewPosition, viewQuaternion);
    forward.set(0, 0, -1).applyQuaternion(viewQuaternion);
    forward.y = 0;
    if (forward.lengthSq() < 0.0001) forward.set(0, 0, -1);
    forward.normalize();
    anchorPosition.copy(viewPosition).addScaledVector(forward, 8);
    object.position.copy(anchorPosition);
    object.lookAt(viewPosition);
    anchored = true;
  }

  function prepareCanvas() {
    context.setTransform(1, 0, 0, 1, 0, 0);
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.setTransform(PRESENTATION_SCALE, 0, 0, PRESENTATION_SCALE, 0, 0);
    context.textAlign = 'center';
    context.textBaseline = 'middle';
  }

  function drawCredits() {
    prepareCanvas();
    context.fillStyle = DARK;
    context.font = '700 66px sans-serif';
    context.fillText('ORANGE MONKEY VR', CANVAS_WIDTH / 2, 72);
    const startY = 164;
    const sectionStep = 74;
    CREDIT_SECTIONS.forEach(([label, value], index) => {
      const y = startY + index * sectionStep;
      context.font = '700 29px sans-serif';
      context.fillText(label, CANVAS_WIDTH / 2, y);
      context.font = '32px sans-serif';
      context.fillText(value, CANVAS_WIDTH / 2, y + 34);
    });
    texture.needsUpdate = true;
  }

  function drawBrand(rotation = 0) {
    prepareCanvas();
    const centerY = CANVAS_HEIGHT / 2;
    const logoSize = 270;
    const gap = 58;
    const wordmarkFont = 112;
    context.font = `700 ${wordmarkFont}px sans-serif`;
    const orangeWidth = context.measureText('ORANGE').width;
    const blackWidth = context.measureText(' MONKEY VR').width;
    const groupWidth = logoSize + gap + orangeWidth + blackWidth;
    const logoCenterX = (CANVAS_WIDTH - groupWidth) / 2 + logoSize / 2;
    if (logoLoaded) {
      context.save();
      context.translate(logoCenterX, centerY);
      context.rotate(rotation);
      context.drawImage(logo, -logoSize / 2, -logoSize / 2, logoSize, logoSize);
      context.restore();
    }
    const textX = logoCenterX + logoSize / 2 + gap;
    context.textAlign = 'left';
    context.fillStyle = ORANGE;
    context.fillText('ORANGE', textX, centerY);
    context.fillStyle = DARK;
    context.fillText(' MONKEY VR', textX + orangeWidth, centerY);
    texture.needsUpdate = true;
  }

  function currentLogoRotation() {
    return Math.PI * 2 * clamp01((elapsed - BRAND_HOLD_SECONDS) / LOGO_SPIN_SECONDS);
  }

  function beginCredits() {
    if (disposed || phase !== PHASE.IDLE) return false;
    phase = PHASE.CREDITS;
    elapsed = 0;
    completionSent = false;
    ensureWorldAnchor();
    material.opacity = 1;
    drawCredits();
    object.visible = true;
    return true;
  }

  function beginBrandSlate() {
    if (disposed || phase === PHASE.BRAND) return false;
    phase = PHASE.BRAND;
    elapsed = 0;
    completionSent = false;
    ensureWorldAnchor();
    material.opacity = 1;
    drawBrand(0);
    object.visible = true;
    return true;
  }

  function update(delta = 0) {
    if (disposed || phase === PHASE.IDLE || phase === PHASE.COMPLETE) return;
    elapsed += Math.max(0, Number.isFinite(delta) ? delta : 0);
    if (phase === PHASE.CREDITS) {
      if (elapsed < CREDITS_SECONDS) return;
      object.visible = false;
      phase = PHASE.COMPLETE;
      if (!completionSent) {
        completionSent = true;
        onCreditsCompleted();
      }
      return;
    }
    if (elapsed >= BRAND_HOLD_SECONDS && elapsed < BRAND_HOLD_SECONDS + LOGO_SPIN_SECONDS) {
      drawBrand(currentLogoRotation());
    } else if (elapsed >= BRAND_HOLD_SECONDS + LOGO_SPIN_SECONDS) {
      drawBrand(Math.PI * 2);
      material.opacity = 1 - clamp01((elapsed - BRAND_HOLD_SECONDS - LOGO_SPIN_SECONDS) / BRAND_FADE_SECONDS);
    }
    if (elapsed < BRAND_TOTAL_SECONDS) return;
    object.visible = false;
    phase = PHASE.COMPLETE;
    if (!completionSent) {
      completionSent = true;
      onBrandCompleted();
    }
  }

  function hydrateScenarioState(state) {
    if (!state || Object.keys(state).length !== 1 || state.completed !== true) {
      throw new TypeError('endCredits state must be exactly { completed: true }');
    }
    object.visible = false;
    material.opacity = 1;
    elapsed = 0;
    completionSent = true;
    phase = PHASE.COMPLETE;
  }

  function reset() {
    if (disposed) return;
    object.visible = false;
    material.opacity = 1;
    elapsed = 0;
    completionSent = false;
    phase = PHASE.IDLE;
    anchored = false;
    prepareCanvas();
    texture.needsUpdate = true;
  }

  function dispose() {
    if (disposed) return;
    reset();
    disposed = true;
    object.removeFromParent();
    object.geometry.dispose();
    material.dispose();
    texture.dispose();
    logo.onload = null;
  }

  return { object, beginCredits, beginBrandSlate, update, reset, hydrateScenarioState, dispose };
}
