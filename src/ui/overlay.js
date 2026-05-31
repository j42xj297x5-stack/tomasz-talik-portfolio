import { GLYPH_PANEL_BACKGROUNDS } from '../assets/assetManifest.js';
import { publicPath } from '../utils/publicPath.js';

const MOBILE_FRAME_ASSETS = {
  lu: { url: publicPath('svg/portfolio_frame_mobile_corner_lu.svg'), className: 'frame-corner frame-corner-lu', role: 'corner' },
  ru: { url: publicPath('svg/portfolio_frame_mobile_corner_ru.svg'), className: 'frame-corner frame-corner-ru', role: 'corner' },
  ld: { url: publicPath('svg/portfolio_frame_mobile_corner_ld.svg'), className: 'frame-corner frame-corner-ld', role: 'corner' },
  rd: { url: publicPath('svg/portfolio_frame_mobile_corner_rd.svg'), className: 'frame-corner frame-corner-rd', role: 'corner' },
  u: { url: publicPath('svg/portfolio_frame_mobile_line_u.svg'), className: 'frame-line frame-line-u', role: 'line' },
  d: { url: publicPath('svg/portfolio_frame_mobile_line_d.svg'), className: 'frame-line frame-line-d', role: 'line' },
  l: { url: publicPath('svg/portfolio_frame_mobile_line_l.svg'), className: 'frame-line frame-line-l', role: 'line' },
  r: { url: publicPath('svg/portfolio_frame_mobile_line_r.svg'), className: 'frame-line frame-line-r', role: 'line' }
};

const SVG_VISIBLE_ELEMENTS = 'path, rect, circle, ellipse, polygon, polyline, line, g, use';
const SVG_RENDERED_SHAPES = ['path', 'rect', 'circle', 'ellipse', 'polygon', 'polyline', 'line'];
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

function getInlineStyleValue(element, propertyName) {
  return element.style.getPropertyValue(propertyName).trim();
}

function getPaintAttribute(element, propertyName) {
  let currentElement = element;

  while (currentElement instanceof SVGElement) {
    const inlineStyleValue = getInlineStyleValue(currentElement, propertyName);
    const attributeValue = currentElement.getAttribute(propertyName);
    const paintValue = (inlineStyleValue || attributeValue || '').trim().toLowerCase();

    if (paintValue) return paintValue;

    currentElement = currentElement.parentElement;
  }

  return '';
}

function isPaintEnabled(value) {
  return Boolean(value) && value !== 'none' && value !== 'transparent';
}

function getSourcePaintMode(element, assetRole) {
  if (assetRole === 'corner') return 'fill';

  const sourceFill = getPaintAttribute(element, 'fill');
  const sourceStroke = getPaintAttribute(element, 'stroke');
  const hasFill = isPaintEnabled(sourceFill);
  const hasStroke = isPaintEnabled(sourceStroke);

  if (hasStroke && !hasFill) return 'stroke';
  return 'fill';
}

function forceVisiblePaint(element, assetRole) {
  const paintMode = getSourcePaintMode(element, assetRole);

  stripPaintDeclarations(element);
  element.dataset.framePaintMode = paintMode;
  element.style.setProperty('color', MOBILE_FRAME_COLOR_VALUE, 'important');

  if (paintMode === 'stroke') {
    element.setAttribute('fill', 'none');
    element.setAttribute('stroke', 'currentColor');
    element.style.setProperty('fill', 'none', 'important');
    element.style.setProperty('stroke', 'currentColor', 'important');
  } else {
    element.setAttribute('fill', 'currentColor');
    element.setAttribute('stroke', 'none');
    element.style.setProperty('fill', 'currentColor', 'important');
    element.style.setProperty('stroke', 'none', 'important');
  }

  return paintMode;
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

function getVisibleShapeSelector() {
  return SVG_RENDERED_SHAPES
    .map((shape) => `${shape}:not([data-frame-pivot="true"]):not(.frame-pivot-reference)`)
    .join(', ');
}

function getPivotReferenceStatus(svg) {
  const pivotElements = [...svg.querySelectorAll('[data-frame-pivot="true"], .frame-pivot-reference')];
  return {
    count: pivotElements.length,
    hidden: pivotElements.every((element) => {
      const styles = getComputedStyle(element);
      return styles.opacity === '0'
        && styles.visibility === 'hidden'
        && styles.fill === 'none'
        && styles.stroke === 'none';
    })
  };
}

function getFrameAssetDiagnostics(svg) {
  const firstVisibleShape = svg.querySelector(getVisibleShapeSelector());
  const svgStyles = getComputedStyle(svg);
  const shapeStyles = firstVisibleShape ? getComputedStyle(firstVisibleShape) : null;
  const pivotReferences = getPivotReferenceStatus(svg);

  return {
    filename: svg.dataset.frameAssetFilename,
    assetRole: svg.dataset.frameAssetRole,
    firstVisibleElementTag: firstVisibleShape?.tagName.toLowerCase() ?? null,
    computedFill: shapeStyles?.fill ?? null,
    computedStroke: shapeStyles?.stroke ?? null,
    visibleElementUses: firstVisibleShape?.dataset.framePaintMode ?? null,
    pivotReferenceElementsRemainHidden: pivotReferences.hidden,
    pivotReferenceElementCount: pivotReferences.count,
    svgComputedColor: svgStyles.color,
    svgComputedFill: svgStyles.fill,
    svgComputedStroke: svgStyles.stroke
  };
}

function logMobileFrameDiagnostics(assetFilename, svg, normalizedCount, pivotCount, remainingBlackPaint) {
  if (!import.meta.env.DEV) return;

  requestAnimationFrame(() => {
    const panelEl = svg.closest('.overlay__panel');
    const frameEl = svg.closest('.mobile-svg-frame');
    const panelStyles = panelEl ? getComputedStyle(panelEl) : null;
    const frameStyles = frameEl ? getComputedStyle(frameEl) : null;

    console.debug('[mobile-svg-frame] injected SVG diagnostics', {
      activeGateId: panelEl?.dataset.gateId ?? null,
      panelResolvedMobileFrameColor: panelStyles?.getPropertyValue('--mobile-frame-color').trim() ?? null,
      frameResolvedColor: frameStyles?.color ?? null,
      normalizedVisibleElements: normalizedCount,
      protectedPivotReferences: pivotCount,
      remainingBlackPaint,
      asset: getFrameAssetDiagnostics(svg)
    });
  });
}

function logMobileFramePanelDiagnostics(panelEl) {
  if (!import.meta.env.DEV) return;

  requestAnimationFrame(() => {
    const frameEl = panelEl.querySelector('.mobile-svg-frame');
    const panelStyles = getComputedStyle(panelEl);
    const frameStyles = frameEl ? getComputedStyle(frameEl) : null;
    const svgs = frameEl ? [...frameEl.querySelectorAll('svg')] : [];

    console.debug('[mobile-svg-frame] open panel diagnostics', {
      activeGateId: panelEl.dataset.gateId ?? null,
      panelResolvedMobileFrameColor: panelStyles.getPropertyValue('--mobile-frame-color').trim(),
      frameResolvedColor: frameStyles?.color ?? null,
      injectedSvgResolvedColors: svgs.map((svg) => ({
        filename: svg.dataset.frameAssetFilename,
        color: getComputedStyle(svg).color
      })),
      assets: svgs.map(getFrameAssetDiagnostics)
    });
  });
}

function normalizeInlineSvg(svg, className, assetFilename, assetRole) {
  let normalizedCount = 0;
  let pivotCount = 0;

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
  svg.dataset.frameAssetFilename = assetFilename;
  svg.dataset.frameAssetRole = assetRole;

  svg.querySelectorAll(SVG_VISIBLE_ELEMENTS).forEach((element) => {
    if (isInvisiblePivotElement(element)) {
      forcePivotReference(element);
      pivotCount += 1;
      return;
    }

    forceVisiblePaint(element, assetRole);
    normalizedCount += 1;
  });

  logMobileFrameDiagnostics(assetFilename, svg, normalizedCount, pivotCount, findRemainingBlackPaint(svg));

  return svg;
}

async function loadInlineSvg(url, targetElement, className, assetRole) {
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

    targetElement.replaceChildren(normalizeInlineSvg(svg, className, getAssetFilename(url), assetRole));
    targetElement.classList.add('mobile-svg-frame__piece--loaded');
  } catch (error) {
    console.warn(`[overlay] Failed to inline mobile frame SVG: ${url}`, error);
    targetElement.classList.add('mobile-svg-frame__piece--failed');
  }
}

function loadMobileFrameSvgs(frameElement) {
  Object.entries(MOBILE_FRAME_ASSETS).forEach(([key, asset]) => {
    const targetElement = frameElement.querySelector(`[data-mobile-frame-piece="${key}"]`);
    if (!targetElement) return;

    loadInlineSvg(asset.url, targetElement, asset.className, asset.role);
  });
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

  if (mobileFrameEl) {
    loadMobileFrameSvgs(mobileFrameEl);
  }

  const close = () => {
    if (root.hidden) return;
    root.hidden = true;
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
      const isAIGuide = nodeData.id === 'ai-guide';
      const isCreativeAI = nodeData.id === 'creative-ai';
      const hasStructuredCopy = Boolean(nodeData.leadText || nodeData.bodyText || nodeData.closingText);

      panelEl.dataset.gateId = nodeData.id;
      panelEl.classList.toggle('overlay__panel--ai-guide', isAIGuide);
      panelEl.classList.toggle('overlay__panel--creative-ai', isCreativeAI);
      const panelBackgroundPath = GLYPH_PANEL_BACKGROUNDS[nodeData.id];
      if (panelBackgroundPath) {
        const cachedUrl = assetManager?.getImageUrlByPath?.(panelBackgroundPath);
        if (!cachedUrl) {
          console.warn(`[overlay] Panel background cache miss for ${nodeData.id}: ${panelBackgroundPath}`);
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
      logMobileFramePanelDiagnostics(panelEl);
    },
    close
  };
}
