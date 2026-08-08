# Experience VR Audio Model

Status: canonical, living technical model for Experience VR audio. Synchronized with the Astro Attractor DEVICE-loop pass on 2026-08-08.

## SUMMARY DLA ARCHITEKTA

The bounded Experience VR Astro Attractor lifecycle and the Astro Furnace single-shell process audio are **IMPLEMENTED**. The furnace plays `astro_piec_work_01.mp3` exactly once on DEVICE only after an accepted cycle; it does not loop or restart and is stopped by reset/dispose through the fail-soft `VrAudioBridge`. Small/large glyph and rune-stone mappings remain **PLANNED**. The ambient sequencer, production Asterion Sphere audio, and spatial audio remain unimplemented.

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

The VR mixer has five **IMPLEMENTED**, independently tunable gain buses:

| Bus | Responsibility | Asset families |
| --- | --- | --- |
| `SPACE` | lowest cosmic background | `noise_quiete_loop_*`, `noise_loop_*` |
| `AMBIENT` | ambients and main musical threads | `ambient_01–05`, `ambient_loop_01–04` |
| `DEVICE` | loud device operation | `astro_piec_*`, `noise_laud_loop_01–08` |
| `WORLD` | short world sounds | `creating_*`, `floor_panel_activate`, `glif_*`, `reliquiary_consume`, `monkey_thinking_01` |
| `UI` | panels | `bell_*`, `click_panel_01`, `panel_sound_*`, `panel_sound_long_*`, `turn_page_*` |

Each bus has its own `GainNode` and all five feed the existing shared **Master Volume**. All samples are already mixed and mastered. Defaults are `source gain = 1.0` and every `VR bus gain = 1.0`. Do not add normalization, limiters, per-sample trims, or ducking. Event-specific fades below are lifecycle behavior, not mastering trims.

## Background sequencer

### Full thresholds

| Active threshold | Entry condition | Main asset |
| --- | --- | --- |
| 1 | entry into the circle | `ambient_01.mp3` |
| 2 | completion of the first panel circle for every branch | `ambient_02.mp3` |
| 3 | second circle | `ambient_03.mp3` |
| 4 | third circle | `ambient_04.mp3` |
| 5 | fourth circle | `ambient_05.mp3` |

For the active threshold, the sequence is:

1. Play `ambient_N` once to its natural end.
2. Hold 30 seconds of silence.
3. Select the next `noise_quiete_loop` from the global queue.
4. Fade in for 10 seconds.
5. Play 6 complete repetitions of the seamless loop.
6. Fade out for 10 seconds.
7. Hold 30 seconds of silence.
8. If the player remains in the same threshold, play `ambient_N` again and continue with the next quiet loop.

The quiet-loop cursor is global and **does not reset** when the threshold changes. The actual repository queue is:

```text
01 → 02 → 03 → 04 → 05 → 07 → wrap
```

`noise_quiete_loop_06.mp3` does not exist. When it is added, both the inventory and queue in this document must be explicitly updated.

### Subthreshold override

A subthreshold interrupts the normal full-threshold sequencer. The first defined subthreshold begins after all shells are complete and the Asterion Sphere has been built, before transition to the next full threshold. Its main layer is `ambient_loop_01.mp3`; `ambient_loop_02.mp3` through `ambient_loop_04.mp3` are **RESERVED**.

The subthreshold sequence is:

1. Play `ambient_loop_N` for 13 seamless repetitions.
2. Fade out for 10 seconds.
3. Hold 30 seconds of silence.
4. Select the next quiet loop from the same global cursor.
5. Fade it in for 10 seconds, play 6 complete repetitions, fade it out for 10 seconds, then hold 30 seconds of silence.
6. If the subthreshold remains active, repeat the cycle.
7. When it ends, begin the sequence for the new higher full threshold.

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
- Release after Activate whose idempotent progression commit succeeds → `reliquiary_consume.mp3` on `WORLD`; Release without Activate returns the crystal silently.
- The same commit, when the progression controller reports real tier completion, additionally plays `floor_panel_activate.mp3` on `WORLD`, after `reliquiary_consume`; audio does not calculate or own progression state.

### Astro Furnace

- Open Option panel → `panel_sound_01.mp3`.
- Enter deeper → `panel_sound_02.mp3`.
- Return to main menu → `click_panel_01.mp3`.
- Accepted transition start `CLOSED → OPENING` / `OPEN → CLOSING` → `astro_piec_open.mp3` / `astro_piec_close.mp3` on `DEVICE`, once per transition; blocked presses, stable requested states, animation frames, and reset are silent.
- Shell process → `astro_piec_work_01.mp3` (**IMPLEMENTED**, accepted-cycle one-shot on DEVICE).
- Small-glyph process → `astro_piec_work_02.mp3` (**TODO gameplay**).
- Stone process → `astro_piec_work_03.mp3` (**TODO gameplay**).
- Create Astro Attractor or Asterion Sphere → `astro_piec_work_create_01.mp3`.

### Monkey and panels

- A new monkey communication signal that starts the three attention arcs → `monkey_thinking_01.mp3` on `WORLD`, once at signal start; pulses/redraws and repeated notification while the same signal remains pending are silent.
- Monkey panel: open → `panel_sound_long_01.mp3`; close → `panel_sound_long_02.mp3`; internal click → `click_panel_01.mp3`.
- Player Y panel: open → `bell_01.mp3`; close → `bell_02.mp3`; internal click → `click_panel_01.mp3`.

### Astro Attractor

The target beds are seamless DEVICE loops at source gain `1.0`: small glyphs → `noise_laud_loop_01.mp3`, shells → `02`, large glyphs → `03`, and stones 1–5 → `04–08` respectively. Only shells are a current gameplay target class and therefore only `02` is **IMPLEMENTED**; every other mapping remains **PLANNED** without synthetic target logic. All eight existing assets are prepared non-blockingly.

Actual active pull starts the selected source immediately without fade-in and uses true source looping, never per-frame restarts. Successful takeover by the ordinary Spike ray fades it out over `0.5 s`. Temporary target loss keeps the same source and playhead while fading from its current gain toward zero over `1.0 s`; reacquiring the same logical target within that window cancels the prior automation and returns from the current gain to `1.0` in about `0.1 s`. A full second without recovery stops and idempotently cleans up the source. Deliberate release/cancel uses a shorter safe fade instead of recovery. A different logical target always ends the previous lifecycle and starts a new source from the beginning, even when both targets share an asset class. Audio observes gameplay success and identity; it does not decide either.

### Asterion Sphere / floor

**DEVICE SOUND TBD** — behavior is decided, but no asset is assigned. Do not infer or assign any `noise_*` file.

- First trigger starts immediately.
- Release begins a smooth 2-second fade-out.
- A new trigger during that window continues the current source and restores gain.
- Reaching the end of the fade stops and cleans up the source.

## Complete repository MP3 inventory

The inventory below contains every existing `public/audio/*.mp3` as of 2026-08-08, exactly one row per file. A layer classifies the family; it does not itself assign an event. `UNASSIGNED` in the Layer column means no VR layer is safely inferable.

| Asset | Forma | Warstwa | Planowane użycie VR | Status | Uwagi |
| --- | --- | --- | --- | --- | --- |
| `ambient_01.mp3` | one-shot | AMBIENT | wejście do kręgu / pełny próg 1 | **PLANNED** | Asset istnieje; playback VR nie jest jeszcze wdrożony. |
| `ambient_02.mp3` | one-shot | AMBIENT | ukończenie pierwszego kręgu paneli wszystkich gałęzi / pełny próg 2 | **PLANNED** | Asset istnieje; playback VR nie jest jeszcze wdrożony. |
| `ambient_03.mp3` | one-shot | AMBIENT | pełny próg 3 (drugi krąg) | **PLANNED** | Asset istnieje; playback VR nie jest jeszcze wdrożony. |
| `ambient_04.mp3` | one-shot | AMBIENT | pełny próg 4 (trzeci krąg) | **PLANNED** | Asset istnieje; playback VR nie jest jeszcze wdrożony. |
| `ambient_05.mp3` | one-shot | AMBIENT | pełny próg 5 (czwarty krąg) | **PLANNED** | Asset istnieje; playback VR nie jest jeszcze wdrożony. |
| `ambient_loop_01.mp3` | seamless loop | AMBIENT | podpróg: ukończone skorupy + zbudowana Kula Asterionowa | **PLANNED** | Asset istnieje; playback VR nie jest jeszcze wdrożony. |
| `ambient_loop_02.mp3` | seamless loop | AMBIENT | — | **RESERVED** | Rodzina podprogów znana; event/mapping nieustalony. |
| `ambient_loop_03.mp3` | seamless loop | AMBIENT | — | **RESERVED** | Rodzina podprogów znana; event/mapping nieustalony. |
| `ambient_loop_04.mp3` | seamless loop | AMBIENT | — | **RESERVED** | Rodzina podprogów znana; event/mapping nieustalony. |
| `astro_piec_close.mp3` | one-shot | DEVICE | zamknięcie komory Astro Pieca | **IMPLEMENTED** | Playback one-shot jest wdrożony zgodnie z semantyką eventu powyżej. |
| `astro_piec_open.mp3` | one-shot | DEVICE | otwarcie komory Astro Pieca | **IMPLEMENTED** | Playback one-shot jest wdrożony zgodnie z semantyką eventu powyżej. |
| `astro_piec_work_01.mp3` | one-shot | DEVICE | proces skorup w Astro Piecu | **IMPLEMENTED** | Raz po zaakceptowanym starcie; bez loop/restartu; reset/dispose zatrzymuje aktywne źródło. |
| `astro_piec_work_02.mp3` | one-shot | DEVICE | proces małych glifów w Astro Piecu (TODO gameplay) | **PLANNED** | Asset istnieje; playback VR nie jest jeszcze wdrożony. |
| `astro_piec_work_03.mp3` | one-shot | DEVICE | proces kamieni w Astro Piecu (TODO gameplay) | **PLANNED** | Asset istnieje; playback VR nie jest jeszcze wdrożony. |
| `astro_piec_work_create_01.mp3` | one-shot | DEVICE | tworzenie Astro Przyciągacza lub Kuli | **PLANNED** | Asset istnieje; playback VR nie jest jeszcze wdrożony. |
| `bell_01.mp3` | one-shot | UI | otwarcie panelu gracza Y | **IMPLEMENTED** | Playback one-shot na busie UI jest wdrożony. |
| `bell_02.mp3` | one-shot | UI | zamknięcie panelu gracza Y | **IMPLEMENTED** | Playback one-shot na busie UI jest wdrożony. |
| `bell_03.mp3` | one-shot | UI | — | **UNASSIGNED** | Brak ustalonego użycia VR. |
| `click_panel_01.mp3` | one-shot | UI | klik wewnątrz panelu małpy lub gracza Y; powrót panelu Astro Pieca do menu głównego | **IMPLEMENTED** | Playback one-shot na busie UI jest wdrożony. |
| `creating_01.mp3` | one-shot | WORLD | — | **UNASSIGNED** | Dostępny; przyszłe użycie pozostaje otwarte. |
| `creating_02.mp3` | one-shot | WORLD | — | **UNASSIGNED** | Dostępny; przyszłe użycie pozostaje otwarte. |
| `creating_03.mp3` | one-shot | WORLD | — | **UNASSIGNED** | Dostępny; przyszłe użycie pozostaje otwarte. |
| `creating_04.mp3` | one-shot | WORLD | — | **UNASSIGNED** | Dostępny; przyszłe użycie pozostaje otwarte. |
| `creating_05.mp3` | one-shot | WORLD | — | **UNASSIGNED** | Dostępny; przyszłe użycie pozostaje otwarte. |
| `creating_06.mp3` | one-shot | WORLD | — | **UNASSIGNED** | Dostępny; przyszłe użycie pozostaje otwarte. |
| `creating_07.mp3` | one-shot | WORLD | — | **UNASSIGNED** | Dostępny; przyszłe użycie pozostaje otwarte. |
| `creating_08.mp3` | one-shot | WORLD | — | **UNASSIGNED** | Dostępny; przyszłe użycie pozostaje otwarte. |
| `creating_short_01.mp3` | one-shot | WORLD | — | **UNASSIGNED** | Dostępny; przyszłe użycie pozostaje otwarte. |
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
| `noise_laud_loop_04.mp3` | seamless loop | DEVICE | Astro Przyciągacz: kamień 1 | **PLANNED** | Asset istnieje; playback VR nie jest jeszcze wdrożony. |
| `noise_laud_loop_05.mp3` | seamless loop | DEVICE | Astro Przyciągacz: kamień 2 | **PLANNED** | Asset istnieje; playback VR nie jest jeszcze wdrożony. |
| `noise_laud_loop_06.mp3` | seamless loop | DEVICE | Astro Przyciągacz: kamień 3 | **PLANNED** | Asset istnieje; playback VR nie jest jeszcze wdrożony. |
| `noise_laud_loop_07.mp3` | seamless loop | DEVICE | Astro Przyciągacz: kamień 4 | **PLANNED** | Asset istnieje; playback VR nie jest jeszcze wdrożony. |
| `noise_laud_loop_08.mp3` | seamless loop | DEVICE | Astro Przyciągacz: kamień 5 | **PLANNED** | Asset istnieje; playback VR nie jest jeszcze wdrożony. |
| `noise_loop_01.mp3` | seamless loop | SPACE | — | **UNASSIGNED** | Dostępny; przyszłe użycie pozostaje otwarte. |
| `noise_loop_02.mp3` | seamless loop | SPACE | — | **UNASSIGNED** | Dostępny; przyszłe użycie pozostaje otwarte. |
| `noise_loop_03.mp3` | seamless loop | SPACE | — | **UNASSIGNED** | Dostępny; przyszłe użycie pozostaje otwarte. |
| `noise_loop_04.mp3` | seamless loop | SPACE | — | **UNASSIGNED** | Dostępny; przyszłe użycie pozostaje otwarte. |
| `noise_loop_05.mp3` | seamless loop | SPACE | — | **UNASSIGNED** | Dostępny; przyszłe użycie pozostaje otwarte. |
| `noise_loop_06.mp3` | seamless loop | SPACE | — | **UNASSIGNED** | Dostępny; przyszłe użycie pozostaje otwarte. |
| `noise_quiete_loop_01.mp3` | seamless loop | SPACE | globalna kolejka cichego tła między blokami progu/podprogu | **PLANNED** | Asset istnieje; playback VR nie jest jeszcze wdrożony. |
| `noise_quiete_loop_02.mp3` | seamless loop | SPACE | globalna kolejka cichego tła między blokami progu/podprogu | **PLANNED** | Asset istnieje; playback VR nie jest jeszcze wdrożony. |
| `noise_quiete_loop_03.mp3` | seamless loop | SPACE | globalna kolejka cichego tła między blokami progu/podprogu | **PLANNED** | Asset istnieje; playback VR nie jest jeszcze wdrożony. |
| `noise_quiete_loop_04.mp3` | seamless loop | SPACE | globalna kolejka cichego tła między blokami progu/podprogu | **PLANNED** | Asset istnieje; playback VR nie jest jeszcze wdrożony. |
| `noise_quiete_loop_05.mp3` | seamless loop | SPACE | globalna kolejka cichego tła między blokami progu/podprogu | **PLANNED** | Asset istnieje; playback VR nie jest jeszcze wdrożony. |
| `noise_quiete_loop_07.mp3` | seamless loop | SPACE | globalna kolejka cichego tła między blokami progu/podprogu | **PLANNED** | Asset istnieje; playback VR nie jest jeszcze wdrożony. |
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

## Braki / oczekiwane assety

| Oczekiwany asset / funkcja | Warstwa | Status | Uwagi |
| --- | --- | --- | --- |
| `noise_quiete_loop_06.mp3` | SPACE | **RESERVED** | Brakuje w repo; planowana rodzina ma zakres `01–07`. Nie wolno symulować ani pomijać aktualnej faktycznej kolejki `01, 02, 03, 04, 05, 07`. |
| DEVICE SOUND TBD dla pracy Kuli Asterionowej / podłogi | DEVICE | **RESERVED** | Kontrakt lifecycle jest ustalony, ale nazwa/asset nie. Nie przypisywać samodzielnie żadnego `noise_*`. |

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
- Future uses of `creating_*` and `creating_short_*`.
- Subthreshold mapping of `ambient_loop_02–04`.
- Whether individual effects should be spatial / `PositionalAudio`, and which ones.
- Exact audio transition behavior on an ordinary full-threshold change while a block from the previous threshold is still active.

## Implementation boundary

This document records the implemented UI and world/device one-shot passes plus the bounded glyph-acquisition lifecycle and the future contract for all remaining systems. The current implementation is limited to the shared Master Volume, five unity-gain VR buses, unity-gain one-shot sources, the events explicitly marked `IMPLEMENTED`, the glyph process fades/recovery/renewal, and the fail-soft bridge boundary. It does not authorize additional playback, sequencing, loops, asset creation, renaming, mastering, or spatialization changes.
