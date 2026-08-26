# Dependency Map

## Documentation flow

`PROJECT_INDEX → canonical technical model → runtime evidence`. Rune authority is [`VR_RUNE_STONES_MODEL.md`](../technical/VR_RUNE_STONES_MODEL.md).

## Experience VR composition

```text
SPINE → SCENARIO → DIRECTOR → RuntimeExperience → actors / domain owners
```

Scenario is implemented through `4.40 → 4.50 → 4.60 → 4.70 → 4.80`. Continuation after `4.80` is deferred.

## Experience VR main-background ownership

```text
Scenario semantic audio entry → Ambient Sequencer → VrAudioBridge → audioManager
```

This is the CURRENT / BINDING target ownership. Runtime synchronization remains pending; the current composition still derives main-ambient selection from progression tier and an Asterion subthreshold.

## Spatial presentation

```text
Tier 3 completion → LargeGlyphActor.SPHERE_FAR (80 m)
SphericalLayerRegistry.RUNE_STONES (50–75 m) → RuneStoneActor natural collection
```

Large Glyph is not a spherical layer.

## Rune tuning and targetability

```text
Small Glyph + Shell
→ RuneRecipeInteraction (two typed slots, 18 s RUNE_TUNING)
→ RuneStoneProgressionController.tunedRuneFamilies
→ RuneStoneAttractorBandProjection
→ RuneStoneAttractorInteraction
→ natural RuneStoneActor target / LOCKED_BY_ASTRO / CARRIED_ORBIT
→ RuneStoneInstallationInteraction
→ authored BRIDGE_STONE_CAPTURE + capture_radius_m
→ authored BRIDGE_STONE_ANCHOR / platform-bound INSTALLED
→ RuneBridgeActor ORBITING
→ RuneStoneProgressionController.installedRuneFamilies
```

Natural tuning does not read sector completeness. The `RUNESTONES` band becomes available after at least one tuned natural family; its target set is exactly the tuned natural families. Ether is excluded.

## Platform energy VFX presentation (TARGET / NOT IMPLEMENTED)

```text
RuneStoneInstallationInteraction read-only transient state ─┐
                                                            ├→ PlatformEnergyVfxProjection → PlatformEnergyVfxActor → sector-local / platform-bound procedural lightning
AsterionGyroInteraction driveActive / angular speed / lock ─┘
```

The projection and shared actor are presentation-only and never write back to Rune, progression, gyro or platform-motion owners. Authority and tuning boundaries are defined in [`VR_PLATFORM_ENERGY_VFX_MODEL.md`](../technical/VR_PLATFORM_ENERGY_VFX_MODEL.md).

## Installation readiness

```text
ProgressionController sector completeness (isBranchComplete)
→ RuneInstallationReadinessProjection
→ RuneBridgeActor HIDDEN / DOCKED
```

Normal readiness after stable `4.80`: Earth, Fire and Wood ready; Metal and Water not ready. The future `getWaterInstallationReadinessOverride` seam affects only Water installation readiness. It does not modify floor/panel truth, natural tuning or targetability.

## Independent owners

- `ProtoAstroTuningController`: natural essences for Large Glyph.
- `RuneStoneProgressionController`: separate `tunedRuneFamilies` and `installedRuneFamilies`; installed commit follows completed snap.
- sector progression owner: panel/sector completeness.
- `RuneStoneActor`: transient physical states and parenting/reset; `RuneBridgeActor`: authored capture/anchor geometry and transient bridge state; neither copies progression truth.
- `RuneStoneAttractorInteraction`: transport ownership and direct capture handoff.
- `RuneStoneInstallationInteraction`: capture tween and final installation transaction orchestration.

## Remaining seams

Socket capture and persistent installed truth are implemented. Carried-stone ↔ installed-stone collision is NEXT / NOT IMPLEMENTED; physical bridge extension motion remains NOT IMPLEMENTED / TUNING TARGET. Water override trigger, Ether flow, physical Rune Stone audio and authored Scenario after `4.80` remain future. Panels 1 and 2 are implemented; Panels 3 and 4 remain future.
