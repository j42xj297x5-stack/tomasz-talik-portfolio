# Project Documentation Index

## Core hubs
- `docs/README.md` — top-level documentation entrypoint.
- `docs/current/README.md` — active documentation hub.

## Maps
- `docs/current/maps/PROJECT_INDEX.md` — this index.
- `docs/current/maps/DOCUMENTATION_MAP.md` — where each doc type belongs.
- `docs/current/maps/DEPENDENCY_MAP.md` — high-level dependency graph.

## Technical
- `docs/current/technical/README.md` — technical section overview.
- `docs/current/technical/ARCHITECTURE.md` — implemented runtime module structure.
- `docs/current/technical/FRONTEND_RUNTIME_MODEL.md` — runtime layering and vendored Three.js import policy.
- `docs/current/technical/THREE_SCENE_MODEL.md` — scene modules and MVP behavior.
- `docs/current/technical/CONTENT_MODEL.md` — content schema and draft gate text model.
- `docs/current/technical/DEPLOYMENT_MODEL.md` — deployment direction.
- `docs/current/technical/GLYPH_HOVER_EFFECTS_MODEL.md` — working canon for five-glyph hover-only effect language, symbolism, and rollout order.

## Decisions
- `docs/current/decisions/DECISION_LOG.md` — includes MVP scene runtime decision update.

## Runtime files
- `src/scene/monkeyModel.js` — async GLB loading orchestration with placeholder fallback safety.
- `index.html` — Vite entry HTML.
- `src/main.js` — runtime bootstrap, scene wiring, animation loop.
- `src/vendor/three.js` — bridge to vendored Three.js module.
- `src/scene/*` — Three.js scene modules.
- `src/ui/*` — HTML overlay and hover label modules.
- `src/content/portfolioNodes.js` — draft portfolio gate content.
- `src/styles/main.css` — dark atmospheric base + UI styles.

- Vendored Three.js baseline is `r184`; GLTFLoader must also be sourced from `r184` only.
- Required loader file path: `vendor/three/examples/jsm/loaders/GLTFLoader.js`.
- Runtime monkey asset URL: `/glb/monkey.glb` (local file: `public/glb/monkey.glb`, manually managed binary).
- Placeholder fallback is mandatory when loader or GLB is unavailable.
- npm `three` dependency remains intentionally unused in runtime integration.

- GLTFLoader r184 is vendored at `vendor/three/examples/jsm/loaders/GLTFLoader.js`.
- Required GLTFLoader utilities are vendored at `vendor/three/examples/jsm/utils/BufferGeometryUtils.js` and `vendor/three/examples/jsm/utils/SkeletonUtils.js`.
- Vite resolve alias maps bare `three` imports to local vendored module `vendor/three/three.module.js` via `vite.config.js`.

## Audits / snapshots
- `docs/current/audits/snapshots/2026-05-22_15-38-35__snapshot__monkey-five-glyphs-runtime-baseline.md` — milestone checkpoint for central monkey + five glyph orbit-node runtime baseline.
