# Experience VR Gameplay Roadmap

Status: **CURRENT concept roadmap**. Runtime authority: [`VR_RUNTIME_MODEL.md`](../technical/VR_RUNTIME_MODEL.md); Proto-Astro authority: [`VR_PROTO_ASTRO_MODEL.md`](../technical/VR_PROTO_ASTRO_MODEL.md).

## IMPLEMENTED — CURRENT RUNTIME

- authored Scenario przez Tier 2, radial presentation `4.20`, entry beat materializacji small glyph field w `4.30` oraz stable boundary `4.40`;
- checkpointy debug są wyłącznie aliasami canonical lifecycle: `P1 → 2.10`, `P2 → 3.10`, `P3 → 4.10`, `P4 → 4.30`; wszystkie używają spawnu `RING` i normalnego `activatePoint()` bez osobnego stanu QA;
- deterministic, world-stable small glyph field: 6 wariantów po 2 instancje, presentation materialization i hydration;
- semantic input `B` i dokładnie dwa aktywne runtime bands: `SHELLS`, `SMALL_GLYPHS`;
- Small Glyph scan/target/pull oraz transport `FIELD → TARGETING → PULLING → CAPTURE_READY → HELD → PLACED → HELD`: przejęcie lewą Szpilą, world-stable placement i ponowne przejęcie są zaimplementowane;
- jeden Furnace chamber/content owner dla shells i Small Glyph; istniejąca ekstrakcja naturalnych rodzin `K/T/S/L/R`, persistent `extractedFamilyCodes` oraz domain seam `canAttractLargeGlyph`;
- VI jest pełnym Small Glyph w field i handoff/placement, ale obecnie nie daje esencji ani nie odblokowuje Large Glyph;
- Panel 1 Astrolabium pokazuje aktualny target; właściwa projekcja glyph SVG dla shell jest zaimplementowana. Uniwersalna obsługa kolejnych klas targetu, w tym Small Glyph, nie jest jeszcze ukończona.

Nie ma inventory ani persistent ownership Small Glyph. Ponowne użycie instancji po procesie zachowuje canonical field contract.

## APPROVED WORK QUEUE — NOT IMPLEMENTED

Poniższe etapy są uporządkowaną kolejką. Nie stanowią opisu aktualnego runtime.

### A. RADIAL LAYOUT + MOTION

Docelowa kolejność radialna: **platforma → skorupy → małe glify → duże glify**.

- Small Glyph przechodzą na własną docelową orbitę, wewnątrz przyszłej orbity Large Glyph;
- orbita Small Glyph porusza się przeciwnie do pola skorup;
- każdy Small Glyph otrzymuje także powolną rotację wokół lokalnego środka ciężkości, analogicznie do skorup;
- dokładne promienie i prędkości pozostają tuningiem.

### B. SMALL GLYPH AUDIO

Podłączyć istniejący i już przypisany dźwięk przyciągania Small Glyph. Nie projektować nowego assetu audio.

### C. SMALL GLYPH HANDOFF / SZPILA

Mechanika `HELD → PLACED → HELD` jest **IMPLEMENTED**, nie jest zadaniem implementacyjnym. Pozostaje w zakresie hardware QA i ewentualnego dopracowania razem z dalszym flow Small Glyph.

### D. ASTROLABIUM WIĘZI / FURNACE

Docelowa player-facing nazwa narzędzia to **Astrolabium Więzi**. Nie wymaga to masowego rename wewnętrznych identyfikatorów `AstroAttractor`.

Furnace ma otrzymać osobny moduł/wejście **Astrolabium Więzi**, zawierające docelowo co najmniej:

1. utworzenie Astro Przyciągacza;
2. późniejsze strojenie pasma Astrolabium Więzi.

UI i jego flow nie są jeszcze implementowane w tym zakresie.

### E. SMALL GLYPH FURNACE PROCESS

Docelowo przez Piec przechodzi wszystkich 6 typów Small Glyph. Proces otrzymuje player-facing feedback analogiczny do ekstrakcji skorup:

- właściwy obiekt/proces w Piecu;
- informację na ekranie/panelu Pieca o pozyskiwaniu;
- wynik używany dalej przez strojenie Astrolabium Więzi.

Ta decyzja zastępuje starsze założenie, że VI jest całkowicie poza takim processingiem. Szczegółowy rezultat VI i późny finał Eteru pozostają nieustalone, dopóki nie wynikają z authored kanonu.

### F. ASTROLABIUM TARGET PREVIEW

Panel 1 oznacza aktualny target. Shell i Small Glyph mają otrzymać własne właściwe projekcje SVG; dla Small Glyph przyszła implementacja wykorzysta istniejące przyporządkowane krzywe/SVG z repozytorium, tak jak aktualna obsługa skorup.

### G. DALSZE BANDY

Backlog bandów, bez aktywowania ich w runtime:

- `LARGE_GLYPHS` → zielony scan cone;
- `RUNESTONES` → niebieski;
- późne dalekie wyszukiwanie dwóch glifów → fioletowy;
- finalne wyszukiwanie Haiku Cosmos → tęczowy.

### H. DALSZA PROGRESJA

Po powyższym pozostają:

- real `LARGE_GLYPHS` band;
- family-gated targeting/pull dużych glifów;
- `RUNESTONES`;
- późna authored progression.

## QA

Bootstrap READY zachowuje istniejące **HARDWARE VALIDATED — Meta Quest 3S** wyłącznie dla wcześniej potwierdzonego zakresu. `4.20`, `4.30`, `4.40`, Small Glyph field, przełączanie bandów, pull/handoff/placement i Furnace extraction nie otrzymują przez tę synchronizację hardware/perceptual PASS. P4 wymaga potwierdzenia na urządzeniu, że canonical entry `4.30` rozpoczyna normalny beat materializacji.
