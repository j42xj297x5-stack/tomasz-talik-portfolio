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
├─ world root → central object, monkey, lights, glyph orbit, portal
├─ playerRig → controllers + locomotion
├─ glyph interaction → crystal collection
├─ reliquary → Activate / Release
├─ VrProgressionController → progress floor
├─ Tier-1 Astro/shell slice
   ├─ semantic input
   → hand mode controller
   → Astro visual tool
   → scan cone
   → shell attractor interaction
   → shell system
└─ Astro Furnace
   ├─ furnace asset / mirrored placement
   ├─ open interaction
   ├─ activate interaction
   ├─ option interaction
   ├─ content interaction
   ├─ furnace panel
   └─ VrAstroFurnaceProgressionController
```

Handedness is populated after each WebXR controller `connected` event; construction does not require an initial left/right value.

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

A / toggleRightTool
→ NORMAL_HAND ↔ ASTRO_ATTRACTOR

ASTRO_ATTRACTOR
→ right squeeze > 0.1
→ one 3R analytic cone scan
→ cone target (cached bounding sphere)
→ right trigger > 0.1
→ pull (10 m/s², max 8.5 m/s)
→ capture_ready at Master Ring + controller-local -Z × 1.3 m
→ left standard 2.3 m ray + squeeze
→ held
→ release
→ placed under VrWorldRoot

cancel before takeover
→ returning for 0.8 s, attractorTarget=false
→ orbiting, attractorTarget=true

placed shell, attractorTarget=false
→ ordinary 2.3 m ray of either free hand
   (right only in NORMAL_HAND)
→ re-grab
→ release
→ placed
```

Shell-over-crystal priority is conditional on an actual shell ray hit. Astro acquisition cannot target placed shells.

## Active shell-to-furnace flow

```text
shell system
→ content interaction
→ VrAstroFurnaceProgressionController
→ furnace panel (read-only projection)

Tier 1 complete → shell field
→ Astro scan/pull → capture_ready
→ ordinary-ray takeover → held / placed
→ open furnace → held shell reaches INSERT_VOLUME
├─ unknown/duplicate → INVALID → remains physical
└─ required missing type → VALID → release
   → same instance snaps to CONTENT_ANCHOR → INSERTED
   → close furnace
   → activate interaction → PRESSING → SPINUP
   → content CONSUMING → CONSUMED (no commit yet)
   → activate interaction COMPLETE
   → commit shellAssetId → controlled physical removal
   → panel x/6 update
```

Insertion depends on `OPEN + IDLE + empty content`. Reopening before activation exposes the inserted instance to ordinary-ray retrieval and does not commit. The commit dependency is strictly `CONSUMED + COMPLETE`; session reset before it clears transient content without progress.

## Floor asset flow

```text
asset manifest → AssetManager
→ five sector models → createVrProgressFloor → VrTiltableFloorRoot
→ 18 authored panels + optional five procedural tier rings
```

The optional procedural ring layer can fail without blocking the critical sector/panel floor.

## Not active dependencies

Progressive sector backgrounds, central progression core, Astro B/bands, physical Asterion Sphere construction, floor-control sphere, floor tilting/local-plane locomotion, small glyphs, antenna, rune/Emanation Matrix processing, final radar/finale, audio, durable persistence and full-game reset are not active runtime dependencies.
