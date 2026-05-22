# Dependency Map

## High-level flow
Concept docs -> Technical model -> Runtime implementation -> Audits/Snapshots -> Decision updates

## Detailed dependency graph
- `concept/CONCEPT_AND_ROADMAP.md`
  - informs `technical/ARCHITECTURE.md`
  - informs `concept/INTERACTION_MODEL.md`
  - informs `concept/VISUAL_DIRECTION.md`
- `technical/ARCHITECTURE.md`
  - informs current `index.html` and `src/*` scaffold
  - informs deployment requirements in `technical/DEPLOYMENT_MODEL.md`
- `technical/FRONTEND_RUNTIME_MODEL.md`
  - defines current runtime scaffold behavior
  - defines vendored Three.js import policy for MVP phase
- `operations/*.md`
  - govern how docs, audits, and snapshots are produced
- `audits/*`
  - feed findings into `decisions/DECISION_LOG.md`
  - feed next actions into snapshots

## Runtime status dependency
- Runtime scaffold now exists (`index.html`, `src/main.js`, `src/styles/main.css`).
- Next dependency step: first Three.js MVP scene modules using vendored `vendor/three/three.module.js`.
