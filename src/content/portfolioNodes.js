export const portfolioNodes = [
  {
    id: 'ai-guide',
    title: 'AI Guide',
    shortLabel: 'Oswajanie AI',
    modelPath: '/glb/glyph_1.glb',
    modelKind: 'glyph',
    ornamentPath: '/png/ai_guide_ornament.png',
    ornamentMobileOnly: true,
    draftText: 'Pomagam ludziom oswoić AI tam, gdzie technologia spotyka lęk, chaos i potrzebę sensu. Tłumaczę narzędzia, projektuję proste workflowy i prowadzę przez pierwsze kroki tak, żeby człowiek odzyskał sprawczość, zamiast czuć się przytłoczony rewolucją technologiczną. Z chaosu narzędzi powstaje spokojny proces.',
    leadText: 'Pomagam ludziom oswoić AI tam, gdzie technologia spotyka lęk, chaos i potrzebę sensu.',
    bodyText: 'Tłumaczę narzędzia, projektuję proste workflowy i prowadzę przez pierwsze kroki tak, żeby człowiek odzyskał sprawczość, zamiast czuć się przytłoczony rewolucją technologiczną.',
    closingText: 'Z chaosu narzędzi powstaje spokojny proces.'
  },
  {
    id: 'spotify-digger',
    title: 'DIG Engine',
    shortLabel: 'DIG Engine',
    eyebrow: 'Music Data Resonance',
    subtitle: 'Music Data Resonance',
    modelPath: '/glb/glyph_4.glb',
    modelKind: 'glyph',
    ornamentPath: '/png/digger_ornament.png',
    ornamentMobileOnly: true,
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
    shortLabel: 'Haiku Cosmos',
    eyebrow: 'INTERACTIVE WORLD SYSTEM',
    modelPath: '/glb/glyph_5.glb',
    modelKind: 'glyph',
    ornamentPath: '/png/haiku_cosmos_ornament.png',
    ornamentMobileOnly: true,
    draftText: 'Haiku Cosmos to projekt świata, w którym gra nie jest tylko zbiorem ekranów i mechanik.',
    leadText: 'Gra, interfejs i dokumentacja jako jeden kosmos zależności.',
    bodyText: `Haiku Cosmos to projekt świata, w którym gra nie jest tylko zbiorem ekranów i mechanik.

To system żywych zależności:
kart, sekwencji, progów, obiektów, rytmu, interfejsu i symboli.

Projekt łączy projektowanie gry, dokumentację, debugowanie, UI, ekonomię, warstwę wizualną i techniczne prowadzenie runtime’u.

Najważniejsze nie było samo „dodanie funkcji”.
Najważniejsze było utrzymanie sensu całości:
żeby mechanika, obraz, decyzje gracza i architektura projektu mówiły tym samym językiem.

Haiku Cosmos pokazuje, że potrafię prowadzić złożony projekt kreatywno-techniczny przez wiele warstw naraz — od intuicyjnej wizji świata, przez dokumentację i testy, aż po działający interaktywny system.`,
    featureLabel: 'Co pokazuje ten projekt:',
    featureText: 'mechanika · UI · runtime · debug · dokumentacja · visual pipeline'
  },
  {
    id: 'creative-ai',
    title: 'Creative AI',
    shortLabel: 'Creative AI',
    eyebrow: 'Tworzenie z AI',
    modelPath: '/glb/glyph_2.glb',
    modelKind: 'glyph',
    ornamentPath: '/png/creative_ai_ornament.png',
    ornamentMobileOnly: true,
    draftText: 'Pracuję z AI jak z żywym szkicownikiem, laboratorium obrazu i drugim obiegiem wyobraźni. Tworzę plakaty, grafiki, fotoedycje, cenniki, koncepcje wizualne i małe artefakty codziennego użytku — prowadząc proces od intuicji, przez prompt, obraz, korektę i kompozycję, aż do gotowej formy. AI nie zastępuje twórcy. Pomaga szybciej wydobyć z pomysłu jego kształt, ton i emocję.',
    leadText: 'Pracuję z AI jak z żywym szkicownikiem, laboratorium obrazu i drugim obiegiem wyobraźni.',
    bodyText: 'Tworzę plakaty, grafiki, fotoedycje, cenniki, koncepcje wizualne i małe artefakty codziennego użytku — prowadząc proces od intuicji, przez prompt, obraz, korektę i kompozycję, aż do gotowej formy.',
    closingText: 'AI nie zastępuje twórcy. Pomaga szybciej wydobyć z pomysłu jego kształt, ton i emocję.'
  },
  {
    id: 'ethics-life-protection',
    title: 'Ethics / Life Protection',
    shortLabel: 'Ethics / Life',
    eyebrow: 'Ziemia',
    modelPath: '/glb/glyph_3.glb',
    modelKind: 'glyph',
    ornamentPath: '/png/ai_ethics_ornament.png',
    ornamentMobileOnly: true,
    draftText: 'AI nie jest tylko narzędziem przyspieszania pracy. Jest siłą, która wzmacnia intencje człowieka — dobre i złe.',
    bodyText: `AI nie jest tylko narzędziem przyspieszania pracy.
Jest siłą, która wzmacnia intencje człowieka — dobre i złe.

Dlatego technologia potrzebuje fundamentu:
uważności, odpowiedzialności, edukacji i troski o życie.

Ten filar mówi o AI jako narzędziu służby, nie dominacji.
O ochronie człowieczeństwa w czasie przyspieszenia.
O tym, żeby transformacja nie była dostępna tylko dla elit.`
  }
];
