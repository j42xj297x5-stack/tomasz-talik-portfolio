# Experience VR — Asterion Resonator Field Model

## 1. Status, authority i zakres

Status: **CURRENT TARGET / R2A INPUT-LOCK FOUNDATION IMPLEMENTED; FIELD NOT IMPLEMENTED**.

The runtime now has semantic left GRIP input and bounded powered-sector target-ray acquisition: the same legal sector held for `1.0 s` produces transient `SECTOR LOCK`, while TRIGGER suppresses the local path. Powered truth is read from the corresponding installed Rune Stone.

Actual local sector motion, detent snapping, `α/β/γ`, the Field Actor/descriptor, field/lensing presentation and grip-beam presentation remain unimplemented.

Ten dokument jest wyspecjalizowanym sub-modelem nadrzędnego [`VR_ASTERION_RESONATOR_MODEL.md`](VR_ASTERION_RESONATOR_MODEL.md). Zamraża semantykę poziomów rdzenia pola, aktualne docelowe pozycje fizyczne, uproszczony descriptor i granice ownership. Nie tworzy runtime, klas, API JavaScript, scoringu, shaderów ani mapowania gestu. Historyczny model anteny oraz wcześniejszy signed detent model nie są precedensem implementacyjnym.

## 2. Powered sector a field-active sector

**POWERED SECTOR** ma zainstalowany właściwy Rune Stone, może odpowiedzieć na Kulę, zostać namierzony i uzyskać SECTOR LOCK. **FIELD-ACTIVE SECTOR** jest powered i ma lokalny poziom ruchu większy od `0`. Instalacja Rune nie jest więc prawdą `fieldActive`.

```text
Rune installed → powered → lockable → LEVEL 0 / 0° → field contribution OFF
```

Pierwsze przejście `0° → 13°` włącza udział sektora w polu. Pozycja zerowa działa jak połączone z wyłącznikiem pokrętło: mechanizm jest zasilony i dostępny, ale kanał nie wnosi jeszcze wkładu.

## 3. Kanoniczne poziomy i ruch rdzenia

Każdy kanał rdzenia ma cztery stabilne poziomy, bez pozycji ujemnych i bez ruchu `-36° ← 0° → +36°`:

| Poziom | Pozycja | Stan ogólny |
| --- | --- | --- |
| `LEVEL 0` | `0°` | `OFF` |
| `LEVEL 1` | `13°` | `LOW` |
| `LEVEL 2` | `23°` | `MID` |
| `LEVEL 3` | `36°` | `HIGH` |

`13°`, `23°` i `36°` są **CURRENT TARGET** dla pierwszej implementacji, a nie przykładami. Ich zmiana po hardware/perceptual QA wymaga jawnej nowej decyzji. Ruch zaczyna się w pozycji płaskiej i przebiega wyłącznie w jednym kanonicznym kierunku.

### EARTH — `α`

`α ∈ {0,1,2,3}` steruje lewym skrzydłem i mapuje się na `0° / 13° / 23° / 36°`. Wraz ze wzrostem `α` lewa krawędź EARTH idzie coraz wyżej, a prawa coraz niżej. Nie istnieje przeciwne wychylenie. `α = 0` wyłącza wkład EARTH do descriptoru.

### WOOD — `β`

`β ∈ {0,1,2,3}` steruje prawym skrzydłem i mapuje się na `0° / 13° / 23° / 36°`. Jest lustrzanym odpowiednikiem EARTH: wraz ze wzrostem `β` prawa krawędź WOOD idzie coraz wyżej, a lewa coraz niżej. Nie istnieje przeciwne wychylenie. `β = 0` wyłącza wkład WOOD.

### FIRE — `γ`

FIRE nie ma rotacji skrzydłowej lewo/prawo. `γ ∈ {0,1,2,3}` steruje wyłącznie jednokierunkowym lokalnym pochyleniem całego sektora — semantyczną „łyżką”:

| `γ` | Pozycja | Depth band |
| --- | --- | --- |
| `0` | `0°` | `OFF / NONE` |
| `1` | `13°` | `FAR` |
| `2` | `23°` | `MID` |
| `3` | `36°` | `NEAR` |

Większe wychylenie wybiera bliższe pasmo przestrzeni. Signed FIRE tilt nie istnieje.

## 4. State-space, symetria i legalna asymetria

Fizyczny state-space rdzenia wynosi `4 × 4 × 4 = 64`. Rezonator może istnieć przy `α = β = γ = 0`, jeśli trzy wymagane sektory są powered, ale coarse field nie ma wtedy aktywnego wkładu sektorów.

Pełny aktywny rdzeń wymaga `α > 0`, `β > 0` i `γ > 0`, dlatego zachowuje `3 × 3 × 3 = 27` pełnych aktywnych konfiguracji coarse field. Liczba `27` nie opisuje wszystkich fizycznych stanów platformy.

Aktywna konfiguracja boczna jest symetryczna, gdy `α = β` oraz `α > 0`. Pary `(1,1)`, `(2,2)` i `(3,3)` po połączeniu z trzema aktywnymi depth bands dają `3 × 3 = 9` głównych symetrycznych konfiguracji coarse field. Poziomom `13° / 23° / 36°` nie przypisuje się jeszcze sztywnych nazw `CONCAVE / RECTANGULAR / CONVEX`; wynikowy kształt należy do przyszłego modelu/presentation i strojenia.

Gdy `α ≠ β`, pole może być legalnie asymetryczne. Legalne są też częściowe stany `α = 0, β > 0` oraz `β = 0, α > 0`. Mogą dawać bardzo słabą odpowiedź, silny shear, lensing bias, przesunięcie obrazu, jednostronne powiększenie/oddalenie lub mocną deformację. Dokument nie ustanawia ich exact scoringu.

## 5. Analityczny descriptor pola

Pole nie wymaga literalnego przecięcia brył. Resonator Field Domain wyprowadza read-only descriptor ze stanu sektorów; `α` i `β` są poziomami intensywności dwóch przeciwstawnych skrzydeł, a nie znakami przeciwnych kierunków krzywizny. Minimalna semantyka może obejmować:

```text
lateralStrength = (α + β) / 2
fieldAsymmetry  = α - β
leftActive      = α > 0
rightActive     = β > 0
depthActive     = γ > 0
depthBand       = OFF/NONE | FAR | MID | NEAR
```

Nazwy nie są zamrożonym API. Exact normalization, tolerancje, target selection i scoring formula pozostają otwarte. Wspierana domena targetu zachowuje legalność targetu i może użyć descriptoru do różnicowania siły, stabilności lub deformacji odpowiedzi; Scenario posiada znaczenie narracyjne i crystal-acquisition gates, nie fizyczną odpowiedź pola.

## 6. METAL i WATER — późniejsza warstwa

METAL i WATER pozostają warstwą `advanced tuning / amplification`. Każdy docelowo ma ruch skrzydłowy i pochył, przy czym ogólna filozofia obu kanałów to `0° = OFF`, a następnie wyłącznie jednokierunkowe target detenty `13° / 23° / 36°`.

Sprzężenie osi, kombinacje poziomów, scoring, finalne mapowanie gestu oraz dokładna rola METAL i WATER w descriptorze nie są jeszcze zaprojektowane.

## 7. Ownership

| Domena | Posiada | Nie posiada |
| --- | --- | --- |
| sector-control | lock, lokalne ustawienie sektora i bounded motion commands | field descriptor, target response, wizualne wyładowania |
| Resonator Field Domain / actor | read-only obserwację konfiguracji i wyprowadzenie descriptoru oraz reakcji pola | fizyczny `MotionRoot`, Scenario truth, platform energy lightning |
| `PlatformEnergyVfxActor` | proceduralne wyładowania i energię platformy/Zworników | descriptor, interpretację `α/β/γ` jako gameplay truth, target response i field lensing |
| field lensing presentation | read-only prezentację wyniku Field Domain | gameplay truth i proceduralną energię platformy |

Dokładna nazwa klasy/API i podział projection/actor dla field lensing pozostają otwarte. Field lensing nie należy do `PlatformEnergyVfxActor`; nie wolno tworzyć jednego megasystemu VFX + field + motion.

## 8. Input i SECTOR LOCK

- TRIGGER ma pierwszeństwo nad GRIP.
- GRIP może namierzyć tylko powered sector.
- Pełne `1.0 s` tego samego legalnego celu daje SECTOR LOCK.
- Zmiana lub utrata celu przed lockiem resetuje timer.
- Dopiero po locku sektor może otrzymać local motion command.

## 9. Język wizualny i granice implementacji

Field lensing może używać inspirowanych grawitacyjnym soczewkowaniem rozjaśnień, powiększenia, zakrzywienia, caustic-like arcs, przesunięć i asymetrycznej deformacji, bez deklarowania realistycznej fizyki. Shader architecture, rendering, kolory, intensywności, audio, hardware/perceptual QA, finalne API, motion interpolation i gesture mapping są osobnymi zadaniami.
# Runtime input status

R2B now provides the future Field Domain with defensive read-only EARTH/WOOD/FIRE level and transient-angle snapshots. Its committed levels are discrete runtime truth, independent of Progress Floor quaternions, and its detents are `0°/13°/23°/36°`. The Resonator Field Actor, analytic descriptor runtime, target response/scoring and lensing presentation remain not implemented; this document does not transfer those responsibilities to sector control.
