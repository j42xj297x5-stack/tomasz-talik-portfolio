# EXPERIENCE VR — FULL SCENARIO / DIRECTOR / ACTORS AUDIT

## 1. Status audytu

- **Data:** 2026-08-16.
- **Audytowany HEAD:** `e5f9d8ef8910e99bb99fe128501e4a528ae54460` (stan przed dodaniem tego dokumentu).
- **Tryb:** audit + docs; kod produkcyjny i testy pozostawiono bez zmian.
- **Zakres:** pełny aktywny graph Experience VR (`1.10–3.80 → 100.10`), derived Spine, Director, RuntimeExperience, reconstruction/hydration, aktorzy, composition root, QA shortcuts, ambient oraz istniejące systemy Shell/Furnace/Astro/Asterion po granicy authored story.
- **Źródła normatywne:** `docs/current/maps/PROJECT_INDEX.md`, `docs/current/maps/DOCUMENTATION_MAP.md`, `docs/current/technical/VR_SCENARIO_DIRECTOR_MODEL.md`, `docs/current/handoffs/EXPERIENCE_VR_HANDOFF.md`.
- **Źródła wykonawcze:** `src/experienceVr.js`, całe `src/xr/progression/`, powiązane aktywne moduły `src/xr/{guidance,floor,shells,furnace,tools,asterion}`, właściciele Monkey/Portal/Reliquary/crystals/locomotion oraz testy `tests/vr-*` i `tests/runtime-experience.test.mjs`.
- **Stan zastany podczas audytu:** wiersz Scenario w `PROJECT_INDEX.md` twierdził, że hydration, arbitrary start i reconstruction-backed checkpoints są „NOT IMPLEMENTED”, podczas gdy canonical model, handoff, kod i testy pokazywały implementację P1/P2 oraz `RuntimeExperience.activatePoint()`. Późniejsza synchronizacja dokumentacji poprawiła indeks zgodnie z dowodami audytu.

## 2. Executive summary

1. Repo posiada jeden authored graph Scenario, a kolejność Spine jest z niego wyprowadzana, nie utrzymywana jako drugi ręczny array.
2. `ExperienceDirector` jest jedynym technicznym właścicielem `currentPointId` w canonical runtime.
3. `RuntimeExperience` prawidłowo łączy semantic event z Directorem i wykonuje symboliczne effects oraz zapewnia lifecycle direct activation.
4. Reconstruction jest deklaratywnym, exclusive `stateAt(X)` i nie replayuje eventów ani animacji.
5. Production hydration działa dla stabilnych faktów wymaganych przez P1 (`2.10`) i P2 (`3.10`), z delegacją do ownerów.
6. Intro, first-ring bridge i post-ring `3.10–3.40` mają canonical semantic completion events.
7. Przejścia `3.50–3.80` są wpisane do Scenario, a Astro production actor emituje poprawne request/produced/claimed events.
8. Architektura nie spełnia jednak jeszcze w pełni docelowego łańcucha dla całego działającego Experience VR.
9. Najważniejsze naruszenie wewnątrz authored zakresu to effects rozpoczynające następny beat nadal zapisane na transition poprzednika (`1.40–2.30`), zamiast jako `entryEffects` target pointu.
10. `createVrIntroSequence` pozostaje dużym lokalnym aktorem-state-machine, który zna dramaturgiczne fazy wielu Scenario points; Scenario i aktor współposiadają tę samą sekwencję.
11. `experienceVr.js` nadal wykonuje domain mutation i dramaturgiczny fan-out (crystal creation, Astro claim equip/shell enable, QA bypasses, baseline history oraz bezpośrednie reveal/presentation mutations).
12. Późniejsze Shell → Furnace → Asterion mechaniki istnieją i działają lokalnie, lecz nie są authored Scenario; ich event vocabulary/capabilities są w dużej części martwym szkieletem.
13. Persistent truth dla shells, furnace process, Astro production i Asterion nie ma canonical settledConsequences ani hydration.
14. `3.50–3.80` także nie deklarują stable consequences, więc direct activation do tych punktów nie może odtworzyć świata zgodnego z naturalnym dojściem.
15. Aktywne P0/P1/P2 korzystają z canonical lifecycle, ale osobne query aliases (`?p1`, `?furnace`, `?furnaceProcess`, `?asterionSphere`) nadal składają ręczny świat i omijają Scenario gates.
16. Ambient jest derived synchronization z kilku domain owners, lecz w composition root i bez jawnego modelu zależności.
17. Najmniejszy następny seam to przeniesienie predecessor-start effects na `entryEffects` targetów, po jednym spójnym odcinku, zaczynając od Intro, bez zmiany gameplay actorów.
18. Dopiero później należy rozdzielić Intro orchestration, domknąć stable state/hydration `3.40–3.80`, a następnie authorować Shell/Furnace/Asterion jako małe, osobne seams.

## 3. Canonical theatrical architecture

Aktualna dokumentacja normatywnie definiuje:

```text
CANONICAL SPINE
  → SCENARIO
    → DIRECTOR
      → RUNTIME EXPERIENCE
        → ACTORS / DOMAIN OWNERS
```

| Warstwa | Jedyny ownership | Nie może posiadać |
| --- | --- | --- |
| Spine | kolejność mainline wyprowadzona z authored edges | effects, runtime state, Three.js |
| Scenario | points, transitions, target entry, settled consequences, capabilities i warunki | wywołań actorów, Three.js, prywatnego actor state |
| Director | `currentPoint`, legalność transition, exactly-once entry, milestones | gameplay, hydration, Three.js, alternatywnego graphu, domain truth |
| RuntimeExperience | dispatch effects oraz lifecycle `baseline → stateAt → hydrate → synchronize → Director → entry` | kolejności story, domain truth, dramaturgicznych decyzji |
| Actor/domain owner | commands, własny persistent/transient state, completion events | wyboru następnego pointu i wiedzy o całym Spine |
| Composition root | construction, DI, wiring, adapters, app lifecycle | drugiego scenariusza, checkpoint history, domain rules, dramaturgicznego fan-out |

## 4. Current architecture

```text
vrExperienceScenario (graph + effects + partial consequences)
        │ derives
        ▼
scenarioSpineNavigation ───────► ExperienceDirector.currentPointId
                                         │ accepted event/change
                                         ▼
                               RuntimeExperience effect map
                                         │
               ┌─────────────────────────┴─────────────────────┐
               ▼                                               ▼
      canonical-ish actors                            experienceVr.js
 IntroSequence / FirstRingFlow /                 direct mutation, QA gates,
 PostRing / FurnaceIntro / Astro                 baseline orchestration, ambient
               │                                               │
               └──────── semantic events ──────────────────────┘

Parallel active local progression beyond authored 3.80:
ShellSystem/Attractor → FurnaceContent/Process → FurnaceProgression
→ AsterionProduction/Sphere/Gyro; no Scenario points/transitions.

Direct checkpoint:
P0/P1/P2 → RuntimeExperience.activatePoint
→ baseline → stateAt → owner hydration → ambient sync → new Director → target entry

Legacy query path:
?p1/?furnace/?furnaceProcess/?asterionSphere
→ local booleans/manual mutations → bypass canonical gates/stateAt.
```

W rezultacie istnieje canonical spine i Director, lecz composition root oraz część actorów nadal stanowią równoległą warstwę orchestration.

## 5. Canonical Spine audit

Kod wyprowadza następującą kolejność z `canonicalMainline.target`:

```text
1.10 → 1.20 → 1.30 → 1.40 → 1.50 → 1.60 → 1.70 → 1.80
→ 1.100 → 1.110 → 1.120 → 1.130 → 2.10 → 2.20 → 2.30
→ 2.40 → 3.10 → 3.20 → 3.30 → 3.40 → 3.50 → 3.60 → 3.70
→ 3.80 → 100.10
```

**LATER RESOLUTION:** w chwili audytu canonical opis i implementacja różniły się w klasyfikacji terminala. Późniejsza wiążąca decyzja Wizjonera rozstrzyga, że `100.10` jest pełnoprawnym canonical terminalem authored mainline i fabuły: normalny flow po `3.80` oraz wcześniejsze jawne drogi wyjścia zbiegają się w tym punkcie. Zakaz reconstruction/start terminala pozostaje dozwolonym ograniczeniem technicznym.

| Zakres | Status | Uzasadnienie |
| --- | --- | --- |
| Derived order | CANONICAL | Jedyna kolejność jest authored w graph edges i walidowana przez `deriveScenarioSpine`. |
| `1.10–1.30` | CANONICAL | Target entries rozpoczynają reveal i silence. |
| `1.40–2.30` | PARTIAL | Wiele rozpoczęć target beatów należy do effects transition poprzednika. |
| `2.40–3.40` | CANONICAL | Completion prowadzi do targetu, a rozpoczęcie kolejnego beatu jest w target entry (brak entry w `2.40` jest zamierzonym wait). |
| `3.50–3.80` | PARTIAL | Canonical points/events istnieją, ale brak stable consequences/hydration, a gates i post-claim fan-out są lokalne. |
| Po `3.80` | LEGACY | Działające Shell/Furnace/Asterion domain flows nie mają authored points. |
| `100.10` | CANONICAL | Canonical terminal authored mainline i fabuły; zbiega normalny flow po `3.80` oraz wcześniejsze jawne drogi wyjścia. Niedozwolony reconstruction/checkpoint start. |

## 6. Scenario point matrix

Status używa wyłącznie `CANONICAL`, `PARTIAL`, `LEGACY`, `BLOCKED`.

| POINT | PURPOSE | ENTRY | COMPLETION | TRANSITION | ACTOR | STATUS | NOTES / LEGACY DEPENDENCY |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1.10 | wait XR calibration | none | `XR_CALIBRATED` | COMPLETE → 1.20 | XR calibration adapter | CANONICAL | Calibration is semantic input. |
| 1.20 | intro fog reveal | `BEGIN_INTRO_REVEAL` | `INTRO_REVEAL_COMPLETE` | → 1.30 | Intro/Fog | CANONICAL | Entry-owned. |
| 1.30 | post-reveal silence | `BEGIN_POST_REVEAL_SILENCE` | `POST_REVEAL_SILENCE_COMPLETE` | → 1.40 | Intro | CANONICAL | Entry-owned. |
| 1.40 | controller onboarding | `BEGIN_CONTROLLER_ONBOARDING` | `PLAYER_OPENED_GUIDE` | → 1.50 plus `CONTINUE_*` | Intro/PlayerGuide | PARTIAL | Transition starts target continuation. |
| 1.50 | view controls | predecessor continuation | `PLAYER_VIEWED_CONTROLS` | → 1.60 plus `CONTINUE_*` | Intro/PlayerGuide | PARTIAL | Missing target entry. |
| 1.60 | close guide | predecessor continuation | `PLAYER_CLOSED_GUIDE` | → 1.70 plus `CONTINUE_*` | Intro/PlayerGuide | PARTIAL | Missing target entry. |
| 1.70 | hover Monkey | predecessor continuation | `MONKEY_HOVERED` | → 1.80 plus `CONTINUE_*` | Intro/MonkeyGuide | PARTIAL | Missing target entry. |
| 1.80 | trigger Monkey | predecessor continuation | `MONKEY_TRIGGERED` | → 1.100 plus `CONTINUE_*` | Intro/MonkeyGuide | PARTIAL | Missing target entry. |
| 1.100 | invitation choice | predecessor continuation | choice 1/2/3 | COMPLETE/STAY/EXPLICIT | Intro/MonkeyGuide | PARTIAL | Choice-local branch is valid, but continuation is transition-owned; choice 3 exits. |
| 1.110 | follow Monkey | predecessor `CONTINUE_INTRO_INVITATION` | `MONKEY_REACHED_THRESHOLD` | → 1.120 plus `PRESENT_THRESHOLD_CHOICE`; pause STAY | Intro/Monkey | PARTIAL | Start-follow and target presentation remain predecessor-driven. |
| 1.120 | threshold choice | predecessor presentation | `THRESHOLD_SELECTED` | COMPLETE/STAY/EXPLICIT plus continuation | Intro/MonkeyGuide | PARTIAL | No target entry; choice 3 exits. |
| 1.130 | crossing join | predecessor continuation | `PLAYER_ENTERED_RING` + `MONKEY_SETTLED` | conditional → 2.10 plus `BEGIN_GLYPH_FREE_EXPLORE` | Intro/Monkey/Locomotion | PARTIAL | Canonical join, but begins target beat on predecessor transition. |
| 2.10 | glyph free explore / first crystal | predecessor `BEGIN_GLYPH_FREE_EXPLORE` | `FIRST_CRYSTAL_DISCOVERED` | → 2.20 plus `REVEAL_RELIQUARY`; hint STAY | Intro/Glyph/Crystal | PARTIAL | Entry absent; glyph handler directly spawns crystal then reports event. |
| 2.20 | conscious Monkey/reliquary reveal | predecessor reveal setup | `RELIQUARY_REVEAL_COMPLETED` | → 2.30 plus `COMPLETE_RELIQUARY_REVEAL`; trigger STAY begins reveal | Intro/Monkey/Reliquary/Portal | PARTIAL | Multi-owner reveal remains Intro callback fan-out; next state finalized on transition. |
| 2.30 | collect/commit five Tier-1 cards | predecessor completion | `FIRST_RING_COMPLETED` | → 2.40 plus presentation/audio; local STAY preview/commit/hint | Progression/Crystals/Floor/Portal/FirstRing | PARTIAL | Correct persistent 5/5 owner, but one event fans out and next presentation begins on predecessor. |
| 2.40 | wait first-ring presentation | none | `FIRST_RING_PRESENTATION_COMPLETED` | → 3.10 | FirstRingFlow | CANONICAL | Target wait corresponds to already-started presentation; still coupled to prior transition. |
| 3.10 | shell-field presentation / glyph elevation | `REVEAL_SHELL_FIELD_PRESENTATION`, `ELEVATE_MAIN_GLYPHS` | `POST_RING_WORLD_PRESENTATION_COMPLETED` | → 3.20 | PostRingPresentation | CANONICAL | Target-owned and hydrated consequence exists for later points. |
| 3.20 | observation window | `BEGIN_OBSERVATION_WINDOW` | `OBSERVATION_WINDOW_COMPLETED` | → 3.30 | ObservationWindow | CANONICAL | Timer is transient. |
| 3.30 | Monkey attention/dialogue | `BEGIN_MONKEY_ATTENTION` | `POST_RING_MONKEY_DIALOGUE_COMPLETED` | → 3.40 | PostRingMonkeyDialogue/MonkeyGuide | CANONICAL | Actor reports semantic completion. |
| 3.40 | Furnace intro/reveal | `BEGIN_FURNACE_INTRO` | `FURNACE_INTRO_COMPLETED` | → 3.50 | FurnaceIntro/MonkeyGuide/Furnace | PARTIAL | Actor directly invokes injected `revealFurnace`; no settled Furnace consequence. |
| 3.50 | Furnace ready / production request | none | `ASTRO_ATTRACTOR_PRODUCTION_REQUESTED` | → 3.60 | Furnace panel/AstroProduction | PARTIAL | Panel uses literal `currentPointId === '3.50'`, an actor point-ID dependency. |
| 3.60 | construct Astro | production already started by request actor | `ASTRO_ATTRACTOR_PRODUCED` | → 3.70 | AstroProduction/Furnace process | PARTIAL | Target lacks entry; actor starts gameplay before Director moves. |
| 3.70 | physical Astro available | local production state | `ASTRO_ATTRACTOR_CLAIMED` | → 3.80 | AstroProduction | PARTIAL | No stable AVAILABLE consequence/hydration. |
| 3.80 | Astro earned, shell capability boundary | claim actor hides/removes/equips locally | none | authored edge exists, no transition | Astro tool/Shell system | PARTIAL | Director grants capabilities, but composition root manually enables shells/equips; no earned consequence. |
| 100.10 | canonical story terminal | none | none | terminal | XR session | CANONICAL | Normal flow after 3.80 and earlier explicit exit routes converge here; exit execution is actor-local and direct reconstruction/start remains forbidden. |

### Rzeczywiste główne flows

```text
XR_CALIBRATED → Director 1.10→1.20 → target entry BEGIN_INTRO_REVEAL
→ Intro.beginIntroReveal → INTRO_REVEAL_COMPLETE → Director ...
```

To jest canonical.

```text
PLAYER_CLOSED_GUIDE → Director 1.60→1.70
→ predecessor effect CONTINUE_CONTROLLER_ONBOARDING
→ Intro actor selects its next internal state → MONKEY_HOVERED
```

Odchylenie: target `1.70` nie posiada commandu entry; aktor interpretuje lokalną dramaturgię.

```text
FIRST_RING_COMPLETED → Director 2.30→2.40
→ transition effects: FirstRingFlow.beginPresentation + audio
→ actor completion FIRST_RING_PRESENTATION_COMPLETED
→ Director 2.40→3.10 → target entry → PostRingPresentation
```

Odchylenie: start beatu `2.40` leży na transition `2.30`.

```text
ASTRO_ATTRACTOR_PRODUCTION_REQUESTED (actor has already started Furnace process)
→ Director 3.50→3.60 → no target entry
→ actor observes local process → ASTRO_ATTRACTOR_PRODUCED
→ Director 3.60→3.70 → actor local AVAILABLE
→ actor claim → ASTRO_ATTRACTOR_CLAIMED
→ Director 3.70→3.80 → composition-root shell enable + equip
```

Odchylenia: command precedes transition; no Scenario entry commands; post-claim effects bypass Runtime effect dispatch.

## 7. stateAt / settledConsequences matrix

`stateAt(X)` folds top-level consequences of points strictly before X; later top-level owner section replaces earlier one. Values are validated as declarative and deeply frozen.

| POINT | STABLE CONSEQUENCE AFTER POINT | DECLARED? | HYDRATED? | OWNER | GAP |
| --- | --- | --- | --- | --- | --- |
| 1.10 | calibration fact only | no world fact | n/a | Director milestone | Appropriate unless calibration must persist across direct starts. |
| 1.20 | revealed intro/fog cleared/fixtures visible/guide disabled | yes | yes | Intro | Consequence unusually declared on beat whose completion creates it; correct exclusive fold. |
| 1.30 | silence completed | no | n/a | Intro transient | No stable world delta expected. |
| 1.40 | onboarding started | no | no | Intro/Guide | Presentation transient. |
| 1.50 | guide open/controls view | no | no | PlayerGuide | Presentation transient. |
| 1.60 | controls viewed/guide closing | no | no | Guide/Director milestone | Milestone not reconstructed; direct starts rely only on world facts. |
| 1.70 | pointer tutorial | no | no | Intro | Transient. |
| 1.80 | Monkey triggered | no | no | Intro/MonkeyGuide | Transient. |
| 1.100 | invitation choice | no | no | Intro | Branch outcome is not reconstructed because only later canonical choice continues. |
| 1.110 | following | no | no | Intro/Monkey | Motion is transient. |
| 1.120 | threshold dialogue | no | no | Intro | Transient. |
| 1.130 | Monkey final stone, Intro free-explore, fog/fixtures/guide, glyph-ring boundary | yes | yes | Monkey, Intro, Locomotion | Best-completed vertical slice. |
| 2.10 | first crystal exists/discovered | no | no | Crystals/Progression | Correct for `stateAt(2.20)` only if first crystal is consumed/irrelevant; not explicitly justified. |
| 2.20 | Reliquary revealed+enabled, Portal visible | yes | yes | Reliquary, Portal | Deterministic/silent hydration exists. |
| 2.30 | Tier 1 committed, floor complete, Tier-1 crystals consumed | yes | yes | Progression, Floor, Crystals | Strong canonical persistent slice. |
| 2.40 | first-ring presentation settled | no | n/a | Floor/FirstRing | Floor completion is already in `2.30`; transient timer intentionally omitted. |
| 3.10 | shell field visible/noninteractive, main glyphs elevated | yes | yes | PostRingPresentation | Correctly exclusive: appears at `stateAt(3.20)`, not `3.10`. |
| 3.20 | observation elapsed | no | n/a | ObservationWindow | Transient. |
| 3.30 | dialogue acknowledged | no | no | Dialogue/Director | No stable visual delta identified. |
| 3.40 | Furnace revealed | **no** | **no** | Furnace | Direct activation at 3.50+ can leave Furnace hidden. |
| 3.50 | production request accepted/process begun | no | no | AstroProduction/Furnace | Live/transient process should not be reconstructed; stable readiness/reveal prerequisite is missing. |
| 3.60 | Astro produced/AVAILABLE | **no** | **no** | AstroProduction | Direct `3.70` cannot materialize available output. |
| 3.70 | Astro claimed/EARNED | **no** | **no** | AstroProduction/HandMode | Direct `3.80` grants capabilities without owned/equipped Astro state. |
| 3.80 | shells targetable and Astro earned | no | no | Astro/Shell | Stop boundary is not reconstructable. |
| 100.10 | exit | empty | not targetable | Session | Exit behavior is outside reconstruction. |

## 8. Director audit

### Zgodne

- `currentPointId` występuje jako mutowalny global story position wyłącznie w `ExperienceDirector`.
- Director waliduje vocabulary, choices, effects, capabilities, point IDs i authored Spine.
- `COMPLETE` korzysta z derived `Spine.next()`, `EXPLICIT` tylko z authored targetu, a crossing-only `COMPLETE_IF` agreguje semantyczne fakty w payload.
- Entry targetu jest dołączane po transition effects i oznaczane activated exactly once; direct start wymaga jawnej aktywacji.
- Director nie importuje Three.js, nie hydratyzuje ownerów i nie wywołuje gameplay API.

### Bypassy / naruszenia

- `furnacePanel.canUseAstroProduction` czyta literalny point `3.50`, więc actor/presentation zna Scenario ID zamiast capability/command contract.
- `introQaBypass` omija capabilities w glyph, Reliquary i Astro equipment gates.
- `?p1` mutuje progression/floor/world bez Directora.
- Późniejsze Furnace/Shell/Asterion controllers samodzielnie prowadzą lokalną progresję, bo nie istnieją odpowiadające points.
- Milestones Directora i owner truth nie są zsynchronizowane przy reconstruction; aktualnie nie szkodzi gates, lecz milestone API nie reprezentuje reconstructed history.
- `resetSession()` bez `hard` pozostawia milestones, podczas gdy composition baseline resetuje owner truth; powstaje potencjalna rozbieżność debug snapshot/legacy consumers.

**Werdykt Director:** CANONICAL jako mechanizm, PARTIAL jako jedyny globalny authority całego Experience VR, ponieważ aktywne lokalne progression state machines istnieją poza authored zakresem.

## 9. RuntimeExperience audit

| Contract | Status | Evidence / gap |
| --- | --- | --- |
| event → Director → effects | CANONICAL | `dispatch()` najpierw uzyskuje accepted change, potem wykonuje handlers. |
| exactly-once entry | CANONICAL | Director flag + Runtime activation. |
| arbitrary activation order | CANONICAL | baseline → stateAt → hydrate → synchronize → replace Director → activate entry. |
| no dramaturgy choice | CANONICAL | Runtime nie zna point order ani effects semantics. |
| no domain truth | CANONICAL | Przechowuje jedynie Director, handler map i lifecycle adapters. |
| lifecycle completeness | PARTIAL | Lifecycle jest poprawny mechanicznie, ale owner registry i Scenario consequences nie obejmują 3.40+ ani later systems. |
| atomic failure | PARTIAL | Baseline/hydration owner calls nie mają transaction rollback między ownerami; pojedynczy owner może być atomic. |
| fallback checkpoint path | PARTIAL | `enterVrDebugCheckpoint` zachowuje starszą ścieżkę bez `activatePoint`, choć production Runtime ją posiada. |

Runtime nie wybiera dramaturgii. Główne problemy leżą w niepełnych danych Scenario oraz handlers/composition, nie w klasie RuntimeExperience.

## 10. Actors / domain owners

| ACTOR / OWNER | RESPONSIBILITY | PUBLIC COMMANDS | COMPLETION EVENTS | PERSISTENT STATE | TRANSIENT STATE | SCENARIO-AWARE? | DIRECTOR-AWARE? | BOUNDARY STATUS |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| IntroSequence | całe Intro, follow, crossing, first discovery/reveal | `begin*`, `continue*`, `present*`, hydrate/reset | wszystkie Intro/crossing/hint/reveal events via callbacks | hydrated stage/phase + world flags | timers, local `VR_INTRO_STATE`, dialogue, walking flags | Indirect: mirrors many points | no | PARTIAL — local alternate dramaturgy. |
| Monkey model | geometry/placement | dock/capture/hydrate | none | final placement/visibility | transforms | no | no | CANONICAL owner. |
| MonkeyGuide | dialogue/UI/attention | show/override/interaction/reset | user callbacks consumed by Intro/dialog actors | derived known pages (reads Progression) | open/selection/attention | no point IDs | no | PARTIAL — coupled to progression and several dramaturgic actors. |
| PlayerGuidePanel | guide/debug UI | show/reset/update | open/view/close through Intro observers | none | view/navigation | debug checkpoint-aware | no | PARTIAL adapter. |
| Locomotion | movement/boundary | update, set boundary, hydrate, teleport | crossing observed by Intro | active walk radius | yaw/input | scenario boundary enum only | no | CANONICAL domain owner; QA teleport is adapter. |
| GlyphInteraction | hold targeting | update/reset | hold completion callback | none | hover/hold | capability supplied externally | no | CANONICAL low-level actor. |
| CrystalCollection | crystal instances/insertion/commit | spawn/activate/release/hydrate/reset | preview/commit callbacks | crystal lifecycle; hydrated consumed tier | held/inserted animation | capability injected | no | PARTIAL — composition creates crystal and reports discovery; hydration resets then materializes stable consumed state. |
| VrProgressionController | page/tier truth | commit/query/hydrate/reset | commit result consumed by FirstRingFlow | activated IDs/current tier | none | no point IDs | no | CANONICAL domain owner. |
| ProgressFloor | sector/page visuals | activate/complete/hydrate/reset | none | stable activated/completed visuals | animation | no | no | CANONICAL presentation owner, though Scenario stores authored page mapping. |
| Reliquary | vessel reveal/interaction | reveal/hydrate/reset | reveal completion comes from Intro timer | revealed/enabled | animation | capability injected | no | PARTIAL — reveal choreography owned by Intro/composition. |
| PortalDisplay/Canvas | portal/plaque presentation | reveal/show/hydrate/reset | none | portal visibility | reveal/card UI | no | no | PARTIAL — one Scenario effect mutates multiple objects in composition. |
| ReliquaryHints | contextual guidance | show/reset/update | timeout inbound/outbound | none | timer/phase | no point IDs | no | CANONICAL local guidance actor. |
| FirstRingFlow | bridge presentation and event adapter | `commitPage`, `beginPresentation` | CARD_COMMITTED, FIRST_RING_COMPLETED, PRESENTATION_COMPLETED | none | timer/flags | knows Tier 1 semantic special case | dispatch callback | PARTIAL — owns dramaturgic branching on `page.order === 1`. |
| PostRingPresentation | shell reveal/glyph elevation | two commands/hydrate/reset | presentation completed | shell visibility/elevation | tween | no | no | CANONICAL for 3.10. |
| ObservationWindow | delay | begin/reset/update | OBSERVATION_WINDOW_COMPLETED | none | timer | no | no | CANONICAL. |
| PostRingMonkeyDialogue | required acknowledgement | begin/reset | POST_RING_MONKEY_DIALOGUE_COMPLETED | none | dialogue state | no point ID | no | CANONICAL bounded actor. |
| FurnaceIntro | two-line guidance + reveal | begin/reset | FURNACE_INTRO_COMPLETED | none | line/state | no point ID | no | PARTIAL — directly invokes next domain reveal during its beat. |
| AstroFurnace | geometry/animation | place/reset/baseline | none | visibility/open physical state | clips | no | no | PARTIAL — Furnace reveal lacks hydration. |
| AstroAttractorProduction | READY→BUILDING→AVAILABLE→CLAIMING→EARNED | request/claim/update/resetSession | REQUESTED/PRODUCED/CLAIMED callbacks | earned/available/build outcome | claiming/progress/hits | gates supplied; no ID | callback to Runtime | PARTIAL — persistent state lacks hydration; request begins gameplay before event acceptance. |
| AttractorTool/HandMode | equipment | equip/toggle/reset | none | equipped availability derived | input/mode | capabilities injected plus QA bypass | no | PARTIAL — claim fan-out in composition. |
| ShellSystem/AttractorInteraction | field and pull/handoff | activate/enable/pull/reset | only audio callbacks; Scenario shell events unused | shell locations/consumption candidates | target/pull/held | gates supplied indirectly | no | LEGACY relative to global story. |
| FurnaceContent/Activate/Open/Option | insertion, process, chamber, modes | local interaction API/reset | local subscriptions/audio only | inserted/consumed/process results | animation/hits/mode | capability partly supplied | no | LEGACY for post-3.80 story; valid local mechanics in isolation. |
| FurnaceProgressionController | absorbed-shell set | commit/query/subscribe | none to Director | absorbed shell IDs | none | no | no | LEGACY global progression owner; no hydration. |
| AsterionProduction | build/claim state | request/build/claim/update | callbacks are audio/state only | built/earned | construction/presentation | no point IDs | no | LEGACY global progression; no Scenario events wired. |
| AsterionSphere/Gyro | equipment/drive | present/equip/update/reset | none to Director | earned/equipped implications | gyro/drive/angular state | QA aware via composition | no | LEGACY global progression. |
| AmbientSequencer | audio state derived from tier/shells/Asterion | `setState/reset` | none | derived only | playback | no | no | PARTIAL — sync policy lives in composition root. |

## 11. Hydration audit

`ATOMIC` oznacza walidację przed mutacją całego owner state; `SILENT` oznacza brak semantic completion i history replay.

| OWNER | PUBLIC HYDRATION API | ATOMIC? | IDEMPOTENT? | SILENT? | VALIDATED? | REPLAYS GAMEPLAY? | STATUS |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Monkey | `hydrateScenarioState` | yes for accepted enum/placement | yes | yes | yes | no | CANONICAL |
| Intro | `hydrateScenarioState` | PARTIAL (mutates presentation aggregate) | yes after baseline | yes | enum/shape checks | no live sequence | CANONICAL for authored facts, PARTIAL as oversized owner |
| Locomotion | `hydrateScenarioState` | yes | yes | yes | boundary validation | no | CANONICAL |
| Reliquary | `hydrateScenarioState` | yes | yes | yes | boolean/contract | no reveal replay | CANONICAL |
| Portal | `hydrateScenarioState` | yes | yes | yes | visibility contract | no reveal replay | CANONICAL |
| ProgressionController | `hydrateScenarioState` | **yes** (candidate first) | yes | yes | IDs, duplicates, branch/tier invariants | no | CANONICAL |
| ProgressFloor | `hydrateScenarioState` | PARTIAL atomicity across meshes | yes after baseline | yes | authored page references | no animation | CANONICAL |
| CrystalCollection | `hydrateScenarioState` | PARTIAL (calls reset before full materialization) | yes after baseline | yes | consumed-tier contract | no collection replay | PARTIAL |
| PostRingPresentation | `hydrateScenarioState` | yes | yes | yes | expected booleans | no tween/completion | CANONICAL |
| FirstRingFlow | none (transient intentionally) | n/a | n/a | n/a | n/a | n/a | CANONICAL omission |
| Observation/dialogue/hints | none (transient intentionally) | n/a | n/a | n/a | n/a | n/a | CANONICAL omission |
| Furnace visibility/open state | none | no | no | n/a | no | n/a | LEGACY gap from 3.40 |
| Astro production | none | no | no | n/a | no | n/a | LEGACY gap from 3.60/3.70/3.80 |
| Shell state + FurnaceProgression | none | no | no | n/a | no | n/a | LEGACY; later checkpoints blocked |
| Furnace content/process | none | no | no | n/a | no | n/a | LEGACY; transient process must not be persisted, settled absorption must be |
| Asterion production/sphere | none | no | no | n/a | no | n/a | LEGACY; P3/P4 impossible canonically |
| Ambient | no hydration; `syncAmbientSequence()` derives | n/a | yes | yes | derives from owners | no | CANONICAL pattern, PARTIAL placement |

Hydration is not globally transactional: if owner N fails, owners 1…N−1 remain hydrated. Canonical baseline makes retry deterministic, but this is not an atomic multi-owner commit.

## 12. `experienceVr.js` composition-root audit

### VALID COMPOSITION

- Module construction, asset loading, Three.js roots, DI, controller/input creation.
- Callback wiring semantic completions into `runtimeExperience.dispatch`.
- `effectHandlers` as runtime adapters translating symbolic commands to actor methods.
- render/update lifecycle and XR session lifecycle.
- `scenarioOwners` registry and Runtime pointLifecycle injection.
- spawn positioning adapter for debug checkpoints (provided it remains spawn-only).

### SUSPECTED DOMAIN LOGIC

| Symbol | Logic | Status |
| --- | --- | --- |
| `getNextCrystalTier` / `isGlyphActive` | Re-derives next-domain availability from pages, instances and QA gate outside Progression/Crystal owners. | PARTIAL |
| `onGlyphHoldComplete` | Chooses tier, spawns crystal, reports first discovery and audio in one callback. | PARTIAL fan-out |
| Astro `onClaimed` | dispatch + `shellSystem.setInteractionEnabled` + `equipRightAstro`. | LEGACY fan-out |
| `syncAmbientSequence` | Encodes threshold/shell-complete/sphere-built derivation. | PARTIAL; should be an ambient synchronizer/selector outside root. |
| `restorePortalWaitingState` / `resetPortalBaseline` | Coordinates Portal display and canvas as one domain state. | PARTIAL owner split. |

### SUSPECTED DRAMATURGY

| Symbol | Logic | Status |
| --- | --- | --- |
| `introQaBypass` | Query list changes story gates across unrelated actors. | LEGACY |
| `canUseAstroProduction: () => currentPointId === '3.50'` | Actor knows exact story point rather than capability. | LEGACY boundary violation |
| `onReliquaryReveal` | One Intro callback reveals Portal, Reliquary and canvas. | PARTIAL global effect fan-out |
| Runtime effect map for transition-owned continuations | Correct adapter mechanically, but exposes duplicated Intro dramaturgy authored in actor state. | PARTIAL |
| FurnaceIntro `revealFurnace` injection | Dialogue actor directly starts Furnace presentation. | PARTIAL |

### SUSPECTED RECONSTRUCTION LOGIC

| Symbol | Logic | Status |
| --- | --- | --- |
| `restoreVrScenarioBaseline` | Manual list of ~40 resets plus explicit visibility assignments; composition root encodes reset history/owner ordering. | PARTIAL/LEGACY |
| `scenarioOwners` | Correct registry, but excludes Furnace/Astro/Shell/Asterion. | PARTIAL |
| `spawnPlayerInsideRingFacingMonkey` | Checkpoint spatial fixup after hydration. | PARTIAL; valid spawn adapter if formally separated from reconstructed truth. |
| `syncQaPostP1WorldState` | Reapplies shell visibility based on query parameter during every baseline. | LEGACY manual checkpoint fixup |

### LEGACY COMPATIBILITY

- `?p1` shortcut commits pages, completes floor and activates shells without `stateAt`/Director.
- `?furnace`, `?furnaceProcess`, `?asterionSphere` participate in `introQaBypass`; furnace process additionally allows input without canonical requirements.
- Nullable early `runtimeExperience` binding is valid bootstrap compatibility, not dramaturgy.
- `getCurrentSceneId` / `VR_EXPERIENCE_SCENE` aliases are harmless naming compatibility, but should not become a second model.

## 13. Legacy fan-out map

| FILE / SYMBOL | EVENT | DIRECT EFFECTS | DOMAIN-LOCAL | DRAMATURGICAL / SHOULD MOVE THROUGH SCENARIO? |
| --- | --- | --- | --- | --- |
| `experienceVr.js:onGlyphHoldComplete` | physical glyph hold complete | find tier; spawn crystal; dispatch `FIRST_CRYSTAL_DISCOVERED`; audio | spawn/audio | First-ever discovery is dramaturgical and correctly reported, but branching and fan-out should be owner event + Scenario entry command. |
| `createVrFirstRingFlow.commitPage` | accepted page commit | CARD_COMMITTED; maybe FIRST_RING_COMPLETED; ambient sync | commit result | Tier-1 completion and ambient threshold are global; semantic events should be returned, ambient synchronized separately. |
| Scenario `2.30 CARD_COMMITTED` handler set | CARD_COMMITTED | floor mutation + audio | audio feedback | Floor stable mutation is domain/presentation; authored fan-out is legitimate Runtime effects, but settled owner must remain authoritative. |
| `experienceVr.js:onReliquaryReveal` | Intro reveal callback | Portal reveal; Reliquary reveal; canvas show | each actor action | Multi-owner reveal is dramaturgical and should be separate Scenario commands/target entry, not Intro-owned callback. |
| `experienceVr.js:astroProduction.onClaimed` | physical Astro claim completed | dispatch; shell interaction enable; equip right Astro | equip is Astro-domain | Unlock shells is dramaturgical and must be target `3.80` entry/effect; dispatch must precede commands and rejected event must not mutate. |
| `syncAmbientSequence` subscriptions | tier/shell/Asterion state change | recompute ambient thresholds | audio-derived | Cross-domain mood policy is presentation synchronization; move to explicit synchronizer, not necessarily Scenario if purely derived. |
| Furnace process callbacks | process start/stop | choose Asterion-create vs Furnace audio | local device audio | Valid domain-local fan-out; no Scenario transition currently observes it. |
| `?p1` shortcut | query alias | commit five pages; activate/complete floor; enable shells | mixed | Entire sequence is manual dramaturgy and bypasses Scenario. |
| Intro crossing completions | player/Monkey facts | conditional Director completion + `BEGIN_GLYPH_FREE_EXPLORE` | join fact local | Start of `2.10` must be target entry. |

## 14. QA / checkpoint audit

| Shortcut | Target / behavior | `activatePoint()`? | Manual fixups / bypass | Status |
| --- | --- | --- | --- | --- |
| Debug P0 | canonical `1.10`, intro spawn + calibration | yes | spawn reset after activation; calibration then starts normal transition | CANONICAL lifecycle; ordering means `1.10` has no entry, so safe. |
| Debug P1 | canonical `2.10` | yes | teleport ring after hydration | PARTIAL: canonical world reconstruction, explicit spawn adapter. |
| Debug P2 | canonical `3.10` | yes | teleport ring after hydration | PARTIAL: canonical lifecycle; hardware QA pending. |
| `?p0` | no active query handler found | no | none | LEGACY/MISSING alias (debug P0 exists only via `?debug` panel). |
| `?p1` | manually completed Tier 1 | no | commits pages/floor, activates shells; also broad Intro/capability bypass | LEGACY |
| `?p2` | no active query handler found | no | none | LEGACY/MISSING alias (debug P2 exists via panel). |
| `?furnace` | QA bypass | no | bypasses Intro gates | LEGACY |
| `?furnaceProcess` | QA process | no | bypass + `qaAllowWithoutInput` | LEGACY |
| `?asterionSphere` | sphere QA | no | bypasses Intro/tool availability | LEGACY |

P3/P4 are documented future aliases only; registry and UI correctly reject P3. Reconstruction lacks their domain facts and owners.

## 15. Test coverage

| CONTRACT | TEST | STATUS |
| --- | --- | --- |
| derived single Spine/validation | `vr-scenario-reconstruction.test.mjs`, `experience-director.test.mjs` | COVERED |
| `stateAt` exclusive/declarative/terminal rejection | `vr-m3b-point-lifecycle`, `vr-scenario-reconstruction`, `vr-m6-direct-point-activation-3x` | COVERED |
| point activation lifecycle order | `vr-m3b-point-lifecycle`, `vr-m6-direct-point-activation-3x`, `vr-debug-checkpoints` | COVERED |
| target entry exactly once | `runtime-experience`, M3B, M6, first-ring live flow | COVERED |
| natural/direct parity | M3B and M6 compare effects/state | PARTIAL — representative 3.x points, not production owners through 3.80 |
| settledConsequences shape | reconstruction + M3B/M6 | PARTIAL — only declared slices; missing consequences cannot be tested |
| owner hydration delegation | `vr-scenario-hydration` | COVERED structurally |
| Progression atomic hydration | `vr-m5-progression-owner-hydration` | COVERED |
| Monkey/Intro/Locomotion vertical hydration | `vr-m4-owner-hydration` and owner tests | COVERED |
| Reliquary/Portal/Floor/Crystals/PostRing hydration | corresponding owner tests + hydration suites | PARTIAL — individual contracts, no full production rollback/parity |
| Director sole `currentPoint` ownership | Director tests | PARTIAL — behavior tested, repository boundary not enforced |
| actor command/event boundary | Intro, first-ring, Astro live-flow tests | PARTIAL — later actors and negative “no next beat” boundary missing |
| predecessor does not start target beat | none; current Scenario violates it | MISSING |
| composition root contains wiring only | source regex bootstrap/visual tests only | MISSING |
| Runtime handler completeness | `runtime-experience` production vocabulary handler checks | PARTIAL — synthetic handlers, production map lacks unused effects by design |
| P0/P1/P2 registry/switching | `vr-debug-checkpoints` | COVERED mechanically; hardware pending |
| direct 3.50–3.80 stable-world parity | none | MISSING |
| Shell/Furnace/Asterion canonical flow | subsystem tests only | MISSING architecturally |
| ambient reconstruction synchronization | hydration ordering test / local audio tests | PARTIAL |
| QA alias isolation | no comprehensive contract test | MISSING |
| baseline owner completeness/idempotence | runtime bootstrap and subsystem resets | PARTIAL |

Test green status therefore proves many mechanisms, not completion of architectural migration.

## 16. Migration status

| AREA | CANONICAL | PARTIAL | LEGACY | BLOCKED | EVIDENCE |
| --- | --- | --- | --- | --- | --- |
| Spine derivation | yes |  |  |  | graph-derived through canonical terminal `100.10`; later Visionary decision resolved its semantics |
| Scenario vocabulary/points | through 3.80 | entry ownership 1.40–2.40, state 3.40+ | post-3.80 mechanics | future authored design | code graph |
| Director mechanism | yes | whole-runtime authority | local later controllers |  | source/tests |
| RuntimeExperience | yes | incomplete lifecycle data |  |  | source/tests |
| Intro | first entries/events | duplicated actor dramaturgy |  |  | Intro state machine + effects |
| First ring | persistent controller and semantic bridge | presentation/ambient fan-out | `?p1` |  | controller/root |
| Post-ring 3.10–3.40 | 3.10–3.30 | Furnace reveal consequence |  |  | Scenario/root |
| Astro 3.50–3.80 | events/capabilities | commands, claim fan-out, no hydration | direct point gates |  | production controller/root |
| Shell/Furnace/Asterion later flow | local domain mechanics only |  | global dramaturgy | authored post-3.80 decisions | subsystem code |
| Reconstruction | through 3.20 stable state | multi-owner atomicity, late facts | later owners | P3/P4 | consequences/owners |
| QA | debug P0/P1/P2 | spawn adapters | query aliases | P3/P4 | registry/root |
| Composition root | construction/wiring/lifecycle | baseline/ambient/domain coordination | bypass dramaturgy |  | `experienceVr.js` |

## 17. Remaining seams

### S1 — Target-entry ownership for Intro continuations

- **CURRENT:** transitions `1.40–1.130` carry commands that initialize the next point; IntroSequence chooses next local phase.
- **TARGET:** each global beat begins only in target `entryEffects`; transition effects remain event-local only.
- **WHY:** removes duplicated dramaturgy and enables direct activation parity.
- **DEPENDENCIES:** none; preserve events and actor commands.
- **RISK:** medium (exactly-once/timing of guide and crossing).
- **SUGGESTED ATOMIC SCOPE:** move one contiguous Intro edge group at a time, starting `1.40→1.50`, with natural/direct parity tests.

### S2 — First crystal/Reliquary target entry and reveal fan-out

- **CURRENT:** `2.10` completion starts discovery/reveal; Intro callback mutates Portal, Reliquary and canvas.
- **TARGET:** `2.20` entry issues explicit bounded commands to appropriate actors; actor reports reveal completion.
- **WHY:** actor must not coordinate unrelated owners.
- **DEPENDENCIES:** S1 command/entry convention.
- **RISK:** medium-high visual timing.
- **SUGGESTED ATOMIC SCOPE:** separate symbolic effects without changing reveal implementation or copy.

### S3 — First-ring presentation entry ownership

- **CURRENT:** `FIRST_RING_COMPLETED` transition starts `2.40` presentation and audio; FirstRingFlow also decides Tier-1 global event and ambient sync.
- **TARGET:** target `2.40` entry begins presentation; owner emits neutral commit/tier result; Scenario/Runtime handle global beat.
- **WHY:** predecessor and actor currently start next beat.
- **DEPENDENCIES:** S1 pattern.
- **RISK:** medium.
- **SUGGESTED ATOMIC SCOPE:** first move presentation start only; later split ambient and Tier-1 branching.

### S4 — Furnace reveal stable consequence

- **CURRENT:** FurnaceIntro directly reveals Furnace; `3.40` has no consequence/hydration.
- **TARGET:** Furnace presentation owner with silent hydrate/reset; `3.40` consequence records revealed state.
- **WHY:** direct starts after 3.40 are currently incorrect.
- **DEPENDENCIES:** owner API decision for Furnace visibility.
- **RISK:** low-medium.
- **SUGGESTED ATOMIC SCOPE:** stable visibility only; do not hydrate chamber/process transient state.

### S5 — Astro request as target command

- **CURRENT:** production actor starts Furnace process, then emits REQUESTED; panel checks literal point `3.50`.
- **TARGET:** semantic player request → Director `3.50→3.60` → `3.60` entry command `BEGIN_ASTRO_PRODUCTION`; capability replaces point-ID check.
- **WHY:** actor currently performs gameplay before dramaturgical acceptance.
- **DEPENDENCIES:** S4; define capability/command without broad API redesign.
- **RISK:** high (input/process race).
- **SUGGESTED ATOMIC SCOPE:** only request acceptance/start ordering and negative rejection test.

### S6 — Astro AVAILABLE/EARNED stable state and hydration

- **CURRENT:** production controller owns correct local states but exposes no hydration; Scenario points have empty consequences.
- **TARGET:** owner-validated silent hydration for stable AVAILABLE and EARNED; `3.60/3.70` consequences; direct 3.70/3.80 parity.
- **WHY:** direct activation grants capabilities into an impossible world.
- **DEPENDENCIES:** S5, explicit decision whether direct 3.60 starts live construction or represents pre-entry readiness.
- **RISK:** high (physical clone/equipment/chamber invariants).
- **SUGGESTED ATOMIC SCOPE:** hydrate AVAILABLE first, EARNED second; never persist CLAIMING/progress/hit.

### S7 — Astro claim target-entry fan-out

- **CURRENT:** composition callback dispatches CLAIMED, then directly enables shells and equips tool.
- **TARGET:** accepted transition to `3.80` runs symbolic entry effects; Astro owner finalizes earned/equip domain action, Shell owner receives enable command.
- **WHY:** current callback mutates global world regardless of accepted change.
- **DEPENDENCIES:** S6.
- **RISK:** medium.
- **SUGGESTED ATOMIC SCOPE:** move shell enable first; keep optional auto-equip as explicit unresolved product choice.

### S8 — Baseline owner aggregation

- **CURRENT:** `restoreVrScenarioBaseline` is a long manually ordered reset history in composition root.
- **TARGET:** owner-scoped baseline adapters/registry; composition invokes lifecycle, not individual domain internals.
- **WHY:** owner omissions and order are implicit; later hydration cannot scale safely.
- **DEPENDENCIES:** S4/S6 establish missing owner APIs.
- **RISK:** high regression surface.
- **SUGGESTED ATOMIC SCOPE:** extract registrations by domain without changing reset order or behavior.

### S9 — Ambient synchronizer boundary

- **CURRENT:** composition reads Progression, FurnaceProgression and AsterionProduction and encodes thresholds.
- **TARGET:** explicit derived presentation synchronizer subscribed to owner snapshots.
- **WHY:** cross-domain policy is hidden in root and replay ordering.
- **DEPENDENCIES:** stable owner snapshots; independent of authored later story.
- **RISK:** low-medium audio regression.
- **SUGGESTED ATOMIC SCOPE:** move unchanged formula and subscriptions into one adapter module.

### S10 — Remove/contain legacy query shortcuts

- **CURRENT:** `?p1` and Furnace/Asterion flags bypass Scenario and manual-fix world state.
- **TARGET:** canonical debug aliases use `activatePoint`; subsystem QA flags are clearly isolated from progression and never alter normal gates.
- **WHY:** composition root currently carries alternative scenario.
- **DEPENDENCIES:** S6 for a true later Astro checkpoint; no need to invent P3/P4 yet.
- **RISK:** medium QA workflow change.
- **SUGGESTED ATOMIC SCOPE:** inventory each alias and migrate/remove one independently; preserve explicit subsystem harnesses where necessary.

### S11 — Author Shell acquisition mainline

- **CURRENT:** shell scanning/pull/handoff is local gameplay after `3.80`; Scenario shell events exist but are unwired.
- **TARGET:** small authored points/entries/events around shell availability and handoff, while Shell actor owns target/held/transient state.
- **WHY:** current global progression ends before active mechanics.
- **DEPENDENCIES:** decision on post-3.80 canonical sequence; S7.
- **RISK:** high; product/design boundary.
- **SUGGESTED ATOMIC SCOPE:** author only first shell acquisition completion, not the full loop.

### S12 — Author Furnace shell processing

- **CURRENT:** insert/start/complete/absorb happens through local Furnace controllers; vocabulary is not connected to Director.
- **TARGET:** Scenario commands/events at global beats; Furnace actors retain chamber/process mechanics; only settled absorption persists.
- **WHY:** actor-local chain currently advances toward Asterion without Director.
- **DEPENDENCIES:** S11 and authored point decisions.
- **RISK:** high.
- **SUGGESTED ATOMIC SCOPE:** one shell insertion/process/absorption vertical slice.

### S13 — Shell-set persistent hydration

- **CURRENT:** FurnaceProgression owns absorbed set but has no reset/hydration; ambient consumes it.
- **TARGET:** validated atomic silent owner hydration and Scenario settled consequence at set-complete point.
- **WHY:** P3 reconstruction cannot exist otherwise.
- **DEPENDENCIES:** S12 defines settled semantics.
- **RISK:** medium.
- **SUGGESTED ATOMIC SCOPE:** absorbed IDs only; exclude held shell/process phase/presentation.

### S14 — Author Asterion build/claim/equip

- **CURRENT:** Asterion production/sphere/gyro form a complete local state chain; Scenario events/capabilities are unused.
- **TARGET:** target entries command build/presentation; actor events return BUILT/CLAIMED/EARNED; owner owns earned/equipped state.
- **WHY:** largest remaining parallel dramaturgy.
- **DEPENDENCIES:** S13 and explicit post-shell authored graph.
- **RISK:** high.
- **SUGGESTED ATOMIC SCOPE:** build request/start/built first; claim/equip in later seam.

### S15 — Asterion hydration and P3/P4 readiness

- **CURRENT:** no stable hydration for built/earned/equipped Asterion or later Tier 2/small glyph state.
- **TARGET:** owner-scoped settled states followed by canonical checkpoint aliases using identical lifecycle.
- **WHY:** documented P3/P4 cannot be implemented safely with manual fixes.
- **DEPENDENCIES:** S14 plus authored P3/P4 target decisions.
- **RISK:** high.
- **SUGGESTED ATOMIC SCOPE:** one checkpoint only after its target point has complete consequences/hydration.

### S16 — Architectural boundary guards

- **CURRENT:** tests cover behavior but not “no point IDs in actors”, “no transition starts target”, “root wiring only”, or later parity.
- **TARGET:** focused static/contract tests protecting ownership.
- **WHY:** successful tests presently coexist with violations.
- **DEPENDENCIES:** add guards alongside each prior seam rather than one late batch.
- **RISK:** low.
- **SUGGESTED ATOMIC SCOPE:** one invariant per migration PR.

## 18. Recommended migration order

```text
S1 (Intro entry ownership)
→ S2 (Reliquary target entry/fan-out)
→ S3 (first-ring target entry)
→ S4 (Furnace stable reveal)
→ S5 (Astro request/command order)
→ S6 (Astro stable hydration)
→ S7 (claim target-entry fan-out)
→ S8 (baseline registry)
→ S9 (ambient synchronizer)
→ S10 (legacy shortcuts)
→ [design decision: post-3.80 graph]
→ S11 (first Shell slice)
→ S12 (one Furnace processing slice)
→ S13 (shell-set hydration)
→ S14 (Asterion authored slices)
→ S15 (later hydration/checkpoints)
```

`S16` nie jest końcową fazą: jego pojedyncze guards należy dodawać równolegle do każdego S1–S15. Każdy krok ma pozostać osobno wdrażalny i testowalny; nie zaleca się rewrite’u Intro ani composition root.

## 19. Explicitly unresolved decisions

1. Czy claim Astro ma automatycznie equipować prawą rękę, czy jedynie przyznać EARNED i pozwolić graczowi wyposażyć narzędzie? Obecny kod auto-equips; tekst kanonu mówi „equipable”.
2. Czy `stateAt(3.70)` ma materializować Astro AVAILABLE w otwartej czy zamkniętej komorze? Naturalny claim wymaga otwartej, ale chamber state nie jest authored stable fact.
3. Czy reconstructed Director milestones mają odzwierciedlać historyczne settled facts, czy milestones są wyłącznie bieżącą-session telemetry? Aktualny lifecycle nie hydratyzuje milestones.
4. Czy query subsystem QA flags mają pozostać jako jawne izolowane harnesses, czy wszystkie mają stać się Scenario checkpoints? Nie każdy visual/process harness powinien reprezentować canonical point.

## 20. Definition of Done

Migracja Scenario/Director jest zakończona wyłącznie, gdy wszystkie poniższe warunki są jednocześnie spełnione:

- istnieje jeden authored graph i jedna wyprowadzona canonical mainline bez sprzecznego terminala;
- jeden żywy Director jest jedynym właścicielem globalnego `currentPoint`;
- wszystkie globalne beaty rozpoczynają się przez `entryEffects` target pointu exactly once;
- transition predecessor nie uruchamia następnego beatu;
- wszyscy aktorzy wykonują commands i raportują semantic completion, ale nie wybierają kolejnego pointu;
- żaden actor/presentation owner nie zna canonical point IDs ani Spine;
- Director nie wykonuje gameplayu, hydration ani Three.js;
- RuntimeExperience nie wybiera dramaturgii i nie przechowuje domain truth;
- composition root ogranicza się do construction, DI, wiring, adapters i lifecycle; nie zawiera stage-ifów, checkpoint history ani domain fan-out;
- reconstruction jest wyłącznie `stateAt(X)` ze settled consequences punktów przed X, bez event/gameplay replay;
- każdy persistent fact ma dokładnie jednego ownera oraz walidowane, idempotentne, ciche hydration/reset API, jeśli jest wymagany przez reconstruction;
- transient timers, hover, hits, animation progress, CLAIMING i presentation playback nie są persistent truth;
- semantic completion events wracają przez Runtime do Directora przed rozpoczęciem kolejnego globalnego działania;
- direct activation każdego wspieranego pointu daje ten sam stable world i entry co naturalne dojście;
- P0/P1/P2 i przyszłe checkpoints używają identycznego lifecycle bez manual fixups; pozostałe QA harnesses są jawnie izolowane;
- Shell/Furnace/Asterion albo są authored w Scenario, albo nie są przedstawiane jako część canonical progression;
- testy chronią derived Spine, exclusive stateAt, exactly-once entry, natural/direct parity, owner hydration, actor boundary, Director ownership, composition-root boundary i brak point IDs poza Scenario/Director/adapters.

## 21. Handoff for next Architect thread

**CURRENT STATE**

Canonical graph/derived Spine/Director/Runtime działają do `3.80`; P0/P1/P2 mają reconstruction lifecycle. Entry ownership Intro/first ring, stable state 3.40+, composition fan-out i cała aktywna progresja Shell/Furnace/Asterion pozostają nieukończone.

**CANONICAL ARCHITECTURE**

`SPINE → SCENARIO → DIRECTOR → RUNTIME EXPERIENCE → ACTORS`; composition root wyłącznie składa i podłącza.

**COMPLETED MIGRATIONS**

Derived Spine; Director `currentPoint`; exclusive declarative `stateAt`; Runtime `activatePoint`; hydration Monkey/Intro/Locomotion/Reliquary/Portal/Progression/Floor/Crystals/PostRing; canonical P0/P1/P2; target entries `1.20`, `1.30`, `3.10–3.40`; Astro semantic events through `3.80`.

**NEXT RECOMMENDED SEAM**

S1: przenieść rozpoczęcia kolejnych Intro beats z transition effects na target `entryEffects`, zaczynając od jednego edge `1.40→1.50`, zachowując istniejący actor command i dodając natural/direct parity guard.

**BLOCKERS / DECISIONS**

Semantyka `100.10` została później rozstrzygnięta: canonical terminal authored mainline i fabuły. Przed pracą nad niezauthorowanymi systemami ustalić ich bounded Scenario scope; przed hydration Astro rozstrzygnąć auto-equip oraz stable chamber state.

**FILES TO READ FIRST**

`docs/current/technical/VR_SCENARIO_DIRECTOR_MODEL.md`; ten audyt; `src/xr/progression/vrExperienceScenario.js`; `src/xr/progression/ExperienceDirector.js`; `src/xr/progression/RuntimeExperience.js`; `src/xr/guidance/createVrIntroSequence.js`; `src/experienceVr.js`.
