# Experience VR — Scenario Migration Audit

**Data audytu:** 2026-08-12
**Status:** working evidence / mapa migracji, synchronized after M1.3
**Zakres dowodowy:** aktualny kod gałęzi roboczej; dokumenty kanoniczne przeczytane w kolejności wskazanej w zadaniu.
**Zasada interpretacji:** kod dowodzi implementacji, dokumentacja opisuje model. Poniższe rekomendacje identyfikują przyszłą granicę, nie ustanawiają API i nie zmieniają decyzji architektonicznych.

## 1. Executive summary

### M1.3 synchronization

M0, M1.1 **Live Bootstrap Slice**, M1.2 **Intro Reveal Completion Handoff**, and M1.3 **Post-Reveal Silence Completion Handoff** are complete; M1 overall remains **IN PROGRESS**. Scenario and `ExperienceDirector` are authoritative only for `XR_CALIBRATED → BEGIN_INTRO_REVEAL`, `INTRO_REVEAL_COMPLETE → BEGIN_POST_REVEAL_SILENCE`, and `POST_REVEAL_SILENCE_COMPLETE → BEGIN_CONTROLLER_ONBOARDING`, with `RuntimeExperience` as the injected symbolic-effect execution boundary. SG-032 and SG-039 are **MIGRATED**. The actor retains the two-second timer, then waits for Runtime to start onboarding. The Y-panel UI facts and tutorial from `WAIT_PLAYER_PANEL_OPEN` remain actor-owned; SG-040 and later groups are not migrated. QA bypass does not emit synthetic completion. RC-01…RC-14 retain their prior status and are not consolidated. Full central Scenario ownership does not exist. M1.1 hardware smoke is **PASS — confirmed on Meta Quest 3S by Projectant, 2026-08-12**. M1.2 hardware smoke is **PASS — confirmed on Meta Quest 3S by Projectant, 2026-08-12**. M1.3 hardware smoke is **PENDING — HARDWARE QA NOT EXECUTED**.

Scenariusz nie ma dziś jednego właściciela. Audyt znalazł **12 niezależnych lub częściowo niezależnych ownerów stanu/decyzji**: composition root, Intro, portfolio progression, crystal collection/reliquary, floor, Monkey/guide, hints, hand modes, shell field, furnace material progression, furnace process oraz Asterion production. Dodatkowym właścicielem projekcji czasowej jest ambient sequencer.

Największy przeciek znajduje się w `src/experienceVr.js`: root nie tylko tworzy i łączy obiekty, ale pyta kilka controllerów o stan, wylicza dostępność, uruchamia efekty świata/audio/narracji, ręcznie synchronizuje bypass i powtarza kolejność resetów (`src/experienceVr.js:L282-L305`, `L401-L539`, `L620-L751`). Intro jest drugim skupiskiem: jedna maszyna łączy authored flow, timery, ruch Małpy, fog, visibility, locomotion i bezpośrednie callbacki świata (`src/xr/guidance/createVrIntroSequence.js:L33-L123`).

Inwentaryzacja obejmuje **52 globalne gate/trigger/coupling entries**, w tym **11 capability gates**, **12 łańcuchów zdarzeń**, **18 cross-subsystem reads**, **14 reset couplings** i **4 QA bypasses**. Nie znaleziono istniejącego centralnego `Scenario` ani `Director`; potwierdza to również kanoniczny Runtime Model, który mówi o braku centralnego progression core/store.

Najważniejsze ryzyka migracji:

1. intro może się zakleszczyć, bo przejścia zależą równocześnie od timera, pollingu UI, pozycji głowy, ruchu Małpy i callbacku pierwszego kryształu;
2. visibility fixtures ma wielu ownerów (Intro callback, lokalne `reset/reveal`, session reset, production presentation);
3. trzy niemal podobne, lecz niesymetryczne ścieżki cleanup mogą rozjechać stan przyszłego Directora i actorów;
4. availability wynika z bezpośrednich odczytów innych subsystemów wykonywanych co klatkę;
5. commit karty uruchamia synchroniczny fan-out floor/world/audio/Monkey, a produkcja Asteriona tworzy długi callback/polling cycle.

### Konflikty dokumentacja ↔ kod

- Narrative Baseline stwierdza, że mechaniczna kolejność po P0 „nie definiuje jeszcze narracyjnych przejść”. Kod rzeczywiście nie ma authored dialogue między progami, ale ma scenariuszowe **world/audio/attention transitions** po commicie i tier completion (`src/experienceVr.js:L417-L425`). To różnica zakresu słowa „narracyjne”, nie rozstrzygnięta w audycie.
- Runtime Model mówi, że exit/re-entry czyści portal preview i reliquary/buttons, po czym committed progress/floor przeżywa. Kod najpierw przywraca portal waiting state, a następnie `introSequence.reset()` ponownie ukrywa fixtures przy aktywnym Intro (`src/experienceVr.js:L634-L655`; `src/xr/guidance/createVrIntroSequence.js:L76-L83`). Efekt końcowy zależy od bypassu; model nie opisuje tej kolejności szczegółowo.
- Runtime Model nazywa `platformFixturesRoot` kontenerem zawsze obecnym. Kod ustawia `platformFixturesRoot.visible = true` w Intro reset, ale lokalnie ukrywa portal/furnace/reliquary (`src/xr/guidance/createVrIntroSequence.js:L79-L82`; `src/experienceVr.js:L525-L526`), co jest zgodne. Nie znaleziono konfliktu transform authority.
- Baseline mówi o „portal, canvas oczekiwania, relikwiarz oraz przyciski” po reveal. Kod revealuje portal i reliquary, a przyciski są companions reliquary i dziedziczą jego reveal (`src/experienceVr.js:L431-L459`, `L527-L533`). Zgodne, choć pośrednie.

## 2. Current progression owners

| Owner | Plik / dowód | Odpowiedzialność i stan | Publiczne API; creator / readers / writers | Klasa stanu |
|---|---|---|---|---|
| Experience VR composition root | `src/experienceVr.js:L124-L785` | QA flags, active session, calibration pending; pochodne gates, fan-out commit, world/audio sync, reset order | tworzy wszystkie poniższe; czyta niemal wszystkie; modyfikuje przez callbacki i frame loop | **mieszany** composition + scenario + lifecycle |
| `VrIntroSequence` | `src/xr/guidance/createVrIntroSequence.js:L33-L123` | 19 stanów Intro, message queue/phase, tutorial/follow/ring/discovery flags i timery | `update/reset/beginAfterXrCalibration/choose*/getState/notifyGlyphExploreSuccess`; tworzony/czytany przez root; modyfikowany przez frame, panel polling, Monkey callbacks i glyph callback | **narrative/scenario + technical, mieszany** |
| `VrProgressionController` | `src/xr/progression/createVrProgressionController.js:L9-L54` | `activatedPageIds`, `currentTier`; branch/tier correctness | `getCurrentTier/canInsertCrystal/getNextPage/commitPage/hasActivatedPage/getActivatedPageIds/isTierComplete`; root tworzy; crystal, Monkey, shortcut, root czytają; crystal/shortcut commitują | **progression-domain** |
| Crystal collection | `src/xr/createVrCrystalCollection.js:L35-L518` | fizyczne instances i stany `available/held/inserted/active/rejecting/consuming/released`; preview/commit handoff | `spawnOne/update/reset/activateInserted/releaseInserted/getInsertedInstance`; root tworzy/czyta; controller input i reliquary buttons modyfikują | **mieszany subsystem + progression bridge** |
| Crystal reliquary | `src/xr/createVrCrystalReliquary.js:L15-L292` | reveal/interaction, insertion feedback, companions | `reveal/hide/reset/isInteractionEnabled/attachCompanion`; root/Intro/collection | **subsystem-local z visibility gate** |
| Progress floor | `src/xr/floor/createVrProgressFloor.js:L25-L349` | aktywne panele, tier rings i animacje projekcji | `activatePage/completeTier/update/reset/dispose`; root callback i QA shortcut zapisują | **projection/world state**, nie truth progresji |
| Monkey Guide | `src/xr/guidance/createVrMonkeyGuide.js:L40-L619` | open view/menu/history, dialogue override, transient unread/attention i hit ownership | `showMessage/setDialogueOverride/notifyAttention/setInteractionEnabled/hasCurrentHit/update/reset`; root i Intro/hints piszą; czyta progression controller | **mieszany UI/narrative/progression projection** |
| Player Guide | `src/xr/guidance/createVrPlayerGuidePanel.js:L19-L269` | open/section/detail/navigation | `isOpen/getActiveSectionId/getViewState/update/reset`; Intro i root/hand mode pollują | **subsystem-local UI**, ale fakty UI są eventami Intro |
| Reliquary hints | `src/xr/guidance/createVrReliquaryHints.js:L6-L27` | obserwowany instance/phase, elapsed/fired/override ownership | `update/reset/getSnapshot`; root tworzy/update/reset; czyta collection, pisze Monkey | **contextual scenario/guidance** |
| Hand mode controller | `src/xr/input/createVrHandModeController.js:L11-L116` | left/right equip modes | `update/reset/get*Mode/equipLeftAsterion`; root tworzy; interaction systems czytają; semantic input i production claim zapisują | **mieszany capability + subsystem-local** |
| Shell system / attractor | `src/xr/shells/createVrShellSystem.js:L8-L97`; `createVrShellAttractorInteraction.js:L14-L215` | field active oraz lokalne shell lifecycle/held target | `setActive/update/reset`; interaction takeover/transfer/reset | active flag **scenario/world**; shell motion **subsystem-local** |
| Furnace material progression | `src/xr/furnace/createVrAstroFurnaceProgressionController.js:L6-L42` | set sześciu unikalnych committed shell ids | snapshot/can/commit/subscribe; root tworzy; content/production/panel/ambient czytają, content commit zapisuje | **progression-domain** |
| Furnace content/process/open/option | `src/xr/furnace/createVrAstroFurnaceContentInteraction.js:L20-L302`; `createVrAstroFurnaceActivateInteraction.js:L37-L413`; `createVrAstroFurnaceOpenInteraction.js:L18-L224`; `createVrAstroFurnaceOptionInteraction.js:L7-L57` | techniczne state machines insertion/process/chamber/mode; proces emituje completion | lokalne API `getState`, gates, update/reset; wzajemnie się odpytują; root je spina | **mieszany**: fakty techniczne + scenario prerequisites |
| Asterion production | `src/xr/asterion/createVrAsterionProductionController.js:L15-L120` | `LOCKED→READY→BUILDING→AVAILABLE→EARNED`, build/claim | `canCreate/requestCreate/claim/update/resetSession/subscribe`; root tworzy; furnace panel/ambient/hand mode czytają | **progression-domain + presentation, mieszany** |
| Ambient sequencer | `src/xr/audio/createVrAmbientSequencer.js:L7-L71` | threshold/subthreshold, queue cursor, generation/timers/handles | `setState/reset/dispose`; root wylicza i zapisuje | techniczny audio owner z wejściem **scenario-derived** |

## 3. Global scenario gates

> Liczenie: każdy wiersz to jeden kandydat migracyjny. `CAPABILITY_GATE` = 11 (w tym gates lokalnego arbitrażu interakcji oznaczone do pozostawienia poza Scenario). `RESET_COUPLING` = 14. Pozostałe typy są triggerami/gates, nie są ponownie liczone jako capability.

| ID | Source / funkcja | Condition / source state | Current effect / subsystem | Type | Future owner recommendation | Risk |
|---|---|---|---|---|---|---|
| SG-001 | `src/experienceVr.js:L127-L129` module init | URL ma `p1/asterionSphere/furnaceProcess/furnace` | całe Intro bypassed | QA_BYPASS | Director bootstrap adapter | HIGH |
| SG-002 | `src/experienceVr.js:L158-L159` | configured + `?asterionSphere` | Sphere equipment available bez production | QA_BYPASS | Director QA capability overlay | HIGH |
| SG-003 | `src/xr/progression/applyVrProgressionShortcut.js:L4-L18` | `?p1` | commit wszystkich Tier-1 pages, floor ring, sync world | QA_BYPASS | Director QA event batch; domain commit pozostaje controllerowi | HIGH |
| SG-004 | `src/experienceVr.js:L127`, `L352-L353` | `?furnaceProcess` | furnace visible/reset przed authored reveal | QA_BYPASS | QA bootstrap adapter | MEDIUM |
| SG-005 | `src/experienceVr.js:L282-L287` `syncAmbientSequence` | current tier + shells complete + sphere built | wybór full/subthreshold ambient | AUDIO_TRIGGER | Director cue → audio adapter | HIGH |
| SG-006 | `src/experienceVr.js:L288-L289` | furnace/production subscription | ponowny ambient sync | DIRECT_CALLBACK / AUDIO_TRIGGER | event bridge | MEDIUM |
| SG-007 | `src/experienceVr.js:L290` | portfolio Tier 1 complete | shell field active | WORLD_STATE_TRIGGER | Director command | HIGH |
| SG-008 | `src/experienceVr.js:L304` | Tier 1 complete | Astro unlocked | CAPABILITY_GATE | `director.can(CAN_EQUIP_ASTRO)` | HIGH |
| SG-009 | `src/experienceVr.js:L305` | production earned OR QA | Sphere available | CAPABILITY_GATE | `director.can(CAN_EQUIP_ASTERION)` | HIGH |
| SG-010 | `src/experienceVr.js:L306` | player panel open | blokada left tool toggle | CAPABILITY_GATE | actor-local UI modal capability, queried via Director only if globally coordinated | MEDIUM |
| SG-011 | `src/experienceVr.js:L329-L331` | right Astro / left Sphere equipped | Monkey ordinary-ray disabled per hand | CAPABILITY_GATE | shared interaction policy adapter | MEDIUM |
| SG-012 | `src/experienceVr.js:L356-L359` | hand mode + panel/Monkey hits | furnace ray availability | CAPABILITY_GATE | interaction arbiter, not authored Scenario | MEDIUM |
| SG-013 | `src/experienceVr.js:L365-L368` | active furnace mode | Open allowed | CAPABILITY_GATE | Director capability + subsystem validity | HIGH |
| SG-014 | `src/experienceVr.js:L374-L383` | active mode/process kind | furnace process audio start/stop | AUDIO_TRIGGER | process event → audio adapter | MEDIUM |
| SG-015 | `src/experienceVr.js:L385-L390` | active mode + held shell transfer | content insertion possible | CAPABILITY_GATE | Director `CAN_USE_FURNACE` ∧ subsystem validity | HIGH |
| SG-016 | `src/experienceVr.js:L397-L399` | panel hit priority | option interaction availability/audio | CAPABILITY_GATE | interaction arbiter; audio event bridge | LOW |
| SG-017 | `src/experienceVr.js:L405` | insert accepted | reliquary insert sound | AUDIO_TRIGGER | domain event bridge | LOW |
| SG-018 | `src/experienceVr.js:L406-L414` | tool modes + competing hits | crystal grab allowed | CAPABILITY_GATE | interaction arbiter + Director capabilities | HIGH |
| SG-019 | `src/experienceVr.js:L416` | crystal Activate preview | portal page copy shown | WORLD_STATE_TRIGGER | Director cue; content resolver stays adapter | MEDIUM |
| SG-020 | `src/experienceVr.js:L417-L425` `onCommit` | page committed / tier completed | floor page/ring, shell sync, ambient, consume/tier audio, Monkey attention | PROGRESSION_COMMIT | event → Director fan-out | HIGH |
| SG-021 | `src/experienceVr.js:L439-L444` | reliquary enabled + crystal `inserted` | Activate allowed, state advance/audio | SCENARIO_GATE | capability query; local transition stays collection | MEDIUM |
| SG-022 | `src/experienceVr.js:L456-L458` | reliquary enabled + crystal `active` | Release allowed, commit, reset Activate | SCENARIO_GATE | capability query/event bridge | HIGH |
| SG-023 | `src/xr/guidance/createVrReliquaryHints.js:L11-L24` | inserted/active unchanged 15 s | Monkey attention + contextual hint | TIMER_TRIGGER / NARRATIVE_TRIGGER | Director timer/cue; copy in scenario content | HIGH |
| SG-024 | `src/experienceVr.js:L463-L469` | uncommitted page and no live unreleased same branch+tier crystal | calculates next crystal tier | SCENARIO_GATE | progression query remains domain; availability composed by Director | HIGH |
| SG-025 | `src/experienceVr.js:L470-L474` | Intro free explore/bypassed + next tier exists | glyph active | SCENARIO_GATE | `director.can(CAN_USE_GLYPH)` | HIGH |
| SG-026 | `src/experienceVr.js:L481-L495` | glyph lifecycle/hold complete | audio loop; spawn crystal; Intro discovery; completion sound | NARRATIVE_TRIGGER / AUDIO_TRIGGER | glyph facts → Director; spawn command/domain adapter | HIGH |
| SG-027 | `src/experienceVr.js:L506-L509` | competing hits | shell targeting interaction suppressed | CAPABILITY_GATE | interaction arbiter | MEDIUM |
| SG-028 | `src/experienceVr.js:L524` | opening onboarding ready | controller rays enabled | WORLD_STATE_TRIGGER | Director command to controller actor | MEDIUM |
| SG-029 | `src/experienceVr.js:L525` | normal Intro reset | portal/furnace hidden, reliquary reset | VISIBILITY_GATE | Director scene entry cue | HIGH |
| SG-030 | `src/experienceVr.js:L526` | Intro bypass | portal/furnace/reliquary visible/reset | VISIBILITY_GATE | Director QA scene entry cue | HIGH |
| SG-031 | `src/experienceVr.js:L527-L533` | discovery conversation complete | 3 s reveal portal/reliquary/canvas | VISIBILITY_GATE / NARRATIVE_TRIGGER | Director cue; reveal execution actors | HIGH |
| SG-032 | `src/experienceVr.js` calibration block and effect adapter | calibration completed / bypass | Intro starts; bypass enables rays | SCENARIO_GATE | **MIGRATED** — `XR_CALIBRATED → BEGIN_INTRO_REVEAL` through RuntimeExperience | HIGH |
| SG-033 | `src/experienceVr.js:L577` | player guide open | locomotion yaw locked | CAPABILITY_GATE | modal interaction policy | MEDIUM |
| SG-034 | `src/experienceVr.js:L598-L601` | Sphere equipped + gyro drive | device loops synchronized each frame | AUDIO_TRIGGER | semantic state-change events → audio adapter | MEDIUM |
| SG-035 | `src/experienceVr.js:L603-L605` | glyph not currently active | exhausted lighting | VISIBILITY_GATE | capability projection | MEDIUM |
| SG-036 | `src/xr/guidance/createVrIntroSequence.js:L64-L75` | messages/hover/press/options | P0 onboarding→invitation→follow/ending/threshold | SCENARIO_GATE / NARRATIVE_TRIGGER | Scenario + Director | HIGH |
| SG-037 | `src/xr/guidance/createVrIntroSequence.js:L54-L58` | head radius crosses ring | entry fact; walk radius becomes ring | WORLD_STATE_TRIGGER | subsystem event → Director command | HIGH |
| SG-038 | `src/xr/guidance/createVrIntroSequence.js:L76-L83` | reset + bypass/enabled | visibility, fog, locomotion, interaction state | RESET_COUPLING | Director reset orchestration | HIGH |
| SG-039 | `src/xr/guidance/createVrIntroSequence.js` | calibration; fog complete; silence complete | Intro transitions and onboarding | TIMER_TRIGGER | **MIGRATED** — Scenario owns the three bounded decisions through RuntimeExperience; actor retains the 2 s timer and tutorial execution | HIGH |
| SG-040 | `src/xr/guidance/createVrIntroSequence.js:L92-L93` | panel open, controls detail visited, panel closed | pointer tutorial | SCENARIO_GATE | UI facts → Director | HIGH |
| SG-041 | `src/xr/guidance/createVrIntroSequence.js` | grace/distance sensing; pause/resume and arrival handoffs | sensing/motion/fog remain actor mechanics; narrative edges Scenario-owned | MIGRATED | M1.11 arrival + M1.13 FOLLOW_PAUSE_CHANGED; no remaining narrative decision owner | — |
| SG-042 | `src/xr/guidance/createVrIntroSequence.js:L106-L115` | Monkey canonical + player ring entry + settle timer | free explore | SCENARIO_GATE | Director combines facts | HIGH |
| SG-043 | `src/xr/guidance/createVrIntroSequence.js:L116` | 60 s without discovery | attention + glyph hint armed | TIMER_TRIGGER / NARRATIVE_TRIGGER | Director | HIGH |
| SG-044 | `src/xr/guidance/createVrIntroSequence.js:L117` | reveal elapsed 3 s | returns to free explore | TIMER_TRIGGER | Director | MEDIUM |
| SG-045 | `src/xr/guidance/createVrIntroSequence.js:L121` | first glyph success only in free explore | discovery flag + attention/conversation | NARRATIVE_TRIGGER | scenario event | HIGH |
| SG-046 | `src/xr/furnace/createVrAstroFurnaceProgressionController.js:L24-L32` | required, unique, not disposed shell | material commit and completion | PROGRESSION_COMMIT | remain domain; emit semantic event | HIGH |
| SG-047 | `src/xr/asterion/createVrAsterionProductionController.js:L26-L49` | shells 6/6 + chamber closed + content empty + process ready | `LOCKED→READY`; Create enabled | SCENARIO_GATE | Director capability composed with subsystem facts | HIGH |
| SG-048 | `src/xr/asterion/createVrAsterionProductionController.js:L62-L71` | Create accepted/process reaches 1 | BUILDING→AVAILABLE presentation | PROGRESSION_COMMIT / WORLD_STATE_TRIGGER | production actor emits facts; Director cues | HIGH |
| SG-049 | `src/xr/asterion/createVrAsterionProductionController.js:L74-L105` | AVAILABLE + chamber open + left normal + real hit+squeeze | EARNED + auto-equip | PROGRESSION_COMMIT | domain event; physical validation stays subsystem | HIGH |
| SG-050 | `src/xr/furnace/createVrAstroFurnaceActivateInteraction.js:L200-L245` | mode, closed chamber, content/production request | starts shell extraction or construction | SCENARIO_GATE | Director chooses permitted process kind; technical driver stays | HIGH |
| SG-051 | `src/xr/furnace/createVrAstroFurnaceContentInteraction.js:L90-L258` | active mode/open/valid shell; consumed + process complete | takeover, absorption and material commit | PROGRESSION_COMMIT | subsystem facts → Director event; controller commits | HIGH |
| SG-052 | `src/experienceVr.js:L620-L691`, `L714-L751` | exit, re-entry, request failure | repeated but asymmetric reset orchestration | RESET_COUPLING | lifecycle → Director reset transaction | HIGH |

### Reset coupling decomposition (14 counted couplings)

RC-01 ambient, RC-02 furnace presentation, RC-03 furnace panel, RC-04 furnace option/open/activate/content quartet, RC-05 transient crystals, RC-06 hints, RC-07 reliquary/buttons/portal, RC-08 locomotion/rig, RC-09 glyph orbit/lights/interaction, RC-10 shells/attractor, RC-11 Asterion gyro/sphere/production, RC-12 hand/semantic input, RC-13 guide/Monkey/Intro, RC-14 controllers/rays. Wszystkie występują w `handleSessionEnd` i `enterVr`; failure cleanup pomija część z nich (`src/experienceVr.js:L620-L751`).

## 4. Event chains A → B → C

| ID | Łańcuch i pliki | Połączenie / final effect / przyszłe cięcie |
|---|---|---|
| CHAIN-001 | XR frame calibration (`src/experienceVr.js:L559-L566`) → `beginAfterXrCalibration` → fog start → fog completion → silence → panel tutorial (`createVrIntroSequence.js:L84-L90`) | polling frame + direct call; final rays/Monkey opening; przeciąć po `XR_CALIBRATED`, `INTRO_REVEAL_COMPLETE` |
| CHAIN-002 | Y panel open → controls detail → close (`createVrIntroSequence.js:L92-L93`; player guide getters) → pointer hover → trigger (`L64-L65`) → invitation | cross-subsystem polling + Monkey callbacks; final authored invitation; przeciąć UI facts przez Director |
| CHAIN-003 | invitation GO (`L66`) → FOLLOWING movement/distance polling (`L94-L105`) → threshold dialogue/options (`L67`,`L75`) | callback then polling; final threshold choice; Director owns order, Monkey/locomotion execute |
| CHAIN-004 | threshold CROSS → CROSSING/ENTERING_RING → Monkey reaches canonical + head enters ring → MONKEY_SETTLING → GLYPH_FREE_EXPLORE (`L75`,`L106-L116`) | polling two independent facts; final glyph capability/time window; highest deadlock edge, cut at semantic events |
| CHAIN-005 | free explore 60 s → attention → Monkey press → three-line hint (`L116`,`L69-L74`) | timer + direct Monkey override; final authored hint; Director timer/cue |
| CHAIN-006 | glyph hold complete (`src/experienceVr.js:L485-L497`) → `getNextCrystalTier` → `spawnOne` → `notifyGlyphExploreSuccess` → attention → Monkey press → discovery copy → `beginReliquaryReveal` → portal/reliquary/canvas reveal (`createVrIntroSequence.js:L68-L74`; root `L527-L533`) | direct callback chain plus cross reads; final reliquary availability; cut after GLYPH/CRYSTAL_CREATED and conversation completion |
| CHAIN-007 | crystal inserted (`createVrCrystalCollection.js`) → Activate predicate/root callback (`experienceVr.js:L439-L444`) → active/preview → Release predicate (`L456-L458`) → `commitPage` → `onCommit` (`L417-L425`) | direct callbacks/state reads; final floor, tier, shell field, ambient, audio, Monkey; cut commit fan-out through Director |
| CHAIN-008 | Tier 1 page commit → `isTierComplete(1)` → `syncTierOneWorldState` → `shellSystem.setActive(true)` and hand mode `isUnlocked` polling (`L290`,`L304`) | direct callback + per-frame polling; final shells/Astro; Director owns unlock |
| CHAIN-009 | Astro equipped → squeeze scan → trigger pull → capture-ready → real left hit+squeeze → held/placed (`createVrShellAttractorInteraction.js:L60-L195`) | subsystem-local frame/input chain; only unlock/availability boundary crosses Director; physical chain stays subsystem |
| CHAIN-010 | held valid shell + open active-mode furnace → content takeover/insertion → close → Activate process → content consumed + process COMPLETE → `commitAbsorbedShell` (`createVrAstroFurnaceContentInteraction.js:L90-L258`; activate `L200-L362`) | mutual polling/direct calls; final x/6 and ambient subscriber; cut at INSERTED/PROCESS_COMPLETED/MATERIAL_COMMITTED events |
| CHAIN-011 | sixth material commit → furnace subscriber → production `syncGate` LOCKED→READY (`createVrAsterionProductionController.js:L39-L40`) → panel `UTWÓRZ` → requestCreate → shared process → update polls progress → AVAILABLE (`L47-L100`) | subscribe + callbacks + polling; final Sphere presentation; Director mediates capability/cue, technical process remains furnace |
| CHAIN-012 | AVAILABLE + chamber OPEN + left normal + ray hit+squeeze → claim EARNED → `equipLeftAsterion` (`L74-L106`) → hand mode/equipment → gyro drive → root polls equipped/drive for audio (`experienceVr.js:L594-L601`) | input listener/direct callback/per-frame audio polling; final equipped sphere/platform control/audio; cut EARNED/equipped/drive events |

## 5. Intro P0 state-machine audit

### Graf tekstowy

```text
XR_CALIBRATING
↓ beginAfterXrCalibration()
FOG_REVEAL
↓ fog progress == 1 → WAIT_RUNTIME_AFTER_REVEAL → Scenario
POST_REVEAL_SILENCE
↓ 2 s → WAIT_RUNTIME_AFTER_POST_REVEAL_SILENCE → Scenario
CONTROLLER_ONBOARDING → WAIT_PLAYER_PANEL_OPEN
↓ panel.isOpen()
WAIT_CONTROLS_VIEW
↓ controls/DETAIL
WAIT_PANEL_CLOSE
↓ panel closed
CONTROLLER_ONBOARDING → WAIT_HOVER
↓ Monkey hover
WAIT_TRIGGER
↓ Monkey press + messages
INVITATION
├─ NO → ENDING → session.end
├─ WHERE → INVITATION
└─ GO → FOLLOWING
             ↓ Monkey reaches threshold
           THRESHOLD
           ├─ BEYOND → THRESHOLD
           ├─ RETURN → ENDING → session.end
           └─ CROSS → CROSSING → ENTERING_RING
                         ↓ Monkey canonical
                       MONKEY_SETTLING
                         ↓ monkeySettled AND playerEnteredRing
                       GLYPH_FREE_EXPLORE
                       ├─ 60 s → hint conversation → GLYPH_FREE_EXPLORE
                       └─ first glyph/crystal → discovery conversation
                                                  ↓
                                                RELIQUARY_REVEAL
                                                  ↓ 3 s
                                                GLYPH_FREE_EXPLORE
reset + QA/disabled → BYPASSED
```

### Stany

| State | Entry / exit | Side effects, capabilities, visibility, Monkey, locomotion, timers, external deps | Klasa |
|---|---|---|---|
| XR_CALIBRATING | reset; exits explicit calibration callback | fixtures hidden callback; sectors hidden; rays/Monkey interaction off; locomotion radius ∞; waits renderer XR head fact | C |
| FOG_REVEAL | calibration | Monkey placed at start radius; fog starts; exit progress 1 / fallback 13 s | C |
| POST_REVEAL_SILENCE | reveal complete | actor measures 2 s, emits completion once, then waits for Runtime | C |
| WAIT_RUNTIME_AFTER_POST_REVEAL_SILENCE | silence complete | no actor edge; Scenario effect explicitly begins legacy onboarding | C |
| CONTROLLER_ONBOARDING | begin panel/pointer authored messages | opens message queue; first entry enables Monkey and rays; transient routing state | C |
| WAIT_PLAYER_PANEL_OPEN | opening copy ended | panel prompt; polls Player Guide open | A |
| WAIT_CONTROLS_VIEW | panel open | polls section `controls` + view `DETAIL` | A |
| WAIT_PANEL_CLOSE | controls visited | polls close, begins pointer tutorial | A |
| WAIT_HOVER | pointer copy ended | Monkey dialogue override catches technical hover | C |
| WAIT_TRIGGER | hover | prompt; Monkey press completes tutorial | C |
| INVITATION | tutorial messages | authored choices; WHERE loops, NO ends, GO follows | A |
| FOLLOWING | GO | captures Monkey input; motion/turn/fog; pause/resume message based on player distance; arrival exits | C |
| THRESHOLD | arrival | fog radius 6; authored question/choices; RETURN ends, BEYOND loops, CROSS moves | A |
| CROSSING | CROSS | motion+fog, polls physical ring entry; transitions when Monkey enters ring | C |
| ENTERING_RING | Monkey enters ring | same motion/poll; waits canonical | C |
| MONKEY_SETTLING | Monkey canonical | turn timer (~1 s), player ring fact; locomotion radius clamped on first entry | C |
| GLYPH_FREE_EXPLORE | both settle+entry | glyph capability enabled externally; 60 s timer; discovery callback wins; hint/discovery attention arms Monkey conversation | A (timer/order), technical update mixed |
| RELIQUARY_REVEAL | discovery dialogue ends | direct callback reveals portal/reliquary/canvas for 3 s; then returns | C |
| ENDING | NO/RETURN | authored closing messages, calls session.end | A |
| BYPASSED | reset with QA or intro disabled | fog complete, sectors/ring/stone visible, Monkey enabled, external fixtures reveal | C |

Legenda: **A** czysty scenariusz, **B** techniczne wykonanie (brak samodzielnego stanu B w enum; helpery fog/motion są B), **C** mieszanka. `WAIT_*`, INVITATION, THRESHOLD, ENDING oraz kolejność discovery są A; `pointAtRadius`, `radiusOf`, interpolation, fog shader i message rendering są B; większość entry methods łączy A+B.

## 6. Capability/unlock matrix

| Capability | Current condition / source of truth | Consumers | Lifetime | Scenario? | Recommended future query |
|---|---|---|---|---|---|
| GLYPH_INTERACTION | Intro free explore/bypass + next branch tier available; Intro + progression + live crystals | glyph interaction/lights | temporary + progression | YES | `director.can(CAN_USE_GLYPHS,{branchId})` |
| RELIQUARY_INTERACTION | reliquary reveal state | collection/buttons | temporary/session | YES | `director.can(CAN_USE_RELIQUARY)` |
| ACTIVATE_RELIQUARY | enabled + inserted | Activate button | per crystal | YES | `director.can(CAN_ACTIVATE_RELIQUARY)` |
| RELEASE_RELIQUARY | enabled + active | Release button | per crystal | YES | `director.can(CAN_RELEASE_RELIQUARY)` |
| ASTRO_ATTRACTOR | Tier 1 complete | hand mode/tool/shell attractor | permanent page runtime | YES | `director.can(CAN_EQUIP_ASTRO)` |
| TARGET_SHELLS | field active + right Astro equipped + semantic scan/trigger + target state | shell attractor | transient | partly | Director global capability; local geometry/state remains subsystem |
| USE_FURNACE | active option mode + compatible open/process/content states | furnace interactions | temporary | YES | `director.can(CAN_USE_FURNACE)` |
| BUILD_ASTERION | shells complete + READY + closed + empty + driver ready | panel/production | temporary | YES | `director.can(CAN_BUILD_ASTERION)` |
| CLAIM_ASTERION | AVAILABLE + open + left normal + real hit/squeeze | production | temporary | YES | Director global gate ∧ `production.canClaim(record)` |
| EQUIP_ASTERION | EARNED or QA; panel not modal | hand mode | permanent/QA | YES | `director.can(CAN_EQUIP_ASTERION)` |
| MONKEY_INTERACTION | disabled pre-onboarding; overrides during P0; ordinary ray free | Monkey Guide | state-dependent | YES | `director.can(CAN_TALK_TO_MONKEY)` + interaction arbiter |
| LOCOMOTION/YAW | radius ∞ then ring; yaw locked by panel | locomotion | temporary | YES for intro/modal policy | `director.can(CAN_MOVE/CAN_YAW)` or explicit commands |

## 7. Visibility/reveal ownership

| Object | Owner(s); show/hide/reset/QA | Multiple owners / risk |
|---|---|---|
| Monkey visual | Intro + fog reveal + model | reset shows; fog shader reveals; never hidden post-P0; bypass visible | **MULTIPLE OWNERS**, HIGH |
| Monkey stone | Intro + fog reveal | visible reset/bypass; radial reveal material; survives as fixture | **MULTIPLE**, MEDIUM |
| Glyph ring/nodes/lights | Intro, fog, glyph orbit/lights | ring visible even normal reset but fog-masked; sectors hidden; active/exhausted lights per capability | **MULTIPLE**, HIGH |
| Floor sectors/panels/rings | Intro directly hides/shows top-level branch children; floor activates page/tier; progress survives session | bypass shows all sectors even without commits, while page/ring projection remains truth-derived | **MULTIPLE**, HIGH |
| Portal model | portal display + root/Intro callbacks | normal Intro hides; bypass/reset waiting; discovery reveal 3 s; session restore then Intro may hide | **MULTIPLE**, HIGH |
| Portal canvas | plaque + root | waiting copy at composition/session reset; page preview on Activate; discovery reveal | **MULTIPLE**, HIGH |
| Reliquary | reliquary + Intro/root | reset hidden/interaction off; bypass reveal(0); discovery reveal(3) | **MULTIPLE**, HIGH |
| Activate/Release buttons | companions inherit reliquary + own animation/reset | availability predicates by crystal state; reset in three lifecycle paths | **MULTIPLE**, HIGH |
| Furnace | furnace actor + Intro/root + `?furnaceProcess` | hidden normal Intro; reset/show in bypass; local reset restores model | **MULTIPLE**, HIGH |
| Furnace panel | panel actor; fixture hierarchy | projection visible with furnace; module navigation local; reset on lifecycle | inherited + local, MEDIUM |
| Shell field | shell system + root tier sync | inactive until Tier1; reset then resync preserves unlock; `?p1` activates | **MULTIPLE**, HIGH |
| Astro tool | hand mode/tool | visible only unlocked+equipped; forced unequip if unlock false; reset normal | single technical owner, source gate external |
| Asterion Sphere | production presentation + sphere equipment + hand mode | visible BUILDING/AVAILABLE or equipped; claim transfers same socket; session reset preserves AVAILABLE/EARNED semantics but clears equip | **MULTIPLE LIFECYCLE OWNERS**, HIGH |
| Target halos/rays | each interaction + controller aggregator | shown only current valid hit; reset technical | multiple by design, LOW scenario relevance |

## 8. Narrative and Monkey triggers

### P0 authored narrative

Całe copy znajduje się w `VR_INTRO_COPY` (`src/xr/guidance/createVrIntroSequence.js:L12-L30`): opening (3), panelPrompt, panelDone (3), trigger, seen (2), going, invitation (3 options), where (2), no (2), threshold (4), thresholdOptions (3), beyond (2), returning (3), glyphHint (3), glyphDiscovered. Triggerami są kolejno calibration/reveal timers, Player Guide polling, Monkey hover/press, option selection, follow/threshold/ring facts, 60 s timeout i first glyph success (`L59-L75`, `L84-L121`). Message duration skaluje się liczbą linii zwróconą przez Monkey Guide (`L60-L61`, `L85`).

### Post-P0 generic/progression UI

- Portal waiting copy jest w root `COPY`: „Portal czeka / Osadź kryształ w naczyniu.” (`src/experienceVr.js:L58-L72`), pokazane przy waiting/reset/reveal (`L265-L270`,`L527-L533`).
- Card preview copy pochodzi z `src/content/experienceVrPages.js:L11-L49` i shared portfolio records; Activate wywołuje `portalCanvas.show` (`src/experienceVr.js:L416`).
- Monkey menu/history copy, labels, paging i unlocked-card rendering są w `src/xr/guidance/createVrMonkeyGuide.js` (szczególnie `L1-L38`, `L177-L335`, `L430-L590`). Controller jest bezpośrednim source of truth.
- Player help copy jest w `src/xr/guidance/vrPlayerGuideContent.js:L1-L28`; panel tylko renderuje/nawiguje.

### Contextual hints

`VR_RELIQUARY_HINT_COPY` ma po jednym tekście dla `inserted` i `active`; po 15 s niezmiennej fazy attention + następne naciśnięcie Małpy pokazuje tekst (`src/xr/guidance/createVrReliquaryHints.js:L1-L24`). Zmiana instance/fazy resetuje timer; brak fazy wywołuje pełny reset. Override może konkurować z Intro/Monkey generic override — HIGH.

### Attention/audio/user choice/future hooks

- `monkeyGuide.notifyAttention()` występuje po first discovery, 60 s timeout, reliquary hint oraz każdym card commit (`createVrIntroSequence.js:L116-L121`; `createVrReliquaryHints.js:L21`; `experienceVr.js:L424`). Attention start odpala `monkeyThinking` (`experienceVr.js:L328`).
- Authored choices: invitation i threshold; generic choices: progress/history/back/close w Monkey Guide.
- `setDialogueOverride` jest pojedynczym, nadpisywalnym slotem, wspólnym dla Intro i hints; nie ma kolejki ownerów ani arbitrażu.
- Future hooks: commit attention istnieje bez zaprojektowanej sekwencji; brak authored dialogue Tier1/furnace/Asterion. Audyt nie dopisuje copy.

## 9. Timer audit

| Timer | Plik / setting | Owner; trigger | Reset/interruption | Future owner / deadlock |
|---|---|---|---|---|
| fog reveal | `createVrIntroFogReveal.js:L10-L78`; `intro.introRevealDuration` (13 s fallback in sequence) | fog actor updates progress, sequence polls | restart on Intro reset; dispose after settle; state change gates completion | actor timer + Director awaits event; HIGH if dispose/re-entry |
| post reveal silence | `createVrIntroSequence.js:L47`,`L90`; default 2 s | Intro | reset; only active state counts | Scenario/Director |
| message display | `L46`,`L60-L61`,`L85`; `messageDisplayDuration × lineCount` | Intro queue | reset clears; callback delayed; override may change externally | Director narrative scheduler; HIGH |
| message/question gaps | `L85`; settings messageGap/questionGap (question 2 s) | Intro | reset/state callbacks | Director |
| guide turn/final settle | `L95`,`L114`; default 1 s | Intro movement | reset | subsystem motion emits completion; Director must not own interpolation |
| follow grace/distance | `L97-L101`; `followGraceDistance`, pause/resume distances | Intro distance polling | flags reset; can pause indefinitely | Director policy + motion facts; HIGH deadlock |
| glyph free explore | `L116`; default 60 s | Intro | reset; discovery prevents hint | Scenario/Director; HIGH race |
| reliquary reveal | `L68`,`L117`; hardcoded 3 s and callback argument 3 | Intro + portal/reliquary animation actors | state reset; reveal actors also track duration | Scenario duration, actor animation; duplicated magic value MEDIUM |
| reliquary inactivity hint | `createVrReliquaryHints.js:L6-L24`; default 15 s | hints controller | reset on phase/instance/no insertion/session | Director contextual timer; HIGH override collision |
| furnace option selection | settings `selectionDuration=.48`; option interaction | technical press animation | local reset | subsystem |
| furnace process | activate `L277-L362`; settings exactly 18 s | furnace process driver | reset aborts/audio stop; construction may prepare before timer | subsystem authoritative timer emits completed |
| Asterion materialization | production polls furnace progress (`L87-L100`) | production | BUILDING reset returns READY | subsystem; Director awaits event, HIGH cross-owner |
| ambient quiet gaps | ambient sequencer `L42-L68`, 30 s + finite playback | audio actor | generation cancellation on state/reset | audio subsystem, cue selection by Director |
| shell return/pull/emission pulses | shell subsystem/settings | physical/visual | local resets | subsystem; not scenario |
| gyro lock delay/rebase | gyro/settings | physical control stabilization | local reset | subsystem; not scenario |

## 10. Reset and persistence audit

| State | XR exit/re-entry | Reload | Reset sites / multiplicity | Risk |
|---|---|---|---|---|
| committed portfolio pages/current tier | **survives**; controller has no reset | lost | no controller reset; floor projection also not reset | HIGH: Director must hydrate from controller |
| floor activated panels/tier rings | survives (no `progressFloor.reset`) | lost | QA writes separately | HIGH projection/truth sync |
| furnace absorbed materials | survives; no reset API | lost | dispose only | HIGH: Director hydration |
| Asterion production | LOCKED/READY/EARNED survive; BUILDING aborts→READY; AVAILABLE re-presented | lost | `resetSession` in exit/enter/failure | HIGH |
| crystals | cleared | lost | exit/enter/failure `crystalCollection.reset` | MEDIUM |
| shell local states | cleared then field active resynced from Tier1 | lost | exit/enter; failure resets attractor but **does not call `shellSystem.reset/syncTierOneWorldState`** | HIGH asymmetry |
| Intro | restarts or bypasses every session | lost | exit/enter/failure; reset also owns many actors | HIGH |
| Monkey/Player panels/unread | reset; unread derived from activated pages may reconstruct differently | lost | duplicate playerGuide reset in exit/enter; failure ordering differs | MEDIUM |
| hints/dialogue override | reset | lost | hints then Monkey/Intro; competing resets | HIGH |
| portal/reliquary/buttons | transient cleared/recreated/hidden by Intro | lost | root resets plus Intro callbacks | HIGH multiple owners |
| furnace process/content/chamber/mode/panel | cleared; material commits survive | lost | exit/enter/failure | HIGH transaction boundary |
| hand modes/tool | normal each session; unlock derived again | lost | root + sphere reset | MEDIUM |
| gyro/platform quaternion | reset identity | lost | exit/enter/failure gyro reset | MEDIUM; committed EARNED survives but orientation not |
| ambient | reset on exit/enter; recomputed after session set; failure reset at start only | lost | root + dispose | MEDIUM |

### Lifecycle asymmetries

- `handleSessionEnd` (`src/experienceVr.js:L620-L657`) ma pełny reset, w tym glyph orbit/lights, shell system, rig spawn i `syncTierOneWorldState`.
- `enterVr` (`L659-L713`) niemal kopiuje pełny reset przed requestem; to drugi owner kolejności.
- catch (`L714-L751`) pomija `resetPlayerRigToSpawn`, `glyphOrbit.reset`, `shellSystem.reset`, `syncTierOneWorldState`, `glyphLights.reset`, `glyphInteraction.reset` i `ambientSequencer.reset` (ten był wykonany przed requestem), ale resetuje większość aktorów. To jawna asymetria HIGH.
- `pagehide` (`L756-L784`) głównie dispose, nie synchronizuje/resetuje; reload i tak niszczy runtime. Nie kończy jawnie active XR session w tym handlerze.
- lokalne `reset()` często wywołują kolejne resety/visibility (Intro, hand mode, furnace), dlatego przyszły Director nie może zakładać, że wywołanie jest bez skutków poza actor state.

## 11. QA / bypass audit

| Param/path | Source | Co omija/fałszuje i ręczna synchronizacja | Director risk |
|---|---|---|---|
| `?p1` | root `L128`; shortcut `applyVrProgressionShortcut.js:L4-L18` | bypass Intro; prawdziwie commit Tier1 pages controllerem, aktywuje floor pages/ring i `syncTierOneWorldState`; nie odtwarza commit audio/Monkey/ambient callback (ambient później session sync) | HIGH: batch event vs normal event fan-out |
| `?asterionSphere` (configurable name) | root `L158`,`L305` | bypass Intro; nie zmienia furnace/production; jedynie availability equipment i debug | HIGH: capability overlay nie może udawać EARNED |
| `?furnaceProcess` | root `L127-L129`,`L352-L353` | bypass Intro; furnace reset/visible; nie przyznaje shells | MEDIUM: scene fixture shortcut |
| `?furnace` | root `L128-L129` | tylko bypass Intro/fixtures via bypass callback; brak osobnego progression mutation | MEDIUM: nazwa sugeruje więcej niż kod robi |
| `?debug` | root `L124`,`L221` | diagnostics/settings fallback + Sphere debug; nie zmienia progression poza obserwowalnością | nie liczony jako bypass; zachować adapter diagnostyczny |
| forced public methods | `chooseInvitation`, `chooseThreshold`, `finishBuild`, `claim` są publiczne | test/debug może wywołać fakty bez naturalnego inputu, ale runtime root tego nie robi | przyszłe test harness musi wejść przez jawny event/actor seam |

## 12. `experienceVr.js` — extraction inventory

| Linie / fragment | Klasa | Ocena i EXTRACT LATER |
|---|---|---|
| `L1-L123` imports/copy/audio asset map/DOM | A wiring, z copy progression | imports/DOM/audio bridge pozostają composition; portal copy → Scenario content; mapping dźwięków → audio cue adapter |
| `L124-L129`,`L158` URL flags | B | Director bootstrap/QA adapter |
| `L130-L280` scene hierarchy/assets/actors | A | prawidłowa composition; zachować. Wyjątek `restorePortalWaitingState` (`L265-L270`) jest world cue → adapter |
| `L239-L258` production processDriver/getters | A+C | wiring adapter prawidłowy, ale zestaw prerequisite reads wskazuje przyszły event bridge; nie przenosić geometry |
| `L281-L290` ambient/tier sync | B+D | Director + audio/world adapters |
| `L291-L296` rig reset helper | A/E | pozostawić locomotion/lifecycle actorowi; Director tylko zleca session reset |
| `L297-L308` hand mode predicates | B | Director capability queries; technical equip stays controller |
| `L309-L332` guide creation/audio/ray policy | A+B | audio callback adapter; interaction arbitration zostawić policy subsystemowi; Intro interaction permission → Director |
| `L337-L400` furnace panel/open/activate/content/option wiring | A+B+C | constructors stay composition; mode/process cross-reads → adapter/Director; physical checks stay furnace; audio callbacks → event bridge |
| `L401-L426` crystal creation/commit callback | B+C+D | commit → semantic event bridge/Director; floor/audio/Monkey/world commands remove later from root; grab collision policy stays interaction arbiter |
| `L427-L428` p1 execution | B+C | QA bootstrap adapter + Director synchronization |
| `L429-L462` reliquary buttons/hints | A+B | constructors stay; predicates → Director capability + local actor fact; hints → scenario guidance |
| `L463-L474` next tier/glyph gate | B+C | branch/tier query remains progression; composed availability → Director |
| `L475-L498` glyph callbacks | A+B+D | technical lifecycle audio can be adapter; completion → scenario event, crystal spawn command remains crystal actor |
| `L499-L510` attractor collision priority | A | pozostawić interaction arbiter; unlock comes from Director |
| `L512-L539` Intro callbacks | B+D | Intro fog actor construction stays; all visibility/rays/reveal/session decisions → Scenario/Director; callback bodies → adapters |
| `L541-L610` render loop | A plus polling leaks | update order stays runtime scheduler; `setLeftYawLocked`, audio Sphere polling, glyph exhausted projection → event/capability adapters later |
| `L612-L618` HTML ready state | A | pozostawić shell UI lifecycle |
| `L620-L657` session end | E | consolidate later under lifecycle reset transaction coordinated with Director; local resets remain actors |
| `L659-L713` enter | A+E | XR request remains root; duplicated actor reset → lifecycle adapter; calibration success → Director event |
| `L714-L751` failure | E | future single reset policy with failure profile; do not silently make equal without decision/tests |
| `L754-L784` listeners/dispose | A | composition/lifecycle stays; Director later participates dispose only |

## 13. Cross-subsystem reads

| ID | Consumer | Reads | Why / relevance | Future recommendation |
|---|---|---|---|---|
| XR-01 | ambient sync | portfolio current tier | select ambient | Director projection |
| XR-02 | ambient sync | furnace complete | subthreshold | Director projection |
| XR-03 | ambient sync | production built | subthreshold | Director projection |
| XR-04 | shell field sync | portfolio Tier1 | active world | Director command |
| XR-05 | hand mode | portfolio Tier1 | Astro availability | Director capability |
| XR-06 | hand mode | production EARNED + QA | Sphere availability | Director capability |
| XR-07 | hand mode/root locomotion | Player Guide open | modal equipment/yaw lock | shared modal policy/events |
| XR-08 | Monkey ray policy | hand modes/Sphere equip | ordinary ray available | interaction arbiter |
| XR-09 | furnace open/content/activate | option active mode | gate module actions | Director high-level mode capability; local validity actor |
| XR-10 | production | furnace material completion | LOCKED→READY | semantic MATERIAL_SET_COMPLETED event |
| XR-11 | production | chamber/content/process states | canCreate/update | keep physical/process facts local; Director combines scenario permission |
| XR-12 | furnace panel | material + production + process + content/chamber | read-only projection/actions | view-model adapter/event subscriptions |
| XR-13 | crystal grab | hand modes, Sphere, furnace hits, Monkey, shell hits | priority | interaction arbiter, not Scenario |
| XR-14 | glyph gate | Intro + progression + crystal instances | availability | Director capability; domain query adapter |
| XR-15 | buttons/hints | reliquary enabled + crystal inserted state | action/hint | Director capability/events |
| XR-16 | Monkey Guide | progression activated pages | history/unread/menu | read-model adapter |
| XR-17 | production claim | chamber + hand mode + hit | physical claim | global capability ∧ production local validation |
| XR-18 | root audio | sphere equipped + gyro drive | loop lifecycle | state-change event bridge |

## 14. Direct callback coupling

```text
Progression shortcut commitPage → progressFloor.activatePage/completeTier → syncTierOneWorldState
Crystal collection onPreview → portalCanvas.show
Crystal collection onCommit → progressFloor + shellSystem + ambient + audio + Monkey
Glyph interaction onHold* → VrAudioBridge
Glyph interaction onHoldComplete → crystalCollection.spawnOne → Intro.notifyGlyphExploreSuccess
Intro onOpeningRaysReady → controllers.setRaysEnabled
Intro onProgressionFixturesHidden/onBypassFixturesVisible/onReliquaryReveal → portal/furnace/reliquary/canvas
Intro onEndSession → WebXRSession.end
Reliquary buttons onActivate/onRelease/onReleaseComplete → collection + sibling button reset
Reliquary hints → Monkey attention/dialogue override
Furnace progression subscribe → ambient sync + Asterion production syncGate (+ panel subscriptions internally)
Asterion production request → furnace processDriver.startConstruction
Furnace process onProcessStart/onProcessStop → audio bridge
Asterion claim → handModeController.equipLeftAsterion
Player/Monkey panels open/click/attention → audio bridge
```

Najbardziej migracyjne są callbacki, w których producer zna **konkretny efekt innego subsystemu**. Callbacki czysto techniczne (animation finished, ray input listener, render update) pozostają lokalne. `subscribe` powinien publikować facts; nie powinien sam wybierać narracyjnego efektu.

## 15. Candidate Scenario events

> Inventory semantyczne, nie API. Payload wskazuje minimalny fakt wynikający z obecnego kodu.

| Event | Producer / current equivalent | Payload | Consumers today |
|---|---|---|---|
| XR_CALIBRATED | root after calibration | none / head calibration metadata optional | Intro |
| INTRO_REVEAL_COMPLETE | fog actor/Intro poll | none | Intro silence |
| PLAYER_OPENED_GUIDE | Player Guide polled | none | Intro |
| PLAYER_VIEWED_CONTROLS | Player Guide detail polled | section id unnecessary semantically | Intro |
| PLAYER_CLOSED_GUIDE | Player Guide polled | none | Intro/locomotion/hand mode |
| MONKEY_HOVERED | Monkey Guide override | hand optional | Intro |
| MONKEY_TRIGGERED | Monkey Guide override | hand optional | Intro/generic dialogue |
| INTRO_INVITATION_SELECTED | Monkey options | `choiceId` | Intro |
| FOLLOW_PAUSE_CHANGED | Intro distance policy | `paused` | Monkey message/motion |
| MONKEY_REACHED_THRESHOLD | Intro motion | none | Intro dialogue |
| THRESHOLD_SELECTED | Monkey options | `choiceId` | Intro/session |
| PLAYER_ENTERED_RING | Intro head-radius fact | radius optional | Intro/locomotion |
| MONKEY_SETTLED | Intro motion | none | Intro |
| GLYPH_FREE_EXPLORE_STARTED | Intro | none | glyph capability/timer |
| GLYPH_HINT_TIMEOUT | Intro timer | none | Monkey cue |
| GLYPH_HOLD_STARTED/CANCELLED/RESUMED | glyph interaction | `branchId` | audio |
| CRYSTAL_CREATED | collection spawn after glyph | `branchId,tier,instanceId` | Intro discovery/audio |
| FIRST_CRYSTAL_DISCOVERED | Intro accepts success | none | Monkey/reliquary narrative |
| RELIQUARY_REVEAL_REQUESTED/COMPLETED | Intro/root actors | duration | portal/reliquary/canvas |
| CRYSTAL_INSERTED | collection | instance + branch/tier | audio/hints/buttons |
| CRYSTAL_ACTIVATED | collection | instance/page | portal preview/audio/hints |
| CARD_COMMITTED | progression via collection | page id/glyph/tier | floor/audio/Monkey/world |
| TIER_COMPLETED | progression commit result | tier | floor/shell unlock/audio/ambient |
| ASTRO_UNLOCKED | derived Tier1 transition | none | hand/tool |
| SHELL_PULL_STARTED/CANCELLED/HANDED_OFF | shell attractor | shell id/type | audio |
| SHELL_INSERTED_IN_FURNACE | content actor | shell instance/type | panel/process |
| FURNACE_PROCESS_STARTED | activate actor | process kind | content/audio/panel |
| FURNACE_PROCESS_COMPLETED/ABORTED | activate actor | process kind | content/production/audio |
| SHELL_ABSORBED | material controller | shell type, count | panel/ambient/production |
| SHELL_SET_COMPLETED | material controller | `6/6` | production READY |
| ASTERION_BUILD_REQUESTED | panel/production | none | process driver |
| ASTERION_BUILD_STARTED | production | none | sphere presentation/audio |
| ASTERION_BUILT | production | none | AVAILABLE/panel/ambient |
| ASTERION_CLAIMED/EARNED | production | controller hand optional | hand mode/panel |
| ASTERION_EQUIPPED/UNEQUIPPED | hand mode/sphere | hand | gyro/audio/ray policy |
| ASTERION_DRIVE_STARTED/STOPPED | gyro | none | audio |
| XR_SESSION_ENDING/ENDED/START_FAILED | root | reason optional | all reset actors |

## 16. Candidate Director capabilities

| Capability | Evidence today |
|---|---|
| CAN_USE_GLYPHS | Intro state + next crystal tier (`experienceVr.js:L470-L480`) |
| CAN_USE_RELIQUARY | reveal/interaction enabled |
| CAN_ACTIVATE_RELIQUARY | inserted predicate (`L439`) |
| CAN_RELEASE_RELIQUARY | active predicate (`L456`) |
| CAN_TALK_TO_MONKEY | Intro interaction enabled/override + ray availability |
| CAN_MOVE / CAN_YAW | Intro walk radius and panel yaw lock |
| CAN_EQUIP_ASTRO | Tier1 (`L304`) |
| CAN_SCAN_SHELLS / CAN_TARGET_SHELLS | Astro equipped + shell field/target state |
| CAN_USE_FURNACE | active furnace module and scene availability |
| CAN_OPEN_FURNACE | mode/process/local chamber rules |
| CAN_INSERT_FURNACE_MATERIAL | mode/open + local valid unique shell |
| CAN_START_FURNACE_PROCESS | closed + inserted valid + idle |
| CAN_BUILD_ASTERION | complete/READY/closed/empty/process ready |
| CAN_CLAIM_ASTERION | AVAILABLE/open + global permission; hit/hand remain local |
| CAN_EQUIP_ASTERION | EARNED or QA overlay, not AVAILABLE |
| CAN_CONTROL_PLATFORM | Sphere equipped; physical gyro rules local |

## 17. Migration boundaries

| Etap | Files touched later / moves | Stays | Risk / tests / prerequisite |
|---|---|---|---|
| **M0 foundation — COMPLETE** | Scenario/Director + event/capability/milestone/effect vocabulary | foundation retained | Complete; followed by bounded M1.1 integration |
| M1 P0 | Intro, Monkey/player/fog/locomotion/root callbacks | fog shader, motion interpolation, hit/UI rendering | **HIGH (highest)**; full state graph, all choices, no-action, re-entry, timer races; needs M0 |
| M2 glyph/crystal/reliquary | root glyph gates/callbacks, hints, collection bridges/buttons | branch/tier correctness, physical grab/insertion/consume | HIGH; first-before/after-60s, invalid insertion, activate/release; M1 stable |
| M3 portfolio tiers | progression event adapter, floor/ambient/card history | `VrProgressionController` commits and floor renderer | HIGH; all 18 order/branch/tier, re-entry hydration, p1 parity; M2 |
| M4 Tier1 Astro/shell | shell activation and hand capability | scan geometry, pull/handoff physics/state | MEDIUM-HIGH; unlock/revoke/reset/multihand; M3 |
| M5 Furnace | option/open/content/activate bridges | material validity, chamber geometry, 18 s process/animations | HIGH; duplicates/unknown/retrieval/abort/commit conjunction; M4 |
| M6 Asterion production/equipment | READY/build/available/earned cues/capabilities | physical claim ray/chamber, presentation animation, hand attachment, gyro | HIGH; reset during build, available re-entry, QA availability; M5 |
| M7 audio/guidance | root audio mapping, ambient selection, Monkey attention arbitration, timers | audio playback/fail-soft/timer implementation, UI rendering | MEDIUM-HIGH; cue cardinality/cancellation and silent failures; M1-M6 events |
| M8 cleanup | remove old scenario predicates/callback fan-out/duplicate lifecycle orchestration | actor-local validation/states | HIGH; SG checklist zero dual ownership; all previous |

Zweryfikowana kolejność pozostaje zgodna z preferowaną. M1 jest najbardziej ryzykowny z powodu 19-state mixed machine i wielofaktowego deadlock edge. M7 nie powinien wyprzedzić domain events, choć attention override arbitration można przygotować w M1/M2.

## 18. Do-not-move list

- `VrProgressionController`: branch/tier/page ordering, previous-page prerequisite, idempotent `commitPage` — domain invariant, nie decyzja narracyjna (`createVrProgressionController.js:L9-L54`).
- Crystal collection: ray/grab ownership, physical insertion validity/feedback, consuming/rejecting animation, instance lifecycle — actor facts; Director dostaje tylko semantyczne zdarzenia.
- Reliquary/button: hit testing, press animation, local `inserted→active` technical operation after permission.
- Progress floor: panel/ring geometry, material/animation lifecycle and rendering projection.
- Shell system/attractor: analytic cone test, orbit/return/pull/capture physics, real-hit handoff, held/placed state correctness.
- Furnace material controller: exact required ids, uniqueness, `canAbsorbShell`, atomic commit.
- Furnace content: chamber volume, snap target, unknown/duplicate validation, physical takeover/retrieval, conjunction consumed+process complete before commit.
- Furnace open/activate/option: raycasts, animation mixer, PRESSING/SPINUP/STEADY/EXTRACTION/COOLDOWN mechanics, 18 s authoritative driver and material effects. Director zna tylko `PROCESS_COMPLETED`.
- Asterion production: chamber-cylinder physical claim validation, presentation materialization/levitation and same-socket transfer; Director controls permission/order, nie geometrię.
- Hand mode: actual attach/detach, per-hand ray visibility and semantic input edge detection.
- Gyro: quaternion math, acceleration/braking/lock/rebase and floor transform drive.
- Monkey/Player panels: canvas layout, paging, hover, raycast, navigation input; scenario supplies content/cues/capability.
- Audio bridge/sequencer: WebAudio lifecycle, fades, cancellation generation, fail-soft behavior; Director selects cue/state only.
- Locomotion: tangent-plane movement, boundary math, calibration and transform ownership.

Ta granica zapobiega God Directorowi: Director odpowiada „czy/kiedy/co dalej”, actor odpowiada „czy technicznie poprawne i jak wykonać”.

## 19. High-risk regression map

| Obszar | Risk | Dlaczego / evidence |
|---|---|---|
| P0 deadlock | HIGH | `monkeySettled && playerEnteredRing`, panel polling, hover/press overrides, distance pause (`createVrIntroSequence.js:L92-L116`) |
| dialogue override collision | HIGH | Intro i hints zapisują jeden slot bez ownership queue |
| visibility multiple ownership | HIGH | portal/reliquary/furnace/floor/Sphere; root + Intro + actor reset |
| lifecycle reset mismatch | HIGH | exit/enter/failure różnią się (`experienceVr.js:L620-L751`) |
| persisted domain vs restarted scenario | HIGH | committed cards/materials/EARNED przeżywają, Intro zawsze restartuje |
| glyph unlock predicate | HIGH | Intro + domain + live transient instances (`L463-L474`) |
| card commit fan-out | HIGH | sześć efektów w jednym callbacku (`L417-L425`) |
| production/furnace cycle | HIGH | subscriptions, reciprocal getters, process polling and abort behavior |
| QA synchronization | HIGH | p1 commits truth; sphere only overlays capability; all bypass Intro |
| audio progression | MEDIUM-HIGH | ambient derives three owners; Sphere audio polled per frame |
| runtime state queried by guidance | HIGH | hints poll crystal; Intro polls Player Guide; Monkey polls progression |
| interaction priority | MEDIUM | many direct hit reads; should not be mistaken for authored scenario |
| floor projection re-entry | MEDIUM | survives because object not reset, not because explicit rehydrate |
| optional audio failure | LOW gameplay | fire-and-forget by contract; migration must preserve non-blocking behavior |

## 20. Migration checklist

- [x] M0 foundation — immutable declarative Scenario, independent Director, validation, monotonic milestones, distinct session/hard reset contracts and symbolic effects are implemented and tested.
- [x] M1.1 Live Bootstrap Slice — SG-032 migrated.
- [x] M1.2 Intro Reveal Completion Handoff — reveal-complete edge transferred.
- [x] M1.3 Post-Reveal Silence Completion Handoff — SG-039 migrated; actor timer retained.
- [ ] M1 full P0 migration — **IN PROGRESS**; all other ownership remains unchanged.

Scenario + Director are authoritative only for `XR_CALIBRATED → BEGIN_INTRO_REVEAL`, `INTRO_REVEAL_COMPLETE → BEGIN_POST_REVEAL_SILENCE`, and `POST_REVEAL_SILENCE_COMPLETE → BEGIN_CONTROLLER_ONBOARDING`. `RuntimeExperience` remains the symbolic-effect execution boundary connected to `experienceVr.js`; SG-032 and SG-039 are **MIGRATED**. SG-040 and later groups remain unmigrated, the Y-panel facts and tutorial remain actor-owned, and RC-01…RC-14 are not consolidated. This does not imply full P0 or M1 completion or full central Scenario ownership.

Dla każdego elementu ustawić dokładnie jeden status: **MIGRATED / RETAINED / REMOVED**.

- [ ] SG-001…SG-004 — QA bootstrap/bypasses mają jawny status i parity test.
- [ ] SG-005…SG-007 — ambient i Tier1 world fan-out.
- [ ] SG-008…SG-018 — wszystkie capability/interaction gates; lokalne arbitraże jawnie RETAINED.
- [ ] SG-019…SG-027 — crystal/reliquary/glyph commit i cue chain.
- [ ] SG-028…SG-045 — pełny Intro, visibility, timers i discovery.
- [ ] SG-046…SG-051 — material, process, build i claim boundaries.
- [ ] SG-052 / RC-01…RC-14 — atomowy lifecycle/reset/hydration contract.
- [ ] CHAIN-001…CHAIN-012 mają test zachowania przed usunięciem direct edge.
- [ ] Każdy event z §15 ma potwierdzonego producera i aktualnego konsumenta.
- [ ] Każda capability z §16 ma jedno source of truth i brak dual-write.
- [ ] Intro copy/choice/timer parity w PL i EN.
- [ ] Pierwszy kryształ przed i po 60 s nie dubluje hint/discovery.
- [ ] Reliquary 15 s hint nie nadpisuje authored dialogue.
- [ ] Re-entry po partial/full tier, partial/6-of-6 furnace, BUILDING/AVAILABLE/EARNED.
- [ ] `?p1`, `?asterionSphere`, `?furnaceProcess`, `?furnace` zachowują dokładną obecną semantykę.
- [ ] Audio pozostaje optional, fail-soft i nigdy nie blokuje progression.
- [ ] Do-not-move invariants z §18 pozostają u actorów.
- [ ] Po M8 root zawiera composition/scheduler/lifecycle wiring, nie decyzje A→B→C.

## 21. Audit completeness appendix

Sprawdzenie wykonano przez odczyt plików, wyszukiwanie semantyczne (`if/state/get*/can*/is*/visible/reset/subscribe/on*`, URL params, timers) oraz śledzenie importów od `src/experienceVr.js`. Lista poniżej obejmuje każdy JS w `src/xr` oraz dodatkowe sources konfiguracji/content/composition.

### DIRECTLY RELEVANT

- `src/experienceVr.js`
- `src/config/experienceVrSettings.js`
- `src/content/experienceVrPages.js`
- `src/xr/createVrCrystalCollection.js`
- `src/xr/createVrCrystalReliquary.js`
- `src/xr/createVrGlyphInteraction.js`
- `src/xr/createVrLocomotion.js`
- `src/xr/createVrPortalDisplay.js`
- `src/xr/createVrReliquaryActivateButton.js`
- `src/xr/createVrReliquaryReleaseButton.js`
- `src/xr/floor/createVrProgressFloor.js`
- `src/xr/progression/applyVrProgressionShortcut.js`
- `src/xr/progression/createVrProgressionController.js`
- `src/xr/guidance/createVrIntroFogReveal.js`
- `src/xr/guidance/createVrIntroSequence.js`
- `src/xr/guidance/createVrMonkeyGuide.js`
- `src/xr/guidance/createVrPlayerGuidePanel.js`
- `src/xr/guidance/createVrReliquaryHints.js`
- `src/xr/guidance/vrPlayerGuideContent.js`
- `src/xr/input/createVrHandModeController.js`
- `src/xr/input/createVrSemanticInput.js`
- `src/xr/shells/createVrShellAttractorInteraction.js`
- `src/xr/shells/createVrShellSystem.js`
- `src/xr/tools/createVrAttractorTool.js`
- `src/xr/furnace/createVrAstroFurnace.js`
- `src/xr/furnace/createVrAstroFurnaceActivateInteraction.js`
- `src/xr/furnace/createVrAstroFurnaceContentInteraction.js`
- `src/xr/furnace/createVrAstroFurnaceOpenInteraction.js`
- `src/xr/furnace/createVrAstroFurnaceOptionInteraction.js`
- `src/xr/furnace/createVrAstroFurnacePanel.js`
- `src/xr/furnace/createVrAstroFurnaceProcessSource.js`
- `src/xr/furnace/createVrAstroFurnaceProgressionController.js`
- `src/xr/asterion/createVrAsterionGyroInteraction.js`
- `src/xr/asterion/createVrAsterionProductionController.js`
- `src/xr/asterion/createVrAsterionSphere.js`
- `src/xr/audio/createVrAmbientSequencer.js`
- `src/xr/audio/createVrAudioBridge.js`

### INDIRECTLY RELEVANT

- `src/xr/createVrControllers.js`
- `src/xr/createVrGlyphLights.js`
- `src/xr/createVrGlyphOrbit.js`
- `src/xr/createVrSpatialPlaque.js`
- `src/xr/createVrTargetHalo.js`
- `src/xr/calibration/calibrateXrHeadToPlatform.js`
- `src/xr/getXrHeadWorldPosition.js`
- `src/xr/playerRigOrientation.js`
- `src/xr/tools/createVrAttractorPanelSystem.js`
- `src/xr/tools/createVrAttractorScanCone.js`
- `src/xr/tools/vrAttractorShellGlyphs.js`
- `src/xr/furnace/vrAstroFurnaceChamberCylinder.js`
- `src/xr/furnace/vrFurnaceTelemetry.js`
- `src/xr/furnace/asterionSphereWireframe.js`
- `src/xr/furnace/drawVrFurnaceFrame.js`
- `src/xr/furnace/drawVrMaterialCard.js`
- `src/xr/asterion/asterionGyroMath.js`
- `src/xr/protoAstro/protoAstroRegistry.js`
- `src/xr/protoAstro/resolveVrPageProtoAstro.js`

### CHECKED — NO SCENARIO LOGIC FOUND

- `src/xr/applyWorldTransform.js`
- `src/xr/createVrGlyphPlaque.js`
- `src/xr/createVrPlaqueComposition.js`
- `src/xr/resolveVrGlyphPlaqueAsset.js`
- `src/xr/furnace/asterionShellPatchData.js` (offline/exported geometry data only)
- `src/xr/guidance/filterControllerSvg.js`
- `src/xr/visuals/createObjectWireframeData.js`
- `src/xr/vrCapability.js` (browser capability detection, not gameplay capability)

### Audytowane dokumenty kanoniczne

1. `PROJECT_ENTRY.md`
2. `docs/current/maps/PROJECT_INDEX.md`
3. `docs/current/concept/EXPERIENCE_VR_NARRATIVE_PROGRESSION_BASELINE.md`
4. `docs/current/technical/VR_RUNTIME_MODEL.md`
5. `docs/current/handoffs/EXPERIENCE_VR_HANDOFF.md`
6. `docs/current/maps/DEPENDENCY_MAP.md`
7. `docs/current/maps/DOCUMENTATION_MAP.md`
8. `docs/current/decisions/DECISION_LOG.md`

**Odpowiedź audytu:** dzisiejszy „scenariusz” znajduje się przede wszystkim w `VrIntroSequence` i callbackach/predykatach/resetach `experienceVr.js`, a po P0 jest niejawnie kodowany przez domain controllers, wzajemne state reads, direct callbacks, visibility/audio fan-out i QA bootstrap. Centralnego Scenario/Directora brak.
