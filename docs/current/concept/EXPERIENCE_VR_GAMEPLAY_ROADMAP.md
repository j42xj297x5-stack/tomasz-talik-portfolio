# Experience VR Gameplay Roadmap

Status: concept roadmap synchronized on 2026-08-05. This document marks implemented QA/prototype mechanics separately from future production gameplay. The runtime authority remains [`VR_RUNTIME_MODEL.md`](../technical/VR_RUNTIME_MODEL.md).

## Current accepted direction

The accepted QA/prototype direction after the Asterion/platform stage is a rotating `VrTiltableFloorRoot` platform under a world-stable glyph ring / shell field / cosmos. `VrPlatformFixturesRoot`, the monkey anchor and `VrFloorPassengerRoot/playerRig` inherit the platform. Player locomotion follows the platform-local tangent plane with a safe radial boundary.

This resolves the previous open question of platform motion versus glyph-ring displacement for the tested prototype: the current direction is platform orientation control with the glyph ring kept world-stable. Future production puzzles may still tune how radar/sectors use that relationship, but the implemented stage is no longer undecided.

## Implemented QA/prototype stage — Asterion platform control

- [x] QA-only physical Asterion Sphere / Kula Asterionowa behind `?asterionSphere`.
- [x] Spatial gyroscope floor control using PREVIEW / COMMAND / CURRENT.
- [x] CONTROL BASE + HAND REFERENCE multi-step target capture and smooth rebase.
- [x] Bounded platform tilt/orientation through `VrTiltableFloorRoot`.
- [x] Player passenger hierarchy through `VrFloorPassengerRoot/playerRig`.
- [x] Platform fixtures hierarchy through `VrPlatformFixturesRoot`.
- [x] Local-plane locomotion on the tilted platform.
- [x] Safe radial walking boundary using the snapshot `glyphOrbit.effectiveRadius`; outward movement is blocked while tangent movement remains allowed.
- [x] Heavy inertial angular drive with angular velocity, acceleration/deceleration, braking-distance control, smooth retarget and exact final settle.
- [x] Independent left Asterion tool mode: X toggles `NORMAL_HAND ↔ ASTERION_SPHERE`.
- [x] Independent right Astro Attractor mode: A toggles `NORMAL_HAND ↔ ASTRO_ATTRACTOR` after unlock.

This is a QA/prototype control system. It is not production physical construction, not 6/6 materialization and not the `UTWÓRZ` action.

## Implemented foundation

- [x] Separate Classic 2D, Experience 3D and Experience VR presentations.
- [x] WebXR runtime with local-floor/local reference handling.
- [x] Ordinary `2.3 m` rays with real-hit shortening.
- [x] Glyph hold → physical crystal spawn.
- [x] Reliquary Activate/Release preview and commit contract.
- [x] `VrProgressionController` as sole owner of committed portfolio-card progress.
- [x] Five progress-floor sectors, 18 panels and optional tier rings.
- [x] Tier-1 Astro unlock and 18-shell field.
- [x] Astro Attractor scan/pull/capture-ready and explicit ordinary-ray handoff.
- [x] Placed shell ordinary-ray re-grab.
- [x] Astro Furnace option/open/insert/activate/content interactions.
- [x] Six unique shell material progression in `VrAstroFurnaceProgressionController`.
- [x] Furnace panel deterministic Asterion hologram and shell-patch assembly.
- [x] Repeatable single-shell 18-second furnace cycle, completion-only material commit and `astro_piec_work_01.mp3` DEVICE one-shot.

## Production Asterion construction — implemented

- [x] Transfer the completed six-shell material set into a visible physical construction sequence.
- [x] Add the physical **UTWÓRZ** action.
- [x] Materialize the production luminous Asterion Sphere after the correct production gate.
- [x] Equip the completed production sphere as a progression-earned tool.
- [x] Connect production construction to progression without faking `6/6` from QA flags.

The furnace material store can reach `complete=true` at `6/6`, and the panel can show a complete hologram. That does not mean a physical production Asterion Sphere exists.

## Radar and sector targeting — next major stage

- [ ] Define radar/sektorowe namierzanie around the world-stable target frame and rotating platform.
- [ ] Reuse Asterion platform control as the player-facing aiming/orientation mechanic.
- [ ] Decide sector feedback, target readability and comfort limits for Quest-class hardware.
- [ ] Keep progression ownership outside the gyro controller.

## Later progression — future

### Small glyphs and floor control

- [ ] Small glyphs take over progression after production sphere construction.
- [ ] GREEN capability targets small glyphs.
- [ ] Input priorities prevent tool, crystal, button and shell actions from firing together.

### Moving sectors and antenna

- [ ] Completed sectors become controllable antenna elements.
- [ ] Alignment/lensing provides clear visual feedback and remains solvable without audio.

### UI-visible future furnace modules

- [ ] Astro Attractor (Astro Przyciągacz) glyph-based tuning/upgrades; the panel card is visible, but no recipe or module runtime exists.
- [ ] Emanation Matrix (Matryca Emanacji) rune-stone processing; the panel card is visible, but no recipe or module runtime exists.

### Rune stones and stored emanation

- [ ] BLUE capability targets rune stones.
- [ ] Rune stone → furnace/Emanation Matrix processing → stored progression or emanation state. No removable physical essence output is planned for the current furnace model.

### Final radar and Haiku Cosmos

- [ ] ULTRAVIOLET capability reveals final/distant glyphs.
- [ ] Completed sectors and essence unlock the final radar.
- [ ] The final crystal returns to the established reliquary preview/commit contract.

## Constraints that remain binding

- `VrProgressionController` remains the sole owner of committed cards and tier completion; `VrAstroFurnaceProgressionController` separately owns committed furnace material state.
- Physical crystals remain branch+tier objects; page resolution stays at Activate.
- Existing Astro handoff remains explicit ordinary-ray targeting and squeeze, not proximity takeover.
- Placed shells remain ordinary-ray re-grabbable and excluded from Astro targeting.
- No future band implies an unrestricted global scene raycast.
- QA physical Asterion/floor control implemented now is distinct from future production construction/materialization.
- Planned systems remain unchecked until runtime implementation and validation exist.

## Risks

1. **Comfort and platform motion:** keep bounded angular speeds, stable distant reference cues and Meta Quest hardware validation before expanding dependent puzzles.
2. **State ownership:** keep explicit state machines and idempotent progression events; avoid distributing committed state across visual modules.
3. **Transparency/emission cost:** control overdraw and simultaneous lights on Quest-class hardware.
4. **Input conflicts:** preserve semantic actions, hand-mode ownership and real-hit priorities.
5. **Communication:** each tier transition needs readable spatial feedback without relying on text or sound.
