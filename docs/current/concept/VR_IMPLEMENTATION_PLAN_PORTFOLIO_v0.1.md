# PLAN WDROŻENIA TRYBU VR — TOMASZ TALIK PORTFOLIO

**Status:** kanoniczny plan rozwoju, jeszcze nie opis stanu wdrożonego  
**Wersja:** 0.1  
**Data:** 2026-07-28  
**Projekt:** `tomasz-talik-portfolio`  
**Docelowe urządzenie pierwszego testu:** Meta Quest 3S / Meta Quest Browser  
**Technologia:** Three.js r184 + WebXR + Vite + GitHub Pages

---

## 1. Cel dokumentu

Celem jest wprowadzenie osobnego trybu VR, który:

- korzysta z tego samego świata, assetów, treści i bazowych ustawień co obecny Experience 3D;
- nie zmienia zachowania, dźwięku, interakcji ani wydajności obecnego Experience 3D;
- ma własny runtime, kamerę gracza, pętlę renderowania, sterowanie i maszynę stanów;
- działa bez instalowania aplikacji, bezpośrednio w przeglądarce obsługującej WebXR;
- od początku pozostawia miejsce na rozwinięcie portfolio w małą grę VR.

Pierwszy kamień milowy nie obejmuje jeszcze gry, fizyki przedmiotów, budowania pomostu ani przestrzennych tabliczek. Ma bezpiecznie uruchomić istniejący świat w goglach i umieścić widza przed kamiennym kręgiem.

---

## 2. Stan projektu, na którym opiera się plan

Aktualne portfolio ma dwa odrębne tryby wejścia:

1. `Classic 2D` uruchamiany przez `src/classic2d.js`;
2. `Experience 3D` uruchamiany warunkowym importem `src/experience3d.js`.

Oba tryby korzystają ze wspólnych rekordów `portfolioNodes`.

Experience 3D obecnie:

- sam tworzy renderer, scenę, kamerę, asset manager, loader, system atmosfery i pętlę animacji;
- używa `PerspectiveCamera`;
- czyta `public/data/experience3d-settings.json`;
- korzysta z vendored Three.js r184;
- ma osobne moduły małpy, glifów, atmosfery, Słońca, Księżyca, galaktyk i Drogi Mlecznej;
- renderuje galaktyczne tło i scenę główną w dwóch przebiegach;
- używa `requestAnimationFrame`;
- obsługuje mysz, dotyk, raycasting ekranowy, HTML/CSS overlay i przejścia kamiennych tabliczek;
- korzysta ze wspólnego `audioManager`, który jest własnością `src/main.js`.

Aktualny krąg ma promień `3.8` jednostki, a wizualny model glifu jest normalizowany do około `0.6` jednostki. To daje sensowny punkt wyjścia do testów naturalnej skali VR, ale skala musi zostać oceniona w prawdziwych goglach.

---

## 3. Decyzje kanoniczne

### 3.1. Trzy osobne tryby

Po wdrożeniu wejście ma oferować trzy tryby:

- `Classic 2D`;
- `Experience 3D`;
- `Experience VR` lub `Tryb VR`.

Tryb VR nie jest przełącznikiem dopisanym do działającego Experience 3D. Jest osobnym, warunkowo importowanym runtime’em.

### 3.2. Wspólny świat, osobne runtime’y

Experience 3D i Experience VR współdzielą:

- znormalizowane bazowe ustawienia świata;
- `portfolioNodes`;
- asset manifest;
- asset manager i reguły ładowania;
- moduły budujące scenę;
- modele, tekstury i animacje GLB;
- logikę progresji atmosfery, o ile dany tryb ją aktywuje;
- `audioManager` jako wspólnego właściciela audio.

Nie współdzielą:

- aktywnego renderera;
- kamery;
- player rigu;
- pętli animacji;
- event listenerów;
- stanu interakcji;
- sterowania;
- paneli UI;
- aktywnej sesji WebXR;
- zmiennych modyfikowanych podczas działania.

### 3.3. Bazowe ustawienia świata pozostają wspólne

`public/data/experience3d-settings.json` pozostaje kanonicznym źródłem kompozycji świata:

- atmosfery;
- kamieni;
- skorupek;
- małych glifów;
- pyłu;
- galaktyk;
- mgły;
- Słońca;
- Księżyca.

Tryb VR czyta ten sam plik i tworzy własną głęboką kopię ustawień runtime. Nie modyfikuje obiektu wykorzystywanego przez Experience 3D i nie zapisuje zmian do bazowego pliku.

### 3.4. Osobne ustawienia tylko dla VR

Powstaje osobny plik, na przykład:

`public/data/experience-vr-settings.json`

Może zawierać wyłącznie parametry specyficzne dla VR:

- pozycję startową gracza;
- wysokość oczu;
- kierunek patrzenia;
- typ reference space;
- skalę całego świata względem gracza;
- ustawienia komfortu;
- parametry promienia kontrolera;
- ustawienia intro VR;
- opcjonalny profil wydajności Quest;
- ustawienia testowe i debugowe VR.

Nie wolno duplikować w nim pełnej konfiguracji atmosfery, modeli i świateł.

Kolejność źródeł:

```text
experience3d-settings.json
        ↓ normalizacja i głęboka kopia
bazowa konfiguracja wspólnego świata
        ↓
experience-vr-settings.json
        ↓ tylko ustawienia VR
runtime Experience VR
```

### 3.5. Obecny Experience 3D jest chroniony

Wdrożenie VR nie może zmienić istniejącego kontraktu Experience 3D:

- intro działa jak obecnie;
- startowy dźwięk działa jak obecnie;
- ambient i jego progresja działają jak obecnie;
- hover glifów działa jak obecnie;
- kamera myszkowa działa jak obecnie;
- przejścia glif → tabliczka → panel działają jak obecnie;
- overlay HTML/CSS działa jak obecnie;
- obecna progresja atmosfery działa jak obecnie;
- debug i import/eksport ustawień działają jak obecnie;
- Classic 2D nie ładuje Three.js ani kodu VR.

Każdy etap, który dotyka wspólnej architektury, musi najpierw przejść odbiór regresji Experience 3D.

### 3.6. Jeden runtime na jedno uruchomienie strony

Po wybraniu trybu uruchamiany jest tylko jeden runtime.

Nie utrzymujemy równocześnie aktywnego Experience 3D i Experience VR. Dzięki temu nie powstają dwa renderery, dwie pętle, dwa zestawy event listenerów ani konflikt o audio.

### 3.7. WebXR jest sterownikiem widoku VR

Tryb VR używa:

- `renderer.xr.enabled = true`;
- sesji `immersive-vr`;
- domyślnego reference space `local-floor`;
- `renderer.setAnimationLoop(...)`;
- kamery śledzonej przez WebXR;
- osobnego `playerRig`, który ustawia gracza w świecie.

Nie wolno sterować kierunkiem patrzenia użytkownika przez nadpisywanie rotacji kamery śledzonej przez gogle.

### 3.8. HTML overlay nie jest interfejsem VR

Obecne panele HTML/CSS pozostają częścią Experience 3D i Classic 2D.

W trybie immersyjnym tekst projektu będzie później prezentowany jako obiekty przestrzenne:

- kamienne lub tematyczne tabliczki;
- płaskie panele 3D;
- tekstury z tekstem;
- geometria tekstowa;
- ewentualnie warstwy WebXR dopiero po osobnym teście.

Pierwszy etap VR nie próbuje przenosić aktualnego overlayu do gogli.

### 3.9. Komfort jest ważniejszy od efektu

Wymuszone przemieszczanie gracza może powodować dyskomfort. Animacja „wciągnięcia do środka kręgu” powstanie dopiero po uruchomieniu stabilnego VR.

Dopuszczone warianty:

- płynny ruch z bardzo łagodnym przyspieszeniem i wygaszeniem;
- ruch z winietą ograniczającą pole widzenia;
- krótki fade-to-black i teleport;
- możliwość pominięcia animacji;
- wariant reduced motion.

Na pierwszym etapie gracz stoi nieruchomo przed kręgiem.

### 3.10. Fizyka jest odroczona

Pierwsze uruchomienie VR nie dodaje biblioteki fizycznej.

Nie wybieramy jeszcze Rapier, Cannon-es ani własnego silnika kolizji. Najpierw potwierdzamy:

- poprawność skali;
- stabilność sesji WebXR;
- wydajność sceny;
- sposób sterowania;
- zachowanie assetów i animacji w renderingu stereoskopowym.

Architektura ma jednak przewidywać późniejsze dołączenie fizyki bez przebudowy całego runtime’u.

---

## 4. Docelowy podział odpowiedzialności

Rekomendowany układ modułów:

```text
src/
├── main.js
│   └── wybór języka i jednego z trzech trybów
│
├── classic2d.js
│   └── obecny lekki runtime 2D
│
├── experience3d.js
│   └── bootstrap i interakcje desktopowego Experience 3D
│
├── experienceVr.js
│   └── osobny bootstrap Experience VR
│
├── runtime/
│   ├── createExperienceWorld.js
│   │   └── budowa wspólnej sceny z przekazanej konfiguracji
│   ├── updateExperienceWorld.js
│   │   └── wspólna aktualizacja atmosfery i obiektów świata
│   └── warmupExperienceWorld.js
│       └── kontrolowany preload, hydration i shader warm-up
│
├── config/
│   ├── experience3dSettings.js
│   │   └── obecne wspólne ustawienia kompozycji świata
│   └── experienceVrSettings.js
│       └── normalizacja wyłącznie ustawień VR
│
├── xr/
│   ├── vrCapability.js
│   │   └── sprawdzenie secure context i immersive-vr
│   ├── createVrSessionControl.js
│   │   └── wejście/wyjście z sesji i lokalizowane komunikaty
│   ├── createPlayerRig.js
│   │   └── pozycja gracza, wysokość i przyszła lokomocja
│   ├── createVrControllers.js
│   │   └── kontrolery, promienie i ich lifecycle
│   ├── createVrInteraction.js
│   │   └── przyszłe wskazywanie, chwytanie i aktywacja glifów
│   └── createVrIntro.js
│       └── przyszłe intro wykonane wewnątrz sceny 3D
│
└── audio/
    └── audioManager.js
        └── nadal jeden wspólny właściciel audio
```

Nazwy są rekomendacją architektoniczną. Codex może skorygować je po punktowym sprawdzeniu zależności, ale nie może zmienić podziału: wspólny świat + dwa osobne runtime’y.

---

## 5. Wspólny world factory

Najważniejszym przygotowaniem technicznym jest wydzielenie z `src/experience3d.js` budowy świata niezależnej od sposobu sterowania.

Przykładowy kontrakt:

```text
createExperienceWorld({
  THREE,
  camera,
  settings,
  portfolioNodes,
  assetManager,
  audioBridge,
  diagnostics,
  mode
})
```

Fabryka zwraca kontrolowany obiekt:

```text
{
  scene,
  galaxyBackgroundScene,
  nodes,
  orbitGroup,
  orbit,
  atmosphere,
  sunCycle,
  moonCycle,
  galaxyLayer,
  milkyWayBackground,
  plaqueTransition,
  atmosphereProgression,
  update(delta, elapsed),
  render(renderer, camera),
  dispose()
}
```

Zasady:

- fabryka nie dodaje listenerów do `window`, `document` ani kontrolerów;
- fabryka nie rozpoczyna własnej pętli;
- fabryka nie wybiera trybu interakcji;
- fabryka nie otwiera HTML overlay;
- fabryka nie tworzy aktywnej sesji WebXR;
- fabryka otrzymuje kamerę od runtime’u;
- wszystkie zasoby tworzone przez fabrykę muszą mieć drogę zwolnienia przez `dispose()`.

---

## 6. Player rig i skala świata

W VR kamera nie powinna być bezpośrednio przemieszczana jak kamera desktopowa.

Tworzymy:

```text
playerRig
└── camera
```

WebXR steruje lokalną pozycją i rotacją kamery wynikającą z ruchu głowy. Projekt steruje pozycją `playerRig` w świecie.

Początkowe założenia testowe:

- reference space: `local-floor`;
- wysokość oczu wynika z trackingu gogli;
- awaryjna wysokość podglądu bez gogli: około `1.65 m`;
- gracz zaczyna na zewnątrz kręgu;
- rekomendowany pierwszy punkt testowy: oś `+Z`, około `5.5–6.5` jednostki od centrum;
- gracz patrzy w kierunku małpy;
- podłoga świata odpowiada `Y = 0`;
- pierwszy glif znajduje się przed graczem i jest jedynym przyszłym aktywnym glifem.

Krąg ma obecnie promień około `3.8` jednostki. Na początku przyjmujemy hipotezę `1 jednostka ≈ 1 metr`, ale nie ustanawiamy jej jako ostatecznej prawdy przed testem w Quest 3S.

`experience-vr-settings.json` musi umożliwiać zmianę:

```json
{
  "schemaVersion": 1,
  "referenceSpaceType": "local-floor",
  "worldScale": 1,
  "spawn": {
    "x": 0,
    "y": 0,
    "z": 6,
    "lookAtX": 0,
    "lookAtY": 1,
    "lookAtZ": 0
  }
}
```

To tylko kształt poglądowy, nie gotowy schemat.

---

## 7. Audio

`audioManager` pozostaje jednym wspólnym singletonem montowanym przez `src/main.js`.

### Experience 3D

Nie zmieniamy jego obecnych wywołań ani kolejności:

- unlock po wyborze trybu;
- przygotowanie audio;
- preload efektów;
- start sound;
- ambient;
- progresja ambientu;
- efekty hover/open/close.

### Experience VR

Tryb VR może korzystać z tego samego managera, ponieważ w jednej sesji strony działa tylko jeden runtime.

Reguły:

- wybór VR jest gestem pozwalającym odblokować Web Audio;
- rozpoczęcie muzyki nie może blokować wejścia do WebXR;
- błędy audio nie blokują sceny;
- na pierwszym etapie VR może użyć obecnej sekwencji start + ambient;
- sterowanie głośnością pozostaje na ekranie przed wejściem do sesji;
- przestrzenny dźwięk i osobne źródła pozycyjne są późniejszym etapem;
- nie zmieniamy nazw i semantyki obecnych metod Experience 3D tylko po to, by dodać VR.

Jeśli potrzebny będzie adapter, powstaje osobny `vrAudioBridge`, bez przepisywania istniejącej sekwencji desktopowej.

---

## 8. Wejście do VR

### 8.1. Wykrywanie możliwości

`src/main.js` nie rozpoznaje gogli przez `userAgent`.

Używa sprawdzenia:

```text
window.isSecureContext
navigator.xr
navigator.xr.isSessionSupported('immersive-vr')
```

### 8.2. Zachowanie przycisku

Rekomendowane UX:

- urządzenie obsługuje VR → aktywny wybór `Experience VR`;
- urządzenie nie obsługuje VR → widoczna, nieaktywna opcja z krótką informacją;
- brak HTTPS → informacja, że WebXR wymaga bezpiecznego kontekstu;
- błąd sprawdzania → tryby 2D i 3D pozostają w pełni dostępne.

Opcja VR nie może opóźniać renderowania ekranu wyboru.

### 8.3. Dwuetapowe uruchomienie

Nie należy próbować rozpoczynać sesji WebXR po długim `await import(...)`, ponieważ żądanie sesji powinno wynikać z bezpośredniej akcji użytkownika.

Bezpieczny przepływ:

```text
Wybór Experience VR
        ↓
uruchomienie osobnego ekranu przygotowania
        ↓
ładowanie i budowa świata
        ↓
aktywny przycisk „Wejdź do VR”
        ↓ bezpośredni gest użytkownika
navigator.xr.requestSession('immersive-vr', ...)
        ↓
renderer.xr.setSession(session)
        ↓
intro VR / odsłonięcie świata
```

### 8.4. Sesja

Pierwsze opcje sesji:

```text
requiredFeatures: []
optionalFeatures:
- local-floor
- bounded-floor
- layers
```

Runtime powinien działać także wtedy, gdy dostępne jest tylko podstawowe `local`.

Na końcu sesji:

- `renderer.setAnimationLoop(null)`;
- kontrolery są odpinane;
- stan VR jest zerowany;
- strona wraca do ekranu „Wejdź ponownie do VR”;
- Experience 3D nie jest automatycznie uruchamiane;
- audio zachowuje kontrolowaną politykę pauzy lub zakończenia ustaloną dla VR.

---

## 9. Renderowanie

Experience VR musi używać:

```text
renderer.xr.enabled = true
renderer.setAnimationLoop(callback)
```

Obecny Experience 3D może pozostać przy `requestAnimationFrame` w pierwszym wdrożeniu, aby nie rozszerzać zakresu regresji.

Wspólne `renderScenePasses(...)` wykonuje obecnie:

1. render galaktycznego tła;
2. `clearDepth`;
3. render sceny głównej.

Ten dwupassowy układ trzeba jawnie sprawdzić w sesji stereoskopowej. Nie zakładamy bez testu, że zachowa się identycznie w Quest Browser.

Jeśli test wykaże problem:

- nie zmieniamy renderowania desktopowego;
- tworzymy wariant `renderVrScenePasses`;
- albo przenosimy tło do jednej sceny tylko dla VR;
- zachowujemy te same ustawienia i wygląd, ale nie wymuszamy identycznej techniki renderowania.

---

## 10. Wydajność i profil Quest

Pierwszy cel jakościowy:

- stabilna częstotliwość odświeżania bez widocznego szarpania;
- brak długich zatrzymań po wejściu do sesji;
- brak kompilacji shaderów przy pierwszym obrocie głowy;
- brak nagłego doczytywania glifów i małpy;
- kontrolowany koszt dwóch oczu.

Nie optymalizujemy przed pomiarem.

Po uruchomieniu MVP mierzymy osobno:

- liczbę draw calls;
- liczbę trójkątów;
- liczbę aktywnych materiałów i programów;
- koszt pyłu;
- koszt transparentnych reliktów;
- koszt galaktyk i Drogi Mlecznej;
- koszt świateł punktowych i spotów;
- koszt animowanych kamieni;
- wpływ `antialias`;
- framebuffer scale factor;
- foveation, jeśli urządzenie i Three.js ją udostępnią;
- zachowanie przy 72 Hz jako minimalnym projekcie komfortu.

Dopiero wtedy można dodać opcjonalny profil VR:

```text
vr.performance.countMultiplier
vr.performance.dustMultiplier
vr.performance.framebufferScaleFactor
vr.performance.foveation
```

Wartości domyślne nie mogą zmieniać świata: wszystkie mnożniki startują od `1`.

---

## 11. Kolejność wdrożenia

## ETAP 0 — dokumentacja i kontrakty

### Cel

Ustanowić plan, nazwy trybów, granice wspólnego świata i zasady ochrony Experience 3D.

### Wynik

- ten dokument trafia do `docs/current/concept/VR_IMPLEMENTATION_PLAN.md`;
- po wdrożeniu podstawowego runtime’u powstaje osobny `docs/current/technical/VR_RUNTIME_MODEL.md`, opisujący stan faktyczny zamiast planu;
- `PROJECT_INDEX.md` otrzymuje trasę zadań VR;
- `DEPENDENCY_MAP.md` zostaje rozszerzona dopiero po faktycznym dodaniu modułów;
- `DECISION_LOG.md` otrzymuje decyzję o osobnym runtime VR.

### Bez kodu runtime

Na tym etapie nie dodajemy jeszcze WebXR.

---

## ETAP 1 — bezpieczne wydzielenie wspólnego świata

### Cel

Wydzielić z `src/experience3d.js` budowę i aktualizację świata bez zmiany zachowania desktopowego.

### Zakres

- wspólna fabryka świata;
- wspólny update świata;
- wspólny warm-up;
- jawny `dispose`;
- Experience 3D zaczyna używać fabryki;
- obecne sterowanie, overlay, audio i pętla pozostają własnością `experience3d.js`.

### Bramka akceptacji

Experience 3D musi wyglądać i działać tak samo jak przed refaktorem.

Nie rozpoczynamy ETAPU 2, dopóki:

- loader przechodzi poprawnie;
- intro działa;
- start sound i ambient działają;
- glify orbitują;
- hover działa;
- każdy glif otwiera właściwą tabliczkę i panel;
- zamknięcie wraca płynnie;
- progresja atmosfery działa;
- build przechodzi;
- Classic 2D pozostaje lekkie i niezależne.

---

## ETAP 2 — minimalny bootstrap WebXR

### Cel

Uruchomić wspólny świat w Meta Quest Browser jako osobny tryb.

### Zakres

- capability probe;
- trzecia opcja w ekranie trybu;
- osobny `experienceVr.js`;
- osobny renderer;
- `renderer.xr.enabled`;
- `renderer.setAnimationLoop`;
- osobna kamera i `playerRig`;
- osobny ekran przygotowania;
- przycisk „Wejdź do VR”;
- obsługa `sessionstart` i `sessionend`;
- wspólne ustawienia świata;
- podstawowy VR settings;
- widz stojący przed kręgiem;
- ruch głowy;
- obecne animacje świata;
- brak interakcji z glifami;
- brak fizyki.

### Definicja ukończenia

W Meta Quest 3S użytkownik:

1. otwiera portfolio przez HTTPS;
2. wybiera język;
3. wybiera Experience VR;
4. widzi kontrolowany loader;
5. naciska „Wejdź do VR”;
6. trafia przed kamienny krąg;
7. może naturalnie rozglądać się ruchem głowy;
8. widzi małpę, glify i bazowe elementy świata;
9. słyszy ustaloną sekwencję audio;
10. może zakończyć sesję bez błędu;
11. po zakończeniu może wejść ponownie;
12. Experience 3D nadal działa dokładnie jak wcześniej.

To jest pierwszy właściwy kamień milowy.

---

## ETAP 3 — stabilizacja skali, obrazu i komfortu

### Cel

Ustalić rzeczywistą skalę świata i profil wydajności Quest 3S.

### Zakres

- test pozycji startowej;
- test wysokości glifów;
- test rozmiaru małpy;
- test odległości czytelnych obiektów;
- korekta `worldScale`;
- test dwóch przebiegów renderowania;
- optymalizacja tylko potwierdzonych wąskich gardeł;
- bezpieczny fade wejścia i wyjścia;
- debug VR dostępny poza immersyjnym widokiem lub przez prosty HUD testowy.

### Bramka akceptacji

- scena nie wywołuje wrażenia miniatury ani gigantycznego świata;
- glif przed graczem znajduje się w naturalnym zasięgu wzroku;
- nie ma widocznego drżenia i błędów stereoskopii;
- obrót głowy pozostaje płynny;
- ponowne wejście do sesji nie duplikuje świata ani listenerów.

---

## ETAP 4 — fundament interakcji VR

### Cel

Pozwolić wskazać i aktywować wyłącznie pierwszy glif.

### Zakres

- kontrolery przez `renderer.xr.getController`;
- proste promienie target-ray;
- obsługa triggera;
- raycast VR;
- stan `hover/select`;
- aktywny tylko glif znajdujący się przed graczem;
- pozostałe glify nieaktywne;
- sygnał wizualny i dźwiękowy;
- przygotowanie interfejsu pod przyszłe dłonie, ale bez wdrażania hand trackingu jako wymogu.

### Bez fizyki

Aktywacja glifu jest zdarzeniem logicznym. Nie chwytamy jeszcze tabliczek.

---

## ETAP 5 — intro VR i wejście do centrum

### Cel

Zrealizować początek doświadczenia zgodny z wizją.

### Sekwencja

```text
wejście do sesji
→ czarne środowisko / wejściówka przestrzenna
→ odsłonięcie widza przed kręgiem
→ dostępny tylko pierwszy glif
→ dotknięcie lub aktywacja glifu
→ bezpieczne przejście do środka
→ zatrzymanie przed małpą
```

### Reguły

- intro VR jest obiektem Three.js, nie DOM overlayem;
- może korzystać z tego samego tekstu co Experience 3D, ale ma osobny renderer i timing;
- ruch do środka musi mieć wariant komfortowy;
- gracz nie może zostać przesunięty poza dostępną przestrzeń bez czytelnego przejścia;
- pozycja docelowa należy do `playerRig`, nie do kamery śledzonej przez gogle.

---

## 12. Koncepcja przyszłej gry VR

Poniższy kierunek jest zapisem wizji produktu, nie zakresem pierwszego wdrożenia.

### Faza A — pierwszy glif i pomost

- Gracz stoi przed kręgiem.
- Aktywny jest tylko glif przed nim.
- Aktywacja przenosi gracza do centrum przed małpę.
- Pojawiają się tematyczne tabliczki do czytania.
- Tabliczki można odrzucać.
- W stanie nieważkości poruszają się w granicach sfery kręgu.
- Odbijają się od granicy sfery.
- Część tabliczek trzeba ułożyć w pomost.
- Pojawiają się skorupki.
- Gracz zbiera po jednej skorupce każdego rodzaju.
- Skorupki zostają umieszczone w pomoście.
- Ukończenie konstrukcji odblokowuje drugi glif.

### Faza B — drugi glif i antena

- Pojawiają się nowe tabliczki oraz małe glify.
- Trzy tabliczki trzeba dopasować do trzech glifów.
- Poprawne dopasowanie tworzy specjalną antenę.
- Antena pozwala odczytać następny glif.

### Faza C — gwiazdy i radioskop

- Pojawiają się gwiazdy.
- Kolejne tabliczki tworzą radioskop do wcześniejszej anteny.
- Złożony zestaw pozwala przeszukiwać niebo.
- Gracz odnajduje możliwe miejsca przestawienia całego pomostu.
- Poprawna lokalizacja pozwala namierzyć dwa pozostałe glify.
- Powstaje tunel lub most prowadzący do kolejnego etapu.

### Faza D — ruchome kamienie i przebudzenie małpy

- Pojawiają się tabliczki oraz ruchome kamienie.
- Kamienie trzeba dopasować do tabliczek.
- Ukończenie układu aktywuje małpę.
- Małpa przywołuje Drogę Mleczną i galaktyki.
- Kamienie trzeba przechwytywać i prowadzić tak, aby nie uderzyły w glify rotujące wokół małpy.

### Faza E — uszkodzenia i naprawa

- Zderzenie ruchomego kamienia z glifem uszkadza konstrukcję.
- Gracz naprawia ją materiałami obecnymi w świecie.
- Materiałami mogą być inne tabliczki, skorupki i rotujące elementy.
- Powstaje pętla napięcia: budowa, ochrona, uszkodzenie, naprawa.

---

## 13. Przyszła maszyna stanów gry

Po uruchomieniu podstawowego VR gra powinna dostać osobną maszynę stanów, przykładowo:

```text
boot
→ vrReady
→ intro
→ outsideCircle
→ firstGlyphAvailable
→ enteringCircle
→ readingPlaques
→ bridgeCollection
→ bridgeAssembly
→ secondGlyphAvailable
→ antennaAssembly
→ radioscopeAssembly
→ skySearch
→ bridgeRelocation
→ movingStones
→ monkeyAwakening
→ galaxyReveal
→ damageAndRepair
→ completed
```

Maszyna gry nie może być częścią wspólnego world factory. Jest właścicielem Experience VR.

---

## 14. Przyszłe systemy gry

Po ukończeniu podstaw WebXR można dodawać osobnymi etapami:

- `vrGameState`;
- `grabbableRegistry`;
- `physicsWorld`;
- `boundedOrbitalVolume`;
- `plaqueSpawner`;
- `plaqueReader`;
- `bridgeSocketSystem`;
- `shellCollectionSystem`;
- `glyphMatchingSystem`;
- `antennaAssemblySystem`;
- `radioscopeSystem`;
- `skyTargetSystem`;
- `movingStoneHazardSystem`;
- `constructionDamageSystem`;
- `repairMaterialSystem`;
- `spatialAudioSystem`;
- zapis postępu sesji.

Żaden z tych systemów nie powinien zostać dopisany bezpośrednio do `experienceVr.js`. Bootstrap ma pozostać routerem i koordynatorem.

---

## 15. Testy i bramki jakości

### 15.1. Testy automatyczne / chmurowe

Po każdym etapie:

- kontrola składni;
- istniejący lint, jeśli jest dostępny;
- istniejące testy;
- `npm run build`;
- `git diff --check`;
- test importów dynamicznych;
- test normalizacji ustawień;
- test, że Classic 2D nie importuje modułów Three.js/WebXR;
- test fallbacku bez `navigator.xr`;
- test błędu `isSessionSupported`.

### 15.2. Ręczny test desktopowy

- 2D uruchamia się jak wcześniej;
- 3D uruchamia się jak wcześniej;
- audio 3D działa jak wcześniej;
- VR jest poprawnie oznaczone jako niedostępne lub dostępne przez emulator;
- brak błędów konsoli po powrocie i reloadzie;
- brak podwójnych listenerów.

### 15.3. Ręczny test Meta Quest 3S

- strona otwiera się w Meta Quest Browser;
- przycisk VR jest aktywny;
- sesja startuje po bezpośrednim kliknięciu;
- scena pojawia się dla obu oczu;
- głowa steruje widokiem;
- horyzont i skala są poprawne;
- wejście i wyjście nie powoduje czarnego ekranu;
- tło galaktyczne działa stereoskopowo;
- modele GLB i ich animacje działają;
- audio działa albo bezpiecznie zgłasza brak;
- wyjście z VR nie zawiesza strony;
- ponowne wejście nie duplikuje obiektów;
- ruch pozostaje płynny.

### 15.4. Obowiązkowy test regresji Experience 3D

Każdy etap wspólnej architektury musi zostać zatwierdzony na zwykłym desktopie przed kolejnym krokiem VR.

---

## 16. Zakazy wdrożeniowe

Na pierwszych etapach nie wolno:

- dopisywać `renderer.xr.enabled` bezpośrednio do obecnego Experience 3D;
- zamieniać Experience 3D w jeden hybrydowy runtime desktop/VR;
- uruchamiać dwóch rendererów równocześnie;
- kopiować całego `experience3d.js` do `experienceVr.js`;
- tworzyć osobnej kopii wszystkich ustawień świata dla VR;
- przenosić HTML overlay do immersyjnej sesji jako gotowe rozwiązanie;
- sterować rotacją kamery VR myszką;
- nadpisywać rotacji głowy;
- dodawać fizyki przy okazji pierwszego uruchomienia;
- optymalizować sceny „na ślepo” przed testem;
- usuwać assetów potrzebnych Experience 3D;
- zmieniać obecnego audio tylko po to, by uruchomić VR;
- aktualizować wszystkich dokumentów jednym szerokim refaktorem;
- łączyć wydzielenia architektury, WebXR, kontrolerów, fizyki i gry w jeden prompt dla Codexa.

---

## 17. Sekwencja zadań dla Codexa

Każdy punkt powinien być osobnym zadaniem i osobnym raportem.

### Zadanie 1

Audyt punktowy i plan ekstrakcji wspólnego world factory. Bez zmian albo z minimalnym, jawnie ograniczonym patchem diagnostycznym.

### Zadanie 2

Wydzielenie wspólnego world factory i migracja Experience 3D bez zmiany zachowania.

### Zadanie 3

Regresja, poprawki wynikające wyłącznie z migracji i synchronizacja dokumentacji.

### Zadanie 4

Capability probe oraz trzeci tryb wejścia, bez uruchamiania pełnej sceny VR.

### Zadanie 5

Minimalny `experienceVr.js`, sesja WebXR, player rig i wspólny świat bez interakcji.

### Zadanie 6

Testy Quest 3S, skala i dwupassowy rendering.

### Zadanie 7

Profil wydajności i poprawki potwierdzonych problemów.

### Zadanie 8

Kontrolery i aktywacja pierwszego glifu.

### Zadanie 9

Intro VR oraz komfortowe przejście do środka kręgu.

Dopiero po tym rozpoczyna się planowanie fizyki i właściwej gry.

---

## 18. Kryterium gotowości do rozpoczęcia gry

Podstawowy tryb VR uznajemy za gotowy, gdy:

- istnieje jako trzeci, osobny tryb;
- czyta wspólną konfigurację świata;
- ma osobną konfigurację VR;
- uruchamia się niezawodnie w Meta Quest Browser;
- poprawnie wchodzi i wychodzi z sesji;
- ma stabilny player rig;
- ma zaakceptowaną skalę;
- osiąga komfortową płynność;
- ma działający pierwszy kontroler i wybór glifu;
- obecny Experience 3D przeszedł pełną regresję;
- architektura ma jawny `dispose`;
- dokumentacja opisuje aktualny kontrakt.

Wtedy można rozpocząć osobny dokument:

`VR_GAMEPLAY_AND_PHYSICS_PLAN.md`

---

## 19. Pierwszy prompt wdrożeniowy

Pierwszym zadaniem nie powinno być „dodaj VR”.

Pierwszy prompt dla Codexa powinien dotyczyć wyłącznie:

**punktowego audytu i zaprojektowania minimalnej ekstrakcji wspólnego world factory z `src/experience3d.js`, bez zmiany zachowania obecnego Experience 3D i bez dodawania WebXR.**

Dopiero zaakceptowany raport i bezpieczna ekstrakcja otwierają drogę do osobnego runtime’u VR.

---

## 20. Źródła projektu użyte do przygotowania planu

- `PROJECT_ENTRY.md`
- `docs/current/maps/PROJECT_INDEX.md`
- `docs/current/maps/DEPENDENCY_MAP.md`
- `docs/current/maps/DOCUMENTATION_MAP.md`
- `docs/current/technical/FRONTEND_RUNTIME_MODEL.md`
- `docs/current/technical/THREE_SCENE_MODEL.md`
- `docs/current/technical/ENTRY_FLOW_AND_MODES_MODEL.md`
- `docs/current/technical/AUDIO_RUNTIME_MODEL.md`
- `src/main.js`
- `src/experience3d.js`
- `src/config/experience3dSettings.js`
- `src/scene/orbitNodes.js`
- `src/scene/renderScenePasses.js`
- oficjalna dokumentacja Three.js: `VRButton`, `WebXRManager`, `WebGLRenderer.setAnimationLoop`
- standard WebXR Device API

---

## 21. Reguła aktualizacji dokumentu

Dokument opisuje plan, a nie historię prac.

Po ukończeniu każdego etapu:

- zakończony etap zmienia status na wdrożony;
- ścieżki modułów są aktualizowane do stanu faktycznego;
- decyzje porzucone są usuwane albo przenoszone do `legacy`;
- nowe etapy są dodawane tylko wtedy, gdy wynik poprzednich testów tego wymaga;
- dokument nie może udawać aktualnego runtime’u, jeśli kod jeszcze go nie realizuje.
