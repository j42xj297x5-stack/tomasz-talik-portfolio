import { GLYPH_PANEL_BACKGROUNDS } from '../assets/assetManifest.js';
import { publicPath } from '../utils/publicPath.js';

const createMobileFrameAsset = (filename, className) => {
  const logicalPath = `svg/${filename}`;
  return {
    filename,
    logicalPath: `/${logicalPath}`,
    url: publicPath(logicalPath),
    className
  };
};

const MOBILE_FRAME_ASSETS = {
  lu: createMobileFrameAsset('portfolio_frame_mobile_corner_lu.svg', 'frame-corner frame-corner-lu'),
  ru: createMobileFrameAsset('portfolio_frame_mobile_corner_ru.svg', 'frame-corner frame-corner-ru'),
  ld: createMobileFrameAsset('portfolio_frame_mobile_corner_ld.svg', 'frame-corner frame-corner-ld'),
  rd: createMobileFrameAsset('portfolio_frame_mobile_corner_rd.svg', 'frame-corner frame-corner-rd'),
  u: createMobileFrameAsset('portfolio_frame_mobile_line_u.svg', 'frame-line frame-line-u'),
  d: createMobileFrameAsset('portfolio_frame_mobile_line_d.svg', 'frame-line frame-line-d'),
  l: createMobileFrameAsset('portfolio_frame_mobile_line_l.svg', 'frame-line frame-line-l'),
  r: createMobileFrameAsset('portfolio_frame_mobile_line_r.svg', 'frame-line frame-line-r')
};

const SVG_VISIBLE_ELEMENTS = 'path, rect, circle, ellipse, polygon, polyline, line, g, use';
const SVG_RENDERED_SHAPES = ['path', 'rect', 'circle', 'ellipse', 'polygon', 'polyline', 'line'];
const SVG_VISIBLE_GEOMETRY_SELECTOR = 'path, rect, circle, ellipse, polygon, polyline, line, use';
const LINE_FRAME_CLASS_PATTERN = /(?:^|\s)frame-line(?:\s|$)/;
const MOBILE_FRAME_COLOR_VALUE = 'var(--mobile-frame-color, rgba(255,255,255,0.92))';
const BLACK_COLOR_PATTERN = /(?:^|[\s:;,(])(?:#(?:000|000000)\b|black\b|rgb\(\s*0\s*,\s*0\s*,\s*0\s*\)|rgba\(\s*0\s*,\s*0\s*,\s*0\s*,\s*(?:0?\.\d+|1(?:\.0+)?)\s*\))/i;
const PIVOT_REFERENCE_PATTERN = /(?:pivot|reference|guide)/i;
const MOBILE_FRAME_PIECE_KEYS = ['lu', 'ru', 'ld', 'rd', 'u', 'd', 'l', 'r'];
const MOBILE_FRAME_CORNER_KEYS = ['lu', 'ru', 'ld', 'rd'];
const MOBILE_FRAME_DEBUG_PARAM = 'debugFramePieces';
const MOBILE_FRAME_LINE_OVERLAP_PROPERTY = '--frame-line-overlap';
const MOBILE_FRAME_DEBUG_COLORS = {
  lu: 'red',
  ru: 'orange',
  ld: 'lime',
  rd: 'cyan',
  u: 'magenta',
  d: 'yellow',
  l: 'blue',
  r: 'green'
};

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function average(...values) {
  return values.reduce((total, value) => total + value, 0) / values.length;
}

function parseCssPixelValue(value, fallback = 0) {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function getRectRight(rect) {
  return rect.x + rect.width;
}

function getRectBottom(rect) {
  return rect.y + rect.height;
}

function rectsOverlap(a, b, epsilon = 0.5) {
  return a.x < b.x + b.width - epsilon
    && a.x + a.width > b.x + epsilon
    && a.y < b.y + b.height - epsilon
    && a.y + a.height > b.y + epsilon;
}

function isFrameDebugEnabled() {
  return new URLSearchParams(window.location.search).get(MOBILE_FRAME_DEBUG_PARAM) === '1';
}

function isLineFramePiece(pieceId) {
  return ['u', 'd', 'l', 'r'].includes(pieceId);
}

function shouldLogFrameFetches() {
  return import.meta.env.DEV || isFrameDebugEnabled();
}

function shouldBypassLineClipMasksForDebug() {
  const params = new URLSearchParams(window.location.search);
  return params.get(MOBILE_FRAME_DEBUG_PARAM) === '1' && params.get('debugFrameBypassLineClips') === '1';
}

function getAssetFilename(url) {
  const [path] = url.split('?');
  return path.split('/').pop() || url;
}

function getSvgReferenceAttributes(svg) {
  const references = [];

  svg.querySelectorAll('*').forEach((element) => {
    [...element.attributes].forEach((attribute) => {
      if (!attribute.value.includes('#') && !attribute.value.includes('url(')) return;
      references.push({
        tag: element.tagName.toLowerCase(),
        id: element.id || null,
        name: attribute.name,
        value: attribute.value
      });
    });
  });

  return references;
}

function detectSvgFeatureUsage(svg) {
  const allAttributes = [...svg.querySelectorAll('*')].flatMap((element) => [...element.attributes]);

  return {
    defs: Boolean(svg.querySelector('defs')),
    clipPath: Boolean(svg.querySelector('clipPath, [clip-path]')),
    mask: Boolean(svg.querySelector('mask, [mask]')),
    use: Boolean(svg.querySelector('use')),
    href: allAttributes.some((attribute) => attribute.name === 'href'),
    xlinkHref: allAttributes.some((attribute) => attribute.name === 'xlink:href'),
    urlReference: allAttributes.some((attribute) => /url\(\s*#/.test(attribute.value))
  };
}

function getElementDescriptor(element) {
  return [
    element.id,
    element.getAttribute('name'),
    element.getAttribute('inkscape:label'),
    element.getAttribute('aria-label'),
    element.getAttribute('class')
  ].filter(Boolean).join(' ');
}

function styleContainsZeroOpacity(styleText) {
  return /(?:^|;)\s*opacity\s*:\s*(?:0|0\.0+)\s*(?:!important)?\s*(?:;|$)/i.test(styleText ?? '');
}

function isInvisiblePivotElement(element) {
  const descriptor = getElementDescriptor(element);
  const opacity = element.getAttribute('opacity')?.trim() ?? '';
  const styleText = element.getAttribute('style') ?? '';

  return PIVOT_REFERENCE_PATTERN.test(descriptor)
    || opacity === '0'
    || opacity === '0.0'
    || styleContainsZeroOpacity(styleText);
}

function stripPaintDeclarations(element) {
  element.removeAttribute('fill');
  element.removeAttribute('stroke');
  element.removeAttribute('fill-opacity');
  element.removeAttribute('stroke-opacity');
  element.removeAttribute('paint-order');
  element.style.removeProperty('fill');
  element.style.removeProperty('stroke');
  element.style.removeProperty('fill-opacity');
  element.style.removeProperty('stroke-opacity');
  element.style.removeProperty('paint-order');
}

function getPaintValue(element, property) {
  const attributeValue = element.getAttribute(property);
  if (attributeValue) return attributeValue.trim();

  const inlineValue = element.style.getPropertyValue(property);
  if (inlineValue) return inlineValue.trim();

  const styleText = element.getAttribute('style') ?? '';
  const match = styleText.match(new RegExp(`(?:^|;)\\s*${property}\\s*:\\s*([^;]+)`, 'i'));
  return match?.[1]?.trim() ?? '';
}

function hasVisiblePaintValue(value) {
  return Boolean(value) && !/^(?:none|transparent)$/i.test(value);
}

function hasUsableStrokeWidth(element) {
  const width = element.getAttribute('stroke-width')
    ?? element.style.getPropertyValue('stroke-width')
    ?? '';

  if (!width) return true;

  const numericWidth = Number.parseFloat(width);
  return Number.isNaN(numericWidth) || numericWidth > 0;
}

function detectPaintMode(element, preferStroke = false) {
  const fill = getPaintValue(element, 'fill');
  const stroke = getPaintValue(element, 'stroke');
  const hasFill = hasVisiblePaintValue(fill);
  const hasStroke = hasVisiblePaintValue(stroke) && hasUsableStrokeWidth(element);

  if (preferStroke && hasStroke && !hasFill) return 'stroke';
  if (hasFill) return 'fill';
  if (hasStroke) return 'stroke';
  return preferStroke && element.tagName.toLowerCase() === 'line' ? 'stroke' : 'fill';
}

function forcePivotReference(element) {
  element.classList.add('frame-pivot-reference');
  element.dataset.framePivot = 'true';
  element.setAttribute('opacity', '0');
  element.setAttribute('visibility', 'hidden');
  element.setAttribute('pointer-events', 'none');
  element.setAttribute('fill', 'none');
  element.setAttribute('stroke', 'none');
  element.style.setProperty('opacity', '0', 'important');
  element.style.setProperty('visibility', 'hidden', 'important');
  element.style.setProperty('pointer-events', 'none', 'important');
  element.style.setProperty('fill', 'none', 'important');
  element.style.setProperty('stroke', 'none', 'important');
}

function forceVisiblePaint(element, paintMode = 'fill') {
  stripPaintDeclarations(element);
  element.dataset.mobileFramePaintMode = paintMode;
  element.style.setProperty('color', MOBILE_FRAME_COLOR_VALUE, 'important');

  if (paintMode === 'stroke') {
    if (!hasUsableStrokeWidth(element)) {
      element.removeAttribute('stroke-width');
      element.style.removeProperty('stroke-width');
    }

    element.setAttribute('fill', 'none');
    element.setAttribute('stroke', 'currentColor');
    element.style.setProperty('fill', 'none', 'important');
    element.style.setProperty('stroke', 'currentColor', 'important');
    return;
  }

  element.setAttribute('fill', 'currentColor');
  element.setAttribute('stroke', 'none');
  element.style.setProperty('fill', 'currentColor', 'important');
  element.style.setProperty('stroke', 'none', 'important');
}

function findRemainingBlackPaint(svg) {
  return [...svg.querySelectorAll(SVG_VISIBLE_ELEMENTS)]
    .filter((element) => !element.dataset.framePivot)
    .filter((element) => {
      const values = [
        element.getAttribute('fill'),
        element.getAttribute('stroke'),
        element.getAttribute('style')
      ];
      return values.some((value) => BLACK_COLOR_PATTERN.test(value ?? ''));
    })
    .map((element) => `${element.tagName.toLowerCase()}${element.id ? `#${element.id}` : ''}`);
}

function getStyleSnapshot(element) {
  if (!element) return null;

  const styles = getComputedStyle(element);
  return {
    display: styles.display,
    visibility: styles.visibility,
    opacity: styles.opacity,
    zIndex: styles.zIndex,
    position: styles.position,
    color: styles.color,
    fill: styles.fill,
    stroke: styles.stroke,
    filter: styles.filter,
    mixBlendMode: styles.mixBlendMode,
    pointerEvents: styles.pointerEvents
  };
}

function getElementLayerSnapshot(element) {
  if (!element) return null;

  const rect = element.getBoundingClientRect();
  const centerX = rect.left + rect.width / 2;
  const centerY = rect.top + rect.height / 2;
  const elementFromPoint = document.elementFromPoint(centerX, centerY);

  return {
    rect: {
      x: rect.x,
      y: rect.y,
      width: rect.width,
      height: rect.height
    },
    centerElement: elementFromPoint
      ? `${elementFromPoint.tagName.toLowerCase()}${elementFromPoint.id ? `#${elementFromPoint.id}` : ''}${elementFromPoint.className ? `.${String(elementFromPoint.className).trim().replace(/\s+/g, '.')}` : ''}`
      : null,
    containsCenterElement: elementFromPoint ? element.contains(elementFromPoint) : false
  };
}

function getFirstVisibleSvgShape(svg) {
  const visibleShapeSelector = SVG_RENDERED_SHAPES
    .map((shape) => `${shape}:not([data-frame-pivot="true"]):not(.frame-pivot-reference)`)
    .join(', ');

  return [...svg.querySelectorAll(visibleShapeSelector)].find((shape) => {
    const styles = getComputedStyle(shape);
    const rect = shape.getBoundingClientRect();
    return styles.display !== 'none'
      && styles.visibility !== 'hidden'
      && Number(styles.opacity) > 0
      && rect.width > 0
      && rect.height > 0;
  }) ?? null;
}

function getSvgViewBox(svg) {
  const viewBox = svg.viewBox?.baseVal;
  if (viewBox && viewBox.width > 0 && viewBox.height > 0) {
    return { x: viewBox.x, y: viewBox.y, width: viewBox.width, height: viewBox.height };
  }

  const parts = (svg.getAttribute('viewBox') ?? '').trim().split(/[\s,]+/).map(Number);
  if (parts.length === 4 && parts.every((part) => Number.isFinite(part)) && parts[2] > 0 && parts[3] > 0) {
    return { x: parts[0], y: parts[1], width: parts[2], height: parts[3] };
  }

  return { x: 0, y: 0, width: 1, height: 1 };
}

function transformSvgPoint(svg, element, x, y) {
  const point = svg.createSVGPoint();
  point.x = x;
  point.y = y;

  let matrix = svg.createSVGMatrix();
  let current = element;

  while (current && current !== svg) {
    const localMatrix = current.transform?.baseVal?.consolidate()?.matrix;
    if (localMatrix) {
      matrix = localMatrix.multiply(matrix);
    }
    current = current.parentNode;
  }

  const transformed = point.matrixTransform(matrix);
  return { x: transformed.x, y: transformed.y };
}

function detectSvgPivots(svg) {
  return [...svg.querySelectorAll('circle.frame-pivot-reference, circle[data-frame-pivot="true"]')].map((circle) => {
    const cx = Number.parseFloat(circle.getAttribute('cx') ?? '0');
    const cy = Number.parseFloat(circle.getAttribute('cy') ?? '0');
    const center = transformSvgPoint(svg, circle, cx, cy);

    return {
      id: circle.id || null,
      x: center.x,
      y: center.y,
      rawX: cx,
      rawY: cy
    };
  });
}

function choosePivot(pivots, role, viewBox) {
  if (!pivots.length) {
    return { id: null, x: viewBox.width / 2, y: viewBox.height / 2, fallback: true, role };
  }

  // Pivot SVG circles do not currently expose semantic role IDs beyond the asset name.
  // Infer the intended connection point from its position: top/bottom use the closest
  // Y axis, left/right use the closest X axis. Assets with a single pivot naturally
  // choose that pivot for every role.
  const target = {
    top: { axis: 'y', value: viewBox.y },
    bottom: { axis: 'y', value: viewBox.y + viewBox.height },
    left: { axis: 'x', value: viewBox.x },
    right: { axis: 'x', value: viewBox.x + viewBox.width },
    center: { axis: 'x', value: viewBox.x + viewBox.width / 2 }
  }[role] ?? { axis: 'x', value: viewBox.x + viewBox.width / 2 };

  const chosen = pivots.reduce((best, pivot) => {
    const distance = Math.abs(pivot[target.axis] - target.value);
    const bestDistance = Math.abs(best[target.axis] - target.value);
    return distance < bestDistance ? pivot : best;
  }, pivots[0]);

  return { ...chosen, role };
}

function getMobileFrameMetrics(frameElement) {
  return Object.fromEntries(MOBILE_FRAME_PIECE_KEYS.map((key) => {
    const wrapper = frameElement.querySelector(`[data-mobile-frame-piece="${key}"]`);
    const svg = wrapper?.querySelector('svg') ?? null;
    const viewBox = svg ? getSvgViewBox(svg) : { x: 0, y: 0, width: 1, height: 1 };
    const pivots = svg ? detectSvgPivots(svg) : [];

    return [key, { key, wrapper, svg, viewBox, pivots }];
  }));
}

function setFramePieceRect(piece, rect) {
  const { wrapper } = piece;
  if (!wrapper) return;

  wrapper.style.left = `${rect.x}px`;
  wrapper.style.top = `${rect.y}px`;
  wrapper.style.width = `${Math.max(0, rect.width)}px`;
  wrapper.style.height = `${Math.max(0, rect.height)}px`;
  wrapper.style.right = 'auto';
  wrapper.style.bottom = 'auto';
  wrapper.style.transform = 'none';
}

function getRectSnapshot(element, frameRect) {
  if (!element) return null;
  const rect = element.getBoundingClientRect();
  return {
    x: rect.x,
    y: rect.y,
    width: rect.width,
    height: rect.height,
    insideFrame: rect.width > 0
      && rect.height > 0
      && rect.left >= frameRect.left - 1
      && rect.top >= frameRect.top - 1
      && rect.right <= frameRect.right + 1
      && rect.bottom <= frameRect.bottom + 1
  };
}

function getSvgBBoxSnapshot(element) {
  if (!element || typeof element.getBBox !== 'function') return null;

  try {
    const bbox = element.getBBox();
    return { x: bbox.x, y: bbox.y, width: bbox.width, height: bbox.height };
  } catch (error) {
    return { error: error instanceof Error ? error.message : String(error) };
  }
}

function isGeometryInsideWrapper(shape, wrapper) {
  if (!shape || !wrapper) return false;

  const shapeRect = shape.getBoundingClientRect();
  const wrapperRect = wrapper.getBoundingClientRect();
  return shapeRect.width > 0
    && shapeRect.height > 0
    && shapeRect.left >= wrapperRect.left - 1
    && shapeRect.top >= wrapperRect.top - 1
    && shapeRect.right <= wrapperRect.right + 1
    && shapeRect.bottom <= wrapperRect.bottom + 1;
}

function getPaintSnapshot(piece) {
  const shape = piece.svg ? getFirstVisibleSvgShape(piece.svg) : null;
  if (!shape) return null;
  const styles = getComputedStyle(shape);
  const rect = shape.getBoundingClientRect();
  return {
    selector: `${shape.tagName.toLowerCase()}${shape.id ? `#${shape.id}` : ''}`,
    tag: shape.tagName.toLowerCase(),
    rect: { x: rect.x, y: rect.y, width: rect.width, height: rect.height },
    bbox: getSvgBBoxSnapshot(shape),
    insideWrapper: isGeometryInsideWrapper(shape, piece.wrapper),
    fill: styles.fill,
    stroke: styles.stroke,
    color: styles.color,
    opacity: styles.opacity,
    visibility: styles.visibility,
    display: styles.display
  };
}

function applyMobileFrameLayout(frameElement) {
  const frameRect = frameElement.getBoundingClientRect();
  if (frameRect.width <= 0 || frameRect.height <= 0) return;

  const pieces = getMobileFrameMetrics(frameElement);
  if (MOBILE_FRAME_PIECE_KEYS.some((key) => !pieces[key].svg || !pieces[key].wrapper)) return;

  const frameStyles = getComputedStyle(frameElement);
  const requestedLineOverlap = parseCssPixelValue(frameStyles.getPropertyValue(MOBILE_FRAME_LINE_OVERLAP_PROPERTY), 0);
  const lineOverlap = Math.max(0, requestedLineOverlap);
  const maxCornerViewBoxWidth = Math.max(...MOBILE_FRAME_CORNER_KEYS.map((key) => pieces[key].viewBox.width));
  const desiredCornerWidth = clamp(frameRect.width * 0.22, Math.min(72, frameRect.width * 0.25), frameRect.width * 0.25);
  const cornerScale = desiredCornerWidth / maxCornerViewBoxWidth;
  const cornerRects = {
    lu: { x: 0, y: 0, width: pieces.lu.viewBox.width * cornerScale, height: pieces.lu.viewBox.height * cornerScale },
    ru: { x: frameRect.width - pieces.ru.viewBox.width * cornerScale, y: 0, width: pieces.ru.viewBox.width * cornerScale, height: pieces.ru.viewBox.height * cornerScale },
    ld: { x: 0, y: frameRect.height - pieces.ld.viewBox.height * cornerScale, width: pieces.ld.viewBox.width * cornerScale, height: pieces.ld.viewBox.height * cornerScale },
    rd: { x: frameRect.width - pieces.rd.viewBox.width * cornerScale, y: frameRect.height - pieces.rd.viewBox.height * cornerScale, width: pieces.rd.viewBox.width * cornerScale, height: pieces.rd.viewBox.height * cornerScale }
  };

  Object.entries(cornerRects).forEach(([key, rect]) => setFramePieceRect(pieces[key], rect));

  const chosenPivots = {
    luTop: choosePivot(pieces.lu.pivots, 'top', pieces.lu.viewBox),
    luLeft: choosePivot(pieces.lu.pivots, 'left', pieces.lu.viewBox),
    ruTop: choosePivot(pieces.ru.pivots, 'top', pieces.ru.viewBox),
    ruRight: choosePivot(pieces.ru.pivots, 'right', pieces.ru.viewBox),
    ldBottom: choosePivot(pieces.ld.pivots, 'bottom', pieces.ld.viewBox),
    ldLeft: choosePivot(pieces.ld.pivots, 'left', pieces.ld.viewBox),
    rdBottom: choosePivot(pieces.rd.pivots, 'bottom', pieces.rd.viewBox),
    rdRight: choosePivot(pieces.rd.pivots, 'right', pieces.rd.viewBox),
    lineU: choosePivot(pieces.u.pivots, 'top', pieces.u.viewBox),
    lineD: choosePivot(pieces.d.pivots, 'bottom', pieces.d.viewBox),
    lineL: choosePivot(pieces.l.pivots, 'left', pieces.l.viewBox),
    lineR: choosePivot(pieces.r.pivots, 'right', pieces.r.viewBox)
  };

  const edgeGaps = {
    u: { start: getRectRight(cornerRects.lu), end: cornerRects.ru.x },
    d: { start: getRectRight(cornerRects.ld), end: cornerRects.rd.x },
    l: { start: getRectBottom(cornerRects.lu), end: cornerRects.ld.y },
    r: { start: getRectBottom(cornerRects.ru), end: cornerRects.rd.y }
  };

  const axes = {
    topY: average(
      cornerRects.lu.y + chosenPivots.luTop.y * cornerScale,
      cornerRects.ru.y + chosenPivots.ruTop.y * cornerScale
    ),
    bottomY: average(
      cornerRects.ld.y + chosenPivots.ldBottom.y * cornerScale,
      cornerRects.rd.y + chosenPivots.rdBottom.y * cornerScale
    ),
    leftX: average(
      cornerRects.lu.x + chosenPivots.luLeft.x * cornerScale,
      cornerRects.ld.x + chosenPivots.ldLeft.x * cornerScale
    ),
    rightX: average(
      cornerRects.ru.x + chosenPivots.ruRight.x * cornerScale,
      cornerRects.rd.x + chosenPivots.rdRight.x * cornerScale
    )
  };

  const lineScales = {
    u: { x: Math.max(0, edgeGaps.u.end - edgeGaps.u.start + lineOverlap * 2) / pieces.u.viewBox.width, y: cornerScale },
    d: { x: Math.max(0, edgeGaps.d.end - edgeGaps.d.start + lineOverlap * 2) / pieces.d.viewBox.width, y: cornerScale },
    l: { x: cornerScale, y: Math.max(0, edgeGaps.l.end - edgeGaps.l.start + lineOverlap * 2) / pieces.l.viewBox.height },
    r: { x: cornerScale, y: Math.max(0, edgeGaps.r.end - edgeGaps.r.start + lineOverlap * 2) / pieces.r.viewBox.height }
  };

  const unclampedLineRects = {
    u: {
      x: edgeGaps.u.start - lineOverlap,
      y: axes.topY - chosenPivots.lineU.y * lineScales.u.y,
      width: Math.max(0, edgeGaps.u.end - edgeGaps.u.start + lineOverlap * 2),
      height: pieces.u.viewBox.height * lineScales.u.y
    },
    d: {
      x: edgeGaps.d.start - lineOverlap,
      y: axes.bottomY - chosenPivots.lineD.y * lineScales.d.y,
      width: Math.max(0, edgeGaps.d.end - edgeGaps.d.start + lineOverlap * 2),
      height: pieces.d.viewBox.height * lineScales.d.y
    },
    l: {
      x: axes.leftX - chosenPivots.lineL.x * lineScales.l.x,
      y: edgeGaps.l.start - lineOverlap,
      width: pieces.l.viewBox.width * lineScales.l.x,
      height: Math.max(0, edgeGaps.l.end - edgeGaps.l.start + lineOverlap * 2)
    },
    r: {
      x: axes.rightX - chosenPivots.lineR.x * lineScales.r.x,
      y: edgeGaps.r.start - lineOverlap,
      width: pieces.r.viewBox.width * lineScales.r.x,
      height: Math.max(0, edgeGaps.r.end - edgeGaps.r.start + lineOverlap * 2)
    }
  };

  const lineRects = {
    u: {
      ...unclampedLineRects.u,
      y: clamp(unclampedLineRects.u.y, 0, Math.max(0, Math.min(getRectBottom(cornerRects.lu), getRectBottom(cornerRects.ru)) - unclampedLineRects.u.height))
    },
    d: {
      ...unclampedLineRects.d,
      y: clamp(unclampedLineRects.d.y, Math.max(cornerRects.ld.y, cornerRects.rd.y), Math.max(0, frameRect.height - unclampedLineRects.d.height))
    },
    l: {
      ...unclampedLineRects.l,
      x: clamp(unclampedLineRects.l.x, 0, Math.max(0, Math.min(getRectRight(cornerRects.lu), getRectRight(cornerRects.ld)) - unclampedLineRects.l.width))
    },
    r: {
      ...unclampedLineRects.r,
      x: clamp(unclampedLineRects.r.x, Math.max(cornerRects.ru.x, cornerRects.rd.x), Math.max(0, frameRect.width - unclampedLineRects.r.width))
    }
  };

  Object.entries(lineRects).forEach(([key, rect]) => setFramePieceRect(pieces[key], rect));

  requestAnimationFrame(() => {
    const updatedFrameRect = frameElement.getBoundingClientRect();
    const rects = Object.fromEntries(MOBILE_FRAME_PIECE_KEYS.map((key) => {
      const wrapperSnapshot = getRectSnapshot(pieces[key].wrapper, updatedFrameRect);
      const svgSnapshot = getRectSnapshot(pieces[key].svg, updatedFrameRect);
      const localWrapperRect = key in cornerRects ? cornerRects[key] : lineRects[key];
      const overlapsCorners = MOBILE_FRAME_CORNER_KEYS
        .filter((cornerKey) => cornerKey !== key)
        .filter((cornerKey) => rectsOverlap(localWrapperRect, cornerRects[cornerKey]));
      const firstPaintedShape = getPaintSnapshot(pieces[key]);

      return [
        key,
        {
          wrapper: wrapperSnapshot,
          wrapperLayout: localWrapperRect,
          overlapsCornerWrappers: overlapsCorners,
          injectedSvgRect: svgSnapshot,
          preserveAspectRatio: pieces[key].svg.getAttribute('preserveAspectRatio'),
          wrapperStyles: getStyleSnapshot(pieces[key].wrapper),
          svgStyles: getStyleSnapshot(pieces[key].svg),
          firstVisibleNonPivotGeometry: firstPaintedShape,
          visibleGeometryInsideWrapper: firstPaintedShape?.insideWrapper ?? false
        }
      ];
    }));

    console.debug('[overlay][frame-layout]', {
      mode: 'edge-to-edge',
      frameRect: { width: frameRect.width, height: frameRect.height },
      viewBoxes: Object.fromEntries(MOBILE_FRAME_PIECE_KEYS.map((key) => [key, pieces[key].viewBox])),
      detectedPivots: Object.fromEntries(MOBILE_FRAME_PIECE_KEYS.map((key) => [key, pieces[key].pivots])),
      chosenPivots,
      desiredCornerWidth,
      cornerScale,
      cornerWidthFormula: 'desiredCornerWidth = clamp(frameWidth * 0.22, min(72px, frameWidth * 0.25), frameWidth * 0.25); cornerScale = desiredCornerWidth / max(corner viewBox widths)',
      lineOverlap,
      cornerRendered: cornerRects,
      edgeGaps,
      pivotAxisTargets: axes,
      lineScales,
      unclampedLineRendered: unclampedLineRects,
      lineRendered: lineRects,
      lineDiagnostics: {
        u: { expectedEdgeGap: edgeGaps.u.end - edgeGaps.u.start, actualWrapperWidth: lineRects.u.width, actualWrapperHeight: lineRects.u.height, lineScaleX: lineScales.u.x, lineScaleY: lineScales.u.y, pivotAxisTarget: axes.topY, finalTop: lineRects.u.y, finalLeft: lineRects.u.x, graphicVisible: Boolean(rects.u.firstVisibleNonPivotGeometry) },
        d: { expectedEdgeGap: edgeGaps.d.end - edgeGaps.d.start, actualWrapperWidth: lineRects.d.width, actualWrapperHeight: lineRects.d.height, lineScaleX: lineScales.d.x, lineScaleY: lineScales.d.y, pivotAxisTarget: axes.bottomY, finalTop: lineRects.d.y, finalLeft: lineRects.d.x, graphicVisible: Boolean(rects.d.firstVisibleNonPivotGeometry) },
        l: { expectedEdgeGap: edgeGaps.l.end - edgeGaps.l.start, actualWrapperWidth: lineRects.l.width, actualWrapperHeight: lineRects.l.height, lineScaleX: lineScales.l.x, lineScaleY: lineScales.l.y, pivotAxisTarget: axes.leftX, finalTop: lineRects.l.y, finalLeft: lineRects.l.x, graphicVisible: Boolean(rects.l.firstVisibleNonPivotGeometry) },
        r: { expectedEdgeGap: edgeGaps.r.end - edgeGaps.r.start, actualWrapperWidth: lineRects.r.width, actualWrapperHeight: lineRects.r.height, lineScaleX: lineScales.r.x, lineScaleY: lineScales.r.y, pivotAxisTarget: axes.rightX, finalTop: lineRects.r.y, finalLeft: lineRects.r.x, graphicVisible: Boolean(rects.r.firstVisibleNonPivotGeometry) }
      },
      pieces: rects
    });
  });
}

function createMobileFrameLayoutController(frameElement, panelElement) {
  if (!frameElement) return { schedule: () => {}, destroy: () => {} };

  const debugEnabled = isFrameDebugEnabled();
  frameElement.classList.toggle('mobile-svg-frame--debug', debugEnabled);
  panelElement?.classList.toggle('overlay__panel--debug-frame-pieces', debugEnabled);
  Object.entries(MOBILE_FRAME_DEBUG_COLORS).forEach(([key, color]) => {
    frameElement.querySelector(`[data-mobile-frame-piece="${key}"]`)?.style.setProperty('--mobile-frame-debug-color', color);
  });

  let frame = 0;
  const schedule = () => {
    if (frame) return;
    frame = requestAnimationFrame(() => {
      frame = 0;
      applyMobileFrameLayout(frameElement);
    });
  };

  const resizeObserver = 'ResizeObserver' in window ? new ResizeObserver(schedule) : null;
  resizeObserver?.observe(frameElement);
  if (panelElement) resizeObserver?.observe(panelElement);

  window.addEventListener('resize', schedule);
  window.addEventListener('orientationchange', schedule);

  return {
    schedule,
    destroy() {
      if (frame) cancelAnimationFrame(frame);
      resizeObserver?.disconnect();
      window.removeEventListener('resize', schedule);
      window.removeEventListener('orientationchange', schedule);
    }
  };
}

function describeSvgDiagnostics(svg) {
  const firstVisibleShape = getFirstVisibleSvgShape(svg);
  const shapeStyles = firstVisibleShape ? getComputedStyle(firstVisibleShape) : null;

  return {
    piece: svg.closest('[data-mobile-frame-piece]')?.dataset.mobileFramePiece ?? null,
    classes: [...svg.classList],
    computed: getStyleSnapshot(svg),
    layer: getElementLayerSnapshot(svg),
    firstVisibleShape: firstVisibleShape
      ? {
          selector: `${firstVisibleShape.tagName.toLowerCase()}${firstVisibleShape.id ? `#${firstVisibleShape.id}` : ''}`,
          color: shapeStyles.color,
          fill: shapeStyles.fill,
          stroke: shapeStyles.stroke,
          opacity: shapeStyles.opacity,
          visibility: shapeStyles.visibility,
          display: shapeStyles.display
        }
      : null
  };
}

function logOverlayFrameDiagnostics(root, panelEl, nodeId) {
  if (!import.meta.env.DEV) return;

  requestAnimationFrame(() => {
    const panelStyles = getComputedStyle(panelEl);
    const mobileFrameEl = panelEl.querySelector('.mobile-svg-frame');
    const mobileSvgs = [...panelEl.querySelectorAll('.mobile-svg-frame svg')];

    console.debug('[overlay][frame-diagnostics]', {
      nodeId,
      activePanelGateId: panelEl.dataset.gateId ?? null,
      isAiGuidePanel: panelEl.dataset.gateId === 'ai-guide',
      media: {
        viewport: { width: window.innerWidth, height: window.innerHeight },
        maxWidth768: window.matchMedia('(max-width: 768px)').matches,
        maxWidth640: window.matchMedia('(max-width: 640px)').matches,
        pointerCoarse: window.matchMedia('(pointer: coarse)').matches
      },
      overlayHidden: root.hidden,
      panel: {
        mobileFrameColorProperty: panelStyles.getPropertyValue('--mobile-frame-color').trim(),
        computed: getStyleSnapshot(panelEl),
        layer: getElementLayerSnapshot(panelEl)
      },
      mobileFrame: {
        computed: getStyleSnapshot(mobileFrameEl),
        layer: getElementLayerSnapshot(mobileFrameEl)
      },
      injectedSvgs: mobileSvgs.map(describeSvgDiagnostics)
    });
  });
}

function logMobileFrameDiagnostics(assetFilename, svg, normalizedCount, pivotCount, remainingBlackPaint) {
  if (!import.meta.env.DEV) return;

  requestAnimationFrame(() => {
    const visibleShapeSelector = SVG_RENDERED_SHAPES
      .map((shape) => `${shape}:not([data-frame-pivot="true"]):not(.frame-pivot-reference)`)
      .join(', ');
    const firstVisibleShape = svg.querySelector(visibleShapeSelector);
    const svgStyles = getComputedStyle(svg);
    const shapeStyles = firstVisibleShape ? getComputedStyle(firstVisibleShape) : null;

    console.debug('[mobile-svg-frame] injected SVG diagnostics', {
      asset: assetFilename,
      normalizedVisibleElements: normalizedCount,
      protectedPivotReferences: pivotCount,
      remainingBlackPaint,
      svgComputed: {
        color: svgStyles.color,
        fill: svgStyles.fill,
        stroke: svgStyles.stroke,
        opacity: svgStyles.opacity,
        filter: svgStyles.filter,
        mixBlendMode: svgStyles.mixBlendMode,
        zIndex: svgStyles.zIndex
      },
      firstVisibleShape: firstVisibleShape
        ? {
            selector: `${firstVisibleShape.tagName.toLowerCase()}${firstVisibleShape.id ? `#${firstVisibleShape.id}` : ''}`,
            color: shapeStyles.color,
            fill: shapeStyles.fill,
            stroke: shapeStyles.stroke,
            opacity: shapeStyles.opacity,
            visibility: shapeStyles.visibility
          }
        : null
    });
  });
}


function uniquifyInlineSvgReferences(svg, assetFilename, { logReferences = false, pieceId = null } = {}) {
  const prefix = `mobile-frame-${assetFilename.replace(/[^a-z0-9_-]/gi, '-')}-${Math.random().toString(36).slice(2)}-`;
  const idMap = new Map();

  svg.querySelectorAll('[id]').forEach((element) => {
    const oldId = element.id;
    const newId = `${prefix}${oldId}`;
    idMap.set(oldId, newId);
    element.id = newId;
  });

  if (!idMap.size) return { idMap, beforeReferences: [], afterReferences: [] };

  const beforeReferences = logReferences ? getSvgReferenceAttributes(svg) : [];

  const rewriteValue = (value) => {
    let nextValue = value;
    idMap.forEach((newId, oldId) => {
      const escapedOldId = oldId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      nextValue = nextValue
        .replace(new RegExp(`url\\(\\s*#${escapedOldId}\\s*\\)`, 'g'), `url(#${newId})`)
        .replace(new RegExp(`(["'])#${escapedOldId}\\1`, 'g'), `$1#${newId}$1`);
      if (nextValue === `#${oldId}`) nextValue = `#${newId}`;
    });
    return nextValue;
  };

  svg.querySelectorAll('*').forEach((element) => {
    [...element.attributes].forEach((attribute) => {
      if (!attribute.value.includes('#') && !attribute.value.includes('url(')) return;

      const rewrittenValue = rewriteValue(attribute.value);
      if (attribute.name === 'xlink:href') {
        element.setAttributeNS('http://www.w3.org/1999/xlink', 'xlink:href', rewrittenValue);
        element.setAttribute('href', rewrittenValue);
        return;
      }

      element.setAttribute(attribute.name, rewrittenValue);
    });
  });

  const afterReferences = logReferences ? getSvgReferenceAttributes(svg) : [];

  if (logReferences && shouldLogFrameFetches()) {
    console.debug('[overlay][frame-fetch]', {
      phase: 'id-rewrite',
      piece: pieceId,
      assetFilename,
      ids: [...idMap.entries()].map(([before, after]) => ({ before, after })),
      beforeReferences,
      afterReferences
    });
  }

  return { idMap, beforeReferences, afterReferences };
}

function normalizeInlineSvg(svg, className, assetFilename, { pieceId = null } = {}) {
  let normalizedCount = 0;
  let pivotCount = 0;
  const preferStroke = LINE_FRAME_CLASS_PATTERN.test(className);
  const isLinePiece = isLineFramePiece(pieceId);
  const featureUsage = detectSvgFeatureUsage(svg);

  svg.querySelectorAll('style').forEach((styleElement) => styleElement.remove());
  const rewriteDiagnostics = uniquifyInlineSvgReferences(svg, assetFilename, { logReferences: isLinePiece, pieceId });

  if (isLinePiece && shouldBypassLineClipMasksForDebug()) {
    svg.querySelectorAll(`${SVG_VISIBLE_GEOMETRY_SELECTOR}, g`).forEach((element) => {
      element.removeAttribute('clip-path');
      element.removeAttribute('mask');
      element.style.removeProperty('clip-path');
      element.style.removeProperty('mask');
    });
    console.debug('[overlay][frame-fetch]', {
      phase: 'debug-clip-mask-bypass',
      piece: pieceId,
      assetFilename,
      note: 'Removed clip-path and mask attributes because ?debugFramePieces=1&debugFrameBypassLineClips=1 is active.'
    });
  }

  svg.classList.add(...className.split(' '));
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('focusable', 'false');
  svg.setAttribute('preserveAspectRatio', className.includes('frame-line') ? 'none' : 'xMidYMid meet');
  svg.removeAttribute('width');
  svg.removeAttribute('height');
  svg.removeAttribute('fill');
  svg.removeAttribute('stroke');
  svg.style.setProperty('color', MOBILE_FRAME_COLOR_VALUE, 'important');
  svg.style.setProperty('opacity', 'var(--mobile-frame-opacity, 0.92)', 'important');
  svg.style.setProperty('overflow', 'visible');

  svg.querySelectorAll(SVG_VISIBLE_ELEMENTS).forEach((element) => {
    if (isInvisiblePivotElement(element)) {
      forcePivotReference(element);
      pivotCount += 1;
      return;
    }

    forceVisiblePaint(element, detectPaintMode(element, preferStroke));
    normalizedCount += 1;
  });

  logMobileFrameDiagnostics(assetFilename, svg, normalizedCount, pivotCount, findRemainingBlackPaint(svg));

  svg.dataset.frameFeatureUsage = JSON.stringify(featureUsage);
  svg.dataset.frameIdRewriteCount = String(rewriteDiagnostics?.idMap?.size ?? 0);

  return svg;
}

function isInsideSvgDefinition(element) {
  return Boolean(element.closest('defs, clipPath, mask, symbol'));
}

function getNonPivotGeometry(svg) {
  return [...svg.querySelectorAll(SVG_VISIBLE_GEOMETRY_SELECTOR)]
    .filter((element) => !isInsideSvgDefinition(element))
    .filter((element) => !element.dataset.framePivot && !element.classList.contains('frame-pivot-reference'));
}

function logParsedLineSvgDiagnostics({ pieceId, asset, svg, parseDiagnostics }) {
  if (!isLineFramePiece(pieceId) || !shouldLogFrameFetches()) return;

  requestAnimationFrame(() => {
    const nonPivotGeometry = getNonPivotGeometry(svg);
    const firstGeometry = nonPivotGeometry[0] ?? null;
    const bbox = firstGeometry ? getSvgBBoxSnapshot(firstGeometry) : null;
    const rect = firstGeometry?.getBoundingClientRect();

    console.debug('[overlay][frame-fetch]', {
      phase: 'line-dom-parse',
      piece: pieceId,
      assetFilename: asset.filename,
      logicalPath: asset.logicalPath,
      resolvedUrl: asset.url,
      injectedSvgInDom: targetElementContainsSvg(svg),
      rootSvg: svg.tagName.toLowerCase() === 'svg',
      hasViewBox: Boolean(svg.getAttribute('viewBox')),
      viewBox: svg.getAttribute('viewBox'),
      visibleCandidateCount: parseDiagnostics.visibleCandidateCount,
      nonPivotVisibleCandidateCount: nonPivotGeometry.length,
      allVisibleCandidatesClassifiedAsPivot: parseDiagnostics.visibleCandidateCount > 0 && nonPivotGeometry.length === 0,
      firstNonPivotGeometry: firstGeometry ? {
        tag: firstGeometry.tagName.toLowerCase(),
        id: firstGeometry.id || null,
        bbox,
        clientRect: rect ? { x: rect.x, y: rect.y, width: rect.width, height: rect.height } : null,
        nonZeroBBox: Boolean(bbox && !bbox.error && bbox.width > 0 && bbox.height > 0),
        clipPath: firstGeometry.getAttribute('clip-path') || firstGeometry.style.getPropertyValue('clip-path') || null,
        mask: firstGeometry.getAttribute('mask') || firstGeometry.style.getPropertyValue('mask') || null
      } : null,
      featureUsage: detectSvgFeatureUsage(svg),
      referencesAfterRewrite: getSvgReferenceAttributes(svg)
    });
  });
}

function targetElementContainsSvg(svg) {
  return Boolean(svg?.isConnected && svg.closest('[data-mobile-frame-piece]'));
}

async function loadInlineSvg(asset, targetElement) {
  const { url, className } = asset;
  const pieceId = targetElement.dataset.mobileFramePiece ?? null;

  try {
    const response = await fetch(url);
    const contentType = response.headers.get('content-type') ?? '';
    const svgText = await response.text();
    const trimmedText = svgText.trimStart();
    const appearsToBeSvg = /^<\?xml[\s\S]*?<svg[\s>]/i.test(trimmedText) || /^<svg[\s>]/i.test(trimmedText);

    if (shouldLogFrameFetches()) {
      console.debug('[overlay][frame-fetch]', {
        phase: 'fetch',
        piece: pieceId,
        assetFilename: asset.filename,
        logicalPath: asset.logicalPath,
        resolvedUrl: url,
        httpStatus: response.status,
        ok: response.ok,
        contentType,
        textLength: svgText.length,
        first120Chars: !response.ok || !appearsToBeSvg ? svgText.slice(0, 120) : undefined
      });
    }

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    if (!appearsToBeSvg) {
      throw new Error(`Expected SVG markup but received ${contentType || 'unknown content type'}`);
    }

    const documentFromSvg = new DOMParser().parseFromString(svgText, 'image/svg+xml');
    const parserError = documentFromSvg.querySelector('parsererror');
    const svg = documentFromSvg.querySelector('svg');

    if (parserError || !svg) {
      throw new Error('Invalid SVG markup');
    }

    const parseDiagnostics = {
      rootSvg: svg.tagName.toLowerCase() === 'svg',
      hasViewBox: Boolean(svg.getAttribute('viewBox')),
      visibleCandidateCount: svg.querySelectorAll(SVG_VISIBLE_GEOMETRY_SELECTOR).length,
      featureUsage: detectSvgFeatureUsage(svg),
      referencesBeforeRewrite: getSvgReferenceAttributes(svg)
    };

    const normalizedSvg = normalizeInlineSvg(svg, className, asset.filename ?? getAssetFilename(url), { pieceId });
    targetElement.replaceChildren(normalizedSvg);
    targetElement.classList.add('mobile-svg-frame__piece--loaded');
    logParsedLineSvgDiagnostics({ pieceId, asset, svg: normalizedSvg, parseDiagnostics });
  } catch (error) {
    console.warn(`[overlay] Failed to inline mobile frame SVG: ${url}`, error);
    targetElement.classList.add('mobile-svg-frame__piece--failed');
  }
}

function loadMobileFrameSvgs(frameElement) {
  return Promise.all(Object.entries(MOBILE_FRAME_ASSETS).map(([key, asset]) => {
    const targetElement = frameElement.querySelector(`[data-mobile-frame-piece="${key}"]`);
    if (!targetElement) return Promise.resolve();

    return loadInlineSvg(asset, targetElement);
  }));
}

export function createOverlay({ onClose, assetManager = null } = {}) {
  const root = document.createElement('section');
  root.className = 'overlay';
  root.hidden = true;
  root.innerHTML = `
    <div class="overlay__backdrop" data-close-overlay></div>
    <article class="overlay__panel" role="dialog" aria-modal="true" aria-label="Portfolio gate details">
      <div class="mobile-svg-frame" aria-hidden="true">
        <span class="mobile-svg-frame__piece mobile-svg-frame__corner mobile-svg-frame__corner--lu frame-corner" data-mobile-frame-piece="lu"></span>
        <span class="mobile-svg-frame__piece mobile-svg-frame__corner mobile-svg-frame__corner--ru frame-corner" data-mobile-frame-piece="ru"></span>
        <span class="mobile-svg-frame__piece mobile-svg-frame__corner mobile-svg-frame__corner--ld frame-corner" data-mobile-frame-piece="ld"></span>
        <span class="mobile-svg-frame__piece mobile-svg-frame__corner mobile-svg-frame__corner--rd frame-corner" data-mobile-frame-piece="rd"></span>
        <span class="mobile-svg-frame__piece mobile-svg-frame__line mobile-svg-frame__line--u frame-line frame-line-u" data-mobile-frame-piece="u"></span>
        <span class="mobile-svg-frame__piece mobile-svg-frame__line mobile-svg-frame__line--d frame-line frame-line-d" data-mobile-frame-piece="d"></span>
        <span class="mobile-svg-frame__piece mobile-svg-frame__line mobile-svg-frame__line--l frame-line frame-line-l" data-mobile-frame-piece="l"></span>
        <span class="mobile-svg-frame__piece mobile-svg-frame__line mobile-svg-frame__line--r frame-line frame-line-r" data-mobile-frame-piece="r"></span>
      </div>
      <div class="overlay__content">
        <div class="overlay__scroll">
          <p class="overlay__status">Draft content — final copy pending</p>
          <h2 class="overlay__title"></h2>
          <p class="overlay__lead" hidden></p>
          <p class="overlay__text"></p>
          <p class="overlay__closing" hidden></p>
        </div>
        <div class="overlay__actions">
          <button class="overlay__close" type="button" data-close-overlay aria-label="Zamknij panel">Zamknij</button>
        </div>
      </div>
    </article>
  `;

  const panelEl = root.querySelector('.overlay__panel');
  const statusEl = root.querySelector('.overlay__status');
  const titleEl = root.querySelector('.overlay__title');
  const leadEl = root.querySelector('.overlay__lead');
  const textEl = root.querySelector('.overlay__text');
  const closingEl = root.querySelector('.overlay__closing');
  const mobileFrameEl = root.querySelector('.mobile-svg-frame');

  const mobileFrameLayout = createMobileFrameLayoutController(mobileFrameEl, panelEl);
  const mobileFrameReady = mobileFrameEl ? loadMobileFrameSvgs(mobileFrameEl).finally(mobileFrameLayout.schedule) : Promise.resolve();

  const close = () => {
    if (root.hidden) return;
    root.hidden = true;
    panelEl.removeAttribute('data-gate-id');
    document.body.classList.remove('overlay-open');
    onClose?.();
  };

  root.addEventListener('click', (event) => {
    if (event.target instanceof HTMLElement && event.target.dataset.closeOverlay !== undefined) {
      close();
    }
  });

  window.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      close();
    }
  });

  document.body.append(root);

  return {
    open(nodeData) {
      const gateId = nodeData.id;
      const isAIGuide = gateId === 'ai-guide';
      const isCreativeAI = gateId === 'creative-ai';
      const isEthics = gateId === 'ethics-life-protection';
      const hasStructuredCopy = Boolean(nodeData.leadText || nodeData.bodyText || nodeData.closingText);

      panelEl.dataset.gateId = gateId;
      panelEl.classList.toggle('overlay__panel--ai-guide', isAIGuide);
      panelEl.classList.toggle('overlay__panel--creative-ai', isCreativeAI);
      panelEl.classList.toggle('overlay__panel--ethics', isEthics);
      const panelBackgroundPath = GLYPH_PANEL_BACKGROUNDS[gateId];
      if (panelBackgroundPath) {
        const cachedUrl = assetManager?.getImageUrlByPath?.(panelBackgroundPath);
        if (!cachedUrl) {
          console.warn(`[overlay] Panel background cache miss for ${gateId}: ${panelBackgroundPath}`);
        }
        panelEl.style.setProperty('--overlay-panel-bg-image', `url("${cachedUrl ?? publicPath(panelBackgroundPath)}")`);
      } else {
        panelEl.style.removeProperty('--overlay-panel-bg-image');
      }
      statusEl.textContent = nodeData.eyebrow ?? (isAIGuide ? nodeData.shortLabel : 'Draft content — final copy pending');

      titleEl.textContent = nodeData.title;

      if (hasStructuredCopy) {
        leadEl.hidden = !nodeData.leadText;
        leadEl.textContent = nodeData.leadText ?? '';

        textEl.textContent = nodeData.bodyText ?? nodeData.draftText;

        closingEl.hidden = !nodeData.closingText;
        closingEl.textContent = nodeData.closingText ?? '';
      } else {
        leadEl.hidden = true;
        leadEl.textContent = '';

        textEl.textContent = nodeData.draftText;

        closingEl.hidden = true;
        closingEl.textContent = '';
      }

      root.hidden = false;
      document.body.classList.add('overlay-open');
      mobileFrameReady.finally(() => {
        mobileFrameLayout.schedule();
        logOverlayFrameDiagnostics(root, panelEl, gateId);
      });
    },
    close
  };
}
