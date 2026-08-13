# Decision Log

Status: current binding decisions organized by implementation status, not patch chronology. Synchronized on 2026-08-13.

## Canonical Story Reindex Migration — IMPLEMENTED

**CURRENT (2026-08-13):** LIVE Scenario używa flat slice `1.10`, `1.20`, `1.30`, `1.40`, `1.50`, `1.60`, `1.70`, `1.80`, `1.100`, `1.100.1`, `1.110`, `1.120`, `1.120.1`, `1.130`, `100.10`. `1.90` pozostaje **RESERVED / WATER CRYSTAL TUTORIAL / NOT IMPLEMENTED**. Stare produkcyjne IDs objęte canonical mappingiem są **SUPERSEDED / RETIRED** i nie mogą zostać ponownie użyte; `100.10` pozostaje bez zmiany.

Migracja zmieniła wyłącznie adresy punktów i jawne targety. Eventy, numeric choices, effects, milestones, actor/runtime behavior i SG statuses są bez zmian. M1.12 ma **HARDWARE PASS — Meta Quest 3S**, SG-036 **MIGRATED**, a SG-041 jest **MIGRATED** po M1.13. Scenario Spine pozostaje **TARGET / NOT IMPLEMENTED**; Director nadal używa wyłącznie explicit `transition.target`. Canonical Story Reindex jest **IMPLEMENTED / behavior-neutral**; post-reindex regression: **PASS — Meta Quest 3S**.

## Implemented and binding

### Canonical story indexing — flat mainline, local branches and Scenario Spine

1. Point ID has authoring form `ACT.MAINLINE_POINT[.LOCAL_BRANCH...]`: two segments identify a flat mainline beat; three or more identify only a local branch owned by that beat. Mainline progression never inherits the previous beat's address.
2. Authors space planned mainline beats by `10` by default. This is an authoring convention, not Runtime arithmetic; gaps are insertion reserve, may be used in any deliberate order and never require later points to be renumbered.
3. A mainline insert such as `1.11` belongs between `1.10` and `1.20`. A branch such as `1.100.1` does not belong to the mainline spine and exits only through an explicit transition to its hub, another branch or a mainline point.
4. Scenario owns the authored **Scenario Spine / Mainline Spine**, meaning the explicit order of two-segment mainline points. Director does not sort IDs, inspect gaps, add `1` or `10`, interpret spine or infer next; it follows only explicit `transition.target`.
5. A future authoring builder/normalizer may expand spine order into explicit targets before the Director boundary. Scenario Spine is an approved TARGET concept, but its final production representation/API is deferred to a separate implementation task.
6. An obligatory authored hint that changes progression flow may be a point. A contextual stuck-player cue may execute while `currentPointId` remains unchanged and need not consume an address.
7. `1.x` is PROLOG / INTRO; `2.x` is PRÓG I through the first five-crystal loop; `3.x` is PRÓG II beginning after that full five and covering the next Astro, shell, Furnace and Asterion Sphere phase; `100.x` remains ENDING / EXIT. No Act 4+ detail is created here.
8. A never-used slot remains **UNUSED** and may be assigned later. A published address that is removed or replaced is **RETIRED / REMOVED / SUPERSEDED** and can never receive another meaning.
9. The one-time **CANONICAL STORY REINDEX MIGRATION** is **IMPLEMENTED** as a corrective exception, not a precedent for discretionary renumbering. All former live addresses are SUPERSEDED / RETIRED and cannot be reused.
10. The corrective migration reindexed production Scenario without implementing a spine builder/parser, automatic routing, ID sorting, next-point resolver or point arithmetic.

### Experience VR Scenario + Director migration foundation and implemented routing baseline

1. Experience VR adopts a two-module migration seam: an immutable declarative Scenario supplies semantic event/capability/milestone/effect identifiers and scene transitions; a framework-free Director coordinates only those values.
2. Milestones are monotonic narrative history. A session reset preserves them and returns the Director to its initial scene; an explicit hard reset represents a new game and clears them.
3. Director capabilities express only global scenario permission. Actor-local correctness, geometry, physics, state machines, UI hit testing, audio lifecycle and other invariants remain with their current subsystem owners.
4. Effects are symbolic output; the Director never invokes actors. `RuntimeExperience` is the framework-free boundary that executes injected handlers.
5. M0 and M1.1–M1.12 remain implemented with unchanged gameplay semantics. M1.12 is **IMPLEMENTED — HARDWARE QA PENDING**; the approved canonical corrective reindex is **IMPLEMENTED**.
6. SG-032, SG-036, SG-039 and SG-040 are **MIGRATED**. SG-041 is **RETAINED** because follow pause/resume decision ownership and `FOLLOW_PAUSE_CHANGED` remain outside the migrated slice.
7. Point IDs are numeric-only strings of positive integer segments and are permanent structural addresses. ID, human-readable label and player-facing copy are separate layers; dialog or choice wording and narrative meaning are never encoded in an ID.
8. Numeric child points are reserved for local branches of a two-segment mainline beat. Their depth has authoring meaning but creates no implicit Runtime order, parent return or behavior.
9. Published IDs are stable. An unused gap is available insertion reserve; a removed or superseded ID is retired, never reused for another meaning, and gaps never trigger renumbering.
10. Director moves only through explicit transition targets: it never increments, sorts or infers a child, sibling, parent, return or first branch. An actor reports what the player selected without knowing a target point ID; Scenario owns the mapping from an accepted selection to its explicit target. `choice` routing is the sole implemented payload specialization: an optional positive integer on a transition is matched exactly against `payload.choice`; choice-routed and event-only transitions cannot be mixed for the same event in one point, and `(event, choice)` is unique. Unmatched choices are inert. This does not introduce predicates or a generic condition system.
11. Act `100` is reserved as the future ending/exit namespace. `100.1` is **FULL FINALE ENTRY / WHITE TRANSITION**, while `100.10` is **EXIT EXPERIENCE VR**, the actual departure from the VR mode. An early exit may explicitly jump straight to `100.10`; full completion explicitly follows `100.1 → finale → 100.10`.
12. `100.10` is the LIVE EXIT EXPERIENCE VR point. `100.1` remains **RESERVED / FUTURE** as the full-finale entry.
13. M1.9 **NUMERIC CHOICE ROUTING FOUNDATION — IMPLEMENTED**. Numeric `choice` selects only a transition whose explicit Scenario `target` remains authoritative; it never derives a child point (`choice: 2` does not imply `.2`). Runtime forwards the unchanged payload to Director and effect handlers.
14. M1.9 itself did not extend the then-live Scenario; its foundation had Hardware QA **N/A**. Later M1.10–M1.12 routing is recorded in the dated binding decisions below.

### Runtime, progress and platform

1. Classic 2D, Experience 3D and Experience VR are separate presentations. `src/experienceVr.js` owns the independent WebXR scene, rig, lifecycle and loop; WebXR owns the tracked camera.
2. `VrTiltableFloorRoot` is the active platform transform root and the visual progress-floor root. The world-stable glyph ring, shell field and cosmos remain outside it.
3. Platform-relative children include floor sectors/rings, `VrMonkeyMotionRoot`, `VrPlatformFixturesRoot` and `VrFloorPassengerRoot/playerRig`.
4. `VrPlatformFixturesRoot` is a structural platform-relative container. Its direct fixture children include `VrMonkeyStoneRoot`, portal, reliquary, Astro Furnace and furnace panel; their visibility is controlled individually rather than by treating the container as one device.
5. `VrFloorPassengerRoot` carries `playerRig`; camera, controllers and grips inherit the platform. There is no world-stable/horizon-lock camera compensation.
6. Smooth locomotion is tracked-head-relative right-stick translation on the platform-local tangent plane plus left-stick continuous rig yaw. Platform normal replaces world Y, local rig Y is preserved and diagonal input is capped.
7. The walking boundary is the snapshot `glyphOrbit.effectiveRadius`; outward movement at the boundary is blocked while tangent movement remains allowed.
8. Ordinary controller rays have a maximum range of `2.3 m` and shorten only to reported real interaction hits.
9. Five branches contain 18 cards in counts `3 / 3 / 3 / 4 / 5`. Physical crystals are branch+tier instances without persistent page/card identity; acquisition is additive and insertion is current-tier gated.
10. Player-facing Release is disabled for `inserted`. Activate advances `inserted → active` and previews; only physical Release from `active` commits through `VrProgressionController`, projects to the floor and consumes. Internal recovery APIs do not define player actions. Invalid insertion returns without progress.
11. The floor contains five authored sectors, 18 panels and five optional procedural tier rings. Committed progress survives XR re-entry only in the prepared runtime. Durable persistence does not exist.

### Intro P0 and Monkey transform authority

1. The implemented intro P0 proceeds through XR calibration, radial fog reveal, player-panel/controls onboarding, pointer/trigger onboarding, invitation, `FOLLOWING`, threshold choice, physical ring entry, `MONKEY_SETTLING` and `GLYPH_FREE_EXPLORE`.
2. `monkeyMotionRoot` is the runtime transform owner for intro motion. The sequence captures its canonical transform after scene composition, moves it for the walk and settles it back to that transform.
3. `MONKEY_ANCHOR` is a character-local asset reference used only to align the character with the stone seat during `dockCharacterToStone()`; it does not own scene placement or intro motion. `VrMonkeyStoneRoot` is a direct child of `VrPlatformFixturesRoot`, never `VrMonkeyMotionRoot`.
4. Physical ring entry is `headRadius <= ringRadius`; the `0.75 m` safer-inner measurement is diagnostic only. Free exploration requires `monkeySettled && playerEnteredRing`, lasts `60 s`, and first-crystal discovery takes precedence over the delayed five-sign hint.

### Independent hand modes

1. Semantic input maps standard-gamepad button `4` to the right-hand A toggle and left-hand X toggle according to handedness; squeeze/button `1` maps to `grabAction`, and trigger/button `0` maps to `primaryAction`.
2. Controller construction is valid before handedness is known; left/right resolves after WebXR `connected`.
3. `createVrHandModeController` owns right `NORMAL_HAND ↔ ASTRO_ATTRACTOR` and left `NORMAL_HAND ↔ ASTERION_SPHERE` state.
4. RIGHT: A toggles Astro after unlock. `NORMAL_HAND` means Astro hidden/right ordinary ray visible; `ASTRO_ATTRACTOR` means Astro visible/right ordinary ray hidden.
5. LEFT: X toggles Asterion Sphere only after production `EARNED` or under the independent `?asterionSphere` QA availability override. `AVAILABLE` requires physical claim and does not unlock X. `NORMAL_HAND` means sphere unequipped/left ordinary ray visible; `ASTERION_SPHERE` means sphere equipped/left ordinary ray hidden.
6. Left and right modes are independent; Asterion Sphere and Astro Attractor can be equipped simultaneously.

### Tier-1 Astro and shells

1. Tier 1 unlocks Astro and activates an 18-shell field made from six assets cloned three times. `?p1` remains a QA shortcut for this state.
2. With Astro equipped, squeeze above `0.1` activates one local-`-Z`, `3R`, `2.5°` scan cone. Selection is an analytic cone-volume test of cached shell bounding spheres, not a ray fan.
3. Trigger above `0.1` while scanning pulls at `10 m/s²`, capped at `8.5 m/s`, toward `worldPosition(PIVOT_RING_MASTER) + worldDirection(controller local -Z) * 1.3 m`; readiness radius is `0.28 m`.
4. Shell state is `orbiting → targeted → pulling → capture_ready → held → placed`, with technical `returning`. Pre-takeover cancellation returns over `0.8 s`; the shell is excluded from Astro targeting until orbit is restored.
5. `capture_ready` takeover requires a real left ordinary-ray hit within `2.3 m`, halo/reporting and left squeeze while the left hand is free. Distance from the hand alone never performs takeover.
6. Placed shells remain excluded from Astro but support repeated ordinary-ray grab/place with either free hand; the right hand requires `NORMAL_HAND`, and the left hand requires `NORMAL_HAND`. Shell priority over crystals exists only on a real shell hit.

### Astro Furnace and Asterion material progression

1. The Astro Furnace is a material progression transformer/store, not a machine that generates removable physical essence output.
2. `VrAstroFurnaceProgressionController` exclusively owns committed furnace material progression, separate from `VrProgressionController`'s portfolio-card/tier/floor domain. There is no central global progression store.
3. Asterion Sphere requires exactly one of each `shell-relic-1` through `shell-relic-6`; these are six unique asset types, not any six instances.
4. An unknown or already committed shell type is invalid, cannot be taken over by furnace content interaction and cannot be consumed.
5. A valid inserted shell remains the same physical instance at `VR_FURNACE_CONTENT_ANCHOR` and is ordinary-ray retrievable after reopening until the process begins. Insertion and closing do not commit.
6. Progress commits only after physical visual absorption reaches `CONSUMED` and the activation process reaches `COMPLETE`. Neither condition alone is sufficient.
7. The CanvasTexture panel is a read-only projection of furnace progression, process and transient content state; it is not a state owner.
8. `complete=true` at `6/6` opens production `READY`; it does not itself construct, claim or earn the Sphere.

### Production Asterion Sphere

1. Production Asterion is made in the Astro Furnace from the six unique committed shells: `6/6 → READY → UTWÓRZ → BUILDING → AVAILABLE → explicit claim → EARNED`.
2. `SHELL_EXTRACTION` and `ASTERION_CONSTRUCTION` share the furnace-owned authoritative 18-second, 42-RPM process driver. Construction needs no shell in the content slot and uses its dedicated create audio rather than shell-process audio.
3. After a completed last-shell cycle, accepted `UTWÓRZ` may enter `PREPARING_CONSTRUCTION` and the authored reverse button-lock animation before `ASTERION_CONSTRUCTION / SPINUP`; preparation time is outside the 18 seconds.
4. One `/glb/asterion_sphere.glb` socket/model serves production presentation and earned hand equipment. No second model is created on claim.
5. Presentation and equipment lifecycles are separate: hand unequip does not clear presentation; production owns presentation cleanup and transfers the same socket on claim.
6. Claim is explicit and requires `AVAILABLE`, an open chamber, left `NORMAL_HAND`, a real ordinary-ray hit within `2.3 m`, halo and squeeze. It commits `EARNED` and auto-equips through the hand-mode controller.
7. `?asterionSphere` remains a QA availability override, never a `6/6`, `AVAILABLE` or `EARNED` progression source.
8. Asterion Sphere equipped and active-drive loops are implemented `DEVICE` audio behavior; exact lifecycle and asset mappings are owned only by `VR_AUDIO_MODEL.md`.

### Asterion Sphere and heavy platform drive

1. Production `EARNED` unlocks the same already-tested physical Asterion/floor control; `?asterionSphere` only bypasses availability for QA and does not fake furnace or production progress.
2. PREVIEW is live left-hand orientation expressed through CONTROL BASE + HAND REFERENCE and visualized by `inner_ring2`, `inner_ring3` and `PIV_TARGET_AXIS` with authored idle fan preserved.
3. COMMAND is the accepted target. Trigger-held copies PREVIEW into COMMAND; release freezes COMMAND and does not stop platform motion.
4. CURRENT is the actual `VrTiltableFloorRoot` quaternion and is visualized by `master_ring1`, `master_ring2` and `inner_ring1`.
5. LOCK rebases CONTROL BASE / HAND REFERENCE from CURRENT. `displayPreviewQuaternion` provides an approximately `0.5 s` visual rebase to avoid a TARGET-frame teleport.
6. The active drive maintains `angularVelocity` and uses braking-distance control with `maxAngularSpeedDegrees = 32`, `angularAccelerationDegrees = 32`, `angularDecelerationDegrees = 45` and `settleAngularSpeedDegrees = 0.15`.
7. Retargeting does not zero velocity. Unequip freezes COMMAND but CURRENT continues driving. LOCK requires small error and small angular speed, then performs exact final settle.
8. The drive is intentionally a heavy angular controller, not a full rigid-body physics simulation.

## Monkey seating asset contract — implemented

1. `public/glb/monkey.glb` (character node `monkey`) and `public/glb/monkey_stone.glb` (separate seat/stone) are distinct **PRESENT** physical assets.
2. The approved internal authoring contract is `MONKEY_ANCHOR → monkey` for the character and `MONKEY_STONE_ROOT → <stone mesh> + MONKEY_SEAT_ANCHOR` for the stone. `MONKEY_ANCHOR` is the character-local seated reference, `MONKEY_STONE_ROOT` the stone-local lower/root reference and `MONKEY_SEAT_ANCHOR` the stone-local seating point.
3. Runtime preloads both assets. `VrMonkeyMotionRoot` owns the actor, while `VrMonkeyStoneRoot` is a stationary platform fixture.
4. Normal composition bases authored `MONKEY_STONE_ROOT` at platform center `(0,0,0)`, then aligns the world position and rotation of `MONKEY_ANCHOR` with `MONKEY_SEAT_ANCHOR`. Their scales intentionally remain independent so the character retains its authored GLB scale.
5. `(0,0,0)` is the canonical transform of `VrMonkeyMotionRoot`, not the required physical world position of `MONKEY_ANCHOR`. The internal references never define P0 start or gameplay placement and require no magic offset.

## Approved future gameplay direction — not implemented

1. **B will select only Astro bands already unlocked by progression. B is currently not implemented.**
2. Planned bands remain RED/YELLOW/GREEN/BLUE/ULTRAVIOLET, but no future band implies an unrestricted global scene raycast.
3. Small glyph progression remains future after production sphere construction.
4. Radar sectors, antenna, runes, Emanation Matrix processing, final radar/finale, spatial audio, durable persistence and full-game reset remain future systems. Ambient sequencing and Asterion active-control sound are implemented and binding audio behavior.
5. Platform rotation under a world-stable glyph ring is implemented; production radar/sectors still need design and validation.

## Explicit current exclusions

Small glyph progression, Astro B/bands, radar/sector gameplay, final radar, teleport, jump, snap turn and rigid-body physics are outside the current Experience VR contract. Current Meta Quest 3S defects in physical Sphere placement and contour continuity are implementation QA issues, not exclusions or future features.

## 2026-08-13 — M1.10 numeric Intro invitation routing

- `INTRO_INVITATION_SELECTED` is the single semantic event; positive integer choices `1`, `2`, and `3` are stable IDs and labels remain copy.
- Scenario explicitly routes `1.100` and `1.100.1` to `1.110`, `1.100.1`, or LIVE terminal `100.10`; choice 2 at `1.100.1` is an intentional self-loop.
- One `CONTINUE_INTRO_INVITATION` effect resumes the safely waiting actor. `100.1` remains RESERVED / FUTURE. SG-036 and SG-041 remain RETAINED.
- Status: IMPLEMENTED — HARDWARE QA PENDING.


## 2026-08-13 — M1.11 Monkey reached threshold handoff

- M1.10 is **HARDWARE PASS — Meta Quest 3S**. M1.11 is **IMPLEMENTED — HARDWARE QA PENDING**.
- Scenario owns `1.110 → MONKEY_REACHED_THRESHOLD → 1.120`; the transition adds no milestone and emits `PRESENT_THRESHOLD_CHOICE`. Point `1.120` is terminal for the current slice.
- The Intro actor retains physical following and enters `WAIT_RUNTIME_AFTER_MONKEY_REACHED_THRESHOLD` as its exactly-once gate. Runtime alone invokes the guarded threshold-presentation seam. Threshold choices and selection remain legacy.
- SG-032, SG-039 and SG-040 are **MIGRATED**. SG-036 and SG-041 remain **RETAINED**. Migrating the threshold-arrival edge does not migrate SG-041 as a whole: pause/resume distance decisions, `FOLLOW_PAUSE_CHANGED`, and movement/follow policy remain outstanding.

## 2026-08-13 — M1.12 threshold choice branch

- M1.11 is **HARDWARE PASS — Meta Quest 3S**. M1.12 **THRESHOLD CHOICE BRANCH** is **IMPLEMENTED — HARDWARE QA PENDING**.
- `THRESHOLD_SELECTED` carries numeric choice 1, 2, or 3. Scenario explicitly routes both `1.120` and `1.120.1` to CROSS terminal `1.130`, BEYOND/self-loop `1.120.1`, or LIVE exit `100.10`; no threshold milestone is added.
- The single `CONTINUE_THRESHOLD_CHOICE` effect resumes an actor guarded by `WAIT_RUNTIME_AFTER_THRESHOLD_SELECTED`. UI strings are adapter-only and Runtime receives only `{ choice }`.
- `100.10` is LIVE EXIT EXPERIENCE VR. `100.1` remains RESERVED / FUTURE.
- Audit verification closes SG-036 as **MIGRATED**. SG-041 remains **RETAINED** because follow pause/resume decision ownership and `FOLLOW_PAUSE_CHANGED` remain outside this slice.

## 2026-08-13 — M1.13 follow pause-resume handoff

- M1.12 is **HARDWARE PASS — Meta Quest 3S**. Canonical Story Reindex is **IMPLEMENTED / behavior-neutral**; post-reindex hardware regression is **PASS — Meta Quest 3S**. M1.13 is **IMPLEMENTED — HARDWARE QA PENDING**.
- LIVE local branch `1.110.1` means FOLLOWING / Monkey waiting for player. It belongs to `1.110` and is not part of the future Scenario Spine. Scenario Spine remains **TARGET / NOT IMPLEMENTED**; `1.90` remains **RESERVED / NOT IMPLEMENTED**.
- Actor owns physical distance/grace sensing, motion and fog. Scenario routes `FOLLOW_PAUSE_CHANGED` by current point, without payload predicates or numeric choice. Runtime executes the single `APPLY_FOLLOW_PAUSE_STATE` command through the guarded actor continuation.
- No milestone was added. SG-041 is **MIGRATED**; SG-036 remains **MIGRATED**.
