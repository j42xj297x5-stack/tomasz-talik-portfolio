# Experience VR — kanoniczny model aktu kamieni runicznych

## 1. Status i authority

- **Status:** **KANONICZNY MODEL TECHNICZNO-GAMEPLAYOWY / NATURAL RUNE A9 FOUNDATION COMPLETE**.
- **Implemented:** `RUNE A1–A8`, `RUNE UI-1`, A9.1 physical actor foundation, authored-origin/live-bounds hardening, A9.2 target resolution + `LOCKED_BY_ASTRO`, A9.3 `CARRIED_ORBIT`, A9.4 installation-readiness projection, A9.5 platform-centered handoff + automatic installation choreography i A9.6 persistent hydration + settled physical reconstruction.
- **Foundation correction:** natural Rune tuning sector gate — **RESOLVED**; task `d0f9a17e414f3ea8c386cde87bdd46dba6dad16c`, merge `c862b9bde2e717918e56d21d7f1cbbc0ad741d53`.
- **RUNE A9:** **A9.1–A9.6 IMPLEMENTED; NATURAL RUNE A9 FOUNDATION = COMPLETE**. Końcowy transport i instalacja używają platform-centered handoff sphere oraz automatycznej choreografii, a hydration odtwarza settled physical installation. Collision carried Rune Stone ↔ installed Rune Stone jest **SUPERSEDED / REMOVED FROM TARGET**.
- **Scenario authoring:** **DEFERRED TO SEPARATE THREAD**.
- **Canonical authored Scenario/runtime progression boundary:** `4.80`.
- Dokument jest kanonicznym źródłem prawdy Rune Stone Act: strojenia Astrolabium, targetability, pięciu naturalnych pair-specific par, mostów, transportu, instalacji, specjalnego flow Eteru i finalnego polowania Wody.
- A1–A9.6 są foundations/domain behavior bez rozszerzenia authored Scenario spine. A9 foundation jest zamknięty; dalszy authored Scenario, Director i literalna komunikacja gracza wymagają osobnego projektu, bez arbitralnego etykietowania ich jako kolejny krok A9.

`KANON` oznacza wiążący kontrakt, `TUNING` wartość dobieraną w prototypie/Quest 3S, a `OPEN DESIGN DECISION` świadomie nierozstrzygnięty warunek.

## 2. Granica aktu i przestrzeń

Po `4.80` pięć naturalnych Large Glyph zachowuje Proto-Astro tuning `K/T/S/L/R`. Istniejący transition przenosi je do `SPHERE_FAR = 80 m`, rozmieszcza deterministycznie po pełnej sferze, nadaje black/unlit presentation i bardzo wolny ruch (`0.01 rad/s`) oraz odcina stary direct scan/target/pull. Large Glyph pozostają osobnymi aktorami poza spherical-layer registry.

Pięć naturalnych Rune Stones — Earth, Fire, Wood, Metal i Water — jest fizycznie materializowanych jako niezależne obiekty świata w już zarezerwowanym world-stable layer `RUNE_STONES = 50–75 m`; nie powstał nowy radius, drugi spherical layer ani drugi registry. Deterministyczny placement używa pięciu naturalnych slotów po pełnej sferze, jest niezależny od kierunku sektora platformy i nie ma Earth-first semantics.

**Canonical presentation:** pięć naturalnych Rune Stones jest widocznych od pierwszego pełnego odsłonięcia świata po wejściu gracza do kręgu / settled Monkey arrival, razem z gwiazdami, słońcem i pozostałym nieboskłonem. Od tego momentu istnieją jako odległe, animowane elementy świata, lecz interaction pozostaje disabled do czasu przyznania późniejszych capabilities. Ether nie podlega temu early reveal: jest `SPECIAL`, a jego materialization/reveal należy do późniejszego Ether/Monkey flow.

**VISIBILITY ≠ TARGETABILITY.** Wizualna obecność, tuning i targetability są niezależnymi prawami. Natural Rune Stone może być widoczny przy `tuned = false`, niedostępnym paśmie `RUNESTONES` i `targetability = false`; dopiero późniejszy tuning nadaje prawo targetowania. Platform installation readiness pozostaje trzecim, osobnym prawem gameplayowym opisanym poniżej.

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

Nastrojona naturalna rodzina jest legalnym targetem Astrolabium w paśmie `RUNESTONES`, niezależnie od installation readiness. Przykładowo `Water tuned = true` przy `Water platform readiness = false` oznacza, że Water Rune Stone może zostać scanned, targeted i `LOCKED_BY_ASTRO`, ale nie może jeszcze zostać zainstalowany. A7 pozostaje semanticznym ownerem permission, a A9.2 implementuje fizyczne resolution tego permission:

```text
RuneStoneProgressionController
        ↓
tunedRuneFamilies
        ↓
RuneStoneAttractorBandProjection
        ↓
physical RuneStoneAttractorInteraction
        ↓
legal RuneStoneActor candidate
```

`RuneStoneAttractorInteraction` nie posiada własnej kopii tuned truth. Legalny physical candidate musi jednocześnie mieć `descriptor.natural === true`, istniejący i widoczny physical `ActorRoot`, transient state `FREE` oraz potwierdzoną przez projekcję A7 family targetability. Sector completeness, platform installation readiness, bridge state i Scenario point nie uczestniczą w tym rozstrzygnięciu.

### 3.3. Platform installation readiness

Installation readiness jest osobnym prawem, normalnie pochodzącym wyłącznie z ukończenia wszystkich paneli właściwego sektora. Rune domain czyta istniejącego ownera progresji sektora i nie tworzy drugiej listy ukończonych paneli. Readiness nie jest kopią progression.

Ukończenie sektora materializuje trwały **Zwornik Runiczny** (techniczny asset może pozostać `bridge.glb`) i dopiero istniejący właściwy Zwornik daje miejsce późniejszej instalacji. Reveal Zwornika nie jest skutkiem instalacji Rune Stone. EARTH, FIRE i WOOD mogą mieć Zworniki przed ukończeniem pełnego trzeciego kręgu.

`ProgressionController.isBranchComplete()` zasila `RuneInstallationReadinessProjection`, która synchronizuje `RuneBridgeActor` do `HIDDEN/DOCKED`. **Bridge-readiness synchronization jest IMPLEMENTED także na live successful crystal/page commit:** composition po semantic handoff synchronizuje read-only projection, więc pierwsza zmiana readiness materializuje właściwy Zwornik przez jednoznaczne `HIDDEN → DOCKED`, bez Scenario eventu i bez drugiego registry. ** Sector completeness jest źródłem platform installation readiness, lecz nigdy natural Rune tuning ani targetability.

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

Po wybraniu naturalnej receptury oba typed slots znają expected family: `Small Glyph slot = Small Glyph type + expected family`, a `Shell slot = Shell type + expected family`. **Insertion validation jest IMPLEMENTED.** `RuneRecipeInteraction` pyta o expected recipe przez read-only seam do `RuneRecipeSelectionController`; nie kopiuje selection truth ani recipe table. Brak wybranej receptury blokuje insertion. Wrong Small Glyph family i wrong Shell family są odrzucane **przed ownership transfer**: składnik zostaje w ręce gracza i nie przechodzi do `SNAPPING` ani `INSERTED`. Poprawny składnik zachowuje istniejący snap lifecycle.

Obowiązują dwa poziomy walidacji: LEVEL 1 — insertion validation dla gameplay/UX acceptance; LEVEL 2 — `isRecipeValid()` / Rune tuning transaction validation jako final safety przed consume/commit. Insertion validation nie zastępuje końcowego transakcyjnego invariant.

## 5. Astro Piec — ownership i proces

- Existing single-content `createVrAstroFurnaceContentInteraction` zachowuje dotychczasowe procesy i `VR_FURNACE_CONTENT_ANCHOR`.
- `createVrAstroFurnaceRuneRecipeInteraction` jest osobnym ownerem dwóch typed slots i działa w `rune_tuning` mode.
- `RUNE_RECIPE_SMALL_GLYPH_SLOT` przyjmuje Small Glyph, a `RUNE_RECIPE_SHELL_SLOT` Shell; składniki można osadzić w dowolnej kolejności.
- `VR_FURNACE_PRODUCT_VOLUME` jest authored bounds/placement contract dla produktów urządzeń, nie trzecim składnikiem receptury.
- Jeden poprawny komplet i zaakceptowane `Activate` uruchamiają jeden `RUNE_TUNING` cycle `18 s`, używający `astro_piec_work_03.mp3`.
- Successful COMPLETE konsumuje oba składniki i atomowo zapisuje naturalną rodzinę w `tunedRuneFamilies`; abort nie konsumuje składników i nie zapisuje truth.
- Wynikiem jest semantyczna sylaba, nie fizyczny item. Rune Stone nigdy nie trafia do Pieca.
- Komora i dolna pokrywa nie wykonują process-spin; wewnętrzne światło i energy points mogą używać fazy procesu.

Wybranie **innej** receptury atomowo wykonuje semantykę:

```text
OLD RECIPE + currently snapping/inserted recipe ingredients
→ prepare recipe change
→ begin eject
→ recipe slots become EMPTY
→ select NEW RECIPE with empty slots
```

**Recipe-change eject jest IMPLEMENTED** wyłącznie dla istniejącej selected recipe → innej selected recipe; nie zachodzi przy pierwszym wyborze ani ponownym wyborze tej samej family. Obejmuje jeden Small Glyph, jeden Shell albo oba, zarówno w `SNAPPING`, jak i `INSERTED`. Na początku eject slot dostaje `content = null`, `state = EMPTY`, `elapsed = 0`; składnik nie jest konsumowany. Normalny eject nie wysyła Shell do orbit ani Small Glyph do field.

Target leży około `1.0 m` od Furnace insert/chamber center po stronie aktualnej pozycji gracza. Kierunek jest player-relative / platform-relative, nie globalnym `+X`/`+Z`; dwa składniki otrzymują deterministycznie rozdzielone targety. Duration, easing i lateral separation pozostają **TUNING**. Finalizacja przywraca legalne, ponownie podnoszalne obiekty: Shell kończy w canonical `placed`, a Small Glyph w canonical `PLACED` zarówno w `SmallGlyphSystem`, jak i transient ownerze `SmallGlyphAttractorInteraction`. Nie istnieje trwały domain state `EJECTED`. Explicit reset podczas transient eject nadal przywraca baseline: Shell → orbit, Small Glyph → field.

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
| `stone_06.glb` | ETHER | `V` | `astro` | **SPECIAL**, `branchId: null` | `VU` |

Jeden pair-generic physical Rune Stone owner materializuje pięć naturalnych stones. Każdy z nich posiada canonical descriptor, `familyCode`, `familyId`, `branchId`, asset identity, stabilny `RuneStoneActorRoot`, `RuneStoneVisualRoot` z klonem authored GLB hierarchy, live bounds, initial deterministic transform oraz transient state `FREE`, `LOCKED_BY_ASTRO`, `CARRIED_ORBIT`, `SOCKET_CAPTURE` lub `INSTALLED`. Jeżeli asset zawiera clips, kamień posiada również własny `AnimationMixer` i actions. Actor jest ownerem physical records, rootów, authored animations, live bounds, transient transport state i world-space motion commands.

`RuneStoneActorRoot` jest stabilnym gameplay/transport pivotem. Authored local `(0,0,0)` jest gameplay origin, a `RuneStoneVisualRoot` pozostaje neutralny i zawiera authored GLB. Nie istnieje geometryczne recentering przez centroid AABB. Wewnętrzne `RELIC_*`, animated controllers, meshes i keyframes nie są gameplay transport rootem.

Rune Stones zachowują authored scale; runtime **nie** normalizuje sześciu kamieni do wspólnego rozmiaru. Znana charakterystyka assetów to większe WOOD / `stone_04` i METAL / `stone_02`, mniejsze WATER / `stone_05` i ETHER / `stone_06` oraz pośrednie FIRE / `stone_01` i EARTH / `stone_03`. Są to opisy assetów, nie gameplay size categories. Construction-time `placementClearanceRadius` służy wyłącznie spherical placement. `getBoundingBox(branchId)` zwraca aktualny world-space `Box3`, `getBoundingSphere(branchId)` aktualny world-space `BoundingSphere`, a `getInteractionRadius(branchId)` aktualny live radius. Te live bounds uwzględniają authored animation pose w chwili odczytu; nie istnieje baked full-animation envelope sampler.

**Authored animation lifecycle i gameplay transport — IMPLEMENTED:** clips są zachowywane; per-stone `AnimationMixer` istnieje, jeżeli asset ma clips; runtime `update()` aktualizuje owned mixers; `reset()` restartuje authored actions od deterministycznego początku; `dispose()` zatrzymuje owned animation lifecycle. Transport `LOCKED_BY_ASTRO → CARRIED_ORBIT` manipuluje stabilnym rootem, nigdy wewnętrznymi animated controller nodes. Przyszłe pozostają idle/presentation movement oraz spatial audio, nie fizyczny transport.

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

Istnieje pięć niezależnych pair-configured instancji `RuneBridgeActor`: `earth`, `fire`, `wood`, `metal` i `water`. Każda posiada własny transient state. Earth nie ma specjalnej implementacji, a dla Eteru nie istnieje bridge. Aktor nie zna Scenario pointów, nie posiada progression truth ani tuning truth i reaguje przez jawne semantic command API: `getState(branchId)`, `setInstallationReady(branchId, ready)`, `beginExtension(branchId)`, `cancelExtension(branchId)`, `setInstalled(branchId)`, `update(delta)`, `reset()` oraz `dispose()`. Nie istnieje publiczne `completeExtension()`; wyłącznie actor-owned `update(delta)` może zakończyć fizyczne rozsuwanie.

```text
HIDDEN → DOCKED → EXTENDING → EXTENDED → BOUND
```

`VR_RUNE_BRIDGE_STATES` eksportuje dokładnie pięć kanonicznych stanów runtime: `HIDDEN`, `DOCKED`, `EXTENDING`, `EXTENDED` i `BOUND`. Legalne przejścia to `HIDDEN → DOCKED`, `DOCKED → HIDDEN`, `DOCKED → EXTENDING`, `EXTENDING → EXTENDED`, `EXTENDING → DOCKED`, `EXTENDED → DOCKED` oraz `EXTENDED → BOUND`; próba nielegalnego przejścia zgłasza błąd kontraktu. `reset()` przywraca wszystkie pięć par do `HIDDEN`. `BOUND` oznacza settled, trwały i nieruchomy Zwornik związany z zainstalowanym kamieniem; spin nie należy do target canon.

| Stan | Kontrakt |
| --- | --- |
| `HIDDEN` | platforma pary nie jest gotowa; most jest niewidoczny, a motion baseline wynosi `z = 0` |
| `DOCKED` | platforma jest gotowa; most istnieje w authored pozycji i czeka na właściwy kamień, `z = 0` |
| `EXTENDING` | most odjeżdża radialnie wyłącznie po installation-frame local `+Z` |
| `EXTENDED` | most osiągnął authored-derived extension distance |
| `BOUND` | właściwy kamień został prawidłowo zainstalowany; most zachowuje extended placement bez zaimplementowanego spinu |

**Platform installation readiness** jest dostarczane aktorowi z zewnątrz i, w przeciwieństwie do tuning truth, pozwala mostowi przejść z `HIDDEN` do `DOCKED`. Aktor nie czyta sector progression i nie posiada installed progression truth; `setInstalled()` zapisuje wyłącznie transient bridge state `BOUND`. Przerwane podejście przed capture powoduje `EXTENDING / EXTENDED → DOCKED`. Po `4.80` mosty Earth, Fire i Wood mogą być `DOCKED`; Metal pozostaje `HIDDEN` do pełnego ukończenia sektora Metal, a Water do specjalnego finalnego override.

Każdy `VrRuneInstallationFrame_<BRANCH>` zawiera identity `VrRuneBridgeInstance_<BRANCH>`. Jego stabilnymi dziećmi są `VrRuneStoneHoverAnchor_<BRANCH>` i `VrRuneStoneInstallationAnchor_<BRANCH>`, natomiast ruchomy bridge znajduje się pod `VrRuneBridgeMotionRoot_<BRANCH> → VrRuneBridgeAlignmentRoot_<BRANCH> → BRIDGE_ROOT`. `BridgeMotionRoot` jest jedynym ownerem runtime translation; `BridgeAlignmentRoot` posiada wyłącznie authored glTF → canonical-frame alignment.

Authored `BRIDGE_STONE_CAPTURE` może pozostać prywatnym asset/calibration evidence, lecz nie jest gameplay triggerem i nie ma publicznego API. Po canonical alignment transform authored `BRIDGE_STONE_ANCHOR` jest kopiowany do stabilnego InstallationAnchor poza `BridgeMotionRoot`; sibling HoverAnchor powstaje z canonical local `+Y` offsetu. `getStoneHoverAnchor(branchId)` i `getStoneAnchor(branchId)` są bounded read-only seams, więc targety choreografii i installed parent nie odjeżdżają z mostem.

**PHYSICAL BRIDGE EXTENSION MOTION = IMPLEMENTED.** Extension distance nie jest world offsetem: to dodatnia, skończona projekcja authored wektora `BRIDGE_PLATFORM_SOCKET → BRIDGE_STONE_ANCHOR` na installation-frame local `+Z` po canonical alignment. `beginExtension()` zeruje actor-local elapsed i przechodzi `DOCKED → EXTENDING` bez teleportu. `update(delta)` prowadzi motion root przez smoothstep od `z = 0` do `z = extensionDistance`, a po settlement ustawia dokładną wartość i stan `EXTENDED`. Duration używa wspólnego `runeStoneInstallation.phaseDurationSeconds = 1.2` (**TUNING**), bez ustanawiania dramaturgicznego prawa. `cancelExtension()` i `reset()` przywracają `z = 0`; `BOUND` zachowuje extended placement bez spinu. Retract choreography i dodatkowy clearance nie są zaimplementowane.

Prezentacyjna transformacja geometrii Zwornika jest niezależna od stabilnego InstallationAnchor. `VrRuneBridgePresentationRoot_<BRANCH>` jest dzieckiem motion root i właścicielem wyłącznie runtime scale `2.0` oraz sector-local radialnego offsetu `+Z = 1.0 m` (**CURRENT TUNING**). Stabilne InstallationAnchor i HoverAnchor są wyprowadzone z authored contract przed tym tuningiem i pozostają siblingami motion hierarchy, więc finalne miejsce oraz skala Rune Stone są niezmienione. Cała instancja pozostaje pod Rune Installation Frame / Sector MotionRoot, dlatego prezentacja i installed stone automatycznie dziedziczą R2B motion oraz globalny `VrTiltableFloorRoot`.

**R3b RUNE_BINDER_REVEAL = IMPLEMENTED.** Readiness projection zwraca wyłącznie rzeczywiście wykonane transitiony, a live composition przekazuje `HIDDEN → DOCKED` do deduplikującej VFX projection. `RuneBridgeActor.setRevealPresentationProgress()` klonuje i moduluje wyłącznie materiały presentation geometry oraz dodatkowy transient scale bliski `1`; nie zmienia state, readiness, StoneAnchor, HoverAnchor ani settled `2.0× / +1.0 m`. Hydration nie przekazuje transitionów do VFX, więc odtwarza settled presentation bez replayu.

## 8. Transport i instalacja

**A9.1–A9.6 są IMPLEMENTED foundations. NATURAL RUNE A9 FOUNDATION = COMPLETE.** Nie oznacza to ukończenia całego Rune Act ani authoringu Scenario po `4.80`.

```text
FREE → LOCKED_BY_ASTRO                 IMPLEMENTED
LOCKED_BY_ASTRO → FREE                 IMPLEMENTED
LOCKED_BY_ASTRO → CARRIED_ORBIT        IMPLEMENTED
CARRIED_ORBIT → FREE                   IMPLEMENTED
CARRIED_ORBIT → SOCKET_CAPTURE         IMPLEMENTED
SOCKET_CAPTURE → INSTALLED             IMPLEMENTED
```

`FREE`, `LOCKED_BY_ASTRO` i `CARRIED_ORBIT` zachowują istniejący target/transport contract. `releaseFromAstro()` może wykonać przerwania `LOCKED_BY_ASTRO → FREE` i `CARRIED_ORBIT → FREE`, lecz nie może cofnąć `SOCKET_CAPTURE` ani `INSTALLED` do `FREE`.

**SCAN / HALO — IMPLEMENTED:** `RUNESTONES` używa istniejącego Astro Attractor na prawym kontrolerze, hand mode `ASTRO_ATTRACTOR` i bandu `RUNESTONES`, canonical scan cone/target selection oraz istniejących threshold semantics. Halo otrzymuje wyłącznie aktualny legalny candidate. `RuneStoneAttractorInteraction` posiada najwyżej jeden aktywny natural Rune Stone lock; multi-lock nie istnieje.

Handoff rozpoczyna się wyłącznie dla naturalnego kamienia w `CARRIED_ORBIT`, tuned family, family jeszcze nie installed, gotowej własnej pary i własnego bridge w `DOCKED`. Logical handoff sphere ma center w aktualnej world-space pozycji `VrTiltableFloorRoot` / `progressFloor.object` i `handoffRadiusMeters = 10 m` (**TUNING**). Invariant wymaga, aby radius był większy od transportowego minimum: obecnie `10 m > 9 m`. Sfera nie jest colliderem ani widoczną geometrią; authored `BRIDGE_STONE_CAPTURE` pozostaje wyłącznie prywatnym evidence assetu/kalibracji.

Po update player-driven pozycji Attractor mierzy world-space distance stone root od centrum platformy. Odrzucony handoff nie zmienia stone/bridge state i pozostawia kontrolę graczowi. Zaakceptowany `tryBeginInstallationHandoff → tryBeginHandoff` czyści active ownership, halo, target i pull bez `releaseFromAstro()`. `CARRIED_ORBIT → SOCKET_CAPTURE` jest transferem ownership do `RuneStoneInstallationInteraction`; puszczenie lub dalsze trzymanie spustu nie wpływa już na instalację.

`SOCKET_CAPTURE` nie dodaje persistent states i posiada trzy actor-local phases:

1. **APPROACH** — przez `phaseDurationSeconds = 1.2` (**TUNING**) smoothstep prowadzi position lerp i quaternion slerp od zapisanej handoff pose do live `VrRuneStoneHoverAnchor_<BRANCH>`. Scale pozostaje zachowana, a bridge pozostaje `DOCKED`.
2. **BRIDGE_OPEN** — dopiero po dokładnym settlement na HoverAnchor wywoływane jest `beginExtension()`. Kamień jest utrzymywany dokładnie na live HoverAnchor przez całe `EXTENDING`; nie jest jeszcze parentowany.
3. **DESCENT** — dopiero przy `EXTENDED`, przez ten sam początkowy phase-duration tuning, kamień interpoluje od live HoverAnchor do live `VrRuneStoneInstallationAnchor_<BRANCH>`. Oba targety są odczytywane na żywo, więc choreografia pozostaje platform-bound przy zmianie transformu platformy.

Każda naturalna para posiada stabilny `VrRuneStoneHoverAnchor_<BRANCH>` jako sibling installation anchor pod identity bridge instance / Rune Installation Frame. Dziedziczy canonical orientation installation anchor, a jego pozycja to installation anchor przesunięty o local installation-frame `+Y * hoverHeightMeters`; początkowe `2 m` jest **TUNING**, nie world-space magic offsetem. Oba anchory dziedziczą późniejszy Sector MotionRoot razem z installation frame.

Po dokładnym settlement DESCENT root zostaje attached do stabilnego InstallationAnchor, następnie zachodzą kolejno `RuneStoneActor: SOCKET_CAPTURE → INSTALLED`, `RuneBridgeActor: EXTENDED → BOUND` oraz dokładnie jeden `commitInstalledFamily()`. Installed stone pozostaje sector/platform-bound, lecz nie jest dzieckiem bridge motion/alignment root ani authored helpera.

Transport przed handoff nadal respektuje `RUNE_STONE_PLATFORM_MIN_RADIUS_M = 9.0`, release in place i re-acquire z aktualnej pozycji. Przerwanie przed zaakceptowanym handoff nie powoduje autonomicznego ruchu. Wyłącznie explicit system/debug reset przywraca canonical initial field placement; handoff sphere nie ma persistent state, a transient choreography nie jest rekonstruowana przez Scenario.

Jeżeli właściwy Zwornik jeszcze nie istnieje, tuned i legalnie przyciągnięty kamień może dotrzeć w pobliże platformy, ale nie rozpoczyna handoffu, nie zostaje zainstalowany i pozostaje poza platformą. Jest to legalny sandbox state oraz możliwe źródło sytuacyjnego hintu, nie obowiązkowy Scenario point.

Collision carried Rune Stone ↔ installed Rune Stone jest **SUPERSEDED** i nie będzie implementowany. Runtime nie posiada gameplay collision systemu dla kamieni.

Każdy kamień może zachowywać pair-specific cichy spatial loop w `FREE`, `CARRIED_ORBIT` i `INSTALLED`. Audio playback/dispose należy do runtime audio bridge, a asset, gain i attenuation pozostają `TUNING`; audio nie posiada progression truth.

Collision installed/carried pozostaje świadomie poza modelem; nie istnieje gameplay collision system dla kamieni.

## 9. Ownership i persistent truth

| Owner | Posiada | Nie posiada |
| --- | --- | --- |
| owner progresji sektorów | kompletność paneli sektorów | rune tuning/installed truth |
| `RuneStoneProgressionController` | naturalne `tunedRuneFamilies` i `installedRuneFamilies` | transient transport, bridge state, sector readiness |
| recipe/Furnace actors | typed slots, transient recipe i process | installed truth |
| `RuneStoneAttractorBandProjection` | natural target permission A7 | własna kopia tuned truth, physical interaction |
| `RuneStoneAttractorInteraction` | scan, target, lock ownership, player-driven transport i installation handoff | tuned truth, installation readiness |
| `RuneStoneInstallationInteraction` | handoff preflight, actor-local `APPROACH → BRIDGE_OPEN → DESCENT` i final installation transaction | persistent tuning/installed truth |
| `RuneStoneActor` | physical records, live bounds, `FREE` / `LOCKED_BY_ASTRO` / `CARRIED_ORBIT` / `SOCKET_CAPTURE` / `INSTALLED`, physical parenting/reset | tuning truth, installed progression truth, readiness |
| `RuneBridgeActor` | authored bridge geometry/calibration, stabilne hover/installation anchors, radialny motion root i transient bridge state | tuning truth, readiness source i installed progression |
| `RuneInstallationReadinessProjection` | installation permission projection; no persistent state | copied sector/rune truth |
| `RuneInstalledStateProjection` | read-only reconstruction z installed truth do settled physical actors | persistent state, readiness truth, Scenario point IDs |
| Monkey/Ether actor | transient Ether presentation/capture mechanics | progression truth |
| Scenario / Director | dramaturgia, obowiązkowe beaty, ujawniana wiedza, Guidance i ograniczenia pozyskania kolejnych kryształów | fizyczna dostępność tuning/pull/installation, interpolacje, slot/capture mechanics |

`TUNED ≠ INSTALLED`. Publiczny installed contract odpowiada `commitInstalledFamily(familyCode)`, `isFamilyInstalled(familyCode)` i `getInstalledFamilyCodes()`, a snapshot zawiera `installedRuneFamilies`. Installed family musi być naturalna, wcześniej tuned i jeszcze nie installed; instalacja nie usuwa jej z `tunedRuneFamilies`. Target permission może nadal wynikać z tuning truth, ale physical candidate resolution wyklucza kamień, ponieważ `INSTALLED ≠ FREE`.

Persistent commit zachodzi wyłącznie po completed snap, jako ostatnia operacja semantyczna: physical target reached → platform-bound parenting → `RuneStoneActor = INSTALLED` → `RuneBridgeActor = BOUND` → commit `installedRuneFamilies`.

Reset `RuneStoneActor` reparentuje captured/installed roots z anchor hierarchy do canonical Rune Stone field, przywraca initial transforms, `FREE`, authored animations i istniejący presentation baseline. Reset progression czyści `tunedRuneFamilies` i `installedRuneFamilies`. Reset `RuneStoneInstallationInteraction` anuluje active capture bez finalizacji i bez installed commit.

Canonical owner section `runeProgression` deleguje dokładny serializowalny shape `{ tunedRuneFamilies, installedRuneFamilies }` do `RuneStoneProgressionController.hydrateScenarioState()`. Walidacja obu tablic, naturalnych `familyCode`, braku duplikatów i invariantu `installed ⊆ tuned` zachodzi przed mutation; zastosowanie jest atomowe, ciche, idempotentne i uporządkowane według naturalnego registry. Nie używa gameplay commands ani change eventów. Osobna sekcja `runeStones` nadal posiada wyłącznie `presentationVisible`.

Po hydration reconstruction wykonuje kolejno readiness `HIDDEN/DOCKED`, następnie read-only `RuneInstalledStateProjection`. Każda installed family jest mapowana registry do branchu, stone jest bez choreografii parentowany do stabilnego InstallationAnchor w canonical local transform ze skalą authored i stanem `INSTALLED`, a bridge bez tweena otrzymuje dokładne `extensionDistance`, settled elapsed i `BOUND`. Tuned-only stones pozostają po baseline `FREE`; ich bridge pozostaje readiness-derived. Projection nie posiada prawdy trwałej i nie zna point IDs.

## 10. Eter / VU — specjalna tożsamość poza naturalnym flow

Eter nie jest szóstą naturalną `familyCode`, szóstą standardową Rune Stone pair, szóstym sektorem, vessel/socketem ani installed elemental slotem. Nie należy do `PROTO_ASTRO_NATURAL_FAMILY_CODES`. `VU` istnieje jako kanoniczna sylaba Proto-Astro: `V` (Astro/Ether) + `U` (Rune Stone), pozostając formą **SPECIAL**, a nie naturalnym kodem rodziny.

`stone_06.glb` ma canonical physical asset identity ETHER / `V` / `astro` / **SPECIAL** z `branchId: null` i odpowiada sylabie Proto-Astro `VU`, której kanonicznym assetem prezentacyjnym jest `public/svg/VU.svg`. Nie jest jeszcze materializowany przez natural actor, nie należy do natural pair collection ani naturalnego spawnu `RUNE_STONES`, nie ma naturalnego tuningu, targetability, bridge, sektora ani natural installed slotu. Ewentualny gameplay Eteru wymaga osobnego przyszłego projektu i implementacji.

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

Canonical debug intent `p5` oznacza stable settled state po ukończeniu trzeciego kręgu i wejście w Rune Stone Act: wszystkie wcześniejsze konsekwencje są settled, Large Glyph / Small Glyph / Shell / world presentation są w odpowiednim stanie, a Rune Stone Act foundation jest gotowe do interakcji. `p5` ma hydratować do settled state odpowiadającego boundary `4.80 — Stable P3 entry boundary`; jest aliasem debug/QA, nie nowym Scenario pointem, capability ani zmianą authored graphu.

Przyszłe Scenario zachowa ownership dramaturgii, obowiązkowych beatów, ujawnianej wiedzy, Guidance i ograniczeń pozyskania kolejnych kryształów; Director legalność przejść; RuntimeExperience symbolic effects; actors transient mechanics; domain owners persistent truths. Scenario nie jest fizycznym gate'em Rune tuning, target/pull ani installation i nie wolno dla nich wprowadzać prawa `currentPoint >= X`. Interpolacja Zwornika, sloty, tuning timer, target/pull i `SOCKET_CAPTURE` nie są Scenario pointami. Reconstruction składa settled truths, nie odtwarza trwających procesów i interpolacji.

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

### WORLD EXISTS BEFORE MECHANIC

Canonical staging/directing principle brzmi **WORLD EXISTS BEFORE MECHANIC**. Jeżeli obiekt fizycznie należy do świata Experience VR i nie ma konkretnego dramaturgicznego/fabularnego powodu późnej materializacji, może być obecny wizualnie znacznie wcześniej niż jego gameplay use:

```text
WORLD OBJECT EXISTS
→ PLAYER NOTICES IT
→ OBJECT REMAINS BACKGROUND
→ LATER ITS MEANING IS REVEALED
→ LATER ITS INTERACTION CAPABILITY IS UNLOCKED
```

Ten model jest preferowany zamiast `MECHANIC NEEDS OBJECT → OBJECT SUDDENLY APPEARS → PLAYER IMMEDIATELY USES IT`. Rune Stones są nim objęte kanonicznie. Dla Shells, Small Glyphs i innych późniejszych world objects jest to **CANONICAL DIRECTION / TO BE AUDITED BEFORE MIGRATION**: osobny reveal audit ma rozstrzygnąć, które materializacje są wyłącznie technicznym gatingiem, a które świadomą nagrodą lub dramaturgicznym revealem. Obecne beats Shells i Small Glyphs nie są tym zapisem automatycznie uznane za błędne ani zmienione.

Konsekwencja komunikacyjna: jeżeli obiekt był widoczny wcześniej, późniejsza komunikacja ma ujawniać jego znaczenie lub capability, nie udawać, że obiekt właśnie się pojawił. Literalne dialogi i copy pozostają osobnym zadaniem komunikacyjnym.

Early natural Rune Stone presentation jest **IMPLEMENTED**. Pięć naturalnych aktorów powstaje podczas runtime construction z presentation baseline `HIDDEN`. Entry `2.10` uruchamia osobny effect `REVEAL_NATURAL_RUNE_STONES` w tym samym beacie co `BEGIN_CELESTIAL_REVEAL`: main ambient → celestial reveal → natural Rune Stone reveal → glyph free explore. Graph i point ID pozostają bez zmian.

`RuneStoneActor` posiada presentation visibility przez contract odpowiadający `setPresentationVisible(value)`, `isPresentationVisible()` i `hydrateScenarioState(state)`. Scenario owner `runeStones` zapisuje od `2.10` settled consequence `runeStones.presentationVisible = true`, więc `stateAt(later point)` dziedziczy visibility przez accumulation. Reset przywraca initial natural field transforms, `FREE`, authored animation baseline i hidden presentation. Hydration `{ presentationVisible: true }` odtwarza wyłącznie presentation truth, bez tuning/readiness/transport truth.

**Presence/visibility nie oznacza targetability.** Od `2.10` pięć naturalnych Rune Stones może być widoczne przy `tuned = false`, niedostępnym `RUNESTONES` i `targetability = false`; natural targetability nadal równa się `tunedRuneFamilies` przez istniejącą A7 projection. Hidden presentation dodatkowo blokuje physical candidate legality. Ether nie jest szóstym naturalnym recordem, nie jest ujawniany w `2.10` ani dodawany do natural targetability; pozostaje SPECIAL dla przyszłego Ether/Monkey flow.

## 13. Milestones and evidence

- **A1–A6 + UI-1 — IMPLEMENTED:** two typed slots, Wu Xing resolver, `18 s` process, `tunedRuneFamilies`, Furnace UI and `SPHERE_FAR`. A6 evidence: task `b091b4e7095dc1ce881e47723f8703f66eb69db4`, merge `0fc4ce338d26e7088594c69fed49532594f978ce`.
- **Natural tuning sector-gate correction — IMPLEMENTED:** task `d0f9a17e414f3ea8c386cde87bdd46dba6dad16c`, merge `c862b9bde2e717918e56d21d7f1cbbc0ad741d53`.
- **A7 — IMPLEMENTED:** RUNESTONES band; task `cc77fb270dd120acad9d526f267343c6fb076ce0`, merge `83ec32f5c4ca870a5db55f7bf6a6f7f561e32229`.
- **A8 — IMPLEMENTED:** pair-generic RuneBridge foundation; task `ad83cb23ea166ef015e9e8c5204540d4bba806bc`, merge `f98188a6617b6ecb1891ff107693591462298ca9`.
- **A9.1 — IMPLEMENTED:** identities and physical actors; task `f03daad783cf73e559d7092dea736d6f34f6001b`, merge `3181dc98e04fe129a7efe9921c92f026a9499948`.
- **A9 hardening — IMPLEMENTED:** authored origin/live bounds; task `9ab56aad1c5fb439b870bbb13851f921fee8989f`, merge `6b525111c50dc1a421a97d020b2c969c96bbb2a9`.
- **A9.2 — IMPLEMENTED:** scan/target and `LOCKED_BY_ASTRO`; task `fd4e519bef6cacadca2e30fa24269f05242df71e`, merge `091b7da14f073bac245e776c67468be0f9438df0`.
- **A9.3 — IMPLEMENTED:** `CARRIED_ORBIT`; task `8c3caca8419a099805fcc503d0174d97ac1b1a59`, merge `d23743d5cbad11344f5b155ca1b839158a1dda9d`.
- **A9.4 — IMPLEMENTED:** `RuneInstallationReadinessProjection` reads `isBranchComplete`, applies the explicit future Water override seam, and synchronizes bridges to `HIDDEN/DOCKED`; task `38b46cf5118ff44354ec34fe7a1d515117a57a36`, merge `575dc1818f37b76ddc981136e06504e2b1cf735e`.
- **A9.5 — IMPLEMENTED:** `SOCKET_CAPTURE` + persistent `installedRuneFamilies`, stable pair-specific capture/anchor, równoległy radialny bridge extension, stable platform-bound parenting i bridge `EXTENDED → BOUND` handoff.
- **A9.6 — IMPLEMENTED:** persistent natural Rune hydration (`runeProgression`) + silent physical reconstruction do `INSTALLED` / `BOUND`, bez replay transient transportu, handoffu i extension choreography.
- **Panel 2 — IMPLEMENTED:** task `d7e026fe565cf44b20f158564316c814a0e910e0`, merge `5dd2c59080f0501accb4cea546ee5ef68a5811e0`.
- **Panel 1 Rune U projection — IMPLEMENTED:** task `b04605cb01b395ec188b153cd901941a446076ff`, merge `5510e78062dd0a3309be2e5f22e528ee2ed532ed`.

R3 implementuje runtime Zwornika, a R3b implementuje `RUNE_BINDER_REVEAL`: live materialization, pooled sector-local lightning, final pulse, trwały `DOCKED`/`BOUND`, presentation-only scale/offset i reconstruction bez replayu. Nadal nie implementuje Rune install energy VFX, detent spark/audio, motion audio, grip beam, Field Actor ani field lensing. A9.6 nie implementuje spatial audio, Water override trigger, Ether flow, Rezonatora/final Water flow ani Scenario po `4.80`.

## 14. Remaining target

**Carried Rune Stone ↔ installed Rune Stone collision = SUPERSEDED / REMOVED FROM TARGET.** Special Ether flow, Water readiness override, spatial audio, Rezonator/final Water flow and all authored Scenario after `4.80` remain deferred. Zwornik spin jest usunięty z target canon.

## 15. Current implementation checkpoint

```text
RUNE A1–A8: IMPLEMENTED
RUNE A9.1–A9.6: IMPLEMENTED FOUNDATIONS
ADDITIONAL RUNTIME CORRECTIONS: RECIPE INSERTION FAMILY VALIDATION, RECIPE-CHANGE EJECT, P5 → 4.80, EARLY NATURAL RUNE STONE WORLD PRESENTATION — IMPLEMENTED
NATURAL RUNE A9 FOUNDATION: COMPLETE
CARRIED RUNE STONE ↔ INSTALLED RUNE STONE COLLISION: SUPERSEDED / NO GAMEPLAY COLLISION SYSTEM
PHYSICAL BRIDGE EXTENSION: IMPLEMENTED
R3b RUNE_BINDER_REVEAL: IMPLEMENTED
INSTALLATION HANDOFF + APPROACH / BRIDGE_OPEN / DESCENT: IMPLEMENTED
AUTHORED SCENARIO BOUNDARY: 4.80
POST-4.80 SCENARIO / A10+: DEFERRED / NOT IMPLEMENTED
POST-4.80 SCENARIO DIRECT-TARGET PARITY: DEFERRED UNTIL SCENARIO AUTHORING
```

## 16. Closed runtime reconciliation gaps

Recipe insertion family validation, recipe-change player-facing eject, debug `P5 → 4.80` with spawn `RING`, and early natural Rune Stone world presentation are **IMPLEMENTED**. `P5` remains only a debug/QA alias; canonical `stateAt → reconstruction → activate` owns hydration, and the alias owns no Scenario point, capability or settled consequence.

## 17. Related authority

- [`VR_PROTO_ASTRO_MODEL.md`](VR_PROTO_ASTRO_MODEL.md) — Proto-Astro identities/essences and panels.
- [`VR_SPHERICAL_LAYERS_MODEL.md`](VR_SPHERICAL_LAYERS_MODEL.md) — `RUNE_STONES = 50–75 m`.
- [`VR_PROGRESS_FLOOR_MODEL.md`](VR_PROGRESS_FLOOR_MODEL.md) — sector/panel truth.
- [`VR_ASTERION_RESONATOR_MODEL.md`](VR_ASTERION_RESONATOR_MODEL.md) — sandbox/Scenario boundary, sector control i Rezonator.
- [`VR_SCENARIO_DIRECTOR_MODEL.md`](VR_SCENARIO_DIRECTOR_MODEL.md) — authored boundary and reconstruction.
