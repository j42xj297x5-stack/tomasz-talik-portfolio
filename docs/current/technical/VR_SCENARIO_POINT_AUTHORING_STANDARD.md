# Experience VR — kanoniczny standard authoringu Scenario point

Status: **CURRENT / BINDING**. Ten dokument jest obowiązującą instrukcją projektowania, implementowania i walidowania każdego **nowego** canonical Scenario pointu. Najpierw stosuje się ten standard, następnie model szczegółowy [`VR_SCENARIO_DIRECTOR_MODEL.md`](VR_SCENARIO_DIRECTOR_MODEL.md). Bieżący kod rozstrzyga stan implementacji; wymienione niżej legacy seams nie są precedensem.

## 1. Model odpowiedzialności

```text
SPINE → SCENARIO → DIRECTOR → RuntimeExperience → ACTORS / DOMAIN OWNERS
```

| Warstwa | Jedyna odpowiedzialność |
| --- | --- |
| **Spine** | Canonical kolejność wyprowadzana wyłącznie przez przejście po `canonicalMainline.target`, od `initialPointId` do terminala. Udostępnia `next`, ale nie wykonuje fabuły. |
| **Scenario** | Deklaruje **co** ma się wydarzyć: pointy, przyjmowane semantic events, symboliczne effects, capabilities, milestones, settled consequences i routing. |
| **Director** | Jako jedyny posiada globalne **gdzie** (`currentPointId`) i rozstrzyga legalność transition. Dopasowuje event w bieżącym poincie, aktualizuje milestones i zwraca effects; nie wykonuje domeny. |
| **RuntimeExperience** | Jest granicą wykonawczą: przekazuje event do Directora, wykonuje zaakceptowane effects przez handlers i orkiestruje pełną aktywację punktu. Nie jest drugim źródłem progresji. |
| **Actor / domain owner** | Wykonuje komendę/effect, posiada własną mechanikę i prawdę domenową oraz emituje semantic completion event. Nie zna Spine ani target pointu. |
| **Composition root (`experienceVr.js`)** | Konstruuje obiekty, wstrzykuje zależności, mapuje effects i semantic callbacks oraz obsługuje app/XR lifecycle. Nie authoruje dramaturgii. |

W konsekwencji: **Spine zna kolejność; Scenario definiuje znaczenie; Director wybiera legalne przejście; target `entryEffects` rozpoczynają beat; Runtime wywołuje handler; actor wykonuje pracę; jeden owner posiada wynik trwały.** Actor, UI ani domain owner nie mogą znać następnego pointu lub podejmować decyzji o globalnym przejściu.

## 2. Słownik: niezamienne pojęcia

| Pojęcie | Znaczenie |
| --- | --- |
| **Point** | Stabilny adres w Scenario reprezentujący dramaturgicznie istotny beat albo stabilną granicę praw/progresji. Nie jest klatką techniczną. |
| **Beat** | Odcinek doświadczenia rozpoczynany przez `entryEffects` pointu docelowego i kończony semantic completion fact/eventem. Point jest jego canonical adresem. |
| **Event** | Semantyczna informacja/request wysłana przez aktora do canonical path, np. „prezentacja zakończona”, a nie instrukcja „idź do 3.20”. Event może zostać odrzucony, jeśli bieżący point go nie przyjmuje. |
| **Effect** | Symboliczna komenda zwrócona po zaakceptowaniu eventu albo przy wejściu w point; Runtime mapuje ją do jednego właściwego wykonawcy. |
| **Capability** | Semantyczne prawo/gate wynikające z bieżącego pointu. Zastępuje literalne porównania point ID w UI, actorach i subsystemach. |
| **Milestone** | Zapisany przez Directora semantyczny znacznik zaakceptowanej progresji używany przez Scenario/diagnostykę; nie zastępuje prawdy domenowej ani rekonstrukcji świata. |
| **Settled consequence** | Deklaratywna, serializowalna reprezentacja stabilnego skutku ukończonego pointu, pogrupowana pod sekcją jednego ownera. Jest wejściem do reconstruction/hydration. |
| **Transient state** | Stan trwającej mechaniki: timer, hover, playback, interpolacja/animacja, obiekt w locie, aktywny pull, chwilowa faza `BUILDING`/`CLAIMING`, otwarty modal itp. Nie trafia do reconstruction i sam nie uzasadnia pointu. |
| **Domain truth** | Autorytatywny fakt należący do dokładnie jednego ownera, np. uzyskany przedmiot lub committed progress. Scenario może deklarować jego canonical settled representation, ale go równolegle nie posiada. |

## 3. Twarde invariants

1. Spine posiada wyłącznie canonical kolejność wyprowadzaną z `canonicalMainline.target`. `COMPLETE` nigdy nie duplikuje targetu; używa `Spine.next()`.
2. Scenario opisuje **co**, Director jako jedyny globalne **gdzie** i legalność transition.
3. Każdy nowy canonical beat zaczyna się przez `entryEffects` pointu docelowego. Effects transition poprzednika mogą dotyczyć wyłącznie lokalnego zdarzenia, które właśnie zaszło; nie wolno nimi uruchamiać następnego beatu.
4. `entryEffects` są exactly-once i samowystarczalne. Nie wymagają payloadu eventu poprzednika ani prywatnego transient state aktora. Potrzebna informacja trwała musi mieć jawnego ownera i canonical representation.
5. Actor wykonuje komendy i emituje semantic completion events. Może posiadać transient mechanics, ale nie alternatywne Scenario, Spine, targety ani globalny progression store.
6. Persistent fact ma dokładnie jednego domain ownera. Point, po którego ukończeniu fakt jest stabilny, deklaruje go w `settledConsequences`; owner zapewnia walidowane, ciche i idempotentne hydration.
7. Obowiązuje dokładnie `stateAt(X) = fold(settledConsequences pointów ściśle przed X)`. Consequences bieżącego X nie należą do `stateAt(X)`. Transient state nigdy nie jest rekonstruowany.
8. Canonical direct lifecycle to `restoreBaseline → stateAt(X) → hydrate owners → synchronize derived state → create Director at X → activate X entry`. Każdy zadeklarowany direct/reconstruction target musi przechodzić całość.
9. Capability jest gate'em Scenario. Zakazane są nowe warunki w rodzaju `getCurrentPointId() === '3.50'`; należy użyć capability albo stanu właściwego ownera.
10. Akcja rozpoczynająca globalny beat nie wykonuje najpierw nieodwracalnej mutation, a dopiero potem powiadamia Directora. Semantic request/fact najpierw trafia do canonical path; zaakceptowany point/effect uruchamia aktora. Mechanika lokalna wewnątrz jednego pointu może pozostać u ownera.
11. Point powstaje dla istotnego beatu lub stabilnej granicy praw/progresji, nigdy wyłącznie dla animacji, timera, hovera, modalu czy fazy technicznej.
12. Designer checkpoint `P0`, `P1` itd. jest tylko aliasem QA do canonical pointu. Nie tworzy drugiego pointu, Spine ani historii progresji. `100.10` jest canonical terminalem, ale nie reconstruction startem.

## 4. Lifecycle naturalnego wejścia

1. Actor/domain owner wykrywa lokalny, semantycznie ukończony fakt i emituje event przez callback z composition root.
2. `RuntimeExperience.dispatch(event, payload)` przekazuje event Directorowi bez wcześniejszej globalnej mutation.
3. Director akceptuje wyłącznie route bieżącego pointu; nieznany/nielegalny event nie zmienia progresji.
4. `STAY` zachowuje point; `COMPLETE` wybiera `Spine.next()`; `EXPLICIT` wybiera jawny target poza zwykłym następstwem; crossing-only `COMPLETE_IF` staje się `COMPLETE` wyłącznie przy `crossingComplete === true`, w przeciwnym razie `STAY`.
5. Director commituje odpowiednie milestones i zwraca najpierw transition-local effects, a przy zmianie pointu następnie `entryEffects` targetu.
6. Runtime wykonuje effects w tej kolejności przez zarejestrowane handlers. Brak handlera jest błędem kontraktu.
7. Target entry uruchamia aktora nowego beatu dokładnie raz. Actor po rzeczywistym ukończeniu emituje kolejny semantic completion event.
8. Stabilny wynik pointu ma reprezentację w jego `settledConsequences`, aby był dostępny przy stanie **następnych** pointów.

### Routing, branche i exity

- `STAY`: lokalny event i effect w bieżącym poincie; bez targetu.
- `COMPLETE`: canonical completion; bez targetu, zawsze `Spine.next()`.
- `EXPLICIT`: jawne odejście od mainline, np. wybór exit prowadzący do canonical terminala; zawsze jawny istniejący target.
- `COMPLETE_IF`: wyłącznie istniejący join crossing oparty o `crossingComplete`; nie wolno rozbudowywać go w ogólny rules engine.
- Choice routing pozostaje semantyczną odmianą jednego eventu. Actor emituje wybór, ale to Scenario/Director interpretują go jako `STAY`, `COMPLETE` lub `EXPLICIT`.
- Branch nie może istnieć jako prywatny state machine udający globalną progresję. Powrót do mainline musi być jawnie zaauthorowany.

## 5. Direct activation i reconstruction

### Dwa różne twierdzenia

**„Director potrafi rozpocząć w poincie X”** znaczy tylko, że konstruktor akceptuje `startPointId`, ustawia ID/capabilities i `activateCurrentPoint()` może zwrócić entry effects. Nie oznacza to odtworzenia wcześniejszego świata, wywołania owner hydration, synchronizacji projekcji ani istnienia production handlers zdolnych wykonać entry.

**„Cały production runtime obsługuje X jako direct target”** znaczy, że `RuntimeExperience.activatePoint(X)` przechodzi pełne lifecycle, każdy settled fact ma ownera i hydration, derived state jest zsynchronizowany, Director zostaje wymieniony, a target entry wykonuje się exactly-once przez realne handlers. Stabilny rezultat musi odpowiadać naturalnemu dojściu do X: historia pointów przed X plus entry X.

Dlatego unit test `ExperienceDirector.activateCurrentPoint()` dowodzi wyłącznie zachowania Directora. **Nie jest dowodem production direct-activation parity.** Status direct targetu wolno nadać dopiero po teście pełnego `RuntimeExperience.activatePoint(X)` z rzeczywistymi kontraktami ownerów/handlerów oraz porównaniu stabilnego świata z natural flow.

### Kontrakt reconstruction/hydration

1. `restoreBaseline` przywraca canonical, już zbudowany runtime. Nie replayuje eventów/effects i nie hydratuje.
2. `stateAt(X)` waliduje X jako canonical reconstruction target, składa w authored order wyłącznie deklaratywne `settledConsequences` poprzedników i zamraża wynik. Późniejsza wartość top-level zastępuje wcześniejszą tego samego fact key.
3. Każdy top-level fragment stanu jest sekcją jawnego ownera. Hydrator deleguje tylko tę sekcję do `owner.hydrateScenarioState(value)`; brak ownera/API jest błędem.
4. Owner waliduje pełną canonical reprezentację, aplikuje ją cicho (bez semantic events, audio i dramaturgicznych animacji), idempotentnie i po uprzednim baseline.
5. `synchronizeDerivedState` odświeża wyłącznie projekcje po hydration; nie commituje prawdy ani nie rozpoczyna beatów.
6. Dopiero potem powstaje Director w X, a `RuntimeExperience.activateCurrentPoint()` uruchamia entry X.

Do reconstruction trafia tylko settled truth potrzebna do odtworzenia świata. Nie trafiają: capability, historyczne events/effects, timery, hover, playback, interpolation, aktywne dialogi/animacje, obiekt w locie, pull, `CLAIMING`, chwilowy modal ani inne przerwane mechanics.

## 6. Kontrakty wykonawcze

### Actor

- Przyjmuje semantyczne komendy z effect handlera i wykonuje tylko swoją domenę.
- Sygnalizuje fakty przez nazwane semantic callbacks; nie wywołuje targetu i nie czyta Spine.
- Odrzuca komendę sprzeczną z własnym stanem w sposób widoczny dla błędu integracji; entry direct targetu musi jednak działać po canonical hydration bez payloadu poprzednika.
- Trzyma transient mechanics lokalnie. Nie utrzymuje kopii `currentPointId`, checkpoint history ani alternatywnego Scenario.

### Owner persistent state

- Jest jedynym autorytetem faktu i udostępnia canonical reset/baseline.
- Ma jawny, serializowalny kształt settled state przypisany do własnej sekcji.
- `hydrateScenarioState` waliduje dane, jest ciche oraz idempotentne i nie emituje story eventów.
- Jeśli fakt nie przetrwa reconstruction, nie wolno uznać pointu direct-ready.

### RuntimeExperience

- Jest jedynym adapterem symbolic effect → handler zarówno dla natural dispatch, jak i point activation.
- Wymaga handlera dla każdego wykonanego effectu.
- Dla arbitrary activation wymaga canonical `stateAt`, `hydrate` i `createDirector`; wykonuje baseline, reconstruction, hydration, synchronizację, wymianę Directora i entry.
- Nie posiada domain truth ani dodatkowej kolejności.

### Composition root

- Może: konstruować, wiązać zależności, tworzyć mapę `effectHandlers`, mapować actor callbacks na `runtime.dispatch`, składać owners i lifecycle, obsługiwać XR/app teardown/spawn.
- Nie może: po transition wykonywać samodzielnego dramaturgicznego cross-owner fan-out, mutate'ować kilku ownerów jako ukryty rezultat progresji, znać następnego pointu, literalnie gate'ować po point ID, tworzyć drugi progression store ani utrzymywać historii checkpointu.

## 7. DO / DON'T na granicach

| Granica | DO | DON'T |
| --- | --- | --- |
| **Scenario** | Deklaruj semantic events/effects, capabilities, consequences i routing; umieść start beatu w target `entryEffects`. | Nie koduj mechanics, timerów ani predecessor-owned startu następnego beatu; nie twórz pointu dla transient phase. |
| **Director** | Waliduj event w current point; rozstrzygaj `STAY`/`COMPLETE`/`EXPLICIT`; dodawaj target entry exactly-once. | Nie wykonuj actorów/domeny, nie rekonstruuj świata, nie zgaduj targetu poza Spine/Scenario. |
| **RuntimeExperience** | Wykonuj symboliczne effects; dla direct targetu przejdź cały lifecycle i wymień Director. | Nie uznawaj samego startu Directora za hydration; nie przechowuj alternatywnej progresji. |
| **Actor / owner** | Posiadaj jedną domenę, transient mechanics i persistent truth; emituj semantic completion; hydratuj cicho. | Nie czytaj następnego pointu/Spine, nie dispatchuj „goto”, nie opieraj entry na predecessor payload/private state. |
| **Composition root** | Wstrzykuj i mapuj semantic callbacks/handlers; orkiestruj app/XR lifecycle. | Nie uruchamiaj następnego beatu po swojemu, nie rób cross-owner dramaturgii po claimie, nie gate'uj literalnym ID, nie trzymaj checkpoint history. |

## 8. Obowiązkowy szablon definicji nowego pointu

Każde pole musi mieć odpowiedź; „nie dotyczy” wymaga uzasadnienia.

```md
### Point <ID> — <label>
- Sens dramaturgiczny / stabilna granica praw:
- Predecessor i jego `canonicalMainline.target`:
- Następny `canonicalMainline.target` (jeśli nie terminal):
- `entryEffects` (exactly-once, bez predecessor payload/private state):
- Capabilities aktywne w poincie:
- Accepted semantic events:
- `STAY` transitions i transition-local effects:
- Completion transition (`COMPLETE`) i brak jawnego targetu:
- Exity/branche (`EXPLICIT`) i uzasadnione targety:
- Completion fact/event (co actor rzeczywiście potwierdza):
- Actor wykonujący każdy effect:
- Domain owner każdego persistent fact (dokładnie jeden):
- `settledConsequences` po ukończeniu pointu, według sekcji ownerów:
- Transient state świadomie wykluczony z reconstruction:
- Hydration requirement: walidacja, silent/idempotent apply, derived synchronization:
- Direct activation status: unsupported / supported; dowód pełnego lifecycle:
- Wymagane testy: Scenario/Director, natural flow, reconstruction/hydration,
  pełny Runtime `activatePoint`, natural/direct stable-state parity, invalid events/effects:
```

## 9. Procedura authoringu: projekt → merge

Kolejność jest obowiązkowa; nie zaczyna się od ID ani animacji.

1. **Beat i owner truth:** nazwij sens dramaturgiczny, stabilną granicę oraz dokładnie jednego ownera każdego persistent fact.
2. **Semantic event:** nazwij request/completion widoczny poza aktorem; oddziel go od mechanics i target ID.
3. **Point:** dodaj stabilne ID/label, predecessor i pojedyncze `canonicalMainline.target`; potwierdź, że point nie reprezentuje tylko transientu.
4. **Target entry:** zadeklaruj samowystarczalne `entryEffects` nowego pointu; handlers muszą działać po naturalnym wejściu i hydration.
5. **Completion:** zaauthoruj accepted event i właściwe `STAY`, `COMPLETE` lub uzasadnione `EXPLICIT`; effects poprzednika pozostają lokalne.
6. **Settled consequence:** zapisz deklaratywny wynik stabilny po ukończeniu pointu, nie bieżący transient.
7. **Hydration:** dodaj/waliduj owner API oraz baseline i derived synchronization. Bez tego oznacz direct activation jako unsupported.
8. **Capability gates:** udostępnij prawa semantycznie; usuń z nowej ścieżki literalne point gates.
9. **Wiring Runtime:** composition root mapuje semantic callbacks i effects do właściwych ownerów bez cross-owner fan-out.
10. **Test natural flow:** przejdź przez predecessor event, target entry, actor completion i następny legalny route; sprawdź exactly-once oraz rejection zdarzeń nielegalnych.
11. **Test reconstruction/direct parity:** przez pełny `RuntimeExperience.activatePoint(X)` odtwórz baseline i historię, wykonaj entry, porównaj stabilny stan z naturalnym dojściem. Osobno sprawdź exclusive `stateAt` i silent/idempotent hydration.
12. **Dokumentacja i merge:** uzupełnij template, status direct targetu, test evidence i canonical mapy/decisions. Nie deklaruj wsparcia wykraczającego poza dowody.

## 10. Checkpointy i debug aliases

- Alias makro (`P0`, `P1`, …) wskazuje dokładnie jeden canonical point i służy wyłącznie QA/design routingowi.
- Aktywacja aliasu musi delegować do tej samej pełnej ścieżki `RuntimeExperience.activatePoint`, a nie ustawiać ręcznie ownerów lub Directora.
- Alias nie ma własnych consequences, capabilities, events, historii ani numeracji technicznych pointów.
- Legacy query bypass może pozostać istniejącym wyjątkiem, ale nie jest dowodem reconstruction, nie może być kopiowany i nie może ustanawiać truth.
- `100.10` pozostaje canonical terminalem i punktem convergence exitów, ale canonical lifecycle odrzuca go jako reconstruction/direct start.

## 11. Legacy seams — NIE SĄ WZORCEM

Poniższe bieżące wyjątki zostały zweryfikowane w kodzie i służą wyłącznie jako lista zakazanych precedensów. Ten standard nie proponuje ani nie wykonuje ich naprawy:

- predecessor-owned startup effects między późnym Intro a first-ring flow: crossing transitions uruchamiają `BEGIN_GLYPH_FREE_EXPLORE`, a późniejsze completion transitions nadal uruchamiają część pracy następnego etapu;
- rozbudowany prywatny state machine `createVrIntroSequence`, łączący wiele historycznych faz aktora;
- entry/continuation wymagające predecessor payloadu albo prywatnego stanu Intro actora (np. continuation methods akceptujące tylko konkretne `WAIT_RUNTIME_*`);
- literalny gate panelu Furnace `runtimeExperience?.getCurrentPointId() === '3.50'`;
- cross-owner mutation po Astro claim w composition root, wykonywana obok semantic dispatch;
- legacy QA bypasses, w tym Intro `bypass`, `?p1` i niezależne availability overrides, które nie są canonical progression ani reconstruction.

Nowy point nie może powielać żadnego z tych kształtów, nawet jeśli obecny runtime je toleruje.

## 12. Definition of Done nowego pointu

Point jest gotowy dopiero, gdy wszystkie poniższe warunki są spełnione:

- [ ] Reprezentuje nazwany beat lub stabilną granicę praw/progresji, nie transient mechanic.
- [ ] Spine ma jedno canonical `target` z poprzednika; actor/UI/owner nie zna kolejnego pointu.
- [ ] Scenario deklaruje pełny vocabulary, capabilities, accepted events, routing i consequences; Director pozostaje jedynym globalnym arbitrem.
- [ ] Nowy beat rozpoczyna target `entryEffects`; są exactly-once, samowystarczalne i mają production handlers.
- [ ] Completion jest semantic eventem od właściwego aktora; globalna mutation nie wyprzedza jego akceptacji.
- [ ] Każdy persistent fact ma dokładnie jednego ownera i canonical, deklaratywną settled representation.
- [ ] `stateAt(X)` pozostaje exclusive; current point i wszelki transient są wykluczone.
- [ ] Hydration ownerów jest walidowane, silent, idempotentne i wykonywane po baseline; derived synchronization nie tworzy truth.
- [ ] Wszystkie nowe gates używają capability albo owner state, nigdy literalnego point ID.
- [ ] `STAY`, `COMPLETE`, `EXPLICIT` i ewentualne crossing-only `COMPLETE_IF` są użyte zgodnie z przeznaczeniem.
- [ ] Composition root jedynie wiąże kontrakty i lifecycle; brak drugiego progression, checkpoint history i dramaturgicznego cross-owner fan-out.
- [ ] Natural flow ma test przejścia, ordering i exactly-once entry.
- [ ] Jeśli point jest direct targetem, pełny `RuntimeExperience.activatePoint(X)` ma test z owner hydration/handlers, a stabilny rezultat ma parity z natural flow. Test samego Directora nie wystarcza.
- [ ] Checkpoint jest co najwyżej aliasem do pointu; terminal `100.10` nie jest reconstruction startem.
- [ ] Dokumentacja opisuje rzeczywisty status i nie przedstawia legacy seam jako wzorca.
