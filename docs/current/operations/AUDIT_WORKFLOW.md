# Audit Workflow

## Audit output locations
- Full audits: `docs/current/audits/full/`
- Code audits: `docs/current/audits/code/`
- Documentation audits: `docs/current/audits/documentation/`

## Required filename convention
`YYYY-MM-DD_HH-MM-SS__<audit-type>__<short-topic>.md`

Examples:
- `2026-05-22_14-30-00__full__initial-repo-docs-audit.md`
- `2026-05-22_15-10-00__code__three-scene-mvp-review.md`
- `2026-05-22_15-45-00__documentation__current-docs-consistency.md`

## Audit types
- `full` — repo-wide state.
- `code` — implementation quality/runtime checks.
- `documentation` — doc consistency and completeness.

## Queryability goal
Timestamped naming enables selecting:
- exact named audits,
- audits within date windows,
- audits after the last relevant snapshot.
