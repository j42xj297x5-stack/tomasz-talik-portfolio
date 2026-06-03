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
    shortLabel: 'INTERACTIVE WORLD SYSTEM',
    eyebrow: 'INTERACTIVE WORLD SYSTEM',
    modelPath: '/glb/glyph_5.glb',
    modelKind: 'glyph',
    ornamentPath: '/png/haiku_cosmos_ornament.png',
    ornamentMobileOnly: true,
    draftText: 'Gra, interfejs i dokumentacja jako jeden kosmos zależności.',
    leadText: 'Gra, interfejs i dokumentacja jako jeden kosmos zależności.',
    bodyText: `Haiku Cosmos to autorski projekt interaktywnego świata, w którym gra nie jest tylko zbiorem ekranów, efektów i mechanik.

To żywy system zależności: kart, sekwencji, progów, obiektów, ekonomii, rytmu, interfejsu, symboli, dokumentacji i runtime’u.

Projekt łączy game design, system design, UI/UX, debugowanie, dokumentację projektową, visual pipeline oraz pracę z AI/Codexem jako narzędziem produkcyjnym.

Najważniejsze nie było samo „dodawanie funkcji”.

Najważniejsze było utrzymanie sensu całości: żeby mechanika, obraz, decyzje gracza, architektura kodu i dokumentacja projektu mówiły tym samym językiem.

Rdzeniem Haiku Cosmos jest relacja między decyzją gracza a przemianą świata.

Gracz buduje sekwencje, zdobywa karty, zarządza ekonomią RP, konfiguruje SUB-META i wpływa na zachowanie świata przez PRG — Player Reaction Field.

Równolegle projekt rozwija się jako uporządkowany system dokumentów: mapy zależności, kanon mechanik, specyfikacje UI, snapshoty, decyzje architektoniczne i instrukcje dla Codexa.`,
    closingText: 'Haiku Cosmos pokazuje, że potrafię prowadzić złożony projekt kreatywno-techniczny przez wiele warstw naraz — od intuicyjnej wizji świata, przez projektowanie mechanik, dokumentację i testy, aż po działający interaktywny prototyp.',
    caseStudy: {
      title: 'Haiku Cosmos — Interactive World System',
      heading: 'Gra-system o relacji między decyzją gracza a przemianą świata',
      intro: [
        'Haiku Cosmos to kontemplacyjna gra-system, w której gracz oddziałuje na żywy kosmos obiektów: meteory, asteroidy, planety, komety, gwiazdy, orbitujące struktury i późniejsze warstwy wizualne.',
        'Rdzeniem projektu nie jest klasyczna fabuła, ale relacja między decyzją gracza a przemianą świata. Gracz buduje sekwencje, zdobywa karty, konfiguruje META/SUB-META i wpływa na zachowanie świata przez system PRG — Player Reaction Field.',
        'Projekt rozwija się jako działający prototyp, ale równolegle posiada uporządkowaną dokumentację: kanon systemów, mapę zależności, roadmapę, dokumenty UI, visual direction, specyfikacje techniczne i instrukcje dla Codexa.'
      ],
      problem: `Największym wyzwaniem nie było stworzenie pojedynczej mechaniki, tylko utrzymanie spójności między wieloma warstwami projektu.

Haiku Cosmos musiał jednocześnie odpowiadać na pytania:

- Jak działa gra?
- Jak gracz podejmuje decyzje?
- Jak system rozpoznaje sekwencje?
- Jak ekonomia nagradza koncentrację i ryzyko?
- Jak UI pokazuje stan bez zalewania gracza tekstem?
- Jak dokumentacja prowadzi dalszy rozwój?
- Jak współpracować z AI/Codexem bez rozjechania architektury?
- Jak utrzymać styl wizualny, który nie jest generycznym sci-fi ani fantasy UI?

To był projekt nie tylko implementacyjny, ale przede wszystkim systemowo-architektoniczny.`,
      solution: `Haiku Cosmos opiera się na założeniu, że gra jest procesem rezonansu.

Gracz nie tylko „zbiera punkty”. Gracz buduje ciągi decyzji. Każde trafienie, kolor, rytm i przerwanie sekwencji ma znaczenie.

System kart tworzy podstawowy język progresji:

R1 — Wejście: podstawowa karta, możliwa do aktywacji w trakcie RUN.

R2 — Ustabilizowanie: karta relacyjna, łącząca elementy systemu.

R3 — Uciszenie: karta stabilizacji, przeznaczona pod głębsze strategie META.

R4 — Jedność: pełna sekwencja, rzadka karta integrująca strukturę.

Sekwencja działa jako proces ryzyka. Gracz może wcześniej aktywować lub zebrać kartę, ale może też kontynuować, ryzykując przerwanie ścieżki. Ekonomia RP nagradza nie przypadek, tylko koncentrację, ciągłość i decyzję.`,
      processSections: [
        {
          title: 'Moja rola',
          text: `W projekcie pełniłem rolę projektanta i prowadzącego całość systemu.

Łączyłem kilka poziomów pracy:

- Game/system design — projekt kart R1–R4, sekwencji, ryzyka, ekonomii RP, SUB-META i PRG.
- Technical direction — określanie struktury runtime’u, zależności między modułami, zasad aktualizacji świata i renderowania.
- UI/UX design — projekt HUD, panelu SUB-META, decyzji sekwencyjnych, informacji zwrotnej i warstw interfejsu.
- Documentation architecture — tworzenie dokumentów kanonicznych, map zależności, indeksów i instrukcji pracy.
- AI-assisted production — prowadzenie Codexa przez precyzyjne prompty, ograniczenia, checklisty, zakresy zmian i walidację efektów.
- Visual pipeline — definiowanie kierunku „rytualnego minimalizmu kosmicznego”, SVG, ramek, ornamentów, Inkscape/FrameComposer i zasad assetów.

Najbliżej tej roli jest: creative technical designer / system designer / project integrator / AI workflow lead.`
        },
        {
          title: 'Cards System',
          text: `System kart jest głównym językiem progresji. Karty powstają w trakcie RUN, ale ich wzmacnianie i osadzanie odbywa się w META/SUB-META.

Najważniejsza decyzja projektowa: karty nie są tylko nagrodami — są stanami świata i narzędziami konfiguracji.

R1 działa w RUN.
R2–R4 są kartami sekwencyjnymi i systemowymi.
R2 tworzy relacje.
R3 stabilizuje.
R4 integruje.

Dzięki temu prosty system kolorów rozwija się w strukturę strategiczną.`
        },
        {
          title: 'Economy System',
          text: `Ekonomia opiera się na RP — Resonance Points.

RP nie są losową walutą. Są odzwierciedleniem jakości gry: trafień, sekwencji, ciągłości i ryzyka. Gracz zdobywa RP w RUN, a wydaje je w META na sloty, konfigurację i wzmacnianie kart.

To pozwala połączyć zręczność, uwagę i długofalowe planowanie.`
        },
        {
          title: 'SUB-META',
          text: `SUB-META to warstwa konfiguracji świadomości gracza.

Nie jest zwykłym inventory. To panel, w którym karty przestają być tylko zdobytymi obiektami, a stają się trybami działania świata i gracza.

SUB-META ma dwie główne gałęzie:

- ŚWIAT — jak świat reaguje na działania gracza.
- PRG — jak gracz oddziałuje na świat.

To właśnie tutaj projekt zaczyna przypominać nie „menu gry”, ale system zależności i pamięć decyzji.`
        },
        {
          title: 'PRG — Player Reaction Field',
          text: `PRG to system pola wpływu gracza na obiekty świata.

Określa:

- jaki jest zasięg oddziaływania,
- czy obiekty są przyciągane lub odpychane,
- jak zmienia się ich prędkość,
- na jakie klasy obiektów gracz może wpływać.

PRG jest warstwą pomiędzy decyzją gracza a zachowaniem kosmosu. Dzięki temu input nie jest tylko sterowaniem, ale sposobem kształtowania świata.`
        },
        {
          title: 'UI i doświadczenie gracza',
          text: `UI w Haiku Cosmos zostało zaprojektowane jako część świata, nie jako osobna nakładka informacyjna.

Interfejs składa się z trzech głównych warstw:

- RUN HUD — informacje podczas aktywnej gry: RP, karty, sekwencje, aktywne stany.
- SUB-META Overlay — panel konfiguracji dostępny w trakcie RUN.
- META Overlay — panel końca cyklu / EONU.

Ważną zasadą było ograniczenie nadmiaru komunikatów tekstowych. System powinien mówić przez kolor, puls, rytm, ramki, halo, decyzje i stan obiektów.

To projekt UI, który nie tylko informuje, ale buduje atmosferę i sens systemu.`
        },
        {
          title: 'Runtime i architektura techniczna',
          text: `Projekt był rozwijany jako modularny runtime JavaScript.

Świat gry został rozbity na moduły odpowiedzialne między innymi za:

- meteory,
- komety,
- asteroidy,
- planety,
- gwiazdy i epoki,
- kolizje,
- kamerę,
- input,
- render,
- debug UI,
- CardEngine,
- SUB-META.

W późniejszym etapie projekt zaczął przechodzić z renderowania canvas2D w kierunku hybrydowego modelu z Three.js. Three obsługuje warstwę świata, a HUD, SUB-META i META pozostają poza Three jako overlay/UI.

To ważna decyzja architektoniczna: render może się rozwijać, ale mechanika, fizyka, input i system kart pozostają stabilne.`
        },
        {
          title: 'Dokumentacja jako część systemu',
          text: `Jednym z najważniejszych elementów projektu była dokumentacja.

Haiku Cosmos posiada:

- mapę projektu,
- mapę zależności,
- kanoniczne dokumenty systemów,
- dokumenty UI,
- visual direction,
- standardy SVG,
- specyfikacje techniczne,
- roadmapę,
- snapshoty stanu,
- instrukcje dla Codexa.

Dokumentacja nie była dodatkiem po fakcie. Była narzędziem prowadzenia projektu.

Dzięki temu możliwe było pracowanie z AI/Codexem w sposób kontrolowany: z jasnym zakresem zmian, zakazami, zależnościami, testami, ryzykami i oczekiwanym podsumowaniem.

To pokazuje umiejętność prowadzenia złożonego projektu nie tylko „w głowie”, ale w formie, którą mogą czytać ludzie, zespoły i narzędzia AI.`
        },
        {
          title: 'Visual pipeline',
          text: `Warstwa wizualna projektu została opisana jako: rytualny minimalizm kosmiczny.

Czyli połączenie:

- czytelności gameplayowej,
- kontemplacyjnej przestrzeni,
- subtelnej sakralności form,
- geometrii,
- rezonansu,
- oszczędnej symboliki.

UI nie miało wyglądać jak typowy panel sci-fi ani fantasy inventory. Karty, ramki i SUB-META miały przypominać system znaczeń: astrolabium, rytuał, mapa zależności, pole rezonansu.

Pipeline wizualny obejmował:

- generowanie referencji rastrowych,
- wektoryzację i cleanup w Inkscape,
- SVG jako kandydat produkcyjny,
- modularne ramki i ornamenty,
- standardy viewBox/warstw/tintingu,
- przygotowanie pod FrameComposer.`
        },
        {
          title: 'What this project shows',
          text: `- System thinking
- Game design
- Technical design
- UI/UX architecture
- Documentation strategy
- AI-assisted production
- Runtime debugging
- Creative direction
- Cross-layer project leadership`
        }
      ],
      aiWorkflow: [
        'Projekt był również praktycznym laboratorium pracy z AI jako narzędziem produkcyjnym.',
        'Moim zadaniem było nie tylko „poprosić AI o kod”, ale prowadzić proces: określić kontekst, wskazać dokumenty źródłowe, ograniczyć zakres zmian, zabronić naruszania mechaniki, wymusić raport zmian, sprawdzić rozjazdy, zaktualizować dokumentację i utrzymać kanon projektu.',
        'W praktyce oznaczało to rolę osoby, która tłumaczy wizję na instrukcje wykonawcze dla narzędzi technicznych — i pilnuje, żeby system nie rozpadł się na przypadkowe patche.',
        'To jest bardzo mocny element portfolio, szczególnie pod firmy, które dopiero uczą się sensownej pracy z AI.'
      ],
      result: `Efektem jest działający interaktywny prototyp oraz rozbudowany system projektowy, który obejmuje gameplay, UI, ekonomię, dokumentację, debug, asset pipeline i runtime.

Haiku Cosmos pokazuje, że potrafię:

- prowadzić złożony projekt przez wiele warstw naraz,
- łączyć intuicyjną wizję z techniczną strukturą,
- projektować systemy zależności,
- pracować z dokumentacją jako narzędziem produkcji,
- koordynować pracę z AI/Codexem,
- myśleć jednocześnie jak projektant, techniczny lider i osoba odpowiedzialna za spójność całości.`
    },
    featureLabel: 'Skills / scope:',
    featureText: 'game design · system design · UI/UX · runtime · debug · documentation · visual pipeline · AI-assisted workflow'
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
