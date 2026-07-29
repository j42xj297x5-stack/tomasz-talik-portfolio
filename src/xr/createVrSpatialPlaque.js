import * as THREE from '../vendor/three.js';

const APPEAR_DURATION_SECONDS = 0.42;
const START_SCALE = 0.92;

function cleanText(value) {
  return typeof value === 'string' ? value.trim().replace(/\s+/g, ' ') : '';
}

export function wrapCanvasText(context, text, maxWidth, maxLines) {
  const words = cleanText(text).split(' ').filter(Boolean);
  const lineLimit = Math.max(0, Math.floor(maxLines));
  if (!words.length || lineLimit === 0 || maxWidth <= 0) return [];

  const lines = [];
  let current = '';
  let truncated = false;
  for (let index = 0; index < words.length; index += 1) {
    const candidate = current ? `${current} ${words[index]}` : words[index];
    if (!current || context.measureText(candidate).width <= maxWidth) {
      current = candidate;
      continue;
    }
    lines.push(current);
    current = words[index];
    if (lines.length === lineLimit) {
      truncated = true;
      break;
    }
  }
  if (!truncated && current) lines.push(current);
  if (lines.length > lineLimit) {
    lines.length = lineLimit;
    truncated = true;
  }
  if (truncated) {
    let last = lines[lineLimit - 1] || '';
    while (last && context.measureText(`${last}…`).width > maxWidth) {
      last = last.split(' ').slice(0, -1).join(' ');
    }
    lines[lineLimit - 1] = `${last}…`;
  }
  lines.forEach((line, index) => {
    if (context.measureText(line).width <= maxWidth) return;
    let fitted = line;
    while (fitted && context.measureText(`${fitted}…`).width > maxWidth) fitted = fitted.slice(0, -1);
    lines[index] = `${fitted}…`;
  });
  return lines;
}

export function resolveVrPlaqueContent(glyphData) {
  return {
    title: cleanText(glyphData?.title || glyphData?.eyebrow) || 'Brama',
    body: cleanText(glyphData?.leadText || glyphData?.draftText || glyphData?.shortLabel)
      || 'Pierwszy znak otwiera drogę do wnętrza kręgu.'
  };
}

export function createVrSpatialPlaque({ scene, parent = scene, settings, canvasFactory }) {
  const canvas = canvasFactory ? canvasFactory() : document.createElement('canvas');
  canvas.width = settings.canvasWidth;
  canvas.height = settings.canvasHeight;
  const context = canvas.getContext('2d');
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  const geometry = new THREE.PlaneGeometry(settings.width, settings.height);
  const material = new THREE.MeshBasicMaterial({
    map: texture,
    transparent: true,
    opacity: 0,
    side: THREE.FrontSide,
    depthWrite: false
  });
  const object = new THREE.Mesh(geometry, material);
  object.name = 'VrPortalCanvas';
  object.visible = false;
  parent.add(object);

  let state = 'hidden';
  let elapsed = 0;
  let disposed = false;

  function draw(content) {
    const title = cleanText(content?.title);
    const body = cleanText(content?.body);
    const width = canvas.width;
    const height = canvas.height;
    const padding = Math.round(width * 0.075);
    const gradient = context.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, '#111a28');
    gradient.addColorStop(1, '#080d16');
    context.fillStyle = gradient;
    context.fillRect(0, 0, width, height);
    context.strokeStyle = '#71839b';
    context.lineWidth = Math.max(3, Math.round(width * 0.004));
    context.strokeRect(context.lineWidth / 2, context.lineWidth / 2, width - context.lineWidth, height - context.lineWidth);

    context.fillStyle = '#f4f7fb';
    context.textBaseline = 'top';
    context.font = `600 ${settings.titleFontSize}px system-ui, sans-serif`;
    const titleLines = wrapCanvasText(context, title, width - padding * 2, 2);
    let y = padding;
    const titleLineHeight = settings.titleFontSize * 1.12;
    titleLines.forEach((line) => { context.fillText(line, padding, y); y += titleLineHeight; });
    y += Math.round(settings.bodyFontSize * 0.65);
    context.fillStyle = '#d6deea';
    context.font = `400 ${settings.bodyFontSize}px system-ui, sans-serif`;
    const availableLines = Math.max(0, Math.min(
      settings.maxBodyLines,
      Math.floor((height - padding - y) / (settings.bodyFontSize * 1.35))
    ));
    const bodyLines = wrapCanvasText(context, body, width - padding * 2, availableLines);
    const bodyLineHeight = settings.bodyFontSize * 1.35;
    bodyLines.forEach((line) => { context.fillText(line, padding, y); y += bodyLineHeight; });
    texture.needsUpdate = true;
  }

  function show(content) {
    if (disposed || !settings.enabled) return false;
    draw(content);
    object.position.set(settings.offset.x, settings.offset.y, settings.offset.z);
    object.rotation.set(0, 0, 0);
    elapsed = 0;
    state = 'appearing';
    object.visible = true;
    object.scale.setScalar(START_SCALE);
    material.opacity = 0;
    return true;
  }

  function hide() {
    if (disposed) return;
    elapsed = 0;
    state = 'hidden';
    object.visible = false;
    object.scale.setScalar(START_SCALE);
    material.opacity = 0;
  }

  function update(delta) {
    if (disposed || state !== 'appearing') return;
    elapsed += Number.isFinite(delta) && delta > 0 ? delta : 0;
    const progress = Math.min(1, elapsed / APPEAR_DURATION_SECONDS);
    const eased = progress * progress * (3 - 2 * progress);
    object.scale.setScalar(START_SCALE + (1 - START_SCALE) * eased);
    material.opacity = eased;
    if (progress === 1) state = 'visible';
  }

  function reset() { hide(); }

  function dispose() {
    if (disposed) return;
    hide();
    disposed = true;
    object.removeFromParent();
    geometry.dispose();
    material.dispose();
    texture.dispose();
    context.clearRect(0, 0, canvas.width, canvas.height);
    canvas.width = 0;
    canvas.height = 0;
  }

  return { object, get state() { return state; }, show, hide, update, reset, dispose };
}
