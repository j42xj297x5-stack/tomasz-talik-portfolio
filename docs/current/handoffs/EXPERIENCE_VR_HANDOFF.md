# Experience VR — Current Handoff

Status: current delivery handoff synchronized with HEAD on 2026-08-12. It intentionally does not duplicate runtime, audio or narrative contracts.

## Current stage

M0 through M1.12 are implemented, while M1 remains **IN PROGRESS**. M1.12 **THRESHOLD CHOICE BRANCH** is **IMPLEMENTED — HARDWARE QA PENDING**. The current production Scenario still uses the pre-reindex nested `1.x` addresses; `100.10` is LIVE EXIT and `100.1` remains RESERVED / FUTURE.

SG-032, SG-036, SG-039 and SG-040 are **MIGRATED**. SG-041 remains **RETAINED** because follow pause/resume decision ownership and `FOLLOW_PAUSE_CHANGED` remain outside the migrated slice. The approved crystal/grip tutorial remains **NOT IMPLEMENTED**.

## M1.9 Numeric Choice Routing Foundation

**IMPLEMENTED.** Director supports an optional positive-integer `choice` and exact `(event, payload.choice)` matching while retaining event-only behavior. Choice-routed and event-only transitions cannot be mixed for one event in one point, and unmatched choices are inert. The selected transition's explicit `target` is authoritative: the Director never derives `.2` from `choice: 2`. Runtime forwards the same payload unchanged.

This infrastructure does **not** extend production Scenario. The current terminal remains `1.4.5`; invitation remains legacy; SG-036 remains **RETAINED**, with only `MONKEY_HOVERED` and `MONKEY_TRIGGERED` migrated. No invitation transition, new live point, event, effect, or player-facing behavior was added. Hardware QA: **N/A** for M1.9 itself because no production transition uses `choice`; automated regression confirms the unchanged M1.8 flow, whose status remains **HARDWARE PASS — Meta Quest 3S**.

## M1.4 Meta Quest 3S smoke checklist

**HARDWARE PASS — Meta Quest 3S**

- [ ] Opening onboarding is unchanged.
- [ ] The Y prompt still has no timeout.
- [ ] Opening Y continues exactly once.
- [ ] The panel can be opened, viewed and closed as before.
- [ ] Controls detail is still required.
- [ ] Closing the panel still begins the same three messages.
- [ ] `WAIT_HOVER` appears at the same moment.
- [ ] Monkey hover/trigger is unchanged.
- [ ] Reset/re-entry repeats the flow exactly once.
- [ ] QA bypass has no regression.
- [ ] Messages and listeners are not duplicated.


## M1.5 Meta Quest 3S smoke checklist

**HARDWARE PASS — Meta Quest 3S**

- [ ] M1.4 behavior remains intact.
- [ ] The Y prompt opens exactly once.
- [ ] Entering STEROWANIE / controls DETAIL advances exactly once.
- [ ] Opening the panel without entering controls is insufficient.
- [ ] Other panel sections do not complete this step.
- [ ] The panel may remain open after controls are viewed.
- [ ] Closing the panel still starts exactly the same three messages.
- [ ] `WAIT_HOVER` is unchanged.
- [ ] Monkey hover/trigger behavior is unchanged.
- [ ] Reset/re-entry emits each handoff exactly once.
- [ ] Messages and listeners are not duplicated.


## M1.6 Meta Quest 3S smoke checklist

**HARDWARE PASS — Meta Quest 3S**

- [ ] M1.5 has no regression.
- [ ] Closing the panel after controls advances exactly once.
- [ ] Leaving the panel open does not start pointer tutorial.
- [ ] The same three post-close messages appear.
- [ ] Message timing is identical.
- [ ] `WAIT_HOVER` begins at the same moment.
- [ ] Monkey hover still shows “Teraz spust.” / “Now pull the trigger.”
- [ ] Trigger still enters the existing subsequent flow.
- [ ] Reset/re-entry repeats each handoff exactly once.
- [ ] QA bypass has no regression and synthesizes no `PLAYER_*` event.
- [ ] Messages and listeners are not duplicated.

## M1.7 Monkey Hover Handoff — Meta Quest 3S smoke checklist

**HARDWARE PASS — Meta Quest 3S**

- [ ] M1.6 has no regression.
- [ ] After the same three messages, `WAIT_HOVER` appears at the same moment.
- [ ] Looking without a real hover/hit does not advance.
- [ ] A real Monkey hover advances exactly once.
- [ ] “Teraz spust.” / “Now pull the trigger.” appears exactly as before.
- [ ] The trigger message does not appear before hover.
- [ ] Trigger before a valid hover cannot skip the step.
- [ ] Trigger after hover leads to the same `seen` messages.
- [ ] “Idziesz?” / “Will you walk?” appears as before.
- [ ] Reset/re-entry traverses the edge exactly once per run.
- [ ] QA bypass has no regression and synthesizes no `MONKEY_HOVERED`.
- [ ] Messages and listeners are not duplicated.


## M1.8 Monkey Trigger Handoff — Meta Quest 3S smoke checklist

**IMPLEMENTED — HARDWARE QA PENDING**

- [ ] M1.7 has no regression.
- [ ] “Teraz spust.” / “Now pull the trigger.” appears as before.
- [ ] Trigger before hover does not skip the step.
- [ ] A real trigger after hover advances exactly once.
- [ ] `Widzisz?` / `See?` appears exactly as before.
- [ ] The second seen line is unchanged.
- [ ] Timing of both seen messages is unchanged.
- [ ] `Idziesz?` / `Will you walk?` appears at the same moment.
- [ ] Invitation options are identical.
- [ ] Before Runtime continuation, seen/invitation does not start.
- [ ] Reset/re-entry traverses the trigger edge exactly once per run.
- [ ] QA bypass has no regression and synthesizes no `MONKEY_TRIGGERED`.
- [ ] Messages and listeners are not duplicated.

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

## M1.10 — INTRO INVITATION CHOICE BRANCH

**Status:** HARDWARE PASS — Meta Quest 3S.

Current LIVE routing is `1.4.5` choice 1 → `1.4.5.1`, choice 2 → `1.4.5.2`, choice 3 → `100.10`; point `1.4.5.2` exposes the same three edges, including its explicit choice-2 self-loop. `100.10` is LIVE terminal `EXIT EXPERIENCE VR`; `100.1` remains RESERVED / FUTURE. SG-036 and SG-041 remain RETAINED.

M1.8 is HARDWARE PASS — Meta Quest 3S. M1.9 Numeric Choice Routing Foundation is IMPLEMENTED (Hardware QA N/A), with post-M1.9 hardware regression PASS — Meta Quest 3S.

### Hardware QA checklist — M1.10

- [ ] M1.8/M1.9 without regression.
- [ ] `Widzisz?` and its second line are unchanged.
- [ ] `Idziesz?` appears as before.
- [ ] The three options retain their order.
- [ ] IDĘ starts follow exactly as before.
- [ ] DOKĄD? shows the same two responses.
- [ ] After DOKĄD?, `Idziesz?` and the same options return.
- [ ] DOKĄD? can be selected repeatedly without deadlock.
- [ ] IDĘ can be selected after DOKĄD?.
- [ ] NIE can be selected after DOKĄD?.
- [ ] NIE shows the same closing messages and ends the session at the same time.
- [ ] Branch selection is exactly once; no branch starts before Runtime continuation.
- [ ] Reset/re-entry works; there are no duplicate messages or listeners.
- [ ] QA bypass has no regression.


## M1.11 — MONKEY REACHED THRESHOLD HANDOFF

**Status:** IMPLEMENTED — HARDWARE QA PENDING.

M1.10 is **HARDWARE PASS — Meta Quest 3S**. The current boundary is `1.4.5.1 → MONKEY_REACHED_THRESHOLD → 1.4.5.1.1 → PRESENT_THRESHOLD_CHOICE → threshold choices legacy`. The actor safely waits after physical arrival; Runtime is the only accepted-transition route into the unchanged threshold dialogue. No milestone was added. SG-032, SG-039 and SG-040 are MIGRATED; SG-036 and SG-041 remain RETAINED. Remaining SG-041 includes pause/resume distance decisions, `FOLLOW_PAUSE_CHANGED`, and further movement/follow policy. Threshold selection remains legacy.

### APPROVED NEXT CONTENT INSERT — NOT IMPLEMENTED

After the current P0 migration, insert a grip tutorial after “Widzisz?” / “Już nauczyłeś świat, gdzie patrzysz.” and before “Idziesz?”. The approved sequence is: materialize a small WATER / Haiku Cosmos crystal above Monkey and slightly left; instruct the player to grab it; detect the physical grab; instruct release; detect release; dematerialize it; Monkey says “W tym miejscu nie możesz go zatrzymać.”; wait about 2 seconds; only then present “Idziesz?” and invitation options.

A later technical audit may reuse the reliquary crystal removal/release materialization mechanism when its contract permits safe reuse, together with WATER / Haiku Cosmos, the water acquisition sound on appearance, and release sound on disappearance. This approval does **not** implement an asset, spawn, grab, release, audio, tutorial events, or tutorial points.

## M1.12 — THRESHOLD CHOICE BRANCH

**Status:** IMPLEMENTED — HARDWARE QA PENDING. M1.11 is **HARDWARE PASS — Meta Quest 3S**.

The current threshold tree is:

```text
1.4.5.1.1
├── choice 1 → 1.4.5.1.1.1
├── choice 2 → 1.4.5.1.1.2
└── choice 3 → 100.10

1.4.5.1.1.2
├── choice 1 → 1.4.5.1.1.1
├── choice 2 → 1.4.5.1.1.2
└── choice 3 → 100.10
```

`100.10` is LIVE EXIT; `100.1` is RESERVED / FUTURE. SG-036 is **MIGRATED** after its threshold narrative decisions moved to Scenario. SG-041 stays **RETAINED** because follow pause/resume policy remains legacy.

### Meta Quest 3S hardware QA checklist — M1.12

- [ ] No M1.11 regression; Monkey stops at the same threshold.
- [ ] Threshold dialogue and all three options are identical and in the same order.
- [ ] CROSS begins crossing exactly as before.
- [ ] BEYOND shows the identical answer and returns the options.
- [ ] BEYOND can repeat, then transition to CROSS or RETURN.
- [ ] RETURN shows identical closing copy and ends the session at the same time.
- [ ] No branch starts before Runtime continuation; no duplicate callbacks, messages, or options.
- [ ] Reset/re-entry does not deadlock; QA bypass has no regression.

### APPROVED CRYSTAL TUTORIAL INSERT — NOT IMPLEMENTED

The approved future crystal/grip tutorial remains outside M1.12 and is not implemented.

## Canonical Story Reindex — next architectural blocker

**NEXT ARCHITECTURAL BLOCKER:** the separately approved, one-time **CANONICAL STORY REINDEX MIGRATION** must readdress the existing live `1.x` slice to the flat-mainline canon **before the next migration of new Scenario edges**. Current production IDs, tests, copy and gameplay are unchanged by this documentation patch; no Scenario Spine implementation exists yet. After that corrective migration, every former live address is **SUPERSEDED / RETIRED** and cannot be reused for another meaning.

The binding TARGET authoring model is: two segments for mainline beats, default spacing by `10` with intentional insertion reserve, and three or more segments only for local branches. Scenario owns the future Mainline Spine; Director remains limited to explicit transition targets and performs no ID arithmetic or spine interpretation.

Current delivery status remains unchanged: M1.12 is **IMPLEMENTED — HARDWARE QA PENDING**; SG-036 is **MIGRATED**; SG-041 is **RETAINED**; **APPROVED CRYSTAL TUTORIAL INSERT — NOT IMPLEMENTED**.
