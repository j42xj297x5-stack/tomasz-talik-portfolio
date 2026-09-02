# Experience VR — Proto-Astro Model

Status: **CURRENT / BINDING** for Proto-Astro identity, Furnace essence truth, Astro bands and panel projections. Rune detail routes to [`VR_RUNE_STONES_MODEL.md`](VR_RUNE_STONES_MODEL.md).

## Ownership

- `ProtoAstroTuningController` exclusively owns natural Large Glyph essences `K/T/S/L/R`.
- Furnace progression exclusively owns successfully processed/absorbed Shell truth.
- `RuneStoneProgressionController` is implemented and separately owns `tunedRuneFamilies`; future installed truth remains in the Rune domain.
- `RuneRecipeInteraction` is implemented as the rune-mode owner of two typed Furnace slots.
- sector progression owns panel/sector completeness; it does not gate natural tuning.
- Attractor band UI owns only the selected object class. Attractor/panels are projections, not family-learning truth owners.
- A future **Astrolabium Tuning Domain / Actor** will interpret existing owner facts as family knowledge and bounded pull eligibility. It must not duplicate recipes, Furnace/extraction/Rune truth, Resonator timers, Scenario progress, or sector state; its exact API/name is not frozen and it is **NOT IMPLEMENTED**.

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

The canonical progression separates three questions:

```text
BAND EXISTS ≠ TARGET FAMILY IS UNDERSTOOD ≠ TARGET MAY CURRENTLY BE PULLED
```

After Astrolabium Więzi is physically acquired, all four implemented class bands — `SHELLS`, `SMALL_GLYPHS`, `LARGE_GLYPHS`, and `RUNESTONES` — are selectable. A band can legally contain zero known targets. It asks which object class to search; it does not promise that every family is understood. World visibility likewise grants no targetability. Stars remain celestial environment, not a fifth band.

This immediate-all-band policy is a **CURRENT / BINDING DESIGN TARGET, NOT IMPLEMENTED**: runtime still progression-filters the switchable list, including `RUNESTONES`. That behavior is an implementation gap and no longer canon.

## Progressive family knowledge — CURRENT TARGET / NOT IMPLEMENTED AS A UNIFIED DOMAIN

Astrolabium begins with five natural Shell families: Earth/K, Metal/T, Water/S, Wood/L, and Fire/R. Each is a legal `SHELLS` target immediately after tool acquisition. Per-family learning then deepens that vocabulary:

```text
processed natural Shell K/T/S/L/R → matching Small Glyph family becomes attractable
processed natural Small Glyph K/T/S/L/R → matching Large Glyph family becomes normally attractable
successful canonical Wu Xing recipe → resulting Rune Stone family becomes a legal RUNESTONES target
```

These rules are family-specific. Small Glyph extraction remains persistent learned Large Glyph-family knowledge; Resonator discovery does not replace or teach it. The existing recipe mapping and `tunedRuneFamilies` remain authoritative.

After all five natural Shell families have been successfully processed, special Shell `V / VO` becomes a legal next Shell target. It is not initial vocabulary. Processing it completes the six-Shell sequence toward Asterion Sphere creation. Its reveal-versus-recognition presentation remains open. `V` remains special, never enters `PROTO_ASTRO_NATURAL_FAMILY_CODES`, and does not create `VA`.

For ordinary early Large Glyph play, learned family knowledge is sufficient for attraction subject to ordinary legality. In the late escaped/reacquisition state it remains required, but transient Resonator `PULL_READY` is additionally required for physical pull. `PULL_READY` neither unlocks the band nor becomes permanent family knowledge. Runtime currently applies this gate too broadly; the corrected early/late policy and its exact late-state predicate are **NOT IMPLEMENTED** and must not invent a Scenario point.

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
