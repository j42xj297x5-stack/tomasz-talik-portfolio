# Experience VR Runtime Model

Status: canonical description of the implemented runtime on 2026-08-02. Approved future gameplay is documented in the [gameplay roadmap](../concept/EXPERIENCE_VR_GAMEPLAY_ROADMAP.md).

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

`VrProgressionController` exclusively owns committed progress. Tiers 1–3 require all five branches, tier 4 Metal + Water, and tier 5 Water. Held-crystal proximity to the authored insertion sphere gives green valid or red invalid feedback. Invalid release enters `rejecting` and returns the crystal to `available`. Activate resolves and previews the branch+tier page without progress. Release after Activate commits it, activates its floor panel, tests tier completion and consumes the crystal over `0.55 s`; Release without Activate returns it without progress.

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

## Implemented boundary

Implemented: runtime/session lifecycle, locomotion, glyph/crystal/reliquary progression, floor panels/rings, Tier-1 shell activation, semantic Astro input, A mode toggle, Astro visual, analytic scan targeting, pull/cancel/return, explicit left-ray handoff, placement and ordinary-ray re-grab.

Not implemented: B band selection, Astro bands, sphere assembly, floor-control sphere, floor tilting, small glyph progression, antenna, runes, final radar/finale, durable persistence and full-game reset.
