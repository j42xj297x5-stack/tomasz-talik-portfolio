# EXPERIENCE VR — FINAL SCENARIO / DIRECTOR SEPARATION AUDIT

**Audit date:** 2026-08-13  
**Checkout:** `a7cb964` (`work`) before this report  
**Method:** adversarial, bidirectional code audit; previous M1 summaries were treated only as leads.

## 1. Executive verdict

- **Verdict: FAIL.**
- **Czy migracja ownershipu jest zakończona? Nie.** The M1.1–M1.17 Intro/P0 slice is demonstrably routed through Scenario → Director → RuntimeExperience, but currently implemented progression after the first-crystal/reliquary handoff still contains production decisions and direct effects in `experienceVr.js` and the contextual reliquary-hint subsystem.
- The strongest counterexamples are the card-commit fan-out, Tier-1 world/tool unlocks, ambient selection, reliquary availability gates and the 15-second direct Monkey hint. Evidence: `syncAmbientSequence`, `syncTierOneWorldState` and hand-mode gates (`src/experienceVr.js:285-309`), crystal `onCommit` (`src/experienceVr.js:420-428`), reliquary gates (`src/experienceVr.js:442-461`) and `createVrReliquaryHints.update` (`src/xr/guidance/createVrReliquaryHints.js:11-24`).
- The Director is the sole current-point owner for the migrated slice (`src/xr/progression/ExperienceDirector.js:66-118`); no second production copy of the numeric Scenario point ID was found. This does **not** cure the separate post-P0 progression graph encoded by domain reads and callbacks.

## 2. Audited scope

### Documents read

In the required order: `PROJECT_ENTRY.md`; `docs/current/maps/PROJECT_INDEX.md`; `docs/current/technical/VR_SCENARIO_DIRECTOR_MODEL.md`; `docs/current/technical/VR_RUNTIME_MODEL.md`; `docs/current/handoffs/EXPERIENCE_VR_HANDOFF.md`; the complete `docs/current/audits/progression/EXPERIENCE_VR_SCENARIO_MIGRATION_AUDIT_2026-08-12.md`; `docs/current/decisions/DECISION_LOG.md`; and `docs/current/maps/DEPENDENCY_MAP.md`. The Project Index also routed the audit to `docs/current/concept/EXPERIENCE_VR_NARRATIVE_PROGRESSION_BASELINE.md`, which was read to distinguish current mechanical progression from future narrative.

The canonical documents lag current code: the handoff says Scenario authority ends at `1.130`, whereas current Scenario metadata states M1.17 and has live points through `1.170` (`src/xr/progression/vrExperienceScenario.js:321-420`). That status conflict was not resolved by editing canonical documents; code was used as implementation evidence.

### Runtime and tests

- Manually traced all JavaScript under `src/xr/**`, with detailed state-machine review of Intro, crystal/reliquary/glyph, progression/floor, hand/tool, shell, furnace, Asterion, Monkey/Player Guide, locomotion, audio, calibration and lifecycle code.
- Manually traced all of `src/experienceVr.js` (composition, callbacks, frame update, XR entry/exit/failure and disposal). Outside `src/xr/**`, `src/main.js` is the only other `src/**` importer of XR code; it only performs mode/capability entry routing, not VR story progression (`src/main.js:1-203`).
- Reviewed `package.json`, every `tests/vr-*.test.mjs`, `tests/runtime-experience.test.mjs`, `tests/experience-vr-contract.test.mjs`, and the directly relevant progression/controller tests.
- Excluded `docs/legacy/**` as authority, future/not-implemented roadmap systems, generated build output and asset geometry/data that contains no decisions. No production code, tests or canonical documents were changed.

## 3. Canonical ownership model used for audit

- **Scenario:** authored answer to what happens and explicit story/progression order.
- **ExperienceDirector:** sole current point, event acceptance, explicit target, transition milestones/capabilities/effects.
- **RuntimeExperience:** dispatches to Director and executes injected symbolic-effect handlers (`src/xr/progression/RuntimeExperience.js:1-25`).
- **Actor:** sensing, time, motion, animation, visibility implementation and local execution state.
- **Domain controller:** truth and invariants of its own cards/tiers, furnace materials/process, production or hand/tool domain.
- **Composition root:** construction, fact/event wiring, effect/continuation wiring and lifecycle only.
- **QA:** explicit non-production bootstrap/shortcut may synthesize state, but is not production authority.

Classifications used below are `MECHANICAL_STATE_OK`, `DOMAIN_TRUTH_OK`, `QA_ADAPTER_OK`, `SCENARIO_DECISION_OK`, `LEGACY_DECISION_OWNER`, `DUPLICATED_STORY_STATE`, `DIRECT_EFFECT_BYPASS` and `AMBIGUOUS`.

## 4. Current Scenario graph

All 22 identifiers in `VR_EXPERIENCE_POINT` are LIVE Scenario identifiers; unlike vocabulary-only events/effects, every listed point occurs in `points` (`src/xr/progression/vrExperienceScenario.js:116-139,144-380`). `1.90` is not in the production identifier set.

| Point | Capabilities | Accepted transition(s) |
| --- | --- | --- |
| `1.10` | — | `XR_CALIBRATED → 1.20` + `BEGIN_INTRO_REVEAL` |
| `1.20` | — | `INTRO_REVEAL_COMPLETE → 1.30` + `BEGIN_POST_REVEAL_SILENCE` |
| `1.30` | — | `POST_REVEAL_SILENCE_COMPLETE → 1.40` + `BEGIN_CONTROLLER_ONBOARDING` |
| `1.40` | — | `PLAYER_OPENED_GUIDE → 1.50` + `CONTINUE_CONTROLLER_ONBOARDING` |
| `1.50` | — | `PLAYER_VIEWED_CONTROLS → 1.60` + same continuation |
| `1.60` | — | `PLAYER_CLOSED_GUIDE → 1.70` + same continuation |
| `1.70` | — | `MONKEY_HOVERED → 1.80` + same continuation |
| `1.80` | — | `MONKEY_TRIGGERED → 1.100` + same continuation |
| `1.100` | — | invitation choices `1→1.110`, `2→1.100.1`, `3→100.10` + `CONTINUE_INTRO_INVITATION` |
| `1.100.1` | — | same choices, including choice-2 self-loop |
| `1.110` | — | `FOLLOW_PAUSE_CHANGED → 1.110.1`; `MONKEY_REACHED_THRESHOLD → 1.120` |
| `1.110.1` | — | `FOLLOW_PAUSE_CHANGED → 1.110` |
| `1.120` | — | threshold choices `1→1.130`, `2→1.120.1`, `3→100.10` |
| `1.120.1` | — | same choices, including choice-2 self-loop |
| `1.130` | — | `PLAYER_ENTERED_RING→1.130.1`; `MONKEY_SETTLED→1.130.2` |
| `1.130.1` | — | `MONKEY_SETTLED→1.140` + `BEGIN_GLYPH_FREE_EXPLORE` |
| `1.130.2` | — | `PLAYER_ENTERED_RING→1.140` + `BEGIN_GLYPH_FREE_EXPLORE` |
| `1.140` | `CAN_USE_GLYPHS` | `GLYPH_HINT_TIMEOUT→1.150`; `FIRST_CRYSTAL_DISCOVERED→1.160` |
| `1.150` | `CAN_USE_GLYPHS` | `FIRST_CRYSTAL_DISCOVERED→1.160` |
| `1.160` | — | `RELIQUARY_REVEAL_COMPLETED→1.170` + `COMPLETE_RELIQUARY_REVEAL` |
| `1.170` | `CAN_USE_GLYPHS` | terminal for the current authored slice |
| `100.10` | — | LIVE terminal exit |

The exact declarative transitions are at `src/xr/progression/vrExperienceScenario.js:144-380`. Director selects only an explicit target and never derives order from IDs (`src/xr/progression/ExperienceDirector.js:81-100`): `SCENARIO_DECISION_OK`.

## 5. Semantic event matrix

Only events actually used by a transition are listed as LIVE below. The remaining declared names at `src/xr/progression/vrExperienceScenario.js:22-54` are vocabulary reservations, not implemented Scenario event routes.

| EVENT | PRODUCER (physical/domain fact) | DISPATCH LOCATION | ACCEPTED AT | SECOND OWNER FOUND? | VERDICT |
| --- | --- | --- | --- | --- | --- |
| `XR_CALIBRATED` | XR reference-space calibration in root (`experienceVr.js:638-649`) | `experienceVr.js:648` | `1.10` | No | `SCENARIO_DECISION_OK` |
| `INTRO_REVEAL_COMPLETE` | fog progress reaches 1 (`createVrIntroSequence.js:154-157`) | adapter `experienceVr.js:526` | `1.20` | No | `SCENARIO_DECISION_OK` |
| `POST_REVEAL_SILENCE_COMPLETE` | actor’s 2 s elapsed fact (`createVrIntroSequence.js:157`) | `experienceVr.js:527` | `1.30` | No | `SCENARIO_DECISION_OK` |
| `PLAYER_OPENED_GUIDE` | Player Guide `isOpen()` (`createVrIntroSequence.js:159`) | `experienceVr.js:528` | `1.40` | No | `SCENARIO_DECISION_OK` |
| `PLAYER_VIEWED_CONTROLS` | panel section/detail fact (`createVrIntroSequence.js:160`) | `experienceVr.js:529` | `1.50` | No | `SCENARIO_DECISION_OK` |
| `PLAYER_CLOSED_GUIDE` | panel closed fact (`createVrIntroSequence.js:161`) | `experienceVr.js:530` | `1.60` | No | `SCENARIO_DECISION_OK` |
| `MONKEY_HOVERED` | real Monkey override hit (`createVrIntroSequence.js:76`) | `experienceVr.js:531` | `1.70` | No | `SCENARIO_DECISION_OK` |
| `MONKEY_TRIGGERED` | real Monkey press (`createVrIntroSequence.js:76`) | `experienceVr.js:532` | `1.80` | No | `SCENARIO_DECISION_OK` |
| `INTRO_INVITATION_SELECTED` | actor maps stable UI IDs to numeric choice (`createVrIntroSequence.js:48-50,77`) | `experienceVr.js:533` | `1.100`, `1.100.1` | Actor does not select target | `SCENARIO_DECISION_OK` |
| `FOLLOW_PAUSE_CHANGED` | actor-local distance/grace fact (`createVrIntroSequence.js:162-169`) | `experienceVr.js:534` | `1.110`, `1.110.1` | No; payload controls execution only | `SCENARIO_DECISION_OK` |
| `MONKEY_REACHED_THRESHOLD` | physical radius reached (`createVrIntroSequence.js:171-176`) | `experienceVr.js:535` | `1.110` | No | `SCENARIO_DECISION_OK` |
| `THRESHOLD_SELECTED` | stable actor choice mapping (`createVrIntroSequence.js:49-50,105`) | `experienceVr.js:536` | `1.120`, `1.120.1` | Actor waits for Runtime | `SCENARIO_DECISION_OK` |
| `PLAYER_ENTERED_RING` | head-radius sensing, emitted once (`createVrIntroSequence.js:54-58`) | `experienceVr.js:537` | `1.130`, `1.130.2` | Local boolean is once-only domain/mechanical fact, not join authority | `SCENARIO_DECISION_OK` |
| `MONKEY_SETTLED` | final-turn elapsed/mechanical settle (`createVrIntroSequence.js:184-187`) | `experienceVr.js:538` | `1.130`, `1.130.1` | Local boolean prevents re-emission only | `SCENARIO_DECISION_OK` |
| `GLYPH_HINT_TIMEOUT` | 60 s actor timer (`createVrIntroSequence.js:188`) | `experienceVr.js:539` | `1.140` | No; actor waits for `SHOW_GLYPH_HINT` | `SCENARIO_DECISION_OK` |
| `FIRST_CRYSTAL_DISCOVERED` | first successful `spawnOne` (`experienceVr.js:487-498`) | `experienceVr.js:496` | `1.140`, `1.150` | No second discovery continuation | `SCENARIO_DECISION_OK` |
| `RELIQUARY_REVEAL_COMPLETED` | 3 s reveal actor timer (`createVrIntroSequence.js:189-190`) | `experienceVr.js:540` | `1.160` | No | `SCENARIO_DECISION_OK` |

The unused vocabulary creates no active bypass by itself, but it is not evidence that card/tier/furnace facts are migrated: `CARD_COMMITTED`, `TIER_COMPLETED`, furnace and Asterion names have no transition and no production dispatch.

## 6. Symbolic effect matrix

All effects used by live transitions are handled exactly once in the `RuntimeExperience` map (`src/experienceVr.js:559-621`). Declared but unused `SHOW_GUIDE_PROMPT`, `START_MONKEY_FOLLOW`, `REVEAL_SHELL_FIELD`, `REVEAL_FURNACE`, `PRESENT_ASTERION` and `SHOW_ASTERION_EARNED_CUE` (`vrExperienceScenario.js:95-114`) have no live transition/handler and are not claimed as migrated.

| EFFECT | EMITTED BY TRANSITION | RUNTIME HANDLER | ACTOR/CONTROLLER CONTINUATION | DIRECT BYPASS FOUND? | VERDICT |
| --- | --- | --- | --- | --- | --- |
| `BEGIN_INTRO_REVEAL` | `1.10→1.20` | `experienceVr.js:562-565` | `introSequence.beginAfterXrCalibration` | No production call elsewhere | OK |
| `BEGIN_POST_REVEAL_SILENCE` | `1.20→1.30` | `experienceVr.js:566-570` | `beginPostRevealSilence` | No | OK |
| `BEGIN_CONTROLLER_ONBOARDING` | `1.30→1.40` | `experienceVr.js:571-575` | `beginControllerOnboarding` | No | OK |
| `CONTINUE_CONTROLLER_ONBOARDING` | five onboarding edges | `experienceVr.js:576-580` | guarded `continueControllerOnboarding` | No | OK |
| `CONTINUE_INTRO_INVITATION` | invitation choice edges | `experienceVr.js:581-585` | `continueInvitation(choice)` | No | OK |
| `APPLY_FOLLOW_PAUSE_STATE` | pause/resume edges | `experienceVr.js:586-590` | `continueFollowPauseChanged(paused)` | No | OK |
| `PRESENT_THRESHOLD_CHOICE` | `1.110→1.120` | `experienceVr.js:591-595` | `presentThresholdChoice` | No | OK |
| `CONTINUE_THRESHOLD_CHOICE` | threshold choice edges | `experienceVr.js:596-600` | `continueThresholdChoice(choice)` | No | OK |
| `BEGIN_GLYPH_FREE_EXPLORE` | either ring/settle join edge | `experienceVr.js:601-605` | `beginGlyphFreeExplore` | No; old local conjunction is gone | OK |
| `SHOW_GLYPH_HINT` | `1.140→1.150` | `experienceVr.js:606-610` | `showGlyphHint` | No | OK |
| `REVEAL_RELIQUARY` | discovery edges | `experienceVr.js:611-615` | `beginFirstCrystalDiscovery`, whose dialogue completion calls the reveal actor (`createVrIntroSequence.js:65-67,123-126`) | No discovery bypass | OK |
| `COMPLETE_RELIQUARY_REVEAL` | `1.160→1.170` | `experienceVr.js:616-620` | `completeReliquaryReveal` | No | OK |

The blockers are effects beyond this mapped slice: card success directly changes floor/world/audio/Monkey (`experienceVr.js:420-428`) and the reliquary timer directly arms Monkey copy (`createVrReliquaryHints.js:11-24`). Those are `DIRECT_EFFECT_BYPASS`, even though they do not duplicate one of the twelve live symbolic handlers.

## 7. Capability matrix

| CAPABILITY | SCENARIO POINTS | PRODUCTION CONSUMERS | LOCAL DUPLICATE GATE? | VERDICT |
| --- | --- | --- | --- | --- |
| `CAN_USE_GLYPHS` | `1.140`, `1.150`, `1.170` | `isGlyphActive` through `runtimeExperience.can` (`experienceVr.js:473-482`) | QA bypass is explicit; branch/tier/live-crystal check is domain availability (`466-475`) | `SCENARIO_DECISION_OK` + `DOMAIN_TRUTH_OK` + `QA_ADAPTER_OK` |
| All other 17 declared capabilities | no current point | no `runtimeExperience.can` consumer | Production equivalents remain local/root: reliquary (`442,459`), Astro/Asterion (`307-309`), furnace (`363-391`) | **Not implemented as Scenario capabilities; several are legacy seams** |

Therefore the capability vocabulary is aspirational outside glyph use. In particular, `CAN_USE_RELIQUARY`, `CAN_ACTIVATE_RELIQUARY`, `CAN_RELEASE_RELIQUARY`, `CAN_EQUIP_ASTRO`, `CAN_USE_FURNACE`, `CAN_BUILD_ASTERION` and `CAN_EQUIP_ASTERION` cannot be cited as canonical production gates merely because their strings exist (`vrExperienceScenario.js:57-76`).

## 8. Milestone matrix

Only seven declared milestones are set by current transitions. No production code reads any milestone: repository search finds `hasMilestone` only in Director/Runtime and tests (`ExperienceDirector.js:103`; `RuntimeExperience.js:20`).

| MILESTONE | SET BY | CONSUMERS | DUPLICATED STORY FACT? | VERDICT |
| --- | --- | --- | --- | --- |
| `XR_CALIBRATED` | `1.10→1.20` | tests/debug only | Intro `xrCalibrated` is execution/reset fact (`createVrIntroSequence.js:134-141`), not story gate after emission | OK |
| `INTRO_REVEAL_COMPLETE` | `1.20→1.30` | tests/debug only | actor wait state is safe handoff | OK |
| `POST_REVEAL_SILENCE_COMPLETE` | `1.30→1.40` | tests/debug only | actor wait state is safe handoff | OK |
| `PLAYER_VIEWED_CONTROLS` | `1.50→1.60` | tests/debug only | panel owns UI truth; actor wait state is safe handoff | OK |
| `PLAYER_ENTERED_RING` | first accepted join event | tests/debug only | local boolean prevents duplicate sensing; Director owns join position | OK |
| `MONKEY_SETTLED` | first accepted join event | tests/debug only | same | OK |
| `FIRST_CRYSTAL_DISCOVERED` | `1.140/1.150→1.160` | tests/debug only | `glyphExploreResolved` guards actor continuation and duplicate cue, not a second route | OK |

Declared `CARD_COMMITTED`, `TIER_COMPLETED`, `SHELL_ABSORBED`, `SHELL_SET_COMPLETED`, `ASTERION_BUILD_STARTED`, `ASTERION_BUILT` and `ASTERION_EARNED` are not Scenario milestones in current execution. Their durable/session facts correctly exist in domain controllers, but production progression still reacts directly to them; this is a missing migration, not duplicate Director milestone state.

## 9. Actor and local state-machine audit

| Actor/controller | Local state and responsibility | Classification | Evidence |
| --- | --- | --- | --- |
| `createVrIntroSequence` | presentation queue, timer/motion/fog/sensing plus `WAIT_RUNTIME_*` safe waits | `MECHANICAL_STATE_OK`; migrated choices/routes are `SCENARIO_DECISION_OK` | state enum `createVrIntroSequence.js:3-19`; guarded continuations `74-150`; facts-only update `154-191` |
| Intro ring join | `playerEnteredRing`/`monkeySettled` once-only facts; no local `&&` transition | `MECHANICAL_STATE_OK` | sensing `54-58,184-187`; Scenario join `vrExperienceScenario.js:321-344` |
| Crystal collection | available/held/inserted/active/rejecting/consuming/released, physical validation and card commit | `DOMAIN_TRUTH_OK`; its root `onCommit` consumer is a bypass | `createVrCrystalCollection.js:189-285,423-495` |
| `VrProgressionController` | activated cards, tier and branch prerequisite | `DOMAIN_TRUTH_OK` | `createVrProgressionController.js:9-54` |
| Reliquary actors/buttons | reveal animation, interaction state, inserted→active/release mechanics | mechanics OK; availability source is `LEGACY_DECISION_OWNER` | `createVrCrystalReliquary.js:192-269`; root gates `experienceVr.js:442-461` |
| `createVrReliquaryHints` | instance/phase + 15 s timer directly selects Monkey attention/copy | `LEGACY_DECISION_OWNER` + `DIRECT_EFFECT_BYPASS` | `createVrReliquaryHints.js:1-27` |
| Glyph interaction/lights/orbit | hold/hit lifecycle, projection, physical spawn eligibility | `MECHANICAL_STATE_OK` / branch-tier query `DOMAIN_TRUTH_OK` | root `experienceVr.js:466-499`; `createVrGlyphInteraction.js:1-169` |
| Player/Monkey Guide | canvas/menu/detail/history/unread/hits | `DOMAIN_TRUTH_OK` (UI/read model) | `createVrPlayerGuidePanel.js:19-269`; `createVrMonkeyGuide.js:40-619` |
| Hand mode / Attractor / Gyro | equip modes, ray policy, physical targeting/drive | `DOMAIN_TRUTH_OK` / `MECHANICAL_STATE_OK`; unlock source remains legacy root decision | `createVrHandModeController.js:11-116`; root `experienceVr.js:302-335`; `createVrAsterionGyroInteraction.js:1-296` |
| Shell system/attractor | field active plus shell orbit/pull/capture/held/placed states | physical states `MECHANICAL_STATE_OK`; Tier-1 `setActive` call is legacy world continuation | `createVrShellSystem.js:8-97`; `createVrShellAttractorInteraction.js:14-215`; root `293` |
| Furnace material controller | required unique six-shell set | `DOMAIN_TRUTH_OK` | `createVrAstroFurnaceProgressionController.js:1-42` |
| Furnace option/open/content/activate/process | mode, chamber geometry, content transaction, authoritative 18 s process | `DOMAIN_TRUTH_OK` / `MECHANICAL_STATE_OK` | `createVrAstroFurnaceActivateInteraction.js:37-413`; `createVrAstroFurnaceContentInteraction.js:20-302`; root wiring `357-403` |
| Asterion production | `LOCKED→READY→BUILDING→AVAILABLE→EARNED`, construction/presentation/physical claim | `DOMAIN_TRUTH_OK` with mechanical presentation; not a second numeric Scenario cursor | `createVrAsterionProductionController.js:15-120` |
| Ambient/audio | local handles, cancellation generations, timing | playback is `MECHANICAL_STATE_OK`; root selection from three progression facts is `LEGACY_DECISION_OWNER` | `createVrAmbientSequencer.js:7-71`; `createVrAudioBridge.js:1-377`; root `285-292` |
| Floor/plaques/portal/fog/locomotion | visual projection, local animation, boundaries/transforms | `MECHANICAL_STATE_OK` | respective modules under `src/xr/floor`, `createVrSpatialPlaque.js`, `createVrPortalDisplay.js`, `createVrIntroFogReveal.js`, `createVrLocomotion.js` |

No `AMBIGUOUS` ownership was needed: the failing paths have direct, inspectable owners.

## 10. Composition-root audit

`experienceVr.js` correctly performs construction and adapter wiring in large portions (`120-284`, `300-403`, `501-622`) and dispatches every live semantic Intro event through Runtime (`526-540`). It also contains unauthorized progression policy:

1. `syncAmbientSequence` combines portfolio tier, shell completion and Sphere-built facts to choose the next ambient state (`285-290`): `LEGACY_DECISION_OWNER`.
2. `syncTierOneWorldState` interprets Tier-1 completion as the command to reveal/activate the shell field (`293`): `DIRECT_EFFECT_BYPASS`.
3. Hand-mode creation interprets Tier completion and production earned/QA as tool availability (`302-309`): production gates are outside the Scenario capability system; QA overlay itself is allowed.
4. Crystal `onCommit` performs a seven-way continuation to floor, tier ring, shell field, ambient, two audio cues and Monkey attention (`420-428`): the clearest `DIRECT_EFFECT_BYPASS`.
5. Reliquary Activate/Release availability is reconstructed from actor booleans/states (`442-461`) rather than Scenario capability plus local technical validity.
6. `isGlyphActive` is correctly split: Scenario/QA supplies global permission, domain facts supply the next branch tier (`466-482`).
7. First-crystal fact dispatch and all M1.17 effect handlers are canonical adapters (`487-498`, `521-621`).
8. The repeated lifecycle blocks call Runtime reset before actor reset and preserve domain state (`experienceVr.js:691-817`). They are composition/lifecycle rather than a second story graph, though the three paths remain asymmetric maintenance risk.

## 11. Domain-controller audit

- **VrProgressionController:** owns page ordering, branch prerequisites, current tier and idempotent commits (`createVrProgressionController.js:9-54`): `DOMAIN_OWNER_CONFIRMED`. Its consumers, not the controller, create the failing cross-domain continuations.
- **Furnace progression:** owns exact required IDs, uniqueness and atomic material commit (`createVrAstroFurnaceProgressionController.js:1-42`): `DOMAIN_OWNER_CONFIRMED`.
- **Crystal/glyph:** crystal lifecycle and branch/tier validity are domain/mechanical; the semantic first-discovery handoff is migrated. Card commit fan-out and the later local hint are not.
- **Hand/tool:** equip and physical interaction modes remain domain truth. Tier/EARNED availability is still supplied directly by root, so the controller is not itself the story owner but consumes legacy policy (`experienceVr.js:302-310`).
- **Guidance/Intro:** all implemented P0 route choices through M1.17 are migrated. Message pacing, physical sensing and safe wait states remain actor mechanics. Reliquary contextual hints are a separate legacy guidance owner.
- **Furnace process and Asterion:** their local state machines express furnace/production truth and physical execution (`createVrAsterionProductionController.js:34-118`). No evidence was found that they choose a narrative beat. Their domain chain is still outside Scenario, while root directly projects some results into audio/world state.

## 12. QA shortcut and reset audit

| Path | Classification | Evidence and limit |
| --- | --- | --- |
| `?p1` | `QA_ADAPTER_OK` | one-shot, explicitly URL-gated domain commits and floor projection (`applyVrProgressionShortcut.js:1-18`; root `430-431`); it does not run in normal production |
| `?asterionSphere` | `QA_ADAPTER_OK` | equipment-availability overlay only (`experienceVr.js:161,308`), not EARNED mutation |
| `?furnaceProcess` | `QA_ADAPTER_OK` | bypass plus explicit process-input allowance (`experienceVr.js:130-132,380`) |
| `?furnace` | `QA_ADAPTER_OK` | included only in explicit Intro bypass (`experienceVr.js:131-132`) |
| `?debug` | diagnostic only | settings/Sphere observability (`experienceVr.js:127,224`) |

QA paths do manually synchronize multiple actors and cannot prove production ownership, but none is reachable without an explicit query parameter. They do not maintain a second complete Scenario cursor. Session reset calls `runtimeExperience.resetSession()` and resets execution actors, while committed card/material/production domain facts intentionally survive XR re-entry (`experienceVr.js:691-817`). This is a lifecycle composition exception, not proof that history is replayed canonically; asymmetry remains a regression risk, not the decisive FAIL finding.

## 13. SG reconciliation

Line references in the old audit were rechecked against current symbols; current evidence below uses current checkout lines.

| SG | OLD STATUS | CURRENT CODE EVIDENCE | FINAL STATUS | NOTES |
| --- | --- | --- | --- | --- |
| SG-001 | QA bypass | `experienceVr.js:129-132` | `QA_EXCEPTION_CONFIRMED` | explicit URL adapter |
| SG-002 | QA bypass | `experienceVr.js:161,308` | `QA_EXCEPTION_CONFIRMED` | no domain EARNED write |
| SG-003 | QA bypass | `applyVrProgressionShortcut.js:1-18` | `QA_EXCEPTION_CONFIRMED` | one-shot QA domain setup |
| SG-004 | QA bypass | `experienceVr.js:130,380` | `QA_EXCEPTION_CONFIRMED` | explicit query only |
| SG-005 | retained audio trigger | `experienceVr.js:285-290` | `STILL_LEGACY` | root chooses cue/state from three progression facts |
| SG-006 | direct callback | `experienceVr.js:291-292` | `STILL_LEGACY` | domain subscriptions directly retrigger SG-005 |
| SG-007 | world trigger | `experienceVr.js:293,423` | `STILL_LEGACY` | Tier completion directly activates shell field |
| SG-008 | capability gate | `experienceVr.js:302-308` | `STILL_LEGACY` | `CAN_EQUIP_ASTRO` declared but unused |
| SG-009 | capability gate | `experienceVr.js:308` | `STILL_LEGACY` | production domain/QA supplies availability directly |
| SG-010 | modal gate | `experienceVr.js:309` | `DOMAIN_OWNER_CONFIRMED` | local UI modal arbitration |
| SG-011 | ray gate | `experienceVr.js:332-335` | `MECHANICAL_OWNER_CONFIRMED` | interaction arbitration |
| SG-012 | furnace ray gate | `experienceVr.js:354-364` | `MECHANICAL_OWNER_CONFIRMED` | tool/ray arbitration |
| SG-013 | furnace mode/open gate | `experienceVr.js:363-364` | `DOMAIN_OWNER_CONFIRMED` | furnace validity, no narrative target |
| SG-014 | process audio | `experienceVr.js:382-385` | `STILL_LEGACY` | accepted domain start directly selects cross-system audio |
| SG-015 | insertion gate | `experienceVr.js:388-394` | `DOMAIN_OWNER_CONFIRMED` | furnace/content transaction validity |
| SG-016 | hit priority/UI audio | `experienceVr.js:396-403` | `MECHANICAL_OWNER_CONFIRMED` | interaction/UI feedback |
| SG-017 | insert audio | `experienceVr.js:408` | `STILL_LEGACY` | domain success directly effects audio |
| SG-018 | grab priority | `experienceVr.js:409-417` | `MECHANICAL_OWNER_CONFIRMED` | competing-hit arbitration |
| SG-019 | page preview | `experienceVr.js:419` | `STILL_LEGACY` | activation directly changes narrative/world copy |
| SG-020 | card commit fan-out | `experienceVr.js:420-428` | `STILL_LEGACY` | direct floor/world/audio/Monkey decisions |
| SG-021 | Activate gate | `experienceVr.js:442-447` | `STILL_LEGACY` | global reliquary permission duplicated outside Scenario |
| SG-022 | Release gate/commit | `experienceVr.js:459-461` | `STILL_LEGACY` | same; directly advances domain flow |
| SG-023 | reliquary hint | `createVrReliquaryHints.js:11-24` | `STILL_LEGACY` | timer directly chooses Monkey cue |
| SG-024 | next crystal | `experienceVr.js:466-472` | `DOMAIN_OWNER_CONFIRMED` | branch/tier/live-instance truth only |
| SG-025 | glyph capability | `experienceVr.js:473-482` | `MIGRATED_CONFIRMED` | Runtime capability + domain availability + QA overlay |
| SG-026 | glyph lifecycle | `experienceVr.js:483-498` | `MIGRATED_CONFIRMED` | discovery routes through Runtime; acquisition audio is execution feedback |
| SG-027 | shell hit priority | `experienceVr.js:508-511` | `MECHANICAL_OWNER_CONFIRMED` | interaction arbitration |
| SG-028 | opening rays | `createVrIntroSequence.js:75`; `experienceVr.js:541` | `MIGRATED_CONFIRMED` | execution inside accepted onboarding continuation |
| SG-029 | normal Intro reset visibility | `experienceVr.js:542`; `createVrIntroSequence.js:133-139` | `MECHANICAL_OWNER_CONFIRMED` | actor/lifecycle reset, no next beat |
| SG-030 | bypass visibility | same + `experienceVr.js:543` | `QA_EXCEPTION_CONFIRMED` | explicit QA entry projection |
| SG-031 | first discovery reveal | `experienceVr.js:544-550,611-615` | `MIGRATED_CONFIRMED` | only reached by symbolic effect |
| SG-032 | calibration | `experienceVr.js:648`; Scenario `146-155` | `MIGRATED_CONFIRMED` | canonical dispatch |
| SG-033 | panel yaw lock | `experienceVr.js:661` | `MECHANICAL_OWNER_CONFIRMED` | UI modal locomotion policy |
| SG-034 | gyro audio loops | `experienceVr.js:682-686` | `MECHANICAL_OWNER_CONFIRMED` | continuous device-state sonification |
| SG-035 | glyph exhausted lighting | `experienceVr.js:687-689` | `MECHANICAL_OWNER_CONFIRMED` | projection of canonical/domain availability |
| SG-036 | Intro choices | Scenario `249-319`; actor `74-111` | `MIGRATED_CONFIRMED` | target selected only by Scenario |
| SG-037 | player ring fact | actor `54-58`; root `537` | `MIGRATED_CONFIRMED` | semantic fact only |
| SG-038 | Intro reset | actor `133-140` | `MECHANICAL_OWNER_CONFIRMED` | lifecycle/QA presentation reset |
| SG-039 | reveal/silence | actor `154-157`; Scenario `144-181` | `MIGRATED_CONFIRMED` | timer emits fact then waits |
| SG-040 | panel tutorial | actor `159-161`; root `528-530` | `MIGRATED_CONFIRMED` | UI facts route through Scenario |
| SG-041 | follow policy | actor `162-177`; Scenario `269-299` | `MIGRATED_CONFIRMED` | sensing local, route Scenario-owned |
| SG-042 | ring/settle join | Scenario `321-344`; actor `178-187` | `MIGRATED_CONFIRMED` | no actor conjunction remains |
| SG-043 | 60 s glyph hint | actor `188`; Scenario `347-360` | `MIGRATED_CONFIRMED` | direct hint removed from timer edge |
| SG-044 | 3 s reveal completion | actor `189-190`; Scenario `363-374` | `MIGRATED_CONFIRMED` | Runtime continuation only |
| SG-045 | first crystal | root `487-498`; Scenario `350-360` | `MIGRATED_CONFIRMED` | spawn fact dispatches event |
| SG-046 | material commit | furnace controller `24-32` | `DOMAIN_OWNER_CONFIRMED` | exact furnace material truth |
| SG-047 | production READY gate | production controller `34-49` | `DOMAIN_OWNER_CONFIRMED` | conjunction of its collaborating furnace domain facts |
| SG-048 | build/available | production controller `62-100` | `DOMAIN_OWNER_CONFIRMED` | production truth + presentation mechanics |
| SG-049 | physical claim/EARNED | production controller `102-106` | `DOMAIN_OWNER_CONFIRMED` | physical/domain handoff |
| SG-050 | furnace process selection | activate actor, root `371-386` | `DOMAIN_OWNER_CONFIRMED` | selected furnace mode/content/process kind |
| SG-051 | content absorption transaction | content actor + furnace controller | `DOMAIN_OWNER_CONFIRMED` | atomic domain process, no story beat |
| SG-052 | lifecycle/reset | `experienceVr.js:691-817` | `MECHANICAL_OWNER_CONFIRMED` | composition/lifecycle; asymmetric but not a second story cursor |

## 14. New findings not present in previous audit

No additional decision seams found. The decisive current failures are already represented by SG-005–SG-023; the new evidence is that M1.14–M1.17 close SG-042–SG-045 while post-P0 groups remain unchanged.

## 15. Negative search / proof of absence

The absence claims were tested as follows, then manually classified rather than inferred from search counts:

1. Enumerated every file in `src/xr/**`; traced imports from `src/experienceVr.js` and reverse imports from all `src/**`. Only `src/main.js` additionally imports XR functionality, and only for entry/capability selection.
2. Searched `src/**` for `state`, `phase`, `stage`, `step`, `mode`, `current*`, booleans, `setTimeout`, elapsed/distance thresholds, completion/success/ready/reveal/unlock callbacks, direct actor calls, visibility, capability and milestone APIs. Each progression-relevant machine is classified in §§9–13.
3. Reverse-mapped all 17 live transition events to physical producer, root dispatch and accepted point (§5). Declared-but-unused vocabulary was explicitly separated from live routes.
4. Reverse-mapped all 12 live symbolic effects to the unique Runtime handler and guarded actor continuation (§6), then searched for direct calls to each continuation. No second production invocation was found.
5. Searched all production code for `runtimeExperience.can`, Director `.can`, capability identifiers and local equivalents. Only `CAN_USE_GLYPHS` is live; the remaining production gates are documented in §7.
6. Searched all production code for `hasMilestone`, current-point getters and Scenario milestone identifiers. No production milestone consumer or second numeric point cursor exists (§8).
7. Traced direct cross-subsystem calls from card commit, glyph hold, reliquary buttons/hints, furnace process, material subscriptions, Asterion claim, hand modes, audio, session lifecycle and QA setup. This falsified full separation via SG-005–SG-023.
8. Re-verified every SG-001 through SG-052 against current symbols (§13), including formerly retained SG-042–SG-045.
9. Reviewed the full VR test suite for contracts that permit production shortcuts. Tests validate the current behavior but do not contradict the direct production paths above.

This proves absence only for the audited checkout and implemented runtime. Dynamic browser/WebXR behavior can add timing races, but cannot create an unsearched static owner in code not present at checkout.

## 16. Remaining legacy ownership

| ID | SEVERITY | FILE | SYMBOL / LINE | CURRENT OWNER | EXPECTED OWNER | WHY THIS VIOLATES CANON |
| --- | --- | --- | --- | --- | --- | --- |
| SG-005/006 | HIGH | `src/experienceVr.js` | `syncAmbientSequence`, `285-292` | composition root | Scenario/Runtime cue selection | root combines three progression facts and selects next ambient state |
| SG-007/008 | HIGH | `src/experienceVr.js` | `syncTierOneWorldState`, hand-mode `isUnlocked`, `293,307` | composition root | Scenario capability/effect, with domain fact producer | Tier success directly reveals the shell field and unlocks Astro |
| SG-009 | MEDIUM | `src/experienceVr.js` | `isAsterionAvailable`, `308` | composition root | Scenario capability + explicit QA overlay | production EARNED is interpreted directly as gameplay availability |
| SG-014/017/019/020 | HIGH | `src/experienceVr.js` | process audio and crystal callbacks, `382-385,408,419-428` | composition root | semantic events → Scenario/Runtime symbolic effects | domain facts directly trigger audio, world copy, floor, unlock, ambient and Monkey effects |
| SG-021/022 | HIGH | `src/experienceVr.js` | `canActivate`/`canRelease`, `442-461` | composition root/local actor state | Scenario capability ∧ local technical validity | production availability is reconstructed without the declared Scenario capabilities |
| SG-023 | HIGH | `src/xr/guidance/createVrReliquaryHints.js` | `update`, `11-24` | guidance controller | semantic timeout → Scenario/Runtime cue | elapsed domain state directly chooses Monkey attention and narrative copy |

Minimal remaining migration seams are exactly those rows; this audit intentionally does not prescribe or implement a refactor.

## 17. Canonical exceptions

- **Mechanical actors:** Intro timers/sensing/motion/fog and guarded wait states; glyph/crystal physics; shell targeting; furnace animation/process mechanics; Asterion presentation; locomotion, panels, rays and audio playback. They answer how/when a physical fact completes, not which authored target follows.
- **Domain truth:** card/tier ordering, crystal insertion state, six unique furnace materials, furnace mode/content/process validity, Asterion `LOCKED/READY/BUILDING/AVAILABLE/EARNED`, and hand equip state. These facts may participate in progression without becoming a second Scenario cursor.
- **Interaction arbitration:** competing real hits, modal panel locks and tool-hand exclusion are local safety/input policy, not authored story order.
- **QA:** `?p1`, `?asterionSphere`, `?furnaceProcess`, `?furnace` and diagnostic `?debug` are explicit URL adapters outside normal production authority.
- **Lifecycle:** reset/re-entry orchestration resets execution actors while preserving selected domain facts. It is composition responsibility, although its duplication/asymmetry deserves regression attention.

These valid exceptions are why the result is not a claim that every local state machine is wrong. The verdict is FAIL because separate unauthorized paths remain, not because canonical exceptions exist.

## 18. Test evidence

Commands were executed on the audited checkout after creating only this report:

| Command | Result |
| --- | --- |
| `node tests/vr-experience-director.test.mjs` | PASS |
| `node tests/vr-intro-sequence.test.mjs` | PASS |
| `node tests/experience-vr-contract.test.mjs` | PASS |
| `node tests/runtime-experience.test.mjs` | PASS |
| `node tests/vr-progression-controller.test.mjs` | PASS |
| `node tests/vr-progression-shortcut.test.mjs` | PASS |
| `node tests/vr-reliquary-hints.test.mjs` | PASS |
| `node tests/vr-astro-furnace-progression.test.mjs` | PASS |
| `node tests/vr-asterion-production.test.mjs` | PASS |
| `npm run test:vr` | PASS |
| `npm run build` | PASS |
| `git diff --check` | PASS |

Passing tests prove behavioral/contracts regression only; they do not negate production direct calls shown in §§10, 13 and 16.

## 19. Final conclusion

**FAIL.** M1.1–M1.17 successfully establish sole Scenario/Director routing for the implemented Intro/P0 slice through completed reliquary reveal. They do not establish sole ownership for all currently implemented Experience VR progression. Card/tier continuation, world/tool unlocks, ambient selection, reliquary action availability and contextual hint progression still operate outside Scenario → Director → RuntimeExperience.

Full canonical-document synchronization must **not** state that the overall migration is complete. The minimal remaining migration seams are SG-005/006/007/008/009, SG-014/017/019/020/021/022 and SG-023. No code migration or documentation synchronization was performed by this audit.
