import { publicPath } from '../utils/publicPath.js';

export function formatBytes(bytes, { compactUnknown = true } = {}) {
  if (!Number.isFinite(bytes)) return compactUnknown ? 'unknown' : 'unknown bytes';
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(kb >= 100 ? 0 : 1)} KB`;
  const mb = kb / 1024;
  return `${mb.toFixed(mb >= 100 ? 0 : 2)} MB`;
}

export function createLoadingDiagnostics(assets = []) {
  const listeners = new Set();
  let runtimeStats = {
    runtimeLoadedAssets: 0,
    parsedGltfCount: 0,
    decodedImageCount: 0,
    textureLoadedCount: 0,
    shaderCompileComplete: false,
    warmupFrameComplete: false,
    cacheHits: 0,
    cacheMisses: 0
  };
  const records = assets.map((asset) => ({
    ...asset,
    url: publicPath(asset.path),
    status: 'pending',
    loadedBytes: 0,
    totalBytes: null,
    error: null
  }));

  const notify = () => {
    const snapshot = getSnapshot();
    listeners.forEach((listener) => listener(snapshot));
  };

  function getSnapshot() {
    const completedAssets = records.filter((record) => record.status === 'loaded').length;
    const failedRecords = records.filter((record) => record.status === 'failed');
    const loadedBytes = records.reduce((sum, record) => sum + (record.loadedBytes || 0), 0);
    const knownTotalBytes = records.reduce((sum, record) => sum + (record.totalBytes || 0), 0);
    const unknownTotalAssets = records.filter((record) => record.totalBytes == null).length;
    const lastLoaded = [...records].reverse().find((record) => record.status === 'loaded') ?? null;
    const currentAsset = records.find((record) => record.status === 'loading') ?? records.find((record) => record.status === 'pending') ?? null;

    return {
      totalAssets: records.length,
      completedAssets,
      failedAssets: failedRecords.length,
      failedCriticalAssets: failedRecords.filter((record) => record.critical).length,
      failedRecords,
      loadedBytes,
      knownTotalBytes,
      unknownTotalAssets,
      lastLoaded,
      currentAsset,
      runtimeStats: { ...runtimeStats },
      records: records.map((record) => ({ ...record }))
    };
  }

  return {
    records,
    getSnapshot,
    subscribe(listener) {
      listeners.add(listener);
      listener(getSnapshot());
      return () => listeners.delete(listener);
    },
    setRuntimeStats(nextStats = {}) {
      runtimeStats = { ...runtimeStats, ...nextStats };
      notify();
    },
    update(record, patch) {
      if (!record) return;
      Object.assign(record, patch);
      notify();
    }
  };
}

export async function preloadAssets(assets, { diagnostics = createLoadingDiagnostics(assets), assetManager = null, concurrency = 4 } = {}) {
  if (assetManager?.preload) {
    return assetManager.preload(assets, { concurrency });
  }

  throw new Error('preloadAssets now requires an AssetManager instance so assets are hydrated through runtime loaders.');
}
