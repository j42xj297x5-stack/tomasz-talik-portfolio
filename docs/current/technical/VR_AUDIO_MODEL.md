# Experience VR Audio Model

Status: **CURRENT / BINDING**, living technical model for Experience VR audio synchronized on 2026-09-02.

## SUMMARY DLA ARCHITEKTA

The bounded Experience VR Astro Attractor lifecycle, spatial Astro Furnace physical sounds, Resonator target audio and Rune Stone spatial audio are **IMPLEMENTED**. One composition-level XR listener update serves every spatial projection. The Asterion sector acquisition/drive choreography, four-second Rune Binder arrival and anticipatory Rune installation one-shots are also **IMPLEMENTED** under the observer-only audio architecture below. The main background contract remains Scenario-driven but **NOT YET FULLY IMPLEMENTED**. Both Asterion Sphere DEVICE loops remain independent and **IMPLEMENTED**.

## Status vocabulary and authority

| Status | Meaning in this document |
| --- | --- |
| **IMPLEMENTED** | Behavior exists in the current runtime. This currently covers the bridge, five-bus mixer, UI and world/device one-shots listed below, and the crystal-acquisition process lifecycle. |
| **PLANNED** | An existing asset has an explicitly assigned future VR event or sequence role. It does **not** mean playback exists. |
| **RESERVED** | The family/layer function is known, but no event or concrete mapping has been assigned yet. |
| **UNASSIGNED** | No VR use has been decided. |

This is the main source for **Experience VR audio** tasks. The general [`AUDIO_RUNTIME_MODEL.md`](AUDIO_RUNTIME_MODEL.md) remains authority for the implemented shared audio owner and existing non-VR behavior; [`VR_RUNTIME_MODEL.md`](VR_RUNTIME_MODEL.md) remains authority for implemented VR gameplay. If code, inventory, and this model diverge, report the conflict rather than inventing a mapping.

## Runtime boundary and mixer contract

`VrAudioBridge` is **IMPLEMENTED** and remains the mandatory fail-soft boundary from gameplay to optional audio. Requests use its small prepare/play helpers, which retain the `runOptional(operation, request)` failure boundary: an audio failure may warn, but must never block or fail gameplay. The bridge stores no gameplay state and stops active VR one-shots on disposal.

Long-form sequencer assets use transient decoded buffers rather than the permanent one-shot cache. Only the current decode/source (and a pending replacement) is retained, and generation invalidation prevents a late decode from playing after state changes. Finite repetition is scheduled ahead on the `AudioContext` clock from one decoded buffer; MP3 assets use one configurable 40 ms overlap/crossfade seam guard. A future seamless WAV can use a zero guard without changing the sequencer.

The VR mixer has five **IMPLEMENTED**, independently tunable gain buses:

| Bus | Responsibility | Asset families |
| --- | --- | --- |
| `SPACE` | lowest cosmic background | `noise_quiete_loop_*`, `noise_loop_*` |
| `AMBIENT` | ambients and main musical threads | `ambient_01–05`, `ambient_loop_01–04` |
| `DEVICE` | loud device operation | `astro_piec_*`, `noise_laud_loop_01–09`, `asterion_sphere_*`, `resonator_aim_*`, `resonator_lock_*` |
| `WORLD` | short world sounds | `creating_*`, `floor_panel_activate`, `glif_*`, `reliquiary_consume`, `monkey_thinking_01` |
| `UI` | panels | `bell_*`, `click_panel_01`, `click_short_01`, `panel_sound_*`, `panel_sound_long_*` |

Each bus has its own `GainNode` and all five feed the existing shared **Master Volume**. All samples are already mixed and mastered. Defaults are `source gain = 1.0` and every `VR bus gain = 1.0`. Do not add normalization, limiters, per-sample trims, or ducking. Event-specific fades below are lifecycle behavior, not mastering trims.

## Background sequencer

### CURRENT / BINDING Scenario entry contract

Intro owns its separate `ambient_intro_*` sequence. The main sequence begins only after Intro, and Scenario semantic entries—not polling, runtime tier or generic thresholds—own selection:

| Scenario semantic entry | Scenario point | Main asset | Canonical status |
| --- | --- | --- | --- |
| crossing from `1.130` completed; Monkey seated; `GLYPH_FREE_EXPLORE` begins | `2.10` | `ambient_01.mp3` | **CURRENT / BINDING TARGET; entry seam exists, selection contract not fully implemented** |
| ring 1 completed | `2.40` | `ambient_02.mp3` | **CURRENT / BINDING TARGET; NOT IMPLEMENTED** |
| ring 2 completed | `4.20` | `ambient_03.mp3` | **CURRENT / BINDING TARGET; NOT IMPLEMENTED** |
| ring 3 completed | `4.80` | `ambient_04.mp3` | **CURRENT / BINDING TARGET; NOT IMPLEMENTED** |
| ring 4 completed | future point after `4.80`; point ID **NOT AUTHORED** | `ambient_05.mp3` | **CURRENT / BINDING TARGET; NOT AUTHORED / NOT IMPLEMENTED** |

Ring 5 completion is likewise **FUTURE / NOT AUTHORED**; this contract assigns it no point ID and no new main ambient.

For `ambient_01–04`, until the next semantic Scenario entry replaces the main thread, the cycle is:

1. Play the current `ambient_N` once to its natural end.
2. Hold **10 seconds** of silence.
3. Select the next `noise_quiete_loop_N` from the single global cursor; keep the existing 10-second fade-in, play 6 complete repetitions, then keep the existing 10-second fade-out.
4. Hold **10 seconds** of silence.
5. Repeat the same `ambient_N`, then continue with the next quiet loop.

The quiet-loop cursor is global across the entire progression and **never resets** when a new main ambient replaces the current thread. Its repository queue is:

```text
01 → 02 → 03 → 04 → 05 → 06 → 07 → 08 → 09 → 10 → 11 → 12 → 13 → 01 → …
```

For example: `ambient_01 → quiet 01 → ambient_01 → quiet 02`; after the next semantic entry, `ambient_02 → quiet 03 → ambient_02 → quiet 04`. Replacement stops/replaces the active main musical thread but preserves the cursor.

### Post-main tail

There is no `ambient_06`. After the future Scenario entry for `ambient_05`, play `ambient_05` once and then use the existing `ambient_loop_*` inventory in ascending order. Each tail ambient plays 6 complete repetitions:

```text
ambient_05 once
→ 10 s silence → next quiet ×6 → 10 s silence
→ ambient_loop_01 ×6
→ 10 s silence → next quiet ×6 → 10 s silence
→ ambient_loop_02 ×6 → … → ambient_loop_04 ×6
```

The quiet layers retain their 10-second fade-in and 10-second fade-out and the same global cursor, including `13 → 01`. Behavior after the last existing `ambient_loop_*` is exhausted remains a future decision; no tail wrap is established.

The former canonical `shells complete + Asterion Sphere built → ambient_loop_01 subthreshold` is **SUPERSEDED** and is not part of the target main-music progression. This does not affect the independent DEVICE loops `asterion_sphere_background.mp3` and `asterion_sphere_work.mp3`.

## Interaction contracts

### Crystal acquisition

| Branch / element | Crystal order and completion samples |
| --- | --- |
| Ethics / Earth (3) | `earth_01`, `earth_02`, `earth_03` |
| Creative AI / Fire (3) | `fire_01`, `fire_02`, `fire_03` |
| AI Guide / Wood (3) | `wood_01`, `wood_02`, `wood_01` |
| DIG Engine / Metal (4) | `metal_01`, `metal_02`, `metal_03`, `metal_04` |
| Haiku Cosmos / Water (5) | `water_01`, `water_02`, `water_03`, `water_04`, `water_01` |

Each shorthand above denotes `glif_<element>_4s_<NN>.mp3`. `glif_earth_4s_04.mp3` and `glif_fire_4s_04.mp3` have no current VR use.

`glif_hover_loop.mp3` has special VR semantics despite its name; it is **not** an infinite source loop:

- The first ray hit beginning acquisition starts it immediately with no fade-in.
- A temporary glyph loss leaves the source playing while gain eases toward zero over 1 second.
- Return to the same acquisition process within that second keeps the same source and playhead, fading in over 0.1 seconds from its current gain.
- Without return, reaching zero stops and cleans up the source.
- Successful acquisition fades it out over 0.2 seconds, then plays the appropriate elemental completion sample.
- If the 12-second file ends naturally while acquisition remains active, start it again from the beginning. Never set `source.loop = true` for this bed.

### Reliquary

- A physical crystal actually accepted by the reliquary → `turn_page_01.mp3` on `WORLD`, exactly once; hover, volume entry without acceptance, rejection, and reset are silent.
- An accepted Activate action for the currently inserted crystal → `creating_short_01.mp3` on `WORLD`, exactly once; rejected/repeated activation, hover, insertion, and reset are silent.
- Player-facing Release after Activate, when the idempotent progression commit succeeds → `reliquiary_consume.mp3` on `WORLD`. Release is physically disabled in `inserted`; internal recovery from that state has no player-facing audio mapping.
- The same commit, when the progression controller reports real tier completion, additionally plays `floor_panel_activate.mp3` on `WORLD`, after `reliquiary_consume`; audio does not calculate or own progression state.

In short: insert → `turn_page_01`, activate → `creating_short_01`, consume → `reliquiary_consume`, complete → additional `floor_panel_activate`. These remain four distinct gameplay events.

### Platform sector acquisition and drive — CURRENT / IMPLEMENTED

The first valid frame of each genuinely new sector-acquisition attempt plays one branch-specific `WORLD` one-shot: EARTH → `electricity_short_01.mp3`, FIRE → `electricity_short_02.mp3`, WOOD → `electricity_short_03.mp3`, METAL → `electricity_short_04.mp3`, WATER → `electricity_short_05.mp3`. The trigger is the live `IDLE / no candidate → ACQUIRING valid powered sector candidate` transition while the Asterion Sphere is equipped and acquisition input is active, so it coincides with the tube's first electrical contact; it does **not** wait for the unchanged `1.0 s` `LOCKED` gameplay truth. GRIP without valid contact, invalid or unpowered sectors, empty space, blocked interaction, reconstruction and reset are silent. Contact loss followed later by a genuinely new valid acquisition attempt may play the one-shot again; a direct candidate change before `LOCKED` is likewise a new attempt. There is no cooldown. This mapping does not add sector-control gameplay: the current runtime physically drives only EARTH/WOOD/FIRE, and each mapping becomes active only with its corresponding legal sector interaction.

Active sector drive uses finite, non-looping process sources: EARTH → `electricity_long_01.mp3`, FIRE → `electricity_long_02.mp3`, WOOD → `electricity_long_03.mp3`, METAL → `electricity_long_04.mp3`, WATER → `electricity_long_04.mp3`. A new real drive-audio lifecycle starts its asset from the beginning. Continuous same-direction adjustment preserves the source/playhead, including a short detent hold within the same manipulation; detent handling must not synthesize a restart. Automatic `SETTLING` is not active player drive. End of active manipulation or release ramps gain to zero over exactly `1.0 s`; reacquiring the same sector before that fade completes preserves its source/playhead and ramps to full gain over exactly `0.2 s`. Only after gain reaches zero may the source stop/dispose; a later lifecycle starts from the beginning. Natural file end is silent and never restarts automatically.

### Zwornik live arrival — CURRENT / IMPLEMENTED

The former instantaneous R3c audio cycle using `creating_01–03` is **SUPERSEDED**. On a live sector-completion transition, at `t=0.0 s`, play `electricity_short_06.mp3` immediately on `WORLD` and begin one owner-controlled Zwornik arrival from exactly `130 m` farther outward along that sector's radial axis relative to its canonical docked position. Over exactly `4.0 s` it translates along that axis to the exact final position. Existing Binder lightning/materialization may accompany the reveal but must not own or duplicate this translation.

At `t=4.0 s` the Zwornik reaches the exact canonical dock position, becomes fully `DOCKED` and installation-ready, then plays its branch-specific `WORLD` one-shot: EARTH → `zwornik_01.mp3`, FIRE → `zwornik_02.mp3`, WOOD → `zwornik_03.mp3`, METAL → `zwornik_04.mp3`, WATER → `zwornik_03.mp3`. Installation cannot begin during live arrival. The semantic state path is `HIDDEN → ARRIVING → DOCKED`; runtime naming may differ, but ARRIVING and settled DOCKED must remain distinguishable.

Hydration, reconstruction and debug restoration of an already completed sector are silent and settled: restore directly at final `DOCKED`, with no 130 m motion, `electricity_short_06` or `zwornik_*` playback.

### Reserved field detection and Rune Stone installation

`electricity_short_07.mp3` is **RESERVED** for detecting the Metal Large Glyph inside the future Resonator field; `electricity_short_08.mp3` is **RESERVED** for the Water Large Glyph. They remain TODO until real target-containment semantics exist; no proxy trigger is authorized.

The `creating_*` family is reassigned from Binder reveal to Rune Stone installation: EARTH → `creating_01.mp3`, FIRE → `creating_02.mp3`, WOOD → `creating_03.mp3`, METAL → `creating_04.mp3`, WATER → `creating_05.mp3`. During a live installation, with `installAudioLeadSeconds = 1.0`, play the branch one-shot exactly once when remaining final `DESCENT` time first becomes `<= 1.0 s`; if future tuning makes the entire `DESCENT <= 1.0 s`, play it once at `DESCENT` start. This presentation anticipation does not install the stone: `INSTALLED`, bridge `BOUND`, `commitInstalledFamily()` and eligibility for the persistent installed spatial loop remain tied to actual physical completion. Do not move this sound to `APPROACH`, `BRIDGE_OPEN` or attractor handoff, and hydration/reconstruction remains silent. `creating_06–08.mp3` remain **UNASSIGNED**, and `creating_short_01.mp3` retains its existing Reliquary activation role.

### Astro Furnace spatial audio — CURRENT / IMPLEMENTED

The physical machine uses spatial `DEVICE` sources at one stable `VrAstroFurnaceSpatialAudioAnchor`. Panel/interface feedback remains non-spatial `UI`: Open Option → `panel_sound_01.mp3`, enter deeper → `panel_sound_02.mp3`, and return to the main menu → `click_panel_01.mp3`. This boundary does not spatialize those sounds or any other panel feedback.

Physical mappings preserve their gameplay triggers while changing presentation only:

- accepted `CLOSED → OPENING` / `OPEN → CLOSING` transition → `astro_piec_open.mp3` / `astro_piec_close.mp3`, once per transition;
- ordinary Shell process → `astro_piec_work_01.mp3`;
- Rune tuning Astrolabium from one Small Glyph + Shell recipe → `astro_piec_work_03.mp3` (one canonical 18-second cycle; the physical Rune Stone never enters the Furnace);
- accepted Production Asterion Sphere or Astro Attractor construction → `astro_piec_work_create_01.mp3`; this construction kind suppresses the ordinary work source;
- `astro_piec_work_02.mp3` remains unimplemented and has no new role from this correction.

Blocked presses, stable requested chamber states, animation frames, reset and hydration/reconstruction are silent. Audio never determines the process kind, duration or completion truth; interruption stops the corresponding active process source.

The anchor hierarchy is:

```text
VrTiltableFloorRoot
→ VrPlatformFixturesRoot
→ VrAstroFurnace
  └─ VrAstroFurnaceSpatialAudioAnchor
```

`VrAstroFurnace` directly owns the anchor; it is not attached to chamber, lid, latch, button, process-spin node or any animated GLB child. Placement calculates its local position once from the center of the Furnace's final local visible bounds after floor alignment, failing soft to the Furnace local origin when valid bounds are unavailable. There are no per-frame geometry scans or parallel world-position calculations. Hierarchy inheritance makes the anchor follow both the Furnace and global platform gyro.

`AstroFurnaceAudioProjection` owns the active physical-source presentation lifecycle. While a source is active it reads this stable anchor's world position and updates the handle, so gyro motion is followed. `VrAudioBridge` remains generic and does not own Furnace-specific process handles; `VrAstroFurnace` owns the physical object/anchor; gameplay interactions remain Furnace truth; and composition owns the shared listener update.

```js
furnaceSpatialAudio: {
  maxDistanceMeters: 6.0,
  refDistanceMeters: 0.25
}
```

Each physical source uses `panningModel = HRTF`, `distanceModel = linear`, `rolloffFactor = 1` and the `DEVICE` bus. At distance `>= 6.0 m`, its gain is zero under this model.

### Monkey and panels

- A new monkey communication signal that starts the three attention arcs → `monkey_thinking_01.mp3` on `WORLD`, once at signal start; pulses/redraws and repeated notification while the same signal remains pending are silent.
- Monkey panel: open → `panel_sound_long_01.mp3`; close → `panel_sound_long_02.mp3`; internal click → `click_panel_01.mp3`.
- Player Y panel: open → `bell_01.mp3`; close → `bell_02.mp3`; internal click → `click_panel_01.mp3`.

### Rune Stone Attractor and installed spatial audio — CURRENT / IMPLEMENTED

The natural Rune Stone identities are physical and shared by two independent DEVICE lifecycles: FIRE / `stone_01` → `noise_laud_loop_04.mp3`, METAL / `stone_02` → `05`, EARTH / `stone_03` → `06`, WOOD / `stone_04` → `07`, WATER / `stone_05` → `08`. SPECIAL Ether / `stone_06` / `V` uses `noise_laud_loop_09.mp3` only for the same accepted Astro Attractor pull/cancel/handoff lifecycle; it is not an installed emitter or natural pair.

The Astro Attractor process loop starts only when a physical Rune Stone pull is actually accepted. Scan-cone hover, targeting and rejected pull attempts are silent. The interaction exposes separate presentation seams for accepted pull start, pull cancel and successful installation handoff; handoff uses the established handoff fade rather than generic cancel semantics. The general Attractor source/recovery contract remains: true source looping, no per-frame restart, `1.0 s` target-loss fade with same-source recovery, about `0.1 s` recovery ramp, and `0.5 s` successful handoff fade. Audio observes the accepted lifecycle and physical identity; it never grants targetability or handoff.

Persistent spatial audio exists only when both canonical facts hold:

```text
RuneStoneActor physical state == INSTALLED
AND installed-family progression truth == true
```

`FREE`, `LOCKED_BY_ASTRO`, `CARRIED_ORBIT` and `SOCKET_CAPTURE` never own a persistent emitter. The older quiet free/carried ambience concept is **SUPERSEDED**. At most five natural installed emitters exist. Each uses the identity mapping above but is a new lifecycle, independent of the Attractor source. Reconstruction does not replay Attractor or `creating_*` audio, but repeated synchronization restores each required installed source without duplication. Reset/disposal removes stale sources and generation invalidation prevents late asynchronous starts.

The location owner is the Progress Floor sector, not the stone. Every natural sector exposes one stable `RuneStoneSpatialAudioAnchor` at `platformRadiusMeters = 8.0`, along sector-local `+Z` in flat `LEVEL 0` orientation:

```text
VrTiltableFloorRoot
→ PlatformGeometryRoot
→ SectorActorRoot
  ├─ RuneStoneSpatialAudioAnchor (+Z 8.0 m)
  └─ SectorMotionRoot
```

The anchor therefore inherits the platform global transform, global gyro, authored platform-layout yaw and static sector radial yaw, but not individual detent pitch/tilt. Rune Stone state determines **whether** the source exists; this fixed sector anchor determines **where** it exists. It does not follow the physical Rune Stone root, installation anchor or RuneBridge center.

`AudioManager` owns Web Audio, cache, buses and the shared Panner primitive. `VrAudioBridge` is the generic fail-soft runtime boundary. `RuneStoneAudioProjection` observes installed truth, owns installed-source synchronization and updates only Rune emitter positions; `AstroFurnaceAudioProjection` likewise owns Furnace physical sources and updates only the Furnace emitter position.

There is exactly one spatial-listener update per VR frame, at Experience composition level:

```text
WebXR tracked camera
→ getXrHeadWorldPose(...)
→ experienceVr composition
→ VrAudioBridge.setSpatialListenerPose(...)
→ AudioManager / AudioListener
```

The internal WebXR `ArrayCamera` is detached from the ordinary Three.js parent hierarchy. The helper therefore updates `playerRig` world matrices, asks `renderer.xr` to update the camera, obtains the prepared XR camera, and extracts position/quaternion directly from its prepared `matrixWorld`. Calling `xrCamera.updateWorldMatrix(...)`, `getWorldPosition(...)` or `getWorldQuaternion(...)` on that detached camera is not the listener path because it can rebuild the matrix and lose the player-rig transform. The listener and every emitter consequently use the same Experience VR world coordinate system; no spatial subsystem maintains a separate listener. Gameplay/composition never accesses `AudioContext` directly. The source chain is:

```text
AudioBufferSourceNode → source GainNode → PannerNode → DEVICE bus
```

Spatial settings and their roles are canonical:

```js
runeStoneSpatialAudio: {
  maxDistanceMeters: 4.0,      // exact outer audible range
  refDistanceMeters: 0.25,     // attenuation tuning inside the range
  platformRadiusMeters: 8.0    // stable sector-audio-anchor radius
}
```

The source uses `loop = true`, `panningModel = HRTF`, `distanceModel = linear` and `rolloffFactor = 1`. At distance `>= 4.0 m`, source gain is exactly zero; attenuation inside that range is presentation **TUNING**, never gameplay-distance logic. The shared listener follows the actual XR head world pose, while this projection updates only the fixed sector-local emitter anchor.

All audio reachable in Experience VR is prepared and decoded before READY; gameplay is cache-only. For this implemented package the relevant set includes `electricity_short_01–06`, `electricity_long_01–04`, `zwornik_01–04`, `creating_01–05`, `noise_laud_loop_04–09`, `resonator_aim_01–04`, `resonator_lock_01–04`, `stone_landing_01–04`, `zwornik_dokowanie`, and the reachable physical Furnace set `astro_piec_open`, `astro_piec_close`, `astro_piec_work_01`, `astro_piec_work_03`, `astro_piec_work_create_01`. The former unused `glif_hover_on_loop.mp3` identity is removed and replaced by Ether-specific `noise_laud_loop_09.mp3`. Reserved `electricity_short_07–08` and unassigned `creating_06–08` are not reachable runtime behavior.

### Asterion Sphere / floor

`asterion_sphere_background.mp3` starts as one continuous DEVICE loop when the sphere becomes equipped. Repeated equipped frames keep the same source; trigger release does not affect it. Unequip, session reset, and disposal stop and clean it up.

`asterion_sphere_work.mp3` is an independent DEVICE loop observed from the gyro drive state:

- First active trigger starts immediately with `loop: true`.
- Release begins a smooth, exactly 2-second fade-out.
- A new trigger during that window cancels the pending stop, continues the same source/playhead, and restores gain.
- Reaching the end of the fade stops and cleans up the source.
- Unequip, reset, and disposal stop both Sphere lifecycles immediately; audio never changes gyro or floor physics.

## Complete repository MP3 inventory

The inventory below contains every existing `public/audio/*.mp3` as of 2026-08-26, exactly one row per file. A layer classifies the family; it does not itself assign an event. `UNASSIGNED` in the Layer column means no VR layer is safely inferable.

| Asset | Forma | Warstwa | Planowane użycie VR | Status | Uwagi |
| --- | --- | --- | --- | --- | --- |
| `ambient_01.mp3` | one-shot | AMBIENT | Scenario entry `2.10`, po Intro | **PLANNED** | CURRENT / BINDING target; obecny runtime startuje main gate w `2.10`, ale nadal wybiera asset z tieru. |
| `ambient_02.mp3` | one-shot | AMBIENT | ring 1 complete → Scenario entry `2.40` | **PLANNED** | CURRENT / BINDING Scenario mapping; jeszcze niezaimplementowany. |
| `ambient_03.mp3` | one-shot | AMBIENT | ring 2 complete → Scenario entry `4.20` | **PLANNED** | CURRENT / BINDING Scenario mapping; jeszcze niezaimplementowany. |
| `ambient_04.mp3` | one-shot | AMBIENT | ring 3 complete → Scenario entry `4.80` | **PLANNED** | CURRENT / BINDING Scenario mapping; jeszcze niezaimplementowany. |
| `ambient_05.mp3` | one-shot | AMBIENT | ring 4 complete → przyszły point po `4.80` | **PLANNED** | Point ID NOT AUTHORED; playback i przejście do tail NOT IMPLEMENTED. |
| `ambient_loop_01.mp3` | seamless loop | AMBIENT | post-main tail, po `ambient_05` i quiet | **PLANNED** | Istniejący asset; ×6. Stary Asterion subthreshold jest superseded. |
| `ambient_loop_02.mp3` | seamless loop | AMBIENT | post-main tail po `ambient_loop_01` i quiet | **PLANNED** | Istniejący repozytoryjny asset; ×6. |
| `ambient_loop_03.mp3` | seamless loop | AMBIENT | post-main tail po `ambient_loop_02` i quiet | **PLANNED** | Istniejący repozytoryjny asset; ×6. |
| `ambient_loop_04.mp3` | seamless loop | AMBIENT | post-main tail po `ambient_loop_03` i quiet | **PLANNED** | Istniejący repozytoryjny asset; ×6; zachowanie po nim pozostaje nieustalone. |
| `astro_piec_close.mp3` | one-shot | DEVICE | zamknięcie komory Astro Pieca | **IMPLEMENTED** | Spatial at the stable Furnace anchor; once per accepted transition. |
| `astro_piec_open.mp3` | one-shot | DEVICE | otwarcie komory Astro Pieca | **IMPLEMENTED** | Spatial at the stable Furnace anchor; once per accepted transition. |
| `astro_piec_work_01.mp3` | one-shot | DEVICE | zwykły proces skorup w Astro Piecu | **IMPLEMENTED** | Spatial at the stable Furnace anchor; active handle follows gyro; reset/dispose stops it. |
| `astro_piec_work_create_01.mp3` | one-shot | DEVICE | Production Asterion / Astro Attractor construction | **IMPLEMENTED** | Spatial at the stable Furnace anchor; stopped on interrupted build; no duplicate ordinary source. |
| `astro_piec_work_02.mp3` | one-shot | DEVICE | proces małych glifów w Astro Piecu (TODO gameplay) | **PLANNED** | Asset istnieje; playback VR nie jest jeszcze wdrożony. |
| `astro_piec_work_03.mp3` | one-shot | DEVICE | Rune tuning Astrolabium z Small Glyph + Shell | **IMPLEMENTED** | Spatial at the stable Furnace anchor during the current canonical 18-second tuning cycle. |
| `bell_01.mp3` | one-shot | UI | otwarcie panelu gracza Y | **IMPLEMENTED** | Playback one-shot na busie UI jest wdrożony. |
| `bell_02.mp3` | one-shot | UI | zamknięcie panelu gracza Y | **IMPLEMENTED** | Playback one-shot na busie UI jest wdrożony. |
| `bell_03.mp3` | one-shot | UI | — | **UNASSIGNED** | Brak ustalonego użycia VR. |
| `asterion_sphere_background.mp3` | seamless loop | DEVICE | wyposażona Kula Asterionowa | **IMPLEMENTED** | Jeden ciągły source do unequip/reset/dispose; niezależny od triggera. |
| `asterion_sphere_work.mp3` | seamless loop | DEVICE | aktywne sterowanie podłogą Kulą | **IMPLEMENTED** | Start przy drive; release wygasza przez 2 s, a retrigger zachowuje source/playhead. |
| `click_panel_01.mp3` | one-shot | UI | klik wewnątrz panelu małpy lub gracza Y; powrót panelu Astro Pieca do menu głównego | **IMPLEMENTED** | Playback one-shot na busie UI jest wdrożony. |
| `click_short_01.mp3` | one-shot | UI | panelowe kliknięcia wcześniej mapowane jako `turn_page_*` | **IMPLEMENTED** | W bieżącym Experience VR nie było takich mapowań; istniejących świadomych klików nie zmieniono. |
| `creating_01.mp3` | one-shot | WORLD | instalacja Rune Stone EARTH | **IMPLEMENTED** | Once when final DESCENT first has `<= 1.0 s` remaining; silent reconstruction. |
| `creating_02.mp3` | one-shot | WORLD | instalacja Rune Stone FIRE | **IMPLEMENTED** | Once when final DESCENT first has `<= 1.0 s` remaining; silent reconstruction. |
| `creating_03.mp3` | one-shot | WORLD | instalacja Rune Stone WOOD | **IMPLEMENTED** | Once when final DESCENT first has `<= 1.0 s` remaining; silent reconstruction. |
| `creating_04.mp3` | one-shot | WORLD | instalacja Rune Stone METAL | **IMPLEMENTED** | Once when final DESCENT first has `<= 1.0 s` remaining; silent reconstruction. |
| `creating_05.mp3` | one-shot | WORLD | instalacja Rune Stone WATER | **IMPLEMENTED** | Once when final DESCENT first has `<= 1.0 s` remaining; silent reconstruction. |
| `creating_06.mp3` | one-shot | WORLD | — | **UNASSIGNED** | Dostępny; przyszłe użycie pozostaje otwarte. |
| `creating_07.mp3` | one-shot | WORLD | — | **UNASSIGNED** | Dostępny; przyszłe użycie pozostaje otwarte. |
| `creating_08.mp3` | one-shot | WORLD | — | **UNASSIGNED** | Dostępny; przyszłe użycie pozostaje otwarte. |
| `creating_short_01.mp3` | one-shot | WORLD | zaakceptowana aktywacja kryształu w relikwiarzu / AKTYWUJ | **IMPLEMENTED** | Raz na faktycznie zaakceptowaną aktywację; audio nie rozstrzyga poprawności gameplayu. |
| `electricity_long_01.mp3` | finite one-shot | DEVICE | EARTH sector drive | **IMPLEMENTED** | Non-looping lifecycle; 1.0 s fade-out / 0.2 s recovery. |
| `electricity_long_02.mp3` | finite one-shot | DEVICE | FIRE sector drive | **IMPLEMENTED** | Non-looping lifecycle; 1.0 s fade-out / 0.2 s recovery. |
| `electricity_long_03.mp3` | finite one-shot | DEVICE | WOOD sector drive | **IMPLEMENTED** | Non-looping lifecycle; 1.0 s fade-out / 0.2 s recovery. |
| `electricity_long_04.mp3` | finite one-shot | DEVICE | METAL and WATER sector drive | **IMPLEMENTED** | Mapping is canonical; corresponding physical controls remain future. |
| `electricity_short_01.mp3` | one-shot | WORLD | EARTH valid acquisition attempt starts | **IMPLEMENTED** | First valid `ACQUIRING` frame; does not wait for lock. |
| `electricity_short_02.mp3` | one-shot | WORLD | FIRE valid acquisition attempt starts | **IMPLEMENTED** | First valid `ACQUIRING` frame; does not wait for lock. |
| `electricity_short_03.mp3` | one-shot | WORLD | WOOD valid acquisition attempt starts | **IMPLEMENTED** | First valid `ACQUIRING` frame; does not wait for lock. |
| `electricity_short_04.mp3` | one-shot | WORLD | METAL valid acquisition attempt starts | **IMPLEMENTED** | First valid `ACQUIRING` frame; corresponding legality remains required. |
| `electricity_short_05.mp3` | one-shot | WORLD | WATER valid acquisition attempt starts | **IMPLEMENTED** | First valid `ACQUIRING` frame; corresponding legality remains required. |
| `electricity_short_06.mp3` | one-shot | WORLD | live sector completion / Zwornik arrival start | **IMPLEMENTED** | At t=0.0 s of the 4.0 s arrival. |
| `electricity_short_07.mp3` | one-shot | WORLD | future Metal Large Glyph field detection | **RESERVED** | No trigger until real containment semantics exist. |
| `electricity_short_08.mp3` | one-shot | WORLD | future Water Large Glyph field detection | **RESERVED** | No trigger until real containment semantics exist. |
| `floor_panel_activate.mp3` | one-shot | WORLD | dodatkowo po Release kończącym pełny próg | **IMPLEMENTED** | Playback one-shot jest wdrożony zgodnie z semantyką eventu powyżej. |
| `glif_earth_4s_01.mp3` | one-shot | WORLD | Ethics / Earth: kryształ 1 | **IMPLEMENTED** | Playback VR jest wdrożony zgodnie z mappingiem acquisition. |
| `glif_earth_4s_02.mp3` | one-shot | WORLD | Ethics / Earth: kryształ 2 | **IMPLEMENTED** | Playback VR jest wdrożony zgodnie z mappingiem acquisition. |
| `glif_earth_4s_03.mp3` | one-shot | WORLD | Ethics / Earth: kryształ 3 | **IMPLEMENTED** | Playback VR jest wdrożony zgodnie z mappingiem acquisition. |
| `glif_earth_4s_04.mp3` | one-shot | WORLD | — | **UNASSIGNED** | Jawnie bez użycia VR. |
| `glif_fire_4s_01.mp3` | one-shot | WORLD | Creative AI / Fire: kryształ 1 | **IMPLEMENTED** | Playback VR jest wdrożony zgodnie z mappingiem acquisition. |
| `glif_fire_4s_02.mp3` | one-shot | WORLD | Creative AI / Fire: kryształ 2 | **IMPLEMENTED** | Playback VR jest wdrożony zgodnie z mappingiem acquisition. |
| `glif_fire_4s_03.mp3` | one-shot | WORLD | Creative AI / Fire: kryształ 3 | **IMPLEMENTED** | Playback VR jest wdrożony zgodnie z mappingiem acquisition. |
| `glif_fire_4s_04.mp3` | one-shot | WORLD | — | **UNASSIGNED** | Jawnie bez użycia VR. |
| `glif_hover_loop.mp3` | specjalna: odnawiany one-shot (12 s) | WORLD | bed pozyskiwania kryształu; restart ręczny po naturalnym końcu, nigdy `source.loop=true` | **IMPLEMENTED** | Nazwa nie oznacza nieskończonego loopa w VR. |
| `glif_metal_4s_01.mp3` | one-shot | WORLD | DIG Engine / Metal: kryształ 1 | **IMPLEMENTED** | Playback VR jest wdrożony zgodnie z mappingiem acquisition. |
| `glif_metal_4s_02.mp3` | one-shot | WORLD | DIG Engine / Metal: kryształ 2 | **IMPLEMENTED** | Playback VR jest wdrożony zgodnie z mappingiem acquisition. |
| `glif_metal_4s_03.mp3` | one-shot | WORLD | DIG Engine / Metal: kryształ 3 | **IMPLEMENTED** | Playback VR jest wdrożony zgodnie z mappingiem acquisition. |
| `glif_metal_4s_04.mp3` | one-shot | WORLD | DIG Engine / Metal: kryształ 4 | **IMPLEMENTED** | Playback VR jest wdrożony zgodnie z mappingiem acquisition. |
| `glif_water_4s_01.mp3` | one-shot | WORLD | Haiku Cosmos / Water: kryształ 1; Haiku Cosmos / Water: kryształ 5 | **IMPLEMENTED** | Playback VR jest wdrożony zgodnie z mappingiem acquisition. |
| `glif_water_4s_02.mp3` | one-shot | WORLD | Haiku Cosmos / Water: kryształ 2 | **IMPLEMENTED** | Playback VR jest wdrożony zgodnie z mappingiem acquisition. |
| `glif_water_4s_03.mp3` | one-shot | WORLD | Haiku Cosmos / Water: kryształ 3 | **IMPLEMENTED** | Playback VR jest wdrożony zgodnie z mappingiem acquisition. |
| `glif_water_4s_04.mp3` | one-shot | WORLD | Haiku Cosmos / Water: kryształ 4 | **IMPLEMENTED** | Playback VR jest wdrożony zgodnie z mappingiem acquisition. |
| `glif_wood_4s_01.mp3` | one-shot | WORLD | AI Guide / Wood: kryształ 1; AI Guide / Wood: kryształ 3 | **IMPLEMENTED** | Playback VR jest wdrożony zgodnie z mappingiem acquisition. |
| `glif_wood_4s_02.mp3` | one-shot | WORLD | AI Guide / Wood: kryształ 2 | **IMPLEMENTED** | Playback VR jest wdrożony zgodnie z mappingiem acquisition. |
| `monkey_thinking_01.mp3` | one-shot | WORLD | komunikacja małpy / łuki nad głową | **IMPLEMENTED** | Playback one-shot jest wdrożony zgodnie z semantyką eventu powyżej. |
| `noise_laud_loop_01.mp3` | seamless loop | DEVICE | Astro Przyciągacz: małe glify | **PLANNED** | Asset istnieje; playback VR nie jest jeszcze wdrożony. |
| `noise_laud_loop_02.mp3` | seamless loop | DEVICE | Astro Przyciągacz: skorupy | **IMPLEMENTED** | Aktywny lifecycle skorup: immediate loop, recovery i handoff fade. |
| `noise_laud_loop_03.mp3` | seamless loop | DEVICE | Astro Przyciągacz: duże glify | **PLANNED** | Asset istnieje; playback VR nie jest jeszcze wdrożony. |
| `noise_laud_loop_04.mp3` | seamless loop | DEVICE | FIRE / stone_01 Attractor + INSTALLED spatial emitter | **IMPLEMENTED** | Installed audible range exactly 4.0 m. |
| `noise_laud_loop_05.mp3` | seamless loop | DEVICE | METAL / stone_02 Attractor + INSTALLED spatial emitter | **IMPLEMENTED** | Installed audible range exactly 4.0 m. |
| `noise_laud_loop_06.mp3` | seamless loop | DEVICE | EARTH / stone_03 Attractor + INSTALLED spatial emitter | **IMPLEMENTED** | Installed audible range exactly 4.0 m. |
| `noise_laud_loop_07.mp3` | seamless loop | DEVICE | WOOD / stone_04 Attractor + INSTALLED spatial emitter | **IMPLEMENTED** | Installed audible range exactly 4.0 m. |
| `noise_laud_loop_08.mp3` | seamless loop | DEVICE | WATER / stone_05 Attractor + INSTALLED spatial emitter | **IMPLEMENTED** | Installed audible range exactly 4.0 m. |
| `noise_laud_loop_09.mp3` | seamless loop | DEVICE | SPECIAL ETHER / stone_06 Astro Attractor | **IMPLEMENTED** | Pull lifecycle only; never installed or docked. |
| `noise_loop_01.mp3` | seamless loop | SPACE | — | **UNASSIGNED** | Dostępny; przyszłe użycie pozostaje otwarte. |
| `noise_loop_02.mp3` | seamless loop | SPACE | — | **UNASSIGNED** | Dostępny; przyszłe użycie pozostaje otwarte. |
| `noise_loop_03.mp3` | seamless loop | SPACE | — | **UNASSIGNED** | Dostępny; przyszłe użycie pozostaje otwarte. |
| `noise_loop_04.mp3` | seamless loop | SPACE | — | **UNASSIGNED** | Dostępny; przyszłe użycie pozostaje otwarte. |
| `noise_loop_05.mp3` | seamless loop | SPACE | — | **UNASSIGNED** | Dostępny; przyszłe użycie pozostaje otwarte. |
| `noise_loop_06.mp3` | seamless loop | SPACE | — | **UNASSIGNED** | Dostępny; przyszłe użycie pozostaje otwarte. |
| `noise_quiete_loop_01.mp3` | seamless loop | SPACE | jeden globalny cursor głównej progresji i post-main tail | **PLANNED** | Asset i playback ×6 są wdrożone; pełny Scenario-driven kontrakt 10 s/tail nie jest. |
| `noise_quiete_loop_02.mp3` | seamless loop | SPACE | jeden globalny cursor głównej progresji i post-main tail | **PLANNED** | Asset i playback ×6 są wdrożone; pełny Scenario-driven kontrakt 10 s/tail nie jest. |
| `noise_quiete_loop_03.mp3` | seamless loop | SPACE | jeden globalny cursor głównej progresji i post-main tail | **PLANNED** | Asset i playback ×6 są wdrożone; pełny Scenario-driven kontrakt 10 s/tail nie jest. |
| `noise_quiete_loop_04.mp3` | seamless loop | SPACE | jeden globalny cursor głównej progresji i post-main tail | **PLANNED** | Asset i playback ×6 są wdrożone; pełny Scenario-driven kontrakt 10 s/tail nie jest. |
| `noise_quiete_loop_05.mp3` | seamless loop | SPACE | jeden globalny cursor głównej progresji i post-main tail | **PLANNED** | Asset i playback ×6 są wdrożone; pełny Scenario-driven kontrakt 10 s/tail nie jest. |
| `noise_quiete_loop_06.mp3` | seamless loop | SPACE | jeden globalny cursor głównej progresji i post-main tail | **PLANNED** | Asset i playback ×6 są wdrożone; pełny Scenario-driven kontrakt 10 s/tail nie jest. |
| `noise_quiete_loop_07.mp3` | seamless loop | SPACE | jeden globalny cursor głównej progresji i post-main tail | **PLANNED** | Asset i playback ×6 są wdrożone; pełny Scenario-driven kontrakt 10 s/tail nie jest. |
| `noise_quiete_loop_08.mp3` | seamless loop | SPACE | jeden globalny cursor głównej progresji i post-main tail | **PLANNED** | Asset i playback ×6 są wdrożone; pełny Scenario-driven kontrakt 10 s/tail nie jest. |
| `noise_quiete_loop_09.mp3` | seamless loop | SPACE | jeden globalny cursor głównej progresji i post-main tail | **PLANNED** | Asset i playback ×6 są wdrożone; pełny Scenario-driven kontrakt 10 s/tail nie jest. |
| `noise_quiete_loop_10.mp3` | seamless loop | SPACE | jeden globalny cursor głównej progresji i post-main tail | **PLANNED** | Asset i playback ×6 są wdrożone; pełny Scenario-driven kontrakt 10 s/tail nie jest. |
| `noise_quiete_loop_11.mp3` | seamless loop | SPACE | jeden globalny cursor głównej progresji i post-main tail | **PLANNED** | Asset i playback ×6 są wdrożone; pełny Scenario-driven kontrakt 10 s/tail nie jest. |
| `noise_quiete_loop_12.mp3` | seamless loop | SPACE | jeden globalny cursor głównej progresji i post-main tail | **PLANNED** | Asset i playback ×6 są wdrożone; pełny Scenario-driven kontrakt 10 s/tail nie jest. |
| `noise_quiete_loop_13.mp3` | seamless loop | SPACE | jeden globalny cursor głównej progresji i post-main tail | **PLANNED** | Asset i playback ×6 są wdrożone; pełny Scenario-driven kontrakt 10 s/tail nie jest. |
| `panel_sound_01.mp3` | one-shot | UI | otwarcie panelu Option Astro Pieca | **IMPLEMENTED** | Playback one-shot na busie UI jest wdrożony. |
| `panel_sound_02.mp3` | one-shot | UI | wejście głębiej w panel Astro Pieca | **IMPLEMENTED** | Playback one-shot na busie UI jest wdrożony. |
| `panel_sound_03.mp3` | one-shot | UI | — | **UNASSIGNED** | Brak ustalonego użycia VR. |
| `panel_sound_04.mp3` | one-shot | UI | — | **UNASSIGNED** | Brak ustalonego użycia VR. |
| `panel_sound_long_01.mp3` | one-shot | UI | otwarcie panelu małpy | **IMPLEMENTED** | Playback one-shot na busie UI jest wdrożony. |
| `panel_sound_long_02.mp3` | one-shot | UI | zamknięcie panelu małpy | **IMPLEMENTED** | Playback one-shot na busie UI jest wdrożony. |
| `panel_sound_long_03.mp3` | one-shot | UI | — | **UNASSIGNED** | Brak ustalonego użycia VR. |
| `reliquiary_consume.mp3` | one-shot | WORLD | Release/consume w relikwiarzu | **IMPLEMENTED** | Playback one-shot jest wdrożony zgodnie z semantyką eventu powyżej. |
| `start.mp3` | one-shot | UNASSIGNED | — | **UNASSIGNED** | Brak przypisanej funkcji i warstwy VR. |
| `turn_page_01.mp3` | one-shot | WORLD | włożenie kryształu do relikwiarza | **IMPLEMENTED** | Playback one-shot jest wdrożony dla faktycznie zaakceptowanego insertu. |
| `turn_page_02.mp3` | one-shot | UI | — | **UNASSIGNED** | Brak ustalonego użycia VR. |
| `zwornik_01.mp3` | one-shot | WORLD | EARTH Zwornik dock at t=4.0 s | **IMPLEMENTED** | Only after live arrival reaches exact settled position. |
| `zwornik_02.mp3` | one-shot | WORLD | FIRE Zwornik dock at t=4.0 s | **IMPLEMENTED** | Only after live arrival reaches exact settled position. |
| `zwornik_03.mp3` | one-shot | WORLD | WOOD and WATER Zwornik dock at t=4.0 s | **IMPLEMENTED** | Branch-specific shared asset. |
| `zwornik_04.mp3` | one-shot | WORLD | METAL Zwornik dock at t=4.0 s | **IMPLEMENTED** | Only after live arrival reaches exact settled position. |

## Prefix map for future assets

| Prefix | Default VR layer |
| --- | --- |
| `noise_quiete_loop_`, `noise_loop_` | `SPACE` |
| `ambient_`, `ambient_loop_` | `AMBIENT` |
| `astro_piec_`, `noise_laud_loop_` | `DEVICE` |
| `creating_`, `floor_panel_`, `glif_`, `reliquiary_`, `monkey_` | `WORLD` |
| `bell_`, `click_panel_`, `panel_sound_`, `panel_sound_long_` | `UI` |

The prefix map supplies only a default classification. Every new MP3 must still be added explicitly as one inventory row and receive a status and deliberate planned use (or an explicit lack of one). Unknown prefixes remain `UNASSIGNED` until decided.

## Open decisions — do not guess

- The concrete device asset for Asterion Sphere / floor operation.
- Future uses of `noise_loop_*`.
- Future uses of unassigned `creating_06–08` and any additional `creating_short_*` mapping.
- Behavior after exhaustion of the last existing post-main `ambient_loop_*`.
- Attenuation shape within the frozen 4.0 m installed Rune Stone range.


## Implementation boundary

This document records the CURRENT / BINDING audio contract. The implementation includes the shared Master Volume, five unity-gain VR buses, events explicitly marked `IMPLEMENTED`, glyph/Rune/shell lifecycle fades and recovery, Asterion Sphere equipment/drive loops, Asterion sector audio, Binder arrival audio, Rune installation anticipation, installed Rune spatial sources, and a transient tier/subthreshold ambient sequencer composed by `experienceVr.js`. That sequencer is implementation evidence, not the canonical selection contract: Scenario-driven entries, 10-second gaps and the post-main tail remain to be synchronized in code. Anything marked `PLANNED`, `RESERVED` or `UNASSIGNED` remains outside runtime unless its note explicitly identifies a partially implemented primitive. This model does not authorize other playback mappings, assets, renaming, mastering or spatialization.

## Intro Background Sequencer

Status: **IMPLEMENTED**. Intro jest transient aktorem sterowanym wyłącznie symbolicznymi `entryEffects` canonical Scenario points i korzysta z istniejącego `AudioContext`, granicy fail-soft `VrAudioBridge` oraz busa `AMBIENT`.

| Cue | Canonical points | Beat |
| --- | --- | --- |
| `ambient_intro_01` | `1.10`, `1.20`, `1.30` | start / reveal / początkowa cisza |
| `ambient_intro_02` | `1.40`, `1.50`, `1.60` | menu Y / controller onboarding |
| `ambient_intro_03` | `1.70`, `1.80`, `1.90` | pointer + trigger + crystal grab/handoff |
| `ambient_intro_04` | `1.100`, `1.110` | invitation / follow |
| `ambient_intro_05` | `1.120`, `1.130` | threshold / crossing |

Każdy asset ma authored około 5 s fade na początku i końcu. Powtórzenia tego samego cue są planowane zegarem `AudioContext` ze stride `buffer.duration - 5 s`, dzięki czemu ich authored head/tail nachodzą około 5 s bez dodatkowych programowych fade'ów. Powtórzenie aktywnego cue jest NO-OP. Zmiana cue uruchamia incoming natychmiast bez programowego fade-in, a wspólny output outgoing cue wygasza programowo dokładnie 5 s i następnie sprząta wszystkie jego sources.

Główny sequencer jest transientnie disabled podczas Intro. Canonical entry `2.10` emituje handoff: Intro wygasza się przez 5 s, a CURRENT / BINDING target rozpoczyna `ambient_01`. Obecna implementacja uruchamia gate, lecz wybiera asset z aktualnego tieru i nie realizuje jeszcze pełnego Scenario-driven kontraktu. Reset wyłącza main gate i natychmiast czyści Intro. Audio nie należy do reconstruction/hydration.

`ambient_intro_06.mp3`, `ambient_intro_07.mp3` i `ambient_intro_08.mp3` mają status **RESERVED / UNASSIGNED** i nie posiadają Scenario mappingu.


### Resonator target and Rune docking spatial audio — CURRENT / IMPLEMENTED

Each genuine Large Glyph field-entry acquisition attempt with `ringCount < 3` consumes the next item from one global `resonator_aim_01–04` cursor and starts a true-looping DEVICE spatial source at that moving target. AIM loops only while acquisition is incomplete and fades for exactly `0.1 s` on field exit or on reaching ring three. A later incomplete field-entry attempt consumes the next AIM item; re-entry with retained `ringCount === 3` is silent. Independently, the first `ringCount < 3 → 3` crossing creates one persistent lifecycle and consumes the next item from a separate global `resonator_lock_01–04` cursor. LOCK survives field exit and retained-ring decay/reacquisition; reacquiring ring three while that lifecycle persists neither rotates nor creates another source. Only `ringCount > 0 → 0` fades LOCK for exactly `0.5 s`; a future completely new `0 → 3` acquisition may then consume the next LOCK item. Sign-only memory is silent. Both families use HRTF, linear distance, rolloff `1`, reference distance `0.25 m`, and zero gain at `140 m`. The projection observes acquisition truth and moving anchors; it does not calculate containment or rings.

Accepted natural automatic handoff emits one docking-start event. The Rune audio projection immediately starts a WORLD spatial one-shot at the physical moving stone: WOOD/WATER → `stone_landing_01`, FIRE → `02`, EARTH → `03`, METAL → `04`. Exactly `3.0 s` later it reads that same stone's then-current transform and starts `zwornik_dokowanie.mp3`. Both use HRTF, linear distance, rolloff `1`, reference distance `0.25 m`, and zero gain at `13 m`. Reset/disposal cancels delayed cues. This is additional to the existing `creating_01–05` DESCENT anticipation. SPECIAL Ether never emits either docking cue and never gains an installed source.
