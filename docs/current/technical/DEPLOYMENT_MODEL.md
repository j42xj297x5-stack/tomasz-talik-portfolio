# Deployment Model

Target: **GitHub Pages** for the repository site.

## Current status — dual-runtime deployment baseline (2026-05-29)

The portfolio now has a documented first working dual-runtime deployment model:

- local development through `npm run dev`,
- production build through `npm run build`,
- public GitHub Pages deployment under `/tomasz-talik-portfolio/`,
- Vite base-aware runtime asset URLs for GLTFLoader, GLB models, PNG backgrounds, and public assets,
- fallback-safe behavior when vendored loader modules or manually managed binary assets are unavailable.

Snapshot reference: `docs/current/audits/snapshots/2026-05-29_19-59-42__snapshot__dual-runtime-github-pages-deployment.md`.

## Commands

- Local development: `npm run dev`
- Production build: `npm run build`
- Local production preview: `npm run preview`

Vite is configured with:

```js
base: '/tomasz-talik-portfolio/'
```

That means every runtime URL that points at a public asset must be safe under both local Vite serving and the GitHub Pages repository base path.

## Runtime base path rule

Runtime code should derive browser URLs from `import.meta.env.BASE_URL` through `publicPath(...)` rather than hard-coding root-relative production paths.

Required model:

1. Content/runtime metadata may keep logical public paths such as `/glb/glyph_1.glb` or `/png/ai_guide.png`.
2. Loader code must normalize those logical paths with `publicPath(...)` before dynamic import, GLB load, texture load, or image URL use.
3. The browser-visible result must include the Vite base in both local and GitHub Pages contexts.
4. Runtime URLs must never include the `public/` directory segment.

## Public asset URL rule

Runtime assets live in `public/`, but the browser URL must **not** include the `public` segment.

Examples:

| File on disk | Runtime URL with GitHub Pages base |
| --- | --- |
| `public/glb/monkey.glb` | `/tomasz-talik-portfolio/glb/monkey.glb` |
| `public/png/ai_guide.png` | `/tomasz-talik-portfolio/png/ai_guide.png` |
| `public/png/creative_ai.png` | `/tomasz-talik-portfolio/png/creative_ai.png` |
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

## GLB loading model

GLB model paths are deployment-sensitive public asset paths.

- Central monkey model: logical path `/glb/monkey.glb`.
- Five primary glyph models: logical paths `/glb/glyph_1.glb` through `/glb/glyph_5.glb`.
- AI Guide tree hover model: logical path `/glb/glyph_1-tree.glb`, with fallback to `/glb/glyph_1.glb` where supported by runtime behavior.
- Sun/moon models: logical paths `/glb/sun.glb` and `/glb/moon.glb`.
- Environmental binaries such as stones, shells, and small glyphs also belong under `/glb/` and must be normalized with the same public path logic.

If any `.gltf` file is introduced later and references external `.bin` files or textures, those dependent files must be present under `public/` and referenced without a `public/` browser URL segment.

## Fallback contract

Fallback behavior is required for public deployment resilience:

- if `GLTFLoader` fails to import, the scene must continue without crashing;
- if `/glb/monkey.glb` fails, the central placeholder remains the safe visual fallback;
- if a node glyph GLB fails, the sphere/collider fallback remains available;
- if an optional hover-effect GLB fails, the interactive glyph target remains safe;
- if manually managed GLB/PNG assets are missing, the failure should be visible during QA but should not force unrelated runtime behavior changes.

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

PNG backgrounds and panel assets are also manually managed public assets and must keep exact filename casing, including:

- `public/png/ai_guide.png`
- `public/png/creative_ai.png`

## GitHub Pages workflow

The current workflow is `.github/workflows/deploy.yml`. It:

- runs on pushes to the `porfolio` branch and manual `workflow_dispatch`,
- installs dependencies with `npm ci`,
- builds with `npm run build`,
- uploads `./dist`,
- deploys with the official GitHub Pages actions.

The branch name is intentionally documented as observed. Do not rename it unless the repository's real deployment branch changes.

## Manual deployment QA

For each deployment validation pass:

- run `npm run dev` and confirm the local scene renders;
- run `npm run build` and confirm the production output is generated;
- confirm built URLs and deployed URLs include `/tomasz-talik-portfolio/`;
- confirm no browser request includes `/public/`;
- confirm `GLTFLoader` loads from `/tomasz-talik-portfolio/vendor/three/examples/jsm/loaders/GLTFLoader.js` on GitHub Pages;
- confirm GLB and PNG assets load under `/tomasz-talik-portfolio/glb/...` and `/tomasz-talik-portfolio/png/...`;
- hard-refresh GitHub Pages when validating fixes, because GitHub Pages cache and browser cache can temporarily show stale behavior.
