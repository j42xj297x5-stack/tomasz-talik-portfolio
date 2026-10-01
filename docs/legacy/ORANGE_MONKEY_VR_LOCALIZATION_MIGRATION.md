# Orange Monkey VR localization migration

**Status:** CURRENT / BINDING MIGRATION PLAN / IMPLEMENTATION PENDING

## Goal

Migrate the approved English presentation copy into Orange Monkey VR without changing gameplay behavior, Scenario semantics, Director behavior, actor lifecycles, Guidance or Furnace state machines, or progression timing. This is a presentation-data migration around the authoritative runtime architecture, not a repository-wide replacement.

## Source of truth

- `ORANGE_MONKEY_VR_ENGLISH_COPY_EDITORIAL_REVIEWED_approved.md` is the sole authority for English wording. Its `FINAL_EN` values must not be rewritten, normalized, improved, translated or reinterpreted during implementation. Phase 0 editorial review is complete.
- `docs/current/audits/localization/ORANGE_MONKEY_LOCALIZATION_INVENTORY_2026-09-12.md` is the existing inventory of runtime text surfaces and current owners. This plan does not duplicate that inventory.
- Existing gameplay architecture remains authoritative. Scenario is language-agnostic: user-facing text must not move into `src/xr/progression/vrExperienceScenario.js`.

## Ownership boundaries

### Monkey communication

`src/xr/guidance/vrMonkeyCommunicationCopy.js` owns progression and tutorial communication, decisions, hints, acquisition communication, Monkey knowledge, and Monkey knowledge categories. Hints are part of this domain, not a separate localization subsystem.

The domain must resolve equivalent PL and EN copy while preserving existing semantic IDs and the actor/gameplay contracts that consume them. No global translation framework, generic `t(...)` service, external i18n dependency, or repository-wide localization abstraction may be introduced.

### Player Guide / Y panel

`src/xr/guidance/vrPlayerGuideContent.js` owns panel shell copy, control labels, current-task shell copy, tools, knowledge, navigation hints, and fallback presentation text. Complete its existing locale-based structure; do not create another subsystem or change navigation and unlock logic.

### Current objectives

`src/xr/guidance/createVrCurrentObjectiveProjection.js` retains objective-state ownership. Runtime logic determines the objective ID and runtime values/counters; copy determines localized presentation for that ID. Objective selection, counters, Scenario-point evaluation, and Rune, Asterion, and Resonator state evaluation must remain in the projection. A small objective-copy owner may be introduced in its implementation stage.

### Furnace presentation

Furnace runtime retains gameplay and state-machine ownership. Its user-facing wording belongs in one bounded Furnace copy owner rather than duplicated PL/EN literals in the renderer; a future stage may use `src/xr/furnace/vrFurnaceCopy.js`, but the exact filename is not fixed here. Furnace states, actions, transactions, and machines must not change.

### Small presentation surfaces

Credits, plaques, fallback strings, launch/status shell copy, and similar isolated surfaces may retain local PL/EN `COPY` objects when naturally owned by one actor or renderer. Do not centralize them solely for uniformity. Do not migrate already localized domains such as portal cards again without a concrete defect.

Across all domains, prefer bounded copy owners close to existing runtime owners.

## Runtime risk

Monkey communication has timing and lifecycle coupling. `createVrMonkeyProgressionMessage` calculates display duration from the rendered line count, while the Monkey Guide can wrap languages into different numbers of lines. Completion callbacks—including `onCompleted`, `onLastBlockHidden`, and equivalents—can participate in progression and actor-lifecycle flow. `createVrIntroSequence` also derives duration from rendered line count and uses communication completion callbacks to continue its state machine.

Consequently, changing text is not automatically gameplay-neutral. Intro and lifecycle-sensitive Monkey communication are **RED-risk** surfaces. Before English copy is connected to any such surface, verify whether locale-dependent rendered line count can alter gameplay-significant timing or callback sequencing. This plan does not prescribe a timing redesign. If isolation is required, implement it as a separate bounded task before or together with that specific localization stage—never as an opportunistic global refactor.

### Intro migration seam

`createVrIntroSequence.js` currently has its own locale copy structure while also consuming canonical Polish Monkey communication data. That duplication is a migration seam, not permission to rewrite Intro. The target is for Intro eventually to receive locale-resolved copy in a shape compatible with its current runtime contract. Mechanics, states, callbacks, Scenario events, and transitions remain unchanged. Intro is deliberately last among Monkey communication systems because it is lifecycle-sensitive.

## Migration phases

Each phase is an independent, bounded change with a small surface.

### PHASE 0 — COMPLETE

The human-reviewed English copy source is approved. No further editorial rewrite is part of implementation.

### PHASE 1 — RUNTIME SAFETY AUDIT

Audit `createVrIntroSequence.js`, `createVrMonkeyProgressionMessage.js`, `createVrMandatoryMonkeyCommunication.js`, and progression/mandatory Monkey completion paths. Identify every place where text shape, rendered line count, playback completion, `onCompleted`, `onLastBlockHidden`, or an equivalent lifecycle signal can influence a gameplay-significant transition. Do not implement localization in this phase.

### PHASE 2 — MONKEY EN DATA, NOT RUNTIME ACTIVATION

Add the approved English Monkey catalog while preserving exact semantic IDs, object shape, block boundaries, prompts, questions, options, placeholders, and authored line breaks. Do not connect it to lifecycle-sensitive runtime paths in the same task.

### PHASE 3 — PLAYER GUIDE / Y PANEL

Complete EN copy in the existing locale structure. Do not change navigation or unlock logic.

### PHASE 4 — CURRENT OBJECTIVES

Add locale-resolved objective presentation. Do not change objective selection or runtime counters.

### PHASE 5 — FURNACE

Move or resolve Furnace presentation copy through a bounded locale copy owner. Do not change machine states, actions, transactions, or gameplay ownership.

### PHASE 6 — OTHER LOW-RISK PRESENTATION SURFACES

Migrate isolated surfaces identified by the inventory, such as credits, plaques, local fallback copy, and other VR presentation labels. Do not re-migrate correct bilingual domains without need.

### PHASE 7 — MONKEY OPTIONAL / NON-INTRO COMMUNICATION

Connect approved EN copy for low-risk knowledge, optional hints, and acquisition descriptions only where Phase 1 proves the surface does not drive gameplay-significant timing.

### PHASE 8 — MONKEY PROGRESSION COMMUNICATION

Connect progression copy incrementally. Preserve semantic IDs and runtime events; do not alter Scenario or Director contracts.

### PHASE 9 — INTRO

Migrate Intro last among Monkey systems using locale-resolved copy compatible with its current contract. Do not redesign the Intro state machine, move Scenario events, or combine localization with unrelated cleanup or refactoring.

### PHASE 10 — FINAL LOCALIZATION RECONCILIATION

Reconcile the implemented runtime against the inventory and approved English source. Classify every inventoried Orange Monkey VR item as **implemented bilingual**, **intentionally language-neutral**, **intentionally shared**, or **blocked by a named runtime mismatch**. No silent omissions are permitted.

## Invariants

- Polish behavior and wording remain unchanged unless the approved source explicitly contains a correction already accepted by the Designer.
- English wording comes only from the approved source; Codex must not translate runtime strings ad hoc.
- Semantic IDs, Scenario point IDs, events, effects, and Director transitions remain stable.
- Actor ownership and gameplay state machines remain stable unless a separately approved migration task explicitly changes one.
- Runtime counters and placeholders remain runtime data. Copy must not become gameplay truth.
- Locale flows into copy resolution, never into gameplay decision-making.
- Preserve approved object shapes, block boundaries, prompts, questions, options, placeholders, and authored line breaks.
- No opportunistic architectural cleanup or repository-wide search-and-replace localization pass.
- Do not introduce infrastructure beyond bounded PL/EN copy owners.

## Stop conditions

Stop and report rather than guess when:

- an approved copy ID no longer maps to the runtime owner recorded by the inventory;
- runtime and approved copy shapes differ;
- a placeholder or block boundary cannot be preserved exactly;
- localization would require changing Scenario semantics or a gameplay state machine;
- competing copy authorities exist for one surface and the canonical owner cannot be established from the approved sources; or
- approved English copy is missing for an actual player-facing runtime item.

## Completion definition

Localization is complete only after Phases 1–10 are implemented in order, every inventory item receives a Phase 10 classification, and PL/EN presentation is resolved within the ownership boundaries above without changing the stated gameplay contracts. This document freezes the migration contract and order; it does **not** claim implementation is complete.
