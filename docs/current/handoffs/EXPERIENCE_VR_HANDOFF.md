# Experience VR Handoff

Status: self-contained current snapshot for a new work thread, **2026-08-03**. Code is implementation evidence; the runtime model is the detailed canonical contract.

## IMPLEMENTED

### Runtime, lifecycle and locomotion

- Experience VR is an independent, dynamically imported WebXR runtime owned by `src/experienceVr.js`; it does not boot Experience 3D.
- Preparation happens before the direct immersive-session gesture. Reference space is `local-floor`, with `local` fallback. The tracked head is aligned to the configured start `(0, 0, 5.8)` through `playerRig`; application code does not steer the XR camera.
- Controller records are valid while handedness is initially empty; left/right identity arrives after WebXR `connected`.
- Left stick yaws the rig. Right stick moves horizontally relative to tracked viewer heading. Teleport, jump and snap turn are absent.
- Ordinary white rays reach `2.3 m` and shorten only to reported real interaction hits.
- XR exit/re-entry resets transient interaction state but preserves committed progress within the prepared page runtime. Reload/navigation resets it; no durable save exists.

### Crystals, reliquary, progression and floor

- Five branches contain 18 cards in counts `3 / 3 / 3 / 4 / 5`. Physical crystals are branch+tier instances and do not own page/card identity.
- Real glyph meshes use a `0.5 s` hold with `0.15 s` loss grace. Spawn captures glyph world position and offsets `0.30 m` inward. Acquisition is additive; insertion is current-tier gated.
- Available crystals are targeted and squeeze-grabbed by ordinary rays. Reliquary proximity only classifies held-crystal insertion. Invalid insertion returns through `rejecting` without progress.
- Activate previews a branch+tier page. Release commits it, activates the floor panel, tests the tier, then consumes the crystal. Release without Activate does not progress.
- `VrProgressionController` exclusively owns committed portfolio cards, branch/tier completion and the state projected by the floor. Furnace materials belong to a separate domain controller; no global progression store exists. The floor has five authored sectors, 18 panels and five idempotent procedural tier rings.

### Tier 1 Astro/shell gameplay slice

- Tier 1 unlocks Astro and activates 18 shells: six assets with three instances each. `?p1` remains a QA shortcut to the post-Tier-1 state.
- Semantic right input is: **A / `toggleRightTool`** toggles `NORMAL_HAND ↔ ASTRO_ATTRACTOR`; **squeeze / `grabAction` > 0.1** scans; **trigger / `primaryAction` > 0.1** starts and sustains pull while scanning.
- `createVrHandModeController` owns Astro equipment/visibility. `NORMAL_HAND` shows the right ordinary ray and hides Astro; `ASTRO_ATTRACTOR` does the reverse.
- The single scan cone follows local `-Z`, reaches `3R`, has a `2.5°` half-angle, color `0x78ff9c`, opacity `0.035–0.065` and a `1.6 s` pulse. Targeting analytically tests cached shell bounding spheres, with no ray fan.
- Pull uses `10 m/s²`, maximum `8.5 m/s`, and `0.28 m` capture radius. Its capture point is `worldPosition(PIVOT_RING_MASTER) + worldDirection(controller local -Z) * 1.3 m`.
- States are `orbiting → targeted → pulling → capture_ready → held → placed`, plus technical `returning`. Cancellation before takeover returns in `0.8 s`, with `attractorTarget=false` until orbit is restored.
- Handoff is explicit: the left ordinary ray hits the `capture_ready` shell within `2.3 m`, halo/reporting confirms the hit, then left squeeze holds it. It is not a proximity capture. Left release places it under `VrWorldRoot`.
- Placed shells remain ineligible for Astro (`attractorTarget=false`) but can be repeatedly haloed, grabbed and placed with either free ordinary ray; the right ray works only in `NORMAL_HAND`. Shell priority over a crystal exists only for a real shell hit.
- Shell materials are cloned without losing authored maps. Pull emission progresses `0→1`, `capture_ready` is `1`, held/placed pulse `1→2→1` over `1.4 s`, and deterministic tumble is `0.10–0.22 rad/s`.

### Astro Furnace and Asterion shell progression

- The staged asset pipeline preloads `public/glb/astral_stove.glb`. The independent subsystem is scale `3`, grounded by visible geometry, faces the player start and mirrors the portal's XZ placement around the central monkey anchor.
- Three physical ordinary-ray controls provide real-hit shortening and halos: `button_open` drives authored latch/lid/chamber open and reverse-close clips with runtime glass fade; `button_activate` locks down and runs `PRESSING → SPINUP → STEADY → EXTRACTION → COOLDOWN → COMPLETE`; `button_option` toggles the panel. Opening is blocked during processing, and Activate unlocks only when the next opening begins.
- Runtime process rotation belongs only to `PIVOT_FURNACE_PROCESS_SPIN`, not the authored open/close chamber pivot or lid. The 18-second default profile uses `42 RPM`, direction `-1`, `2×` extraction speed and angle-coupled `fire_cell` feedback.
- The sibling `CanvasTexture`/`PlaneGeometry` panel does not inherit furnace scale. HOME links to active Asterion Sphere (Sfera Asterionowa) and displays future Astro Attractor (Astro Przyciągacz) and Emanation Matrix (Matryca Emanacji). The Asterion screen projects gathered/missing types and read-only process/content telemetry, redrawing active telemetry at default `12 Hz`.
- `VrAstroFurnaceProgressionController` independently owns one binary slot for each `shell-relic-1` through `shell-relic-6`. Exactly one of each type is required; duplicates and unknown IDs are invalid.
- Insertion requires chamber `OPEN`, process `IDLE` and empty content. A valid held shell released in `VR_FURNACE_INSERT_VOLUME` remains the same physical instance and snaps to `VR_FURNACE_CONTENT_ANCHOR`. Before activation, reopening permits ordinary-ray+squeeze retrieval without progress.
- Processing changes inserted content through `CONSUMING` to `CONSUMED`. Commit occurs only at `CONSUMED + COMPLETE`; then the shell system removes the physical instance and its owned material clones and the panel updates `x/6`. The furnace stores progression rather than emitting a physical essence output.
- Furnace committed progress survives XR exit/re-entry in the prepared page runtime. Reload/navigation resets it. Session interruption before COMPLETE clears transient content with no commit; durable save does not exist.

## NOT IMPLEMENTED / FUTURE

- B is not implemented. Approved future behavior makes it a selector only among unlocked Astro bands: RED, YELLOW, GREEN, BLUE and ULTRAVIOLET.
- Collecting all six unique materials does not physically construct the Asterion Sphere. Its construction/materialization, left-hand spatial-gyroscope tool and floor control remain future.
- Floor tilt/local-plane movement, progressive sector backgrounds, central core, small glyphs, Astro bands/B selector, antenna, rune processing, final radar/finale, audio, durable persistence and full-game reset remain future work.
- After Tier 1, ordinary `2.3 m` reach is intended to become insufficient for further glyphs. Target separation is approximately `3 m`; moving the platform versus moving the glyph ring is deliberately unresolved.
