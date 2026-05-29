export function publicPath(path = '') {
  const base = import.meta.env.BASE_URL || '/';
  const cleanBase = base.endsWith('/') ? base : `${base}/`;
  const cleanPath = String(path)
    .replace(/^\/+/, '')
    .replace(/^public\//, '');

  return `${cleanBase}${cleanPath}`;
}

export function describePublicPath(path = '') {
  const base = import.meta.env.BASE_URL || '/';
  const cleanBase = base.endsWith('/') ? base : `${base}/`;
  const cleanPath = String(path)
    .replace(/^\/+/, '')
    .replace(/^public\//, '');

  return {
    input: path,
    normalizedPath: cleanPath,
    baseUrl: cleanBase,
    url: `${cleanBase}${cleanPath}`
  };
}
