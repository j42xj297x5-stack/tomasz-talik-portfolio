# Experience VR — Narrative & Progression Baseline

Status: **CURRENT / canonical** jako lekka orientacja w przebiegu doświadczenia. Technicznym źródłem Scenario jest [`VR_SCENARIO_DIRECTOR_MODEL.md`](../technical/VR_SCENARIO_DIRECTOR_MODEL.md), a identity/tuning opisuje [`VR_PROTO_ASTRO_MODEL.md`](../technical/VR_PROTO_ASTRO_MODEL.md).

## IMPLEMENTED / AUTHORED — aktualna droga gracza

Intro prowadzi do pierwszego cyklu Glyph → Crystal → Reliquary i pierwszego ringu. Post-ring odsłania skorupy oraz Piec; gracz wytwarza i fizycznie odbiera Astrolabium, kompletuje skorupy, buduje Kulę Asterionową i przejmuje kontrolę nad platformą.

Drugi ring jest authored i kończy Tier 2. Następnie duże glify odsuwają się radialnie poza zwykły zasięg, a świat materializuje pole małych glifów. B przełącza Astrolabium między dostępnymi pasmami `SHELLS` i `SMALL_GLYPHS`. Gracz może namierzyć, przyciągnąć i przejąć mały glif, a po puszczeniu glif wraca do pola. Naturalny small glyph można przetworzyć w Piecu, zdobywając trwałą rodzinną esencję dla Astrolabium bez trwałego zużywania fizycznego reliktu. Esencja udostępnia rodzinny Large Glyph w zielonym bandzie; glif można przyciągnąć do bezpiecznego stand-off i odesłać do bieżącego slotu orbity.

```text
1.10 → … → 3.80 → 4.10 → 4.20 → 4.30 → 4.40 → 100.10
```

`4.40` jest aktualną stabilną granicą gameplayową bez transition; terminal `100.10` pozostaje w Spine, ale nie następuje automatycznie.

## NEXT / NOT YET AUTHORED

**APPROVED / NOT IMPLEMENTED:**

- dalsza authored progresja P2;
- później `RUNESTONES` i dalsze akty.

**RESERVED / NOT YET DESIGNED:** późniejsza rola VI/Eter i level-6 shell family w finale Haiku Cosmos.

## Komunikacja

Świat pokazuje, Małpa pomaga zrozumieć, Y pomaga pamiętać, a gracz decyduje, ile chce wiedzieć. Automatyczne messages nie używają `DALEJ`; Guidance projektuje istniejącą prawdę, nie posiada progresji.

## Hardware status

Tylko dotychczas potwierdzony bootstrap READY ma status **HARDWARE VALIDATED — Meta Quest 3S**. P2 `4.20–4.40`, Small Glyph i Large Glyph attraction pozostają hardware/perceptual QA pending.

## Current P2 completion contract (4.40–4.80)

The implemented canonical boundary is `4.80`. Point `4.40` owns a dedicated observation window; `4.50` exposes Monkey attention only; `4.60` plays the mandatory P2 message; `4.70` grants the existing B, Small Glyph, Furnace essence, family-gated Large Glyph, crystal, Reliquary and order-3 card rights; five order-3 cards complete into stable point `4.80`.

Mandatory Monkey communication uses one guidance contract: attention arcs never start copy; pointing and triggering Monkey consumes the trigger for the mandatory beat; ordinary menu, history and knowledge stay hidden through attention and playback; the menu returns only after the final automatic block. This contract is active for the post-ring message at `3.30` and P2 at `4.50–4.60`.

Stable reconstruction at `4.80` contains completed Tier 3, all page IDs/orders through 3, progress-floor completion through Tier 3, consumed crystal Tier 3, and Proto-Astro natural essences `K/T/S/L/R`. It reconstructs no transient pulls, held objects, timers or panels. P3 and later mechanics are not implemented.
