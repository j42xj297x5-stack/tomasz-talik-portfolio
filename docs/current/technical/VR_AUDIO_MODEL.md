# Experience VR Audio Model

Status: **CURRENT / BINDING**, synchronized with the implemented Experience VR runtime on 2026-10-02.

## SUMMARY DLA ARCHITEKTA

Experience VR audio is an observer-only presentation layer. Scenario emits semantic effects, `src/experienceVr.js` maps them to bounded audio actors, and `VrAudioBridge` delegates playback to the shared `audioManager`. Every reachable path is fetched, decoded and cached before **READY**; gameplay playback is cache-only and fail-soft. Audio never advances or repairs gameplay truth.

This document owns detailed Experience VR cue mappings and lifecycle. [`AUDIO_RUNTIME_MODEL.md`](AUDIO_RUNTIME_MODEL.md) owns the shared Web Audio graph and Master Volume; Scenario, Rune, Resonator and finale authorities own gameplay.

## Ownership and preparation

```text
Scenario/domain event → composition mapping → sequencer/projection
→ VrAudioBridge → cached audioManager buffer → VR bus / spatial emitter
```

The five VR buses are `AMBIENT`, `SPACE`, `WORLD`, `DEVICE` and `UI`. One composition-level XR listener update serves all spatial sources. Reset/disposal invalidates pending starts and releases owned sources. Reconstruction may restore persistent projections, but never replays transient capture, arrival, insertion or completion presentation.

`prepareRuntimeAudio(REQUIRED_VR_AUDIO)` expands the reachable package with sequencer and projection dependencies. Only after preparation succeeds may the launch screen publish **READY**. No reachable runtime audio path performs an on-demand fetch.

## Main ambient programs

Main selection is Scenario-owned and event-driven:

| Scenario entry | Effect | Program |
| --- | --- | --- |
| `2.10` | `SET_MAIN_AMBIENT_01` | `ambient_01` |
| `2.40` | `SET_MAIN_AMBIENT_02` | `ambient_02` |
| `4.20` | `SET_MAIN_AMBIENT_03` | `ambient_03` |
| `4.80` | `SET_MAIN_AMBIENT_04` | `ambient_04` |
| `5.10`, on Tier 4 `TIER_COMPLETED` | `SET_MAIN_AMBIENT_05` | `ambient_05` |

For `ambient_01–04`, playback alternates one ambient program, ten seconds of silence, six repetitions of the next quiet layer, and another ten-second gap. The `noise_quiete_loop_01–13` cursor is global across all main-program replacements, wraps `13 → 01`, and resets only with the sequencer.

`ambient_05` is active. After its initial program and the next shared quiet segment, its finite tail is exactly:

```text
ambient_loop_01 → ambient_loop_03 → ambient_loop_04 → idle
```

Quiet segments remain interleaved by the sequencer between tail programs. `ambient_loop_02` is neither a runtime dependency nor a physical audio asset. After `ambient_loop_04`, the main sequencer intentionally remains idle.

## Intro and finale programs

`SET_INTRO_AMBIENT_01–05` drives the Intro sequence across `1.10–1.130`; `2.10` retires it before selecting the first main program. The independent finale sequencer maps `BEGIN_FINAL_AMBIENT_WAIT` to `ambient_intro_06`, farewell start to finite `ambient_intro_07`, and the synchronized world-release/credits path to `ambient_intro_08`. Candidate starts are generation-guarded so replacements, reset and disposal cannot leak stale sources.

## Interaction mappings

| Runtime interaction | Current cue/lifecycle |
| --- | --- |
| accepted crystal grabs | `cristal_grab_01 → 02 → 03 → 04 → wrap` |
| Shell Astrolabium handoff | `put_into_01 → put_into_03 → wrap` |
| Small Glyph Astrolabium handoff | `put_into_02 → put_into_04 → wrap` |
| main Monkey menu | `click_panel_01` |
| deeper Monkey navigation | `turn_page_02` |
| Monkey final turn | `panel_sound_long_03` |
| portal/reliquary reveal | `creating_06` |
| Furnace world reveal | `creating_08` |

The Shell and Small Glyph handoff cursors are independent. These mappings do not transfer interaction ownership to audio.

## Furnace projection

Accepted Shell insertion plays `glif_earth_4s_04`; accepted Small Glyph insertion plays `glif_fire_4s_04`. Both call `furnaceAudioProjection.playPhysicalOneShot()` and therefore use the stable Furnace HRTF spatial emitter. The same insertion presentation applies to ordinary Furnace insertion and Rune-recipe insertion.

The five runtime process kinds and their process audio are:

| Process kind | Meaning | Cue |
| --- | --- | --- |
| `SHELL_EXTRACTION` | ordinary Shell processing | `astro_piec_work_01` |
| `SMALL_GLYPH_ESSENCE_EXTRACTION` | ordinary Small Glyph essence extraction | `astro_piec_work_01` |
| `RUNE_TUNING` | Rune tuning | `astro_piec_work_03` |
| `ASTERION_CONSTRUCTION` | Asterion Sphere construction | `astro_piec_work_02` |
| `ASTRO_ATTRACTOR_CONSTRUCTION` | Astro Attractor construction | `astro_piec_work_create_01` |

Open/close and all listed process sounds remain physical `DEVICE` projection at the Furnace anchor. Process completion and gameplay commit remain Furnace/domain truth.

## Binder, Rune and Ether projection

- Binder arrival begins with `electricity_short_06`.
- Earth, Fire, Wood and Metal completion map respectively to `zwornik_01`, `zwornik_02`, `zwornik_03` and `zwornik_04`; Water maps to `astro_piec_change`.
- Natural installed Rune loops remain sector-anchored HRTF `noise_laud_loop_04–08` projections.
- Ether Astro Attractor pull uses `noise_laud_loop_09`.
- Once Ether reaches `CAPTURED`, one persistent HRTF spatial `noise_laud_loop_09` emitter is anchored to the Monkey.
- Reconstruction restores that captured-Ether emitter idempotently without replaying capture presentation.

Rune/Binder/Ether actors own their state and anchors. Their projections observe settled truth and cannot install a Rune, capture Ether or open Water readiness.

## Asset status and invariants

`creating_07`, `panel_sound_03`, `panel_sound_04` and any other physically present but unowned file have no runtime meaning. Their existence creates neither a future requirement nor a backlog item.

1. READY follows successful preparation of every reachable runtime audio dependency.
2. Reachable gameplay playback is cache-only.
3. Main ambient selection is semantic and Scenario-owned; the shared quiet cursor survives program replacement.
4. `ambient_05` is active, has only the `01 → 03 → 04` tail, and ends idle.
5. Spatial projections use shared listener truth and their owner-provided anchors.
6. Audio failure is fail-soft and cannot mutate gameplay.
7. Reconstruction restores only persistent audio truth and remains silent for transient presentation.
8. No purpose is inferred from an unused asset.
