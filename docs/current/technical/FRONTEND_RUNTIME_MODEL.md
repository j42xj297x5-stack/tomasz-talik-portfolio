# Frontend Runtime Model

Current runtime: Vite + Vanilla JavaScript modules + vendored Three.js.

Layers:
1. Scene layer (`src/scene/*`) — renderer, camera drift, lighting, particles, central placeholder object, interactive orbit nodes.
2. Interaction bridge (`src/scene/raycaster.js`) — pointer raycast selection and hover/click targeting.
3. Overlay UI layer (`src/ui/*` + `src/styles/main.css`) — readable HTML hover label + overlay detail panel.
4. Content layer (`src/content/portfolioNodes.js`) — draft node content model.

## Planned pre-runtime entry shell (documentation-only)

Future direction adds a lightweight layer before the current Three.js runtime:

1. Entry shell / pre-runtime UI — the first visible UI, loaded before heavy 3D assets.
2. Language state — stores either `Polski` or `English` for the current visit.
3. Mode state — stores either `Classic 2D` / `Klasyczne 2D` or `Experience 3D` / `Doświadczenie 3D`.
4. Conditional runtime boot:
   - `Classic 2D` boot — future lightweight, flat, symbolic UI path that should avoid Three.js unless a later decision changes that.
   - `Experience 3D` boot — current Three.js runtime starts, loader runs, assets load, and existing scene behavior continues.

Status of this layer: planned / documentation-only. The active implemented runtime remains the current Three.js experience described below. No runtime code, CSS, assets, Vite config, public-path rules, or deployment rules are changed by this document update.

Planned loading rule: heavy 3D assets should eventually load only after the visitor selects `Experience 3D`; they should not be eagerly loaded by the entry shell or by `Classic 2D`. GitHub Pages compatibility and the existing base-path/public asset model must remain unchanged.

## MVP runtime status (2026-05-22)
- Monkey runtime loader now successfully resolves `/glb/monkey.glb` locally and keeps placeholder fallback if GLTFLoader or asset loading fails.
- GLTFLoader import target is vendored: `vendor/three/examples/jsm/loaders/GLTFLoader.js` (if present).
- Three.js npm package remains intentionally unused.
- `index.html` mounts `src/main.js` via Vite.
- First interactive Three.js MVP scene is implemented.
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
