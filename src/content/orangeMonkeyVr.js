const REPOSITORY_URL = 'https://github.com/j42xj297x5-stack/tomasz-talik-portfolio';

export const orangeMonkeyVr = {
  id: 'orange-monkey-vr',
  title: 'Orange Monkey VR',
  shortLabel: 'Orange Monkey VR',
  video: {
    youtubeId: '',
    posterPath: ''
  },
  translations: {
    pl: {
      title: 'Orange Monkey VR',
      shortLabel: 'Orange Monkey VR',
      eyebrow: 'Autorska gra VR · WebXR · JavaScript · Three.js',
      leadText: 'Świat, który odkrywasz i przebudowujesz własnymi rękami.',
      bodyText: `Orange Monkey VR to pełnoprawna, narracyjna gra w wirtualnej rzeczywistości, łącząca eksplorację, zagadki przestrzenne, interakcje fizyczne i stopniową przebudowę otaczającego świata.

Gracz trafia na zawieszoną w kosmosie platformę, gdzie spotyka medytującą małpę — przewodnika po świecie pięciu żywiołów. Początkowo poznaje jego podstawowe reguły, odkrywa glify i zbiera kryształy, które odsłaniają kolejne fragmenty mojego portfolio. Z czasem prosta eksploracja przeradza się w bardziej złożoną rozgrywkę: przetwarzanie materii, konstruowanie narzędzi, zdobywanie kamieni runicznych i budowę Rezonatora Asterionowego.

Świat nie pozostaje statyczny. Platforma rozwija się wraz z postępami gracza, a zdobyte przedmioty i uruchamiane mechanizmy zmieniają zarówno jej wygląd, jak i dostępne możliwości. W końcowej części gry to sam gracz steruje przestrzennym rezonatorem, poszukując odległych obiektów i ucząc się wykorzystywać właściwości poszczególnych żywiołów.

Orange Monkey VR powstało w JavaScripcie, z wykorzystaniem Three.js jako biblioteki graficznej i WebXR jako interfejsu wirtualnej rzeczywistości. System rozgrywki, progresja, reżyseria zdarzeń, logika interakcji i zachowanie świata zostały opracowane w ramach własnej, modułowej architektury.

Projekt jest również eksperymentem w dziedzinie współpracy człowieka z AI. Łączy autorską wizję, projektowanie systemów, produkcję grafiki i dźwięku oraz rozwój oprogramowania realizowany we współpracy z ChatGPT i Codexem.

Efektem jest grywalne doświadczenie VR, którego ukończenie zajmuje około 40 minut przy znajomości mechanik, z własną narracją, rozbudowaną progresją i zaprojektowanym zakończeniem.`,
      featureLabel: 'Zakres / umiejętności',
      featureText: 'Game design · System design · JavaScript · Three.js · WebXR · Runtime architecture · Spatial interactions · Technical art · Procedural VFX · Spatial audio · AI-assisted development',
      closingText: `Obejrzyj materiał z rozgrywki, poznaj proces powstawania projektu lub przejdź do publicznego repozytorium.

Orange Monkey VR pokazuje, jak z autorskiej wizji można zbudować spójny, interaktywny świat — bez korzystania z gotowego silnika gameplayowego.`,
      projectLinks: [
        { kind: 'repository', label: 'REPOZYTORIUM', url: REPOSITORY_URL }
      ],
      caseStudy: {
        title: 'Orange Monkey VR — Case Study',
        heading: 'Od interaktywnego portfolio do pełnoprawnej gry VR',
        intro: [
          'Orange Monkey VR rozpoczęło się od pomysłu przeniesienia mojego interaktywnego portfolio do wirtualnej rzeczywistości.',
          'Wersje Classic 2D i Experience 3D pozwalały poznawać pięć obszarów mojej pracy poprzez symbole, animacje i interaktywne panele. VR otwierało jednak inną możliwość: zamiast oglądać projekty z zewnątrz, odbiorca mógł znaleźć się wewnątrz ich świata i poznawać go poprzez własne działania.',
          'Pierwotna koncepcja stopniowo przekształciła się w samodzielną grę z narracją, systemem progresji, przestrzennymi zagadkami i własnymi mechanikami.'
        ],
        problem: 'Największym wyzwaniem nie było samo wyświetlenie sceny w goglach. Było nim zbudowanie świata, który reaguje na decyzje gracza, pamięta ich konsekwencje i pozwala rozwijać rozgrywkę bez utraty spójności między narracją, stanem obiektów i dostępnymi interakcjami.',
        solution: `Podstawą gry stał się własny system progresji, oddzielający narrację od faktycznego stanu świata.

Zamiast umieszczać całą logikę w jednym, rozbudowanym kontrolerze, opracowaliśmy architekturę opartą na kilku współpracujących warstwach:`,
        processSections: [
          {
            title: 'Scenariusz, reżyseria i architektura rozgrywki',
            text: `Scenario definiuje przebieg doświadczenia: punkty narracyjne, zdarzenia, warunki przejść oraz efekty, które powinny pojawić się w kolejnych momentach gry.

Experience Director odpowiada za aktualną pozycję w scenariuszu i rozstrzyga, kiedy możliwe jest przejście do następnego punktu.

RuntimeExperience interpretuje efekty scenariusza i przekazuje je odpowiednim systemom wykonawczym.

Aktorzy i kontrolery domenowe zarządzają rzeczywistym stanem obiektów, narzędzi oraz mechanik gameplayowych.

Takie rozdzielenie pozwoliło rozwijać poszczególne elementy bez uzależniania ich od jednego centralnego mechanizmu.

W trakcie produkcji architektura przechodziła kolejne migracje. Uporządkowaliśmy semantykę przejść, rozdzieliliśmy zdarzenia jednorazowe od trwałych konsekwencji i opracowaliśmy mechanizmy odtwarzania ustalonego stanu scenariusza.

Szczególną rolę odgrywa małpa — przewodnik gracza. Jej komunikaty, podpowiedzi i obowiązkowe momenty narracyjne są związane z konkretnymi zdarzeniami. Dzięki temu historia może prowadzić gracza, nie przejmując bezpośredniej kontroli nad wszystkimi mechanikami świata.`,
          },
          {
            title: 'Sandbox — swoboda działania bez utraty narracji',
            text: `Jednym z istotnych problemów projektowych było pogodzenie liniowego scenariusza z możliwością swobodnego wykonywania działań.

Gracz może odkrywać obiekty, przetwarzać materię, stroić narzędzia i instalować kamienie runiczne. Nie wszystkie te czynności muszą następować dokładnie w momencie przewidzianym przez narrację.

Dlatego oddzieliliśmy uprawnienia wynikające z rzeczywistego stanu świata od wiedzy i postępu opisywanych przez Scenario.

Przykładowo: możliwość przyciągnięcia obiektu może wynikać ze zdobytego narzędzia, poznanej rodziny znaków i aktualnego stanu namierzania. Nie musi zależeć od tego, czy gracz znajduje się w konkretnym punkcie fabuły.

Opracowaliśmy również mechanizm Scenario Progress Reconciliation, który w obsługiwanym zakresie pozwala narracji nadrobić postęp wynikający z wcześniejszych działań gracza.

System obserwuje fakty utrzymywane przez właścicieli poszczególnych mechanik i na ich podstawie przesuwa scenariusz do właściwego punktu. Nie fabrykuje przy tym zdarzeń ani nie rekonstruuje świata na podstawie samej pozycji w historii.

Rozwiązanie pozwoliło zachować niezależność rozgrywki, a jednocześnie utrzymać kontrolę nad obowiązkowymi etapami narracji.`
          },
          {
            title: 'Własne mechaniki gameplayowe i interakcje VR',
            text: `Orange Monkey VR wykorzystuje WebXR i kontrolery ruchowe jako podstawowy interfejs gracza.

Poruszanie się odbywa się względem platformy, której orientacja może zmieniać się podczas rozgrywki. System lokomocji uwzględnia jej lokalną płaszczyznę, a gracz może niezależnie korzystać z narzędzi przypisanych do lewej i prawej ręki.

Wśród opracowanych mechanik znajdują się:

• przestrzenne wskazywanie obiektów, interakcje raycast i chwytanie kryształów;
• relikwiarz z sekwencją osadzania, aktywacji i zatwierdzania kart;
• Astro Piec służący do przetwarzania materii i konstruowania przedmiotów;
• Astrolabium Więzi z wyborem pasm, namierzaniem oraz przyciąganiem obiektów;
• Kula Asterionowa, która umożliwia sterowanie platformą i jej sektorami;
• pozyskiwanie, strojenie, transport i instalacja kamieni runicznych.

Każda mechanika ma własne warunki działania i odpowiedzialność za stan, dzięki czemu może współpracować z innymi bez dublowania logiki.

Nie korzystaliśmy z gotowego silnika fizycznego ani standardowego zestawu mechanik gry. Interakcje zaprojektowaliśmy bezpośrednio dla potrzeb tego świata, wykorzystując matematykę przestrzenną, transformacje obiektów, raycasting i własne maszyny stanów.`
          },
          {
            title: 'Świat, który rozwija się wraz z graczem',
            text: `Świat gry jest zorganizowany wokół pięciu rodzin żywiołów: Ziemi, Ognia, Drzewa, Metalu i Wody.

Odkrywanie odpowiadających im glifów prowadzi do zdobywania kolejnych kryształów, rozwijania platformy i poznawania mechaniki świata. W miarę postępu gracz uzyskuje dostęp do skorup, małych glifów, nowych narzędzi oraz kamieni runicznych.

Każdy kamień przechodzi własną sekwencję pozyskania i instalacji. Jego osadzenie zmienia stan odpowiedniego sektora platformy i otwiera nowe możliwości interakcji.

Istotnym elementem późniejszej rozgrywki jest Rezonator Asterionowy — przestrzenny system wykrywania i namierzania odległych obiektów.

Jego pole powstaje na podstawie aktualnej konfiguracji sektorów. Zmiana ich położenia wpływa na geometrię aktywnego obszaru, a zarejestrowane cele są wykrywane na podstawie rzeczywistego położenia względem nominalnego pola.

Namierzanie przebiega etapami. Obiekty otrzymują znaki i pierścienie rezonansu, które informują gracza o postępie, gotowości do przyciągnięcia oraz utracie kontaktu.

Logika wykrywania pozostaje oddzielona od geometrii prezentacyjnej. Dzięki temu wizualne wygięcia, zaokrąglenia, poświaty i animacje pola nie zmieniają zasad gameplayu.

Rezonator łączy kilka niezależnych systemów w jedną mechaniczną całość: ruch sektorów, geometrię przestrzenną, wykrywanie celów, progresję i informację zwrotną dla gracza.`
          },
          {
            title: 'Technical art, animacje i dźwięk przestrzenny',
            text: `Warstwa wizualna Orange Monkey VR wykorzystuje modele GLB, materiały, mapy emisji, animacje oraz efekty proceduralne.

Modele i elementy świata przygotowywałem z wykorzystaniem Meshy AI, Blendera, Inkscape i GIMP-a. Ważną częścią procesu było również dostosowanie geometrii, pivotów, kotwic i hierarchii transformacji do działania w środowisku VR.

Efekty wizualne obejmują między innymi wyładowania energetyczne, świetlne reakcje obiektów, animowane pola rezonansu, efekty przyciągania, materializację elementów platformy i finałową transformację świata.

Proceduralne błyskawice wykorzystują własny generator ścieżek i ograniczoną pulę współdzielonych zasobów. Ich wygląd jest inspirowany rozgałęzionymi wyładowaniami, ale nie stanowi fizycznej symulacji elektromagnetycznej.

Równie istotna jest warstwa dźwiękowa.

Przygotowałem zestaw efektów i atmosfer dźwiękowych, wykorzystując Adobe Firefly oraz ElevenLabs, a także obróbkę i miks w Ableton Live.

Własny system audio obsługuje odtwarzanie zdarzeniowe, pętle urządzeń, sekwencje ambientowe i przestrzenne źródła dźwięku. Pozycjonowanie HRTF pozwala graczowi lokalizować źródła w otaczającym świecie, a osobne magistrale umożliwiają niezależne zarządzanie kategoriami dźwięków.

Dźwięk nie jest jedynie tłem. Informuje o stanie narzędzi, rozpoczęciu namierzania, zdobyciu obiektu, zakończeniu procesu i zmianach zachodzących w świecie.`
          }
        ],
        aiWorkflow: [
          'Orange Monkey VR powstawało w modelu współpracy człowieka z AI, opartym na świadomym podziale odpowiedzialności.',
          'Moja rola obejmowała koncepcję i wizję artystyczną, projektowanie doświadczenia gracza, mechanik i przebiegu rozgrywki, określanie wymagań, produkcję assetów oraz integrację i ocenę rezultatów w rzeczywistym środowisku VR.',
          'ChatGPT wspierał rozwijanie architektury, analizę zależności, projektowanie systemów, przygotowanie dokumentacji, audyty i opracowywanie zadań implementacyjnych.',
          'Codex realizował określone zadania programistyczne: implementację modułów, integrację funkcji, refaktoryzację i poprawki kodu.',
          'Wraz ze wzrostem złożoności projektu rozwijaliśmy także sam proces współpracy. Powstały kanoniczne modele techniczne, Decision Log, mapa zależności, standardy pisania punktów scenariusza oraz protokół realizacji ograniczonych zadań.',
          'Dokumentacja stała się pamięcią operacyjną projektu. Pozwalała odróżniać aktualny kod od planowanych funkcji, zachowywać decyzje architektoniczne i ograniczać ryzyko regresji podczas kolejnych migracji.',
          'Ten sposób pracy pozwolił mi prowadzić rozbudowany projekt kreatywno-techniczny, korzystając z możliwości AI bez oddawania mu odpowiedzialności za wizję, kierunek rozwoju i końcową akceptację rozwiązań.'
        ],
        result: `Orange Monkey VR jest grywalnym doświadczeniem WebXR, zbudowanym w JavaScripcie i renderowanym przez Three.js.

Projekt obejmuje wieloetapową progresję, własny system scenariusza i reżyserii, modułową architekturę aktorów, mechaniki sandboxowe, narzędzia interakcji VR, system kamieni runicznych, Rezonator Asterionowy, efekty proceduralne, dźwięk przestrzenny oraz narracyjne zakończenie.

Rozgrywka zajmuje około 40 minut graczowi, który zna już mechaniki. Dla osoby odkrywającej świat po raz pierwszy czas może być dłuższy.

Gra była rozwijana i weryfikowana na Meta Quest 3S, również z wykorzystaniem Virtual Desktop. Dostępna jest jako przeglądarkowe doświadczenie VR, a jej kod znajduje się w publicznym repozytorium.

Orange Monkey VR jest dla mnie przykładem tego, jak projektowanie systemów, kierunek artystyczny i współpraca z AI mogą połączyć się w procesie tworzenia kompletnego interaktywnego doświadczenia.`
      }
    },
    en: {
      title: 'Orange Monkey VR',
      shortLabel: 'Orange Monkey VR',
      eyebrow: 'An original VR game · WebXR · JavaScript · Three.js',
      leadText: 'A world you discover and rebuild with your own hands.',
      bodyText: `Orange Monkey VR is a full-fledged, narrative-driven virtual reality game combining exploration, spatial puzzles, physical interactions, and the gradual transformation of the surrounding world.

The player arrives on a platform suspended in space and meets a meditating monkey — a guide to the world of the five elements. At first, they learn its basic rules, discover glyphs, and collect crystals that reveal successive parts of my portfolio. Over time, this simple exploration evolves into more complex gameplay: processing matter, constructing tools, acquiring Rune Stones, and building the Asterion Resonator.

The world does not remain static. The platform evolves with the player's progress, while acquired objects and activated mechanisms change both its appearance and the possibilities it offers. In the final part of the game, the player controls the spatial resonator themselves, searching for distant objects and learning to use the properties of the individual elements.

Orange Monkey VR was built in JavaScript, using Three.js as its graphics library and WebXR as its virtual reality interface. The gameplay system, progression, event direction, interaction logic, and world behavior were developed within a custom, modular architecture.

The project is also an experiment in human–AI collaboration. It brings together an original creative vision, systems design, visual and audio production, and software development carried out in collaboration with ChatGPT and Codex.

The result is a playable VR experience that takes approximately 40 minutes to complete when the player is familiar with its mechanics, with its own narrative, extensive progression, and a designed ending.`,
      featureLabel: 'Scope / Skills',
      featureText: 'Game design · System design · JavaScript · Three.js · WebXR · Runtime architecture · Spatial interactions · Technical art · Procedural VFX · Spatial audio · AI-assisted development',
      closingText: `Watch gameplay footage, learn how the project was made, or visit the public repository.

Orange Monkey VR shows how an original creative vision can become a coherent, interactive world — without relying on a ready-made gameplay engine.`,
      projectLinks: [
        { kind: 'repository', label: 'REPOSITORY', url: REPOSITORY_URL }
      ],
      caseStudy: {
        title: 'Orange Monkey VR — Case Study',
        heading: 'From an interactive portfolio to a full-fledged VR game',
        intro: [
          'Orange Monkey VR began with the idea of bringing my interactive portfolio into virtual reality.',
          'Classic 2D and Experience 3D let visitors explore five areas of my work through symbols, animations, and interactive panels. VR, however, opened up another possibility: instead of viewing the projects from the outside, visitors could enter their world and discover it through their own actions.',
          'The initial concept gradually evolved into a standalone game with a narrative, a progression system, spatial puzzles, and custom mechanics.'
        ],
        problem: "The greatest challenge was not simply displaying a scene in a headset. It was building a world that responds to the player's decisions, remembers their consequences, and allows gameplay to develop without losing coherence between the narrative, object states, and available interactions.",
        solution: `The foundation of the game became a custom progression system that separates the narrative from the actual state of the world.

Instead of placing all the logic in a single, extensive controller, we developed an architecture built around several cooperating layers:`,
        processSections: [
          {
            title: 'Scenario, direction, and gameplay architecture',
            text: `Scenario defines the course of the experience: narrative points, events, transition conditions, and effects that should occur at successive moments in the game.

Experience Director tracks the current position in the Scenario and decides when it is possible to advance to the next point.

RuntimeExperience interprets Scenario effects and passes them to the appropriate execution systems.

Actors and domain controllers manage the actual state of objects, tools, and gameplay mechanics.

This separation made it possible to develop individual elements without making them dependent on one central mechanism.

During production, the architecture underwent successive migrations. We refined transition semantics, separated one-time events from persistent consequences, and developed mechanisms for restoring the Scenario's settled state.

The monkey — the player's guide — plays a special role. Its messages, hints, and mandatory narrative moments are tied to specific events. This allows the story to guide the player without directly taking control of every world mechanic.`,
          },
          {
            title: 'Sandbox — freedom of action without losing the narrative',
            text: `One of the major design challenges was reconciling a linear Scenario with the freedom to act.

The player can discover objects, process matter, tune tools, and install Rune Stones. Not all of these actions have to occur at precisely the moment anticipated by the narrative.

We therefore separated permissions derived from the actual state of the world from the knowledge and progress described by Scenario.

For example, the ability to pull an object may depend on an acquired tool, knowledge of a sign family, and the current targeting state. It does not have to depend on whether the player has reached a particular point in the story.

We also developed Scenario Progress Reconciliation, a mechanism that, within its supported scope, lets the narrative catch up with progress resulting from the player's earlier actions.

The system observes facts maintained by the owners of individual mechanics and uses them to advance the Scenario to the appropriate point. In doing so, it neither fabricates events nor reconstructs the world based solely on the player's position in the story.

This solution preserved gameplay independence while maintaining control over mandatory narrative stages.`
          },
          {
            title: 'Custom gameplay mechanics and VR interactions',
            text: `Orange Monkey VR uses WebXR and motion controllers as the player's primary interface.

Movement is relative to the platform, whose orientation can change during gameplay. The locomotion system accounts for its local plane, and the player can use tools assigned to the left and right hands independently.

The mechanics we developed include:

• spatial object pointing, raycast interactions, and crystal grabbing;
• a reliquary with a card insertion, activation, and confirmation sequence;
• the Astro Furnace for processing matter and constructing items;
• the Astro Attractor (Astrolab of Binding), with band selection, targeting, and object pulling;
• the Asterion Sphere, which allows control of the platform and its sectors;
• acquiring, tuning, transporting, and installing Rune Stones.

Each mechanic has its own operating conditions and state ownership, allowing it to cooperate with others without duplicating logic.

We did not use a ready-made physics engine or a standard set of game mechanics. The interactions were designed specifically for the needs of this world, using spatial mathematics, object transformations, raycasting, and custom state machines.`
          },
          {
            title: 'A world that evolves with the player',
            text: `The game world is organized around five elemental families: Earth, Fire, Wood, Metal, and Water.

Discovering their corresponding glyphs leads to acquiring successive crystals, expanding the platform, and learning the world's mechanics. As the player progresses, they gain access to shells, small glyphs, new tools, and Rune Stones.

Each Rune Stone follows its own acquisition and installation sequence. Placing it changes the state of the corresponding platform sector and opens new interaction possibilities.

An important element of the later gameplay is the Asterion Resonator — a spatial system for detecting and targeting distant objects.

Its field is generated from the current configuration of the sectors. Changing their positions alters the geometry of the active area, while registered targets are detected based on their actual position relative to the nominal field.

Targeting unfolds in stages. Objects receive signs and resonance rings that communicate progress, readiness to be pulled, and loss of contact.

Detection logic remains separate from presentation geometry. As a result, the field's visual bends, rounded forms, glows, and animations do not alter the gameplay rules.

The Resonator combines several independent systems into a single mechanical whole: sector movement, spatial geometry, target detection, progression, and player feedback.`
          },
          {
            title: 'Technical art, animation, and spatial audio',
            text: `The visual layer of Orange Monkey VR uses GLB models, materials, emission maps, animations, and procedural effects.

I created the models and world elements using Meshy AI, Blender, Inkscape, and GIMP. An important part of the process was adapting geometry, pivots, anchors, and transformation hierarchies for use in a VR environment.

The visual effects include energy discharges, light-based object reactions, animated resonance fields, pulling effects, the materialization of platform elements, and the final transformation of the world.

The procedural lightning system uses a custom path generator and a limited pool of shared resources. Its appearance is inspired by branching electrical discharges, but it is not a physical simulation of electromagnetism.

The audio layer is equally important.

I created a set of sound effects and atmospheres using Adobe Firefly and ElevenLabs, followed by editing and mixing in Ableton Live.

The custom audio system handles event-based playback, device loops, ambient sequences, and spatial sound sources. HRTF positioning allows the player to locate sources in the surrounding world, while separate buses support independent control over sound categories.

Sound is not merely background. It communicates the state of tools, the beginning of targeting, object acquisition, process completion, and changes taking place in the world.`
          }
        ],
        aiWorkflow: [
          'Orange Monkey VR was developed through a human–AI collaboration model based on a deliberate division of responsibilities.',
          'My role included the concept and artistic vision, player-experience design, mechanics and gameplay flow, requirement definition, asset production, integration, and evaluation of results in an actual VR environment.',
          'ChatGPT supported architectural development, dependency analysis, systems design, documentation, audits, and the preparation of implementation tasks.',
          'Codex carried out defined programming tasks: module implementation, feature integration, refactoring, and code fixes.',
          'As the project grew in complexity, we also developed the collaboration process itself. Canonical technical models, a Decision Log, a dependency map, standards for writing Scenario points, and a protocol for carrying out constrained tasks were created.',
          'Documentation became the operational memory of the project. It made it possible to distinguish current code from planned features, preserve architectural decisions, and reduce regression risk during successive migrations.',
          'This way of working allowed me to lead a complex creative and technical project while using AI capabilities without handing over responsibility for the vision, development direction, or final approval of solutions.'
        ],
        result: `Orange Monkey VR is a playable WebXR experience built in JavaScript and rendered with Three.js.

The project includes multi-stage progression, a custom Scenario and direction system, a modular actor architecture, sandbox mechanics, VR interaction tools, a Rune Stone system, the Asterion Resonator, procedural effects, spatial audio, and a narrative ending.

The game takes approximately 40 minutes to complete for a player who already knows the mechanics. For someone discovering the world for the first time, it may take longer.

The game was developed and validated on Meta Quest 3S, including through Virtual Desktop. It is available as a browser-based VR experience, and its code is hosted in a public repository.

Orange Monkey VR is, for me, an example of how systems design, artistic direction, and collaboration with AI can come together in the process of creating a complete interactive experience.`
      }
    }
  }
};
