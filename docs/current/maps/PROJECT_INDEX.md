# Project Documentation Index

Status: canonical architect entrypoint. Read [`PROJECT_ENTRY.md`](../../../PROJECT_ENTRY.md) first.

## Current runtime baseline

The entry shell exposes three modes: Classic 2D, Experience 3D, and capability-gated Experience VR. Experience VR is a separate, dynamically imported WebXR runtime; it does not boot Experience 3D or share a mandatory world factory with it.

## Task routes

| Task | Read first | Runtime evidence when needed |
| --- | --- | --- |
| Experience VR audio | [`technical/VR_AUDIO_MODEL.md`](../technical/VR_AUDIO_MODEL.md), then [`technical/VR_RUNTIME_MODEL.md`](../technical/VR_RUNTIME_MODEL.md) | `src/xr/audio/createVrAudioBridge.js`; consult `src/audio/audioManager.js` only for the shared owner/Master Volume boundary |
| Experience VR current implementation | [`technical/VR_RUNTIME_MODEL.md`](../technical/VR_RUNTIME_MODEL.md), then [`handoffs/EXPERIENCE_VR_HANDOFF.md`](../handoffs/EXPERIENCE_VR_HANDOFF.md) | `src/experienceVr.js`, `src/config/experienceVrSettings.js`, relevant `src/xr/*` modules |
| Experience VR Scenario, Director, Scenario Spine or checkpoint reconstruction | [`technical/VR_SCENARIO_DIRECTOR_MODEL.md`](../technical/VR_SCENARIO_DIRECTOR_MODEL.md), then [`handoffs/EXPERIENCE_VR_HANDOFF.md`](../handoffs/EXPERIENCE_VR_HANDOFF.md) for the implementation boundary | Consult Scenario/Director runtime only when validating CURRENT implementation; the Spine/reconstruction contract is documentation-only and not implemented |
| Experience VR Astro Furnace | [`technical/VR_RUNTIME_MODEL.md`](../technical/VR_RUNTIME_MODEL.md), then [`handoffs/EXPERIENCE_VR_HANDOFF.md`](../handoffs/EXPERIENCE_VR_HANDOFF.md) | `src/xr/furnace/*`, `src/experienceVr.js`, `src/config/experienceVrSettings.js`, `src/xr/shells/createVrShellSystem.js` |
| Experience VR progress floor | [`technical/VR_PROGRESS_FLOOR_MODEL.md`](../technical/VR_PROGRESS_FLOOR_MODEL.md), then [`technical/VR_RUNTIME_MODEL.md`](../technical/VR_RUNTIME_MODEL.md) | `src/xr/floor/createVrProgressFloor.js`, `src/experienceVr.js`, `src/assets/assetManifest.js`, `tests/vr-progress-floor.test.mjs` |
| Experience VR future gameplay | [`concept/EXPERIENCE_VR_GAMEPLAY_ROADMAP.md`](../concept/EXPERIENCE_VR_GAMEPLAY_ROADMAP.md), after the current VR model | Current runtime evidence only when planning a bounded implementation stage |
| Experience VR P4 rune stones, sector vessels or rune transport/install | [`technical/VR_RUNE_STONES_MODEL.md`](../technical/VR_RUNE_STONES_MODEL.md), then [`technical/VR_SCENARIO_DIRECTOR_MODEL.md`](../technical/VR_SCENARIO_DIRECTOR_MODEL.md); read the current runtime and handoff before implementation work | No rune runtime is implemented; for a future bounded slice consult `src/experienceVr.js`, `src/xr/progression/*`, platform composition, audio boundary and the specific GLB contract only |
| Experience VR narrative, player guidance, Monkey communication or further progression design | [`concept/EXPERIENCE_VR_NARRATIVE_PROGRESSION_BASELINE.md`](../concept/EXPERIENCE_VR_NARRATIVE_PROGRESSION_BASELINE.md), then [`technical/VR_RUNTIME_MODEL.md`](../technical/VR_RUNTIME_MODEL.md) only when technical detail is needed | `src/xr/guidance/*`, progression owners and bounded subsystem code only when validating an assumption |
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
- [`technical/VR_RUNE_STONES_MODEL.md`](../technical/VR_RUNE_STONES_MODEL.md) — canonical target model for the five P4 rune-stone/vessel pairs, GLB helpers, outer-orbit transport, installation, blocking and spatial audio; not an implemented runtime claim.
- [`audits/progression/EXPERIENCE_VR_SCENARIO_MIGRATION_AUDIT_2026-08-12.md`](../audits/progression/EXPERIENCE_VR_SCENARIO_MIGRATION_AUDIT_2026-08-12.md) — working evidence and migration inventory for the future Experience VR Scenario + Director refactor; not a runtime architecture change.

## Scope rules

Canonical documents describe the current model. Code is implementation evidence; snapshots and audits are historical evidence. Do not read `docs/legacy/` by default. In particular, the superseded VR implementation plan is not an active architecture route.
