# Experience VR — Current Handoff

Status: **CURRENT** po zakończeniu migracji M2.2. To podsumowanie bieżącej granicy implementacji, nie kronika migracji.

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

Canonical Spine prowadzi od `1.10` przez Intro do `1.130`, następnie przez `2.10`, `2.20`, `2.30` do `2.40`. WHERE, BEYOND, FOLLOW pause i hinty są lokalnymi `STAY`, nie technical points.

- `1.130` jest całym crossingiem. Intro actor posiada `playerEnteredRing` i `monkeySettled`; ukończenie następuje dopiero przy `crossingComplete`.
- `2.30` jest całym loopem pięciu kart. Hint, aktywacja kryształu i commit pojedynczej karty pozostają lokalne.
- `createVrProgressionController` wyłącznie rozstrzyga ukończenie tieru. Przy pierwszym trwałym `5/5` Runtime wysyła `FIRST_RING_COMPLETED`, a Director kończy `2.30` i przechodzi przez Spine do `2.40`.
- `2.40` jest canonical stanem ukończenia pierwszego ringu `5/5` i końcem wdrożonego Scenario. Nie wraca do `2.30`.
- Capabilities Naczynia są dostępne dla loopa `2.30`, ale domain interaction state wymusza Activate tylko w `inserted` i Release tylko w `active`.
- `100.10` pozostaje terminalnym EARLY EXIT poza Spine.

Nie ma LIVE technical points `1.100.1`, `1.110.1`, `1.120.1`, `1.130.1`, `1.130.2`, `2.10.1`, `2.30.1` ani `2.40.1`.

## Reconstruction

Wdrożone są authored Spine, pure reconstruction i exclusive `stateAt(X)`: składane są `settledConsequences` punktów stojących ściśle przed `X`. Transient/live state nie jest rekonstruowany. Wszystkie obecne `settledConsequences` są puste, więc mechanizm nie materializuje jeszcze trwałych konsekwencji świata.

## NOT IMPLEMENTED

- progresja mainline po `2.40`;
- arbitrary Director start;
- hydration, resolver/bootstrap materializujący reconstruction oraz owner restore APIs;
- reconstruction-backed checkpointy i QA aliases;
- save, durable persistence i pełny reset zapisanej gry;
- późniejsze ringi, akty i finał.

## Canonical source

Pełny kontrakt znajduje się w [`VR_SCENARIO_DIRECTOR_MODEL.md`](../technical/VR_SCENARIO_DIRECTOR_MODEL.md). Kod Scenario, Directora i kompozycji Runtime jest dowodem aktualnej implementacji.
