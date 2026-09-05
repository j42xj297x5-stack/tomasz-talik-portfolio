# Experience VR — Communication Mechanics

Status: **CURRENT runtime baseline + BINDING TARGET / NOT YET IMPLEMENTED**, synchronized on 2026-09-05. Literal Polish text is owned by [`EXPERIENCE_VR_PLAYER_COMMUNICATION_COPY.md`](EXPERIENCE_VR_PLAYER_COMMUNICATION_COPY.md).

This document deliberately separates observed runtime behavior from the approved communication target. The target below is binding product direction, but the runtime does not yet implement its complete contract. `ATTENTION_REQUIRED`, `AUTO_HINT`, `SPEAKING` and `IDLE` are documentation concepts here, not claims about existing runtime symbols.

## Surfaces and ownership

**Monkey first teacher** owns mandatory progression communication, situational hints, one-shot acquisition teaching, ordinary questions and discovered-card history. **Player Y persistent memory** owns controls, current task, practical tool reference and read-only discovered-world `WIEDZA`. Neither surface owns gameplay progression truth.

Two bounded Guidance lifecycles are implemented: early Experience Guidance and Rune/Resonator Guidance. They observe existing Scenario semantics and domain transitions. Hydration, direct activation and reset establish a baseline and must not replay live discovery one-shots.

## Arbitration

Priority is strictly `MANDATORY > ACQUISITION > OPTIONAL`. One lease plays at a time. A higher priority can preempt lower pending/attention work, but started playback is non-preemptible. Pending or attention work is cancelled when no longer relevant; cancelled discoveries do not mutate domain truth.

## CURRENT OBJECTIVE

`createVrCurrentObjectiveProjection` is the only objective owner. It is a stateless, read-only projection of Scenario point plus live owners. Y shows it under `AKTUALNE ZADANIE`.

Normally Monkey `CO TERAZ?` projects that same objective. At `4.80`, while Resonator does not exist, it instead uses the authored discovery flow: first stone lead, then `KAMIENIE`. At `5.10` there is no objective. Therefore ordinary Monkey is not universally an exact generic-objective mirror.

After first live Binder `HIDDEN → DOCKED`, ordinary Monkey additionally exposes `CO TO JEST? → ZWORNIKI`. This is discovered-world knowledge, not a persistent tool manual. Removed Astro/Asterion contextual manuals and legacy categories remain absent.

## Player Y

The hierarchy is:

- `STEROWANIE`;
- `AKTUALNE ZADANIE`;
- `NARZĘDZIA`, when at least one tool entry exists;
- `WIEDZA`, when at least one knowledge item exists.

Navigation is `MAIN_MENU → SECTION_DETAIL`, `MAIN_MENU → TOOL_LIST → TOOL_DETAIL` and `MAIN_MENU → KNOWLEDGE_LIST → KNOWLEDGE_DETAIL`.

`WIEDZA` is runtime-session communication memory cleared by canonical baseline reset; there is no durable save. Unlocks are read-only projections:

- `SKORUPY` from Shell field presentation truth;
- `KAMIENIE RUNICZNE` after the player reads Monkey `KAMIENIE`;
- `ZWORNIKI` after the first live Binder `HIDDEN → DOCKED`, remaining available after `BOUND`;
- `SEKTOR` after first installed Rune discovery.

Physical Astro acquisition grants `CAN_EQUIP_ASTRO` and `CAN_SWITCH_ASTRO_BAND`; the base bands already include `SHELLS` and `SMALL_GLYPHS`, so B may cycle them immediately. `LARGE_GLYPHS` and `RUNESTONES` retain their later domain/tuning conditions. This does not move Small Glyph materialization or Large Glyph/Rune targetability earlier.

## Implemented Rune/Resonator reactions

1. Live third-ring completion → `5 s` → attention → `progression.p3.glyphsGone`.
2. Failed legal Rune transport without readiness: `5 s` unresolved → soft hint; after soft completion and another unresolved `5 s` → medium hint. Pending work cancels when resolved.
3. `installedRuneFamilies 0 → 1` → `5 s` → attention → one-shot `progression.p3.firstRuneInstalled`.
4. Live-only sector `LOCKED` notification → `5 s` → automatic playback without attention → `progression.p3.firstSectorLock`.
5. `resonatorExists false → true` → `5 s` → attention → `progression.p3.resonator`.

First Binder discovery unlocks knowledge without Monkey attention or automatic speech. All these beats react to domain truth, are not mechanic gates and can happen before `4.80`.

## BINDING TARGET / NOT YET IMPLEMENTED — two attention models

Classification follows the semantic role of a communication, never merely a copy-key prefix such as `hint.*` or `progression.*`.

### Required authored communication — `ATTENTION_REQUIRED`

Important Scenario/progression communication that requires conscious acknowledgement follows this target sequence:

`attention sound + existing visual attention arcs → player presses Monkey → pending authored communication only → silent idle`

- The press starts only the pending authored communication. It must not open the ordinary Monkey conversation/menu.
- Existing authored choices belonging to the active narrative communication remain part of that communication; they are not the ordinary Monkey menu.
- Ordinary Monkey conversation remains unavailable throughout the authored speech.
- Completion after the final authored block returns Monkey to silent idle. It must not automatically open `CO TERAZ?`, `JAK MI IDZIE?`, history, knowledge or any other ordinary Monkey menu.
- To open the ordinary menu afterwards, the player must press Monkey again from idle.

The target explicitly rejects an implicit `authored speech → ordinary Monkey menu` transition.

### Situational guidance — `AUTO_HINT`

Corrective or situational guidance—such as timeout guidance, an unresolved legal player action, or a corrective hint after reaching a state that cannot currently be completed—follows this target sequence:

`attention sound, without visual attention arcs → exactly 1.0 s → automatic authored hint playback → silent idle`

- No Monkey press is required.
- Ordinary Monkey conversation remains unavailable from the cue through completion of hint playback.
- Completion must not automatically open the ordinary Monkey menu.
- `hint.rune.noBinder.soft` and `hint.rune.noBinder.medium` are concrete situational `AUTO_HINT` examples, not required Scenario acknowledgement beats.

Whenever an `AUTO_HINT` is presented automatically, the same existing authored hint blocks must become available under the Monkey's `CO TERAZ?` knowledge surface as a one-time readable fallback. This lets a player deliberately recover information missed while looking elsewhere or standing too far away. The fallback reuses the authoritative copy blocks; this mechanics document creates no alternate or duplicate literal text.

This decision does not define ordering of simultaneous transient hints, stacking versus replacement, expiry after the originating condition resolves, or interaction with an already-open ordinary Monkey menu. Those policies remain unresolved.

## BINDING TARGET / NOT YET IMPLEMENTED — Monkey surface exclusivity

Whenever Monkey is speaking authored communication, that speech exclusively owns the Monkey interaction surface:

- pressing Monkey must not open the ordinary conversation/menu;
- `CO TERAZ?`, `JAK MI IDZIE?`, history and knowledge navigation must not appear over or alongside unfinished authored speech;
- the same rule applies to Intro and every other authored sequence;
- this exclusivity ends at the authored communication's clean completion boundary, when Monkey returns to silent idle.

The exclusivity is local to the Monkey communication surface, not a gameplay-wide lock. The player may ignore Monkey and continue locomotion, collecting objects, using tools and other normal world interactions while Monkey speaks.

## Copy representation

Runtime Monkey copy is authored as `blocks[]`: one element is one bubble; `\n` inside an element is a mandatory line break in that bubble. Documentation must neither merge nor split blocks and uses `--- BLOCK ---` only between elements.
