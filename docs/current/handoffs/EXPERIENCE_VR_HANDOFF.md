# Experience VR Handoff

Status: current implementation snapshot synchronized on 2026-08-05 after Meta Quest 3S hardware validation.

## What works now

- Experience VR boots as a separate WebXR runtime with its own scene, renderer, `playerRig`, controllers and animation loop.
- Glyph/crystal/reliquary progression, progress-floor panels/rings, Tier-1 Astro unlock, shell scan/pull/handoff/place and Astro Furnace material progression remain active.
- Platform fixtures and the monkey move with `VrTiltableFloorRoot`; the glyph ring, shell field and cosmos remain world-stable.
- `playerRig` is a passenger under `VrFloorPassengerRoot`, so camera/controllers/grips inherit the platform. There is no horizon-lock compensation.
- Smooth locomotion follows the platform-local tangent plane, preserves local Y and enforces the snapshot `glyphOrbit.effectiveRadius` radial boundary by blocking outward movement while allowing tangent motion.
- `?asterionSphere` enables the QA physical Asterion Sphere / Kula Asterionowa. Left X toggles `NORMAL_HAND ↔ ASTERION_SPHERE`; right A keeps the independent `NORMAL_HAND ↔ ASTRO_ATTRACTOR` toggle. Both tools can be equipped together.
- Asterion PREVIEW / COMMAND / CURRENT is usable for multi-step targeting. CONTROL BASE + HAND REFERENCE drive PREVIEW, trigger-held accepts PREVIEW into COMMAND, release freezes COMMAND, and CURRENT is the actual platform orientation.
- The QA sphere visual contract is active: `inner_ring2`, `inner_ring3` and `PIV_TARGET_AXIS` show PREVIEW; `master_ring1`, `master_ring2` and `inner_ring1` show CURRENT; authored idle fan motion remains on `inner_ring2/inner_ring3`.
- TARGET rebase is smooth through `displayPreviewQuaternion` and an approximately `0.5 s` visual rebase, so the target frame does not visually teleport after LOCK.
- Heavy angular drive is active and hardware-verified; trigger release and unequip do not stop platform travel.

## Important architecture

```text
WORLD
├── world-stable glyphRing / shell field / cosmos
└── VrTiltableFloorRoot
    ├── floor sectors / rings
    ├── monkeyAnchor
    ├── VrPlatformFixturesRoot
    │   ├── portal
    │   ├── reliquary
    │   ├── furnace
    │   └── furnace panel
    └── VrFloorPassengerRoot
        └── playerRig
            └── camera / controllers / grips
```

`VrProgressionController` remains the only owner of committed portfolio-card progress. `VrAstroFurnaceProgressionController` remains the only owner of committed six-shell furnace material progress. Asterion gyro writes the quaternion of `VrTiltableFloorRoot`; it does not own progression and does not convert the furnace panel hologram into a production physical sphere.

## Current tuning values

- Ordinary ray range: `2.3 m`.
- Glyph hold: `0.5 s`; miss grace: `0.15 s`.
- Crystal spawn offset: `0.30 m` inward.
- Astro scan: `3R` length, `2.5°` half-angle.
- Astro pull: `10 m/s²`, max `8.5 m/s`, capture readiness at `0.28 m`.
- Shell return after cancel: `0.8 s`.
- Furnace process: `18 s`, `42 RPM`, extraction from `6–15 s`, cooldown from `15–18 s`.
- Asterion heavy drive: `maxAngularSpeedDegrees = 32`, `angularAccelerationDegrees = 32`, `angularDecelerationDegrees = 45`, `settleAngularSpeedDegrees = 0.15`.

## Hardware validation

Validated on Meta Quest 3S for this snapshot:

- platform fixtures and monkey inherit platform movement correctly;
- `playerRig` is a platform passenger;
- locomotion works on the tilted local surface with radial limit;
- PREVIEW / COMMAND / CURRENT, CONTROL BASE / HAND REFERENCE and ring visualization are comfortable;
- authored idle fan on `inner_ring2/inner_ring3` remains active;
- TARGET rebase is smooth;
- heavy angular inertia behaves correctly;
- X toggles left `NORMAL_HAND ↔ ASTERION_SPHERE`;
- right hand remains independent for `NORMAL_HAND ↔ ASTRO_ATTRACTOR`.

## Next major stage

The next larger Experience VR stage is radar/sector targeting and further use of Asterion platform control. Production Asterion construction/materialization, `UTWÓRZ`, production unlock/gating, small glyph progression, radar sectors and final radar remain future work.
