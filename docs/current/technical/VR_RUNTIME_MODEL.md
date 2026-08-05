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

### Configuration gate and controls

The Astro Furnace is a separate subsystem backed by `public/glb/astral_stove.glb`, preloaded through `AssetManager`, placed opposite the portal, grounded from visible bounds, scaled to `3` and faced toward the configured start. Authored open/close animation owns `PIVOT_FURNACE_CHAMBER_Z`; runtime spin owns only `PIVOT_FURNACE_PROCESS_SPIN`, and the lid never spins.

The furnace is deliberately unconfigured at session start: Option owns `activeMode = null`. Open, insertion and Activate are unavailable until the player opens the panel with Option and selects **Asterion Sphere**, which activates `floor_gyroscope_sphere`. Option is therefore the first suggested step. Selection rotates `PIVOT_BUTTON_OPTION` by `+90°` around its local Y axis relative to its authored base quaternion. Its local ray-hover is stronger than its active and idle emissions, and its halo is locally stronger than the shared default.

After configuration, Open uses `CLOSED → OPENING → OPEN → CLOSING → CLOSED`; authored button, latch, lid and chamber clips reverse on close, and glass fades. Activate requires `CLOSED + valid INSERTED`, locks down, and runs `IDLE → PRESSING → SPINUP → STEADY → EXTRACTION → COOLDOWN → COMPLETE`. Processing begins only after the lock clip finishes. The button remains down at COMPLETE and unlocks when the next opening begins.

### Insertion, takeover and commit

The inset authored bounds of `komora` define a Y-axis insertion cylinder and its guide. When the **geometric center** of a currently held, missing required shell enters that cylinder, content interaction automatically takes the same physical instance over; release is not required. Unknown and duplicate shell types are invalid and are pushed out immediately along the controller lance without takeover or destruction. The guide remains visible for an empty, open, configured furnace and switches to pulsing valid/invalid feedback for a candidate.

Candidate tests and snap alignment use the shell record's `boundingCenter`, rather than its object origin. The shell attaches to `VR_FURNACE_CONTENT_ANCHOR`; snap preserves its baseline world scale, downscaling only if required to fit the chamber, and retrieval restores that baseline without cumulative scaling. Reopening before activation permits ordinary-ray+squeeze retrieval. Outside this safe-open state the chamber cylinder acts as a soft blocker.

Exactly one each of `shell-relic-1` through `shell-relic-6` is required. `VrAstroFurnaceProgressionController` owns these six identity-based binary material slots independently from portfolio progression. During processing the inserted shell stays settled and dissolves through emission and opacity. Commit remains strictly gated by the conjunction `CONSUMED + COMPLETE`; interruption before it clears transient content without progress. A successful commit removes only that physical shell instance and advances its `shellAssetId` slot. The furnace emits no removable physical essence.

### Synchronized 18-second process

The default profile is one continuous 18-second process at `42 RPM`, direction `-1`, with a `2×` extraction multiplier:

```text
SPINUP       0–3 s
STEADY       3–6 s
EXTRACTION   6–15 s
COOLDOWN     15–18 s
```

There is one local `extractionProgress`, which is `0→1` only during EXTRACTION. The physical shell dissolve and panel dissolve/progress/patch assembly consume this same value; SPINUP and STEADY do not advance absorption, and COOLDOWN begins with extraction already complete. The first 30% of EXTRACTION accelerates smoothly to `2×`; COOLDOWN preserves entry inertia with Hermite interpolation, lands on a full revolution and restores the exact authored quaternion.

The cloned `fire_cell` materials and inserted-shell emission use a common process phase derived from accumulated mechanical angle. A single shadowless `PointLight` follows the phase energy envelope but orbits against the chamber angle (`lightAngle = -processAngle`) around a stable axis/reference, so its counter-rotation is stable rather than inherited from the spinning pivot. IDLE/COMPLETE disable the light and restore authored material values.

### Two-sided panel and deterministic Asterion Sphere

The panel is a furnace sibling and therefore does not inherit furnace scale `3`. It has separate `VrAstroFurnacePanelFrontPlane` and `VrAstroFurnacePanelBackPlane`, each with `FrontSide`, sharing one `CanvasTexture`. The back plane is geometrically turned around, so the same canvas reads normally—neither crushed nor mirrored—from both sides; `DoubleSide` is not used. Its world size is about `1.55 × 1.05`, its configured gap is about `0.10 m`, and yaw is about `-12°`.

HOME contains the active Asterion module and two UI-only future modules. The Asterion screen shows real deterministic mini-wireframes for all six shells and the states **BRAK / W PROCESIE / ZGROMADZONA**. While this screen is visible, throttled redraw (default `12 Hz`, clamped `4–30 Hz`) continues even in IDLE, so the full sphere preview never stops rotating.

The preview is not an arc/ellipse placeholder. It consists of a deterministic ghost of the complete sphere plus six audited shell patches with fixed identity mapping to `+X / -X / +Y / -Y / +Z / -Z`. Audit-derived 2D segments are mapped onto curved spherical-cube faces with subdivision; the Canvas projection rotates the entire sphere continuously and applies front/back culling. During EXTRACTION the inserted shell wireframe fades in deterministic order while its matching patch materializes in parallel from the same `extractionProgress`. The patch remains pending through COOLDOWN and is not rendered as committed until `COMPLETE` causes the progression controller to commit that `shellAssetId`.

At `6/6` the panel therefore shows a complete material/holographic reconstruction. It is **not** a physical Asterion Sphere and does not construct or materialize one.

### Audit-derived data boundary

[`docs/current/audits/asterion-shells/`](../audits/asterion-shells/) is the deterministic offline audit of the six final GLBs and the source of production patch data. Runtime performs no PCA and no GLB geometry analysis for Asterion patches; it consumes deterministically exported audit data through the Asterion sphere wireframe helper. Detailed metrics remain in the [geometry audit](../audits/asterion-shells/asterion-shell-geometry-audit.md), not in this runtime model.

## QA physical Asterion Sphere prototype

`?asterionSphere` is a QA-only equipment override. It does not commit shells, does not alter `VrAstroFurnaceProgressionController`, does not fake `6/6`, and does not reinterpret the furnace panel preview as a physical object. When enabled, the runtime loads `public/glb/asterion_sphere.glb` through `AssetManager`, equips the cloned model on the resolved left `grip`, hides only the left ordinary ray while equipped, and leaves the right-hand Astro Attractor path unchanged.

The prototype starts every `ASTERION_IDLE__*` clip on an `AnimationMixer` while validating that `ASTERION_ROOT`, `GIMBAL_CURRENT` and `GIMBAL_TARGET` remain runtime-driven. The left trigger is a quaternion clutch: target orientation captures from current target on trigger-down, follows physical left-grip world rotation while held, freezes on release, and supports repeated clutch accumulation without snap. `currentQuaternion` follows `targetQuaternion` with framerate-independent exponential slerp.

Only `progressFloor.object` (`VrTiltableFloorRoot`) receives the resulting `currentQuaternion`; `playerRig`, camera and locomotion reference frame remain stable. `GIMBAL_CURRENT` and `GIMBAL_TARGET` are written in their actual parent space so their world orientations match the current/target radar orientation even while the sphere shell moves with the user’s hand.

## Implemented boundary

Implemented: runtime/session lifecycle, locomotion, glyph/crystal/reliquary progression, floor panels/rings, Tier-1 shell activation, semantic Astro input, A mode toggle, Astro visual, analytic scan targeting, pull/cancel/return, explicit left-ray handoff, placement and ordinary-ray re-grab; Astro Furnace asset/placement; open, activate and option interactions; Asterion panel; six-type furnace progression; physical shell insertion, retrieval and absorption; COMPLETE-gated commit; and process telemetry.

Not implemented: production physical Asterion Sphere construction, production equipment gating, `UTWÓRZ`, production 6/6 materialization, floor tilting, small glyph progression, B band selection/Astro bands, antenna, rune processing, final radar/finale, durable persistence, full-game reset and audio.
