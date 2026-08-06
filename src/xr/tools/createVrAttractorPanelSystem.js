import * as THREE from '../../vendor/three.js';

export const VR_ATTRACTOR_PANEL_NAMES = Object.freeze(
  Array.from({ length: 4 }, (_, index) => `glyph_panel_0${index + 1}`)
);

const DEFAULT_CONTENTS = Object.freeze(['', '02', '03', '04']);
const MAX_CANVAS_EDGE = 512;
const STATE_STYLES = Object.freeze({
  idle: { accent: '#8fd8ff', brightness: 1 },
  'target-valid': { accent: '#76ffac', brightness: 1.12 },
  'target-invalid': { accent: '#ff8585', brightness: 1.05 },
  pulling: { accent: '#ffd36b', brightness: 1.14 },
  captured: { accent: '#ffffff', brightness: 1.18 },
  upgrade: { accent: '#d5a0ff', brightness: 1.14 },
  'low-energy': { accent: '#9d7777', brightness: 0.55 }
});

function positiveNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? number : null;
}

export function resolveAttractorPanelAspect(panel) {
  const explicitAspect = positiveNumber(panel.userData?.vr_panel_aspect);
  if (explicitAspect) return explicitAspect;
  const width = positiveNumber(panel.userData?.vr_panel_width_m);
  const height = positiveNumber(panel.userData?.vr_panel_height_m);
  if (width && height) return width / height;
  panel.geometry.computeBoundingBox();
  const size = panel.geometry.boundingBox?.getSize(new THREE.Vector3());
  return size && positiveNumber(size.x) && positiveNumber(size.y) ? size.x / size.y : 1;
}

function canvasSize(aspect) {
  return aspect >= 1
    ? { width: MAX_CANVAS_EDGE, height: Math.max(1, Math.round(MAX_CANVAS_EDGE / aspect)) }
    : { width: Math.max(1, Math.round(MAX_CANVAS_EDGE * aspect)), height: MAX_CANVAS_EDGE };
}

export function createVrAttractorPanelSystem({ panels, canvasFactory, imageFactory } = {}) {
  if (!Array.isArray(panels) || panels.length !== VR_ATTRACTOR_PANEL_NAMES.length) {
    throw new Error('[VrAttractorPanels] Exactly four authored glyph panels are required.');
  }
  panels.forEach((panel, index) => {
    if (!panel?.isMesh || !panel.geometry?.getAttribute?.('uv')) {
      throw new Error(`[VrAttractorPanels] ${VR_ATTRACTOR_PANEL_NAMES[index]} must be a mesh with authored UVs.`);
    }
  });

  let state = 'idle';
  let disposed = false;
  const records = panels.map((panel, index) => {
    const canvas = canvasFactory ? canvasFactory(panel, index) : document.createElement('canvas');
    const size = canvasSize(resolveAttractorPanelAspect(panel));
    canvas.width = size.width; canvas.height = size.height;
    const context = canvas.getContext('2d');
    if (!context) throw new Error(`[VrAttractorPanels] Could not create a 2D context for ${panel.name}.`);
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.minFilter = THREE.LinearFilter; texture.magFilter = THREE.LinearFilter;
    const material = new THREE.MeshBasicMaterial({ map: texture, transparent: true, side: THREE.FrontSide,
      depthTest: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1 });
    const originalMaterial = panel.material;
    panel.material = material;
    return { panel, canvas, context, texture, material, originalMaterial, content: DEFAULT_CONTENTS[index], glyph: null };
  });

  const glyphImages = new Map();

  function loadGlyph(url) {
    if (glyphImages.has(url)) return glyphImages.get(url);
    const image = imageFactory ? imageFactory() : new Image();
    const pending = new Promise((resolve, reject) => {
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error(`[VrAttractorPanels] Could not load glyph: ${url}`));
      image.src = url;
    });
    glyphImages.set(url, pending);
    return pending;
  }

  function draw(record) {
    const { canvas, context, texture } = record;
    const style = STATE_STYLES[state] ?? STATE_STYLES.idle;
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = '#071019'; context.fillRect(0, 0, canvas.width, canvas.height);
    if (record.glyph) {
      const margin = Math.min(canvas.width, canvas.height) * 0.08;
      const availableWidth = canvas.width - margin * 2, availableHeight = canvas.height - margin * 2;
      const width = positiveNumber(record.glyph.naturalWidth) ?? positiveNumber(record.glyph.width) ?? 1;
      const height = positiveNumber(record.glyph.naturalHeight) ?? positiveNumber(record.glyph.height) ?? 1;
      const scale = Math.min(availableWidth / width, availableHeight / height);
      context.globalAlpha = style.brightness;
      context.drawImage(record.glyph, (canvas.width - width * scale) / 2, (canvas.height - height * scale) / 2,
        width * scale, height * scale);
      context.globalAlpha = 1; texture.needsUpdate = true; return;
    }
    context.globalAlpha = style.brightness; context.fillStyle = style.accent;
    context.textAlign = 'center'; context.textBaseline = 'middle';
    context.font = `600 ${Math.round(Math.min(canvas.width, canvas.height) * 0.46)}px system-ui, sans-serif`;
    context.fillText(record.content, canvas.width / 2, canvas.height / 2);
    context.globalAlpha = 1; texture.needsUpdate = true;
  }

  async function setPrimaryGlyph(url) {
    if (disposed) return false;
    const record = records[0];
    if (url && record.requestedGlyphUrl === url && record.glyph) return true;
    record.requestedGlyphUrl = url ?? null;
    record.content = ''; record.glyph = null; draw(record);
    if (!url) return true;
    const requestedUrl = url;
    const image = await loadGlyph(url);
    if (disposed || record.requestedGlyphUrl !== requestedUrl) return false;
    record.glyph = image; draw(record); return true;
  }

  function setPanelContent(index, content) {
    if (disposed) return false;
    const record = records[index];
    if (!record) throw new RangeError(`[VrAttractorPanels] Panel index ${index} is outside 0..3.`);
    record.content = String(content ?? ''); record.glyph = null; draw(record); return true;
  }
  function setPanelContents(contents) {
    if (!Array.isArray(contents)) throw new TypeError('[VrAttractorPanels] Panel contents must be an array.');
    records.forEach((record, index) => setPanelContent(index, contents[index] ?? ''));
  }
  function setVisualState(value = 'idle') {
    if (disposed) return;
    state = STATE_STYLES[value] ? value : 'idle'; records.forEach(draw);
  }
  function reset() {
    if (disposed) return;
    state = 'idle'; records.forEach((record, index) => { record.content = DEFAULT_CONTENTS[index]; record.glyph = null;
      record.requestedGlyphUrl = null; draw(record); });
  }
  function dispose() {
    if (disposed) return;
    records.forEach((record) => {
      record.panel.material = record.originalMaterial;
      record.texture.dispose(); record.material.dispose();
      record.context.clearRect(0, 0, record.canvas.width, record.canvas.height);
      record.canvas.width = 0; record.canvas.height = 0;
    });
    glyphImages.clear();
    disposed = true;
  }

  reset();
  return { panels: records, setPanelContent, setPanelContents, setPrimaryGlyph, setVisualState, reset, dispose,
    glyphImages };
}
