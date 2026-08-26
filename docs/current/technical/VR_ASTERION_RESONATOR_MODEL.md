# Experience VR — kanoniczny model Rezonatora Asterionowego

## 1. Status i authority

Status: **CURRENT TARGET / NOT IMPLEMENTED**.

Ten dokument jest jedynym aktualnym technicznym modelem Rezonatora Asterionowego. Zamraża granice sandboxu, Scenario, Guidance, Zworników Runicznych, lokalnego sterowania sektorami i odpowiedzi Rezonatora. Nie definiuje API, nazw nowych aktorów sector-control, algorytmów ruchu ani parametrów dawnego modelu anteny.

Model koncepcyjny przebiegu pozostaje w [`EXPERIENCE_VR_RUNES_RESONATOR_FINALE.md`](../concept/EXPERIENCE_VR_RUNES_RESONATOR_FINALE.md). Model Rune Stones posiada tuning, transport, instalację i persistent Rune truth. Model progress floor posiada panel/sector completeness i globalny transform platformy. Ten dokument posiada techniczny kontrakt współpracy zasilonych sektorów i Rezonatora.

## 2. Reguła nadrzędna: sandbox nie jest bramką Scenario

Fizyczna mechanika jest legalna, gdy gracz ma wymagane narzędzie, właściwy obiekt świata istnieje i spełnione są domenowe warunki mechaniki. Brak wcześniejszego objaśnienia dramaturgicznego nie blokuje działania.

Nie wolno uzależniać Rune tuning, Rune pull, Rune installation, sector control ani powstania Rezonatora od prawa w rodzaju `currentPoint >= X`.

Scenario posiada:

- dramaturgię i obowiązkowe beaty progresji;
- kolejność ujawnianej wiedzy;
- Guidance, hinty i treść Panelu Y;
- ograniczenia pozyskania kolejnych kryształów.

Scenario nie posiada fizycznej dostępności wymienionych mechanik. Domain owners posiadają ich truth i legalność, a Scenario może obserwować już osiągnięty rezultat i odpowiednio pominąć albo zmienić późniejszy beat.

## 3. Sandboxowa progresja i wiedza

Gracz może przed planowanym beatem stroić dostępne rodziny, przyciągać legalne obiekty, zbierać dostępne skorupy, instalować Rune Stones przy istniejących właściwych Zwornikach, sterować aktywnymi sektorami i utworzyć Rezonator.

Nie daje to prawa do ominięcia kanonicznej progresji kryształów. Pozyskanie kolejnego kryształu pozostaje ograniczone właściwym etapem progresji, niezależnie od wcześniejszej sprawności gracza w sandboxie.

Panel Y i Guidance ujawniają wiedzę według Scenario oraz wiedzy już zdobytej przez gracza. Fizyczna dostępność nie publikuje automatycznie instrukcji. Jeżeli obserwowalny stan dowodzi, że gracz sam odkrył mechanikę, odpowiadający jej hint nie jest obowiązkowy i nie może wymuszać ponownego odkrycia.

## 4. Zwornik Runiczny

**Zwornik Runiczny** jest nazwą narracyjną. Techniczny asset może pozostać `bridge.glb`, a istniejące nazwy runtime mogą pozostać historycznym szczegółem implementacji.

Źródłem materializacji Zwornika jest ukończenie wszystkich paneli odpowiadającego sektora:

```text
sector complete → RUNE_BINDER_REVEAL → trwały Zwornik Runiczny
```

Zwornik nie materializuje się podczas instalowania kamienia. EARTH, WOOD i FIRE mogą dlatego istnieć przed ukończeniem pełnego trzeciego kręgu. Po reveal pozostaje trwałym elementem sektora i miejscem późniejszego związania właściwego Rune Stone.

Obrót lub spin Zwornika nie należy do target canon. Historyczny stan techniczny `ORBITING` nie ustanawia prezentacji obrotowej.

### Niezależność prezentacji i kotwicy

Transformacja prezentacyjna geometrii Zwornika i finalna kotwica instalacji Rune Stone są niezależne. Skala, radialne odsunięcie albo inna korekta prezentacji Zwornika nie może przesuwać kanonicznego finalnego miejsca osadzenia kamienia.

**TUNING, nie prawo architektoniczne:** docelowa geometria Zwornika ma być wizualnie około `2×` większa i odsunięta radialnie dalej o co najmniej około `1 m` względem obecnej prezentacji. Finalna lokalizacja kamienia pozostaje odpowiadająca obecnemu poprawnemu położeniu.

## 5. Rune Stone bez istniejącego Zwornika

Nastrojenie i przyciągnięcie Rune Stone bez właściwego istniejącego Zwornika jest legalnym stanem sandboxowym. Kamień może dotrzeć w pobliże platformy, lecz nie jest instalowany i pozostaje poza platformą do czasu powstania miejsca związania.

Stan może uruchomić sytuacyjny hint Małpy, znaczeniowo na przykład „Działa. Tylko nie ma gdzie go przywiązać.” Nie jest obowiązkowym Scenario pointem, gałęzią progresji ani błędem narzędzia.

## 6. Kula Asterionowa i lokalne sterowanie sektorem

Od fizycznego stworzenia Kuli Asterionowej jej grip może emitować sektorowy strumień sterujący. Sektor bez zainstalowanego Rune Stone nie odpowiada. Zainstalowany właściwy kamień zasila sektor i umożliwia lokalne przejęcie/lock.

Input jest wzajemnie wykluczający:

- **TRIGGER** — istniejące sterowanie globalną orientacją całej platformy;
- **GRIP** — sektorowy strumień i lokalne sterowanie jednym legalnym sektorem;
- oba tryby nie mogą działać równocześnie.

Ten kontrakt nie zmienia istniejącego ownership globalnego obrotu platformy. Nie zamraża osi, kątów, detentów, liczby swobód ani algorytmu lokalnego ruchu.

## 7. Powstanie Rezonatora Asterionowego

Pierwszy Rezonator powstaje z fizycznego stanu świata, nie z wejścia w Scenario point. Gdy trzy wymagane sektory są zasilone przez zainstalowane Rune Stones i mogą współpracować, istnieje **Rezonator Asterionowy**.

```text
3 wymagane współpracujące sektory
+ właściwe installed Rune Stones
→ Rezonator Asterionowy istnieje
```

Może to nastąpić przed późnym aktem fabularnym. Jeżeli już istnieje, późniejszy Scenario/Monkey uznaje rezultat i nie zmusza do ponownego budowania lub „odkrywania”. Jeżeli nie istnieje, późniejsza dramaturgia i Guidance mogą poprowadzić do dokładnie tego samego fizycznego rezultatu.

Rezonator nie jest klasyczną anteną ani radarem. Nie dziedziczy automatycznie detentów, konkretnych kątów, modelu przecięcia trzech objętości, dawnego podziału DOF ani innych parametrów historycznego modelu anteny.

## 8. Odpowiedź na legalne odległe cele

Rezonator jest projektowany jako system odpowiedzi na legalne odległe cele wspierane przez odpowiednie domeny. Nie jest hardkodowany wyłącznie do glifów. Pierwszą praktyczną odpowiedzią może być glif, skorupa albo inny legalny target wspierany przez domain ownera.

Scenario może nadawać odkryciu znaczenie, ograniczać prawo pozyskania kryształu i prowadzić gracza, ale nie posiada samej fizycznej odpowiedzi pola. Szczegółowy model pola, wybór targetu, miary odpowiedzi oraz algorytm sterowania pozostają poza zakresem tego dokumentu.

## 9. Ownership i zależności

| Owner | Posiada | Nie posiada |
| --- | --- | --- |
| sector progression owner | panel/sector completeness | Rune tuning, installed truth, Scenario knowledge |
| Rune domain | tuning, legalny target/pull, installed Rune truth i installation legality | dramaturgia, hinty, lokalny ruch sektorów |
| Zwornik / sector presentation | trwałą prezentację Zwornika po sector complete i niezależną geometrię prezentacyjną | finalną kotwicę kamienia jako efekt transformacji geometrii, progression truth |
| sector-control domain | lokalne przejęcie/lock zasilonego sektora | globalny obrót platformy, Scenario truth |
| istniejący owner Kuli/platform drive | globalną orientację platformy pod TRIGGER | lokalny sector control pod GRIP |
| Resonator domain | współpracę wymaganych zasilonych sektorów i fizyczną odpowiedź na legalne cele | znaczenie narracyjne, Guidance, crystal progression |
| Scenario / Guidance / Panel Y | dramaturgię, obowiązkowe beaty, ujawnianą wiedzę, hinty i crystal-acquisition gates | fizyczne gate'y Rune/sector/Rezonator oparte na `currentPoint` |
| `PlatformEnergyVfxActor` | read-only `RUNE_BINDER_REVEAL`, `RUNE_INSTALL` i inne profile prezentacyjne | gameplay truth i materializację jako commit domenowy |

## 10. Granice przyszłej implementacji

Przyszła implementacja ma wyprowadzać dostępność z narzędzi, obiektów i domenowych warunków, a Scenario jedynie obserwować oraz interpretować wynik. Musi zachować reconstruction/hydration osiągniętego fizycznego stanu bez replayu dramaturgii.

Poza zakresem i nadal niezamrożone są: konkretne API, nazwy nowych aktorów sector-control, szczegółowe algorytmy i osie ruchu sektorów, detenty, kąty, geometria/pole odpowiedzi, target scoring, parametry VFX/audio oraz nowe Scenario point IDs.

