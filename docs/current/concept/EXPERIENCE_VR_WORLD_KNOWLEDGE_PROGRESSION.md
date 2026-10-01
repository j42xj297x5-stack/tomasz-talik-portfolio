# Experience VR — World Knowledge Progression

Status: **CURRENT / BINDING DESIGN TARGET / IMPLEMENTATION PENDING**

## Authority and scope

This document is the subordinate progression contract for the Orange Monkey VR world knowledge authored in [`EXPERIENCE_VR_WORLD_KNOWLEDGE.md`](EXPERIENCE_VR_WORLD_KNOWLEDGE.md). The master document remains authoritative for knowledge categories, language-independent IDs, semantic meaning and approved bilingual PL/EN content. This document owns only the future discovery stages, lifecycle rules, inheritance boundary and the progression bindings explicitly resolved below.

When a task requires delivery or presentation mechanics, consult [`EXPERIENCE_VR_COMMUNICATION_MECHANICS.md`](EXPERIENCE_VR_COMMUNICATION_MECHANICS.md). When it requires gameplay-domain identity or committed progression truth, consult [`VR_PROTO_ASTRO_MODEL.md`](../technical/VR_PROTO_ASTRO_MODEL.md) and [`VR_RUNE_STONES_MODEL.md`](../technical/VR_RUNE_STONES_MODEL.md) as applicable. Those documents do not replace the semantic content authority or the progression rules defined here.

This is a design contract, not an implemented runtime claim. It does not implement the Monkey Knowledge surface, Player Y projection, counters, persistence, presentation assets, Scenario points or Scenario transitions.

## Three-star discovery model

Every knowledge category presented through the future Monkey Knowledge surface has exactly three progressive discovery stages:

```text
STAR 1
STAR 2
STAR 3
```

Runtime star stages do not have to map one-to-one to the numbered semantic fragments in the master content source. One star may expose one or more source fragments. A category may therefore have more or fewer than three numbered source subsections without changing the invariant of exactly three runtime stages.

The approved canonical source text must not be split, merged, rewritten or otherwise reshaped merely to obtain three source subsections per category. A later integration task must map source fragments to stars while preserving their approved bilingual wording, IDs and semantics.

## Independent stage lifecycle

Each star has its own lifecycle:

```text
LOCKED → AVAILABLE → READ
```

- **LOCKED** — the stage cannot be deliberately opened through the Monkey Knowledge surface.
- **AVAILABLE** — the player can deliberately open the stage through the Monkey Knowledge surface. Availability does not mean that the knowledge has been read or inherited by Player Y.
- **READ** — committed only after the complete deliberate presentation of that stage finishes successfully.

Selecting a category or star, opening a topic, starting playback, or interrupting a presentation does not establish `READ`. Each stage advances independently: making a later stage `AVAILABLE` does not implicitly mark an earlier or later stage `READ`.

## Monkey first, Player Y inheritance second

The Monkey Knowledge surface is the first-teacher surface. Player Y remains the persistent abbreviated memory surface.

A specific knowledge stage may be inherited by Player Y only after that stage reaches `READ` through the Monkey. Player Y must not expose a stage that is unrevealed, `LOCKED` or merely `AVAILABLE`. It must not infer inheritance from physical discovery, domain state, selection, topic opening, playback start or interrupted playback.

Player Y copy is an abbreviated projection rather than a replacement for the canonical bilingual source. Its exact copy is not authored by this contract and remains future integration work.

## Resolved progression bindings

Only Shells, natural Small Glyphs and natural Rune Stones receive concrete star thresholds in this contract. Counts use authoritative committed domain truth rather than attempts, presentation state or inferred visibility.

### Shells

Shell knowledge counts the six canonical Shell identities processed by the Furnace.

| Stage | Availability threshold |
| --- | --- |
| `STAR 1` | 2 unique Shell identities processed by the Furnace |
| `STAR 2` | 4 unique Shell identities processed by the Furnace |
| `STAR 3` | 6 unique Shell identities processed by the Furnace |

The count is based on authoritative processed-Shell truth. Raw collection attempts, repeated processing and duplicate operations do not increase it. This contract specifies the rule only and does not implement or own a counter.

### Small Glyphs

Small Glyph knowledge progression counts only the five natural extracted Small Glyph family essences (`K / T / S / L / R`).

| Stage | Availability threshold |
| --- | --- |
| `STAR 1` | 2 unique natural Small Glyph families extracted |
| `STAR 2` | 4 unique natural Small Glyph families extracted |
| `STAR 3` | all 5 unique natural Small Glyph families extracted |

The authoritative fact is committed natural family-essence extraction, not physical visibility, targeting, transport, possession or an extraction attempt. Special Ether Small Glyph `VI` is outside this five-family threshold sequence. This contract specifies the rule only and does not implement or own a counter.

### Rune Stones

Natural Rune Stone knowledge progression counts only committed installation of the five natural Rune families (`K / T / S / L / R`).

| Stage | Availability threshold |
| --- | --- |
| `STAR 1` | 2 unique natural Rune families installed |
| `STAR 2` | 4 unique natural Rune families installed |
| `STAR 3` | all 5 unique natural Rune families installed |

Tuning, physical visibility, targeting, transport, readiness and installation attempts do not count. Ether is special and never counts as a sixth natural Rune family.

The Ether Rune identity and all Ether-specific Rune knowledge remain unavailable until the authored Monkey Ether explanation has completed successfully. Physical visibility, tuning, targeting or transport of the Ether Rune cannot reveal or imply that knowledge. This teaching gate is independent of the natural `2 / 4 / 5` installation thresholds.

## Terminal knowledge boundary

The final Water Crystal extraction marks the end of ordinary Monkey knowledge discovery. Before the player begins that final Water Crystal extraction, every world-knowledge stage belonging to the completed experience must already be at least `AVAILABLE`.

The player is not required to have completed the deliberate presentation of every stage or to have every stage at `READ`. This boundary prevents new world-knowledge content from first becoming discoverable after the experience has entered its final guided exit sequence.

This is a deadline invariant, not a new Scenario point or transition. A future integration must satisfy it using authoritative domain events without adding progression semantics here.

## Explicitly unresolved bindings

All master-source knowledge categories retain the global exactly-three-star model. Apart from Shells, Small Glyphs and Rune Stones, their concrete unlock triggers and fragment-to-star mappings are explicitly unresolved.

Future work must author those bindings separately. It must not guess them from fragment numbering, physical visibility, current Scenario points, nearby communications or analogous domain events. Any completed-experience stages authored later remain subject to the final-Water availability deadline.
