# Experience VR — Current Handoff

Status: **CURRENT operational snapshot — 2026-09-05**. Authorities: [`VR_RUNTIME_MODEL.md`](../technical/VR_RUNTIME_MODEL.md), [`VR_SCENARIO_DIRECTOR_MODEL.md`](../technical/VR_SCENARIO_DIRECTOR_MODEL.md), [`VR_PROTO_ASTRO_MODEL.md`](../technical/VR_PROTO_ASTRO_MODEL.md), [`VR_RUNE_STONES_MODEL.md`](../technical/VR_RUNE_STONES_MODEL.md), and [`VR_ASTERION_RESONATOR_MODEL.md`](../technical/VR_ASTERION_RESONATOR_MODEL.md).

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
