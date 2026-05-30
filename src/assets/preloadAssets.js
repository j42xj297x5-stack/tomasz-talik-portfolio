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
    mobileWarmupReduced: false,
    cacheHits: 0,
    cacheMisses: 0,
    activeStage: null,
    queueLength: 0,
    activeLoads: 0,
    concurrency: 0,
    networkLoadMs: 0,
    parseHydrateMs: 0,
    compileWarmupMs: 0,
    stageStats: {},
    timestamps: {}
  };
  const records = assets.map((asset) => ({
    ...asset,
    url: publicPath(asset.path),
    status: 'pending',
    loadedBytes: 0,
    totalBytes: null,
    error: null,
    loadMs: 0,
    parseHydrateMs: 0
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
    const stageStats = records.reduce((acc, record) => {
      const stage = record.stage ?? (record.critical ? 'criticalInitial' : 'uncategorized');
      const current = acc[stage] ?? { total: 0, loaded: 0, failed: 0, loadedBytes: 0, knownTotalBytes: 0, queued: 0, loading: 0 };
      current.total += 1;
      if (record.status === 'loaded') current.loaded += 1;
      if (record.status === 'failed') current.failed += 1;
      if (record.status === 'pending') current.queued += 1;
      if (record.status === 'loading') current.loading += 1;
      current.loadedBytes += record.loadedBytes || 0;
      current.knownTotalBytes += record.totalBytes || 0;
      acc[stage] = current;
      return acc;
    }, {});

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
      stageStats,
      runtimeStats: { ...runtimeStats, stageStats },
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
    markEvent(name, timestamp = performance.now()) {
      runtimeStats = {
        ...runtimeStats,
        timestamps: { ...(runtimeStats.timestamps ?? {}), [name]: timestamp }
      };
      console.info(`[loading][timeline] ${name}`, { t: Math.round(timestamp) });
      notify();
    },
    update(record, patch) {
      if (!record) return;
      Object.assign(record, patch);
      notify();
    }
  };
}

export async function preloadAssets(assets, { diagnostics = createLoadingDiagnostics(assets), assetManager = null, concurrency = 4, stage = null, markComplete = false } = {}) {
  if (assetManager?.preload) {
    return assetManager.preload(assets, { concurrency, stage, markComplete });
  }

  throw new Error('preloadAssets now requires an AssetManager instance so assets are hydrated through runtime loaders.');
}
