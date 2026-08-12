# Experience VR — Scenario, Director i model migracji progresji

Status: **kanoniczny model architektoniczny i protokół migracji**. Oznaczenia normatywne używane w dokumencie: **CURRENT**, **TARGET**, **MIGRATION RULE**, **FUTURE / NOT IMPLEMENTED**.

## 1. Cel i status dokumentu

Dokument definiuje Scenario Experience VR, Directora, `RuntimeExperience`, aktorów i kontrolery domenowe; sposób adresowania punktów przebiegu; krokowe przenoszenie istniejącej progresji do Scenario; rozdział adresów punktów od nazw eventów, efektów i cue; oraz docelowe ograniczanie odpowiedzialności `experienceVr.js`.

Jest źródłem prawdy dla wszystkich następnych etapów migracji Scenario + Director. **CURRENT:** kod jest dowodem tego, co wdrożono. **TARGET:** każda dalsza migracja musi być projektowana według niniejszego modelu. Dokument nie zmienia kodu ani nie uznaje elementów docelowych za wdrożone.

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

## 5. Kanon numerowania

### 5.1. Format

**TARGET / MIGRATION RULE:** adres jest stringiem dodatnich segmentów liczbowych rozdzielonych kropkami, np. `1.1`, `1.2`, `1.3`, `1.1.1`, `1.1.1.1`, `2.1`. Pierwszy segment oznacza Akt, dalsze — punkt i podpunkty. Nie wolno przechowywać adresu jako liczby zmiennoprzecinkowej.

```js
id: '1.3' // poprawnie
id: 1.3   // niepoprawnie
```

### 5.2. Stabilność

Raz opublikowany adres pozostaje stabilny. Nie renumeruje się punktów dla estetyki. Luki, np. `1.1`, `1.3`, `1.4`, są prawidłowe, a usunięcie `1.2` nie zmienia pozostałych adresów. Usuniętego adresu nie wolno użyć ponownie dla innego znaczenia; pozostaje w rejestrze jako `REMOVED` albo zarezerwowany.

### 5.3. Wstawianie

Punkt wstawiony pomiędzy `1.1` i `1.2` otrzymuje `1.1.1`; kolejne w tym miejscu mogą otrzymać `1.1.2`, `1.1.3`. Punkt pomiędzy `1.1.1` i `1.1.2` może otrzymać `1.1.1.1`. Nie następuje automatyczna renumeracja reszty Scenario.

### 5.4. Przenoszenie

Położenie zmienia się przede wszystkim przez zmianę jawnych transitions. Jeżeli Projektant świadomie zmienia adres, stary adres zostaje oznaczony jako usunięty lub zastąpiony, wszystkie jawne odwołania są aktualizowane, rejestr zapisuje zmianę, a cicha renumeracja jest zakazana.

### 5.5. Porządek

Director nie wylicza następnego punktu matematycznie (`1.3 + 0.1 = 1.4` jest niedozwolonym założeniem), nie opiera przebiegu na kolejności tablicy i nie sortuje adresów leksykograficznie. Każde przejście wskazuje jawny `target`.

## 6. Jawne przejścia, skoki, pętle i powroty

Każdy punkt mówi: gdzie jesteśmy, na jaki fakt czekamy, jaki skutek zlecamy i dokąd idziemy.

```js
{
  id: '1.3',
  label: 'Cisza po revealu',
  transitions: [{
    event: POST_REVEAL_SILENCE_COMPLETE,
    target: '1.4',
    effects: [BEGIN_CONTROLLER_ONBOARDING]
  }]
}
```

Rozgałęzienie jest listą jawnych alternatyw:

```js
{
  id: '1.8',
  label: 'Zaproszenie',
  transitions: [
    { event: INVITATION_GO_SELECTED, target: '1.9', effects: [START_MONKEY_FOLLOW] },
    { event: INVITATION_WHERE_SELECTED, target: '1.8.1', effects: [PRESENT_INVITATION_EXPLANATION] },
    { event: INVITATION_NO_SELECTED, target: '1.15', effects: [END_XR_SESSION] }
  ]
}
```

Powrót również jest jawny:

```js
{
  id: '1.8.1',
  label: 'Odpowiedź: dokąd?',
  transitions: [{
    event: MESSAGE_SEQUENCE_COMPLETE,
    target: '1.8',
    effects: [PRESENT_INVITATION_OPTIONS]
  }]
}
```

Skok nie jest błędem, powrót nie jest ukrytym zachowaniem, a pętla jest jawną parą transitions. Director nie ma domyślnego „następnego punktu”. Nie wprowadza się ukrytego call stacku Scenario bez osobnej zatwierdzonej potrzeby. Punkt terminalny musi być oznaczony jawnie.

## 7. Numer jest adresem, nazwa jest etykietą

`id: '1.3'` jest tożsamością punktu; opcjonalne `label: 'Cisza po revealu'` jest etykietą dla człowieka i może się zmienić bez zmiany adresu.

**CURRENT:** działający slice M1.1–M1.7 używa kanonicznych, stabilnych point IDs `1.1`–`1.4.4`; opisowe nazwy pozostają wyłącznie etykietami dla człowieka.

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

**TARGET:** Scenario jest immutable zbiorem danych opisującym akty, numerowane punkty, punkt początkowy, jawne transitions, akceptowane eventy, target, symbolic effects, capabilities, prawdziwe milestones, terminalność i metadata zakresu autorytatywności.

Scenario nie importuje Three.js, DOM ani WebXR; nie odpytuje aktorów, nie mierzy odległości, nie uruchamia timerów runtime, nie pokazuje UI, nie odtwarza audio, nie przesuwa Małpy, nie zapisuje progresji domenowej, nie wykonuje efektów i nie zawiera funkcji zależnych od runtime. Mówi, co powinno wydarzyć się teraz i co może nastąpić później, nie jak narysować, przesunąć, odtworzyć lub animować skutek.

## 11. Director

**TARGET:** Director jest framework-free interpreterem Scenario. Waliduje dane; przechowuje `currentPointId`; rozpoznaje Akt z adresu; przyjmuje event; sprawdza jego dopuszczalność; zwraca `null` albo przechodzi do jawnego targetu; aktualizuje prawdziwe milestones; udostępnia capabilities; zwraca i publikuje immutable change; daje czytelny debug snapshot.

Nie wykonuje effects, nie wywołuje aktorów, nie importuje runtime ani Three.js, nie czyta DOM, nie odpytuje kontrolerów domenowych, nie ustala sam ukończenia Tieru, nie mierzy timerów i nie posiada drugiej maszyny stanów.

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

## 19. CURRENT dla M1.1–M1.7

| Kanoniczny adres | Etykieta | Event kończący punkt | Effect uruchamiający kolejny punkt | Status |
| --- | --- | --- | --- | --- |
| `1.1` | Bootstrap / oczekiwanie na kalibrację XR | `XR_CALIBRATED` | `BEGIN_INTRO_REVEAL` | CURRENT |
| `1.2` | Intro reveal | `INTRO_REVEAL_COMPLETE` | `BEGIN_POST_REVEAL_SILENCE` | CURRENT |
| `1.3` | Cisza po revealu | `POST_REVEAL_SILENCE_COMPLETE` | `BEGIN_CONTROLLER_ONBOARDING` | CURRENT |
| `1.4` | Controller onboarding / oczekiwanie na Player Guide | `PLAYER_OPENED_GUIDE` | `CONTINUE_CONTROLLER_ONBOARDING` | CURRENT; SG-040 MIGRATED |
| `1.4.1` | Player Guide otwarty / oczekiwanie na controls | `PLAYER_VIEWED_CONTROLS` | `CONTINUE_CONTROLLER_ONBOARDING` | CURRENT; SG-040 MIGRATED |
| `1.4.2` | Controls obejrzane / oczekiwanie na zamknięcie panelu | `PLAYER_CLOSED_GUIDE` | `CONTINUE_CONTROLLER_ONBOARDING` | CURRENT; SG-040 MIGRATED |
| `1.4.3` | Pointer tutorial uruchomiony / oczekiwanie na wskazanie Monkey | `MONKEY_HOVERED` | `CONTINUE_CONTROLLER_ONBOARDING` | CURRENT; migrated edge SG-036 |
| `1.4.4` | Monkey wskazany / oczekiwanie na trigger | — | — | CURRENT terminal; SG-036 RETAINED |

M1.1–M1.7 są zaimplementowane i live pod kanonicznymi adresami `1.1`–`1.4.4`. M1.6 ma **HARDWARE PASS — Meta Quest 3S**; M1.7 oczekuje hardware QA. SG-032, SG-039 i SG-040 są `MIGRATED`. SG-036 pozostaje `RETAINED`: migrated edge to `MONKEY_HOVERED`; remaining legacy to `MONKEY_TRIGGERED`, seen/invitation flow i dalsze decyzje objęte SG-036. Punkt `1.4.4` jest terminalem current live slice.

## 20. Docelowy kształt danych Scenario

Poniższy przykład jest składniowo niewiążący, lecz semantycznie wiążący dla **TARGET**:

```js
{
  id: 'experience-vr',
  initialPointId: '1.1',
  points: [
    {
      id: '1.1',
      label: 'Bootstrap XR',
      capabilities: [],
      transitions: [{
        event: XR_CALIBRATED,
        target: '1.2',
        milestonesToAdd: [],
        effects: [{ type: BEGIN_INTRO_REVEAL }]
      }]
    },
    {
      id: '1.2',
      label: 'Intro reveal',
      capabilities: [],
      transitions: [{
        event: INTRO_REVEAL_COMPLETE,
        target: '1.3',
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
- Director nie wylicza kolejnego adresu;
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
| `1.1` | 1 | Bootstrap XR | `experienceVr.js` calibration handoff | SG-032 | `XR_CALIBRATED` | `1.2` | `BEGIN_INTRO_REVEAL` | `MIGRATED` | CURRENT live pod kanonicznym point ID | istniejące testy kontraktu | M1.1 PASS, Quest 3S, 2026-08-12 |
| `1.2` | 1 | Intro reveal | `createVrIntroSequence` reveal completion seam | SG-039 edge: reveal completion | `INTRO_REVEAL_COMPLETE` | `1.3` | `BEGIN_POST_REVEAL_SILENCE` | `MIGRATED` | CURRENT live pod kanonicznym point ID | istniejące testy kontraktu | M1.2 PASS, Quest 3S, 2026-08-12 |
| `1.3` | 1 | Cisza po revealu | `createVrIntroSequence` actor-owned timer/completion seam | SG-039 | `POST_REVEAL_SILENCE_COMPLETE` | `1.4` | `BEGIN_CONTROLLER_ONBOARDING` | `MIGRATED` | CURRENT live pod kanonicznym point ID | istniejące testy kontraktu | M1.3 PENDING — niewykonane |
| `1.4` | 1 | Controller onboarding | `createVrIntroSequence` wykrywa faktyczne otwarcie | SG-040 | `PLAYER_OPENED_GUIDE` | `1.4.1` | `CONTINUE_CONTROLLER_ONBOARDING` | `MIGRATED` | CURRENT live | testy Director/Runtime/aktora/kontraktu | M1.4 PASS, Quest 3S |
| `1.4.1` | 1 | Oczekiwanie na controls | `createVrIntroSequence` wykrywa controls DETAIL | SG-040 | `PLAYER_VIEWED_CONTROLS` | `1.4.2` | `CONTINUE_CONTROLLER_ONBOARDING` | `MIGRATED` | CURRENT live | testy Director/Runtime/aktora/kontraktu | M1.5 PASS, Quest 3S |
| `1.4.2` | 1 | Oczekiwanie na zamknięcie panelu | `createVrIntroSequence` wykrywa fizyczne zamknięcie | SG-040 | `PLAYER_CLOSED_GUIDE` | `1.4.3` | `CONTINUE_CONTROLLER_ONBOARDING` | `MIGRATED` | CURRENT live; Runtime uruchamia pointer tutorial | testy Director/Runtime/aktora/kontraktu | M1.6 PASS — Quest 3S |
| `1.4.3` | 1 | Oczekiwanie na wskazanie Monkey | `createVrIntroSequence` wykrywa realny hover | SG-036 | `MONKEY_HOVERED` | `1.4.4` | `CONTINUE_CONTROLLER_ONBOARDING` | `RETAINED` | CURRENT live; migrated edge `MONKEY_HOVERED` | testy Director/Runtime/aktora/kontraktu | M1.7 PENDING — Quest 3S |
| `1.4.4` | 1 | Monkey wskazany / oczekiwanie na trigger | legacy Intro actor | SG-036 | — | — | — | `RETAINED` | CURRENT terminal; `MONKEY_TRIGGERED`, seen/invitation i dalsze decyzje pozostają legacy | parity istniejącego aktora | M1.7 PENDING — Quest 3S |

Wpis powstaje przed migracją lub razem z nią; niewdrożone punkty nie są live; target address i current owner są widoczne razem. `MIGRATED` oznacza brak dual ownership. Hardware QA nie wynika z automatycznych testów. Usunięte adresy pozostają jako `REMOVED`. Rejestr nie zastępuje kodu ani testów. Powyższe wpisy obejmują wyłącznie live slice M1.1–M1.7, zamknięte SG-040 i migrated edge `MONKEY_HOVERED`; SG-036 pozostaje `RETAINED`.

## 24. Debugowanie i wyszukiwanie

**TARGET:**

```text
ACT 1
POINT 1.3
EVENT POST_REVEAL_SILENCE_COMPLETE
TARGET 1.4
EFFECT BEGIN_CONTROLLER_ONBOARDING
```

```js
{
  currentPointId: '1.3',
  actId: '1',
  lastEvent: 'POST_REVEAL_SILENCE_COMPLETE',
  lastTargetPointId: '1.4',
  milestones: [],
  capabilities: []
}
```

To **FUTURE / NOT IMPLEMENTED**, nie obecny kontrakt snapshotu. Numer punktu ma być podstawowym adresem raportów, testów, logów, promptów Codexa, bugów, manualnego QA i dokumentacji narracyjnej, np.: „Akt 1, punkt 1.3: po `POST_REVEAL_SILENCE_COMPLETE` Director powinien przejść do `1.4`”.

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
M0–M1.7, włącznie z MONKEY HOVER HANDOFF, są wdrożone.
Scenario używa kanonicznych point IDs 1.1–1.4.4.
Director używa currentPointId; legacy scene API jest wyłącznie aliasem.
RuntimeExperience wykonuje live effects, a CONTINUE_CONTROLLER_ONBOARDING jest jedyną ścieżką continuation SG-040.
SG-032 i SG-039 są MIGRATED.
SG-040 jest MIGRATED; SG-036 pozostaje RETAINED, z migrated edge MONKEY_HOVERED.
```

```text
CURRENT:
Scenario używa stabilnych numerowanych point IDs.
Director operuje na currentPointId.
Nazwy eventów, efektów i cue pozostają semantycznym vocabulary.
Nowy punkt nie wymusza nowej funkcji.
experienceVr.js pozostaje composition rootem.
```

```text
IMPLEMENTED BOUNDARY:
Działające M1.1–M1.7 są odwzorowane na punkty 1.1–1.4.4.
SG-040 jest MIGRATED. SG-036 pozostaje RETAINED: MONKEY_HOVERED jest migrated edge, a MONKEY_TRIGGERED, seen/invitation flow i dalsze decyzje pozostają legacy; punkt 1.4.4 jest terminalem current slice.
```
