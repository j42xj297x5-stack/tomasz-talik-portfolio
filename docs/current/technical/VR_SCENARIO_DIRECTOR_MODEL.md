# Experience VR — Scenario, Director i progresja

Status: **CURRENT**. Dokument opisuje wdrożony model; kod pozostaje dowodem implementacji.

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
→ 3.10 → 3.20 → 3.30 → 3.40
```

`100.10` jest authored terminalnym EARLY EXIT poza Spine. `EXPLICIT` może prowadzić do niego z wyboru wyjścia. `3.40` jest obecną granicą authoringu mainline; kolejne punkty Pieca pozostają do nazwania.

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

`2.10` obejmuje glyph free explore. Hint pozostaje lokalnym `STAY`. `FIRST_CRYSTAL_DISCOVERED` kończy `2.10`, przechodzi przez Spine do `2.20` i emituje discovery/attention effect `REVEAL_RELIQUARY`; ten effect nie rozpoczyna fizycznego revealu.

W `2.20` aktywacja Małpy emituje `MONKEY_TRIGGERED`. Scenario akceptuje ten event jako `STAY` i emituje `BEGIN_RELIQUARY_REVEAL`, po czym Runtime uruchamia fizyczny reveal Naczynia. Dopiero `RELIQUARY_REVEAL_COMPLETED` kończy `2.20`, emituje `COMPLETE_RELIQUARY_REVEAL` i przez Spine przechodzi do `2.30`.

### `2.30` — cały loop pięciu kart

`2.30` obejmuje cały pierwszy ring, aż do ukończenia `5/5`. W jego obrębie:

- `RELIQUARY_HINT_TIMEOUT` → `STAY`;
- `CRYSTAL_ACTIVATED` → `STAY` i lokalny preview;
- `CARD_COMMITTED` → `STAY`, milestone `CARD_COMMITTED` i lokalny per-card feedback;
- `FIRST_RING_COMPLETED` → `COMPLETE`, effects `COMPLETE_FIRST_RING_PRESENTATION` i `PLAY_FIRST_RING_COMPLETE_FEEDBACK` → `Spine.next('2.30')` → `2.40`.

`createVrProgressionController` jest jedynym źródłem prawdy o ukończeniu tieru. Runtime wysyła `FIRST_RING_COMPLETED` dopiero przy trwałym wyniku pierwszego tieru `5/5`; Scenario nie liczy kart i Director nie utrzymuje równoległego licznika.

`CAN_USE_RELIQUARY` jest aktywnym, globalnym Scenario-owned gate dla insertion w `2.30`; Runtime przekazuje go do kolekcji kryształów przed zaakceptowaniem osadzenia. Branch/tier/socket validation oraz transient state kryształu i Naczynia pozostają własnością domeny. `CAN_ACTIVATE_RELIQUARY` i `CAN_RELEASE_RELIQUARY` są osobnymi capabilities: domena nadal dopuszcza Activate tylko dla kryształu w stanie `inserted`, a Release tylko w stanie `active`. Te fazy nie są osobnymi story points.

Po zaakceptowaniu `FIRST_RING_COMPLETED` Runtime wykonuje `COMPLETE_FIRST_RING_PRESENTATION` przez `progressFloor.completeTier(1)` oraz `PLAY_FIRST_RING_COMPLETE_FEEDBACK` przez istniejący feedback audio. `syncTierOneWorldState()` i `syncAmbientSequence()` nadal są wywoływane przez kompozycję Runtime i nie zostały przeniesione do Scenario.

### `2.40` — canonical completion i wejście w post-ring

`2.40` oznacza ukończony pierwszy ring `5/5`. Po zakończeniu prezentacji ringu event `FIRST_RING_PRESENTATION_COMPLETED` prowadzi do `3.10` i publikuje dwa rozłączne polecenia prezentacyjne: `REVEAL_SHELL_FIELD_PRESENTATION` oraz `ELEVATE_MAIN_GLYPHS`. Sam reveal pola nie nadaje jeszcze capability interakcji z Muszlami.

### `3.10–3.40` — przejście do Pieca

- `3.10` posiada post-ring world presentation: reveal pola Muszli oraz elevację głównych glyphów;
- po zakończeniu prezentacji/czasu `POST_RING_WORLD_PRESENTATION_COMPLETED` rozpoczyna `3.20`;
- `3.20` jest około dziesięciosekundowym observation window;
- timeout `OBSERVATION_WINDOW_COMPLETED` rozpoczyna Monkey attention w `3.30`;
- attention/„checheszki” tylko oznaczają dostępność rozmowy; Director bezterminowo pozostaje w `3.30` podczas oczekiwania i dialogu;
- dopiero one-shot `POST_RING_MONKEY_DIALOGUE_COMPLETED`, wysłany po domknięciu trzeciej obowiązkowej kwestii, rozpoczyna `3.40`.

`3.40` celowo nie ma jeszcze następcy. Kolejne punkty procesu Pieca, `ASTRO PRODUCED`, fizyczne `ASTRO CLAIMED` oraz dopiero późniejsze `ENABLE_SHELL_INTERACTION` wymagają osobnego authoringu. Do tego czasu punkty `3.10–3.40` nie przyznają `CAN_SCAN_SHELLS`, `CAN_TARGET_SHELLS` ani furnace capabilities.

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
- dalsza authored shell progression / Asterion loop po `3.80`;
- późniejsze akty, ringi i finał.

Istniejące compatibility aliases nazw punktów nie są checkpointami ani alternatywnym modelem progresji.

## 8. IMPLEMENTED — canonical Astro physical claim (`3.40–3.80`)

Canonical Spine extends through `3.40 → 3.50 → 3.60 → 3.70 → 3.80`. The Furnace-intro actor reveals the Furnace before presenting exactly `Spójrz na Piec.` and `Tam coś na ciebie czeka.` Point `3.50` waits for the conscious production action, `3.60` owns construction, `3.70` waits with the physical tool available in the chamber, and `3.80` means physically claimed / EARNED. Only durable fact `ASTRO_ATTRACTOR_CLAIMED` grants `CAN_EQUIP_ASTRO`, `CAN_SCAN_SHELLS` and `CAN_TARGET_SHELLS` at `3.80`.

Canonical rule: the Furnace does not give the item; it creates it and the player must claim it. Further shell progression / Asterion loop is the STOP BOUNDARY and remains the next authored stage.
