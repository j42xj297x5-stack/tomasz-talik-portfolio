# Experience VR Audio Model

Status: **CURRENT / BINDING**, synchronized with the implemented Experience VR runtime on 2026-09-25.

## SUMMARY DLA ARCHITEKTA

Experience VR audio is implemented as an observer-only presentation layer. Scenario expresses narrative intent through symbolic entry effects; `src/experienceVr.js` maps those effects to audio actors; `VrAudioBridge` and the shared `audioManager` own playback. The required reachable package is fetched, decoded and cached before the launch screen reaches **READY**, so gameplay playback is cache-only. Audio failure remains fail-soft and cannot advance, block or repair gameplay state.

This document owns Experience VR-specific mappings and lifecycle. [`AUDIO_RUNTIME_MODEL.md`](AUDIO_RUNTIME_MODEL.md) owns the shared Web Audio graph, persistent Master Volume and generic non-VR behavior. Scenario progression, Rune state, Resonator containment and finale choreography remain with their dedicated models.

## Ownership boundary

```text
Scenario point entry
  → semantic effect (for example SET_MAIN_AMBIENT_03)
  → RuntimeExperience handler in experienceVr.js
  → Experience VR sequencer/projection
  → VrAudioBridge
  → shared audioManager / decoded-buffer cache / Web Audio nodes
```

- Scenario selects presentation semantically; it never handles paths, buffers, gains or sources.
- Composition translates semantic effects and supplies read-only domain state/anchors.
- Audio projections observe domain truth. They do not calculate acquisition, install a Rune, complete a Furnace process or commit progression.
- `VrAudioBridge` is the fail-soft Experience VR boundary and stops its active sources on disposal.
- `audioManager` owns the `AudioContext`, decoded-buffer cache, five VR buses and the common Master Volume path.
- One composition-level XR listener update serves every spatial source; individual actors do not create listeners.

The five VR buses are `AMBIENT`, `SPACE`, `WORLD`, `DEVICE` and `UI`. Their default gains are unity beneath the shared master. Detailed shared graph behavior is intentionally not duplicated here.

## Preparation, READY and cache-only playback

Composition first preloads the critical visual package, then calls `vrAudio.prepareRuntimeAudio(REQUIRED_VR_AUDIO)`. The bridge expands that list with the reachable long-form Intro/main ambient assets, quiet layers, glyph process, Asterion device loops and Astro/Rune attractor loops. `audioManager.prepareVrAudio()` fetches and decodes those files into its buffer cache. Only after that awaited step succeeds does the Experience VR launch screen enter **READY**.

During gameplay, one-shots, finite programs and overlapping loops resolve buffers from that prepared cache. Playback does not fetch on demand. Candidate starts are abortable; generation invalidation prevents a late asynchronous start from surviving a program change, reset or disposal. Reset clears transient sources and program state; audio is not reconstructed as gameplay truth.

## Main ambient sequencer

`createVrAmbientSequencer` is the implemented playback owner. Main selection is event-driven by Scenario entry effects, not by polling tiers or deriving progress inside audio:

| Scenario entry | Semantic effect | Program |
| --- | --- | --- |
| `2.10` | `SET_MAIN_AMBIENT_01` | `ambient_01.mp3` |
| `2.40` | `SET_MAIN_AMBIENT_02` | `ambient_02.mp3` |
| `4.20` | `SET_MAIN_AMBIENT_03` | `ambient_03.mp3` |
| `4.80` | `SET_MAIN_AMBIENT_04` | `ambient_04.mp3` |

The `2.10` handler also stops the Intro ambient before selecting the first main program. Re-selecting an already active healthy program is a no-op. A replacement is started as a candidate before the preceding program is cancelled; stale candidates are aborted or stopped.

For `ambient_01–04`, the implemented program is:

```text
ambient_N ×1 → 10 s silence → next noise_quiete_loop_01–13 ×6
             → 10 s silence → repeat ambient_N
```

The quiet cursor is global across main-program replacements and wraps `13 → 01`; it resets only with the sequencer. Each quiet segment has a 10-second fade-in and fade-out. Finite repetitions are scheduled by the shared owner from a single cached decoded buffer with the MP3 seam guard.

### Dormant `ambient_05` tail branch

The sequencer also implements an `ambient_05` tail program:

```text
ambient_05 ×1
→ 10 s → next quiet layer ×6 → 10 s → ambient_loop_01 ×6
→ 10 s → next quiet layer ×6 → 10 s → ambient_loop_02 ×6
→ ... → ambient_loop_04 ×6 → idle
```

This is implemented playback behavior, not an implementation backlog. In the current composed product it is dormant: Scenario defines semantic selection only for `SET_MAIN_AMBIENT_01–04`, composition has no `SET_MAIN_AMBIENT_05` handler, and the required READY package contains `ambient_01–04` rather than `ambient_05`/`ambient_loop_01–04`. Therefore this document does not claim an active runtime binding for the dormant branch or invent a future Scenario point. The separate finale ambient program below owns the current ending.

## Intro and finale ambient programs

The Intro actor is driven by `SET_INTRO_AMBIENT_01–05` across points `1.10–1.130`. It schedules repetitions on the audio clock, uses the authored approximately five-second overlaps, treats repeated selection as a no-op and hands off to the main sequencer at `2.10`.

The implemented finale actor is independent of the main `ambient_05` branch:

- `BEGIN_FINAL_AMBIENT_WAIT` starts overlapping `ambient_intro_06` while the final Monkey farewell is pending;
- farewell start transitions to finite `ambient_intro_07` and retires the waiting loop;
- `SYNC_FINAL_AMBIENT_AFTER_FAREWELL` synchronizes the world-release clock;
- at 20 seconds, or through `ENSURE_FINAL_AMBIENT_08` on credits/brand entry, overlapping `ambient_intro_08` becomes the final loop.

Reset/dispose aborts pending requests and stops waiting, farewell, final and retiring sources.

## Experience VR projections

The bridge and bounded projections implement the following mappings without owning their gameplay triggers:

- UI panels, Player Guide, Monkey Guide, Reliquary, progress feedback and release bell one-shots;
- Astro Furnace open/close, process, Rune-tuning and Asterion-construction physical sounds;
- Astro/Asterion attraction loops, including Rune-family/Ether identities and their lifecycle fades;
- Asterion Sphere background and drive loops;
- sector acquisition and sector drive audio;
- four-second Rune Binder arrival audio;
- anticipatory `creating_01–05` Rune installation one-shots while physical installation remains authoritative;
- installed Rune sector-anchored spatial loops;
- Resonator target AIM/LOCK audio as an observation of containment/ring truth.

The detailed Rune and Resonator state machines are intentionally not repeated here. Their audio projections consume identity, lifecycle state and world anchors supplied by those owners.

## Asset status relevant to this model

| Assets | Current status | Runtime binding |
| --- | --- | --- |
| `ambient_01–04` | **IMPLEMENTED / ACTIVE** | Scenario effects at `2.10`, `2.40`, `4.20`, `4.80` |
| `noise_quiete_loop_01–13` | **IMPLEMENTED / ACTIVE** | global rotating quiet cursor in the main sequencer |
| `ambient_05`, `ambient_loop_01–04` | **IMPLEMENTED / DORMANT PROGRAM** | playback branch exists; no current Scenario/READY-package binding |
| `ambient_intro_01–05` | **IMPLEMENTED / ACTIVE** | Intro semantic entry effects |
| `ambient_intro_06–08` | **IMPLEMENTED / ACTIVE** | farewell, release, credits and brand finale actor |
| `creating_01–05` | **IMPLEMENTED / ACTIVE** | anticipatory natural Rune installation cues |
| `electricity_short_01–06`, `electricity_long_01–04` | **IMPLEMENTED / ACTIVE WHERE MAPPED** | Binder/sector projection mappings |
| `electricity_short_07`, `electricity_short_08` | **UNUSED / RESERVED ASSETS** | no active runtime binding; no implementation is required |

`electricity_short_07.mp3` and `electricity_short_08.mp3` remain in the project. Their filenames do not establish gameplay intent. They may be reused if a suitable purpose is explicitly chosen later, but they are not waiting for containment, acquisition or any other mechanic and are not backlog items.

## Invariants

1. READY is published only after required Experience VR audio preparation completes.
2. Reachable gameplay playback is cache-only.
3. Scenario/runtime semantics choose ambient presentation; audio never polls progression ownership.
4. Audio observes domain state and cannot mutate gameplay truth.
5. Optional playback failures remain fail-soft after preparation.
6. Reset/disposal invalidates pending starts and releases active Experience VR sources.
7. No runtime purpose is inferred for an unused asset.
