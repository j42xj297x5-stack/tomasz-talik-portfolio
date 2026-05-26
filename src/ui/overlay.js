export function createOverlay({ onClose } = {}) {
  const root = document.createElement('section');
  root.className = 'overlay';
  root.hidden = true;
  root.innerHTML = `
    <div class="overlay__backdrop" data-close-overlay></div>
    <article class="overlay__panel" role="dialog" aria-modal="true" aria-label="Portfolio gate details">
      <button class="overlay__close" type="button" data-close-overlay aria-label="Close panel">Close</button>
      <div class="overlay__content">
        <p class="overlay__status">Draft content — final copy pending</p>
        <h2 class="overlay__title"></h2>
        <p class="overlay__lead" hidden></p>
        <p class="overlay__text"></p>
        <p class="overlay__closing" hidden></p>
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

      panelEl.classList.toggle('overlay__panel--ai-guide', isAIGuide);
      statusEl.textContent = isAIGuide ? nodeData.shortLabel : 'Draft content — final copy pending';

      titleEl.textContent = nodeData.title;

      if (isAIGuide) {
        leadEl.hidden = false;
        leadEl.textContent = nodeData.leadText ?? '';

        textEl.textContent = nodeData.bodyText ?? nodeData.draftText;

        closingEl.hidden = false;
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
