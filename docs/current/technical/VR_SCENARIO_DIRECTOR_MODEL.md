# Experience VR Scenario and Director Model

Status: **CURRENT / BINDING**, synchronized on 2026-09-11. Runtime graph and reconstruction are implemented through stable `5.10`.

> **Cross-reference — CANONICAL TARGET / IMPLEMENTATION PENDING:** Live sandbox catch-up/reconciliation is defined in [`VR_SCENARIO_SANDBOX_RECONCILIATION.md`](VR_SCENARIO_SANDBOX_RECONCILIATION.md). The reconciliation runtime is not yet implemented.

## Ownership

`Spine → Scenario → Director → Runtime / domain owners`. Scenario owns authored dramaturgy, accepted semantic events, entry effects and genuinely story-owned capabilities. **Scenario capabilities are not a generic sandbox permission registry.** Director owns the current point and graph interpretation. Runtime/domain owners retain physical and committed gameplay truth; point IDs and debug aliases never replace that truth. In particular, ordinary Astrolabium equip, band switching, scan, target, pull and natural Small Glyph extraction rights remain physical/domain laws rather than Scenario capabilities. Genuine story permissions, including Ether tuning, the Water special path and advanced Resonator use, remain Scenario-owned and do not recreate ordinary natural-family eligibility.

`CAN_USE_GLYPHS` is the Intro boundary for ordinary Large Glyph ray interaction. It first appears at `2.10 — GLYPH_FREE_EXPLORE` and remains continuous at every later canonical mainline point, including transitional and production choreography. It does not express Astrolabium Large Glyph family knowledge, Resonator `PULL_READY`, or portfolio crystal eligibility: after `2.10`, physical ray reach and `getNextCrystalTier(node)` remain the independent restrictions on ordinary crystal acquisition.

## Authored spine

```text
1.10 → … → 4.10 → 4.20 → 4.30 → 4.40 → 4.50 → 4.60 → 4.70 → 4.75 → 3.80 → 4.80 → 5.10
```

| Point | CURRENT role |
| --- | --- |
| `4.70` | Proto-Astro tuning and third-ring sandbox gameplay |
| `4.75` | mandatory third-ring completion presentation; waits for Large Glyph `SPHERE_FAR` settlement |
| `3.80` | post-third-ring Asterion frontier; waits for the real Asterion claim |
| `4.80` | third ring complete; waiting for the existing physical Resonator result |
| `5.10` | stable third-ring + Resonator join; current authored/runtime boundary |

`4.70` accepts the real `TIER_COMPLETED` result and enters `4.75`. On entry, `4.75` executes the authored tier-completion feedback and begins the legal Large Glyph distribution to `SPHERE_FAR`; only `THIRD_RING_COMPLETION_PRESENTATION_COMPLETED` advances it to `3.80`. Point ordering follows these authored graph edges, not numeric point-ID comparison.

`4.80` targets `5.10`, enters with `SET_MAIN_AMBIENT_04` and `CHECK_RESONATOR_JOIN`, and accepts `RESONATOR_READY`. The check covers the event order in which Resonator already exists on entry. Otherwise `resonatorExists === true` is projected as `RESONATOR_READY`. This semantic join does not gate or own Resonator creation.

`5.10` has no entry effects, CURRENT OBJECTIVE, transitions or blocking entry dialogue. It has no direct transition to `100.10`; the latter remains a separate story terminal used by an earlier explicit Intro choice.

## CURRENT OBJECTIVE

The read-only Guidance projection derives these exact live strings:

- `2.30`: `UKOŃCZ PIERWSZY KRĄG — n/5`
- `3.80`: `ZGROMADŹ SKORUPY — n/6`, `ZBUDUJ KULĘ ASTERIONOWĄ`, `KULA ASTERIONOWA — PRODUKCJA` or `ODBIERZ KULĘ ASTERIONOWĄ`
- `4.10`: `UKOŃCZ DRUGI KRĄG — n/5`
- `4.70`, incomplete Proto-Astro tuning: `DOSTRÓJ ASTROLABIUM — n/5 · UKOŃCZ TRZECI KRĄG — n/5`
- `4.70`, full tuning: `UKOŃCZ TRZECI KRĄG — n/5`
- `4.80`, while Resonator does not exist: `PRZYGOTUJ REZONATOR — STROJENIE n/3 · INSTALACJA n/3`
- `4.80`, when Resonator exists, and `5.10`: no objective.

## Reconstruction and debug aliases

`stateAt(X)` folds settled consequences strictly before `X` and never recreates transient interactions. Thus `stateAt(4.70)` remains pre-completion, `stateAt(4.75)` enters rather than pre-settles the completion presentation, and later points reconstruct the settled Ring 3 / `SPHERE_FAR` result. Hydration/direct activation/reset must not replay live-only discovery Guidance.

`P5 → 4.80` and `P6 → 5.10` are implemented debug/QA aliases only. Neither owns gameplay truth, capability truth or Scenario consequences; canonical hydration remains `stateAt → reconstruction → activate`.

## Boundary

Rune tuning, transport, installation, Binder readiness, sector control and Resonator creation are independent domain laws. Scenario observes their semantic results. Discovery Guidance through the first Resonator is implemented; physical Resonator target response, Metal/Water/Ether progression and later finale authoring remain future. Rune authority: [`VR_RUNE_STONES_MODEL.md`](VR_RUNE_STONES_MODEL.md). Resonator authority: [`VR_ASTERION_RESONATOR_MODEL.md`](VR_ASTERION_RESONATOR_MODEL.md).
