# Experience VR — Current Handoff

Status: current delivery handoff synchronized after M1.20R, M1.20F, M1.20M and the later floor-visibility ownership correction. It intentionally does not duplicate runtime, audio or narrative contracts.

## Current stage

M1 remains **IN PROGRESS**. M1.20R **Canonical Act Address Correction**, M1.20F **Floor Sector Reveal**, M1.20M **Monkey Attention Correction**, and the later correction making `VrProgressFloor` the sole owner of `sector.visible` are **IMPLEMENTED**. They do not complete the Scenario/Director migration: Act `3.x`, later stages and earlier audit blockers remain outstanding.

## CURRENT STATE — read this first

- LIVE address spaces are `1.x` Intro / Prolog, `2.x` the first five-crystal loop, and `100.x` exit. Act `3.x` is the post-`5/5` stage and is **PLANNED / NOT IMPLEMENTED**.
- LIVE first-loop points are `2.10`, `2.10.1`, `2.20`, `2.30`, `2.30.1`, `2.40`, `2.40.1`. Old `1.140`–`1.180.1` addresses are **RETIRED / SUPERSEDED**, never runtime aliases.
- Scenario Spine plus deterministic reconstruction are **TARGET / BINDING**, but their runtime schema/API, builder/normalizer, resolver and hydrator are **NOT IMPLEMENTED**. Director still follows explicit `transition.target`; no LIVE behavior changed.
- `VrProgressFloor` alone owns sector visibility; Intro no longer writes `sector.visible`. The first commit in a branch reveals its sector, and discovered sectors survive XR re-entry in the same runtime. The production body contract is BASE + authored overlay.
- **KNOWN HARDWARE ISSUE:** reveal currently includes a neutral gray BASE wedge. Canonical target presentation reveals the colored/authored body without the gray BASE.
- `CARD_COMMITTED` does not automatically start Monkey attention; `CUE_MONKEY_AFTER_CARD_COMMIT` is removed. First direct Monkey press clears pending attention even with `dialogueOverride`; contextual hints may still start attention.

## QA checkpoint target contract — TARGET / BINDING; runtime NOT IMPLEMENTED

`?p0`, `?p1`, `?p2` and future `?pN` are only `query → canonical Scenario point` aliases. Their world state must be reconstructed from settled consequences of all earlier mainline points on Scenario Spine; a checkpoint must not author cards, floor, Furnace, shells, tools, equipment or flags. `applyVrProgressionShortcut.js` remains a legacy/transitionary QA adapter, not the target pattern.

- no `?p`: normal Intro;
- `?p0`: canonical point `2.10`, clean gameplay start after ring entry — Monkey, stone and large glyphs; zero earned progress; no floor, portal, Vessel, Furnace or shells;
- `?p1`: after first `5/5` — complete first floor, Furnace available, Astro awaiting physical pickup;
- `?p2`: Astro earned, six unique shells credited, Asterion Sphere ready to create in the Furnace.

These descriptions identify intended canonical entry points rather than standalone snapshots. The aliases and reconstruction-backed bootstrap are **NOT IMPLEMENTED**; the current shortcut adapter does not satisfy this contract.

## Target progression after Tier 1 — PLANNED / NOT IMPLEMENTED

`5/5 first ring → complete first floor → new stage → Furnace → Furnace produces Astro → physical Astro pickup → only then shells activate → six unique shells enter Furnace → Furnace builds Asterion Sphere → physical Sphere pickup`. The superseded shortcut “Tier 1 → immediate automatic Astro unlock” is not canonical target behavior.

## Canonical Story Reindex Migration — IMPLEMENTED

**HISTORICAL IMPLEMENTED STAGE (2026-08-13):** ówczesne LIVE Scenario używało flat slice `1.10`, `1.20`, `1.30`, `1.40`, `1.50`, `1.60`, `1.70`, `1.80`, `1.100`, `1.100.1`, `1.110`, `1.110.1`, `1.120`, `1.120.1`, `1.130`, `100.10`. `1.90` pozostaje **RESERVED / WATER CRYSTAL TUTORIAL / NOT IMPLEMENTED**. Stare produkcyjne IDs objęte canonical mappingiem są **SUPERSEDED / RETIRED** i nie mogą zostać ponownie użyte; `100.10` pozostaje bez zmiany.

Migracja zmieniła wyłącznie adresy punktów i jawne targety. Eventy, numeric choices, effects, milestones, actor/runtime behavior i SG statuses są bez zmian. M1.12 ma **HARDWARE PASS — Meta Quest 3S**, SG-036 **MIGRATED**, a SG-041 jest **MIGRATED** po M1.13. Scenario Spine pozostaje **TARGET / NOT IMPLEMENTED**; Director nadal używa wyłącznie explicit `transition.target`. Canonical Story Reindex jest **IMPLEMENTED / behavior-neutral**; post-reindex regression: **PASS — Meta Quest 3S**.

The milestone sections below preserve chronological snapshots. Their then-current terminals, pending QA and RETAINED statuses are superseded by **CURRENT STATE** above.

## M1.9 Numeric Choice Routing Foundation — historical snapshot

**IMPLEMENTED.** Director supports an optional positive-integer `choice` and exact `(event, payload.choice)` matching while retaining event-only behavior. Choice-routed and event-only transitions cannot be mixed for one event in one point, and unmatched choices are inert. The selected transition's explicit `target` is authoritative: the Director never derives `.2` from `choice: 2`. Runtime forwards the same payload unchanged.

This infrastructure does **not** extend production Scenario. The current terminal remains `1.100`; invitation remains legacy; SG-036 remains **RETAINED**, with only `MONKEY_HOVERED` and `MONKEY_TRIGGERED` migrated. No invitation transition, new live point, event, effect, or player-facing behavior was added. Hardware QA: **N/A** for M1.9 itself because no production transition uses `choice`; automated regression confirms the unchanged M1.8 flow, whose status remains **HARDWARE PASS — Meta Quest 3S**.

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

Current LIVE routing is `1.100` choice 1 → `1.110`, choice 2 → `1.100.1`, choice 3 → `100.10`; point `1.100.1` exposes the same three edges, including its explicit choice-2 self-loop. `100.10` is LIVE terminal `EXIT EXPERIENCE VR`; `100.1` remains RESERVED / FUTURE. SG-036 and SG-041 remain RETAINED.

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

M1.10 is **HARDWARE PASS — Meta Quest 3S**. The current boundary is `1.110 → MONKEY_REACHED_THRESHOLD → 1.120 → PRESENT_THRESHOLD_CHOICE → threshold choices legacy`. The actor safely waits after physical arrival; Runtime is the only accepted-transition route into the unchanged threshold dialogue. No milestone was added. SG-032, SG-039 and SG-040 are MIGRATED; SG-036 and SG-041 remain RETAINED. Remaining SG-041 includes pause/resume distance decisions, `FOLLOW_PAUSE_CHANGED`, and further movement/follow policy. Threshold selection remains legacy.

### APPROVED NEXT CONTENT INSERT — NOT IMPLEMENTED

After the current P0 migration, insert a grip tutorial after “Widzisz?” / “Już nauczyłeś świat, gdzie patrzysz.” and before “Idziesz?”. The approved sequence is: materialize a small WATER / Haiku Cosmos crystal above Monkey and slightly left; instruct the player to grab it; detect the physical grab; instruct release; detect release; dematerialize it; Monkey says “W tym miejscu nie możesz go zatrzymać.”; wait about 2 seconds; only then present “Idziesz?” and invitation options.

A later technical audit may reuse the reliquary crystal removal/release materialization mechanism when its contract permits safe reuse, together with WATER / Haiku Cosmos, the water acquisition sound on appearance, and release sound on disappearance. This approval does **not** implement an asset, spawn, grab, release, audio, tutorial events, or tutorial points.

## M1.12 — THRESHOLD CHOICE BRANCH

**Status:** HARDWARE PASS — Meta Quest 3S. M1.11 is **HARDWARE PASS — Meta Quest 3S**.

The current threshold tree is:

```text
1.120
├── choice 1 → 1.130
├── choice 2 → 1.120.1
└── choice 3 → 100.10

1.120.1
├── choice 1 → 1.130
├── choice 2 → 1.120.1
└── choice 3 → 100.10
```

`100.10` is LIVE EXIT; `100.1` is RESERVED / FUTURE. SG-036 is **MIGRATED** after its threshold narrative decisions moved to Scenario. SG-041 stays **RETAINED** because follow pause/resume policy remains legacy.

### Meta Quest 3S hardware QA checklist — M1.12

- [x] No M1.11 regression; Monkey stops at the same threshold.
- [x] Threshold dialogue and all three options are identical and in the same order.
- [x] CROSS begins crossing exactly as before.
- [x] BEYOND shows the identical answer and returns the options.
- [x] BEYOND can repeat, then transition to CROSS or RETURN.
- [x] RETURN shows identical closing copy and ends the session at the same time.
- [x] No branch starts before Runtime continuation; no duplicate callbacks, messages, or options.
- [x] Reset/re-entry does not deadlock; QA bypass has no regression.

### APPROVED CRYSTAL TUTORIAL INSERT — NOT IMPLEMENTED

The approved future crystal/grip tutorial remains outside M1.12 and is not implemented.

## Canonical Story Reindex — IMPLEMENTED

Jednorazowy corrective reindex został wykonany. Current LIVE slice i statusy są zapisane w sekcji na początku handoffu. Nie wdrożono przy tym `1.90`, nowego edge, Scenario Spine, buildera ani normalizera. Approved crystal tutorial pozostaje **NOT IMPLEMENTED**; M1.12 ma **HARDWARE PASS — Meta Quest 3S**, a SG-036 i SG-041 są **MIGRATED** po M1.13.

## M1.13 — FOLLOW PAUSE-RESUME HANDOFF

**HARDWARE PASS — Meta Quest 3S.** `1.110` is active FOLLOWING. LIVE `1.110.1` is the local “Monkey waiting for player” branch and is explicitly outside the future Scenario Spine. Pause routes `1.110 → FOLLOW_PAUSE_CHANGED { paused: true } → 1.110.1`; resume routes `1.110.1 → FOLLOW_PAUSE_CHANGED { paused: false } → 1.110`. Routing is point-owned, never payload-predicate-owned. One `APPLY_FOLLOW_PAUSE_STATE` effect resumes the actor through its guarded seam; no milestone or numeric choice was added.

Physical grace/distance sensing, Monkey movement and fog interpolation remain in the actor. The shared safe wait prevents movement before accepted Runtime continuation. SG-041 is **MIGRATED** after point audit; SG-036 remains **MIGRATED**. Scenario Spine is **TARGET / NOT IMPLEMENTED** and `1.90` remains **RESERVED / NOT IMPLEMENTED**.

### Meta Quest 3S hardware QA checklist — M1.13

**PASS — Meta Quest 3S**, manually confirmed by the Designer:

- [x] Walking after GO works; grace distance has no regression.
- [x] Monkey stops when the player remains behind and stays stopped during pause.
- [x] The existing “Idziesz?” message works during pause.
- [x] Approaching clears the message and resumes Monkey movement.
- [x] Repeated pause/resume works without duplicates, deadlock or lock-up.
- [x] After resume Monkey reaches the threshold.
- [x] Threshold flow works after the migration.

## Remaining migration boundary — not implemented

Do not mark the Scenario/Director migration complete. The current LIVE graph reaches the first-loop `2.x` slice, but Act `3.x`, later stages and earlier audit blockers still require bounded follow-up. The retired `1.140`–`1.180.1` range must not be restored or reused.
