# EXPERIENCE VR — GUIDANCE RUNTIME AUDIT

2026-08-24

## STATUS

**CURRENT RUNTIME AUDIT / POST G1–G4**

Audyt opisuje stan runtime po G1–G4 oraz dwa jednoznaczne cleanup findings zamknięte w G5. Nie jest synchronizacją canonical docs; G6 pozostaje osobnym zadaniem.

## SCOPE

Zakres obejmuje wyłącznie CURRENT Guidance: menu Małpy, knowledge lifecycle i current-context projection, mandatory communication seam, Panel Y, progressive controls, reconstruction/direct activation oraz reset. Gameplay, sequencing, copy, P3+ i canonical documentation nie były modyfikowane.

Audyt jest statyczny zgodnie z kontraktem G5. Nie uruchamiano aplikacji, testów, lintowania, buildu, browser QA, screenshot QA ani hardware QA.

## CURRENT ARCHITECTURE

- `createVrMonkeyGuide` jest właścicielem ekranów, bounded list rendering, paginacji, zaznaczenia i transient read/sequence state UI.
- `createVrMonkeyKnowledgeResolver` rozdziela stabilne CATEGORY/TOPIC IDs, projektuje aktywne topics z policy, current context i session read state; nie posiada gameplay progression.
- `createVrMonkeyGuidanceContextResolver` jest bezstanową projekcją Scenario capabilities oraz bieżącej prawdy Asterion/Proto-Astro.
- `createVrMandatoryMonkeyCommunication` blokuje ordinary Guidance pomiędzy attention i końcem playbacku.
- `createVrPlayerGuideProjection` projektuje task, trwałe tool references i widoczność A/X/B; `createVrPlayerGuidePanel` posiada hierarchię oraz navigation state Panelu Y.
- `RuntimeExperience.activatePoint()` korzysta z canonical `stateAt`/hydrate lifecycle przed utworzeniem Directora; Guidance odczytuje zrekonstruowane capabilities i owner truth przez composition wiring w `experienceVr.js`.

## AUDIT MATRIX

| OBSZAR | EXPECTED | CURRENT | STATUS | EVIDENCE / OWNER | ACTION |
| --- | --- | --- | --- | --- | --- |
| A. MONKEY ROOT | Permanentne `JAK MI IDZIE?`, CATEGORY `CO TERAZ?`, opcjonalne aktywne kategorie i fixed `ZAMKNIJ`; bez persistent HOW-TO i martwych pustych kategorii | `CO TERAZ?` i `ZAMKNIJ` były poprawne, optional `category.astro` istnieje tylko przy aktywnym topicu; `JAK MI IDZIE?` było błędnie ukrywane przy 0 kartach | FIXED | `createVrMonkeyGuide.drawDialogue/activateOption`; `createVrMonkeyKnowledgeResolver.availableCategories` | Usunięto gating `progressCount() > 0`; History jest osiągalne również jako pusty permanentny screen |
| B. CATEGORY / TOPIC | Osobne semantics, category bez blocks/completion, stabilne IDs, listy tylko projekcją | Kategorie pochodzą z osobnego katalogu i otwierają group; tylko `knowledge:*` uruchamia blocks i `completeTopic(topic.id)` | PASS | `vrMonkeyCommunicationCopy.js`; `createVrMonkeyKnowledgeResolver`; `createVrMonkeyGuide.activateOption` | Bez zmian |
| C. LIST SAFETY | Bounded content, fixed nav, pagination, wyłącznie widoczne hit regions, clamp/reset indices | Root i knowledge używają `drawPagedList`; content kończy się nad fixed nav; regions powstają z widocznego slice i aktywnych pagerów; page jest clampowany, wejście/wyjście/reset zeruje indices | PASS | `createVrMonkeyGuide.drawPagedList`, `drawKnowledge`, `setOpen`, `reset` | Bez zmian |
| D. TOPIC LIFECYCLE | ONCE archiwizuje się dopiero po completion; CONTEXTUAL śledzi context; bez archive UI i persistent HOW-TO; martwe `PERSISTENT` usunięte | Completion następuje wyłącznie w callbacku pełnej sekwencji; anulowanie resetuje sekwencję; żaden runtime topic nie używał `PERSISTENT`, lecz enum pozostał | FIXED | `createVrMonkeyProgressionMessage` seam w `createVrMonkeyGuide`; `createVrMonkeyKnowledgeResolver.getLifecycle`; `VR_MONKEY_COMMUNICATION_COPY_PL.knowledge` | Usunięto martwą wartość `PERSISTENT`; zachowano wspólny aktywny branch READ wymagany przez CONTEXTUAL |
| E. CURRENT GUIDANCE — CO TERAZ? | Shell context tylko Astro available + Asterion `LOCKED`; P2 tylko wymagane capabilities + zero extracted families; brak lokalnego progression store/point comparisons; category także pusta | Resolver odczytuje capability, production state i `getExtractedFamilyCodes`; zwraca `NONE` po semantic completion; `category.whatNow` jest bezwarunkowa; brak `hasP2Knowledge` i mutable state | PASS | `createVrMonkeyGuidanceContextResolver`; wiring w `experienceVr.js`; Asterion production i Proto-Astro tuning owners | Bez zmian |
| F. MONKEY ONCE / NARRATIVE | `astro.why` i `bandSwitch` ONCE; `astro.next` i P2 current guidance CONTEXTUAL; intro/threshold bez zmian | Policies i context IDs są zgodne; resolver runtime ogranicza scope do Astro/P2, więc intro/threshold copy i dialog flows nie zostały naruszone przez G1–G4 | PASS | `vrMonkeyCommunicationCopy.js`; `createVrMonkeyKnowledgeResolver` | Bez zmian; copy nie redagowano |
| G. HISTORY / CARD | Osobne screens, własna paginacja/nav i ownership | HISTORY/CARD mają odrębne page indices, renderery i controls; knowledge używa `knowledgePage` i `drawPagedList` | PASS | `createVrMonkeyGuide.drawHistory`, `drawCardNavigation`, `drawKnowledge` | Bez zmian |
| H. MANDATORY MONKEY COMMUNICATION | Attention bez copy; trigger konsumowany; ordinary UI ukryte; menu po finalnym block; aktywne 3.30 i 4.50–4.60 | Attention zakłada pusty override; Monkey press przełącza do PLAYBACK i zwraca consumed; override znika dopiero w completion; oba flows są w Scenario/composition | PASS | `createVrMandatoryMonkeyCommunication`; `vrExperienceScenario.js`; handlers w `experienceVr.js` | Bez zmian sequencing/copy |
| I. PANEL Y ROOT | `STEROWANIE`, `AKTUALNE ZADANIE`, `NARZĘDZIA` | Dwa stałe items pochodzą z content, `NARZĘDZIA` jest dynamicznie dopinane przy dostępnych tools | PASS | `vrPlayerGuideContent.js`; `createVrPlayerGuidePanel.resolveItems` | Bez zmian |
| J. PANEL Y TOOLS HIERARCHY | MAIN_MENU → TOOL_LIST → TOOL_DETAIL; IDs; Y back chain; X open; reconcile/reset safety | `VIEW_STATE`, `activeToolId` i `selectedToolIndex` realizują kontrakt; identity opiera się na `astro`/`asterion`; reconcile cofa nielegalny detail; reset czyści state | PASS | `createVrPlayerGuidePanel` | Bez zmian |
| K. TOOL OWNERSHIP | Y jako jedyna trwała pamięć Astro/Asterion; brak importu Y → Monkey copy i persistent whatIsIt | Tool description/controls są authored lokalnie w `vrPlayerGuideContent`; Monkey ma jedynie narrative ONCE/current CONTEXTUAL topics; brak whatIsIt runtime | PASS | `vrPlayerGuideContent.js`; `createVrPlayerGuideProjection`; `vrMonkeyCommunicationCopy.js` | Bez zmian |
| L. PROGRESSIVE CONTROLS A/X/B | A po Astro capability, X po Asterion capability, B po switch capability w detail i controller map | Tool list oraz A/X visibility używają equip capabilities; linia B i B visibility używają `CAN_SWITCH_ASTRO_BAND` | PASS | `createVrPlayerGuideProjection.getTools/getVisibleControlIds` | Bez zmian |
| M. DIRECT ACTIVATION / RECONSTRUCTION | Guidance projektuje aktualne capabilities/domain/reconstructed truth; bez QA wyjątków i transient read reconstruction | `activatePoint` wykonuje baseline → `stateAt` → hydrate → synchronize → Director activation; projection callbacks odczytują aktualnych ownerów; transient knowledge read pozostaje session-local | PASS | `RuntimeExperience.activatePoint`; `reconstructVrScenarioState`; `hydrateVrScenarioState`; lifecycle wiring w `experienceVr.js` | Bez zmian canonical reconstruction |
| N. RESET SEMANTICS | Pełny reset Monkey, Panel Y i bezstanowy context resolver | Monkey close/reset zeruje screens, selected IDs, pagination, sequence i read set; Panel Y reset zeruje view/indices/active IDs i zamyka panel; context resolver nie ma mutable state | PASS | `createVrMonkeyGuide.reset/setOpen`; `createVrPlayerGuidePanel.reset`; `createVrMonkeyGuidanceContextResolver` | Bez zmian |
| O. DEAD DEPENDENCIES / LEFTOVERS | Brak jednoznacznie martwych pozostałości G1–G4 | Znaleziono martwy `PERSISTENT`; nie znaleziono starych `hasP2Knowledge`, `hasAsterionKnowledge`, `root` metadata, label identity, zbiorczego tools renderingu ani Y → Monkey-copy importu | FIXED | Repozytoryjne statyczne wyszukanie w `src/xr/guidance` i `src/experienceVr.js` | Usunięto wyłącznie martwą policy value |
| Poza G5 | Bez P3+, gameplay redesign i G6 | Dormant authored P3 copy nie zostało włączone ani zmienione; canonical docs pozostają niesynchronizowane do G6 | OUT OF SCOPE | Scenario boundary i `vrMonkeyCommunicationCopy.js`; migration plan G6 | Bez zmian |

## MIGRATION LEFTOVERS FOUND

1. Root renderował `JAK MI IDZIE?` wyłącznie przy `progressCount() > 0`, mimo że kontrakt G1–G4 ustanawia ten entry jako permanentny.
2. `VR_MONKEY_KNOWLEDGE_POLICY.PERSISTENT` pozostało w enumie, chociaż po G4 żaden runtime topic nie używa tej policy. Nie znaleziono branchu wyłącznie dla `PERSISTENT`: zachowanie READ dla policy innej niż ONCE nadal obsługuje aktywny CONTEXTUAL topic po przeczytaniu.

Nie znaleziono innych jednoznacznych pozostałości G1–G4 wymagających runtime diffu.

## FIXES APPLIED

- Root zawsze projektuje `JAK MI IDZIE?`; aktywacja prowadzi do istniejącego History również przy pustej kolekcji.
- Enum knowledge policy zawiera wyłącznie faktycznie używane `ONCE` i `CONTEXTUAL`.

Każdy runtime diff odpowiada powyższemu findingowi. Nie dodano copy, contextów, controls, sequencing, gameplayu ani architecture layer.

## UNCHANGED CONTRACTS

- CATEGORY/TOPIC separation, bounded list navigation i pagination.
- ONCE/CONTEXTUAL completion semantics oraz brak knowledge archive UI.
- Current-context resolver oparty na capabilities i domain truth.
- History/Card ownership i navigation.
- Mandatory communication dla 3.30 oraz 4.50–4.60.
- Panel Y root, tools hierarchy, trwałe tool ownership i progressive A/X/B.
- Canonical direct activation/reconstruction oraz reset ownership.

## KNOWN LIMITATIONS / QA PENDING

- Audyt jest wyłącznie statyczny; zgodnie z zakresem G5 nie wykonano browser, screenshot, WebXR ani hardware/perceptual QA.
- Istniejące hardware/perceptual QA pending dla P2 pozostaje niezmienione i nie jest blokadą cleanupu G5.
- Canonical communication docs nadal opisują przedmigracyjne `PERSISTENT`/whatIsIt i przykładowe menu; ta oczekiwana rozbieżność należy do G6, nie do runtime G5.

## G6 HANDOFF

Canonical docs wymagające synchronizacji po G5:

- `docs/current/concept/EXPERIENCE_VR_COMMUNICATION_MECHANICS.md`;
- `docs/current/concept/EXPERIENCE_VR_PLAYER_COMMUNICATION_COPY.md`;
- `docs/current/concept/EXPERIENCE_VR_NARRATIVE_PROGRESSION_BASELINE.md`;
- `docs/current/technical/VR_RUNTIME_MODEL.md` w sekcjach Guidance;
- `docs/current/handoffs/EXPERIENCE_VR_HANDOFF.md`, jeżeli opisuje te surfaces;
- `docs/current/maps/PROJECT_INDEX.md`;
- `docs/current/maps/DEPENDENCY_MAP.md`, jeżeli wymaga aktualizacji ownership/dependencies;
- `docs/current/decisions/DECISION_LOG.md` wyłącznie dla wiążących decyzji wymagających zapisu;
- migration record `EXPERIENCE_VR_MONKEY_GUIDANCE_MIGRATION_PLAN_2026-08-24.md` po zakończeniu synchronizacji.

CURRENT runtime facts do zapisania przez G6:

- permanentny root `JAK MI IDZIE?`, permanentna CATEGORY `CO TERAZ?`, opcjonalna aktywna kategoria Astro oraz fixed `ZAMKNIJ`;
- osobne CATEGORY/TOPIC, bounded paginated listy i fixed navigation;
- wyłącznie policies `ONCE` i `CONTEXTUAL`, completion po pełnej sekwencji i brak archive UI;
- semantic current contexts `ASTERION_SHELL_COLLECTION` oraz `P2_ASTRO_TUNING` oparte na capabilities/domain truth;
- Panel Y jako jedyna trwała praktyczna pamięć Astro/Asterion, hierarchia MAIN_MENU → TOOL_LIST → TOOL_DETAIL i capability-driven A/X/B;
- niezmieniony mandatory communication contract oraz projection/reconstruction/reset ownership.
