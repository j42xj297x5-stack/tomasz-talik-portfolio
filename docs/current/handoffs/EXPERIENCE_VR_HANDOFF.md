# Experience VR — Current Handoff

Status: **CURRENT operational snapshot — 2026-09-11**. Authorities: [`VR_RUNTIME_MODEL.md`](../technical/VR_RUNTIME_MODEL.md), [`VR_SCENARIO_DIRECTOR_MODEL.md`](../technical/VR_SCENARIO_DIRECTOR_MODEL.md), [`VR_PROTO_ASTRO_MODEL.md`](../technical/VR_PROTO_ASTRO_MODEL.md), [`VR_RUNE_STONES_MODEL.md`](../technical/VR_RUNE_STONES_MODEL.md), and [`VR_ASTERION_RESONATOR_MODEL.md`](../technical/VR_ASTERION_RESONATOR_MODEL.md).

> **BOUNDED RINGS 1–3 SCENARIO PROGRESS RECONCILER IMPLEMENTED:** production orchestration now reconciles domain truth through mandatory authored sequences, Astro production, Asterion and first-Resonator join, bounded from `2.30` through stable `5.10`. See [`VR_SCENARIO_SANDBOX_RECONCILIATION.md`](../technical/VR_SCENARIO_SANDBOX_RECONCILIATION.md).

## Scenario reconciliation checkpoint

- Mandatory Ring completion entry semantics are self-contained at `2.40`, `4.20` and `4.75`; they do not require predecessor event payload, and hydrated Progress Floor tiers are tolerated without repeating their mutation.
- Ring 2 and Ring 3 no longer require Asterion. The canonical frontier is `4.70 → 4.75 → 3.80 → 4.80`, with `4.75` owning mandatory Ring 3 completion and Large Glyph settlement.
- Ordinary Reliquary lifecycle remains domain/physical after legitimate reveal.
- Bounded `ExperienceDirector.catchUpToPoint()` and reconciliation-safe actor observation, cancellation and Large Glyph transient-clear seams are implemented.
- The event-driven reconciler selects the earliest still-required canonical boundary, preserves every mandatory Ring sequence, and waits for Large Glyph transitions/transients rather than projecting tier directly into actor stage.
- Astro production is reconciled from its exact snapshot; Asterion remains independent at `3.80`; Resonator existence is projected through the existing semantic handoff at `4.80`.
- Missing ordinary Ring 1–3 Progress Floor panels are synchronized from `ProgressionController.getActivatedPageIds()` without replaying historical card feedback or audio.
- Reconstruction/debug activation suspends reconciliation and discards reconstruction-only wake-ups. Tier 4/5, Ether, Water, Rune installation, advanced Resonator and finale reconciliation remain outside this bounded patch.

## Runtime operations checkpoint

- Quest Browser and Chromium + Virtual Desktop / VDXR are manually validated paths; Chromium was validated with hardware acceleration enabled.
- Both use the CURRENT unified late WebGL2/renderer bootstrap, with no special query flag required for normal execution.
- The reusable `?debug` preload diagnostic workflow is IMPLEMENTED, defaults recording OFF and activates only selected scopes.
- `RUNE_TUNING_COMPLETION` is the first implemented scope; future bounded scopes may address other hard-to-reproduce runtime problems.

## Canonical checkpoint

- The authored late path is `4.80 → 5.10 → 5.20 → 5.30 → 5.40 → 5.50 → 5.60 → 100.10`; stable implemented late-game boundary is `5.60 — Five elemental Runes installed / full Resonator unlocked`.
- The implemented semantic sequence is `FOURTH_RUNE_INSTALLED → mandatory Monkey Ether intervention → CAN_TUNE_ETHER_RUNE → ETHER_RUNE_TUNED → physical Ether reveal/transport → ETHER_MONKEY_CAPTURED → Water installation readiness override → Water natural installation → FIVE_ELEMENTAL_RUNES_INSTALLED → full-Resonator Monkey acknowledgement → CAN_USE_ADVANCED_RESONATOR → 5.60`.
- All five natural families `K/T/S/L/R` can be persistently tuned and installed. Ether `V` remains SPECIAL and never enters `tunedRuneFamilies` or `installedRuneFamilies`.
- Generic Resonator containment, response, late `PULL_READY`, and moving-target reacquisition are implemented.
- Metal `M(angle, tilt)` dual-DOF physical control, composed sector motion, descriptor contribution, gameplay field extension, morph and presentation rounding are implemented.
- Astrolabium's tuning actor derives per-band eligibility read-only. Asterion Sphere completion makes `small-glyph-relic-6 / VI` legal in `SMALL_GLYPHS` without new Scenario or persistence truth.
- Large Glyph ordinary-ray permission begins at `2.10` and remains continuous. Post-first-ring elevation is `+4.0 m`, producing an approximately `5.05 m` orbit center; this is CURRENT tuning without established hardware/perceptual QA evidence.
- Large Glyph Astrolabium pull uses family knowledge in ordinary stages and family knowledge plus transient Resonator `PULL_READY` in `SPHERE_FAR`. Ordinary physical ray reach and portfolio `getNextCrystalTier(node)` eligibility remain independent from both laws.

## Ownership checkpoint

```text
installed natural Rune
→ corresponding sector POWERED
→ targetable / acquisition beam legal
→ lockable / controllable
```

This law applies to Metal. `M00` is powered but inactive and adds no range; any positive Metal DOF activates its extension. `CAN_USE_ADVANCED_RESONATOR` remains the implemented semantic capability at `5.60`, but does not own Metal beam availability, lock, control, or field response. Scenario interprets physical achievement and owns dramaturgy/crystal progression; it does not gate already-legal sandbox mechanics.

## Late special-family checkpoint

`VO`, `VI`, and `VU` are separate truths: five processed natural Shells expose `VO`; processing all six Shells completes Asterion Sphere and therefore derives `VI` targetability; later `CAN_TUNE_ETHER_RUNE` permits `VI + VO → VU`; `REVEAL_ETHER_RUNE` separately materializes `stone_06 / VU`. Ether transport ends in Monkey capture rather than a bridge slot. The capture persists only `waterInstallationReadinessOverride`, after which Water follows the ordinary natural installation lifecycle.

## Hardware evidence and next technical boundary

Hardware smoke confirms that Metal Rune tuning completes after the flat Shell identity fix, an installed Metal sector exposes a working acquisition beam, and `VI` becomes targetable after Asterion Sphere completion. This is not complete Metal hardware QA.

Outstanding Metal QA covers ANGLE/TILT gesture separation, signs/local axes, dominance margin, composed-motion comfort, `+8 m` lateral and `+10 m` forward adequacy, M22/off-center rounding readability, and general perceptual tuning.

The explicit next boundary is:

```text
Metal hardware tuning
→ Water advanced control
→ harmonic-array / Water Sync implementation
```

Water dual-DOF hue/luminance control, W22 presentation, harmonic recognition, Water Sync Lock/Contact, Haiku damping and anti-bypass pull, final Water hunt/card, dissolution, and XR finale remain **FUTURE / NOT IMPLEMENTED**.
