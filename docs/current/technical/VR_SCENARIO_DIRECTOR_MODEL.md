# Experience VR — Scenario and Director Model

Status: **CURRENT / BINDING**. Runtime graph and reconstruction are implemented through stable `4.80`; authored continuation is deferred.

## Architecture and ownership

```text
SPINE → SCENARIO → DIRECTOR → RuntimeExperience → actors / domain owners
```

Spine owns authored order, Scenario owns declarative points and settled consequences, Director owns transition legality, RuntimeExperience composes semantic effects, and actors/domain owners retain their own transient or persistent truths. No central gameplay store is introduced.

## Implemented authored graph

```text
1.10 → … → 4.10 → 4.20 → 4.30 → 4.40 → 4.50 → 4.60 → 4.70 → 4.80
```

The implemented P2 tail is:

| Point | Canonical role |
| --- | --- |
| `4.40` | dedicated observation window |
| `4.50` | Monkey attention only |
| `4.60` | mandatory P2 message |
| `4.70` | grants existing B, Small Glyph, Furnace essence, family-gated Large Glyph, Crystal, Reliquary and order-3 card rights |
| `4.80` | stable settled Tier-3 boundary and entry boundary for later Rune Stone authoring |

Five order-3 cards complete into `4.80`. No Scenario point after `4.80` is implemented or authored by the Rune domain foundations. `100.10` remains the story terminal, but it is not presented as a direct implemented gameplay continuation from `4.80`.

## Reconstruction

`stateAt(X)` folds settled consequences strictly before `X`; it never reconstructs held targets, pulls, Furnace cycles, timers or panel UI. Stable `stateAt(4.80)` contains completed Tier 3, page IDs/orders through 3, floor completion through Tier 3, consumed Tier-3 crystal, Proto-Astro essences `K/T/S/L/R`, and `largeGlyphs.stage = SPHERE_FAR`.

Canonical debug intent `p5` is stable `4.80`. **Known implementation gap:** `src/xr/progression/vrDebugCheckpoints.js` still maps runtime `P5` to `4.40`. This document does not claim that alias behavior is fixed.

## Rune boundary

Rune A1–A9.4 are partially implemented runtime-domain foundations and do not extend Scenario. Natural tuning, targetability/transport and platform installation readiness remain independent domain laws. Socket capture, persistent installed truth, Water override trigger, Ether flow, further bridge mechanics and every authored continuation after `4.80` are **DEFERRED / NOT IMPLEMENTED**. Authority: [`VR_RUNE_STONES_MODEL.md`](VR_RUNE_STONES_MODEL.md).
