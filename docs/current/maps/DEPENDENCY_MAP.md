# Dependency Map

## Documentation flow

`PROJECT_ENTRY.md` → `maps/PROJECT_INDEX.md` → smallest task-specific technical model and runtime evidence. Canonical documents describe the present runtime; snapshots and legacy material are not default inputs.

## Experience 3D runtime graph

```text
experience3dSettings code defaults
  + public/data/experience3d-settings.json
  └─> load / normalize / runtime mapping
      └─> experience3d
          ├─> createScene ─> fogRevealController
          ├─> atmosphere <─ atmosphereProgression <─ main-glyph interaction
          ├─> sunCycle / moonCycle <─ atmosphereProgression
          ├─> galaxySprites <─ atmosphereProgression
          │   └─> galaxyBackgroundScene
          ├─> optionsPanel ─> optionsEventRouter ─> owner-scoped systems
          ├─> portfolioNodes ─> orbitNodes / overlay
          └─> renderScenePasses(galaxyBackgroundScene, main scene, one camera)

portfolioNodes ─> assetManifest ─> AssetManager ─> plaqueTransition
cameraRig + plaqueTransition ─> serialized experience3d interaction ─> overlay
```

## Minimal evidence routes

| Future task | Smallest useful file set |
| --- | --- |
| Scene configuration, defaults, fallback, import/export | `src/config/experience3dSettings.js`; `public/data/experience3d-settings.json`; `src/ui/optionsPanel.js`; `src/experience3d.js` |
| Tuning panel behavior or event isolation | `src/ui/optionsPanel.js`; `src/utils/optionsEventRouter.js`; `src/experience3d.js`; affected owner module |
| World progression and tuning visibility | `src/scene/atmosphere/atmosphereProgression.js`; `src/experience3d.js`; `src/scene/atmosphere.js`; `src/scene/galaxySprites.js` |
| Fog startup, timing, restart, or skip | `src/scene/fogRevealController.js`; `src/experience3d.js`; `src/config/experience3dSettings.js`; `public/data/experience3d-settings.json`; `src/scene/renderScenePasses.js` |
| Galaxy layout, materials, progression, or pass order | `src/scene/galaxySprites.js`; `src/scene/renderScenePasses.js`; `src/experience3d.js`; `public/data/experience3d-settings.json` |
| Atmosphere relic distribution/depth/rebuilds | `src/scene/atmosphere.js`; `src/ui/optionsPanel.js`; `src/config/experience3dSettings.js` |
| Performance, startup, warm-up, or render loop | `src/experience3d.js`; `src/scene/renderScenePasses.js`; `src/utils/runtimeDiagnostics.js`; preload modules only when asset staging is involved |
| Plaque/camera/detail flow | `src/content/portfolioNodes.js`; `src/assets/assetManifest.js`; `src/scene/plaqueTransition.js`; `src/scene/cameraRig.js`; `src/experience3d.js`; `src/ui/overlay.js` |

## Active boundaries

- `src/config/experience3dSettings.js` owns schema defaults, normalization, server loading fallback, runtime mapping, and composition-only serialization. The public JSON is the deployed external scene composition; `localStorage` is not in this dependency path.
- `src/ui/optionsPanel.js` mutates session runtime state and emits owner/action events. `src/utils/optionsEventRouter.js` isolates delivery; owners choose live application or local rebuild.
- `src/scene/fogRevealController.js` changes main-scene fog only. `src/scene/atmosphere/atmosphereProgression.js` changes interaction-based layer multipliers only. Neither owns the other.
- `src/scene/galaxySprites.js` owns five unique single-use sprites in `galaxyBackgroundScene`. `src/scene/renderScenePasses.js` makes them the first, fog-free background pass.
- `src/experience3d.js` is the integration owner for loader ordering, hydration, plaque prewarm, compilation, final-path warm-up, `interactionReady`, fog-clock start, progression application, and the sole animation loop.
- Vendored Three.js r184 and matching GLTFLoader remain runtime sources of truth. `src/utils/publicPath.js` normalizes public paths for Vite and GitHub Pages.
