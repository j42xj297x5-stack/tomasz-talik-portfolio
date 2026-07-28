# Project Documentation Index

Status: canonical architect entrypoint.
Purpose: route a task to the smallest current documentation and runtime evidence pack.

> Read [`PROJECT_ENTRY.md`](../../../PROJECT_ENTRY.md) before this index.

## Current runtime baseline

The project has a Classic 2D / Experience 3D / Experience VR entry shell. Experience 3D is a Three.js scene with five GLB glyphs, a shared data-driven plaque transition for every glyph, and HTML/CSS detail panels. Experience VR is a separately loaded Meta Quest 3S WebXR proof of concept containing only the monkey and a static ring of five glyphs.

Hover is deliberately shared and light: every glyph uses the same one-shot scale/light response. Tree, fire, spark, and ember-sphere hover systems are not active runtime behavior.

## Read-this-first minimal pack

For a general Experience 3D architecture task, read:

- `docs/current/maps/PROJECT_INDEX.md`
- `docs/current/maps/DEPENDENCY_MAP.md`
- `docs/current/technical/FRONTEND_RUNTIME_MODEL.md`
- `docs/current/technical/THREE_SCENE_MODEL.md`
- `src/experience3d.js`

Do not scan `docs/current` recursively. Read an additional module only when the route below identifies it.

## Task routes

| Task | Read first | Add only when needed |
| --- | --- | --- |
| Atmosphere/relics, layer progression, galaxies/Milky Way, embedded stone GLB animation | `technical/THREE_SCENE_MODEL.md`; `src/scene/atmosphere/atmosphereProgression.js`; `src/scene/atmosphere.js` | `src/scene/galaxySprites.js`; `src/scene/milkyWayBackground.js`; creation/progression/update sections of `src/experience3d.js`; `src/assets/assetManifest.js` |
| Experience 3D bootstrap, opening intro, input, interaction state, panel timing | `src/experience3d.js`; `technical/FRONTEND_RUNTIME_MODEL.md`; `technical/THREE_SCENE_MODEL.md` | `src/ui/experienceIntro.js`; `src/i18n/interfaceCopy.js`; intro section of `src/styles/main.css`; `src/scene/cameraRig.js`; `src/ui/overlay.js` |
| Plaque asset/config/cache/material lifecycle | `src/content/portfolioNodes.js`; `src/assets/assetManifest.js`; `src/scene/plaqueTransition.js`; `technical/THREE_SCENE_MODEL.md` | `src/scene/orbitNodes.js`; `src/experience3d.js` |
| Camera focus, dolly, return, cursor handoff | `src/scene/cameraRig.js`; `src/experience3d.js`; `technical/THREE_SCENE_MODEL.md` | `src/scene/orbitNodes.js` |
| Glyph hover behavior | `src/scene/orbitNodes.js`; `src/experience3d.js`; `technical/GLYPH_HOVER_EFFECTS_MODEL.md` | `src/ui/hoverLabel.js` |
| Overlay/content panels | `src/content/portfolioNodes.js`; `src/ui/overlay.js`; `technical/FRONTEND_RUNTIME_MODEL.md` | `src/styles/main.css`; `technical/CONTENT_MODEL.md` |
| Asset staging or public paths | `src/assets/assetManifest.js`; `src/assets/assetManager.js`; `src/utils/publicPath.js`; `technical/DEPLOYMENT_MODEL.md` | `src/experience3d.js` |
| Classic 2D | `src/classic2d.js`; `src/content/portfolioNodes.js`; `technical/ENTRY_FLOW_AND_MODES_MODEL.md` | `src/styles/main.css` |
| Experience VR, WebXR capability, session lifecycle | `technical/VR_RUNTIME_MODEL.md`; `src/experienceVr.js`; `src/xr/vrCapability.js`; `src/config/experienceVrSettings.js` | `src/main.js`; base scene, light, monkey, orbit-node, asset-manager and preload modules used directly by the VR runtime |
| Shared audio, ambient progression, effects, master control, debug mixer | `technical/AUDIO_RUNTIME_MODEL.md`; `src/audio/audioManager.js`; `src/main.js` | `src/experience3d.js`; `src/ui/audioControl.js`; `src/ui/optionsPanel.js`; `src/scene/atmosphere/atmosphereProgression.js` |
| Documentation synchronization | affected canonical technical doc; `maps/DEPENDENCY_MAP.md`; `decisions/DECISION_LOG.md` | only the runtime files that prove the changed contract |

## Canonical documentation

- [`README.md`](../README.md) — active documentation hub.
- [`maps/DOCUMENTATION_MAP.md`](DOCUMENTATION_MAP.md) — document placement rules.
- [`maps/DEPENDENCY_MAP.md`](DEPENDENCY_MAP.md) — current high-level runtime dependency graph.
- [`technical/ARCHITECTURE.md`](../technical/ARCHITECTURE.md) — module boundaries.
- [`technical/FRONTEND_RUNTIME_MODEL.md`](../technical/FRONTEND_RUNTIME_MODEL.md) — entry shell, Experience 3D runtime, overlay contract.
- [`technical/THREE_SCENE_MODEL.md`](../technical/THREE_SCENE_MODEL.md) — scene, camera, plaque, material and fallback contract.
- [`technical/GLYPH_HOVER_EFFECTS_MODEL.md`](../technical/GLYPH_HOVER_EFFECTS_MODEL.md) — concise active hover contract.
- [`technical/CONTENT_MODEL.md`](../technical/CONTENT_MODEL.md) — portfolio record schema and panel content.
- [`technical/AUDIO_RUNTIME_MODEL.md`](../technical/AUDIO_RUNTIME_MODEL.md) — shared Web Audio graph, streaming ambient, effects, and controls.
- [`technical/VR_RUNTIME_MODEL.md`](../technical/VR_RUNTIME_MODEL.md) — minimal separate Meta Quest 3S WebXR runtime and session contract.
- [`decisions/DECISION_LOG.md`](../decisions/DECISION_LOG.md) — accepted project decisions.

## Runtime entrypoints

- `src/main.js` selects the mode and conditionally launches Experience 3D.
- `src/main.js` also detects immersive-VR capability and conditionally imports the separate `src/experienceVr.js` runtime only after VR selection.
- `src/experience3d.js` owns the Experience 3D scene wiring, interaction sequence, renderer, preload stages, and animation loop.
- `src/content/portfolioNodes.js` is the source of truth for glyph, plaque, and panel metadata.
- `src/assets/assetManifest.js` derives staged plaque assets from the portfolio records.
- `src/scene/plaqueTransition.js`, `src/scene/cameraRig.js`, and `src/scene/orbitNodes.js` implement the plaque, camera, and hover/orbit portions of that interaction.

## Scope rules

- Canonical documents describe the current model; code is implementation evidence.
- Snapshots and audits are evidence, not default reading.
- Do not read `docs/legacy/` by default.
- Update `DEPENDENCY_MAP.md` when runtime dependencies materially change and add a dated entry to `DECISION_LOG.md` for accepted design decisions.
