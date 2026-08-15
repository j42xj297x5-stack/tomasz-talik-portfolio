# Dependency Map

## Documentation flow

[`README.md`](../../../README.md) → [`docs/README.md`](../../README.md) → [`maps/PROJECT_INDEX.md`](PROJECT_INDEX.md) → najmniejszy task-specific current model. Zasady dowodów i walidacji: [`COLLABORATION_PROTOCOL.md`](../operations/COLLABORATION_PROTOCOL.md).

## Experience VR composition

```text
experienceVr bootstrap
→ preload all assets
→ nullable runtimeExperience binding (construction-safe)
→ Scenario → Director → RuntimeExperience → actors/domain owners
→ READY
```

`canUseAstroProduction` jest `false` przed pełnym bindem i deleguje do rzeczywistego gate po bindzie. Ten bootstrap fix jest **HARDWARE VALIDATED — Meta Quest 3S** dla przejścia poza `41/41`; nie kwalifikuje pozostałego flow.

## Authored progression and production

```text
2.30 durable 5/5
→ FIRST_RING_COMPLETED → 2.40
→ createVrFirstRingFlow presentation complete
→ 3.10 shell-field presentation (non-interactive)
→ 3.20 observation
→ 3.30 player-opened Monkey dialogue
→ 3.40 Furnace reveal
→ 3.50 conscious Astro production request
→ 3.60 ASTRO_ATTRACTOR_CONSTRUCTION
→ 3.70 physical AVAILABLE in chamber
→ 3.80 physical claim / EARNED
→ CAN_EQUIP_ASTRO + CAN_SCAN_SHELLS + CAN_TARGET_SHELLS
```

```text
createVrAstroAttractorProductionController
  READY → BUILDING → AVAILABLE → CLAIMING → EARNED
  ↓ physical output under VR_FURNACE_CONTENT_ANCHOR
createVrAttractorTool (single gameplay equipment object)
```

Production representation i gameplay equipment mają rozdzielone lifecycle ownership. `CLAIMING` nie jest story point. Furnace mode `astro_attractor` i `ASTRO_ATTRACTOR_CONSTRUCTION` są odrębne od Asterion mode i `ASTERION_CONSTRUCTION`, ale używają shared Furnace process driver.

## Existing domain mechanics versus authored boundary

Shell targeting, Furnace material progression and Asterion production/control mogą istnieć jako domenowe runtime mechanics. Nie stanowią ukończonego authored mainline po `3.80`. Rune Stones, małe glify i dalsze akty pozostają future systems. Hydration, arbitrary start, reconstruction-backed checkpoints i durable save pozostają deferred.
