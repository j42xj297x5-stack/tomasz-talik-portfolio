# Experience VR — Current Handoff

Status: **CURRENT**. To podsumowanie bieżącej granicy implementacji, nie kronika migracji.

## Aktualny model

```text
SPINE → SCENARIO → DIRECTOR → RUNTIME / ACTORS / DOMAIN OWNERS
```

- Spine jest jedynym właścicielem authored mainline order.
- Scenario definiuje canonical points, accepted events, effects, capabilities, milestones i `settledConsequences`.
- Director posiada `currentPointId`, interpretuje Scenario i realizuje `STAY`, `COMPLETE`, `EXPLICIT` oraz zawężone `COMPLETE_IF`.
- Runtime i aktorzy wykonują effects; domain owners zachowują faktyczny stan domenowy i transient.

`COMPLETE` używa `Spine.next()`, `STAY` nie zmienia punktu, a `EXPLICIT` jest używane dla authored EARLY EXIT. `COMPLETE_IF` obsługuje obecnie wyłącznie `crossingComplete`; nie jest ogólnym rules engine.

## Canonical zakres

Canonical Spine prowadzi od `1.10` przez Intro do `1.130`, następnie przez `2.10`, `2.20`, `2.30`, `2.40` oraz authored post-ring beats `3.10`, `3.20`, `3.30` do `3.40`. WHERE, BEYOND, FOLLOW pause i hinty są lokalnymi `STAY`, nie technical points.

- `1.130` jest całym crossingiem. Intro actor posiada `playerEnteredRing` i `monkeySettled`; ukończenie następuje dopiero przy `crossingComplete`.
- `FIRST_CRYSTAL_DISCOVERED` kończy `2.10` i uruchamia discovery/attention w `2.20`; nie rozpoczyna fizycznego revealu. Aktywacja Małpy emituje `MONKEY_TRIGGERED`, którego `STAY` emituje `BEGIN_RELIQUARY_REVEAL`. Runtime wykonuje fizyczny reveal, a `RELIQUARY_REVEAL_COMPLETED` kończy `2.20 → 2.30`.
- `2.30` jest całym loopem pięciu kart. Hint, aktywacja kryształu i commit pojedynczej karty pozostają lokalne.
- `CAN_USE_RELIQUARY` jest aktywnym, globalnym Scenario-owned gate dla insertion w `2.30`. Branch/tier/socket validation i transient state pozostają domenowe. `CAN_ACTIVATE_RELIQUARY` oraz `CAN_RELEASE_RELIQUARY` są osobnymi capabilities; domena nadal wymusza Activate tylko w `inserted` i Release tylko w `active`.
- `createVrProgressionController` wyłącznie rozstrzyga ukończenie tieru. Przy pierwszym trwałym `5/5` Runtime wysyła `FIRST_RING_COMPLETED`; Director kończy `2.30`, emituje `COMPLETE_FIRST_RING_PRESENTATION` i `PLAY_FIRST_RING_COMPLETE_FEEDBACK`, po czym przechodzi przez Spine do `2.40`. Runtime wykonuje odpowiednio `progressFloor.completeTier(1)` i istniejący feedback audio.
- `2.40` jest canonical stanem ukończenia pierwszego ringu `5/5` i nie wraca do `2.30`. Authored następstwo prowadzi przez post-ring world presentation (`3.10`), 10 s obserwacji (`3.20`) i Monkey attention (`3.30`) do Monkey → Furnace intro (`3.40`). `3.10`, `3.20` i `3.30` są **IMPLEMENTED**. `3.30` uruchamia attention, czeka na świadomy trigger Małpy i domknięcie trzech kwestii; dopiero one-shot `POST_RING_MONKEY_DIALOGUE_COMPLETED` prowadzi do `3.40`. `3.40` jest **AUTHORED / COPY APPROVED, RUNTIME NOT YET IMPLEMENTED**; canonical copy to `Spójrz na Piec.` / `Tam coś na ciebie czeka.`, a boundary sink nie revealuje Pieca.
- `syncTierOneWorldState()` i `syncAmbientSequence()` pozostają w kompozycji Runtime; nie zostały przeniesione do Scenario.
- `100.10` pozostaje terminalnym EARLY EXIT poza Spine.

Nie ma LIVE technical points `1.100.1`, `1.110.1`, `1.120.1`, `1.130.1`, `1.130.2`, `2.10.1`, `2.30.1` ani `2.40.1`.

## Reconstruction

Wdrożone są authored Spine, pure reconstruction i exclusive `stateAt(X)`: składane są `settledConsequences` punktów stojących ściśle przed `X`. Transient/live state nie jest rekonstruowany. Wszystkie obecne `settledConsequences` są puste, więc mechanizm nie materializuje jeszcze trwałych konsekwencji świata.

## NOT IMPLEMENTED

- runtime Furnace intro dla `3.40` oraz progresja Pieca po `3.40`;
- arbitrary Director start;
- hydration, resolver/bootstrap materializujący reconstruction oraz owner restore APIs;
- reconstruction-backed checkpointy i QA aliases;
- save, durable persistence i pełny reset zapisanej gry;
- późniejsze ringi, akty i finał.

## Canonical source

Pełny kontrakt znajduje się w [`VR_SCENARIO_DIRECTOR_MODEL.md`](../technical/VR_SCENARIO_DIRECTOR_MODEL.md). Kod Scenario, Directora i kompozycji Runtime jest dowodem aktualnej implementacji.
