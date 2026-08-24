# STATUS

**CURRENT RUNTIME AUDIT / POST-MIGRATION / NOT READY FOR G6**

Data audytu: 2026-08-24. Zakres jest statyczny i ograniczony do wskazanych subsystemów komunikacji, progresji, domain truth oraz composition. Nie wykonano napraw runtime ani QA urządzeniowego.

`PROJECT_ENTRY.md` nie istnieje w CURRENT checkout; repozytoryjny entrypoint wskazany przez `docs/current/maps/PROJECT_INDEX.md` to `README.md`. Audyt rozpoczęto od dostępnego canonical indexu i wszystkich wskazanych dokumentów.

# EXECUTIVE SUMMARY

Architektura celu bieżącego jest zasadniczo poprawna: jedna instancja `createVrCurrentObjectiveProjection` czyta Scenario i domain owners, a dokładnie ten sam getter zasila Y oraz resolver `CO TERAZ?` Małpy (`src/experienceVr.js:484-512`). Wszystkie authored punkty 1.10–4.80 oraz 100.10 mają pokrycie; dynamiczne 2.30, 3.80, 4.10 i 4.70 korzystają z prawdy domenowej. Jedyny null na mainline (`3.80/EARNED`) jest synchronicznym stanem przejściowym akceptowalnym, ponieważ claim dispatchuje zmianę punktu w tym samym callbacku.

Persistent practical tool knowledge należy do Y. Ordinary menu Małpy zawiera wyłącznie `JAK MI IDZIE?`, opcjonalne `CO TERAZ?` i `ZAMKNIJ`; acquisition oraz timed hints pozostają event-driven.

Runtime nie jest jednak bezpieczny pod względem ownership override. `setDialogueOverride` jest globalnym, bez-tokenowym setterem. Reliquary hint, mandatory communication, Intro i Tool Guidance mogą zastąpić override innego actora, a późniejsze `reset`/completion actora A bezwarunkowo wykonuje `setDialogueOverride(null)`, usuwając override actora B. Realny overlap istnieje po claim Astro w 3.80: acquisition czeka 5 s równolegle z reliquary hints i gameplayem tieru 2. Jest to **HIGH / FIX REQUIRED** i blokuje G6.

Dodatkowo dynamiczny długi objective 4.70 jest używany jako pojedynczoliniowy label w MENU/KNOWLEDGE. Hit/button width jest ograniczony do canvasu, ale `fillText` nie ma wrap/clip, więc tekst może wizualnie wyjść poza przycisk/panel. To narusza statyczny layout contract (**MEDIUM / FIX REQUIRED**).

Poprzedni audyt G5 pozostaje trafny dla: permanent history entry, CATEGORY/TOPIC separation, wspólnego mandatory contract, Y hierarchy i resetów lokalnego navigation state. Został zastąpiony w zakresie ordinary Monkey knowledge/contextów: CURRENT resolver nie posiada już Astro/Asterion ani context resolvera, a wyłącznie bieżący objective. Został też zastąpiony przez nowy Tool Guidance/acquisition lifecycle, Furnace entry w Y, either-hand claim i tool-equipped Monkey priority. G5 nie dowodzi bezpieczeństwa nowej współbieżności override.

# CURRENT OWNERSHIP MAP

| PRAWDA / DECYZJA | CURRENT OWNER | PROJECTION / CONSUMER | WYNIK |
| --- | --- | --- | --- |
| Kiedy i dlaczego komunikacja jest należna | Scenario effects + Director transitions | Intro, mandatory actors, Furnace intro, Tool Guidance callbacks | PASS |
| Co gracz ma zrobić teraz | Jedna instancja `createVrCurrentObjectiveProjection` | `createVrPlayerGuideProjection.getCurrentTask` i `createVrMonkeyKnowledgeResolver` | PASS |
| Faktyczny point/capabilities | `ExperienceDirector` / `RuntimeExperience` | Objective, Y, interactions | PASS |
| Karty/ringi | `progressionController` activated page IDs | objective 2.30/4.10/4.70, history | PASS |
| Shell progress | `createVrAstroFurnaceProgressionController` | objective 3.80 | PASS |
| Asterion production | `createVrAsterionProductionController` | objective 3.80 | PASS |
| Astro production | `createVrAstroAttractorProductionController` | Tool Guidance | PASS |
| Proto-Astro tuning | `createVrProtoAstroTuningController` | objective 4.70 | PASS |
| Trwała praktyczna wiedza Piec/Astro/Asterion | Y content + capability/reveal projection | Player Y | PASS |
| Ordinary Monkey knowledge | Current objective only | `CO TERAZ?` | PASS |
| Attention/message/ordinary UI mutable state | `createVrMonkeyGuide` | wszyscy communication actors | **FIX REQUIRED: brak lease/token ownership** |

Nie znaleziono drugiej mapy point → task ani ręcznego objective wyjątku poza projection. Fallback `Dokonaj wyboru.` istnieje w authored Y content, lecz przy polskiej mainline jest zastępowany projection; nie jest drugim runtime resolverem.

# COMMUNICATION ACTORS

| ACTOR | API | ZAKŁADA | USUWA | RESET/DISPOSE | KOLIZJA |
| --- | --- | --- | --- | --- | --- |
| Intro | `setDialogueOverride`, `showMessage`, `notifyAttention` | capture/options/pointer/glyph conversation | liczne bezwarunkowe `setDialogueOverride(null)` | reset czyści override/message; Guide reset na session end | Scenario-owo wczesny i zwykle wyłączny; API nadal bez ownership |
| Intro Crystal Tutorial | `setDialogueOverride(null)`, `showMessage` | nie zakłada własnego trwałego override | bezwarunkowo czyści | reset/dispose czyści message | może usunąć cudzy override, lecz authored sequencing ogranicza overlap |
| Mandatory post-ring | `notifyAttention`, `setDialogueOverride`, `open` | pusty lock ATTENTION/PLAYBACK | completion/reset: bezwarunkowy null | reset w baseline | authored point-exclusive, ale bez tokenu |
| Mandatory P2 | jak wyżej | jak wyżej | jak wyżej | jak wyżej | authored point-exclusive, ale Tool Guidance może nadal mieć pending/active state |
| Reliquary hints | `notifyAttention`, `setDialogueOverride`, `showMessage` | po timeout event + `showHint` | własny bool `ownsOverride`, lecz null jest globalny | reset czyści | **realny race z delayed acquisition/timed Tool Guidance** |
| Tool Guidance | `notifyAttention`, `cancelAttention`, mandatory actor | queue uruchamia globalny override | actor completion/reset bezwarunkowo null | reset/dispose czyści timers/queue/active actor | **realny race z Reliquary i każdym późniejszym ownerem** |
| Ordinary Knowledge | `open/close/showMessage` | nie używa override | close/reset sequence | reset/dispose | start Tool Guidance jest blokowany przez open/override; brak takeover ordinary menu — PASS |
| Astro acquisition | Tool Guidance descriptor po realnym `onClaimed` | po 5 s attention → click → playback | completion | lifecycle reset | event-driven PASS; override race FAIL |
| Asterion acquisition | analogicznie | analogicznie | analogicznie | analogicznie | event-driven PASS; override race FAIL |

Wzorzec `A zakłada → B zastępuje → A usuwa B` jest możliwy, ponieważ Guide przechowuje tylko jedną referencję `dialogueOverride`, nie identyfikator ownera. Przykład: Reliquary ustawia override i `ownsOverride=true`; Tool Guidance może następnie ustawić mandatory lock; zmiana fazy Reliquary wywołuje `clearOverride()` i usuwa bieżący mandatory lock. Odwrotna kolejność także jest możliwa przez completion/reset mandatory actora.

# CURRENT OBJECTIVE COVERAGE

W każdej pozycji `Y result` oraz `Monkey result` oznaczają ten sam `{id, body}` z jednej instancji projection. `pages(T)` = activated page IDs danego tieru; pozostałe źródła są nazwanymi domain owners.

| POINT | OBJECTIVE ID | OBJECTIVE BODY | SOURCE TRUTH | Y RESULT | MONKEY `CO TERAZ?` | STATUS |
| --- | --- | --- | --- | --- | --- | --- |
| 1.10 | `scenario-1.10` | KALIBRACJA XR | Director point | same | same | PASS |
| 1.20 | `scenario-1.20` | OBSERWUJ ŚWIAT | Director point | same | same | PASS |
| 1.30 | `scenario-1.30` | OBSERWUJ ŚWIAT | Director point | same | same | PASS |
| 1.40 | `scenario-1.40` | OTWÓRZ PANEL Y | Director point | same | same | PASS |
| 1.50 | `scenario-1.50` | OTWÓRZ: STEROWANIE | Director point | same | same | PASS |
| 1.60 | `scenario-1.60` | ZAMKNIJ PANEL Y | Director point | same | same | PASS |
| 1.70 | `scenario-1.70` | WSKAŻ MAŁPĘ | Director point | same | same | PASS |
| 1.80 | `scenario-1.80` | SPUST — MAŁPA | Director point | same | same | PASS |
| 1.90 | `scenario-1.90` | PODAJ KRYSZTAŁ MAŁPIE | Director point | same | same | PASS |
| 1.100 | `scenario-1.100` | WYBIERZ ODPOWIEDŹ | Director point | same | same | PASS |
| 1.110 | `scenario-1.110` | IDŹ ZA MAŁPĄ | Director point | same | same | PASS |
| 1.120 | `scenario-1.120` | PRÓG — WYBIERZ | Director point | same | same | PASS |
| 1.130 | `scenario-1.130` | WEJDŹ DO KRĘGU | Director point | same | same | PASS |
| 2.10 | `scenario-2.10` | ZDOBĄDŹ PIERWSZY KRYSZTAŁ | Director point | same | same | PASS |
| 2.20 | `scenario-2.20` | POROZMAWIAJ Z MAŁPĄ | Director point | same | same | PASS |
| 2.30 | `first-ring-progress` | PIERWSZY KRĄG — 0/5 … 5/5 | `pages(1)` | dynamic same | dynamic same | PASS |
| 2.40 | `scenario-2.40` | OBSERWUJ ZMIANĘ ŚWIATA | Director point | same | same | PASS |
| 3.10 | `scenario-3.10` | OBSERWUJ ZMIANĘ ŚWIATA | Director point | same | same | PASS |
| 3.20 | `scenario-3.20` | OBSERWUJ ZMIANĘ ŚWIATA | Director point | same | same | PASS |
| 3.30 | `scenario-3.30` | MAŁPA | Director point | same | same | PASS |
| 3.40 | `scenario-3.40` | PIEC | Director point | same | same | PASS |
| 3.50 | `scenario-3.50` | ASTROLABIUM WIĘZI — UTWÓRZ W PIECU | Director point | same | same | PASS |
| 3.60 | `scenario-3.60` | ASTROLABIUM WIĘZI — PRODUKCJA | Director point | same | same | PASS |
| 3.70 | `scenario-3.70` | ASTROLABIUM WIĘZI — ODBIERZ Z PIECA | Director point | same | same | PASS |
| 3.80 shells 0/6…6/6 | `asterion-shell-collection` | ZGROMADŹ SKORUPY — n/6 | Furnace progression owner | dynamic same | dynamic same | PASS |
| 3.80 READY | `asterion-build` | ZBUDUJ KULĘ ASTERIONOWĄ | Asterion production state | same | same | PASS |
| 3.80 BUILDING | `asterion-production` | KULA ASTERIONOWA — PRODUKCJA | Asterion production state | same | same | PASS |
| 3.80 AVAILABLE | `asterion-claim` | ODBIERZ KULĘ ASTERIONOWĄ | Asterion production state | same | same | PASS |
| 3.80 EARNED | — | — | claim callback immediately dispatches next point | null | no category | TRANSIENT_NULL_ACCEPTED |
| 4.10 | `second-ring-progress` | DRUGI KRĄG — 0/5 … 5/5 | `pages(2)` | dynamic same | dynamic same | PASS |
| 4.20 | `scenario-4.20` | OBSERWUJ ZMIANĘ ŚWIATA | Director point | same | same | PASS |
| 4.30 | `scenario-4.30` | OBSERWUJ ZMIANĘ ŚWIATA | Director point | same | same | PASS |
| 4.40 | `scenario-4.40` | OBSERWUJ ZMIANĘ ŚWIATA | Director point | same | same | PASS |
| 4.50 | `scenario-4.50` | MAŁPA | Director point | same | same | PASS |
| 4.60 | `scenario-4.60` | MAŁPA | Director point | same | same | PASS |
| 4.70 tuning 0/5…4/5 | `astro-tuning-and-third-ring` | DOSTRÓJ ASTROLABIUM — n/5 · TRZECI KRĄG — m/5 | tuning owner + `pages(3)` | dynamic same | dynamic same | PASS |
| 4.70 tuning 5/5, ring 0/5…5/5 | `third-ring-progress` | TRZECI KRĄG — m/5 | tuning owner + `pages(3)` | dynamic same | dynamic same | PASS |
| 4.80 | `third-ring-complete` | TRZECI KRĄG — 5/5 | `pages(3)`/stable authored point | same | same | PASS |
| 100.10 | `scenario-100.10` | KONIEC DOŚWIADCZENIA | Director point | same | same | PASS |

Projection correctly avoids point-only truth where a real substate exists. Caveat: 4.80 body hardcodes total/total rather than recounting activated pages; canonical hydration promises all five, so CURRENT authored/direct activation path is consistent.

# PLAYER Y AUDIT

- `MAIN_MENU → SECTION_DETAIL`, `MAIN_MENU → TOOL_LIST → TOOL_DETAIL` and Y-driven back chain are explicit. Footer is selected for every `VIEW_STATE`. **PASS**.
- Current task is the shared objective getter. **PASS**.
- Furnace appears from physical reveal (`astroFurnace.object.visible`) and does not grant capability. **PASS**.
- Astro and Asterion appear only from `CAN_EQUIP_ASTRO` / `CAN_EQUIP_ASTERION`; B is appended only with switch capability. **PASS**.
- Reconcile removes illegal tool detail/list views after projection changes. Reset clears navigation/open state. **PASS**.
- Direct activation/hydration restores Scenario capabilities and presentation owners before Director activation; projections are getter-based, not cached. **PASS**.
- English has no tools catalog/projection output; audit target copy/current runtime is PL. **OUT OF SCOPE** for future localization.

# MONKEY AUDIT

Ordinary root always contains `JAK MI IDZIE?`, optionally one `CO TERAZ?` category, plus fixed `ZAMKNIJ`. No Astro/Asterion persistent categories, tuning/how-to topics or legacy contexts are present. `CO TERAZ?` returns exactly one live objective topic or no root item, never an empty category. History resolves zero entries to an empty history screen with back navigation; positive entries use HISTORY → CARD flow. **PASS**.

UI invariants:

- No separator is drawn in MENU/KNOWLEDGE/HISTORY/CARD runtime; debug-only separator belongs to Y, not Monkey. **PASS**.
- Back/close button visual rectangle and hit region are the same object; width uses `max(navigationWidth, measured label + padding)`, so `ZAMKNIJ` fits and `←` retains minimum width. **PASS**.
- Navigation has fixed `navTop`; paged list capacity is computed above it. HISTORY/CARD navigation is separately placed. **PASS** for vertical partition under current settings; STATIC PASS / DEVICE QA RECOMMENDED.
- Pagination buttons occupy the fixed navigation row and are separated from back under current dimensions. **PASS**.
- Dynamic item labels use capped button width but unwrapped/unclipped `fillText`. The 4.70 combined objective can exceed both visual rectangle and canvas. **FIX REQUIRED (GRT-002)**.

# TOOL GUIDANCE AUDIT

## 180 s Astro production

Timer advances only while Scenario capability permits production and Astro state is `READY`. A transition out of READY resolves it. At expiry the stable ID is enqueued with a live relevance predicate. Pending/ATTENTION is discarded when state stops being READY; PLAYBACK intentionally continues after conscious click. **PASS**.

## 60 s Astro AVAILABLE

Starts on `onProduced` notification or semantic observation of `AVAILABLE`, resolves/cancels when state leaves AVAILABLE, and cannot remain stale after EARNED. **PASS**.

## Acquisition Astro / Asterion

Both originate only in the physical claim callback, not hydration. They wait 5 s, enqueue attention, require Monkey click, play the one-shot blocks, then complete without opening ordinary menu. Hydrated EARNED invokes no claim callback. **PASS** for event chain and reconstruction; **FAIL** only for shared override ownership.

## Queue

IDs are stable; active/pending deduplication exists; update order and array order are deterministic; stale pending and stale ATTENTION are canceled; ordinary open menu and any existing override block queue takeover. Playback is not relevance-canceled. Delayed acquisition descriptors themselves are not deduplicated, but each production controller makes only one physical EARNED transition per baseline, so no CURRENT duplicate event path was found. **PASS** for CURRENT mainline.

The queue does not arbitrate external actors after it owns attention/playback. **FIX REQUIRED (GRT-001)**.

# INTERACTION ACCESSIBILITY AUDIT

Monkey hit-testing deliberately uses controller pose even when the ordinary visible ray is hidden by an equipped tool. Monkey hit is fed into Astro shell/small/large `isHigherPriorityInteractionActive`; Asterion gyro receives `isInteractionBlocked` from the same hit. Priority is local to the actual Monkey/panel hit and does not globally disable tools elsewhere.

| HAND MODES | TARGET MONKEY | TARGET PANEL | CLICK ATTENTION | ORDINARY MENU | `CO TERAZ?` | `JAK MI IDZIE?` | RESULT |
| --- | --- | --- | --- | --- | --- | --- | --- |
| both NORMAL | yes | yes when open | yes | yes | yes if objective | yes | STATIC PASS / DEVICE QA RECOMMENDED |
| Astro equipped only | yes, pose raycast independent of visible ray | yes | yes | yes | yes if objective | yes | STATIC PASS / DEVICE QA RECOMMENDED |
| Asterion equipped only | yes | yes | yes; gyro trigger blocked over Monkey/panel | yes | yes if objective | yes | STATIC PASS / DEVICE QA RECOMMENDED |
| Astro + Asterion | yes from either controller | yes | yes | yes | yes if objective | yes | STATIC PASS / DEVICE QA RECOMMENDED |

Monkey beats Astro and Asterion gyro only while `hasCurrentHit(record)` is true. Ordinary world interactions also test Monkey hit as a higher-priority target. No global tool disable was found. **PASS**.

# RESET / HYDRATION AUDIT

- Normal session end restores Scenario baseline, resets Tool Guidance before Monkey, then resets Intro/tutorial; timers, queue, local objective-free resolver state, attention and navigation are cleared. **PASS**, subject to GRT-001 during live operation.
- Debug activation calls restore baseline, `stateAt`, owner hydration, derived synchronization, Director replacement and entry effects. Objective and Y tools are computed from hydrated owners/capabilities. **PASS**.
- Hydrated Astro/Asterion `EARNED` sets domain state directly and does not invoke `onClaimed`, so acquisition is not replayed. **PASS**.
- XR session end and pagehide dispose Tool Guidance/Monkey and domain subscriptions/timers. **PASS**.
- Objective resolver stores no history; both Y and Monkey read current truth on demand. **PASS**.
- Actor-local resets do not safely distinguish their own override from another actor's override. **FIX REQUIRED (GRT-001)**.

# COPY OWNERSHIP AUDIT

| COPY CLASS | OWNER | CURRENT RUNTIME SOURCE | RESULT |
| --- | --- | --- | --- |
| Mandatory progression | canonical catalog / dedicated progression actors | `vrMonkeyCommunicationCopy.js` + Intro/mandatory/Furnace actors | PASS |
| Contextual/timed hints | Tool Guidance / Reliquary hint projection | `vrMonkeyCommunicationCopy.js` hint entries | PASS |
| Acquisitions | Tool Guidance lifecycle | `vrMonkeyCommunicationCopy.js.acquisition` | PASS |
| Current objective | Current Objective projection | `createVrCurrentObjectiveProjection.js` | PASS; shared rendering is intentional |
| Persistent Y tool knowledge | Y content | `vrPlayerGuideContent.js` | PASS |

The practical facts about Furnace/Astro/Asterion also appear in situational hints/acquisition narrative, but not as competing persistent reference maps: their triggers and purposes differ. No second source can independently determine current objective. Canonical communication docs retain pre-migration statements about persistent Monkey Astro/Asterion knowledge and are historical/documentation drift relative to CURRENT runtime; they are not a second active runtime truth.

# DEAD CODE / CLEANUP

1. **CLEANUP GRT-C01:** `VR_EXPERIENCE_SCENE` compatibility alias has no consumer in `src`.
2. **CLEANUP GRT-C02:** `getCurrentSceneId()` aliases in `ExperienceDirector` and `RuntimeExperience` have no consumer in `src`.
3. **CLEANUP GRT-C03:** public `notifyAstroAvailable()` is both explicitly called and redundantly derivable in `update()` from `AVAILABLE`; not harmful, but the dual ingress is unnecessary compatibility/residue.
4. Dormant P3 copy entries are authored future content and **OUT OF SCOPE**, not dead CURRENT runtime evidence.
5. G5 references to `createVrMonkeyGuidanceContextResolver`, ONCE/CONTEXTUAL runtime policies and Astro optional category are superseded: those modules/policies are absent from CURRENT audited runtime. This is snapshot history, not current dead code.

# FINDINGS

| ID | SEVERITY | STATUS | OWNER | PROBLEM | EVIDENCE | RECOMMENDED ACTION |
| --- | --- | --- | --- | --- | --- | --- |
| GRT-001 | HIGH | FIX REQUIRED | Monkey Guide / communication actor composition | Global override/attention has no owner token; one actor can replace another and later clear the replacement. Real overlap exists between 5 s acquisition Tool Guidance and Reliquary hint lifecycle at 3.80. This can drop mandatory click routing, leave an actor in PLAYBACK/ATTENTION without its handler, or expose ordinary UI at the wrong time. | `createVrMonkeyGuide.js:672-680`; `createVrMandatoryMonkeyCommunication.js:9-37`; `createVrReliquaryHints.js:11-32`; `createVrToolGuidanceLifecycle.js:29-53,74-148`; `experienceVr.js:349-350,479-481,685-689` | Introduce explicit lease/token or a single arbiter/queue for override + attention; release/cancel only when caller still owns the lease. Integrate Reliquary/mandatory/Tool Guidance under that contract. |
| GRT-002 | MEDIUM | FIX REQUIRED | Monkey renderer | MENU/KNOWLEDGE dynamic label width is capped, while text is drawn as one unbounded line. Long 4.70 objective violates content-within-button/panel geometry and makes visual width differ from effective rendered content width. | `createVrMonkeyGuide.js:328-346,450-456`; `createVrCurrentObjectiveProjection.js:50-55` | Add bounded wrapping/pagination/clip semantics for dynamic list labels while preserving matching visual/hit rectangles. |
| GRT-C01 | — | CLEANUP | Scenario vocabulary | Unused `VR_EXPERIENCE_SCENE` compatibility alias. | `vrExperienceScenario.js:217-218`; no `src` consumer | Remove only in a future bounded cleanup after confirming external consumers. |
| GRT-C02 | — | CLEANUP | Director/Runtime | Unused `getCurrentSceneId()` aliases. | `ExperienceDirector.js:187`; `RuntimeExperience.js:48`; no `src` consumer | Remove only in a future bounded cleanup after confirming external consumers. |
| GRT-C03 | — | CLEANUP | Tool Guidance | Redundant explicit/public AVAILABLE notification plus semantic polling. | `createVrToolGuidanceLifecycle.js:59-62,102,151`; `experienceVr.js:479` | Consolidate to one ingress in a future cleanup; no runtime urgency. |

No CRITICAL finding was identified. No point-coverage MISSING/WRONG finding was identified.

# G6 READINESS

## NOT READY FOR G6

Minimal ordered FIX REQUIRED queue:

1. **GRT-001 — HIGH:** establish enforceable ownership/arbitration for Monkey override + attention and route all audited actors through it.
2. **GRT-002 — MEDIUM:** bound/wrap dynamic Monkey list labels, especially combined 4.70 objective, without changing objective ownership/copy.

Poza tą kolejką nie należy mieszać cleanup residue z runtime fixes.
