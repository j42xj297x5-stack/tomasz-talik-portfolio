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

export function calculateSurfaceCanvasSize(surface, maxWidth, maxHeight) {
  surface.geometry.computeBoundingBox();
  const size = surface.geometry.boundingBox.getSize(new THREE.Vector3());
  surface.updateWorldMatrix(true, false);
  const scale = surface.getWorldScale(new THREE.Vector3());
  const width = Math.abs(size.x * scale.x);
  const height = Math.abs(size.y * scale.y);
  if (!(width > 0) || !(height > 0)) return null;
  const fit = Math.min(maxWidth / width, maxHeight / height);
  return {
    width: Math.max(1, Math.round(width * fit)),
    height: Math.max(1, Math.round(height * fit))
  };
}

function isValidSurface(surface) {
  return Boolean(surface?.isMesh && surface.geometry && surface.geometry.getAttribute?.('uv'));
}

export function createVrSpatialPlaque({ scene, parent = scene, surface, settings, canvasFactory }) {
  const usesGltfSurface = isValidSurface(surface);
  if (!usesGltfSurface) {
    console.warn('[Experience VR] A valid PORTAL_CANVAS_SURFACE was not provided. Creating the settings-based fallback plane.');
  }
  const surfaceCanvasSize = usesGltfSurface
    ? calculateSurfaceCanvasSize(surface, settings.canvasWidth, settings.canvasHeight)
    : null;
  if (usesGltfSurface && !surfaceCanvasSize) {
    console.warn('[Experience VR] PORTAL_CANVAS_SURFACE has empty local bounds. Canvas resolution is using the configured limits.');
  }
  const canvas = canvasFactory ? canvasFactory() : document.createElement('canvas');
  canvas.width = surfaceCanvasSize?.width ?? Math.max(1, Math.round(settings.canvasWidth));
  canvas.height = surfaceCanvasSize?.height ?? Math.max(1, Math.round(settings.canvasHeight));
  const context = canvas.getContext('2d');
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  const geometry = usesGltfSurface ? surface.geometry : new THREE.PlaneGeometry(settings.width, settings.height);
  const material = new THREE.MeshBasicMaterial({
    map: texture,
    transparent: true,
    opacity: 0,
    side: THREE.FrontSide,
    depthWrite: false
  });
  const object = usesGltfSurface ? surface : new THREE.Mesh(geometry, material);
  const originalMaterial = usesGltfSurface ? object.material : null;
  const baseScale = object.scale.clone();
  if (!usesGltfSurface) object.name = 'VrPortalCanvas';
  object.material = material;
  object.visible = false;
  if (!usesGltfSurface) parent.add(object);

  let state = 'hidden';
  let elapsed = 0;
  let appearDuration = APPEAR_DURATION_SECONDS;
  let animateScale = true;
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

  function show(content, options = {}) {
    if (disposed || !settings.enabled) return false;
    draw(content);
    if (!usesGltfSurface) {
      object.position.set(settings.offset.x, settings.offset.y, settings.offset.z);
      object.rotation.set(0, 0, 0);
    }
    elapsed = 0;
    appearDuration = Math.max(0, Number.isFinite(options.duration) ? options.duration : APPEAR_DURATION_SECONDS);
    animateScale = options.animateScale !== false;
    state = 'appearing';
    object.visible = true;
    object.scale.copy(baseScale).multiplyScalar(animateScale ? START_SCALE : 1);
    material.opacity = 0;
    if (appearDuration === 0) {
      material.opacity = 1;
      state = 'visible';
    }
    return true;
  }

  function hide() {
    if (disposed) return;
    elapsed = 0;
    state = 'hidden';
    object.visible = false;
    object.scale.copy(baseScale);
    material.opacity = 0;
  }

  function update(delta) {
    if (disposed || state !== 'appearing') return;
    elapsed += Number.isFinite(delta) && delta > 0 ? delta : 0;
    const progress = Math.min(1, elapsed / appearDuration);
    const eased = progress * progress * (3 - 2 * progress);
    object.scale.copy(baseScale).multiplyScalar(animateScale ? START_SCALE + (1 - START_SCALE) * eased : 1);
    material.opacity = eased;
    if (progress === 1) {
      object.scale.copy(baseScale);
      state = 'visible';
    }
  }

  function reset() { hide(); }

  function dispose() {
    if (disposed) return;
    hide();
    disposed = true;
    if (usesGltfSurface) object.material = originalMaterial;
    else {
      object.removeFromParent();
      geometry.dispose();
    }
    material.dispose();
    texture.dispose();
    context.clearRect(0, 0, canvas.width, canvas.height);
    canvas.width = 0;
    canvas.height = 0;
  }

  return { object, get state() { return state; }, show, hide, update, reset, dispose };
}
