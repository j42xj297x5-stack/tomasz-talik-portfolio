# Experience VR Runtime Model

Status: canonical description of the implemented runtime synchronized after M2.2 on 2026-08-15. Approved future gameplay is documented in the [gameplay roadmap](../concept/EXPERIENCE_VR_GAMEPLAY_ROADMAP.md).

## Scenario composition boundary

The implemented composition follows `Spine → Scenario → Director → Runtime / actors / domain owners`. Spine owns authored mainline order, Scenario defines points and accepted events, and Director owns `currentPointId` and interprets `STAY`, `COMPLETE`, `EXPLICIT` and the crossing-only `COMPLETE_IF`. Runtime remains the symbolic-effect execution boundary. Actors and domain controllers retain physical, transient and committed domain state; Director does not use technical point IDs as memory for that state.

WHERE, BEYOND, FOLLOW pause and hints are local `STAY` reactions. Crossing exists only at `1.130`: the Intro actor owns `playerEnteredRing` and `monkeySettled`, reports `crossingComplete`, and Director advances only after that combined fact resolves completion. `100.10` is the canonical authored story terminal in Spine: the mainline metadata reaches it after stable `4.40`, while earlier explicit exit routes also converge there; `4.40` has no transition and does not auto-advance. It remains unavailable as a reconstruction/checkpoint start.

## Runtime boundary and lifecycle

`src/experienceVr.js` is the composition root of an independent, dynamically imported WebXR runtime. It owns its renderer, scene, base camera, `playerRig`, two controllers and `renderer.setAnimationLoop`; it does not start Experience 3D. Runtime preparation precedes the direct **Enter VR** gesture. The requested reference space is `local-floor`, with `local` fallback.

The composition root owns the small `VrAudioBridge` lifecycle. Optional VR audio requests cross its fail-soft boundary, which contains both synchronous exceptions and Promise rejections and reports them as `[vr-audio]` warnings. Calls are fire-and-forget side effects after gameplay transitions; they are never awaited by session, input, progression, state-machine or render-frame flows. The bridge delegates Web Audio ownership to the shared `audioManager`, stores no gameplay state and is disposed idempotently on `pagehide`. Five unity-gain VR buses (`SPACE`, `AMBIENT`, `DEVICE`, `WORLD`, `UI`) feed the existing Master Volume/mute. UI and world/device one-shots, glyph acquisition, the shell-pull loop and both Asterion Sphere loops are **IMPLEMENTED**. `experienceVr.js` also actively composes `createVrAmbientSequencer`: the current full tier and the completed-shell/built-Sphere subthreshold select finite ambient/quiet-loop sequences. Other Attractor target classes and spatial audio remain **FUTURE**. Detailed lifecycle and asset mapping belong to [`VR_AUDIO_MODEL.md`](VR_AUDIO_MODEL.md).

Experience VR uses one metre-based spatial contract: platform center and the canonical transform of `VrMonkeyMotionRoot` are `(0,0,0)`, the platform plane is `Y=0`, entry is `+Z`, the player viewpoint starts at radius `20`, the Monkey starts at radius `18`, and the glyph ring has one explicit canonical radius. Every session moves only `playerRig` so the tracked head reaches the canonical player point while preserving physical head height. Tracking never positions the Monkey, ring, stone, or fixtures. Session exit/re-entry clears transient crystals, shell interaction, controller hits, halos, glyph state, reliquary/buttons, Asterion QA state and portal preview, while committed progress and floor projection survive in the already prepared page runtime. Reload/navigation recreates them. There is no durable save or full-game reset.

Controller records may be constructed with `handedness === ''`. Hand identity is resolved only at runtime after WebXR's `connected` event; semantic input and hand-mode lookup therefore do not assume handedness during construction.

## World and platform hierarchy

The active hierarchy is platform-relative for floor gameplay and world-stable for the distant frame:

```text
ExperienceVrRoot
├── WorldStableRoot → glyphRing / shell field / cosmos
└── VrTiltableFloorRoot (identity position and scale)
    ├── floor sectors / rings
    ├── VrMonkeyMotionRoot → visual root / Monkey Guide
    ├── VrPlatformFixturesRoot (structural container)
    │   ├── VrMonkeyStoneRoot
    │   └── portal / reliquary / furnace / panel
    └── VrFloorPassengerRoot → playerRig → camera / controllers / grips
```

`VrTiltableFloorRoot` remains at canonical `(0,0,0)` and owns only inherited Asterion tilt. `VrMonkeyStoneRoot` is a direct child of `VrPlatformFixturesRoot`; it is never parented to `VrMonkeyMotionRoot`. `VrPlatformFixturesRoot` is only a structural transform container: intro and reset logic keep the container present and control the visibility/reveal of the stone, portal, reliquary and furnace individually. Fixtures, the Monkey actor and `VrFloorPassengerRoot/playerRig` inherit the platform quaternion. No initial-composition `attach()` or runtime scene-layout override exists.

## Ordinary rays, hand modes and locomotion

Both ordinary white controller rays have a maximum range of `2.3 m`. Interactive glyph, crystal, button and shell hits report their distance each frame, and the visible ray shortens to the nearest real hit. There is no scene-global raycast. Trigger state does not extend the ordinary range.

Hand modes are independent per hand:

```text
LEFT:  X → NORMAL_HAND ↔ ASTERION_SPHERE
RIGHT: A / existing toggle → NORMAL_HAND ↔ ASTRO_ATTRACTOR
```

`createVrHandModeController` owns equip/unequip for both tools. In right `NORMAL_HAND`, the Astro Attractor model is hidden and the connected right ordinary ray is active. In right `ASTRO_ATTRACTOR`, Astro is visible and the right ordinary ray is hidden. In left `ASTERION_SPHERE`, the Asterion Sphere is equipped and the left ordinary ray is hidden; in left `NORMAL_HAND`, the sphere is unequipped and the left ordinary ray returns immediately. The two modes do not block each other, so Asterion Sphere and Astro Attractor can be equipped at the same time.

The left joystick continuously yaws `playerRig`. The right joystick translates it on the current platform-local tangent plane: the platform normal replaces world Y, movement is resolved from the viewer direction projected onto that local plane, diagonal input is capped, and the rig's local Y is preserved. The walking boundary is the snapshot `glyphOrbit.effectiveRadius` captured for the platform passenger root; at the radial boundary, the outward component is blocked while tangent motion remains allowed. Teleport, jump, snap turn and horizon-lock camera compensation are absent: the camera/controllers/grips inherit `VrTiltableFloorRoot` through `VrFloorPassengerRoot`.

## Glyphs, crystals and reliquary

Large Glyph nodes have one canonical Experience VR visual baseline of `3×` from their creation, before Intro reveal and ring entry. Hover and transition effects remain relative to that node-owned baseline. The P2 presentation at `4.20` owns only the radial move to the existing target radius; it does not own or animate Large Glyph scale, and reset or reconstruction does not replace the `3×` baseline.

Each controller raycasts the real visible glyph meshes. A `0.5 s` hold spawns the next unrepresented branch tier; a miss pauses progress for `0.15 s`, then cancels it. The crystal position is the glyph's captured world position offset `0.30 m` toward the central object. Acquisition is additive and not gated by the current global tier.

The five branches contain `3 / 3 / 3 / 4 / 5` cards. Fifteen preloaded GLBs provide three cyclic crystal variants per branch. A physical crystal carries branch/glyph identity, tier, visual variant and transient interaction state, but no persistent card/page identity. Available crystals use the ordinary `2.3 m` ray and squeeze-grab.

`VrProgressionController` exclusively owns committed portfolio-card progression, branch/tier completion and the source projected by the floor. Tiers 1–3 require all five branches, tier 4 Metal + Water, and tier 5 Water. Held-crystal proximity to the authored insertion sphere gives green valid or red invalid feedback. Invalid release enters `rejecting` and returns the crystal to `available`. The player-facing Release button is disabled while the crystal is `inserted`. Activate is the only physical action that advances `inserted → active` and previews the branch+tier page without progress. Only then does the physical Release button become available; Release from `active` commits the page, activates its floor panel, tests tier completion and consumes the crystal over `0.55 s`. The internal `releaseInserted()` recovery branch for `inserted` is not a player action and must not be documented as one. Furnace material progression is a separate domain owned by `VrAstroFurnaceProgressionController`; there is no central global progression store.

The progress floor has five authored sectors, 18 panels and five optional procedural full-circle tier rings. A completed tier pulses its idempotent ring and leaves a subtle glow. Failure limited to procedural ring creation does not block the sector/panel floor.

## Tier 1, Astro and shell field

The authored bridge is `2.30 durable 5/5 → FIRST_RING_COMPLETED → 2.40`. `createVrFirstRingFlow` owns the local ring presentation/audio seam; only its real completion emits `FIRST_RING_PRESENTATION_COMPLETED` and enters `3.10`. The shell field is revealed as presentation in `3.10`, but remains non-interactive until physical Astro claim completes at `3.80`.

The executable and authored mainline now extends through the physical-claim boundary `3.80`: Tier 1 completion does not unlock Astro or activate the shell field. `?p1` remains an explicit one-shot QA/showcase path that commits the five tier-1 pages, mirrors them to the floor, completes the first ring and restores access to the existing post-P1 runtime. In that QA world state the field contains **18 shells: six cached `shell-relic-*` assets cloned three times each**. Their deterministic Fibonacci slots fill the world-stable `SHELLS` spherical volume `[R, 2R]` around `(0, 0, 0)`; bounds-aware clearance keeps visible geometry inside it. The whole field may rotate rigidly, but individual shells do not follow tilted orbits.

Semantic input maps standard-gamepad button `4` to edge-triggered `toggleRightTool` on the right hand and `toggleLeftTool` on the left hand, button `1` to analog `grabAction` (squeeze) and button `0` to analog `primaryAction` (trigger). Right A toggles `NORMAL_HAND ↔ ASTRO_ATTRACTOR` only with Scenario capability `CAN_EQUIP_ASTRO` or an explicit QA bypass; mainline grants it only after completed physical claim at `3.80`. Left X toggles `NORMAL_HAND ↔ ASTERION_SPHERE` only after production `EARNED` or when the independent `?asterionSphere` QA availability override is present. `AVAILABLE` alone never enables X.

### Scan and targeting

With Astro equipped, right squeeze/grab above `0.1` shows one `VrAttractorScanCone` on controller-local `-Z`. Its length is `3R`, half-angle `2.5°`, current color `0x78ff9c`, opacity pulse `0.035–0.065`, and pulse period `1.6 s`.

Shell selection is an analytic cone-volume test against cached per-shell bounding spheres. It is not a fan of raycasts. The nearest valid angular/depth candidate receives `VrTargetHalo`. A real shell hit has priority over crystal grab; no shell hit means no shell-over-crystal priority.

### Pull and capture contract

While scan remains active, right trigger above `0.1` starts and sustains pull. Acceleration is `10 m/s²`, speed is capped at `8.5 m/s`, and capture readiness begins within `0.28 m` of the capture point. The point is recalculated as:

```text
worldPosition(PIVOT_RING_MASTER)
+ worldDirection(controller local -Z) * 1.3 m
```

The public sequence is `orbiting → targeted → pulling → capture_ready → held → placed`; `returning` is an internal recovery state. Cancelling scan or trigger before left-hand takeover sends the shell through a `0.8 s` smooth return to its continuously moving canonical spherical slot. During return `attractorTarget=false`; after completion state is `orbiting` and `attractorTarget=true`.

### Handoff, placement and re-grab

A `capture_ready` shell is not acquired by hand proximity. It must be hit by the left ordinary ray while the left hand is in `NORMAL_HAND` (maximum `2.3 m`): ray hit → `VrTargetHalo` → `reportRayHit` → left squeeze → `held`. Left release reparents it under `VrWorldRoot` as `placed`.

A placed shell retains `attractorTarget=false`, so Astro cannot acquire it again. It can, however, be repeatedly targeted, haloed and squeeze-grabbed with the ordinary `2.3 m` ray of either free hand; the right hand can do so only in `NORMAL_HAND`, and the left hand can do so only in `NORMAL_HAND`. Releasing it returns it to `placed`.

## Player guidance and Monkey communication

Two **IMPLEMENTED** interfaces are distinct. The left-grip player guide opens with Y, presents the current-task and controller-reference sections, uses the left stick for menu navigation and X for selection, and temporarily blocks left-tool toggling while open. It is a player reference panel, not a narrative state owner.

### Intro P0

The rebuilt P0 intro is **IMPLEMENTED**. Its radial fog is platform-local and patches only the Monkey visual, glyph ring and `VrMonkeyStoneRoot`. It uses the VR background color and a radius sequence `20 → 17 → 6 → 0`: the timed opening reveal covers `20 → 17`, following covers `17 → 6`, the threshold holds `6`, and crossing/settling reaches `0` before the patch is removed. The shader derives its own transformed world position from `transformed`, batching/instancing matrices and `modelMatrix`; it does not depend on Three.js conditionally declaring `worldPosition`.

After the reveal and short silence, three timed orientation lines precede a persistent localized Y-menu instruction. It clears only when the player guide actually opens; onboarding then requires visiting controls, closing the panel, pointing at the Monkey and using trigger. The invitation enters `FOLLOWING`, can pause for catch-up, and leads to the threshold choice. During crossing, `playerEnteredRing` becomes true at `headRadius <= ringRadius` and immediately restores the ring walk boundary without clamping. The narrower `playerSafelyInside` (`ringRadius - 0.75 m`) remains diagnostics only. `MONKEY_SETTLING → GLYPH_FREE_EXPLORE` requires exactly `monkeySettled && playerEnteredRing`; gameplay no longer requires penetrating `0.75 m` inside the ring.

`GLYPH_FREE_EXPLORE` lasts `60 s`. A first crystal before timeout emits `FIRST_CRYSTAL_DISCOVERED`, completes `2.10` and enters `2.20`; the resulting discovery/attention effect requests Monkey attention and arms the discovery conversation. If no crystal succeeds by timeout, Monkey attention instead arms the three-line hint beginning `Pięć znaków.`; a later first crystal still wins discovery. In `2.20` the Monkey says `O, wydaje mi się, że można tego użyć.`; only activating the Monkey emits `MONKEY_TRIGGERED`. Scenario accepts it as `STAY` and emits `BEGIN_RELIQUARY_REVEAL`, which Runtime executes as the one `3 s` physical reveal of the portal, portal waiting canvas, reliquary, Activate and Release. The actor then emits `RELIQUARY_REVEAL_COMPLETED`, completing `2.20 → 2.30`. The Polish waiting copy is `Osadź kryształ w naczyniu.`

`createVrIntroSequence` moves only `monkeyMotionRoot`. Its start and final positions come from the shared `spatial` contract; tracked head is read only for follow/pause and ring-entry diagnostics. Declining either choice ends the session; QA routes may use `BYPASSED`.

The Monkey guide exposes technical channels for future authored guidance without defining story or dialogue content:

- `notifyAttention()` starts three pulsing attention arcs and its one-shot cue; repeated notification while pending does not restart it;
- `showMessage(text)` displays a short, system/Monkey-initiated message panel, while `open()` exposes a separate dialogue/choice panel;
- a real ordinary-ray hit on the Monkey opens/closes the panel; real ray hits on its regions plus trigger select an offered option;
- the implemented menu currently offers the progress question when at least one card is committed, plus close;
- progress opens paginated history derived exclusively from `VrProgressionController`; choosing an existing entry opens the localized card and supports multipage reading/back navigation;
- newly committed cards are tracked as unread, pulse in history, and become read when opened. A progression commit requests attention. These unread markers are transient page-runtime UI state, not durable progression.

The actor-local attention anchor uses Y `1.5`; the dialogue base uses Y `0.80`. Runtime applies a floor-local clearance guard so the transformed dialogue panel cannot cross the floor. HISTORY renders eight items in a `4 × 2` grid and reserves a separate lower navigation band for back/previous/next controls.

Outside the bounded intro P0 copy and sequence described above, the runtime supplies channels and current progress/history behavior only. Further narrative sequencing, Monkey messages between progression stages, quests, personality and stuck-player logic are **NOT DESIGNED / FUTURE**.

### Monkey physical assembly

Two distinct physical files are **PRESENT**:

- `public/glb/monkey.glb` is the character asset; its main character mesh/node is named `monkey`. The approved authored asset contract targets this hierarchy:

  ```text
  MONKEY_ANCHOR
  └── monkey
  ```

  `MONKEY_ANCHOR` is the local character seating transform. It is not a scene-layout anchor.
- `public/glb/monkey_stone.glb` is a separate stone/seat asset, not part of the Monkey mesh. Its authored hierarchy is:

  ```text
  MONKEY_STONE_ROOT
  ├── <stone mesh>
  └── MONKEY_SEAT_ANCHOR
  ```

  `MONKEY_STONE_ROOT` is the stone's local root/lower reference point. `MONKEY_SEAT_ANCHOR` is the local seating point on its upper surface.

The authored contract is **IMPLEMENTED**. Both assets are critical-initial preloads. `VrMonkeyMotionRoot` owns only `VrMonkeyVisualRoot`/the character and Monkey Guide. The independent `VrMonkeyStoneRoot` is created under `VrPlatformFixturesRoot`, so it inherits platform tilt but none of the actor's P0 translation or turns. Normal composition places authored `MONKEY_STONE_ROOT` at the platform base `(0,0,0)`, then aligns the world position and rotation of `MONKEY_ANCHOR` with `MONKEY_SEAT_ANCHOR` while preserving authored character scale; the seat anchor never defines character size. `VrMonkeyMotionRoot` remains canonical `(0,0,0)` with unit scale. The stone remains fixed while the Monkey leaves and returns, without a final snap.

The stone is hidden through the initial P0 emptiness and becomes visible at the existing glyph-ring reveal point; QA bypass exposes it immediately. Only `VrMonkeyMotionRoot` starts at canonical radius `18`, moves to `ringRadius + thresholdOutsideDistance`, crosses, and settles at `(0,0,0)`. The stone remains at the ring center throughout.

The semantic levels remain separate: `(0,0,0)` is canonical motion-root/scene-center data, not the physical world position of `MONKEY_ANCHOR`; `MONKEY_ANCHOR` is character-internal, while `MONKEY_STONE_ROOT` and `MONKEY_SEAT_ANCHOR` are stone-internal.

The shipped GLBs verify each required name exactly once, finite TRS with nonzero scales, `MONKEY_ANCHOR → monkey`, and both stone children under `MONKEY_STONE_ROOT`. Monkey Guide ray targets and halo use the character-only interaction root, so the stone is not Monkey interaction geometry.

## Astro production and Furnace

The Furnace is physically revealed at `3.40`. At `3.50` Scenario activates the Astro card and the player deliberately chooses `Utwórz astro przyciągacz`; no automatic production occurs. Furnace mode `astro_attractor` is distinct from the existing Asterion mode. `ASTRO_ATTRACTOR_CONSTRUCTION` is distinct from `ASTERION_CONSTRUCTION`, although both use the shared Furnace process driver. The physical output is parented below `VR_FURNACE_CONTENT_ANCHOR` and remains in the chamber until claim.

`createVrAstroAttractorProductionController` owns `READY → BUILDING → AVAILABLE → CLAIMING → EARNED`; `CLAIMING` is transient, not a Scenario point. Production representation is separate from the equipment lifecycle managed by `createVrAttractorTool`; the production clone is not a second gameplay Astro. `3.70` is only `AVAILABLE`. A valid claim requires an open chamber, right `NORMAL_HAND`, ordinary ray, real target hit and trigger/`selectstart`; only completion emits `ASTRO_ATTRACTOR_CLAIMED` and enters `3.80`/`EARNED`.

## Astro Furnace and Asterion material progression

The Astro Furnace is a separate subsystem backed by `public/glb/astral_stove.glb`, preloaded through `AssetManager`, and created under `VrPlatformFixturesRoot` with an explicit canonical local position and rotation. Bounds affect only visual grounding and panel layout, never the fixture root position. Authored open/close animation remains unchanged: `pokrywa` and `pokrywa_gora` travel together through `PIVOT_FURNACE_LID_Z`. During a material cycle `PIVOT_FURNACE_PROCESS_SPIN` drives the chamber and a base-pose-relative runtime offset on `PIVOT_FURNACE_LID_PROCESS_SPIN` drives only the lower `pokrywa`; `pokrywa_gora` remains latched and receives no process offset.

The Furnace home panel presents Astro Przyciągacz with a lightweight authored curve preview derived from the supplied Astro Grabber silhouette: smooth outer cage/grip Béziers, calibration rings, five fuel guides and the retained layered core. It does not render or extract triangulated GLB mesh edges. The canvas preview rotates at the bounded panel refresh rate. Its player-facing mode copy is `Utwórz astro przyciągacz`; this presentation does not implement production, unlock Astro or advance Scenario. Furnace canvas regions use the brighter shared Furnace-frame hover treatment, while the three physical Furnace buttons use their independently brighter emissive hover values without changing active, pressed or disabled state resolution.

The furnace is deliberately unconfigured at session start: Option owns `activeMode = null`. Open, insertion and Activate are unavailable until the player opens the panel with Option and selects **Asterion Sphere**, which activates `floor_gyroscope_sphere`. Option is therefore the first suggested step. Selection rotates `PIVOT_BUTTON_OPTION` by `+90°` around its local Y axis relative to its authored base quaternion.

Exactly one each of `shell-relic-1` through `shell-relic-6` is required. `VrAstroFurnaceProgressionController` owns these six identity-based binary material slots independently from portfolio progression. Commit remains strictly gated by the conjunction `CONSUMED + COMPLETE`; interruption before it clears transient content without progress. At `6/6` the material owner remains unchanged, while the separate production controller opens `READY`. The **IMPLEMENTED** `UTWÓRZ` ray region accepts only a closed, stable chamber, empty content slot and idle furnace. After the sixth shell, accepted `UTWÓRZ` can transition `COMPLETE / SHELL_EXTRACTION → PREPARING_CONSTRUCTION`, run the authored reverse button-lock animation, and only then enter `ASTERION_CONSTRUCTION / SPINUP`; lock preparation is outside the construction clock.

The furnace has two implemented process kinds: `SHELL_EXTRACTION` and `ASTERION_CONSTRUCTION`. Both use the same authoritative 18-second, 42-RPM mechanical driver and its `SPINUP → STEADY → EXTRACTION / FORMATION → COOLDOWN` phases. Shell extraction requires one missing shell in the content slot, commits only after completion and plays `astro_piec_work_01.mp3`. Construction requires no shell in that slot, starts from `UTWÓRZ`, uses the same mechanics and progress, and plays only `astro_piec_work_create_01.mp3`—never the shell-process source.

Production presentation uses the same `/glb/asterion_sphere.glb` socket/model later used as hand equipment; claim does not create a second model. The furnace-product placement contract, including future product types, first parents the product socket to `VR_FURNACE_CONTENT_ANCHOR` and then derives its base position with `resolveFurnaceContentSnapTarget(...)`, using the same chamber `energyCell` relationship and clearance as inserted content. Product-specific hand-tuned position offsets or production anchors are not part of this contract. The Asterion Sphere remains at presentation scale `1` throughout construction; furnace progress drives only its materialization/materials. Once available it rotates gently and levitates vertically by `0.02 m` around the immutable snap target on a `2.1 s` loop; each frame recomputes the presentation offset from that base, and claim/reset clears it. Presentation and equipment nevertheless have separate lifecycles: `unequipFromHand()` does not remove a production presentation, while production owns `clearPresentation()`. During construction the panel transforms the six-patch input sphere into a rotating cached contour/wireframe of the real model: patches fade while contour segments reveal progressively from the same formation progress that drives physical materialization. Completion commits `AVAILABLE` and shows **KULA GOTOWA / OTWÓRZ KOMORĘ**.

Only `AVAILABLE + OPEN + left NORMAL_HAND` enables a real left ordinary-ray hit (maximum `2.3 m`), halo and squeeze claim. Claim commits page-runtime `EARNED`, clears production presentation, transfers the same socket to the equipment lifecycle and auto-equips through `createVrHandModeController`; only then can X toggle the Sphere. Session interruption cancels `BUILDING` to `READY`, removes the transient presentation and preserves `6/6`.

**Hardware status (Meta Quest 3S):** `UTWÓRZ`, the post-sixth-shell transition without manual open→close, the 18-second construction mechanics, panel transition, rotating blueprint and physical rendering/materialization are **HARDWARE VALIDATED**. The current anchor-based placement correction is **IMPLEMENTED**, but has not been revalidated on Quest; the earlier observation of a Sphere behind the panel is therefore historical evidence for the pre-correction runtime, not a current placement fact. Correct chamber placement remains **HARDWARE VALIDATION PENDING**. Contour continuity remains a **KNOWN QA ISSUE**: the readable blueprint has broken/gapped lines in places.

The single-shell cycle is **IMPLEMENTED**: a valid missing shell is locked at `VR_FURNACE_CONTENT_ANCHOR`, then accepted Activate runs one normalized 18-second clock at 42 RPM. EXTRACTION occupies `6–15 s` and cooldown `15–18 s`. The same progress drives chamber/lower-lid motion, the existing `komora` emissive texture intensity (`0..30`, returning to `0` through cooldown), `fire_cell`, shell emission/fade and four cheap emissive meshes under `VR_FURNACE_LIGHT_ORBIT`; only one optional shadowless process light exists. Runtime-owned chamber material clones preserve the authored glass maps, transparency and opacity, so open/close fading remains independent of emission strength. `/audio/astro_piec_work_01.mp3` starts once on the DEVICE bus after an accepted start and is lifecycle-cleaned without blocking gameplay. Completion consumes the raw shell and commits exactly once; reopening permits the next missing type. Reset/dispose cancels effects and audio and never commits.

## Production Asterion Sphere and QA override

`?asterionSphere` remains an independent QA availability override for the same physical Asterion Sphere / Kula Asterionowa. Production availability instead comes from `EARNED`. It does not commit shells, does not alter `VrAstroFurnaceProgressionController`, does not fake `6/6`, and does not reinterpret the furnace panel preview as a production physical object. The runtime loads `public/glb/asterion_sphere.glb` through `AssetManager`; the hand-mode controller equips the cloned model on the resolved left `grip` only in left `ASTERION_SPHERE` and unequips it in left `NORMAL_HAND`.

The gyro contract separates three orientations:

- **PREVIEW** — live hand orientation expressed through `CONTROL BASE + HAND REFERENCE`. It drives `inner_ring2`, `inner_ring3` and `PIV_TARGET_AXIS`; authored idle fan motion on `inner_ring2/inner_ring3` remains active. While the trigger is held, ring visualization is stabilized so the preview remains readable.
- **COMMAND** — the drive target accepted from PREVIEW while the left trigger is held. Releasing the trigger freezes COMMAND; release does not stop the platform.
- **CURRENT** — the actual orientation of `VrTiltableFloorRoot`. It drives `master_ring1`, `master_ring2` and `inner_ring1`.

After LOCK, the interaction rebases CONTROL BASE / HAND REFERENCE from CURRENT so repeated target steps do not accumulate a visual offset. `displayPreviewQuaternion` provides an approximately `0.5 s` visual rebase, so the TARGET-frame does not visually teleport when the local reference is recaptured.

Left tool lifecycle is explicit. The gyro never auto-equips the sphere. Unequip freezes COMMAND but the heavy CURRENT drive continues toward it. Left-hand movement and trigger input do not control the gyro while the left hand is in `NORMAL_HAND`. Re-equip performs a no-jump capture from the current CURRENT orientation, and the ordinary left ray is available immediately after unequip.

### Heavy angular drive

The current platform drive is a heavy angular controller, not a rigid-body simulation and not the old exponential/capped slerp runtime path. It maintains `angularVelocity` and steers it with these active tuning values:

```text
maxAngularSpeedDegrees      = 32
angularAccelerationDegrees  = 32
angularDecelerationDegrees  = 45
settleAngularSpeedDegrees   = 0.15
```

The controller uses braking distance to choose speed toward COMMAND, caps angular speed, supports smooth retargeting without zeroing velocity, and preserves motion after trigger release. LOCK requires both small angular error and small angular speed; only then does the final exact settle write CURRENT to COMMAND and zero velocity.

## Production bootstrap contract

After every asset preload, Runtime must compose before READY. `runtimeExperience` therefore has an early safe nullable binding: construction-time callbacks may execute before the final Runtime bind. `canUseAstroProduction` returns safe `false` before binding and the real Scenario/runtime gate afterwards. `vr-runtime-bootstrap` captured this production regression RED before the fix and GREEN afterwards. Wizjoner confirmed startup passes `41/41` and no longer stalls before READY: **HARDWARE VALIDATED — Meta Quest 3S** for this bootstrap fix only. Full `3.10–3.80` perceptual/hardware QA remains pending.

## Proto-Astro, Astro bands and small glyphs

Canonical domain detail: [`VR_PROTO_ASTRO_MODEL.md`](VR_PROTO_ASTRO_MODEL.md). Spatial ownership and ranges: [`VR_SPHERICAL_LAYERS_MODEL.md`](VR_SPHERICAL_LAYERS_MODEL.md).

**IMPLEMENTED:** semantic input B is routed to `HandModeController`, which owns transient selection between exactly `SHELLS` and `SMALL_GLYPHS`. B switches only currently available bands. `LARGE_GLYPHS` and `RUNESTONES` are **APPROVED / NOT IMPLEMENTED** and are not active runtime enums. Band identity is semantic; exact visual colors/symbols remain open.

`createVrSmallGlyphSystem` owns a world-stable, deterministic field of 12 instances: six visual variants with two instances each. Scenario presentation materializes the field and hydration restores stable `MATERIALIZED`. Identity is resolved through the canonical Proto-Astro adapter rather than inferred directly from asset number.

The spherical registry resolves layer thickness independently from the empty `gapAfter` between adjacent layers. At the current `R = 7.6 m`, Shells occupy `7.6–15.2 m`, the first empty gap is `15.2–17.1 m`, and Small Glyphs occupy `17.1–24.7 m`; domain actors, parent ownership and deterministic slot math are unchanged.

Small-glyph Astro transport is **IMPLEMENTED**:

```text
FIELD → TARGETING → PULLING → CAPTURE_READY → HELD → RETURNING → FIELD
```

Right Astro squeeze scans/targets and trigger pulls. A real left ordinary-ray/Szpila hit plus left squeeze hands off to `holdSocket`. Release returns the object to its authored field transform. There is no `PLACED`, inventory or persistent ownership. Band change/Astro unequip after `HELD` does not automatically revoke the held glyph; capability loss, release and reset restore canonical field state.

`ProtoAstroTuningController` is the sole owner of persistent `extractedFamilyCodes`, limited to natural `K/T/S/L/R`; `V` is excluded. Same-family I→A compatibility powers the implemented `canAttractLargeGlyph` API, while actual large-glyph targeting/pull remains **NOT IMPLEMENTED**.

## Furnace small-glyph essence extraction

One `createVrAstroFurnaceContentInteraction` owns the physical chamber content for both `SHELL` and `SMALL_GLYPH`; there are not parallel chamber owners. Asterion mode `floor_gyroscope_sphere` processes shells. Astro tuning mode `astro_attractor` processes a not-yet-extracted natural small glyph through `SMALL_GLYPH_ESSENCE_EXTRACTION`. VI is invalid in current P2.

Completion commits only the family essence to TuningController, then returns the physical glyph instance to its authored field. It creates no inventory and does not persistently consume the asset. A second physical glyph of the family remains available, but duplicate extraction is rejected.

## Attractor panel boundary

The physical four-panel system exists. Current implementation includes the panel system and shell-glyph projection for Panel 1; it is not a universal projection for every target class. Panel 2 current-band symbol/color, Panel 3 dynamic `2×3` target options, and Panel 4 distance meter are **APPROVED / NOT IMPLEMENTED**. Exact band colors and SVG symbols are not defined.

## Implemented boundary

Implemented: runtime/session lifecycle, Intro, both authored Glyph → Crystal → Reliquary tiers, first-ring/post-ring, Astro/shell/Furnace/Asterion domain, authored radial presentation `4.20`, small-glyph field presentation `4.30`, stable P2 boundary `4.40`, B switching, `SHELLS`/`SMALL_GLYPHS`, transient small-glyph transport, natural essence extraction, Proto-Astro identity/resolvers/tuning and dynamic Monkey/Player Guide projections.

Not implemented: `LARGE_GLYPHS` and `RUNESTONES` bands, real large-glyph targeting/pull despite the ready `canAttractLargeGlyph` API, universal four-panel semantics, later authored P2 continuation, VI placement/final mechanics, durable persistence, full-game reset and unimplemented later spatial/gameplay audio.

## Scenario-driven runtime flow

Canonical authored flow is:

```text
1.10 → … → 3.80 → 4.10 → 4.20 → 4.30 → 4.40 → 100.10
```

`4.10` owns the second ring until `TIER_COMPLETED`. Entry `4.20` begins radial presentation; its completion settles `p2World.mainGlyphsRadial = true`. Entry `4.30` materializes the small-glyph field; its completion settles `smallGlyphField.materialized = true`. `4.40` grants the integrated P2 capabilities and has no transition, although its mainline metadata targets the story terminal. It therefore does not auto-advance.

Reconstruction is exclusive: `stateAt(4.20)` includes completed Tier 2, `stateAt(4.30)` adds radial world truth, and `stateAt(4.40)` adds materialized field truth. Current `stateAt(4.40)` does not declare tuning essences, so direct activation correctly hydrates the P2 world and starts TuningController empty. The hydrator already delegates a future `protoAstroTuning` owner section. Transient target/pull/held/Furnace process state is never reconstructed.

## Guidance implementation boundary

The shared automatic progression-message actor presents post-ring and Furnace messages without `DALEJ`. Dynamic Monkey knowledge resolves Astro, Asterion and capability-gated `knowledge.astro.bandSwitch`. Dynamic Player Guide/Y projection supplies current task and tool references, appending `B — zmień pasmo celu` only after `CAN_SWITCH_ASTRO_BAND`. Approved `progression.p2.smallGlyphsIntro` and `knowledge.p2.tuneGlyphs` remain inactive because real `LARGE_GLYPHS` targeting/pull is absent.

## QA boundary

The bootstrap fix alone retains **HARDWARE VALIDATED — Meta Quest 3S** for reaching READY after preload. `4.20–4.40`, field, B switching, small-glyph pull/handoff and Furnace essence extraction remain hardware/perceptual QA pending. No automated or hardware PASS is inferred by this documentation sync.
