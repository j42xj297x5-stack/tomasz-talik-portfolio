export function createOverlay() {
  const root = document.createElement('section');
  root.className = 'overlay';
  root.hidden = true;
  root.innerHTML = `
    <div class="overlay__backdrop" data-close-overlay></div>
    <article class="overlay__panel" role="dialog" aria-modal="true" aria-label="Portfolio gate details">
      <button class="overlay__close" type="button" data-close-overlay aria-label="Close panel">Close</button>
      <p class="overlay__status">Draft content — final copy pending</p>
      <h2 class="overlay__title"></h2>
      <p class="overlay__text"></p>
    </article>
  `;

  const titleEl = root.querySelector('.overlay__title');
  const textEl = root.querySelector('.overlay__text');

  const close = () => {
    root.hidden = true;
    document.body.classList.remove('overlay-open');
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
      titleEl.textContent = nodeData.title;
      textEl.textContent = nodeData.draftText;
      root.hidden = false;
      document.body.classList.add('overlay-open');
    },
    close
  };
}
