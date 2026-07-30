# Dependency Map

## Documentation flow

`PROJECT_ENTRY.md` → `maps/PROJECT_INDEX.md` → smallest task-specific current model. VR work reads `technical/VR_RUNTIME_MODEL.md`, then `handoffs/EXPERIENCE_VR_HANDOFF.md`.

## Runtime boundaries

```text
main
├─ classic2d ────────────────────────────── portfolioNodes
├─ dynamic import ─ experience3d ───────── desktop Three.js + HTML/CSS overlay
└─ vrCapability
   └─ dynamic import after VR selection ─ experienceVr (independent WebXR runtime)
```

Experience 3D and VR have separate owners. `src/experience3d.js` remains protected; no shared-world-factory migration is binding.

## Experience VR composition

```text
main → vrCapability → secure context + immersive-vr support
main → dynamic import → experienceVr

experienceVr
├─ experienceVrSettings → publicPath → /data/experience-vr-settings.json
├─ AssetManager → manifest-selected preloaded GLBs
├─ centralObject + monkeyModel + lights
├─ orbitNodes
├─ playerRigOrientation
├─ createVrControllers → two target rays + grips + holdSockets
├─ createVrGlyphOrbit → effective radius 7.6 + continuous orbit + entryReady
├─ createVrGlyphInteraction → moving meshes/fallback colliders
├─ createVrGlyphLights → light-only feedback
├─ createVrEntryTransition → head-offset-compensated playerRig movement
├─ createVrPortalDisplay
│  ├─ /glb/portal.glb
│  ├─ PORTAL_CANVAS_SURFACE
│  └─ compatibility crystal socket
├─ createVrSpatialPlaque → CanvasTexture on authored surface / warned plane fallback
├─ createVrLocomotion → right-stick move + left-stick yaw on playerRig
├─ experienceVrPages → portfolioNodes selectors + 15 crystal mappings
├─ createVrCrystalCollection → materialize + raycast target + pull-to-hand + state/read data
├─ createVrCrystalReliquary
│  ├─ /glb/portal_crystal_reliquary.glb
│  ├─ insertion zone + authored anchor + visible runtime anchor
│  └─ independent companion placement/scale roots
├─ createVrReliquaryActivateButton
└─ createVrReliquaryReleaseButton → VrReliquaryReleaseButtonHitArea

direct Enter VR gesture
└─ immersive-vr → local-floor (fallback local) → renderer.setAnimationLoop
```

The active VR preload subset contains no per-glyph plaque models. AssetManager supplies every runtime model; crystal spawn performs no fetch.

## Interaction and data flow

```text
controller local -Z ray
├─ glyph currentHit → trigger/select → entry transition
├─ crystal currentCrystalHit → squeeze → pull-to-hand → held → insertion
├─ activate hit → select → activateInserted() → portal canvas update
└─ release hit → select → delayed releaseInserted()
```

Crystal and glyph hits are separate controller-record fields.

```text
createVrCrystalCollection.inserted
→ createVrReliquaryActivateButton
→ activateInserted()
→ active
→ resolveExperienceVrPage(portfolioNodes)
→ portal CanvasTexture update

createVrReliquaryReleaseButton
→ releaseInserted()
→ readPageIds (only when released state was active)
→ released + object removed
→ socket available
→ activate/release reset
```

## Asset/page mapping

| Stable glyph ID | Three preloaded crystal GLBs |
| --- | --- |
| `ai-guide` | `/glb/crystal-ai_guide_01.glb` … `_03.glb` |
| `spotify-digger` | `/glb/crystal-dig_engine_01.glb` … `_03.glb` |
| `haiku-cosmos` | `/glb/crystal-haiku_cosmos_01.glb` … `_03.glb` |
| `creative-ai` | `/glb/crystal-creative_ai_01.glb` … `_03.glb` |
| `ethics-life-protection` | `/glb/crystal-ethics_01.glb` … `_03.glb` |

Resolution uses `glyphId` and `page.id`, never orbit index or current position.

## State and placement dependencies

```text
materializing → available → pulling → held → inserted → active → released
```

Only `available` is crystal-raycastable/grabbable. `inserted` and `active` remain visible and occupy the socket. Release alone removes the object and allows the next insertion.

Portal quaternion + configured spawn define the horizontal front axis. Reliquary is `1.5 m` on-axis from portal; its model root is raised `0.5 m`. Sibling companion roots stay unraised, `1 m` forward and `0.5 m` left/right; each uses its own `0.3` scale root.

## Shared foundations, not shared runtime

All three modes may consume stable portfolio IDs/content. VR also reuses focused asset/scene constructors, vendored Three.js and `publicPath`. It does not import Experience 3D interaction, overlays, atmosphere state or animation loop. Crystal interaction and locomotion depend on transform hierarchy rather than physics, gravity, collision, velocity or throwing.
