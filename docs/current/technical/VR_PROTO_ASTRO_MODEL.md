# Experience VR — Proto-Astro Model

Status: **CURRENT / BINDING** for Proto-Astro identity, Furnace essence truth, Astro bands and panel projections. Rune detail routes to [`VR_RUNE_STONES_MODEL.md`](VR_RUNE_STONES_MODEL.md).

## Ownership

- `ProtoAstroTuningController` exclusively owns natural Large Glyph essences `K/T/S/L/R`.
- `RuneStoneProgressionController` is implemented and separately owns `tunedRuneFamilies`; future installed truth remains in the Rune domain.
- `RuneRecipeInteraction` is implemented as the rune-mode owner of two typed Furnace slots.
- sector progression owns panel/sector completeness; it does not gate natural tuning.
- Attractor tool/panels are projections, not truth owners.

## Identity and tuning

Natural family codes are Earth `K`, Metal `T`, Water `S`, Wood `L`, Fire `R`. The Astro/Ether family `V` is special and is not in `PROTO_ASTRO_NATURAL_FAMILY_CODES`. Its canonical forms are `VO` (Shell), `VI` (Small Glyph) and `VU` (Rune Stone); `VA` does not exist because no Large Glyph form has been approved for this family. `VU` uses the canonical presentation asset `public/svg/VU.svg`.

Existing Proto-Astro essence extraction remains distinct from Rune tuning. Natural Rune recipes are:

| Small Glyph | Shell | Tuned Rune family |
| --- | --- | --- |
| Earth | Metal | Metal |
| Metal | Water | Water |
| Water | Wood | Wood |
| Wood | Fire | Fire |
| Fire | Earth | Earth |

All five natural recipes are available independently of sector completion. A valid selected recipe uses two typed slots and one `18 s` `RUNE_TUNING` cycle with `astro_piec_work_03.mp3`; ingredients are consumed only on successful completion. Persistent result is `RuneStoneProgressionController.tunedRuneFamilies`, not a physical Furnace item.

Implemented corrections: slot acceptance validates the selected recipe's expected family before ownership transfer, and changing to a different selected recipe ejects snapping/inserted ingredients player-facing around `1 m` without consuming them. Final recipe transaction validation remains a separate safety layer.

## Astro bands

`SHELLS`, `SMALL_GLYPHS`, `LARGE_GLYPHS` and `RUNESTONES` are implemented. `RUNESTONES` becomes available after at least one tuned natural family and exposes exactly the tuned natural families. Ether is not a natural target.

## Four-panel contract

| Panel | Current semantics | Status |
| --- | --- | --- |
| 1 | current target glyph: Shell `?O`, Small Glyph `?I`, Large Glyph `?A` only where that syllable exists, Rune Stone `?U` (`RU/TU/KU/LU/SU/VU`) | IMPLEMENTED for the current natural target flow; `VU` is canonical even though special `stone_06` target/display flow is not implemented |
| 2 | current band authored `band_01.svg`–`band_04.svg` plus presentation color | IMPLEMENTED |
| 3 | available targets for current band | FUTURE / NOT IMPLEMENTED |
| 4 | current-target distance | FUTURE / NOT IMPLEMENTED |

## Scenario boundary and spatial context

The implemented authored tail is `4.40 → 4.50 → 4.60 → 4.70 → 4.80`. `4.80` is stable; continuation is deferred. At Tier 3 Large Glyph moves to implemented `SPHERE_FAR = 80 m`. Physical natural Rune Stones occupy the implemented `RUNE_STONES = 50–75 m` layer. They begin hidden and the separate `REVEAL_NATURAL_RUNE_STONES` effect at `2.10` reveals them with the celestial world without granting targetability.

## Three independent Rune laws

1. **Natural tuning:** all five families; no sector-completion read.
2. **Natural targetability:** exactly `tunedRuneFamilies`.
3. **Installation readiness:** normally sector completeness, projected separately to Rune bridges. After `4.80`: Earth/Fire/Wood ready, Metal/Water not ready. Future Water override affects readiness only.

Ether `V`, including its `VU` Rune Stone form, remains special: no sixth natural family, sector, bridge, slot or standard tuning path.
