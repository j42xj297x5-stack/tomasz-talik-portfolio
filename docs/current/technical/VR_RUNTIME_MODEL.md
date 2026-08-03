# Experience VR Runtime Model

Status: canonical description of the implemented runtime on 2026-08-03. Approved future gameplay is documented in the [gameplay roadmap](../concept/EXPERIENCE_VR_GAMEPLAY_ROADMAP.md).

## Runtime boundary and lifecycle

`src/experienceVr.js` is the composition root of an independent, dynamically imported WebXR runtime. It owns its renderer, scene, base camera, `playerRig`, two controllers and `renderer.setAnimationLoop`; it does not start Experience 3D. Runtime preparation precedes the direct **Enter VR** gesture. The requested reference space is `local-floor`, with `local` fallback.

Every session aligns the rig so the tracked head reaches the configured start `(0, 0, 5.8)`. WebXR owns the tracked camera; locomotion and alignment transform `playerRig`. Session exit/re-entry clears transient crystals, shell interaction, controller hits, halos, glyph state, reliquary/buttons and portal preview, while committed progress and floor projection survive in the already prepared page runtime. Reload/navigation recreates them. There is no durable save or full-game reset.

Controller records may be constructed with `handedness === ''`. Hand identity is resolved only at runtime after WebXR's `connected` event; semantic input and hand-mode lookup therefore do not assume handedness during construction.

## Ordinary rays and locomotion

Both ordinary white controller rays have a maximum range of `2.3 m`. Interactive glyph, crystal, button and shell hits report their distance each frame, and the visible ray shortens to the nearest real hit. There is no scene-global raycast. Trigger state does not extend the ordinary range.

In `NORMAL_HAND` the Astro model is hidden and the connected right ordinary ray is active. In `ASTRO_ATTRACTOR` Astro is visible and the right ordinary ray is hidden. The left ordinary ray remains available. Reset returns the right hand to `NORMAL_HAND`.

The left joystick continuously yaws `playerRig`. The right joystick translates it horizontally relative to the tracked viewer direction, with pitch removed, diagonal input capped and rig Y preserved. Teleport, jump and snap turn are absent.

## Glyphs, crystals and reliquary

Each controller raycasts the real visible glyph meshes. A `0.5 s` hold spawns the next unrepresented branch tier; a miss pauses progress for `0.15 s`, then cancels it. The crystal position is the glyph's captured world position offset `0.30 m` toward the central object. Acquisition is additive and not gated by the current global tier.

The five branches contain `3 / 3 / 3 / 4 / 5` cards. Fifteen preloaded GLBs provide three cyclic crystal variants per branch. A physical crystal carries branch/glyph identity, tier, visual variant and transient interaction state, but no persistent card/page identity. Available crystals use the ordinary `2.3 m` ray and squeeze-grab.

`VrProgressionController` exclusively owns committed portfolio-card progression, branch/tier completion and the source projected by the floor. Tiers 1–3 require all five branches, tier 4 Metal + Water, and tier 5 Water. Held-crystal proximity to the authored insertion sphere gives green valid or red invalid feedback. Invalid release enters `rejecting` and returns the crystal to `available`. Activate resolves and previews the branch+tier page without progress. Release after Activate commits it, activates its floor panel, tests tier completion and consumes the crystal over `0.55 s`; Release without Activate returns it without progress. Furnace material progression is a separate domain owned by `VrAstroFurnaceProgressionController`; there is no central global progression store.

The progress floor has five authored sectors, 18 panels and five optional procedural full-circle tier rings. A completed tier pulses its idempotent ring and leaves a subtle glow. Failure limited to procedural ring creation does not block the sector/panel floor.

## Tier 1, Astro and shell field

Tier 1 completion both unlocks Astro and activates the shell field. The field contains **18 shells: six cached `shell-relic-*` assets cloned three times each**. Their deterministic orbits occupy radii `[R, 2R]`, where `R` is the effective glyph-ring radius. `?p1` remains a one-shot QA shortcut that commits the five tier-1 pages, mirrors them to the floor and synchronizes this post-tier-1 world state.

Semantic right-hand input maps standard-gamepad button `4` (**A**) to edge-triggered `toggleRightTool`, button `1` to analog `grabAction` (squeeze) and button `0` to analog `primaryAction` (trigger). After Tier 1, A toggles `NORMAL_HAND ↔ ASTRO_ATTRACTOR`; before unlock it cannot equip Astro. `createVrHandModeController` is the owner of Astro's equipped/visibility state and the ordinary right-ray visibility.

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

A `capture_ready` shell is not acquired by hand proximity. It must be hit by the left ordinary ray (maximum `2.3 m`): ray hit → `VrTargetHalo` → `reportRayHit` → left squeeze → `held`. Left release reparents it under `VrWorldRoot` as `placed`.

A placed shell retains `attractorTarget=false`, so Astro cannot acquire it again. It can, however, be repeatedly targeted, haloed and squeeze-grabbed with the ordinary `2.3 m` ray of either free hand; the right hand can do so only in `NORMAL_HAND`. Releasing it returns it to `placed`.

### Shell visuals

Every shell owns cloned materials; authored `map` and `emissiveMap` data are preserved. Pull emission follows spatial pull progress from `0` to `1`; `capture_ready` is fixed at `1`. `held` and `placed` pulse `1 → 2 → 1` over `1.4 s`. Each instance also has a subtle deterministic tumble of `0.10–0.22 rad/s` around a precomputed axis.

## Astro Furnace and Asterion progression

### Asset, placement and authored contract

The Astro Furnace is a separate Experience VR subsystem backed by `public/glb/astral_stove.glb`. The staged asset pipeline preloads it through the shared `AssetManager`. Runtime places the furnace on the opposite side of the central monkey from the portal: its XZ position is the portal position mirrored around the central anchor. It uses scale `3`, grounds itself from visible geometry bounds and faces the configured player start. Fixed test world coordinates are not part of this contract.

The important authored nodes are:

```text
button_open                 PIVOT_BUTTON_OPEN
button_activate             PIVOT_BUTTON_ACTIVATE
button_option               PIVOT_BUTTON_OPTION
PIVOT_FURNACE_LATCH_LEFT    PIVOT_FURNACE_LATCH_RIGHT
PIVOT_FURNACE_LATCH_TOP     PIVOT_FURNACE_LID_Z
PIVOT_FURNACE_CHAMBER_Z     PIVOT_FURNACE_PROCESS_SPIN
komora                      pokrywa
fire_cell
VR_FURNACE_INSERT_VOLUME    VR_FURNACE_CONTENT_ANCHOR
```

`PIVOT_FURNACE_CHAMBER_Z` belongs to authored chamber open/close animation. Continuous process rotation is applied only to `PIVOT_FURNACE_PROCESS_SPIN`; the lid does not rotate during processing. `VR_FURNACE_ESSENCE_ANCHOR` may remain detectable in the asset contract, but no current gameplay output uses it.

### Three physical controls and process mechanics

`button_open` uses an ordinary controller ray, nearest-real-hit ray shortening and a halo. Its state machine is `CLOSED → OPENING → OPEN → CLOSING → CLOSED`. The button, three latches, lid and chamber use authored clips; runtime fades the chamber glass, and closing plays the mechanical clips in reverse. Further presses are ignored in transition. `canInsert()` is true only in `OPEN`, and opening is blocked while the process is active.

`button_activate` also uses ordinary-ray real hits and a halo. Activation is available only with the chamber closed and valid inserted content. Its state machine is `IDLE → PRESSING → SPINUP → STEADY → EXTRACTION → COOLDOWN → COMPLETE`. Processing starts only from the `AnimationMixer.finished` event for `AstroFurnace_ButtonActivate_Lock`. The physical button stays locked down after completion; beginning the next opening reverse-plays the lock clip and eventually returns activation to `IDLE`.

The default 18-second process has steady speed `42 RPM`, direction `-1` and extraction multiplier `2`. Its normalized phases and approximate durations are:

```text
SPINUP       0.00–0.14    2.52 s
STEADY       0.14–0.60    8.28 s
EXTRACTION   0.60–0.84    4.32 s
COOLDOWN     0.84–1.00    2.88 s
```

During the first 30% of EXTRACTION, speed rises smoothly from steady speed to `2×`, then stays at maximum. COOLDOWN captures the real entry speed and angle, uses Hermite interpolation to preserve inertia, selects a target on a complete revolution, and finishes by restoring the exact base quaternion.

The runtime clones `fire_cell` materials. Phase energy rises to default emission `4` in STEADY and `10` in EXTRACTION while emissive color approaches white. Its pulse derives from the accumulated mechanical angle—approximately two pulses per revolution—so it accelerates and decelerates with the chamber mechanism. COMPLETE and reset restore the authored base material values.

`button_option` is the third ordinary-ray, real-hit and halo interaction. It toggles the furnace panel. `AstroFurnace_ButtonOption_PreviewRange` and physical option detents are not active runtime behavior.

### Panel and telemetry

The panel is a `CanvasTexture` on `PlaneGeometry`. It is parented as a sibling of the scaled furnace, so it does not inherit scale `3`; its world size is approximately `1.55 × 1.05`, it sits to the furnace's right and unfolds from its left-edge pivot. Its own ordinary-ray intersection maps `intersection.uv` into explicit canvas regions.

The implemented screens are `HOME` and `ASTERION_SPHERE`. HOME exposes active **Asterion Sphere (Sfera Asterionowa)** and UI-visible future **Astro Attractor (Astro Przyciągacz)** and **Emanation Matrix (Matryca Emanacji)** modules. Parametric astrolabe-style frames behave as scalable 9-slice-like borders, with restrained cyan, amber and violet accents. The sphere screen distinguishes gathered and missing shell types and displays process telemetry.

The panel is a read-only consumer of process state/progress, angular speed, accumulated process angle and content state. Its ASCII/Unicode monitor changes by phase, advances according to angular speed, is most energetic in EXTRACTION, visibly slows in COOLDOWN and includes a textual progress bar. While a process (or its short completion display) is active, canvas redraw defaults to `12 Hz`, normalized to `4–30 Hz`; otherwise updates remain event-driven.

### Six-type progression, insertion and commit safety

`VrAstroFurnaceProgressionController` owns committed furnace material progression independently of portfolio progression. Asterion Sphere requires exactly one of every known type: `shell-relic-1`, `shell-relic-2`, `shell-relic-3`, `shell-relic-4`, `shell-relic-5` and `shell-relic-6`. Each is binary `0/1`; an unknown ID or duplicate is invalid. Its snapshot exposes `absorbed`, `required`, `complete`, per-shell states and `missing` IDs. Committed furnace progress survives XR session exit/re-entry in the prepared page runtime, but reload/navigation recreates it; no durable save exists.

The complete material flow is:

```text
Tier 1 complete → shell field
Astro scan/pull → capture_ready → ordinary-ray takeover → held / placed
open furnace → held shell enters VR_FURNACE_INSERT_VOLUME
├─ unknown or duplicate → INVALID → no takeover
└─ required missing type → VALID → release
   → same physical instance snaps to VR_FURNACE_CONTENT_ANCHOR → INSERTED
close furnace → activation available
activate → PRESSING → SPINUP → CONSUMING → visual absorption
consumeEnd → CONSUMED → still no commit
process COMPLETE + CONSUMED → commit shellAssetId
→ remove physical shell → update furnace progress x/6
```

Insertion requires an `OPEN` chamber, process `IDLE` and empty furnace content. Validity additionally requires a known `shellAssetId` for which `canAbsorbShell(assetId)` is true. Invalid shells remain physical and are not taken over or destroyed.

The inserted shell remains the same physical instance. While the chamber is open it presents as `placed`, so `insert → close → reopen before activate` permits ordinary-ray plus squeeze retrieval from the content anchor, with no commit. Insert, close, activation press, SPINUP, CONSUMING and even CONSUMED never commit by themselves. Commit occurs only when content is `CONSUMED` **and** the process is `COMPLETE`. Session interruption/reset before that conjunction removes transient furnace content and never commits it.

On successful commit, `createVrShellSystem.removeInstance` removes the shell record, instance and instance-owned cloned materials. It does not dispose shared cached geometry, textures or `AssetManager` resources. The furnace is therefore a material transformer plus progression store, not a generator of removable physical essence.

## Implemented boundary

Implemented: runtime/session lifecycle, locomotion, glyph/crystal/reliquary progression, floor panels/rings, Tier-1 shell activation, semantic Astro input, A mode toggle, Astro visual, analytic scan targeting, pull/cancel/return, explicit left-ray handoff, placement and ordinary-ray re-grab; Astro Furnace asset/placement; open, activate and option interactions; Asterion panel; six-type furnace progression; physical shell insertion, retrieval and absorption; COMPLETE-gated commit; and process telemetry.

Not implemented: physical Asterion Sphere construction, floor-control sphere, floor tilting, small glyph progression, B band selection/Astro bands, antenna, rune processing, final radar/finale, durable persistence, full-game reset and audio.
