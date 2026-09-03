# Dependency Map

## Documentation flow

`PROJECT_INDEX → canonical technical model → runtime evidence`. Rune authority is [`VR_RUNE_STONES_MODEL.md`](../technical/VR_RUNE_STONES_MODEL.md); Resonator/sector authority is [`VR_ASTERION_RESONATOR_MODEL.md`](../technical/VR_ASTERION_RESONATOR_MODEL.md), with field truth in [`VR_ASTERION_RESONATOR_FIELD_MODEL.md`](../technical/VR_ASTERION_RESONATOR_FIELD_MODEL.md).

## Experience VR composition and authored boundary

```text
SPINE → SCENARIO → DIRECTOR → RuntimeExperience → actors / domain owners

4.80 → 5.10 → 5.20 → 5.30 → 5.40 → 5.50 → 5.60 → 100.10
```

`5.60 — Five elemental Runes installed / full Resonator unlocked` is the stable implemented late-game boundary. `P6 → 5.10` remains a debug/QA alias only.

Scenario owns dramaturgy, required beats, Guidance/hints, revealed knowledge, crystal progression and semantic capabilities. It observes domain truth; it does not gate already-legal Rune tuning/pull/installation, powered-sector acquisition/control, or Resonator response through `currentPoint` or capability checks.

## Astrolabium family interpretation

```text
Furnace processed natural Shell truth
→ AstrolabiumTuningActor
→ matching natural SMALL_GLYPHS eligibility

Proto-Astro extracted natural Small Glyph essence truth
→ AstrolabiumTuningActor
→ matching ordinary LARGE_GLYPHS family knowledge

Rune tuning truth
→ AstrolabiumTuningActor
→ matching natural RUNESTONES eligibility

Furnace Asterion Sphere progression complete
→ AstrolabiumTuningActor
→ special V / VI SMALL_GLYPHS eligibility
```

`createVrAstrolabiumTuningActor` is an **IMPLEMENTED**, derived/read-only interpreter and owns no duplicate persistence. `VI` eligibility works live and after hydration from `getAsterionSphereProgress().complete`; it creates no Scenario event or boolean. The immediate-all-four-band UI policy remains a future UI target.

Special identities remain separate: five processed natural Shells expose `VO`; completed six-Shell Sphere progression exposes `VI`; later `CAN_TUNE_ETHER_RUNE` permits `VI + VO → VU`; later `REVEAL_ETHER_RUNE` materializes `stone_06 / VU`. `V` never enters natural family collections.

Ordinary Large Glyph pull requires learned family knowledge. Late `SPHERE_FAR` reacquisition additionally requires transient Resonator `PULL_READY`; the early/late policy is implemented.

## Rune tuning, transport, installation and reconstruction

```text
selected recipe + exact Small Glyph + exact Shell
→ frozen pre-flight
→ consume exact frozen ingredients
→ commit tuning truth
→ clear transaction and selected recipe
→ natural RUNESTONES eligibility
→ scan / lock / pull / CARRIED_ORBIT
→ legal platform handoff
→ installation lifecycle
→ RuneStoneActor INSTALLED
→ RuneBridgeActor BOUND (settled installed state)
→ installedRuneFamilies
```

Tuning, targetability and installation readiness are independent. Normal natural readiness reads sector completeness only. Natural Rune state contains exactly `K/T/S/L/R`; `V` remains special. Reconstruction restores settled installed Rune/`BOUND` bridge state without replaying transport, arrival or installation.

## Powered sectors and Metal ownership

```text
installed natural Rune
→ corresponding sector POWERED
→ acquisition beam legal
→ lockable / controllable

installed Metal Rune + M00
→ powered = true; active = false; no Metal extension

installed Metal Rune + any Metal DOF > 0
→ active = true
→ LATERAL/FORWARD Metal field extension
```

`CAN_USE_ADVANCED_RESONATOR` is implemented semantic Scenario truth at `5.60`; it does not own Metal beam availability, lock, dual-DOF control, sector motion, descriptor state, field extension, containment, morph, or rounding.

Metal `M(angle, tilt)` uses independent transient levels `0/1/2/3` at provisional detents `0°/13°/23°/36°`, dominant-axis gesture arbitration, and composed physical motion. Provisional `angle → LATERAL` adds `+8 m` per side for levels `1/3`; `tilt → FORWARD` adds nominal `+10 m`, clamped to `10–130 m`; `0/2` add no range. `M22` adds zero range and maximum Metal rounding. Exact mapping, signs/axes, dominance, distances and rounding values remain **TUNING / HARDWARE QA**.

## Single Resonator field truth

```text
installed Rune truth + committed sector levels
→ FieldDescriptor
→ resolveAsterionResonatorFieldShape()
├→ Field Presentation
└→ containsPointInAsterionResonatorField()
    → Target Acquisition
    → stages / decay / sign memory / PULL_READY
```

Metal changes the same resolved nominal shape used for gameplay containment; no parallel visual/gameplay Metal fields exist. Fillet, bow, skin, skeleton and morph are presentation-only and cannot enlarge containment.

## Implemented late Rune path

```text
FOURTH_RUNE_INSTALLED
→ mandatory Monkey Ether intervention
→ CAN_TUNE_ETHER_RUNE
→ ETHER_RUNE_TUNED
→ physical VU reveal
→ SPECIAL scan / lock / pull / CARRIED_ORBIT
→ ETHER_MONKEY_CAPTURED
→ waterInstallationReadinessOverride
→ Water Binder reveal/readiness
→ ordinary Water natural installation
→ FIVE_ELEMENTAL_RUNES_INSTALLED
→ full Resonator Monkey acknowledgement
→ CAN_USE_ADVANCED_RESONATOR
→ stable 5.60
```

The Ether actor never enters a natural installation slot. Monkey capture persists only the Water readiness override. Water then uses the standard natural installation path and joins the settled five-family natural arrays.

## Future boundary

Still **FUTURE / NOT IMPLEMENTED**: Water dual-DOF physical control; hue/luminance and W22 presentation; harmonic `222/M22/W22` recognition; Water Sync Lock/Contact; Haiku damping; Water-specific anti-bypass pull; final Water hunt/card; world dissolution and XR finale. Metal implementation does not imply these Water/finale systems exist.

## Validation boundary

Hardware smoke confirms corrected Metal Rune tuning completion, Metal beam/acquisition after installation, and `VI` targetability after Sphere completion. Detailed Metal gesture comfort, local signs/axes, dominance margin, composed motion, expansion distances, rounding readability and general perceptual tuning remain outstanding.
