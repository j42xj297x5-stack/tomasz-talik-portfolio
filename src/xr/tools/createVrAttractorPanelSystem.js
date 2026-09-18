import * as THREE from '../../vendor/three.js';

export const VR_ATTRACTOR_PANEL_NAMES = Object.freeze(
  Array.from({ length: 4 }, (_, index) => `glyph_panel_0${index + 1}`)
);

const DEFAULT_CONTENTS = Object.freeze(['', '', '', '04']);
const MAX_CANVAS_EDGE = 512;
const PROXIMITY_BUCKETS = 28;
const OBJECTIVE_PANEL_INDEX = 2;
const OBJECTIVE_TEXT_MARGIN_RATIO = 0.09;
const OBJECTIVE_LINE_HEIGHT_RATIO = 1.18;
const OBJECTIVE_MAX_FONT_RATIO = 0.2;
const OBJECTIVE_MIN_FONT_PX = 1;
const STATE_STYLES = Object.freeze({
  idle: { accent: '#8fd8ff', brightness: 1 },
  'target-valid': { accent: '#76ffac', brightness: 1.12 },
  'target-invalid': { accent: '#ff8585', brightness: 1.05 },
  pulling: { accent: '#ffd36b', brightness: 1.14 },
  captured: { accent: '#ffffff', brightness: 1.18 },
  upgrade: { accent: '#d5a0ff', brightness: 1.14 },
  'low-energy': { accent: '#9d7777', brightness: 0.55 }
});

const clamp01 = (value) => Math.min(1, Math.max(0, Number.isFinite(value) ? value : 0));
const hexCss = (value) => `#${Number(value).toString(16).padStart(6, '0')}`;

// This is deliberately semantic: VO belongs to Astro, not to the five fuel elements.
export function resolveAttractorGlyphFamilyColors(config) {
  return Object.freeze({
    RO: hexCss(config.fuel.fire.color), RI: hexCss(config.fuel.fire.color), RA: hexCss(config.fuel.fire.color), RU: hexCss(config.fuel.fire.color),
    KO: hexCss(config.fuel.earth.color), KI: hexCss(config.fuel.earth.color), KA: hexCss(config.fuel.earth.color), KU: hexCss(config.fuel.earth.color),
    LO: hexCss(config.fuel.tree.color), LI: hexCss(config.fuel.tree.color), LA: hexCss(config.fuel.tree.color), LU: hexCss(config.fuel.tree.color),
    SO: hexCss(config.fuel.water.color), SI: hexCss(config.fuel.water.color), SA: hexCss(config.fuel.water.color), SU: hexCss(config.fuel.water.color),
    TO: hexCss(config.fuel.metal.color), TI: hexCss(config.fuel.metal.color), TA: hexCss(config.fuel.metal.color), TU: hexCss(config.fuel.metal.color),
    VO: hexCss(config.energyCell.color), VI: hexCss(config.energyCell.color)
  });
}

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

function wrapMeasuredLine(context, line, maxWidth) {
  if (line === '') return [''];
  const segments = line.match(/\S+\s*|\s+/g) ?? [line];
  const wrapped = [];
  let current = '';

  for (const segment of segments) {
    if (context.measureText(current + segment).width <= maxWidth) {
      current += segment;
      continue;
    }
    if (current) {
      wrapped.push(current.trimEnd());
      current = '';
    }
    if (context.measureText(segment).width <= maxWidth) {
      current = segment.trimStart();
      continue;
    }
    let fragment = '';
    for (const character of segment) {
      if (fragment && context.measureText(fragment + character).width > maxWidth) {
        wrapped.push(fragment);
        fragment = '';
      }
      fragment += character;
    }
    current = fragment;
  }
  if (current || wrapped.length === 0) wrapped.push(current.trimEnd());
  return wrapped;
}

function layoutObjectiveText(context, text, maxWidth, maxHeight, maxFontSize) {
  for (let fontSize = maxFontSize; fontSize >= OBJECTIVE_MIN_FONT_PX; fontSize -= 1) {
    context.font = `600 ${fontSize}px system-ui, sans-serif`;
    const lines = text.split('\n').flatMap((line) => wrapMeasuredLine(context, line, maxWidth));
    const lineHeight = fontSize * OBJECTIVE_LINE_HEIGHT_RATIO;
    if (lines.length * lineHeight <= maxHeight) return { lines, fontSize, lineHeight };
  }
  context.font = `600 ${OBJECTIVE_MIN_FONT_PX}px system-ui, sans-serif`;
  const minimumLines = text.split('\n').flatMap((line) => wrapMeasuredLine(context, line, maxWidth));
  const fittedFontSize = maxHeight / (minimumLines.length * OBJECTIVE_LINE_HEIGHT_RATIO);
  context.font = `600 ${fittedFontSize}px system-ui, sans-serif`;
  const lines = text.split('\n').flatMap((line) => wrapMeasuredLine(context, line, maxWidth));
  const fontSize = Math.min(fittedFontSize, maxHeight / (lines.length * OBJECTIVE_LINE_HEIGHT_RATIO));
  context.font = `600 ${fontSize}px system-ui, sans-serif`;
  return { lines, fontSize, lineHeight: fontSize * OBJECTIVE_LINE_HEIGHT_RATIO };
}

export function createVrAttractorPanelSystem({ panels, canvasFactory, imageFactory, familyColors = {} } = {}) {
  if (!Array.isArray(panels) || panels.length !== VR_ATTRACTOR_PANEL_NAMES.length) {
    throw new Error('[VrAttractorPanels] Exactly four authored glyph panels are required.');
  }
  panels.forEach((panel, index) => {
    if (!panel?.isMesh || !panel.geometry?.getAttribute?.('uv')) {
      throw new Error(`[VrAttractorPanels] ${VR_ATTRACTOR_PANEL_NAMES[index]} must be a mesh with authored UVs.`);
    }
  });

  let state = 'idle';
  let pulling = false;
  let proximityBucket = 0;
  let disposed = false;
  const records = panels.map((panel, index) => {
    const canvas = canvasFactory ? canvasFactory(panel, index, 'display') : document.createElement('canvas');
    const maskCanvas = canvasFactory ? canvasFactory(panel, index, 'mask') : document.createElement('canvas');
    const size = canvasSize(resolveAttractorPanelAspect(panel));
    canvas.width = maskCanvas.width = size.width; canvas.height = maskCanvas.height = size.height;
    const context = canvas.getContext('2d');
    const maskContext = maskCanvas.getContext('2d');
    if (!context || !maskContext) throw new Error(`[VrAttractorPanels] Could not create a 2D context for ${panel.name}.`);
    const texture = new THREE.CanvasTexture(canvas);
    // GLTFLoader uploads authored glTF textures without the legacy WebGL vertical flip.
    texture.flipY = false;
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.minFilter = THREE.LinearFilter; texture.magFilter = THREE.LinearFilter;
    const material = new THREE.MeshBasicMaterial({ map: texture, transparent: true, side: THREE.FrontSide,
      depthTest: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1 });
    const originalMaterial = panel.material;
    panel.material = material;
    return { panel, canvas, context, maskCanvas, maskContext, texture, material, originalMaterial,
      content: DEFAULT_CONTENTS[index], glyph: null, syllable: null, presentationColor: null,
      glyphRequestId: 0, drawCount: 0 };
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
    const { canvas, context, maskCanvas, maskContext, texture } = record;
    const style = STATE_STYLES[state] ?? STATE_STYLES.idle;
    context.clearRect(0, 0, canvas.width, canvas.height);
    if (record.glyph) {
      context.fillStyle = '#071019'; context.fillRect(0, 0, canvas.width, canvas.height);
      const margin = Math.min(canvas.width, canvas.height) * 0.08;
      const availableWidth = canvas.width - margin * 2, availableHeight = canvas.height - margin * 2;
      const width = positiveNumber(record.glyph.naturalWidth) ?? positiveNumber(record.glyph.width) ?? 1;
      const height = positiveNumber(record.glyph.naturalHeight) ?? positiveNumber(record.glyph.height) ?? 1;
      const scale = Math.min(availableWidth / width, availableHeight / height);
      const x = (canvas.width - width * scale) / 2, y = (canvas.height - height * scale) / 2;
      const familyColor = new THREE.Color(
        record.presentationColor ?? familyColors[record.syllable] ?? '#8feaff'
      ).getStyle();
      const p = proximityBucket / PROXIMITY_BUCKETS;
      const whiteMix = pulling ? 0.10 + 0.35 * p : 0;
      const color = new THREE.Color(familyColor).lerp(new THREE.Color('#ffffff'), whiteMix).getStyle();
      const glowStrength = pulling ? 0.15 + 0.65 * p : 0.075;

      // The source SVG is only an alpha mask; its black fill never reaches the display canvas.
      maskContext.clearRect(0, 0, maskCanvas.width, maskCanvas.height);
      maskContext.globalCompositeOperation = 'source-over';
      maskContext.drawImage(record.glyph, x, y, width * scale, height * scale);
      maskContext.globalCompositeOperation = 'source-in';
      maskContext.fillStyle = color; maskContext.fillRect(0, 0, maskCanvas.width, maskCanvas.height);
      maskContext.globalCompositeOperation = 'source-over';

      context.save?.();
      context.globalAlpha = glowStrength;
      context.shadowColor = familyColor;
      context.shadowBlur = (6 + 22 * p) * glowStrength;
      context.drawImage(maskCanvas, 0, 0);
      context.restore?.();
      context.globalAlpha = 1;
      context.drawImage(maskCanvas, 0, 0);
    } else {
      context.fillStyle = '#071019'; context.fillRect(0, 0, canvas.width, canvas.height);
      context.globalAlpha = style.brightness; context.fillStyle = style.accent;
      context.textAlign = 'center'; context.textBaseline = 'middle';
      if (record === records[OBJECTIVE_PANEL_INDEX] && record.content) {
        const margin = Math.min(canvas.width, canvas.height) * OBJECTIVE_TEXT_MARGIN_RATIO;
        const availableWidth = canvas.width - margin * 2;
        const availableHeight = canvas.height - margin * 2;
        const layout = layoutObjectiveText(context, record.content, availableWidth, availableHeight,
          Math.max(OBJECTIVE_MIN_FONT_PX,
            Math.floor(Math.min(canvas.width, canvas.height) * OBJECTIVE_MAX_FONT_RATIO)));
        const top = canvas.height / 2 - ((layout.lines.length - 1) * layout.lineHeight) / 2;
        layout.lines.forEach((line, index) => context.fillText(line, canvas.width / 2,
          top + index * layout.lineHeight, availableWidth));
      } else {
        context.font = `600 ${Math.round(Math.min(canvas.width, canvas.height) * 0.46)}px system-ui, sans-serif`;
        context.fillText(record.content, canvas.width / 2, canvas.height / 2);
      }
      context.globalAlpha = 1;
    }
    record.drawCount += 1; texture.needsUpdate = true;
  }

  async function setPanelGlyph(index, glyph) {
    if (disposed) return false;
    const descriptor = typeof glyph === 'string' ? { url: glyph } : glyph;
    const url = descriptor?.url ?? null;
    const preparedImage = descriptor?.image ?? null;
    const record = records[index];
    if (!record) throw new RangeError(`[VrAttractorPanels] Panel index ${index} is outside 0..3.`);
    if ((preparedImage && record.glyph === preparedImage)
      || (url && record.requestedGlyphUrl === url && record.glyph)) {
      const nextSyllable = descriptor?.syllable ?? null;
      const nextColor = descriptor?.presentationColor ?? null;
      if (nextSyllable !== record.syllable || nextColor !== record.presentationColor) {
        record.syllable = nextSyllable; record.presentationColor = nextColor; draw(record);
      }
      return true;
    }
    const requestId = ++record.glyphRequestId;
    record.requestedGlyphUrl = url; record.syllable = descriptor?.syllable ?? null;
    record.presentationColor = descriptor?.presentationColor ?? null;
    record.content = ''; record.glyph = preparedImage; draw(record);
    if (preparedImage) return true;
    if (!url) return true;
    const image = await loadGlyph(url);
    if (disposed || record.glyphRequestId !== requestId) return false;
    record.glyph = image; draw(record); return true;
  }

  function setPrimaryGlyph(glyph) { return setPanelGlyph(0, glyph); }

  function setPrimaryPresentation({ isPulling = false, targetProximity = 0 } = {}) {
    if (disposed) return false;
    const nextPulling = Boolean(isPulling);
    const nextBucket = nextPulling ? Math.round(clamp01(targetProximity) * PROXIMITY_BUCKETS) : 0;
    if (nextPulling === pulling && nextBucket === proximityBucket) return false;
    pulling = nextPulling; proximityBucket = nextBucket;
    if (records[0].glyph) draw(records[0]);
    return true;
  }
  function setPanelContent(index, content) {
    if (disposed) return false;
    const record = records[index];
    if (!record) throw new RangeError(`[VrAttractorPanels] Panel index ${index} is outside 0..3.`);
    const nextContent = String(content ?? '');
    if (!record.glyph && record.content === nextContent) return false;
    record.glyphRequestId += 1; record.requestedGlyphUrl = null;
    record.content = nextContent; record.glyph = null; draw(record); return true;
  }
  function setObjectiveText(body) { return setPanelContent(OBJECTIVE_PANEL_INDEX, body); }
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
    state = 'idle'; pulling = false; proximityBucket = 0;
    records.forEach((record, index) => { record.content = DEFAULT_CONTENTS[index]; record.glyph = null;
      record.syllable = null; record.presentationColor = null; record.requestedGlyphUrl = null;
      record.glyphRequestId += 1; draw(record); });
  }
  function dispose() {
    if (disposed) return;
    records.forEach((record) => {
      record.panel.material = record.originalMaterial;
      record.texture.dispose(); record.material.dispose();
      record.context.clearRect(0, 0, record.canvas.width, record.canvas.height);
      record.maskContext.clearRect(0, 0, record.maskCanvas.width, record.maskCanvas.height);
      record.canvas.width = record.canvas.height = record.maskCanvas.width = record.maskCanvas.height = 0;
    });
    glyphImages.clear(); disposed = true;
  }

  reset();
  return { panels: records, setPanelContent, setPanelContents, setPanelGlyph, setPrimaryGlyph, setPrimaryPresentation,
    setObjectiveText,
    setVisualState, reset, dispose, glyphImages };
}
