# Experience VR — pełny audyt ownershipu runtime (2026-08-16)

## 1. Status i zakres

**Status:** READ-ONLY AUDIT / CURRENT EVIDENCE, 2026-08-16. Dokument nie zmienia kanonu ani implementacji. Przyjmuje model z `VR_SCENARIO_DIRECTOR_MODEL.md` i `VR_RUNTIME_MODEL.md`; kod jest dowodem stanu rzeczywistego.

**Pytanie audytu:** czy aktywny runtime realizuje `SPINE → SCENARIO → DIRECTOR → RUNTIME EXPERIENCE → ACTORS / DOMAIN OWNERS`, a `experienceVr.js` tylko konstruuje, podłącza i obsługuje lifecycle?

**Werdykt:** **nie w pełni**. Spine, Scenario, Director i mechanizm `RuntimeExperience` są rozdzielone poprawnie w authored zakresie do `3.80`, a atomy S1 `1.40→1.100` poprawiły target-entry. Nadal istnieją trzy równoległe źródła dramaturgii: rozbudowana maszyna Intro, callbacks/fan-out composition root oraz niezauthorowany lokalny łańcuch Shell/Furnace/Asterion. Baseline i hydration obejmują P1/P2 tylko do konsekwencji Act 2 entry; nie obejmują Furnace reveal ani stabilnych stanów Astro/Asterion.

**Zakres odczytu:** wskazane dokumenty current, całe `src/xr/progression/`, `src/experienceVr.js`, guidance, Intro/Monkey, Portal/Reliquary/crystals/floor, first/post-ring, Furnace, Shell, Astro/Asterion oraz bezpośrednie testy `vr-*` i `runtime-experience`. Nie użyto `PROJECT_ENTRY.md` ani `docs/legacy/`.

**Założenia wiążące:** `100.10` to authored canonical terminal i nie jest checkpointem; P0/P1/P2 to designer macro aliases (`1.10`, `2.10`, `3.10`), nie punkty Scenario; wszystkie exit routes zbiegają do `100.10`; transient playback/hover/timer/physics nie są reconstruction truth.

## 2. Executive summary

1. **Global WHERE jest pojedynczy:** `ExperienceDirector.currentPointId`; aktywne actors poza Furnace panel nie znają point IDs. Wyjątek: composition callback panelu sprawdza literalne `3.50`.
2. **Scenario nadal czasem zaczyna target beat na krawędzi poprzednika:** `1.130→2.10` uruchamia glyph explore, `2.10→2.20` uruchamia discovery, a `2.30→2.40` uruchamia presentation. To nie jest mechaniczne „przenieść każdy effect”; są to trzy owner seams: Intro/Reliquary, FirstRing, Post-crossing.
3. **Intro jest LEGACY/PARTIAL ownerem:** posiada poprawne transient mechanics i semantic joins, ale również globalną lokalną state machine od kalibracji do Reliquary, mutuje visibility obcych roots podczas hydration i poprzez callback reżyseruje Portal+Reliquary+plaque.
4. **Composition root jest drugim reżyserem:** claim Astro dispatchuje event, następnie bez sprawdzenia zaakceptowanej zmiany włącza Shell i auto-equip; root agreguje ambient policy, baseline kolejność, legacy query dramaturgy i cross-owner callbacks.
5. **P1/P2 mają dobrą deklaratywną rekonstrukcję obecnego zakresu:** P1 odtwarza completed Intro; P2 dodatkowo Tier 1, portal/reliquary/crystals/floor. P2 entry dopiero prezentuje Shell/glyph elevation. Direct 3.50–3.80 nie mają parity, bo Furnace/Astro stable truth nie występuje w consequences/hydration.
6. **P2→P0 fog:** wymagany stan należy do `IntroFogReveal` (presentation owner) sterowanego przez Intro lifecycle. P2 hydration wykonuje `skipToEnd()`/uninstall. P0 baseline wywołuje `restart()`, ale patch shaderowy nie posiada odrębnego `customProgramCacheKey`; po skompilowaniu wersji bez patcha Three może ponownie użyć programu bez fog mimo ponownego `onBeforeCompile`. To **reset/entry presentation lifecycle + shader cache contract**, nie missing Scenario truth ani checkpoint history. Test sprawdza callback/snapshot, nie render-program invalidation.
7. **Floor:** niezależny visual/asset-contract regression u ownera Floor. Runtime ukrywa `referenceBaseName` i używa wyłącznie `path*` jako presentation body; ten kontrakt zmienił widoczną geometrię, a testy sprawdzają nazwy/opacity, nie perceptual shape. Nie jest to Scenario/hydration.
8. **Astro ogromny/pod podłogą:** transform/asset contract w AstroProduction. Gameplay tool świadomie opakowuje `VR_ATTRACTOR_ROOT` skalą `1/3`; production klon opakowuje cały GLB skalą `1`, nie wybiera canonical root/scale i wylicza snap z jego ogromnych bounds. Parent Furnace ma skalę `3`, co potęguje obraz; brak `desiredWorldScale`. Nie jest to reconstruction ani Scenario.
9. **Glyphs po Asterion:** capability/gate. `isGlyphActive` wymaga `CAN_USE_GLYPHS`; capability istnieje w `2.10` i `2.30`, lecz znika od `2.40` i nie wraca w `3.80`/terminalu. Asterion completion nie jest authored i nie może go przyznać. To Scenario capability seam, nie raycast/visual bug.
10. **Gotowość do small glyphs:** dopiero po usunięciu cross-owner Intro/Astro fan-out, ownerowym baseline/hydration dla Furnace/Astro/Shell-set/Asterion, stabilnym P0/P1/P2 i decyzji o post-`3.80` graph. Nie wymaga direct activation każdej mikrosceny.

## 3. Docelowy model ownershipu

| Warstwa | Jedyna odpowiedzialność | Nie może posiadać |
|---|---|---|
| Spine | authored kolejność i canonical terminal | runtime state, commands, Three.js |
| Scenario | CO: punkty, accepted semantic events, symbolic effects, capabilities, settled consequences | fizyka, timery, lokalne transforms |
| Director | GDZIE: current point, legalność transition, crossing join/milestones | domain truth, hydration, gameplay |
| RuntimeExperience | wykonanie effects przez handler i lifecycle point activation | wybór dramaturgii, owner truth |
| Actor/domain owner | własny state, command execution, semantic completion, reset/hydration | Spine/point IDs, następny global beat, obcy domain state |
| Composition root | construction, DI, wiring, adaptery, lifecycle | stage policy, cross-domain mutation/fan-out, alternate Scenario |

Persistent fact ma jednego ownera i — jeśli uczestniczy w reconstruction — walidowane, ciche, idempotentne `reset/hydrate`. Hydration materializuje stan, nie odgrywa historycznych events. Transient state resetuje się do baseline, ale nie trafia do consequences.

## 4. Aktualny przepływ runtime

1. `experienceVr.js` preloaduje i konstruuje scene graph oraz owners.
2. Tworzy `ExperienceDirector(vrExperienceScenario)` i `RuntimeExperience` z mapą effect handlers.
3. Actor emituje callback → root mapuje go na `runtimeExperience.dispatch(EVENT)`.
4. Director akceptuje/odrzuca event, zmienia point i zwraca symbolic effects; Runtime odpala handlers synchronicznie.
5. Natural transition wykonuje transition effects oraz entry effects targetu; direct activation wykonuje `restoreBaseline → stateAt(target) → hydrate owners → synchronize → replace Director → activateCurrentPoint`.
6. P0/P1/P2 używają tego lifecycle, po czym root wykonuje spawn adapter: P0 reset spawn + calibration request; P1/P2 teleport do ring.
7. Po `3.80` Scenario nie authoruje Shell/Furnace/Asterion. Ich aktywne mechaniki biegną lokalnymi callbacks/controllers; `100.10` jest terminalem, nie reconstruction startem.

Mechanizm jest poprawny, lecz effect handlers oraz callbacks w root zawierają część policy, a actor APIs są nierówno przygotowane do reconstruction.

## 5. Owner matrix

| Owner | Prawowity domain state | Persistent/stable | Transient | Status |
|---|---|---|---|---|
| Spine/Scenario/Director | graph / authored consequences / current point | graph, current session WHERE | dispatch activation flags | CLEAN mechanicznie; authored coverage PARTIAL |
| RuntimeExperience | brak domain state | brak | handler registry, Director binding | CLEAN/PARTIAL lifecycle |
| Monkey actor/Guide | placement/dock i lokalna presentation | final placement/docked | dialogue, attention, hover | PARTIAL przez współdzielenie przez wiele presenters |
| IntroSequence | mechanics bieżącego Intro | completed crossing stage tylko jako projection | 30+ phases, dialogue queue, follow/crossing timers | LEGACY |
| IntroFogReveal | fog shader installation/radius presentation | stable cleared vs baseline installed (scenographic) | elapsed/progress/radius | PARTIAL; restart cache seam |
| Locomotion | walk boundary/player locomotion baseline | scenario ring boundary | hover/teleport/input | CLEAN/PARTIAL |
| Portal | display/reveal presentation | revealed/settled | reveal animation | PARTIAL |
| Reliquary | visible/revealed and interaction-local state | revealed; committed content belongs elsewhere | inserted/active/release animation | PARTIAL |
| CrystalCollection | spawned/inserted crystal instances | settled committed/consumed mapping needed for P2 | held, flying, hover | PARTIAL |
| ProgressionController | committed pages / tier | canonical `5/5` | notifications | CLEAN for Tier 1 |
| ProgressFloor | visible sectors, activated panels, completed tier | Tier 1 projection | pulse/opacity interpolation | PARTIAL + visual bug |
| FirstRingFlow | presentation playback only | none beyond completion projection | elapsed/active/completed | PARTIAL |
| PostRingPresentation | shell presentation + glyph elevation projection | shell visible/noninteractive; glyph elevated | animation elapsed | PARTIAL (owns two domains as presenter) |
| ObservationWindow | local timer | none | running/elapsed | CLEAN |
| PostRing dialogue | local acknowledgement | none after completion | line/state/override | CLEAN/PARTIAL Monkey contention |
| FurnaceIntro | local presentation | Furnace revealed must belong Furnace presentation | line/state | LEGACY cross-owner reveal |
| Furnace object/open/process/content/panel | its visibility, chamber, inserted content, process mechanics/mode | revealed, stable chamber/content, absorbed results as defined | hover, animation progress, active processing | LEGACY/PARTIAL |
| AstroProduction | READY/BUILDING/AVAILABLE/CLAIMING/EARNED | AVAILABLE/EARNED | BUILDING progress, CLAIMING, hits | PARTIAL; no hydrate/full reset, transform bug |
| Astro gameplay tool/HandMode | equipped/unlocked tool behavior | earned belongs production/inventory; equipped product decision | targeting/pull/hand mode | PARTIAL |
| ShellSystem/interaction | shell field and each shell physical state | revealed set; later acquired/settled facts TBD | target/pull/capture/held/return | LEGACY for global flow |
| FurnaceProgression | absorbed shell IDs | absorbed set | none material | LEGACY: no reset/hydrate |
| AsterionProduction/Sphere/Gyro | build/earned/equipped and local interaction | built/earned/equipped | construction, hover, gyro motion | LEGACY/BLOCKED by authored graph |
| AmbientSequencer | derived audio presentation | none | current sequence/playback | PARTIAL policy lives in root |
| Composition root | app objects and XR lifecycle | none of world progression | references, session/clock | LEGACY/PARTIAL |

## 6. Persistent truth matrix

| Fact | Właściwy owner | Obecny zapis | Reconstruction | Problem |
|---|---|---|---|---|
| current point | Director | Director | startPoint | poprawne |
| Intro completed/crossing settled | Intro projection + Monkey/Locomotion individual owners | consequences `1.130` | P1/P2 | poprawne fakty, Intro zbyt szeroki |
| Monkey final placement | Monkey | settled monkey state | P1/P2 | poprawne |
| ring walk boundary | Locomotion | settled locomotion state | P1/P2 | poprawne |
| Reliquary/Portal revealed | odpowiedni owner | consequences `2.20` | P2 | poprawne, natural reveal cross-fan-out |
| committed 5 pages | ProgressionController | consequences `2.30` | P2 | pojedynczy owner, poprawne |
| consumed/cleared crystals | CrystalCollection | consequences `2.30` | P2 | poprawne w obecnym zakresie |
| floor activated/completed Tier 1 | ProgressFloor jako projection | consequences `2.30` | P2 | poprawne logicznie |
| Shell field visible, glyphs elevated | PostRing presenter/Shell/Glyph presentation | consequences `3.10` | dopiero target ≥3.20 | P2=3.10 słusznie przed entry; owner granica mieszana |
| Furnace revealed | Furnace presentation | imperative `FurnaceIntro.begin` | brak | trwa tylko dzięki historycznemu side effectowi |
| Astro AVAILABLE/EARNED | AstroProduction | local state | brak | direct 3.70/3.80 niemożliwy świat |
| Shell interaction enabled | Shell owner + Scenario capability | root po claimie | brak | imperative fan-out, brak single source |
| Astro equipped | inventory/HandMode po decyzji produktu | root auto-equip | brak | policy nierozstrzygnięta |
| absorbed shell IDs | FurnaceProgression | `Set` | brak | brak reset/hydrate/consequences |
| Asterion built/earned/equipped | Asterion owners | local chain | brak | brak authored points/hydration |
| main glyph capability | Scenario | tylko point capabilities | Director-only | brakuje po first ring; Asterion nie może naprawić |

## 7. Transient state matrix

| Owner | Transient, którego nie rekonstruować | Reset |
|---|---|---|
| Intro | dialogue queue, line duration, follow pause, calibration wait, fog elapsed, crossing interpolation, hint timer | `Intro.reset`; częściowo poprawny |
| Guide/panels | open section, hover, attention pulse, dialogue override | owner reset |
| Glyph interaction | current hit/hold/acquisition audio | reset |
| Crystal | held controller, animation, insertion feedback | reset |
| Floor | pulseRemaining, opacity interpolation | reset; hydration settles przez `update(10)` |
| First/Post ring | timers i playback flags | reset |
| Furnace | button hits, OPENING/CLOSING, process progress, panel page | owner resets |
| AstroProduction | BUILDING progress, CLAIMING handoff, ray hits | `resetSession` tylko częściowo |
| Shell interaction | target, pulling, capture-ready, held, return tween | reset |
| Asterion | construction/claim animation, gyro velocities/hits | resets |
| Ambient/audio | playback position, active loop | audio reset |
| controllers | rays/hits/input edges | controller reset |

`presentationCompleted` może być lokalnym transient latch w trakcie punktu; settled result powinien być opisany przez następny punkt/consequence, nie przez replay timer.

## 8. Commands / events matrix

| System | Commands przyjmowane | Semantic events emitowane | Ocena |
|---|---|---|---|
| Intro | begin reveal/silence/onboarding; continue onboarding/invitation/follow/threshold; begin glyph explore/discovery/reliquary | reveal/silence/guide/hover/trigger/choice/follow/threshold/crossing/hint/reliquary completed | eventy dobre; command surface obejmuje obce beats |
| FirstRing | commit page, begin presentation | CARD_COMMITTED, FIRST_RING_COMPLETED, PRESENTATION_COMPLETED | `commitPage` mapuje domain result, lecz wybiera global Tier-1 event |
| PostRing | reveal shells, elevate glyphs | presentation completed | dwa commands w jednym presenterze; neutral completion dobre |
| Observation | begin | completed | clean |
| PostRingDialogue | begin | completed | clean |
| FurnaceIntro | begin | completed | command ujawnia obcego ownera |
| AstroProduction | requestCreate, claim | REQUESTED, PRODUCED, CLAIMED | REQUESTED emitowane po rozpoczęciu process; odwrócona akceptacja |
| Shell | active/visible/interaction; local pull/handoff | audio callbacks, brak authored semantic progression | lokalne mechanics poprawne, global events brak |
| Furnace | mode/open/insert/process/absorb | subskrypcje/local callbacks | global dramaturgy niewpięta |
| Asterion | build/claim/equip/local gyro | local state callbacks | global events istnieją w vocabulary, nie są wired |
| Runtime | dispatch, activateCurrentPoint/Point | brak | poprawna boundary |

## 9. Cross-owner mutation matrix

| Mutator | Mutowany owner/fakt | Miejsce/trigger | Naruszenie |
|---|---|---|---|
| Intro hydration | `platformFixturesRoot.visible`, `glyphRing.visible` | `hydrateScenarioState` | actor ustawia obce roots |
| Intro | Locomotion walk radius | player crosses ring | cross-owner mechanics; powinien być command/adaptor |
| Intro callback w root | Portal reveal + Reliquary reveal + plaque show | reliquary beat | trój-owner fan-out |
| FirstRingFlow | ProgressFloor completeTier | begin presentation | presenter bezpośrednio mutuje floor projection |
| PostRingPresentation | Shell visibility/interaction + glyphRing Y | entry | jawny presentation aggregator, ale nie owner-scoped |
| FurnaceIntro | Furnace visibility | begin | trwały cross-owner side effect |
| Astro claim callback root | Shell interaction + HandMode equip | claimed | global fan-out po dispatch bez sprawdzenia transition |
| Crystal glyph completion root | Crystal spawn + Scenario dispatch | hold completion | adapter akceptowalny, ale root zna domain sequence |
| card effect root | Portal plaque / Floor | events | Runtime handlers mogą delegować, lecz root zawiera implementation |
| FurnaceContent | transfer held shell from ShellInteraction | insertion | domain handoff adapter, jawny i bounded; akceptowalny |
| AsterionProduction | Sphere/HandMode/process driver | local build chain | cross-domain global progression bez Scenario |
| root ambient sync | Progression + FurnaceProgression + Asterion snapshots → Ambient | subscriptions | ukryta derived cross-domain policy |
| legacy `?p1` | pages/floor/shells | bootstrap shortcut | alternatywny Scenario |

## 10. Scenario / Director boundary violations

- `1.130` transition effect `BEGIN_GLYPH_FREE_EXPLORE` inicjuje target `2.10`; target nie posiada entry command.
- `2.10` completion effect `REVEAL_RELIQUARY` inicjuje discovery conversation należącą do `2.20`.
- `2.30` completion effects uruchamiają first-ring presentation/audio należące do `2.40`.
- `3.50` player request uruchamia Furnace process **przed** semantic `ASTRO_ATTRACTOR_PRODUCTION_REQUESTED`; Director nie autoryzuje działania przed jego rozpoczęciem.
- `3.60–3.80` nie mają entry commands ani settled consequences, więc Director wskazuje WHERE/capabilities, lecz physical owner może być READY, AVAILABLE lub EARNED niezależnie.
- Shell/Furnace/Asterion po `3.80` mają lokalny flow bez Director; nie wolno przedstawiać go jako authored canonical progression.
- Furnace panel pyta literalny `getCurrentPointId() === '3.50'` przez callback root. Actor/panel otrzymuje point knowledge zamiast capability.
- Capability `CAN_USE_GLYPHS` znika po `2.30`; dalsza możliwość głównych glyphów nie ma authored owner policy.

Atomy `1.40→1.50`, `1.50→1.60`, `1.60→1.70`, `1.70→1.80`, `1.80→1.100` są poprawnie target-entry i nie należy ich ponownie migrować.

## 11. Composition-root violations

1. `restoreVrScenarioBaseline` ręcznie koduje kolejność resetu dziesiątek ownerów i ustawia raw visibility roots.
2. Root zawiera pełną mapę Runtime handlers wraz z implementacją presentation (plaque/floor/audio), zamiast cienkich owner command adapters.
3. `onReliquaryReveal` fan-outuje Portal, Reliquary i plaque.
4. `onClaimed` dispatchuje, niezależnie włącza Shell i auto-equipuje Astro; brak warunku, że dispatch został zaakceptowany i przeszedł do `3.80`.
5. `syncAmbientSequence` czyta trzy owners i koduje dramaturgiczny próg Asterion.
6. `?p1`, `?furnace`, `?furnaceProcess`, `?asterionSphere` budują alternatywne gates/world history.
7. `canUseAstroProduction` używa literalnego point ID.
8. Root synchronizuje interaction priority między Monkey, crystals, Furnace, Shell i panels. Część jest prawidłowym input arbitration adapterem, ale nie powinna rozszerzać się o story decisions.
9. Root posiada spawn adapters P0/P1/P2. Teleport jest dopuszczalnym checkpoint lifecycle adapterem, o ile nie naprawia ręcznie owner truth; obecnie nie naprawia world history.

## 12. Intro ownership deep audit

### Prawowite elementy

- Transient sequencing konkretnej wypowiedzi/animacji Monkey.
- Follow/crossing movement mechanics, lokalne joins `playerEnteredRing` + `monkeySettled` i semantic completion.
- Fog presentation playback podczas samego Intro.
- Lokalny hint timer i dialogue choices, jeśli Scenario autoryzuje odpowiedni beat.

### Obce odpowiedzialności

- Hydration Intro ustawia visibility `platformFixturesRoot` i `glyphRing`, choć fixtures zawierają Portal/Reliquary/Furnace, a glyph ring ma własną prezentację.
- `onReliquaryReveal` wykonuje Portal, Reliquary i plaque. Intro oczekuje historycznego completion, by późniejszy świat był poprawny.
- Intro zmienia Locomotion walk radius w momencie crossing.
- Stan obejmuje `GLYPH_FREE_EXPLORE`, discovery, hint, Reliquary presentation — czyli kilka globalnych Scenario points, nie jednego actora Intro.
- `VR_INTRO_STATE` posiada `WAIT_RUNTIME_AFTER_*` dla niemal każdego globalnego eventu. Są to handshake latches przydatne dla exactly-once, ale całkowita kolejność stanów dubluje Scenario.
- Actor sam wybiera lokalną następną fazę po commandach/choices; po migracjach pięciu edges początek beatów jest lepszy, lecz lokalny graph nadal musi znać historyczną ścieżkę, aby zaakceptować command.
- `beginGlyphFreeExplore` akceptuje tylko `MONKEY_SETTLING`; direct activation jest możliwe wyłącznie przez specjalną Intro hydration do gotowej fazy, nie przez niezależny target entry.
- `beginReliquaryReveal` wymaga historycznego `WAIT_RUNTIME_AFTER_DISCOVERY_MONKEY_TRIGGERED`; direct `2.20` opiera się na reconstruction state i osobnych krokach, nie samowystarczalnym commandzie.

### Visibility i stable side effects

Fog roots obejmują tylko Monkey visual, glyphRing i stone; fixtures/floor nie są fog-owned. `fog cleared` jest stable presentation result P1+, ale baseline P0 musi instalować maskę. `skipToEnd/dispose` usuwa material patch. Monkey final placement, glyph visibility, fixtures visibility i locomotion boundary są rozdzielnymi owner facts — nie powinny być jednym Intro hydration payloadem.

### Ocena

**LEGACY.** Semantic events są poprawne, lecz actor nadal jest lokalnym Scenario oraz mutatorem obcych owners. CLEAN oznacza: Intro commands niezależne od historycznej global phase; visibility/hydration rozdzielone na owners; Reliquary/Portal fan-out usunięty; crossing locomotion jawnie delegowany; local state ograniczony do aktywnego presentation/mechanics.

## 13. First-ring ownership

`ProgressionController` jest właściwym, pojedynczym ownerem committed pages i `5/5`; jego atomic hydration jest właściwa. `ProgressFloor` jest presentation projection i posiada własny reset/hydrate.

`FirstRingFlow` miesza trzy rzeczy: mapowanie commit na Scenario event, decyzję że `page.order===1` oznacza global FIRST_RING_COMPLETED oraz presentation, która bezpośrednio `completeTier(1)`. Dodatkowo wywołuje root-provided ambient sync. Target `2.40` nie rozpoczyna presentation; predecessor `2.30` ją rozpoczyna.

**Status PARTIAL.** CLEAN: neutralny domain result od Progression; `2.40` target command uruchamia presentation; ambient poza flow; Floor mutowany przez własny command/projection adapter. Timer i completion event pozostają lokalne.

## 14. Post-ring ownership

`3.10` jest dobrym target-entry: osobne symbolic commands reveal shells/elevate glyphs, completion po obu. `3.20` Observation i `3.30` dialogue także są prawidłowymi target entries i semantic completions.

`PostRingPresentation` jest jednak agregatem dwóch owners: ShellSystem i glyph ring transform. Jego hydration odtwarza oba fakty, co zapewnia parity dla targetów po `3.10`, ale utrwala mieszany owner. Natural P2 (`3.10`) słusznie zaczyna od pre-entry state i następnie odgrywa presentation; direct `3.20` dostaje settled result.

`3.40` uruchamia FurnaceIntro poprawnie jako entry, lecz sam Intro bezpośrednio ujawnia Furnace. Brak settled consequence znaczy, że direct `3.50` ma baseline-hidden Furnace.

**PostRing PARTIAL; Observation CLEAN; FurnaceIntro LEGACY.**

## 15. Furnace / Astro ownership

### Furnace

- `createVrAstroFurnace`, open, option, activate, content i panel posiadają sensowne mechanics-local state.
- FurnaceProgression prawidłowo trzyma absorbed shell IDs, ale nie ma reset/hydration; baseline nie czyści jego `Set`.
- Furnace visibility po `3.40` powstaje wyłącznie przez `FurnaceIntro.revealFurnace`.
- Process driver jest współdzielony dla Shell/Asterion/Astro; local interaction decyduje mode i start, a Scenario authoruje tylko Astro do `3.80`.

### AstroProduction

Prawowity owner `READY→BUILDING→AVAILABLE→CLAIMING→EARNED`. `BUILDING`, progress, hits i CLAIMING są transient. AVAILABLE/EARNED są stable. Brak hydration oraz pełnego resetu: `resetSession()` zachowuje AVAILABLE i EARNED; jest to sensowne dla zwykłego XR re-entry, ale błędne dla canonical baseline/checkpoint rollback. Po P2→P0 earned Astro może pozostać earned, bo baseline wywołuje tylko `resetSession`.

`requestCreate()` najpierw startuje Furnace construction, potem ustawia state i emituje REQUESTED. To actor-started next beat. `onClaimed` root wykonuje Shell enable i equip.

### Transform regression

Production dodaje cały GLB clone do wrappera o baseScale `1`. Gameplay tool wyciąga `VR_ATTRACTOR_ROOT` i daje `VrAttractorModelScale=1/3` plus aim correction. Production nie używa tego asset contractu ani `desiredWorldScale`; bounds-based snap liczy pełny clone, następnie Furnace ancestor ma scale `3`. Wynik „ogromny, spod podłogi” jest deterministycznym **transform/asset contract bug** AstroProduction, nie hydration/Scenario.

**Furnace LEGACY/PARTIAL; AstroProduction PARTIAL/BLOCKED dla reconstruction.**

## 16. Shell ownership

`ShellSystem` ma field visibility, active/interaction gates i per-shell physical state. `ShellAttractorInteraction` ma poprawny transient state: target, pull, capture-ready, held/placed i handoff. Bezpośredni handoff do Furnace przez `takeHeldShell` jest bounded domain transfer, nie globalnym next-point wyborem.

Naruszenia:

- root włącza interaction po Astro claimie;
- lokalny flow nie raportuje authored semantic Shell completion do Directora;
- stable revealed/acquired/absorbed shell facts nie mają pełnej pojedynczej reprezentacji;
- `ShellSystem.reset` nie zastępuje przyszłej hydration absorbed/acquired set;
- P3 nie może powstać, dopóki settled shell-set semantics nie zostaną authored.

**LEGACY dla global progression, PARTIAL jako domain mechanics.** CLEAN nie wymaga authorowania całego future gameplay; wymaga jawnego odcięcia local mechanics od twierdzeń canonical oraz ownerowych APIs przed pierwszym authored slice.

## 17. Asterion ownership

AsterionProduction, Sphere i Gyro implementują lokalnie build/claim/equip/interaction. FurnaceProgression uruchamia gotowość po absorbed set. To największa równoległa dramaturgia poza Scenario.

- Brak authored points po `3.80` i brak Director acceptance.
- Brak settled consequences/hydration dla built/earned/equipped.
- Root/HandMode czyta `isEarned`, QA bypass i reguluje equip.
- Main glyph unlock nie jest wynikiem Asterion ownera i nie powinien być nim: capability należy do Scenario.
- Gyro motion/hits są transient i prawidłowo pozostają lokalne.

**BLOCKED/LEGACY** przez decyzję Wizjonera o post-`3.80` graph i znaczeniu earned/equipped. Mechaniki mogą być utrzymane jako subsystem, ale nie są canonical story.

## 18. Baseline / reset audit

`restoreVrScenarioBaseline` jest jednym seamem, lecz nie jest owner-complete ani semantycznie jednolity.

| Owner | Baseline obecny | Wynik |
|---|---|---|
| Director/Runtime | resetSession, następnie replacement przy activation | poprawny lifecycle |
| Intro/Fog | reset/restart na końcu | logicznie P0; shader-cache luka |
| Monkey/Guide/roots | reset + raw visibility `true` | rozproszony baseline |
| Portal/Reliquary/Crystals | reset APIs | dobre dla P0 |
| Progression/Floor | hard reset | dobre |
| PostRing/Shell | reset | dobre dla P0/P1/P2 |
| Furnace | object baseline + interaction resets | dobre mechanics, visibility fact niehydrated |
| FurnaceProgression | **brak resetu** | absorbed shells przeżywają rollback |
| AstroProduction | `resetSession`, nie hard baseline | AVAILABLE/EARNED przeżywają rollback |
| AsterionProduction | `resetSession` | należy sprawdzić persistent semantics; brak reconstruction contract |
| AsterionSphere | reset | może rozjechać się z production earned |
| HandMode | reset | auto-equip znika, ale earned może zostać |
| Ambient | reset + resync | derived policy root-owned |

Baseline ma być agregacją owner-baseline APIs; root nie powinien znać ich wewnętrznej kolejności ani raw visibility. Zwykły session re-entry i hard Scenario rollback mają różne potrzeby; obecne nazwy `resetSession` ukrywają to rozróżnienie.

## 19. Hydration / reconstruction audit

`stateAt(X)` poprawnie fold-uje settled consequences punktów **ściśle przed** X. Hydrator deleguje tylko sekcje: monkey, intro, locomotion, reliquary, portal, progression, progressFloor, crystals, postRing.

- **P1/2.10:** Monkey final, Intro GLYPH_FREE_EXPLORE/fog cleared, ring boundary. CAN_USE_GLYPHS pochodzi z Director target.
- **P2/3.10:** powyższe + Reliquary/Portal + committed pages/floor/crystals. Brak postRing jest poprawny, bo `3.10` entry dopiero go tworzy.
- **3.20+:** postRing settled consequence z `3.10` hydratuje Shell field/glyph elevation.
- **3.50+:** Furnace revealed nie istnieje.
- **3.70/3.80:** Astro AVAILABLE/EARNED nie istnieje.
- **Post-3.80:** Shell absorbed/Asterion facts nie istnieją, a terminal nie jest reconstruction targetem.

Hydration Intro i PostRing łamie owner atomicity, bo każda sekcja mutuje kilka owners. Synchronizacja ambient po hydration jest poprawnym miejscem lifecycle, ale formula powinna mieć dedykowanego derived presentation ownera.

## 20. P0/P1/P2 stable-world parity

| Porównanie | Oczekiwane stable facts | Rzeczywisty wynik |
|---|---|---|
| świeży P0 | baseline owners; fog installed/radius 20; Intro 1.10; rays/calibration lifecycle; no Tier1/Shell/Furnace/Astro truth | logicznie tak; perceptual fog zależy od shader program cache |
| P2→P0 | identyczne persistent/scenographic facts jak świeży P0 | **nie**: fog może nie wrócić; FurnaceProgression absorbed set i Astro AVAILABLE/EARNED również nie mają hard rollback |
| natural P1 vs direct P1 | completed Intro, Monkey settled, fog cleared, glyph ring/fixtures visible, ring boundary, CAN_USE_GLYPHS; brak crystals/Tier1 | deklaratywnie parity; direct spawn differs tylko placement adapter; brak full perceptual test |
| natural P2 vs direct P2 | P1 facts + Reliquary/Portal revealed, 5 committed, crystals settled, Floor Tier1; then `3.10` shell/glyph presentation | deklaratywnie parity w objętych owners; direct entry exactly once; brak production full-world test |

Natural P0 po świeżym loadzie i live P2→P0 różnią się historią shader compilation oraz nie-hard-resetowanych późnych owners. Timery/hover/audio nie są wymagane do parity.

## 21. P2 → P0 fog root cause

**Owner:** `createVrIntroFogReveal` posiada maskę shaderową (`patched`, installation, radius); IntroSequence tylko dowodzi lifecycle command.

**Co pozostaje po P2:** hydration P2 ustawia Intro jako settled GLYPH_FREE_EXPLORE i wywołuje `fogReveal.skipToEnd()`. To ustawia radius 0, `progress=1` i `uninstall()`, przywracając oryginalne `material.onBeforeCompile`. Renderer może skompilować/cache’ować bez-fog wariant materiałów Monkey/glyph/stone.

**Co robi P0:** baseline `Intro.reset()` woła `fogReveal.restart()`, które przywraca callback, `needsUpdate` i snapshot installed/radius 20; entry zaczyna reveal. Jednak patch nie definiuje `material.customProgramCacheKey`. Three program cache nie ma jawnej informacji, że kod `onBeforeCompile` zmienił wariant. Po cyklu uninstall→render→reinstall może reuse’ować program bez injected uniforms/shader, choć JS snapshot twierdzi `installed=true`.

**Klasyfikacja:** primary **presentation owner reset/entry lifecycle + transform shader cache contract**; secondary brak render-level regression guard. Nie jest to persistent Scenario consequence (P0 ma fog baseline, nie reconstructed history), Director ani missing checkpoint alias. Jest to imperative side effect ownera, którego reset nie gwarantuje perceptual restoration.

**Dlaczego testy nie wykrywają:** test fog porównuje zmianę `onBeforeCompile`, `needsUpdate`, radius/progress i generowany shader po ręcznym wywołaniu callbacku. Nie kompiluje dwóch wariantów przez rzeczywisty renderer/program cache i nie wykonuje produkcyjnego P2→P0 frame sequence.

## 22. Floor geometry regression classification

**Konkretne źródło:** Floor owner rozdzielił GLB contract na niewidoczny `referenceBaseName` i transparentowany `presentationBodyNames` (`path4`/`path1`). Każdy cloned sector ustawia reference base `visible=false`; widzialna geometria po reveal pochodzi wyłącznie z `path*`. Jeśli reference base jest częścią właściwego authored kształtu, runtime usuwa geometrię, nie tylko helper/reference. Rotacje/radii są następnie wyprowadzane z clone/panel centers; nie ma Scenario udziału.

**Klasyfikacja:** **independent gameplay/visual bug / Floor domain presentation owner, dokładniej błędny GLB node-role asset contract.** Nie reconstruction: świeży i hydrated floor używają tej samej geometrii. Nie composition fan-out ani Director.

**Granica audytu:** konkretny mutation/contract znaleziony; perceptual wybór właściwego node’a wymaga asset QA, nie dalszego rozszerzenia audytu.

## 23. Astro production transform/scale regression classification

**Konkretne źródło:** production controller bierze pełny `astro_grabber.glb`, wrapper scale 1 i bounds całego clone. Canonical gameplay presentation bierze tylko `VR_ATTRACTOR_ROOT`, nakłada `modelScale=1/3` i aim correction. Production nie przekazuje `desiredWorldScale`, nie ma production-root/scale contractu i centrowanie bounds wpływa na Y snap. Content anchor dziedziczy Furnace scale 3.

**Klasyfikacja:** **błędny transform/asset contract w AstroProduction ownerze** (niezależny visual bug). Nie hydration, nie capability, nie Scenario ownership. Test używa pudełka 0.1 m pod unscaled anchor i dlatego nie chroni realnego GLB/Furnace hierarchy.

## 24. Post-Asterion glyph targeting regression classification

`isGlyphActive(node)` wymaga równocześnie next uncommitted tier oraz `runtimeExperience.can(CAN_USE_GLYPHS)`. Po Tier1 next tier istnieje, ale Scenario daje capability tylko w `2.10` i `2.30`. `2.40`, wszystkie `3.x`, `3.80` i terminal jej nie mają. Asterion local completion nie przechodzi przez Director i nie może legalnie odblokować capability.

**Klasyfikacja:** **Scenario capability/gate ownership gap**, ujawniony po local Asterion gameplay. Nie GlyphInteraction/raycast, nie hydration i nie transform. Docelowy moment ponownego przyznania capability wymaga Wizjoner decision o niezauthorowanym post-`3.80` graph; actor nie może sam go dodać.

## 25. Architectural guards and missing tests

Istniejące testy dobrze chronią Spine, Director, Runtime effect vocabulary, exclusive stateAt, hydration delegation, P0/P1/P2 switching, Intro semantics oraz owner mechanics. Brakuje:

1. static guard: point IDs tylko Scenario/Director/explicit adapters;
2. target beat nie startuje z predecessor effect;
3. actor nie mutuje obcego ownera / root nie fan-outuje po completion;
4. dispatch rejection nie wykonuje Astro Shell/equip side effects;
5. owner-complete hard baseline, w tym FurnaceProgression i Astro states;
6. production renderer test P2→P0 fog compile/cache parity;
7. full stable-world snapshots świeży P0 vs P2→P0, natural/direct P1/P2;
8. direct 3.50–3.80 albo jawne odrzucenie ich jako supported reconstruction targets;
9. real-asset Astro production world bounds/scale/inside-chamber contract;
10. Floor GLB node-role/perceptual geometry contract;
11. capability continuity test dla main glyphs po authored unlock;
12. no global next-beat events from Shell/Furnace/Asterion until authored;
13. root boundary check dopuszczający DI/input arbitration, zakazujący stage conditionals i raw cross-owner mutations;
14. reset/hydrate idempotence i silence (zero semantic events/audio).

## 26. Owners: CLEAN / PARTIAL / LEGACY / BLOCKED

| Owner | Status | Warunek CLEAN |
|---|---|---|
| Spine | CLEAN | utrzymać single derived mainline/terminal |
| Scenario graph do 3.40 | PARTIAL | trzy remaining owner seams; Furnace consequence |
| Director | CLEAN | brak zmian mechanizmu; guard sole WHERE |
| RuntimeExperience | CLEAN/PARTIAL | zachować executor; jawne supported activation scope |
| Monkey actor | PARTIAL | presenter arbitration bez obcych hydration facts |
| Intro | LEGACY | usunąć obce visibility/reliquary/locomotion i global duplicate state machine |
| Fog | PARTIAL | perceptually reliable baseline restart + render guard |
| Portal/Reliquary/Crystals | PARTIAL | owner commands; bez Intro/root fan-out |
| ProgressionController | CLEAN | utrzymać single `5/5` truth |
| Floor | PARTIAL | poprawny asset contract; owner command boundary |
| FirstRing | PARTIAL | target-entry presentation; neutral events; ambient separation |
| PostRing | PARTIAL | owner-scoped Shell/glyph projections lub jawny synchronizer |
| Observation | CLEAN | utrzymać transient-only |
| PostRingDialogue | CLEAN/PARTIAL | jawna ownership Monkey override |
| FurnaceIntro | LEGACY | nie ujawnia Furnace; tylko presentation+completion |
| Furnace owners | LEGACY/PARTIAL | stable visibility/content/process/absorbed reset+hydrate; Scenario command boundary |
| AstroProduction | PARTIAL | request-before-action; transform contract; hard baseline + AVAILABLE/EARNED hydration |
| Astro tool/HandMode | PARTIAL | rozstrzygnąć equip; brak root fan-out |
| Shell | LEGACY/PARTIAL | owner stable facts/APIs; semantic boundary; authored scope |
| FurnaceProgression | LEGACY | reset/hydrate absorbed IDs, single truth |
| Asterion | BLOCKED/LEGACY | authored post-3.80 graph + owner stable APIs/events |
| Ambient | PARTIAL | dedicated derived synchronizer |
| Composition root | LEGACY/PARTIAL | tylko construction/wiring/lifecycle; bez policy/fan-out/alternate Scenario |
| P0/P1/P2 checkpoint adapters | PARTIAL | stable parity incl. fog/hard resets; spawn-only adapter |

## 27. Remaining migration seams grouped by owner

### A. Niezbędne porządkowanie architektury

- **Intro/Portal/Reliquary/Locomotion:** rozdzielić foreign mutations i global phases; zachować semantic events.
- **FirstRing/Floor:** target `2.40` owns begin; neutral Tier result; ambient poza ownerem.
- **Furnace presentation:** owner visibility reset/hydrate + settled reveal.
- **AstroProduction:** semantic request przed process, owner stable hydration/hard reset, claim result bez root fan-out.
- **Shell/HandMode:** symbolic target commands po zaakceptowanym Astro claim; equip jako jawna policy po decyzji.
- **FurnaceProgression:** owner absorbed set API przed jakimkolwiek P3.
- **Composition:** owner baseline registry/adapters; derived ambient synchronizer; usunięcie stage literals/legacy alternate flow.
- **Asterion:** dopiero po authored graph; commands/events i stable owner truth.

### B. Zwykłe bugfixy

- Fog shader cache/reinstall regression.
- Floor GLB node-role geometry regression.
- Astro production real-asset scale/root/snap regression.
- Glyph capability bug po ustaleniu authored unlock momentu (sam moment jest decyzją Scenario).

### C. Future gameplay niezauthorowany

- Shell acquisition mainline po `3.80`.
- Furnace shell processing global beats.
- Asterion build/claim/equip mainline.
- P3/P4 aliases i small glyph gameplay.

### D. Kosmetyczna czystość

- Nazwy compatibility aliases w Scenario/Runtime.
- Rozdrobnienie długich effect handlerów, jeśli nie zmienia ownership.
- Ujednolicenie formatowania/copy placement.
- Direct activation każdej mikrosceny Intro — nie jest priorytetem ani wymogiem przed dalszym developmentem.

## 28. Recommended recovery/migration order

Kolejność ma maksymalizować bezpieczne authorowanie dalszej gry, nie micro-checkpoints:

1. Zamknąć **baseline integrity ownerami**: rozróżnić hard Scenario baseline od XR session reset; objąć Fog, FurnaceProgression, Astro/Asterion production stable states; dodać P0 rollback parity guards.
2. Oczyścić **Intro/Portal/Reliquary/Locomotion** jako jeden owner-group seam; nie migrować bezmyślnie wszystkich effects.
3. Oczyścić **FirstRing/Floor/PostRing/Furnace reveal** i uzyskać pełną natural/direct parity P1/P2 oraz stable Furnace reveal dla dalszych targets.
4. Oczyścić **AstroProduction lifecycle**: request acceptance, production stable truth/hydration, claim result; oddzielić Shell enable i equip.
5. Odchudzić **composition root**: baseline registrations, ambient synchronizer, usunąć literal `3.50` i legacy alternate dramaturgy; zachować tylko DI/lifecycle/input arbitration.
6. Ustalić Wizjoner decisions: Astro auto-equip, stable chamber state, post-`3.80` sequence i glyph re-enable beat.
7. Dopiero potem authorować minimalny **Shell → Furnace** vertical slice z semantic completions i absorbed-set owner hydration.
8. Następnie authorować **Asterion** bounded slices i ich stable hydration.
9. P3/P4 oraz small glyphs dopiero gdy odpowiadające targety i owners spełniają DoD; checkpoint nie może poprzedzać truth modelu.

Bugfixy Floor/Astro transform/Fog mogą być niezależnymi atomami, lecz nie zastępują ownership work. Guards powstają razem z każdym owner seam, nie jako końcowa faza.

## 29. Explicit blockers requiring Wizjoner decision

1. Czy claim Astro automatycznie equipuje prawą rękę, czy tylko przyznaje EARNED/equipable?
2. Jaki jest canonical stable chamber state dla Astro AVAILABLE i dla direct targetu po konstrukcji?
3. Jaka dokładnie authored sekwencja następuje po `3.80` przed Shell complete, Furnace processing i Asterion?
4. W którym authored beat `CAN_USE_GLYPHS` wraca dla głównych glyphów i kiedy przechodzi na small glyphs?
5. Które Shell facts są persistent: acquired, absorbed, returned/placed; jaki jest canonical six-shell set?
6. Czy milestones Directora są tylko telemetry session, czy mają być hydrated z settled history?
7. Czy subsystem QA query flags zostają izolowanymi harnesses, czy są usuwane; nie każdy może stać się checkpointem.
8. Jaki jest asset-authoritative node/shape Floor sector (reference base vs `path*`)? To decyzja asset/perceptual, nie architektury.

## 30. Definition of Done

System jest wystarczająco uporządkowany do small glyphs, gdy:

- jeden Director jest jedynym global WHERE, a actors/root nie sprawdzają canonical point IDs;
- global beats zaczynają target entry/accepted command, nie predecessor ani actor callback;
- Intro nie mutuje Portal/Reliquary/Floor/Glyph/Furnace/Locomotion truth i nie dubluje globalnego graphu;
- FurnaceIntro nie posiada Furnace visibility;
- Astro request nie rozpoczyna process przed Director acceptance; claim nie fan-outuje w root;
- każdy persistent fact przez P2 oraz planowany P3/P4 ma jednego ownera, hard reset i ciche idempotentne hydration;
- transient timers/hits/animations/CLAIMING nie są rekonstruowane;
- świeży P0 = P2→P0 dla stable world; natural P1/P2 = direct P1/P2;
- Fog perceptual restart jest chroniony renderer-level testem;
- FurnaceProgression/Astro/Asterion nie przechowują niewyczyszczonej truth poza baseline;
- composition root wyłącznie konstruuje, wires adapters i zarządza lifecycle; ambient policy ma dedykowanego ownera/synchronizer;
- legacy QA nie tworzy alternatywnej fabuły;
- Shell/Furnace/Asterion są albo authored w Scenario, albo jawnie subsystem-only;
- Floor i Astro transform bugs są sklasyfikowanymi, niezależnymi bugfixami i nie maskują ownership acceptance;
- Scenario ma jawny beat/capability dla ponownego targeting glyphs;
- P3/P4 są dodawane dopiero po complete consequences/hydration targetów.

## 31. Handoff for next Architect thread

**Najważniejszy stan:** mechanizm Spine/Scenario/Director/Runtime i P0/P1/P2 istnieje; architecture nie jest jeszcze owner-clean. Nie rozpoczynać od kolejnego automatycznego `entryEffect` edge.

**Ownerzy do pierwszego odczytu:** Intro (`createVrIntroSequence`, Fog), root handlers/baseline, FirstRing/PostRing/FurnaceIntro, AstroProduction, Shell/FurnaceProgression, Asterion.

**Najważniejsze dowody:**

- Intro hydratuje foreign roots i root fan-outuje reveal.
- FirstRing predecessor uruchamia target presentation.
- Furnace reveal jest imperative i niehydrated.
- Astro stable states są local bez hard baseline/hydration; request startuje process przed eventem; claim fan-outuje Shell/equip.
- FurnaceProgression absorbed set nie jest resetowany przez canonical baseline.
- P2 hydration wyłącza Fog; P0 reinstall nie rozróżnia shader cache key.
- Floor ukrywa reference bases; production Astro pomija canonical `1/3` tool scale/root; glyph gate traci CAN_USE_GLYPHS.

**Minimalny context w nowym wątku:** ten dokument; `VR_SCENARIO_DIRECTOR_MODEL.md`; `VR_RUNTIME_MODEL.md`; `vrExperienceScenario.js`; `RuntimeExperience.js`; następnie tylko pliki ownera wybranego zgodnie z sekcją 28.

**Niezauthorowane:** P3/P4, small glyphs oraz canonical Shell/Furnace/Asterion progression. `100.10` pozostaje terminalem i nie może być reconstruction startem.

**Zasada dalszych prac:** jeden bounded owner seam, jeden persistent truth owner, osobny architectural guard; bugfixy perceptualne nie są migracją Scenario.
