# Dependency Map

## Documentation flow

`PROJECT_ENTRY.md` → `maps/PROJECT_INDEX.md` → smallest task-specific current model. VR work always starts with `technical/VR_RUNTIME_MODEL.md`, then `handoffs/EXPERIENCE_VR_HANDOFF.md`.

## Runtime boundaries

```text
main
├─> classic2d ────────────────> portfolioNodes
├─ dynamic import ─> experience3d ─> Three.js desktop scene + HTML/CSS overlay
└─ vrCapability
   └─ dynamic import after VR selection ─> experienceVr ─> independent WebXR runtime
```

Experience 3D and Experience VR are separate runtime owners. `src/experience3d.js` remains protected. There is no binding shared-world-factory migration direction.

## Experience VR graph

```text
main ─> vrCapability ─> secure-context + immersive-vr support
main ── dynamic import ─> experienceVr

experienceVr
├─> experienceVrSettings ─> publicPath
├─> AssetManager + VR monkey/glyph/plaque preload subset
├─> centralObject + monkeyModel + lights
├─> orbitNodes (glyph construction and base radius 3.8)
├─> playerRigOrientation
├─> createVrControllers (two target rays, local -Z)
├─> createVrGlyphOrbit (effective radius 7.6, continuous orbit, dynamic entryReady)
├─> createVrGlyphInteraction (current GLB meshes/fallback colliders, object→glyphRoot)
├─> createVrGlyphLights (warm PointLight feedback)
├─> createVrEntryTransition (head-offset-compensated playerRig movement)
├─> createVrGlyphPlaque ─> resolveVrGlyphPlaqueAsset
└─> createVrSpatialPlaque (canvas above monkey)

direct Enter VR gesture
└─> immersive-vr session
   ├─> local-floor, fallback local
   └─> renderer.setAnimationLoop
```

The per-frame interaction order is orbit, world-matrix refresh, raycast, dynamic entry assignment, light update, transition/plaque update, and render. Session reset reuses runtime objects and clears state instead of duplicating them.

## Shared foundations, not a shared runtime

The three modes consume stable portfolio IDs and content where applicable. Experience VR also reuses focused asset and scene constructors, the vendored Three.js build, and `publicPath`. It does not import Experience 3D interaction state, its HTML/CSS panels, atmosphere progression, or desktop animation loop.

## VR plaque mapping

| Stable glyph ID | GLB |
| --- | --- |
| `ai-guide` | `/glb/plaque_ai_guide.glb` |
| `spotify-digger` | `/glb/plaque_dig_engine.glb` |
| `haiku-cosmos` | `/glb/plaque_haiku_cosmos.glb` |
| `creative-ai` | `/glb/plaque_creative_ai.glb` |
| `ethics-life-protection` | `/glb/plaque_ethics.glb` |

Resolution uses the stable glyph ID, never orbital index or current orbital position.
