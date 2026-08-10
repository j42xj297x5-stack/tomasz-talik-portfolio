# Decision Log

Status: current binding decisions organized by implementation status, not patch chronology. Synchronized on 2026-08-10.

## Implemented and binding

### Runtime, progress and platform

1. Classic 2D, Experience 3D and Experience VR are separate presentations. `src/experienceVr.js` owns the independent WebXR scene, rig, lifecycle and loop; WebXR owns the tracked camera.
2. `VrTiltableFloorRoot` is the active platform transform root and the visual progress-floor root. The world-stable glyph ring, shell field and cosmos remain outside it.
3. Platform-relative children include floor sectors/rings, `monkeyAnchor`, `VrPlatformFixturesRoot` and `VrFloorPassengerRoot/playerRig`.
4. `VrPlatformFixturesRoot` carries the portal, reliquary, Astro Furnace and furnace panel, so those fixtures move with the platform.
5. `VrFloorPassengerRoot` carries `playerRig`; camera, controllers and grips inherit the platform. There is no world-stable/horizon-lock camera compensation.
6. Smooth locomotion is tracked-head-relative right-stick translation on the platform-local tangent plane plus left-stick continuous rig yaw. Platform normal replaces world Y, local rig Y is preserved and diagonal input is capped.
7. The walking boundary is the snapshot `glyphOrbit.effectiveRadius`; outward movement at the boundary is blocked while tangent movement remains allowed.
8. Ordinary controller rays have a maximum range of `2.3 m` and shorten only to reported real interaction hits.
9. Five branches contain 18 cards in counts `3 / 3 / 3 / 4 / 5`. Physical crystals are branch+tier instances without persistent page/card identity; acquisition is additive and insertion is current-tier gated.
10. Activate previews. Release after Activate commits through the sole logical owner of the portfolio domain, `VrProgressionController`, projects to the floor and consumes the crystal. Invalid insertion returns without progress.
11. The floor contains five authored sectors, 18 panels and five optional procedural tier rings. Committed progress survives XR re-entry only in the prepared runtime. Durable persistence does not exist.

### Intro P0 and Monkey transform authority

1. The implemented intro P0 proceeds through XR calibration, radial fog reveal, player-panel/controls onboarding, pointer/trigger onboarding, invitation, `FOLLOWING`, threshold choice, physical ring entry, `MONKEY_SETTLING` and `GLYPH_FREE_EXPLORE`.
2. `monkeyMotionRoot` remains the runtime transform owner for intro motion. The sequence captures its canonical transform after layout composition, moves it for the walk and settles it back to that transform.
3. Existing `ANCHOR_MONKEY` and the other current layout anchors remain exactly as defined by HEAD. No internal asset anchor replaces, moves or reparents `ANCHOR_MONKEY`.

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
8. Asterion active-control audio remains `DEVICE SOUND TBD`; no existing asset may be assigned by inference.

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
4. Radar sectors, antenna, runes, Emanation Matrix processing, final radar/finale, ambient sequencing, spatial audio, Asterion active-control sound, durable persistence and full-game reset remain future systems.
5. Platform rotation under a world-stable glyph ring is implemented; production radar/sectors still need design and validation.

## Explicit current exclusions

Small glyph progression, Astro B/bands, radar/sector gameplay, final radar, teleport, jump, snap turn and rigid-body physics are outside the current Experience VR contract. Current Meta Quest 3S defects in physical Sphere placement and contour continuity are implementation QA issues, not exclusions or future features.
