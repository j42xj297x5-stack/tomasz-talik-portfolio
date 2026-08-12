# Experience VR — Current Handoff

Status: current delivery handoff synchronized with HEAD on 2026-08-12. It intentionally does not duplicate runtime, audio or narrative contracts.

## Current stage

Experience VR has an implemented P0 intro, portfolio crystal progression, Tier-1 Astro/shell loop, Astro Furnace material loop, production/claim of the Asterion Sphere and heavy platform-orientation control. The transient ambient sequencer is **IMPLEMENTED**, not FUTURE. Exact owners, state machines, timings, hierarchy and visibility gates live only in the [VR Runtime Model](../technical/VR_RUNTIME_MODEL.md); audio mappings and sequencer behavior live only in the [VR Audio Model](../technical/VR_AUDIO_MODEL.md).

M0, M1.1 **Live Bootstrap Slice**, M1.2 **Intro Reveal Completion Handoff**, and M1.3 **Post-Reveal Silence Completion Handoff** are complete, while M1 overall remains **IN PROGRESS**. Scenario and `ExperienceDirector` are authoritative only for `XR_CALIBRATED → BEGIN_INTRO_REVEAL`, `INTRO_REVEAL_COMPLETE → BEGIN_POST_REVEAL_SILENCE`, and `POST_REVEAL_SILENCE_COMPLETE → BEGIN_CONTROLLER_ONBOARDING`; `RuntimeExperience` executes these symbolic effects through injected adapters. SG-032 and SG-039 are **MIGRATED**. The actor still measures the two-second silence, while the Y-panel UI facts and tutorial from `WAIT_PLAYER_PANEL_OPEN` remain with `createVrIntroSequence`; SG-040 and later groups are not migrated. Full central Scenario ownership does not yet exist, and RC-01…RC-14 are not consolidated.

## M1.1 Meta Quest 3S smoke checklist

**PASS — confirmed on Meta Quest 3S by Projectant, 2026-08-12**

- [ ] Normal VR entry starts fog/Intro exactly once.
- [ ] The first message appears exactly once.
- [ ] Y → controls → close is unchanged.
- [ ] Monkey hover and trigger are unchanged.
- [ ] Session exit and re-entry restart Intro.
- [ ] `?p1` preserves its bypass and rays.
- [ ] `?asterionSphere` preserves its bypass and rays.
- [ ] `?furnaceProcess` preserves its bypass and rays.
- [ ] `?furnace` preserves its bypass and rays.
- [ ] Fog does not start twice.
- [ ] Messages are not duplicated.
- [ ] Re-entry does not accumulate duplicate listeners.

## M1.2 hardware smoke

**PASS — confirmed on Meta Quest 3S by Projectant, 2026-08-12**

## M1.3 Meta Quest 3S smoke checklist

**PENDING — HARDWARE QA NOT EXECUTED**

- [ ] A full 2 s silence follows the reveal.
- [ ] The first message appears exactly once.
- [ ] The first message does not appear before silence completes.
- [ ] Rays enable exactly once at the unchanged moment.
- [ ] Monkey interaction enables at the unchanged moment.
- [ ] The three opening messages preserve order and tempo.
- [ ] The Y instruction remains visible without timeout.
- [ ] Y → controls → close remains unchanged.
- [ ] Reset/re-entry repeats the complete onboarding once.
- [ ] QA bypasses do not synthesize the callback.
- [ ] Messages are not duplicated.
- [ ] Listeners are not duplicated.

## Hardware QA

**HARDWARE VALIDATED on Meta Quest 3S:** `UTWÓRZ` after `6/6`, automatic sixth-shell transition, the 18-second construction and furnace mechanics, panel transformation/rotation, and physical Sphere rendering/materialization.

**HARDWARE VALIDATION PENDING:** corrected placement of the produced Sphere at `VR_FURNACE_CONTENT_ANCHOR`. The earlier behind-panel observation predates the correction and is not proof of a current runtime bug. Do not promote this placement to hardware-validated without explicit Wizjoner confirmation.

## Known issues

- The rotating blueprint is readable, but its contour lines remain locally fragmented/gapped.
- Final full-scale Monkey Guide clearance/readability still needs Quest-class visual QA; runtime already applies its floor-local clearance guard.

## Boundary for future work

The next design space is radar/sector targeting around the world-stable frame and the earned platform control. Authored narrative beyond P0, progression-stage Monkey dialogue, stuck-player support, Astro bands/B, small glyphs, antenna/runes/Emanation Matrix, finale, spatial audio, durable persistence and full-game reset remain FUTURE. Do not bypass existing progression, furnace-production, hand-mode or gyro owners.

## Canonical links

- Current hierarchy, owners, state machines, interactions, timings and P0 mechanics: [VR Runtime Model](../technical/VR_RUNTIME_MODEL.md)
- VR audio, including the implemented ambient sequencer: [VR Audio Model](../technical/VR_AUDIO_MODEL.md)
- Progress-floor geometry and projection ownership: [VR Progress Floor Model](../technical/VR_PROGRESS_FLOOR_MODEL.md)
- Current player experience, Monkey guidance and binding copy: [Narrative & Progression Baseline](../concept/EXPERIENCE_VR_NARRATIVE_PROGRESSION_BASELINE.md)
- NEXT and FUTURE scope: [Gameplay Roadmap](../concept/EXPERIENCE_VR_GAMEPLAY_ROADMAP.md)
