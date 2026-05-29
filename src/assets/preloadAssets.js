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
    update(record, patch) {
      Object.assign(record, patch);
      notify();
    }
  };
}

async function decodeImageFromCache(asset, url) {
  if (!asset.decode) return;

  const image = new Image();
  try {
    image.decoding = 'async';
    image.src = url;
    if (typeof image.decode === 'function') {
      await image.decode();
    } else {
      await new Promise((resolve, reject) => {
        image.onload = resolve;
        image.onerror = reject;
      });
    }
  } catch (error) {
    console.warn(`[preloadAssets] Loaded ${url}, but image decode failed. Browser cache may still prevent a visible panel gap.`, error);
  }
}

async function fetchAsset(record, diagnostics) {
  diagnostics.update(record, { status: 'loading' });

  const response = await fetch(record.url, { cache: 'force-cache' });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status} while preloading ${record.url}`);
  }

  const contentLength = Number(response.headers.get('content-length'));
  if (Number.isFinite(contentLength) && contentLength > 0) {
    diagnostics.update(record, { totalBytes: contentLength });
  }

  const blob = await response.blob();
  const byteSize = blob.size || (Number.isFinite(contentLength) ? contentLength : 0);

  if (record.type === 'image') {
    await decodeImageFromCache(record, record.url);
  }

  diagnostics.update(record, {
    status: 'loaded',
    loadedBytes: byteSize,
    totalBytes: Number.isFinite(contentLength) && contentLength > 0 ? contentLength : byteSize
  });
}

export async function preloadAssets(assets, { diagnostics = createLoadingDiagnostics(assets), concurrency = 4 } = {}) {
  const queue = diagnostics.records.slice();
  const failures = [];

  async function worker() {
    while (queue.length > 0) {
      const record = queue.shift();
      try {
        await fetchAsset(record, diagnostics);
      } catch (error) {
        const normalizedError = error instanceof Error ? error : new Error(String(error));
        diagnostics.update(record, { status: 'failed', error: normalizedError.message });
        failures.push({ record, error: normalizedError });
        console.warn(`[preloadAssets] Failed to preload ${record.label ?? record.id} from ${record.url}.`, normalizedError);
      }
    }
  }

  await Promise.all(Array.from({ length: Math.min(concurrency, queue.length || 1) }, () => worker()));

  const criticalFailures = failures.filter(({ record }) => record.critical);
  if (criticalFailures.length > 0) {
    const message = criticalFailures.map(({ record }) => `${record.label ?? record.id} (${record.url})`).join(', ');
    throw new Error(`Critical preload asset(s) failed: ${message}`);
  }

  return diagnostics.getSnapshot();
}
