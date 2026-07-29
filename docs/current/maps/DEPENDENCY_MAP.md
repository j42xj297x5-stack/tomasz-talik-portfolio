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
├─> createVrControllers (two target rays plus two grip/hold sockets)
├─> createVrGlyphOrbit (effective radius 7.6, continuous orbit, dynamic entryReady)
├─> createVrGlyphInteraction (current GLB meshes/fallback colliders, object→glyphRoot)
├─> createVrGlyphLights (warm PointLight feedback)
├─> createVrEntryTransition (head-offset-compensated playerRig movement)
├─> createVrPortalDisplay (portal plus invisible bounds-derived crystal socket)
├─> experienceVrPages ─> resolved portfolioNodes + 15 crystal asset mappings
├─> createVrCrystalCollection ─> AssetManager clones + squeeze near-grab/insert
└─> createVrSpatialPlaque (existing canvas inside portal)

direct Enter VR gesture
└─> immersive-vr session
   ├─> local-floor, fallback local
   └─> renderer.setAnimationLoop
```

The per-frame interaction order is orbit, world-matrix refresh, raycast, dynamic entry assignment, light update, transition/plaque update, and render. Session reset reuses runtime objects and clears state instead of duplicating them.

## Shared foundations, not a shared runtime

The three modes consume stable portfolio IDs and content where applicable. Experience VR also reuses focused asset and scene constructors, the vendored Three.js build, and `publicPath`. It does not import Experience 3D interaction state, its HTML/CSS panels, atmosphere progression, or desktop animation loop.

## VR crystal mapping

| Stable glyph ID | Crystal GLBs |
| --- | --- |
| `ai-guide` | `/glb/crystal-ai_guide_01.glb` … `_03.glb` |
| `spotify-digger` | `/glb/crystal-dig_engine_01.glb` … `_03.glb` |
| `haiku-cosmos` | `/glb/crystal-haiku_cosmos_01.glb` … `_03.glb` |
| `creative-ai` | `/glb/crystal-creative_ai_01.glb` … `_03.glb` |
| `ethics-life-protection` | `/glb/crystal-ethics_01.glb` … `_03.glb` |

Resolution uses the stable glyph ID and page ID, never orbital index or current orbital position. Squeeze parenting is deterministic and contains no physics, gravity, collision, throw, or velocity dependency.
