# Experience VR — kanoniczny model aktu kamieni runicznych

## 1. Status i authority

- **Status:** **KANONICZNY MODEL TECHNICZNO-GAMEPLAYOWY / PARTIALLY IMPLEMENTED**.
- **Implemented:** `RUNE A1–A8`, `RUNE UI-1 — Astro Furnace panel structure and readability normalization` oraz `RUNE A9.1 — canonical Rune Stone asset identity + physical natural Rune Stone actor foundation`.
- **Foundation correction:** natural Rune tuning sector gate — **RESOLVED**; implementation evidence: `1d8d5ad — Decouple natural Rune tuning from sector completion`.
- **RUNE A9:** **PARTIALLY IMPLEMENTED**; kolejnym bounded actor slice jest physical `RUNESTONES` target resolution + `LOCKED_BY_ASTRO` foundation.
- **Scenario authoring:** **DEFERRED TO SEPARATE THREAD**.
- **Canonical authored Scenario/runtime progression boundary:** `4.80`.
- Dokument jest kanonicznym źródłem prawdy Rune Stone Act: strojenia Astrolabium, targetability, pięciu naturalnych pair-specific par, mostów, transportu, instalacji, specjalnego flow Eteru i finalnego polowania Wody.
- A1–A8 i A9.1 są foundations/domain behavior bez rozszerzenia authored Scenario spine. Pozostała część A9 oraz A10–A21 są targetem; Scenario, Director i literalna komunikacja gracza zostaną zaprojektowane osobno.

`KANON` oznacza wiążący kontrakt, `TUNING` wartość dobieraną w prototypie/Quest 3S, a `OPEN DESIGN DECISION` świadomie nierozstrzygnięty warunek.

## 2. Granica aktu i przestrzeń

Po `4.80` pięć naturalnych Large Glyph zachowuje Proto-Astro tuning `K/T/S/L/R`. Istniejący transition przenosi je do `SPHERE_FAR = 80 m`, rozmieszcza deterministycznie po pełnej sferze, nadaje black/unlit presentation i bardzo wolny ruch (`0.01 rad/s`) oraz odcina stary direct scan/target/pull. Large Glyph pozostają osobnymi aktorami poza spherical-layer registry.

Pięć naturalnych Rune Stones — Earth, Fire, Wood, Metal i Water — jest obecnie fizycznie materializowanych jako niezależne obiekty świata w już zarezerwowanym world-stable layer `RUNE_STONES = 50–75 m`; nie powstał nowy radius, drugi spherical layer ani drugi registry. Deterministyczny placement używa pięciu naturalnych slotów po pełnej sferze, jest niezależny od kierunku sektora platformy i nie ma Earth-first semantics. Ich obecność jest niezależna od tuning i platform installation readiness oraz sama nie nadaje prawa targetowania. Ether nie należy do tego naturalnego spawnu.

W trakcie aktu gracz może stroić, targetować i przyciągać różne naturalne kamienie w dowolnej kolejności. Nie istnieje wymuszony pierwszy kamień gameplayowy. Earth jest wyłącznie pierwszą parą referencyjną do implementacji i inspekcji actor mechanics.

## 3. Trzy niezależne prawa

Nie istnieje jedno wspólne `eligibility`. System bezwzględnie rozdziela:

1. **RUNE TUNING** — czy Astrolabium zostało nastrojone do rodziny;
2. **RUNE STONE TARGETABILITY** — czy kamień może być legalnym targetem pasma `RUNESTONES`;
3. **PLATFORM INSTALLATION READINESS** — czy pair-specific platforma może przyjąć kamień.

### 3.1. Natural Rune tuning

Od wejścia w Rune Stone Act wszystkie pięć naturalnych rodzin może być wybierane i strojone w Astro Piecu. Kompletność paneli sektora **nie blokuje** natural Rune tuning. Gracz może nastroić dowolną liczbę rodzin bez wymuszonej kolejności.

Natural family availability wynika wyłącznie z `PROTO_ASTRO_NATURAL_FAMILY_CODES`. Rodzina jest tunable wtedy i tylko wtedy, gdy jest naturalna i nie została jeszcze nastrojona; rodziny obecnej w `tunedRuneFamilies` nie można nastroić ponownie. Availability i tunability nie zależą od sector completeness, bridge readiness, installation readiness, zainstalowanych Rune Stones ani kolejności progresji platformy.

### 3.2. Natural Rune Stone targetability

```text
natural targetability = tunedRuneFamilies
```

Nastrojona naturalna rodzina jest legalnym targetem Astrolabium w paśmie `RUNESTONES`, niezależnie od installation readiness. Przykładowo `Water tuned = true` przy `Water platform readiness = false` oznacza, że Water Rune Stone można targetować i przyciągać, ale nie można jeszcze ukończyć jego instalacji. A7 implementuje dokładnie tę semantykę dla naturalnego target set.

### 3.3. Platform installation readiness

Installation readiness jest osobnym prawem, normalnie pochodzącym wyłącznie z ukończenia wszystkich paneli właściwego sektora. Rune domain czyta istniejącego ownera progresji sektora i nie tworzy drugiej listy ukończonych paneli. Readiness nie jest kopią progression.

Aktualna foundation correction nie podłącza installation readiness do aktora mostu. Synchronizacja bridge readiness pozostaje przyszłym zakresem integration/domain; sector completeness może nadal być źródłem platform installation readiness, lecz nigdy natural Rune tuning.

| Naturalna para | Installation readiness po `4.80` |
| --- | --- |
| EARTH | `true` |
| FIRE | `true` |
| WOOD | `true` |
| METAL | `false`, do ukończenia całego sektora Metal |
| WATER | `false`, do specjalnego Water-only override |

Water nie osiąga zwykłego sector-complete przed finalnym rozwiązaniem opisanym w sekcji 10.

## 4. Naturalne receptury Wu Xing

Canonical resolver Wu Xing używa niezmienionego cyklu tworzenia. Pierwszy element dostarcza **Small Glyph**, drugi **Shell**, a wynik stroi Rune Stone drugiego elementu.

| Small Glyph | Shell | Target tuned Rune Stone |
| --- | --- | --- |
| EARTH | METAL | METAL |
| METAL | WATER | WATER |
| WATER | WOOD | WOOD |
| WOOD | FIRE | FIRE |
| FIRE | EARTH | EARTH |

Wybrana naturalna rodzina i poprawna para wystarczają do walidacji receptury; sector completeness nie jest kanonicznym gate tuningu. Nieprawidłowa para nie rozpoczyna procesu. Asset identity nadal pochodzi z istniejących resolverów Proto-Astro, bez równoległej tabeli asset IDs.

## 5. Astro Piec — ownership i proces

- Existing single-content `createVrAstroFurnaceContentInteraction` zachowuje dotychczasowe procesy i `VR_FURNACE_CONTENT_ANCHOR`.
- `createVrAstroFurnaceRuneRecipeInteraction` jest osobnym ownerem dwóch typed slots i działa w `rune_tuning` mode.
- `RUNE_RECIPE_SMALL_GLYPH_SLOT` przyjmuje Small Glyph, a `RUNE_RECIPE_SHELL_SLOT` Shell; składniki można osadzić w dowolnej kolejności.
- `VR_FURNACE_PRODUCT_VOLUME` jest authored bounds/placement contract dla produktów urządzeń, nie trzecim składnikiem receptury.
- Jeden poprawny komplet i zaakceptowane `Activate` uruchamiają jeden `RUNE_TUNING` cycle `18 s`, używający `astro_piec_work_03.mp3`.
- Successful COMPLETE konsumuje oba składniki i atomowo zapisuje naturalną rodzinę w `tunedRuneFamilies`; abort nie konsumuje składników i nie zapisuje truth.
- Wynikiem jest semantyczna sylaba, nie fizyczny item. Rune Stone nigdy nie trafia do Pieca.
- Komora i dolna pokrywa nie wykonują process-spin; wewnętrzne światło i energy points mogą używać fazy procesu.

`RuneRecipeSelectionController` nie zależy od `progressionController` i nie odczytuje `isBranchComplete()`, sector state, bridge state, installation readiness ani Scenario state. Publiczna semantyka selection używa `isFamilyAvailable()`, `getAvailableFamilyCodes()` i `availableFamilyCodes`; zachowane są `isFamilyTunable()`, `getTunableFamilyCodes()`, `tunableFamilyCodes` oraz `tunedFamilyCodes`.

HOME pokazuje neutralne `5 RODZIN`, bez licznika `X ELIGIBLE`. Naturalne rodziny używają stanów `DOSTĘPNA`, `WYBRANA` i `ZESTROJONA`. Eter pozostaje nieaktywnym `SPECJALNY` poza naturalnym tuning contract; ta korekta nie jest przebudową layoutu UI.

Naturalne `tunedRuneFamilies`, specjalny Ether tuning truth oraz `installedRuneFamilies` są odrębnymi faktami. `ProtoAstroTuningController` zachowuje wyłącznie naturalne essences dla Large Glyph i nie posiada Rune Stone tuning ani installation truth.

## 6. Pięć pair-specific par i generic actor contract

Istnieje dokładnie pięć naturalnych par: `earth`, `fire`, `wood`, `metal`, `water`. Każda składa się z:

```text
Rune Stone + sector + bridge + vessel/socket + pair-specific authored transforms/config
```

Aktorzy są projektowani **pair-generic** od początku, używając `branchId`/family/pair config. Nie powstaje pięć implementacji tej samej maszyny ani późniejsza migracja z jednorazowego Earth slice. Każda para zachowuje własne authored transformy, socket height, socket zone, radial axis, safe envelope, occupied arcs i parametry ruchu. Zakazane są jeden globalny socket height, magiczny world offset i globalny safe envelope.

Canonical asset identity obejmuje sześć kamieni, lecz standardowa natural Rune Stone actor collection obejmuje dokładnie pięć: `earth`, `fire`, `wood`, `metal`, `water`.

| Asset | Element | `familyCode` | `familyId` | Klasyfikacja / branch | Naturalna sylaba |
| --- | --- | --- | --- | --- | --- |
| `stone_01.glb` | FIRE | `R` | `fire` | natural branch `fire` | `RU` |
| `stone_02.glb` | METAL | `T` | `metal` | natural branch `metal` | `TU` |
| `stone_03.glb` | EARTH | `K` | `earth` | natural branch `earth` | `KU` |
| `stone_04.glb` | WOOD | `L` | `tree` | natural branch `wood` | `LU` |
| `stone_05.glb` | WATER | `S` | `water` | natural branch `water` | `SU` |
| `stone_06.glb` | ETHER | `V` | `astro` | **SPECIAL**, `branchId: null` | brak; `VU` nie istnieje |

Jeden pair-generic physical Rune Stone owner materializuje pięć naturalnych stones. Każdy z nich posiada canonical descriptor, `familyCode`, `familyId`, `branchId`, asset identity, stabilny `RuneStoneActorRoot`, `RuneStoneVisualRoot` z klonem authored GLB hierarchy, własne `Box3`, `BoundingSphere` i `interactionRadius`, initial deterministic transform oraz początkowy transient state `FREE`. Jeżeli asset zawiera clips, kamień posiada również własny `AnimationMixer` i actions.

`RuneStoneActorRoot` jest stabilnym gameplay/transport rootem. `RuneStoneVisualRoot` zawiera authored GLB. Wewnętrzne `RELIC_*`, animated controllers, meshes i keyframes nie są gameplay transport rootem. Visual hierarchy jest recenterowana względem geometrycznego center bez przebudowy binarnego GLB i bez modyfikowania pojedynczych animated nodes.

Rune Stones zachowują authored scale; runtime **nie** normalizuje sześciu kamieni do wspólnego rozmiaru. Znana charakterystyka assetów to większe WOOD / `stone_04` i METAL / `stone_02`, mniejsze WATER / `stone_05` i ETHER / `stone_06` oraz pośrednie FIRE / `stone_01` i EARTH / `stone_03`. Są to opisy assetów, nie gameplay size categories. Rzeczywisty `interactionRadius` jest wyliczany osobno z geometrii każdego modelu.

**Authored animation lifecycle — IMPLEMENTED:** clips są zachowywane; per-stone `AnimationMixer` istnieje, jeżeli asset ma clips; runtime `update()` aktualizuje owned mixers; `reset()` restartuje authored actions od deterministycznego początku; `dispose()` zatrzymuje owned animation lifecycle. Transport nie manipuluje wewnętrznymi animated controller nodes. Nie jest to claim implementacji gameplayowego transportu.

Zalecany kontrakt GLB:

```text
RUNE_STONE_<TYPE>_ROOT

RUNE_VESSEL_<TYPE>_ROOT
├── RUNE_VESSEL_<TYPE>_MESH
├── RUNE_VESSEL_<TYPE>_SOCKET_POINT
└── RUNE_VESSEL_<TYPE>_SOCKET_ZONE
```

Runtime transformuje stabilny root kamienia. `SOCKET_POINT` jest pair-specific finalnym transformem, a `SOCKET_ZONE` strefą przejęcia. Safe envelope obejmuje pełny baked loop. Geometry, tolerancje, easing i release/return/parking behavior pozostają `TUNING` lub actor implementation decision, o ile nie rozstrzyga ich osobny kontrakt.

## 7. Pair-generic RuneBridgeActor

Istnieje pięć niezależnych pair-configured instancji `RuneBridgeActor`: `earth`, `fire`, `wood`, `metal` i `water`. Każda posiada własny transient state. Earth nie ma specjalnej implementacji, a dla Eteru nie istnieje bridge. Aktor nie zna Scenario pointów, nie posiada progression truth ani tuning truth i reaguje przez jawne semantic command API: `getState(branchId)`, `setInstallationReady(branchId, ready)`, `beginExtension(branchId)`, `completeExtension(branchId)`, `cancelExtension(branchId)`, `setInstalled(branchId)`, `reset()` oraz `dispose()`.

```text
HIDDEN → DOCKED → EXTENDING → EXTENDED → ORBITING
```

`VR_RUNE_BRIDGE_STATES` eksportuje dokładnie pięć stanów: `HIDDEN`, `DOCKED`, `EXTENDING`, `EXTENDED` i `ORBITING`. Legalne przejścia to `HIDDEN → DOCKED`, `DOCKED → HIDDEN`, `DOCKED → EXTENDING`, `EXTENDING → EXTENDED`, `EXTENDING → DOCKED`, `EXTENDED → DOCKED` oraz `EXTENDED → ORBITING`; próba nielegalnego przejścia zgłasza błąd kontraktu. `reset()` przywraca wszystkie pięć par do `HIDDEN`.

| Stan | Kontrakt |
| --- | --- |
| `HIDDEN` | platforma pary nie jest gotowa do instalacji |
| `DOCKED` | platforma jest gotowa; most istnieje i czeka na właściwy kamień |
| `EXTENDING` | właściwy kamień zbliża się do pair-specific installation area |
| `EXTENDED` | most przygotował przestrzeń dla capture |
| `ORBITING` | właściwy kamień został prawidłowo zainstalowany |

**Platform installation readiness** jest dostarczane aktorowi z zewnątrz i, w przeciwieństwie do tuning truth, pozwala mostowi przejść z `HIDDEN` do `DOCKED`. Aktor nie czyta sector progression i nie posiada installed progression truth; `setInstalled()` zapisuje wyłącznie transient bridge state `ORBITING`. Przerwane podejście przed capture powoduje `EXTENDING / EXTENDED → DOCKED`. Po `4.80` mosty Earth, Fire i Wood mogą być `DOCKED`; Metal pozostaje `HIDDEN` do pełnego ukończenia sektora Metal, a Water do specjalnego finalnego override.

**STATE MACHINE = IMPLEMENTED. PHYSICAL BRIDGE MOTION = TARGET / TUNING.** A8 implementuje state/command foundation, nie fizyczną animację ruchu mostu. Obecnie `HIDDEN` oznacza niewidoczną instancję, a każdy stan non-`HIDDEN` — widoczną instancję. Zachowane są authored bridge alignment, `bridgeRoot`, helper nodes i capture radius. Metry extension, duration, easing, retract distance, orbit speed, socket height, safe envelope i procedural deformation nie są zaimplementowane ani zamrożone; pozostają `TUNING` lub zakresem późniejszego actor contractu.

## 8. Transport i instalacja

**A9.1 physical foundation jest IMPLEMENTED; poniższa pełna maszyna transportu i instalacji pozostaje TARGET / NOT IMPLEMENTED poza początkowym stanem `FREE`.**

```text
FREE → LOCKED_BY_ASTRO → CARRIED_ORBIT → SOCKET_CAPTURE → INSTALLED
```

- `FREE`: naturalny kamień istnieje w `RUNE_STONES = 50–75 m`; może być targetowany tylko, gdy family is tuned.
- `LOCKED_BY_ASTRO`: Astrolabium posiada legalny lock; kamień nie teleportuje się do ręki.
- `CARRIED_ORBIT`: pull prowadzi root według pair-specific config i safe envelope.
- `SOCKET_CAPTURE`: wymaga gotowej właściwej platformy i poprawnego stone/pair match; aktor interpoluje do pair-specific `SOCKET_POINT`.
- `INSTALLED`: dopiero ukończony socket snap zapisuje persistent installed fact.

Target i transport nie wymagają installation readiness, natomiast `SOCKET_CAPTURE` i `INSTALLED` jej wymagają. Metal lub Water mogą więc zostać przyciągnięte wcześniej, ale nie zainstalowane. Dokument nie zamraża arbitralnego zachowania kamienia po nieudanej próbie instalacji.

Każdy kamień może zachowywać pair-specific cichy spatial loop w `FREE`, `CARRIED_ORBIT` i `INSTALLED`. Audio playback/dispose należy do runtime audio bridge, a asset, gain i attenuation pozostają `TUNING`; audio nie posiada progression truth.

## 9. Ownership i persistent truth

| Owner | Posiada | Nie posiada |
| --- | --- | --- |
| owner progresji sektorów | kompletność paneli sektorów | rune tuning/installed truth |
| `RuneStoneProgressionController` lub jawny rune-domain contract | naturalne `tunedRuneFamilies`; docelowo `installedRuneFamilies`, special Ether tuned truth i Water installation readiness override | kopia paneli, transient transport |
| recipe/Furnace actors | typed slots, transient recipe i process | installed truth |
| Rune Stone actor | transient physical/presentation state; docelowo lock, transport i capture mechanics | tuning truth, platform installation readiness truth, installed progression truth i Scenario cursor |
| `RuneBridgeActor` | transient bridge mechanics/presentation | tuning, readiness source i installed progression |
| Monkey/Ether actor | transient Ether presentation/capture mechanics | progression truth |
| Scenario / Director | authored beat legality i semantic orchestration | interpolacje, pull, slot/capture mechanics |

Nazwa API special Ether tuned truth pozostaje otwarta; dokument zamraża jego semantykę, nie przypadkowy identifier.

## 10. Eter / VI — specjalny późny flow

Eter nie jest szóstą naturalną `familyCode`, szóstą standardową Rune Stone pair, szóstym sektorem, vessel/socketem ani installed elemental slotem. Nie należy do `PROTO_ASTRO_NATURAL_FAMILY_CODES`; nie istnieje i nie wolno tworzyć naturalnego kodu `VU`.

`stone_06.glb` ma canonical physical asset identity ETHER / `V` / `astro` / **SPECIAL** z `branchId: null`, ale Ether nie jest naturalną Rune Stone syllable w tym registry. Nie jest jeszcze materializowany przez natural actor, nie należy do natural pair collection ani naturalnego spawnu `RUNE_STONES`, nie ma bridge, sektora ani natural installed slotu. Zostanie wykorzystany później przez special Ether / Monkey flow.

### 10.1. Trigger i Monkey beat contract

Ścieżka Eteru jest niedostępna na początku aktu. Jej stabilnym triggerem jest `FOURTH_RUNE_INSTALLED`, czyli ukończona instalacja Metal Rune Stone, nie chwilowe przyciągnięcie Metalu. Po czwartej instalacji ujawnia się, że Water sector nadal nie może zostać normalnie ukończony.

Przyszły, lekko żartobliwy beat Małpy ma semantyczny rezultat **UNLOCK ETHER RUNE TUNING**. Przed nim Ether tuning nie może się rozpocząć. Ten dokument określa wyłącznie gameplay contract: nie authoruje dialogu, Scenario pointów, events/effects, Director transitions ani literalnych hintów.

### 10.2. Special Ether tuning i targetability

```text
Ether Shell + Ether Small Glyph
→ Astrolabium tuned for special Ether Rune Stone
```

Ta para nie używa naturalnego resolvera Wu Xing i nie zmienia pięciu naturalnych receptur. Special Ether tuned truth jest trwałym faktem jednoznacznego rune-domain ownera i pozostaje odrębny od naturalnego `tunedRuneFamilies`.

Ether Rune Stone staje się specjalnym legalnym targetem dopiero po obu warunkach:

1. przyszły Monkey beat odblokował Ether tuning;
2. ukończono poprawne Ether Shell + Ether Small Glyph tuning.

A7 implementuje naturalny target set. Przyszłe rozszerzenie o specjalny Ether target nie zmienia natural family contract A7 i nie czyni Eteru naturalną rodziną.

### 10.3. Ether transport, Monkey capture i rezultat

Ether Rune Stone nie należy do pięciu początkowych naturalnych kamieni platformy. Jego presentation/availability pojawia się dopiero w specjalnym flow po `FOURTH_RUNE_INSTALLED`. Po special tuning gracz targetuje Ether, przyciąga go i prowadzi do Małpy. Ether nie trafia do bridge ani vessel; Małpa przechwytuje go jako osobny authored/presentation beat.

Monkey capture nie nadaje prawa do Water tuning. Jego jedynym trwałym rezultatem jest:

```text
WATER PLATFORM INSTALLATION READINESS OVERRIDE
```

Override pozwala Water platform przyjąć Water Rune Stone mimo braku zwykłego sector-complete. Nie zmienia Water Wu Xing recipe, Water tuned truth, panel completion truth ani natural family definitions. Persistent ownerem jest `RuneStoneProgressionController` lub jego jawny rune-domain contract; nazwa implementacyjna pozostaje otwarta. Poprzednie znaczenie `WATER_RUNE_KNOWLEDGE_OVERRIDE` / Water tuning eligibility override jest superseded.

### 10.4. Piąta instalacja Water

Po Monkey capture Water bridge może przejść `HIDDEN → DOCKED`. Water może być już wcześniej tuned i wtedy nie wymaga ponownego strojenia. Jeśli nie jest tuned, używa normalnej receptury `Metal Small Glyph + Water Shell → Water`.

```text
Water Rune Stone
→ target
→ transport
→ SOCKET_CAPTURE
→ INSTALLED
```

Po instalacji `installedRuneFamilies` zawiera pięć naturalnych rodzin. Eter nie zajmuje szóstego slotu.

## 11. Kompletna platforma i finalna Woda

`FIVE_ELEMENTAL_RUNES_INSTALLED` ujawnia lub umożliwia finalne odnalezienie ostatniego Water Large Glyph. Może on następnie zostać targetowany i przyciągnięty istniejącą późną mechaniką platformy/anteny.

```text
FIVE_ELEMENTAL_RUNES_INSTALLED
→ FINAL_WATER_HUNT (180 s, TUNING)
→ finalny Water Large Glyph: find / pull
→ ostatni Water Crystal
→ Reliquary
→ ostatni panel Water
→ ukończenie Experience VR
→ istniejący finale handoff
```

Timer `180 s` pozostaje **TUNING** i zaczyna się dopiero z rzeczywistym `FINAL_WATER_HUNT`, nie podczas Ether flow, Water tuning, transportu ani capture. Timer jest transient mechaniką final-hunt ownera. `FINAL_HUNT_TIMEOUT_BEHAVIOR` pozostaje `OPEN DESIGN DECISION`.

## 12. Scenario, Director i reconstruction — deferred authoring

Obowiązuje architektura:

```text
SPINE → SCENARIO → DIRECTOR → RuntimeExperience → ACTORS / DOMAIN OWNERS
```

Scenario authoring Rune Stone Act jest **DEFERRED TO SEPARATE THREAD**. Obecny etap buduje actor/domain foundations. Nie powstają tu nowe Scenario point IDs, numerowane beaty, capabilities, events/effects ani Director transitions. Canonical authored Scenario/runtime boundary pozostaje `4.80`, dopóki osobne zadanie nie rozpocznie authoringu po tej granicy.

Przyszłe Scenario zachowa ownership istotnych beatów i semantic orchestration; Director legalność przejść; RuntimeExperience symbolic effects; actors transient mechanics; domain owners persistent truths. Interpolacja mostu, sloty, tuning timer, target/pull i `SOCKET_CAPTURE` nie są Scenario pointami. Reconstruction składa settled truths, nie odtwarza trwających procesów i interpolacji.

### DEFERRED PLAYER COMMUNICATION REQUIREMENTS

Osobny przyszły wątek Scenario / Player Communication musi zaprojektować co najmniej:

- komunikację niezależności tuning i installation readiness;
- informację, że nastrojony kamień może nie mieć przygotowanego miejsca;
- beat po czwartej instalacji wyjaśniający problem ostatniego Water panel/glifu;
- żartobliwą interwencję Małpy i ujawnienie ścieżki Eteru;
- instrukcję special Ether tuning;
- prowadzenie Ether Rune Stone do Małpy;
- komunikat po capture Eteru, że Water installation path jest gotowa;
- komunikat po `FIVE_ELEMENTAL_RUNES_INSTALLED` prowadzący do ostatniego glifu.

Ten dokument nie ustala literal copy. Copy należy później zsynchronizować z canonical communication mechanics/copy docs; tych dokumentów nie zmienia się w tym zadaniu.

## 13. Milestones

### RUNE A1–A6 i RUNE UI-1

- **Status:** **IMPLEMENTED**.
- A1–A5 dostarczyły rune-domain foundation, dwa typed recipe slots, naturalny resolver Wu Xing, panel selection, pojedynczy `18 s` process i trwałe `tunedRuneFamilies`.
- Historyczny A4 pierwotnie dostarczył sector-derived tuning eligibility. Current contract został skorygowany przez bounded follow-up `1d8d5ad`, który usunął ten gate zgodnie ze zrewidowanym kanonem; A4 pozostaje **IMPLEMENTED**.
- **Implementation evidence follow-up:** `1d8d5ad — Decouple natural Rune tuning from sector completion`.
- A6 dostarczyło post-Tier-3 transition Large Glyph do `SPHERE_FAR = 80 m` i odcięcie starego direct targetowania po `4.80`.
- UI-1 dostarczyło hierarchię Furnace UI i wspólną prezentację `3 × 2`; Eter w UI pozostaje specjalnym `VI`, nie naturalną rodziną.

### RUNE A7 — RUNESTONES Astro band

- **Status:** **IMPLEMENTED**.
- **Implementation evidence:** `097d5d5 — Implement RUNESTONES Astro band`.
- `VR_ATTRACTOR_BANDS.RUNESTONES` istnieje i jest available po co najmniej jednej naturalnej tuned family.
- Natural targetable family set pochodzi bezpośrednio z `tunedRuneFamilies`; projekcja jest bezstanowa i nie posiada własnego eligibility ani persistence.
- A7 nie tworzy fizycznych Rune Stone targets ani actorów, materialization, scan/pull, transportu i instalacji.
- A7 implementuje natural target set. Special Ether target zostanie dodany później przez special Ether flow bez zmiany natural family contract.

### RUNE A8 — Pair-generic RuneBridgeActor state machine

- **Status:** **IMPLEMENTED**.
- **Implementation evidence:** `42f237c — Implement pair-generic RuneBridge state machine`.
- Pięć niezależnych pair-generic instancji `earth/fire/wood/metal/water` implementuje pięć transient states i jawne semantic commands; Earth nie ma specjalnego wariantu, a Eter nie ma bridge.
- Platform installation readiness jest wejściem zewnętrznym. Aktor nie odczytuje tuning truth ani sector progression oraz nie posiada installed progression truth; `setInstalled()` ustawia wyłącznie transient state `ORBITING`.
- Nielegalne transitions są odrzucane, a `reset()` przywraca wszystkie pary do `HIDDEN`.
- **Nie implementuje:** fizycznej animacji bridge motion ani jej parametrów, Rune Stone transportu, socket capture, persistent installed truth i Scenario progression.

### RUNE A9 — Pair-generic Rune Stone transport + installation mechanics

- **Status:** **PARTIALLY IMPLEMENTED**.
- **A9.1 — IMPLEMENTED:** canonical asset identity + physical natural Rune Stone actor foundation.
- **Implementation evidence:** `c52775f — Implement canonical Rune Stone asset identities and actor foundation`.
- A9.1 obejmuje canonical six-asset identity, five-natural actor collection, Ether special descriptor, physical natural stones, real per-asset bounds, stable transport roots, authored animation lifecycle, deterministic natural placement w `RUNE_STONES = 50–75 m`, world-stable `update()`/`reset()`/`dispose()` composition i initial `FREE` state.
- **A9 remaining target:** `FREE → LOCKED_BY_ASTRO → CARRIED_ORBIT → SOCKET_CAPTURE → INSTALLED`.
- **TARGET / NOT IMPLEMENTED:** physical `RUNESTONES` scan, target candidate resolver, target halo, Astro lock, `LOCKED_BY_ASTRO` transition, pull, `CARRIED_ORBIT`, safe player carry distance, bridge readiness synchronization, bridge extension cooperation, socket approach, `SOCKET_CAPTURE`, snap, `installedRuneFamilies`, `INSTALLED` commit, `RuneBridgeActor.setInstalled()` cooperation, spatial audio, Ether materialization, Ether special targeting/transport, Monkey capture i Scenario integration.
- Następny bounded actor slice to physical `RUNESTONES` target resolution + `LOCKED_BY_ASTRO` foundation; nie przesądza jeszcze pełnego pull/carry/capture.

### RUNE A10 — Scenario / Director integration

- **Status:** **DEFERRED TO SEPARATE THREAD / NOT IMPLEMENTED**.
- Historyczny plan authoringu po `4.80` pozostaje odroczony. To zadanie nie tworzy nowych point IDs ani nie przesuwa boundary `4.80`.

### RUNE A11 — historyczny etap generalizacji

- **Status:** **SUPERSEDED AS A LATER MIGRATION**.
- Historyczny plan późniejszego rozszerzenia Earth slice na Earth/Fire/Wood został zastąpiony decyzją, że A8/A9 tworzą pair-generic contract od początku dla wszystkich pięciu naturalnych par.
- Pair-specific authored config i QA nadal są wymagane, lecz generalizacja nie jest osobną późniejszą migracją.

### RUNE A12–A15

- **Status:** **TARGET / NOT IMPLEMENTED**.
- A12 pozostaje Quest 3S hardware QA i tuning pair-specific parametrów.
- A13 pozostaje osobnym sector-control foundation po pierwszej instalacji.
- A14 pozostaje aktywacją przyszłej anteny po zainstalowaniu Earth + Fire + Wood.
- A15 pozostaje antenna hunt Metal + Water Large Glyph i Tier 4: Metal complete, Water `4/5`.

### RUNE A16 — Metal platform readiness + fourth installation

- **Status:** **TARGET / NOT IMPLEMENTED**.
- Metal może być tuned wcześniej; ukończenie sektora Metal nie rozpoczyna ani nie warunkuje jego naturalnego tuningu.
- A16 dotyczy Metal platform readiness po sector-complete oraz transportu, capture i instalacji Metal.
- Rezultatem jest `FOURTH_RUNE_INSTALLED` i installed Earth + Fire + Wood + Metal.

### RUNE A17 — Fourth-rune technology-overload / Large Glyph retreat

- **Status:** **TARGET / NOT IMPLEMENTED**.
- `FOURTH_RUNE_INSTALLED` pozostaje semantycznym progiem późnej prezentacji; konkretny promień retreat pozostaje otwarty. Scenario authoring beatu jest odroczony.

### RUNE A18 — Special Ether flow + Water installation readiness override

- **Status:** **TARGET / NOT IMPLEMENTED**.
- Kontrakt: `FOURTH_RUNE_INSTALLED → Monkey reveals Ether route → Ether tuning unlocked → Ether Shell + Ether Small Glyph special tuning → Ether Rune targetable → Ether transported to Monkey → Monkey captures Ether → Water installation readiness override`.
- Nie implementuje szóstej naturalnej rodziny, sektora, bridge, vessel ani installed slotu.

### RUNE A19 — Water readiness, transport i fifth installation

- **Status:** **TARGET / NOT IMPLEMENTED**.
- Water nie wymaga nowego tuningu, jeśli zostało tuned wcześniej. Jeśli nie, zachowuje naturalną recepturę Wu Xing.
- A19 obejmuje Water bridge/readiness po override, target/transport, capture i piątą instalację.

### RUNE A20 — Final Water timed hunt

- **Status:** **TARGET / NOT IMPLEMENTED**.
- Prerequisite: `FIVE_ELEMENTAL_RUNES_INSTALLED`.
- Zachowuje finalny Water Large Glyph, `FINAL_WATER_HUNT` i timer `180 s` jako **TUNING**, a następnie pozyskanie ostatniego Water Crystal.

### RUNE A21 — Last Crystal / final panel / finale handoff

- **Status:** **TARGET / NOT IMPLEMENTED**.
- Reliquary commit ostatniego Water Crystal domyka Water `5/5`, Experience VR i przekazuje flow do istniejącego finale handoff.

## 14. Inwarianty, zakazy i otwarte decyzje

- Istnieje sześć canonical physical Rune Stone asset identities, dokładnie pięć naturalnych gameplay pairs/families i pięć naturalnych installed slots oraz jeden special Ether asset.
- Eter nie jest naturalną family ani szóstą naturalną parą, sektorem, vessel/socketem ani installed slotem; `VU` nie istnieje.
- Authored scale pozostaje per asset; natural stones nie są normalizowane do jednego rozmiaru, a bounds są wyliczane per asset.
- Stabilny transport root nie jest żadnym wewnętrznym animated node.
- Natural field używa wyłącznie istniejącego `RUNE_STONES = 50–75 m`.
- Pięć naturalnych Wu Xing recipes pozostaje bez zmian.
- Natural tuning nie zależy od sector completion; natural targetability zależy od tuned truth; installation readiness zależy od platform/sector readiness lub jawnego Water-only override.
- Earth/Fire/Wood są installation-ready po `4.80`; Metal po ukończeniu sektora; Water po Monkey capture Eteru.
- Water może być tuned przed override. Ether tuning jest zablokowany do przyszłego Monkey beat i używa Ether Shell + Ether Small Glyph.
- Ether jest specjalnym późnym targetem transportowanym do Małpy, nie do platformy.
- `FIVE_ELEMENTAL_RUNES_INSTALLED` otwiera flow ostatniego Water Large Glyph.
- Zakazane są: drugi registry/radius; kopia panel completion; jeden globalny socket height/offset/envelope; teleport kamienia do ręki; progression truth w actorze; techniczne Scenario pointy dla interpolacji, timera, pull lub capture; nowe authored Scenario po `4.80` w ramach actor foundations.
- Pair-specific geometry, safe envelope, occupied arcs, carry/capture easing, bridge timing, spatial audio, release/return/parking behavior, late retreat distance i timeout behavior pozostają `TUNING` lub `OPEN DESIGN DECISION`.
- A9 nie jest jeszcze kompletne, a Scenario boundary pozostaje `4.80`.

## 15. Current implementation checkpoint

```text
RUNE A1–A8: IMPLEMENTED
RUNE UI-1: IMPLEMENTED

NATURAL RUNE TUNING SECTOR GATE: RESOLVED

RUNE A9: PARTIALLY IMPLEMENTED

A9.1: IMPLEMENTED
canonical Rune Stone asset identity + physical actor foundation
evidence: c52775f

NEXT ACTOR SLICE:
RUNE A9 — physical RUNESTONES targeting / lock foundation

SCENARIO AUTHORING:
DEFERRED TO SEPARATE THREAD

CANONICAL AUTHORED SCENARIO/RUNTIME PROGRESSION BOUNDARY:
4.80
```

**Known implementation divergence — RESOLVED:** sector-gated natural Rune tuning was resolved by `1d8d5ad — Decouple natural Rune tuning from sector completion`.

## 16. Powiązane dokumenty i przyszły sync

- [`VR_PROTO_ASTRO_MODEL.md`](VR_PROTO_ASTRO_MODEL.md) — identity resolver i natural essences vs rune truth.
- [`VR_SPHERICAL_LAYERS_MODEL.md`](VR_SPHERICAL_LAYERS_MODEL.md) — istniejący `RUNE_STONES = 50–75 m`.
- [`VR_PROGRESS_FLOOR_MODEL.md`](VR_PROGRESS_FLOOR_MODEL.md) — owner kompletności paneli sektorów.
- [`VR_SCENARIO_DIRECTOR_MODEL.md`](VR_SCENARIO_DIRECTOR_MODEL.md) — authored Scenario/Director ownership; Rune Stone authoring pozostaje osobnym zadaniem.
- Canonical communication mechanics/copy docs wymagają przyszłej synchronizacji literalnego copy po zaprojektowaniu osobnego wątku Player Communication; nie są zmieniane tutaj.
