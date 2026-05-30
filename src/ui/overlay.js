import { GLYPH_PANEL_BACKGROUNDS } from '../assets/assetManifest.js';
import { publicPath } from '../utils/publicPath.js';

const MOBILE_FRAME_ASSETS = {
  lu: publicPath('svg/portfolio_frame_mobile_corner_lu.svg'),
  ru: publicPath('svg/portfolio_frame_mobile_corner_ru.svg'),
  ld: publicPath('svg/portfolio_frame_mobile_corner_ld.svg'),
  rd: publicPath('svg/portfolio_frame_mobile_corner_rd.svg'),
  u: publicPath('svg/portfolio_frame_mobile_line_u.svg'),
  d: publicPath('svg/portfolio_frame_mobile_line_d.svg'),
  l: publicPath('svg/portfolio_frame_mobile_line_l.svg'),
  r: publicPath('svg/portfolio_frame_mobile_line_r.svg')
};
export function createOverlay({ onClose, assetManager = null } = {}) {
  const root = document.createElement('section');
  root.className = 'overlay';
  root.hidden = true;
  root.innerHTML = `
    <div class="overlay__backdrop" data-close-overlay></div>
    <article class="overlay__panel" role="dialog" aria-modal="true" aria-label="Portfolio gate details">
      <div class="mobile-svg-frame" aria-hidden="true">
        <span class="mobile-svg-frame__piece mobile-svg-frame__corner mobile-svg-frame__corner--lu" style="--mobile-frame-mask: url('${MOBILE_FRAME_ASSETS.lu}')"></span>
        <span class="mobile-svg-frame__piece mobile-svg-frame__corner mobile-svg-frame__corner--ru" style="--mobile-frame-mask: url('${MOBILE_FRAME_ASSETS.ru}')"></span>
        <span class="mobile-svg-frame__piece mobile-svg-frame__corner mobile-svg-frame__corner--ld" style="--mobile-frame-mask: url('${MOBILE_FRAME_ASSETS.ld}')"></span>
        <span class="mobile-svg-frame__piece mobile-svg-frame__corner mobile-svg-frame__corner--rd" style="--mobile-frame-mask: url('${MOBILE_FRAME_ASSETS.rd}')"></span>
        <span class="mobile-svg-frame__piece mobile-svg-frame__line mobile-svg-frame__line--u" style="--mobile-frame-mask: url('${MOBILE_FRAME_ASSETS.u}')"></span>
        <span class="mobile-svg-frame__piece mobile-svg-frame__line mobile-svg-frame__line--d" style="--mobile-frame-mask: url('${MOBILE_FRAME_ASSETS.d}')"></span>
        <span class="mobile-svg-frame__piece mobile-svg-frame__line mobile-svg-frame__line--l" style="--mobile-frame-mask: url('${MOBILE_FRAME_ASSETS.l}')"></span>
        <span class="mobile-svg-frame__piece mobile-svg-frame__line mobile-svg-frame__line--r" style="--mobile-frame-mask: url('${MOBILE_FRAME_ASSETS.r}')"></span>
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
