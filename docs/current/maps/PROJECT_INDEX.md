# Project Documentation Index

Status: canonical architect entrypoint. Repozytoryjny entrypoint dokumentacji to [`README.md`](../../../README.md), który prowadzi przez [`docs/README.md`](../../README.md) do tego indeksu.

## Current runtime baseline

The entry shell exposes three modes: Classic 2D, Experience 3D, and capability-gated Experience VR. Experience VR is a separate, dynamically imported WebXR runtime; it does not boot Experience 3D or share a mandatory world factory with it.

## Task routes

| Task | Read first | Runtime evidence when needed |
| --- | --- | --- |
| Projektowanie lub implementowanie nowego Experience VR Scenario pointu | Najpierw obowiązkowo [`technical/VR_SCENARIO_POINT_AUTHORING_STANDARD.md`](../technical/VR_SCENARIO_POINT_AUTHORING_STANDARD.md), następnie [`technical/VR_SCENARIO_DIRECTOR_MODEL.md`](../technical/VR_SCENARIO_DIRECTOR_MODEL.md) | `src/xr/progression/*`, właściwi actors/domain owners i composition wiring w `src/experienceVr.js`; legacy seams nie są precedensem |
| Experience VR audio | [`technical/VR_AUDIO_MODEL.md`](../technical/VR_AUDIO_MODEL.md), then [`technical/VR_RUNTIME_MODEL.md`](../technical/VR_RUNTIME_MODEL.md) | `src/xr/audio/createVrAudioBridge.js`; consult `src/audio/audioManager.js` only for the shared owner/Master Volume boundary |
| Experience VR current implementation | [`technical/VR_RUNTIME_MODEL.md`](../technical/VR_RUNTIME_MODEL.md), then [`handoffs/EXPERIENCE_VR_HANDOFF.md`](../handoffs/EXPERIENCE_VR_HANDOFF.md) | `src/experienceVr.js`, `src/config/experienceVrSettings.js`, relevant `src/xr/*` modules |
| Experience VR Large Glyph actor migration (M1–M7) | [`technical/VR_LARGE_GLYPH_ACTOR_MIGRATION.md`](../technical/VR_LARGE_GLYPH_ACTOR_MIGRATION.md), then the named phase only | The migration document audits current runtime and is the execution contract for the target actor; it is not current runtime authority |
| Experience VR Proto-Astro / small glyphs / Astro bands / tuning | [`technical/VR_PROTO_ASTRO_MODEL.md`](../technical/VR_PROTO_ASTRO_MODEL.md), then Runtime/Scenario/communication model according to task | `src/xr/protoAstro/*`, `src/xr/glyphs/*`, relevant Furnace/input/tool/guidance modules and composition wiring |
| Experience VR Scenario, Director, Scenario Spine or reconstruction | [`technical/VR_SCENARIO_DIRECTOR_MODEL.md`](../technical/VR_SCENARIO_DIRECTOR_MODEL.md), then [`handoffs/EXPERIENCE_VR_HANDOFF.md`](../handoffs/EXPERIENCE_VR_HANDOFF.md) | Authored Scenario follows `1.10 → … → 4.10 → 4.20 → 4.30 → 4.40 → 100.10`. `4.40` is the stable gameplay boundary and has no transition, so it does not auto-advance to the canonical story terminal. Reconstruction/stateAt is authored through this P2 boundary in its documented scope. |
| Collaboration, tests and validation claims | [`operations/COLLABORATION_PROTOCOL.md`](../operations/COLLABORATION_PROTOCOL.md) | Automated, production-path and hardware/perceptual evidence must remain distinct |
| Experience VR Astro Furnace | [`technical/VR_RUNTIME_MODEL.md`](../technical/VR_RUNTIME_MODEL.md), then [`handoffs/EXPERIENCE_VR_HANDOFF.md`](../handoffs/EXPERIENCE_VR_HANDOFF.md) | `src/xr/furnace/*`, `src/experienceVr.js`, `src/config/experienceVrSettings.js`, `src/xr/shells/createVrShellSystem.js` |
| Experience VR progress floor | [`technical/VR_PROGRESS_FLOOR_MODEL.md`](../technical/VR_PROGRESS_FLOOR_MODEL.md), then [`technical/VR_RUNTIME_MODEL.md`](../technical/VR_RUNTIME_MODEL.md) | `src/xr/floor/createVrProgressFloor.js`, `src/experienceVr.js`, `src/assets/assetManifest.js`, `tests/vr-progress-floor.test.mjs` |
| Experience VR future gameplay | [`concept/EXPERIENCE_VR_GAMEPLAY_ROADMAP.md`](../concept/EXPERIENCE_VR_GAMEPLAY_ROADMAP.md), after the current VR model | Current runtime evidence only when planning a bounded implementation stage |
| Experience VR P4 rune stones, sector vessels or rune transport/install | [`technical/VR_RUNE_STONES_MODEL.md`](../technical/VR_RUNE_STONES_MODEL.md), then [`technical/VR_SCENARIO_DIRECTOR_MODEL.md`](../technical/VR_SCENARIO_DIRECTOR_MODEL.md); read the current runtime and handoff before implementation work | No rune runtime is implemented; for a future bounded slice consult `src/experienceVr.js`, `src/xr/progression/*`, platform composition, audio boundary and the specific GLB contract only |
| Experience VR narrative, player guidance, Monkey communication or further progression design | 1. [`concept/EXPERIENCE_VR_NARRATIVE_PROGRESSION_BASELINE.md`](../concept/EXPERIENCE_VR_NARRATIVE_PROGRESSION_BASELINE.md); 2. [`concept/EXPERIENCE_VR_COMMUNICATION_MECHANICS.md`](../concept/EXPERIENCE_VR_COMMUNICATION_MECHANICS.md); 3. [`concept/EXPERIENCE_VR_PLAYER_COMMUNICATION_COPY.md`](../concept/EXPERIENCE_VR_PLAYER_COMMUNICATION_COPY.md); 4. [`technical/VR_RUNTIME_MODEL.md`](../technical/VR_RUNTIME_MODEL.md) only when implementation state is needed | `src/xr/guidance/*`, progression owners and bounded subsystem code only when validating an implementation assumption |
| Entry shell or mode selection | [`technical/ENTRY_FLOW_AND_MODES_MODEL.md`](../technical/ENTRY_FLOW_AND_MODES_MODEL.md) | `src/main.js`, then only the selected runtime entrypoint |
| Experience 3D runtime or scene | [`technical/FRONTEND_RUNTIME_MODEL.md`](../technical/FRONTEND_RUNTIME_MODEL.md), [`technical/THREE_SCENE_MODEL.md`](../technical/THREE_SCENE_MODEL.md) | `src/experience3d.js`, then the relevant scene module |
| Classic 2D | [`technical/ENTRY_FLOW_AND_MODES_MODEL.md`](../technical/ENTRY_FLOW_AND_MODES_MODEL.md) | `src/classic2d.js`, `src/content/portfolioNodes.js` |
| Audio | [`technical/AUDIO_RUNTIME_MODEL.md`](../technical/AUDIO_RUNTIME_MODEL.md) | `src/audio/audioManager.js`, `src/main.js` |
| Assets and deployment | [`technical/DEPLOYMENT_MODEL.md`](../technical/DEPLOYMENT_MODEL.md) | `src/assets/assetManifest.js`, `src/assets/assetManager.js`, `src/utils/publicPath.js` |
| Documentation synchronization | affected canonical model, [`maps/DEPENDENCY_MAP.md`](DEPENDENCY_MAP.md), [`decisions/DECISION_LOG.md`](../decisions/DECISION_LOG.md) | only code needed to prove the contract |

## Canonical navigation

- [`README.md`](../README.md) — active documentation hub.
- [`maps/DOCUMENTATION_MAP.md`](DOCUMENTATION_MAP.md) — placement and lifecycle rules.
- [`maps/DEPENDENCY_MAP.md`](DEPENDENCY_MAP.md) — current high-level dependency graph.
- [`technical/ARCHITECTURE.md`](../technical/ARCHITECTURE.md) — module boundaries.
- [`technical/CONTENT_MODEL.md`](../technical/CONTENT_MODEL.md) — shared portfolio records.
- [`decisions/DECISION_LOG.md`](../decisions/DECISION_LOG.md) — currently binding decisions.
- [`concept/EXPERIENCE_VR_GAMEPLAY_ROADMAP.md`](../concept/EXPERIENCE_VR_GAMEPLAY_ROADMAP.md) — future gameplay direction with implemented-stage status; technical models remain runtime authority.
- [`concept/EXPERIENCE_VR_NARRATIVE_PROGRESSION_BASELINE.md`](../concept/EXPERIENCE_VR_NARRATIVE_PROGRESSION_BASELINE.md) — recommended canonical start for Experience VR narrative, Monkey/player guidance and post-Sphere progression design.
- [`concept/EXPERIENCE_VR_COMMUNICATION_MECHANICS.md`](../concept/EXPERIENCE_VR_COMMUNICATION_MECHANICS.md) — canonical mechanics for when, where and what type of player communication is due; it does not own gameplay or copy.
- [`concept/EXPERIENCE_VR_PLAYER_COMMUNICATION_COPY.md`](../concept/EXPERIENCE_VR_PLAYER_COMMUNICATION_COPY.md) — canonical catalog of approved Polish player-facing copy; English localization remains a separate task.
- [`technical/VR_PROTO_ASTRO_MODEL.md`](../technical/VR_PROTO_ASTRO_MODEL.md) — canonical identity, tuning, small-glyph transport, Astro bands and Furnace essence contract.
- [`technical/VR_SPHERICAL_LAYERS_MODEL.md`](../technical/VR_SPHERICAL_LAYERS_MODEL.md) — canonical world-stable concentric volume layers, deterministic slots, ranges and ownership.
- [`technical/VR_RUNE_STONES_MODEL.md`](../technical/VR_RUNE_STONES_MODEL.md) — canonical target model for the five P4 rune-stone/vessel pairs, GLB helpers, outer-orbit transport, installation, blocking and spatial audio; not an implemented runtime claim.
- [`technical/VR_SCENARIO_POINT_AUTHORING_STANDARD.md`](../technical/VR_SCENARIO_POINT_AUTHORING_STANDARD.md) — wiążący standard konstrukcji i walidacji każdego nowego canonical Experience VR Scenario pointu; czytać przed modelem Scenario/Director.
- [`audits/progression/EXPERIENCE_VR_SCENARIO_MIGRATION_AUDIT_2026-08-12.md`](../audits/progression/EXPERIENCE_VR_SCENARIO_MIGRATION_AUDIT_2026-08-12.md) — working evidence and migration inventory for the future Experience VR Scenario + Director refactor; not a runtime architecture change.

## Scope rules

Canonical documents describe the current model. Code is implementation evidence; snapshots and audits are historical evidence. Do not read `docs/legacy/` by default. In particular, the superseded VR implementation plan is not an active architecture route.
