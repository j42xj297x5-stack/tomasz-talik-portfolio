# Dependency Map

## Documentation flow

`PROJECT_ENTRY.md` → `maps/PROJECT_INDEX.md` → smallest task-specific current model. VR implementation work reads `technical/VR_RUNTIME_MODEL.md`, then `handoffs/EXPERIENCE_VR_HANDOFF.md`. Future gameplay work additionally reads `concept/EXPERIENCE_VR_GAMEPLAY_ROADMAP.md`, which distinguishes implemented foundations from planned direction.

## Runtime boundaries

```text
main
├─ classic2d ───────────────────────────── portfolioNodes
├─ dynamic import ─ experience3d ──────── desktop Three.js + HTML/CSS overlay
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
├─ playerRigOrientation + createVrLocomotion
├─ createVrControllers + createVrGlyphOrbit/Interaction/Lights
├─ experienceVrPages → 18 page records in five branches
├─ VrProgressionController → committed pages + current global tier
├─ createVrCrystalCollection → branch+tier instances + transient state machine
├─ createVrCrystalReliquary → proximity validation + insertion zone
├─ Activate / Release buttons → preview / commit boundary
├─ createVrPortalDisplay + createVrSpatialPlaque
└─ createVrProgressFloor → five authored sectors + 18 panels + five tier rings

direct Enter VR gesture
└─ immersive-vr → local-floor (fallback local) → renderer.setAnimationLoop
```

`createVrEntryTransition` remains in the repository but is not part of the active composition.

## Active interaction and data flow

```text
glyph hold
→ capture glyph world position and center direction
→ spawn next unrepresented branch+tier crystal 0.30 m inward from glyph

crystal
→ grab
→ held proximity feedback
→ insertion validation against current global tier
├─ INVALID → red halo → rejecting → available (no progress)
└─ VALID → green halo → inserted
   ├─ Release without Activate → available (no progress)
   └─ Activate → resolve branch+tier page → portal preview (no progress)
      └─ Release → controller commit
         → floor panel
         → tier-completion test
         → idempotent full-circle global ring
         → consuming → crystal/effect removal
```

Glyph and crystal hits are separate controller fields. Only `available` crystals are grabbable. The principal transient states are:

```text
materializing → available → pulling → held → inserted → active → consuming → removed
                                  ├─ invalid insertion → rejecting → available
                                  └─ release without preview → available
```

## Progress and floor ownership

`VrProgressionController` is the sole owner of committed logical progress. Its global requirements are all five branches for tiers 1–3, Metal + Water for tier 4, and Water for tier 5. Acquisition is not tier-gated; insertion is.

`createVrProgressFloor` is a visual projection with its own idempotent `activatedEntries` and completed-ring state. It receives a page only after the controller accepts Release commit. Both logical progress and floor visuals survive XR exit/re-entry in the already prepared page runtime; reload or navigation recreates them. There is no durable persistence or full-game reset.

## Progress-floor asset flow

```text
assetManifest → AssetManager
→ five sector models
  (`floor_creative.glb`, `floor_ethic.glb`, `floor_haiku_cosmos.glb`,
   `floor_dig_engine.glb`, `floor_ai_guide.glb`)
→ createVrProgressFloor → stationary VrTiltableFloorRoot
```

| Stable glyph ID | Logical cards | Shared crystal GLB variants |
| --- | ---: | ---: |
| `ethics-life-protection` | 3 | 3 |
| `creative-ai` | 3 | 3 |
| `ai-guide` | 3 | 3 |
| `spotify-digger` | 4 | 3 |
| `haiku-cosmos` | 5 | 3 |
| **Total** | **18** | **15** |

Tiers 4 and 5 reuse branch visual variants cyclically. Physical crystals do not carry page/card identity; `AssetManager` supplies every model and crystal spawn performs no fetch.

## Excluded dependencies

Portal/reliquary placement and insertion depend on authored transforms and the runtime scene hierarchy. Locomotion and crystal handling do not depend on physics. Sector-background progression, central progression core, floor tilting/local-plane locomotion, shells, orb assembly, semantic hand tools, small glyphs, antenna, runes, final radar, finale, durable persistence and full-game reset are not active dependencies.
