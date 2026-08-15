# Experience VR — Scenario, Director i progresja

Status: **CURRENT**. Kod jest dowodem statusu IMPLEMENTED; ten dokument jest canonical modelem authored progresji.

## Ownership

`SPINE → SCENARIO → DIRECTOR → RUNTIME / ACTORS / DOMAIN OWNERS`

Spine posiada kolejność mainline, Scenario punkty/events/effects/capabilities, Director bieżący punkt i legalność przejść, a Runtime/aktorzy wykonanie oraz stan domenowy i transient. `RuntimeExperience` jest granicą wykonawczą symbolicznych effects. `STAY` nie zmienia punktu, `COMPLETE` używa `Spine.next()`, `EXPLICIT` obsługuje early exit, a crossing-only `COMPLETE_IF` nie jest ogólnym rules engine.

## Canonical Spine

```text
1.10 → 1.20 → 1.30 → 1.40 → 1.50 → 1.60 → 1.70 → 1.80
→ 1.100 → 1.110 → 1.120 → 1.130
→ 2.10 → 2.20 → 2.30 → 2.40
→ 3.10 → 3.20 → 3.30 → 3.40 → 3.50 → 3.60 → 3.70 → 3.80
```

`100.10` jest terminalnym EARLY EXIT poza mainline. WHERE, FOLLOW pause, BEYOND i hinty są lokalnymi `STAY`, nie dodatkowymi technical points. Aktualny authored mainline kończy się na `3.80`.

## Intro i pierwszy ring

`1.130` kończy się dopiero, gdy Intro actor potwierdzi łącznie `playerEnteredRing` i `monkeySettled`. `2.10` prowadzi przez pierwszy kryształ, `2.20` przez świadome uruchomienie Małpy i fizyczny reveal Reliquary, a `2.30` obejmuje pełny loop pięciu pierwszych kart. `createVrProgressionController` jest jedynym źródłem trwałego `5/5`.

Pierwszy trwały wynik `5/5` emituje `FIRST_RING_COMPLETED`, kończy `2.30` i wprowadza `2.40`. Runtime wykonuje first-ring presentation i completion audio; lokalnym production ownerem presentation seam jest `createVrFirstRingFlow`. Dopiero rzeczywiste zakończenie prezentacji emituje `FIRST_RING_PRESENTATION_COMPLETED` i przechodzi do `3.10`. `2.40` nie jest martwym końcem.

## Post-ring i Astro — IMPLEMENTED

| Punkt | Canonical zachowanie i completion |
| --- | --- |
| `3.10` | Point-entry effects pokazują nieinteraktywne pole skorup i unoszą główne glify; punkt czeka na rzeczywiste `POST_RING_WORLD_PRESENTATION_COMPLETED`. |
| `3.20` | Około 10 sekund observation window. `OBSERVATION_WINDOW_COMPLETED`. |
| `3.30` | Checheszki sygnalizują wyłącznie nową wiadomość. Gracz sam podchodzi/wskazuje/klika Małpę; dialog nie otwiera się automatycznie. Obowiązkowo: `No i świat przestał być uprzejmy.` / `To, czego potrzebujesz, jest teraz poza zasięgiem.` / `Na szczęście nie na długo.` Dopiero finalne acknowledgement emituje `POST_RING_MONKEY_DIALOGUE_COMPLETED`. |
| `3.40` | Rzeczywisty reveal Pieca i dokładne copy: `Spójrz na Piec.` / `Tam coś na ciebie czeka.` Completion: `FURNACE_INTRO_COMPLETED`. |
| `3.50` | Astro production ready. Gracz świadomie wybiera `Utwórz astro przyciągacz` w panelu Pieca; produkcja nie jest automatyczna. |
| `3.60` | Konstrukcja Astro używa osobnego `ASTRO_ATTRACTOR_CONSTRUCTION`, nigdy `ASTERION_CONSTRUCTION`. |
| `3.70` | Fizyczne Astro jest `AVAILABLE` w otwartej komorze, ale nie `EARNED` ani equipable. Claim wymaga prawej `NORMAL_HAND`, ordinary ray, rzeczywistego target hit i trigger/`selectstart`. |
| `3.80` | Zakończony physical handoff emituje `ASTRO_ATTRACTOR_CLAIMED`. Dopiero tu Astro jest `EARNED`, equipable i dostępne prawej ręce, a Scenario przyznaje `CAN_EQUIP_ASTRO`, `CAN_SCAN_SHELLS`, `CAN_TARGET_SHELLS`. |

Pole skorup w `3.80` nie jest revealowane ponownie: to pole pokazane już w `3.10`. Dalsza authored shell progression oraz pełny Asterion loop są **NEXT / NOT YET AUTHORED**, mimo że domenowe mechaniki mogą istnieć w runtime.

## Astro i Furnace ownership

Production representation ≠ gameplay equipment object. `createVrAstroAttractorProductionController` lokalnie posiada `READY → BUILDING → AVAILABLE → CLAIMING → EARNED`; `CLAIMING` jest transient runtime state, nie story point. Gameplay tool nadal obsługuje `createVrAttractorTool`; fizyczny production clone nie jest drugim gameplayowym Astro.

Piec ma rozłączne modes: `astro_attractor` oraz istniejący Asterion mode, osobne construction kinds i współdzielony Furnace process driver. Fizyczny output znajduje się pod `VR_FURNACE_CONTENT_ANCHOR` i pozostaje w komorze do claimu.

## Bootstrap i walidacja

Po preloadzie wszystkich assetów composition musi dać się złożyć przed READY. `runtimeExperience` ma wcześniejszy bezpieczny nullable binding, ponieważ construction-time callbacks mogą wykonać się przed pełnym bindem Runtime. `canUseAstroProduction` zwraca przed bindem bezpieczne `false`, a po bindzie rzeczywisty Scenario/runtime gate.

`ExperienceDirector` może rozpocząć sesję w opcjonalnym `startPointId`, o ile punkt należy do canonical authored Spine. Taki start nie odgrywa wcześniejszych transition effects ani nie rekonstruuje historii; wymagany baseline domenowy nadal dostarcza jawne `initialMilestones`. Soft reset wraca do punktu startowego sesji i zachowuje bieżące milestones, a hard reset odtwarza zarówno punkt startowy, jak i bootstrap `initialMilestones`. Bez tych opcji zachowanie pozostaje normalnym startem w `spine[0]`.

Regression guards: `vr-first-ring-live-flow`, `vr-astro-first-claim-live-flow`, `vr-runtime-bootstrap`. Bootstrap regression był RED przed poprawką i GREEN po niej przez production path. Wizjoner potwierdził przejście poza `41/41` i brak zatrzymania przed READY: **HARDWARE VALIDATED — Meta Quest 3S** wyłącznie dla bootstrap fixu. Pełny flow `3.10–3.80` oraz Furnace/Astro visuals, hover, skala/orientacja, handoff i shell targeting pozostają hardware/perceptual QA pending.

## Reconstruction i debug macro checkpoints

`stateAt(X) = fold(settledConsequences punktów ściśle przed X)`. Production state nie jest już pustym szkieletem: konsekwencje `1.130` opisują stabilne fakty po zakończonym crossing join, pogrupowane według ownerów `monkey`, `intro` i `locomotion`. Nie zawierają timerów, dialogue playback, hovera, animacji ani capability.

`2.10` i `3.10` są production reconstruction-backed entry points. `prepareVrScenarioSession` zachowuje kolejność baseline → reconstruction → owner-delegating hydration → Director w target point. Po spawnie checkpoint wywołuje `RuntimeExperience.activateCurrentPoint()`; P0 dopiero następnie uruchamia canonical intro. Monkey materializuje finalną pozycję na kamieniu, Intro actor czysty `GLYPH_FREE_EXPLORE` z zakończoną mgłą i bez dialogu, a locomotion granicę glyph ring. `CAN_USE_GLYPHS` pochodzi wyłącznie z Directora `2.10`.

Reconstruction jest settled historią ściśle przed targetem. Dlatego stan dla `3.10` nie zawiera jeszcze `postRing`, natomiast stan dla `3.20` zawiera widoczne, nieinteraktywne shells i uniesione główne glify. Timery, pulse, audio, dialogi, reveal/completion animations i historyczne effects nie są rekonstruowane. Scenario deklaruje opcjonalne `entryEffects`; Director aktywuje punkt jednokrotnie, a Runtime wykonuje effects tym samym adapterem co `dispatch`. Naturalna zmiana punktu dołącza entry effects celu po transition-local effects; bezpośredni start wymaga jawnego `activateCurrentPoint()`.

Designer macro checkpoint jest aliasem QA, a nie technical Scenario point i nie zastępuje Spine ID. Aktywny registry zawiera wyłącznie `P0 → 1.10` (normal intro spawn/start), `P1 → 2.10` (ring/crystals) oraz `P2 → 3.10` (Tier 1 complete/Act 2). `?debug` ujawnia te trzy aliasy w Player Panel. Każde live przełączenie przechodzi pełną ścieżkę baseline → reconstruct → hydrate → nowy Director → spawn; poprzedni Director jest odłączany.

Ustalony future macro contract, obecnie **nieaktywny i nieimplementowany**: P3 = shells complete, Astro owned/in pocket, Furnace ready for Astro Sphere; P4 = Tier 2 glyphs complete, Act 3, small glyphs, nowa radialna warstwa i komunikat Monkey o zmianie zasięgu przyciskiem B. P3/P4 nie należą do registry ani UI.

Hydration zakłada uprzedni canonical baseline i nie jest patchem dowolnego live state. Reconstruction skorup, Astro Sphere, Tier 2/small glyphs, save/persistence i pełny checkpoint save system pozostają deferred.

## Canonical runtime baseline

`restoreVrScenarioBaseline()` jest jednym production seamem, który orkiestruje istniejące API resetu ownerów i actorów. Zwykłe wejście do VR korzysta z niego przed utworzeniem sesji XR; ten sam seam jest używany po zakończeniu sesji oraz po nieudanej próbie wejścia. Baseline dotyczy wyłącznie już utworzonych obiektów runtime: nie powtarza bootstrapu, nie wykonuje effects Scenario, reconstruction ani hydration. Teardown sesji XR i UI pozostaje osobnym lifecycle concernem.
