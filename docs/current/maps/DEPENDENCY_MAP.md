# Dependency Map

## Documentation flow

`PROJECT_ENTRY.md` → `maps/PROJECT_INDEX.md` → smallest task-specific technical model and runtime evidence.

`maps/DOCUMENTATION_MAP.md` defines placement, while `decisions/DECISION_LOG.md` records accepted decisions. Canonical technical documents describe the present runtime; snapshots are supporting evidence only.

## Experience 3D dependency graph

```text
portfolioNodes
  ├─> assetManifest (deferredWarm plaque entries)
  ├─> orbitNodes (glyph metadata and shared hover)
  └─> overlay (HTML/CSS panel content)

assetManifest ─> AssetManager ─┬─> plaqueTransition
                               ├─> atmosphere
                               └─> milkyWayBackground ─> galaxyBackgroundScene
assetManifest ─> AssetManager ───> galaxySprites ──────> galaxyBackgroundScene

atmosphereProgression ─> experience3d ─┬─> atmosphere (shells, smallGlyphs, stars, stones)
                                      ├─> galaxySprites (galaxies)
                                      ├─> milkyWayBackground (galaxies)
                                      └─> sunCycle + moonCycle (sunMoon)

plaqueTransition ─> experience3d interaction state ─> overlay
cameraRig ────────> experience3d interaction state ─> overlay
orbitNodes ───────> experience3d interaction state
interfaceCopy ────> experienceIntro ────────────────> experience3d startup gate
loader completion ─────────────────────────────────> experience3d startup gate
clean post-warm-up render ─────────────────────────> experience3d startup gate
experience3d startup gate ─┬─> interactionReady
                           ├─> fog reveal start
                           └─> main tick start
```

The required plaque path is therefore: `portfolioNodes → assetManifest → plaqueTransition → cameraRig / experience3d → overlay`.

## Current Experience 3D contracts

- `src/content/portfolioNodes.js` supplies each node's glyph model, `plaqueModelPath`, and `plaqueVisual` (`scale`, `position`, `frontYawOffset`, `plaqueGlowColor`), as well as the HTML/CSS panel content.
- `src/assets/assetManifest.js` stages plaque, atmosphere-relic, galaxy-sprite, and Milky Way assets. `AssetManager` is the shared cache boundary consumed by `plaqueTransition`, `atmosphere`, `galaxySprites`, and `milkyWayBackground`.
- `src/scene/atmosphere/atmosphereProgression.js` owns the cumulative order `shells → smallGlyphs → stars → stones → galaxies`. `src/experience3d.js` reads its multipliers and passes them to atmosphere, galaxy sprites, the Milky Way, sun, and moon; galaxy sprites and the Milky Way receive the same `galaxies` value.
- The stone-model flow is `AssetManager GLTF → cached scene + animations → cloned animation root → instance AnimationMixer`. A GLB with non-empty clips receives an instance mixer; a GLB without clips remains static and does not receive one.
- Each animated stone's cloned root is nested in an outer wrapper. The wrapper owns random position, scale, orientation, manual spin, group orbit, and drift, keeping whole-relic placement independent of transforms authored inside the GLB.
- `src/scene/plaqueTransition.js` obtains a plaque through `AssetManager`; it stores one cloned scene wrapper per node ID and permits one active transition at a time. A failed model logs an isolated warning and returns control to the panel fallback for that node without disabling other plaques.
- `src/experience3d.js` serializes interaction. A click locks interaction and orbit, focuses the camera, runs plaque reveal/hold/dolly, and opens the overlay only after the sequence completes. Close performs dolly-out, reverse reveal, camera return, orbit resume, and cursor handoff.
- `src/scene/cameraRig.js` owns focus, safe plaque dolly, return-home movement, and the remembered fine-pointer handoff. Reduced-motion and coarse-pointer contexts use shorter timings.
- `src/scene/orbitNodes.js` owns the shared neutral hover scale/light and the neutral transition light. It does not select plaque glow colors.
- `src/ui/overlay.js` renders readable project detail in HTML/CSS. Plaques are a scene transition and never replace panel content.
- `src/i18n/interfaceCopy.js → src/ui/experienceIntro.js → src/experience3d.js` is the opening-gate dependency. The Experience 3D-only intro is created while loading, below the loader and above the scene. Restored warm-up state and its clean replacement render are prerequisites; loader completion then hands control to the intro as a distinct gate before `interactionReady`, fog reveal, and the main `tick()`.
- `src/scene/milkyWayBackground.js` consumes the cached `/png/milky_way.webp` texture. Its camera-centred, unlit inner sphere renders before galaxy sprites in `galaxyBackgroundScene` and is independent of main-scene lights and fog.

## Plaque asset mapping

| Node ID | Asset ID | GLB path |
| --- | --- | --- |
| `ai-guide` | `plaque-ai-guide` | `/glb/plaque_ai_guide.glb` |
| `creative-ai` | `plaque-creative-ai` | `/glb/plaque_creative_ai.glb` |
| `spotify-digger` | `plaque-spotify-digger` | `/glb/plaque_dig_engine.glb` |
| `ethics-life-protection` | `plaque-ethics-life-protection` | `/glb/plaque_ethics.glb` |
| `haiku-cosmos` | `plaque-haiku-cosmos` | `/glb/plaque_haiku_cosmos.glb` |

## Shared foundations

- `src/main.js` conditionally imports `src/experience3d.js` after an Experience 3D selection; `src/classic2d.js` is a separate lightweight consumer of the same `portfolioNodes` data.
- Vendored Three.js r184 and its matching GLTFLoader are runtime sources of truth. Public logical paths are normalized for Vite and GitHub Pages by `src/utils/publicPath.js`.
- Monkey and glyph loading retain their visual fallbacks; orbit-node sphere colliders remain the interaction targets.
