# Dependency Map

## High-level flow
Concept docs -> Technical model -> Runtime implementation -> Decision updates -> Future polish/model integration

## Detailed dependency graph
- `concept/CONCEPT_AND_ROADMAP.md`
  - informs `technical/ARCHITECTURE.md`
  - informs `concept/INTERACTION_MODEL.md`
  - informs `concept/VISUAL_DIRECTION.md`
- `technical/ARCHITECTURE.md`
  - informs runtime module boundaries in `src/scene`, `src/ui`, `src/content`
- `technical/FRONTEND_RUNTIME_MODEL.md`
  - defines current layered runtime and vendored Three.js bridge
- `technical/THREE_SCENE_MODEL.md`
  - maps scene responsibilities to concrete modules
- `technical/CONTENT_MODEL.md`
  - defines gate metadata used by orbit nodes and overlays
- `technical/GLYPH_HOVER_EFFECTS_MODEL.md`
  - defines the canonical five-glyph hover-effects language (element mapping, motion symbolism, consistency rules, and implementation order) for visual polish stages

## Runtime status dependency
- Monkey model loading depends on the vendored GLTFLoader module path `vendor/three/examples/jsm/loaders/GLTFLoader.js` and asset path `/glb/monkey.glb`.
- Placeholder fallback remains a required runtime dependency when loader/asset resolution fails.
- MVP scene exists with placeholder center object and five interactive gates.
- Scene content depends on `src/content/portfolioNodes.js` (including per-node optional glyph metadata such as AI Guide `/glb/glyph_1.glb`, DIG Engine `/glb/glyph_4.glb`, Creative AI `/glb/glyph_2.glb`, Ethics / Life Protection `/glb/glyph_3.glb`, and Haiku Cosmos `/glb/glyph_5.glb`).
- UI overlay/hover depends on node metadata and raycast picking.
- Next dependency step: visual refinement and replacement of placeholder center with a real GLB meditating monkey asset.

- Vendored Three.js baseline is `r184`; GLTFLoader must also be sourced from `r184` only.
- Required loader file path: `vendor/three/examples/jsm/loaders/GLTFLoader.js`.
- Runtime monkey asset URL: `/glb/monkey.glb` (local file: `public/glb/monkey.glb`, manually managed binary).
- Placeholder fallback is mandatory when loader or GLB is unavailable.
- npm `three` dependency remains intentionally unused in runtime integration.

- GLTFLoader r184 is vendored at `vendor/three/examples/jsm/loaders/GLTFLoader.js`.
- Required GLTFLoader utilities are vendored at `vendor/three/examples/jsm/utils/BufferGeometryUtils.js` and `vendor/three/examples/jsm/utils/SkeletonUtils.js`.
- Vite resolve alias maps bare `three` imports to local vendored module `vendor/three/three.module.js` via `vite.config.js`.

## Milestone dependency status — monkey + five glyph baseline
- Runtime scene baseline now depends on one central monkey GLB (`/glb/monkey.glb`) and five content-mapped glyph GLBs (`/glb/glyph_1.glb` … `/glb/glyph_5.glb`).
- Content metadata (`modelPath`) is the source of truth for glyph binding per portfolio node.
- Fallback dependencies remain mandatory: monkey placeholder fallback and per-node sphere collider fallback.
- Visual polish (scale/orientation/lighting tuning) remains a separate, downstream dependency phase.

## Dual-runtime deployment dependency status (2026-05-29)

- Deployment now depends on Vite's configured base path `/tomasz-talik-portfolio/` being consistently applied to runtime asset URLs.
- Runtime asset loading depends on `src/utils/publicPath.js` normalizing logical public paths before GLTFLoader dynamic imports, GLB model loads, and PNG/public asset references.
- GitHub Pages runtime depends on `vendor/three` being copied into production output so `vendor/three/examples/jsm/loaders/GLTFLoader.js` can load from the deployed base path.
- Public GLB and PNG assets depend on exact filename casing because GitHub Pages is case-sensitive.
- Local development, production preview, and GitHub Pages should share the same logical asset conventions: files live under `public/`, browser URLs omit `public/`, and final URLs include the Vite base.
- Remaining operational dependencies include GitHub Pages cache invalidation, browser cache checks, GLB size monitoring, and verification that manually managed binary assets are present before deployment.
- Snapshot reference: `docs/current/audits/snapshots/2026-05-29_19-59-42__snapshot__dual-runtime-github-pages-deployment.md`.

## Classic 2D MVP dependency status (2026-06-03)

- `src/main.js` depends on `src/classic2d.js` for the Classic 2D branch and on dynamic import of `src/experience3d.js` for Experience 3D.
- `src/classic2d.js` depends on `src/content/portfolioNodes.js` so Classic 2D panels use the same shared portfolio records as the 3D overlay model.
- Classic 2D depends on PNG assets under `public/png`, referenced at runtime as logical public paths: `/png/monkey_small.png`, `/png/glif_ai_guide.png`, `/png/glif_dig_engine.png`, `/png/glif_haiku_cosmos.png`, `/png/glif_creative_ai.png`, and `/png/glif_ethics.png`.
- Classic 2D depends on `src/styles/main.css` for layout, floating hotspot positioning, hover/focus halo and glow, crisp text behavior, responsive behavior, and reduced-motion transition handling.
- Experience 3D remains separate and unchanged; it continues to depend on the existing Three.js, GLB, scene, loader, overlay, and deployment-safe public-path contracts.
- Future Classic 2D polish may depend on a dedicated visual contract or snapshot before adding larger retro effects.
- Future polish should preserve shared content usage and should not reintroduce persistent heavy card/tile gate visuals unless a later decision explicitly accepts that change.

## Galaxy sprite dependency status (2026-05-29)
- `src/main.js` depends on `src/scene/galaxySprites.js` for the distant background galaxy layer and keeps it outside orbit-node/raycast ownership.
- `src/scene/galaxySprites.js` depends on `src/utils/publicPath.js` to resolve `/png/galaxy_01.png` through `/png/galaxy_05.png` under both local Vite and GitHub Pages base-path runtimes.
- The layer depends on manually supplied transparent PNG assets in `public/png/` and must degrade to warnings/empty sprites when those files are absent.


## Current runtime baseline dependency status (2026-05-30)
- `src/main.js` now depends on current runtime services for galaxy sprite updates, atmosphere progression multipliers, loader diagnostics, debug settings import/export, base-aware public asset paths, and mobile pointer/orientation handling.
- Galaxy sprite textures depend on logical `/png/galaxy_*.png` config paths resolved through `src/utils/publicPath.js` for local Vite and GitHub Pages compatibility.
- Atmosphere visibility now depends on progression multipliers layered over debug opacity/visibility settings rather than replacing those debug values.
- Loader readiness depends on `src/assets/assetManifest.js`, `src/assets/preloadAssets.js`, `src/assets/assetManager.js`, and `src/ui/loaderOverlay.js` for staged asset groups, byte/count diagnostics, cache hydration, and critical-failure blocking.
- Mobile input correctness depends on Pointer Events, canvas-bound raycaster/camera coordinate normalization, centralized resize/orientation handling, and CSS pointer-event hardening.
- Open dependency risk: loader performance on mobile may need stricter staging (`criticalInitial` / `deferredWarm` / `optionalLate`) and concurrency limits.
- Snapshot reference: `docs/current/audits/snapshots/2026-05-30_07-10-52__snapshot__galaxy-progress-loader-mobile-runtime.md`.

## Mobile glyph panel dependency status (2026-06-02)
- Mobile panel readability depends on `src/styles/main.css` and `src/ui/overlay.js`.
- `data-panel-theme` is now the stable mobile theming contract for five glyph panels.
- Mobile panel backgrounds/contrast are CSS/UI dependencies and must not depend on Three.js scene visibility.
- Desktop panel background behavior and mobile panel background behavior must remain separated.
- Snapshot reference: `docs/current/audits/snapshots/2026-06-02_17-36-03__snapshot__mobile-glyph-panels-baseline.md`.


## Implemented entry shell and dual-mode dependency status (2026-06-02)

- Concept docs (`concept/CONCEPT_AND_ROADMAP.md`, `concept/INTERACTION_MODEL.md`, and visual tone documents when needed) inform `technical/ENTRY_FLOW_AND_MODES_MODEL.md`.
- `technical/ENTRY_FLOW_AND_MODES_MODEL.md` now informs the implemented entry shell baseline in `technical/FRONTEND_RUNTIME_MODEL.md`; Classic 2D MVP implementation and future content work remain downstream dependencies.
- `src/main.js` depends on entry shell state and mode selection for language choice, mode choice, optional persistence, Classic 2D startup, and conditional Experience 3D launch.
- `src/experience3d.js` depends on the existing 3D runtime modules for scene creation, lights, monkey/glyph loading, overlays, panels, camera/input, atmosphere progression, galaxy sprites, asset preloading, diagnostics, and debug tooling.
- Experience 3D boot depends on selecting `Experience 3D` / `Doświadczenie 3D`; the initial entry shell and Classic 2D branch must not eagerly start the 3D runtime.
- Classic 2D currently depends on `src/classic2d.js`, shared `src/content/portfolioNodes.js` records, flat public PNG assets, and `src/styles/main.css`.
- Future Classic 2D polish should continue to depend on shared content records, stable gate IDs, and lightweight UI assets rather than the current Three.js scene unless a later explicit decision changes that.
- `technical/CONTENT_MODEL.md` informs both future `Classic 2D` and current/future `Experience 3D` content rendering.
- The current Vite/GitHub Pages base-path and public asset rules remain dependencies for any implementation path.
- Snapshot reference: `docs/current/audits/snapshots/2026-06-02_18-18-09__snapshot__entry-shell-conditional-3d-boot.md`.
