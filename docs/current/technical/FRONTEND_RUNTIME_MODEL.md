# Frontend Runtime Model

Current runtime: Vite + Vanilla JavaScript modules + vendored Three.js for Experience 3D, plus a lightweight HTML/CSS/vanilla JS Classic 2D MVP.

Layers:
1. Scene layer (`src/scene/*`) — renderer, camera drift, lighting, particles, central placeholder object, interactive orbit nodes.
2. Interaction bridge (`src/scene/raycaster.js`) — pointer raycast selection and hover/click targeting.
3. Overlay UI layer (`src/ui/*` + `src/styles/main.css`) — readable HTML hover label + overlay detail panel.
4. Content layer (`src/content/portfolioNodes.js`) — draft node content model.

## Implemented entry shell and conditional Experience 3D boot baseline

Status: implemented baseline as of 2026-06-02. The entry shell is no longer documentation-only or only planned.

The active frontend runtime now starts with a lightweight vanilla-JavaScript entry layer before the heavy Three.js runtime:

1. Entry shell / pre-runtime UI (`src/main.js`) — first visible UI, loaded before Experience 3D assets.
2. Language state (`src/main.js`) — stores either `Polski` or `English` for the entry flow.
3. Mode state (`src/main.js`) — stores either `Classic 2D` / `Klasyczne 2D` or `Experience 3D` / `Doświadczenie 3D`.
4. Conditional runtime boot:
   - `Classic 2D` branch — starts the implemented lightweight flat portfolio experience in `src/classic2d.js` with a back flow to mode selection.
   - `Experience 3D` branch — dynamically imports `src/experience3d.js`, where the current Three.js runtime starts, loader runs, assets load, and existing scene behavior continues.

Ownership model:
- `src/main.js` owns entry shell orchestration, simple frontend state, optional `localStorage` persistence, language selection, mode selection, Classic 2D startup routing, and conditional Experience 3D import.
- `src/classic2d.js` owns the current Classic 2D lightweight flat portfolio experience: central monkey PNG, five floating glyph hotspots, shared-content project panels, close/back flow, and image fallback hooks.
- `src/experience3d.js` owns the current Experience 3D runtime bootstrap: canvas shell, renderer, scene wiring, loader diagnostics, asset preload stages, glyphs, panels, camera/input, debug tooling, and animation loop.
- The current deployment/public-path rules remain unchanged. Runtime public assets still resolve through the existing Vite base-aware model; the entry shell implementation does not change Vite config, GitHub Pages base path, assets, content, or package files.

Loading rule: heavy 3D assets start only after the visitor selects `Experience 3D` / `Doświadczenie 3D`. They are not eagerly loaded by the initial language-selection screen, the mode-selection screen, or the Classic 2D branch.

## Checkpoint update — Classic 2D MVP with floating glyph hotspots (2026-06-03)

- `src/classic2d.js` owns the lightweight Classic 2D experience in the current implementation.
- `src/main.js` routes the selected mode to either Classic 2D startup or conditional Experience 3D dynamic import.
- `src/experience3d.js` remains the Experience 3D runtime bootstrap and is unchanged by the Classic 2D MVP documentation baseline.
- Classic 2D uses HTML/CSS/vanilla JavaScript and consumes shared records from `src/content/portfolioNodes.js`.
- Classic 2D uses logical public PNG paths for the central monkey and flat glyph sprites; browser/runtime paths must not include `public/`.
- Classic 2D hotspot styling is CSS-owned in `src/styles/main.css`: floating transparent controls, soft halo/glow, glyph-only lift/scale, brighter text, and responsive/reduced-motion handling.
- No Three.js dependency should be introduced into Classic 2D unless a later explicit decision changes that boundary.
- Ring/orbital outline effects and full retro-polish are deferred.
- Snapshot reference: `docs/current/audits/snapshots/2026-06-03_17-29-26__snapshot__classic-2d-floating-glyph-hotspots.md`.

## MVP runtime status (2026-05-22)
- Monkey runtime loader now successfully resolves `/glb/monkey.glb` locally and keeps placeholder fallback if GLTFLoader or asset loading fails.
- GLTFLoader import target is vendored: `vendor/three/examples/jsm/loaders/GLTFLoader.js` (if present).
- Three.js npm package remains intentionally unused.
- `index.html` mounts `src/main.js` via Vite.
- `src/main.js` now orchestrates the entry shell; `src/experience3d.js` owns the Experience 3D bootstrap.
- First interactive Three.js MVP scene is implemented and now starts conditionally after Experience 3D selection.
- Three.js imports are centralized through `src/vendor/three.js`, which re-exports `vendor/three/three.module.js`.
- Overlay copy is intentionally draft-only.
- Mobile fallback notice is present; scene remains desktop-first.

## Deferred implementation
- Final meditating monkey GLB asset.
- Post-MVP snapshot pass and minor interaction polish.
- Final branded copy/content.

- Vendored Three.js baseline is `r184`; GLTFLoader must also be sourced from `r184` only.
- Required loader file path: `vendor/three/examples/jsm/loaders/GLTFLoader.js`.
- Runtime monkey asset URL: `/glb/monkey.glb` (local file: `public/glb/monkey.glb`, manually managed binary).
- Placeholder fallback is mandatory when loader or GLB is unavailable.
- npm `three` dependency remains intentionally unused in runtime integration.

- GLTFLoader r184 is vendored at `vendor/three/examples/jsm/loaders/GLTFLoader.js`.
- Required GLTFLoader utilities are vendored at `vendor/three/examples/jsm/utils/BufferGeometryUtils.js` and `vendor/three/examples/jsm/utils/SkeletonUtils.js`.
- Vite resolve alias maps bare `three` imports to local vendored module `vendor/three/three.module.js` via `vite.config.js`.
- Camera interaction layer now combines raycast input with a mouse-driven orbital camera rig around the monkey pivot while keeping Vanilla JS modules.
- Orbit constants are explicit and configurable (`MAX_YAW_DEG = 45`, `MAX_PITCH_DEG = 30`) with damping-based smoothing.
- Camera always resolves position from orbit math and continuously `lookAt`s the monkey pivot.
- Mobile/touch behavior remains fallback-safe: no complex gesture controls added, neutral/idle drift remains available.

## Milestone status — monkey + five glyph runtime baseline
- Vite + Vanilla JS runtime baseline is stable locally with vendored Three.js r184 and vendored GLTFLoader r184.
- Vite alias continues resolving bare `three` imports to `vendor/three/three.module.js`; npm `three` remains unused.
- Monkey and all five node glyph assets are now integrated in runtime with fallback-safe behavior.
- Camera interaction model is mouse-driven orbital movement around monkey pivot with constrained yaw/pitch and no OrbitControls dependency.
- Milestone snapshot: `docs/current/audits/snapshots/2026-05-22_15-38-35__snapshot__monkey-five-glyphs-runtime-baseline.md`.


## Checkpoint update — glyph_1 tree hover baseline (2026-05-22)
- First glyph (`AI Guide`) now uses accepted hover-effect baseline based on `/glb/glyph_1-tree.glb` visual effect runtime (with fallback to `/glb/glyph_1.glb` for safe degradation).
- Hover lifecycle baseline is explicit: enter => reveal-in + glow-up, active => sustain + orbit light, leave/off-canvas => fade-out + cursor reset + clean re-entry readiness.
- Raycast/click contract is unchanged: only glyph node collider stays interactive; tree effect visuals (mesh/shader reveal helpers/light) are non-interactive.
- Technical snapshot reference: `docs/current/audits/snapshots/2026-05-22_18-18-33__snapshot__glyph-1-tree-effect-baseline.md`.

## Checkpoint update — dual-runtime Vite + GitHub Pages baseline (2026-05-29)

- The same frontend runtime now supports local Vite development, production builds, and GitHub Pages deployment under `/tomasz-talik-portfolio/`.
- Runtime public asset URLs must be normalized through the Vite base-aware `publicPath(...)` helper before dynamic imports or asset loads.
- Logical content/model paths may remain readable (`/glb/...`, `/png/...`), but browser URLs must resolve with `import.meta.env.BASE_URL` and must not include `public/`.
- GLTFLoader remains dynamically imported from the vendored r184 path `vendor/three/examples/jsm/loaders/GLTFLoader.js` through the same public path model.
- GLB model loading now has a documented deployment contract for central monkey, five glyphs, AI Guide tree hover effect, sun/moon, stones, shells, and small glyph binaries.
- PNG-backed UI/panel assets follow the same public asset convention as GLB assets.
- Fallback behavior remains part of the runtime model: monkey placeholder, node sphere/collider fallback, hover-effect degradation, and loader failure safety are mandatory.
- Known deployment risks are GitHub Pages cache, browser cache, case-sensitive filenames, large GLB payloads, and missing manually managed binary assets.
- Milestone snapshot: `docs/current/audits/snapshots/2026-05-29_19-59-42__snapshot__dual-runtime-github-pages-deployment.md`.

## Checkpoint update — mobile glyph panels baseline (2026-06-02)
- Mobile glyph panels for the five portfolio gates are now documented as a closed readability/theming baseline.
- The overlay remains an HTML/CSS layer above the Three.js scene; panel readability is handled in `src/styles/main.css` and `src/ui/overlay.js`, not in Three.js.
- Mobile panel themes use stable `data-panel-theme` values so CSS can style `ai-guide`, `creative-ai`, `ethics`, `spotify-digger`, and `haiku-cosmos` without depending on legacy desktop class names.
- Text/readability and panel contrast are CSS responsibilities and must not depend on Three.js scene visibility behind the overlay.
- Mobile panels must not add extra text overlays, glass layers, `backdrop-filter`, or pseudo-element backgrounds.
- Layering contract: opaque panel background first, SVG frame above it, optional ornament above the frame, and text/controls at the highest readable layer.
- Snapshot reference: `docs/current/audits/snapshots/2026-06-02_17-36-03__snapshot__mobile-glyph-panels-baseline.md`.

## Checkpoint update — unified Experience 3D glyph panels (2026-07-20)
- All five Experience 3D overlays now use the same opaque CSS-gradient panel contract on desktop and mobile; readability never depends on the visible Three.js scene.
- The shared panel is inset by approximately 10px (`calc(100vw - 20px)` and `calc(100dvh - 20px)`, with a `100vh` fallback), uses the existing eight-piece resize-aware SVG frame, and preserves visible frame overflow.
- `overlay.js` renders the existing per-node ornament at the top frame centre for every viewport. The content layer sits above it, remains internally scrollable, and is centred with a maximum width of 1200px.
- The five legacy vertical raster panel backgrounds have been removed from runtime preload and rendering; this does not affect Classic 2D.
