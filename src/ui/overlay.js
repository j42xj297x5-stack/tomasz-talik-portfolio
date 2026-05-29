import { GLYPH_PANEL_BACKGROUNDS } from '../assets/assetManifest.js';
import { publicPath } from '../utils/publicPath.js';
export function createOverlay({ onClose } = {}) {
  const root = document.createElement('section');
  root.className = 'overlay';
  root.hidden = true;
  root.innerHTML = `
    <div class="overlay__backdrop" data-close-overlay></div>
    <article class="overlay__panel" role="dialog" aria-modal="true" aria-label="Portfolio gate details">
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
        panelEl.style.setProperty('--overlay-panel-bg-image', `url("${publicPath(panelBackgroundPath)}")`);
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
