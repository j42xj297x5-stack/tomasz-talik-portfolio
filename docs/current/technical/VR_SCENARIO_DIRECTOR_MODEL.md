# Experience VR Scenario and Director Model

Status: **CURRENT / BINDING**, synchronized on 2026-09-01. Runtime graph and reconstruction are implemented through stable `5.10`.

## Ownership

`Spine → Scenario → Director → Runtime / domain owners`. Scenario owns authored dramaturgy, accepted semantic events, entry effects and capabilities. Director owns the current point and graph interpretation. Runtime/domain owners retain physical and committed gameplay truth; point IDs and debug aliases never replace that truth.

## Authored spine

```text
1.10 → … → 4.10 → 4.20 → 4.30 → 4.40 → 4.50 → 4.60 → 4.70 → 4.80 → 5.10
```

| Point | CURRENT role |
| --- | --- |
| `4.70` | Proto-Astro tuning and third-ring completion |
| `4.80` | third ring complete; waiting for the existing physical Resonator result |
| `5.10` | stable third-ring + Resonator join; current authored/runtime boundary |

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

`stateAt(X)` folds settled consequences strictly before `X` and never recreates transient interactions. Hydration/direct activation/reset must not replay live-only discovery Guidance.

`P5 → 4.80` and `P6 → 5.10` are implemented debug/QA aliases only. Neither owns gameplay truth, capability truth or Scenario consequences; canonical hydration remains `stateAt → reconstruction → activate`.

## Boundary

Rune tuning, transport, installation, Binder readiness, sector control and Resonator creation are independent domain laws. Scenario observes their semantic results. Discovery Guidance through the first Resonator is implemented; physical Resonator target response, Metal/Water/Ether progression and later finale authoring remain future. Rune authority: [`VR_RUNE_STONES_MODEL.md`](VR_RUNE_STONES_MODEL.md). Resonator authority: [`VR_ASTERION_RESONATOR_MODEL.md`](VR_ASTERION_RESONATOR_MODEL.md).
