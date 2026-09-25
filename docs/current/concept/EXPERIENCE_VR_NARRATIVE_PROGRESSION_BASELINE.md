# Experience VR — Narrative Progression Baseline

Status: **CURRENT**, synchronized with the implemented Scenario on 2026-09-25.

## Current player route

```text
1.10 → … → 2.30 → … → 3.80 → 4.10 → … → 4.70 → 4.75 → 3.80 → 4.80
→ 5.10 → 5.15 → 5.20 → 5.30 → 5.40 → 5.50 → 5.60 → 5.70 → 5.80
→ 6.10 → 6.20 → 6.30 → 100.10
```

The repeated `3.80` is intentional: before the later rings it is the Astro-claim boundary; after `4.75`, the authored graph returns there for the Asterion frontier. Route order follows Scenario edges, not numeric point IDs.

## Implemented late progression

`4.80` waits for the physical Resonator result. Existing domain truth joins through semantic `RESONATOR_READY`, with `CHECK_RESONATOR_JOIN` covering a Resonator created before entry. `5.10` then joins Tier 4 completion with the fourth natural Rune; when both are ready, the route continues rather than ending.

| Point | Narrative/progression role |
| --- | --- |
| `5.10` | Stable third-ring/Resonator join while Tier 4 and the fourth natural Rune converge. |
| `5.15` | Fourth Ring and Metal are complete; the player makes the controlled final Water acquisition attempt. |
| `5.20` | The rejected Water attempt begins the Monkey/Ether intervention. |
| `5.30` | Ether tuning becomes available. |
| `5.40` | The tuned Ether Rune is revealed and its transport/capture beat becomes available. |
| `5.50` | Ether capture opens the Water installation path. |
| `5.60` | Five elemental Runes are installed and the full Resonator is unlocked/acknowledged. |
| `5.70` | The final Water Glyph and final portfolio completion beat are active. |
| `5.80` | Final portfolio completion begins the Monkey farewell. |
| `6.10` | Farewell completion begins final world release. |
| `6.20` | World release completes into end credits. |
| `6.30` | Credits complete into the final Orange Monkey VR brand slate. |
| `100.10` | The completed route exits the XR experience. |

This table records only the implemented narrative spine and the semantic results that advance it. It does not redefine Resonator targeting, Water synchronization, Rune transport/installation, audio cues, literal localized copy or finale visuals; those contracts remain with their dedicated current documents and runtime owners.

The Intro's optional authored exit choices are alternate early branches: after the full Monkey exit reaction they explicitly reach the same `100.10` terminal. They are not the canonical late mainline and do not shorten the implemented player-route baseline above.

## Ownership

Scenario owns dramaturgy, canonical progression, accepted semantic results, story capabilities and symbolic entry effects. Director owns the current point, legal transitions and one-time activation. `RuntimeExperience` executes symbolic effects against the actors/domain owners composed by `experienceVr.js`.

Rune, sector, Resonator, portfolio and finale owners retain their physical and committed truth. Guidance and Y remain read-only communication projections. `stateAt(X)` reconstructs history-derived settled state before `X`; activating `X` then performs that point's one-time entry semantics. Detailed mechanics and literal copy belong to [`EXPERIENCE_VR_COMMUNICATION_MECHANICS.md`](EXPERIENCE_VR_COMMUNICATION_MECHANICS.md), [`EXPERIENCE_VR_PLAYER_COMMUNICATION_COPY.md`](EXPERIENCE_VR_PLAYER_COMMUNICATION_COPY.md), and the relevant technical subsystem models.

Historical proposals that stopped at `5.10` or treated the implemented Ether/finale route as future are superseded. Genuine future work begins with extensions or presentation/detail contracts not present in the current Scenario graph; it does not include the implemented mainline through `100.10`.
