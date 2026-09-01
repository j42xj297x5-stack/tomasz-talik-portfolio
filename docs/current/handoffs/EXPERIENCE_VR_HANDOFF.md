# Experience VR — Current Handoff

Status: **CURRENT operational snapshot — 2026-09-01**. Authorities: [`VR_RUNTIME_MODEL.md`](../technical/VR_RUNTIME_MODEL.md), [`VR_SCENARIO_DIRECTOR_MODEL.md`](../technical/VR_SCENARIO_DIRECTOR_MODEL.md), [`VR_RUNE_STONES_MODEL.md`](../technical/VR_RUNE_STONES_MODEL.md) and [`VR_ASTERION_RESONATOR_MODEL.md`](../technical/VR_ASTERION_RESONATOR_MODEL.md).

## Canonical checkpoint

- Scenario is implemented through `4.40 → 4.50 → 4.60 → 4.70 → 4.80 → 5.10`; `5.10` is the stable authored/runtime boundary.
- `P5 → 4.80` and `P6 → 5.10` are debug/QA aliases only and own no gameplay/capability truth or Scenario consequences.
- Natural Rune A9 foundation is complete. Tuning, transport, installation, persistent installed truth and reconstruction remain independent domain mechanics.
- R2A powered-sector acquisition, R2B EARTH/WOOD/FIRE sector control and R4 Resonator core/descriptor are implemented.
- Rune/Binder/Sector/Resonator Guidance through first Resonator and Player Y `WIEDZA` are implemented.
- Physical Resonator target response and later finale remain future.

## Resonator join

```text
Resonator Field Domain.resonatorExists === true
→ semantic RESONATOR_READY
→ Scenario 4.80 → 5.10
```

`4.80` also runs `CHECK_RESONATOR_JOIN`, covering a Resonator that existed before Scenario arrived. Scenario does not gate Resonator creation. `5.10` has no entry effects, objective, transition or blocking dialogue and does not directly continue to `100.10`.

## Guidance and Y

Strict communication arbitration is `MANDATORY > ACQUISITION > OPTIONAL`; started playback is non-preemptible, while obsolete pending/attention work can be cancelled. Early Experience and Rune/Resonator Guidance observe semantic/domain seams without owning gameplay truth. Live discoveries are armed only after activation, so hydration/direct activation/reset does not replay them.

Y contains `STEROWANIE`, `AKTUALNE ZADANIE`, conditional `NARZĘDZIA` and conditional `WIEDZA`. Current session knowledge is `SKORUPY`, `KAMIENIE RUNICZNE`, `ZWORNIKI` and `SEKTOR`; baseline reset clears it and there is no durable game save.

## Rune/sector operational truth

Natural targetability equals tuned Rune families; installation readiness alone reads sector completeness. First Binder `HIDDEN → DOCKED` persists through later `BOUND` and unlocks knowledge without automatic Monkey playback. First installed Rune, first live sector `LOCKED`, and first Resonator feed bounded Guidance reactions. These reactions can precede `4.80` when physical domain state permits.

Reconstruction remains `restoreBaseline → stateAt(X) → hydrate owners → synchronize derived state → Director at X → activate X`. It restores stable domain state without replaying transient movement, attention or discovery one-shots.

## Explicit future boundary

Not implemented: target selection/scoring/response, glyph reacquisition through Resonator, later Metal/Water contribution and special Water/Ether flow, final Water hunt, world dissolution/finale continuation, and explicitly open presentation/audio work.
