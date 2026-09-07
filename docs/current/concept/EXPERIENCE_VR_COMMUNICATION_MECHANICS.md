# Experience VR — Communication Mechanics

Status: **CURRENT runtime baseline**, synchronized on 2026-09-07. Literal Polish text is owned by [`EXPERIENCE_VR_PLAYER_COMMUNICATION_COPY.md`](EXPERIENCE_VR_PLAYER_COMMUNICATION_COPY.md).

This document describes the implemented communication model. `ATTENTION_REQUIRED`, `AUTO_HINT`, `SPEAKING` and `IDLE` are semantic classifications used by the documentation; runtime actors may expose more detailed phases.

## Surfaces and truth ownership

**Monkey first teacher** owns authored progression communication, situational hints, one-shot acquisition teaching, ordinary questions and discovered-card history. **Player Y persistent memory** owns controls, the current task, practical tool reference and read-only discovered-world `WIEDZA`. Communication actors only observe and project Scenario and domain state; they do not own gameplay truth.

The implemented communication composition includes Intro authored communication, Early Experience Guidance, Reliquary context Guidance, Rune/Resonator Guidance and Tool Guidance. They share Monkey dialogue arbitration and, where applicable, the shared authored-communication actor.

## Shared authored-communication lifecycle and arbitration

`createVrMandatoryMonkeyCommunication` is the shared actor for authored communication. Its detailed phases are `WAITING`, `ATTENTION`, `AUTO_DELAY`, `PLAYBACK` and `COMPLETE` (with actor-local idle before scheduling/reset). Conceptually, attention-required work passes from `ATTENTION_REQUIRED` to `SPEAKING` and then `IDLE`; situational `AUTO_HINT` passes through the cue delay to `SPEAKING` and then `IDLE`.

Monkey dialogue uses one owner lease with priority `MANDATORY > ACQUISITION > OPTIONAL`. Higher-priority work may preempt lower work only before playback. Pending/pre-playback communication may also be cancelled when its originating condition becomes irrelevant. Once playback starts it is non-preemptible.

Successful completion releases dialogue ownership and returns Monkey to silent idle. Completion never opens the ordinary Monkey menu automatically.

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
| Rune transport has an unresolved branch without Binder | `rune-no-binder` | `hint.rune.noBinder.soft` | `5 s` unresolved → sound-only cue → `1.0 s` → automatic playback | successful playback publishes soft and starts the next unresolved stage |
| Same Rune condition remains unresolved | `rune-no-binder` | `hint.rune.noBinder.medium` | another `5 s` unresolved → sound-only cue → `1.0 s` → automatic playback | successful medium replaces unread soft; falsy `getUnresolvedRuneBranchId()` resets communication/timers and withdraws the slot |

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

`createVrCurrentObjectiveProjection` remains the stateless read-only CURRENT OBJECTIVE owner. Player Y shows it under `AKTUALNE ZADANIE`; ordinary Monkey normally projects it through `CO TERAZ?`. At `4.80`, while Resonator does not exist, Monkey instead preserves the authored first-stone lead / `KAMIENIE` discovery flow. At `5.10` there is no objective. Transient fallbacks do not replace these semantics.

After first live Binder `HIDDEN → DOCKED`, ordinary Monkey additionally exposes `CO TO JEST? → ZWORNIKI`. Player Y `WIEDZA` remains a separate read-only projection of discovered-world knowledge and is not populated by transient fallback hints.

## Automatic communication that is not AUTO_HINT

Automatic authored progression reactions may play without attention but do not become corrective `AUTO_HINT` or publish a transient fallback merely because playback is automatic. Current examples include `progression.threshold.crossed`, `progression.crystal.firstCreated`, `progression.card.first` and `progression.p3.firstSectorLock`.

Current acquisition teaching also remains distinct: it waits after physical claim, uses full attention and a Monkey press, plays once, then returns to idle.

The following current click-required / attention guidance was **not** migrated and retains its current behavior: `hint.glyphs.how.soft`, `hint.glyphs.how.strong`, `hint.protoAstro.tuning`, `hint.furnace.astroStart` and `hint.furnace.astroAvailable`.

## Copy representation

Runtime Monkey copy is authored as `blocks[]`: one element is one bubble; `\n` inside an element is a mandatory line break in that bubble. Documentation must neither merge nor split blocks and uses `--- BLOCK ---` only between elements.
