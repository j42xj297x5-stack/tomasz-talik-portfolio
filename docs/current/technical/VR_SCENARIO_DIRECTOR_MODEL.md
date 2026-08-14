# Experience VR — Scenario, Director i model migracji progresji

Status: **kanoniczny model architektoniczny i protokół migracji**. Oznaczenia normatywne używane w dokumencie: **CURRENT**, **TARGET**, **MIGRATION RULE**, **FUTURE / NOT IMPLEMENTED**.

## 1. Cel i status dokumentu

Dokument definiuje Scenario Experience VR, Directora, `RuntimeExperience`, aktorów i kontrolery domenowe; sposób adresowania punktów przebiegu; krokowe przenoszenie istniejącej progresji do Scenario; rozdział adresów punktów od nazw eventów, efektów i cue; oraz docelowe ograniczanie odpowiedzialności `experienceVr.js`.

Jest źródłem prawdy dla wszystkich następnych etapów migracji Scenario + Director. **CURRENT:** kod jest dowodem tego, co wdrożono. **TARGET:** każda dalsza migracja musi być projektowana według niniejszego modelu. Dokument nie zmienia kodu ani nie uznaje elementów docelowych za wdrożone.

## 1.1. Canonical Story Reindex Migration — IMPLEMENTED

**CURRENT (2026-08-13):** jednorazowy corrective reindex obecnego LIVE Scenario został wdrożony bez zmiany gameplay semantics. Flat live slice to `1.10`, `1.20`, `1.30`, `1.40`, `1.50`, `1.60`, `1.70`, `1.80`, `1.100`, `1.100.1`, `1.110`, `1.110.1`, `1.120`, `1.120.1`, `1.130`, `100.10`. WHERE (`1.100.1`), pause/wait (`1.110.1`) i BEYOND (`1.120.1`) są current local branches; FOLLOWING (`1.110`), THRESHOLD (`1.120`) i CROSSING (`1.130`) są płaskimi mainline beats.

`1.90` jest **RESERVED / WATER (Haiku Cosmos) CRYSTAL GRAB TUTORIAL / NOT IMPLEMENTED** i nie należy do produkcyjnego identifier set. Scenario Spine pozostaje **TARGET / NOT IMPLEMENTED**: nie istnieje `spine`, `mainline`, `acts`, builder ani normalizer. Director nadal przechodzi wyłącznie przez jawne `transition.target` i nie wylicza kolejności z adresów.

| OLD (SUPERSEDED / RETIRED) | NEW |
| --- | --- |
| `1.1` | `1.10` |
| `1.2` | `1.20` |
| `1.3` | `1.30` |
| `1.4` | `1.40` |
| `1.4.1` | `1.50` |
| `1.4.2` | `1.60` |
| `1.4.3` | `1.70` |
| `1.4.4` | `1.80` |
| `1.4.5` | `1.100` |
| `1.4.5.2` | `1.100.1` |
| `1.4.5.1` | `1.110` |
| `1.4.5.1.1` | `1.120` |
| `1.4.5.1.1.2` | `1.120.1` |
| `1.4.5.1.1.1` | `1.130` |

Wszystkie OLD IDs w tabeli są trwale **SUPERSEDED / RETIRED** i nigdy nie mogą otrzymać innego znaczenia. `100.10` nie został zmieniony ani retired. M1.12 ma **HARDWARE PASS — Meta Quest 3S**, SG-036 **MIGRATED**, SG-041 **MIGRATED** po M1.13, a approved crystal tutorial **NOT IMPLEMENTED**. Canonical Story Reindex jest **IMPLEMENTED / behavior-neutral**; post-reindex regression: **PASS — Meta Quest 3S**.

## 1.2. M1.20R Canonical Act Address Correction — IMPLEMENTED

**CURRENT:** M1.20R jest behavior-neutral corrective reindexem, który przywraca wiążącą semantykę Aktów: `1.x` = PROLOG / INTRO, `2.x` = PRÓG I / pierwsza pętla pięciu kryształów, `3.x` = PRÓG II / etap po ukończeniu pierwszej pełnej piątki. Ten patch nie implementuje żadnego LIVE `3.x` ani faktu `TIER_COMPLETED`.

| OLD (SUPERSEDED / RETIRED) | NEW (CANONICAL) |
| --- | --- |
| `1.140` | `2.10` |
| `1.150` | `2.10.1` |
| `1.160` | `2.20` |
| `1.170` | `2.30` |
| `1.170.1` | `2.30.1` |
| `1.180` | `2.40` |
| `1.180.1` | `2.40.1` |

Wszystkie OLD IDs w tej tabeli są trwale **SUPERSEDED / RETIRED**, nie są aliasami Runtime i nigdy nie mogą otrzymać nowego znaczenia. Korekta zmienia wyłącznie adresy i jawne `transition.target`; milestones, effects, capabilities, payload, ownership oraz gameplay pozostają bez zmian.

## 2. Metafora teatralna i podział odpowiedzialności

Wiążąca analogia:

```text
SCENARIUSZ
→ co ma się wydarzyć i jaka jest kolejność

REŻYSER
→ w którym punkcie scenariusza jesteśmy
→ jakie zdarzenie wolno teraz zaakceptować
→ dokąd prowadzi zaakceptowane zdarzenie
→ jakie skutki symboliczne należy zlecić

RUNTIME / AKTORZY / ŚWIATŁO / MUZYKA
→ jak fizycznie wykonać zlecony skutek
```

W kodzie: `vrExperienceScenario → ExperienceDirector → RuntimeExperience → aktorzy i systemy wykonawcze`.

Minimalny podział brzmi: **SCENARIUSZ — co ma się wydarzyć. DIRECTOR — w którym miejscu scenariusza jesteśmy i czy wolno przejść dalej. RUNTIME/AKTORZY — jak to wykonać.** Nie wolno ponownie połączyć tych odpowiedzialności w jednej maszynie ani w `experienceVr.js`.

## 3. Rola poszczególnych plików

**CURRENT / TARGET boundary:**

- `src/xr/progression/vrExperienceScenario.js` — kanoniczne dane Scenario: kolejność i rozgałęzienia, dozwolone eventy, symbolic effects, capabilities i prawdziwe milestones; docelowo numerowane punkty.
- `src/xr/progression/ExperienceDirector.js` — kanoniczny silnik Directora: waliduje Scenario, przechowuje bieżący adres, akceptuje lub odrzuca event, wykonuje logiczne przejście, publikuje immutable change oraz udostępnia milestones i capabilities; nie wykonuje aktorów.
- `src/xr/progression/createVrExperienceDirector.js` — cienka fabryka kompatybilności, nie druga implementacja Directora i nie miejsce osobnej logiki Scenario.
- `src/xr/progression/RuntimeExperience.js` — granica wykonania symbolic effects: mapuje je na wstrzyknięte handlery, zachowuje kolejność i jawnie zgłasza brak handlera; nie podejmuje decyzji fabularnych.
- `src/xr/progression/createVrProgressionController.js` — właściciel faktów domenowych kart, gałęzi i tierów; odpowiada na pytania domenowe, nie ustala narracyjnej kolejności, a po osiągnięciu faktu może wyemitować event do Directora.
- `src/xr/progression/applyVrProgressionShortcut.js` — adapter QA, nie alternatywne Scenario ani drugi właściciel progresji; docelowo zachowuje parity z faktami i przejściami produkcyjnymi.

Minimalny zdrowy podział dotyczy odpowiedzialności Scenario/Director. Osobne `ExperienceDirector.js` i `RuntimeExperience.js` są prawidłowymi granicami infrastrukturalnymi; ten krok nie nakazuje ich łączenia ani usuwania.

## 4. Czym jest punkt scenariusza

Punkt Scenario jest najmniejszym adresowalnym fragmentem przebiegu, w którym Director zna aktualny adres, oczekiwane eventy, jawne targety, zlecane symbolic effects i dostępne capabilities oraz może — ale nie musi — dodać prawdziwy milestone.

Punkt nie jest osobną funkcją, klasą, koniecznie osobnym timerem lub komunikatem, nazwą aktora, kopią lokalnego stanu aktora, indeksem tablicy ani numerem linii JavaScript. Numer punktu jest stabilnym adresem w dziele.

## 5. Kanon numerowania: flat mainline + local branches

### 5.1. Format i semantyka authoringowa

**TARGET / MIGRATION RULE:** point ID ma postać `ACT.MAINLINE_POINT[.LOCAL_BRANCH...]` i jest wyłącznie numerycznym stringiem dodatnich segmentów całkowitych rozdzielonych kropkami, np. `1.10`, `1.20`, `2.10`, `3.60`, `1.100.1` albo `3.60.1`. Nie wolno przechowywać adresu jako liczby zmiennoprzecinkowej.

```js
id: '1.30' // poprawnie
id: 1.30   // niepoprawnie
```

ID nie koduje treści ani znaczenia fabularnego i nie może zawierać słów, slugów, nazw dialogów lub wyborów ani literowych suffixów. Pierwszy segment oznacza duży etap progresji (**Act**), drugi — beat płaskiej osi fabularnej (**mainline**), a trzeci i każdy kolejny — wyłącznie lokalną odnogę należącą do tego mainline point. Zatem głębokość ma znaczenie authoringowe, ale nadal nie daje automatycznej semantyki Runtime.

Wiążąca interpretacja pierwszego segmentu:

- `1.x` — **PROLOG / INTRO**;
- `2.x` — **PRÓG I**, obejmujący pierwszą pętlę pięciu kryształów;
- `3.x` — **PRÓG II**, rozpoczynający się po pierwszej pełnej piątce i obejmujący m.in. zmianę glifów, Astro / Astrolabium Więzi, skorupy, Piec i drogę do Kuli Asterionowej zgodnie z kanonicznym dokumentem progresji;
- `100.x` — **ENDING / EXIT namespace**.

Ten patch nie ustanawia Act 4+.

### 5.2. Płaska oś i spacing

Gdy fabuła lub progresja przechodzi do następnego beatu, powstaje nowy **dwusegmentowy** point. `1.100 Invitation → 1.110 Following` oraz `1.120 Threshold → 1.130 Crossing` są poprawne. Nie tworzy się genealogii `1.100 → 1.100.1 → 1.100.1.1` tylko dlatego, że wydarzenia wynikają z siebie.

Planowane mainline points otrzymują domyślnie krok `10`: `1.10`, `1.20`, `1.30`; `2.10`, `2.20`; `3.10`, `3.20`. To konwencja authoringowa, nie matematyczna reguła Runtime. Sloty między nimi są celową rezerwą: między `3.60` i `3.70` można później dodać `3.61` albo świadomie `3.64`, bez renumerowania `3.70` i dalszych punktów oraz bez obowiązku użycia najniższego wolnego numeru.

**MAINLINE INSERT ≠ LOCAL BRANCH:** `1.10 → 1.11 → 1.20` dodaje obowiązkowy kolejny beat do osi. `1.100.1` jest natomiast lokalną odnogą `1.100`; gdy odnoga się kończy, jej jawny target prowadzi np. z powrotem do `1.100` albo dalej do `1.110`, a nie domyślnie do `1.100.1.1`.

### 5.3. Local branches, dialogi i wybory

Dwa segmenty zawsze oznaczają mainline; trzy lub więcej segmentów oznacza local branch konkretnego mainline point. Dialogowa odpowiedź jest typowym prawidłowym branchem:

```text
1.100  „Idziesz?”
├── choice 1 → 1.110
├── choice 2 → 1.100.1  „Dokąd?”
└── choice 3 → 100.10

1.100.1
├── choice 1 → 1.110
├── choice 2 → 1.100.1
└── choice 3 → 100.10

1.120  Threshold
└── BEYOND → 1.120.1 → CROSS → 1.130
```

Branch nadal ma wyłącznie jawne transitions. Director nie wraca automatycznie do rodzica, nie wybiera dziecka i nie wylicza targetu. Zagnieżdżenie oznacza dla autora lokalną odnogę, nigdy automatycznie dalszą część głównej fabuły.

### 5.4. Stabilność: unused a retired

Raz opublikowany adres pozostaje stabilny i nie może później otrzymać innego znaczenia. **UNUSED SLOT**, np. nigdy nieużyty `3.61`, może zostać wykorzystany w przyszłości. **RETIRED / REMOVED / SUPERSEDED ID**, który kiedyś oznaczał konkretny beat, nie może zostać ponownie przypisany. Luki nie powodują renumeracji.

### 5.5. Przenoszenie

Położenie zmienia się przede wszystkim przez zmianę jawnych transitions. Jeżeli Projektant świadomie zmienia adres, stary adres zostaje oznaczony jako usunięty lub zastąpiony, wszystkie jawne odwołania są aktualizowane, rejestr zapisuje zmianę, a cicha renumeracja jest zakazana.

### 5.6. Adres nie jest kolejnością wykonawczą

Director nie dodaje `+1`, nie wylicza następnego dziecka, nie zakłada, że `.2` następuje po `.1`, nie opiera przebiegu na kolejności tablicy, nie sortuje punktów w celu ustalenia przebiegu, nie wraca automatycznie do rodzica i nie wybiera automatycznie pierwszego dziecka. Każde przejście wskazuje jawny `target`.

Legalne są skoki, pętle i powroty, o ile zapisują je transitions. **Numer opisuje adres; transitions opisują przebieg.**

## 6. Scenario Spine i jawne targety

**TARGET / BINDING AUTHORING CONCEPT:** **SCENARIO SPINE** (lub **MAINLINE SPINE**) jest Scenario-owned, jawną authored kolejnością dwusegmentowych mainline points. Przykład koncepcyjny dla Act 1:

```text
1.10 → 1.20 → 1.30 → 1.40 → 1.50 → 1.60 → 1.80
→ 1.100 → 1.110 → 1.120 → 1.130
```

Brak `1.70` jest legalną rezerwą. Local branch `1.100.1` nie należy do spine i jest osiągalny wyłącznie przez jawne transition z lokalnego huba; nie wolno automatycznie wstawiać go pomiędzy `1.100` i `1.110`.

Scenario jest właścicielem authored kolejności. Director **nie** sortuje IDs, nie szuka najmniejszego większego numeru, nie robi `+10` ani `+1`, nie analizuje luk, nie interpretuje spine i nie wylicza „next point”. Director porusza się nadal wyłącznie przez **explicit `transition.target`**.

W przyszłości mały builder lub normalizer może przed utworzeniem Directora rozwinąć authored kolejność `1.10 → 1.20` do jawnego targetu. Po wstawieniu `1.11` wynik przed granicą Directora ma być `1.10 → explicit target 1.11` i `1.11 → explicit target 1.20`. Scenario Spine jest zatwierdzonym TARGET authoring concept, lecz ten dokument nie kanonizuje API ani JS schema (`spine`, `mainline`, `acts` itp.). Dokładna reprezentacja w `vrExperienceScenario.js` zostanie wybrana w osobnym zadaniu implementacyjnym; na Director boundary wynik zawsze musi składać się ze zwykłych explicit targets.

## 7. Przykład flat-mainline indexing

Poniższy krótki szkielet pokazuje wyłącznie **TARGET indeksowania**, a nie zmianę obecnych production IDs ani pełną specyfikację gameplayu:

```text
1.10   Start XR
1.20   Reveal
1.30   Cisza
1.40   Pierwszy onboarding
1.50   Player Guide
1.60   Controls
1.70   Pointer tutorial
1.80   Trigger
1.90   RESERVED / przyszły tutorial chwytu kryształu
1.100  Invitation
1.100.1  WHERE / local branch
1.110  Following
1.120  Threshold
1.120.1  BEYOND / local branch
1.130  Crossing
1.140  Player entered ring
1.150  Monkey settled / koniec prologu
→ 2.10

2.10   Start Progu I
2.20   Pierwszy glif / pierwszy crystal flow
…       2.x trwa przez pierwszą pełną piątkę kryształów
→ 3.10  Start Progu II
```

ID, label i copy pozostają oddzielnymi warstwami: point ID jest trwałym adresem, label czytelnym opisem dla autora, a copy treścią gracza. Zmiana labelu lub copy nie zmienia ID.

### 7.1. Point a Monkey hint

Nie każda pomoc dla gracza jest Scenario pointem. Obowiązkowa instrukcja, która zmienia authored flow, może być mainline beatem, np. `3.60 Nauka Astro → 3.61 Monkey instruction → 3.70 Pierwsza skorupa w Piecu`. Contextual cue po np. 20 sekundach bezczynności może natomiast wystąpić przy niezmienionym `currentPoint = 3.60`; nie wymaga tworzenia `3.61`, `3.62` ani `3.63`. Point powstaje wtedy, gdy zmienia się authored progression flow, nie dla każdej warstwy pomocy UX.

### 7.2. Act 100 — ending / exit namespace

Pierwszy segment `100` jest trwale zarezerwowany jako **ACT 100 — ENDING / EXIT NAMESPACE**. `100.1` oznacza **FULL FINALE ENTRY / WHITE TRANSITION**, a `100.10` — **EXIT EXPERIENCE VR**. Wczesna decyzja może jawnie skoczyć do `100.10`; pełne ukończenie prowadzi jawnie przez `100.1` i finał do `100.10`. **CURRENT:** `100.10` jest LIVE EXIT; `100.1` pozostaje RESERVED / FUTURE.

## 8. Event, effect, cue, milestone i capability

### Event

Event jest semantycznym faktem od aktora lub systemu, np. `XR_CALIBRATED`, `PLAYER_OPENED_GUIDE`, `TIER_COMPLETED`, `SHELL_SET_COMPLETED`. Nie jest adresem. Ten sam typ może występować w różnych punktach, jeśli znaczenie faktu pozostaje takie samo.

### Effect

Effect jest symbolicznym poleceniem po zaakceptowanym przejściu, np. `BEGIN_INTRO_REVEAL`, `PRESENT_MONKEY_CUE`, `PLAY_AUDIO_CUE`, `REVEAL_FURNACE`. Nie jest implementacją: `RuntimeExperience` znajduje handler i deleguje wykonanie. Nowy numer punktu sam w sobie nie uzasadnia nowego typu effect.

### Cue

Cue identyfikuje treść lub wariant wykonania, np. `MONKEY: P1_FURNACE_AWAKENING` albo `AUDIO: AMBIENT_SMALL_GLYPHS`, i może parametryzować ogólny efekt:

```js
{ effect: PRESENT_MONKEY_CUE, cue: P1_FURNACE_AWAKENING }
{ effect: PLAY_AUDIO_CUE, cue: AMBIENT_SMALL_GLYPHS }
```

Nazwany cue jest prawidłowy, bo identyfikuje treść lub wykonanie, nie kolejną scenę.

### Milestone

Milestone jest trwałym, świadomie zachowywanym osiągnięciem lub faktem progresji. Nie każdy punkt go tworzy. Koniec timera, pokazanie komunikatu, zakończenie revealu lub ciszy, przejście dalej i otwarcie tymczasowego panelu nie są automatycznie milestones. Ukończenie punktu wynika z adresu i historii zaakceptowanych transitions; milestone’u nie dodaje się mechanicznie.

**CURRENT:** techniczne milestones M1.1–M1.3 działają. **MIGRATION RULE:** podczas migracji na numery wymagają przeglądu, ale w tym kroku pozostają bez zmian.

### Capability

Capability odpowiada: „co wolno graczowi lub systemowi w aktualnym punkcie?”. Nie jest komunikatem, efektem ani lokalnym stanem mesha.

## 9. Funkcje i API aktorów

Wiążąca zasada: **nowy punkt Scenario ≠ nowa funkcja**. Punkt nie tworzy automatycznie publicznej metody, callbacku, klasy, unikalnego handlera ani lokalnego stanu. Nowa metoda publiczna jest uzasadniona tylko rzeczywiście nową zdolnością wykonawczą, niewyrażalną istniejącą komendą lub parametrem.

**TARGET:** mały zestaw ogólnych komend + cue/parametry. Nazwy `presentMonkeyCue(cueId)`, `playAudioCue(cueId)`, `setWorldVisibility(cueId)` i `startMotion(cueId)` są wyłącznie przykładami koncepcyjnymi, nie istniejącym API.

**CURRENT:** `beginAfterXrCalibration()`, `beginPostRevealSilence()` i `beginControllerOnboarding()` są działającymi adapterami przejściowymi, nie wzorcem `beginX()` dla każdego kolejnego punktu.

## 10. Scenario

**TARGET:** Scenario jest właścicielem authored mainline / Scenario Spine oraz immutable zbiorem danych opisującym akty, numerowane punkty, punkt początkowy, jawne transitions, akceptowane eventy, target, symbolic effects, capabilities, prawdziwe milestones, terminalność i metadata zakresu autorytatywności.

Scenario nie importuje Three.js, DOM ani WebXR; nie odpytuje aktorów, nie mierzy odległości, nie uruchamia timerów runtime, nie pokazuje UI, nie odtwarza audio, nie przesuwa Małpy, nie zapisuje progresji domenowej, nie wykonuje efektów i nie zawiera funkcji zależnych od runtime. Mówi, co powinno wydarzyć się teraz i co może nastąpić później, nie jak narysować, przesunąć, odtworzyć lub animować skutek.

## 11. Director

**TARGET:** Director jest framework-free interpreterem Scenario. Waliduje dane; przechowuje `currentPointId`; rozpoznaje Akt z adresu; przyjmuje event; sprawdza jego dopuszczalność; zwraca `null` albo przechodzi do jawnego targetu; aktualizuje prawdziwe milestones; udostępnia capabilities; zwraca i publikuje immutable change; daje czytelny debug snapshot.

Nie interpretuje Scenario Spine ani arytmetyki point IDs; otrzymuje wyłącznie explicit targets. Nie wykonuje effects, nie wywołuje aktorów, nie importuje runtime ani Three.js, nie czyta DOM, nie odpytuje kontrolerów domenowych, nie ustala sam ukończenia Tieru, nie mierzy timerów i nie posiada drugiej maszyny stanów.

**CURRENT:** kanoniczne API mówi o punktach: `currentPointId`, `initialPointId`, `getCurrentPointId()`. `getCurrentSceneId()` oraz aliasy Scenario `scenes` / `initialSceneId` pozostają przejściową kompatybilnością delegującą do tych samych danych, bez drugiego stanu.

## 12. RuntimeExperience

`RuntimeExperience` jest granicą między decyzją a wykonaniem:

```text
aktor/system emituje event
→ RuntimeExperience przekazuje event Directorowi
→ Director akceptuje transition
→ Director zwraca symbolic effects
→ RuntimeExperience wykonuje wstrzyknięte handlery
→ handler deleguje do aktora
```

Nie podejmuje decyzji fabularnej, nie zmienia targetu, nie interpretuje świata ani przyczyny efektu. Zachowuje kolejność efektów i nie pomija brakującego handlera. Nie jest globalnym event busem ani centralnym store’em progresji.

## 13. Aktorzy i kontrolery domenowe

Aktorzy odpowiadają za wykonanie i lokalny mechanizm: `createVrIntroSequence` wykonuje Intro; Monkey Guide prezentuje komunikaty i opcje; motion actor przesuwa Małpę; fog actor wykonuje reveal; Player Guide renderuje panel Y; ambient sequencer wykonuje audio cue; furnace controllers wykonują Piec; Asterion actor wykonuje budowę, prezentację i ruch; progression controllers przechowują fakty domen.

Aktor może mierzyć lokalny timer, wykrywać koniec animacji lub realny hit, wykonywać ruch, renderować panel, odtwarzać cue i emitować semantyczny fakt. Nie powinien decydować, co fabularnie następuje dalej, poza technicznym legacy jeszcze nieprzeniesionym do Scenario. **CURRENT:** takie legacy może pozostać, lecz ownership musi być jawnie `RETAINED`.

## 14. Małpa

Małpa nie sprawdza samodzielnie, czy Tier 1 jest ukończony, gracz ma Kulę, zestaw skorup jest ukończony, zdobyto pierwszy kryształ ani jaki etap fabularny następuje. Kontrolery domenowe emitują fakty, a Director na podstawie bieżącego punktu zleca np. `MONKEY: P1_FURNACE_AWAKENING`.

Monkey Guide nie ocenia fabularnej poprawności cue i nie kopiuje globalnej progresji. Prezentuje cue, lokalnie wykonuje komunikaty, opcje oraz interakcje i po zakończeniu może emitować event. Nazwy cue Małpy identyfikują treść, nie punkty Scenario.

## 15. Audio

Scenario może zlecić `scene point 4.3 / audioCue: AMBIENT_SMALL_GLYPHS` albo semantycznie `effect: PLAY_AUDIO_CUE / cue: AMBIENT_SMALL_GLYPHS`. Ambient sequencer lub audio actor nie sprawdza Tieru, nie interpretuje fabuły lub Aktu i nie zgaduje powodu aktywacji glifów; wykonuje cue zgodnie ze swoim lifecycle. **CURRENT:** audio pozostaje bez zmian w tym zadaniu.

## 16. Rola `experienceVr.js`

**TARGET:** composition root tworzy świat, kontrolery domenowe, aktorów, Directora i `RuntimeExperience`; łączy eventy aktorów z runtime i effect handlers z aktorami; wykonuje update, reset i dispose.

Nie powinien zawierać rosnących reguł typu „jeśli Intro X, Tier Y i Sphere Z, pokaż A, włącz B, wyłącz C, powiadom Małpę i zmień ambient”. **MIGRATION RULE:** legacy glue może istnieć przejściowo, ale przeniesienie fragmentu usuwa odpowiadającą alternatywną decyzję. Dual ownership (`Scenario decyduje + experienceVr.js decyduje niezależnie`) jest zakazany.

## 17. Relacja z progression controllers

Scenario nie zastępuje kontrolerów domenowych. `createVrProgressionController` nadal wie, które karty zatwierdzono, jaki Tier jest aktualny, czy go ukończono i czy można przyjąć kartę. Scenario wie, jaki punkt jest aktywny, czy `TIER_COMPLETED` jest teraz istotny, dokąd prowadzi i jakie skutki narracyjne lub światowe zlecić.

Kontroler odpowiada „co faktycznie osiągnięto w domenie”; Scenario — „co to osiągnięcie znaczy dla dalszego przebiegu”. Nie tworzy się centralnego store’a kopiującego stany kontrolerów.

## 18. QA shortcuts

QA shortcut nie jest alternatywną fabułą i nie ma własnego Scenario. Może przygotować stan domenowy, ale jawnie synchronizuje wymagane fakty, nie omija nowych gates tak, by ukryć błąd produkcyjny, wymaga parity testu, a jego status jest śledzony osobno od produkcyjnej migracji. **CURRENT:** `applyVrProgressionShortcut.js` pozostaje istniejącym adapterem QA bez zmian działania.

## 19. Historyczny baseline migracji M1.1–M1.8

| Kanoniczny adres | Etykieta | Event kończący punkt | Effect uruchamiający kolejny punkt | Status |
| --- | --- | --- | --- | --- |
| `1.10` | Bootstrap / oczekiwanie na kalibrację XR | `XR_CALIBRATED` | `BEGIN_INTRO_REVEAL` | CURRENT |
| `1.20` | Intro reveal | `INTRO_REVEAL_COMPLETE` | `BEGIN_POST_REVEAL_SILENCE` | CURRENT |
| `1.30` | Cisza po revealu | `POST_REVEAL_SILENCE_COMPLETE` | `BEGIN_CONTROLLER_ONBOARDING` | CURRENT |
| `1.40` | Controller onboarding / oczekiwanie na Player Guide | `PLAYER_OPENED_GUIDE` | `CONTINUE_CONTROLLER_ONBOARDING` | CURRENT; SG-040 MIGRATED |
| `1.50` | Player Guide otwarty / oczekiwanie na controls | `PLAYER_VIEWED_CONTROLS` | `CONTINUE_CONTROLLER_ONBOARDING` | CURRENT; SG-040 MIGRATED |
| `1.60` | Controls obejrzane / oczekiwanie na zamknięcie panelu | `PLAYER_CLOSED_GUIDE` | `CONTINUE_CONTROLLER_ONBOARDING` | CURRENT; SG-040 MIGRATED |
| `1.70` | Pointer tutorial uruchomiony / oczekiwanie na wskazanie Monkey | `MONKEY_HOVERED` | `CONTINUE_CONTROLLER_ONBOARDING` | CURRENT; migrated edge SG-036 |
| `1.80` | Monkey wskazany / oczekiwanie na trigger | `MONKEY_TRIGGERED` | `CONTINUE_CONTROLLER_ONBOARDING` | CURRENT; migrated edge SG-036 |
| `1.100` | Trigger zaakceptowany / seen + invitation legacy | — | — | CURRENT terminal; SG-036 RETAINED |

Na etapie M1.8 punkty były zaimplementowane pod adresami sprzed reindexu; tabela pokazuje ich current canonical addresses `1.10`–`1.100`. M1.7 ma **HARDWARE PASS — Meta Quest 3S**; M1.8 ma **HARDWARE PASS — Meta Quest 3S**. SG-032, SG-039 i SG-040 są `MIGRATED`. SG-036 pozostaje `RETAINED`: migrated edges to `MONKEY_HOVERED` i `MONKEY_TRIGGERED`; remaining legacy to seen/invitation sequence, invitation choices i dalsze decyzje objęte SG-036. Punkt `1.100` jest terminalem current live slice.

## 20. Docelowy kształt danych Scenario

Poniższy przykład jest składniowo niewiążący, lecz semantycznie wiążący dla **TARGET**:

```js
{
  id: 'experience-vr',
  initialPointId: '1.10',
  points: [
    {
      id: '1.10',
      label: 'Bootstrap XR',
      capabilities: [],
      transitions: [{
        event: XR_CALIBRATED,
        target: '1.20',
        milestonesToAdd: [],
        effects: [{ type: BEGIN_INTRO_REVEAL }]
      }]
    },
    {
      id: '1.20',
      label: 'Intro reveal',
      capabilities: [],
      transitions: [{
        event: INTRO_REVEAL_COMPLETE,
        target: '1.30',
        milestonesToAdd: [],
        effects: [{ type: BEGIN_POST_REVEAL_SILENCE }]
      }]
    }
  ]
}
```

**CURRENT:** kod używa `points`, `initialPointId` i stringowych effects; `scenes` / `initialSceneId` są aliasami kompatybilności wskazującymi te same dane. Obiektowy effect z `type` i parametrami jest **FUTURE / NOT IMPLEMENTED**. Przyszły patch zdecyduje, czy rozszerzyć effects o payload, zachowując walidację i kompatybilność. Dokument nie upoważnia do zmiany kodu w tym zadaniu.

## 21. Walidacja numerowanego Scenario

**FUTURE / NOT IMPLEMENTED:** walidator musi zapewnić, że:

- każdy adres jest poprawnym, niepustym stringiem i jest unikalny;
- `initialPointId` i każdy `target` istnieją;
- usunięty adres nie może być ponownie przypisany;
- event, effect, milestone i capability pochodzą z właściwego vocabulary;
- jeden punkt nie ma niejednoznacznych transitions dla tego samego faktu bez jawnego warunku;
- punkt terminalny jest jawnie oznaczony;
- dwa segmenty oznaczają mainline, a 3+ segmenty local branch;
- local branch nie należy do Scenario Spine;
- Director nie wylicza kolejnego adresu ani nie interpretuje spine;
- label nie uczestniczy w tożsamości;
- całe Scenario pozostaje immutable;
- debug snapshot pokazuje `currentPointId`.

Walidacja nie jest implementowana w tym zadaniu.

## 22. Protokół migracji jednego punktu

Poniższa kolejność jest obowiązkowa (**MIGRATION RULE**).

### Krok 1 — zidentyfikuj decyzję legacy

Zapisz ownera, warunek, skutek, timer lub fakt wejściowy, wszystkie fallbacki, QA bypass, reset/lifecycle i identyfikator SG z audytu.

### Krok 2 — wyznacz adres

Nadaj stabilny adres w odpowiednim Akcie. Nie zmieniaj innych adresów bez decyzji Projektanta.

### Krok 3 — określ event

Aktor lub kontroler emituje semantyczny fakt, nie polecenie fabularne.

### Krok 4 — dodaj transition

Scenario określa event, jawny target, effects, capabilities oraz prawdziwe milestones, jeśli istnieją.

### Krok 5 — przygotuj actor seam

Aktor po emisji faktu zatrzymuje się na bezpiecznej granicy i nie podejmuje następnej decyzji fabularnej. Nie dodawaj publicznej funkcji, jeżeli ogólny adapter potrafi wykonać cue.

### Krok 6 — podłącz RuntimeExperience

Runtime wykonuje effect przez wstrzyknięty handler; brak handlera jest błędem programistycznym.

### Krok 7 — usuń dual ownership

Usuń dokładnie odpowiadającą decyzję z aktora, `experienceVr.js`, innego kontrolera i fallbacku. Mechaniczne wykonanie pozostaje w aktorze.

### Krok 8 — zachowaj parity

Sprawdź zwykły przebieg, reset, re-entry, QA bypass, dokładnie jedno wywołanie, brak podwójnych listenerów, niezmienione timery i copy oraz hardware QA, gdy dotyczy.

### Krok 9 — zaktualizuj rejestr

Grupa SG jest `MIGRATED` dopiero po uzyskaniu jednego ownera dla całego zakresu. `PARTIAL` nie jest czwartym statusem: częściowe pokrycie zapisuje listę przeniesionych edge’ów, a grupa pozostaje `RETAINED`. Dozwolone statusy to `MIGRATED`, `RETAINED`, `REMOVED`.

### Krok 10 — mały commit i Summary

Paczka obejmuje jeden spójny punkt albo bardzo małą grupę nierozdzielnych transitions. Nie łączy migracji z pobocznym refaktorem.

## 23. Rejestr migracji

Obowiązkowy format przyszłych synchronizacji:

| Scenario point | Akt | Label | Legacy owner | Legacy SG | Producer event | Target | Effects/cues | Group status | Runtime status | Automated QA | Hardware QA |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `1.10` | 1 | Bootstrap XR | `experienceVr.js` calibration handoff | SG-032 | `XR_CALIBRATED` | `1.20` | `BEGIN_INTRO_REVEAL` | `MIGRATED` | CURRENT live pod kanonicznym point ID | istniejące testy kontraktu | M1.1 PASS, Quest 3S, 2026-08-12 |
| `1.20` | 1 | Intro reveal | `createVrIntroSequence` reveal completion seam | SG-039 edge: reveal completion | `INTRO_REVEAL_COMPLETE` | `1.30` | `BEGIN_POST_REVEAL_SILENCE` | `MIGRATED` | CURRENT live pod kanonicznym point ID | istniejące testy kontraktu | M1.2 PASS, Quest 3S, 2026-08-12 |
| `1.30` | 1 | Cisza po revealu | `createVrIntroSequence` actor-owned timer/completion seam | SG-039 | `POST_REVEAL_SILENCE_COMPLETE` | `1.40` | `BEGIN_CONTROLLER_ONBOARDING` | `MIGRATED` | CURRENT live pod kanonicznym point ID | istniejące testy kontraktu | M1.3 PENDING — niewykonane |
| `1.40` | 1 | Controller onboarding | `createVrIntroSequence` wykrywa faktyczne otwarcie | SG-040 | `PLAYER_OPENED_GUIDE` | `1.50` | `CONTINUE_CONTROLLER_ONBOARDING` | `MIGRATED` | CURRENT live | testy Director/Runtime/aktora/kontraktu | M1.4 PASS, Quest 3S |
| `1.50` | 1 | Oczekiwanie na controls | `createVrIntroSequence` wykrywa controls DETAIL | SG-040 | `PLAYER_VIEWED_CONTROLS` | `1.60` | `CONTINUE_CONTROLLER_ONBOARDING` | `MIGRATED` | CURRENT live | testy Director/Runtime/aktora/kontraktu | M1.5 PASS, Quest 3S |
| `1.60` | 1 | Oczekiwanie na zamknięcie panelu | `createVrIntroSequence` wykrywa fizyczne zamknięcie | SG-040 | `PLAYER_CLOSED_GUIDE` | `1.70` | `CONTINUE_CONTROLLER_ONBOARDING` | `MIGRATED` | CURRENT live; Runtime uruchamia pointer tutorial | testy Director/Runtime/aktora/kontraktu | M1.6 PASS — Quest 3S |
| `1.70` | 1 | Oczekiwanie na wskazanie Monkey | `createVrIntroSequence` wykrywa realny hover | SG-036 | `MONKEY_HOVERED` | `1.80` | `CONTINUE_CONTROLLER_ONBOARDING` | `RETAINED` | CURRENT live; migrated edge `MONKEY_HOVERED` | testy Director/Runtime/aktora/kontraktu | M1.7 PASS — Quest 3S |
| `1.80` | 1 | Monkey wskazany / oczekiwanie na trigger | `createVrIntroSequence` wykrywa realny press | SG-036 | `MONKEY_TRIGGERED` | `1.100` | `CONTINUE_CONTROLLER_ONBOARDING` | `RETAINED` | CURRENT live; migrated edge `MONKEY_TRIGGERED` | testy Director/Runtime/aktora/kontraktu | M1.8 PASS — Quest 3S |
| `1.100` | 1 | Trigger zaakceptowany / seen + invitation legacy | legacy Intro actor | SG-036 | — | — | — | `RETAINED` | CURRENT terminal; seen/invitation i dalsze decyzje pozostają legacy | parity istniejącego aktora | M1.8 PASS — Quest 3S |

Wpis powstaje przed migracją lub razem z nią; niewdrożone punkty nie są live; target address i current owner są widoczne razem. `MIGRATED` oznacza brak dual ownership. Hardware QA nie wynika z automatycznych testów. Usunięte adresy pozostają jako `REMOVED`. Rejestr nie zastępuje kodu ani testów. Powyższe wpisy obejmują wyłącznie live slice M1.1–M1.8, zamknięte SG-040 i migrated edge `MONKEY_HOVERED`; SG-036 pozostaje `RETAINED`.

## 24. Debugowanie i wyszukiwanie

**TARGET:**

```text
ACT 1
POINT 1.30
EVENT POST_REVEAL_SILENCE_COMPLETE
TARGET 1.40
EFFECT BEGIN_CONTROLLER_ONBOARDING
```

```js
{
  currentPointId: '1.30',
  actId: '1',
  lastEvent: 'POST_REVEAL_SILENCE_COMPLETE',
  lastTargetPointId: '1.40',
  milestones: [],
  capabilities: []
}
```

To **FUTURE / NOT IMPLEMENTED**, nie obecny kontrakt snapshotu. Numer punktu ma być podstawowym adresem raportów, testów, logów, promptów Codexa, bugów, manualnego QA i dokumentacji narracyjnej, np.: „Akt 1, punkt 1.30: po `POST_REVEAL_SILENCE_COMPLETE` Director powinien przejść do `1.40`”.

## 25. Zasady dla przyszłych promptów Codex

Prompt migracyjny musi podać: source point, target, legacy ownera, event producenta, symbolic effect, aktora wykonawczego, potrzebę nowej zdolności aktora, status SG, reset/re-entry, QA bypass, zakres testów, hardware QA i zakaz pobocznego refaktoru.

Nie może automatycznie żądać nowej nazwanej sceny, publicznej funkcji, milestone’u ani callbacku tylko dlatego, że migrowany jest punkt. Każdy taki element wymaga osobnego uzasadnienia.

## 26. Antywzorce

Jawnie zakazane są:

```text
jeden punkt = jedna nowa nazwana scena
jeden punkt = jedna nowa publiczna funkcja
jeden punkt = jeden milestone
jeden punkt = jeden unikalny handler

aktor sam sprawdza globalną progresję
Monkey Guide sam wybiera fabularny komunikat na podstawie Tieru
ambient sequencer sam interpretuje etap fabularny
experienceVr.js łączy kilka domen w nowe warunki fabularne
Director wykonuje Three.js, UI, audio albo ruch
Scenario przechowuje kopię stanu wszystkich kontrolerów
QA shortcut staje się alternatywną progresją
jawne przejście Scenario istnieje równolegle z legacy fallbackiem
adres punktu jest wyliczany albo sortowany jako liczba
```

## 27. Granice obecnego etapu

```text
CURRENT:
M1.12 THRESHOLD CHOICE BRANCH — HARDWARE PASS, Meta Quest 3S.
M1.13 FOLLOW PAUSE-RESUME HANDOFF — HARDWARE PASS, Meta Quest 3S.
SG-036 i SG-041 są MIGRATED; SG-042 jest RETAINED.
Canonical Story Reindex jest IMPLEMENTED / behavior-neutral; regression PASS, Meta Quest 3S.
LIVE authority kończy się na 1.130, gdzie rozpoczyna się CROSSING; 100.10 jest LIVE EXIT.
1.90 jest RESERVED / WATER CRYSTAL TUTORIAL / NOT IMPLEMENTED.
Director operuje na currentPointId i wyłącznie explicit targets.
```

```text
TARGET / NOT IMPLEMENTED:
Scenario-owned Mainline Spine, builder, normalizer i point-ID arithmetic nie istnieją.
Approved WATER crystal tutorial insert nie jest punktem LIVE.
```

## 28. One-time Canonical Story Reindex Migration

**IMPLEMENTED:** current production Scenario i testy używają flat-mainline addresses opisanych w sekcji 1.1. Była to wyłącznie corrective structural migration: żadnego nowego edge, eventu, effectu, milestone ani gameplayu. Retired addresses pozostają tylko w tabeli migracyjnej i zapisie historycznym.

The M1.8–M1.12 sections below are chronological stage snapshots. Their terminal points, pending QA and retained-group statements describe those stages, not the binding CURRENT status in §27 and the M1.13 boundary section.

## M1.8 Monkey Trigger Handoff — historical stage synchronization

M1.7: **HARDWARE PASS — Meta Quest 3S**. M1.8 **MONKEY TRIGGER HANDOFF**: **HARDWARE PASS — Meta Quest 3S**. Current ending chain is `1.70 → MONKEY_HOVERED → 1.80 → MONKEY_TRIGGERED → 1.100`; `1.100` is “Trigger zaakceptowany / seen + invitation legacy” and terminal for this live slice. `CONTINUE_CONTROLLER_ONBOARDING` remains the sole continuation effect.

Status: SG-032, SG-039 and SG-040 are **MIGRATED**; SG-036 is **RETAINED**. Its migrated edges are `MONKEY_HOVERED` and `MONKEY_TRIGGERED`. Its remaining legacy is the seen/invitation sequence, invitation choices, and further P0 follow/ending/threshold decisions. No `INTRO_INVITATION_SELECTED` transition is live.


## M1.9 Numeric Choice Routing Foundation — IMPLEMENTED

Transition może opcjonalnie deklarować `choice` jako dodatnią liczbę całkowitą. W obrębie punktu dany event jest albo pojedynczym transition event-only, albo zbiorem choice-routed transitions, w którym każda para `(event, choice)` jest unikalna. Mieszanie obu modeli nie tworzy fallbacku i jest odrzucane podczas walidacji. Dla choice-routed eventu `dispatch(eventType, payload)` dopasowuje wyłącznie `payload.choice`; brak lub nieprawidłowy/nieistniejący wariant zwraca `null` bez zmiany stanu, efektów i notyfikacji. Event-only zachowuje dotychczasową semantykę także z dodatkowym payloadem.

`choice` nie jest point ID ani targetem. `choice: 2` nigdy nie oznacza `currentPoint + '.2'`; Director korzysta wyłącznie z jawnego `target` zapisanego w Scenario, który legalnie może wskazywać np. `7.4.9` lub `100.10`. Podobieństwo numeric choice i numeric hierarchy służy wyłącznie czytelności autora i nie tworzy sprzężenia algorytmicznego.

M1.9 nie rozszerza live Scenario: produkcyjny terminal pozostaje `1.100`, nie istnieje live transition `INTRO_INVITATION_SELECTED`, invitation pozostaje legacy, a SG-036 pozostaje **RETAINED** wyłącznie z migrated edges `MONKEY_HOVERED` i `MONKEY_TRIGGERED`. M1.8 zachowuje **HARDWARE PASS — Meta Quest 3S**. Hardware QA dla samego M1.9: **N/A**, ponieważ żaden production transition jeszcze nie używa `choice`; automatyczna regresja potwierdza niezmieniony live M1.8.

## M1.10 — Intro invitation choice branch (current)

M1.10 **INTRO INVITATION CHOICE BRANCH** is IMPLEMENTED — HARDWARE QA PENDING. Stable numeric choices are Scenario facts; current labels are presentation copy only.

```text
1.100
├── choice 1 → 1.110
├── choice 2 → 1.100.1
└── choice 3 → 100.10

1.100.1
├── choice 1 → 1.110
├── choice 2 → 1.100.1
└── choice 3 → 100.10
```

Every accepted edge emits `CONTINUE_INTRO_INVITATION` and adds no milestone. `1.110` and `100.10` are terminal in the current slice. `100.10` is the current LIVE terminal `EXIT EXPERIENCE VR`; `100.1` remains RESERVED / FUTURE. SG-036 and SG-041 remain RETAINED.


## M1.11 — Monkey reached threshold handoff (current)

**IMPLEMENTED — HARDWARE QA PENDING.** M1.10 has **HARDWARE PASS — Meta Quest 3S**.

Scenario now owns the edge `1.110 → MONKEY_REACHED_THRESHOLD → 1.120`. It adds no milestone and emits only `PRESENT_THRESHOLD_CHOICE`. Point `1.120` means “Monkey reached the threshold / threshold dialogue presented”; it is terminal for the current slice and has no `THRESHOLD_SELECTED` transition. The Runtime effect resumes the actor through its state-guarded presentation seam; threshold options and their selection remain legacy.

SG-032, SG-039 and SG-040 are **MIGRATED**. SG-036 and SG-041 remain **RETAINED**. M1.11 migrates only the `MONKEY_REACHED_THRESHOLD` edge; remaining SG-041 still includes pause/resume distance decisions, `FOLLOW_PAUSE_CHANGED`, and movement/follow policy requiring later migration.

## M1.12 — Threshold choice branch (current)

**HARDWARE PASS — Meta Quest 3S.** M1.11 has **HARDWARE PASS — Meta Quest 3S**.

`THRESHOLD_SELECTED` carries only numeric `{ choice }`. Scenario owns both explicit threshold routing sets; every accepted edge adds no milestone and emits the single `CONTINUE_THRESHOLD_CHOICE` effect:

```text
1.120
├── choice 1 → 1.130
├── choice 2 → 1.120.1
└── choice 3 → 100.10

1.120.1
├── choice 1 → 1.130
├── choice 2 → 1.120.1
└── choice 3 → 100.10
```

`1.130` is the terminal CROSS point of the current slice. Choice 2 is an explicit self-loop while the actor replays the unchanged answer and options. `100.10` is LIVE EXIT EXPERIENCE VR; `100.1` remains RESERVED / FUTURE. After verification against the historical audit, SG-036 is **MIGRATED**: all its narrative decisions through threshold selection are Scenario-owned. SG-041 remains **RETAINED** because pause/resume follow policy and `FOLLOW_PAUSE_CHANGED` remain actor-owned.

## M1.13 — Follow pause-resume handoff (current)

**HARDWARE PASS — Meta Quest 3S.** LIVE point `1.110` oznacza aktywne FOLLOWING, a LIVE `1.110.1` oznacza „FOLLOWING / Monkey waiting for player”. `1.110.1` jest local branch punktu `1.110` i nie należy do przyszłego Scenario Spine. Scenario Spine pozostaje **TARGET / NOT IMPLEMENTED**, a `1.90` **RESERVED / NOT IMPLEMENTED**.

Actor zachowuje physical sensing (head/Monkey position, grace/pause/resume distances), motion, stop radius i fog interpolation. Po grace emituje wyłącznie `FOLLOW_PAUSE_CHANGED { paused }` i bez synchronicznej kontynuacji czeka w `WAIT_RUNTIME_AFTER_FOLLOW_PAUSE_CHANGED`. Current point, nie payload, wybiera jawny target: `1.110 → 1.110.1` albo `1.110.1 → 1.110`. Jeden effect `APPLY_FOLLOW_PAUSE_STATE` deleguje mechaniczną zmianę `walkingPaused` i istniejącego komunikatu do `continueFollowPauseChanged(paused)`. Nie dodano milestone, predicate/guard DSL ani numeric choice.

Punktowa weryfikacja audytu zamyka **SG-041 = MIGRATED**: po M1.11 arrival oraz M1.13 pause/resume nie pozostał w tej grupie narrative decision owner; sensory odległości, motion i fog są actor-local mechanics. SG-036 pozostaje **MIGRATED**.


## CURRENT architectural boundary after M1.13

Scenario/Director authority currently ends at LIVE `1.130`, where **CROSSING begins**. The next unmigrated legacy block is `CROSSING → ENTERING_RING → MONKEY_SETTLING → GLYPH_FREE_EXPLORE`. `PLAYER_ENTERED_RING`, `MONKEY_SETTLED` and `GLYPH_FREE_EXPLORE_STARTED` are **NOT Scenario-owned / NOT IMPLEMENTED as migrations**. This block is **SG-042 = RETAINED** and is the natural next analysis/migration boundary; no final API or point tree is established here. Act 2 (`2.x`, Próg I) and any `1.150 → 2.10` transition remain TARGET / NOT IMPLEMENTED.

M1.13 hardware QA is **PASS — Meta Quest 3S**, manually confirmed by the Designer: GO walking and grace distance work without regression; Monkey pauses when the player remains behind; the existing “Idziesz?” message works and remains visible during pause; approaching clears it and resumes movement; repeated pause/resume does not deadlock; after resume Monkey reaches the threshold; and threshold flow works after migration.

After M1.13 the actor/mechanics own head and Monkey positions, distance, `followGraceDistance`, `pauseDistance`, `resumeDistance`, `stopRadius`, `guideSpeed`, actual movement and fog interpolation. Scenario/Director own legality of semantic pause (`1.110 → 1.110.1`), resume (`1.110.1 → 1.110`) and `MONKEY_REACHED_THRESHOLD` (`1.110 → 1.120`). Route selection follows the current Scenario point; `payload.paused` remains execution data, not a route selector.
