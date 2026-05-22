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

## Decisions
- `docs/current/decisions/DECISION_LOG.md` — includes MVP scene runtime decision update.

## Runtime files
- `index.html` — Vite entry HTML.
- `src/main.js` — runtime bootstrap, scene wiring, animation loop.
- `src/vendor/three.js` — bridge to vendored Three.js module.
- `src/scene/*` — Three.js scene modules.
- `src/ui/*` — HTML overlay and hover label modules.
- `src/content/portfolioNodes.js` — draft portfolio gate content.
- `src/styles/main.css` — dark atmospheric base + UI styles.
