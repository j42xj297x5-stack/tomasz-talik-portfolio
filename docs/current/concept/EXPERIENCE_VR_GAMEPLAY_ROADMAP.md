# EXPERIENCE VR — PLAN ROZWOJU GRY I PROGRESJI

**Projekt:** `tomasz-talik-portfolio`
**Tryb:** `Experience VR`
**Stan roadmapy:** 2026-08-01
**Status:** zatwierdzony kierunek przyszłego gameplayu i operacyjna roadmapa; nie jest opisem bieżącego runtime
**Urządzenie docelowe:** Meta Quest 3S / Meta Quest Browser
**Technologia runtime:** Three.js + WebXR + Vite
**Narzędzia assetowe:** Blender 5.1.2, Inkscape, GIMP
**Dźwięk:** odroczony do późniejszego etapu

---

## 1. Funkcja dokumentu

Ten dokument zbiera ustalenia dotyczące rozwinięcia Experience VR z prezentacji portfolio w krótką grę logiczno-przestrzenną.

Ma służyć jako:

- widoczna lista rzeczy do zrobienia;
- mapa zależności pomiędzy mechanikami;
- podstawa do przygotowywania kolejnych, małych promptów dla Codexa;
- ochrona przed zgubieniem ustaleń podczas wieloetapowej pracy;
- punkt odniesienia przy projektowaniu assetów w Blenderze i Inkscape;
- lista bramek testowych na Meta Quest 3S.

Dokument rozdziela:

1. **stan zastany** — to, co już działa w Experience VR;
2. **kierunek docelowy** — mechaniki opisane i zaakceptowane w bieżącym wątku;
3. **kolejność wdrożenia** — etapy, których nie należy realizować jednocześnie.

Nie jest to kanoniczny opis kodu. Checklisty jawnie oznaczają elementy wykonane i nadal planowane; kontrakt bieżącego runtime opisują modele techniczne oraz handoff.

---

## 2. Wizja gry

Experience VR pozostaje częścią portfolio, ale ma również działać jako mała gra pokazująca zdolność projektowania:

- progresji;
- interakcji VR;
- systemów narzędzi;
- przestrzennych zagadek;
- czytelnego sprzężenia zwrotnego;
- modularnej architektury gameplayu;
- komfortu użytkownika;
- pracy z assetami 3D, grafiką wektorową i shaderami.

Treści portfolio są nagrodą i śladem postępu, ale gracz nie ma jedynie podchodzić do glifu i czytać panelu. Powinien stopniowo odkrywać zasady świata, budować narzędzia i modyfikować relacje przestrzenne pomiędzy sobą, podłogą i glifami.

Główna pętla:

```text
pozyskanie kryształu gałęzi
→ umieszczenie go w relikwiarzu
→ aktywacja kolejnej karty tej gałęzi
→ podświetlenie pola i części sektora podłogi
→ zamknięcie globalnego progu
→ odblokowanie nowej mechaniki świata
→ zdobywanie trudniej dostępnych kryształów
```

---

## 3. Stan zastany, który należy zachować

Aktualny runtime Experience VR jest osobnym, dynamicznie importowanym środowiskiem WebXR.

Obowiązujące fundamenty:

- Experience VR nie uruchamia Experience 3D;
- posiada własny renderer, scenę, `playerRig`, kontrolery i pętlę `renderer.setAnimationLoop`;
- WebXR jest właścicielem tracked camera;
- kod nie zapisuje pozycji ani orientacji bezpośrednio do tracked camera;
- obiekty immersyjnego UI są elementami Three.js;
- modele są pobierane przez istniejący `AssetManager`;
- portal, relikwiarz, przyciski Activate i Release oraz interakcje kryształów stanowią bazę dalszej gry;
- reset i ponowne wejście do sesji nie mogą tworzyć duplikatów modeli, listenerów ani mixerów;
- ręczne testy na Meta Quest są osobną bramką jakości i nie mogą być zastępowane testami automatycznymi.

### 3.1. Potwierdzony kontrakt bieżącej implementacji

Aktualny runtime zawiera **18 logicznych kart** w układzie `3 / 3 / 3 / 4 / 5` oraz **15 współdzielonych modeli GLB** — po trzy warianty wizualne na każdą z pięciu gałęzi. Karty 4 i 5 ponownie wykorzystują warianty danej gałęzi.

Obecna instancja kryształu przechowuje gałąź i tier, a nie stronę ani kartę. Activate rozwiązuje właściwą stronę jako preview, natomiast Release po Activate zatwierdza ją w centralnej progresji. Dzięki temu magazynowanie kryształów nie zmienia kolejności narracji.

Podstawowa ergonomia targetowania jest już wykonanym fundamentem, a nie przyszłym narzędziem przyciągania. Oba kontrolery mają wspólny maksymalny zasięg `2.3 m` i przestrzenny mesh raya o średnicy `0.010 m`, który bez zmiany średnicy skraca się do najbliższego poprawnego trafienia raportowanego w danej klatce przez glify, kryształy lub dostępne przyciski Activate/Release. Brak poprawnego targetu przywraca pełną długość; globalny raycast sceny oraz helpery i fallback collidery nie sterują długością wskaźnika.

Aktywny glif lub dostępny kryształ pod rayem otrzymuje subtelne pulsujące halo oznaczające rzeczywistą dostępność akcji. Jest to współdzielony `ShaderMaterial` na widocznej geometrii modelu, z grubością wyznaczaną w screen/viewport space i viewportem aktualizowanym per-eye, bez bloom, postprocessingu i `OutlinePass`. Glify są trafiane po rzeczywistych widocznych meshach; domyślny hold trwa `0.5 s`, a `holdLostGraceSeconds = 0.15` pauzuje naliczanie podczas krótkiej utraty tego samego celu. Ich aktywne światło leży około `1.0 m` w stronę środka ringu w płaszczyźnie X/Z, z zachowaniem Y.

Dostępny kryształ z halo mieści się w tym samym kontrakcie targetowania i może zostać złapany squeeze. Chwyt stosuje na roocie konfigurowalną korektę `holdRotationDegrees = { x: 30, y: 0, z: 0 }`, nie przepisując lokalnych rotacji GLB. Jest to bazowy chwyt bezpośredni; planowane narzędzie attractor oraz semantyczne tryby A/X pozostają osobnymi, niewykonanymi etapami.

---

## 4. Pięć gałęzi i liczba kart

Docelowy układ:

| Element | Gałąź portfolio | Liczba kart | Figura pola |
|---|---|---:|---|
| Ziemia | Ethics | 3 | sześciobok foremny |
| Ogień | Creative AI | 3 | trójkąt |
| Drzewo | AI Guide | 3 | kwadrat |
| Metal | DIG Engine | 4 | koło |
| Woda | Haiku Cosmos | 5 | elipsa |

Każda karta ma:

- stabilne `cardId` lub `pageId`;
- stabilne `branchId`;
- numer `order`;
- numer globalnego progu `tier`;
- odpowiadające jej pole na podłodze;
- treść wyświetlaną przez portal;
- status aktywacji niezależny od fizycznego egzemplarza kryształu.

### 4.1. Zasada progów

Globalny próg jest ukończony wtedy, gdy odpowiednie pole zostało aktywowane we wszystkich gałęziach, które mają ten poziom.

```text
Próg 1: pierwsza karta wszystkich 5 gałęzi
Próg 2: druga karta wszystkich 5 gałęzi
Próg 3: trzecia karta wszystkich 5 gałęzi
Próg 4: czwarta karta Metalu i Wody
Próg 5: piąta karta Wody
```

Po progu 3 całkowicie ukończone są:

- Ziemia;
- Ogień;
- Drzewo.

Po progu 4 dodatkowo ukończony jest Metal.

Próg 5 zamyka Wodę i całą grę.

---

## 5. Obowiązujący kontrakt kryształów

### 5.1. Kryształ jest nośnikiem gałęzi

Fizyczny kryształ nie posiada na stałe:

- `pageId`;
- `cardId`;
- numeru części tekstu;
- numeru kolejności odczytu.

Zawiera wyłącznie dane instancji:

```js
{
  crystalId,
  glyphId,
  branchId,
  tier,
  visualVariant,
  state
}
```

`visualVariant` wpływa wyłącznie na użyty model lub wygląd. Nie niesie treści.

### 5.2. Wybór strony podczas Activate

Poprawne Activate odczytuje `branchId + tier`, weryfikuje sekwencję i rozwiązuje odpowiadającą stronę wyłącznie jako preview portalu. Dopiero Release po Activate zapisuje identyfikator strony, aktywuje pole podłogi i przelicza globalny próg. Release bez Activate nie zmienia progresji.

Schemat:

```js
const nextPage = progressionController.getNextPage(insertedCrystal.branchId, insertedCrystal.tier);
```

Kolejność fizycznego pozyskania i wkładania kryształów nie może wpływać na kolejność tekstu.

### 5.3. Gracz może magazynować kryształy

Gracz może:

- pozyskać wiele kryształów;
- przenieść je wcześniej w okolice relikwiarza;
- układać je po swojemu;
- przygotować się do przyszłych aktywacji.

To jest dopuszczony sposób „hakowania” tempa gry przez świadomego gracza.

System nie może jednak tworzyć więcej żywych kryształów gałęzi niż liczba pozostałych kart tej gałęzi:

```text
pozostałe karty gałęzi
− niezużyte kryształy tej gałęzi obecne w świecie
= maksymalna liczba kolejnych spawnów
```

### 5.4. Aktywacja i przeczytanie

Bieżący controller utrzymuje rejestr aktywowanych stron. Osobny rejestr odczytów pozostaje opcjonalnym kierunkiem:

```js
activatedPageIds
readPageIds
```

`activatedPageIds`:

- steruje progresją gry;
- zapala pola;
- zamyka progi;
- nie cofa się po Release.

`readPageIds`:

- może służyć do informacji, że strona została rzeczywiście obejrzana;
- nie blokuje progresji;
- może zostać rozwinięte później.

---

## 6. Wizualizacja progresji na podłodze

### 6.1. Konstrukcja

Wewnątrz kamiennego kręgu znajduje się przezroczysta, okrągła podłoga.

Podłoga ma:

- centralny rdzeń;
- pięć sektorów po 72°;
- cztery wewnętrzne okręgi graniczne;
- pięć pasów odpowiadających pięciu progom;
- pięć elementarnych gałęzi;
- łącznie 18 osobnych pól kart.

Każdy sektor zawiera:

```text
tło gałęzi
pola kart
subtelne łączniki pomiędzy polami
warstwę emisji pól
warstwę postępu tła
```

Pod spodem istnieje niezależna warstwa rozświetlająca pełne kręgi globalnych progów.

### 6.2. Zachowanie po aktywacji karty

Pole karty:

- zapala się przy aktywacji;
- wykonuje wyraźniejszy impuls początkowy;
- później świeci powolnym, delikatnym pulsem;
- pozostaje aktywne do końca gry.

Tło sektora:

- podświetla się od centrum do końca najwyższego aktywnego pola;
- dalsza część pozostaje wygaszona;
- granica podświetlenia ma miękki gradient;
- nie może wyglądać jak gwałtownie ucięta maska.

Warstwa kręgów:

- po ukończeniu globalnego progu rozświetla odpowiadający mu pierścień lub pas;
- jest niezależna od kolorowych sektorów;
- pokazuje, że gracz zamknął pełny etap gry.

### 6.3. Rekomendowana technika

Najlepszy wariant hybrydowy:

- Blender: fizyczna podłoga, główny root, anchory i pivoty;
- Inkscape: osobne ścieżki sektorów, pól i łączników;
- Three.js: geometria lub tekstury SVG, materiały emisyjne, animacja i stan;
- GIMP: miękkie maski, gradienty, halo, mapy alpha, jeśli będą potrzebne.

Nie należy uzależniać całego systemu od jednej spłaszczonej tekstury bez identyfikatorów pól.

---

## 7. Progresja mechanik gry

## 7.1. Próg 1 — przebudzenie kręgu

**Warunek:** pierwsza karta aktywna w każdej z pięciu gałęzi.

Zmiany świata:

- pierwszy pas lub okrąg podłogi zostaje zamknięty;
- glify przesuwają orbitę około 2 m wyżej;
- zwykłe dosięgnięcie kolejnych glifów przestaje być możliwe;
- pojawiają się wirujące skorupy;
- odblokowuje się podstawowe narzędzie przyciągające prawej ręki;
- rozpoczyna się budowa świetlistej kuli sterującej podłogą.

## 7.2. Skorupy i budowa kuli

Skorupy:

- wirują wokół kręgu we własnej sferze lub kontrolowanych orbitach;
- można je namierzyć narzędziem przyciągającym;
- można je przyciągnąć i umieścić w relikwiarzu;
- po Activate skorupa rozpuszcza się;
- jej energia tworzy kolejny fragment świetlistej kuli.

Stan skorupy:

```text
orbiting
→ targeted
→ pulling
→ held
→ inserted
→ dissolving
→ consumed
```

### Hologram konstrukcyjny

Nad relikwiarzem znajduje się mała, świetlista wizualizacja:

```text
VR_SPHERE_ASSEMBLY_ANCHOR
```

Po każdej skorupie:

- pojawia się kolejny fragment;
- kula obraca się;
- ukończone fragmenty pulsują;
- brakujące fragmenty mogą być zaznaczone subtelnym konturem;
- gracz widzi, że budowa postępuje.

Hologram nie jest jeszcze przedmiotem interaktywnym.

### Materializacja narzędzia

Po zebraniu wymaganej liczby skorup:

1. hologram zamyka pełną kulę;
2. następuje impuls światła;
3. kula materializuje się w relikwiarzu;
4. gracz może ją podnieść;
5. kula zostaje przypisana jako narzędzie lewej ręki;
6. po przypisaniu nie powinna dać się przypadkowo zgubić.

Stan kuli:

```text
hidden
→ assembling
→ completed
→ materializing
→ available
→ held
→ equipped-left
```

## 7.3. Próg 2 — podłoga i małe glify

**Warunek:** druga karta aktywna we wszystkich pięciu gałęziach oraz ukończona kula.

Zmiany świata:

- kula może sterować orientacją podłogi;
- glify poruszają się wyżej i dalej;
- pojawiają się małe glify;
- każdy mały glif odpowiada jednemu dużemu glifowi;
- mały glif służy do udoskonalenia narzędzia przyciągającego;
- duży glif może zostać przybliżony tylko na chwilę.

## 7.4. Próg 3 — ruchome sektory i antena

**Warunek:** trzecia karta aktywna we wszystkich pięciu gałęziach.

Ukończone gałęzie:

- Ziemia;
- Ogień;
- Drzewo.

Zmiany świata:

- ukończone sektory podłogi mogą zmieniać kąt;
- sektory stają się elementami anteny;
- dwa ostatnie glify odsuwają się bardzo daleko;
- poprawne ustawienie ukończonych sektorów skupia energię;
- soczewkowanie lub skupienie pola pozwala złapać kolejne glify.

Nie musi to być fizycznie realistyczna symulacja grawitacji. Ma być czytelna, przestrzenna i logicznie spójna.

## 7.5. Próg 4 — kamienie runiczne i esencja

**Warunek:** aktywna czwarta karta Metalu i czwarta karta Wody.

Ukończone gałęzie:

- Ziemia;
- Ogień;
- Drzewo;
- Metal.

Zmiany świata:

- pojawiają się kamienie runiczne;
- można je przyciągać;
- można umieścić je w relikwiarzu;
- relikwiarz wydobywa z nich esencję;
- esencja ulepsza narzędzie i wzmacnia antenę;
- cztery ukończone sektory tworzą radar finalny;
- radar pomaga odnaleźć ostatni kryształ Haiku Cosmos.

## 7.6. Próg 5 — finał Haiku Cosmos

**Warunek:**

- zgromadzona wymagana esencja;
- poprawnie ustawione cztery ukończone sektory;
- odnalezienie i przyciągnięcie finalnego glifu;
- zdobycie i aktywacja piątego kryształu Wody.

Finał:

- piąty sektor zostaje domknięty;
- wszystkie kręgi i gałęzie synchronizują światło;
- glify wracają do harmonijnego układu albo tworzą nową konfigurację;
- scena uspokaja się;
- portal może pokazać krótkie podsumowanie;
- nie jest wymagany klasyczny ekran „You win”.

Ostatni kryształ nadal korzysta ze zwykłej pętli:

```text
spawn
→ pull
→ insert
→ activate
→ release
```

Specjalny jest sposób dotarcia do niego, a nie sam mechanizm odczytu.

---

## 8. Sterowanie dłońmi i narzędziami

## 8.1. Prawa ręka

Przycisk **A** przełącza:

```text
zwykła ręka / bliska interakcja
↔
narzędzie przyciągania
```

Narzędzie przyciągania służy kolejno do:

- skorup;
- małych glifów;
- czasowego przyciągania dużych glifów po ulepszeniu;
- kamieni runicznych;
- finalnych obiektów progresji.

## 8.2. Lewa ręka

Przycisk **X** przełącza:

```text
zwykła ręka / bliska interakcja
↔
kula sterowania podłogą
```

W trybie kuli:

- kula jest widoczna przy lewej dłoni;
- trigger uruchamia sterowanie;
- orientacja kontrolera wpływa na orientację podłogi;
- zwolnienie triggera pozostawia podłogę w wybranej pozycji.

## 8.3. Warstwa semantycznych akcji

Nie należy rozrzucać numerów przycisków po modułach.

Rekomendowany kontrakt:

```text
toggleLeftTool
toggleRightTool
primaryAction
grabAction
```

Warstwa wejścia mapuje akcje na:

- X;
- A;
- trigger;
- squeeze/grip.

## 8.4. Priorytety triggera

Rekomendowana kolejność:

```text
1. przycisk lub UI trafione promieniem;
2. specjalny obiekt interaktywny;
3. działanie aktywnego narzędzia;
4. brak akcji.
```

Dzięki temu użycie Activate lub Release nie uruchomi przypadkiem sterowania podłogą.

## 8.5. Feedback

Każde przełączenie trybu dłoni powinno dawać:

- zmianę modelu lub końcówki narzędzia;
- impuls świetlny;
- zmianę koloru promienia lub celownika;
- krótką haptykę;
- później krótki sygnał dźwiękowy.

---

## 9. Sterowanie podłogą

## 9.1. Założenie podstawowe

Pierwszy prototyp ma sprawdzić pełny wariant:

- podłoga rzeczywiście się przechyla;
- gracz porusza się razem z nią;
- gracz pozostaje „przyklejony” do powierzchni;
- może poruszać się wyłącznie po wewnętrznym okręgu;
- orientacja podłogi jest ustawiana ruchem lewego kontrolera;
- ocena komfortu nastąpi dopiero na sprzęcie.

Nie należy z góry zastępować tego wariantem, w którym rusza się wyłącznie podłoga bez gracza.

## 9.2. Warunek aktywacji

Sterowanie może rozpocząć się tylko wtedy, gdy:

- kula jest ukończona;
- jest przypisana do lewej dłoni;
- aktywny jest tryb kuli;
- gracz stoi wewnątrz centralnego kręgu sterowania.

Podczas sterowania można tymczasowo zablokować locomotion joystickiem.

## 9.3. Mapowanie kontrolera

Na początku:

- sterowanie tylko `pitch` i `roll`;
- bez obrotu `yaw` całej podłogi;
- delta orientacji kontrolera wyznacza docelową orientację;
- powierzchnia płynnie podąża do celu;
- martwa strefa usuwa drgania;
- maksymalny kąt i prędkość są konfigurowalne.

Schemat:

```text
controllerStartQuaternion
floorStartQuaternion
currentControllerQuaternion
controllerDelta
targetFloorQuaternion
```

## 9.4. Hierarchia sceny

Rekomendowany root:

```text
VrTiltableFloorRoot
├── floor mesh
├── progress rings
├── five progress sectors
├── reliquary
├── sphere assembly hologram
├── portal, jeśli jest fizycznie osadzony w platformie
└── floor-bound decorations
```

Gracz:

```text
VrTiltableFloorRoot
└── VrFloorPassengerRoot
    └── playerRig
```

Nie wolno sterować tracked camera.

Glify, skorupy, odległe kamienie i obiekty orbitalne pozostają poza `VrTiltableFloorRoot`.

## 9.5. Locomotion na powierzchni

Po pochyleniu ruch powinien odbywać się w lokalnych współrzędnych podłogi:

```text
lokalne X/Z = poruszanie po powierzchni
lokalne Y = wysokość powierzchni
```

Granica:

```js
distanceFromFloorCenter <= floorRadius - safetyMargin
```

Przy krawędzi:

- ruch na zewnątrz jest blokowany;
- ruch styczny nadal działa;
- gracz nie spada;
- na pierwszym etapie nie jest wymagany silnik fizyczny.

## 9.6. Parametry komfortu

Od początku należy przygotować ustawienia:

```js
floorControl: {
  centralActivationRadius,
  maximumTiltRadians,
  maximumAngularSpeed,
  responseSmoothing,
  controllerDeadzone,
  lockLocomotionWhileAdjusting,
  peripheralVignetteEnabled
}
```

Pierwsza wersja testowa:

- start tylko w centralnym kręgu;
- umiarkowany limit przechylenia;
- ciężkie, płynne podążanie;
- blokada locomotion podczas triggera;
- opcja przywrócenia poziomu;
- pełny test na Quest 3S.

Winieta, ograniczona amplituda lub stabilizacja mogą zostać dodane po testach, jeśli pełna wersja wywołuje dyskomfort.

---

## 10. Nadrzędny system progresji

Nie należy implementować progów wewnątrz losowych modułów glifów, podłogi lub relikwiarza.

Właścicielem zatwierdzonej progresji jest istniejący:

```text
VrProgressionController
```

Bieżący controller obejmuje aktywowane strony, walidację branch+tier, progi 1–5 i zapytania o ich ukończenie. Poniższy model pokazuje planowane rozszerzenie o późniejsze systemy gry:

Przykładowy model:

```js
{
  activatedPageIds: Set,

  branchProgress: {
    earth: 0,
    fire: 0,
    wood: 0,
    metal: 0,
    water: 0
  },

  completedTiers: {
    1: false,
    2: false,
    3: false,
    4: false,
    5: false
  },

  completedBranches: {
    earth: false,
    fire: false,
    wood: false,
    metal: false,
    water: false
  },

  capabilities: {
    shellPull: false,
    floorControl: false,
    largeGlyphPull: {},
    sectorLensing: false,
    runeExtraction: false,
    finalRadar: false
  },

  sphereAssembly: {
    insertedShells: 0,
    requiredShells: 0,
    completed: false,
    equipped: false
  },

  boundSmallGlyphs: {
    earth: false,
    fire: false,
    wood: false,
    metal: false,
    water: false
  },

  sectorAngles: {
    earth: 0,
    fire: 0,
    wood: 0,
    metal: 0,
    water: 0
  },

  runeEssence: 0,
  finalCrystalUnlocked: false
}
```

Wydarzenia:

```text
cardActivated
branchProgressChanged
tierCompleted
branchCompleted
capabilityUnlocked
shellConsumed
sphereCompleted
sphereEquipped
smallGlyphBound
floorOrientationChanged
sectorAligned
runeEssenceChanged
finalCrystalUnlocked
gameCompleted
```

Każde wydarzenie jednorazowe musi mieć zabezpieczenie przed ponownym odpaleniem po resecie lub ponownym przeliczeniu stanu.

---

## 11. Proponowany podział modułów

Docelowe nazwy są robocze i powinny zostać potwierdzone po punktowym odczycie aktualnej mapy kodu.

```text
src/xr/progression/
  createVrProgressionController.js
  vrProgressionDefinition.js
  createVrProgressPersistence.js

src/xr/floor/
  createVrProgressFloor.js
  createVrSectorVisual.js
  createVrProgressRings.js
  createVrFloorControl.js
  createVrFloorLocomotionBoundary.js
  createVrSectorAlignment.js

src/xr/shells/
  createVrShellSystem.js
  createVrSphereAssembly.js

src/xr/input/
  createVrHandModeController.js
  createVrSemanticInput.js

src/xr/tools/
  createVrAttractorTool.js
  createVrFloorOrbTool.js
  createVrToolUpgradeSystem.js

src/xr/glyphs/
  createVrSmallGlyphSystem.js
  createVrLargeGlyphPull.js

src/xr/runes/
  createVrRuneStoneSystem.js
  createVrRuneExtraction.js

src/xr/finale/
  createVrFinalRadar.js
  createVrCompletionSequence.js
```

`experienceVr.js` powinien pozostać composition rootem:

- tworzy moduły;
- podaje zależności;
- ustala kolejność `update(delta)`;
- przekazuje zdarzenia;
- resetuje i usuwa systemy.

Nie powinien zawierać całej logiki progresji ani szczegółów poszczególnych mechanik.

---

## 12. Pipeline assetów

## 12.1. Inkscape — podłoga i sektory

Dla każdego sektora:

```text
sector-earth.svg
sector-fire.svg
sector-wood.svg
sector-metal.svg
sector-water.svg
```

Rekomendowana struktura identyfikatorów:

```text
background
connector-01
field-01
connector-02
field-02
connector-03
field-03
connector-04
field-04
connector-05
field-05
```

Elementy nieistniejące w krótszej gałęzi są pomijane.

Wymagania:

- każdy element ma stabilne `id`;
- krzywe są zamknięte tam, gdzie potrzebne jest wypełnienie;
- pola i tło są osobnymi elementami;
- sektor mieści się w dokładnym kącie 72°;
- punkt centralny i zewnętrzny promień są wspólne dla wszystkich pięciu plików;
- grafiki można nałożyć na wspólną tarczę bez ręcznego dopasowywania.

## 12.2. Blender — struktura 3D

Do przygotowania:

- fizyczna przezroczysta podłoga;
- root i pivot podłogi;
- anchory pięciu sektorów;
- anchor hologramu kuli;
- elementy kuli;
- skorupy;
- narzędzie prawej ręki;
- model kuli lewej ręki;
- małe glify;
- kamienie runiczne;
- opcjonalne animacje relikwiarza i transformacji.

Stabilne nazwy przykładowe:

```text
VR_TILTABLE_FLOOR_ROOT
VR_PROGRESS_FLOOR_SURFACE
VR_PROGRESS_SECTOR_EARTH_ANCHOR
VR_PROGRESS_SECTOR_FIRE_ANCHOR
VR_PROGRESS_SECTOR_WOOD_ANCHOR
VR_PROGRESS_SECTOR_METAL_ANCHOR
VR_PROGRESS_SECTOR_WATER_ANCHOR
VR_SPHERE_ASSEMBLY_ANCHOR
```

Ruchome elementy muszą mieć poprawne originy i własne meshe. Jeden nadrzędny Empty powinien być rootem eksportu danego reliktu lub narzędzia.

## 12.3. GIMP — materiały pomocnicze

Do późniejszego przygotowania:

- miękkie maski granicy postępu;
- mapy alpha;
- tekstury halo;
- mapy emisji;
- mapy roughness i normal;
- lekkie tekstury zoptymalizowane pod Quest.

GIMP nie jest głównym narzędziem do projektowania struktury pól.

---

## 13. Kolejność wdrożenia — główna roadmapa

# ETAP 0 — zamrożenie kontraktu progresji

## Cel

Zdefiniować dane i zasady przed rozbudową grafiki i mechanik.

## TODO

- [x] Potwierdzić stabilne `branchId` pięciu gałęzi.
- [x] Ustalić docelowe 18 `page.id`.
- [x] Przypisać każdej stronie `branchId`, `order` i `tier`.
- [x] Potwierdzić mapowanie portfolio → element.
- [x] Zdefiniować warunki progów 1–5.
- [ ] Zdefiniować odblokowywane możliwości.
- [ ] Ustalić liczbę skorup potrzebnych do kuli.
- [x] Ustalić, które dane przeżywają reset sesji.
- [ ] Ustalić późniejszą trwałość po odświeżeniu strony.
- [ ] Przygotować tryb debug do ustawiania fazy gry.

## Bramka

Jedna spójna definicja progresji niezależna od modeli 3D.

---

# ETAP 1 — naprawa sekwencji kryształów

## Cel

Kryształ nie niesie strony; Activate wybiera następną kartę gałęzi.

## TODO

- [x] Wykonać punktowy audyt `experienceVrPages` i `createVrCrystalCollection`.
- [x] Usunąć trwałe powiązanie instancji kryształu z `page.id`.
- [x] Zachować `glyphId`, `branchId`, tier, wariant modelu i stan instancji.
- [x] Dodać resolver strony dla `branchId + tier` w controllerze.
- [x] Rozwiązywać stronę dopiero w `activateInserted()`.
- [x] Zapisywać progres podczas Release po Activate.
- [x] Nie zmieniać progresji podczas insertion ani Activate.
- [x] Zatwierdzać progresję wyłącznie podczas Release po Activate.
- [x] Ograniczyć spawn do kolejnych niepokrytych kart gałęzi.
- [x] Zatrzymać spawn po pokryciu wszystkich kart gałęzi.
- [x] Dodać test magazynowania i kolejności kryształów.
- [x] Dodać test globalnej sekwencji tierów 1 → 2 → 3 → 4 → 5.
- [x] Zachować state machine z `rejecting` i `consuming`.
- [x] Potwierdzić sprzętowy gate gotowości na Quest 3S: preload, ready, aktywny przycisk wejścia i działająca sesja.
- [ ] Przetestować pełny cykl gameplayowy oraz performance/readability na Quest.

## Bramka

Dowolny fizyczny kryształ danej gałęzi pokazuje zawsze następną kartę tej gałęzi.

---

# ETAP 2 — `VrProgressionController`

## Cel

Zbudować jednego właściciela progresji i progów.

## TODO

- [x] Utworzyć definicję 18 kart.
- [ ] Dodać `branchProgress`.
- [ ] Dodać `completedTiers`.
- [ ] Dodać `completedBranches`.
- [ ] Dodać `capabilities`.
- [x] Zatwierdzać stronę podczas Release po Activate.
- [x] Przeliczać zatwierdzone strony gałęzi.
- [x] Przeliczać globalne progi po commit podczas Release.
- [x] Zapewnić idempotentne wizualne `completeTier()`.
- [x] Zachować progres podczas resetu przygotowanego runtime.
- [ ] Dodać kontrolowany pełny reset gry.
- [ ] Dodać API debug do ustawiania postępu.

## Bramka

Testy mogą aktywować karty bez sceny 3D i poprawnie uzyskiwać progi oraz ukończone gałęzie.

---

# ETAP 3 — techniczny fundament podłogi

## Stan implementacji na 2026-08-01

Pięć autorskich GLB jest preloadowanych przez `AssetManager` i złożonych co 72° pod wspólnym, nieruchomym rootem `VrTiltableFloorRoot`. Stabilne identyfikatory mapują 18 pól do 18 kart. Controller obsługuje progi, a podłoga pięć pełnych globalnych ringów. Nie oznacza to wdrożenia progresywnego tła sektorów ani ruchomej podłogi. Szczegóły opisuje [VR Progress Floor Model](../technical/VR_PROGRESS_FLOOR_MODEL.md).

## Cel

Dodać stabilny root, powierzchnię, anchory i dane pięciu sektorów.

## TODO assetowe

- [x] Przygotować pięć autorskich GLB sektorów, po jednym dla gałęzi.
- [ ] Przygotować jedną fizyczną powierzchnię okrągłej podłogi. Obecnie niewidoczne bazy pięciu wycinków nie stanowią osobnego wspólnego collidera/podłoża.
- [ ] Ustawić centralny pivot w assetcie. Obecny wspólny root jest tworzony wyłącznie runtime'owo.
- [x] Rozmieścić pięć sektorów co 72° wokół wspólnego środka.
- [ ] Dodać anchor hologramu kuli.
- [x] Utrzymać stabilne identyfikatory baz i pól w pięciu GLB.
- [ ] Przygotować pięć SVG sektorów.

## TODO runtime

- [x] Preloadować pięć modeli sektorów przez `AssetManager`.
- [x] Utworzyć wspólny `VrTiltableFloorRoot`, obecnie nieruchomy.
- [x] Umieścić pięć sektorów bez lokalnego przesunięcia.
- [x] Powiązać 18 pól z 18 kartami przez `glyphId + order`.
- [x] Sterować polami niezależnie.
- [x] Dodać pięć niezależnych pełnych globalnych okręgów.
- [ ] Dodać tryb debugowego podświetlenia pól.
- [ ] Zweryfikować brak z-fightingu na urządzeniu.
- [ ] Zweryfikować czytelność na Meta Quest.

## Bramka

Kontrakt identyfikatorów, pozycji i niezależnego sterowania jest pokryty testem automatycznym. Bramka sprzętowa dotycząca z-fightingu i czytelności na Quest pozostaje otwarta.

---

# ETAP 4 — wizualizacja progresji

## Cel

Commit karty podczas Release zmienia odpowiadające pole i po ukończeniu tieru jego globalny okrąg. Progresywne tło sektora pozostaje planem.

## TODO

- [x] Dodać impuls aktywacyjny pola.
- [ ] Dodać cykliczny, powolny puls stanu aktywnego. Obecnie po impulsie pozostaje stabilny blask.
- [ ] Dodać narastające podświetlenie tła sektora do najwyższego pola gałęzi.
- [ ] Dodać miękką granicę gradientową.
- [x] Dodać niezależne kolory pięciu gałęzi.
- [x] Podświetlać niezależnie właściwe pole przez `glyphId + order`.
- [ ] Dodać prawie biały rdzeń i kolorowe halo.
- [x] Dodać pięć pełnych pierścieni z impulsem po pierwszym ukończeniu tieru.
- [ ] Zrobić wariant wydajnościowy bez pełnego postprocessingu.
- [ ] Przetestować wydajność oraz limity przezroczystości i overdraw na Quest.

## Bramka

Zaimplementowany łańcuch to `Activate preview → Release commit → glyphId + order → właściwe pole → test tieru → pełny ring`. Sprzętowy smoke gate gotowości i wejścia do sesji jest potwierdzony na Quest 3S; otwarte pozostają tło sektora, gradient oraz pełne QA wydajności i czytelności.

---

# ETAP 5 — przejście świata po progu 1

## Cel

Pierwszy ukończony próg zmienia zasady gry.

## TODO

- [ ] Podnieść orbitę glifów o ustaloną wysokość.
- [ ] Zmienić ich dostępność dla zwykłej ręki.
- [ ] Dodać zdarzenie world-transition dla progu 1.
- [ ] Dodać testową skorupę.
- [ ] Dodać kontrolowaną orbitę skorupy.
- [ ] Dodać komunikację wizualną, że potrzebne jest nowe narzędzie.
- [ ] Zabezpieczyć przejście przed wielokrotnym wykonaniem.
- [ ] Sprawdzić, czy wcześniej zgromadzone kryształy nadal działają.

## Bramka

Po ukończeniu pierwszego rzędu świat wyraźnie zmienia zasady, ale dotychczasowy progres nie zostaje uszkodzony.

---

# ETAP 6 — prawa ręka i narzędzie przyciągania

## Cel

Dodać pierwszy tryb narzędzia prawej ręki.

## TODO

- [ ] Utworzyć `createVrSemanticInput`.
- [ ] Utworzyć `createVrHandModeController`.
- [ ] Przypisać A do przełączania prawej ręki.
- [ ] Zachować squeeze dla bliskiego chwytu, jeśli nie koliduje z nowym kontraktem.
- [ ] Dodać widoczny model narzędzia.
- [ ] Dodać raycast celów narzędzia.
- [ ] Dodać przyciąganie skorupy.
- [ ] Dodać anulowanie i zwrot do orbity.
- [ ] Dodać feedback wizualny i haptyczny.
- [ ] Zachować priorytet przycisków relikwiarza nad narzędziem.

## Bramka

Gracz świadomie przełącza prawą rękę i przyciąga skorupę bez psucia zwykłych interakcji.

---

# ETAP 7 — skorupy, relikwiarz i hologram kuli

## Cel

Zamknąć pełną pętlę budowy narzędzia lewej ręki.

## TODO

- [ ] Dodać osobną kolekcję skorup.
- [ ] Dodać insertion skorupy do relikwiarza.
- [ ] Rozróżnić tryb kryształu i skorupy.
- [ ] Dodać Activate skorupy.
- [ ] Dodać rozpuszczenie skorupy.
- [ ] Zwiększać `insertedShells`.
- [ ] Dodać hologram nad relikwiarzem.
- [ ] Ujawniać kolejne fragmenty.
- [ ] Dodać obrót i puls hologramu.
- [ ] Dodać końcową materializację.
- [ ] Dodać chwyt gotowej kuli.
- [ ] Dodać przypisanie do lewej ręki.
- [ ] Po przypisaniu zapobiec przypadkowemu zgubieniu.
- [ ] Przetestować reset w połowie i po ukończeniu konstrukcji.

## Bramka

Gracz może zbudować kulę od zera i otrzymać trwałe narzędzie lewej ręki.

---

# ETAP 8 — prototyp ruchomej podłogi

## Cel

Sprawdzić najtrudniejsze założenie komfortowe i techniczne przed dalszą rozbudową gry.

## TODO

- [ ] Przypisać X do trybu kuli.
- [ ] Dodać warunek centralnego kręgu.
- [ ] Dodać trigger-to-control.
- [ ] Zapisać orientację startową kontrolera i podłogi.
- [ ] Obliczać deltę quaternionów.
- [ ] Sterować `pitch` i `roll`.
- [ ] Dodać martwą strefę.
- [ ] Dodać wygładzanie.
- [ ] Dodać limity kąta i prędkości.
- [ ] Zgrupować platformę i obiekty z nią związane.
- [ ] Podpiąć `playerRig` przez passenger root.
- [ ] Nie modyfikować tracked camera.
- [ ] Przepisać locomotion na lokalną płaszczyznę podłogi.
- [ ] Dodać matematyczną granicę koła.
- [ ] Zablokować joystick podczas regulacji.
- [ ] Dodać reset do poziomu.
- [ ] Przeprowadzić test na Quest 3S.
- [ ] Zanotować objawy dyskomfortu i parametry.
- [ ] Dopiero po teście zdecydować o winiecie lub stabilizacji.

## Bramka

Gracz może precyzyjnie ustawić podłogę kontrolerem, przemieszczać się po niej i nie wypadać poza jej granicę.

---

# ETAP 9 — małe glify i ulepszanie prawego narzędzia

## Cel

Dodać kierunkowe, elementarne ulepszenia narzędzia przyciągania.

## TODO

- [ ] Przygotować pięć małych glifów.
- [ ] Każdy powiązać ze stabilnym `glyphId`.
- [ ] Dodać ich spawn po właściwym progu.
- [ ] Dodać przyciąganie.
- [ ] Dodać insertion do relikwiarza.
- [ ] Dodać wiązanie z narzędziem lub kulą.
- [ ] Zapisać `boundSmallGlyphs`.
- [ ] Odblokować przyciąganie tylko odpowiedniego dużego glifu.
- [ ] Dodać czasowe przybliżenie dużego glifu.
- [ ] Dodać powrót na orbitę.
- [ ] Dodać cooldown lub koszt, jeśli testy tego wymagają.
- [ ] Zapobiec trafieniu niewłaściwego dużego glifu.

## Bramka

Każdy mały glif daje jedną czytelną, elementarną zdolność przyciągnięcia odpowiadającego dużego glifu.

---

# ETAP 10 — ruchome sektory i soczewkowanie

## Cel

Ukończone sektory podłogi stają się elementami anteny.

## TODO

- [ ] Dodać uchwyty tylko do ukończonych sektorów.
- [ ] Zdefiniować dozwolone kąty sektorów.
- [ ] Dodać sterowanie grabem.
- [ ] Dodać linię lub stożek kierunku.
- [ ] Zdefiniować cel skupienia.
- [ ] Obliczać `alignmentScore`.
- [ ] Dodać wizualny feedback poprawności.
- [ ] Wymagać utrzymania ustawienia przez określony czas.
- [ ] Po sukcesie przybliżyć odległy glif.
- [ ] Zachować stabilność całej podłogi podczas ruchu sektorów.
- [ ] Dodać reset błędnego ustawienia.
- [ ] Przetestować czy zagadka jest czytelna bez tekstowej instrukcji.

## Bramka

Trzy ukończone sektory pozwalają przechwycić kolejne odległe glify przez przestrzenną zagadkę ustawienia.

---

# ETAP 11 — kamienie runiczne i esencja

## Cel

Dodać finalną warstwę ulepszania narzędzia i anteny.

## TODO

- [ ] Przygotować modele kamieni runicznych.
- [ ] Dodać kontrolowane orbity.
- [ ] Dodać targeting i pull.
- [ ] Dodać insertion do relikwiarza.
- [ ] Dodać ekstrakcję esencji.
- [ ] Dodać stan kamienia po ekstrakcji.
- [ ] Zapisywać `runeEssence`.
- [ ] Dodać wizualizację esencji.
- [ ] Wzmocnić antenę czterech sektorów.
- [ ] Odblokować finalny radar.
- [ ] Dodać wskazanie kierunku lub jakości sygnału.

## Bramka

Gracz rozumie, że kamienie nie są kolejnymi kartami, lecz paliwem finalnego systemu.

---

# ETAP 12 — finalny radar i Haiku Cosmos 5

## Cel

Zamknąć pełną progresję bez tworzenia osobnego systemu aktywacji treści.

## TODO

- [ ] Zdefiniować warunki finału.
- [ ] Połączyć esencję i ustawienie sektorów.
- [ ] Dodać wykrywanie finalnego glifu.
- [ ] Dodać materializację lub zbliżenie.
- [ ] Dodać zdobycie ostatniego kryształu.
- [ ] Przeprowadzić go przez zwykły relikwiarz.
- [ ] Aktywować piątą kartę Wody.
- [ ] Dodać `gameCompleted`.
- [ ] Dodać sekwencję synchronizacji podłogi i glifów.
- [ ] Dodać spokojny stan końcowy.
- [ ] Zapewnić możliwość ponownego obejrzenia treści bez utraty progresji.

## Bramka

Gra jest ukończona po normalnej aktywacji osiemnastej karty.

---

# ETAP 13 — trwały zapis, reset i debug

## Cel

Umożliwić bezpieczne testowanie i kontynuowanie dłuższej gry.

## TODO

- [ ] Wprowadzić wersjonowany format zapisu.
- [ ] Zapisywać aktywne karty.
- [ ] Zapisywać ukończone progi i gałęzie.
- [ ] Zapisywać stan kuli.
- [ ] Zapisywać związane małe glify.
- [ ] Zapisywać esencję.
- [ ] Zapisywać odblokowane możliwości.
- [ ] Nie zapisywać przypadkowych chwilowych pozycji luźnych obiektów.
- [ ] Odtwarzać scenę z logicznego stanu.
- [ ] Dodać pełny reset gry.
- [ ] Dodać menu lub bezpieczny mechanizm debug.
- [ ] Dodać przeskok do każdego progu.
- [ ] Dodać spawn testowy każdego typu obiektu.
- [ ] Dodać kontrolę poprawności save version.

## Bramka

Grę można testować od dowolnego etapu i wznowić po przeładowaniu bez niespójnego świata.

---

# ETAP 14 — wydajność, komfort i dostępność

## Cel

Doprowadzić grę do stabilnego działania na Meta Quest 3S.

## TODO

- [ ] Zmierzyć płynność w każdym progu.
- [ ] Ograniczyć transparent overdraw podłogi.
- [ ] Zmierzyć koszt istniejącego screen-space halo bez bloom i postprocessingu.
- [ ] Ograniczyć liczbę jednoczesnych świateł.
- [ ] Używać współdzielonych materiałów, gdzie to bezpieczne.
- [ ] Zwalniać zasoby przy disposal.
- [ ] Przetestować długą sesję.
- [ ] Przetestować ponowne wejście do VR.
- [ ] Przetestować reset w każdej fazie.
- [ ] Przetestować grę na siedząco i stojąco.
- [ ] Dodać opcje komfortu podłogi.
- [ ] Dodać reduced motion, jeśli będzie potrzebny.
- [ ] Sprawdzić czytelność kolorów i kontrastu.
- [ ] Sprawdzić czy zagadki mają wystarczający feedback bez dźwięku.

## Bramka

Mechanika jest stabilna, czytelna i komfortowa na sprzęcie docelowym.

---

# ETAP 15 — dźwięk i finalny polishing

Etap odroczony.

Docelowo:

- dźwięki przełączania narzędzi;
- przyciąganie;
- aktywacja karty;
- podświetlenie pola;
- zamknięcie progu;
- rozpuszczenie skorupy;
- składanie kuli;
- sterowanie podłogą;
- wiązanie małego glifu;
- soczewkowanie;
- ekstrakcja esencji;
- finalny radar;
- domknięcie gry;
- subtelny ambient zależny od progresji.

Dźwięk nie może być wymagany do zrozumienia mechaniki.

---

## 14. Najbliższa realna kolejka prac

Fundament `branch+tier → Activate preview → Release commit → panel → tier test → ring → consuming` jest wykonany. Kolejka dalszej wizji zaczyna się od niewdrożonych warstw:

```text
1. Progresywne tło sektorów i miękka granica gradientowa.
2. Centralny progression core.
3. Zdarzenie ukończenia tieru 1 i world transition.
4. Testowa skorupa jako dowód zmiany świata.
5. Dopiero potem narzędzia dłoni i budowa kuli.
```

Pierwszy niewykonany pionowy wycinek powinien połączyć ukończenie tieru 1 z czytelną zmianą świata, bez naruszania istniejącego kontraktu preview/commit.

---

## 15. Zasady dzielenia pracy dla Codexa

Każde zadanie powinno być małe i kończyć się samowystarczalnym raportem.

Nie łączyć w jednym promptcie:

- audytu kryształów;
- zmiany modelu stron;
- rozszerzenia progression controllera o dalsze systemy;
- assetów podłogi;
- shaderów;
- skorup;
- ruchomej platformy.

Rekomendowana sekwencja:

```text
audyt
→ poprawka
→ test sprzętowy
→ następny moduł
```

Po raporcie Codexa:

- analizować wyłącznie Summary;
- nie tworzyć automatycznie następnego promptu;
- najpierw przeprowadzić wymagany test na Quest;
- dopiero po akceptacji przejść dalej.

---

## 16. Największe ryzyka

### 16.1. Ruchoma podłoga i choroba lokomocyjna

To największe ryzyko projektowe.

Minimalizacja:

- prototyp przed rozbudową dalszych mechanik;
- ograniczenie sterowania do centralnego kręgu;
- blokada locomotion podczas regulacji;
- konfigurowalny kąt i prędkość;
- test na sprzęcie;
- możliwość późniejszego dodania winiety, stabilizacji lub wariantu komfortowego.

### 16.2. Zbyt szeroki system stanów

Ryzyko:

- logika rozlana po modułach;
- wielokrotne wywołanie progów;
- niespójny reset;
- obiekty świata niezgodne z zapisem.

Minimalizacja:

- jeden `VrProgressionController`;
- jawne state machine’y;
- zdarzenia jednorazowe;
- odtwarzanie świata z logicznego stanu.

### 16.3. Nadmiar przezroczystości i emisji

Ryzyko na Quest:

- overdraw;
- spadki FPS;
- migotanie;
- nieczytelność kolorów.

Minimalizacja:

- osobne profile materiałów;
- wariant bez bloom;
- mała liczba warstw;
- testy na rzeczywistym urządzeniu.

### 16.4. Konflikty inputu

Ryzyko:

- trigger uruchamia narzędzie zamiast przycisku;
- squeeze koliduje z nowymi obiektami;
- obie dłonie próbują przejąć ten sam przedmiot.

Minimalizacja:

- semantyczna warstwa wejścia;
- jawna hierarchia priorytetów;
- osobny właściciel obiektu;
- testy każdego trybu dłoni.

### 16.5. Zbyt wiele mechanik bez komunikacji

Ryzyko:

- gracz nie rozumie, co się zmieniło;
- nowe obiekty wyglądają jak dekoracje;
- progresja wymaga tekstowych instrukcji.

Minimalizacja:

- zmiana świata po progu;
- czytelny ruch i światło;
- hologram budowy;
- feedback kierunku i jakości ustawienia;
- ograniczone, krótkie komunikaty portalu;
- później dźwięk i haptyka.

---

## 17. Status fundamentu i przyjęty kierunek docelowy

`[x]` poniżej oznacza wyłącznie element obecnego runtime. Planowana wizja pozostaje oznaczona `[ ]`, nawet gdy decyzja produktowa jest zatwierdzona.

- [x] Experience VR pozostaje osobnym runtime’em.
- [x] Gra ma 18 kart w układzie `3 / 3 / 3 / 4 / 5`.
- [x] Kryształ reprezentuje gałąź, nie konkretną kartę.
- [x] Kolejna karta jest wybierana dopiero podczas Activate.
- [x] Gracz może magazynować kryształy.
- [x] Podłoga ma pięć sektorów po 72°.
- [x] Podłoga ma 18 niezależnych pól i pięć proceduralnych pełnych ringów globalnych tierów.
- [ ] Docelowo tło sektora podświetla się do aktualnego pola z gradientem; obecnie wykonane są impuls i stabilny blask pojedynczych pól.
- [x] `VrProgressionController` jest właścicielem zatwierdzonych kart, globalnych tierów i insertion gating.
- [x] Activate wykonuje preview, Release wykonuje commit; invalid insertion ma `rejecting`, a commit kończy się `consuming`.
- [x] Bazowy ray ma wspólne `2.3 m`, stałą średnicę `0.010 m` i skraca się do najbliższego poprawnego hit distance raportowanego przez istniejące systemy interakcji.
- [x] Aktywne glify i dostępne kryształy mają per-eye screen-space halo oznaczające faktyczną dostępność interakcji, bez bloom i postprocessingu.
- [x] Glify korzystają z widocznych meshów, holda `0.5 s` oraz `0.15 s` grace period; ich aktywne światło jest przesunięte około `1.0 m` do środka w X/Z.
- [x] Bazowy squeeze-grab kryształu respektuje `2.3 m` i korektę roota `{ x: 30, y: 0, z: 0 }` bez zmiany lokalnych rotacji GLB.
- [ ] Próg 1 podnosi glify i uruchamia skorupy.
- [ ] Skorupy budują świetlistą kulę nad relikwiarzem.
- [ ] Gotowa kula materializuje się i staje się narzędziem lewej ręki.
- [ ] A przełącza prawą rękę i narzędzie przyciągania.
- [ ] X przełącza lewą rękę i kulę podłogi.
- [ ] Trigger lewej ręki steruje podłogą.
- [ ] Podłoga przechyla się razem z graczem.
- [ ] Gracz porusza się po lokalnej płaszczyźnie przechylonej podłogi w granicy wewnętrznego koła.
- [ ] Małe glify ulepszają przyciąganie odpowiadających dużych glifów.
- [ ] Ukończone sektory stają się anteną.
- [ ] Kamienie runiczne dostarczają esencji.
- [ ] Cztery sektory i esencja odblokowują finalny radar.
- [ ] Ostatni kryształ korzysta ze zwykłego cyklu relikwiarza w planowanej sekwencji finałowej.
- [x] Dźwięk jest odroczony do czasu ustabilizowania mechaniki.

---

## 18. Decyzje do podjęcia później

Nie blokują pierwszych etapów:

- [ ] dokładna liczba skorup potrzebnych do kuli;
- [ ] forma modelu i liczba fragmentów kuli;
- [ ] dokładne limity kąta podłogi;
- [ ] czy portal obraca się razem z podłogą — rekomendowane: tak, jeśli stoi na niej fizycznie;
- [ ] czy kula steruje wyłącznie `pitch/roll`, czy później również `yaw`;
- [ ] sposób resetu podłogi do poziomu;
- [ ] koszt lub cooldown przyciągania dużych glifów;
- [ ] matematyka i tolerancja soczewkowania;
- [ ] liczba kamieni i ilość esencji;
- [ ] trwałość zapisu po odświeżeniu;
- [ ] dokładna forma finału;
- [ ] warianty komfortu po testach;
- [ ] dźwięk i ambient progresji.

---

## 19. Definicja ukończenia projektu gameplayowego

Experience VR można uznać za funkcjonalnie ukończone, gdy:

- wszystkie 18 kart jest aktywowanych sekwencyjnie;
- kolejność fizycznych kryształów nie miesza tekstu;
- podłoga pokazuje postęp każdej gałęzi i globalnych progów;
- próg 1 zmienia świat i uruchamia skorupy;
- gracz buduje kulę;
- prawa i lewa ręka mają działające tryby narzędzi;
- gracz potrafi sterować podłogą;
- małe glify ulepszają przyciąganie;
- ruchome sektory rozwiązują zagadkę anteny;
- kamienie dostarczają esencji;
- radar ujawnia ostatni kryształ;
- finał domyka Haiku Cosmos;
- reset i ponowne wejście nie tworzą niespójnego stanu;
- gra działa stabilnie na Meta Quest 3S;
- Classic 2D i Experience 3D nie otrzymują regresji.

---

## 20. Punkt startowy

**Kontrakt kryształów i minimalna progresja progów są zaimplementowane.**

Bez tej poprawki:

- teksty będą odczytywane losowo;
- podłoga będzie zapalała niewłaściwe pola;
- progi mogą zostać zaliczone w złej kolejności;
- magazynowanie kryształów będzie niszczyło narrację progresji;
- wszystkie dalsze mechaniki będą budowane na błędnym fundamencie.

Podłoga podświetla pole dopiero po zatwierdzeniu strony przez Release. Minimalny `VrProgressionController` obsługuje karty i progi 1–5, a pięć globalnych ringów wizualizuje ukończone tiery. Poza runtime pozostają progresywne tło sektorów, centralny core, world transition po tierze 1, przechylanie i pełny system capabilities.

### Astro Attractor sphere assembly (design value only)

- `sphereAssembly.requiredShells = 6`
- Assembly, counters, holograms, and shell consumption are not implemented in the current runtime.
