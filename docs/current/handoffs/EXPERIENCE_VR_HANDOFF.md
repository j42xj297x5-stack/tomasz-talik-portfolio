# Experience VR — Current Handoff

Status: **CURRENT operational snapshot** po Large Glyph Actor migration M7B (`2026-08-23`). Canonical authority: [`VR_RUNTIME_MODEL.md`](../technical/VR_RUNTIME_MODEL.md), [`VR_PROTO_ASTRO_MODEL.md`](../technical/VR_PROTO_ASTRO_MODEL.md) i [`VR_SCENARIO_DIRECTOR_MODEL.md`](../technical/VR_SCENARIO_DIRECTOR_MODEL.md).

## Implemented snapshot

- `LargeGlyphActor` jest jednym physical/spatial ownerem pięciu Large Glyphs pod `WorldStableRoot`.
- Jeden rigid `RotationRoot` posiada pięć identity slots `KA/TA/SA/LA/RA`, rozdzielonych o `72°`; `TransientRoot` posiada leased physical nodes podczas pull/return.
- Canonical stages to `RING_INITIAL` (`8.5 m`), `RING_ELEVATED` (`+2.4 m`) i `RING_EXPANDED` (`18.5 m`). Actor posiada elevation, expansion, presentation visibility, targeting range, hydration, reset i dispose.
- `worldBaseRadius = 7.6 m` jest niezależnym contractem locomotion/platform/spherical layers; nie pochodzi z Large Glyph actor radius.
- `LARGE_GLYPHS` band, family-gated scan/target/pull, `canAttractLargeGlyph` oraz real transient return do live canonical slotu są **IMPLEMENTED**. Naturalne pary to `KI↔KA`, `TI↔TA`, `SI↔SA`, `LI↔LA`, `RI↔RA`; `VI` nie odblokowuje Large Glyph.
- Scenario reconstruction konsoliduje spatial truth wyłącznie jako `largeGlyphs.stage`: settled `3.10 → RING_ELEVATED`, settled `4.20 → RING_EXPANDED`; `stateAt(4.30)` zawiera expanded actor stage.
- Large Glyph nie jest spherical layer. `18.5 m` świadomie przecina Small Glyph volume `17.1–24.7 m`; overlap jest **ACCEPTED PRODUCT DECISION** i nie zmienia layer registry.

## Hardware validation

**HARDWARE VALIDATED — Meta Quest 3S:** Wizjoner potwierdził aktualny zmigrowany Large Glyph flow po M7A, wyłącznie w zakresie migracji Large Glyph Actor M1–M7A. Nie jest to walidacja całego P2, Small Glyph Furnace extraction, Paneli 2–4, wszystkich audio paths ani przyszłych features.

## Future boundary

`SPHERE_FAR` jest **FUTURE / NOT AUTHORED / NOT IMPLEMENTED**. `RUNESTONES`, Panele 2–4, VI/Eter finale i future long-range attraction wymagają własnego authoringu/designu; nie wynikają z ukończenia migracji.

## Reconstruction snapshot

`stateAt(4.20)` zachowuje `largeGlyphs.stage = RING_ELEVATED`; `stateAt(4.30)` zachowuje `largeGlyphs.stage = RING_EXPANDED`; `stateAt(4.40)` dodaje materialized Small Glyph field. Rekonstrukcja nie odtwarza transient pull/return ani live process state.

## Current P2 completion contract (4.40–4.80)

The implemented canonical boundary is `4.80`. Point `4.40` owns a dedicated observation window; `4.50` exposes Monkey attention only; `4.60` plays the mandatory P2 message; `4.70` grants the existing B, Small Glyph, Furnace essence, family-gated Large Glyph, crystal, Reliquary and order-3 card rights; five order-3 cards complete into stable point `4.80`.

Mandatory Monkey communication uses one guidance contract: attention arcs never start copy; pointing and triggering Monkey consumes the trigger for the mandatory beat; ordinary menu, history and knowledge stay hidden through attention and playback; the menu returns only after the final automatic block. This contract is active for the post-ring message at `3.30` and P2 at `4.50–4.60`.

Stable reconstruction at `4.80` contains completed Tier 3, all page IDs/orders through 3, progress-floor completion through Tier 3, consumed crystal Tier 3, and Proto-Astro natural essences `K/T/S/L/R`. It reconstructs no transient pulls, held objects, timers or panels. P3 and later mechanics are not implemented.
