# Snapshot — First Working Dual-Runtime Deployment

Timestamp: `2026-05-29_19-59-42` UTC

Scope: documentation-only snapshot for the first confirmed runtime model that supports both local Vite development and public GitHub Pages deployment under the repository base path `/tomasz-talik-portfolio/`.

## Executive summary

The portfolio now has a working dual-runtime deployment model:

- local development runs through Vite with `npm run dev`,
- production output is generated with `npm run build`,
- public hosting runs through GitHub Pages under `/tomasz-talik-portfolio/`,
- runtime asset URLs are normalized through the Vite base/public path model,
- vendored Three.js and vendored `GLTFLoader` remain the runtime dependency source,
- GLB models, PNG backgrounds, and other public assets are loaded from browser-safe public URLs that do not include a `public/` segment,
- placeholder and sphere fallbacks remain mandatory when loader or asset resolution fails.

This snapshot records the deployment contract only. It does not authorize changes to runtime code, visuals, scene behavior, content, assets, camera, lighting, or animation.

## What now works

### Local Vite runtime

- `npm run dev` serves the Vite application locally.
- Runtime code can resolve public assets through paths normalized by `publicPath(...)`.
- The Vite dev server can serve vendored Three.js example modules required by `GLTFLoader` through the repository base path.
- Monkey, glyph, sun, moon, shell, stone, small-glyph, and PNG asset references remain compatible with local serving when routed through the public path helper.
- Fallback behavior remains available if a manually managed binary asset is absent or a dynamic loader import fails.

### GitHub Pages runtime

- `npm run build` emits a production bundle for GitHub Pages.
- The deployment target is the repository site base `/tomasz-talik-portfolio/`.
- Public asset URLs resolve with the GitHub Pages base prefix, for example `/tomasz-talik-portfolio/glb/monkey.glb`.
- Vendored Three.js is copied to the production output so dynamic `GLTFLoader` imports can resolve after deployment.
- The GitHub Pages workflow builds `dist` and deploys it with the official Pages actions.

## Final deployment model

| Runtime | Entry command / source | Effective base | Asset URL shape |
| --- | --- | --- | --- |
| Local development | `npm run dev` | `/tomasz-talik-portfolio/` from Vite config | `/tomasz-talik-portfolio/<asset>` |
| Production build | `npm run build` | `/tomasz-talik-portfolio/` from Vite config | files emitted/copied into `dist` |
| GitHub Pages | `.github/workflows/deploy.yml` | `/tomasz-talik-portfolio/` repository site path | `/tomasz-talik-portfolio/<asset>` |

Deployment remains Vite-first and static-hosting-first. The application must not rely on server-side routing or runtime filesystem access. Every runtime asset needed by the browser must be emitted into, copied into, or served from the production output.

## Vite base path model

The Vite configuration uses a fixed repository base:

```js
base: '/tomasz-talik-portfolio/'
```

Runtime code should treat `import.meta.env.BASE_URL` as the source of truth for browser-visible URLs. Code that loads public assets should not hard-code root-relative URLs such as `/glb/monkey.glb` directly into browser fetch/load calls unless that path is first normalized through the public path helper.

Required convention:

1. Keep content metadata readable and logical, for example `/glb/glyph_1.glb` or `/png/ai_guide.png`.
2. Before dynamic loading, normalize the value through `publicPath(...)`.
3. The resulting browser URL includes the Vite base locally and on GitHub Pages.
4. Do not include `public/` in any runtime URL.

## Public asset path model

Public assets are stored under `public/`, but browser URLs are rooted at the deployed site base.

| File on disk | Logical runtime path | GitHub Pages URL |
| --- | --- | --- |
| `public/glb/monkey.glb` | `/glb/monkey.glb` | `/tomasz-talik-portfolio/glb/monkey.glb` |
| `public/glb/glyph_1.glb` | `/glb/glyph_1.glb` | `/tomasz-talik-portfolio/glb/glyph_1.glb` |
| `public/glb/glyph_1-tree.glb` | `/glb/glyph_1-tree.glb` | `/tomasz-talik-portfolio/glb/glyph_1-tree.glb` |
| `public/png/ai_guide.png` | `/png/ai_guide.png` | `/tomasz-talik-portfolio/png/ai_guide.png` |
| `public/png/creative_ai.png` | `/png/creative_ai.png` | `/tomasz-talik-portfolio/png/creative_ai.png` |

Required conventions:

- store static public runtime assets in `public/`,
- reference them in content/runtime metadata without the `public/` segment,
- preserve exact filename casing,
- preserve dependent files if future `.gltf` assets reference external `.bin` or image files,
- treat manually managed binary assets as deployment-critical even when documentation-only changes are being made.

## GLTFLoader loading model

`GLTFLoader` remains vendored with Three.js and is dynamically imported from:

```text
vendor/three/examples/jsm/loaders/GLTFLoader.js
```

The runtime import URL must be built through `publicPath(...)`, producing the GitHub Pages URL:

```text
/tomasz-talik-portfolio/vendor/three/examples/jsm/loaders/GLTFLoader.js
```

The Vite runtime model also depends on:

- a Vite alias mapping bare `three` imports to the vendored module,
- an import map for browser resolution of `three` from the loader module,
- production copying of `vendor/three` into `dist/vendor/three`.

The npm `three` package remains intentionally unused for runtime integration.

## GLB loading model

GLB references are logical public paths normalized at the point of loading.

Current GLB categories include:

- central monkey model: `/glb/monkey.glb`,
- five primary glyphs: `/glb/glyph_1.glb` through `/glb/glyph_5.glb`,
- glyph 1 hover effect model: `/glb/glyph_1-tree.glb`,
- sun and moon models: `/glb/sun.glb`, `/glb/moon.glb`,
- environmental stones, shells, and small glyph assets under `/glb/`.

Expected behavior:

1. Resolve `GLTFLoader` from the vendored public URL.
2. Resolve the target GLB through `publicPath(...)`.
3. Load the GLB asynchronously.
4. On success, attach/position the model according to existing runtime behavior.
5. On failure, keep or restore the existing fallback visual and continue the scene safely.

## Fallback behavior

Fallback behavior is part of the deployment contract, not a temporary convenience.

- If `GLTFLoader` cannot be imported, runtime should continue without crashing.
- If the monkey GLB cannot be loaded, the central placeholder remains visible.
- If a portfolio glyph GLB cannot be loaded, the node sphere/collider remains available.
- If the glyph 1 tree hover effect model cannot be loaded, the hover effect degrades safely and the primary glyph remains the interaction target.
- If sun/moon GLBs cannot be loaded, debug/fallback markers or safe non-crashing behavior should preserve the broader scene.
- Fallback visuals must not replace the raycast/click contract unless an explicit future decision changes that model.

## Manual QA checklist

Use this checklist when validating the dual-runtime deployment:

### Local Vite

- [ ] Run `npm run dev`.
- [ ] Open the local Vite URL shown by the terminal.
- [ ] Confirm the scene renders without a blank page.
- [ ] Confirm the browser console shows no failed dynamic import for `GLTFLoader`.
- [ ] Confirm `/glb/monkey.glb` resolves through the Vite base URL.
- [ ] Confirm all five glyph nodes remain visible and interactive.
- [ ] Confirm the AI Guide tree hover effect either loads or degrades safely.
- [ ] Confirm PNG-backed panels/backgrounds resolve without `404` responses.

### Production build / preview

- [ ] Run `npm run build`.
- [ ] Optionally run `npm run preview`.
- [ ] Confirm built asset URLs include `/tomasz-talik-portfolio/`.
- [ ] Confirm `dist/vendor/three/examples/jsm/loaders/GLTFLoader.js` exists after build.
- [ ] Confirm public GLB and PNG assets are present in the production output.

### GitHub Pages

- [ ] Open the GitHub Pages site at the repository Pages URL.
- [ ] Hard-refresh the page to bypass stale browser cache.
- [ ] Confirm the main JavaScript and CSS assets load with `/tomasz-talik-portfolio/` prefixes.
- [ ] Confirm GLB URLs load with `/tomasz-talik-portfolio/glb/...` prefixes.
- [ ] Confirm PNG URLs load with `/tomasz-talik-portfolio/png/...` prefixes.
- [ ] Confirm no request includes `/public/` in the browser URL.
- [ ] Confirm the scene remains usable if one optional asset fails.

## Remaining risks

- **GitHub Pages cache** — Pages may serve an older artifact briefly after a deploy. Validate after a hard refresh and allow deployment propagation time.
- **Browser cache** — cached JavaScript or previously failed asset requests can make a fixed deployment look broken. Use a hard refresh or a clean browser profile during validation.
- **Case-sensitive filenames** — GitHub Pages is case-sensitive. Asset references must match exact on-disk casing for `.glb`, `.png`, vendored loader modules, and utility modules.
- **Large GLB size** — large binary models can delay first meaningful scene readiness, especially on mobile or slower networks. Compression and staged loading remain future optimization candidates.
- **Missing manually managed binary assets** — GLB/PNG assets are deployment-critical. Documentation-only or code-only changes must not assume missing binaries will be generated automatically.

## Suggested next steps

1. Add a repeatable release QA note for GitHub Pages deploy verification.
2. Consider a lightweight asset inventory script that checks required public GLB/PNG files and exact casing before deployment.
3. Consider size tracking for large GLBs to catch accidental binary growth.
4. Keep future runtime changes constrained to the existing `publicPath(...)` and vendored `GLTFLoader` conventions unless a new deployment decision supersedes this snapshot.
5. Capture a post-deploy browser screenshot only when a future change visibly changes the runnable web application.

## Files updated by this snapshot set

- Created: `docs/current/audits/snapshots/2026-05-29_19-59-42__snapshot__dual-runtime-github-pages-deployment.md`
- Updated: `docs/current/technical/DEPLOYMENT_MODEL.md`
- Updated: `docs/current/technical/FRONTEND_RUNTIME_MODEL.md`
- Updated: `docs/current/maps/PROJECT_INDEX.md`
- Updated: `docs/current/maps/DEPENDENCY_MAP.md`
- Updated: `docs/current/decisions/DECISION_LOG.md`

## Explicit non-goals

This snapshot did not change and should not be used to change:

- runtime code,
- visuals,
- scene behavior,
- content/copy,
- assets,
- camera behavior,
- lighting,
- animation.
