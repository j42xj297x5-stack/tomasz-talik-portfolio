# Experience VR — Scenario and Director Model

Status: **CURRENT / BINDING**. Runtime graph and reconstruction are implemented through stable `4.80`; authored continuation is deferred.

## Architecture and ownership

```text
SPINE → SCENARIO → DIRECTOR → RuntimeExperience → actors / domain owners
```

Spine owns authored order, Scenario owns declarative points and settled consequences, Director owns transition legality, RuntimeExperience composes semantic effects, and actors/domain owners retain their own transient or persistent truths. No central gameplay store is introduced.

## Implemented authored graph

```text
1.10 → … → 4.10 → 4.20 → 4.30 → 4.40 → 4.50 → 4.60 → 4.70 → 4.80
```

The implemented P2 tail is:

| Point | Canonical role |
| --- | --- |
| `4.40` | dedicated observation window |
| `4.50` | Monkey attention only |
| `4.60` | mandatory P2 message |
| `4.70` | grants existing B, Small Glyph, Furnace essence, family-gated Large Glyph, Crystal, Reliquary and order-3 card rights |
| `4.80` | stable settled Tier-3 boundary and entry boundary for later Rune Stone authoring |

Five order-3 cards complete into `4.80`. No Scenario point after `4.80` is implemented or authored by the Rune domain foundations. `100.10` remains the story terminal, but it is not presented as a direct implemented gameplay continuation from `4.80`.

## Reconstruction

`stateAt(X)` folds settled consequences strictly before `X`; it never reconstructs held targets, pulls, Furnace cycles, timers or panel UI. Stable `stateAt(4.80)` contains completed Tier 3, page IDs/orders through 3, floor completion through Tier 3, consumed Tier-3 crystal, Proto-Astro essences `K/T/S/L/R`, and `largeGlyphs.stage = SPHERE_FAR`.

Debug `P5 → pointId 4.80 → spawn RING` is **IMPLEMENTED**; P1–P4 are unchanged. `P5` remains an ordinary debug/QA alias, not a Scenario point or capability owner, and owns no settled consequences. Canonical `stateAt → reconstruction → activate` remains the hydration path.

Point `2.10` now has the separate `REVEAL_NATURAL_RUNE_STONES` effect in the same entry beat as `BEGIN_CELESTIAL_REVEAL`. The settled consequence `runeStones.presentationVisible = true` accumulates into later `stateAt` results; this presentation truth neither grants targetability nor changes the graph or point IDs.

## Main-background semantic entries

Scenario owns the CURRENT / BINDING semantic selection of the main background thread; the Ambient Sequencer owns playback mechanics downstream. Existing anchors are:

| Semantic entry | Scenario anchor | Main ambient |
| --- | --- | --- |
| crossing from `1.130` completed; Monkey seated; `GLYPH_FREE_EXPLORE` begins | `2.10` | `ambient_01.mp3` |
| ring 1 completed | `2.40` | `ambient_02.mp3` |
| ring 2 completed | `4.20` | `ambient_03.mp3` |
| ring 3 completed | `4.80` | `ambient_04.mp3` |
| ring 4 completed | future Scenario point after `4.80`; **NOT AUTHORED**, no point ID assigned | `ambient_05.mp3` |

Ring 5 completion is also **FUTURE / NOT AUTHORED** and has no point ID. The Scenario-driven selection above is a binding target, **NOT YET FULLY IMPLEMENTED**: only the `2.10` main-sequence handoff exists, while runtime still derives later selection from the current tier. Playback cycles, global quiet cursor and post-main tail belong to [`VR_AUDIO_MODEL.md`](VR_AUDIO_MODEL.md).

## Rune boundary

Rune A1–A9.4 are partially implemented runtime-domain foundations and do not extend Scenario. Natural tuning, targetability/transport and platform installation readiness remain independent domain laws. Socket capture, persistent installed truth, Water override trigger, Ether flow, further bridge mechanics and every authored continuation after `4.80` are **DEFERRED / NOT IMPLEMENTED**. Authority: [`VR_RUNE_STONES_MODEL.md`](VR_RUNE_STONES_MODEL.md).
