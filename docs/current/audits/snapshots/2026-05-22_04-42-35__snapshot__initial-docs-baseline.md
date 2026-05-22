# Snapshot: Initial Documentation Baseline

**Timestamp:** 2026-05-22 04:42:35 (UTC)  
**Snapshot ID:** `2026-05-22_04-42-35__snapshot__initial-docs-baseline`

## 1. SNAPSHOT SUMMARY
This snapshot captures the baseline state of the repository documentation architecture immediately before runtime implementation begins. It serves as the initial checkpoint for future technical, documentation, and full-repository audits.

## 2. CURRENT PROJECT STATUS
- The documentation structure has been established.
- Concept and roadmap content has been normalized into `docs/current/concept/CONCEPT_AND_ROADMAP.md`.
- The root `README.md` points readers to documentation.
- Documentation maps, operational workflows, and the decision log are present.
- The runtime application has not been initialized yet.
- No Vite + Three.js MVP runtime code exists yet as an initialized app scaffold in the repository state at snapshot time.

## 3. DOCUMENTATION STRUCTURE
The active documentation model in `docs/current` is organized into:
- `maps`
- `technical`
- `concept`
- `operations`
- `decisions`
- `audits`

Additionally:
- `docs/legacy` exists for superseded/deprecated materials.

## 4. SOURCE OF TRUTH
- `docs/current` is the active source of truth.
- `docs/legacy` is reserved for superseded/deprecated documentation.
- `docs/current/maps/PROJECT_INDEX.md` is the primary documentation navigation entry.

## 5. IMPORTANT DECISIONS
Already-recorded baseline decisions include:
- Vanilla Three.js + Vite is preferred for MVP runtime implementation.
- React / React Three Fiber is not planned for the first prototype unless explicitly requested later.
- HTML/CSS overlays are preferred for readable text panels.
- Three.js is responsible for scene, camera, lights, particles, central object, and interactive nodes.
- Final product copy and final project name are still undecided.
- The meditating monkey motif is symbolic, not a meme mascot.
- GitHub Pages is the likely deployment target; final deployment workflow remains deferred.

## 6. AUDIT WINDOW NOTE
Future audits may compare against this baseline snapshot by inspecting:
- Files changed after this snapshot timestamp.
- Audits created after this snapshot.
- Explicitly named audit files.
- Date-windowed sets of audit files.

## 7. KNOWN RISKS / OPEN ITEMS
- No runtime implementation exists yet.
- No initialized `package.json` / Vite runtime app exists yet.
- Final visual direction remains open.
- Final text/content remains open.
- First technical MVP implementation is still pending.

## 8. NEXT RECOMMENDED STEP
Initialize a Vite + Vanilla Three.js MVP runtime with:
- a central placeholder object,
- five interactive nodes,
- hover labels,
- and HTML overlay panels.
