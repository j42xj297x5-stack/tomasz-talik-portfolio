# Orange Monkey VR Localization Migration

**Status:** CURRENT / BINDING MIGRATION PLAN / IMPLEMENTATION PENDING

## Goal

Implement the approved PL/EN presentation copy around the authoritative Experience VR gameplay architecture without changing gameplay behavior, Scenario semantics, Director behavior, actor lifecycles, Guidance or Furnace state machines, or progression timing. This is a staged presentation-data migration, not a repository-wide replacement or an architectural rewrite.

## Source of truth

- [`ORANGE_MONKEY_VR_ENGLISH_COPY_EDITORIAL_REVIEWED_approved.md`](../../../ORANGE_MONKEY_VR_ENGLISH_COPY_EDITORIAL_REVIEWED_approved.md) is the sole authority for English wording. Only its approved `FINAL_EN` values may be implemented; they must not be translated, rewritten, normalized, improved, or inferred.
- [`ORANGE_MONKEY_LOCALIZATION_INVENTORY_2026-09-12.md`](../audits/localization/ORANGE_MONKEY_LOCALIZATION_INVENTORY_2026-09-12.md) is the inventory of runtime text surfaces and current owners. This plan does not duplicate that inventory.
- Existing runtime gameplay ownership remains authoritative. Scenario is language-agnostic: user-facing copy must not move into `src/xr/progression/vrExperienceScenario.js`.

## Ownership boundaries

### Monkey communication

`src/xr/guidance/vrMonkeyCommunicationCopy.js` is the primary owner of progression and tutorial communication, decisions, hints, acquisition communication, Monkey knowledge, and Monkey knowledge categories. Hints remain part of this domain, not a separate localization subsystem. The domain may resolve equivalent PL and EN data, but semantic communication IDs, consumer object shapes, actors, and gameplay contracts remain unchanged.

### Player Guide / Y panel

`src/xr/guidance/vrPlayerGuideContent.js` owns panel shell copy, control labels, current-task shell copy, tools, knowledge, navigation hints, and fallback presentation text. Complete its existing locale-based structure; do not introduce another subsystem or change navigation and unlock logic.

### Current objectives

`src/xr/guidance/createVrCurrentObjectiveProjection.js` retains objective and gameplay-state ownership, including objective selection, counters, Scenario-point evaluation, and Rune, Asterion, and Resonator state evaluation. Runtime logic determines the objective ID and runtime values/counters; copy determines only the localized presentation for that ID. A small objective-copy owner may be added during that bounded stage. Copy must never become gameplay truth.

### Furnace presentation

Furnace runtime retains all state-machine and gameplay ownership. Furnace wording is presentation data and should resolve through one bounded Furnace copy owner rather than duplicated PL/EN literals in the renderer. A future stage may use `src/xr/furnace/vrFurnaceCopy.js`, but the exact filename is not fixed by this plan.

### Small presentation surfaces

Credits, plaques, fallback strings, launch/status shell copy, and similar isolated surfaces may retain local PL/EN `COPY` objects when naturally owned by one actor or renderer. Do not centralize them only for uniformity. Already localized domains, including portal cards, must not be migrated again without a concrete defect.

No stage may introduce a global translation framework, generic `t(...)` service, external i18n dependency, or repository-wide localization abstraction. Prefer bounded copy owners beside their existing runtime owners.

## Runtime risk

Monkey communication has timing/lifecycle coupling and is therefore not automatically gameplay-neutral when wording changes:

- `createVrMonkeyProgressionMessage.js` derives display duration from rendered line count; different languages can wrap into different numbers of Monkey Guide lines.
- Completion callbacks participate in progression and lifecycle flow.
- `createVrIntroSequence.js` also derives duration from rendered line count and uses communication completion callbacks to continue its state machine.
- `onCompleted`, `onLastBlockHidden`, playback completion, or equivalent callbacks can influence gameplay-significant transitions in progression and mandatory communication paths.

Intro and lifecycle-sensitive Monkey communication are **RED-risk** surfaces. Before English copy is connected to any such surface, verify whether locale-dependent rendered line count can change gameplay-significant timing or callback sequencing. This plan does not prescribe a timing redesign. If isolation is required, implement it as a separate bounded task before or together with the affected localization stage—never as an opportunistic global refactor.

### Intro migration seam

`createVrIntroSequence.js` currently has its own locale copy structure while also consuming canonical Polish Monkey communication data. That duplication is a migration seam, not authority to rewrite Intro. The target is locale-resolved copy shaped compatibly with the current Intro runtime contract. Intro mechanics, states, callbacks, Scenario events, and transitions remain unchanged. Intro is deliberately the last Monkey localization stage because it is lifecycle-sensitive and **RED-risk**.

## Migration phases

### PHASE 0 — COMPLETE

The approved, human-reviewed English copy source is established. Implementation includes no further editorial rewrite.

### PHASE 1 — RUNTIME SAFETY AUDIT

Audit lifecycle-sensitive localization surfaces without implementing changes. Primary RED surfaces are `createVrIntroSequence.js`, `createVrMonkeyProgressionMessage.js`, `createVrMandatoryMonkeyCommunication.js`, and progression/mandatory Monkey completion paths. Identify every place where text shape, rendered line count, playback completion, `onCompleted`, `onLastBlockHidden`, or an equivalent lifecycle signal can affect a gameplay-significant state transition.

### PHASE 2 — MONKEY EN DATA, NOT RUNTIME ACTIVATION

Add the approved English Monkey catalog while preserving exact semantic IDs, object shape, block boundaries, prompts, questions, options, placeholders, and authored line breaks. Do not activate it on lifecycle-sensitive runtime paths in the same task.

### PHASE 3 — PLAYER GUIDE / Y PANEL

Complete EN copy in the existing locale structure. Do not change navigation or unlock logic.

### PHASE 4 — CURRENT OBJECTIVES

Add locale-resolved objective presentation. Do not change objective selection or runtime counters.

### PHASE 5 — FURNACE

Move or resolve Furnace presentation wording through a bounded locale copy owner. Do not change Furnace states, actions, transactions, machines, or gameplay ownership.

### PHASE 6 — OTHER LOW-RISK PRESENTATION SURFACES

Migrate isolated inventory surfaces such as credits, plaques, fallback presentation copy, and other VR labels. Do not remigrate already-correct bilingual domains without need.

### PHASE 7 — MONKEY OPTIONAL / NON-INTRO COMMUNICATION

Connect approved EN knowledge, optional hints, and acquisition descriptions only where Phase 1 proves the surface does not drive gameplay-significant timing.

### PHASE 8 — MONKEY PROGRESSION COMMUNICATION

Connect progression copy incrementally while preserving semantic IDs and runtime events. Do not alter Scenario or Director contracts.

### PHASE 9 — INTRO

Migrate Intro last among Monkey systems using locale-resolved copy compatible with its current runtime shape. Do not redesign its state machine, move Scenario events, or combine the migration with unrelated cleanup or refactoring.

### PHASE 10 — FINAL LOCALIZATION RECONCILIATION

Reconcile the implemented Orange Monkey VR runtime against the inventory and approved English source. Classify every inventoried item as `implemented bilingual`, `intentionally language-neutral`, `intentionally shared`, or `blocked by a named runtime mismatch`. No silent omissions are permitted.

## Invariants

- Polish behavior and wording remain unchanged unless the approved source explicitly contains a Designer-accepted correction.
- English wording comes only from the approved English source; no runtime string is translated ad hoc.
- Semantic communication IDs, Scenario point IDs, events, effects, and Director transitions remain stable.
- Actor ownership and gameplay state machines remain stable unless a separately approved migration task explicitly changes one.
- Runtime counters and placeholders remain runtime data; copy does not become gameplay truth.
- Locale flows into copy resolution, never gameplay decision-making.
- Each phase is an independent, small-surface task; no opportunistic cleanup, global refactor, or repository-wide search-and-replace pass is allowed.

## Stop conditions

Stop the affected stage and report rather than guess when:

- an approved copy ID no longer maps to the runtime owner recorded in the inventory;
- runtime data shape differs from the approved copy shape;
- a placeholder or block boundary cannot be preserved exactly;
- supporting localization would require changing Scenario semantics or a gameplay state machine;
- competing copy authorities exist for one runtime surface and the canonical owner cannot be established from the sources; or
- approved English copy is missing for an actual player-facing runtime item.

## Completion definition

Migration is complete only after Phases 1–10 are implemented in order and the final reconciliation classifies every inventoried Orange Monkey VR item with no silent omission. Completion additionally requires unchanged Polish behavior and wording (except explicitly approved corrections), stable semantic and Scenario contracts, locale-independent gameplay decisions, and explicit resolution of every named runtime mismatch. This document records the binding target and order; it does **not** claim implementation is complete.
