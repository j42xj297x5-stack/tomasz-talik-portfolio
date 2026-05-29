import { publicPath } from './publicPath.js';

export const GLTF_LOADER_PUBLIC_PATH = 'vendor/three/examples/jsm/loaders/GLTFLoader.js';

let loaderModulePromise = null;

export async function resolveVendoredGLTFLoader(context = 'runtime') {
  const loaderUrl = publicPath(GLTF_LOADER_PUBLIC_PATH);
  console.info(`[${context}] GLTFLoader dynamic import URL: ${loaderUrl}`);

  if (!loaderModulePromise) {
    loaderModulePromise = import(/* @vite-ignore */ loaderUrl);
  }

  return loaderModulePromise
    .then((module) => {
      console.info(`[${context}] GLTFLoader import succeeded from ${loaderUrl}.`);
      return module.GLTFLoader;
    })
    .catch((error) => {
      loaderModulePromise = null;
      console.warn(`[${context}] GLTFLoader import failed from ${loaderUrl}. Fallback remains active.`, error);
      return null;
    });
}
