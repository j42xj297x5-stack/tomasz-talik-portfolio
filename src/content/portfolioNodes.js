export const portfolioNodes = [
  {
    id: 'ai-guide',
    title: 'AI Guide',
    shortLabel: 'Oswajanie AI',
    modelPath: '/glb/glyph_1.glb',
    modelKind: 'glyph',
    plaqueModelPath: '/glb/plaque_ai_guide.glb',
    plaqueVisual: {
      scale: 1,
      position: [0, 0, 0],
      frontYawOffset: 0,
      plaqueGlowColor: '#72D6B0'
    },
    ornamentPath: '/png/ai_guide_ornament.png',
    translations: {
      pl: {
        eyebrow: 'Oswajanie AI',
        leadText: 'Pomagam ludziom oswoić AI tam, gdzie technologia spotyka lęk, chaos i poczucie, że wszystko zmienia się zbyt szybko.',
        bodyText: `Nie da się znać każdego narzędzia ani nadążać za każdą nową możliwością. Można jednak nauczyć się sposobu pracy, który pozostaje użyteczny także wtedy, gdy narzędzia się zmieniają.

Pokazuję, jak nazwać cel, przygotować właściwy kontekst, rozmawiać z AI, oceniać jego odpowiedzi i zamieniać luźną potrzebę w świadomy, powtarzalny proces. Czasem wystarczy opisać, co naprawdę chce się przekazać, określić ton, poprosić o kilka wariantów i dokonać własnego wyboru.

Doświadczenie zdobyte w wielu branżach, zawodach i środowiskach pomaga mi rozpoznawać, gdzie człowiek traci sprawczość: czy przeszkodą jest samo narzędzie, brak wiedzy o jego możliwościach, trudność w sformułowaniu intencji, czy niewyrażona jeszcze wizja.

Nie uczę bezmyślnego korzystania z technologii. Pomagam budować relację, w której człowiek nadal wyznacza kierunek, podejmuje decyzje i rozumie proces, a AI pomaga mu szybciej próbować, porównywać, tworzyć i rozwijać własne możliwości.`,
        closingText: 'Z chaosu narzędzi powstaje spokojny proces.'
      },
      en: {
        eyebrow: 'Making AI approachable',
        leadText: 'I help people become comfortable with AI where technology meets fear, chaos, and the feeling that everything is changing too quickly.',
        bodyText: `No one can know every tool or keep up with every new possibility. It is possible, however, to learn a way of working that remains useful even as the tools continue to change.

I show people how to define their goal, provide the right context, communicate with AI, evaluate its responses, and turn a vague need into a deliberate, repeatable process. Sometimes it is enough to describe what truly needs to be communicated, define the tone, ask for several alternatives, and make an informed choice.

My experience across many industries, professions, and working environments helps me recognize where a person loses their sense of agency: whether the obstacle is the tool itself, limited knowledge of its possibilities, difficulty expressing an intention, or a vision that has not yet found its form.

I do not teach people to use technology without reflection. I help build a relationship in which the human still sets the direction, makes decisions, and understands the process, while AI helps them experiment, compare, create, and develop their own capabilities more quickly.`,
        closingText: 'From the chaos of tools, a calm process emerges.'
      }
    }
  },
  {
    id: 'spotify-digger',
    title: 'DIG Engine',
    shortLabel: 'DIG Engine',
    eyebrow: 'Music Data Resonance',
    subtitle: 'Music Data Resonance',
    modelPath: '/glb/glyph_4.glb',
    modelKind: 'glyph',
    plaqueModelPath: '/glb/plaque_dig_engine.glb',
    plaqueVisual: {
      scale: 1,
      position: [0, 0, 0],
      frontYawOffset: 0,
      plaqueGlowColor: '#5FB8FF'
    },
    ornamentPath: '/png/digger_ornament.png',
    demoGifPath: '/gif/DIG_engine.gif',
    demoGifAlt: 'Animated DIG Engine interface demo',
    draftText: 'DIG Engine to lokalny system eksploracji muzyki, który łączy workflow, API, metadane, bazę SQLite i intuicję słuchacza.',
    bodyText: `DIG Engine to lokalny system eksploracji muzyki, który łączy workflow, API, metadane, bazę SQLite i intuicję słuchacza.

Nie jest prostym generatorem playlist. Działa jak laboratorium danych muzycznych: zbiera kandydatów, wzbogaca metadane, porównuje źródła, pozwala filtrować wyniki i zamienia luźne tropy w gotowy rezultat.

Projekt pokazuje moje podejście do narzędzi użytkowych: dane mają być czytelne, workflow zrozumiały, a automatyzacja ma wspierać decyzje człowieka — nie zasłaniać sensu pracy.`,
    closingText: 'Workflow. API. GUI. SQLite. Discogs. Last.fm. Automatyzacja playlist. Projektowanie procesu z AI.',
    caseStudy: {
      title: 'DIG Engine — Music Data Resonance',
      heading: 'Od chaosu muzycznego do systemu eksploracji danych',
      intro: [
        'DIG Engine powstał jako lokalne narzędzie do eksploracji muzyki, ale szybko przerósł prosty generator playlist. Punktem wyjścia była potrzeba uporządkowania dużej ilości muzycznych tropów: artystów, albumów, tagów, historii odsłuchów, wydań, playlist i zewnętrznych źródeł danych.',
        'Projekt odpowiada na praktyczne pytanie: jak zamienić intuicyjne słuchanie muzyki w czytelny, powtarzalny i rozwijalny proces?'
      ],
      problem: 'Zamiast polegać wyłącznie na automatycznych rekomendacjach, potraktowałem muzykę jak przestrzeń danych. Luźne tropy, historia odsłuchów, metadane i playlisty potrzebowały systemu, który pozwala je porządkować, porównywać i rozwijać bez odbierania słuchaczowi kontroli.',
      solution: 'DIG Engine łączy lokalne workflow, API serwisów muzycznych, dane Last.fm, bazę Discogs, własną bazę SQLite oraz warstwę projektowaną jako DNA użytkownika — pamięć preferencji, decyzji i relacji między trackami, artystami, tagami i playlistami.',
      processSections: [
        {
          title: 'Stabilizacja pipeline’u',
          text: 'Najpierw powstał deterministyczny przepływ pracy: indeksowanie, budowanie puli kandydatów, selekcja, eksport i opcjonalne zastosowanie wyników w playlistach.'
        },
        {
          title: 'Warstwa danych i metadanych',
          text: 'Do systemu została dołączona lokalna baza Discogs Offline oparta o SQLite i FTS5. Dzięki temu DIG Engine może lokalnie przeszukiwać wydania, artystów, labele i metadane, bez opierania całego procesu wyłącznie na requestach online.'
        },
        {
          title: 'GUI jako cienka warstwa nad backendem',
          text: 'Interfejs nie zastępuje logiki systemu. GUI czyta kontrakty runu, pokazuje postęp, wyniki i statusy, ale źródłem prawdy pozostaje backend oraz artefakty runtime.'
        },
        {
          title: 'Workflow Composer',
          text: 'Powstała warstwa komponowania presetów. Użytkownik może składać proces z bloków takich jak input CSV, Last.fm query, Spotify cross, apply playlist czy export CSV. To przesuwa projekt z poziomu pojedynczych skryptów w stronę narzędzia operatorskiego.'
        },
        {
          title: 'Dokumentacja i granice odpowiedzialności',
          text: 'Duża część pracy polegała na dokumentowaniu architektury, mapowaniu przepływów danych i pilnowaniu granic między modułami. Szczególnie ważne było rozdzielenie bieżącego stanu runu od długoterminowej pamięci DNA oraz oddzielenie runtime od przyszłych modułów AI.'
        }
      ],
      aiWorkflow: [
        'AI nie było w tym projekcie magicznym generatorem kodu, ale partnerem w procesie projektowym. ChatGPT pomagał analizować pomysły, porządkować architekturę, zadawać pytania decyzyjne, przygotowywać prompty dla Codexa i oceniać ryzyka przed implementacją.',
        'Codex wykonywał zawężone zadania implementacyjne: funkcje, refaktoryzacje, poprawki GUI, aktualizacje dokumentacji, audyty i testy. Po każdym kroku wracałem do analizy: co zostało zmienione, czy nie naruszono granic architektury i co wymaga następnego kroku.'
      ],
      result: 'DIG Engine pokazuje moje podejście do tworzenia oprogramowania z AI: nie chodzi o automatyczne generowanie kodu, ale o budowanie procesu, w którym człowiek prowadzi projekt, a AI pomaga szybciej analizować, wdrażać, porządkować i rozwijać złożony system.',
      nextSteps: 'W przyszłości DIG Engine może rozwinąć się w system bardziej inteligentnej eksploracji muzyki: z pełniejszą pamięcią DNA, scoringiem kandydatów, wyszukiwaniem wspieranym przez modele AI i lepszym wyjaśnianiem, dlaczego dany utwór, artysta lub wydanie pojawia się w konkretnym kontekście.',
      gallery: [
        {
          src: '/png/dig_engine-screenshot_01.png',
          title: 'Progress',
          alt: 'Progress view in DIG Engine',
          caption: 'Okno pokazuje aktualny stan działania diggera: wykonane i bieżące zadania, kroki wymagające decyzji użytkownika oraz pola wejściowe, np. plik z utworami bazowymi, nazwę playlisty albo zatwierdzenie wyborów w trakcie procesu.'
        },
        {
          src: '/png/dig_engine-screenshot_02.png',
          title: 'Discogs Browser',
          alt: 'Discogs Browser in DIG Engine',
          caption: 'Panel pracy z lokalną bazą Discogs. Umożliwia ręczne przeszukiwanie bazy po słowach kluczowych, takich jak wykonawca lub album, zawężanie wyników według lat i kraju wydania oraz tworzenie plików preseed.csv używanych później w modułach wyszukiwania podobnych artystów i utworów.'
        },
        {
          src: '/png/dig_engine-screenshot_03.png',
          title: 'Workflow Composer',
          alt: 'Workflow Composer in DIG Engine',
          caption: 'Miejsce budowania własnych workflowów z dostępnych modułów. Pozwala zmieniać parametry filtrowania, kolejność działania elementów diggera, generować plik CSV albo automatycznie opublikować playlistę w Spotify.'
        },
        {
          src: '/png/dig_engine-screenshot_04.png',
          title: 'Results',
          alt: 'Results view in DIG Engine',
          caption: 'Okno podsumowujące wynik uruchomionego procesu: czas startu, użyte pliki i źródła danych, liczbę odnalezionych utworów, status publikacji playlisty lub zapisu pliku oraz czas pracy diggera.'
        },
        {
          src: '/png/dig_engine-screenshot_05.png',
          title: 'Settings',
          alt: 'Settings view in DIG Engine',
          caption: 'Centrum konfiguracji aplikacji: zapisywanie i wczytywanie plików konfiguracyjnych, budowanie i przebudowa lokalnej bazy Discogs/FTS, ustawianie lokalizacji danych, tworzenie bazy DNA oraz konfiguracja API używanych serwisów.'
        },
        {
          src: '/png/dig_engine-screenshot_06.png',
          title: 'Spotify output',
          alt: 'Spotify playlist created by DIG Engine',
          caption: 'Przykładowa playlista w aplikacji Spotify, utworzona automatycznie przez DIG Engine jako rezultat zakończonego workflowu.'
        }
      ]
    }
  },
  {
    id: 'haiku-cosmos',
    title: 'Haiku Cosmos',
    shortLabel: 'INTERACTIVE WORLD SYSTEM',
    eyebrow: 'INTERACTIVE WORLD SYSTEM',
    modelPath: '/glb/glyph_5.glb',
    modelKind: 'glyph',
    plaqueModelPath: '/glb/plaque_haiku_cosmos.glb',
    plaqueVisual: {
      scale: 1,
      position: [0, 0, 0],
      frontYawOffset: 0,
      plaqueGlowColor: '#7B8DFF'
    },
    ornamentPath: '/png/haiku_cosmos_ornament.png',
    demoGifPath: '/gif/Haiku_Cosmos.gif',
    demoGifAlt: 'Animowane demo Haiku Cosmos prezentujące świat gry i narzędzia debugowe',
    draftText: 'Gra, interfejs i dokumentacja jako jeden kosmos zależności.',
    leadText: 'Gra, interfejs i dokumentacja jako jeden kosmos zależności.',
    bodyText: `Haiku Cosmos to autorski projekt kontemplacyjnej gry-systemu, w której decyzje gracza prowadzą do przemian żywego, trójwymiarowego świata.

Świat renderowany w Three.js jest żywym kosmosem brył, materiałów, tekstur i światła. Meteory zderzają się, łączą i przechodzą w kolejne stadia, a masa, kolor, ruch i relacje między obiektami budują czytelny język przemiany.

Rdzeniem projektu jest relacja między decyzją gracza a zmianą świata. Gracz buduje sekwencje kart, zdobywa Punkty Rezonansu, konfiguruje SUB-META i wpływa na zachowanie obiektów przez PRG — Player Reaction Field.

Projekt łączy game design, system design, UI/UX i technical art direction z modularną architekturą runtime’u, pipeline’em assetów 3D oraz narzędziami debugowymi.

Równolegle rozwijam dokumentację i pracuję z AI/Codexem jako narzędziem produkcyjnym. Dokumenty kanoniczne, mapy zależności, specyfikacje i checklisty pozwalają utrzymywać wspólny język mechaniki, obrazu, kodu i dokumentacji.

Haiku Cosmos nie jest wyłącznie koncepcją. To działający interaktywny prototyp, w którym wizja świata została przeprowadzona przez projektowanie systemów, implementację, walidację i deployment.`,
    closingText: 'Haiku Cosmos pokazuje, że potrafię prowadzić złożony projekt kreatywno-techniczny przez wiele warstw naraz — od intuicyjnej wizji świata, przez projektowanie systemów i oprawy wizualnej, aż po działający interaktywny prototyp.',
    projectLinks: [
      {
        kind: 'demo',
        label: 'DEMO',
        url: 'https://j42xj297x5-stack.github.io/Haiku-Cosmos'
      },
      {
        kind: 'repository',
        label: 'REPOZYTORIUM',
        url: 'https://github.com/j42xj297x5-stack/Haiku-Cosmos'
      }
    ],
    caseStudy: {
      title: 'Haiku Cosmos — Interactive World System',
      heading: 'Gra-system o relacji między decyzją gracza a przemianą świata',
      intro: [
        'Haiku Cosmos to autorska, kontemplacyjna gra-system. Zamiast prowadzić gracza przez klasyczną fabułę lub listę zadań, pozwala mu obserwować i kształtować żywy kosmos trójwymiarowych obiektów.',
        'Meteory poruszają się, zderzają i tworzą większe ciała. Masa, kolor, ruch oraz relacje między obiektami mają znaczenie mechaniczne i wizualne, dlatego przemiana świata jest jednocześnie informacją, konsekwencją i nagrodą.',
        'Świat powstaje w Three.js z rzeczywistych brył 3D, materiałów, tekstur, map emisji i oświetlenia. Logika gry pozostaje rozdzielona od renderowania, dzięki czemu rozwój obrazu nie wymaga przepisywania zasad ruchu, kolizji ani progresji.',
        'Rdzeniem doświadczenia jest relacja decyzji gracza ze zmianą świata. Karty R1–R4, Punkty Rezonansu (RP), SUB-META i PRG — Player Reaction Field — tworzą wspólny system wpływu, ryzyka i długofalowej konfiguracji.',
        'Prototyp i dokumentacja projektowa rozwijają się równolegle. Kanon mechanik, mapy zależności, specyfikacje UI i runtime’u oraz instrukcje dla Codexa są częścią tego samego procesu produkcyjnego.'
      ],
      problem: `Największym wyzwaniem było zaprojektowanie świata, który można nie tylko oglądać, lecz także świadomie kształtować, bez sprowadzania decyzji gracza do klasycznej listy zadań.

Projekt wymagał odpowiedzi na pytania:

- Jak połączyć ruch, kolizje, kolory, sekwencje i ekonomię w jeden czytelny system?
- Jak pokazać, że decyzja gracza naprawdę zmienia świat?
- Jak zastąpić umowne kształty rzeczywistymi bryłami 3D bez utraty czytelności mechaniki?
- Jak pogodzić modele o różnych siatkach UV z rodzinami zgodnych tekstur i map emisji?
- Jak skonfigurować renderer, światło i materiały, aby obiekty zachowały własny styl wizualny, a nie wyglądały jak generyczne sci-fi?
- Jak zaprojektować UI, które przekazuje stan, ale nie zasłania świata?
- Jak rozdzielić mechanikę od renderowania i zachować możliwość szybkiego debugowania?
- Jak pracować z AI i Codexem tak, aby przyspieszać produkcję, nie rozbijając architektury na przypadkowe patche?
- Jak sprawić, żeby dokumentacja była realnym narzędziem produkcji, a nie opisem dopisywanym po fakcie?

Problem był więc jednocześnie projektowy, wizualny, techniczny i organizacyjny: wszystkie warstwy musiały mówić tym samym językiem.`,
      solution: `Rozwiązaniem było potraktowanie gry jako procesu rezonansu. Świat pozostaje aktywny i zmienia się niezależnie, lecz decyzje gracza wpływają na kierunek i jakość jego przemian.

Zderzenia zwiększają masę obiektów i prowadzą je przez kolejne stadia. Gracz oddziałuje na ten proces przez pole reakcji, karty i konfiguracje zachowane w SUB-META.

Karty tworzą język progresji:

- R1 — Wejście: podstawowa karta możliwa do aktywacji w trakcie RUN.
- R2 — Ustabilizowanie: karta relacyjna, łącząca elementy systemu.
- R3 — Uciszenie: karta stabilizacji przeznaczona pod głębsze strategie.
- R4 — Jedność: rzadka, pełna sekwencja integrująca strukturę.

Gracz może wcześniej aktywować lub zebrać kartę albo kontynuować sekwencję, ryzykując jej przerwanie. Ekonomia Punktów Rezonansu nie nagradza przypadku: wynika z koncentracji, ciągłości i świadomej decyzji.`,
      processSections: [
        {
          title: 'Moja rola',
          text: `Prowadzę projekt od koncepcji do działającego prototypu, łącząc odpowiedzialności kreatywne, systemowe, techniczne i produkcyjne.

- Game design i system design — projekt progresji obiektów, kart R1–R4, sekwencji, ryzyka, ekonomii RP, SUB-META i PRG.
- Creative i technical direction — utrzymywanie wizji świata oraz granic między mechaniką, rendererem, UI i assetami.
- Projektowanie świata 3D — kierunek brył, materiałów, tekstur, emisji, światła i czytelności obiektów.
- UI/UX design — RUN HUD, SUB-META, decyzje sekwencyjne i informacja zwrotna.
- Documentation architecture — dokumenty kanoniczne, mapy zależności, specyfikacje i checkpointy.
- AI-assisted production — przekładanie wizji na precyzyjne zadania dla ChatGPT i Codexa oraz kontrola rezultatów.
- Debug i walidacja — narzędzia diagnostyczne, testowanie integracji i ochrona istniejącej mechaniki.

Nazwy ról najlepiej opisujące zakres odpowiedzialności to: creative technical designer, game systems designer, technical art director, project integrator i AI workflow lead.`
        },
        {
          title: 'Żywy świat i progresja obiektów',
          text: `Świat nie jest statycznym tłem. Meteory poruszają się, zderzają i zwiększają masę, a następnie przechodzą w kolejne stadia: asteroidy, większe ciała i późniejsze formy kosmiczne.

Każda przemiana łączy dane mechaniczne z czytelną zmianą obrazu. Masa wpływa na skalę i zachowanie, kolor niesie informację o stanie, ruch ujawnia relacje, a zderzenie staje się zdarzeniem widocznym zarówno w fizyce, jak i w materiale obiektu.

Dzięki temu gracz obserwuje proces, a nie serię odizolowanych efektów. Kosmos ma własną dynamikę, lecz pozostaje podatny na świadome oddziaływanie.`
        },
        {
          title: 'Świat 3D i system brył',
          text: `Pierwsze wersje świata używały kształtów symbolicznych. Kolejnym krokiem było przejście do rzeczywistych modeli renderowanych w Three.js, bez przenoszenia zasad mechaniki do warstwy wizualnej.

Modele pochodzą z różnych rodzin i mają różne siatki UV. Jedna przypadkowa tekstura nie może być poprawnie nakładana na każdą bryłę, dlatego assety zostały pogrupowane w rodziny: model korzysta ze zgodnego zestawu tekstur i map emisji przygotowanych dla jego UV.

Warianty są losowane w sposób kontrolowany wewnątrz kompatybilnej rodziny. Kolor nie jest jedynie tintem na powierzchni — ma materialne znaczenie i współpracuje z teksturą, emisją oraz światłem.

Modele pozostają lekkie, aby wiele obiektów mogło działać jednocześnie w przeglądarce. Dane mechaniczne — masa, typ, etap, prędkość i stan — są oddzielone od reprezentacji renderera. Dzięki temu ta sama logika może sterować różnymi bryłami, materiałami i wariantami bez naruszania reguł gry.`
        },
        {
          title: 'System kart i sekwencji',
          text: `Karty R1–R4 są językiem decyzji oraz progresji. Nie są wyłącznie nagrodami: reprezentują stany, relacje i możliwości konfiguracji świata.

R1 otwiera sekwencję w RUN. R2 buduje relację, R3 stabilizuje, a R4 integruje pełną strukturę. Gracz może zabezpieczyć wcześniejszy rezultat albo kontynuować, licząc na bardziej wartościową kartę i akceptując ryzyko przerwania ciągu.

Sekwencje łączą obserwację świata, timing, kolor i decyzję. Informacja zwrotna musi być czytelna bez odrywania uwagi od kosmosu.`
        },
        {
          title: 'Ekonomia Punktów Rezonansu',
          text: `RP — Resonance Points — są miarą jakości działania, a nie losową walutą. Powstają z trafień, koncentracji, ciągłości sekwencji i podejmowanego ryzyka.

Gracz zdobywa RP podczas RUN, a wykorzystuje je do konfiguracji, slotów i wzmacniania kart w SUB-META. Ekonomia spina bieżące działanie z długofalowym planowaniem i sprawia, że ostrożne zakończenie sekwencji oraz ryzykowna kontynuacja mają realną wartość.`
        },
        {
          title: 'Pył i materialna pamięć zderzeń',
          text: `Zderzenie nie kończy się na zmianie liczby lub krótkiej animacji. Pozostawia harmoniczny pył — materialną pamięć zdarzenia, która wizualizuje energię, kolor i historię kontaktu obiektów.

Pył pomaga czytać dynamikę kosmosu i wiąże fizykę z atmosferą. Jest śladem procesu: pokazuje, gdzie świat uległ zmianie, wzmacnia rytm kolejnych zdarzeń i buduje ciągłość wizualną bez dodatkowych komunikatów tekstowych.`
        },
        {
          title: 'SUB-META',
          text: `SUB-META jest warstwą konfiguracji dostępną w relacji z trwającym RUN. Nie działa jak zwykłe inventory: zdobyte karty stają się w nim trybami działania gracza i świata.

Panel porządkuje konfigurację w gałęziach dotyczących reakcji świata oraz PRG. Pozwala osadzać i wzmacniać karty, planować zależności i zachowywać pamięć decyzji. Jest jednocześnie interfejsem strategicznym i czytelną mapą systemu.`
        },
        {
          title: 'PRG — Player Reaction Field',
          text: `PRG jest polem reakcji gracza i warstwą pomiędzy inputem a zachowaniem kosmosu. Określa zasięg oddziaływania, przyciąganie lub odpychanie, zmianę prędkości oraz klasy obiektów objęte wpływem.

Konfiguracja PRG sprawia, że sterowanie nie jest tylko ruchem kursora. Gracz kształtuje warunki, w których dochodzi do spotkań, kolizji i progresji, a świat odpowiada na jego decyzje w sposób widoczny i systemowy.`
        },
        {
          title: 'UI i doświadczenie gracza',
          text: `UI zostało zaprojektowane jako część doświadczenia, nie jako ciężka nakładka zasłaniająca świat. RUN HUD pokazuje RP, karty, sekwencje i aktywne stany, a SUB-META udostępnia głębszą konfigurację.

Kolor, puls, halo, rytm i stan ramek przejmują część informacji, która w tradycyjnym interfejsie byłaby tekstem. Nagłówki i komunikaty pozostają czytelne, ale wizualny język systemu utrzymuje uwagę na świecie.

Responsywne skalowanie pozwala zachować hierarchię na desktopie i urządzeniach mobilnych.`
        },
        {
          title: 'Runtime i architektura techniczna',
          text: `Three.js jest obecnie głównym rendererem świata. Canvas2D pozostaje pomocniczą ścieżką testową i debugową, przydatną do walidowania zachowania bez kosztu pełnej warstwy wizualnej.

HUD i SUB-META są osobnymi warstwami interfejsu, niezależnymi od sceny Three.js. Assety są ładowane przez wspólny system, a modele i tekstury są ponownie wykorzystywane zamiast tworzenia osobnych kopii dla każdego obiektu.

Mechanika, fizyka, input i dane obiektów nie zależą od konkretnej reprezentacji renderera. Dzięki temu rozwój renderowania, materiałów i światła nie wymaga przepisywania mechaniki.`
        },
        {
          title: 'Content Data System',
          text: `Treści i parametry świata są przechowywane jako dane, a nie rozproszone między warstwami renderera i UI. Definicje obiektów, stadiów, kart oraz opisów mogą być odczytywane przez różne moduły bez powielania źródeł prawdy.

To samo podejście obsługuje dynamiczne opisy i haiku. Warstwa prezentacji wybiera treść na podstawie stanu systemu, ale nie przejmuje odpowiedzialności za reguły gry. Ułatwia to walidację, rozbudowę i utrzymywanie zgodności między kodem a dokumentacją.`
        },
        {
          title: 'Dokumentacja jako część systemu',
          text: `Dokumentacja nie została dopisana po implementacji. Jest narzędziem prowadzenia projektu: obejmuje mapę projektu i zależności, dokumenty kanoniczne mechanik, specyfikacje UI i techniczne, visual direction, roadmapę, snapshoty oraz instrukcje dla Codexa.

Każdy dokument ma określony zakres i status. Decyzje są zapisywane tak, aby kolejne zadania mogły odwoływać się do aktualnego kanonu zamiast odtwarzać intencję z kodu.

Pozwala to utrzymywać wspólny język mechaniki, obrazu, kodu i dokumentacji oraz przekazywać kontekst ludziom i narzędziom AI.`
        },
        {
          title: 'Visual pipeline',
          text: `Kierunek wizualny określam jako rytualny minimalizm kosmiczny: połączenie czytelności gameplayowej, kontemplacyjnej przestrzeni, geometrii, subtelnej sakralności i rezonansu.

Pipeline obejmuje modele GLB, lekkie bryły, rodziny tekstur dopasowane do UV, mapy emisji, materiały i oświetlenie. Referencje rastrowe, SVG, modularne ramki oraz ornamenty są przygotowywane według wspólnych standardów.

Celem nie jest dekoracja sama w sobie, lecz obraz, który komunikuje stan świata i zachowuje własny charakter zamiast powielać typowy interfejs sci-fi lub fantasy.`
        },
        {
          title: 'AI workflow',
          text: `AI jest narzędziem produkcyjnym, a nie autonomicznym autorem projektu. ChatGPT pomaga analizować koncepcje, porządkować decyzje, wykrywać luki i przygotowywać precyzyjne zadania. Codex realizuje ograniczone zakresy implementacyjne, aktualizacje dokumentacji, audyty i testy.

Każde zadanie otrzymuje kontekst źródłowy, granice zmian, zakazy regresji, kryteria akceptacji i listę kontroli. Po implementacji sprawdzam diff, testy, zgodność z kanonem i wpływ na sąsiednie systemy.

Taki workflow pozwala zwiększać tempo bez oddawania odpowiedzialności za architekturę. Moją rolą jest tłumaczenie wizji na instrukcje wykonawcze i pilnowanie, aby mechanika, obraz, kod oraz dokumentacja nadal tworzyły jeden system.`
        }
      ],
      result: `Rezultatem jest publicznie dostępny prototyp przeglądarkowy obejmujący:

- świat renderowany w Three.js,
- bryły meteorów i asteroid oraz modele GLB,
- rodziny tekstur i map emisji zgodne z assetami,
- wspólne ładowanie i ponowne wykorzystywanie modeli oraz tekstur,
- ruch, kolizje, masę i progresję ciał,
- karty R1–R4 i system sekwencji,
- ekonomię Punktów Rezonansu,
- PRG — Player Reaction Field,
- harmoniczny pył jako pamięć zderzeń,
- RUN HUD i SUB-META,
- dynamiczne opisy i haiku,
- debug tooling oraz pomocniczą ścieżkę Canvas2D,
- responsywne skalowanie UI,
- dokumentację projektową i techniczną,
- build oraz deployment na GitHub Pages.

Projekt pokazuje kompetencje w game designie, system designie, Three.js, pipeline’ie assetów 3D, UI/UX, architekturze runtime’u, debugowaniu, dokumentacji, technical art direction i produkcji wspieranej przez AI. Pokazuje też zdolność prowadzenia złożonej wizji przez wiele zależnych warstw aż do działającego, wdrożonego prototypu.`
    },
    featureLabel: 'Skills / scope:',
    featureText: 'game design · system design · Three.js · 3D asset pipeline · UI/UX · runtime architecture · debug tooling · documentation · technical art direction · AI-assisted production'
  },
  {
    id: 'creative-ai',
    title: 'Creative AI',
    shortLabel: 'Creative AI',
    modelPath: '/glb/glyph_2.glb',
    modelKind: 'glyph',
    plaqueModelPath: '/glb/plaque_creative_ai.glb',
    plaqueVisual: {
      scale: 1,
      position: [0, 0, 0],
      frontYawOffset: 0,
      plaqueGlowColor: '#FF9C47'
    },
    ornamentPath: '/png/creative_ai_ornament.png',
    translations: {
      pl: {
        eyebrow: 'Tworzenie z AI',
        leadText: 'Tworzę z AI we wszystkich obszarach dostępnych w domenie cyfrowej.',
        bodyText: `Zaczynałem od muzyki, dźwięku i grafiki artystycznej. Z czasem przeszedłem do grafiki użytkowej, fotoedycji, projektowania materiałów wizualnych, tworzenia treści, programowania oraz generowania teksturowanych obiektów 3D.

AI jest dla mnie czymś więcej niż narzędziem. To żywy szkicownik, laboratorium i przestrzeń twórczego sprzężenia zwrotnego. To, co powstaje na styku człowieka i maszyny, często prowadzi mnie dalej, niż początkowo planowałem. Obraz, dźwięk, fragment tekstu, rozwiązanie w kodzie albo nieoczekiwany rezultat mogą stać się początkiem kolejnego pomysłu, nowego kierunku lub całego projektu.

Nauczyłem się zostawiać AI swobodę tam, gdzie efekt ma być świeży, nieoczywisty i niezależny od zamkniętej wizji. Nie próbuję kontrolować każdego szczegółu. Pytam, próbuję, doświadczam, wskazuję kierunek, zatrzymuję się, sprawdzam i pozwalam, aby proces również mnie zaskakiwał. Dzięki temu odkrywam nowe miejsca, obszary i możliwości, których wcześniej nie potrafiłbym świadomie zaprojektować.

Kiedy dokładnie wiem, jaki rezultat chcę osiągnąć, próbuję tyle razy, ile potrzeba. Poprawiam prompty, zmieniam narzędzia, łączę techniki i szukam właściwej formy. Nie każda droga prowadzi do oczekiwanego efektu. Czasem ujawnia własne ograniczenia — wtedy zmieniam ścieżkę, ale nie porzucam kierunku.

AI nie zastępuje twórcy. Poszerza przestrzeń, w której twórca może pytać, odkrywać, eksperymentować i nadawać znaczenie.`,
        closingText: 'Kierunek pozostaje ten sam: kreatywność, rozwój, tworzenie i dzielenie się.'
      },
      en: {
        eyebrow: 'Creating with AI',
        leadText: 'I create with AI across every area available in the digital domain.',
        bodyText: `I began with music, sound, and artistic graphics. Over time, I moved into applied visual design, photo editing, visual communication, content creation, programming, and generating textured 3D objects.

AI is more than a tool to me. It is a living sketchbook, a laboratory, and a space for creative feedback. What emerges at the meeting point between human and machine often takes me beyond what I originally planned. An image, a sound, a fragment of text, a solution in code, or an unexpected result can become the beginning of another idea, a new direction, or an entire project.

I have learned to give AI freedom wherever the result should feel fresh, unexpected, and unconstrained by a fixed artistic vision. I do not try to control every detail. I ask, experiment, experience, point the way, pause, examine, and allow the process to surprise me. This is how I discover new places, fields, and possibilities that I would not have been able to design consciously in advance.

When I know exactly what result I want to achieve, I try as many times as necessary. I refine prompts, change tools, combine techniques, and search for the right form. Not every path leads to the intended result. Sometimes it reveals its own limitations — then I change the path without abandoning the direction.

AI does not replace the creator. It expands the space in which the creator can ask questions, discover, experiment, and create meaning.`,
        closingText: 'The direction remains the same: creativity, growth, making, and sharing.'
      }
    }
  },
  {
    id: 'ethics-life-protection',
    title: 'Ethics / Life Protection',
    shortLabel: 'Ethics / Life',
    modelPath: '/glb/glyph_3.glb',
    modelKind: 'glyph',
    plaqueModelPath: '/glb/plaque_ethics.glb',
    plaqueVisual: {
      scale: 1,
      position: [0, 0, 0],
      frontYawOffset: 0,
      plaqueGlowColor: '#E7D6A3'
    },
    ornamentPath: '/png/ai_ethics_ornament.png',
    translations: {
      pl: {
        eyebrow: 'Ziemia',
        leadText: 'AI nie jest tylko narzędziem przyspieszania pracy.',
        bodyText: `Jest siłą, która wzmacnia intencje człowieka — zarówno te, które służą życiu, jak i te, które prowadzą do krzywdy.

Dlatego technologia potrzebuje fundamentu:

uważności, odpowiedzialności, edukacji i troski o życie.

AI może być narzędziem służby, nie dominacji.

Może wzmacniać to, co pomaga nam chronić siebie nawzajem: miłość, współczucie, empatię, przebaczenie, cierpliwość i zdolność nieodpowiadania krzywdą na krzywdę.

Rozwój nie powinien oznaczać wyłącznie większej mocy.

Powinien także zmniejszać cierpienie, poszerzać zrozumienie i pomagać nam troszczyć się o ludzi, inne istoty oraz świat, którego jesteśmy częścią.`,
        closingText: 'Transformacja technologiczna powinna służyć wielu, nie tylko nielicznym.'
      },
      en: {
        eyebrow: 'Earth',
        leadText: 'AI is not only a tool for accelerating work.',
        bodyText: `It is a force that amplifies human intentions — both those that serve life and those that lead to harm.

That is why technology needs a foundation:

mindfulness, responsibility, education, and care for life.

AI can be a tool of service, not domination.

It can strengthen what helps us protect one another: love, compassion, empathy, forgiveness, patience, and the ability not to answer harm with harm.

Progress should not mean greater power alone.

It should also reduce suffering, deepen understanding, and help us care for people, other beings, and the world of which we are a part.`,
        closingText: 'Technological transformation should serve the many, not only the few.'
      }
    }
  }
];
