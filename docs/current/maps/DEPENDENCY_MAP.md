# Dependency Map

## Documentation flow

`PROJECT_INDEX → canonical technical model → runtime evidence`. Rune authority is [`VR_RUNE_STONES_MODEL.md`](../technical/VR_RUNE_STONES_MODEL.md).

## Experience VR composition

```text
SPINE → SCENARIO → DIRECTOR → RuntimeExperience → actors / domain owners
```

Scenario is implemented through `4.40 → 4.50 → 4.60 → 4.70 → 4.80`. Continuation after `4.80` is deferred.

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
```

Natural tuning does not read sector completeness. The `RUNESTONES` band becomes available after at least one tuned natural family; its target set is exactly the tuned natural families. Ether is excluded.

## Installation readiness

```text
ProgressionController sector completeness (isBranchComplete)
→ RuneInstallationReadinessProjection
→ RuneBridgeActor HIDDEN / DOCKED
```

Normal readiness after stable `4.80`: Earth, Fire and Wood ready; Metal and Water not ready. The future `getWaterInstallationReadinessOverride` seam affects only Water installation readiness. It does not modify floor/panel truth, natural tuning or targetability.

## Independent owners

- `ProtoAstroTuningController`: natural essences for Large Glyph.
- `RuneStoneProgressionController`: `tunedRuneFamilies`; future installed truth.
- sector progression owner: panel/sector completeness.
- `RuneStoneActor` and `RuneBridgeActor`: transient mechanics, never copied progression truth.

## Remaining seams

Socket capture, persistent installed truth, bridge extension timing, Water override trigger, Ether flow, physical Rune Stone audio and authored Scenario after `4.80` remain future. Panels 1 and 2 are implemented; Panels 3 and 4 remain future.
