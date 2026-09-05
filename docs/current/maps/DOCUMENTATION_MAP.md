# Documentation Map

## Placement rules
- Put all active docs in `docs/current/`.
- Move only superseded files to `docs/legacy/` with a deprecation note.
- Keep audit outputs in `docs/current/audits/<type>/`.

## Document classes
- Concept/product direction → `docs/current/concept/`
- Technical architecture and runtime model → `docs/current/technical/`
- Process/workflow docs → `docs/current/operations/`
- Browser/headset runtime operations and local diagnostic recording → `docs/current/operations/EXPERIENCE_VR_RUNTIME_OPERATIONS.md`
- Decision records → `docs/current/decisions/`
- Current implementation handoffs → `docs/current/handoffs/`
- Navigation/meta docs → `docs/current/maps/`

## Mandatory maintenance on every substantial update
1. Update the changed document.
2. Update `PROJECT_INDEX.md` when adding/removing/renaming docs.
3. If scope changed materially, update `DEPENDENCY_MAP.md`.
4. If decision changed, append to `DECISION_LOG.md`.
