import { GLYPH_PANEL_BACKGROUNDS } from '../assets/assetManifest.js';
import { publicPath } from '../utils/publicPath.js';

const MOBILE_FRAME_ASSETS = {
  lu: { url: publicPath('svg/portfolio_frame_mobile_corner_lu.svg'), className: 'frame-corner frame-corner-lu' },
  ru: { url: publicPath('svg/portfolio_frame_mobile_corner_ru.svg'), className: 'frame-corner frame-corner-ru' },
  ld: { url: publicPath('svg/portfolio_frame_mobile_corner_ld.svg'), className: 'frame-corner frame-corner-ld' },
  rd: { url: publicPath('svg/portfolio_frame_mobile_corner_rd.svg'), className: 'frame-corner frame-corner-rd' },
  u: { url: publicPath('svg/portfolio_frame_mobile_line_u.svg'), className: 'frame-line frame-line-u' },
  d: { url: publicPath('svg/portfolio_frame_mobile_line_d.svg'), className: 'frame-line frame-line-d' },
  l: { url: publicPath('svg/portfolio_frame_mobile_line_l.svg'), className: 'frame-line frame-line-l' },
  r: { url: publicPath('svg/portfolio_frame_mobile_line_r.svg'), className: 'frame-line frame-line-r' }
};

const SVG_VISIBLE_ELEMENTS = 'path, rect, circle, ellipse, polygon, polyline, line, g, use';
const SVG_RENDERED_SHAPES = ['path', 'rect', 'circle', 'ellipse', 'polygon', 'polyline', 'line'];
const LINE_FRAME_CLASS_PATTERN = /(?:^|\s)frame-line(?:\s|$)/;
const MOBILE_FRAME_COLOR_VALUE = 'var(--mobile-frame-color, rgba(255,255,255,0.92))';
const BLACK_COLOR_PATTERN = /(?:^|[\s:;,(])(?:#(?:000|000000)\b|black\b|rgb\(\s*0\s*,\s*0\s*,\s*0\s*\)|rgba\(\s*0\s*,\s*0\s*,\s*0\s*,\s*(?:0?\.\d+|1(?:\.0+)?)\s*\))/i;
const PIVOT_REFERENCE_PATTERN = /(?:pivot|reference|guide)/i;

function getAssetFilename(url) {
  const [path] = url.split('?');
  return path.split('/').pop() || url;
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

function normalizeInlineSvg(svg, className, assetFilename) {
  let normalizedCount = 0;
  let pivotCount = 0;
  const preferStroke = LINE_FRAME_CLASS_PATTERN.test(className);

  svg.querySelectorAll('style').forEach((styleElement) => styleElement.remove());

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

  return svg;
}

async function loadInlineSvg(url, targetElement, className) {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const svgText = await response.text();
    const documentFromSvg = new DOMParser().parseFromString(svgText, 'image/svg+xml');
    const parserError = documentFromSvg.querySelector('parsererror');
    const svg = documentFromSvg.querySelector('svg');

    if (parserError || !svg) {
      throw new Error('Invalid SVG markup');
    }

    targetElement.replaceChildren(normalizeInlineSvg(svg, className, getAssetFilename(url)));
    targetElement.classList.add('mobile-svg-frame__piece--loaded');
  } catch (error) {
    console.warn(`[overlay] Failed to inline mobile frame SVG: ${url}`, error);
    targetElement.classList.add('mobile-svg-frame__piece--failed');
  }
}

function loadMobileFrameSvgs(frameElement) {
  return Promise.all(Object.entries(MOBILE_FRAME_ASSETS).map(([key, asset]) => {
    const targetElement = frameElement.querySelector(`[data-mobile-frame-piece="${key}"]`);
    if (!targetElement) return Promise.resolve();

    return loadInlineSvg(asset.url, targetElement, asset.className);
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

  const mobileFrameReady = mobileFrameEl ? loadMobileFrameSvgs(mobileFrameEl) : Promise.resolve();

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
      const hasStructuredCopy = Boolean(nodeData.leadText || nodeData.bodyText || nodeData.closingText);

      panelEl.dataset.gateId = gateId;
      panelEl.classList.toggle('overlay__panel--ai-guide', isAIGuide);
      panelEl.classList.toggle('overlay__panel--creative-ai', isCreativeAI);
      const panelBackgroundPath = GLYPH_PANEL_BACKGROUNDS[gateId];
      if (panelBackgroundPath) {
        const cachedUrl = assetManager?.getImageUrlByPath?.(panelBackgroundPath);
        if (!cachedUrl) {
          console.warn(`[overlay] Panel background cache miss for ${gateId}: ${panelBackgroundPath}`);
        }
        panelEl.style.setProperty('--overlay-panel-bg-image', `url("${cachedUrl ?? panelBackgroundPath}")`);
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
        logOverlayFrameDiagnostics(root, panelEl, gateId);
      });
    },
    close
  };
}
