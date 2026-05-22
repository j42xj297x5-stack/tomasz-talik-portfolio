# Documentation Workflow

## Add a new document
1. Place it in the correct `docs/current/<section>/` folder.
2. Add or update a short purpose entry in `maps/PROJECT_INDEX.md`.
3. If it introduces a new doc type, update `maps/DOCUMENTATION_MAP.md`.

## Update an existing document
1. Edit document content.
2. Preserve stable filenames unless there is a strong reason to rename.
3. If renamed/moved, record the change in commit message and update all indexes.

## Supersede a document
1. Move superseded file to `docs/legacy/`.
2. Add deprecation note (why + what replaced it).
3. Update indexes and any broken links.

## Automation readiness
- Use predictable filenames.
- Keep section ownership clear.
- Keep maps/indexes current so agents can resolve scope quickly.
