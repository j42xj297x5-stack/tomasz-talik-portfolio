# Audyt compatibility aliases ustawień `reliquary` — 2026-08-10

Zakres audytu jest ograniczony do ustawień Experience VR, bezpośrednich call-site’ów Reliquary oraz odpowiadających im testów. Repozytorium sprawdzono w trybie read-only; poza niniejszym raportem nie zmieniono kodu, ustawień, testów ani dokumentacji. Hipotetyczna możliwość zastąpienia publicznego JSON-u niewersjonowanym plikiem nie jest traktowana jako aktywne użycie.

## 1. floorOffset

Alias wejściowy `reliquary.floorOffset` jest odczytywany wyłącznie przez `normalizeExperienceVrSettings()` w `src/config/experienceVrSettings.js`. Wyrażenie `candidateReliquary.heightOffset ?? candidateReliquary.floorOffset` nadaje pierwszeństwo polu kanonicznemu i zapisuje wynik wyłącznie jako `reliquary.heightOffset`.

Aktualne defaults definiują tylko `reliquary.heightOffset: 0.5`. Publiczny `public/data/experience-vr-settings.json` zawiera tylko `schemaVersion: 1`, więc nie podaje ani aliasu, ani własnej wartości kanonicznej. Runtime ładuje ten jeden publiczny plik, normalizuje go, a następnie przekazuje `settings.reliquary` do `createVrCrystalReliquary()`. Bezpośredni konsument wizualny czyta wyłącznie `settings.heightOffset`; nie ma runtime’owego odczytu `settings.floorOffset` dla Reliquary.

Stary format podają dwa testowe call-site’y:

- `tests/experience-vr-settings.test.mjs` przekazuje `reliquary.floorOffset: 9` i przez oczekiwane `heightOffset: 2` potwierdza fallback oraz ograniczenie wartości;
- `tests/vr-crystal-reliquary.test.mjs` przekazuje `reliquary.floorOffset: 0.1` do normalizera i oczekuje `heightOffset: 0.1`.

Nie znaleziono aktywnego call-site’u aplikacji, defaults, publicznych danych, innych wersjonowanych danych konfiguracyjnych ani potwierdzonego zewnętrznego źródła konfiguracji w repozytorium, które przekazuje `reliquary.floorOffset`. Pozostałe wystąpienia `floorOffset` dotyczą portalu lub pieca i nie są tym aliasem.

**Klasyfikacja: `LEGACY_COMPATIBILITY_ONLY`.** Konkretnym konsumentem starego formatu jest normalizer, lecz jego jedynymi potwierdzonymi producentami w aktualnym repo są dwa testy kompatybilności; produkcyjny przepływ danych i runtime są kanoniczne.

Po wycięciu aliasu należałoby:

- w `tests/experience-vr-settings.test.mjs` usunąć `reliquary.floorOffset` z legacy fixture i zmienić oczekiwane `heightOffset` z `2` na default `0.5` albo zastąpić fixture kanonicznym `heightOffset`, jeśli nadal ma testować clamp;
- w `tests/vr-crystal-reliquary.test.mjs` usunąć `floorOffset` i oczekiwać default `heightOffset: 0.5` albo zmienić wejście na `heightOffset: 0.1`, jeśli test ma nadal sprawdzać niezależną wysokość modelu.

## 2. placementRadius / placementAngleDegrees

Aliasy `placementRadius` i `placementAngleDegrees` są odczytywane wyłącznie w `normalizeExperienceVrSettings()`. Normalizer wybiera źródło przez `candidateReliquary.buttons ?? candidateReliquary.activateButton ?? {}`. Jeśli co najmniej jedna wartość kątowa jest liczbą, oblicza kanoniczne składowe:

- `forwardDistance = cos(angle) * radius`;
- `lateralOffset = sin(angle) * radius`.

Jawne `reliquary.buttons.forwardDistance` i `reliquary.buttons.lateralOffset` mają pierwszeństwo przed wynikiem migracji. Defaults zawierają wyłącznie `buttons.forwardDistance: 1` i `buttons.lateralOffset: 0.5`. Publiczny JSON nie ma sekcji `reliquary`. Runtime przekazuje wyłącznie znormalizowane `settings.reliquary.buttons` do `crystalReliquary.attachCompanion()`, a `createVrCrystalReliquary()` odczytuje tylko `forwardDistance` i `lateralOffset`.

Jedyny stary call-site w repo znajduje się w `tests/experience-vr-settings.test.mjs`. Fixture umieszcza oba pola w jeszcze starszej lokalizacji `reliquary.activateButton`, nie w `reliquary.buttons`; fallback `candidateReliquary.activateButton` powoduje jednak ich aktywne przeliczenie. Dla promienia `8` ograniczonego do `3` i kąta `-4` ograniczonego do `0°` test oczekuje `forwardDistance: 3` i `lateralOffset: 0`. Nie ma osobnego testu przekazującego angular placement bezpośrednio przez `reliquary.buttons`.

Nie znaleziono starego formatu w defaults, publicznym JSON-ie, runtime’owych call-site’ach, innych wersjonowanych danych ani potwierdzonym zewnętrznym źródle konfiguracji w repo. Zbudowany i wersjonowany bundle `dist/assets/index-BG8NwCXV.js` również nie zawiera nazw `placementRadius`, `placementAngleDegrees`, `forwardDistance` ani `lateralOffset`, więc nie stanowi źródła legacy input ani dowodu wymagania aliasu.

**Klasyfikacja: `LEGACY_COMPATIBILITY_ONLY`.** Wykonywalny konsument istnieje w normalizerze, ale jedyny potwierdzony producent starego kształtu to fixture testu kompatybilności. Brak aktywnego producenta aplikacyjnego.

Po wycięciu obu aliasów należałoby w `tests/experience-vr-settings.test.mjs` usunąć `placementRadius` i `placementAngleDegrees` z `activateButton` oraz zmienić oczekiwane button placement na defaults (`forwardDistance: 1`, `lateralOffset: 0.5`), albo przenieść cel testu na kanoniczne pola, jeżeli nadal ma sprawdzać ich clamp. Nie ma dedykowanego testu dla legacy pól pod `reliquary.buttons`, który wymagałby osobnego usunięcia.

## 3. activateButton.verticalOffset

Alias `reliquary.activateButton.verticalOffset` jest odczytywany wyłącznie w `normalizeExperienceVrSettings()` jako fallback po kanonicznym `candidateReliquary.buttons?.verticalOffset`. Wynik jest emitowany wyłącznie jako `reliquary.buttons.verticalOffset`.

Defaults definiują tylko `reliquary.buttons.verticalOffset: 0`. Publiczny JSON nie zawiera sekcji `reliquary`. Runtime przekazuje `settings.reliquary.buttons` do obu companionów, a bezpośredni kod Reliquary używa `placement.verticalOffset`; obiekt `settings.reliquary.activateButton` jest przekazywany oddzielnie do logiki interakcji i nie służy do pozycjonowania.

Jedyny stary call-site to fixture w `tests/experience-vr-settings.test.mjs`, która przekazuje `reliquary.activateButton.verticalOffset: 7` i oczekuje znormalizowanego `reliquary.buttons.verticalOffset: 1` po clampie. Nie znaleziono starego pola w defaults, publicznych lub innych wersjonowanych danych, runtime ani potwierdzonym zewnętrznym źródle konfiguracji w repo.

**Klasyfikacja: `LEGACY_COMPATIBILITY_ONLY`.** Normalizer aktywnie obsługuje alias, ale jedynym potwierdzonym producentem jest test kompatybilności.

Po wycięciu aliasu należałoby w `tests/experience-vr-settings.test.mjs` usunąć `activateButton.verticalOffset` i zmienić oczekiwane `buttons.verticalOffset` z `1` na default `0`, albo użyć kanonicznego `buttons.verticalOffset`, jeśli test ma zachować pokrycie clampu.

## 4. Aktywne źródła danych

Potwierdzony przepływ produkcyjny jest następujący:

1. `src/experienceVr.js` wywołuje `loadExperienceVrSettings()` bez dodatkowego obiektu overrides.
2. Loader pobiera `data/experience-vr-settings.json`, sprawdza `schemaVersion: 1` i przekazuje sparsowany obiekt do `normalizeExperienceVrSettings()`; przy błędzie zwraca code defaults.
3. Wersjonowany `public/data/experience-vr-settings.json` zawiera wyłącznie `{ "schemaVersion": 1 }`, zatem bieżące wartości Reliquary pochodzą z kanonicznych defaults.
4. Runtime przekazuje znormalizowane `settings.reliquary` do `createVrCrystalReliquary()`, a kanoniczne `settings.reliquary.buttons` do companionów activate/release.
5. Bezpośredni konsument Reliquary odczytuje `heightOffset`, `forwardDistance`, `lateralOffset` i `verticalOffset`; żaden bezpośredni call-site Reliquary nie odczytuje omawianych aliasów.

Wśród wersjonowanych plików danych/configuration znaleziono publiczne settings Experience VR, settings Experience 3D, moduły defaults/normalizacji oraz niezwiązany z Reliquary plik danych audytu geometrii. Żaden z nich nie dostarcza starego kształtu Reliquary. Nie znaleziono repozytoryjnego mechanizmu drugiego źródła lub merge’u ustawień Reliquary. Niewersjonowane, hipotetyczne zastąpienie JSON-u nie jest dowodem aktywnego użycia.

## 5. Testy kompatybilności

| Test | Stary input | Obecnie potwierdzany efekt | Zmiana po usunięciu aliasu |
|---|---|---|---|
| `tests/experience-vr-settings.test.mjs` | `reliquary.floorOffset: 9` | `heightOffset: 2` | Usunąć legacy input i oczekiwać default `0.5` albo użyć kanonicznego `heightOffset` do testu clampu. |
| `tests/experience-vr-settings.test.mjs` | `reliquary.activateButton.placementRadius: 8`, `placementAngleDegrees: -4` | `buttons.forwardDistance: 3`, `lateralOffset: 0` | Usunąć oba legacy pola i oczekiwać defaults `1`/`0.5` albo testować clamp przez pola kanoniczne. |
| `tests/experience-vr-settings.test.mjs` | `reliquary.activateButton.verticalOffset: 7` | `buttons.verticalOffset: 1` | Usunąć legacy pole i oczekiwać default `0` albo testować clamp przez `buttons.verticalOffset`. |
| `tests/vr-crystal-reliquary.test.mjs` | `reliquary.floorOffset: 0.1` | `heightOffset: 0.1` | Usunąć legacy input i oczekiwać default `0.5` albo zastąpić go kanonicznym `heightOffset: 0.1`. |

Test `tests/experience-vr-settings.test.mjs` łączy wszystkie trzy migracje w jednej szerokiej fixture, dlatego zmiana oczekiwanego obiektu po usunięciu aliasów musi objąć jednocześnie `heightOffset` oraz wszystkie trzy pola `buttons`. Pozostałe bezpośrednie testy Reliquary używają kanonicznych defaults albo kanonicznych pól i nie wymagają zmian.

## 6. Klasyfikacja końcowa

| Alias | Aktualny konsument starego formatu | Status | Dowód | Bezpieczny do usunięcia? |
|---|---|---|---|---|
| `reliquary.floorOffset` → `reliquary.heightOffset` | Tylko `normalizeExperienceVrSettings()`; stary input produkują wyłącznie dwa testy. | `LEGACY_COMPATIBILITY_ONLY` | Publiczny JSON nie ma `reliquary`; defaults i `createVrCrystalReliquary()` używają `heightOffset`; brak aplikacyjnego call-site’u legacy. | **Tak, w granicach aktualnego repo**, po aktualizacji dwóch wskazanych testów. |
| `reliquary.buttons.placementRadius` / `placementAngleDegrees` → `forwardDistance` / `lateralOffset` | Tylko `normalizeExperienceVrSettings()`; jedyny testowy producent używa fallbackowej lokalizacji `reliquary.activateButton`. | `LEGACY_COMPATIBILITY_ONLY` | Defaults, runtime i bezpośredni consumer używają `forwardDistance`/`lateralOffset`; brak wersjonowanego źródła legacy oraz brak testowego call-site’u starego kształtu pod `buttons`. | **Tak, w granicach aktualnego repo**, po aktualizacji jednej fixture i jej oczekiwań. |
| `reliquary.activateButton.verticalOffset` → `reliquary.buttons.verticalOffset` | Tylko `normalizeExperienceVrSettings()`; stary input produkuje jedna fixture testowa. | `LEGACY_COMPATIBILITY_ONLY` | Publiczny JSON nie ma `reliquary`; defaults, runtime placement i companion call-site używają `buttons.verticalOffset`; brak aplikacyjnego producenta legacy. | **Tak, w granicach aktualnego repo**, po aktualizacji jednej fixture i jej oczekiwań. |

Wniosek dotyczy wyłącznie stanu wersjonowanego repozytorium na dzień audytu: wszystkie trzy grupy aliasów są wykonywalną obsługą starego formatu danych, ale żadna nie jest wymagana przez aktualne źródła danych ani runtime. Nie wykonano cleanupu.
