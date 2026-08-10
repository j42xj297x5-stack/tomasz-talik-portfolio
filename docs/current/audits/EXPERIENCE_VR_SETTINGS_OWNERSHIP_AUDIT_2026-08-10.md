# Audyt własności kontraktu Experience VR settings — 2026-08-10

Zakres audytu ograniczono do `src/config/experienceVrSettings.js`, `public/data/experience-vr-settings.json`, call-site loadera w `src/experienceVr.js`, bezpośrednich testów settings oraz punktowej historii Git tych plików. Nie audytowano pozostałego runtime; dwa miejsca konsumenckiego fallbacku sprawdzono wyłącznie po to, aby sklasyfikować trzy wskazane pola.

## 1. Aktualny przepływ settings

1. `src/experienceVr.js:10,122-123` importuje `loadExperienceVrSettings()`, wywołuje go raz przed utworzeniem renderera i przekazuje dalej wyłącznie `loadedSettings.settings`.
2. Loader (`src/config/experienceVrSettings.js:693-706`) pobiera przez `fetch` URL `data/experience-vr-settings.json` z `cache: 'no-cache'`.
3. Odpowiedź musi być HTTP `ok`, poprawnym JSON-em i zawierać dokładnie `schemaVersion: 1`. Dopiero wtedy obiekt trafia do `normalizeExperienceVrSettings()` i źródło diagnostyczne ma wartość `server`.
4. Dowolny błąd pobrania, status HTTP nie-OK, błąd parsowania JSON albo brak/inna wersja schematu przechodzi wspólną ścieżką `catch`: runtime dostaje klon `DEFAULT_EXPERIENCE_VR_SETTINGS`, `settingsSource: 'defaults'` i tekst błędu w `settingsLoadError`.
5. Normalizer (`src/config/experienceVrSettings.js:276-690`) buduje zamknięty, pełny obiekt wynikowy. Dla każdego obsługiwanego brakującego lub nieprawidłowego pola dobiera wartość z defaults (nie wykonuje zwykłego głębokiego merge całego obiektu). Nieznane pola są usuwane.

Konsekwencje konkretnych wejść:

| Sytuacja | Loader | Sam normalizer |
| --- | --- | --- |
| Brak public JSON / HTTP 404 / błąd sieci | `catch`, pełne defaults, źródło `defaults` | nie dotyczy |
| Poprawny JSON `{}` | odrzucony z `Unsupported schemaVersion: undefined`, pełne defaults | zwraca klon pełnych defaults, ponieważ wersja jest niezgodna |
| Częściowy JSON z jedną zmianą **i `schemaVersion: 1`** | przyjmuje zmianę, resztę uzupełnia z defaults, źródło `server` | tak samo |
| Częściowy JSON z jedną zmianą **bez `schemaVersion: 1`** | odrzucony, pełne defaults | pełne defaults; zmiana jest ignorowana |
| Niepoprawna składnia JSON | błąd `response.json()` trafia do `catch`, pełne defaults | normalizer nie otrzymuje obiektu |

## 2. Rola defaults

`DEFAULT_EXPERIENCE_VR_SETTINGS` jest kompletnym, wykonywalnym i wersjonowanym kontraktem bazowym:

- zawiera `schemaVersion` oraz pełny zestaw ustawień (`src/config/experienceVrSettings.js:5-262`);
- jest fallbackiem na poziomie każdego pola obsługiwanego przez normalizer;
- jest samodzielnym fallbackiem całego loadera w razie niedostępnego lub wadliwego zasobu;
- `normalizeExperienceVrSettings(null)` oraz kandydat z nieobsługiwaną wersją zwracają jego klon;
- testy bezpośrednio asercjami utrwalają wiele konkretnych wartości właśnie w defaults (`tests/experience-vr-settings.test.mjs:9-52`).

To czyni defaults kanonicznym źródłem wartości bazowych. Aplikacja nie potrzebuje publicznego pliku, aby uzyskać kompletny kontrakt.

## 3. Rola public JSON

Publiczny JSON jest **opcjonalną, wersjonowaną warstwą sparse override pobieraną w runtime**. Technicznie może nadpisać obsługiwane pola i dlatego jest także wygodną warstwą tuningu/deploymentu, ale „development tuning layer” opisuje możliwe zastosowanie, nie odrębny kontrakt. Nie jest głównym źródłem kompletnej konfiguracji: obecnie ma tylko 121 liści skalarnych wobec 330 w defaults, a brakujące sekcje są normalnie odtwarzane z defaults.

Nie jest też wyłącznie nieaktywną pozostałością starszej architektury: call-site aktywnie uruchamia loader, loader aktywnie pobiera ten konkretny zasób, a poprawna zmiana z właściwą wersją schematu ma pierwszeństwo przed defaultem. Historia od utworzenia plików w commicie `7eb835c6b711959db28f97586ee4f9de1d06808f` pokazuje ten sam układ: fetch publicznego zasobu, walidację wersji, normalizację z per-field defaults i pełny fallback. To jest pierwotna cecha kontraktu, nie późniejszy przypadkowy efekt.

## 4. Zachowanie sparse override

Normalizer poprawnie obsługuje sparse override **pod warunkiem obecności `schemaVersion: 1`**. Optional chaining oraz fallbacki do odpowiadających pól defaults pozwalają podać np. tylko:

```json
{
  "schemaVersion": 1,
  "spatial": { "ringRadius": 8 }
}
```

Wynikiem jest pełny obiekt z `ringRadius: 8` oraz pozostałymi wartościami z defaults. Potwierdza to również konstrukcja testu loadera w `tests/experience-vr-settings.test.mjs:138-143`: test zmienia tylko `spatial.ringRadius` względem bazowego obiektu i oczekuje wartości `8`. Inne testy normalizera przekazują świadomie bardzo niepełne obiekty z `schemaVersion: 1` (`tests/experience-vr-settings.test.mjs:61-128,130-136`) i oczekują defaults w brakujących gałęziach.

Ograniczenie kontraktowe jest jednoznaczne: „sparse” nie oznacza „bez wersji”. Loader sprawdza wersję przed normalizacją. `{}` daje bezpieczny fallback całego obiektu, ale nie jest zaakceptowanym server override.

Wyjątek jakościowy stanowią trzy pola opisane w sekcji 6: nie są emitowane przez normalizer nawet wtedy, gdy kandydat je podaje. Nie podważa to ogólnej obsługi sparse override, ale jest konkretną luką whitelisty normalizera.

## 5. Duplikacja 121 wartości

Punktowe porównanie rekurencyjnych liści wykazało:

- defaults: 330 liści;
- public JSON: 121 liści;
- wszystkie 121 publicznych wartości jest identycznych z odpowiadającymi defaults;
- brak różniących się wartości;
- znormalizowany obecny public JSON jest identyczny ze znormalizowanymi defaults (z uwzględnieniem opisanej niżej utraty trzech pól).

Nie istnieje aktywny mechanizm wymagający równoczesnego zapisania tych 121 wartości. Loader wymaga tylko `schemaVersion: 1`; normalizer uzupełnia resztę. Test nie porównuje pełnego publicznego pliku z defaults ani nie wymaga liczby 121. Czyta plik jedynie dla kilku punktowych asercji fixture (`tests/experience-vr-settings.test.mjs:53-58`).

Usunięcie z public JSON wszystkich wartości identycznych z defaults, z pozostawieniem `{ "schemaVersion": 1 }`, nie zmieniłoby efektywnych wartości runtime. Zmieniłaby się jedynie reprezentacja pliku; diagnostyka nadal zgłaszałaby źródło `server`. Usunięcie także `schemaVersion` spowodowałoby odrzucenie pliku i zmianę diagnostycznego źródła na `defaults`, choć efektywne wartości nadal byłyby defaultowe.

## 6. Trzy pola gubione przez normalizer

Wszystkie trzy przypadki klasyfikuję jako **błąd normalizera (niekompletna whitelist/emisja)**, obecnie zamaskowany przez fallback konsumenta. Nie jest to zamierzony fallback normalizera: przy braku kandydata normalizer zwraca bezpośredni klon defaults zawierający pola, lecz przy dowolnym kandydacie z `schemaVersion: 1` buduje nowy obiekt i pola usuwa.

### `furnace.optionButton.selectionDuration`

- Pole istnieje w defaults z wartością `0.48` (`src/config/experienceVrSettings.js:49-52`).
- Zwracana gałąź `optionButton` jawnie emituje pozostałe pola i `halo`, ale nie emituje `selectionDuration` (`src/config/experienceVrSettings.js:353-367`).
- Konsument używa `settings.selectionDuration ?? .48` (`src/xr/furnace/createVrAstroFurnaceOptionInteraction.js:49`), więc obecny runtime zachowuje wartość bazową pomimo utraty pola.
- Pole i ta luka istniały już w pierwszej wersji kontraktu (`7eb835c...`), co tłumaczy historyczne pochodzenie, ale nie zmienia klasyfikacji: zadeklarowane ustawienie nie może zostać nadpisane przez publiczny/sparse kandydat.

### `furnace.optionButton.moduleAnglesDegrees`

- Pole istnieje w defaults jako `{ floor_gyroscope_sphere: 90 }` (`src/config/experienceVrSettings.js:49-52`).
- Jest pomijane przez tę samą zwracaną gałąź normalizera (`src/config/experienceVrSettings.js:353-367`).
- Konsument łączy lokalne `{ [ASTRO_FURNACE_ACTIVE_MODE]: 90 }` z ewentualnym `settings.moduleAnglesDegrees` (`src/xr/furnace/createVrAstroFurnaceOptionInteraction.js:21`), zatem brak pola odtwarza obecne bazowe `90`, ale uniemożliwia override.
- Także jest to luka obecna od utworzenia kontraktu, a nie dowód zamierzonego usuwania.

### `asterionSphere.targetRingBlendResponse`

- Pole istnieje zarówno w defaults (`12`, `src/config/experienceVrSettings.js:85-99`), jak i w public JSON (`public/data/experience-vr-settings.json:43`).
- Normalizer emituje sąsiednie pola `asterionSphere`, lecz pomija `targetRingBlendResponse` (`src/config/experienceVrSettings.js:427-445`). Publiczna wartość jest więc aktywnie tracona.
- Konsument stosuje lokalny fallback `12` (`src/xr/asterion/createVrAsterionSphere.js:67`), dlatego dzisiejszy efekt jest przypadkowo taki sam.
- Historia `b42186f990693d2594fbadba896d547bd3846d6e` dodała pole jednocześnie do defaults i public JSON, ale nie dodała go do normalizera. To bezpośredni dowód niekompletnej aktualizacji kontraktu, nie zamierzonego fallbacku.

Fallbacki konsumentów są defensywne i skutecznie maskują bieżące wartości. Nie czynią jednak znikania zamierzonym: dla każdego z trzech pól normalizacja uniemożliwia skuteczny override inną poprawną wartością.

## 7. Testy i dowody

### Testy bezpośrednie

`tests/experience-vr-settings.test.mjs` jest jedynym bezpośrednim testem kontraktu settings:

- linie 9-52 testują defaults;
- linie 53-58 rzeczywiście czytają publiczny plik, ale używają go jako fixture override i sprawdzają tylko pozycje portalu/pieca oraz brak legacy `reliquary.position`; nie wymagają kompletności ani kanoniczności publicznego źródła;
- linia 59 testuje fallback normalizera dla nieobsługiwanej wersji;
- linie 61-136 testują normalizację niepełnych danych, clampy, ignorowanie nieznanego pola oraz alias zgodności;
- linie 138-143 testują udany mechanizm server override;
- linie 145-148 testują pełny fallback loadera po błędzie pobrania.

`tests/experience-vr-contract.test.mjs` sprawdza używanie obiektu `settings` przez call-site/runtime (m.in. `settings.spatial.monkeyFinal`), ale nie czyta publicznego JSON i nie ustanawia go źródłem konfiguracji. Pozostałe testy zawierające wartości tych trzech pól testują ich konsumentów na ręcznie zbudowanych settings, a nie własność lub loader publicznego pliku.

### Dowody z implementacji i historii

- Loader ma jawną ścieżkę sukcesu `public JSON -> normalizer` i jawną ścieżkę `dowolny błąd -> pełne defaults`.
- Normalizer jest zaprojektowany jako projekcja pełnego kontraktu z per-field fallbackami, dzięki czemu zaakceptowany kandydat może być niepełny.
- Publiczny plik jest faktycznie niepełny (121/330 liści), a mimo to aktywny wynik jest pełny.
- Wszystkie 121 publicznych liści duplikuje obecne defaults; żaden nie stanowi aktualnego override wartości.
- Historia od wspólnego wprowadzenia plików (`7eb835c...`) potwierdza, że fetch + normalizacja + fallback są pierwotnym kontraktem. Późniejsze commity aktualizowały czasem oba źródła równolegle, ale implementacja ani testy nie egzekwują takiej synchronizacji.

Audyt nie uruchamiał testów runtime zgodnie z ograniczeniem zadania. Weryfikacje końcowe ograniczono do `git diff --check` i `git status --short`.

## 8. Wniosek

**Klasyfikacja: `DEFAULTS_CANONICAL_PUBLIC_SPARSE_OVERRIDE`.**

Konkretne dowody:

1. Defaults są kompletne (330 liści), a public JSON jest niepełny (121 liści), więc pełny runtime musi być wyprowadzany z defaults.
2. Braki akceptowanego kandydata są systematycznie uzupełniane z defaults przez normalizer; `{ "schemaVersion": 1 }` wystarcza do uzyskania pełnych ustawień.
3. Brak, błąd HTTP, wadliwy JSON lub niewłaściwa wersja publicznego zasobu daje pełne, działające defaults.
4. Publiczny zasób pozostaje aktywny i ma pierwszeństwo dla obsługiwanych, poprawnych pól, więc jego rzeczywistą rolą jest opcjonalny, wersjonowany sparse override (w tym warstwa tuningu), a nie martwa pozostałość.
5. Ani loader, ani normalizer, ani testy nie wymagają podwójnego zapisania 121 wartości.
6. Bezpośrednie testy utrwalają konkretne wartości defaults i osobno testują sukces override/fallback; publiczny plik jest użyty tylko jako fixture dla kilku punktowych asercji.

Nie wybrano `PUBLIC_JSON_CANONICAL_DEFAULTS_FALLBACK`, ponieważ publiczny plik nie zawiera pełnego kontraktu. Nie wybrano `DUAL_SOURCE_INTENTIONAL`, ponieważ nie ma mechanizmu zgodności ani wymogu kompletnej synchronizacji obu reprezentacji. Trzy gubione pola są lukami normalizera maskowanymi przez konsumentów, a nie przesłanką dual-source.
