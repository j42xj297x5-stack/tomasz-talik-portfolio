# Project Documentation Index

Status: canonical architect entrypoint. Read [`PROJECT_ENTRY.md`](../../../PROJECT_ENTRY.md) first.

## Current runtime baseline

The entry shell exposes three modes: Classic 2D, Experience 3D, and capability-gated Experience VR. Experience VR is a separate, dynamically imported WebXR runtime; it does not boot Experience 3D or share a mandatory world factory with it.

## Task routes

| Task | Read first | Runtime evidence when needed |
| --- | --- | --- |
| Experience VR current implementation | [`technical/VR_RUNTIME_MODEL.md`](../technical/VR_RUNTIME_MODEL.md), then [`handoffs/EXPERIENCE_VR_HANDOFF.md`](../handoffs/EXPERIENCE_VR_HANDOFF.md) | `src/experienceVr.js`, `src/config/experienceVrSettings.js`, relevant `src/xr/*` modules |
| Experience VR future gameplay | [`concept/EXPERIENCE_VR_GAMEPLAY_ROADMAP.md`](../concept/EXPERIENCE_VR_GAMEPLAY_ROADMAP.md), after the current VR model | Current runtime evidence only when planning a bounded implementation stage |
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
- [`concept/EXPERIENCE_VR_GAMEPLAY_ROADMAP.md`](../concept/EXPERIENCE_VR_GAMEPLAY_ROADMAP.md) — approved future gameplay direction; not current runtime state.

## Scope rules

Canonical documents describe the current model. Code is implementation evidence; snapshots and audits are historical evidence. Do not read `docs/legacy/` by default. In particular, the superseded VR implementation plan is not an active architecture route.
