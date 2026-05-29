import * as THREE from '../vendor/three.js';
import { resolveVendoredGLTFLoader } from '../utils/gltfLoader.js';
import { publicPath } from '../utils/publicPath.js';

function normalizePath(path = '') {
  return String(path).replace(/^\/+/, '').replace(/^public\//, '');
}

function inferKind(asset) {
  if (asset.kind) return asset.kind;
  if (asset.type === 'model' || asset.type === 'gltf' || asset.type === 'glb') return 'gltf';
  if (asset.type === 'texture') return 'texture';
  if (asset.type === 'image') return 'image';
  if (asset.type === 'script') return 'script';
  return asset.type ?? 'asset';
}

function loadTexture(textureLoader, url, onProgress) {
  return new Promise((resolve, reject) => {
    textureLoader.load(url, resolve, onProgress, reject);
  });
}

function loadGltf(GLTFLoader, url, onProgress) {
  const loader = new GLTFLoader();
  return new Promise((resolve, reject) => {
    loader.load(url, resolve, onProgress, reject);
  });
}

async function decodeImage(url) {
  const image = new Image();
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
  return image;
}

export function createAssetManager({ diagnostics = null } = {}) {
  const assetsByKey = new Map();
  const assetsByPath = new Map();
  const promisesByKey = new Map();
  const textureLoader = new THREE.TextureLoader();
  let preloadComplete = false;
  const stats = {
    runtimeLoadedAssets: 0,
    parsedGltfCount: 0,
    decodedImageCount: 0,
    textureLoadedCount: 0,
    cacheHits: 0,
    cacheMisses: 0,
    shaderCompileComplete: false,
    warmupFrameComplete: false
  };

  const emitStats = () => diagnostics?.setRuntimeStats?.(stats);

  function cacheResult(asset, result) {
    const key = asset.id;
    const pathKey = normalizePath(asset.path);
    assetsByKey.set(key, result);
    assetsByPath.set(pathKey, result);
    stats.runtimeLoadedAssets += 1;
    emitStats();
    return result;
  }

  function onProgressFor(record) {
    return (event) => {
      if (!record) return;
      diagnostics?.update?.(record, {
        status: 'loading',
        loadedBytes: Number.isFinite(event.loaded) ? event.loaded : record.loadedBytes,
        totalBytes: Number.isFinite(event.total) && event.total > 0 ? event.total : record.totalBytes
      });
    };
  }

  async function loadAsset(asset, { record = null } = {}) {
    const key = asset.id;
    const cached = assetsByKey.get(key);
    if (cached) return cached;
    if (promisesByKey.has(key)) return promisesByKey.get(key);

    const url = publicPath(asset.path);
    const kind = inferKind(asset);
    diagnostics?.update?.(record, { status: 'loading', url });

    const promise = (async () => {
      try {
        let result;
        if (kind === 'gltf') {
          const GLTFLoader = await resolveVendoredGLTFLoader('AssetManager');
          if (!GLTFLoader) throw new Error('GLTFLoader unavailable');
          const gltf = await loadGltf(GLTFLoader, url, onProgressFor(record));
          stats.parsedGltfCount += 1;
          result = { kind, key, url, path: asset.path, gltf, scene: gltf.scene };
        } else if (kind === 'texture') {
          const texture = await loadTexture(textureLoader, url, onProgressFor(record));
          texture.colorSpace = THREE.SRGBColorSpace;
          texture.generateMipmaps = true;
          texture.needsUpdate = true;
          stats.textureLoadedCount += 1;
          result = { kind, key, url, path: asset.path, texture };
        } else if (kind === 'image') {
          const image = await decodeImage(url);
          stats.decodedImageCount += 1;
          result = { kind, key, url, path: asset.path, image };
        } else if (kind === 'script') {
          if (key === 'gltf-loader-module') {
            await resolveVendoredGLTFLoader('AssetManager');
          } else {
            await import(/* @vite-ignore */ url);
          }
          result = { kind, key, url, path: asset.path };
        } else {
          const response = await fetch(url, { cache: 'force-cache' });
          if (!response.ok) throw new Error(`HTTP ${response.status}`);
          const blob = await response.blob();
          result = { kind, key, url, path: asset.path, blob };
        }

        cacheResult(asset, result);
        diagnostics?.update?.(record, {
          status: 'loaded',
          loadedBytes: record?.loadedBytes || record?.totalBytes || 0,
          totalBytes: record?.totalBytes ?? record?.loadedBytes ?? null
        });
        return result;
      } catch (error) {
        promisesByKey.delete(key);
        throw error;
      }
    })();

    promisesByKey.set(key, promise);
    return promise;
  }

  async function preload(assets, { concurrency = 4 } = {}) {
    const queue = assets.slice();
    const failures = [];
    async function worker() {
      while (queue.length > 0) {
        const asset = queue.shift();
        const record = diagnostics?.records?.find((candidate) => candidate.id === asset.id) ?? null;
        try {
          await loadAsset(asset, { record });
        } catch (error) {
          const normalizedError = error instanceof Error ? error : new Error(String(error));
          diagnostics?.update?.(record, { status: 'failed', error: normalizedError.message });
          failures.push({ record: asset, error: normalizedError });
          console.warn(`[AssetManager] Failed to hydrate ${asset.label ?? asset.id} from ${publicPath(asset.path)}.`, normalizedError);
        }
      }
    }
    await Promise.all(Array.from({ length: Math.min(concurrency, queue.length || 1) }, () => worker()));
    preloadComplete = true;
    emitStats();
    const criticalFailures = failures.filter(({ record }) => record.critical);
    if (criticalFailures.length > 0) {
      throw new Error(`Critical preload asset(s) failed: ${criticalFailures.map(({ record }) => record.label ?? record.id).join(', ')}`);
    }
    return diagnostics?.getSnapshot?.() ?? { failures };
  }

  function lookup(key, kindLabel = 'asset') {
    const result = assetsByKey.get(key);
    if (result) {
      stats.cacheHits += 1;
      emitStats();
      return result;
    }
    stats.cacheMisses += 1;
    emitStats();
    if (preloadComplete) console.warn(`[AssetManager] Cache miss after preload: ${key}`);
    return null;
  }

  function lookupPath(path) {
    const key = normalizePath(path);
    const result = assetsByPath.get(key);
    if (result) {
      stats.cacheHits += 1;
      emitStats();
      return result;
    }
    stats.cacheMisses += 1;
    emitStats();
    if (preloadComplete) console.warn(`[AssetManager] Cache miss after preload: ${path}`);
    return null;
  }

  function cloneGltfScene(keyOrPath) {
    const result = assetsByKey.has(keyOrPath) ? lookup(keyOrPath, 'gltf') : lookupPath(keyOrPath);
    const scene = result?.gltf?.scene ?? result?.scene;
    if (!scene) return null;
    return scene.clone(true);
  }

  function markWarmup({ shaderCompileComplete, warmupFrameComplete }) {
    if (typeof shaderCompileComplete === 'boolean') stats.shaderCompileComplete = shaderCompileComplete;
    if (typeof warmupFrameComplete === 'boolean') stats.warmupFrameComplete = warmupFrameComplete;
    emitStats();
  }

  return {
    loadAsset,
    preload,
    markPreloadComplete() { preloadComplete = true; emitStats(); },
    getAsset: lookup,
    getAssetByPath: lookupPath,
    getGltf(key) { return lookup(key, 'gltf')?.gltf ?? null; },
    getGltfByPath(path) { return lookupPath(path)?.gltf ?? null; },
    getTexture(key) { return lookup(key, 'texture')?.texture ?? null; },
    getTextureByPath(path) { return lookupPath(path)?.texture ?? null; },
    getImage(key) { return lookup(key, 'image')?.image ?? null; },
    getImageUrl(key) { return lookup(key, 'image')?.url ?? null; },
    getImageUrlByPath(path) { return lookupPath(path)?.url ?? null; },
    cloneGltfScene,
    markWarmup,
    getStats: () => ({ ...stats }),
    isPreloadComplete: () => preloadComplete
  };
}

export const assetManager = createAssetManager();
