# Experience VR — audyt kanonicznego runtime po globalnym cięciu architektury

**Data audytu:** 2026-08-10  
**Tryb:** read-only (raport jest jedynym artefaktem)  
**Podstawa:** stan bieżącego drzewa oraz punktowa historia Git wyłącznie plików objętych zakresem.

## 1. Aktualny kanoniczny przepływ runtime

`src/main.js` ładuje `src/experienceVr.js` dynamicznie po wyborze i sprawdzeniu możliwości VR. `experienceVr.js` jest composition root: ładuje settings i assety, tworzy renderer WebXR, scenę, kamerę, kontrolery, ustala ownership i uruchamia jeden `renderer.setAnimationLoop(renderFrame)`.

```text
experienceVr.js
├─ loadExperienceVrSettings()
│  └─ DEFAULT_EXPERIENCE_VR_SETTINGS + public/data/experience-vr-settings.json
│     └─ normalizeExperienceVrSettings() → settings
├─ ExperienceVrRoot
│  ├─ WorldStableRoot
│  │  ├─ glyphRing / createVrGlyphOrbit + createVrGlyphLights
│  │  └─ createVrShellSystem + createVrShellAttractorInteraction
│  └─ createVrProgressFloor().object = VrTiltableFloorRoot
│     ├─ sektory/panele/ringi postępu
│     ├─ VrPlatformFixturesRoot
│     │  ├─ VrMonkeyStoneRoot
│     │  ├─ portal + canvas
│     │  ├─ reliquary + przyciski
│     │  └─ furnace + panel
│     ├─ VrMonkeyMotionRoot
│     │  └─ VrMonkeyVisualRoot + character + Monkey Guide
│     └─ VrFloorPassengerRoot
│        └─ playerRig → camera/controllers/grips
├─ właściciele stanu
│  ├─ VrProgressionController (karty/tier/floor)
│  ├─ VrAstroFurnaceProgressionController (6 materiałów)
│  ├─ VrAsterionProductionController (budowa/AVAILABLE/EARNED)
│  └─ VrHandModeController (narzędzia lewej/prawej ręki)
└─ systemy sesji: calibration, locomotion, intro/fog/guidance, audio bridge/sequencer
```

Rooty są tworzone bezpośrednio pod finalnymi rodzicami. `VrTiltableFloorRoot` pochodzi z `createVrProgressFloor`; fixtures, actor i passenger są jego osobnymi dziećmi. `WorldStableRoot` pozostaje poza tiltem. `loadMonkeyModel()` składa dwa assety: character pod motion root i kamień pod fixtures; runtime ustawia kanoniczną pozycję motion root, po czym wywołuje `dockCharacterToStone()`.

Fixture’y i dane assetów są pobierane przez `AssetManager` z manifestu preloadów. Główne aktywne systemy `src/xr/*` to dokładnie moduły importowane wprost przez `experienceVr.js`: calibration, controllers, glyph orbit/lights/interaction, portal/plaque, locomotion, crystals/reliquary/buttons, progress floor/progression/shortcut, shells/attractor, semantic input/hand modes, furnace, Asterion, guidance oraz audio. Ich zależności wewnętrzne są aktywne tranzytywnie, lecz nie stanowiły osobnego audytu całego `src/xr`.

## 2. Źródła wartości i precedence settings

### Przepływ i pierwszeństwo

```text
DEFAULT_EXPERIENCE_VR_SETTINGS (kod)
  ↓ wartości fallback i granice normalizacji
GET publicPath('data/experience-vr-settings.json'), cache: no-cache
  ↓ publiczne pola kandydata mają pierwszeństwo, o ile przejdą walidację/clamp
normalizeExperienceVrSettings(parsed)
  ↓ jawnie zbudowany obiekt wynikowy (nie ogólny deep merge)
experienceVr.js i przekazane settings poszczególnych systemów
```

Nieudany fetch, niepoprawny JSON, HTTP error albo nieobsługiwana wersja schematu powoduje użycie pełnego klonu defaults. `settingsSource` i `settingsLoadError` są zwracane przez loader, ale `experienceVr.js` konsumuje wyłącznie `loadedSettings.settings`; metadane służą testowi/API diagnostycznemu, nie sterują runtime.

### Efektywny public override

Porównanie wszystkich 121 liści publicznego JSON z defaults wykazało, że **żaden poprawnie znormalizowany liść publiczny nie zmienia wartości default**. Publiczny plik jest zatem drugim, zduplikowanym zapisem 121 wartości, a nie źródłem aktualnie odmiennych strojeń. Pozostałe 209 liści istnieje tylko w defaults i normalizacja zwykle uzupełnia nimi wynik.

| Sekcja / wartość | Klasyfikacja | Efekt i dowód |
| --- | --- | --- |
| 121 liści obecnych równocześnie w defaults i public JSON | `DUPLICATE` | Public kandydat ma precedence, lecz każda wartość jest równa default; dwa źródła prawdy mogą się rozjechać. |
| 209 liści nieobecnych w public JSON | `CANONICAL_ACTIVE` | Pochodzą z defaults poprzez normalizację i są przekazywane do aktywnych konsumentów; brak public override nie oznacza nieużywania. |
| `furnace.optionButton.selectionDuration` | `STALE_OVERRIDE` | Default wynosi `0.48`, public nie zawiera pola, a jawna rekonstrukcja `optionButton` w normalizerze go pomija. Efektywny wynik serwerowy to `undefined`; konsument używa własnego `?? 0.48`. Nowszy default zostaje więc nadpisany przez niepełny wynik normalizacji, po czym odtworzony dopiero lokalnym fallbackiem. |
| `furnace.optionButton.moduleAnglesDegrees` | `STALE_OVERRIDE` | Default zawiera `{ floor_gyroscope_sphere: 90 }`, public nie zawiera sekcji, normalizer jej nie przenosi; runtime dostaje `undefined`, a Option interaction używa fallbacku kąta. To samo źródłowe rozszczepienie kontraktu. |
| `asterionSphere.targetRingBlendResponse` | `STALE_OVERRIDE` | Default wynosi `12`, public nie zawiera pola, jawny wynik normalizacji je pomija; `createVrAsterionSphere` odzyskuje `12` własnym fallbackiem. |
| `reliquary.floorOffset` → `reliquary.heightOffset` | `CANONICAL_COMPATIBILITY` | Aktywny alias wejściowy normalizera; public używa już `heightOffset`, ale test świadomie sprawdza starszy input. Nie usuwać jako martwego bez audytu zewnętrznych plików settings. |
| `reliquary.buttons.placementRadius/placementAngleDegrees` → `forwardDistance/lateralOffset` | `CANONICAL_COMPATIBILITY` | Aktywna migracja starszego kształtu; test podaje stary kształt i potwierdza wynik. Brak użycia w bieżącym public JSON nie dowodzi braku zewnętrznych konsumentów. |
| `reliquary.activateButton.verticalOffset` → `reliquary.buttons.verticalOffset` | `CANONICAL_COMPATIBILITY` | Aktywny fallback starego położenia; pokryty testem normalizacji. |
| `monkeyGuide.colors.panel` → dwa nowe kolory paneli | `CANONICAL_COMPATIBILITY` | Aktywny legacy fallback, jawnie sprawdzany przez test settings; aktualny public JSON nie ma żadnej z tych sekcji. |
| Nieznane pola (np. `ignored`, stare pola `portalCanvas`) | `LEGACY_UNUSED` | Normalizer buduje whitelistowany wynik i ich nie kopiuje; test dowodzi, że `ignored` znika. Stare `portalCanvas.distanceFromAnchor/forwardBias/floorOffset` są podawane w teście, ale nie mają odczytu w normalizerze ani runtime. |

Uwaga: `public/data/experience-vr-settings.json` nie zawiera sekcji furnace, guidance, intro ani shell attractor. Nie jest to override wyłączający te systemy: ich wartości pochodzą z defaults. Public JSON jako całość jest aktywnie fetchowany, więc nie jest plikiem martwym.

## 3. Inwentarz kodu

| Plik / symbol | Status | Dowód użycia | Uwagi |
| --- | --- | --- | --- |
| `src/experienceVr.js` | `CANONICAL_ACTIVE` | Dynamiczny import z `main.js`; tworzy renderer, rooty, systemy, sesję i animation loop. | Jedyny composition root VR. |
| `ExperienceVrRoot`, `WorldStableRoot` | `CANONICAL_ACTIVE` | Tworzone i dodawane do sceny; world-stable zawiera ring i shells. | Aktualne ownership po cięciu. |
| `createVrProgressFloor().object` / `VrTiltableFloorRoot` | `CANONICAL_ACTIVE` | Tworzony z `parent: experienceRoot`; jest rodzicem floor, fixtures, actor i passenger. | Root zwracany przez system, nie dodatkowy wrapper layoutu. |
| `VrPlatformFixturesRoot` | `CANONICAL_ACTIVE` | Bezpośredni parent stone/portal/reliquary/furnace/panel. | Identity TRS; dziedziczy tilt. |
| `VrFloorPassengerRoot` + `playerRig` | `CANONICAL_ACTIVE` | Passenger jest dzieckiem floor, a rig dzieckiem passenger; calibration i locomotion poruszają rig. | Tracking nie pozycjonuje świata. |
| Importowane bezpośrednio `src/xr/*` (calibration/controllers/glyphs/portal/locomotion/crystals/progression/shells/input/tools/furnace/asterion/guidance/audio) | `CANONICAL_ACTIVE` | Każdy import ma konstrukcję/call-site w `experienceVr.js` i uczestniczy w update/reset/dispose lub callbackach. | Szczegółowe podsystemy są aktywnymi bezpośrednimi zależnościami root. |
| `src/scene/monkeyModel.js::loadMonkeyModel` | `CANONICAL_ACTIVE` | Import i `await loadMonkeyModel(...)` w VR; używany też przez 3D. | Fallback placeholder jest celowy, gdy cache nie ma obu assetów. |
| `assembleMonkeyAssets` | `CANONICAL_ACTIVE` | Wywoływany przez `loadMonkeyModel`; eksport konsumuje test modelu. | Waliduje authored hierarchy. |
| `dockCharacterToStone` | `CANONICAL_ACTIVE` | Zwracany przez actor, wywołany przez runtime po ustawieniu finalnego motion root i przez test modelu. | Aktualna nazwa/metoda. |
| `fixtureParent = actorParent` w `loadMonkeyModel` | `CANONICAL_COMPATIBILITY` | 3D wywołuje loader bez jawnego fixture parent; fallback utrzymuje wspólnego rodzica. | Starszy, ale nadal potrzebny call-site poza VR. |
| Placeholder branch w `loadMonkeyModel` | `LEGACY_ACTIVE` | Osiągalny przy braku obu klonów; `experience3d.js` i test fallbacku używają tego kontraktu. | Nie klasyfikować jako dead. |
| Legacy aliasy settings opisane w §2 | `CANONICAL_COMPATIBILITY` | Konkretne odczyty `??` w normalizerze oraz assertions starszych inputów. | Celowa tolerancja wejścia. |
| `applyWorldTransform` import w `experience-vr-contract.test.mjs` | `LEGACY_UNUSED` | Import na linii 6 nie ma żadnego call-site w teście; test sprawdza jedynie tekst nazwy w dwóch innych plikach. Runtime ma rzeczywistych konsumentów modułu. | Martwy jest tylko import testowy, nie moduł. |
| `experience-vr-contract.test.mjs` assertion `dockStoneToCanonicalMonkey()` | `STALE_TEST_CONTRACT` | Pozytywny regex oczekuje nieistniejącej nazwy; runtime i API aktora używają `dockCharacterToStone()`. | Jednoznacznie niezgodne z bieżącym call-site. |
| Negatywne assertions dla `createVrEntryTransition`, `sceneLayout`, `uklad_sceny`, `ANCHOR_PLAYER_SPAWN`, `cameraRig` i layoutowych `attach()` | `CANONICAL_COMPATIBILITY` | Testy świadomie wymagają braku usuniętej architektury; aktualny runtime tych symboli nie zawiera. | Odnoszą się do starej architektury, ale jako regresyjne zakazy, nie jako oczekiwanie jej API. |
| Testowe regexy dokładnego formatowania `experienceVr.js` | `UNCERTAIN` | Mają call-site tylko w teście źródłowym; część potwierdza realny ownership, ale są sprzężone z tekstem implementacji zamiast zachowaniem. | Poza znanym błędnym aliasem nie znaleziono drugiego jednoznacznego pozytywnego oczekiwania usuniętego symbolu. |
| `public/data/experience-vr-settings.json` | `DUPLICATE` | Loader fetchuje go w każdym przygotowaniu runtime; 121 wartości powtarza defaults 1:1. | Aktywny plik, lecz zduplikowane wartości. |
| `DEFAULT_EXPERIENCE_VR_SETTINGS` | `CANONICAL_ACTIVE` | Fallback load failure oraz baza każdego pola normalizacji; importowany również przez testy VR. | Dla 209 liści jedyne bieżące źródło wartości. |
| `normalizeExperienceVrSettings` | `CANONICAL_ACTIVE` | Wywołanie loadera i bezpośrednie testy. | Whitelistuje i clampuje dane, ale gubi trzy defaults wskazane w §2. |
| `settingsSource`, `settingsLoadError` | `CANONICAL_COMPATIBILITY` | Zwracane i testowane; brak odczytu w `experienceVr.js`. | Publiczny kontrakt diagnostyczny loadera, nie dead runtime. |

### Pozostałe kontrakty tego samego rodzaju

W ograniczonym zakresie znaleziono jeden dodatkowy jednoznacznie nieużywany element testu: import `applyWorldTransform`. Nie znaleziono innego pozytywnego regexu oczekującego usuniętej funkcji/roota. Występuje natomiast grupa negatywnych regexów wymieniających usunięte elementy; są zgodne z runtime i pełnią funkcję guardów po cięciu, dlatego nie oznaczono ich jako stale. Test settings nadal świadomie podaje usunięte/ignorowane pola `portalCanvas.distanceFromAnchor`, `forwardBias` i `floorOffset`; ponieważ wynik ich nie asertuje, są starym szumem fixture (`LEGACY_UNUSED`), nie aktywnym kontraktem.

## 4. Nowe elementy po globalnym cięciu

Punktowa historia (`464ae5c`, a następnie korekty `5914f83`, `9e97ff6`, `762d864`) potwierdza następujące relacje:

| Stare | Zastąpione przez | Aktualne |
| --- | --- | --- |
| `createVrSceneLayoutPrototype` / `sceneLayout` / authored layout anchors | jawny ownership w composition root | `ExperienceVrRoot` → `WorldStableRoot` oraz `VrTiltableFloorRoot` z finalnymi dziećmi |
| `createVrEntryTransition`, entry glyph/entry-ready | intro P0 i kalibracja po pierwszej klatce XR | `calibrateXrHeadToPlatform` + `createVrIntroSequence` / fog reveal |
| layoutowe/kompozycyjne `attach()` | tworzenie od razu pod finalnym parentem | fixtures/actor/passenger jako bezpośrednie dzieci floor; tylko interakcje nadal zasadnie używają `attach()` do reparentingu trzymanych obiektów |
| Monkey i stone poruszane jako jeden aktor | rozdzielenie ownership | `VrMonkeyMotionRoot` dla character oraz stacjonarny `VrMonkeyStoneRoot` pod fixtures |
| dawny sens `dockStoneToCanonicalMonkey` | authored anchor-to-seat alignment | `dockCharacterToStone()` przy nieruchomym kamieniu i zachowaniu skali character |
| absolutne/anchorowe placement reliquary | placement względem portalu i wspólne companion offsets | `distanceFromPortal`, `heightOffset`, `buttons.forwardDistance/lateralOffset/verticalOffset` |
| settings layoutu/anchorów | kanoniczny kontrakt metryczny | `spatial` + fixture-local `position/rotationDegrees`, normalizowane przed konsumpcją |

## 5. Kandydaci do późniejszego usunięcia

### Bezpieczny kandydat

- Nieużywany import `applyWorldTransform` w `tests/experience-vr-contract.test.mjs` — brak odwołania do importowanego bindingu.
- Stary pozytywny assertion `dockStoneToCanonicalMonkey()` w tym samym teście — nie ma takiego symbolu ani call-site; aktualny runtime wywołuje `dockCharacterToStone()`.
- Nieasertowane stare pola fixture `portalCanvas.distanceFromAnchor`, `portalCanvas.forwardBias`, `portalCanvas.floorOffset` w `experience-vr-settings.test.mjs` — normalizer ich nie odczytuje, wynik ich nie zawiera, test nie sprawdza ich efektu.

### Wymaga osobnego audytu

- 121 duplikatów default/public — są potwierdzone, ale publiczny plik jest aktywnym źródłem override i usunięcie wpisów zmienia operacyjny kontrakt konfiguracyjny, nawet gdy dzisiejsze wartości są równe.
- `settingsSource` / `settingsLoadError` — brak konsumenta w composition root, ale są częścią zwracanego i testowanego API.
- Źródłowe regexy całego `experience-vr-contract.test.mjs` — część chroni ważny ownership, część historyczny brak; nie usuwać hurtowo.

### Nie usuwać — compatibility/canonical

- `loadMonkeyModel` fallback i domyślny `fixtureParent` — istnieją rzeczywiste call-site’y/test fallbacku.
- Aliasy `reliquary.floorOffset`, angular button placement, `activateButton.verticalOffset` oraz `monkeyGuide.colors.panel` — wykonywalna kompatybilność normalizera, pokryta testami.
- Negatywne guardy usuniętych rootów/anchorów/entry transition — pozostają zgodnym kontraktem antyregresyjnym.
- Wszystkie rooty i bezpośrednio komponowane systemy wymienione w §1 — aktywne call-site’y runtime.

## 6. Konflikty kod / settings / test / dokumentacja

1. **Kod kontra test — Monkey docking.** Runtime i `monkeyModel.js` mają `dockCharacterToStone()`, zaś `experience-vr-contract.test.mjs` oczekuje tekstu `dockStoneToCanonicalMonkey()`. Dokumentacja kanoniczna opisuje aktualną semantykę character-to-seat. Konflikt jest zgłoszony bez zmiany testu.
2. **Default kontra znormalizowany wynik serwerowy.** Trzy pola (`selectionDuration`, `moduleAnglesDegrees`, `targetRingBlendResponse`) istnieją w defaults, lecz normalizer nie kopiuje ich do wyniku. Konsumenci odtwarzają wartości fallbackami. Nie rozstrzygnięto, czy prawdą ma być default, normalizer czy fallback modułu.
3. **Dwa źródła settings.** Public JSON powtarza 121 wartości defaults bez różnic. Precedence formalnie należy do public, a fallback do kodu; brak rozbieżności wartości nie usuwa konfliktu ownership ani ryzyka przyszłego rozjazdu.
4. **Test settings kontra usunięte pola portal canvas.** Fixture przekazuje `distanceFromAnchor`, `forwardBias`, `floorOffset`, ale aktualny whitelist normalizera je ignoruje, a runtime używa `offset` i parenta `portalDisplay.object`. Test nie wymaga ich efektu; pozostają śladem starego kształtu danych.
5. **Dokumentacja kontra bieżący test kontraktowy.** `VR_RUNTIME_MODEL.md` i handoff opisują nowe rooty, nieruchomy stone i character-to-seat alignment, podczas gdy jeden assertion zachował dawną nazwę. Raport nie wybiera poprzez edycję żadnej strony; wskazuje implementację i call-site jako stan wykonywany.

## Granice pewności

- Audyt nie rozszerzał się na całe repo ani wszystkie eksporty tranzytywnych modułów `src/xr`; status `CANONICAL_ACTIVE` dla nich oznacza aktywną ścieżkę od bezpośredniego importu composition root.
- Nie uruchamiano testów ani builda zgodnie z poleceniem. Wnioski o teście kontraktowym wynikają ze statycznego porównania regexu z aktualnym źródłem.
- Compatibility alias może obsługiwać zewnętrznie podmieniany public JSON; brak użycia w wersjonowanym JSON nie jest dowodem, że alias jest bezpieczny do usunięcia.
