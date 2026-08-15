# Experience VR — Current Handoff

Status: **CURRENT**. Operacyjny obraz dla następnego architekta; canonical model szczegółowy: [`VR_SCENARIO_DIRECTOR_MODEL.md`](../technical/VR_SCENARIO_DIRECTOR_MODEL.md).

## IMPLEMENTED

- Intro `1.10–1.130`, pierwszy crystal, świadomy Monkey trigger i Reliquary reveal (`2.10–2.20`).
- Pełny loop pięciu kart Tier 1 w `2.30`.
- First-ring bridge: trwałe `5/5` → `FIRST_RING_COMPLETED` → `2.40`; `createVrFirstRingFlow` posiada presentation/audio seam, a dopiero `FIRST_RING_PRESENTATION_COMPLETED` prowadzi do `3.10`.
- `3.10`: jednokrotna aktywacja point-entry uruchamia reveal widocznego, jeszcze nieinteraktywnego pola skorup i elevację głównych glifów; punkt czeka na rzeczywiste zakończenie prezentacji.
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
- hardware QA debug checkpointów: `P0 → P1`, `P1 → P2`, `P2 → P0`, `P0 → P2`, `P2 → P1 → P2`. Należy ręcznie potwierdzić czyste intro, naturalny ring i zbieranie w P1, kompletny Akt 1 w P2 oraz brak przecieków przy przejściach wstecz.

## Debug macro progression

Designer aliases nie są technical Scenario IDs: `P0 = 1.10` (normal start/intro), `P1 = 2.10` (ring i Tier 1 collection), `P2 = 3.10` (Tier 1 complete, start Aktu 2). Tylko te aliasy są aktywne i tylko `?debug` pokazuje kompaktowy wiersz `DEBUG [P0] [P1] [P2]` w Player Panel. P1/P2 teleportują cały rig około 3 m od Monkey, w kierunku środka ringu; P0 ponownie używa canonical `XR_CALIBRATED` intro start. Legacy `?p1` pozostaje niezależnym QA bypass i jest deferred cleanup, nie został rozszerzony.

Future contract, bez implementacji i bez przycisków: P3 = shells complete/Astro owned/Astro Sphere next; P4 = Tier 2 complete/Act 3/small glyphs/nowa warstwa/B range change.

## DEFERRED

- hydration punktów późniejszych niż `3.10`;
- durable persistence/save i pełny reset;
- pozostałe późniejsze akty, radar i finał.

## Runtime baseline

Istniejący stan wejściowy Scenario ma jeden production seam: `restoreVrScenarioBaseline()`. Normalne wejście do VR, session end i obsługa nieudanego wejścia korzystają z tej samej orkiestracji owner-owned reset APIs. Funkcja przywraca już zbudowany runtime i nie tworzy composition ponownie.

Production hydration obejmuje canonical `2.10` i `3.10`: `prepareVrScenarioSession` po baseline rekonstruuje konsekwencje punktów ściśle wcześniejszych, deleguje sekcje do domain ownerów i dopiero potem tworzy Directora w target point. Po spawnie Runtime aktywuje bieżący punkt; dla P0 canonical intro start następuje po aktywacji. `stateAt('3.10')` nie zawiera jeszcze `postRing`, bo reveal i elevacja są entry effects bieżącego beatu; dopiero `stateAt('3.20')` zawiera ich settled wynik. Żaden historyczny event/effect ani transient timer/animacja nie jest replayowany. Naturalne wejście i DEBUG P2 korzystają z tych samych authored `3.10.entryEffects`.
