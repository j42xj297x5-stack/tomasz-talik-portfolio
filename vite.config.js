import { defineConfig } from 'vite';
import { fileURLToPath, URL } from 'node:url';
import { copyFile, mkdir, readdir, stat } from 'node:fs/promises';
import { createReadStream } from 'node:fs';
import { extname, join, relative } from 'node:path';

const base = '/tomasz-talik-portfolio/';
const vendoredThreeDir = fileURLToPath(new URL('./vendor/three', import.meta.url));

const contentTypes = new Map([
  ['.js', 'text/javascript; charset=utf-8'],
  ['.mjs', 'text/javascript; charset=utf-8'],
  ['.json', 'application/json; charset=utf-8'],
  ['.wasm', 'application/wasm']
]);

async function copyDirectory(sourceDir, targetDir) {
  await mkdir(targetDir, { recursive: true });
  const entries = await readdir(sourceDir, { withFileTypes: true });

  await Promise.all(entries.map(async (entry) => {
    const sourcePath = join(sourceDir, entry.name);
    const targetPath = join(targetDir, entry.name);

    if (entry.isDirectory()) {
      await copyDirectory(sourcePath, targetPath);
      return;
    }

    if (entry.isFile()) {
      await mkdir(join(targetPath, '..'), { recursive: true });
      await copyFile(sourcePath, targetPath);
    }
  }));
}

function vendoredThreeRuntimePlugin() {
  return {
    name: 'vendored-three-runtime',
    transformIndexHtml() {
      return [
        {
          tag: 'script',
          attrs: { type: 'importmap' },
          children: JSON.stringify({ imports: { three: `${base}vendor/three/three.module.js` } }, null, 2),
          injectTo: 'head-prepend'
        }
      ];
    },
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const requestUrl = decodeURIComponent(req.url?.split('?')[0] ?? '');
        const vendorPrefix = `${base}vendor/three/`;
        if (!requestUrl.startsWith(vendorPrefix)) {
          next();
          return;
        }

        const relativePath = requestUrl.slice(vendorPrefix.length);
        const filePath = join(vendoredThreeDir, relativePath);

        try {
          const fileStat = await stat(filePath);
          if (!fileStat.isFile() || !relative(vendoredThreeDir, filePath) || relative(vendoredThreeDir, filePath).startsWith('..')) {
            next();
            return;
          }

          res.setHeader('Content-Type', contentTypes.get(extname(filePath)) ?? 'application/octet-stream');
          createReadStream(filePath).pipe(res);
        } catch {
          next();
        }
      });
    },
    async writeBundle(options) {
      const outputDir = options.dir ?? fileURLToPath(new URL('./dist', import.meta.url));
      await copyDirectory(vendoredThreeDir, join(outputDir, 'vendor/three'));
    }
  };
}

export default defineConfig({
  base,
  plugins: [vendoredThreeRuntimePlugin()],
  resolve: {
    alias: {
      three: fileURLToPath(new URL('./vendor/three/three.module.js', import.meta.url)),
    },
  },
});
