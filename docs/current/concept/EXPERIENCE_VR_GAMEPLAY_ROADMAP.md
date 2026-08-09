# Experience VR Gameplay Roadmap

Status: concept roadmap synchronized on 2026-08-09. The runtime authority remains [`VR_RUNTIME_MODEL.md`](../technical/VR_RUNTIME_MODEL.md).

## Implemented baseline

- [x] Independent WebXR runtime, platform hierarchy, platform-local locomotion and `2.3 m` ordinary rays.
- [x] Glyph/crystal/reliquary portfolio progression and five-sector/18-panel progress floor.
- [x] Tier-1 Astro unlock, 18-shell field, Attractor scan/pull/handoff and placed-shell re-grab.
- [x] Astro Furnace option/open/content/activate interactions and six-unique-shell progression.
- [x] Repeatable `SHELL_EXTRACTION`: shared 18 s / 42 RPM driver, completion-only commit and `astro_piec_work_01.mp3`.
- [x] Independent left/right hand modes and QA `?asterionSphere` availability override.
- [x] Existing Asterion PREVIEW / COMMAND / CURRENT, CONTROL BASE + HAND REFERENCE, smooth rebase and heavy angular platform drive.

## Production Asterion — IMPLEMENTED

- [x] `6/6 → READY` production gate independent of QA flags.
- [x] Panel **UTWÓRZ** and the post-sixth-shell `PREPARING_CONSTRUCTION` / reverse-lock transition.
- [x] `ASTERION_CONSTRUCTION` through the shared authoritative 18-second furnace process driver, with dedicated `astro_piec_work_create_01.mp3`.
- [x] Production state machine `LOCKED → READY → BUILDING → AVAILABLE → EARNED`.
- [x] Physical presentation of `/glb/asterion_sphere.glb` targeting `VR_FURNACE_CONTENT_ANCHOR` through shared content placement.
- [x] Six-patch panel sphere transforming into a progressively revealed, rotating contour blueprint from the same formation progress.
- [x] Explicit `AVAILABLE + OPEN + left NORMAL_HAND + ordinary-ray hit + halo + squeeze` claim.
- [x] Claim-time reuse of the same model/socket, `EARNED`, automatic left equip and subsequent X toggle.
- [x] Separate production-presentation and hand-equipment lifecycles.

Meta Quest 3S confirms the create action, automatic post-sixth-shell transition, construction mechanics and timing, panel transformation/rotation, and physical rendering. Two items remain **KNOWN QA ISSUE**, not future functionality:

1. **Physical placement:** the Sphere renders behind the furnace panel rather than correctly inside the chamber; the intended anchor contract is not yet hardware validated.
2. **Contour continuity:** the blueprint works and is readable, but some lines are fragmented/gapped.

## Radar and sector targeting — NEXT / FUTURE

- [ ] Define radar/sector targeting around the world-stable target frame and rotating platform.
- [ ] Reuse earned Asterion platform control as the aiming/orientation mechanic.
- [ ] Define sector feedback, readability and Quest comfort constraints.
- [ ] Keep progression ownership outside the gyro controller.

## Later progression — FUTURE

- [ ] B selects only progression-unlocked Astro bands; no band grants global raycasting.
- [ ] Small glyphs and GREEN capability continue progression after Sphere construction.
- [ ] Completed sectors become controllable antenna elements with readable alignment/lensing feedback.
- [ ] Astro Przyciągacz glyph upgrade recipes and Emanation Matrix rune processing.
- [ ] BLUE rune targeting and stored emanation progression.
- [ ] ULTRAVIOLET distant glyphs, final radar and final reliquary crystal.
- [ ] Ambient sequencer, spatial audio, Asterion active-control sound assignment, durable persistence and full-game reset.

## Binding constraints and risks

`VrProgressionController` remains the portfolio owner; `VrAstroFurnaceProgressionController` remains the furnace-material owner. Physical handoffs require real bounded-ray hits. Presentation and equipment lifecycle ownership stays explicit. Preserve world-stable distant cues, bounded heavy angular motion, idempotent commits and semantic input priorities. Validate placement, contour readability, comfort, transparency/emission cost and new interactions on Quest-class hardware before expanding dependent puzzles.
