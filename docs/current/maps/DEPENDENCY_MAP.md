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

assetManifest ─> AssetManager ─> plaqueTransition
plaqueTransition ─> experience3d interaction state ─> overlay
cameraRig ────────> experience3d interaction state ─> overlay
orbitNodes ───────> experience3d interaction state
```

The required plaque path is therefore: `portfolioNodes → assetManifest → plaqueTransition → cameraRig / experience3d → overlay`.

## Current Experience 3D contracts

- `src/content/portfolioNodes.js` supplies each node's glyph model, `plaqueModelPath`, and `plaqueVisual` (`scale`, `position`, `frontYawOffset`, `plaqueGlowColor`), as well as the HTML/CSS panel content.
- `src/assets/assetManifest.js` derives `plaque-${node.id}` entries from every record with `plaqueModelPath` and stages them in `deferredWarm`.
- `src/scene/plaqueTransition.js` obtains a plaque through `AssetManager`; it stores one cloned scene wrapper per node ID and permits one active transition at a time. A failed model logs an isolated warning and returns control to the panel fallback for that node without disabling other plaques.
- `src/experience3d.js` serializes interaction. A click locks interaction and orbit, focuses the camera, runs plaque reveal/hold/dolly, and opens the overlay only after the sequence completes. Close performs dolly-out, reverse reveal, camera return, orbit resume, and cursor handoff.
- `src/scene/cameraRig.js` owns focus, safe plaque dolly, return-home movement, and the remembered fine-pointer handoff. Reduced-motion and coarse-pointer contexts use shorter timings.
- `src/scene/orbitNodes.js` owns the shared neutral hover scale/light and the neutral transition light. It does not select plaque glow colors.
- `src/ui/overlay.js` renders readable project detail in HTML/CSS. Plaques are a scene transition and never replace panel content.

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
