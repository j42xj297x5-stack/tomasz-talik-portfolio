# Experience VR — Platform Energy VFX Model

## Status

Status: **CURRENT / IMPLEMENTED / FINAL PRODUCT BEHAVIOR**. Platform and Resonator lightning is presentation-only. It observes existing gameplay truth and never owns Rune readiness, installation, sector control, field synchronization or progression.

## Current gameplay meanings

The shipped lightning language is intentionally described by meaning rather than by requiring historical profile names:

1. **Keystone/Binder installation path.** A live Binder readiness transition (`HIDDEN → ARRIVING`) produces the reveal/installation energy choreography. This is the current keystone-install lightning presentation; absence of a legacy `RUNE_INSTALL` API name is not a missing feature.
2. **Sector acquisition.** While the Sphere is actively acquiring a legal sector, acquisition progress drives energy strength. It ends at lock or loss/change of the candidate.
3. **Sector movement.** Actual local-sector angle changes drive energy. Merely holding a stationary sector does not. Settling motion continues to count while its angle changes.
4. **Correctly tuned Resonator field.** `createVrAsterionResonatorFieldArcPresentation` observes the synchronized field descriptor and presents field lightning when `waterSyncLock` is true.
5. **World release.** The finale temporarily drives sector energy while sectors separate, then stops it before the whiteout completes.

These effects are the final intended lightning behavior. Extra detent sparks, extra variants, independent multi-layer bolt shells and a required historical profile/API are not planned work.

## Shared platform actor

`PlatformEnergyVfxActor` owns a bounded reusable pool, construction-time geometry/material allocation and fail-soft spawning. Read-only projections translate Binder readiness, acquisition progress and real sector motion into actor commands. Saturation may omit a branch or effect without altering gameplay.

The rendered arcs use exact main endpoints, variable width, bright core plus soft halo, shallow surface lift and bounded stochastic leader-like tortuosity. Non-recursive branches originate from curvature on the rendered parent path and leave forward from its local tangent. The implementation is physics-inspired presentation, not an electromagnetic simulation.

## Ownership boundaries

- Rune/bridge owners decide readiness and installation.
- acquisition/control owners decide candidate, lock and motion.
- the Field Actor decides `waterSyncLock`; field arc presentation only observes it.
- finale actor decides when world-release energy is active.
- audio is owned by separate projections.

No visual effect may commit or reconstruct source truth. Existing tuning values remain runtime/settings authority and are not changed by this documentation synchronization.
