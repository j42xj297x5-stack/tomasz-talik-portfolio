# Experience VR — Asterion Resonator Field Model

## 1. Status, authority i zakres

Status: **CURRENT TARGET / NOT IMPLEMENTED**.

Ten dokument jest wyspecjalizowanym sub-modelem nadrzędnego [`VR_ASTERION_RESONATOR_MODEL.md`](VR_ASTERION_RESONATOR_MODEL.md). Zamraża semantykę stopni swobody rdzenia pola, uproszczony model matematyczny, odpowiedź targetów i język wizualny. Nie tworzy konkurencyjnego kanonu, runtime, klas ani API JavaScript, algorytmu scoringu, shaderów lub wartości tuningowych.

Historyczny model anteny jest wyłącznie źródłem historycznym. Nie jest precedensem implementacyjnym i nie wolno reaktywować jego detentów, kątów, podziału DOF ani wymogu literalnego przecięcia brył.

## 2. Rdzeń trzech sektorów

Pierwszy Rezonator tworzą trzy zasilone, współpracujące sektory: **EARTH**, **WOOD** i **FIRE**. Ich stan opisuje dyskretna trójka `(α, β, γ)`:

| Sektor | Parametr | Zakres | Odpowiedzialność |
| --- | --- | --- | --- |
| EARTH | `α ∈ {-1, 0, +1}` | lewe skrzydło | lokalna rotacja wokół własnej osi; lewa krawędź idzie w górę, kiedy prawa schodzi w dół |
| WOOD | `β ∈ {-1, 0, +1}` | prawe skrzydło | lustrzana lokalna rotacja; prawa krawędź idzie w górę, kiedy lewa schodzi w dół |
| FIRE | `γ ∈ {0, 1, 2}` | głębokość | wyłącznie pochylenie całego sektora, semantyczna „łyżka” wybierająca pasmo odległości |

Ruchy EARTH i WOOD są lokalną konfiguracją skrzydeł pola, a nie globalnym obrotem platformy. FIRE nie realizuje rotacji skrzydłowej lewo–prawo i nie kształtuje różnicy między bokami.

Dla `α` i `β`: `-1` oznacza wklęsłe ustawienie skrzydła, `0` prostokątne / neutralne, a `+1` wypukłe. Dla `γ`: `0` oznacza pasmo dalekie i minimalne wychylenie FIRE, `1` pasmo średnie i ustawienie pośrednie, a `2` pasmo bliskie i maksymalne wychylenie.

Pierwsza wersja jest jawnie uproszczona i dyskretna: `3 × 3 × 3 = 27` bazowych konfiguracji. Dokument nie ustanawia jeszcze kątów fizycznych, interpolacji, detentów ani mapowania ruchu kontrolera na wartości.

## 3. Symetria, presety i legalna deformacja

Konfiguracja jest **symetryczna**, gdy `α = β`. Trzy równe pary skrzydeł tworzą rodziny: wklęsłą `(-1,-1)`, prostokątną `(0,0)` i wypukłą `(+1,+1)`. Po połączeniu każdej z trzema wartościami `γ` powstaje **9 głównych stabilnych presetów** pierwszego Rezonatora. Są najczytelniejszymi ustawieniami bazowymi, a nie kompletnym zbiorem legalnych stanów.

Gdy `α ≠ β`, pole nadal istnieje i konfiguracja jest legalna. Różnica skrzydeł tworzy mniej stabilną i mniej czytelną deformację: shear/przekoszenie, zakrzywienie, niesymetryczne soczewkowanie, przesunięcie lub zafałszowanie obrazu oraz lokalne przybliżenie po jednej stronie i oddalenie po drugiej. Asymetria nie oznacza automatycznie błędu ani „złego” ustawienia; może być potrzebnym wariantem strojenia, lecz nie należy do 9 głównych presetów.

## 4. Analityczny descriptor pola

Pole nie wymaga dosłownego fizycznego przecięcia brył lub objętości. Kanoniczną podstawą przyszłej odpowiedzi jest **analityczny field descriptor wyprowadzany ze stanu sektorów**. Descriptor opisuje pole, a wspierające domeny targetów mogą użyć go do oceny odpowiedzi legalnego celu.

Minimalna semantyka descriptoru obejmuje `leftShape` z `α`, `rightShape` z `β`, `symmetry` / `asymmetry`, `depthBand` (`FAR`, `MID`, `NEAR`) z `γ`, opcjonalne `power` / `gain` oraz opcjonalny `distortionProfile`. Nazwy są semantyczne, nie są zamrożonym API.

```text
overallCurvature = (α + β) / 2
fieldAsymmetry  = α - β
depthBand       = band(γ)
```

Średnia `α` i `β` opisuje ogólną krzywiznę / typ pola, a ich różnica deformację lub shear. Znaki, skale, normalizacja, tolerancje i pełny scoring pozostają otwarte. Literalna geometria może kiedyś wspierać prezentację, lecz nie może stać się jedynym warunkiem istnienia i oceny pola.

## 5. Odpowiedź legalnych targetów

Rezonator nie jest hardkodowany do glifów. Descriptor stanowi przyszłą podstawę odpowiedzi legalnych odległych obiektów jawnie wspieranych przez ich domeny runtime. Domain owner zachowuje legalność i prawdę targetu; Resonator dostarcza opis pola, a Scenario jedynie interpretuje rezultat dramaturgicznie.

Legalny target może odpowiadać silniej przy zgodności depth band i kształtu pola, słabiej, mniej stabilnie lub z większym zniekształceniem przy asymetrii oraz z intensywnością zależną od power/gain. Nie ustanawia to exact scoring formula, progów pozyskania, automatycznego wyboru targetu ani nowych crystal-acquisition rights.

## 6. METAL i WATER — późniejsza warstwa

METAL i WATER są rozszerzeniem istniejącego Rezonatora, a nie osobnymi polami. Każdy ma docelowo dwa typy ruchu: **rotację skrzydłową** i **pochył**. Trzy sektory rdzeniowe tworzą `coarse field`; METAL i WATER tworzą późniejszą warstwę `advanced tuning / amplification`.

Warstwa ma wzmacniać efekt, zwiększać elastyczność i precyzję kombinacji oraz rozszerzać geometryczne i wizualne kształtowanie odpowiedzi. Finalne osie, zakresy, dyskretyzacja, sprzężenia i szczegółowe DOF METAL/WATER pozostają niezamrożone.

## 7. Input i SECTOR LOCK

- Jednoczesne **TRIGGER + GRIP** zawsze rozstrzyga się na korzyść TRIGGER; lokalna ścieżka GRIP jest wtedy nieaktywna.
- GRIP może przejąć wyłącznie legalny sektor zasilony zainstalowanym Rune Stone.
- SECTOR LOCK wymaga pełnej `1.0 s` ciągłego trafiania strumieniem w ten sam legalny sektor.
- Zmiana celu lub utrata legalnego trafienia zeruje timer.
- Dopiero po locku ruch kontrolera interpretuje się względem przejętego sektora, nie całej platformy.

## 8. Język wizualny pola

Pole używa języka inspirowanego **gravitational lensing**, lecz nie deklaruje realistycznej fizyki, elektrofizyki ani symulacji relatywistycznej. Sygnatury obejmują rozjaśnienie, powiększenie, zakrzywienie obrazu, łuki podobne do kaustyk, asymetryczne zniekształcenie, przesunięcie jednej strony względem drugiej i wizualne soczewkowanie.

Poprawna / dobrze dopasowana konfiguracja daje stabilniejszy obraz, czytelniejszy znak lub target oraz mocniejszą, spójną odpowiedź. Konfiguracja asymetryczna albo nietrafiona daje obraz mniej stabilny, zakrzywiony, rozciągnięty, częściowo przesunięty oraz lokalnie przybliżony lub oddalony. Zniekształcenie komunikuje descriptor i jakość odpowiedzi, a nie awarię renderera.

To kontrakt semantyczny prezentacji. Shader architecture, technika renderingu, postprocessing, budżet efektu, kolory, intensywności, audio i hardware/perceptual QA są osobnymi zadaniami.

## 9. Granice przyszłej implementacji

Przyszły runtime ma zachować rozdział: sector-control ustawia lokalny stan sektorów, Resonator wyprowadza descriptor, domain owner ocenia wspierany legalny target, a presentation odwzorowuje odpowiedź bez przejmowania gameplay truth. Nadal otwarte są finalne API, klasy, ciągły model ruchu, target selection, scoring, shadery i parametry VFX/audio.
