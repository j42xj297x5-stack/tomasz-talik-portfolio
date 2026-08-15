# Experience VR — audyt Scenario Spine, rekonstrukcji i hydration

Data: **2026-08-14**

Tryb: **AUDYT / READ-ONLY**

Status: **evidence dla przyszłej implementacji; dokument nie zmienia kanonu ani Runtime**

## SUMMARY DLA ARCHITEKTA

Najmniejsza poprawna architektura ma cztery rozłączne kroki:

```text
query alias (opcjonalny)
  → canonical pointId
  → Scenario-owned authored Spine + settled consequences
  → czysta rekonstrukcja persistent state przed pointId
  → bootstrap hydrator delegujący do istniejących domain ownerów
  → Director uruchomiony z currentPointId + reconstructed milestones
  → normalny RuntimeExperience wykonujący wyłącznie przyszłe transition effects
```

Authored Spine powinien powstać obok `points` w `src/xr/progression/vrExperienceScenario.js` jako jawna, immutable lista dwusegmentowych mainline point IDs. Nie wolno go wyliczać przez sortowanie IDs ani włączać do niego `1.100.1`, `1.110.1`, `1.120.1`, `1.130.1`, `1.130.2` ani historycznych hint-only technical points. Minimalny brak danych to **settled/persistent consequences przypisane do ukończenia mainline pointu**; dzisiejsze `effects`, `milestones` i `capabilities` nie kodują materializowalnych faktów domenowych.

`stateAt(X)` obejmuje konsekwencje punktów stojących **ściśle przed X** na Spine. Tym samym skutek przejścia kończącego poprzedni point i prowadzącego do `X` jest już settled przy wejściu w `X`; konsekwencje ukończenia samego `X` jeszcze nie są. Rekonstruktor ma być czysty i deterministyczny, a hydrator ma wykonywać wynik bez gameplay events, dialogów, timerów, audio, animacji i stanów pośrednich.

Director potrzebuje możliwości wybrania zwalidowanego startowego `currentPointId` oraz przyjęcia reconstructed milestones. Nie może sam rekonstruować historii ani hydratować ownerów. Hydration najlepiej umieścić w małej, osobnej warstwie bootstrap/hydration komponowanej przez `experienceVr.js`; rozszerzanie `RuntimeExperience` o drugi tryb efektów zacierałoby granicę live effects. `RuntimeExperience` może co najwyżej pozostać fasadą, przez którą bootstrap jest później eksponowany, ale nie powinien mapować settled state przez obecną tablicę `effectHandlers`.

Obecne ownery są nierówne: portfolio controller i Furnace material controller mają idempotentne pojedyncze commity, lecz nie mają atomowego bulk hydration; progress floor jest projekcją i ma idempotentne write APIs; shell field ma bezpośrednie `setActive`; hand/tool availability jest już wyliczana z ownerów i nie wymaga hydracji chwilowego wyposażenia. Asterion production nie potrafi jawnie przyjąć `READY/AVAILABLE/EARNED`; jego konstruktor jednorazowo wylicza `LOCKED/READY` z Furnace material ownera. Reveal fixtures nie mają jednej settled-state granicy. Najmniejszy pierwszy patch implementacyjny powinien zatem dodać i walidować wyłącznie authored Spine oraz czystą rekonstrukcję Scenario w testach — bez `?p0`, bez owner writes i bez zmian gameplayu.

## ZADANIE

Ustalić minimalny production design dla `Scenario Spine → stateAt(pointId) → hydration → domain owners`, tak aby późniejszy canonical point odtwarzał zakończony stan wcześniejszej linearnej historii bez odgrywania gameplayu, ręcznych checkpointowych flag i drugiego globalnego progression store'a.

## ŹRÓDŁO PROBLEMU / STAN ZASTANY

### 1. Obecny bootstrap

#### Production path: normal entry

```text
location.search
  ├─ debug / furnaceProcess / asterionSphere / introQaBypass (root flags)
  └─ brak canonical start-point resolvera

module evaluation experienceVr.js
  → assets / Three world
  → progressFloor
  → shellSystem / AsterionSphere / Furnace presentation
  → furnaceProgressionController
  → asterionProductionController (czyta material completion w konstruktorze)
  → progressionController
  → handModeController (dynamiczne gettery ownerów)
  → Furnace interactions / crystal collection / guides
  → legacy ?p1 shortcut
  → Intro actor
  → ExperienceDirector({ scenario }) zawsze na scenario.initialPointId = 1.10
  → RuntimeExperience({ director, live effectHandlers })
  → enterVr(): reset session actors
  → pierwsza kalibracja: XR_CALIBRATED dispatch
  → Director transition
  → RuntimeExperience live effect
  → actor/domain-owner operations
```

Scenario i Director powstają późno, po większości ownerów i nawet po wykonaniu `?p1`. Nie istnieje wybór startowego pointu, reconstruction ani hydration phase. `RuntimeExperience.dispatch()` najpierw przesuwa Directora, a potem synchronicznie wykonuje symbolic live effects; jest to ścieżka przyszłych zdarzeń, nie bootstrap stanu przeszłego.

#### Obecny path legacy shortcutów i bypassów

```text
?p1
  → introQaBypass = true
  → createVrProgressionShortcut(... )()
  → dla każdej page order === 1:
       progressionController.commitPage(page)
       progressFloor.activatePage(page)
  → progressFloor.completeTier(1)
  → syncTierOneWorldState()
       shellSystem.setActive(tier1Complete)
  → później Intro/effect gates nadal mają bypass overlay
```

To jest ręczna rekonstrukcja w `applyVrProgressionShortcut.js`: wybór pięciu rekordów danych, osobne commity prawdy domenowej, osobne writes projekcji floor oraz ręczny world sync. Root dodatkowo traktuje `p1`, `asterionSphere`, `furnaceProcess` i `furnace` jako `introQaBypass`, co omija część capability gates i wpływa na rays/Intro fixtures. `asterionSphere` osobno rozszerza `isAsterionAvailable` w hand ownerze; `furnaceProcess` ustawia `qaAllowWithoutInput`. Są to QA overlays, a nie reconstructed Scenario state. Shortcut jest wykonywany przed utworzeniem Directora i nie przesuwa go z `1.10`, więc świat domenowy i historia Directora mogą od początku być rozbieżne.

Synchronizacja świata po normalnym card commit jest również ręcznym fan-outem w `crystalCollection.onCommit`: tier ring, `syncTierOneWorldState`, ambient i audio. Na session reset shell system jest czyszczony i ponownie synchronizowany z trwałym Tier 1; portfolio controller i floor nie są resetowane. Failure path nie wykonuje analogicznego `shellSystem.reset()`/sync, co potwierdza brak jednej granicy lifecycle/hydration.

### 2. Scenario Spine

Obecne Scenario ma immutable vocabularies, płaską tablicę `points`, initial point, jawne targets i compatibility aliases. Nie ma authored Spine, danych rekonstrukcji ani walidacji ich kompletności.

Minimalna zmiana danych w przyszłości:

1. dodać do canonical Scenario **jedną jawną immutable sekwencję mainline IDs**;
2. referencje muszą wskazywać istniejące, dwusegmentowe, nieterminalne/terminalne punkty zgodnie z kontraktem; kolejność pochodzi wyłącznie z authoringu;
3. do ukończenia mainline points przypisać deklaratywne settled consequences;
4. walidować unikalność, istnienie i niedopuszczenie local branches do Spine;
5. pozostawić `transition.target` jedyną execution topology Directora.

Spine nie jest `points.sort()`, nie wynika z numerów i nie zastępuje grafu transitions. Local branches mogą wykonywać transient dialogue/wait/hint i wracać do mainline, ale nie wnoszą osobnego wariantu reconstructed state. Jeżeli branch miałby trwały skutek sprzeczny z inną ścieżką, obecny kanon wymaga osobnej decyzji, a nie dopisania branchu do Spine.

### 3. Semantyka `stateAt(pointId)`

Granica jest **exclusive względem X**:

```text
stateAt(X) = fold(settled consequences pointów Spine przed X)
```

Point jest adresem wejścia. Przejście `A → X` kończy `A`, więc persistent consequence tego przejścia/ukończenia `A` należy już do `stateAt(X)`. Konsekwencja wymagająca ukończenia `X` pojawi się dopiero w stanie następnego mainline pointu. To usuwa off-by-one i pozwala wstawionemu wcześniej beatowi automatycznie wpływać na wszystkie późniejsze rekonstrukcje.

Do reconstruction należą wyłącznie settled fakty, np. aktywowane portfolio pages, ukończone tiery, zakończony reveal fixture, dostępność Furnace/shell field, zdobycie Astro, lista zaliczonych unikalnych shells oraz settled Asterion production state. Nie należą:

- transition effects służące dramaturgii;
- dialog i jego aktualna opcja, unread cue powstałe tylko przez bieżące UI, otwarte panele;
- timer, audio, pulse, animation progress i `BUILDING`/częściowy proces;
- otwarty Furnace, aktywny moduł/panel, chamber content, held/in-flight crystal lub shell;
- aktualnie wyposażone narzędzie, hand ray hit, trigger edge, locomotion/orientation;
- partially inserted/activated/released crystal oraz jakikolwiek stan wymagający symulacji fizyki.

Obecne kategorie nie wystarczają:

| Kategoria | Dlaczego nie wystarcza |
| --- | --- |
| `effects` | To imperatywne, live polecenia przejścia; uruchamiają animacje/dialog/audio i nie są bezpiecznym hydration contract. |
| `milestones` | Są monotonicznymi znacznikami historii, często zbyt ogólnymi (`CARD_COMMITTED`, `SHELL_ABSORBED`) i bez payloadu/listy domenowych identities. |
| `capabilities` | Opisują permission w bieżącym poincie, nie fakt osiągnięty ani stan ownera; mogą zniknąć między punktami. |

Brakuje osobnej kategorii **deklaratywnych, persistent/settled consequences z domenowym payloadem i merge semantics**. Audyt celowo nie ustanawia finalnej nazwy JS API. Rekonstruktor powinien składać te dane bez dostępu do ownerów i zwracać immutable value, w którym każdy fakt ma dokładnie jednego docelowego ownera.

### 4. Director

`ExperienceDirector` waliduje Scenario, lecz konstruktor zawsze ustawia `currentPointId = scenario.initialPointId`. Potrafi przyjąć `initialMilestones`, ale nie start point; `resetSession()` zawsze wraca do initial point, a soft reset zachowuje milestones, co przy arbitrary bootstrap mogłoby stworzyć niespójną parę.

Potrzebna odpowiedzialność Directora jest mała:

- przyjąć zwalidowany startowy `currentPointId` (default nadal canonical initial);
- przyjąć odpowiadające mu reconstructed milestones;
- ustalić spójną bazę session resetu dla tego uruchomienia albo otrzymywać ją jawnie przy ponownym bootstrapie;
- nadal wykonywać tylko event validation, explicit transition i milestone/capability projection.

Nie należy do Directora:

- odnajdywanie X z query;
- iterowanie/sortowanie Spine i składanie historii;
- odpytywanie ownerów;
- wykonywanie owner writes lub settled presentation;
- odgrywanie historycznych transitions.

Zatem trzy operacje są rozdzielone: bootstrap resolver wybiera start ID; Scenario reconstruction składa historię; bootstrap hydrator materializuje wynik. Director tylko rozpoczyna interpretację w dostarczonej, zwalidowanej pozycji logicznej.

### 5. RuntimeExperience

Obecny `RuntimeExperience` jest poprawną, małą granicą **normalnego wykonania transition effects**. Jego `effectHandlers` zakładają, że transition właśnie wystąpił, a wiele handlerów wymaga poprawnego transient actor state. Użycie ich do hydration odtworzyłoby dramaturgię i złamało idempotencję.

Rekomendowana granica to osobny bootstrap/hydration coordinator tworzony w composition root. Dostaje reconstructed value oraz jawny zestaw adapterów domain ownerów; nie subskrybuje Directora i nie wykonuje `dispatch`. Może zostać wywołany raz po utworzeniu wymaganych ownerów i przed rozpoczęciem normalnego session gameplayu. `RuntimeExperience` nie powinien otrzymać drugiej mapy „hydration effects”, chyba że pozostawałby wyłącznie cienką fasadą delegującą do osobnego komponentu — nie powinien posiadać logiki rekonstrukcji ani ownerów.

### 6. Domain-owner hydration matrix

`—` oznacza brak publicznego kontraktu. „Tak warunkowo” oznacza, że obecne API pozwala osiągnąć stan, ale nie jest właściwym atomowym/bulk hydration contract i może emitować normalne zdarzenia.

| OWNER | TRWAŁY FAKT | CURRENT READ API | CURRENT WRITE API | RESET | CZY MOŻNA HYDRATE TERAZ? | BRAKUJĄCE MINIMALNE API | RYZYKO |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `VrProgressionController` | aktywowane page IDs; derived current tier/tier complete | `getActivatedPageIds`, `hasActivatedPage`, `getCurrentTier`, `isTierComplete` | `commitPage(page)` | brak | Tak warunkowo, sekwencyjnymi legalnymi commitami | atomowe/idempotentne przyjęcie canonical page IDs z walidacją invariants i bez gameplay fan-out | `commitPage` wymaga kolejności i reprezentuje live achievement; częściowa porażka daje partial state |
| `VrProgressFloor` (projekcja) | revealed sectors, activated glyph/order panels, completed tier rings | `getActivatedEntries`, `getRevealedSectorIds`, `getCompletedTiers` | `activatePage`, `completeTier` | brak; tylko `dispose` | Tak, APIs są idempotentne | opcjonalny bulk projection sync z truth ownera, bez pulse/animation | `activatePage` startuje pulse; nie może stać się drugim truth store'em |
| Portal/reliquary/Furnace fixture actors | settled visibility/reveal ukończony | rozproszone `object.visible` i lokalne query | `hide/reveal/reset`, `crystalReliquary.reveal`, `astroFurnace.reset` | tak, osobne | Nie jako jedna spójna operacja | mały settled-visibility/presentation adapter lub per-owner immediate settled setter (bez animacji) | wielokrotny ownership Intro/root; `reveal(0)` nadal miesza bootstrap z live API |
| Furnace availability/presentation | fixture dostępny po właściwym beat | głównie `astroFurnace.object.visible`; interaction gates czytają mode/local state | `reset/place`, bez semantycznego availability API | `reset` | Nie bez direct scene mutation/bypass | jawny idempotentny availability setter na właściwym ownerze | `settings.enabled` i Intro callbacks mogą nadpisać wynik; visibility ≠ process permission |
| Astro earned/unlocked | trwałe zdobycie Astro po pickup; tool permission | portfolio Tier1 reads dziś odblokowują attractor; hand callback `isUnlocked` | brak ownera „Astro earned”; hand mode tylko equip | hand reset czyści equip, nie achievement | Nie dla nowego kanonu | jawny persistent Astro achievement owner/write lub prawidłowe wskazanie istniejącego domain fact po wdrożeniu Act 3 | current Tier1→tool unlock jest superseded target semantics; nie tworzyć flagi w hand ownerze |
| `VrShellSystem` | shell-field availability | getter `active` | `setActive(boolean)` | `reset` czyści lokalne stany, zachowuje active do sync | Tak | brak, jeśli availability pozostaje czystą projekcją z Astro achievement | dziś wyliczane z Tier1, nie z physical Astro earned; zmiana źródła wymaga migracji |
| `VrAstroFurnaceProgressionController` | zbiór 6 absorbed shell asset IDs; completion | `getSnapshot`, `getAsterionSphereProgress`, `hasAbsorbedShell` | `commitAbsorbedShell(assetId)` | brak; `dispose` | Tak warunkowo | idempotentne bulk hydrate/restore wymaganych IDs, najlepiej z pojedynczą końcową emisją | każdy commit emituje subscriberom, uruchamia ambient/production gate; partial hydration observable |
| `VrAsterionProductionController` | settled `READY`, `AVAILABLE` albo `EARNED` | `getState`, `getSnapshot`, `isAvailable`, `isEarned` | tylko gameplay `requestCreate`, `finishBuild`, `claim`; internal `syncGate` | `resetSession`: BUILDING→READY, AVAILABLE re-present | READY tylko przez wcześniejszą material hydration; AVAILABLE/EARNED — nie | jawny idempotentny restore settled production state, walidujący prerequisites i materializujący/ukrywający Sphere bez build/claim cue | constructor snapshot dependency; gameplay methods wymagają driver/time/hit i emitują efekty; `BUILDING` nie może być hydrated |
| `VrHandModeController` + attractor tool | capability użycia Astro/Asterion | dynamic `isUnlocked`/`isAsterionAvailable`; modes getters | tool `setUnlocked` w `update`; `equipLeftAsterion` | `reset`→normal hands | Capability tak, jeśli dependency hydrated; wyposażenia nie hydratować | brak persistent write; ewentualnie jawne `refreshCapabilities` tylko gdy potrzebne przed pierwszą klatką | nie mylić earned z equipped; `equipLeftAsterion` jest transient i claim side effect |
| `VrMonkeyGuide` history | discovered cards są projekcją aktywowanych page IDs | `getHistoryEntries`, `getUnreadPageIds`; czyta progression owner | brak persistent history write | reset czyści UI/unread/known, później update odkrywa pages | Historia tak przez progression dependency; unread nie | ewentualny projection refresh/seed „known without unread”, jeżeli bootstrap nie ma oznaczać starych kart jako nowe | dziś po hydration wszystkie strony mogą zostać oznaczone unread; open screen/page są transient |
| Player Guide / Intro discovered flags | controls viewed i first crystal discovered tylko o ile są prawdziwymi history milestones | Director milestones/debug; actor-local Intro state | tylko live actor methods/events | reset | Nie przez aktora | reconstructed milestones do Directora; settled fixture facts osobno | nie hydratować panel open/view cursor, tutorial timer ani Intro state machine |

Wniosek o discovered/history: lista kart jest trwałą **projekcją portfolio ownera**, nie osobnym store'em. Unread/read selection jest UI/session state, chyba że kanon osobno uzna przeczytanie za persistent — obecny Scenario tego nie robi. `FIRST_CRYSTAL_DISCOVERED` i onboarding milestones są history facts Directora; ich fizyczne settled rezultaty wymagają konsekwencji dla fixture ownerów, nie odtworzenia Intro.

### 7. Kolejność hydration

Minimalny dependency order:

```text
0. resolve alias → point; reconstruct immutable settled state
1. reset/utwórz transient actors bez uruchamiania sesji
2. hydrate truth owners:
     portfolio pages
     Furnace absorbed shells
     Astro achievement (gdy istnieje)
3. create albo restore dependents:
     Asterion production state
4. sync projections/presentation:
     progress floor
     fixtures/Furnace availability
     shell field
     Asterion Sphere AVAILABLE/EARNED presentation
     Monkey history projection (bez unread cue)
5. create/configure Director z start point + milestones
6. start normal RuntimeExperience/session; normal hand modes
7. recompute ambient once, bez audio cue
```

Konkretne order hazards:

1. `createVrAsterionProductionController` ustala `state` w konstruktorze z `progressionController.getAsterionSphereProgress().complete`. Obecnie production owner jest tworzony natychmiast po pustym Furnace progression ownerze. `hydrate materials → create production` daje `READY`; `create → hydrate materials` początkowo daje `LOCKED`, a potem subscription `syncGate` przechodzi do `READY` i emituje. To może uruchomić ambient/panel listeners i jest obserwowalnie inne. Preferowane jest hydratowanie material truth przed construction dependent ownera albo dodanie jawnego silent restore.
2. `handModeController` czyta portfolio/production przez callbacki podczas każdego `update`, więc nie zamraża stanu w konstruktorze. Dependency musi być hydrated przed pierwszą klatką, lecz owner nie wymaga recreate. Nie wolno wyposażać ręki w hydration.
3. `VrMonkeyGuide.update` porównuje activated page IDs z `knownActivatedPageIds` i dodaje nowe do `unreadPageIds`. Utworzenie guide przed portfolio hydration i późniejszy update oznaczy całą historyczną rekonstrukcję jako nowe odkrycia. Potrzebny jest creation po truth hydration albo silent projection seed.
4. progress floor nie inicjalizuje się z progression ownera. Samo `hydrate portfolio → create floor` nie wystarczy; jawny projection sync jest konieczny, ale powinien nastąpić po truth ownerze.
5. `syncTierOneWorldState` obecnie wiąże shell availability z portfolio Tier1. Nowy kanon mówi o physical Astro pickup; dopóki source fact nie zostanie zmigrowany, poprawna kolejność nie naprawi błędnej zależności semantycznej.
6. ambient czyta jednocześnie portfolio tier, Furnace completion i production built. Subscriptions są tworzone przed hydration w obecnym root. Bulk hydration może więc emitować wiele stanów pośrednich/audio-adjacent redraws. Należy podłączyć/subskrybować po silent truth hydration albo wykonać jedno końcowe recompute.

### 8. Idempotencja

Hydration tego samego pointu musi:

- być dozwolone dokładnie raz w normalnym bootstrapie, ale także dawać ten sam wynik przy bezpiecznym ponownym wywołaniu w teście;
- używać set/replace/ensure semantics, nie toggle i nie „advance by event”;
- walidować cały reconstructed input przed pierwszym write albo zapewniać atomowe owner operations;
- nie dispatchować Scenario gameplay events i nie zwiększać live commit diagnostics;
- nie odpalać subscribers per history item, audio, attention, pulse, animation, build driver, dialogue ani timers; co najwyżej jedna silent/batched projection notification po spójnym stanie;
- nigdy nie odtwarzać `BUILDING`, held/in-flight, chamber open/content, equipped tool, UI open lub animation progress; mapować jedynie settled boundary (`READY`, `AVAILABLE`, `EARNED`) i czysty stan transient;
- nie rejestrować listenerów; hydrator jest operacją, nie długo żyjącym drugim store'em;
- współdziałać z lifecycle: normalny session reset może czyścić transient owner state, ale persistent domain truth nie może zostać zdublowana lub cofnięta; re-entry ma ponownie projekcyjnie zsynchronizować świat z owner truth bez reconstruction replay;
- zwracać diagnostyczny wynik (applied/already satisfied/rejected), aby testować brak częściowej materializacji.

### 9. Checkpoint adapter

Docelowa odpowiedzialność adaptera:

```text
URLSearchParams
  → rozpoznany alias pN
  → canonical pointId (albo normal initial point)
```

Adapter nie zna pages, floor, Furnace, shells, tools ani owners. Nie zawiera snapshotów `p0/p1/p2`. Opisy pN służą jedynie do wskazania canonical points, a wszystkie fakty powstają przez `stateAt(pointId)`.

Po wdrożeniu zbędne stają się w `applyVrProgressionShortcut.js`: zależności `pages`, `progressionController`, `progressFloor`, `syncTierOneWorldState`; filtr `page.order === 1`; pętla `commitPage`; bezpośrednie `activatePage`/`completeTier`; ręczny world sync; log sugerujący zastosowanie domenowego shortcutu. Sam plik może zostać zastąpiony cienkim alias resolverem lub usunięty na rzecz bootstrap resolvera. Root `introQaBypass` nie powinien traktować canonical checkpointu jako permission overlay; start point i reconstructed capabilities zastępują bypass. Niezależne techniczne QA flags (`furnaceProcess`, debug) wymagają osobnej migracji/retencji i nie powinny udawać state reconstruction.

## WYKONANO

### 10. Minimalne etapy implementacji

| SLICE | JEDEN CEL | DOKŁADNE PLIKI / GRANICE | ZALEŻNOŚĆ | KRYTERIUM TESTOWALNOŚCI |
| --- | --- | --- | --- | --- |
| S1 — authored Spine + pure reconstruction foundation | Reprezentować kolejność i składać settled facts bez Runtime | `vrExperienceScenario.js`; nowy mały pure module obok Scenario tylko jeśli rozdział poprawia testowalność; unit tests Scenario/Director | brak | Spine jest immutable, zawiera wyłącznie istniejące mainline IDs, local branch jest odrzucany, `stateAt(X)` ma exclusive boundary i insertion-before-X test; zero zmian `experienceVr.js`/owners |
| S2 — Director arbitrary start | Uruchomić interpreter w dostarczonym canonical point z milestones | `ExperienceDirector.js`, `createVrExperienceDirector.js`, tests | S1 definiuje walidowalne wejście | default zachowuje `1.10`; valid point startuje w X; unknown odrzucony; reset contract spójny; brak owner imports i brak effects podczas construction |
| S3 — owner hydration seams: truth | Dodać najmniejsze silent, idempotentne przyjęcie persistent facts | `createVrProgressionController.js`, `createVrAstroFurnaceProgressionController.js`, ich tests | S1 state shape | bulk apply jest atomowe/idempotentne, zachowuje invariants, nie symuluje eventów i nie emituje N stanów pośrednich |
| S4 — Asterion/achievement settled seams | Przyjąć `READY/AVAILABLE/EARNED` bez build/claim gameplayu oraz ustanowić prawdziwy Astro-earned owner | `createVrAsterionProductionController.js`, właściwa mała granica Astro achievement, Sphere presentation adapter, tests | S3 materials; canonical post-Tier1 point authoring musi istnieć, bez projektowania Act 3+ poza live zakresem | prerequisites walidowane; brak `BUILDING`; AVAILABLE prezentuje settled sphere bez animacji, EARNED nie wyposaża ręki; drugi apply no-op |
| S5 — projection hydration | Zmaterializować floor, fixtures, shell field i history bez cue | `createVrProgressFloor.js`, fixture owners/adapters, `createVrShellSystem.js`, `createVrMonkeyGuide.js` tylko jeśli seed potrzebny; tests | S3–S4 truth | projekcje odpowiadają owner truth; brak pulse/audio/unread; shell availability pochodzi z Astro earned, nie Tier1; repeated sync no-op |
| S6 — bootstrap coordinator | Wykonać resolve → reconstruct → owner hydrate → Director start w prawidłowej kolejności | nowy mały module `src/xr/progression/*`, minimalne composition wiring w `experienceVr.js`, `RuntimeExperience.js` bez mieszania live handlers; integration tests | S1–S5 | canonical point bootuje settled world przed pierwszą frame; zero history dispatch/effects/listener duplication; normal entry bez aliasu ma parity |
| S7 — pierwszy alias (`?p0`) | Udowodnić alias-only checkpoint na najprostszym punkcie | alias resolver, `experienceVr.js`, QA/integration tests | S6 | `?p0 → 2.10`; zero earned pages i forbidden fixtures; Director=2.10; adapter nie ma owner dependencies ani flags |
| S8 — `?p1` parity i legacy removal | Zastąpić ręczny Tier1 shortcut rekonstrukcją canonical pointu | alias map/resolver; usunięcie/redukcja `applyVrProgressionShortcut.js`; root bypass cleanup; tests | właściwy canonical post-5/5 point oraz S7 | pełne 5/5 i projections wynikają wyłącznie ze Spine; brak filter/order/manual sync; Director/world zgodne |
| S9 — `?p2` | Udowodnić złożoną rekonstrukcję settled ownerów | alias map i integration tests; bez snapshotu | canonical target point oraz S4–S8 | Astro earned, 6 unique shells i production READY; ręce normal, Furnace closed/empty, brak build animation/audio |

Pierwszym patchem jest S1, nie `?p0`: bez authored Spine, exclusive boundary, settled consequence category i pure fold alias byłby tylko kolejnym ręcznym checkpointem.

Ponadto wykonano read-only trace wskazanych dokumentów, pięciu bazowych modułów progression, composition root oraz punktowych owner dependencies. Nie rozszerzano analizy na Act 3+, save game ani niezwiązane subsystemy.

## NIE WYKONANO / POZA ZAKRESEM

- Nie zmieniono żadnego pliku `src/**`.
- Nie zaimplementowano Spine, `stateAt`, hydratora, start-point Directora ani nowych owner APIs.
- Nie poprawiono ani nie usunięto legacy shortcutu i bypassów.
- Nie zmieniono canonical point IDs ani transition topology.
- Nie zaprojektowano zawartości Act 3+, save game, persistence między reloadami ani osobnego progression store'a.
- Nie uznano historycznych transitions, timers, animations lub gameplay commits za rekomendowany mechanizm hydration.
- Nie rozstrzygnięto finalnych nazw schema/API dla Spine i settled consequences.

## ZMIENIONE PLIKI

- `docs/current/audits/progression/EXPERIENCE_VR_SCENARIO_SPINE_RECONSTRUCTION_AUDIT_2026-08-14.md` — wyłącznie niniejszy audyt.

## TESTY WYKONANE

Po utworzeniu dokumentu należy wykonać i odnotować w raporcie końcowym:

```text
git diff --check
git diff --name-only
git diff --name-only -- src
```

Oczekiwany wynik: pierwszy check bez błędów; lista zmian zawiera wyłącznie ten dokument; zapytanie ograniczone do `src` jest puste.

## OGRANICZENIA I ZAOBSERWOWANE RYZYKA

1. LIVE Scenario kończy się w pierwszej pętli `2.x`; canonical points odpowiadające pełnej semantyce `?p1` i `?p2` jeszcze nie istnieją. Nie wolno mapować aliasów do przybliżonych IDs ani dopisywać snapshotów.
2. Current `milestones` bez payloadów nie mogą wiernie odtworzyć pięciu page IDs ani sześciu shell IDs. Próba użycia ich jako hydration data stworzyłaby ukryte mapowania poza Scenario.
3. Asterion production ma najostrzejszy constructor-order hazard i brak restore API dla AVAILABLE/EARNED. Odtworzenie przez `requestCreate/finishBuild/claim` byłoby symulacją gameplayu i jest niedopuszczalne.
4. Bulk commits obecnych truth ownerów emitują kolejne obserwowalne stany. Bez silent/atomic seam hydration może uruchomić ambient, panel redraw, production gate i unread history.
5. Fixture visibility ma historycznie wielu writerów (root, Intro, actors). Hydrator nie może pisać bezpośrednio do Three objects obok ownerów, bo utrwali dual ownership.
6. Dzisiejsze Tier1→shell/tool powiązanie nie odpowiada docelowemu physical Astro-earned gate. Rekonstrukcja nie może zakonserwować tego skrótu jako canonical settled fact.
7. Director soft reset zachowuje milestones, ale wraca do initial `1.10`; arbitrary bootstrap wymaga jawnego reset baseline, inaczej re-entry będzie logicznie niespójne.
8. Progress floor i Monkey history są projekcjami. Hydration ich bez wcześniejszej prawdy domenowej stworzyłoby drugi store albo fałszywe unread/pulse cues.
9. `AVAILABLE` wymaga settled presentation Sphere, a `EARNED` wymaga jej braku w Furnace, ale żaden z nich nie oznacza automatycznego wyposażenia. Ta różnica musi pozostać testowana.
10. Dokumentacja kanoniczna celowo nie zatwierdza nazw runtime schema/API. Niniejszy audyt ustala semantykę i granice, nie podnosi propozycji nazw do rangi kanonu.
