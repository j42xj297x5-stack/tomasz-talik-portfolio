import { formatBytes } from '../assets/preloadAssets.js';

function progressPercent(snapshot) {
  if (!snapshot?.totalAssets) return 0;
  return Math.round(((snapshot.completedAssets + snapshot.failedAssets) / snapshot.totalAssets) * 100);
}

export function createLoaderOverlay({ debug = false } = {}) {
  const root = document.createElement('section');
  root.className = 'loader-overlay';
  root.setAttribute('role', 'status');
  root.setAttribute('aria-live', 'polite');
  root.innerHTML = `
    <div class="loader-overlay__panel">
      <div class="loader-overlay__sigil" aria-hidden="true"></div>
      <p class="loader-overlay__eyebrow">Portfolio runtime</p>
      <h1 class="loader-overlay__title">Ładowanie świata...</h1>
      <div class="loader-overlay__bar" aria-hidden="true"><span></span></div>
      <p class="loader-overlay__progress">0%</p>
      <p class="loader-overlay__bytes">Przygotowuję zasoby...</p>
      <p class="loader-overlay__debug" ${debug ? '' : 'hidden'}></p>
      <p class="loader-overlay__error" hidden></p>
    </div>
  `;

  const barEl = root.querySelector('.loader-overlay__bar span');
  const progressEl = root.querySelector('.loader-overlay__progress');
  const bytesEl = root.querySelector('.loader-overlay__bytes');
  const debugEl = root.querySelector('.loader-overlay__debug');
  const errorEl = root.querySelector('.loader-overlay__error');

  document.body.append(root);

  return {
    update(snapshot) {
      const percent = progressPercent(snapshot);
      barEl.style.width = `${percent}%`;
      progressEl.textContent = `${percent}%`;
      bytesEl.textContent = `${formatBytes(snapshot.loadedBytes)} / ${snapshot.knownTotalBytes > 0 ? formatBytes(snapshot.knownTotalBytes) : 'unknown total'}`;
      if (debug && debugEl) {
        const current = snapshot.currentAsset ?? snapshot.lastLoaded;
        debugEl.textContent = current ? `${current.status}: ${current.path}` : `${snapshot.completedAssets}/${snapshot.totalAssets} assets`;
      }
    },
    showError(message) {
      root.classList.add('loader-overlay--error');
      errorEl.hidden = false;
      errorEl.textContent = message;
    },
    async complete() {
      root.classList.add('loader-overlay--complete');
      await new Promise((resolve) => setTimeout(resolve, 420));
      root.remove();
    }
  };
}
