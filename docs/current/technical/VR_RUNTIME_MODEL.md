# Experience VR Runtime Model

Status: canonical description of the implemented runtime synchronized on 2026-08-10. Approved future gameplay is documented in the [gameplay roadmap](../concept/EXPERIENCE_VR_GAMEPLAY_ROADMAP.md).

## Runtime boundary and lifecycle

`src/experienceVr.js` is the composition root of an independent, dynamically imported WebXR runtime. It owns its renderer, scene, base camera, `playerRig`, two controllers and `renderer.setAnimationLoop`; it does not start Experience 3D. Runtime preparation precedes the direct **Enter VR** gesture. The requested reference space is `local-floor`, with `local` fallback.

The composition root owns the small `VrAudioBridge` lifecycle. Optional VR audio requests cross its fail-soft boundary, which contains both synchronous exceptions and Promise rejections and reports them as `[vr-audio]` warnings. Calls are fire-and-forget side effects after gameplay transitions; they are never awaited by session, input, progression, state-machine or render-frame flows. The bridge delegates Web Audio ownership to the shared `audioManager`, stores no gameplay state and is disposed idempotently on `pagehide`. Five unity-gain VR buses (`SPACE`, `AMBIENT`, `DEVICE`, `WORLD`, `UI`) feed the existing Master Volume/mute. UI and world/device one-shots, glyph acquisition, the shell-pull loop and both Asterion Sphere loops are **IMPLEMENTED**. `experienceVr.js` also actively composes `createVrAmbientSequencer`: the current full tier and the completed-shell/built-Sphere subthreshold select finite ambient/quiet-loop sequences. Other Attractor target classes and spatial audio remain **FUTURE**. Detailed lifecycle and asset mapping belong to [`VR_AUDIO_MODEL.md`](VR_AUDIO_MODEL.md).

Every session aligns the rig so the tracked head reaches the configured start `(0, 0, 5.8)`. WebXR owns the tracked camera; locomotion and alignment transform `playerRig`, and the rig is now a passenger of the platform root rather than a world-stable camera island. Session exit/re-entry clears transient crystals, shell interaction, controller hits, halos, glyph state, reliquary/buttons, Asterion QA state and portal preview, while committed progress and floor projection survive in the already prepared page runtime. Reload/navigation recreates them. There is no durable save or full-game reset.

Controller records may be constructed with `handedness === ''`. Hand identity is resolved only at runtime after WebXR's `connected` event; semantic input and hand-mode lookup therefore do not assume handedness during construction.

## World and platform hierarchy

The active hierarchy is platform-relative for floor gameplay and world-stable for the distant frame:

```text
WORLD
├── world-stable glyphRing / shell field / cosmos
└── VrTiltableFloorRoot
    ├── floor sectors / rings
    ├── monkeyAnchor
    ├── VrPlatformFixturesRoot
    │   ├── portal
    │   ├── reliquary
    │   ├── furnace
    │   └── furnace panel
    └── VrFloorPassengerRoot
        └── playerRig
            └── camera / controllers / grips
```

`VrTiltableFloorRoot` is both the visual progress floor root and the active platform transform root. Platform fixtures, the monkey anchor and `VrFloorPassengerRoot/playerRig` inherit the platform quaternion. The glyph ring, shell field and cosmic/distant frame stay under the world-stable root so platform rotation changes the player's local platform relationship without rotating the target field itself.

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

Each controller raycasts the real visible glyph meshes. A `0.5 s` hold spawns the next unrepresented branch tier; a miss pauses progress for `0.15 s`, then cancels it. The crystal position is the glyph's captured world position offset `0.30 m` toward the central object. Acquisition is additive and not gated by the current global tier.

The five branches contain `3 / 3 / 3 / 4 / 5` cards. Fifteen preloaded GLBs provide three cyclic crystal variants per branch. A physical crystal carries branch/glyph identity, tier, visual variant and transient interaction state, but no persistent card/page identity. Available crystals use the ordinary `2.3 m` ray and squeeze-grab.

`VrProgressionController` exclusively owns committed portfolio-card progression, branch/tier completion and the source projected by the floor. Tiers 1–3 require all five branches, tier 4 Metal + Water, and tier 5 Water. Held-crystal proximity to the authored insertion sphere gives green valid or red invalid feedback. Invalid release enters `rejecting` and returns the crystal to `available`. Activate resolves and previews the branch+tier page without progress. Release after Activate commits it, activates its floor panel, tests tier completion and consumes the crystal over `0.55 s`; Release without Activate returns it without progress. Furnace material progression is a separate domain owned by `VrAstroFurnaceProgressionController`; there is no central global progression store.

The progress floor has five authored sectors, 18 panels and five optional procedural full-circle tier rings. A completed tier pulses its idempotent ring and leaves a subtle glow. Failure limited to procedural ring creation does not block the sector/panel floor.

## Tier 1, Astro and shell field

Tier 1 completion both unlocks Astro and activates the shell field. The field contains **18 shells: six cached `shell-relic-*` assets cloned three times each**. Their deterministic orbits occupy radii `[R, 2R]`, where `R` is the effective glyph-ring radius. `?p1` remains a one-shot QA shortcut that commits the five tier-1 pages, mirrors them to the floor and synchronizes this post-tier-1 world state.

Semantic input maps standard-gamepad button `4` to edge-triggered `toggleRightTool` on the right hand and `toggleLeftTool` on the left hand, button `1` to analog `grabAction` (squeeze) and button `0` to analog `primaryAction` (trigger). After Tier 1, right A toggles `NORMAL_HAND ↔ ASTRO_ATTRACTOR`; before unlock it cannot equip Astro. Left X toggles `NORMAL_HAND ↔ ASTERION_SPHERE` only after production `EARNED` or when the independent `?asterionSphere` QA availability override is present. `AVAILABLE` alone never enables X.

### Scan and targeting

With Astro equipped, right squeeze/grab above `0.1` shows one `VrAttractorScanCone` on controller-local `-Z`. Its length is `3R`, half-angle `2.5°`, current color `0x78ff9c`, opacity pulse `0.035–0.065`, and pulse period `1.6 s`.

Shell selection is an analytic cone-volume test against cached per-shell bounding spheres. It is not a fan of raycasts. The nearest valid angular/depth candidate receives `VrTargetHalo`. A real shell hit has priority over crystal grab; no shell hit means no shell-over-crystal priority.

### Pull and capture contract

While scan remains active, right trigger above `0.1` starts and sustains pull. Acceleration is `10 m/s²`, speed is capped at `8.5 m/s`, and capture readiness begins within `0.28 m` of the capture point. The point is recalculated as:

```text
worldPosition(PIVOT_RING_MASTER)
+ worldDirection(controller local -Z) * 1.3 m
```

The public sequence is `orbiting → targeted → pulling → capture_ready → held → placed`; `returning` is an internal recovery state. Cancelling scan or trigger before left-hand takeover sends the shell through a `0.8 s` smooth return to its continuously advancing orbit. During return `attractorTarget=false`; after completion state is `orbiting` and `attractorTarget=true`.

### Handoff, placement and re-grab

A `capture_ready` shell is not acquired by hand proximity. It must be hit by the left ordinary ray while the left hand is in `NORMAL_HAND` (maximum `2.3 m`): ray hit → `VrTargetHalo` → `reportRayHit` → left squeeze → `held`. Left release reparents it under `VrWorldRoot` as `placed`.

A placed shell retains `attractorTarget=false`, so Astro cannot acquire it again. It can, however, be repeatedly targeted, haloed and squeeze-grabbed with the ordinary `2.3 m` ray of either free hand; the right hand can do so only in `NORMAL_HAND`, and the left hand can do so only in `NORMAL_HAND`. Releasing it returns it to `placed`.

## Player guidance and Monkey communication

Two **IMPLEMENTED** interfaces are distinct. The left-grip player guide opens with Y, presents the current-task and controller-reference sections, uses the left stick for menu navigation and X for selection, and temporarily blocks left-tool toggling while open. It is a player reference panel, not a narrative state owner.

### Intro P0

The rebuilt P0 intro is **IMPLEMENTED**. After XR head calibration it runs a radial fog reveal and a short post-reveal silence, then shows three timed orientation lines followed by a persistent localized Y-menu instruction. That instruction remains visible throughout `WAIT_PLAYER_PANEL_OPEN`, clears immediately only after `playerGuidePanel.isOpen()` becomes true, and then onboarding continues through visiting controls, closing the panel, pointing at the Monkey and using trigger. The invitation can enter `FOLLOWING`: the Monkey turns and moves radially toward the existing ring, can pause until the player catches up, reveals the glyph ring during the walk and asks for a threshold choice. Accepting the threshold enters `CROSSING` / `ENTERING_RING`; the player must physically enter the safe inner radius before the locomotion boundary is restored. The Monkey returns to its already established canonical transform, completes `MONKEY_SETTLING`, and only then enters `GLYPH_FREE_EXPLORE`. A delayed attention hint can follow if free exploration produces no glyph success. Declining either choice ends the session; existing QA routes use `BYPASSED`.

`createVrIntroSequence` moves only the existing `monkeyMotionRoot` and captures that node's canonical position and quaternion at composition time. The current scene-layout application remains authoritative: `ANCHOR_MONKEY` places `monkeyMotionRoot`, while the existing attention, speech and dialogue anchors remain relative to that same runtime/layout relationship. The intro does not redefine, move, reparent or replace `ANCHOR_MONKEY`, and it does not transfer transform ownership away from `monkeyMotionRoot`.

The Monkey guide exposes technical channels for future authored guidance without defining story or dialogue content:

- `notifyAttention()` starts three pulsing attention arcs and its one-shot cue; repeated notification while pending does not restart it;
- `showMessage(text)` displays a short, system/Monkey-initiated message panel, while `open()` exposes a separate dialogue/choice panel;
- a real ordinary-ray hit on the Monkey opens/closes the panel; real ray hits on its regions plus trigger select an offered option;
- the implemented menu currently offers the progress question when at least one card is committed, plus close;
- progress opens paginated history derived exclusively from `VrProgressionController`; choosing an existing entry opens the localized card and supports multipage reading/back navigation;
- newly committed cards are tracked as unread, pulse in history, and become read when opened. A progression commit requests attention. These unread markers are transient page-runtime UI state, not durable progression.

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

The authored contract is **IMPLEMENTED**. Both assets are critical-initial preloads. `VrMonkeyMotionRoot` owns only `VrMonkeyVisualRoot`/the character and Monkey Guide. The independent `VrMonkeyStoneRoot` is its sibling under `VrTiltableFloorRoot`, so it inherits platform tilt but none of the actor's P0 translation or turns. Both assets use the same uniform character-derived scale; there is no bbox centering, per-asset scale, or hand-authored placement offset. Once the canonical `ANCHOR_MONKEY` placement is applied, the stone fixture is composed once with the complete authored anchor matrices so `worldMatrix(MONKEY_SEAT_ANCHOR) === worldMatrix(MONKEY_ANCHOR)` at the canonical Monkey pose. The stone remains fixed while the Monkey leaves and returns to that pose, without a final docking snap.

The stone is hidden through the initial P0 emptiness and becomes visible at the existing glyph-ring reveal point; QA bypass exposes it immediately. Only `VrMonkeyMotionRoot` starts 1.5 m in front of the calibrated tracked head and moves through `FOLLOWING`, crossing, and settling. The stone remains at the ring center throughout.

The three semantic levels must remain separate: (1) current layout/runtime `ANCHOR_MONKEY`, unchanged and authoritative for the actor; (2) character-internal `MONKEY_ANCHOR`; and (3) stone-internal `MONKEY_STONE_ROOT` / `MONKEY_SEAT_ANCHOR`. Neither internal seating anchor replaces `ANCHOR_MONKEY`.

The shipped GLBs verify each required name exactly once, finite TRS with nonzero scales, `MONKEY_ANCHOR → monkey`, and both stone children under `MONKEY_STONE_ROOT`. Monkey Guide ray targets and halo use the character-only interaction root, so the stone is not Monkey interaction geometry.

## Astro Furnace and Asterion material progression

The Astro Furnace is a separate subsystem backed by `public/glb/astral_stove.glb`, preloaded through `AssetManager`, placed opposite the portal under `VrPlatformFixturesRoot`, grounded from visible bounds, scaled to `3` and faced toward the configured start. Authored open/close animation remains unchanged: `pokrywa` and `pokrywa_gora` travel together through `PIVOT_FURNACE_LID_Z`. During a material cycle `PIVOT_FURNACE_PROCESS_SPIN` drives the chamber and a base-pose-relative runtime offset on `PIVOT_FURNACE_LID_PROCESS_SPIN` drives only the lower `pokrywa`; `pokrywa_gora` remains latched and receives no process offset.

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

## Implemented boundary

Implemented: runtime/session lifecycle, platform-relative hierarchy, player passenger root, platform fixtures under `VrTiltableFloorRoot`, platform-local locomotion with radial boundary, glyph/crystal/reliquary progression, floor panels/rings, Tier-1 shell activation, semantic Astro input, independent right Astro Attractor and left Asterion Sphere hand modes, analytic scan targeting, pull/cancel/return, explicit left-ray handoff when left is free, placement and ordinary-ray re-grab, player guide, Monkey attention/message/dialogue/choice/progress/history/card/unread channels, Astro Furnace asset/placement, open/activate/option/content interactions, Asterion panel, repeatable single-shell 18-second processing with process audio, six-type furnace progression, physical shell insertion/absorption, COMPLETE-gated commit, production Asterion `UTWÓRZ` / anchored materialization / AVAILABLE claim / EARNED gating, QA override, PREVIEW/COMMAND/CURRENT gyro contract and heavy angular platform drive, ambient sequencing and Asterion Sphere audio.

Not implemented: authored narrative/quests/Monkey personality or stuck-player guidance, small glyph progression, B band selection/Astro bands, antenna, rune processing, final radar/finale, durable persistence, full-game reset, spatial audio and gameplay audio for target/process classes that do not yet exist.
