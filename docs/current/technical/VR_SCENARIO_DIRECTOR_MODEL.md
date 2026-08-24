# Experience VR — Scenario, Director i progresja

Status: **CURRENT / BINDING**. Standard authoringu nowych pointów: [`VR_SCENARIO_POINT_AUTHORING_STANDARD.md`](VR_SCENARIO_POINT_AUTHORING_STANDARD.md). Proto-Astro domain: [`VR_PROTO_ASTRO_MODEL.md`](VR_PROTO_ASTRO_MODEL.md).

## Ownership

```text
Spine → Scenario → Director → RuntimeExperience → actors / domain owners
```

Spine posiada kolejność, Scenario znaczenie pointów/capabilities/consequences, Director jedyne globalne `currentPointId` i legalność transition, Runtime wykonuje effects, a actors/domain owners posiadają mechanics i prawdę domenową. Ogólne invariants architektury pozostają bez zmian.

## Canonical Spine

```text
1.10 → 1.20 → 1.30 → 1.40 → 1.50 → 1.60 → 1.70 → 1.80
→ 1.90 → 1.100 → 1.110 → 1.120 → 1.130
→ 2.10 → 2.20 → 2.30 → 2.40
→ 3.10 → 3.20 → 3.30 → 3.40 → 3.50 → 3.60 → 3.70 → 3.80
→ 4.10 → 4.20 → 4.30 → 4.40 → 100.10
```

`100.10` pozostaje canonical story terminalem i convergence pointem exitów. `4.40` ma `canonicalMainline.target = 100.10`, ale **nie ma transition**: jest stabilną bieżącą granicą gameplayową i nie auto-advance'uje do terminala. WHERE, FOLLOW pause, BEYOND i hinty pozostają lokalnymi `STAY`.

## Intro, pierwszy ring i post-ring

Intro oraz pierwszy cykl Glyph → Crystal → Reliquary prowadzą do trwałego `2.30 5/5`, `2.40` i authored presentation `3.10–3.30`. `3.40–3.80` authoruje Furnace reveal, świadomą produkcję, fizyczną dostępność i claim Astro. Shell/Furnace/Asterion loop jest aktywną domeną w `3.80`; claim Asteriona przeprowadza do `4.10`.

## P2 — IMPLEMENTED / AUTHORED

| Point | Beat i completion | Stabilny skutek po ukończeniu |
| --- | --- | --- |
| `4.10` | drugi Glyph → Crystal → Reliquary; `TIER_COMPLETED` dla Tier 2 kończy fazę | canonical Tier 2 progression/floor/crystal completion |
| `4.20` | target entry `BEGIN_P2_RADIAL_PRESENTATION`; actor rozszerza Large Glyph structure; completion `P2_RADIAL_PRESENTATION_COMPLETED` | `largeGlyphs.stage = RING_EXPANDED` |
| `4.30` | target entry `BEGIN_SMALL_GLYPH_FIELD_PRESENTATION`; materializacja field; completion `SMALL_GLYPH_FIELD_PRESENTATION_COMPLETED` | `smallGlyphField.materialized = true` |
| `4.40` | stable P2 Proto-Astro integration boundary | brak transition i brak własnej settled consequence |

`4.40` posiada capabilities dla Astro equipment, shells, B band switching, small-glyph scan/target/pull, Large Glyph scan/target/pull, Furnace, natural small-glyph essence extraction oraz istniejącej kontroli Asteriona/platformy. Szczegółowy podział ownerów opisuje [`VR_PROTO_ASTRO_MODEL.md`](VR_PROTO_ASTRO_MODEL.md).

## Reconstruction i hydration

Obowiązuje `stateAt(X) = fold(settledConsequences pointów ściśle przed X)`:

- po settled `3.10` prawdą aktora jest `largeGlyphs.stage = RING_ELEVATED`;
- `stateAt(4.20)` zawiera stabilną prawdę ukończenia Tier 2 oraz `largeGlyphs.stage = RING_ELEVATED`;
- `stateAt(4.30)` dodatkowo zawiera `largeGlyphs.stage = RING_EXPANDED`;
- `stateAt(4.40)` dodatkowo zawiera `smallGlyphField.materialized = true`.

Bieżące `stateAt(4.40)` nie authoruje `protoAstroTuning.extractedFamilyCodes`. Direct activation `4.40` poprawnie odtwarza canonical P2 world i startuje TuningController z pustym zestawem esencji. Hydrator ma już owner section `protoAstroTuning` dla przyszłych authored consequences. Rekonstrukcja nie odtwarza transient pull/hold/process.

Designer checkpoint jest aliasem QA, nie drugim pointem ani źródłem capabilities. P3 nie jest jedyną późną reconstruction-backed możliwością: production `stateAt/activatePoint` obejmuje canonical pointy przez `4.40` w opisanym zakresie. `100.10` pozostaje niedozwolonym reconstruction startem. Nazwy przyszłych P3/P4 etapów narracyjnych nie zmieniają obecnej granicy.

## Communication i domain seams

Scenario authoruje należność progression beats, ale Guidance renderuje komunikację. Dynamic Monkey knowledge, Player Guide current task/tools oraz B line są runtime projections capabilities/domain truth. Tuning truth nie należy do Directora ani Scenario.

## APPROVED / NOT IMPLEMENTED

- semantyczna integracja czterech paneli Astrolabium poza istniejącą projekcją Panelu 1;
- dalsze authored P2 continuation i completion point;
- `RUNESTONES` i późniejsze akty.

Nie ustalono finalnego cyklu B ani kolorów/symboli przyszłych bands. Po `4.80` zatwierdzony target przenosi pięć już zestrojonych naturalnych Large Glyph do `SPHERE_FAR = 80 m`; późniejszy retreat po `FOURTH_RUNE_INSTALLED` nie ma jeszcze promienia. VI/Eter jest specjalnym authored beatem Małpy nadającym Water-only eligibility override, nie szóstą rodziną/sektorem.

## Bootstrap i QA

Wizjoner potwierdził przejście poza preload `41/41` i brak zatrzymania przed READY: **HARDWARE VALIDATED — Meta Quest 3S** wyłącznie dla bootstrap fixu. `4.20–4.40`, small glyph field, B switching, pull/handoff i Furnace essence extraction pozostają hardware/perceptual QA pending; ten dokument nie podnosi ich statusu.

## Current P2 completion contract (4.40–4.80)

The implemented canonical boundary is `4.80`. Point `4.40` owns a dedicated observation window; `4.50` exposes Monkey attention only; `4.60` plays the mandatory P2 message; `4.70` grants the existing B, Small Glyph, Furnace essence, family-gated Large Glyph, crystal, Reliquary and order-3 card rights; five order-3 cards complete into stable point `4.80`.

Mandatory Monkey communication uses one guidance contract: attention arcs never start copy; pointing and triggering Monkey consumes the trigger for the mandatory beat; ordinary menu, history and knowledge stay hidden through attention and playback; the menu returns only after the final automatic block. This contract is active for the post-ring message at `3.30` and P2 at `4.50–4.60`.

Stable reconstruction at `4.80` contains completed Tier 3, all page IDs/orders through 3, progress-floor completion through Tier 3, consumed crystal Tier 3, and Proto-Astro natural essences `K/T/S/L/R`. It reconstructs no transient pulls, held objects, timers or panels. P3 and later mechanics are not implemented.

Późny Rune Stone Act zachowuje `SPINE → SCENARIO → DIRECTOR → RuntimeExperience → actors/domain owners`. Scenario authoruje wyłącznie znaczące beaty i semantic `START`/`SUCCESS` oraz ewentualny przyszły `TIMEOUT` finalnego hunt. Nie tworzy pointów dla Furnace timera, pull, bridge interpolation, antenna tracking frame, odliczania każdej sekundy ani socket capture. Ether/Monkey actor wykonuje prezentację, `RuneStoneProgressionController` posiada Water override, a transient timer `180 s` (**TUNING**) należy do final-hunt ownera i startuje dopiero po pełnej instalacji Water oraz rzeczywistym rozpoczęciu `FINAL_WATER_HUNT`. `FINAL_HUNT_TIMEOUT_BEHAVIOR` pozostaje **OPEN DESIGN DECISION**.
