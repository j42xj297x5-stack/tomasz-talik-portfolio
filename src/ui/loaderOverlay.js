import { formatBytes } from '../assets/preloadAssets.js';

function progressPercent(snapshot) {
  const critical = snapshot?.stageStats?.criticalInitial;
  if (critical?.total) return Math.round(((critical.loaded + critical.failed) / critical.total) * 100);
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
  let completed = false;

  return {
    update(snapshot) {
      if (completed) return;
      const percent = progressPercent(snapshot);
      barEl.style.width = `${percent}%`;
      progressEl.textContent = `${percent}%`;
      const critical = snapshot.stageStats?.criticalInitial;
      const deferred = snapshot.stageStats?.deferredWarm;
      const criticalBytes = critical ? `${formatBytes(critical.loadedBytes)} / ${critical.knownTotalBytes > 0 ? formatBytes(critical.knownTotalBytes) : 'unknown total'}` : `${formatBytes(snapshot.loadedBytes)} / ${snapshot.knownTotalBytes > 0 ? formatBytes(snapshot.knownTotalBytes) : 'unknown total'}`;
      const deferredText = deferred ? ` · deferred ${deferred.loaded}/${deferred.total}` : '';
      bytesEl.textContent = `critical ${critical?.loaded ?? snapshot.completedAssets}/${critical?.total ?? snapshot.totalAssets} · ${criticalBytes}${deferredText}`;
      if (debug && debugEl) {
        const current = snapshot.currentAsset ?? snapshot.lastLoaded;
        const stats = snapshot.runtimeStats ?? {};
        const phase = current ? `${current.status}: ${current.path}` : `${snapshot.completedAssets}/${snapshot.totalAssets} assets`;
        debugEl.textContent = `${phase} · stage=${stats.activeStage ?? 'idle'} · queue=${stats.queueLength ?? 0}/${stats.activeLoads ?? 0} · c=${stats.concurrency ?? 0} · runtime=${stats.runtimeLoadedAssets ?? 0} · gltf=${stats.parsedGltfCount ?? 0} · textures=${stats.textureLoadedCount ?? 0} · images=${stats.decodedImageCount ?? 0} · hits/misses=${stats.cacheHits ?? 0}/${stats.cacheMisses ?? 0} · compile=${stats.shaderCompileComplete ? 'yes' : 'no'} · mobileReduced=${stats.mobileWarmupReduced ? 'yes' : 'no'} · load=${Math.round(stats.networkLoadMs ?? 0)}ms · hydrate=${Math.round(stats.parseHydrateMs ?? 0)}ms · warm=${Math.round(stats.compileWarmupMs ?? 0)}ms`;
      }
    },
    showError(message) {
      root.classList.add('loader-overlay--error');
      errorEl.hidden = false;
      errorEl.textContent = message;
    },
    async complete() {
      if (completed) return;
      completed = true;
      root.classList.add('loader-overlay--complete');
      await new Promise((resolve) => setTimeout(resolve, 420));
      root.hidden = true;
      root.style.display = 'none';
      root.remove();
    }
  };
}
