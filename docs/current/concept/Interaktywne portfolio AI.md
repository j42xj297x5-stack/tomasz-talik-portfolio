# Interaktywne portfolio AI — dokument drogi

## Status dokumentu

CURRENT dokument koncepcyjny zachowujący intencję produktu i drogę projektową. Działający produkt ma wspólne wejście językowe oraz trzy doświadczenia: Classic 2D, Experience 3D i Orange Monkey VR.

Propozycje nazw i haseł pozostają materiałem redakcyjnym. Nie są dowodem braku wdrożenia trybów ani PL/EN; szczegóły runtime należą do aktualnych modeli technicznych.

---

# 1. Główna intencja

Portfolio nie ma być klasyczną stroną z linkami, CV i listą projektów.

Ma być interaktywnym wejściem w świat twórcy, który łączy:

* AI,
* programowanie,
* projektowanie procesów,
* grafikę,
* muzykę,
* gry,
* dokumentację,
* automatyzacje,
* etykę technologii,
* intuicję cyfrową,
* pomoc innym ludziom w oswajaniu rewolucji AI.

Główna idea:

> Portfolio jako interaktywny rytuał wejścia w świat człowieka, który pomaga innym przejść przez rewolucję AI bez utraty człowieczeństwa.

To nie ma być tylko autoprezentacja.
To ma być doświadczenie pokazujące sposób myślenia, prowadzenia projektów, tworzenia systemów i porządkowania chaosu.

---

# 2. Rdzeń narracji

Portfolio powinno opowiadać drogę:

```text
Chaos → Uważność → Narzędzie → Proces → Transformacja
```

albo:

```text
Strach przed AI → Oswojenie → Praktyka → Twórczość → Odpowiedzialność
```

albo jeszcze prościej:

```text
Człowiek spotyka AI → uczy się z nią współpracować → odzyskuje sprawczość → pomaga innym przejść dalej
```

Portfolio powinno mówić nie tylko:

> zobaczcie moje projekty

ale raczej:

> wejdź do mojego świata i zobacz, jak myślę, tworzę, porządkuję i prowadzę przez zmianę.

---

# 3. Centralny symbol: medytująca małpa 3D

W centrum strony znajduje się małpa w formie 3D.

Może być medytująca.
Nie musi być animowana w klasycznym sensie.
Wystarczy, że będzie obecna jako spokojny, symboliczny, mocny obiekt.

Znaczenia małpy:

* monkey mind ujarzmiony przez praktykę,
* pierwotna ciekawość spotykająca technologię,
* człowiek przed skokiem ewolucyjnym,
* inteligencja, zabawa, chaos i uważność w jednym,
* archetyp istoty uczącej się narzędzi,
* symbol przejścia z reaktywności do świadomości,
* kreator siedzący w centrum cyfrowego świata.

Małpa nie powinna być memiczna ani głupkowata.
Nie chodzi o „śmieszną małpę z internetu”.

Bardziej:

```text
medytujący cyfrowy Hanuman / cyber-bodhisattwa / monkey mind transformed into wisdom
```

Możliwy kierunek wizualny:

* małpa jako totem,
* posąg,
* półorganiczna, półcyfrowa figura,
* spokojna sylwetka w medytacji,
* delikatna aura,
* światło reagujące na interakcję,
* bez przerysowanego realizmu.

---

# 4. Ogólny klimat świata

Scena powinna być spokojna, ale nie martwa.

Kierunek estetyczny:

```text
zen temple × cyfrowe laboratorium × kosmiczny pulpit × portfolio kreatora AI
```

Elementy klimatu:

* ciemna przestrzeń,
* miękkie światło,
* subtelny ruch kamery,
* drobne cząsteczki,
* holograficzne panele,
* organiczne kształty,
* spokojny puls,
* wrażenie skupienia,
* lekki kosmos,
* brak startupowego plastiku,
* brak krzykliwego cyberpunku,
* więcej ciszy niż efektowności.

Kolorystyczne kierunki:

* ciemny granat,
* grafit,
* czerń,
* złote światło,
* białoniebieskie światło,
* delikatne akcenty symboliczne,
* aurora / pył / mgła / subtelny glow.

---

# 4A. Aktualny przepływ produktu

Użytkownik najpierw wybiera `Polski` lub `English`, a następnie wybiera jedno z trzech wdrożonych doświadczeń: `Classic 2D`, `Experience 3D` albo `Orange Monkey VR` (produktowa nazwa Experience VR). Classic 2D jest lekką prezentacją HTML/CSS/JavaScript, Experience 3D uruchamia niezależną scenę Three.js, a Orange Monkey VR uruchamia osobny runtime WebXR tylko po pozytywnym sprawdzeniu `immersive-vr` w bezpiecznym kontekście. Brak VR nie blokuje pozostałych dwóch ścieżek. Wybrane locale jest propagowane do treści i copy danego runtime'u.

---

# 5. Model interakcji

Po wyborze języka i Experience 3D entry shell uruchamia scenę. Poniższy przebieg opisuje jej model interakcji:

1. Ciemność.
2. Delikatne światło z góry.
3. Pojawia się centralna małpa.
4. Wokół niej zaczynają być widoczne punkty / symbole / linki.
5. Kamera powoli oddycha lub dryfuje.
6. Użytkownik najeżdża na punkt.
7. Punkt rozświetla się.
8. Pojawia się krótka etykieta.
9. Po kliknięciu kamera lub fokus przesuwa się w stronę wybranego modułu.
10. Otwiera się mini okno — myśl / hologram / wizualizacja.

Teksty, linki i panele Experience 3D są realizowane jako czytelna warstwa HTML/CSS overlay, a nie jako tekst renderowany bezpośrednio w 3D.

Powód:

* lepsza czytelność,
* łatwiejsza dostępność,
* prostsze linkowanie,
* lepsze SEO,
* łatwiejsza edycja treści,
* mniejsze ryzyko technicznego dłubania w nieczytelnym 3D.

Three.js odpowiada za:

* świat,
* kamerę,
* światła,
* bryły,
* cząsteczki,
* centralną postać,
* orbitujące punkty,
* przejścia przestrzenne.

HTML/CSS odpowiada za:

* tekst,
* panele,
* przyciski,
* linki,
* case studies,
* mobile fallback,
* dostępność.

---

# 6. Główne orbity / bramy portfolio

Wokół centralnej małpy mogą znajdować się główne bramy tematyczne. Na tym etapie nie wybieramy finalnych nazw, tylko zbieramy kierunki.

## 6.1. AI Guide / AI Transformation

Temat:

* pomaganie ludziom wchodzącym w świat AI,
* oswajanie narzędzi,
* uczenie praktycznego korzystania,
* prowadzenie przez lęk i chaos,
* budowanie mostu między człowiekiem a technologią.

Możliwa animacja w mini oknie:

* człowiek przed chaosem narzędzi,
* AI jako światło / latarnia,
* chaos zamienia się w uporządkowany workflow,
* osoba odzyskuje sprawczość.

Co pokazuje ta sekcja:

```text
Umiem tłumaczyć AI ludziom, którzy nie wiedzą, od czego zacząć.
```

---

## 6.2. DIG Engine

Temat:

* system eksploracji muzyki,
* integracje API,
* Spotify / Last.fm / Discogs,
* GUI,
* automatyzacje,
* workflow composer,
* runtime events,
* analiza danych,
* projektowanie narzędzi użytkowych.

Nie pokazywać jako „program do Spotify”.
Pokazywać jako:

```text
system eksploracji danych muzycznych, automatyzacji playlist i projektowania interfejsów dla złożonych procesów
```

Możliwa animacja:

* punkty danych lecą z różnych stron,
* nazwy artystów i utworów tworzą sieć,
* Last.fm / Spotify / Discogs łączą się liniami,
* z chaosu powstaje mapa,
* mapa przechodzi w workflow,
* workflow przechodzi w playlistę.

Co pokazuje ta sekcja:

```text
Umiem budować systemy, integrować dane i tworzyć narzędzia do realnej pracy.
```

---

## 6.3. Haiku Cosmos

Temat:

* gra / interaktywny świat,
* mechanika,
* sekwencje,
* SUB-META,
* HUD,
* runtime,
* debug mode,
* dokumentacja,
* pipeline wizualny,
* SVG / Inkscape,
* Three.js,
* projektowanie świata jako systemu.

Pokazywać jako:

```text
projekt interaktywnego świata, w którym mechanika, ekonomia, UI, symbolika i warstwa wizualna tworzą jeden system
```

Możliwa animacja:

* meteory,
* karty,
* światła,
* HUD,
* sekwencje kolorów,
* dokumentacja jako dryfujące glify,
* przejście z debug overlay do pięknej sceny.

Co pokazuje ta sekcja:

```text
Umiem prowadzić złożony projekt kreatywno-techniczny przez wiele warstw naraz.
```

---

## 6.4. Creative AI

Temat:

* grafika,
* muzyka,
* prompt design,
* praca z obrazem,
* plakaty,
* cenniki,
* estetyka,
* fotoedycja,
* przekształcanie pomysłów w artefakty,
* współpraca człowiek + AI.

Możliwa animacja:

* szkic,
* prompt,
* obraz,
* korekta,
* finalny artefakt,
* warstwy: tekst / obraz / dźwięk / układ / kolor.

Co pokazuje ta sekcja:

```text
AI traktuję jako rozszerzenie twórczości, a nie zamiennik człowieka.
```

---

## 6.5. Ethics / Life Protection / AI Dharma

Temat:

* odpowiedzialne użycie AI,
* AI jako narzędzie zwiększania świadomości i sprawczości,
* ochrona życia,
* ryzyko pogłębienia nierówności,
* chciwość, nienawiść i iluzja niewiedzy jako główne źródła zagrożenia,
* potrzeba powszechnej edukacji AI,
* transformacja dostępna nie tylko dla elit.

Ważne: ta sekcja powinna być mocna, ale spokojna.
Nie może brzmieć jak kazanie ani apokaliptyczny manifest.

Możliwa animacja:

* trzy cienie: greed / hate / delusion,
* światło nie niszczy cieni, tylko je rozprasza,
* ludzie połączeni siecią wiedzy,
* Ziemia jako delikatny, odpowiedzialny punkt odniesienia,
* AI jako narzędzie służby, nie dominacji.

Co pokazuje ta sekcja:

```text
Technologia bez etyki wzmacnia chaos. Technologia z uważnością może pomóc chronić życie.
```

---

# 7. Możliwe nazwy całego portfolio / projektu

Na tym etapie zbieramy nazwy. Nie wybieramy finalnej.

## Nazwy bardziej polskie

* Przeskok
* Małpa przy Ogniu
* Cyfrowa Małpa
* Most AI
* Most Umysłu
* Przewodnik przez AI
* Laboratorium Przeskoku
* Świadome AI
* Uważna Technologia
* Człowiek × AI
* Oswoić AI
* Cyfrowe Przejście
* W stronę AI
* AI bez lęku
* AI z człowiekiem

## Nazwy bardziej międzynarodowe

* Monkey Mind AI
* Mindful AI Studio
* The AI Crossing
* Bridge of Mind
* Human × AI Bridge
* AI Dharma Lab
* Digital Bodhisattva Lab
* Creative AI Systems
* The Meditating Monkey
* Monkey Mind Transformed
* AI Passage
* The Human AI Bridge
* Conscious AI Lab
* Mindful Automation Studio

## Nazwy roboczo najmocniejsze

* Przeskok
* The AI Crossing
* Monkey Mind AI
* Mindful AI Studio
* AI Dharma Lab
* Human × AI Bridge
* Małpa przy Ogniu

Szczególnie mocne wydaje się:

```text
Przeskok
```

bo łączy:

* zmianę pracy,
* przejście osobiste,
* przejście ludzi przez AI,
* skok cywilizacyjny,
* małpę jako symbol ewolucji,
* prostotę i polską siłę nazwy.

---

# 8. Możliwe hasła / zdania wejściowe

To nie są jeszcze finalne teksty. To zbiór roboczych kierunków.

## Po polsku

> Buduję mosty między ludzką intuicją a sztuczną inteligencją.

> Pomagam ludziom przejść przez rewolucję AI bez utraty człowieczeństwa.

> Oswajam AI tam, gdzie technologia spotyka lęk, chaos i potrzebę sensu.

> Projektuję procesy, narzędzia i doświadczenia, które pomagają ludziom pracować z AI świadomie.

> AI nie jest dla mnie modą. Jest środowiskiem twórczym, narzędziem pracy i jednym z najważniejszych przejść naszych czasów.

> Uczę, projektuję i buduję systemy, które pomagają ludziom odzyskać sprawczość w świecie AI.

## Po angielsku

> I build bridges between human intuition and artificial intelligence.

> I help people cross into the age of AI without losing what makes them human.

> I design AI workflows, creative systems and practical tools for human transformation.

> I turn digital chaos into usable, ethical and creative AI workflows.

> I help people understand, use and shape AI with clarity, responsibility and imagination.

---

# 9. Proponowana struktura treści

Docelowa strona może mieć jedną główną scenę 3D oraz warstwę paneli / case studies.

Możliwa struktura:

```text
Start / Scene
  Centralna małpa 3D
  5 orbit / bram

AI Guide
  Misja
  Jak pomagam ludziom
  Praktyczne wdrożenia

DIG Engine
  System muzyczny
  Workflowy
  Integracje API
  GUI
  Runtime / eventy

Haiku Cosmos
  Gra
  Mechanika
  UI / HUD / SUB-META
  Visual pipeline
  Three.js / debug / dokumentacja

Creative AI
  Obraz
  Muzyka
  Prompting
  Plakaty / cenniki / koncepcje
  Praca człowiek + AI

Ethics / Manifest
  AI jako odpowiedzialność
  Ochrona życia
  Chciwość / nienawiść / niewiedza
  Edukacja i dostępność

Contact / Work with me
  Kontakt
  LinkedIn / GitHub
  Możliwe role
```

---

# 10. Możliwe role zawodowe komunikowane przez portfolio

Portfolio powinno pokazać, że autor nie mieści się łatwo w jednej wąskiej szufladce.

Możliwe nazwy ról:

* AI Transformation Guide
* AI Workflow Designer
* Creative AI Systems Builder
* AI Adoption Consultant
* Creative Technologist
* AI Educator
* No-code / low-code / AI Automation Specialist
* Product-oriented AI Builder
* Projektant procesów AI
* Przewodnik wdrażania AI
* Projektant kreatywnych systemów AI
* Twórca narzędzi i workflowów AI

Najważniejszy komunikat:

```text
Nie jestem tylko użytkownikiem AI. Umiem uczyć się systemów, rozumieć je od środka, budować z nich procesy i prowadzić innych przez zmianę.
```

---

# 11–16. Stan po realizacji

Historyczny MVP, stack, struktura repozytorium, publikacja i etapy wykonania zostały zrealizowane; nie są aktywnym roadmapem. Obecny produkt obejmuje wybór PL/EN, Classic 2D, Experience 3D i capability-gated Orange Monkey VR, ze współdzielonymi tożsamościami portfolio i lokalizowanymi prezentacjami. Nowa praca musi wynikać z osobnego aktualnego zadania, a nie z dawnych checklist budowy.

---

# 17. Ryzyka i zasady ochronne

## Ryzyko 1: Zbyt wielka wizja na start

Portfolio może szybko urosnąć do dużego doświadczenia audiowizualnego.

Zasada:

```text
Najpierw rytm interakcji, potem piękno.
```

## Ryzyko 2: Za dużo treści

Jeśli w panelach będzie za dużo tekstu, strona stanie się ciężka.

Zasada:

```text
Scena przyciąga. Panel wyjaśnia. Case study rozwija.
```

## Ryzyko 3: Małpa jako żart zamiast archetypu

Małpa może zostać odebrana zbyt memicznie.

Zasada:

```text
Małpa ma być spokojnym totemem, nie maskotką.
```

## Ryzyko 4: Technologia zjada przekaz

Three.js może stać się celem samym w sobie.

Zasada:

```text
Technologia ma wzmacniać opowieść, nie ją przykrywać.
```

## Ryzyko 5: Brak dostępności

Nie każdy odbiorca będzie chciał albo mógł używać ciężkiej sceny 3D.

Zasada:

```text
Classic 2D zapewnia lekką, czytelną ścieżkę niezależną od cięższych runtime’ów 3D i VR.
```

---

# 18–19. Granica dokumentu drogi

Pierwszy prompt oraz decyzje odkładane przed prototypem są zakończonym kontekstem historycznym. CURRENT nie przedstawia ich jako backlogu. Nadrzędna nazwa lub przyszła redakcja haseł mogą pozostać otwarte, ale trzy istniejące doświadczenia, nazwa Orange Monkey VR i obsługa PL/EN są wdrożonym stanem produktu.

---

# 20. Najważniejsze zdanie robocze

```text
To portfolio ma pokazać nie tylko, co zostało zrobione, ale jaki rodzaj świadomości prowadzi te projekty.
```

Albo krócej:

```text
Nie CV. Przejście.
```

---

# 21. Granica dalszych zmian

Produkt nie potrzebuje ponownego wykonywania historycznego MVP. Kolejny krok istnieje dopiero wtedy, gdy aktualne zadanie produktowe, redakcyjne lub techniczne określi nowy zakres. Niniejszy dokument nie ustanawia takiego backlogu.

---

# 22. Krótki opis projektu do README — szkic

```text
Interactive AI Portfolio is an experimental personal portfolio built with Three.js.

Instead of presenting work as a static list of links, it creates an interactive 3D space centered around a meditating monkey — a symbol of transformed monkey mind, digital intuition and mindful work with artificial intelligence.

The project explores AI guidance, workflow design, creative AI, software systems, game design and responsible technology.

Current status: implemented bilingual portfolio with Classic 2D, Experience 3D and capability-gated Orange Monkey VR.
```

Wersja polska:

```text
Interaktywne portfolio AI to eksperymentalna strona osobista oparta na Three.js.

Zamiast prezentować projekty jako zwykłą listę linków, tworzy interaktywną przestrzeń 3D z medytującą małpą w centrum — symbolem ujarzmionego monkey mind, cyfrowej intuicji i świadomej pracy ze sztuczną inteligencją.

Projekt łączy przewodnictwo po AI, projektowanie workflowów, kreatywne użycie AI, systemy software, projektowanie gier i odpowiedzialną technologię.

Status: wczesna koncepcja / prototyp MVP.
```

---

# 23. Notatka końcowa

Ten dokument jest pierwszym zapisem kierunku.

Nie zamyka projektu.
Nie wybiera finalnej formy.
Nie ogranicza przyszłego tekstu.
Ma chronić pierwotną wizję przed rozproszeniem.

Najważniejsze na teraz:

```text
Najpierw stworzyć mały, działający świat.
Potem zobaczyć, co ten świat sam zacznie mówić.
```
