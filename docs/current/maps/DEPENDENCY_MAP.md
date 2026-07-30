# Dependency Map

## Documentation flow

`PROJECT_ENTRY.md` → `maps/PROJECT_INDEX.md` → smallest task-specific current model. VR implementation work reads `technical/VR_RUNTIME_MODEL.md`, then `handoffs/EXPERIENCE_VR_HANDOFF.md`. Future gameplay work additionally reads `concept/EXPERIENCE_VR_GAMEPLAY_ROADMAP.md`, which is direction rather than runtime evidence.

## Runtime boundaries

```text
main
├─ classic2d ────────────────────────────── portfolioNodes
├─ dynamic import ─ experience3d ───────── desktop Three.js + HTML/CSS overlay
└─ vrCapability
   └─ dynamic import after VR selection ─ experienceVr (independent WebXR runtime)
```

Experience 3D and VR have separate owners. No shared-world-factory migration is binding.

## Active Experience VR composition

```text
main → vrCapability → secure context + immersive-vr support
main → dynamic import → experienceVr

experienceVr
├─ experienceVrSettings → publicPath → /data/experience-vr-settings.json
├─ AssetManager → manifest-selected preloaded GLBs
├─ centralObject + monkeyModel + lights + orbitNodes
├─ playerRigOrientation
├─ createVrControllers → two target rays + grips + holdSockets
├─ createVrGlyphOrbit → continuous moving glyphs
├─ createVrGlyphInteraction → hold on moving mesh/fallback collider
├─ createVrGlyphLights → light-only glyph feedback
├─ createVrLocomotion → right-stick move + left-stick yaw on playerRig
├─ createVrPortalDisplay + createVrSpatialPlaque
├─ portalCards → experienceVrPages → 18 logical page records
├─ createVrCrystalCollection → page-bound instances + activation registry
├─ createVrCrystalReliquary → insertion zone + visible display anchor
├─ createVrReliquaryActivateButton
└─ createVrReliquaryReleaseButton

direct Enter VR gesture
└─ immersive-vr → local-floor (fallback local) → renderer.setAnimationLoop
```

`createVrEntryTransition` remains in the repository and has an isolated test, but it is not imported or called by the active Experience VR composition.

## Active interaction and data flow

```text
controller local -Z ray
├─ glyph currentHit → select hold → getNextPage(node) → spawnOne(page, viewer pose)
├─ crystal currentCrystalHit → squeeze → pulling → held → insertion/available
├─ Activate hit → activateInserted() → insertedInstance.page → portal canvas
└─ Release hit → delayed releaseInserted() → object removed + socket free
```

Glyph and crystal hits are separate fields. Only `available` crystals are grabbable. The active state path is:

```text
materializing → available → pulling → held → inserted → active → released
                                  └──────── failed release ───────→ available
```

Activate owns progress: it adds `insertedInstance.page.id` to the in-memory `activatedPageIds`. Reset removes all instances but does not clear that Set. Release removes the socket instance and does not alter activation. The read-named APIs are aliases to activation; there is no separate read registry or durable storage.

## Logical cards versus physical assets

| Stable glyph ID | Logical cards | Shared GLB variants |
| --- | ---: | ---: |
| `ethics-life-protection` | 3 | 3: `/glb/crystal-ethics_01.glb` … `_03.glb` |
| `creative-ai` | 3 | 3: `/glb/crystal-creative_ai_01.glb` … `_03.glb` |
| `ai-guide` | 3 | 3: `/glb/crystal-ai_guide_01.glb` … `_03.glb` |
| `spotify-digger` | 4 | 3: `/glb/crystal-dig_engine_01.glb` … `_03.glb` |
| `haiku-cosmos` | 5 | 3: `/glb/crystal-haiku_cosmos_01.glb` … `_03.glb` |
| **Total** | **18** | **15** |

Cards 4 and 5 reuse branch variants cyclically; each spawned object still has independent page-bound instance state. `AssetManager` supplies every model and crystal spawn performs no fetch.

## Ownership and excluded dependencies

Portal/reliquary placement and insertion depend on authored transforms and runtime scene hierarchy. Locomotion and crystal handling do not depend on physics. The active graph has no progression controller, progress floor, shells, orb, semantic hand-tool input, runes, finale system or persistence module; those names belong only to the approved concept roadmap.
