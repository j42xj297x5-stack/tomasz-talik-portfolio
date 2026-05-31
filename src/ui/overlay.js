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

const SVG_COLORABLE_SHAPES = 'path, polygon, rect, circle, ellipse, line, polyline';

function isInvisiblePivotElement(element) {
  const id = element.id?.toLowerCase() ?? '';
  const label = element.getAttribute('inkscape:label')?.toLowerCase() ?? '';
  const opacity = element.getAttribute('opacity') ?? '';
  const styleOpacity = element.style?.opacity ?? '';

  return id.includes('pivot') || label.includes('pivot') || opacity === '0' || styleOpacity === '0';
}

function normalizeInlineSvg(svg, className) {
  svg.classList.add(...className.split(' '));
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('focusable', 'false');
  svg.setAttribute('preserveAspectRatio', className.includes('frame-line') ? 'none' : 'xMidYMid meet');
  svg.removeAttribute('width');
  svg.removeAttribute('height');
  svg.style.color = 'var(--mobile-frame-color, rgba(255,255,255,0.92))';
  svg.style.fill = 'currentColor';
  svg.style.stroke = 'none';
  svg.style.overflow = 'visible';

  svg.querySelectorAll(SVG_COLORABLE_SHAPES).forEach((shape) => {
    if (isInvisiblePivotElement(shape)) {
      shape.classList.add('frame-pivot-reference');
      shape.setAttribute('opacity', '0');
      shape.setAttribute('pointer-events', 'none');
      shape.style.opacity = '0';
      shape.style.pointerEvents = 'none';
      shape.style.fill = 'none';
      shape.style.stroke = 'none';
      return;
    }

    shape.setAttribute('fill', 'currentColor');
    shape.setAttribute('stroke', 'none');
    shape.style.fill = 'currentColor';
    shape.style.stroke = 'none';
  });

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

    targetElement.replaceChildren(normalizeInlineSvg(svg, className));
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

    loadInlineSvg(asset.url, targetElement, asset.className);
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
    },
    close
  };
}
