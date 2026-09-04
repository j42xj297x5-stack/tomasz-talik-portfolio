# Experience VR — Proto-Astro Model

Status: **CURRENT / BINDING** for Proto-Astro identity, Furnace essence truth, Astrolabium bands and eligibility projections. Rune detail routes to [`VR_RUNE_STONES_MODEL.md`](VR_RUNE_STONES_MODEL.md).

## Ownership

- `ProtoAstroTuningController` owns extracted natural Large Glyph essences `K/T/S/L/R`.
- Furnace progression owns processed/absorbed Shell truth and `getAsterionSphereProgress().complete`.
- `RuneStoneProgressionController` owns natural `tunedRuneFamilies` and `installedRuneFamilies`.
- `RuneRecipeInteraction` owns the two typed Furnace slots; sector progression does not gate natural tuning.
- `createVrAstrolabiumTuningActor` is **IMPLEMENTED** as a derived, read-only interpreter. It observes Furnace processed-Shell truth, Proto-Astro extracted natural Small Glyph essence truth, Rune tuning truth, and bounded Resonator eligibility; it derives targetable family sets per band without duplicating persistence.
- Band UI owns the selected object class. The broader immediate-all-four-band policy remains a **BINDING DESIGN TARGET / NOT IMPLEMENTED**; current eligibility derivation must not be confused with completion of that future UI policy.

## Identity and flat Shell adapter contract

Natural families are Earth `K`, Metal `T`, Water `S`, Wood `L`, and Fire `R`. Astro/Ether `V` remains SPECIAL and never enters `PROTO_ASTRO_NATURAL_FAMILY_CODES`.

```text
VO = Ether Shell
VI = Ether Small Glyph
VU = Ether Rune Stone
VA = nonexistent
```

`resolveAttractorShellGlyph()` exposes the resolved identity flat: `syllable`, `familyCode`, Proto-Astro form/family fields, `identity`, and `url`. Consumers must not assume `shellIdentity.descriptor.*` and no nested compatibility descriptor is part of the contract. Rune tuning frozen pre-flight reads `shellIdentity.syllable`; panel family lookup reads `shellIdentity.familyCode`.

## Tuning transaction

Natural recipes remain the Wu Xing cycle:

| Small Glyph | Shell | Tuned Rune family |
| --- | --- | --- |
| Earth | Metal | Metal |
| Metal | Water | Water |
| Water | Wood | Wood |
| Wood | Fire | Fire |
| Fire | Earth | Earth |

All five natural recipes remain independent of sector completion. The committed transaction law is:

```text
frozen recipe pre-flight
→ consume exact frozen Small Glyph + Shell
→ commit tuning truth
→ clear transaction
→ clear selected recipe
```

Slot acceptance validates expected family before transfer, recipe change ejects inserted ingredients player-facing, and ingredients are consumed only after successful completion. Hardware smoke confirms the previously frozen Metal completion path now succeeds after corrected flat Shell identity access; this is narrow hardware evidence, not broad automated validation.

## Band and eligibility laws

```text
BAND EXISTS ≠ TARGET FAMILY IS UNDERSTOOD ≠ TARGET MAY CURRENTLY BE PULLED
```

The implemented tuning actor derives:

```text
processed natural Shell K/T/S/L/R
→ matching natural Small Glyph family eligibility

extracted natural Small Glyph essence K/T/S/L/R
→ matching ordinary Large Glyph family knowledge

successful natural Rune recipe
→ matching natural RUNESTONES eligibility

Asterion Sphere progression complete
→ special family V eligibility in SMALL_GLYPHS
→ small-glyph-relic-6 / VI is targetable
```

`VI` eligibility reads only `furnaceProgressionController.getAsterionSphereProgress().complete`, live and after hydration. It creates no Scenario capability, milestone, point, or duplicated persistent boolean. Targetable `VI` does not permit Ether Rune tuning: `VU` tuning separately requires later `CAN_TUNE_ETHER_RUNE`, and physical `VU` reveal separately belongs to `REVEAL_ETHER_RUNE`.

After all five natural Shells have been processed, special Shell `V / VO` becomes a legal `SHELLS` target. Processing the six required Shells completes Asterion Sphere progression. `VO` unlock, `VI` eligibility, and `VU` tuning are deliberately not one Ether-unlocked flag.

Ordinary early Large Glyph pull uses learned family knowledge. A late `SPHERE_FAR` target additionally requires transient Resonator `PULL_READY`. This early/late policy is **IMPLEMENTED**; `PULL_READY` is neither band unlock nor persistent family knowledge.

## Four-panel status

| Panel | Current semantics | Status |
| --- | --- | --- |
| 1 | selected target syllable: Shell `?O`, Small Glyph `?I`, Large Glyph `?A` only where defined, Rune Stone `?U` | IMPLEMENTED, including special `VI`/`VU` identities |
| 2 | selected band asset/color | IMPLEMENTED |
| 3 | available targets for selected band | FUTURE UI policy; eligibility set derivation is implemented |
| 4 | selected-target distance | FUTURE / NOT IMPLEMENTED |

## Current progression boundary and Rune laws

The authored tail is `4.80 → 5.10 → 5.20 → 5.30 → 5.40 → 5.50 → 5.60 → 100.10`, with stable implemented boundary `5.60`. All five natural Rune families may be persistently installed. Ether reveal/transport/Monkey capture and the Water readiness override followed by ordinary Water installation are implemented.

Three natural Rune laws remain independent:

1. **Tuning:** all five natural families; no sector-completeness read.
2. **Targetability:** exactly natural `tunedRuneFamilies` for RUNESTONES; special `VI` eligibility belongs to SMALL_GLYPHS and does not contaminate this set.
3. **Installation readiness:** normally corresponding sector completeness; Water can additionally become ready through persistent `waterInstallationReadinessOverride`.

At the completed late state, `tunedRuneFamilies` and `installedRuneFamilies` contain exactly `K/T/S/L/R`; `V` remains SPECIAL with no sector, bridge/platform installation slot, or membership in either natural set.
