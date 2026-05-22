# Dependency Map (Initial)

## High-level flow
Concept docs -> Technical model -> Runtime implementation -> Audits/Snapshots -> Decision updates

## Detailed dependency graph
- `concept/CONCEPT_AND_ROADMAP.md`
  - informs `technical/ARCHITECTURE.md`
  - informs `concept/INTERACTION_MODEL.md`
  - informs `concept/VISUAL_DIRECTION.md`
- `technical/ARCHITECTURE.md`
  - informs future `src/` and `public/assets/` structure
  - informs deployment requirements in `technical/DEPLOYMENT_MODEL.md`
- `operations/*.md`
  - govern how docs, audits, and snapshots are produced
- `audits/*`
  - feed findings into `decisions/DECISION_LOG.md`
  - feed next actions into snapshots

## Runtime status dependency
No runtime code exists yet; technical docs currently define planned structure only.
