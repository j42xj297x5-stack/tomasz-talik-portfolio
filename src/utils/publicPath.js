const PUBLIC_DIRECTORY_PREFIX = 'public/';

function normalizeBaseUrl(baseUrl = '/') {
  const normalized = String(baseUrl || '/').trim() || '/';
  return normalized.endsWith('/') ? normalized : `${normalized}/`;
}

function normalizePublicAssetPath(assetPath) {
  const normalized = String(assetPath || '').trim().replace(/\\/g, '/');
  const withoutLeadingSlash = normalized.replace(/^\/+/, '');
  return withoutLeadingSlash.startsWith(PUBLIC_DIRECTORY_PREFIX)
    ? withoutLeadingSlash.slice(PUBLIC_DIRECTORY_PREFIX.length)
    : withoutLeadingSlash;
}

export function publicPath(assetPath) {
  const normalizedAssetPath = normalizePublicAssetPath(assetPath);
  if (!normalizedAssetPath) return normalizeBaseUrl(import.meta.env.BASE_URL);
  if (/^(?:https?:)?\/\//i.test(normalizedAssetPath) || normalizedAssetPath.startsWith('data:')) {
    return normalizedAssetPath;
  }

  return new URL(normalizedAssetPath, normalizeBaseUrl(import.meta.env.BASE_URL)).pathname;
}

export function describePublicPath(assetPath) {
  return {
    input: assetPath,
    normalizedPath: normalizePublicAssetPath(assetPath),
    baseUrl: normalizeBaseUrl(import.meta.env.BASE_URL),
    url: publicPath(assetPath)
  };
}
