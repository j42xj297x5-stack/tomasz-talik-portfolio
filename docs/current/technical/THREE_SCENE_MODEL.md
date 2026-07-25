# Three Scene Model

## Scene responsibilities

- `src/experience3d.js` owns the renderer, animation loop, scene wiring, input routing, preload stages, and guarded project interaction state.
- `src/scene/createScene.js`, `lights.js`, `particles.js`, and the sun/moon/galaxy modules provide the atmospheric scene.
- `src/scene/monkeyModel.js` loads `/glb/monkey.glb` through vendored Three.js r184 GLTFLoader; the central placeholder remains the safe visual fallback.
- `src/scene/orbitNodes.js` creates five GLB glyph visuals while keeping the node sphere as raycast collider and fallback. It owns orbit motion plus the shared hover and transition lights.
- `src/scene/cameraRig.js` owns interactive orbit, focus, plaque dolly, return-home, and fine-pointer handoff.
- `src/scene/plaqueTransition.js` owns the per-node plaque model lifecycle and glyph/plaque cross-fade.
- `src/ui/overlay.js` owns readable project content in HTML/CSS; text content is not rendered inside the scene.
- Startup attaches and hydrates atmosphere relics, galaxy sprites, and all plaque wrappers exactly once before compiling the complete scene and issuing a controlled warm-up render. Compilation prefers vendored Three.js `compileAsync`, covers both fade and stable plaque material modes, and temporarily exposes progression-hidden atmosphere/galaxy layers. All temporary visibility and plaque material state is restored before interaction is enabled.
- Sun and moon SpotLights retain targets at the central monkey pivot, but move outside their visual body bounds using radial and camera-relative offsets. Their horizon intensity changes use a synchronized, eased fade rather than an instant day/night switch.

## Interaction sequence

Only `idle` accepts normal hover and click/tap interaction. Clicking a glyph locks interaction and pauses orbit, then follows this guarded sequence:

`idle → focusing → revealingPlaque → plaqueHold → dollyIn → panelOpen → dollyOut → restoringGlyph → returning → idle`.

1. `cameraRig.focusOnNode(...)` moves on an eased azimuth arc around the fixed monkey pivot and targets the selected frozen glyph.
2. `plaqueTransition.reveal(...)` cross-fades the glyph into its plaque.
3. The plaque holds briefly, then `cameraRig.dollyToPlaque(...)` performs a bounds- and near-plane-safe dolly-in while retaining the focused camera side.
4. Only after the dolly completes does the HTML/CSS overlay open.
5. On close, the runtime dollies out, fades the transition light, reverses the plaque reveal, returns the camera home, resumes orbit and unlocks interaction.
6. Fine-pointer movement remembered while locked is handed back over a 1500 ms smooth camera transition. Coarse-pointer and reduced-motion contexts retain this order with shorter timings; reduced motion caps camera transitions at 150 ms and plaque hold at 120 ms.

## Plaque system

`portfolioNodes` is the configuration source for all five plaques. `assetManifest` derives the following `deferredWarm` entries from each node's `plaqueModelPath`:

| Node | Asset ID | GLB |
| --- | --- | --- |
| AI Guide (`ai-guide`) | `plaque-ai-guide` | `/glb/plaque_ai_guide.glb` |
| Creative AI (`creative-ai`) | `plaque-creative-ai` | `/glb/plaque_creative_ai.glb` |
| DIG Engine (`spotify-digger`) | `plaque-spotify-digger` | `/glb/plaque_dig_engine.glb` |
| Ethics / Life Protection (`ethics-life-protection`) | `plaque-ethics-life-protection` | `/glb/plaque_ethics.glb` |
| Haiku Cosmos (`haiku-cosmos`) | `plaque-haiku-cosmos` | `/glb/plaque_haiku_cosmos.glb` |

The plaque controller prewarms and caches one independently cloned wrapper per node ID in a `Map` while the loader is visible. Each wrapper already has cloned materials, validated bounds, glow, and light and is attached hidden to the scene, so first interaction only reveals the prepared instance. Interaction serialization allows only one active plaque animation at a time. A missing or failed plaque model produces an isolated panel fallback for that node; it does not invalidate cached or future plaques for other nodes.

Atmosphere relic hydration also completes under the loader. Stone placement clamps the configured inner boundary to the outer shell boundary and no longer expands the radius by runtime model scale. Progression multiplier updates reapply stone materials as well as dust, shell, and small-glyph materials, allowing the stone layer to reveal normally without a debug-panel refresh.

The current stone baseline is 30 cached clones distributed between radii 18 and 20, with scale 2–5, safe radius 3.5, rotation speed 0.05–0.09, orbit speed 0.003, full opacity, and the six `stone_01.glb` through `stone_06.glb` sources.

For each cached wrapper, `plaqueVisual` configures:

- `scale` — model scale after bounds normalization;
- `position` — local positional offset;
- `frontYawOffset` — final front orientation relative to the camera-facing wrapper;
- `plaqueGlowColor` — color of the visible additive glow mesh only.

| Node | `plaqueGlowColor` |
| --- | --- |
| AI Guide | `#72D6B0` |
| Creative AI | `#FF9C47` |
| DIG Engine | `#5FB8FF` |
| Ethics / Life Protection | `#E7D6A3` |
| Haiku Cosmos | `#7B8DFF` |

`plaqueGlowColor` does **not** change the neutral hover light, transition light, plaque `PointLight`, or GLB materials. Those lighting and material systems remain neutral/shared.

## Material lifecycle and reset

During reveal and reverse reveal, plaque GLB materials use **FADE MODE** so opacity and depth semantics support the cross-fade. After reveal, materials switch to **STABLE MODE** for `plaqueHold`, `dollyIn`, `panelOpen`, and `dollyOut`. Reverse reveal returns to FADE MODE, then restores the glyph and original plaque material state. `reset(...)` also hides the plaque, clears glow and plaque light, restores cloned glyph materials/visibility, and resets the node scale.

## Hover contract

All five glyphs use a shared one-shot scale pulse and neutral hover light. There are no active per-glyph tree, fire, spark, or ember-sphere effects. See [`GLYPH_HOVER_EFFECTS_MODEL.md`](GLYPH_HOVER_EFFECTS_MODEL.md) for the focused contract.
