# Dependency Map

## Documentation flow

`PROJECT_ENTRY.md` → `maps/PROJECT_INDEX.md` → smallest task-specific current model. Current VR work reads `technical/VR_RUNTIME_MODEL.md`, then `handoffs/EXPERIENCE_VR_HANDOFF.md`; future gameplay additionally reads the roadmap and decision log.

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
experienceVr
├─ settings + AssetManager → preloaded runtime GLBs
├─ worldRoot
│  ├─ world-stable glyph ring / shell field / cosmos
│  └─ VrTiltableFloorRoot
│     ├─ progress floor sectors / rings
│     ├─ monkeyAnchor
│     ├─ VrPlatformFixturesRoot → portal / reliquary / furnace / furnace panel
│     └─ VrFloorPassengerRoot → playerRig → camera / controllers / grips
├─ local-plane locomotion → VrFloorPassengerRoot/playerRig
├─ glyph interaction → crystal collection
├─ reliquary → Activate / Release
├─ VrProgressionController → progress floor projection
├─ independent hand modes
│  ├─ LEFT X: NORMAL_HAND ↔ ASTERION_SPHERE
│  └─ RIGHT A: NORMAL_HAND ↔ ASTRO_ATTRACTOR
├─ Tier-1 Astro/shell slice
│  ├─ semantic input
│  ├─ hand mode controller
│  ├─ Astro visual tool
│  ├─ scan cone
│  ├─ shell attractor interaction
│  └─ shell system
├─ Astro Furnace
│  ├─ furnace asset / platform-fixture placement
│  ├─ open / activate / option / content interactions
│  ├─ audit-derived patch data → Asterion sphere wireframe helper → furnace panel
│  └─ VrAstroFurnaceProgressionController
└─ QA Asterion Sphere behind ?asterionSphere
   ├─ createVrAsterionSphere → left-hand equipment and ring nodes
   └─ createVrAsterionGyroInteraction → PREVIEW / COMMAND / CURRENT + heavy angular drive
```

Handedness is populated after each WebXR controller `connected` event; construction does not require an initial left/right value.

## Platform and locomotion flow

```text
Asterion Sphere PREVIEW
→ trigger-held COMMAND
→ heavy angular drive with angularVelocity
→ CURRENT quaternion on VrTiltableFloorRoot
→ platform fixtures + passenger player inherit tilt/orientation
→ locomotion resolves on platform-local tangent plane
→ radial boundary uses snapshot glyphOrbit.effectiveRadius
```

The glyph ring and shell field stay world-stable, so the accepted QA/prototype direction is a rotating platform under a stable target frame.

## Progression and crystal flow

```text
glyph hold
→ branch+tier crystal 0.30 m inward from captured glyph position
→ ordinary-ray grab
→ held insertion feedback
├─ INVALID → rejecting → available
└─ VALID → inserted
   ├─ Release without Activate → available
   └─ Activate → page preview
      → Release → controller commit → floor panel → tier test/ring → consuming
```

`VrProgressionController` exclusively owns committed portfolio cards, branch/tier completion and the floor projection source. `VrAstroFurnaceProgressionController` independently owns committed furnace materials. Both domains survive XR re-entry in the prepared runtime, but not reload/navigation; there is no global progression store or durable persistence.

## Active Tier-1 Astro/shell flow

```text
Tier 1 complete
→ shell field active (6 assets × 3 instances)
+ Astro unlocked

RIGHT A / toggleRightTool
→ NORMAL_HAND ↔ ASTRO_ATTRACTOR

ASTRO_ATTRACTOR
→ right squeeze > 0.1
→ one 3R analytic cone scan
→ cone target (cached bounding sphere)
→ right trigger > 0.1
→ pull (10 m/s², max 8.5 m/s)
→ capture_ready at Master Ring + controller-local -Z × 1.3 m
→ left NORMAL_HAND standard 2.3 m ray + squeeze
→ held
→ release
→ placed under VrWorldRoot
```

Placed shells remain excluded from Astro targeting and are re-grabbable by ordinary rays of free hands only.

## Active shell-to-furnace flow

```text
shell system
→ content interaction
→ VrAstroFurnaceProgressionController
→ furnace panel (read-only projection)

open furnace → held shell reaches INSERT_VOLUME
├─ unknown/duplicate → INVALID → remains physical
└─ required missing type → VALID → same instance snaps to CONTENT_ANCHOR
   → close furnace
   → activate interaction → PRESSING → SPINUP
   → content CONSUMING → CONSUMED (no commit yet)
   → activate interaction COMPLETE
   → commit shellAssetId → controlled physical removal
   → panel x/6 update
```

Option selection of `floor_gyroscope_sphere` is a prerequisite for Open, insertion and Activate; the initial mode is unset. The audit-to-panel path carries deterministic exported patch data only: PCA and GLB analysis remain offline.

## Not active dependencies

Progressive sector backgrounds, central progression core, Astro B/bands, production physical Asterion Sphere construction/materialization, `UTWÓRZ`, production progression gate, radar sectors, small glyph progression, antenna, rune/Emanation Matrix processing, final radar/finale, audio, durable persistence and full-game reset are not active runtime dependencies.
