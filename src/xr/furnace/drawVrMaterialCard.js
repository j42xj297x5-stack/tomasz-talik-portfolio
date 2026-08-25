const tintedGlyphs = new WeakMap();

export function resolveMaterialCardLayout({ x, y, width, height, glyphRatio = .58, padding = 18 }) {
  const contentX = x + padding;
  const contentY = y + padding;
  const contentWidth = Math.max(0, width - padding * 2);
  const contentHeight = Math.max(0, height - padding * 2);
  const glyphWidth = contentWidth * glyphRatio;
  return {
    glyph: { x: contentX, y: contentY, width: glyphWidth, height: contentHeight },
    preview: { x: contentX + glyphWidth, y: contentY, width: contentWidth - glyphWidth, height: contentHeight }
  };
}

export function drawMaterialCardVisual(context, options) {
  const layout = resolveMaterialCardLayout(options);
  const { glyphImage, glyphScale = 1, color = '#e8f7ff', drawPreview } = options;

  if (glyphImage?.complete && glyphImage.naturalWidth > 0) {
    const containedScale = Math.min(1, Math.max(0, Number.isFinite(glyphScale) ? glyphScale : 1));
    const ratio = Math.min(layout.glyph.width / glyphImage.naturalWidth, layout.glyph.height / glyphImage.naturalHeight)
      * containedScale;
    const width = glyphImage.naturalWidth * ratio;
    const height = glyphImage.naturalHeight * ratio;
    const cacheKey = `${color}:${Math.ceil(width)}x${Math.ceil(height)}`;
    const imageCache = tintedGlyphs.get(glyphImage) ?? new Map();
    let glyphCanvas = imageCache.get(cacheKey);
    if (!glyphCanvas) {
      glyphCanvas = document.createElement('canvas');
      glyphCanvas.width = Math.max(1, Math.ceil(width));
      glyphCanvas.height = Math.max(1, Math.ceil(height));
      const glyphContext = glyphCanvas.getContext('2d');
      glyphContext.drawImage(glyphImage, 0, 0, glyphCanvas.width, glyphCanvas.height);
      glyphContext.globalCompositeOperation = 'source-in';
      glyphContext.fillStyle = color;
      glyphContext.fillRect(0, 0, glyphCanvas.width, glyphCanvas.height);
      imageCache.set(cacheKey, glyphCanvas);
      tintedGlyphs.set(glyphImage, imageCache);
    }
    context.save();
    context.beginPath();
    context.rect(layout.glyph.x, layout.glyph.y, layout.glyph.width, layout.glyph.height);
    context.clip();
    context.drawImage(glyphCanvas, layout.glyph.x + (layout.glyph.width - width) / 2,
      layout.glyph.y + (layout.glyph.height - height) / 2, width, height);
    context.restore();
  }

  if (drawPreview) {
    context.save();
    context.beginPath();
    context.rect(layout.preview.x, layout.preview.y, layout.preview.width, layout.preview.height);
    context.clip();
    drawPreview({
      cx: layout.preview.x + layout.preview.width / 2,
      cy: layout.preview.y + layout.preview.height / 2,
      scale: Math.min(layout.preview.width, layout.preview.height) * .44
    });
    context.restore();
  }
  return layout;
}
