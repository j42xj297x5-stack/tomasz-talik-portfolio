import { formatBytes } from '../assets/preloadAssets.js';
import { publicPath } from '../utils/publicPath.js';

function progressPercent(snapshot) {
  if (!snapshot?.totalAssets) return 0;
  return Math.round(((snapshot.completedAssets + snapshot.failedAssets) / snapshot.totalAssets) * 100);
}

function byteProgress(snapshot) {
  const loaded = formatBytes(snapshot.loadedBytes);
  if (snapshot.unknownTotalAssets > 0) {
    return `${loaded} loaded / ${formatBytes(snapshot.knownTotalBytes)} known + ${snapshot.unknownTotalAssets} unknown`;
  }
  return `${loaded} / ${formatBytes(snapshot.knownTotalBytes)}`;
}

export function createLoaderOverlay({ debug = false } = {}) {
  const root = document.createElement('section');
  root.className = 'loader-overlay';
  root.setAttribute('role', 'status');
  root.setAttribute('aria-live', 'polite');
  root.innerHTML = `
    <div class="loader-overlay__panel">
      <img class="loader-overlay__logo" src="${publicPath('/png/orange_monkey.webp')}" alt="" aria-hidden="true">
      <p class="loader-overlay__eyebrow">Portfolio runtime</p>
      <h1 class="loader-overlay__title">Ładowanie świata...</h1>
      <div class="loader-overlay__bar" aria-hidden="true"><span></span></div>
      <p class="loader-overlay__progress">0%</p>
      <p class="loader-overlay__assets">assets 0/0</p>
      <p class="loader-overlay__bytes">0 B / unknown total</p>
      <p class="loader-overlay__debug" ${debug ? '' : 'hidden'}></p>
      <p class="loader-overlay__error" hidden></p>
    </div>
  `;

  const barEl = root.querySelector('.loader-overlay__bar span');
  const progressEl = root.querySelector('.loader-overlay__progress');
  const assetsEl = root.querySelector('.loader-overlay__assets');
  const bytesEl = root.querySelector('.loader-overlay__bytes');
  const debugEl = root.querySelector('.loader-overlay__debug');
  const errorEl = root.querySelector('.loader-overlay__error');

  document.body.append(root);
  let completed = false;
  let phase = null;

  return {
    update(snapshot) {
      if (completed) return;
      const percent = progressPercent(snapshot);
      barEl.style.width = `${percent}%`;
      progressEl.textContent = phase ?? (percent === 100 ? 'Assets loaded' : `${percent}%`);
      assetsEl.textContent = `assets ${snapshot.completedAssets + snapshot.failedAssets}/${snapshot.totalAssets}`;
      bytesEl.textContent = byteProgress(snapshot);
      if (debug && debugEl) {
        const current = snapshot.currentAsset ?? snapshot.lastLoaded;
        const stats = snapshot.runtimeStats ?? {};
        const phase = current ? `${current.status}: ${current.path}` : `${snapshot.completedAssets}/${snapshot.totalAssets} assets`;
        debugEl.textContent = `${phase} · stage=${stats.activeStage ?? 'idle'} · queue=${stats.queueLength ?? 0}/${stats.activeLoads ?? 0} · c=${stats.concurrency ?? 0} · runtime=${stats.runtimeLoadedAssets ?? 0} · gltf=${stats.parsedGltfCount ?? 0} · textures=${stats.textureLoadedCount ?? 0} · images=${stats.decodedImageCount ?? 0} · hits/misses=${stats.cacheHits ?? 0}/${stats.cacheMisses ?? 0} · compile=${stats.shaderCompileComplete ? 'yes' : 'no'} · mobileReduced=${stats.mobileWarmupReduced ? 'yes' : 'no'} · load=${Math.round(stats.networkLoadMs ?? 0)}ms · hydrate=${Math.round(stats.parseHydrateMs ?? 0)}ms · warm=${Math.round(stats.compileWarmupMs ?? 0)}ms`;
      }
    },
    setPhase(label) {
      if (completed) return;
      phase = label;
      progressEl.textContent = label;
    },
    showError(message) {
      root.classList.add('loader-overlay--error');
      errorEl.hidden = false;
      errorEl.textContent = message;
    },
    async complete() {
      if (completed) return;
      completed = true;
      progressEl.textContent = 'Ready';
      root.classList.add('loader-overlay--complete');
      await new Promise((resolve) => setTimeout(resolve, 420));
      root.hidden = true;
      root.style.display = 'none';
      root.remove();
    }
  };
}
