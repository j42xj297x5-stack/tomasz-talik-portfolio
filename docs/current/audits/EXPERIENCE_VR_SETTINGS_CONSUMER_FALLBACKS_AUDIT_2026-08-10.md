# Audyt lokalnych fallbacków konsumentów Experience VR — 2026-08-10

Zakres audytu jest read-only wobec runtime, settings i testów. Przeszukano wyłącznie definicje trzech pól, ich bezpośrednich konsumentów, call-site’y tych konsumentów oraz odpowiadające testy.

## 1. selectionDuration

### Konsument i fallback

Pole jest konsumowane wyłącznie w `createVrAstroFurnaceOptionInteraction()`, w `update(delta)`, przy obliczaniu postępu tweena obrotu przycisku Option:

```js
tweenElapsed / Math.max(settings.selectionDuration ?? .48, 1e-6)
```

Lokalny fallback to literalne `0.48` (`src/xr/furnace/createVrAstroFurnaceOptionInteraction.js:49`). Jest identyczny z canonical defaultem `DEFAULT_EXPERIENCE_VR_SETTINGS.furnace.optionButton.selectionDuration` (`src/config/experienceVrSettings.js:51`).

### Gwarancja loadera i normalizera

`normalizeExperienceVrSettings()` zawsze tworzy `furnace.optionButton` dla obsługiwanej wersji schematu, a `finiteNumber()` zamienia `undefined`, `null`, `NaN` i wartości niefinitywne na canonical default oraz ogranicza liczbę do zakresu `0.01–2` (`src/config/experienceVrSettings.js:266-268,276-279,353-363`). Dla braku kandydata lub nieobsługiwanej wersji zwracany jest klon pełnych defaults. `loadExperienceVrSettings()` po udanym odczycie zwraca wynik normalizera, a w każdym obsłużonym błędzie zwraca klon pełnych defaults (`src/config/experienceVrSettings.js:699-714`).

Nie istnieje zatem aktywna canonical ścieżka, na której po przejściu przez oba wskazane etapy konsument otrzyma dla tego pola `undefined`, `null` albo brak `furnace.optionButton`.

### Call-site’y i skutek usunięcia

Produkcyjny call-site w `src/experienceVr.js:390-397` przekazuje `settings.furnace.optionButton` po jedynym wywołaniu loadera (`src/experienceVr.js:122-123`). Jedyny pozostały call-site jest bezpośrednim testem jednostkowym w `tests/vr-astro-furnace.test.mjs:386-388`; ręcznie zbudowany obiekt jawnie zawiera `selectionDuration: .5`. Nie znaleziono innego runtime ani entrypointu.

Usunięcie fallbacku nie zmieniłoby produkcyjnego Experience VR, obecnych testów ani innego aktywnego call-site’u. Konstruktor ma wprawdzie domyślne `settings = {}`, lecz żaden rzeczywisty call-site w repozytorium nie korzysta z tej tolerancji dla badanego pola. Fallback jest drugim źródłem tej samej wartości.

**Klasyfikacja: `REDUNDANT_CANONICAL_DUPLICATE`.** Dowód: canonical loader/normalizer gwarantuje liczbę, a jedyny bezpośredni call-site poza loaderem przekazuje liczbę jawnie; lokalne `0.48` powtarza canonical default `0.48`.

## 2. moduleAnglesDegrees

### Konsument i fallback

Pole jest konsumowane wyłącznie podczas konstrukcji `createVrAstroFurnaceOptionInteraction()`:

```js
const moduleAngles = { [ASTRO_FURNACE_ACTIVE_MODE]: 90, ...(settings.moduleAnglesDegrees ?? {}) };
```

Następnie `selectMode()` odczytuje kąt dla `floor_gyroscope_sphere`, wymaga wartości finite i zamienia ją na radiany (`src/xr/furnace/createVrAstroFurnaceOptionInteraction.js:21,35-41`). Lokalny mapping przypisuje aktywnemu modułowi `90`. Jest identyczny z canonical mappingiem w defaults (`src/config/experienceVrSettings.js:51`).

### Gwarancja loadera i normalizera

Normalizer zawsze tworzy `furnace.optionButton.moduleAnglesDegrees`, najpierw rozkładając canonical mapping, a potem mapping kandydata (`src/config/experienceVrSettings.js:353-363`). Brak pola, `undefined` i `null` na poziomie całego mappingu są zastępowane pustym obiektem, więc canonical klucz i wartość `90` pozostają. Loaderowa ścieżka błędu również zwraca pełne defaults.

Istnieje ważne rozróżnienie: kandydat może podać `{ moduleAnglesDegrees: { floor_gyroscope_sphere: null } }`. Normalizer nie waliduje wartości wewnątrz mappingu, więc konsument otrzyma `null` mimo normalizacji. Lokalny spread nie jest jednak zabezpieczeniem dla tego przypadku: `null` z settings nadpisuje lokalne `90`, a `selectMode()` odrzuca go przez `Number.isFinite()`. To nie uzasadnia zachowania badanego fallbacku jako ochrony.

Poza takim jawnym nadpisaniem wartości klucza normalizer/loader nie pozostawia `undefined`, `null` ani braku sekcji. Dla wspieranego aktywnego modułu canonical mapping zapewnia `90`.

### Call-site’y i skutek usunięcia

Produkcyjny call-site jest ten sam (`src/experienceVr.js:390-397`) i otrzymuje wynik canonical loadera. Bezpośredni test konstruktora przekazuje ręcznie `moduleAnglesDegrees: { floor_gyroscope_sphere: 90 }` (`tests/vr-astro-furnace.test.mjs:386-388`). Nie znaleziono innych call-site’ów.

Usunięcie lokalnego wpisu `floor_gyroscope_sphere: 90` nie zmieniłoby produkcji, testów ani innego aktywnego wywołania. Mapping ten powtarza własność settings, zamiast stanowić skuteczną ochronę przed niewalidowaną wartością klucza.

**Klasyfikacja: `REDUNDANT_CANONICAL_DUPLICATE`.** Dowód: oba rzeczywiste call-site’y dostarczają mapping; normalizer scala canonical mapping z override; lokalny wpis `90` dosłownie powtarza canonical mapping i nie naprawia jawnego `null` w kluczu.

## 3. targetRingBlendResponse

### Konsument i fallback

Pole jest odczytywane raz w `createVrAsterionSphere()`:

```js
Math.max(0, Number.isFinite(settings?.targetRingBlendResponse)
  ? settings.targetRingBlendResponse
  : 12)
```

Tak uzyskana stała steruje wykładniczym blendem wag animacji target rings w `update(delta)` (`src/xr/asterion/createVrAsterionSphere.js:67,183-190`). Lokalny fallback `12` jest identyczny z canonical defaultem (`src/config/experienceVrSettings.js:96`).

### Gwarancja loadera i normalizera

Normalizer emituje pole przez `finiteNumber(..., defaults.asterionSphere.targetRingBlendResponse, { min: 0 })` (`src/config/experienceVrSettings.js:432-445`). W canonical ścieżce brak całej sekcji, brak pola, `undefined`, `null`, `NaN` i wartość niefinitywna kończą się liczbą z defaults; liczba ujemna jest ograniczana do zera. Loader przy błędzie zwraca pełny klon defaults. Po przejściu przez loader i normalizer nie ma aktywnej ścieżki dostarczenia braku sekcji, `undefined` ani `null`.

### Call-site’y i skutek usunięcia

Produkcja przekazuje `settings.asterionSphere` po canonical loaderze (`src/experienceVr.js:214-220`). Test `tests/vr-asterion-gyro.test.mjs` wywołuje konstruktor bez loadera wielokrotnie, ale współdzielony ręczny settings object jawnie zawiera `targetRingBlendResponse: 12` (`tests/vr-asterion-gyro.test.mjs:7,67,88,114,129`).

Istnieje jednak również rzeczywisty bezpośredni call-site z ręcznie zbudowanym, nieznormalizowanym settings object, który pomija to pole: regresja produkcyjna w `tests/vr-asterion-production.test.mjs:79`. Konstruktor nie wymaga `settings` i sam używa optional chaining, co potwierdza zamierzoną tolerancję tego API na częściowy obiekt. Usunięcie fallbacku nie zmieni produkcyjnego Experience VR. Mogłoby natomiast zmienić semantykę tego aktywnego bezpośredniego wywołania: bez wartości kompatybilnościowej współczynnik blendu stałby się nieważny po `update()`. Obecny test produkcyjny nie sprawdza tego współczynnika i nie wywołuje `sphere.update()`, więc samo usunięcie nie musi spowodować obecnego assertion failure, ale kontrakt wywołania pozostaje realnie niekanoniczny.

Fallback powtarza literalny canonical default `12`, lecz — inaczej niż dwa fallbacki Furnace — obsługuje faktycznie istniejący call-site omijający loader.

**Klasyfikacja: `COMPATIBILITY_REQUIRED`.** Dowód: `tests/vr-asterion-production.test.mjs:79` bezpośrednio wywołuje publicznie eksportowany konstruktor z częściowym settings object bez badanego pola; fallback utrzymuje prawidłową liczbową semantykę tego wspieranego przez implementację kształtu wejścia.

## 4. Call-site’y poza canonical Experience VR

| Konsument | Call-site poza `src/experienceVr.js` | Przejście przez loader/normalizer | Stan badanego pola |
|---|---|---|---|
| `createVrAstroFurnaceOptionInteraction` | `tests/vr-astro-furnace.test.mjs:386-388` | Nie | Oba pola Furnace podane jawnie: `.5` oraz mapping z `90`. |
| `createVrAsterionSphere` | `tests/vr-asterion-gyro.test.mjs:67,88,114,129` | Nie | Współdzielony obiekt z jawnym `targetRingBlendResponse: 12`. |
| `createVrAsterionSphere` | `tests/vr-asterion-production.test.mjs:79` | Nie | Częściowy obiekt bez `targetRingBlendResponse`. |

Repozytoryjne wyszukiwanie importów i wywołań obu eksportowanych konstruktorów nie wykazało innych entrypointów, runtime’ów ani call-site’ów. Testy normalizera dodatkowo potwierdzają default/override wszystkich trzech pól oraz scalanie sparse mappingu (`tests/experience-vr-settings.test.mjs:48-63`).

## 5. Klasyfikacja końcowa

| Pole | Fallback | Status | Dowód | Bezpieczny do usunięcia? |
|---|---|---|---|---|
| `furnace.optionButton.selectionDuration` | `settings.selectionDuration ?? .48` | `REDUNDANT_CANONICAL_DUPLICATE` | Normalizer zawsze emituje liczbę; produkcja używa loadera; jedyny test bez loadera podaje `.5`; literal `.48` powtarza canonical default. | **Tak**, dla wszystkich aktywnych call-site’ów w repozytorium. |
| `furnace.optionButton.moduleAnglesDegrees` | `{ floor_gyroscope_sphere: 90, ...(settings.moduleAnglesDegrees ?? {}) }` | `REDUNDANT_CANONICAL_DUPLICATE` | Normalizer zawsze emituje mapping z canonical `90`; jedyny test bez loadera podaje ten mapping; lokalny mapping nie chroni przed jawnym `null`, bo override go nadpisuje. | **Tak**, dla wszystkich aktywnych call-site’ów w repozytorium. |
| `asterionSphere.targetRingBlendResponse` | finite check, w przeciwnym razie `12` | `COMPATIBILITY_REQUIRED` | Produkcja ma wartość po normalizerze, ale aktywny bezpośredni test produkcyjny tworzy Sphere z częściowymi settings bez pola. | **Nie**, dopóki ten niekanoniczny call-site/kontrakt wejściowy istnieje. |
