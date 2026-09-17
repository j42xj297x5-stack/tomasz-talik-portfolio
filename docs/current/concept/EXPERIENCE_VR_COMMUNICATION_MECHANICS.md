# Experience VR — Communication Mechanics

Status: **CURRENT runtime baseline**, synchronized on 2026-09-11. Literal Polish text is owned by [`EXPERIENCE_VR_PLAYER_COMMUNICATION_COPY.md`](EXPERIENCE_VR_PLAYER_COMMUNICATION_COPY.md).

> The final-Water communication lifecycle is frozen separately in [`EXPERIENCE_VR_FINAL_WATER_RESONATOR_CULMINATION.md`](EXPERIENCE_VR_FINAL_WATER_RESONATOR_CULMINATION.md) as **BINDING DESIGN TARGET / IMPLEMENTATION PENDING**. Nothing in that target is part of this implemented baseline yet.

This document describes the implemented communication model. `ATTENTION_REQUIRED`, `AUTO_HINT`, `SPEAKING` and `IDLE` are semantic classifications used by the documentation; runtime actors may expose more detailed phases.

## Surfaces and truth ownership

**Monkey first teacher** owns authored progression communication, situational hints, one-shot acquisition teaching, ordinary questions and discovered-card history. **Player Y persistent memory** owns controls, the current task, practical tool reference and read-only discovered-world `WIEDZA`. Communication actors only observe and project Scenario and domain state; they do not own gameplay truth.

The implemented communication composition includes Intro authored communication, Early Experience Guidance, Reliquary context Guidance, Rune/Resonator Guidance and Tool Guidance. They share Monkey dialogue arbitration and, where applicable, the shared authored-communication actor.

## Shared authored-communication lifecycle and arbitration

`createVrMandatoryMonkeyCommunication` is the shared actor for authored communication. Its detailed phases are `WAITING`, `ATTENTION`, `AUTO_DELAY`, `PLAYBACK` and `COMPLETE` (with actor-local idle before scheduling/reset). Conceptually, attention-required work passes from `ATTENTION_REQUIRED` to `SPEAKING` and then `IDLE`; situational `AUTO_HINT` passes through the cue delay to `SPEAKING` and then `IDLE`.

Monkey dialogue uses one owner lease with priority `MANDATORY > ACQUISITION > OPTIONAL`. Higher-priority work may preempt lower work only before playback. Pending/pre-playback communication may also be cancelled when its originating condition becomes irrelevant. Once playback starts it is non-preemptible.

Successful completion releases dialogue ownership and returns Monkey to silent idle. Completion never opens the ordinary Monkey menu automatically.

### Playback-time block resolution

Static `blocks` retain unchanged behavior. A communication may instead provide dynamic `resolveBlocks`: the resolver runs only at actual playback start—not when scheduled and not when attention is acquired—then its result is validated as blocks and frozen for that playback. Playback remains one dialogue-owner lifecycle, and resolved copy never changes mid-message.

The current concrete use is first-Rune Guidance: after the delayed attention lifecycle, it reads current Asterion ownership at playback start and selects the matching authored variant. This capability does not imply that other communication is dynamic.

### Required authored communication — `ATTENTION_REQUIRED`

Required communication may use full attention:

`attention sound + visual attention arcs (once) → player presses Monkey → authored playback → silent idle`

The press starts only the pending authored communication, not the ordinary menu. Existing authored choices remain part of that communication.

### Situational guidance — `AUTO_HINT`

Semantic `AUTO_HINT` follows exactly:

```text
sound-only Monkey cue
→ exactly 1.0 s AUTO_DELAY
→ automatic authored playback
→ silent idle
```

It needs no Monkey press and shows no visual attention arcs. `MonkeyGuide.playAttentionCue()` invokes the same existing sound callback as full attention, but does not mutate `attentionPending`, attention ownership, arc visibility or arc opacity. Full attention continues to combine that sound with the visual arcs exactly once.

Classification is semantic. Neither a `hint.*` key nor `requiresAttention: false` alone makes communication an `AUTO_HINT`.

## Monkey surface exclusivity

Intro speech and every shared authored communication sequence exclusively own the Monkey communication surface until completion. While authored speech owns it, pressing Monkey cannot open ordinary conversation, and `CO TERAZ?`, `JAK MI IDZIE?`, history and knowledge cannot appear alongside unfinished speech.

This is not a gameplay-wide lock: locomotion, tools, object collection and other world interaction remain available while Monkey speaks.

## CURRENT AUTO_HINT runtime matrix

Exactly seven keys currently have the semantic `AUTO_HINT` behavior. Unrelated hints must not be inferred into this set from their key prefix.

| Owner / condition | Transient slot | Key | Existing trigger and flow | Withdrawal / replacement |
| --- | --- | --- | --- | --- |
| Early Experience: first crystal remains `available` | `first-crystal-pickup` | `hint.crystal.whatNow.soft` | first `30 s` stage → sound-only cue → `1.0 s` → automatic playback | successful playback publishes the soft fallback; leaving `available` withdraws the whole slot |
| Early Experience: pickup remains unresolved | `first-crystal-pickup` | `hint.crystal.grab.medium` | second existing `30 s` stage → sound-only cue → `1.0 s` → automatic playback | successful medium replaces unread soft in this slot; leaving `available` withdraws it |
| Early Experience: Reliquary reveal completed and first-crystal flow remains unadvanced | `first-crystal-reliquary` | `hint.reliquary.firstCrystal` | existing `60 s` → sound-only cue → `1.0 s` → automatic playback | successful playback publishes the fallback; `inserted`, `active`, `released` or `consuming` withdraw it |
| Reliquary context: crystal remains `inserted` | `reliquary-context` | `hint.reliquary.inserted` | `15 s` phase timeout → `RELIQUARY_HINT_TIMEOUT` → `SHOW_RELIQUARY_CONTEXT_HINT` → sound-only cue → `1.0 s` → automatic playback | leaving `inserted` withdraws the stale stage |
| Reliquary context: crystal remains `active` | `reliquary-context` | `hint.reliquary.active` | a new phase-local `15 s` timer from zero, then the same Scenario route, cue, `1.0 s` and playback | successful active replaces unread inserted; leaving `active` withdraws the slot |
| Carried Rune reveals an unresolved branch without Binder and latches that bounded Guidance issue | `rune-no-binder` | `hint.rune.noBinder.soft` | `5 s` unresolved → sound-only cue → `1.0 s` → automatic playback | successful playback publishes soft and starts the next unresolved stage; releasing the Astrolabe does not clear the latch |
| Same latched Rune branch remains without installation readiness | `rune-no-binder` | `hint.rune.noBinder.medium` | another `5 s` unresolved → sound-only cue → `1.0 s` → automatic playback | successful medium replaces unread soft; installation readiness for the latched branch resets communication/timers and withdraws the slot |

The four bounded slots are therefore `first-crystal-pickup`, `first-crystal-reliquary`, `reliquary-context` and `rune-no-binder`.

## Transient `CO TERAZ?` fallback memory

The Monkey knowledge resolver owns a generic session-local collection mapping a bounded issue slot to its current fallback topic. A successfully completed automatic `AUTO_HINT` may publish an entry with lifecycle `NEW`. It reuses the exact authoritative hint `blocks`; no alternate copy exists, and its question/menu label is derived at runtime from the final authored block.

This collection is ordinary Monkey `CO TERAZ?` presentation memory only. It is neither Scenario or gameplay truth, Player Y knowledge, card history, permanent knowledge nor durable save data.

### Publication and deliberate-read boundaries

Publication happens **only after successful automatic authored playback completion**—never at timer trigger, scheduling, sound cue, `AUTO_DELAY` or playback start. A cancelled pre-playback hint publishes nothing.

Opening `CO TERAZ?` and selecting a transient entry do not consume it. Only successful completion of its full deliberate ordinary-knowledge playback consumes it. Consumed transient knowledge disappears instead of becoming a permanent `READ` entry and never enters history.

### Gameplay expiry and started reading

The first applicable boundary wins: full deliberate read or resolution of the originating gameplay condition. Each owner withdraws its slot according to the matrix above. Withdrawal removes future menu availability but does not interrupt a deliberate fallback sentence sequence that has already started. That sequence may finish normally, and its completion cannot resurrect the withdrawn entry.

### Slot replacement and coexistence

Escalations of the same issue share one bounded slot:

- crystal pickup soft → crystal pickup medium;
- Rune noBinder soft → Rune noBinder medium;
- Reliquary inserted → Reliquary active.

A newer successfully completed escalation replaces only the older unread stage in its own slot. Different unresolved slots may coexist. Deterministic runtime projection is not a global latest-wins rule, semantic ranking or cross-slot `AUTO_HINT` priority ordering.

### Projection, live refresh and reset

Transient topics appear before the existing ordinary current-guidance topic; they do not replace CURRENT OBJECTIVE or the special stone guidance. `CO TERAZ?` exists when at least one transient fallback or the ordinary current topic exists, and the ordinary topic remains available.

`MonkeyGuide.refreshKnowledge()` redraws an already-open ordinary menu or `CO TERAZ?` view after publication/withdrawal, so close/reopen is unnecessary. Refresh does not open or close Monkey, change dialogue ownership, or expose ordinary content during authored speech.

Canonical Monkey/session reset clears every transient slot. There is no durable reconstruction.

## Ordinary objective and discovered-world knowledge

`createVrCurrentObjectiveProjection` remains the stateless read-only CURRENT OBJECTIVE owner. Player Y shows it under `AKTUALNE ZADANIE`; ordinary Monkey normally projects it through `CO TERAZ?`. After physical Astrolabe ownership and until physical Asterion ownership, both surfaces additionally compose the practical Shell → Furnace → Asterion build path without replacing the ordinary objective. In Monkey ordering it follows transient corrective fallbacks and precedes the ordinary objective or special stone guidance. Player Y composes it as a secondary current task. Both projections read the production controllers directly and remove the path when `asterionProductionController.isEarned()` becomes true. At `4.80`, while Resonator does not exist, Monkey retains practical `KAMIENIE / STONES` guidance alongside that build path as persistent reference after the authored post-Third-Ring teaching. At `5.10` there is no ordinary objective. Transient fallbacks do not replace these semantics.

After Third Ring completion and the existing five-second delay, Monkey delivers glyph loss, the horizon/stone lead and practical Rune Stone direction as one attention-required authored progression speech with no second attention gate. Only successful completion marks the lead and practical stone guidance taught/read. Ordinary `CO TERAZ?` then retains `KAMIENIE / STONES` as persistent practical reference, while Player Y may project `KAMIENIE RUNICZNE / RUNE STONES` from that same communication-memory discovery state. Scheduling, attention or partial playback do not establish this knowledge.

Physical Astrolabe ownership exposes persistent `CO TO JEST? → KULA ASTERIONOWA` as `NEW`; only deliberate full playback marks it `READ`, and it remains available afterward. After the first live Binder `ARRIVING → DOCKED`, Monkey exposes `CO TO JEST? → ZWORNIKI` as `NEW`, while Player Y does not yet expose that knowledge. Only successful completion of the deliberate full topic playback marks the bounded session-local Keystone knowledge read/taught, archives it from Monkey, and makes Player Y `WIEDZA → ZWORNIKI` permanently available for the remainder of the session. Selection, playback start and interrupted playback do not complete the handoff. Canonical Monkey/session reset clears both Binder discovery and read memory. Player Y `WIEDZA` remains a separate read-only projection and is not populated by physical Binder discovery alone or by transient fallback hints: Monkey is the first teacher, and Player Y is persistent memory.

The first physical Resonator appearance continues to trigger the existing delayed, attention-required `progression.p3.resonator` communication. Only successful full playback records the bounded session-local communication-memory fact `resonator taught`; scheduling, attention, Monkey press, playback start, and partial playback do not. That fact upgrades Player Y's generic `SEKTOR / SECTOR` entry to the persistent `REZONATOR ASTERIONOWY / ASTERION RESONATOR` entry without showing both. Canonical Monkey/session reset clears the fact. This is communication memory, not Resonator gameplay truth.

The practical reference reflects the target-acquisition gate: `EARTH > 0 AND WOOD > 0 AND FIRE > 0` makes target acquisition available. If any core channel remains at `0`, the Resonator performs no target acquisition. EARTH controls the left field profile, WOOD the right field profile, and FIRE field depth.

After the Resonator has been taught and the physical Metal Rune (`T`) is installed, Player Y additionally exposes `WIEDZA → SEKTOR METALU / METAL SECTOR` immediately after the Resonator entry. Both conditions are required: installation alone does not move Metal ahead of its Resonator context, while taught Resonator knowledge alone does not claim an unavailable extension. This presentation gate reads authoritative physical Rune installation truth directly and does not use Scenario points, milestones, objectives, control levels or visibility. The existing projection-signature refresh makes the row appear while Player Y is already open.

Metal supplements rather than replaces the EARTH/WOOD/FIRE core. Wrist twist extends the existing field's LATERAL reach, hand tilt extends its FORWARD/depth reach, and the two axes act independently. Level `0` contributes no Metal extension; higher active levels provide progressively greater extension. Metal does not activate the Resonator by itself and does not remove the requirement that all three core Sectors remain above `0`.

Installation of all five elemental Runes leads to the existing `progression.p4.fullResonator` Monkey first-teacher communication. Only successful full playback records the bounded session-local communication-memory fact `full Resonator taught`; installation, scheduling, attention, playback start and partial playback do not. Canonical Monkey/session reset clears the fact. This is communication memory, not Resonator gameplay truth.

After that full-Resonator teaching has completed and the physical Water Rune (`S`) is installed, Player Y exposes `WIEDZA → SEKTOR WODY / WATER SECTOR` after `SEKTOR METALU / METAL SECTOR`. Both conditions are required and the installation gate reads authoritative Rune installation truth directly. Water installation without completed teaching exposes no entry, and taught memory without physical Water exposes no entry. The existing projection-signature refresh makes the row appear while Player Y is already open.

Water contributes two independent presentation/frequency controls. Wrist twist selects green, blue or violet frequency hue, with level `0` neutral; hand tilt independently increases field brightness and halo from the level-`0` baseline. Hue is not a power ladder. Water does not change field geometry, reach or containment and does not currently select or filter a Glyph family.

## Automatic communication that is not AUTO_HINT

Automatic authored progression reactions may play without attention but do not become corrective `AUTO_HINT` or publish a transient fallback merely because playback is automatic. Current examples include `progression.threshold.crossed`, `progression.crystal.firstCreated`, `progression.card.first` and `progression.p3.firstSectorLock`.

Astrolabe acquisition teaching remains distinct: after physical claim it keeps the existing five-second delay, full attention and Monkey press. Its unchanged control-teaching blocks are followed, within the same uninterrupted playback and without another attention gate, by the poetic Asterion Sphere introduction. The practical build path is not spoken in this progression beat; it lives in `CO TERAZ?` and Player Y `AKTUALNE ZADANIE`.

Player Y tool cards represent physical ownership rather than equipment permission. The Asterion Sphere card and its `X` controller reference therefore appear only when `asterionProductionController.isEarned()` is true; Furnace and Astrolabe presentation remains unchanged.

The following current click-required / attention guidance was **not** migrated and retains its current behavior: `hint.glyphs.how.soft`, `hint.glyphs.how.strong`, `hint.protoAstro.tuning`, `hint.furnace.astroStart` and `hint.furnace.astroAvailable`.

## Copy representation

Runtime Monkey copy is authored as `blocks[]`: one element is one bubble; `\n` inside an element is a mandatory line break in that bubble. Documentation must neither merge nor split blocks and uses `--- BLOCK ---` only between elements.

## Final Water delayed guidance — binding target, not runtime

The final puzzle adds a single unresolved-time ladder at `3 / 6 / 9` minutes, beginning only after physical Water installation and successful full-Resonator first-teacher completion. Mandatory Monkey communication defers due hints. Ordinary Sector changes, target contact, one/two rings and lost containment do not reset it; balanced synchronization resolves it. Hint 2 publishes persistent `CO TERAZ?` and Player Y reminders only after successful teaching. Hint 3 first asks consent: declining stops automatic escalation but publishes an optional answer topic; accepting (then or later) publishes the exact answer persistently. Presentation pulse is never used as solve truth. Exact approved PL blocks and ownership are canonical in the final-Water freeze.
