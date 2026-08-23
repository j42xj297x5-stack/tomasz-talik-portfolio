# Experience VR — kanoniczny model kamieni runicznych P4

## 1. Status dokumentu

- **Status:** **TARGET / KANONICZNY MODEL TECHNICZNO-GAMEPLAYOWY / NOT IMPLEMENTED**.
- Dokument jest źródłem prawdy dla przyszłego przygotowania assetów i mechaniki pięciu kamieni runicznych P4 oraz pięciu odpowiadających im naczyń sektorowych.
- Nie opisuje stanu wdrożonego. Obecny runtime nie ma tej mechaniki, assetów runicznych, spatial audio kamieni ani integracji P4 z progresją.
- Oznaczenia normatywne:
  - **KANON** — zasada wiążąca dla przyszłych assetów, runtime'u i integracji;
  - **TUNING** — wartość lub zachowanie dobierane w prototypie i na Meta Quest 3S;
  - **OTWARTE** — decyzja celowo nierozstrzygnięta;
  - **CURRENT** — fakt o aktualnym repozytorium;
  - **TARGET / NOT IMPLEMENTED** — zatwierdzony kierunek, którego kod jeszcze nie realizuje.

W razie sprzeczności status implementacji rozstrzygają kod i [VR Runtime Model](VR_RUNTIME_MODEL.md), a ownership przebiegu — [Scenario / Director Model](VR_SCENARIO_DIRECTOR_MODEL.md). Ten dokument rozstrzyga wyłącznie docelowy kontrakt systemu kamieni P4. Żadna liczba niewymieniona jawnie jako **KANON** nie może zostać uznana za wiążącą.

## 2. Cel i zakres

Dokument definiuje:

- jednostkę `kamień + naczynie` i pair-specific przygotowanie;
- rooty, pivoty i helpery eksportowane w GLB;
- semantyczne stany kamienia;
- prowadzenie kamienia rozwiniętym Astrolabium Więzi po zewnętrznej orbicie platformy;
- przejęcie przez socket, finalne osadzenie i commit progresji;
- lekką blokadę logiczną przez już zainstalowane kamienie;
- spatial audio kamieni;
- rozdział odpowiedzialności Blender / runtime Three.js / Scenario / Director;
- kolejność osobnych przyszłych etapów wdrożenia.

Poza zakresem są: implementacja runtime, finalny interfejs JavaScript, skrypty Blendera, nowe assety, input mapping, pełna fizyka, save system, cała narracja P4 oraz przepisanie Astrolabium. Nazwy helperów i stanów poniżej są kontraktem semantycznym; implementacja może dostosować zapis do istniejących konwencji wyłącznie bez utraty znaczenia.

## 3. Relacja z P4 i istniejącym Experience VR

**KANON:** kamienie runiczne są dużymi obiektami świata późnego etapu Experience VR. Nie są materiałami wkładanymi do Astro Pieca. Po odblokowaniu właściwej zdolności rozwinięte Astrolabium Więzi przyciąga i prowadzi je do specjalnych naczyń na końcach sektorów platformy. Pierwsze cztery kamienie otwierają możliwość zdobycia ostatniego; komplet pięciu przygotowuje platformę do finalnego etapu.

Ten dokument nie rozpisuje całego P4 ani nie nadaje mu point IDs. Aktualny produkcyjny przebieg kończy się na Kuli Asterionowej i sterowaniu platformą; P4 pozostaje **TARGET / NOT IMPLEMENTED**. Scenario musi później opisać kolejność i dostępność P4, bez kopiowania mechaniki kamieni. Kula Asterionowa nadal odpowiada za orientację `VrTiltableFloorRoot`; niniejszy model nie zmienia jej kontraktu.

## 4. Fundament: dokładnie pięć par

```text
5 różnych kamieni runicznych
+
5 odpowiadających naczyń / uchwytów sektorowych
=
5 par
```

**KANON:** podstawową jednostką przygotowania, walidacji i konfiguracji jest **PARA: konkretny kamień + właściwe naczynie + właściwy sektor**.

Kamienie są odrębnymi assetami. Mogą różnić się geometrią, skalą, pełną obwiednią animacji, wypieczonym loopem, charakterem ruchu, pivotem, wysokością i orientacją instalacji. Naczynia należą do jednej rodziny wizualno-konstrukcyjnej i mogą współdzielić sposób przygotowania, ale mogą różnić się detalem, materiałem lub wariantem rodziny/żywiołu.

Wspólny runtime nie może zakładać identycznych brył ani jednej globalnej wysokości socketu. Każda para wymaga osobnej inspekcji pełnego loopa i sprzętowego QA.

## 5. Model naczynia i orientacja sektorowa

### 5.1. Ustawienie w świecie

**KANON:** każde naczynie:

- leży podłużnie **wzdłuż osi swojego sektora platformy**, zamiast tworzyć wysoki pionowy postument;
- znajduje się na końcu właściwego sektora;
- jest lekko odsunięte od powierzchni platformy;
- wzmacnia czytelność pięciu sektorów i może wizualnie działać jak końcowy wzmacniacz / rezonator anteny;
- pozostawia czytelne centrum i ogranicza zasłanianie pola widzenia.

Kamień unoszący się nad podłużnym naczyniem ma wyglądać jak aktywna część konstrukcji, nie trofeum na cokole. Dokładny offset, kąt, orientacja i wysokość naczynia są **TUNINGIEM** po teście na rzeczywistym sektorze oraz Quest 3S; dokument nie ustanawia wartości w metrach.

### 5.2. Kontrakt hierarchii GLB

Zalecana nazwa zachowująca wymagane znaczenia:

```text
RUNE_VESSEL_<TYPE>_ROOT
├── RUNE_VESSEL_<TYPE>_MESH
├── RUNE_VESSEL_<TYPE>_SOCKET_POINT
└── RUNE_VESSEL_<TYPE>_SOCKET_ZONE
```

`<TYPE>` musi stabilnie identyfikować rodzinę/parę. Helpery mogą być Empty lub innymi eksportowalnymi węzłami, o ile loader GLB zachowuje ich nazwy i transformacje.

#### `VESSEL_ROOT`

**KANON:** jest lokalnym rootem całego naczynia. Służy do ustawienia naczynia w sektorze i oddziela transformację montażową od geometrii. Mesh i helpery pozostają w jego przestrzeni lokalnej.

#### `SOCKET_POINT`

**KANON:** jest precyzyjną finalną transformacją root/pivota właściwego kamienia w stanie `INSTALLED`: pozycją, wysokością i orientacją. Jest authored pair-specific i eksportowany z assetem. Runtime nie wylicza go z przypadkowego bounding boxa naczynia.

#### `SOCKET_ZONE`

**KANON:** jest dużą, wybaczającą strefą przejęcia, a nie finalną pozycją kamienia. Wykrywa wejście poprawnie prowadzonego kamienia wystarczająco blisko właściwego naczynia i pozwala rozpocząć kontrolowany snap do `SOCKET_POINT`.

Pierwszym preferowanym modelem logicznym jest sfera nad naczyniem: niezależna od kierunku podejścia, prosta i wybaczająca w VR. Jej promień jest **TUNINGIEM**. Gdy próba konkretnej pary wykaże przewagę kapsuły lub cylindra, para może użyć takiego kształtu przy zachowaniu tej samej semantyki. Geometria i rozmiar zone są pair-specific.

## 6. Model kamienia, root i pivot

Zalecana hierarchia:

```text
RUNE_STONE_<TYPE>_ROOT
└── istniejąca hierarchia animowanego kamienia
```

**KANON:** każdy kamień otrzymuje jeden nadrzędny, stabilny root będący reprezentantem całego obiektu dla runtime'u. Runtime targetuje, przesuwa po orbicie, snapuje i instaluje wyłącznie ten root. Istniejące kontrolery, kości, animated nodes i inne gałęzie pozostają pod nim.

Pivot/root jest świadomie dobierany dla konkretnego kamienia tak, aby:

- cały obiekt dało się prowadzić jednym transformem;
- nie naruszyć istniejących animacji i ich przestrzeni lokalnej;
- uzyskać estetyczną finalną pozę nad naczyniem;
- pełny loop nie przecinał naczynia ani platformy.

**KANON:** finalna wysokość i orientacja kamienia są właściwością **pary**, nie globalnym parametrem systemu. Dodanie rootu musi zachować world transforms istniejącej hierarchii.

## 7. Pair-specific preparation i safe envelope

Przyszły wspólny system może korzystać z pięciu pair-specific konfiguracji o semantyce roboczo nazwanej `RuneStonePairConfig`. To nie jest projekt finalnego interfejsu JS. Konfiguracja może później wskazywać:

- stabilne `stoneId`, `vesselId` i `sectorId`;
- helper `SOCKET_POINT` i opis `SOCKET_ZONE`;
- parametry orbity i bezpiecznej obwiedni;
- zajętość orbity;
- loop audio;
- opcjonalny pair-specific `animationTimeScale` i tolerancje.

Dopasowanie kamienia do naczynia musi używać jawnej semantyki typu/ID. Nie wolno opierać go na kolorze grafiki, nazwie materiału ani indeksie kolejności w scenie. Dokładne nazwy pól zostaną ustalone w osobnym zadaniu implementacyjnym.

Ponieważ kamień jest animowany, statyczny bounding box pierwszej klatki nie jest wystarczającym kontraktem. Przygotowanie każdej pary musi uwzględnić **maksymalną przestrzeń zajmowaną podczas pełnego loopa**. Safe envelope może pomóc dobrać socket height/zone, minimalny dystans od platformy i szerokość blokady orbitalnej. Jego format — promień, sfera, kapsuła, inna uproszczona obwiednia lub konfiguracja — jest **OTWARTY**.

## 8. Animacje GLB

**KANON:** charakter, geometria i choreografia wewnętrznego ruchu pozostają wypieczone w GLB. Runtime prowadzi wyłącznie root całego kamienia i nie odtwarza w JavaScript wewnętrznych orbit, osi, obrotów ani ruchów części.

Własny loop kamienia:

- działa w `FREE`;
- może działać podczas locku, prowadzenia i snapu;
- **nie zatrzymuje się po instalacji**;
- sprawia, że `INSTALLED` pozostaje żywym, aktywnym reliktem.

Runtime może ustawić globalną prędkość klipu. Lekkie spowolnienie podczas przenoszenia lub instalacji jest dopuszczalne wyłącznie po próbie wizualnej. `animationTimeScale` jest pair-specific **TUNINGIEM**; pięć kamieni nie musi dzielić jednej wartości.

## 9. Semantyczne stany runtime

```text
FREE
→ LOCKED_BY_ASTRO
→ CARRIED_ORBIT
→ SOCKET_CAPTURE
→ INSTALLED
```

Nazwy implementacyjne mogą się zmienić, lecz poniższa semantyka jest **KANONEM**.

### `FREE`

A future `FREE` stone originates in its deterministic slot in the reserved world-stable `RUNE_STONES` spherical layer (`50–75 m`), as defined by [`VR_SPHERICAL_LAYERS_MODEL.md`](VR_SPHERICAL_LAYERS_MODEL.md). Leaving `FREE` enters the transport contract below; the spherical layer does not replace `LOCKED_BY_ASTRO`, `CARRIED_ORBIT`, capture or installation.

Large Glyph is not a spherical layer. Its ordered `RING_EXPANDED = 46 m` and full-sphere `SPHERE_FAR = 80 m` remain separate from the reserved Rune Stones range `50–75 m`.

Kamień istnieje w świecie, odtwarza własny loop animacji i emituje własny spatial audio loop. Targetowanie jest możliwe tylko wtedy, gdy progresja/Director udostępnia odpowiednią zdolność.

### `LOCKED_BY_ASTRO`

Astrolabium ma prawidłowy target/lock. Lock nie teleportuje kamienia do ręki, twarzy ani gracza.

### `CARRIED_ORBIT`

Aktywne przyciąganie prowadzi kamień po zewnętrznym pasie platformy. Gracz przemieszcza się po platformie i prowadzi obiekt wokół niej.

### `SOCKET_CAPTURE`

Poprawny kamień wszedł do `SOCKET_ZONE` właściwego naczynia. Ręczne prowadzenie wygasa, a runtime płynnie przejmuje ostatni odcinek do `SOCKET_POINT`.

### `INSTALLED`

Kamień osiągnął finalną transformację i instalacja została zatwierdzona. Nadal odtwarza animację i spatial audio, staje się trwałą częścią sektora, faktem P4 oraz przeszkodą dla kolejnych kamieni.

Stan po utracie przyciągania przed capture musi być bezpieczny, ale jego dokładne zachowanie jest **OTWARTE**; patrz §25.

## 10. Astrolabium Więzi i prowadzenie gracza

Ten model rozszerza istniejące Astrolabium tylko dla P4:

- po odblokowaniu zdolności runicznej może targetować duże kamienie;
- pull trwa tak długo, jak gracz aktywnie prowadzi obiekt;
- utrata lub zwolnienie przyciągania kończy aktywne prowadzenie;
- wejście poprawnego kamienia w poprawny `SOCKET_ZONE` przekazuje sterowanie instalacji.

**KANON:** duży kamień nie jest przyciągany do dłoni, przed twarz, do klatki gracza ani do wnętrza platformy. Pozostaje po **zewnętrznej stronie platformy**, zachowując skalę i czytelność obrazu. Nie wymyśla się nowego inputu: dokładny mapping pozostaje zgodny z istniejącym runtime i dokumentacją Astrolabium, a przyszła integracja ma wykorzystać istniejącą warstwę semantic input.

Gracz musi kolejno znaleźć kamień, uzyskać lock, rozpocząć i utrzymać pull, fizycznie przejść ku właściwemu sektorowi, prowadzić kamień wokół platformy, wejść nim w zone, a dopiero potem pozwolić systemowi na finalne osadzenie. To transport przestrzenny, nie teleport z odległości.

## 11. Ograniczenie do zewnętrznej orbity

W `CARRIED_ORBIT` root kamienia podlega lekkiemu ograniczeniu logicznemu runtime względem centrum `VrTiltableFloorRoot`, a nie pełnej symulacji fizycznej.

**KANON:** kamień:

- ma kontrolowany minimalny promień względem centrum platformy;
- nie może zostać przeciągnięty do jej wnętrza;
- pozostaje w zewnętrznym pasie konstrukcji;
- płynnie zmienia pozycję kątową, gdy gracz chodzi po platformie.

Możliwa lekka reprezentacja, nie finalne API:

```text
platformCenter
carryRadius / minimumRadius
carryAngle
carryHeight
```

Zależność od pozycji gracza i Astro, carry radius/height, smoothing, lag i prędkość podążania są **TUNINGIEM**. Safe envelope konkretnego kamienia musi uczestniczyć w ustalaniu bezpiecznej odległości; sam root-point nie wystarcza.

## 12. Socket zone, point i capture

`SOCKET_ZONE` odpowiada wyłącznie na pytanie „czy poprawny kamień jest wystarczająco blisko właściwego naczynia?”. `SOCKET_POINT` odpowiada „jaka jest finalna transformacja rootu?”. Nie wolno łączyć tych ról.

```text
CARRIED_ORBIT
→ poprawny stone/vessel/sector match i wejście w SOCKET_ZONE
→ SOCKET_CAPTURE
→ root osiąga SOCKET_POINT
→ INSTALLED
→ commit progresji
```

W `SOCKET_CAPTURE` runtime wygasza manualne prowadzenie i płynnie interpoluje root do authored transformacji. Wewnętrzna animacja może nadal działać. Czas, easing, tolerancja końca oraz feedback świetlny i dźwiękowy są **TUNINGIEM**.

**KANON:** samo wejście do dużej zone nie jest commitem. Dopiero ukończony capture poprawnego typu we właściwym sockecie daje `INSTALLED` i emituje semantyczny fakt, który Scenario/Director może zaakceptować jako ukończenie instalacji.

## 13. Instalacja, progresja i save boundary

Scenario opisuje, kiedy P4 jest dostępne, kolejność pierwszych czterech kamieni, warunek dostępności piątego i zdarzenie kompletu. Director decyduje, czy dany kamień może teraz zostać zdobyty lub zainstalowany oraz czy fakt P4 jest dopuszczalny w bieżącym punkcie. Kontroler domenowy może przechowywać fakty instalacji; Scenario nie kopiuje jego całej maszyny lokalnej.

Runtime wykrywa techniczne ukończenie capture i emituje fakt, ale nie wybiera następnego beatu. Asset nie przechowuje progresji.

W przyszłym save modelu `INSTALLED` jest kandydatem na trwały stan. `CARRIED_ORBIT` nie jest bezpiecznym checkpointem, a połowa `SOCKET_CAPTURE` nie może być trwałym zapisem. Ten dokument nie projektuje ani nie implementuje save'u.

## 14. Zainstalowane kamienie blokują orbitę

**KANON:** kamień `INSTALLED` jest realną logiczną przeszkodą przestrzenną. Aktywnie prowadzony kamień nie może przez niego przejść ani zostać „przepchnięty” siłą Astrolabium.

Preferowany lekki model rezerwuje fragment zewnętrznej orbity dla zainstalowanego kamienia/sektora, np. semantycznie:

```text
occupiedAngle
occupiedHalfWidth
```

Dokładny algorytm nie jest kanonem. Reprezentacja ma uwzględniać pair-specific safe envelope i wymuszać znalezienie poprawnej strony podejścia bez dynamicznego mesh-vs-mesh collision.

Gdy gracz napiera na zajęty obszar, kamień nie przenika przeszkody, a gracz ostatecznie zwalnia/utraci pull i podchodzi ponownie. Miękki opór versus natychmiastowy release, timeout i wcześniejszy feedback to **TUNING UX / OTWARTE**.

## 15. Spatial audio

**KANON:** każdy kamień ma własny, ciągły, raczej cichy spatial loop: szum, rezonans lub ambientową obecność. Emitter jest związany z rootem kamienia albo dedykowanym runtime audio anchor i porusza się z nim.

```text
FREE          → spatial loop aktywny przy kamieniu
CARRIED_ORBIT → emitter porusza się z rootem
INSTALLED     → loop pozostaje przy kamieniu w sektorze
```

Dźwięk może pomagać w orientacji: z daleka ledwo słyszalny, wyraźniejszy przy zbliżeniu. Pliki, gain, `refDistance`, rolloff, `maxDistance`, krzywa tłumienia i dystans słyszalności są pair-specific **TUNINGIEM** testowanym na Quest 3S.

Blender nie eksportuje aktywnego systemu audio. Three.js/runtime odpowiada za Web Audio / `PositionalAudio`, start/stop/dispose, pozycję i reakcję na stan. Integracja musi respektować fail-soft ownership istniejącego `VrAudioBridge`; audio nie może blokować gameplayu ani posiadać progresji.

## 16. Podział odpowiedzialności

| Warstwa | Jest właścicielem | Nie jest właścicielem |
| --- | --- | --- |
| **Blender / GLB** | geometria i materiały; stabilne rooty; pair-specific pivot; helpery naczynia; authored `SOCKET_POINT`; zachowanie kontrolerów i wypieczonych animacji; eksport GLB | input, Web Audio, targetowanie, progresja, decyzja o instalacji |
| **Runtime Three.js / aktor mechaniki** | targeting i lock Astro; transform rootu; orbit constraint; distance/zone tests; occupied arcs; capture/snap; odtwarzanie AnimationMixer; emitter spatial audio; feedback; reset/dispose lokalnej mechaniki | kolejność P4, dostępność piątego kamienia, wybór następnego punktu Scenario |
| **Kontroler domenowy P4** | fakty domenowe par, poprawność technicznego commitu i odczyt zainstalowanego zestawu, jeśli zostanie wydzielony | authored przebieg i fizyczne wykonanie Three.js |
| **Scenario** | kiedy P4 jest dostępne; authored kolejność; kiedy dostępny jest piąty kamień; co oznacza komplet; mapowanie faktów na jawne przejścia i symbolic effects | transformy, kolizje, audio lifecycle, socket math, kopiowanie lokalnego stanu aktora |
| **Director** | current point; legalność eventu/przejścia; capabilities; decyzja, czy dany kamień wolno teraz zdobyć/zainstalować; przyjęcie warunku P4 | wywołania Three.js, interpolacja snapu, odległości, mesh/pivot, odtwarzanie audio |
| **RuntimeExperience** | przekazanie eventu do Directora i wykonanie zwróconych symbolic effects przez wstrzyknięte handlery | decyzje fabularne, alternatywna progresja, własny drugi cursor |

Scenario/Director mają oceniać globalną legalność. Aktor zachowuje actor-local correctness: właściwy typ, stan, geometria, wejście w zone i ukończenie snapu. `experienceVr.js` pozostaje composition rootem, a nie miejscem nowej równoległej maszyny P4.

## 17. Kontrakt przyszłych skryptów Blender 5.1.2

Każdy osobny skrypt przygotowujący konkretną parę ma:

1. działać w Blenderze **5.1.2**;
2. analizować konkretny kamień, w tym pełny wypieczony loop;
3. korzystać ze wspólnego modelu konstrukcyjnego naczynia, ale zachować pair-specific ustawienia;
4. utworzyć lub zweryfikować stabilny root kamienia i `VESSEL_ROOT`;
5. utworzyć/ustawić `SOCKET_POINT` i `SOCKET_ZONE`;
6. zachować world transforms, istniejącą geometrię, materiały, animacje, kontrolery i charakter ruchu;
7. nie kasować całej sceny i nie przebudowywać kamienia proceduralnie bez potrzeby;
8. być idempotentny — ponowne uruchomienie nie duplikuje rootów/helperów ani nie degraduje assetu;
9. eksponować pair-specific tuning zamiast jednej magicznej wartości dla pięciu par;
10. przygotować GLB do prostego odczytu hierarchii, transformacji i klipów przez Three.js.

Repozytorium nie zawiera obecnie kanonicznej osobnej referencji skryptowania Blender 5.1.2. Powyższe wymagania są minimalnym kontraktem tego systemu, nie kompletnym style guide'em API `bpy`. Skrypty nie powstają w ramach tego dokumentu.

## 18. Kontrakt przyszłego runtime

Przyszły runtime powinien:

- ładować helpery i rooty po stabilnych identyfikatorach, walidując brak/duplikat;
- zachować wspólną maszynę stanów i osobne konfiguracje pięciu par;
- targetować i transformować wyłącznie `RUNE_STONE_<TYPE>_ROOT`;
- odtwarzać assetowe klipy bez rekonstrukcji ruchu w kodzie;
- wykonywać proste testy wektorowe/dystansowe, orbit constraint i uproszczone occupied arcs;
- wymagać jawnego type/sector match przed capture;
- commitować fakt dopiero po zakończonym snapie;
- utrzymywać spatial audio oraz animację po instalacji;
- bezpiecznie resetować i dispose'ować transient pull/capture/audio bez fałszywego commitu;
- emitować fakty semantyczne przez istniejącą granicę Scenario → Director → RuntimeExperience, nie omijać jej nową progresją.

Finalny podział modułów, API konfiguracji i event vocabulary pozostają dla osobnego projektu implementacyjnego.

## 19. Performance i QA Meta Quest 3S

**KANON:** fundamentem są lekkie testy odległości, operacje wektorowe, promienie/kąty, uproszczone strefy i obwiednie. Nie jest wymagany rigid-body engine, dynamiczne CSG ani mesh-vs-mesh collision każdego animowanego fragmentu.

Zainstalowane kamienie nadal odtwarzają wizualne loopy, dlatego budżet należy oceniać dla pięciu jednocześnie aktywnych assetów i pięciu emiterów. Automatyczna walidacja kontraktu GLB nie zastępuje testów czytelności, komfortu, kolizji wizualnej, audio i performance na Meta Quest 3S. Hardware QA każdej pary oraz pełnego zestawu jest osobną obowiązkową bramką.

## 20. Czego nie robić

Zakazane kierunki:

- jeden identyczny socket height lub bounding założony dla pięciu kamieni;
- zatrzymywanie animacji po instalacji;
- teleport z odległości prosto do naczynia;
- prowadzenie przez wnętrze platformy albo do dłoni/twarzy/klatki gracza;
- przechodzenie aktywnego kamienia przez `INSTALLED`;
- pełne rigid-body jako fundament albo mesh-vs-mesh collision wszystkich animated nodes;
- przepisywanie wewnętrznych animacji GLB w JavaScript;
- używanie `SOCKET_ZONE` jako finalnej transformacji;
- wyliczanie `SOCKET_POINT` z przypadkowego bounding boxa;
- dopasowanie przez materiał, kolor lub kolejność obiektów;
- progresja P4 przechowywana w assetach;
- decyzje Scenario w runtime actorze lub assetach;
- wykonywanie mechaniki Three.js przez Director;
- drugi progression cursor w systemie kamieni lub `experienceVr.js`.

## 21. KANON — zestaw wiążący

1. Istnieje dokładnie pięć pair-specific par: pięć różnych kamieni i pięć naczyń jednej rodziny.
2. Naczynia leżą w osi sektorów, na ich końcach, lekko nad platformą.
3. Każdy kamień ma własny stabilny root/pivot; finalna poza jest właściwością pary.
4. Każde naczynie ma authored `VESSEL_ROOT`, precyzyjny `SOCKET_POINT` i wybaczający `SOCKET_ZONE`.
5. Pair match używa jawnych stabilnych IDs/typów i sector identity.
6. Safe envelope uwzględnia maksymalną przestrzeń pełnego loopa, nie tylko pierwszą klatkę.
7. Wewnętrzne animacje pozostają w GLB i działają po instalacji; runtime prowadzi tylko root.
8. Stany zachowują semantykę `FREE → LOCKED_BY_ASTRO → CARRIED_ORBIT → SOCKET_CAPTURE → INSTALLED`.
9. Astro prowadzi duży kamień na dystans po zewnętrznej stronie platformy; kamień nie wchodzi do środka ani do przestrzeni ciała gracza.
10. Gracz fizycznie obchodzi platformę z aktywnym pullem i doprowadza kamień do właściwego sektora.
11. Poprawna zone rozpoczyna płynny capture; dopiero ukończony snap do point daje `INSTALLED` i commit.
12. Zainstalowane kamienie blokują drogę kolejnym bez kosztownej pełnej fizyki i nie można ich przeciąć.
13. Każdy kamień ma ciągłe spatial audio w `FREE`, podczas transportu i po instalacji.
14. Blender, actor runtime, domenowe fakty oraz Scenario/Director zachowują rozdzielone ownership.
15. Pierwsze cztery kamienie umożliwiają zdobycie piątego; komplet pięciu przygotowuje platformę do finału.

## 22. TUNING — celowo niezamrożony

- offset, kąt, orientacja i wysokość naczynia nad platformą;
- pair-specific położenie i orientacja `SOCKET_POINT`;
- geometria, pozycja i rozmiar `SOCKET_ZONE`;
- safe envelope format i marginesy;
- carry/minimum radius, carry height i bezpieczny dystans od gracza/platformy;
- zależność pozycji kamienia od gracza/Astro, smoothing, lag i prędkość;
- pair-specific `animationTimeScale`;
- occupied arc width i dokładna reakcja na blocker;
- timing release, timeout i feedback oporu;
- czas, easing i tolerancja `SOCKET_CAPTURE`;
- pliki/loopy, gain, `refDistance`, rolloff, `maxDistance` i krzywe spatial audio;
- audio, światło i inne efekty instalacji.

## 23. Otwarte decyzje Projektanta

1. Dokładna geometria i rozmiar `SOCKET_ZONE` dla każdej pary.
2. Dokładny carry radius względem platformy.
3. Dokładna bezpieczna odległość kamienia od gracza.
4. **OTWARTE: zachowanie kamienia po release poza socketem** — powrót do pozycji/orbity R4, pozostanie, płynny powrót lub inny stabilny stan.
5. Czy blocker najpierw daje miękki opór, czy natychmiast kończy pull.
6. Dokładny algorytm i reprezentacja occupied arcs.
7. Finalna wysokość i orientacja każdego z pięciu kamieni.
8. Pair-specific prędkości animacji.
9. Konkretne spatial audio loops i wszystkie parametry.
10. Audio/wizualny efekt snapu i instalacji.
11. Dokładna receptura/capability odblokowująca Astrolabium dla kamieni.
12. Dokładne pozycje R4 pięciu kamieni w świecie.
13. Format safe envelope i miejsce przechowywania pair-specific konfiguracji.

Punkty te nie mogą zostać domknięte przypadkową wartością w pierwszej implementacji bez decyzji/prototypu i aktualizacji kanonu.

## 24. Kolejność przyszłego wdrożenia

Rekomendowana sekwencja małych, osobno walidowanych etapów:

```text
RUNE M1  — ten kanoniczny dokument
RUNE M2  — pierwsza para w Blenderze 5.1.2: kamień + naczynie + root + helpery
RUNE M3  — walidacja GLB pierwszej pary w scenie
RUNE M4  — prototyp CARRIED_ORBIT bez progresji
RUNE M5  — zewnętrzny constraint + bezpieczny dystans
RUNE M6  — SOCKET_ZONE + SOCKET_CAPTURE + INSTALLED
RUNE M7  — occupied arcs / blocker zainstalowanego kamienia
RUNE M8  — spatial audio pierwszego kamienia
RUNE M9  — integracja faktów P4 z Scenario / Director
RUNE M10 — cztery pozostałe pary, każda analizowana osobno
RUNE M11 — hardware QA Quest 3S, także pięć aktywnych par
RUNE M12 — pełna synchronizacja dokumentacji po wdrożeniu
```

**KANON procesu:** najpierw jedna kompletna para, następnie mechanika na tej parze, a dopiero potem pozostałe cztery. Nie przygotowuje się wszystkich pięciu według niezwalidowanych globalnych założeń.

## 25. Powiązane dokumenty

- [Project Documentation Index](../maps/PROJECT_INDEX.md) — router obowiązkowego pakietu dokumentacji.
- [Experience VR Runtime Model](VR_RUNTIME_MODEL.md) — stan aktualnej implementacji, hierarchy platformy, input i lifecycle.
- [Experience VR Scenario / Director Model](VR_SCENARIO_DIRECTOR_MODEL.md) — wiążący ownership Scenario, Director i `RuntimeExperience`.
- [Experience VR Narrative & Progression Baseline](../concept/EXPERIENCE_VR_NARRATIVE_PROGRESSION_BASELINE.md) — aktualna progresja i granica post-Sphere.
- [Experience VR Gameplay Roadmap](../concept/EXPERIENCE_VR_GAMEPLAY_ROADMAP.md) — szerszy kierunek przyszłego gameplayu.
- [Experience VR Audio Model](VR_AUDIO_MODEL.md) — obecny audio owner, lifecycle i fail-soft boundary.
- [Experience VR Progress Floor Model](VR_PROGRESS_FLOOR_MODEL.md) — pięć sektorów platformy i aktualna projekcja progresji.
- [Experience VR Handoff](../handoffs/EXPERIENCE_VR_HANDOFF.md) — bieżący status implementacji i hardware QA.
- [Decision Log](../decisions/DECISION_LOG.md) — wiążące decyzje repozytorium.

Nie znaleziono aktualnego, osobnego kanonicznego dokumentu zasad skryptowania Blender 5.1.2. Dlatego przyszłe zadanie Blender musi rozpocząć się od tego modelu i zweryfikować dostępne instrukcje repozytorium przed napisaniem skryptu.
