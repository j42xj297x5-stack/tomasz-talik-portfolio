# Experience VR — Scenario, Director i progresja

Status: **CURRENT**. Dokument opisuje wdrożony model po migracji M2.2; kod pozostaje dowodem implementacji.

## 1. Model ownershipu

```text
SPINE → SCENARIO → DIRECTOR → RUNTIME / ACTORS / DOMAIN OWNERS
```

- **Spine** (`VR_EXPERIENCE_SCENARIO_SPINE`) jest jedynym właścicielem authored mainline order. ID jest stabilnym adresem, nie liczbą do sortowania ani źródłem kolejności.
- **Scenario** definiuje canonical story points oraz ich accepted events, effects, capabilities, milestones i `settledConsequences`. Nie powiela normalnego następstwa mainline przez targety.
- **Director** posiada `currentPointId`, interpretuje definicję bieżącego punktu, akceptuje pasujący event, commituje milestone'y, publikuje efekty i rozstrzyga przejście.
- **Runtime / actors / domain owners** wykonują efekty i posiadają rzeczywisty stan domenowy oraz transient. Director nie mutuje sceny Three.js i nie przejmuje invariants interakcji, kart, podłogi, Naczynia ani Intro.

`RuntimeExperience` jest granicą wykonawczą: przekazuje eventy do Directora i deleguje symboliczne effects do wstrzykniętych handlerów. Capability Scenario jest pozwoleniem na udział w danym loopie, a nie kopią szczegółowego stanu domeny.

## 2. Canonical Spine i granica implementacji

Wdrożony Spine ma kolejność:

```text
1.10 → 1.20 → 1.30 → 1.40 → 1.50 → 1.60 → 1.70 → 1.80
→ 1.100 → 1.110 → 1.120 → 1.130 → 2.10 → 2.20 → 2.30 → 2.40
```

`100.10` jest authored terminalnym EARLY EXIT poza Spine. `EXPLICIT` może prowadzić do niego z wyboru wyjścia. `2.40` jest ostatnim zaimplementowanym punktem mainline i nie ma transitionów.

WHERE w `1.100`, FOLLOW pause w `1.110`, BEYOND w `1.120` oraz hinty są lokalnymi reakcjami `STAY`. Nie są osobnymi story points. W szczególności nie istnieją LIVE technical points `1.100.1`, `1.110.1`, `1.120.1`, `1.130.1`, `1.130.2`, `2.10.1`, `2.30.1` ani `2.40.1`.

## 3. Transition contract

Każdy transition ma jawny immutable `kind`:

- **`STAY`** — event jest zaakceptowany, przewidziane milestones/effects są zwracane, a `currentPointId` się nie zmienia; transition nie ma `target`.
- **`COMPLETE`** — bezwarunkowo kończy bieżący punkt Spine; Director pobiera następny punkt przez `Spine.next(currentPointId)`; transition nie ma `target`.
- **`EXPLICIT`** — prowadzi do wymaganego authored `target` poza normalnym następstwem Spine, obecnie dla EARLY EXIT; nie wywołuje `Spine.next()`.
- **`COMPLETE_IF`** — conditional completion. Payload `false` rozstrzyga się do `STAY`, a `true` do `COMPLETE` i `Spine.next(currentPointId)`; transition nie ma `target`.

Accepted `change` publikuje już rozstrzygnięty `transitionKind`. `COMPLETE_IF` pozostaje celowo zawężone do condition `crossingComplete`; nie jest DSL-em, ogólnym rules engine ani podstawą przyszłego systemu predicates.

## 4. Intro i crossing w `1.130`

`1.130` jest jedynym canonical crossing point. `PLAYER_ENTERED_RING` i `MONKEY_SETTLED` mogą przyjść w dowolnej kolejności. Intro actor posiada transient facts `playerEnteredRing` i `monkeySettled` oraz przekazuje wynik `crossingComplete`; Director nie przechowuje ich kopii.

Pierwszy fakt daje warunkowe `STAY`. Gdy oba są prawdziwe, `COMPLETE_IF` rozstrzyga się do `COMPLETE`, emituje `BEGIN_GLYPH_FREE_EXPLORE` i przez `Spine.next('1.130')` przechodzi do `2.10`. Transient crossing state nie podlega rekonstrukcji.

## 5. Pierwszy ring

### `2.10` i `2.20`

`2.10` obejmuje glyph free explore. Hint pozostaje lokalnym `STAY`, a pierwsze odkrycie kryształu kończy punkt. `2.20` obejmuje reveal Naczynia i kończy się po `RELIQUARY_REVEAL_COMPLETED`.

### `2.30` — cały loop pięciu kart

`2.30` obejmuje cały pierwszy ring, aż do ukończenia `5/5`. W jego obrębie:

- `RELIQUARY_HINT_TIMEOUT` → `STAY`;
- `CRYSTAL_ACTIVATED` → `STAY` i lokalny preview;
- `CARD_COMMITTED` → `STAY`, milestone `CARD_COMMITTED` i lokalny per-card feedback;
- `FIRST_RING_COMPLETED` → `COMPLETE` → `Spine.next('2.30')` → `2.40`.

`createVrProgressionController` jest jedynym źródłem prawdy o ukończeniu tieru. Runtime wysyła `FIRST_RING_COMPLETED` dopiero przy trwałym wyniku pierwszego tieru `5/5`; Scenario nie liczy kart i Director nie utrzymuje równoległego licznika.

Scenario udostępnia w `2.30` capabilities całego loopa Naczynia. Poprawność interakcji pozostaje domenowa: Activate jest możliwe tylko dla kryształu w stanie `inserted`, a Release tylko w stanie `active`. Te fazy nie są osobnymi story points.

### `2.40` — canonical completion

`2.40` oznacza ukończony pierwszy ring `5/5`. Jest obecnym końcem zaimplementowanego zakresu Scenario. Nie istnieje powrót z `2.40` do loopa ani dokumentacyjna pętla; późniejsza progresja nie jest CURRENT.

## 6. Reconstruction contract

Reconstruction jest pure i używa exclusive boundary:

```text
stateAt(X) = fold(settledConsequences punktów Spine stojących ściśle przed X)
```

Spine dostarcza porządek, a Scenario konsekwencje. Target `X` jest teraźniejszością; jego efekty oraz punkty późniejsze nie wchodzą do wyniku. Reconstruction nie odtwarza live/transient state, nie replayuje dramaturgii i nie przejmuje prawdy domain owners.

Pole `settledConsequences` jest wdrożonym mechanizmem docelowym, ale obecne definicje mają puste konsekwencje. Nie należy z tego wywodzić, że hydration świata lub przywracanie stanu ownerów już działa.

## 7. NOT IMPLEMENTED

- arbitrary Director start;
- hydration i owner restore APIs;
- reconstruction-backed checkpointy lub QA aliases;
- save/durable persistence i pełny reset zapisanej gry;
- mainline po `2.40`, w tym późniejsze akty, ringi i finał.

Istniejące compatibility aliases nazw punktów nie są checkpointami ani alternatywnym modelem progresji.
