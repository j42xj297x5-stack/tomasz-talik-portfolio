# Experience VR — World Knowledge Progression

Status: **CURRENT / BINDING DESIGN TARGET / IMPLEMENTATION PENDING**

## Authority and scope

This document is the subordinate progression contract for the Orange Monkey VR world knowledge authored in [`EXPERIENCE_VR_WORLD_KNOWLEDGE.md`](EXPERIENCE_VR_WORLD_KNOWLEDGE.md). The master document remains authoritative for knowledge categories, language-independent IDs, semantic meaning, approved bilingual PL/EN content and approved `KIEDY:` annotations. The completed [`AUDYT_MAPOWANIA_WIEDZY_RUNTIME_2026-10-01.md`](../audits/technical/AUDYT_MAPOWANIA_WIEDZY_RUNTIME_2026-10-01.md) is the implementation evidence for the runtime predicates bound here.

When a task requires Monkey category/stage browsing, icon grids, star selection or text pagination, consult [`EXPERIENCE_VR_MONKEY_INFORMATION_BROWSER.md`](EXPERIENCE_VR_MONKEY_INFORMATION_BROWSER.md). For other delivery or presentation mechanics, consult [`EXPERIENCE_VR_COMMUNICATION_MECHANICS.md`](EXPERIENCE_VR_COMMUNICATION_MECHANICS.md). When it requires gameplay-domain identity or committed progression truth, consult [`VR_PROTO_ASTRO_MODEL.md`](../technical/VR_PROTO_ASTRO_MODEL.md) and [`VR_RUNE_STONES_MODEL.md`](../technical/VR_RUNE_STONES_MODEL.md) as applicable. Those documents do not replace this progression contract or the semantic content authority.

This is a design contract, not an implemented runtime claim. It does not implement the World Knowledge model, Monkey Knowledge surface, Player Y projection, counters, persistence, presentation assets, Scenario points or Scenario transitions.

## Authored-stage model

Every numbered subsection `XX.Y` in the master content is one independent knowledge stage and one star. Categories therefore contain **2, 3 or 4 stages**, according to their authored content. The complete current master contains **45 stages**. Stages must not be split, merged or regrouped to force a fixed category size, and the approved bilingual wording, IDs, semantics and `KIEDY:` annotations must not be rewritten by progression integration.

## Independent stage lifecycle

Each of the 45 stages independently follows:

```text
LOCKED → AVAILABLE → READ
```

- **LOCKED** — the stage cannot be deliberately opened through the Monkey Knowledge surface.
- **AVAILABLE** — the player can deliberately open the stage through the Monkey Knowledge surface. Availability does not mean that the knowledge has been read or inherited by Player Y.
- **READ** — committed only after the complete deliberate presentation of that stage finishes successfully.

Selecting a category or star, opening a topic, starting playback, or interrupting a presentation does not establish `READ`. Making a later stage `AVAILABLE` does not implicitly mark any other stage `AVAILABLE` or `READ`. Availability is monotonic: once a predicate has made a stage `AVAILABLE`, later changes in transient domain state cannot return it to `LOCKED`.

## Monkey first, Player Y inheritance second

The Monkey Knowledge surface is the first-teacher surface. Player Y remains the persistent abbreviated memory surface.

A specific knowledge stage may be inherited by Player Y only after that stage reaches `READ` through the Monkey. Player Y must not expose a stage that is unrevealed, `LOCKED` or merely `AVAILABLE`. It must not infer inheritance from physical discovery, domain state, selection, topic opening, playback start or interrupted playback.

Player Y copy is an abbreviated projection rather than a replacement for the canonical bilingual source. Its exact copy is not authored by this contract and remains future integration work.

## Complete audited availability bindings

The predicates below read authoritative runtime truth; they do not create parallel gameplay counters or new Scenario semantics. `totalTunedRuneCount` means `runeStoneProgressionController.getTunedFamilyCodes().length + Number(runeStoneProgressionController.isEtherRuneTuned())`. “Committed Tier-1 pages” means IDs from `progressionController.getActivatedPageIds()` resolved through `experienceVrPages` and filtered to `page.order === 1`; `CRYSTAL_ACTIVATED` is preview only and must never count.

| Stage | Approved availability predicate |
| --- | --- |
| `01.1` | `progressionController.isTierComplete(1) === true` |
| `01.2` | `progressionController.isTierComplete(2) === true` |
| `01.3` | `progressionController.isTierComplete(3) === true` |
| `02.1` | `progressionController.isTierComplete(1) === true` |
| `02.2` | `progressionController.isTierComplete(2) === true` |
| `02.3` | `progressionController.isTierComplete(4) === true` |
| `03.1` | `furnaceProgressionController.getAbsorbedShellIds().length >= 2` |
| `03.2` | `furnaceProgressionController.getAbsorbedShellIds().length >= 4` |
| `03.3` | `furnaceProgressionController.getAsterionSphereProgress().complete === true` (six processed Shells) |
| `04.1` | `protoAstroTuningController.getExtractedFamilyCodes().length >= 2` |
| `04.2` | `protoAstroTuningController.getExtractedFamilyCodes().length >= 4` |
| `04.3` | `protoAstroTuningController.getExtractedFamilyCodes().length >= 5` |
| `05.1` | `progressionController.isTierComplete(2) === true` |
| `05.2` | `progressionController.isTierComplete(2) === true` |
| `05.3` | `progressionController.isTierComplete(3) === true` |
| `05.4` | `progressionController.isTierComplete(4) === true` |
| `06.1` | committed Tier-1 page count `>= 1` |
| `06.2` | committed Tier-1 page count `>= 3` |
| `06.3` | committed Tier-1 page count `>= 5` |
| `07.1` | committed Tier-1 page count `>= 2` |
| `07.2` | committed Tier-1 page count `>= 4` |
| `07.3` | committed Tier-1 page count `>= 5` |
| `08.1` | `astroAttractorProductionController.isEarned() === true` (production state `EARNED`) |
| `08.2` | `asterionProductionController.getState() === 'EARNED'` |
| `08.3` | `protoAstroTuningController.getExtractedFamilyCodes().length >= 1` |
| `09.1` | `astroAttractorProductionController.isEarned() === true` (production state `EARNED`) |
| `09.2` | `furnaceProgressionController.getAsterionSphereProgress().complete === true` |
| `09.3` | `progressionController.isTierComplete(2) === true` |
| `10.1` | `totalTunedRuneCount >= 1` |
| `10.2` | `totalTunedRuneCount >= 3` |
| `10.3` | `totalTunedRuneCount >= 5` |
| `10.4` | `totalTunedRuneCount >= 6` |
| `11.1` | `progressionController.isTierComplete(2) === true` |
| `11.2` | `progressionController.isTierComplete(3) === true` |
| `12.1` | first Rune Bridge completes `ARRIVING → DOCKED`; reconstruction accepts `DOCKED`, `EXTENDING`, `EXTENDED` or `BOUND` as post-arrival truth |
| `12.2` | at least three Rune Bridges have completed arrival; reconstruction uses the same post-arrival states and does not count `ARRIVING` |
| `13.1` | `asterionProductionController.getState() === 'EARNED'` |
| `13.2` | first `asterionResonatorFieldActor.descriptor.fullActiveCore === true`; historical trigger requiring a persistent availability latch |
| `14.1` | first `asterionResonatorFieldActor.descriptor.fullActiveCore === true`; shared historical trigger requiring the same latch |
| `14.2` | `progressionController.isTierComplete(4) === true` |
| `14.3` | Ether functional integration semantic alias `ETHER_MONKEY_CAPTURED`, reconstructable as `runeStoneProgressionController.hasWaterInstallationReadinessOverride() === true`; there is no `ETHER_INSTALLED` |
| `14.4` | `runeStoneProgressionController.isFamilyInstalled('S') === true` (direct natural Water-family truth) |
| `15.1` | `furnaceProgressionController.hasAbsorbedShell('shell-relic-6') === true` |
| `15.2` | `runeStoneProgressionController.isEtherRuneTuned() === true` |
| `15.3` | `ETHER_MONKEY_CAPTURED`, reconstructable as `runeStoneProgressionController.hasWaterInstallationReadinessOverride() === true` |

### Binding constraints

- Shell stages use committed Furnace processing truth, not collection or attempted processing.
- Small Glyph stages use committed natural-family extraction truth from `protoAstroTuningController`; Ether `VI` is outside the five-family thresholds.
- Portal stages count committed Tier-1 pages only. Preview event `CRYSTAL_ACTIVATED` does not count.
- Astrolabium Więzi and Asterion Sphere ownership require their production state `EARNED`, not an earlier available, building or claim state.
- Rune Stone stages count tuning, not installation, at **1 / 3 / 5 / 6** total tuned Runes. The total includes Ether when it has been tuned and does not assume a fixed tuning order.
- Keystone arrival means completed Rune Bridge arrival or reconstructable post-arrival state, never readiness or an in-progress arrival.
- First complete Resonator activation is the first `fullActiveCore === true`. `fieldActive` is insufficient because it becomes true with only one active channel. Because sectors can later return to zero, future runtime implementation must latch the first complete activation historically.
- Ether functional integration uses the audited semantic alias `ETHER_MONKEY_CAPTURED` / `waterInstallationReadinessOverride === true`. Runtime must not invent `ETHER_INSTALLED`.
- Water Rune availability uses direct natural-family truth `isFamilyInstalled('S')`, rather than assuming an event order.

## Terminal knowledge boundary

Every authored knowledge stage must be at least `AVAILABLE` before the experience enters the final Water Glyph/Crystal end sequence in which normal Monkey interaction is no longer available.

The player is not required to have completed the deliberate presentation of every stage or to have every stage at `READ`. This boundary prevents knowledge from first becoming discoverable after the ordinary Monkey teaching surface is unavailable. It is a safety/deadline invariant only, not a new Scenario point, event, milestone, capability or transition.
