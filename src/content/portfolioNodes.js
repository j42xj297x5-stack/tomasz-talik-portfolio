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
    translations: {
      pl: {
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
      en: {
        draftText: 'DIG Engine is a local music exploration system that combines workflows, APIs, metadata, a SQLite database, and the listener’s intuition.',
        bodyText: `DIG Engine is a local music exploration system that combines workflows, APIs, metadata, a SQLite database, and the listener’s intuition.

It is not a simple playlist generator. It works as a music data laboratory: gathering candidates, enriching metadata, comparing sources, filtering results, and turning loose musical leads into a finished outcome.

The project reflects my approach to practical tools: data should remain readable, workflows should be understandable, and automation should support human decisions rather than obscure the purpose of the work.`,
        closingText: 'Workflow. APIs. GUI. SQLite. Discogs. Last.fm. Playlist automation. Process design with AI.',
        caseStudy: {
          title: 'DIG Engine — Music Data Resonance',
          heading: 'From musical chaos to a music data exploration system',
          intro: [
            'DIG Engine began as a local tool for exploring music, but it quickly grew beyond a simple playlist generator. The starting point was the need to organize a large number of musical leads: artists, albums, tags, listening history, releases, playlists, and external data sources.',
            'The project addresses a practical question: how can intuitive music discovery be transformed into a clear, repeatable, and extensible process?'
          ],
          problem: 'Instead of relying exclusively on automated recommendations, I approached music as a data space. Loose leads, listening history, metadata, and playlists needed a system that could organize, compare, and develop them without taking control away from the listener.',
          solution: 'DIG Engine combines local workflows, music-service APIs, Last.fm data, the Discogs database, a custom SQLite database, and a layer designed as the user’s DNA — a memory of preferences, decisions, and relationships between tracks, artists, tags, and playlists.',
          processSections: [
            {
              title: 'Stabilizing the pipeline',
              text: 'The first step was to create a deterministic workflow: indexing, building a candidate pool, selection, export, and the optional application of results to playlists.'
            },
            {
              title: 'Data and metadata layer',
              text: 'A local Discogs Offline database based on SQLite and FTS5 was integrated into the system. This allows DIG Engine to search releases, artists, labels, and metadata locally instead of making the entire process dependent on online requests.'
            },
            {
              title: 'GUI as a thin layer over the backend',
              text: 'The interface does not replace the system’s logic. The GUI reads run contracts and displays progress, results, and statuses, while the backend and runtime artifacts remain the source of truth.'
            },
            {
              title: 'Workflow Composer',
              text: 'A preset-composition layer was created. Users can build processes from blocks such as CSV input, Last.fm query, Spotify cross-checking, playlist application, or CSV export. This moves the project beyond individual scripts and toward an operational tool.'
            },
            {
              title: 'Documentation and responsibility boundaries',
              text: 'A significant part of the work involved documenting the architecture, mapping data flows, and maintaining clear boundaries between modules. It was particularly important to separate the current state of a run from the long-term DNA memory and to distinguish the active runtime from future AI modules.'
            }
          ],
          aiWorkflow: [
            'AI was not treated as a magical code generator in this project, but as a partner in the design process. ChatGPT helped analyze ideas, organize the architecture, ask decision-making questions, prepare prompts for Codex, and assess risks before implementation.',
            'Codex carried out narrowly defined implementation tasks: building functions, refactoring, improving the GUI, updating documentation, performing audits, and running tests. After each step, I returned to the analysis: what had changed, whether the architectural boundaries remained intact, and what required further work.'
          ],
          result: 'DIG Engine demonstrates my approach to building software with AI. The aim is not automatic code generation, but the creation of a process in which the human leads the project while AI helps analyze, implement, organize, and develop a complex system more efficiently.',
          nextSteps: 'In the future, DIG Engine can evolve into a more intelligent music exploration system, with a more complete DNA memory, candidate scoring, AI-assisted search, and clearer explanations of why a particular track, artist, or release appears in a given context.',
          gallery: [
            {
              src: '/png/dig_engine-screenshot_01.png',
              title: 'Progress',
              alt: 'Progress view in DIG Engine',
              caption: 'The window presents the current state of the digger: completed and active tasks, steps requiring user decisions, and input fields such as a source-track file, a playlist name, or the approval of selections made during the process.'
            },
            {
              src: '/png/dig_engine-screenshot_02.png',
              title: 'Discogs Browser',
              alt: 'Discogs Browser in DIG Engine',
              caption: 'A workspace for the local Discogs database. It supports manual keyword searches for artists or albums, filtering results by year and country of release, and creating `preseed.csv` files later used by modules that search for similar artists and tracks.'
            },
            {
              src: '/png/dig_engine-screenshot_03.png',
              title: 'Workflow Composer',
              alt: 'Workflow Composer in DIG Engine',
              caption: 'A space for building custom workflows from the available modules. It allows users to adjust filtering parameters, change the order of digger components, generate a CSV file, or automatically publish a playlist to Spotify.'
            },
            {
              src: '/png/dig_engine-screenshot_04.png',
              title: 'Results',
              alt: 'Results view in DIG Engine',
              caption: 'A summary of the completed process, including its start time, the files and data sources used, the number of tracks discovered, the status of playlist publication or file export, and the total execution time.'
            },
            {
              src: '/png/dig_engine-screenshot_05.png',
              title: 'Settings',
              alt: 'Settings view in DIG Engine',
              caption: 'The application’s configuration center: saving and loading configuration files, building and rebuilding the local Discogs/FTS database, defining data locations, creating the DNA database, and configuring the APIs used by the system.'
            },
            {
              src: '/png/dig_engine-screenshot_06.png',
              title: 'Spotify output',
              alt: 'Spotify playlist created by DIG Engine',
              caption: 'An example playlist in the Spotify application, created automatically by DIG Engine as the result of a completed workflow.'
            }
          ]
        }
      }
    }
  },
  {
    id: 'haiku-cosmos',
    title: 'Haiku Cosmos',
    shortLabel: 'INTERACTIVE WORLD SYSTEM',
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
    translations: {
      pl: {
        eyebrow: 'System interaktywnego świata',
        draftText: 'Kontemplacyjna gra-system o kształtowaniu żywego kosmosu.',
        leadText: 'Kontemplacyjna gra-system o kształtowaniu żywego kosmosu.',
        bodyText: `Haiku Cosmos to autorski, stale rozwijany prototyp gry przeglądarkowej. W świecie renderowanym w Three.js meteory poruszają się, zderzają i przechodzą w kolejne stadia, a masa, kolor, materiały, światło i ruch wspólnie pokazują stan zachodzących przemian.

Gracz nie realizuje klasycznej listy zadań. Obserwuje procesy, buduje sekwencje kart, zdobywa Punkty Rezonansu i wpływa na zachowanie świata przez PRG oraz konfigurację SUB-META.

Projekt łączy game design, system design, UI/UX, technical art direction, architekturę runtime’u i pipeline assetów 3D. Aktywne mechaniki są rozwijane w działającym prototypie, a kolejne systemy najpierw otrzymują spójny kontrakt projektowy i dopiero później trafiają do implementacji.

Dokumentacja pełni rolę pamięci roboczej projektu. Porządkuje źródła prawdy, zależności, statusy systemów i bezpieczne punkty zmian, dzięki czemu mogę koordynować pracę ChatGPT i Codexa bez utraty spójności architektury całego świata.`,
        featureLabel: 'Zakres / umiejętności',
        featureText: 'game design · system design · Three.js · 3D asset pipeline · UI/UX · runtime architecture · technical art direction · documentation architecture · AI-assisted production',
        closingText: 'Haiku Cosmos nie jest zamkniętym demem. To żywy projekt, w którym wizja, mechanika, kod i proces produkcyjny rozwijają się jako jeden system.',
        caseStudy: {
          title: 'Haiku Cosmos — Interactive World System',
          heading: 'Rozwijany prototyp gry-systemu',
          intro: [
            'Haiku Cosmos jest projektem rozwijanym warstwowo. Część mechanik działa już w publicznym prototypie, inne są przygotowane jako systemy gotowe do kolejnych etapów implementacji.',
            'Największym wyzwaniem jest utrzymanie spójności między szybko zmieniającą się wizją gry, mechaniką, interfejsem, warstwą 3D i produkcją wspieraną przez AI. Każda nowa funkcja musi pasować do istniejących zależności, zamiast tworzyć osobny, lokalny wyjątek.'
          ],
          processSections: [
            { title: 'Moja rola', text: `Prowadzę projekt od koncepcji do implementacji, łącząc game design, system design, UI/UX, technical art direction i integrację techniczną.

Projektuję mechaniki oraz ich zależności, określam kierunek wizualny, przygotowuję zakresy prac dla ChatGPT i Codexa, weryfikuję rezultaty oraz pilnuję spójności między runtime’em, assetami, interfejsem i dokumentacją.

Haiku Cosmos jest dla mnie przede wszystkim ćwiczeniem w prowadzeniu złożonego projektu kreatywno-technicznego, a nie zbiorem niezależnych eksperymentów.` },
            { title: 'Świat 3D i pipeline assetów', text: `Świat wykorzystuje modele GLB, materiały PBR, tekstury i mapy emisji przygotowane dla różnych rodzin obiektów.

Ponieważ modele mają odmienne siatki UV, assety są grupowane w kompatybilne zestawy. Warianty mogą być losowane tylko wewnątrz właściwej rodziny model–tekstura, co pozwala zachować różnorodność bez wizualnych błędów.

Modele i tekstury są cache’owane oraz ponownie wykorzystywane, aby utrzymać wiele aktywnych obiektów w środowisku przeglądarkowym. Rozwój warstwy wizualnej obejmuje również strojenie kamery, oświetlenia, materiałów, skali obiektów i czytelności kolejnych stadiów progresji.` },
            { title: 'Sieć kart i stabilizacja konfiguracji', text: `Karty R1–R4 są zdobywane w sekwencjach i uruchamiane po osadzeniu w slotach SUB-META.

Tworzą zależną sieć:

R4 → R3 → R2 → R1

Wyższe poziomy wzmacniają odpowiadające im karty niższego rzędu. Jednocześnie konfiguracja pozostaje zależna od swojego fundamentu. Zużycie lub utrata niższej karty może wywołać napięcie propagowane w górę systemu, przyspieszając degradację kolejnych elementów.

Karty mają ograniczoną trwałość. Od chwili osadzenia działają, wzmacniają konfigurację i stopniowo się zużywają. Gracz nie buduje więc stałego zestawu bonusów — utrzymuje dynamiczny układ, który wymaga odnawiania i stabilizacji.` },
            { title: 'Pył, SUB-META i PRG', text: `Harmoniczne zderzenia meteorów generują kolorowy pył, którego zbieranie działa już w prototypie.

Rozwijana pętla zasobu prowadzi od jednokolorowego pyłu, przez depozyt i Kuźnię, do bardziej skondensowanych stabilizatorów:

stosik pyłu → flakon → kryształ

Stabilizatory przedłużają czas działania kart i ograniczają skutki napięcia. Dla kart R2–R4 projektowane są wielokolorowe warianty odpowiadające ich konfiguracji.

SUB-META służy do budowania długoterminowej struktury kart i slotów. PRG — Player Reaction Field — odpowiada za bezpośrednie oddziaływanie gracza na obiekty świata. Oba systemy są rozwijane jako uzupełniające się warstwy: konfiguracja strategiczna i działanie w czasie rzeczywistym.` },
            { title: 'Produkcja z AI i dokumentacja', text: `Przy skali Haiku Cosmos dokumentacja pełni funkcję pamięci operacyjnej projektu.

Repozytorium zawiera mapy zależności, dokumenty źródłowe systemów, statusy implementacji i ograniczone pakiety kontekstu dla konkretnych zadań. Pozwala to odróżnić aktywny runtime od systemów roboczych, koncepcji przyszłościowych i materiałów historycznych.

ChatGPT wspiera analizę architektury i przygotowanie zakresów prac. Codex realizuje ograniczone zadania implementacyjne, audyty i testy. Każdy krok ma określone źródła prawdy, granice zmian i kryteria akceptacji.

Tak zorganizowany proces pozwala korzystać z szybkości AI bez utraty kontroli nad kierunkiem i strukturą projektu.` }
          ],
          result: `Haiku Cosmos jest publicznie dostępnym prototypem przeglądarkowym z trójwymiarowym światem, progresją ciał kosmicznych, systemem sekwencji kart, Punktami Rezonansu, PRG, RUN HUD, SUB-META, harmonicznym pyłem oraz rozbudowanym zapleczem debugowym.

Projekt pokazuje mój sposób pracy nad systemami, które łączą mechanikę, oprawę wizualną, narzędzia produkcyjne i rozwój architektury w jednej spójnej strukturze.`,
          nextSteps: `Dalszy rozwój obejmuje system eonów, w których gracz przechodzi przez kolejne etapy ewolucji świata, zachowując wybrane doświadczenia i ślady poprzednich konfiguracji.

Projektowane są również kolekcjonowalne glify uwalniane podczas szczególnych zderzeń, karty specjalne modyfikujące ŚWIAT i PRG oraz artefakty przenoszące właściwości zdobyte bezpośrednio w kosmosie.

Elementy te są opisane jako kierunek projektowy, nie jako ukończone funkcje runtime’u.`
        },
        demoGifAlt: 'Animowane demo Haiku Cosmos prezentujące świat gry i narzędzia debugowe',
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
        ]
      },
      en: {
        eyebrow: 'Interactive World System',
        draftText: 'A contemplative systems-driven game about shaping a living cosmos.',
        leadText: 'A contemplative systems-driven game about shaping a living cosmos.',
        bodyText: `Haiku Cosmos is an original, continuously evolving browser-game prototype. In a world rendered with Three.js, meteors move, collide, and progress through successive stages, while mass, color, materials, light, and motion together communicate the state of each transformation.

The player does not follow a conventional task list. They observe processes, build card sequences, earn Resonance Points, and influence the world through PRG and SUB-META configuration.

The project combines game design, system design, UI/UX, technical art direction, runtime architecture, and a 3D asset pipeline. Active mechanics are developed in the working prototype, while larger systems first receive a coherent design contract before moving into implementation.

Documentation serves as the project’s operational memory. It organizes sources of truth, dependencies, system statuses, and safe change points, allowing me to coordinate the work of ChatGPT and Codex without losing the coherence of the world’s architecture.`,
        featureLabel: 'Skills / scope',
        featureText: 'game design · system design · Three.js · 3D asset pipeline · UI/UX · runtime architecture · technical art direction · documentation architecture · AI-assisted production',
        closingText: 'Haiku Cosmos is not a self-contained demo. It is a living project in which vision, mechanics, code, and the production process evolve as one system.',
        caseStudy: {
          title: 'Haiku Cosmos — Interactive World System',
          heading: 'An evolving systems-driven game prototype',
          intro: [
            'Haiku Cosmos is being developed in layers. Some mechanics already operate in the public prototype, while others are prepared as coherent systems for future implementation stages.',
            'The main challenge is maintaining consistency between a rapidly evolving game vision, mechanics, interface design, the 3D layer, and AI-assisted production. Every new feature must fit the existing network of dependencies rather than becoming an isolated exception.'
          ],
          processSections: [
            { title: 'My role', text: `I lead the project from concept to implementation, combining game design, system design, UI/UX, technical art direction, and technical integration.

I design mechanics and their dependencies, define the visual direction, prepare scoped tasks for ChatGPT and Codex, evaluate the results, and maintain consistency across the runtime, assets, interface, and documentation.

Haiku Cosmos is primarily an exercise in leading a complex creative and technical project, rather than a collection of disconnected experiments.` },
            { title: '3D world and asset pipeline', text: `The world uses GLB models, PBR materials, textures, and emission maps prepared for different object families.

Because the models use different UV layouts, assets are organized into compatible sets. Variants can only be selected within the correct model–texture family, preserving visual variety without introducing mapping errors.

Models and textures are cached and reused to support many active objects in a browser environment. Development of the visual layer also includes tuning the camera, lighting, materials, object scale, and the readability of successive progression stages.` },
            { title: 'Card network and configuration stability', text: `R1–R4 cards are earned through sequences and become active when placed in SUB-META slots.

They form a dependent network:

R4 → R3 → R2 → R1

Higher levels strengthen the corresponding lower-tier cards, while the entire configuration remains dependent on its foundation. The degradation or loss of a lower-tier card can generate strain that propagates upward through the system, accelerating the decay of connected elements.

Cards have limited durability. From the moment they are placed, they operate, strengthen the configuration, and gradually wear out. The player is therefore not building a permanent set of bonuses, but maintaining a dynamic structure that requires renewal and stabilization.` },
            { title: 'Dust, SUB-META, and PRG', text: `Harmonic meteor collisions generate colored dust, and its collection already operates in the prototype.

The developing resource loop leads from single-color dust, through storage and the Forge, to increasingly condensed stabilizers:

dust stack → flask → crystal

Stabilizers extend card duration and reduce the effects of network strain. Multi-color variants corresponding to R2–R4 card configurations are being designed.

SUB-META is used to build the long-term structure of cards and slots. PRG — the Player Reaction Field — governs the player’s direct influence on objects in the world. The two systems are developed as complementary layers: strategic configuration and real-time interaction.` },
            { title: 'AI-assisted production and documentation', text: `At the scale of Haiku Cosmos, documentation serves as the project’s operational memory.

The repository contains dependency maps, source documents for individual systems, implementation statuses, and limited context packages for specific tasks. This makes it possible to distinguish the active runtime from working systems, future concepts, and historical materials.

ChatGPT supports architectural analysis and task scoping. Codex carries out constrained implementation tasks, audits, and tests. Each step has defined sources of truth, change boundaries, and acceptance criteria.

This organization makes it possible to benefit from the speed of AI without losing control over the project’s direction and structure.` }
          ],
          result: `Haiku Cosmos is a publicly available browser prototype featuring a three-dimensional world, cosmic-body progression, card sequences, Resonance Points, PRG, the RUN HUD, SUB-META, harmonic dust, and an extensive debugging environment.

The project demonstrates my approach to systems that combine mechanics, visual direction, production tooling, and architectural development within a single coherent structure.`,
          nextSteps: `Further development includes an eon system in which the player moves through successive stages of the world’s evolution while preserving selected experiences and traces of previous configurations.

The design also includes collectible glyphs released during special collisions, special cards that modify WORLD and PRG, and artifacts carrying properties acquired directly within the cosmos.

These elements are presented as future design directions, not as completed runtime features.`
        },
        demoGifAlt: 'Animated Haiku Cosmos demo showing the game world and debug tools',
        projectLinks: [
          {
            kind: 'demo',
            label: 'DEMO',
            url: 'https://j42xj297x5-stack.github.io/Haiku-Cosmos'
          },
          {
            kind: 'repository',
            label: 'REPOSITORY',
            url: 'https://github.com/j42xj297x5-stack/Haiku-Cosmos'
          }
        ]
      }
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
