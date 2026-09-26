> Note: This file is normalized from the original root document `Interaktywne portfolio AI — dokument d.md` (preserved in place).

# Interaktywne portfolio AI — dokument drogi

## Status dokumentu

CURRENT dokument koncepcyjny opisujący intencję i ukształtowany produkt. Portfolio jest wdrożone jako wspólne wejście językowe prowadzące do trzech doświadczeń: Classic 2D, Experience 3D i Orange Monkey VR.

Dokument nie jest runtime authority ani aktywną listą wdrożeniową. Zachowuje kierunek artystyczny, narracyjny i produktowy; szczegóły wykonania należą do modeli technicznych i kodu. Propozycje nazw oraz hasła pozostają materiałem redakcyjnym, ale nie oznaczają, że wdrożone tryby lub lokalizacja czekają na MVP.

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

# 4A. Aktualny przepływ wejścia: język → trzy doświadczenia

Lekka warstwa wejściowa jest wdrożona przed runtime'ami prezentacji. Użytkownik najpierw wybiera `Polski` lub `English`, a następnie otrzymuje trzy odrębne kategorie doświadczenia:

- `Classic 2D` — lekki, płaski i retro-symboliczny interfejs portfolio;
- `Experience 3D` — atmosferyczna scena Three.js z centralną małpą, orbitującymi glifami i panelami;
- `Orange Monkey VR` — portfolio-facing nazwa niezależnego runtime'u Experience VR/WebXR.

Classic 2D i Experience 3D są zawsze dostępnymi wyborami. Orange Monkey VR pozostaje nieaktywne podczas sprawdzania możliwości i jest udostępniane tylko wtedy, gdy bezpieczny kontekst oraz `immersive-vr` są obsługiwane. Brak WebXR nie blokuje pozostałych doświadczeń. Każdy runtime uruchamia się dopiero po wyborze.

PL/EN jest bieżącą funkcją produktu, nie przyszłą strategią migracji. Entry shell przekazuje wybrane locale do prezentacji, a współdzielone rekordy portfolio i ograniczone właściciele copy rozwiązują właściwy wariant językowy.

---

# 5. Model interakcji

Po wyborze języka i doświadczenia entry shell uruchamia wskazany runtime. Poniższy przebieg opisuje zachowany model interakcji Experience 3D, a nie wejście całego produktu:

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

# 5A. Layered Portfolio Reception Model / Trójwarstwowy model odbioru portfolio

To jest roboczy model projektowy, który porządkuje sposób odbioru portfolio na trzech głębokościach doświadczenia.

Nie są to trzy osobne strony, tylko trzy warstwy jednego przepływu:

* scena startowa przyciąga,
* panel wyjaśnia,
* case study pogłębia i potwierdza wartość.

## 5A.1. Warstwa Byka / Wagi — piękny, spokojny pierwszy kontakt

Ta warstwa odpowiada na pytanie:

> Czy chcę tu zostać?

Jej celem jest zbudowanie zaufania przez estetykę i jakość pierwszego kontaktu:

* proporcja,
* oddech,
* jakość,
* kilka mocnych obrazów,
* spokojna scena,
* zaufanie przez estetykę,
* brak nadmiaru tekstu na wejściu.

W implementacji oznacza to:

* atmospheric 3D scene,
* central symbolic object,
* soft light,
* controlled motion,
* minimal text,
* clear visual hierarchy,
* five calm portfolio gates.

## 5A.2. Warstwa Skorpiona / 3 domu — głębsze case studies

Ta warstwa odpowiada na pytanie:

> Jak ta osoba myśli?

Jej celem jest zejście pod powierzchnię i pokazanie procesu:

* proces,
* symbolika,
* mechanika,
* transformacja projektu,
* zejście pod powierzchnię,
* pokazanie sposobu myślenia,
* pokazanie tego, jak chaos zamienia się w system.

W implementacji oznacza to:

* overlay panels after clicking portfolio gates,
* symbolic project summaries,
* short process narratives,
* transformation diagrams,
* links to deeper case studies,
* case studies prowadzone przez problem, proces, decyzje i przemianę projektu.

## 5A.3. Warstwa Panny / 2 domu — konkret i wartość

Ta warstwa odpowiada na pytanie:

> Co dokładnie zostało zrobione i dlaczego to ma wartość?

Jej celem jest pokazanie dowiezionego konkretu i użyteczności zawodowej:

* co realnie zostało zrobione,
* jakie narzędzia zostały użyte,
* jaki problem został rozwiązany,
* jaka jest praktyczna wartość,
* co zostało dowiezione,
* jak projekt może być użyteczny zawodowo.

W implementacji oznacza to, że każde case study powinno zawierać:

* problem solved,
* role and responsibilities,
* tools used,
* technical stack,
* decisions made,
* artifacts delivered,
* practical value,
* next possible development.

## 5A.4. Zasada projektowa przepływu

Portfolio should move through three depths of reception:

```text
Beauty → Depth → Concrete Value
```

or in Polish:

```text
Piękno → Głębia → Konkret
```

Te trzy poziomy nie działają jako osobne byty, tylko jako płynna sekwencja jednego doświadczenia:

* Start scene attracts.
* Panel explains.
* Case study deepens and proves value.

Formuła robocza:

> Z chaosu robię przestrzeń.
> Z przestrzeni robię proces.
> Z procesu robię narzędzie.
> Z narzędzia robię wartość.

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

# 11–16. Zrealizowany kształt produktu

Pierwotne checklisty MVP, startowego stacku, struktury repozytorium, publikacji i etapów budowy zostały wykonane i nie stanowią aktywnego backlogu. Obecny produkt ma:

- działającą lekką warstwę wejściową z wyborem PL/EN;
- trzy wdrożone doświadczenia: Classic 2D, Experience 3D i Orange Monkey VR;
- wspólne tożsamości treści portfolio z lokalizowanymi prezentacjami;
- scenę 3D oraz niezależny runtime WebXR ładowane dopiero po wyborze;
- czytelne panele i case studies podtrzymujące warstwowy model odbioru.

Dalsze zmiany wymagają osobnych, aktualnych decyzji produktowych lub modeli technicznych. Ten dokument nie rekonstruuje historycznego planu implementacji ani nie tworzy nowych zadań.

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

# 18–19. Granica aktualnych decyzji

Pierwszy prompt implementacyjny i lista decyzji sprzed prototypu są zakończonym kontekstem historycznym, a nie instrukcją dla CURRENT. Aktualne fakty produktu to wdrożone trzy doświadczenia i kompletne PL/EN na wspieranych powierzchniach. Nadal otwarte mogą być wyłącznie przyszłe decyzje redakcyjne dotyczące nadrzędnej nazwy lub haseł; nie podważają one istniejących nazw trybów ani lokalizacji runtime.

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
