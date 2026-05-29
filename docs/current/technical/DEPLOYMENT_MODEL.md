# Deployment Model

Target: **GitHub Pages** for the repository site.

## Commands

- Local development: `npm run dev`
- Production build: `npm run build`
- Local production preview: `npm run preview`

Vite is configured with:

```js
base: '/tomasz-talik-portfolio/'
```

That means every runtime URL that points at a public asset must be safe under both local Vite serving and the GitHub Pages repository base path.

## Public asset URL rule

Runtime assets live in `public/`, but the browser URL must **not** include the `public` segment.

Examples:

| File on disk | Runtime URL with GitHub Pages base |
| --- | --- |
| `public/glb/monkey.glb` | `/tomasz-talik-portfolio/glb/monkey.glb` |
| `public/png/ai_guide.png` | `/tomasz-talik-portfolio/png/ai_guide.png` |
| `public/glb/glyph_1-tree.glb` | `/tomasz-talik-portfolio/glb/glyph_1-tree.glb` |

JavaScript runtime loaders should build URLs through `publicPath(...)`, which is based on `import.meta.env.BASE_URL`. Keep content metadata as logical public paths (for example `/glb/glyph_1.glb`) only if the renderer normalizes them with this helper before loading.

## Vendored Three.js and GLTFLoader

Three.js r184 is vendored under `vendor/three` and remains intentionally separate from the npm `three` package. Runtime must not switch to npm `three` or a CDN.

`GLTFLoader` is loaded from the vendored path:

```text
vendor/three/examples/jsm/loaders/GLTFLoader.js
```

The final browser URL is built with `publicPath('vendor/three/examples/jsm/loaders/GLTFLoader.js')`, so on GitHub Pages it resolves to:

```text
/tomasz-talik-portfolio/vendor/three/examples/jsm/loaders/GLTFLoader.js
```

The Vite config injects an import map for the loader's bare `three` import and copies `vendor/three` into `dist/vendor/three` during production builds.

## Manually managed binary assets

The following binary assets are expected to be present and tracked under `public/glb/`:

- `public/glb/monkey.glb`
- `public/glb/glyph_1.glb`
- `public/glb/glyph_2.glb`
- `public/glb/glyph_3.glb`
- `public/glb/glyph_4.glb`
- `public/glb/glyph_5.glb`
- `public/glb/glyph_1-tree.glb`
- `public/glb/sun.glb`
- `public/glb/moon.glb`
- `public/glb/stone_01.glb` through `public/glb/stone_06.glb`
- `public/glb/shell_01.glb` through `public/glb/shell_06.glb`
- `public/glb/small_glyph_01.glb` through `public/glb/small_glyph_06.glb`

If future `.gltf` files reference external `.bin` files or texture images, place those dependent files under `public/` as well and reference them without a `public/` URL segment.

## GitHub Pages workflow

The current workflow is `.github/workflows/deploy.yml`. It:

- runs on pushes to the `porfolio` branch and manual `workflow_dispatch`,
- installs dependencies with `npm ci`,
- builds with `npm run build`,
- uploads `./dist`,
- deploys with the official GitHub Pages actions.

The branch name is intentionally documented as observed. Do not rename it unless the repository's real deployment branch changes.
