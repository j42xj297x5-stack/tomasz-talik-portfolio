# Project Documentation Index

Status: canonical architect entrypoint.
Purpose: route humans and Codex to the smallest relevant documentation/runtime file pack for the task at hand.

## Purpose

Use this document first when planning architecture, runtime, deployment, content, or documentation work. Its job is to prevent future sessions from reading the whole documentation tree by selecting the minimum useful file pack for each task type.

For Codex sessions:
- Start here before opening additional documentation.
- Pick the task route that best matches the request.
- Open only the files listed under **read first** unless the task requires deeper evidence.
- Treat snapshots as evidence, not default context.
- Do not scan `docs/current` recursively.

## Current runtime baseline

The current known runtime baseline includes:
- central monkey GLB with placeholder/fallback behavior
- five orbiting portfolio gates
- hover labels / click overlay panels
- sun/moon orbit lighting
- atmosphere progression
- galaxy sprite layer
- loading diagnostics
- debug settings import/export
- deployment-safe public asset paths
- mobile pointer/orientation/input handling
- implemented language/mode entry shell with conditional Experience 3D boot
- implemented Classic 2D MVP as a lightweight flat portfolio path
- Classic 2D central monkey PNG (`/png/monkey_small.png`)
- five Classic 2D floating glyph hotspots using flat PNG sprites
- Classic 2D readable project panels using shared `src/content/portfolioNodes.js` records

Open follow-ups remain listed in [Known open topics / next audit targets](#known-open-topics--next-audit-targets).

## Read-this-first minimal pack

For most architecture/runtime tasks, start with only this pack:
- `docs/current/maps/PROJECT_INDEX.md`
- `docs/current/maps/DEPENDENCY_MAP.md`
- `src/main.js`
- `src/experience3d.js`
- `docs/current/technical/FRONTEND_RUNTIME_MODEL.md`
- `docs/current/technical/THREE_SCENE_MODEL.md`

Do not read the whole `docs/current` tree by default.

## Task-based routing table

| Task type | Read first | Read only if needed | Do not read by default | Likely runtime files | Likely documentation files |
| --- | --- | --- | --- | --- | --- |
| Scene/bootstrap/runtime wiring | `src/main.js`; `docs/current/technical/ARCHITECTURE.md`; `docs/current/technical/THREE_SCENE_MODEL.md` | Specific imported modules from `src/scene/*`, `src/ui/*`, or `src/content/portfolioNodes.js` | Concept docs; old snapshots; glyph effect docs unless glyph behavior is touched | `src/main.js`; `src/scene/*`; `src/ui/*`; `src/content/portfolioNodes.js` | `docs/current/technical/ARCHITECTURE.md`; `docs/current/technical/THREE_SCENE_MODEL.md`; `docs/current/maps/DEPENDENCY_MAP.md` |
| Galaxy sprites | `src/scene/galaxySprites.js`; `src/utils/publicPath.js`; `src/main.js`; latest galaxy/progression/mobile snapshot | `docs/current/technical/FRONTEND_RUNTIME_MODEL.md`; `docs/current/technical/DEPLOYMENT_MODEL.md` | `CONTENT_MODEL`; `GLYPH_HOVER_EFFECTS_MODEL`; concept/roadmap docs | `src/scene/galaxySprites.js`; `src/utils/publicPath.js`; `src/main.js`; `public/png/galaxy_01.png` through `public/png/galaxy_05.png` | `docs/current/audits/snapshots/2026-05-30_07-10-52__snapshot__galaxy-progress-loader-mobile-runtime.md`; `docs/current/technical/FRONTEND_RUNTIME_MODEL.md`; `docs/current/technical/DEPLOYMENT_MODEL.md` |
| Deployment / public assets / GitHub Pages | `vite.config.js`; `src/utils/publicPath.js`; `docs/current/technical/DEPLOYMENT_MODEL.md`; `docs/current/technical/FRONTEND_RUNTIME_MODEL.md` | `index.html`; `src/main.js`; latest deployment snapshot | Scene effect docs; content docs; concept docs | `vite.config.js`; `index.html`; `src/utils/publicPath.js`; `src/main.js`; `public/glb/monkey.glb`; `public/png/*` | `docs/current/technical/DEPLOYMENT_MODEL.md`; `docs/current/technical/FRONTEND_RUNTIME_MODEL.md`; `docs/current/audits/snapshots/2026-05-29_19-59-42__snapshot__dual-runtime-github-pages-deployment.md` |
| Mobile input/orientation | `src/main.js`; relevant input/camera modules discovered from imports; latest galaxy/progression/loader/mobile snapshot | `docs/current/technical/FRONTEND_RUNTIME_MODEL.md`; `docs/current/technical/THREE_SCENE_MODEL.md` | Deployment docs unless path/build issue appears; content/copy docs | `src/main.js`; relevant `src/scene/*` camera/input modules; relevant `src/ui/*` modules | `docs/current/audits/snapshots/2026-05-30_07-10-52__snapshot__galaxy-progress-loader-mobile-runtime.md`; `docs/current/technical/FRONTEND_RUNTIME_MODEL.md`; `docs/current/technical/THREE_SCENE_MODEL.md` |
| Overlay/content panels | `src/ui/*`; `src/content/portfolioNodes.js`; `src/styles/main.css`; `docs/current/technical/CONTENT_MODEL.md` | `src/main.js`; concept docs for tone only | Deployment docs; galaxy sprite docs; loader snapshots | `src/ui/*`; `src/content/portfolioNodes.js`; `src/styles/main.css`; `src/main.js` | `docs/current/technical/CONTENT_MODEL.md`; source concept document only if changing meaning/tone |
| Glyph hover/effects | `docs/current/technical/GLYPH_HOVER_EFFECTS_MODEL.md`; `src/main.js`; relevant glyph/hover/effect modules discovered from imports | Glyph effect snapshots | Deployment docs; content docs; concept docs | `src/main.js`; relevant `src/scene/*` glyph/effect modules; relevant `src/ui/*` hover label modules | `docs/current/technical/GLYPH_HOVER_EFFECTS_MODEL.md`; `docs/current/audits/snapshots/2026-05-22_18-18-33__snapshot__glyph-1-tree-effect-baseline.md` |
| Progression/loading performance | `src/main.js`; modules responsible for staged/progression config discovered from imports; latest galaxy/progression/loader/mobile snapshot | `docs/current/technical/FRONTEND_RUNTIME_MODEL.md`; `docs/current/technical/THREE_SCENE_MODEL.md`; `docs/current/technical/DEPLOYMENT_MODEL.md` | Content model; concept docs; old baseline snapshots | `src/main.js`; loader/progression modules discovered from imports; `src/scene/monkeyModel.js`; `src/scene/galaxySprites.js`; `src/utils/publicPath.js` | `docs/current/audits/snapshots/2026-05-30_07-10-52__snapshot__galaxy-progress-loader-mobile-runtime.md`; `docs/current/technical/FRONTEND_RUNTIME_MODEL.md`; `docs/current/technical/THREE_SCENE_MODEL.md`; `docs/current/technical/DEPLOYMENT_MODEL.md` |
| Documentation snapshot | `docs/current/maps/PROJECT_INDEX.md`; `docs/current/maps/DEPENDENCY_MAP.md`; `docs/current/decisions/DECISION_LOG.md`; most recent relevant snapshot | Technical doc directly affected by the snapshot | All snapshots; all technical docs; legacy docs | Only runtime files directly referenced by the snapshot/audit | `docs/current/maps/PROJECT_INDEX.md`; `docs/current/maps/DEPENDENCY_MAP.md`; `docs/current/decisions/DECISION_LOG.md`; relevant file under `docs/current/audits/snapshots/` |
| Visual/concept/copy | `docs/current/technical/CONTENT_MODEL.md`; source concept document only if copy/meaning is being changed; `src/content/portfolioNodes.js` | Visual direction notes; interaction model notes | Deployment docs; runtime loader docs; galaxy sprite code | `src/content/portfolioNodes.js`; `src/ui/*`; `src/styles/main.css` | `docs/current/technical/CONTENT_MODEL.md`; relevant concept/visual direction doc only when changing copy, meaning, or visual language |

## Canonical docs by category

### Core hubs
- `docs/README.md` — top-level documentation entrypoint.
- `docs/current/README.md` — active documentation hub.

### Maps
- `docs/current/maps/PROJECT_INDEX.md` — this architect/Codex routing guide.
- `docs/current/maps/DOCUMENTATION_MAP.md` — where each doc type belongs.
- `docs/current/maps/DEPENDENCY_MAP.md` — high-level dependency graph.

### Technical docs
- `docs/current/technical/README.md` — technical section overview.
- `docs/current/technical/ARCHITECTURE.md` — implemented runtime module structure.
- `docs/current/technical/ENTRY_FLOW_AND_MODES_MODEL.md` — language/mode entry flow and dual Classic 2D / Experience 3D contract; Classic 2D is now an implemented MVP with central monkey, floating glyph hotspots, and readable panels.
- `docs/current/technical/FRONTEND_RUNTIME_MODEL.md` — runtime layering, implemented entry shell baseline, conditional Experience 3D boot, vendored Three.js import policy, and Vite/GitHub Pages dual-runtime asset model.
- `docs/current/technical/THREE_SCENE_MODEL.md` — scene modules and MVP behavior.
- `docs/current/technical/CONTENT_MODEL.md` — content schema and draft gate text model.
- `docs/current/technical/DEPLOYMENT_MODEL.md` — Vite local/build and GitHub Pages deployment model under `/tomasz-talik-portfolio/`.
- `docs/current/technical/GLYPH_HOVER_EFFECTS_MODEL.md` — working canon for five-glyph hover-only effect language, symbolism, and rollout order.

### Decisions
- `docs/current/decisions/DECISION_LOG.md` — decision log, including MVP scene runtime decision updates.

### Technical audits
- `docs/current/audits/technical/portfolio-three-lighting-and-glb-rendering-audit.md` — technical audit of the portfolio Three.js renderer, camera, lighting, GLB loading, materials, shadows, and 3D shape presentation.

### Snapshots/evidence
- `docs/current/audits/snapshots/2026-05-22_15-38-35__snapshot__monkey-five-glyphs-runtime-baseline.md` — milestone checkpoint for central monkey + five glyph orbit-node runtime baseline.
- `docs/current/audits/snapshots/2026-05-22_18-18-33__snapshot__glyph-1-tree-effect-baseline.md` — accepted technical checkpoint for glyph_1 tree-based hover effect baseline.
- `docs/current/audits/snapshots/2026-05-28_18-08-09__snapshot__portfolio-ai-guide-progression-sun-moon.md` — documentation checkpoint for AI Guide panel direction, scene progression, sun/moon orbit state, and related protective decisions.
- `docs/current/audits/snapshots/2026-05-29_19-59-42__snapshot__dual-runtime-github-pages-deployment.md` — first working dual-runtime deployment snapshot for local Vite and GitHub Pages.
- `docs/current/audits/snapshots/2026-05-30_07-10-52__snapshot__galaxy-progress-loader-mobile-runtime.md` — documentation checkpoint for galaxy sprites, atmosphere progression, loading diagnostics, debug import/export, deployment-safe public asset paths, and mobile pointer/orientation/input runtime baseline.
- `docs/current/audits/snapshots/2026-06-02_17-36-03__snapshot__mobile-glyph-panels-baseline.md` — checkpoint dla mobilnych paneli pięciu glifów, data-panel-theme, nieprzezroczystych teł, kontrastu tekstu, SVG frame/ornament layering i no-regression zasad.
- `docs/current/audits/snapshots/2026-06-02_18-18-09__snapshot__entry-shell-conditional-3d-boot.md` — implemented lightweight language/mode entry shell, conditional Experience 3D boot, and placeholder-only Classic 2D branch.
- `docs/current/audits/snapshots/2026-06-03_17-29-26__snapshot__classic-2d-floating-glyph-hotspots.md` — implemented Classic 2D MVP with central monkey PNG, five floating flat PNG glyph hotspots, shared content panels, no-ring hover/focus glow, and no text scaling.

## Runtime entrypoints

Primary runtime files:
- `index.html` — Vite entry HTML.
- `vite.config.js` — Vite configuration, including GitHub Pages base path and vendored Three.js aliasing.
- `src/main.js` — entry shell / language and mode selection / conditional boot orchestration for Classic 2D or Experience 3D.
- `src/classic2d.js` — Classic 2D lightweight flat portfolio experience with central monkey PNG, five floating glyph hotspots, shared content panels, and back flow to mode selection.
- `src/experience3d.js` — current Experience 3D runtime bootstrap, scene wiring, input handling, loading/progression orchestration, and animation loop.
- `src/utils/publicPath.js` — shared helper for local Vite + GitHub Pages public asset URL normalization.

Scene/runtime files:
- `src/scene/monkeyModel.js` — async GLB loading orchestration with placeholder fallback safety.
- `src/scene/galaxySprites.js` — deterministic distant-galaxy sprite layer using transparent PNG public assets and deployment-safe URLs.
- `src/scene/*` — Three.js scene modules.

UI/content/style files:
- `src/ui/*` — HTML overlay and hover label modules.
- `src/content/portfolioNodes.js` — draft portfolio gate content.
- `src/styles/main.css` — atmospheric base and UI styles.


Classic 2D status: the runtime branch is now an implemented MVP lightweight flat portfolio experience. It shows `/png/monkey_small.png`, five floating flat PNG glyph hotspots, readable panels sourced from `src/content/portfolioNodes.js`, and a back flow to mode selection. Full retro-polish and final visual language remain future work.

Vendored Three.js files:
- `src/vendor/three.js` — bridge to vendored Three.js module.
- `vendor/three/three.module.js` — vendored Three.js runtime source of truth.
- `vendor/three/examples/jsm/loaders/GLTFLoader.js` — required vendored GLTFLoader.
- `vendor/three/examples/jsm/utils/BufferGeometryUtils.js` — required GLTFLoader utility.
- `vendor/three/examples/jsm/utils/SkeletonUtils.js` — required GLTFLoader utility.

## Asset/deployment rules

- Runtime stack is Vite + vanilla JavaScript + vendored Three.js.
- GitHub Pages base path must remain compatible with `/tomasz-talik-portfolio/`.
- Public assets must use deployment-safe URL handling.
- Runtime logical paths may look like `/glb/...` or `/png/...`, but final URLs must be normalized through the project public path helper where applicable.
- Manually managed binary/static assets live under `public/`.
- Monkey asset path: `public/glb/monkey.glb` (runtime logical URL `/glb/monkey.glb`).
- Galaxy sprite asset paths: `public/png/galaxy_01.png` through `public/png/galaxy_05.png`.
- Placeholder/fallback behavior is mandatory when the loader or GLB is unavailable.
- Vendored Three.js baseline is `r184`; GLTFLoader and related utilities must be sourced from the matching vendored files.
- npm `three` dependency is intentionally not the runtime source of truth.

## Snapshots are evidence, not default reading

Snapshots record historical checkpoints and milestone evidence. Read only the latest snapshot relevant to the current task unless investigating historical drift, regressions, or the evidence trail behind a specific decision.

Do not start by reading all snapshots. Prefer canonical technical docs and runtime files first, then consult snapshots only when the task needs historical proof or a milestone comparison.

## Do not read by default

Codex should not read these unless the task directly needs them:
- all snapshots
- all concept docs
- all visual direction docs
- all legacy docs
- all `src/scene` files
- all `src/ui` files
- all technical docs

## Codex context budget rules

Every Codex audit or implementation pass should:
- Start from `docs/current/maps/PROJECT_INDEX.md`.
- Select the smallest task-specific file pack from the routing table.
- Before opening additional files, state why they are needed, which question they answer, and whether they are canonical, runtime, or evidence.
- Report files read, files changed, and files intentionally skipped.
- Avoid recursive scans of `docs/current`.
- Prefer targeted `rg --files` or known paths over broad documentation tree reads.

## Known open topics / next audit targets

Current known open targets:
- loader performance
- staged/deferred asset loading
- mobile performance tuning
- critical initial assets vs optional late assets
- debug settings import/export documentation freshness
