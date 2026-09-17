import { SMALL_GLYPH_WIREFRAME_DATA } from './smallGlyphWireframeData.js';

const CACHE_SIZE = 256;
const PADDING = 20;
const baseCanvases = new Map();
const tintedCanvases = new Map();

function createBaseCanvas(assetId) {
  const cached = baseCanvases.get(assetId);
  if (cached) return cached;
  const record = SMALL_GLYPH_WIREFRAME_DATA.byAssetId[assetId];
  if (!record) return null;
  const canvas = document.createElement('canvas');
  canvas.width = CACHE_SIZE;
  canvas.height = CACHE_SIZE;
  const context = canvas.getContext('2d');
  const drawableSize = CACHE_SIZE - PADDING * 2;
  context.strokeStyle = '#ffffff';
  context.lineWidth = 1.35;
  context.beginPath();
  record.segments2d.forEach(([ax, ay, bx, by]) => {
    context.moveTo(PADDING + (ax + 1) * drawableSize / 2, PADDING + (ay + 1) * drawableSize / 2);
    context.lineTo(PADDING + (bx + 1) * drawableSize / 2, PADDING + (by + 1) * drawableSize / 2);
  });
  context.stroke();
  baseCanvases.set(assetId, canvas);
  return canvas;
}

function createTintedCanvas(assetId, color) {
  const key = `${assetId}:${color}`;
  const cached = tintedCanvases.get(key);
  if (cached) return cached;
  const base = createBaseCanvas(assetId);
  if (!base) return null;
  const canvas = document.createElement('canvas');
  canvas.width = CACHE_SIZE;
  canvas.height = CACHE_SIZE;
  const context = canvas.getContext('2d');
  context.drawImage(base, 0, 0);
  context.globalCompositeOperation = 'source-in';
  context.fillStyle = color;
  context.fillRect(0, 0, CACHE_SIZE, CACHE_SIZE);
  tintedCanvases.set(key, canvas);
  return canvas;
}

export function drawSmallGlyphWireframe(context, {
  assetId, cx, cy, scale, color = '#e8f7ff', alpha = 1, yaw, pitch = -.24
}) {
  if (yaw !== undefined) {
    const segments = SMALL_GLYPH_WIREFRAME_DATA.byAssetId[assetId]?.segments3d;
    if (!segments?.length) return false;
    const cosY = Math.cos(yaw), sinY = Math.sin(yaw);
    const cosX = Math.cos(pitch), sinX = Math.sin(pitch);
    context.save();
    context.globalAlpha = alpha;
    context.strokeStyle = color;
    context.lineWidth = 1.35;
    context.beginPath();
    segments.forEach(({ ax, ay, az, bx, by, bz }) => {
      const arx = ax * cosY + az * sinY, arz = -ax * sinY + az * cosY;
      const ary = ay * cosX - arz * sinX;
      const aDepth = 1 / Math.max(.65, 1 + (ay * sinX + arz * cosX) * .16);
      const brx = bx * cosY + bz * sinY, brz = -bx * sinY + bz * cosY;
      const bry = by * cosX - brz * sinX;
      const bDepth = 1 / Math.max(.65, 1 + (by * sinX + brz * cosX) * .16);
      context.moveTo(cx + arx * scale * aDepth, cy - ary * scale * aDepth);
      context.lineTo(cx + brx * scale * bDepth, cy - bry * scale * bDepth);
    });
    context.stroke();
    context.restore();
    return true;
  }
  const canvas = createTintedCanvas(assetId, color);
  if (!canvas) return false;
  const size = scale * 2;
  context.save();
  context.globalAlpha = alpha;
  context.drawImage(canvas, cx - scale, cy - scale, size, size);
  context.restore();
  return true;
}
