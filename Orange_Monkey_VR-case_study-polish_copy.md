# Orange Monkey VR — Case Study

## Od interaktywnego portfolio do pełnoprawnej gry VR

### Punkt wyjścia

Orange Monkey VR rozpoczęło się od pomysłu przeniesienia mojego interaktywnego portfolio do wirtualnej rzeczywistości.

Wersje Classic 2D i Experience 3D pozwalały poznawać pięć obszarów mojej pracy poprzez symbole, animacje i interaktywne panele. VR otwierało jednak inną możliwość: zamiast oglądać projekty z zewnątrz, odbiorca mógł znaleźć się wewnątrz ich świata i poznawać go poprzez własne działania.

Pierwotna koncepcja stopniowo przekształciła się w samodzielną grę z narracją, systemem progresji, przestrzennymi zagadkami i własnymi mechanikami.

Największym wyzwaniem nie było samo wyświetlenie sceny w goglach. Było nim zbudowanie świata, który reaguje na decyzje gracza, pamięta ich konsekwencje i pozwala rozwijać rozgrywkę bez utraty spójności między narracją, stanem obiektów i dostępnymi interakcjami.

---

## 01. Scenariusz, reżyseria i architektura rozgrywki

Podstawą gry stał się własny system progresji, oddzielający narrację od faktycznego stanu świata.

Zamiast umieszczać całą logikę w jednym, rozbudowanym kontrolerze, opracowaliśmy architekturę opartą na kilku współpracujących warstwach:

**Scenario** definiuje przebieg doświadczenia: punkty narracyjne, zdarzenia, warunki przejść oraz efekty, które powinny pojawić się w kolejnych momentach gry.

**Experience Director** odpowiada za aktualną pozycję w scenariuszu i rozstrzyga, kiedy możliwe jest przejście do następnego punktu.

**RuntimeExperience** interpretuje efekty scenariusza i przekazuje je odpowiednim systemom wykonawczym.

**Aktorzy i kontrolery domenowe** zarządzają rzeczywistym stanem obiektów, narzędzi oraz mechanik gameplayowych.

Takie rozdzielenie pozwoliło rozwijać poszczególne elementy bez uzależniania ich od jednego centralnego mechanizmu.

W trakcie produkcji architektura przechodziła kolejne migracje. Uporządkowaliśmy semantykę przejść, rozdzieliliśmy zdarzenia jednorazowe od trwałych konsekwencji i opracowaliśmy mechanizmy odtwarzania ustalonego stanu scenariusza.

Szczególną rolę odgrywa małpa — przewodnik gracza. Jej komunikaty, podpowiedzi i obowiązkowe momenty narracyjne są związane z konkretnymi zdarzeniami. Dzięki temu historia może prowadzić gracza, nie przejmując bezpośredniej kontroli nad wszystkimi mechanikami świata.

---

## 02. Sandbox — swoboda działania bez utraty narracji

Jednym z istotnych problemów projektowych było pogodzenie liniowego scenariusza z możliwością swobodnego wykonywania działań.

Gracz może odkrywać obiekty, przetwarzać materię, stroić narzędzia i instalować kamienie runiczne. Nie wszystkie te czynności muszą następować dokładnie w momencie przewidzianym przez narrację.

Dlatego oddzieliliśmy uprawnienia wynikające z rzeczywistego stanu świata od wiedzy i postępu opisywanych przez Scenario.

Przykładowo: możliwość przyciągnięcia obiektu może wynikać ze zdobytego narzędzia, poznanej rodziny znaków i aktualnego stanu namierzania. Nie musi zależeć od tego, czy gracz znajduje się w konkretnym punkcie fabuły.

Opracowaliśmy również mechanizm **Scenario Progress Reconciliation**, który w obsługiwanym zakresie pozwala narracji nadrobić postęp wynikający z wcześniejszych działań gracza.

System obserwuje fakty utrzymywane przez właścicieli poszczególnych mechanik i na ich podstawie przesuwa scenariusz do właściwego punktu. Nie fabrykuje przy tym zdarzeń ani nie rekonstruuje świata na podstawie samej pozycji w historii.

Rozwiązanie pozwoliło zachować niezależność rozgrywki, a jednocześnie utrzymać kontrolę nad obowiązkowymi etapami narracji.

---

## 03. Własne mechaniki gameplayowe i interakcje VR

Orange Monkey VR wykorzystuje WebXR i kontrolery ruchowe jako podstawowy interfejs gracza.

Poruszanie się odbywa się względem platformy, której orientacja może zmieniać się podczas rozgrywki. System lokomocji uwzględnia jej lokalną płaszczyznę, a gracz może niezależnie korzystać z narzędzi przypisanych do lewej i prawej ręki.

Wśród opracowanych mechanik znajdują się:

* przestrzenne wskazywanie obiektów, interakcje raycast i chwytanie kryształów;
* relikwiarz z sekwencją osadzania, aktywacji i zatwierdzania kart;
* Astro Piec służący do przetwarzania materii i konstruowania przedmiotów;
* Astrolabium Więzi z wyborem pasm, namierzaniem oraz przyciąganiem obiektów;
* Kula Asterionowa, która umożliwia sterowanie platformą i jej sektorami;
* pozyskiwanie, strojenie, transport i instalacja kamieni runicznych.

Każda mechanika ma własne warunki działania i odpowiedzialność za stan, dzięki czemu może współpracować z innymi bez dublowania logiki.

Nie korzystaliśmy z gotowego silnika fizycznego ani standardowego zestawu mechanik gry. Interakcje zaprojektowaliśmy bezpośrednio dla potrzeb tego świata, wykorzystując matematykę przestrzenną, transformacje obiektów, raycasting i własne maszyny stanów.

---

## 04. Świat, który rozwija się wraz z graczem

Świat gry jest zorganizowany wokół pięciu rodzin żywiołów: Ziemi, Ognia, Drzewa, Metalu i Wody.

Odkrywanie odpowiadających im glifów prowadzi do zdobywania kolejnych kryształów, rozwijania platformy i poznawania mechaniki świata. W miarę postępu gracz uzyskuje dostęp do skorup, małych glifów, nowych narzędzi oraz kamieni runicznych.

Każdy kamień przechodzi własną sekwencję pozyskania i instalacji. Jego osadzenie zmienia stan odpowiedniego sektora platformy i otwiera nowe możliwości interakcji.

Istotnym elementem późniejszej rozgrywki jest **Rezonator Asterionowy** — przestrzenny system wykrywania i namierzania odległych obiektów.

Jego pole powstaje na podstawie aktualnej konfiguracji sektorów. Zmiana ich położenia wpływa na geometrię aktywnego obszaru, a zarejestrowane cele są wykrywane na podstawie rzeczywistego położenia względem nominalnego pola.

Namierzanie przebiega etapami. Obiekty otrzymują znaki i pierścienie rezonansu, które informują gracza o postępie, gotowości do przyciągnięcia oraz utracie kontaktu.

Logika wykrywania pozostaje oddzielona od geometrii prezentacyjnej. Dzięki temu wizualne wygięcia, zaokrąglenia, poświaty i animacje pola nie zmieniają zasad gameplayu.

Rezonator łączy kilka niezależnych systemów w jedną mechaniczną całość: ruch sektorów, geometrię przestrzenną, wykrywanie celów, progresję i informację zwrotną dla gracza.

---

## 05. Technical art, animacje i dźwięk przestrzenny

Warstwa wizualna Orange Monkey VR wykorzystuje modele GLB, materiały, mapy emisji, animacje oraz efekty proceduralne.

Modele i elementy świata przygotowywałem z wykorzystaniem Meshy AI, Blendera, Inkscape i GIMP-a. Ważną częścią procesu było również dostosowanie geometrii, pivotów, kotwic i hierarchii transformacji do działania w środowisku VR.

Efekty wizualne obejmują między innymi wyładowania energetyczne, świetlne reakcje obiektów, animowane pola rezonansu, efekty przyciągania, materializację elementów platformy i finałową transformację świata.

Proceduralne błyskawice wykorzystują własny generator ścieżek i ograniczoną pulę współdzielonych zasobów. Ich wygląd jest inspirowany rozgałęzionymi wyładowaniami, ale nie stanowi fizycznej symulacji elektromagnetycznej.

Równie istotna jest warstwa dźwiękowa.

Przygotowałem zestaw efektów i atmosfer dźwiękowych, wykorzystując Adobe Firefly oraz ElevenLabs, a także obróbkę i miks w Ableton Live.

Własny system audio obsługuje odtwarzanie zdarzeniowe, pętle urządzeń, sekwencje ambientowe i przestrzenne źródła dźwięku. Pozycjonowanie HRTF pozwala graczowi lokalizować źródła w otaczającym świecie, a osobne magistrale umożliwiają niezależne zarządzanie kategoriami dźwięków.

Dźwięk nie jest jedynie tłem. Informuje o stanie narzędzi, rozpoczęciu namierzania, zdobyciu obiektu, zakończeniu procesu i zmianach zachodzących w świecie.

---

## 06. Współpraca z AI i proces produkcyjny

Orange Monkey VR powstawało w modelu współpracy człowieka z AI, opartym na świadomym podziale odpowiedzialności.

**Moja rola** obejmowała koncepcję i wizję artystyczną, projektowanie doświadczenia gracza, mechanik i przebiegu rozgrywki, określanie wymagań, produkcję assetów oraz integrację i ocenę rezultatów w rzeczywistym środowisku VR.

**ChatGPT** wspierał rozwijanie architektury, analizę zależności, projektowanie systemów, przygotowanie dokumentacji, audyty i opracowywanie zadań implementacyjnych.

**Codex** realizował określone zadania programistyczne: implementację modułów, integrację funkcji, refaktoryzację i poprawki kodu.

Wraz ze wzrostem złożoności projektu rozwijaliśmy także sam proces współpracy. Powstały kanoniczne modele techniczne, Decision Log, mapa zależności, standardy pisania punktów scenariusza oraz protokół realizacji ograniczonych zadań.

Dokumentacja stała się pamięcią operacyjną projektu. Pozwalała odróżniać aktualny kod od planowanych funkcji, zachowywać decyzje architektoniczne i ograniczać ryzyko regresji podczas kolejnych migracji.

Ten sposób pracy pozwolił mi prowadzić rozbudowany projekt kreatywno-techniczny, korzystając z możliwości AI bez oddawania mu odpowiedzialności za wizję, kierunek rozwoju i końcową akceptację rozwiązań.

---

## Rezultat

Orange Monkey VR jest grywalnym doświadczeniem WebXR, zbudowanym w JavaScripcie i renderowanym przez Three.js.

Projekt obejmuje wieloetapową progresję, własny system scenariusza i reżyserii, modułową architekturę aktorów, mechaniki sandboxowe, narzędzia interakcji VR, system kamieni runicznych, Rezonator Asterionowy, efekty proceduralne, dźwięk przestrzenny oraz narracyjne zakończenie.

Rozgrywka zajmuje około 40 minut graczowi, który zna już mechaniki. Dla osoby odkrywającej świat po raz pierwszy czas może być dłuższy.

Gra była rozwijana i weryfikowana na Meta Quest 3S, również z wykorzystaniem Virtual Desktop. Dostępna jest jako przeglądarkowe doświadczenie VR, a jej kod znajduje się w publicznym repozytorium.

**Orange Monkey VR jest dla mnie przykładem tego, jak projektowanie systemów, kierunek artystyczny i współpraca z AI mogą połączyć się w procesie tworzenia kompletnego interaktywnego doświadczenia.**
