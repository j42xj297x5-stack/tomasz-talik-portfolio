# Experience VR — plan domknięcia migracji DEBUG STORYLINE

Status: **PLAN / AUDYT KODU, 2026-08-16**. Dokument nie zmienia kanonu ani runtime. Opisuje luki pomiędzy aktualną implementacją a docelowym modelem `SCENARIO → DIRECTOR → RUNTIME / ACTORS / DOMAIN OWNERS` dla `1.10–3.40` oraz kolejność ich usunięcia.

## SUMMARY DLA ARCHITEKTA

- Naturalna progresja działa, ponieważ effect przejścia z punktu poprzedniego ustawia dokładnie taki prywatny stan aktora, jakiego wymaga następny callback. Scenario posiada trasę, lecz wejście do większości beatów nadal nie jest samowystarczalne.
- `createVrIntroSequence` jest równoległą maszyną dramaturgiczną: jego `VR_INTRO_STATE` odwzorowuje `1.10–1.130`, a także część `2.10–2.20`; effect handlery odrzucają legalne przejście Directora, jeżeli aktor nie znajduje się w oczekiwanym prywatnym stanie.
- Jedynym zmaterializowanym wejściem na badanej osi jest `3.10.entryEffects`. `3.20`, `3.30` i `3.40` uruchamiają własny beat wyłącznie jako effect ukończenia poprzednika. Ten sam wzorzec występuje wcześniej niemal na całej osi.
- P0 nie spełnia kontraktu fresh XR start. Fresh start pobiera tracked head i wywołuje `calibrateXrHeadToPlatform(...)`, dopiero potem emituje `XR_CALIBRATED`. DEBUG P0 resetuje rig i od razu dispatchuje `XR_CALIBRATED`, bez tej kalibracji. To naruszenie krytyczne; należy współdzielić jeden seam, nie dopisywać drugi start.
- Reconstruction/hydration jest poprawnie ukształtowany jako `baseline → state strictly before target → owner hydration → Director`, ale dane są pełne tylko dla aktywnych granic P1/P2 i nawet tam wymagają domknięcia ownership/reset. P0 nie potrzebuje historycznej rekonstrukcji, lecz potrzebuje prawdziwego seam kalibracji.
- `restoreVrScenarioBaseline()` jest właściwym miejscem orkiestracji, lecz nie wszystkie wywołania są owner-pure. Najpoważniejszy przeciek to `introSequence.reset()`, które przez callback ukrywa Portal, resetuje Reliquary i ukrywa Furnace; Intro resetuje też locomotion i bezpośrednio steruje fixtures/glyph ring/fog/Monkey guidance.
- P3/P4 nie są przedmiotem implementacji. Registry pozostaje P0/P1/P2, dopóki trwałe konsekwencje, hydration i odwracalny reset późniejszych domen nie będą gotowe.

## 1. CURRENT ARCHITECTURE

### ZADANIE

Audyt obejmuje production composition w `src/experienceVr.js`, Scenario/Director/Runtime, Intro i aktorów rzeczywiście wykonywanych do `3.40`, reconstruction/hydration/checkpoint orchestration oraz owner APIs używane przez baseline. Nie czytano legacy ani starych audytów. Nawigację rozpoczęto od `docs/current/maps/PROJECT_INDEX.md` i wskazanych bieżących modeli.

### Stan zastany

1. `vrExperienceScenario` posiada canonical Spine, event routing, capabilities, effects i częściowe `settledConsequences`.
2. `ExperienceDirector` legalizuje transition, dołącza `entryEffects` celu po effectach transition i potrafi aktywować punkt startowy dokładnie raz przez `activateCurrentPoint()`.
3. `RuntimeExperience` wykonuje symboliczne effects przez composition-root adapter.
4. `prepareVrScenarioSession()` wykonuje dobrą kolejność przygotowania: baseline, reconstruction, hydration, synchronizacja projekcji, utworzenie Directora w target.
5. `createVrDebugCheckpointController()` mapuje P0/P1/P2 na Spine, podmienia Directora, ustawia spawn i aktywuje punkt.
6. Aktor Intro nadal posiada rozbudowaną lokalną maszynę stanów. Scenario mówi *który* transition zaakceptowano, ale Intro decyduje, czy effect jest w danej chwili wykonalny.
7. Production composition posiada również osobne aktory presentation, observation, Monkey dialogue i Furnace intro. Ich starty dla `3.20–3.40` nadal wiszą na poprzednich transition effects.

To jest migracja częściowa: topology i routing są w Scenario/Directorze, lecz semantyka rozpoczęcia beatu i część world ownership pozostały w aktorach/composition root.

## 2. ROOT CAUSE OF INCOMPLETE MIGRATION

### Źródło problemu / stan zastany

Naturalny forward flow zachowuje ukryty protokół kolejności:

1. aktor osiąga prywatny `WAIT_RUNTIME_AFTER_*`;
2. callback aktora dispatchuje event;
3. Director przechodzi do kolejnego punktu;
4. transition-local effect woła metodę aktora;
5. metoda akceptuje wywołanie tylko z prywatnego stanu ustawionego w kroku 1.

Przykłady kodowe:

- `1.20 → 1.30`: Intro ustawia `WAIT_RUNTIME_AFTER_REVEAL`, a dopiero `beginPostRevealSilence()` akceptuje ten stan.
- `1.30 → 1.40`: analogicznie `WAIT_RUNTIME_AFTER_POST_REVEAL_SILENCE → beginControllerOnboarding()`.
- `1.40–1.100`: jedna metoda `continueControllerOnboarding()` rozgałęzia zachowanie na pięć prywatnych stanów, które odpowiadają kolejnym punktom Scenario.
- `1.110–1.130`: invitation/follow/threshold/crossing są zarówno punktami Scenario, jak i stanami Intro.
- `2.10–2.20`: Intro nadal posiada timer glyph hint, discovery attention, Monkey override i cały Reliquary reveal timer; `beginFirstCrystalDiscovery()`, `beginReliquaryReveal()` i `completeReliquaryReveal()` mają state guards.
- `3.20`, `3.30`, `3.40`: aktorzy są odrębni, ale ich `begin()` jest effectem poprzedniego punktu, nie wejściem punktu docelowego.

Arbitralny start Directora nie odtwarza poprzedniego callbacku, dlatego nie ustawia wymaganej prywatnej fazy ani nie wykonuje transition effectu poprzednika. `activateCurrentPoint()` pomaga tylko punktom z `entryEffects`; aktualnie na badanej osi ma je wyłącznie `3.10`. To wyjaśnia jednocześnie, dlaczego forward działa i dlaczego debug/direct entry ujawnia błąd.

### Najważniejsze naruszenia architektury

1. **Parallel story state:** `VR_INTRO_STATE` powiela topology `1.xx/2.xx` zamiast być wyłącznie transient implementation state bieżącego beatu.
2. **Predecessor-owned entry:** rozpoczęcie następnego beatu jest zapisane w `transition.effects` poprzednika.
3. **Cross-domain Intro:** Intro reset/reveal callbacks mutują Portal, Reliquary i Furnace.
4. **Duplicate ownership:** Intro resetuje locomotion, chociaż locomotion ma własny owner resetowany również przez baseline.
5. **P0 contract forgery:** debug emituje semantyczne potwierdzenie kalibracji bez wykonania fizycznej kalibracji.
6. **Incomplete settled history:** większość punktów ma `{}`, mimo że po ich ukończeniu istnieją trwałe fakty potrzebne przy direct entry.
7. **Reset order coupling:** baseline resetuje domeny, a na końcu Intro ponownie je mutuje callbackiem; wynik zależy od kolejności.
8. **Derived-state escape hatch:** `syncAmbientSequence()` po hydration jest projekcją composition root i musi pozostać projekcją danych ownerów, nie ukrytym replayem lub korektorem brakującej historii.

## 3. CANONICAL DEBUG STORYLINE CONTRACT

DEBUG STORYLINE jest alternatywnym wejściem do tego samego świata:

```text
resolve safe checkpoint alias
→ restore canonical fresh baseline through owner resets
→ reconstruct settled facts STRICTLY BEFORE target Spine point
→ hydrate each fact through its domain owner
→ synchronize derived, non-story projections
→ create/replace Director at target with matching durable milestones
→ establish target spawn through the canonical spawn owner
→ activate target point once
→ execute the same target-entry semantics as natural flow
→ continue ordinary Scenario events
```

Zakazy kontraktu: brak event replay, brak dialogów/audio/animacji z historii, brak drugiego store, brak debug-only world mutations, brak udawanych milestones/capabilities. Capability zawsze wynika z bieżącego punktu Directora; trwały stan świata wynika z reconstruction i owner hydration.

Director może architektonicznie startować na dowolnym Spine point, jeżeli dostanie poprawny settled state. UI udostępnia tylko jawnie zatwierdzone, bezpieczne granice registry. Te dwa zbiory nie muszą być równe.

## 4. P0 XR START CONTRACT

### P0 / XR START — wynik audytu

**Fresh XR:** `enterVr()` przywraca baseline, tworzy WebXR session i ustawia `xrStartCalibrationPending`. Pierwsza klatka odczytuje tracked XR head, wywołuje `calibrateXrHeadToPlatform({ playerRig, headWorldPosition, platformRoot, entryDirection, targetRadius })`, ponownie odczytuje head, czyści pending i dopiero wtedy dispatchuje `XR_CALIBRATED`.

**DEBUG P0:** checkpoint przygotowuje baseline/Director, wywołuje `resetPlayerRigToSpawn()`, aktywuje `1.10`, po czym `startCanonicalIntro` bezpośrednio dispatchuje `XR_CALIBRATED`. Nie ustawia `xrStartCalibrationPending`, nie pobiera tracked head i nie wywołuje `calibrateXrHeadToPlatform()`.

**Werdykt: CRITICAL.** Nazwa `startCanonicalIntro` nie czyni ścieżki kanoniczną. P0 fałszuje kontrakt eventu i może dawać na Quest inną translację/yaw/radius niż fresh start.

Docelowo fresh start i P0 mają wywołać dokładnie jeden wspólny, idempotentny wobec pojedynczego wejścia **canonical XR start seam**: oczekiwanie na wiarygodny tracked pose → fizyczna kalibracja rig → potwierdzenie → `XR_CALIBRATED`. Checkpoint nie może mieć alternatywnej matematyki ani dispatchować eventu samodzielnie. Jeśli live switch P0 następuje wewnątrz aktywnej sesji, seam nadal musi użyć aktualnego tracked head w następnej właściwej XR frame.

Minimalny dowód: test composition z kontrolowanym tracked pose ma wykazać identyczną kolejność wywołań i identyczny wynik rig dla fresh entry oraz live P0; dispatch przed kalibracją ma być niemożliwy.

## 5. BASELINE OWNERSHIP CONTRACT

### Baseline / ownership — wynik audytu

Composition root może ustalać kolejność resetu, ale każda pozycja wywołuje API właściciela i nie mutuje obcej domeny.

| Resetowany subsystem | Właściciel | Ocena obecnego resetu |
| --- | --- | --- |
| Director/session | Runtime/Director | poprawna granica orkiestracji; przy checkpoint podmiana Directora następuje później |
| ambient/audio | ambient sequencer / VR audio | owner-local, o ile synchronizacja nie tworzy story state |
| Furnace mesh/process/panel/interactions | Furnace oraz jego interaction/panel owners | jawne API; potrzebny jeden agregat baseline domeny i test pełnego powrotu |
| Player Guide | Player Guide owner | reset wywołany podwójnie; usunąć przypadkową kolejność |
| crystals | Crystal Collection owner | ma reset/hydration; zweryfikować odtworzenie usuniętych/zużytych instancji |
| Reliquary hints/buttons/reliquary | odpowiedni Guidance/UI/Reliquary owner | jawne API, lecz ponownie mutowane przez Intro callback |
| Portal | Portal Display owner | `restorePortalWaitingState()` jest composition helperem; docelowo owner API z nazwanym fresh state |
| locomotion/rig spawn | Locomotion / rig-spawn owner | resetowane jawnie, ale Intro ponownie resetuje locomotion |
| progression/floor | Progression Controller / Progress Floor | jawne reset/hydration |
| glyph orbit/lights/interaction | odpowiedni glyph owners | jawne resety; settled elevacja należy do presentation/domain owner, nie Intro |
| post-ring presentation/observation/first-ring | właściwi aktorzy | local transient reset; presentation hydration materializuje trwałe fakty |
| shell attractor/shell system | odpowiedni shell owners | reset istnieje, ale wymaga testu destrukcyjnych handoff/collection mutations |
| Astro/Asterion production/equipment | ich domain owners | reset istnieje poza badaną progresją, lecz jest warunkiem przyszłego P3 → P0 |
| Monkey guidance/dialogues | Monkey Guidance i dialogue actors | kilka ownerów współdzieli override; potrzebna deterministyczna fresh operacja |
| Intro | Intro actor | **niepoprawny:** resetuje własny transient state, ale też locomotion i przez callback Portal/Reliquary/Furnace |

Najbardziej konkretne naruszenie: `introSequence.reset()` wywołuje `onProgressionFixturesHidden`, podpięte do `portalDisplay.hide(); astroFurnace.object.visible = false; crystalReliquary.reset();`. Bypass callback robi odwrotne cross-domain mutacje. `onReliquaryReveal` także steruje jednocześnie Portalem, Reliquary i Portal Canvas z wnętrza Intro. Są to composition effects wymagające rozdzielenia na jawnych ownerów/effects; nie mogą być skutkiem resetu Intro.

Docelowa własność baseline:

- Intro resetuje tylko swoją kolejkę, timery, lokalną phase i własne subscriptions.
- Portal resetuje tylko Portal; Reliquary tylko Reliquary; Furnace tylko Furnace.
- Locomotion i rig spawn mają osobne owner APIs; Intro może z nich korzystać podczas aktywnego beatu, ale nie posiada ich fresh baseline.
- Monkey placement, Monkey visual i Monkey dialogue/panel muszą mieć jawny podział; hydration jednej sekcji nie może przypadkiem nadpisać drugiej.
- Baseline ma być order-independent dla ownerów niezależnych. Test powinien wykrywać obce mutacje oraz podwójne reset calls.

## 6. RECONSTRUCTION / HYDRATION CONTRACT

### Reconstruction / hydration — wynik audytu

Algorytm `stateAt(X) = fold(settledConsequences points strictly before X)` jest właściwy. Top-level późniejszy fakt zastępuje wcześniejszą sekcję. Hydrator deleguje obecnie sekcje: Monkey, Intro, locomotion, Reliquary, Portal, progression, floor, crystals i postRing.

Aktualne użyteczne granice:

| Target | Wymagany settled state przed target | Stan implementacji |
| --- | --- | --- |
| P0 / `1.10` | czysty fresh baseline; brak historii | reconstruction puste; problemem jest XR seam, nie hydration |
| P1 / `2.10` | Monkey na final stone, czysty post-intro actor, fog cleared, ring/fixtures widoczne, guidance enabled, locomotion boundary ring | opisane w consequences `1.130`, hydratowane przez owners; wymaga ownership cleanup i production reset testu |
| P2 / `3.10` | P1 state + Reliquary/Portal settled + Tier 1 `5/5`, floor complete, kryształy zużyte; bez postRing, bo to entry `3.10` | dane istnieją; trzeba dowieść spójności live collections, presentation i milestone projection |
| direct `3.20` (technical, nie registry) | P2 + settled efekt wejścia `3.10`: shells visible/noninteractive, main glyphs elevated | consequence istnieje w `3.10` i postRing hydration istnieje; target nadal nie uruchamia observation |
| `3.30` | poprzednie + zakończone observation; bez attention/dialogue playback | brak nowego durable factu jest poprawny, ale target entry nie uruchamia attention |
| `3.40` | poprzednie + zakończony Monkey dialogue; bez historycznych checheszek/copy | brak trwałego dialogue state jest poprawny, ale target entry nie revealuje Furnace ani nie rozpoczyna intro |

Hydration nie może ustawiać local wait states tylko po to, by stary effect handler zaakceptował wywołanie. Migracja musi uczynić target entry samowystarczalnym. `initialMilestones` należy wyprowadzać z rekonstruowanych trwałych osiągnięć, jeżeli dalsze reguły ich wymagają; nie wolno traktować domyślnego pustego zestawu Directora jako uniwersalnego rozwiązania.

## 7. POINT ENTRY CONTRACT

Point entry oznacza semantykę, która musi wystąpić zarówno po naturalnym wejściu, jak i po poprawnym direct start:

1. jest zadeklarowana przy **punkcie docelowym**, nie przy poprzedniku;
2. zostaje wykonana dokładnie raz przez `activateCurrentPoint()` albo naturalne wejście;
3. może rozpocząć transient actor bieżącego beatu;
4. nie rekonstruuje wcześniejszej historii;
5. jest idempotentna na poziomie aktywacji Directora, a owner odrzuca reentrancy bez zależności od poprzedniej phase;
6. completion event pochodzi wyłącznie z rzeczywistego zakończenia aktora/interakcji.

`3.10` jest wzorcem umiejscowienia: reveal presentation i glyph elevation są `entryEffects`, a settled rezultat należy do consequence `3.10` dla późniejszych targetów. Nie należy mechanicznie kopiować animacji do hydration.

Migracja effectów musi zachować kolejność percepcyjną. Effect, który naprawdę kończy punkt poprzedni, zostaje przy poprzedniku; effect rozpoczynający target przechodzi do `target.entryEffects`. Test powinien osobno porównywać natural transition i `activateCurrentPoint()`.

## 8. DEBUG CHECKPOINT CONTRACT

Aktywny registry pozostaje:

- `P0 → 1.10`: canonical normal Scenario start, z prawdziwym XR calibration seam;
- `P1 → 2.10`: settled intro/crossing, ring collection rozpoczyna się naturalnie;
- `P2 → 3.10`: settled Tier 1, wejście Act 2 wykonuje canonical `3.10.entryEffects`.

P3/P4 nie są kanonicznie gotowe w zakresie tego planu i nie wolno dodawać ich do registry/UI. Wymieniane w dokumentacji future opisy nie są pozwoleniem implementacyjnym.

Każdy wpis registry musi deklarować tylko alias, target, label i canonical spawn policy. Nie może deklarować dodatkowych world patches. Registry akceptuje target dopiero, gdy istnieją: complete settled consequences przed targetem, owner hydration, reversible baseline, point entry, production-path regression oraz manual Quest checklist.

## 9. POINT-BY-POINT AUDIT 1.10–3.40

W kolumnie „Direct entry safe?” oceniono semantyczną równoważność z naturalnym wejściem, nie samą możliwość skonstruowania Directora.

| POINT | NATURAL ENTRY | OWNER | SETTLED STATE po ukończeniu | TRANSIENT STATE | PREDECESSOR DEPENDENCY | DIRECT ENTRY SAFE? | MIGRATION REQUIRED |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `1.10` | fresh XR first frame po tracked-head calibration | XR start seam + Director; Intro wykonuje reveal | `XR_CALIBRATED` jako potwierdzony fakt sesji | pending calibration, tracked pose sample | brak story poprzednika, ale wymaga fizycznego XR lifecycle | **warunkowo**: fresh tak; DEBUG P0 nie | M1: jeden calibration seam; event tylko po sukcesie; entry rozpoczęcia `1.20` przenieść do target semantics |
| `1.20` | `XR_CALIBRATED`; transition effect `BEGIN_INTRO_REVEAL` | Intro fog/reveal actor | reveal ukończony, milestone; widoczność po revealu | fog progress/timer | Intro musi być `XR_CALIBRATING` | **nie** | jawne entry rozpoczynające reveal; settled consequence; Intro API bez predecessor guard |
| `1.30` | callback reveal; poprzednik wywołuje `BEGIN_POST_REVEAL_SILENCE` | Intro silence actor | reveal settled + silence zakończona | silence timer | wymaga `WAIT_RUNTIME_AFTER_REVEAL` | **nie** | target entry dla ciszy; rozdziel phase od topology |
| `1.40` | callback silence; poprzednik wywołuje onboarding | Intro + Player Guide/Controllers | onboarding prompt gotowy, rays/Monkey interaction właściwie ustawione | opening copy queue, prompt timing | wymaga `WAIT_RUNTIME_AFTER_POST_REVEAL_SILENCE` | **nie** | entry onboarding; durable facts przypisać właściwym owners |
| `1.50` | wykrycie otwartego panelu; `CONTINUE_CONTROLLER_ONBOARDING` | Player Guide observation + Intro tutorial | guide otwarty w oczekiwanym widoku | panel open/section UI | wymaga `WAIT_RUNTIME_AFTER_PLAYER_GUIDE_OPEN` | **nie** | entry „wait controls” jawne; bez wspólnego wielofazowego continue |
| `1.60` | controls detail obejrzane; ten sam continue effect | Player Guide + Intro | controls viewed milestone; panel nadal otwarty | aktywna sekcja/view | wymaga `WAIT_RUNTIME_AFTER_CONTROLS_VIEWED` | **nie** | entry „wait close”; hydration tylko gdy punkt stanie się zatwierdzoną granicą |
| `1.70` | zamknięcie panelu; continue rozpoczyna pointer tutorial | Intro guidance + controller rays/Monkey hit | tutorial pointer uzbrojony | copy queue, hover override | wymaga `WAIT_RUNTIME_AFTER_PLAYER_GUIDE_CLOSED` | **nie** | osobny entry effect/actor command; owner-pure controller/guidance setup |
| `1.80` | real Monkey hover; continue pokazuje trigger | Monkey interaction + Intro guidance | Monkey wskazany | hover/trigger prompt | wymaga `WAIT_RUNTIME_AFTER_MONKEY_HOVERED` | **nie** | target entry prompt/trigger arm bez poprzedniej private phase |
| `1.100` | real Monkey press; continue odgrywa seen/going i invitation | Intro dialogue/Monkey Guidance | invitation dostępne | queue, selected option, dialogue override | wymaga `WAIT_RUNTIME_AFTER_MONKEY_TRIGGERED` | **nie** | entry invitation; choice effects zachowują wyłącznie branch response |
| `1.110` | choice GO; poprzednik uruchamia FOLLOWING | Intro movement + Monkey + locomotion observation | Monkey/follow start pose | walking, pause state, distance checks | wymaga `WAIT_RUNTIME_AFTER_INVITATION_SELECTED` i startRadius | **nie** | entry follow inicjalizuje aktora z trwałego world pose; FOLLOW pause pozostaje STAY |
| `1.120` | Monkey reaches threshold; poprzednik prezentuje choice | Intro dialogue/fog | Monkey przy progu, threshold question active | copy/options/fog radius | wymaga `WAIT_RUNTIME_AFTER_MONKEY_REACHED_THRESHOLD` | **nie** | entry threshold; settled Monkey pose/fog facts, jeśli wspierany direct technical start |
| `1.130` | choice CROSS; poprzednik uruchamia crossing | Intro movement + locomotion + Monkey | po completion: Monkey final stone, cleared fog, ring/fixtures/guidance, ring boundary | crossing motion, two-signal join, safe margin, final turn | wymaga `WAIT_RUNTIME_AFTER_THRESHOLD_SELECTED` | **nie** | entry crossing; join może pozostać transient aktora, ale inicjalizacja nie może wymagać poprzedniej phase; zachować consequences |
| `2.10` | completion join; poprzednik `BEGIN_GLYPH_FREE_EXPLORE` | glyph domain + Intro hint/discovery residue | post-intro settled baseline; pierwszy crystal jeszcze nieodkryty | 60 s hint timer, hover/hold/discovery | naturalnie wymaga Intro `MONKEY_SETTLING`; P1 hydration omija ten effect | **tak tylko jako zatwierdzone P1 po hydration**, nie jako goły Director | entry powinno jawnie uzbroić free-explore/hint owner; wyjąć glyph/reliquary dramaturgię z Intro |
| `2.20` | first crystal discovered; poprzednik wywołuje Intro discovery attention | crystal/glyph owner, Monkey Guidance, Reliquary/Portal reveal owners | po completion: Reliquary revealed/interactable, Portal visible | attention, conscious Monkey click, reveal timer/animation/copy | wymaga `beginFirstCrystalDiscovery()` ustawiającego Intro flag/state, potem Monkey trigger | **nie** | entry discovery/attention; reveal jako jawna multi-owner orkiestracja, nie Intro callback; doprecyzować first-crystal settled fact |
| `2.30` | Reliquary reveal completion; poprzednik kończy Intro reveal state | Progression Controller, Reliquary, crystals, Portal, Progress Floor | po completion: Tier 1 5/5, activated pages, floor complete, crystals consumed | active crystal/card preview, hints, commit audio | wymaga poprzedniego reveal completion i spójnej live collection | **nie** | entry collection loop i pełne reconstruction facts; nie polegać na `completeReliquaryReveal()` Intro |
| `2.40` | real `FIRST_RING_COMPLETED`; poprzednik uruchamia presentation/audio | First Ring Flow + audio + presentation owners | trwałe 5/5 pozostaje; presentation zakończona | completion animation/audio/timer | wymaga `beginPresentation()` effectu z `2.30` | **nie** | presentation start jako entry `2.40`; completion/audio ownership rozdzielić; settled outcome nie odgrywa presentation |
| `3.10` | presentation completion z `2.40`; Director automatycznie dołącza entry effects | Post Ring Presentation + shell field + main glyph presentation | shells visible/noninteractive, glyphs elevated | reveal/elevation easing i join timer | nie wymaga transition effectu poprzednika | **tak po P2 reconstruction/hydration** | zachować wzorzec; wzmocnić owner/reset i production regression |
| `3.20` | completion post-ring presentation; poprzednik wywołuje `BEGIN_OBSERVATION_WINDOW` | Observation Window actor | świat z `3.10` pozostaje; brak dodatkowej trwałej historii | około 10 s timer | timer startuje tylko z transition `3.10` | **nie** | przenieść begin do `3.20.entryEffects`; direct stateAt ma już postRing settled |
| `3.30` | observation completed; poprzednik wywołuje Monkey attention | Post-ring Monkey Dialogue + Monkey Guidance | acknowledgement komunikatu; brak trwałej animacji/dialogue playback | checheszki, override, line index, panel interaction | attention startuje tylko z transition `3.20` | **nie** | `BEGIN_MONKEY_ATTENTION` jako entry; reset/hydration guidance nie może auto-open/replay |
| `3.40` | final acknowledgement; poprzednik wywołuje Furnace intro | Furnace owner + Furnace Intro/Monkey Guidance | po completion: Furnace ujawniony i gotowy do następnego beatu | dwie linie, line index, dialogue override | reveal/intro startuje tylko z transition `3.30` | **nie** | entry reveal+intro; dodać durable Furnace visibility/readiness consequence dla targetów po `3.40`; owner-pure reveal/reset |

## 10. DOMAIN OWNERSHIP VIOLATIONS

1. **Intro → Portal/Reliquary/Furnace:** callbacks `onProgressionFixturesHidden`, `onBypassFixturesVisible` i `onReliquaryReveal` wykonują cross-domain mutations.
2. **Intro → locomotion:** `reset()` woła `locomotion.reset()`, ustawia radius i boundary, podczas gdy baseline i hydration mają osobnego locomotion ownera.
3. **Intro → shared scene presentation:** historycznie bezpośrednio zmieniał `platformFixturesRoot.visible` i raw Large Glyph visibility oraz Monkey visibility/stone i fog; current Intro przekazuje visibility intent przez `largeGlyphActor.setPresentationVisible(...)`. Należy rozstrzygnąć osobne owners; Intro może zlecać effect bieżącego beatu, nie posiadać baseline tych domen.
4. **Intro → Monkey Guidance:** globalny dialogue override, message i interaction enabled są współdzielone z post-ring dialogue i Furnace intro. Bez jawnego lease/replace/reset contract kolejność resetów decyduje o wyniku.
5. **Furnace intro composition callback:** `revealFurnace` ustawia bezpośrednio `astroFurnace.object.visible`; powinno wołać semantyczne API Furnace ownera (`reveal/reset/hydrate`), nigdy mesh field.
6. **Portal helper:** `restorePortalWaitingState()` w composition root może orkiestracyjnie wybrać baseline, ale materializacja musi należeć do Portal ownera.
7. **Post-ring presentation:** jeden actor steruje shell systemem i glyph root. Jest dopuszczalnym orchestration/presentation ownerem tylko jeśli oba domain owners udostępniają semantyczne API i actor reset nie przywraca cudzych baseline’ów.
8. **Baseline duplicate UI reset:** Player Guide reset występuje dwa razy; późniejsze Monkey/Intro resets mogą ponownie zmienić guidance. To jawny sygnał order coupling.

## 11. NON-REVERSIBLE / RESET RISKS

### Reset / odwracalność — wynik audytu

- Crystal Collection posiada `reset()` i hydration `consumedTier`, lecz runtime wykonuje grab/insert/activate/consume na kolekcji instancji. Trzeba dowieść, że reset odtwarza pełny fresh zestaw, parenty, visibility, inserted/held references i controller attachment, a nie tylko flagi.
- Progress Floor i Progression Controller mają reset/hydration, lecz muszą wracać z 5/5 do identycznego Tier 1 (materiały, page activation order, counters i presentation).
- Reliquary ma inserted/release/reveal state; reset musi odtwarzać socket/content i interakcję po zużyciu kryształu. Obecne wywołanie z Intro zaciemnia dowód ownership.
- Portal reveal zmienia visibility i materiały/timing. Reset/hide/waiting-state muszą prowadzić do jednego identycznego fresh snapshotu, bez zależności od trwającego revealu.
- First-ring i post-ring presentations zmieniają pozycje/elevację/visibility. Ich reset musi anulować callback completion i odtworzyć dokładną transformację bazową, także w połowie animacji.
- Shell system oraz shell attractor potencjalnie przepinają parenty, usuwają/zużywają elementy i zmieniają kolekcje. Mimo istniejącego `reset()` brak w zbadanych testach dowodu pełnego późny-checkpoint → P0. To blocker przyszłego P3.
- Furnace/Astro/Asterion production controllers i equipment posiadają resety, ale produkcja/claim tworzą lub przepinają fizyczne obiekty. Pełna odwracalność po claim nie jest dowiedziona i jest blockerem P3 → P0.
- Monkey Guidance overrides mogą pozostać po przerwanym dialogue; każdy actor reset musi zwalniać tylko własny lease albo wspólny owner musi przywracać fresh state atomowo.
- Fog `dispose()` podczas `beginGlyphFreeExplore()` jest szczególnym ryzykiem: baseline później woła `restart()`. Należy zweryfikować, czy dispose jest semantycznie odwracalne, czy usuwa zasoby/listenery niemożliwe do odtworzenia bez rebuild świata.
- Monkey/rig transforms są mutowane w wielu miejscach. Fresh P0 musi bazować na canonical authored transforms plus tracked-head calibration, nie na transformach pozostałych po checkpoint spawn.

Warunek przyjęcia przyszłego P3: sekwencja najpóźniejszy wspierany stan → P0 musi dać snapshot domenowy i obserwowalny świat nierozróżnialny od nowej aplikacji w P0, bez recreate composition.

## 12. TEST GAPS

### Test gap analysis

| Obecny dowód | Czego nie wykrywa | Minimalny przyszły regression |
| --- | --- | --- |
| `vr-experience-director.test.mjs` | testuje routing/fake Director state; może ręcznie dispatchować eventy bez aktorów, XR pose i composition lifecycle | tabela natural-vs-direct entry dla każdego migrowanego pointu; te same effects i gotowy actor, bez poprzedniego eventu |
| `runtime-experience.test.mjs` | fake effect handlers; nie wykrywa state guards Intro ani owner mutations | real actor adapter dla każdego M3/M5/M6, z assertion że target activation nie potrzebuje predecessor phase |
| `vr-intro-sequence.test.mjs` | buduje aktora ze stubami i ręcznie prowadzi fazy; potwierdza obecną równoległą maszynę, nie canonical production composition | production-wiring test startujący kolejno wspierane technical points po baseline/reconstruction; żadnych ręcznych prywatnych stanów |
| `vr-scenario-reconstruction.test.mjs` | weryfikuje deklaratywny fold, ale nie kompletność realnego świata | owner snapshot contract: naturalnie osiągnięty settled state ma być równy reconstructed+hydrated state |
| `vr-scenario-hydration.test.mjs` | fake owners zapisują payload; nie dowodzi efektu realnych ownerów ani braku cross-domain mutation | real owners lub production composition harness; hydration każdej sekcji zmienia tylko snapshot tej domeny i jest idempotentne |
| `vr-debug-checkpoints.test.mjs` | fake runtime/spawn i oczekiwana lista call order; akceptuje fałszywe P0 `intro:start` | controlled XR frame harness: fresh/P0 używają tego samego tracked pose + calibration przed eventem; P0/P1/P2 backward-switch snapshots |
| `experience-vr-contract.test.mjs` | regex source assertions utrwalają konkretne wiring, w tym bezpośredni debug dispatch; nie wykonują lifecycle | zastąpić krytyczne regexy behavior testem wyekstrahowanego composition seam; regex może pozostać tylko import/wiring smoke |
| `vr-first-ring-live-flow.test.mjs` | „live” składa wybrane moduły i dispatchuje przygotowane eventy; nie obejmuje Intro, real collections i baseline | production-path slice: P1 spawn → real glyph/crystal/reliquary commits → `2.40` → `3.10`, następnie P0 i porównanie fresh snapshotu |
| `vr-astro-first-claim-live-flow.test.mjs` | syntetyczny handler/dialogue/Furnace booleans; nie dowodzi Quest transforms ani pełnego resetu | po M9 composition harness do co najmniej `3.40`, przerwanie każdego transient actora i reset do P0; hardware/perceptual pozostaje manualny |
| aktorowe observation/dialogue/Furnace tests | dobrze testują lokalną once/reset semantykę, lecz zwykle wywołują `begin()` ręcznie | dla M6 aktywacja Directora dokładnie w `3.20/3.30/3.40` ma sama rozpocząć właściwy real actor; natural route ma ten sam wynik |

Codex Cloud nie ma udawać WebXR hardware. Automatyczny harness powinien kontrolować pose/frame/owners i dowodzić kolejności oraz snapshotów; Quest QA osobno potwierdza tracking, pozycję, percepcję, timing i interakcje.

## 13. MIGRATION ORDER

### M1 — canonical P0 XR start seam

- **Cel:** jeden production seam `tracked head → calibrateXrHeadToPlatform → XR_CALIBRATED` dla fresh i P0.
- **Pliki/symbole:** `src/experienceVr.js` (`renderFrame`, `enterVr`, `xrStartCalibrationPending`, checkpoint wiring), nowy mały moduł XR-start tylko jeśli potrzebny; `enterVrDebugCheckpoint.js`; testy checkpoint/contract.
- **Zakres:** request/restart kalibracji w aktywnej XR session, single-dispatch, failure/cancel behavior, identyczny rig result.
- **Nie wykonuje:** migracji Intro, zmiany Spine, nowego pointu, replay.
- **Done:** P0 nie ma bezpośredniego dispatch; behavior test dowodzi wspólnej kolejności i pose; fresh flow bez regresji.
- **Zależność:** brak; blocker wszystkich dalszych claims o P0.

### M2 — baseline ownership cleanup

- **Cel:** owner-pure, deterministyczny `restoreVrScenarioBaseline()`.
- **Pliki/symbole:** `src/experienceVr.js`, `createVrIntroSequence.reset`, Portal/Reliquary/Furnace/locomotion/Player Guide owner APIs oraz ich focused tests.
- **Zakres:** usunąć cross-domain callbacki z Intro reset/bypass, semantyczne reset APIs, jeden reset na owner, cancellation bez completion events.
- **Nie wykonuje:** entry effects ani nowych checkpoints.
- **Done:** owner mutation tests i permutowany/atomowy baseline snapshot dają fresh state; brak direct `.object.visible` w storyline reset/reveal seam.
- **Zależność:** M1 tylko dla pełnego P0 lifecycle; prace kodowe mogą być osobnym PR po M1.

### M3 — Intro actor / Scenario ownership normalization

- **Cel:** usunąć równoległą dramaturgiczną topology `1.10–1.130` z Intro, zachowując tylko transient stan aktualnego beatu.
- **Pliki/symbole:** `vrExperienceScenario.js`, `createVrIntroSequence.js`, effect handlers w `experienceVr.js`, Monkey Guidance/Player Guide integration.
- **Zakres:** małe command APIs per beat, target-owned entry semantics, local timers/movement/join; settled consequences po granicach.
- **Nie wykonuje:** redesignu copy/flow, Spine, P3/P4, mgły wizualnej.
- **Done:** każdy `1.xx` Director start po poprawnej reconstruction może aktywować target bez ustawiania `WAIT_RUNTIME_AFTER_*`; natural flow pozostaje równoważny.
- **Zależność:** M2, aby nowe commands nie utrwalały obcego ownership.

### M4 — early settled consequences i hydration correction

- **Cel:** kompletne trwałe fakty dla direct technical starts oraz kanonicznego P1.
- **Pliki/symbole:** `vrExperienceScenario.js` consequences `1.xx/1.130`, `reconstructVrScenarioState.js` tylko jeśli schema tego wymaga, `hydrateVrScenarioState.js`, Monkey/Intro/locomotion/guidance owners.
- **Zakres:** declarative durable facts, idempotent owner hydration, milestones derivation; natural-vs-hydrated snapshot tests.
- **Nie wykonuje:** timer/dialogue/audio/animation hydration ani checkpoint każdego pointu.
- **Done:** state strictly before target materializuje identyczny settled świat dla zatwierdzonych granic; żadna hydration nie ustawia prywatnego wait state.
- **Zależność:** M3.

### M5 — `2.10–2.40` point-entry i domain normalization

- **Cel:** wyjąć discovery/Reliquary dramaturgię z Intro i uczynić każdy beat 2.xx samowystarczalnym.
- **Pliki/symbole:** `vrExperienceScenario.js`, `experienceVr.js` handlers, `createVrIntroSequence.js`, crystal/glyph interaction, `createVrCrystalReliquary.js`, `createVrPortalDisplay.js`, `createVrFirstRingFlow.js`, progression/floor/crystal owners.
- **Zakres:** entry free explore, discovery attention, owner-orchestrated reveal, collection entry, `2.40` presentation entry; complete settled facts.
- **Nie wykonuje:** post-ring 3.xx ani P3.
- **Done:** natural i direct technical activation mają ten sam start każdego 2.xx; P1/P2 reconstruction snapshots odpowiadają naturalnemu settled world.
- **Zależność:** M4.

### M6 — `3.10–3.40` point-entry normalization

- **Cel:** zachować `3.10` jako wzorzec i przenieść start observation/attention/Furnace intro na target entry.
- **Pliki/symbole:** `vrExperienceScenario.js`, `ExperienceDirector.js` (tylko jeśli kontrakt ujawni defekt), `createVrPostRingPresentation.js`, `createVrObservationWindow.js`, `createVrPostRingMonkeyDialogue.js`, `createVrFurnaceIntro.js`, Furnace owner API, handlers w `experienceVr.js`.
- **Zakres:** entry `3.20/3.30/3.40`, Furnace settled consequence, cancellation/reset, natural-vs-direct tests.
- **Nie wykonuje:** `3.50+`, Astro production, P3/P4.
- **Done:** aktywacja każdego targetu uruchamia dokładnie właściwy actor; poprzedni transition nie posiada startu targetu; brak auto-replay wcześniejszego dialogue/audio.
- **Zależność:** M2 i M5 (P2 baseline).

### M7 — canonical checkpoint registry/orchestration

- **Cel:** scalić P0/P1/P2 z finalnym lifecycle, bez checkpoint-specific world patches.
- **Pliki/symbole:** `vrDebugCheckpoints.js`, `enterVrDebugCheckpoint.js`, `prepareVrScenarioSession.js`, `hydrateVrScenarioState.js`, composition wiring.
- **Zakres:** jawna spawn policy, Director milestones, deactivate/replace safety, atomic failure, activation exactly once.
- **Nie wykonuje:** nowych aliases ani P3/P4.
- **Done:** P0/P1/P2 przechodzą identyczny pipeline, z jedyną szczególną fizyką P0 realizowaną przez wspólny XR seam; registry nie zna domain mutations.
- **Zależność:** M1–M6.

### M8 — Player Panel DEBUG storyline

- **Cel:** UI jako cienki klient registry i lifecycle, nie progression system.
- **Pliki/symbole:** `createVrPlayerGuidePanel.js`, wiring `onDebugCheckpoint`, panel tests.
- **Zakres:** busy/error state, brak wielokrotnego wejścia, P0/P1/P2 wyłącznie w `?debug`, feedback bieżącego aliasu.
- **Nie wykonuje:** domain state, P3/P4, legacy `?p1` cleanup poza osobnym zatwierdzeniem.
- **Done:** panel wysyła alias i renderuje wynik; nie dispatchuje Scenario events ani nie mutuje świata.
- **Zależność:** M7.

### M9 — production-path regression coverage i reset reversibility

- **Cel:** dowody obejmujące real composition lifecycle zamiast wyłącznie fake runtime.
- **Pliki/symbole:** test harness Experience VR; testy XR start, baseline ownership, natural-vs-direct, P0/P1/P2 switching; real owner snapshots.
- **Zakres:** P0→P1, P1→P2, P2→P0, P0→P2, P2→P1→P2; przerwanie transient aktorów; collections/parents/visibility/transforms; controlled pose.
- **Nie wykonuje:** WebXR hardware automation ani perceptual PASS.
- **Done:** wszystkie ścieżki są GREEN; osobna manual Quest checklist dokumentuje pending/validated bez mieszania z automation.
- **Zależność:** M7–M8; focused tests powstają także w każdym wcześniejszym kroku.

### M10 — canonical documentation sync

- **Cel:** po implementacji zsynchronizować current models z dowiedzionym runtime.
- **Pliki/symbole:** `VR_SCENARIO_DIRECTOR_MODEL.md`, `VR_RUNTIME_MODEL.md`, `EXPERIENCE_VR_HANDOFF.md`, `PROJECT_INDEX.md`, dependency/decision docs wyłącznie według zasad dokumentacji.
- **Zakres:** implemented/deferred status, final lifecycle, ownership, test/hardware evidence.
- **Nie wykonuje:** retroaktywnego ogłaszania P3/P4 ani statusu hardware bez sesji Quest.
- **Done:** brak sprzecznych claims (obecny indeks/decision/runtime model nadal miejscami mówią „NOT IMPLEMENTED”, podczas gdy kod/current Scenario model opisują częściową implementację).
- **Zależność:** M9.

## NIE WYKONANO / POZA ZAKRESEM

- Nie zmieniono runtime, Spine, istniejącej dokumentacji kanonicznej ani testów.
- Nie naprawiano mgły i nie oceniano jakości wizualnej.
- Nie implementowano P3/P4, `3.50+`, save/persistence, drugiego store ani pointu `0.0`.
- Nie projektowano replayu eventów; jest jawnie zabroniony przez lifecycle.
- Nie usuwano legacy `?p1` i nie wykonywano oportunistycznych refaktorów.
- Nie wykonano builda ani hardware QA; zadanie jest dokumentacyjne.

## ZMIENIONE PLIKI

- `docs/current/technical/VR_DEBUG_STORYLINE_MIGRATION_PLAN.md` — ten audyt i plan migracji.

## TESTY WYKONANE

- Kontrola symboli i zależności przez `rg`, `sed` i numerowane odczyty `nl` dla wskazanego production flow oraz owner APIs.
- `git diff --check`.

## OGRANICZENIA I ZAOBSERWOWANE RYZYKA

1. Automatyczne testy nie dowodzą tracked WebXR pose ani percepcji Quest; plan rozdziela behavior harness od hardware QA.
2. W chwili audytu current docs były wewnętrznie niespójne co do statusu reconstruction/checkpoints; późniejsza synchronizacja kanonu rozstrzygnęła status wdrożonego zakresu P0/P1/P2.
3. Bez snapshotów realnych kolekcji nie wolno uznać istniejących metod `reset()` za dowód odwracalności.
4. Techniczny direct start w dowolnym Spine point jest celem architektonicznym, ale nie oznacza automatycznego promowania tego pointu do DEBUG registry.
