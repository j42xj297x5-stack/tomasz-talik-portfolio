# Snapshot — Portfolio / AI Guide panel + progression + sun/moon

## 1. Executive summary

Ten snapshot dokumentuje bieżący checkpoint interaktywnego portfolio AI przed dalszym strojeniem paneli i sceny. Zakres obejmuje aktualny kierunek panelu **AI Guide**, stan progresji ujawniania warstw świata, obiekty słońca i księżyca oraz zasady ochronne dla dalszych prac.

Dokument nie jest finalną specyfikacją. Oddziela elementy już obecne w repo/runtime od kierunków, decyzji roboczych i obszarów wymagających dopracowania. Snapshot jest wyłącznie dokumentacyjny i nie opisuje nowych funkcji do wdrożenia w tym kroku.

## 2. Current runtime state

### Działa / jest obecne w repo

- Centralna małpa pozostaje głównym symbolem sceny i punktem odniesienia dla kompozycji świata.
- Pięć kamieni/bram/glyph nodes orbituje wokół centrum i reprezentuje obszary portfolio.
- Hover na kamieniu pokazuje etykietę użytkownikowi; dla pierwszego kamienia AI Guide aktualna etykieta robocza to **„Oswajanie AI”**.
- Kliknięcie kamienia otwiera panel overlay oparty o normalny HTML/CSS, a nie tekst renderowany w 3D.
- Three.js odpowiada za świat, kamerę, światła, orbitujące obiekty, assety GLB i efekty przestrzenne.
- HTML/CSS odpowiada za czytelny tekst, panele, przycisk zamykania i podstawy dostępności overlay.
- Charakter sceny powinien pozostać spokojny, atmosferyczny oraz organiczno-cyfrowy.

### Kierunek / do utrzymania

- Panele mają pozostać warstwą HTML/CSS ze względu na czytelność tekstu, łatwiejsze strojenie layoutu i dostępność.
- Strojenie panelu nie powinno wymuszać przebudowy mechaniki sceny, raycastingu, orbitowania ani logiki GLB.
- Prace nad jednym panelem powinny być inkrementalne: najpierw dopracowanie AI Guide, później przenoszenie kierunku na pozostałe kamienie.

## 3. AI Guide panel state

### Działa / jest obecne w repo

- Pierwszy kamień / brama **AI Guide** ma polskie teksty robocze opisujące oswajanie AI, odzyskiwanie sprawczości i porządkowanie procesu.
- Hover label dla AI Guide brzmi **„Oswajanie AI”**.
- Panel AI Guide korzysta z istniejącego transparentnego PNG jako organicznej zielonej ramki: `public/png/ai_guide.png`.
- PNG jest tylko assetem podpinanym w kodzie. Nie należy go kopiować, przenosić ani dodawać ponownie.
- Przycisk zamknięcia panelu jest natywnie polski: **„Zamknij”**.
- Kierunek wizualny panelu zakłada jaśniejszy tekst na ciemnozielonym tle.
- Nagłówek **AI Guide** idzie w stronę eleganckiej czcionki szeryfowej.
- Overlay posiada wydzielony obszar przewijanej treści oraz osobny obszar akcji z przyciskiem zamknięcia.

### Kierunek / do dopracowania

- Aktualne prace nad panelem dotyczą przede wszystkim marginesów, zawężenia safe area tekstu i dopasowania scrollowanego obszaru treści wewnątrz ramki.
- Finalne położenie przycisku **„Zamknij”** pozostaje elementem strojenia layoutu.
- Nie należy teraz poprawiać layoutu panelu w ramach tego snapshotu; dokument jedynie zapisuje aktualny kierunek.

### Równoległy postęp: Creative AI

- W równoległym wątku przygotowana jest już także strona / panel dla **Creative AI**: istnieje podstawowy tekst oraz gotowe tło `public/png/creative_ai.png`.
- Ten snapshot nie wdraża ani nie rozszerza prac Creative AI. Odnotowuje jedynie równoległy postęp jako kolejny obszar do późniejszego opisania, sprawdzenia i ewentualnej integracji z tym samym standardem dokumentacyjnym.

## 4. Scene progression state

### Działa / jest obecne w repo

- Istnieje mechanizm progresji / stopniowego ujawniania warstw sceny.
- Widoczność warstw może zależeć od interakcji użytkownika z kamieniami i od zamykania paneli.
- Model progresji ma zapobiegać odsłonięciu całej sceny naraz.
- Warstwy świata mogą pojawiać się etapami po odkrywaniu kolejnych kamieni.
- Po wyłączeniu progresji targety warstw są traktowane jako w pełni widoczne, co wspiera tryb regulacji i testowania.
- Debug/options panel zawiera obszar do kontroli progresji, w tym przełączanie progresji, automatyczny progres po zamknięciu unikalnej bramy, ręczny poziom progresu, reset/odblokowanie pełnego stanu oraz czasy wejścia warstw.

### Decyzja projektowa / kierunek

- Istotna decyzja projektowa: wejście widoczności kolejnej warstwy może być uruchamiane po zamknięciu okna/panelu, a nie natychmiast po kliknięciu kamienia. Dzięki temu użytkownik może spokojnie przeczytać tekst bez równoległego rozpraszającego wejścia kolejnych elementów sceny.
- Progresja ma być czytelna i testowalna, ale nie może przeszkadzać w czytaniu paneli.

## 5. Sun and moon orbit state

### Działa / jest obecne w repo

- W scenie istnieją obiekty **słońca** i **księżyca** ładowane z assetów GLB.
- Słońce i księżyc orbitują wokół centrum sceny / centralnej małpy i są częścią rytmu świata.
- Oba obiekty posiadają ustawienia orbity, skali, kierunku, self-rotation oraz front-facing / lock-facing względem kamery.
- Słońce i księżyc są powiązane ze światłami, które mają wspierać oświetlenie centralnej figury.
- W debug/options panelu istnieją kontrolki strojenia cyklu słońca i księżyca, w tym ustawienia orbity, skali, front-facing oraz świateł.

### Kierunek / do dopracowania

- Słońce i księżyc powinny pozostawać frontem do widza / kamery zamiast rotować przypadkowo w sposób rozbijający czytelność formy.
- Światła powiązane ze słońcem i księżycem są nadal elementem dalszego strojenia sceny.
- Aktualny kierunek: światło ma wzmacniać centralną figurę i atmosferę, ale nie dominować nad sceną.

## 6. Design decisions captured

- Nie przebudowywać mechaniki sceny przy pracach nad panelem AI Guide.
- Nie mieszać assetów PNG z komendami kopiowania/przenoszenia.
- `public/png/ai_guide.png` traktować jako istniejący asset i wyłącznie go podpinać.
- Utrzymać panele jako normalny HTML/CSS, nie jako tekst renderowany w 3D.
- Nie dodawać ciężkich ramek ani osobnego systemu ramek; obecny kierunek korzysta z organicznego PNG dla konkretnego panelu.
- Najpierw dopracować jeden panel AI Guide, dopiero później rozszerzać kierunek na pozostałe kamienie.
- Progresja ujawniania warstw ma być czytelna i testowalna, ale nie może przeszkadzać w czytaniu paneli.
- Słońce i księżyc mają budować rytm świata i wspierać centralną małpę, nie przejmować głównej roli kompozycyjnej.
- Creative AI jest odnotowany jako równoległy obszar z podstawowym tekstem i gotowym tłem, ale bez wdrażania w ramach tego checkpointu.

## 7. Open issues / next tuning

- Marginesy safe area panelu AI Guide.
- Scrollowany content wewnątrz ramki AI Guide.
- Finalne położenie przycisku **„Zamknij”**.
- Strojenie progresji po zamknięciu paneli.
- Strojenie świateł słońca/księżyca.
- Późniejsze tła dla pozostałych kamieni.
- Osobne sprawdzenie i opisanie kierunku **Creative AI** wraz z gotowym tłem, bez mieszania tego z bieżącym snapshotem AI Guide.

## 8. Files / areas likely involved

### Realnie istniejące pliki / assety

- `src/content/portfolioNodes.js` — treści i metadane kamieni/bram, w tym AI Guide i Creative AI.
- `src/ui/overlay.js` — HTML overlay panel, struktura treści, przewijany obszar i przycisk zamykania.
- `src/styles/main.css` — style overlay/paneli, tła PNG, typografia, scroll i przycisk.
- `src/ui/hoverLabel.js` — hover label dla orbitujących kamieni.
- `src/scene/orbitNodes.js` — orbitujące kamienie/glyph nodes oraz powiązanie z interakcją.
- `src/scene/atmosphere/atmosphereProgression.js` — logika progresji warstw sceny.
- `src/ui/optionsPanel.js` — debug/options panel do strojenia progresji, atmosfery, słońca i księżyca.
- `src/scene/sunCycle.js` — obiekt i cykl słońca.
- `src/scene/moonCycle.js` — obiekt i cykl księżyca.
- `public/png/ai_guide.png` — istniejąca transparentna ramka PNG panelu AI Guide; nie kopiować ani nie przenosić.
- `public/png/creative_ai.png` — istniejące tło Creative AI odnotowane jako równoległy postęp, bez wdrażania w tym snapshotcie.
- `public/glb/sun.glb` — asset słońca.
- `public/glb/moon.glb` — asset księżyca.

### Obszary opisowe, których nie należy agresywnie zgadywać

- overlay/panel CSS,
- content nodes,
- scene progression module,
- sun/moon scene objects,
- debug/options controls for tuning.
