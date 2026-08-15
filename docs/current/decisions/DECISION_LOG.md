# Decision Log

Status: current binding decisions organized by implementation status, not patch chronology. Synchronized after M2.2 on 2026-08-15.

## Experience VR Scenario and Director — binding after M2.2

1. Ownership follows **Spine → Scenario → Director → Runtime / actors / domain owners**. Spine alone owns authored mainline order; Scenario owns canonical point definitions; Director owns `currentPointId` and transition interpretation; execution and domain/transient truth remain downstream.
2. Point IDs are stable addresses, not sortable chronology. Normal mainline completion uses `Spine.next(currentPointId)` and does not duplicate the next point in a transition target. `EXPLICIT` is reserved for authored routing outside normal succession, currently EARLY EXIT.
3. The transition vocabulary is `STAY`, `COMPLETE`, `EXPLICIT`, `COMPLETE_IF`. `COMPLETE_IF` is restricted to `crossingComplete`; it is not a generic predicate DSL or rules engine.
4. WHERE, BEYOND, FOLLOW pause and hints are local `STAY`. Crossing is wholly represented by `1.130`; its transient join facts belong to the Intro actor and are not milestones or separate technical points.
5. `2.30` represents the complete first-ring five-card loop. Per-card preview, commit feedback and hints are local `STAY`; `createVrProgressionController` alone owns the tier completion fact. Its first-tier `5/5` produces `FIRST_RING_COMPLETED`, which completes `2.30` through Spine to `2.40`.
6. `2.40` is the canonical first-ring-completed `5/5` point and current end of implemented Scenario. It has no route back to the loop.
7. Scenario capabilities may make the whole vessel loop available, but domain interaction state enforces Activate only for `inserted` and Release only for `active`. Interaction phases are not story points.
8. Reconstruction remains `stateAt(X) = fold(settledConsequences of Spine points strictly before X)`. It never reconstructs transient/live state. The mechanism is implemented, but current consequences are empty; hydration, arbitrary Director start, owner restore, reconstruction-backed QA aliases, save and progression after `2.40` are not implemented.

## 2026-08-14 — P4 rune stones and sector vessels canonical target model

1. P4 uses exactly five pair-specific units: five distinct animated rune stones and five corresponding sector vessels from one visual/construction family. The pair, not a global socket assumption, owns final stone pose and safe envelope.
2. Every stone has one stable runtime root; every vessel exports a root, precise authored `SOCKET_POINT` and forgiving `SOCKET_ZONE`. Existing internal stone animation remains baked in GLB and continues after installation.
3. The developed Astrolabium guides a large stone around the platform's exterior, never into the player or platform interior. Installation requires physical orbital transport, correct pair/sector capture and a completed controlled snap; zone entry alone is not a progression commit.
4. Installed stones logically block later stones through a lightweight occupied-orbit model, not full rigid-body or animated mesh collision. Every stone retains a moving/installed spatial audio loop owned by Three.js/Web Audio, not Blender.
5. Scenario owns authored P4 availability/order, the fifth-stone gate and completion meaning; Director owns transition legality; runtime actors execute targeting/orbit/capture/audio; Blender owns asset hierarchy/pivots/animation. The model is **TARGET / NOT IMPLEMENTED** and is normative in [`VR_RUNE_STONES_MODEL.md`](../technical/VR_RUNE_STONES_MODEL.md).
6. Dimensions, radii, timings, easing, audio parameters, release behavior and occupied-arc algorithm remain tuning/open decisions. Implementation must validate one complete Blender 5.1.2 pair before expanding to the other four and requires Meta Quest 3S QA.

## Implemented and binding

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
