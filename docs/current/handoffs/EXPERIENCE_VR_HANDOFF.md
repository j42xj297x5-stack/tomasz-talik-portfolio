# Experience VR — Current Handoff

Status: **CURRENT**. Operacyjny obraz dla następnego architekta; canonical model szczegółowy: [`VR_SCENARIO_DIRECTOR_MODEL.md`](../technical/VR_SCENARIO_DIRECTOR_MODEL.md).

## IMPLEMENTED

- Intro `1.10–1.130`, pierwszy crystal, świadomy Monkey trigger i Reliquary reveal (`2.10–2.20`).
- Pełny loop pięciu kart Tier 1 w `2.30`.
- First-ring bridge: trwałe `5/5` → `FIRST_RING_COMPLETED` → `2.40`; `createVrFirstRingFlow` posiada presentation/audio seam, a dopiero `FIRST_RING_PRESENTATION_COMPLETED` prowadzi do `3.10`.
- `3.10`: reveal widocznego, jeszcze nieinteraktywnego pola skorup i elevacja głównych glifów.
- `3.20`: około 10 sekund obserwacji.
- `3.30`: attention bez auto-open; gracz świadomie otwiera trzykwestiowy dialogue, a finalne acknowledgement kończy beat.
- `3.40`: real Furnace reveal, `Spójrz na Piec.` / `Tam coś na ciebie czeka.`
- `3.50–3.60`: świadomy wybór `Utwórz astro przyciągacz` i osobny `ASTRO_ATTRACTOR_CONSTRUCTION` na shared Furnace driver.
- `3.70`: physical Astro `AVAILABLE` w komorze, jeszcze nie `EARNED`.
- `3.80`: praworęczny, real-hit, ordinary-ray trigger claim; `ASTRO_ATTRACTOR_CLAIMED` daje `EARNED`, a dopiero wtedy `CAN_EQUIP_ASTRO`, `CAN_SCAN_SHELLS`, `CAN_TARGET_SHELLS`.

Production controller `createVrAstroAttractorProductionController` posiada `READY → BUILDING → AVAILABLE → CLAIMING → EARNED`; `CLAIMING` jest transient. Production clone i gameplay object nie są dwoma narzędziami; equipment obsługuje `createVrAttractorTool`.

## Furnace i panel

Furnace jest revealowany od `3.40`; karta Astro jest gate’owana przez Scenario. Mode `astro_attractor` pozostaje odrębny od Asterion mode, podobnie `ASTRO_ATTRACTOR_CONSTRUCTION` od `ASTERION_CONSTRUCTION`. Output pod `VR_FURNACE_CONTENT_ANCHOR` pozostaje w komorze do claimu.

Panel pokazuje obracającą się proceduralną line-art miniaturę Astro: gładkie krzywe/obręcze i centralne warstwowe jądro, bez ciężkiego GLB wireframe w canvasie. Copy brzmi `Utwórz astro przyciągacz`; canvas ma mocniejszy hover, a fizyczne kontrolki zwiększony emissive hover. Jakość tych elementów nie ma automatycznie statusu hardware validated.

## Bootstrap i dowody

Naprawiony contract pozwala złożyć composition po preloadzie, przed READY: wcześniejszy nullable `runtimeExperience` binding chroni construction callbacks, a `canUseAstroProduction` zwraca `false` przed bindem i rzeczywisty gate po nim. `vr-runtime-bootstrap` odtworzył production regression **RED → GREEN**. Wizjoner potwierdził na Meta Quest 3S przejście poza `41/41` i brak zatrzymania przed READY: **HARDWARE VALIDATED — Meta Quest 3S** tylko dla tego bootstrap fixu.

Automated guards `vr-first-ring-live-flow`, `vr-astro-first-claim-live-flow` i `vr-runtime-bootstrap` nie są hardware/perceptual PASS. Pełny `3.10–3.80`, reveal/materialization, skala/orientacja, hover, physical handoff i shell targeting wymagają osobnego QA Wizjonera.

Director obsługuje także jawny start sesji w dowolnym `startPointId` należącym do canonical Spine, bez odgrywania transition effects i bez rekonstrukcji historii. `initialMilestones` są jawnym bootstrap baseline; hard reset odtwarza je wraz z session start point, a soft reset zachowuje bieżące milestones.

## NEXT

- hardware/perceptual QA pełnego `3.10–3.80`;
- authored progression po `3.80` (obecny STOP BOUNDARY);
- dalsza praca nad skorupami, Piecem i pełnym Asterion loopem;
- późniejsze małe glify, Rune Stones i dalsze akty zgodnie z istniejącym kanonem. Rune Stones pozostają osobnym przyszłym systemem, nie automatycznym następstwem `3.80`.

## DEFERRED

- hydration i owner restore;
- reconstruction-backed checkpoints/QA aliases;
- durable persistence/save i pełny reset;
- pozostałe późniejsze akty, radar i finał.
