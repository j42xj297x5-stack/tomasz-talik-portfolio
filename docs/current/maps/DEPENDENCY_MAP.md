# Dependency Map

## Experience VR scenario migration seam (M1.1)

```text
experienceVr bootstrap
  → ExperienceDirector → vrExperienceScenario
  → RuntimeExperience → injected BEGIN_INTRO_REVEAL handler
  → existing createVrIntroSequence actor
```

M0 and M1.1 Live Bootstrap Slice are complete; M1 remains **IN PROGRESS**. Scenario/Director authority is limited to `XR_CALIBRATED → BEGIN_INTRO_REVEAL`, and `RuntimeExperience` is the symbolic-effect execution boundary. Only SG-032 is **MIGRATED**. Other P0 states remain in `createVrIntroSequence`; no full central Scenario ownership or RC-01…RC-14 consolidation exists.

## Documentation flow

`PROJECT_ENTRY.md` → `maps/PROJECT_INDEX.md` → smallest task-specific current model. Current VR implementation work starts with `technical/VR_RUNTIME_MODEL.md`; audio and progress-floor detail route to their dedicated models. The handoff contains only current delivery/QA context. Future gameplay reads the roadmap after the runtime model; narrative work reads the narrative baseline.

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
├─ ExperienceVrRoot
│  ├─ WorldStableRoot → glyph ring / shell field / cosmos
│  └─ VrTiltableFloorRoot at canonical (0,0,0)
│     ├─ progress floor sectors / rings
│     ├─ VrMonkeyMotionRoot → Monkey visual / Guide
│     ├─ VrPlatformFixturesRoot (structural)
│     │  └─ stationary VrMonkeyStoneRoot / portal / reliquary / furnace / furnace panel
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
│  ├─ VrAstroFurnaceProgressionController → 6/6
│  └─ VrAsterionProductionController → UTWÓRZ / READY / BUILDING / AVAILABLE / EARNED
├─ createVrAsterionSphere → production presentation + left-hand equipment on one socket/model
├─ createVrHandModeController → earned production or ?asterionSphere QA availability
├─ createVrAsterionGyroInteraction → PREVIEW / COMMAND / CURRENT + heavy angular drive
└─ fail-soft VR audio boundary
   └─ VrAudioBridge → shared audioManager + optional gameplay side effects
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
   → physical Release disabled
   → Activate → active + page preview
   → physical Release enabled → controller commit → floor panel → tier test/ring → consuming
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

## Production Asterion flow

```text
VrAstroFurnaceProgressionController
        ↓ 6/6
VrAsterionProductionController
        ↓
VrAstroFurnaceActivateInteraction
        ↓ ASTERION_CONSTRUCTION (shared 18 s process)
createVrAsterionSphere presentation
        ↓ AVAILABLE / explicit claim
createVrHandModeController
        ↓ EARNED
createVrAsterionGyroInteraction
        ↓
VrTiltableFloorRoot
```

`VrAudioBridge` is an optional fail-soft side effect of both furnace process kinds. Production presentation and equipment reuse one Sphere socket/model but have separate lifecycle ownership. `?asterionSphere` only overrides equipment availability and never supplies progression.

## Not active dependencies

Progressive sector backgrounds, a central progression core, Astro B/bands, radar sectors, small glyph progression, antenna, rune/Emanation Matrix processing, final radar/finale, spatial audio, durable persistence and full-game reset are not active runtime dependencies. The transient ambient sequencer and Asterion active-control sound are active audio dependencies owned by the VR audio model. Production Asterion and bounded VR gameplay audio are active; the two current hardware QA issues are physical chamber placement and contour-line continuity.
