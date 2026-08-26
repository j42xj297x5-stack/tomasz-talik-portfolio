# Experience VR Audio Model

Status: **CURRENT / BINDING**, living technical model for Experience VR audio synchronized on 2026-08-26.

## SUMMARY DLA ARCHITEKTA

The bounded Experience VR Astro Attractor lifecycle and implemented Astro Furnace process sounds remain **IMPLEMENTED**. Shell extraction plays `astro_piec_work_01.mp3`; production construction plays `astro_piec_work_create_01.mp3` instead, exactly once on DEVICE after an accepted cycle. Neither loops or determines gameplay timing, and reset/dispose stops it through the fail-soft `VrAudioBridge`. Small-glyph work and rune tuning remain **PLANNED**; rune-stone spatial mappings remain **PLANNED**. The main background contract is now **CURRENT / BINDING TARGET** and Scenario-driven, but is **NOT YET FULLY IMPLEMENTED**; the implementation still selects by tier, uses 30-second gaps and the old Asterion subthreshold, and has no post-main tail. Both Asterion Sphere DEVICE loops remain independent and **IMPLEMENTED**. Spatial audio remains unimplemented.

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
| `DEVICE` | loud device operation | `astro_piec_*`, `noise_laud_loop_01–08`, `asterion_sphere_*` |
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

### Astro Furnace

- Open Option panel → `panel_sound_01.mp3`.
- Enter deeper → `panel_sound_02.mp3`.
- Return to main menu → `click_panel_01.mp3`.
- Accepted transition start `CLOSED → OPENING` / `OPEN → CLOSING` → `astro_piec_open.mp3` / `astro_piec_close.mp3` on `DEVICE`, once per transition; blocked presses, stable requested states, animation frames, and reset are silent.
- Shell process → `astro_piec_work_01.mp3` (**IMPLEMENTED**, accepted-cycle one-shot on DEVICE).
- Small-glyph process → `astro_piec_work_02.mp3` (**TODO gameplay**).
- Rune tuning Astrolabium from one Small Glyph + Shell recipe → `astro_piec_work_03.mp3` (**IMPLEMENTED**). To nie jest physical Rune Stone transport audio: kamień nigdy nie trafia do Pieca. Jeden poprawny komplet uruchamia jeden canonical 18-second cycle; nie powstaje czwarty work sound.
- Accepted Production Asterion Sphere `UTWÓRZ` construction cycle → `astro_piec_work_create_01.mp3` (**IMPLEMENTED**, once on DEVICE). The furnace process kind suppresses `astro_piec_work_01.mp3` for this cycle. Audio never determines duration: construction always follows the canonical 18-second furnace clock; interruption stops the create source. Future Astro Attractor creation may reuse the authored family but has no runtime action yet.

### Monkey and panels

- A new monkey communication signal that starts the three attention arcs → `monkey_thinking_01.mp3` on `WORLD`, once at signal start; pulses/redraws and repeated notification while the same signal remains pending are silent.
- Monkey panel: open → `panel_sound_long_01.mp3`; close → `panel_sound_long_02.mp3`; internal click → `click_panel_01.mp3`.
- Player Y panel: open → `bell_01.mp3`; close → `bell_02.mp3`; internal click → `click_panel_01.mp3`.

### Astro Attractor

The target beds are seamless DEVICE loops at source gain `1.0`: small glyphs → `noise_laud_loop_01.mp3`, shells → `02`, large glyphs → `03`, and stones 1–5 → `04–08` respectively. Shells and small glyphs are current gameplay target classes. Only shell bed `02` is **IMPLEMENTED**; small-glyph bed `01` remains **PLANNED** because its current target interaction does not wire attractor-audio callbacks. Large-glyph and rune mappings remain **PLANNED** without synthetic target logic. All eight existing assets are prepared non-blockingly.

Actual active pull starts the selected source immediately without fade-in and uses true source looping, never per-frame restarts. Successful takeover by the ordinary Spike ray fades it out over `0.5 s`. Temporary target loss keeps the same source and playhead while fading from its current gain toward zero over `1.0 s`; reacquiring the same logical target within that window cancels the prior automation and returns from the current gain to `1.0` in about `0.1 s`. A full second without recovery stops and idempotently cleans up the source. Deliberate release/cancel uses a shorter safe fade instead of recovery. A different logical target always ends the previous lifecycle and starts a new source from the beginning, even when both targets share an asset class. Audio observes gameplay success and identity; it does not decide either.

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
| `astro_piec_close.mp3` | one-shot | DEVICE | zamknięcie komory Astro Pieca | **IMPLEMENTED** | Playback one-shot jest wdrożony zgodnie z semantyką eventu powyżej. |
| `astro_piec_open.mp3` | one-shot | DEVICE | otwarcie komory Astro Pieca | **IMPLEMENTED** | Playback one-shot jest wdrożony zgodnie z semantyką eventu powyżej. |
| `astro_piec_work_01.mp3` | one-shot | DEVICE | proces skorup w Astro Piecu | **IMPLEMENTED** | Raz po zaakceptowanym starcie; bez loop/restartu; reset/dispose zatrzymuje aktywne źródło. |
| `astro_piec_work_create_01.mp3` | one-shot | DEVICE | Production Asterion `UTWÓRZ`; exactly once per accepted build, stopped on interrupted build | **IMPLEMENTED** | Fail-soft source; no loop and no duplicate generic click. |
| `astro_piec_work_02.mp3` | one-shot | DEVICE | proces małych glifów w Astro Piecu (TODO gameplay) | **PLANNED** | Asset istnieje; playback VR nie jest jeszcze wdrożony. |
| `astro_piec_work_03.mp3` | one-shot | DEVICE | proces kamieni w Astro Piecu (TODO gameplay) | **PLANNED** | Asset istnieje; playback VR nie jest jeszcze wdrożony. |
| `bell_01.mp3` | one-shot | UI | otwarcie panelu gracza Y | **IMPLEMENTED** | Playback one-shot na busie UI jest wdrożony. |
| `bell_02.mp3` | one-shot | UI | zamknięcie panelu gracza Y | **IMPLEMENTED** | Playback one-shot na busie UI jest wdrożony. |
| `bell_03.mp3` | one-shot | UI | — | **UNASSIGNED** | Brak ustalonego użycia VR. |
| `asterion_sphere_background.mp3` | seamless loop | DEVICE | wyposażona Kula Asterionowa | **IMPLEMENTED** | Jeden ciągły source do unequip/reset/dispose; niezależny od triggera. |
| `asterion_sphere_work.mp3` | seamless loop | DEVICE | aktywne sterowanie podłogą Kulą | **IMPLEMENTED** | Start przy drive; release wygasza przez 2 s, a retrigger zachowuje source/playhead. |
| `click_panel_01.mp3` | one-shot | UI | klik wewnątrz panelu małpy lub gracza Y; powrót panelu Astro Pieca do menu głównego | **IMPLEMENTED** | Playback one-shot na busie UI jest wdrożony. |
| `click_short_01.mp3` | one-shot | UI | panelowe kliknięcia wcześniej mapowane jako `turn_page_*` | **IMPLEMENTED** | W bieżącym Experience VR nie było takich mapowań; istniejących świadomych klików nie zmieniono. |
| `creating_01.mp3` | one-shot | WORLD | — | **UNASSIGNED** | Dostępny; przyszłe użycie pozostaje otwarte. |
| `creating_02.mp3` | one-shot | WORLD | — | **UNASSIGNED** | Dostępny; przyszłe użycie pozostaje otwarte. |
| `creating_03.mp3` | one-shot | WORLD | — | **UNASSIGNED** | Dostępny; przyszłe użycie pozostaje otwarte. |
| `creating_04.mp3` | one-shot | WORLD | — | **UNASSIGNED** | Dostępny; przyszłe użycie pozostaje otwarte. |
| `creating_05.mp3` | one-shot | WORLD | — | **UNASSIGNED** | Dostępny; przyszłe użycie pozostaje otwarte. |
| `creating_06.mp3` | one-shot | WORLD | — | **UNASSIGNED** | Dostępny; przyszłe użycie pozostaje otwarte. |
| `creating_07.mp3` | one-shot | WORLD | — | **UNASSIGNED** | Dostępny; przyszłe użycie pozostaje otwarte. |
| `creating_08.mp3` | one-shot | WORLD | — | **UNASSIGNED** | Dostępny; przyszłe użycie pozostaje otwarte. |
| `creating_short_01.mp3` | one-shot | WORLD | zaakceptowana aktywacja kryształu w relikwiarzu / AKTYWUJ | **IMPLEMENTED** | Raz na faktycznie zaakceptowaną aktywację; audio nie rozstrzyga poprawności gameplayu. |
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
- Behavior after exhaustion of the last existing post-main `ambient_loop_*`.
- Whether individual effects should be spatial / `PositionalAudio`, and which ones.


## Implementation boundary

This document records the CURRENT / BINDING audio target. The implementation includes the shared Master Volume, five unity-gain VR buses, events explicitly marked `IMPLEMENTED`, glyph and shell lifecycle fades/recovery, Asterion Sphere equipment/drive loops, and a transient tier/subthreshold ambient sequencer composed by `experienceVr.js`. That sequencer is implementation evidence, not the canonical selection contract: Scenario-driven entries, 10-second gaps and the post-main tail remain to be synchronized in code. Anything marked `PLANNED`, `RESERVED` or `UNASSIGNED` remains outside runtime unless its note explicitly identifies a partially implemented primitive. This model does not authorize other playback mappings, assets, renaming, mastering or spatialization.

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
