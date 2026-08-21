# Experience VR Gameplay Roadmap

Status: **CURRENT concept roadmap**. Runtime authority: [`VR_RUNTIME_MODEL.md`](../technical/VR_RUNTIME_MODEL.md); Proto-Astro authority: [`VR_PROTO_ASTRO_MODEL.md`](../technical/VR_PROTO_ASTRO_MODEL.md).

## IMPLEMENTED

- authored Scenario przez Tier 2, radial presentation `4.20`, small glyph field presentation `4.30` i stable boundary `4.40`;
- deterministic world-stable small glyph field: 6 wariantów, po 2 instancje;
- semantic input B i dokładnie dwa runtime bands: `SHELLS`, `SMALL_GLYPHS`;
- small glyph scan/target/pull, left-hand handoff i return do authored field transform;
- jeden Furnace chamber owner dla shells i small glyphs;
- natural essence extraction `K/T/S/L/R`, persistent `extractedFamilyCodes` oraz implemented `canAttractLargeGlyph` domain seam.

Brak `PLACED`, inventory i persistent small-glyph ownership. VI pozostaje interaktywnym small glyphem, ale nie jest P2 tunable.

## NEXT BOUNDED GAMEPLAY STAGE — APPROVED / NOT IMPLEMENTED

Najbliższa realna granica to `LARGE_GLYPHS` band wraz z family-gated large-glyph targeting opartym na pobranych esencjach. Rzeczywisty targeting/pull, jego physics/capture/completion oraz authored P2 continuation nie istnieją. Semantyczna integracja paneli Astrolabium może wejść w tym samym lub kolejnym ograniczonym etapie; nie jest ukończona.

## LATER — APPROVED / NOT IMPLEMENTED

- `RUNESTONES` band i mechanika Rune Stones;
- dalsze akty, radar/sector targety, spatial audio, durable persistence i full-game reset.

## RESERVED / NOT YET DESIGNED

VI/Eter z odpowiadającą rodziną poziomu 6 skorup jest zarezerwowane dla późnego finału Haiku Cosmos. Recipe, placement i final flow pozostają otwarte. Band identity jest semantyczne; dokładne kolory i symbole nie są ustalone.

## QA

Bootstrap READY zachowuje istniejące **HARDWARE VALIDATED — Meta Quest 3S**. Nowy zakres P2/small glyph nie otrzymuje przez tę synchronizację hardware/perceptual PASS.
