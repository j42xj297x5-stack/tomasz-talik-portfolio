# Decision Log

Status: current binding decisions with preserved history. Synchronized on 2026-09-05 through the binding future Monkey communication contract, the implemented `5.60` late Rune/Resonator boundary and binding future Water/finale canon.

## 2026-09-05 — BINDING TARGET Monkey authored communication and automatic hints (NOT YET IMPLEMENTED)

This is a documentation-only product decision and performs no runtime implementation. CURRENT communication behavior remains the implemented baseline documented separately; the complete contract below is binding target behavior and is not yet implemented. `ATTENTION_REQUIRED`, `AUTO_HINT`, `SPEAKING` and `IDLE` are documentation concepts here, not assertions of existing runtime symbols.

1. Required Scenario/progression communication that needs conscious acknowledgement uses `ATTENTION_REQUIRED`: play the Monkey attention sound, show the existing visual attention arcs, wait for a Monkey press, and use that press only to begin the pending authored communication. Existing authored choices inside that narrative communication remain part of it, not part of the ordinary Monkey menu.
2. Required communication has the clean boundary `attention cue → player presses Monkey → authored speech → silent idle`. Ordinary Monkey conversation is unavailable during speech, and completion never automatically opens `CO TERAZ?`, `JAK MI IDZIE?`, history, knowledge or another ordinary menu. Opening the ordinary menu afterwards requires a new Monkey press from idle.
3. Corrective or situational guidance uses `AUTO_HINT`: do not show visual attention arcs; play the existing attention sound; wait exactly `1.0 s`; then automatically display the authored hint blocks without requiring a Monkey press. The Rune-without-Binder `hint.rune.noBinder.soft` and `hint.rune.noBinder.medium` messages are concrete examples of this class rather than required Scenario acknowledgement beats.
4. From the `AUTO_HINT` cue through hint playback, ordinary Monkey conversation is unavailable. The hint ends in silent idle and never automatically opens the ordinary menu.
5. Every automatically presented `AUTO_HINT` also makes the same existing authored hint blocks available as a one-time readable fallback under the Monkey's `CO TERAZ?` knowledge surface. No alternate copy is created. This supports deliberate recovery when the player looked elsewhere or was too far away to read the complete automatic message.
6. Communication class is determined by semantic role, not by a copy-key prefix such as `hint.*` or `progression.*`.
7. Authored Monkey speech exclusively owns the Monkey interaction surface: pressing Monkey cannot open ordinary conversation, and ordinary `CO TERAZ?`, `JAK MI IDZIE?`, history or knowledge navigation cannot coexist with unfinished speech. This also applies to Intro and other authored sequences.
8. This exclusivity does not block the surrounding game. The player may ignore Monkey and continue locomotion, object collection, tool use and other world interactions while Monkey speaks.
9. Ordering of simultaneous transient hints, stacking versus replacement, expiry after the originating condition resolves, and interaction with an already-open ordinary Monkey menu are deliberately not decided here.

## 2026-09-03 — CURRENT late Resonator runtime ownership and eligibility correction (SUPERSEDING)

This entry supersedes conflicting CURRENT status or ownership claims below that stop Scenario at `5.10`, make Astrolabium interpretation/Ether/Metal wholly future, or gate Metal behind `CAN_USE_ADVANCED_RESONATOR`. Older entries remain historical evidence.

1. Installed natural Rune truth is the physical `POWERED` gate for the corresponding sector, making its acquisition beam legal and the sector lockable/controllable. Scenario interprets physical achievement and controls dramaturgy/crystal progression; it does not gate already-legal physical mechanics.
2. An installed Metal Rune powers Metal. `M00` is powered but inactive and adds no range; any positive Metal DOF activates Metal field response. Metal beam, lock, control and extension do **not** require `CAN_USE_ADVANCED_RESONATOR` or point `5.60`.
3. `CAN_USE_ADVANCED_RESONATOR` remains implemented semantic Scenario truth at stable boundary `5.60`; it is not physical Metal ownership. The authored path is `4.80 → 5.10 → 5.20 → 5.30 → 5.40 → 5.50 → 5.60 → 100.10`.
4. Metal `M(angle, tilt)` dual-DOF control, composed motion, descriptor/resolved-shape contribution, gameplay containment extension, morph and presentation rounding are implemented. Provisional axes, dominant-gesture threshold, `+8 m` lateral, nominal `+10 m` forward and `1.50/0.90/0.60` rounding multipliers remain **TUNING / HARDWARE QA**.
5. Asterion Sphere completion derives special Small Glyph family `V / VI` targetability from `furnaceProgressionController.getAsterionSphereProgress().complete`. This creates no new persistence, Scenario event, milestone or capability and works through live synchronization/hydration.
6. `createVrAstrolabiumTuningActor` is implemented as a derived/read-only interpreter of Furnace processed-Shell truth, Proto-Astro extracted natural Small Glyph essence truth, Rune tuning truth and bounded eligibility. It does not duplicate persistence.
7. `VO`, `VI` and `VU` remain independent: natural-Shell completion exposes `VO`; Sphere completion exposes `VI`; later `CAN_TUNE_ETHER_RUNE` permits `VI + VO → VU`; later reveal materializes `VU`. `V` remains SPECIAL and outside `PROTO_ASTRO_NATURAL_FAMILY_CODES`, `tunedRuneFamilies` and `installedRuneFamilies`.
8. Ether reveal/transport/Monkey capture, persistent Water readiness override, ordinary Water natural installation, five-natural-Rune crossing and Scenario through `5.60` are implemented.
9. Water advanced control/hue/luminance/W22, harmonic recognition, Water Sync, Haiku damping and anti-bypass pull, final Water hunt/card, dissolution and XR finale remain **FUTURE / NOT IMPLEMENTED**.
10. Hardware smoke confirms corrected Metal tuning completion, Metal acquisition after installation and `VI` targetability after Sphere completion. Detailed Metal gesture feel, axes/signs, dominance, composed-motion comfort, expansion adequacy, rounding readability and perceptual tuning remain outstanding.

## 2026-09-03 — CURRENT final Metal/Water resonance and Haiku anti-bypass canon (SUPERSEDING)

1. `M(2,2)` adds no field expansion.
2. Every other active Metal pair expands at least one controlled dimension.
3. Metal expands LATERAL width and FORWARD depth, never VERTICAL; exact DOF assignment remains tuning.
4. `M22` provides maximum presentation-only fillet/edge rounding.
5. Metal extremes `1/3` expand their dimension while reducing fillet; fillet never changes containment.
6. Water angle maps `1 → GREEN`, `2 → BLUE`, `3 → VIOLET/PURPLE`.
7. Water tilt maps `1 → very dark`, `2 → medium`, `3 → very bright`; it is not generic power.
8. `222 / M22 / W22` is compact, strongly rounded, medium BLUE and gently pulsating.
9. The harmonic array is not maximum range, size or power. This supersedes `M22 ≈ 80%`, illustrative `20–115 m`, broad-balanced-Metal and broadest-full-array claims.
10. Ether recovery precedes Monkey's one exceptional rule intervention, which makes Water legally recoverable/installable; Ether is not a sixth natural family.
11. Installed Water is required before final synchronization can exist.
12. Installed Water plus `222 / M22 / W22` derives Water Sync Lock; lock plus Haiku inside the active field derives Water Sync Contact, which strongly damps angular and radial late motion.
13. Final Haiku pull requires family knowledge + late context + `PULL_READY` + current Water Sync Contact.
14. Generic acquisition may detect Haiku and reach/retain readiness before Water, but neither that truth nor Metal expansion bypasses Water.
15. Exact Metal expansion and Haiku slowdown/recovery remain tuning. Late-only `SPHERE_FAR` readiness and deterministic angular plus `20–110 m` / approximately `135 s` radial motion are implemented; advanced Metal/Water/Ether/finale systems are not.
16. This decision changes documentation only and performs no runtime implementation.

## 2026-09-02 — CURRENT Astrolabium learning and advanced Resonator canon (SUPERSEDING)

1. After physical acquisition, all four existing Astrolabium bands are selectable; band availability is independent of learned families and current pull eligibility. The five natural Shell families are initial vocabulary. Per-family processed Shell teaches its Small Glyph; processed/extracted Small Glyph teaches its Large Glyph; successful canonical Wu Xing completion teaches/tunes the resulting Rune Stone family.
2. Special `V/VO` remains outside natural families and becomes a legal Shell target only after all five natural Shells are processed; it completes the Shell sequence and creates no `VA`.
3. Learned Large Glyph families are normally pullable without Resonator. Late escaped/reacquisition targets retain that knowledge but additionally require transient Resonator `PULL_READY` for physical pull. **IMPLEMENTED; final Haiku additionally follows the 2026-09-03 Water-contact rule above.**
4. Late Large Glyphs use slightly faster angular motion plus approximately `20–110 m` sinusoidal depth motion and approximately `135 s` initial period tuning. **IMPLEMENTED CURRENT.**
5. **SUPERSEDED BY 2026-09-03:** the former broad/bandwidth `M22` reading is no longer current; the entry above owns Metal expansion, Water synchronization and the full harmonic array.
6. Field hue means frequency/tuning, superseding the linear power-to-WHITE scale and white-as-maximum finale requirement. Strength presentation and exact advanced mathematics, motion, slowdown, interpolation, hinges, and gestures remain future tuning.
7. A future Astrolabium Tuning Domain interprets authoritative Furnace, Proto-Astro, Rune, and Resonator facts without duplicating them. Immediate-all-band behavior, unified interpretation, Metal, Water, slowdown and post-`5.10` Scenario continuation remain **NOT IMPLEMENTED**; early/late gate correction and late motion are now implemented.

## 2026-09-02 — CURRENT shared spatial audio and sustained Binder reveal (SUPERSEDING)

1. Experience composition performs exactly one listener update per VR frame through `getXrHeadWorldPose(...) → VrAudioBridge.setSpatialListenerPose(...)`; spatial projections update only their emitter positions. The prepared detached XR camera `matrixWorld` is authoritative so listener and emitters share real Experience VR world space.
2. Installed Rune Stone spatial loops retain stable sector-local `+Z = 8.0 m` sibling anchors, `DEVICE`, HRTF/linear, `rolloffFactor = 1`, `refDistanceMeters = 0.25`, and now reach exact zero gain at `maxDistanceMeters = 4.0`. This presentation range is not gameplay logic.
3. Physical Furnace open/close, ordinary process, Rune tuning and Asterion/Astro Attractor construction audio are spatial `DEVICE` sources at the single stable `VrAstroFurnaceSpatialAudioAnchor`, with the same HRTF/linear contract and `4.0 / 0.25 m` max/reference distances. `AstroFurnaceAudioProjection` owns active handles; UI panel audio remains non-spatial, and reconstruction is silent.
4. `RUNE_BINDER_REVEAL` continues spawning ordinary short-lived pooled bolts for `runeBinderRevealDurationSeconds = 4.0`, without changing `revealTravelSeconds = 0.7`, `binderMaterializeSeconds = 0.42`, `boltLifetimeSeconds` or `maxActiveBolts`. RuneBridge remains arrival truth and settled reconstruction does not replay the lifecycle.
5. `electricity_short_07/08` remain unreachable and **RESERVED** solely for future Metal/Water Large Glyph field detection with real containment semantics. Reachable Rune/Furnace spatial sources remain mandatory-prepared before READY and cache-only during gameplay.

## 2026-09-02 — HISTORICAL platform, Zwornik and Rune Stone audio choreography (SUPERSEDED BY LATER 2026-09-02 ENTRIES)

1. Completed sector acquisition maps `electricity_short_01–05` to EARTH/FIRE/WOOD/METAL/WATER. Finite sector-drive sources map `electricity_long_01–04` by family, preserve a continuous playhead through manipulation/detent hold, fade out in exactly 1.0 s, recover the same source in exactly 0.2 s, and never loop or naturally restart.
2. Live sector completion starts `electricity_short_06` and one owner-controlled Zwornik translation from 130 m outward to canonical dock over exactly 3.0 s; only then is it `DOCKED`, installation-ready, and plays branch-specific `zwornik_01–04`. Settled reconstruction is direct and silent.
3. The former Binder use of `creating_01–03` is superseded. `creating_01–05` are mapped by family to future Rune Stone installation, while `creating_06–08` remain unassigned and `creating_short_01` remains Reliquary activation.
4. Rune Stone `noise_laud_loop_04–08` identity is frozen by physical stone. Each asset separately serves Attractor interaction and an `INSTALLED` stone-local spatial emitter with zero audible gain at and beyond 2.0 m; FREE/CARRIED_ORBIT persistent emission is no longer required.
5. `electricity_short_07/08` are reserved only for future real Metal/Water Large Glyph containment detection. All reachable audio remains mandatory-preloaded/decoded before READY and cache-only during gameplay.

## 2026-09-01 — CURRENT Scenario 5.10, discovery Guidance and Y knowledge (superseding status claims)

This entry supersedes conflicting CURRENT status claims that Scenario ends at `4.80`, all post-`4.80` Rune/Resonator Guidance is future, Y contains only persistent tool knowledge, or ordinary `CO TERAZ?` is always exactly the generic objective projection. Older entries remain historical evidence.

1. Scenario implements `4.80 → 5.10`; `5.10` is the stable current authored/runtime boundary and `P6` target. `P5 → 4.80` and `P6 → 5.10` remain debug/QA aliases only.
2. Existing Resonator domain truth joins through `RESONATOR_READY`; `CHECK_RESONATOR_JOIN` handles either event order. Scenario does not own or gate physical Resonator creation.
3. Rune/Binder/Sector/Resonator discovery Guidance through first Resonator is implemented and observes domain truth without owning it.
4. Player Y now includes dynamic persistent session `WIEDZA` alongside controls, current task and tools.
5. Ordinary Monkey may expose bounded contextual discovered-world stone/Binder knowledge, while persistent practical tool reference remains in Y.
6. Physical Resonator target selection/scoring/response and later Metal/Water/Ether/finale continuation remain future.

## 2026-08-26 — CURRENT Asterion Resonator, Rune Binder and sandbox ownership (superseding antenna canon)

1. Physical Rune tuning, legal pull, installation, sector control and Resonator creation depend on tools, world objects and domain conditions, never a `currentPoint >= X` gate. Scenario owns dramaturgy, required beats, revealed knowledge, Guidance/hints and crystal-acquisition gates; early sandbox mastery does not bypass crystal progression.
2. **Zwornik Runiczny** is the narrative identity; `bridge.glb` may remain the technical asset. Sector-complete materializes a persistent Zwornik, independently of Rune installation, so EARTH/FIRE/WOOD Zworniki may exist before full ring-three completion. `RUNE_BINDER_REVEAL` presents that event; `RUNE_INSTALL` separately presents the later circuit closure.
3. Zwornik spin is removed from target canon; historical `ORBITING` does not imply rotation. Presentation transform and final Rune Stone installation anchor are independent. Approximately `2×` visual scale and at least approximately `1 m` further radial placement are tuning only and must not move the current correct final stone location.
4. A tuned/pulled stone without its Zwornik may legally remain near but outside the platform. This can produce a situational Monkey hint and is not a required Scenario point.
5. From physical Asterion Sphere creation, GRIP may control a powered installed-stone sector locally; an unpowered sector does not respond. TRIGGER retains existing global platform orientation ownership. The two control modes are mutually exclusive.
6. Three required powered cooperating sectors physically create the first Asterion Resonator, potentially before its story beat. Later Scenario must recognize an existing Resonator or guide to the same state if absent. The Resonator answers domain-supported legal distant targets and is not hardcoded to glyphs, a radar or a classical antenna.
7. [`VR_ASTERION_RESONATOR_MODEL.md`](../technical/VR_ASTERION_RESONATOR_MODEL.md) is the binding technical CURRENT TARGET. The former antenna model is legacy and contributes no automatic detents, angles, three-volume intersection, DOF split or other unconfirmed parameters.

## 2026-08-26 — CURRENT Natural Rune A9 foundation checkpoint after A9.6 (superseding)

This is the binding Rune checkpoint and supersedes conflicting CURRENT status claims in the A9.5 follow-up, runtime-reconciliation follow-up and 2026-08-25 reconciliation below. Those entries remain historical evidence.

1. Rune A1–A8 and natural Rune A9.1–A9.6 foundations are **IMPLEMENTED**; **NATURAL RUNE A9 FOUNDATION = COMPLETE**. This does not complete the Rune Act, post-`4.80` Scenario or game.
2. A9.5 uses the invisible logical platform-centered handoff sphere (`9.0 m` transport minimum, `10 m` handoff radius), legality and ownership handoff, then actor-local `APPROACH → BRIDGE_OPEN → DESCENT → INSTALLED`. `BRIDGE_STONE_CAPTURE` is private asset/calibration evidence, not a gameplay trigger; accepted handoff does not pass through `FREE`, and player trigger input no longer controls installation.
3. Physical bridge extension is **IMPLEMENTED**: `BridgeMotionRoot` moves radially through `DOCKED → EXTENDING → EXTENDED` by authored-derived `extensionDistance`; installation ends in `ORBITING`. `ORBITING` spin/presentation remains future.
4. A9.6 persistent hydration and settled physical reconstruction are **IMPLEMENTED**. `runeProgression` hydrates the `RuneStoneProgressionController` facts `tunedRuneFamilies` and `installedRuneFamilies`, preserving `installedRuneFamilies ⊆ tunedRuneFamilies`; `runeStones` separately hydrates presentation visibility. `RuneInstalledStateProjection` restores installed stones and bridges directly to `INSTALLED` / `ORBITING` without replaying transient transport, capture, tween or extension flow.
5. Reconstruction synchronizes bridge readiness, installed Rune physical state, Furnace redraw without a fake domain event, then remaining derived state. This is owner ordering, not a new Scenario mechanic.
6. Carried Rune Stone ↔ installed Rune Stone collision is **SUPERSEDED / REMOVED FROM TARGET / NOT NEXT**. Earlier claims that collision is NEXT, bridge extension is not implemented, A9.5 is the latest reconstruction checkpoint, or authored socket/capture radius triggers gameplay are historical and non-binding.
7. Authored Scenario still ends at `4.80`. Post-`4.80` Scenario, the Water override trigger, special Ether flow, bridge spin, Rune Stone spatial audio, antenna/finale work and durable full-game persistence remain future and are not named A9.7 or NEXT A9.

## 2026-08-26 — CURRENT Platform Energy VFX target architecture

1. Future procedural platform-energy presentation has one pair-generic `PlatformEnergyVfxActor` shared by the `RUNE_INSTALL` and `FLOOR_DRIVE` profiles.
2. A thin optional `PlatformEnergyVfxProjection` may read Rune installation transient state and Asterion `driveActive` / actual angular speed / lock state, then issue presentation commands. Projection and actor are read-only presentation owners and never write gameplay or platform-motion truth.
3. Both profiles use sector-local, platform-bound underfloor lightning without magic world offsets. Exact visual parameters remain `TUNING`.
4. Future work may adapt only the needed procedural/shader core of Sahil K's MIT-licensed Lightning-VFX demo, using the repository's vendored Three.js rather than importing its scene, tooling or a new runtime dependency. Material code adaptation requires preservation of the MIT copyright and permission notice.
5. Meta Quest 3S is the performance and comfort boundary: bounded/poolable effects, stereo-safe WebXR presentation, no camera shake, screen-space flash, required postprocessing or debris physics. Hardware/perceptual QA remains a separate gate.
6. The binding detailed contract is [`VR_PLATFORM_ENERGY_VFX_MODEL.md`](../technical/VR_PLATFORM_ENERGY_VFX_MODEL.md); the system remains **TARGET / NOT IMPLEMENTED**.

## 2026-08-26 — CURRENT Scenario-owned main background sequencing (superseding)

This decision supersedes every conflicting earlier CURRENT claim about polling/full-tier thresholds, 30-second main-sequencer gaps, or the shells-complete + Asterion-built `ambient_loop_01` subthreshold. It does not change the separate Intro sequence or the independent Asterion Sphere DEVICE loops.

1. Canonical ownership is `Scenario semantic audio entry → Ambient Sequencer → VrAudioBridge → audioManager`.
2. Scenario entries select `ambient_01` at `2.10` after crossing from `1.130`, `ambient_02` at ring-1 completion / `2.40`, `ambient_03` at ring-2 completion / `4.20`, and `ambient_04` at ring-3 completion / `4.80`. Ring-4 completion selects `ambient_05` at a future point after `4.80`; its point ID is **NOT AUTHORED**. Ring-5 completion is also FUTURE / NOT AUTHORED and receives no invented ID.
3. For `ambient_01–04`, the active ambient plays once, followed by 10 seconds silence, the next global `noise_quiete_loop_01–13` for 6 repetitions with unchanged 10-second fade-in/out, then 10 seconds silence before the same ambient repeats. A semantic ambient entry replaces the active main thread but never resets the quiet cursor. The cursor wraps `13 → 01`.
4. There is no `ambient_06`. After `ambient_05` plays once, the post-main tail alternates the same quiet queue with repository assets `ambient_loop_01 → 02 → 03 → 04`, each for 6 repetitions. Behavior after `ambient_loop_04` is exhausted remains undecided; no tail wrap is established.
5. This is **CURRENT / BINDING TARGET, NOT YET FULLY IMPLEMENTED**. Current code still selects from tier, retains the old Asterion subthreshold and two 30-second gaps, and lacks the post-main tail. Those facts are an implementation gap, not an active alternative contract.

## 2026-08-26 — Rune A9.5 follow-up (HISTORICAL; SUPERSEDED BY A9.6 CHECKPOINT ABOVE)

A9.5 socket capture + persistent installed truth is **IMPLEMENTED**. This supersedes CURRENT claims that A9.5 is next; Rune A9 remains partially implemented and **NEXT = carried Rune Stone ↔ installed Rune Stone collision**. Scenario remains implemented only through `4.80`, and physical bridge extension motion remains not implemented / tuning target.

## 2026-08-26 — Runtime reconciliation follow-up (HISTORICAL RUNE STATUS; SUPERSEDED BY A9.6 CHECKPOINT ABOVE)

The four previously remaining runtime gaps are **IMPLEMENTED**: recipe insertion family validation, recipe-change player-facing eject, debug `P5 → 4.80`, and early natural Rune Stone presentation at celestial reveal. This follow-up supersedes only their earlier open-gap status; Scenario after `4.80` remains deferred and Rune A9 remains partially implemented with socket capture + persistent installed truth next.

## 2026-08-25 — Experience VR runtime reconciliation (HISTORICAL RUNE STATUS; SUPERSEDED BY A9.6 CHECKPOINT ABOVE)

This decision is CURRENT and supersedes conflicting status/eligibility claims in the 2026-08-24, 2026-08-23 and 2026-08-21 entries below; those entries remain historical records.

1. Authored Scenario is implemented through `4.40 → 4.50 → 4.60 → 4.70 → 4.80`; `4.80` is the stable boundary. Scenario after `4.80` remains deferred.
2. Large Glyph stages are `RING_INITIAL = 8.5 m`, `RING_ELEVATED = 8.5 m + 2.4 m`, `RING_EXPANDED = 46 m` and implemented `SPHERE_FAR = 80 m`.
3. `RUNE_STONES = 50–75 m` and `RUNESTONES` are implemented. Rune A1–A9.4 are partially implemented domain foundations. Socket capture, persistent installed truth, later Ether/Water flow and A10+ Scenario remain future.
4. Natural tuning is available for all five natural families and never reads sector completeness. Natural targetability equals `tunedRuneFamilies`. Sector completion gates only platform installation readiness.
5. Normal readiness after `4.80` is Earth/Fire/Wood ready, Metal/Water not ready. The Water override seam affects readiness only and its trigger is not implemented.
6. Panel 1 target projection includes natural Rune U forms; Panel 2 current-band art/color is implemented. Panels 3–4 remain future.
7. `RuneInstallationReadinessProjection` reads the existing progression owner and projects Rune bridges to `HIDDEN/DOCKED`; it does not copy truth.
8. Ether remains special: no sixth natural family, sector, bridge or platform slot.

## 2026-08-24 — Final Rune Stone Act progression and Ether intervention (HISTORICAL; UPDATED BY 2026-08-25)

1. Poprawna rune recipe konsumuje Small Glyph i Shell. Ekstrakcja tworzy nie fizyczny item, lecz trwałą semantyczną sylabę u `RuneStoneProgressionController`, zapisaną jako tuned family; wcześniejsze naturalne essence Large Glyph pozostają wyłączną prawdą `ProtoAstroTuningController`.
2. Po `4.80` wszystkie pięć naturalnych Large Glyph jest już tuned i przechodzi do pełnosferycznego `SPHERE_FAR = 80 m`, black/unlit, z bardzo wolnym ruchem. Earth, Fire i Wood mogą przejść standardowy rune flow, a ich trzy instalacje uruchamiają późniejszy, osobny system anteny.
3. Antena odnajduje Metal i Water Large Glyph. Ich Crystal/Reliquary flow kończy Tier 4: Metal jest complete, Water pozostaje celowo `4/5`. Metal otrzymuje normalną recepturę i czwartą instalację.
4. `FOURTH_RUNE_INSTALLED` wywołuje authored technology-overload retreat Large Glyph. Późny spatial stage nie ma zatwierdzonego promienia i nie używa arbitralnie reserved `HIDDEN_GLYPHS` range.
5. Water `4/5` jest zamierzonym deadlockiem. Model ma pięć standardowych elemental pairs oraz jeden specjalny ETER/VI bez sektora, vessela/socketu, elemental slotu, standardowego targetowania i procesu Pieca. Małpa przechwytuje Eter w authored beacie, którego jedynym progression skutkiem jest trwały Water-only knowledge/eligibility override.
6. Eter nie zastępuje receptury: Water nadal wymaga Small Glyph Metal + Shell Water, sylaby, targetowania, transportu, capture i piątej instalacji. Dopiero pięć installed elemental families tworzy finalne narzędzie.
7. `FINAL_WATER_HUNT` zaczyna się dopiero po pełnej instalacji Water. Timer ma startowe `180 s` ze statusem **TUNING** i jest transient mechaniką final-hunt ownera; Scenario widzi tylko semantic start/success oraz ewentualny przyszły timeout. **`FINAL_HUNT_TIMEOUT_BEHAVIOR = OPEN DESIGN DECISION`.** Ostatni Water Crystal przechodzi przez Reliquary do Water `5/5`, Tier 5 i istniejącego finału.
8. Authority i pełna roadmapa RUNE A1–A21 znajdują się w [`VR_RUNE_STONES_MODEL.md`](../technical/VR_RUNE_STONES_MODEL.md). Wszystko pozostaje **TARGET / NOT IMPLEMENTED**.

## 2026-08-24 — Rune Stone Act after Tier 3 and Furnace target contract (HISTORICAL; SUPERSEDED IN PART BY 2026-08-25)

1. The future Rune Stone Act begins after settled Tier 3 at the currently implemented stable boundary `4.80`. Rune Stones reuse the existing world-stable `RUNE_STONES = 50–75 m`; Large Glyph remains a separate actor and uses its existing `SPHERE_FAR = 80 m` capability with full-sphere, very slow, black/unlit baseline presentation.
2. Rune tuning eligibility is derived only from completion of every panel in the relevant sector. After Tier 3 this yields exactly Earth / Ethics, Fire / Creative AI and Wood / AI Guide. Metal and Water become eligible only after their full sector sequences. This supersedes the former four-stones-then-fifth gate; no `initialRuneStoneIds` list is allowed.
3. Wu Xing creation recipes are `Earth glyph + Metal shell → Metal stone`, `Metal + Water → Water`, `Water + Wood → Wood`, `Wood + Fire → Fire`, `Fire + Earth → Earth`. Asset identity uses canonical Proto-Astro resolvers rather than a parallel map.
4. Existing single-content Furnace interaction remains owner of existing Shell / Small Glyph processes. Future rune mode adds a separate two-slot `RuneRecipeInteraction`, using the shared `VR_FURNACE_INSERT_VOLUME`, preserving `VR_FURNACE_CONTENT_ANCHOR`, and requiring two authored typed anchors. One valid pair starts one 18-second cycle.
5. All target Furnace work presentations remove mechanical process-spin from chamber and lower lid while retaining emission, `fire_cell`, internal light and four energy points. Physical chamber/lid rotation remains open/close-only.
6. `astro_piec_work_03.mp3` is reassigned from any future physical stone-process meaning to rune tuning of Astrolabium from Small Glyph + Shell. The Rune Stone never enters the Furnace; no fourth work sound is added. `work_01`, `work_02` and `work_create_01` retain their shell, Small Glyph and device-production meanings.
7. Future `RuneStoneProgressionController` exclusively owns tuned and installed rune families and reads, but never copies, sector progression. `ProtoAstroTuningController` remains exclusive owner of natural family essences for Large Glyph.
8. One pair-specific `RuneBridgeActor` per elemental sector owns only `HIDDEN → DOCKED → EXTENDING/EXTENDED → ORBITING` presentation/mechanics. It knows no point and owns no progression. Stone transport remains `FREE → LOCKED_BY_ASTRO → CARRIED_ORBIT → SOCKET_CAPTURE → INSTALLED` with persistent commit only after completed capture.
9. First implementation stability ends at `FIRST_RUNE_INSTALLED`; sector/antenna control is a later separate actor/design. Scenario points represent only meaningful beats or stable rights, never slots, timer, targeting, pull, bridge interpolation or capture.
10. **UPDATED BY FINAL 2026-08-24 DECISION:** successful rune tuning consumes both physical ingredients and creates only a persistent semantic syllable/tuned-family fact.
11. **UPDATED BY FINAL 2026-08-24 DECISION:** the authoritative milestone sequence is RUNE A1–A21 in [`VR_RUNE_STONES_MODEL.md`](../technical/VR_RUNE_STONES_MODEL.md). All behavior remains **TARGET / NOT IMPLEMENTED** until bounded runtime tasks land.

## 2026-08-23 — Large Glyph Actor ownership migration completed (HISTORICAL; SPATIAL STATUS SUPERSEDED BY 2026-08-25)

1. `LargeGlyphActor` is the single physical/spatial owner of the five Large Glyphs. World/platform `worldBaseRadius = 7.6 m` is independent from actor radii.
2. Canonical actor progression is `RING_INITIAL` at `8.5 m` → `RING_ELEVATED` at `+2.4 m` → `RING_EXPANDED` at `18.5 m`. One rigid `RotationRoot` owns five identity slots separated by `72°`.
3. Actor-owned `TransientRoot` owns pulled physical nodes; `LargeGlyphAttractorInteraction` owns gameplay lifecycle and `ProtoAstroTuningController.canAttractLargeGlyph(...)` owns natural family compatibility. `LARGE_GLYPHS` family-gated scan/target/pull is **IMPLEMENTED**.
4. Scenario reconstruction truth is exclusively `largeGlyphs.stage`; `intro.largeGlyphsVisible` remains separate presentation truth delegated through the actor.
5. Large Glyph is not a spherical layer. Its `18.5 m` expanded radius intentionally overlaps `SMALL_GLYPHS` volume `17.1–24.7 m`; this is an **ACCEPTED PRODUCT DECISION** and does not change spherical ranges.
6. `SPHERE_FAR` remains **FUTURE / NOT AUTHORED / NOT IMPLEMENTED**. Future long-range attraction requires separate design.
7. **HARDWARE VALIDATED — Meta Quest 3S:** Wizjoner confirmed the migrated Large Glyph flow after M7A, limited to Large Glyph Actor migration M1–M7A. This does not validate independent P2, Furnace, panel, audio or future-feature scope.

This decision supersedes earlier binding statements that assigned world-stable ownership to a raw glyph ring, derived the walking/layer radius from `glyphOrbit.effectiveRadius`, or classified real `LARGE_GLYPHS` targeting/pull as not implemented.

## 2026-08-21 — P2 Proto-Astro / small glyph tuning foundation (HISTORICAL; STATUS SUPERSEDED BY 2026-08-25)

1. Canonical small-glyph asset mapping is: `1 → SI / S / water / Haiku Cosmos`, `2 → KI / K / earth / Ethics / Life Protection`, `3 → TI / T / metal / DIG Engine / spotify-digger`, `4 → RI / R / fire / Creative AI`, `5 → LI / L / tree / AI Guide`, `6 → VI / V / astro / produktowo Eter`. `V = astro` remains the registry truth; Eter is product meaning, not a new family ID.
2. Natural compatibility is small form I → large form A of the identical natural family: `KI↔KA`, `TI↔TA`, `SI↔SA`, `LI↔LA`, `RI↔RA`.
3. VI is a full transportable small glyph but does not participate in current P2 extraction/tuning and unlocks no large glyph.
4. `ProtoAstroTuningController` is the sole owner of extracted natural family essences `K/T/S/L/R` and the implemented `canAttractLargeGlyph` compatibility seam.
5. One Furnace chamber/content owner handles shells in `floor_gyroscope_sphere` Asterion mode and natural small-glyph essence in `astro_attractor` mode.
6. After extraction the physical small glyph returns to field. Persistent truth is family essence, not a consumed asset or inventory item; duplicate family extraction is invalid.
7. Implemented Astro bands are exactly `SHELLS` and `SMALL_GLYPHS`; semantic B switches only bands available to the player.
8. **UPDATED BY 2026-08-23 DECISION:** `LARGE_GLYPHS` is implemented with family-gated real target/pull; `RUNESTONES` remains **APPROVED / NOT IMPLEMENTED**. No final future B cycle order is established.
9. Band identity is semantic, not `RED/YELLOW/GREEN/BLUE/ULTRAVIOLET`. Exact colors/symbols remain open and fuel family colors are not band colors.
10. Four authored panels have the approved target semantics recorded in [`VR_PROTO_ASTRO_MODEL.md`](../technical/VR_PROTO_ASTRO_MODEL.md). Existing panel system/shell projection is current; Panels 2–4 and universal target projection are **NOT IMPLEMENTED**.
11. **UPDATED BY FINAL 2026-08-24 DECISION:** VI/Eter is a special final-crisis stone captured by the Monkey, not a natural family or standard platform placement. It grants only the Water eligibility override described above.
12. Scenario is authored through Tier 2, `4.20`, `4.30` and stable `4.40`. Point `4.40` has mainline target `100.10` but no transition and therefore does not auto-advance.

## 2026-08-20 — rozdzielenie kanonu komunikacji Experience VR

Experience VR communication ma dwa rozdzielone canonical sources: [`EXPERIENCE_VR_COMMUNICATION_MECHANICS.md`](../concept/EXPERIENCE_VR_COMMUNICATION_MECHANICS.md) określa kiedy, gdzie i jakiego typu komunikacja jest należna, a [`EXPERIENCE_VR_PLAYER_COMMUNICATION_COPY.md`](../concept/EXPERIENCE_VR_PLAYER_COMMUNICATION_COPY.md) zawiera zatwierdzone teksty PL. Narrative baseline pozostaje dokumentem przebiegu doświadczenia i nie duplikuje tych danych. Decyzja nie stanowi twierdzenia, że odpowiadający jej system Guidance jest już zaimplementowany.

## 2026-08-18 — canonical Scenario point authoring standard

Każdy nowy canonical Experience VR Scenario point musi spełniać [`VR_SCENARIO_POINT_AUTHORING_STANDARD.md`](../technical/VR_SCENARIO_POINT_AUTHORING_STANDARD.md), w szczególności target-owned exactly-once entry, jednoznaczne ownership persistent truth oraz pełny reconstruction/hydration/direct-activation parity contract. Istniejące legacy seams są udokumentowanymi wyjątkami i nie stanowią precedensu architektonicznego.

## 2026-08-16 — repository entry and canonical story terminal

1. Repository documentation routing starts at the existing `README.md`, `docs/README.md`, current documentation hub and Project Index. No additional private architect input belongs to, is required by or is expected in the repository.
2. `100.10` is the canonical authored mainline story terminal. **UPDATED BY 2026-08-21 DECISION:** mainline metadata reaches it from stable `4.40`, which has no transition and does not auto-advance; every earlier explicit exit route still converges there. It may remain forbidden as a reconstruction/checkpoint start; that restriction does not remove it from mainline or from the story.

## Experience VR Scenario and Director — binding after M2.2

1. Ownership follows **Spine → Scenario → Director → Runtime / actors / domain owners**. Spine alone owns authored mainline order; Scenario owns canonical point definitions; Director owns `currentPointId` and transition interpretation; execution and domain/transient truth remain downstream.
2. Point IDs are stable addresses, not sortable chronology. Normal mainline completion uses `Spine.next(currentPointId)` and does not duplicate the next point in a transition target. `EXPLICIT` is reserved for authored routing outside normal succession, including earlier exit routes that converge at `100.10`.
3. The transition vocabulary is `STAY`, `COMPLETE`, `EXPLICIT`, `COMPLETE_IF`. `COMPLETE_IF` is restricted to `crossingComplete`; it is not a generic predicate DSL or rules engine.
4. WHERE, BEYOND, FOLLOW pause and hints are local `STAY`. Crossing is wholly represented by `1.130`; its transient join facts belong to the Intro actor and are not milestones or separate technical points.
5. `2.30` represents the complete first-ring five-card loop. Per-card preview, commit feedback and hints are local `STAY`; `createVrProgressionController` alone owns the tier completion fact. Its first-tier `5/5` produces `FIRST_RING_COMPLETED`, which completes `2.30` through Spine to `2.40`.
6. `2.40` is the canonical first-ring-completed `5/5` presentation point. `createVrFirstRingFlow` owns the local presentation seam; only `FIRST_RING_PRESENTATION_COMPLETED` advances to `3.10`.
7. Scenario capabilities may make the whole vessel loop available, but domain interaction state enforces Activate only for `inserted` and Release only for `active`. Interaction phases are not story points.
8. Reconstruction remains `stateAt(X) = fold(settledConsequences of Spine points strictly before X)`. It never reconstructs transient/live state. **UPDATED BY 2026-08-21 DECISION:** authored reconstruction now includes Tier 2, radial and small-glyph-field truth through `stateAt(4.40)`; durable save and later P2/P4 remain not authored.

## 2026-08-14 — P4 rune stones and sector vessels canonical target model (HISTORICAL; SUPERSEDED BY A9.6 CHECKPOINT ABOVE)

1. P4 uses exactly five pair-specific units: five distinct animated rune stones and five corresponding sector vessels from one visual/construction family. The pair, not a global socket assumption, owns final stone pose and safe envelope.
2. Every stone has one stable runtime root; every vessel exports a root, precise authored `SOCKET_POINT` and forgiving `SOCKET_ZONE`. Existing internal stone animation remains baked in GLB and continues after installation.
3. The developed Astrolabium guides a large stone around the platform's exterior, never into the player or platform interior. Installation requires physical orbital transport, correct pair/sector capture and a completed controlled snap; zone entry alone is not a progression commit.
4. Installed stones logically block later stones through a lightweight occupied-orbit model, not full rigid-body or animated mesh collision. Every stone retains a moving/installed spatial audio loop owned by Three.js/Web Audio, not Blender.
5. **SUPERSEDED BY 2026-08-24 DECISION:** availability is sector-completeness-driven and there is no fifth-stone gate. Scenario owns authored beats/capabilities; Director owns transition legality; runtime actors execute targeting/orbit/capture/audio; Blender owns asset hierarchy/pivots/animation. The model remains **TARGET / NOT IMPLEMENTED** and is normative in [`VR_RUNE_STONES_MODEL.md`](../technical/VR_RUNE_STONES_MODEL.md).
6. Dimensions, radii, timings, easing, audio parameters, release behavior and occupied-arc algorithm remain tuning/open decisions. Implementation must validate one complete Blender 5.1.2 pair before expanding to the other four and requires Meta Quest 3S QA.

## Implemented and binding

### Runtime, progress and platform

1. Classic 2D, Experience 3D and Experience VR are separate presentations. `src/experienceVr.js` owns the independent WebXR scene, rig, lifecycle and loop; WebXR owns the tracked camera.
2. `VrTiltableFloorRoot` is the active platform transform root and the visual progress-floor root. **UPDATED BY 2026-08-23 DECISION:** the world-stable `LargeGlyphActor`, shell field and cosmos remain outside it.
3. Platform-relative children include floor sectors/rings, `VrMonkeyMotionRoot`, `VrPlatformFixturesRoot` and `VrFloorPassengerRoot/playerRig`.
4. `VrPlatformFixturesRoot` is a structural platform-relative container. Its direct fixture children include `VrMonkeyStoneRoot`, portal, reliquary, Astro Furnace and furnace panel; their visibility is controlled individually rather than by treating the container as one device.
5. `VrFloorPassengerRoot` carries `playerRig`; camera, controllers and grips inherit the platform. There is no world-stable/horizon-lock camera compensation.
6. Smooth locomotion is tracked-head-relative right-stick translation on the platform-local tangent plane plus left-stick continuous rig yaw. Platform normal replaces world Y, local rig Y is preserved and diagonal input is capped.
7. **UPDATED BY 2026-08-23 DECISION:** the walking boundary is the explicit `worldBaseRadius = 7.6 m`; outward movement at the boundary is blocked while tangent movement remains allowed.
8. Ordinary controller rays have a maximum range of `2.3 m` and shorten only to reported real interaction hits.
9. Five branches contain 18 cards in counts `3 / 3 / 3 / 4 / 5`. Physical crystals are branch+tier instances without persistent page/card identity; acquisition is additive and insertion is current-tier gated.
10. Player-facing Release is disabled for `inserted`. Activate advances `inserted → active` and previews; only physical Release from `active` commits through `VrProgressionController`, projects to the floor and consumes. Internal recovery APIs do not define player actions. Invalid insertion returns without progress.
11. The floor contains five authored sectors, 18 panels and five optional procedural tier rings. Committed progress survives XR re-entry only in the prepared runtime. Durable persistence does not exist.

### Intro P0 and Monkey transform authority

1. The implemented intro P0 proceeds through XR calibration, radial fog reveal, player-panel/controls onboarding, pointer/trigger onboarding, invitation, `FOLLOWING`, threshold choice, physical ring entry, `MONKEY_SETTLING` and `GLYPH_FREE_EXPLORE`.
2. `monkeyMotionRoot` is the runtime transform owner for intro motion. The sequence captures its canonical transform after scene composition, moves it for the walk and settles it back to that transform.
3. `MONKEY_ANCHOR` is a character-local asset reference used only to align the character with the stone seat during `dockCharacterToStone()`; it does not own scene placement or intro motion. `VrMonkeyStoneRoot` is a direct child of `VrPlatformFixturesRoot`, never `VrMonkeyMotionRoot`.
4. Physical ring entry is `headRadius <= ringRadius`; the `0.75 m` safer-inner measurement is diagnostic only. Free exploration requires `monkeySettled && playerEnteredRing`, lasts `60 s`, and first-crystal discovery takes precedence over the delayed five-sign hint.

### Independent hand modes

1. Semantic input maps standard-gamepad button `4` to the right-hand A toggle and left-hand X toggle according to handedness; squeeze/button `1` maps to `grabAction`, and trigger/button `0` maps to `primaryAction`.
2. Controller construction is valid before handedness is known; left/right resolves after WebXR `connected`.
3. `createVrHandModeController` owns right `NORMAL_HAND ↔ ASTRO_ATTRACTOR` and left `NORMAL_HAND ↔ ASTERION_SPHERE` state.
4. RIGHT: A toggles Astro after unlock. `NORMAL_HAND` means Astro hidden/right ordinary ray visible; `ASTRO_ATTRACTOR` means Astro visible/right ordinary ray hidden.
5. LEFT: X toggles Asterion Sphere only after production `EARNED` or under the independent `?asterionSphere` QA availability override. `AVAILABLE` requires physical claim and does not unlock X. `NORMAL_HAND` means sphere unequipped/left ordinary ray visible; `ASTERION_SPHERE` means sphere equipped/left ordinary ray hidden.
6. Left and right modes are independent; Asterion Sphere and Astro Attractor can be equipped simultaneously.

### Tier-1 Astro and shells

1. Tier 1 does not unlock Astro. `3.10` reveals the 18-shell field as non-interactive presentation; only physical `ASTRO_ATTRACTOR_CLAIMED` at `3.80` grants Astro equip/scan/target capabilities. `?p1` is an explicit QA/showcase shortcut, not canonical progression.
2. With Astro equipped, squeeze above `0.1` activates one local-`-Z`, `3R`, `2.5°` scan cone. Selection is an analytic cone-volume test of cached shell bounding spheres, not a ray fan.
3. Trigger above `0.1` while scanning pulls at `10 m/s²`, capped at `8.5 m/s`, toward `worldPosition(PIVOT_RING_MASTER) + worldDirection(controller local -Z) * 1.3 m`; readiness radius is `0.28 m`.
4. Shell state is `orbiting → targeted → pulling → capture_ready → held → placed`, with technical `returning`. Pre-takeover cancellation returns over `0.8 s`; the shell is excluded from Astro targeting until orbit is restored.
5. `capture_ready` takeover requires a real left ordinary-ray hit within `2.3 m`, halo/reporting and left squeeze while the left hand is free. Distance from the hand alone never performs takeover.
6. Placed shells remain excluded from Astro but support repeated ordinary-ray grab/place with either free hand; the right hand requires `NORMAL_HAND`, and the left hand requires `NORMAL_HAND`. Shell priority over crystals exists only on a real shell hit.

### Astro Furnace and Asterion material progression

1. The Astro Furnace is a material progression transformer/store, not a machine that generates removable physical essence output.
2. `VrAstroFurnaceProgressionController` exclusively owns committed furnace material progression, separate from `VrProgressionController`'s portfolio-card/tier/floor domain. There is no central global progression store.
3. Asterion Sphere requires exactly one of each `shell-relic-1` through `shell-relic-6`; these are six unique asset types, not any six instances.
4. An unknown or already committed shell type is invalid, cannot be taken over by furnace content interaction and cannot be consumed.
5. A valid inserted shell remains the same physical instance at `VR_FURNACE_CONTENT_ANCHOR` and is ordinary-ray retrievable after reopening until the process begins. Insertion and closing do not commit.
6. Progress commits only after physical visual absorption reaches `CONSUMED` and the activation process reaches `COMPLETE`. Neither condition alone is sufficient.
7. The CanvasTexture panel is a read-only projection of furnace progression, process and transient content state; it is not a state owner.
8. `complete=true` at `6/6` opens production `READY`; it does not itself construct, claim or earn the Sphere.

### Production Asterion Sphere

1. Production Asterion is made in the Astro Furnace from the six unique committed shells: `6/6 → READY → UTWÓRZ → BUILDING → AVAILABLE → explicit claim → EARNED`.
2. `SHELL_EXTRACTION` and `ASTERION_CONSTRUCTION` share the furnace-owned authoritative 18-second, 42-RPM process driver. Construction needs no shell in the content slot and uses its dedicated create audio rather than shell-process audio.
3. After a completed last-shell cycle, accepted `UTWÓRZ` may enter `PREPARING_CONSTRUCTION` and the authored reverse button-lock animation before `ASTERION_CONSTRUCTION / SPINUP`; preparation time is outside the 18 seconds.
4. One `/glb/asterion_sphere.glb` socket/model serves production presentation and earned hand equipment. No second model is created on claim.
5. Presentation and equipment lifecycles are separate: hand unequip does not clear presentation; production owns presentation cleanup and transfers the same socket on claim.
6. Claim is explicit and requires `AVAILABLE`, an open chamber, left `NORMAL_HAND`, a real ordinary-ray hit within `2.3 m`, halo and squeeze. It commits `EARNED` and auto-equips through the hand-mode controller.
7. `?asterionSphere` remains a QA availability override, never a `6/6`, `AVAILABLE` or `EARNED` progression source.
8. Asterion Sphere equipped and active-drive loops are implemented `DEVICE` audio behavior; exact lifecycle and asset mappings are owned only by `VR_AUDIO_MODEL.md`.

### Asterion Sphere and heavy platform drive

1. Production `EARNED` unlocks the same already-tested physical Asterion/floor control; `?asterionSphere` only bypasses availability for QA and does not fake furnace or production progress.
2. PREVIEW is live left-hand orientation expressed through CONTROL BASE + HAND REFERENCE and visualized by `inner_ring2`, `inner_ring3` and `PIV_TARGET_AXIS` with authored idle fan preserved.
3. COMMAND is the accepted target. Trigger-held copies PREVIEW into COMMAND; release freezes COMMAND and does not stop platform motion.
4. CURRENT is the actual `VrTiltableFloorRoot` quaternion and is visualized by `master_ring1`, `master_ring2` and `inner_ring1`.
5. LOCK rebases CONTROL BASE / HAND REFERENCE from CURRENT. `displayPreviewQuaternion` provides an approximately `0.5 s` visual rebase to avoid a TARGET-frame teleport.
6. The active drive maintains `angularVelocity` and uses braking-distance control with `maxAngularSpeedDegrees = 32`, `angularAccelerationDegrees = 32`, `angularDecelerationDegrees = 45` and `settleAngularSpeedDegrees = 0.15`.
7. Retargeting does not zero velocity. Unequip freezes COMMAND but CURRENT continues driving. LOCK requires small error and small angular speed, then performs exact final settle.
8. The drive is intentionally a heavy angular controller, not a full rigid-body physics simulation.

## Monkey seating asset contract — implemented

1. `public/glb/monkey.glb` (character node `monkey`) and `public/glb/monkey_stone.glb` (separate seat/stone) are distinct **PRESENT** physical assets.
2. The approved internal authoring contract is `MONKEY_ANCHOR → monkey` for the character and `MONKEY_STONE_ROOT → <stone mesh> + MONKEY_SEAT_ANCHOR` for the stone. `MONKEY_ANCHOR` is the character-local seated reference, `MONKEY_STONE_ROOT` the stone-local lower/root reference and `MONKEY_SEAT_ANCHOR` the stone-local seating point.
3. Runtime preloads both assets. `VrMonkeyMotionRoot` owns the actor, while `VrMonkeyStoneRoot` is a stationary platform fixture.
4. Normal composition bases authored `MONKEY_STONE_ROOT` at platform center `(0,0,0)`, then aligns the world position and rotation of `MONKEY_ANCHOR` with `MONKEY_SEAT_ANCHOR`. Their scales intentionally remain independent so the character retains its authored GLB scale.
5. `(0,0,0)` is the canonical transform of `VrMonkeyMotionRoot`, not the required physical world position of `MONKEY_ANCHOR`. The internal references never define P0 start or gameplay placement and require no magic offset.

## Approved future gameplay direction — not implemented

1. **SUPERSEDED BY 2026-08-21 DECISION:** B now implements selection of available `SHELLS` / `SMALL_GLYPHS`; the unlocked-only rule remains binding.
2. **SUPERSEDED BY 2026-08-21 DECISION:** color-named bands are not canonical identity. Semantic bands are `SHELLS`, `SMALL_GLYPHS`, implemented `LARGE_GLYPHS`, future `RUNESTONES`; unrestricted global scene raycast remains disallowed.
3. **SUPERSEDED BY 2026-08-21 DECISION:** small-glyph field, transport, natural essence extraction and real family-gated Large Glyph targeting/pull are implemented.
4. Radar sectors, antenna, runes, Emanation Matrix processing, final radar/finale, spatial audio, durable persistence and full-game reset remain future systems. Asterion active-control sound is implemented. Main ambient sequencing has a CURRENT / BINDING Scenario-owned target with the implementation gap recorded in the 2026-08-26 superseding decision.
5. Platform rotation under a world-stable glyph ring is implemented; production radar/sectors still need design and validation.

## Explicit current exclusions

`RUNESTONES`, radar/sector gameplay, final radar, teleport, jump, snap turn and rigid-body physics are outside the current implemented Experience VR contract. Current Meta Quest 3S defects in physical Sphere placement and contour continuity are implementation QA issues, not exclusions or future features.

## 2026-08-27 — CURRENT Asterion Resonator analytic field model

1. The binding Resonator authority remains [`VR_ASTERION_RESONATOR_MODEL.md`](../technical/VR_ASTERION_RESONATOR_MODEL.md); [`VR_ASTERION_RESONATOR_FIELD_MODEL.md`](../technical/VR_ASTERION_RESONATOR_FIELD_MODEL.md) is its subordinate detailed field contract. Both are **CURRENT TARGET / NOT IMPLEMENTED**.
2. The first coarse field uses EARTH `α` for the left wing, WOOD `β` for the right wing and FIRE tilt `γ` for depth only. With `α, β ∈ {-1,0,+1}` and `γ ∈ {0,1,2}`, it has 27 base configurations and 9 primary symmetric presets.
3. `α = β` identifies the concave, rectangular/neutral and convex symmetric families. `α ≠ β` remains legal and creates shear, curvature and asymmetric lensing rather than cancelling the field. The mean of `α,β` describes overall curvature and their difference deformation.
4. Resonator response is based on an analytic descriptor derived from sector state, not a mandatory literal intersection of physical volumes. Minimum semantics are left/right shape, symmetry/asymmetry, depth band and optional power/gain and distortion; final runtime API and exact scoring remain open.
5. Legal distant targets supported by runtime domains may vary response by depth/shape match, asymmetry and power. The Resonator is not glyph-only, and Scenario retains narrative meaning and crystal-acquisition gates rather than physical field ownership.
6. METAL and WATER later add wing rotation plus tilt as an advanced tuning/amplification layer over the same field. Their final DOF remain open.
7. Field presentation uses a gravitational-lensing-inspired but non-literal language: brightening, magnification, curvature, caustic-like arcs, shifts and asymmetric distortion. Shader/VFX implementation is not established.
8. The historical antenna model remains historical evidence only and must not be reactivated as implementation precedent.

## 2026-08-27 — CURRENT Asterion Resonator canonical physical sector positions (SUPERSEDES SIGNED FIELD LEVELS ABOVE)

1. The signed core model is superseded. EARTH `α`, WOOD `β` and FIRE `γ` each use levels `{0,1,2,3}` mapped to `0° / 13° / 23° / 36°`. `0°` is OFF; the active angles are CURRENT TARGET positions and may change only through a new explicit decision after hardware/perceptual QA.
2. Motion begins flat and proceeds only in one canonical direction. EARTH raises its left edge, WOOD mirrors it by raising its right edge, and FIRE uses only a whole-sector semantic scoop. There are no negative positions, signed detents or fixed concave/rectangular/convex meanings. FIRE maps active levels to `FAR / MID / NEAR`.
3. Installed Rune truth makes a sector powered, responsive and lockable, but not field-active. Field-active requires powered plus local level above zero; `0° → 13°` enables contribution. Three powered sectors make the Resonator exist even at `(0,0,0)`, where coarse field remains OFF.
4. The physical core has 64 states. The fully active subset retains 27 configurations. Active lateral symmetry requires `α = β > 0`, producing 9 primary symmetric configurations across three active FIRE bands. Asymmetric and one-wing-active partial states are legal; exact scoring remains open.
5. `α` and `β` are intensities of opposed wings, not signed curvature directions. Minimum semantics may include `(α+β)/2`, `α-β`, separate activity flags and FIRE depth band; names, normalization and scoring are not frozen APIs.
6. Sector control owns lock, local setting and bounded motion commands. Resonator Field Domain observes state read-only and owns descriptor/field response without controlling MotionRoot. `PlatformEnergyVfxActor` separately owns procedural platform/Zwornik energy. Field lensing is a separate read-only presentation concern.
7. METAL and WATER remain later advanced tuning/amplification with wing rotation and tilt. Their philosophy is `0° = OFF`, followed by one-direction target detents `13° / 23° / 36°`; coupling, combinations, scoring, gesture mapping and descriptor roles remain open.

## 2026-08-27 — IMPLEMENTED R2B local core-sector motor

1. R2B owns runtime-local committed levels and continuous motor angles for EARTH, WOOD and FIRE only. Levels `0/1/2/3` map exactly to `0°/13°/23°/36°`; Progress Floor is only their bounded physical projection.
2. Hand deflection is hysteretic direction intent, not a direct sector-angle mapping. Motion uses constant `16°/s`, pauses `0.12 s` at each new detent, continues while intent is held, and settles smoothly to the last committed detent after GRIP release.
3. Trigger priority remains owned by R2A: it suppresses new local drive and causes a neutral-reference rebase before local control resumes. The existing global gyro owner is unchanged.
4. Each real new detent emits exactly one semantic `DETENT_COMMITTED` event, including commits down to level 0. Defensive read-only level/angle and motion-phase seams are available to future Field/VFX/audio owners.
5. Spark VFX, grip beam, detent/motion audio, Field Actor/descriptor, scoring/target response, lensing and METAL/WATER motion remain not implemented.

## 2026-09-01 — CURRENT implemented R2A acquisition and volumetric presentation checkpoint

This checkpoint supersedes only earlier status statements that presented R2A acquisition or its sector acquisition beam as not implemented.

1. R2A powered-sector acquisition is implemented. It raycasts only the separate invisible flat target surfaces derived from each authored sector BASE, then independently applies installed-Rune powered legality and requires `1.0 s` on the same legal target for `SECTOR LOCK`.
2. Each flat target surface remains above and outside local MotionRoot, inherits the global platform transform and does not tilt with local sector motion. The presentation endpoint is instead the moving panel-3 anchor inside MotionRoot.
3. The presentation-only sector acquisition beam is implemented as a reusable tapered volumetric tube, distinct from Platform Energy ribbon bolts. It starts at the live Asterion Sphere center, follows the quadratic path with stable transported frames and terminates in a rounded volumetric contact at the moving panel-3 endpoint.
4. Acquisition presentation and glow do not own powered truth, candidate/lock truth, progression, sector motion or Field truth. Target selection/response beyond this implemented acquisition contract, Field presentation and related audio remain future.

## 2026-09-01 — CURRENT implemented R4 Resonator Field Actor checkpoint

This checkpoint supersedes only earlier status statements that presented the core Field Actor or descriptor as not implemented. Historical signed-field decisions remain preserved history and remain superseded by the unsigned-level decision of 2026-08-27.

1. One R4 Resonator Field Actor is implemented as an event-driven, read-only derived owner. It consumes canonical installed Rune truth and committed EARTH/WOOD/FIRE levels only; transient physical angles do not enter Field truth.
2. Its immutable descriptor preserves the unsigned `0/1/2/3` level semantics, POWERED versus FIELD-ACTIVE distinction, 64 physical states, 27 fully active configurations and 9 primary active symmetric configurations established on 2026-08-27.
3. Semantic descriptor changes are deduplicated. Descriptor truth commits before notification, and subscriber failures are isolated so one consumer cannot corrupt committed state or block other subscribers.
4. METAL and WATER do not contribute to the implemented core Field. Target selection/scoring and response, Field/lensing presentation and Field audio remain future.

## 2026-09-01 — CURRENT final R2B physical and gesture checkpoint

This checkpoint refines the implemented R2B motor decision and supersedes conflicting edge-direction or gesture-status wording without changing unsigned levels, detent semantics or Field state-space decisions.

1. EARTH and WOOD rotate around fixed mirrored outer radial hinges at `+36°` and `-36°` from sector-local `+Z`. Both axes pass through sector origin; MotionRoot position remains identity, and only the mirrored hinge quaternion changes. Their inner edges facing FIRE descend while the outer hinge edges remain fixed.
2. FIRE retains its bounds-derived inner radial pivot and downward physical pitch. All three core sectors retain exact physical detents `0° / 13° / 23° / 36°`, and the rigid MotionRoot subtree remains the physical movement boundary.
3. Gesture geometry is independent from physical hinge geometry. EARTH/WOOD read sector-local `+Z` at a `45°` engage threshold. FIRE reads local `+X` with the existing negative gesture sign at a `30°` engage threshold, so HAND DOWN increases level/physical descent and HAND UP returns toward level 0. All share `10°` release hysteresis.
4. Gesture input produces only semantic intent `-1 / 0 / +1`; motor speed is constant rather than proportional to hand angle. `DETENT_COMMITTED` remains semantic `UP` for a level increase and `DOWN` for a decrease, not a description of world-space movement.

## 2026-09-01 — CURRENT implemented Platform Energy profiles and ownership checkpoint

This checkpoint supersedes only the target-status and obsolete active-source statements in the 2026-08-26 Platform Energy decision.

1. One shared bounded `PlatformEnergyVfxActor` is implemented with `RUNE_BINDER_REVEAL`, `SECTOR_ACQUISITION` and `FLOOR_DRIVE`. `RUNE_INSTALL` remains future and not implemented.
2. Binder reveal consumes live sector-complete readiness transitions and targets the live Rune Bridge presentation endpoint when available, failing soft to a surface bolt when that endpoint is unavailable. Acquisition energy reads only R2A acquisition state/progress.
3. CURRENT `FLOOR_DRIVE` reads actual same-frame EARTH/WOOD/FIRE physical angle changes through the R2B projection. It does not activate from stale motion-state labels and does not use the old global Asterion Gyro source contract. This does not prohibit a separately designed global-drive energy concept in the future.
4. Actor and projections are read-only presentation owners. They never write progression, Rune installation truth, acquisition truth, sector levels, physical motion or Field truth.

## 2026-09-01 — CURRENT bounded leader-inspired lightning checkpoint

1. Platform Energy uses a bounded reusable pool of shader-expanded screen-facing ribbon bolts. Geometry, material and path storage are allocated for reuse rather than created at spawn; the combined shader provides a near-white narrow core and softer halo. The volumetric sector acquisition beam is a separate presentation system.
2. Morphology is stochastic, leader-inspired and physics-inspired presentation, not an electromagnetic simulation. Spawn-time variation uses `Math.random()`; per-frame flicker is deterministic from stored seed and age. Width, brightness, lifetime, tortuosity and branching remain bounded.
3. Branch origins are curvature-biased from final rendered main-path points with a practically straight-path fallback. Branches are one generation only, use the local parent tangent and stable bolt-local perpendicular frame, and fail soft at shared-pool saturation without cancelling the main bolt.
4. Reveal, `FLOOR_DRIVE` and Binder feeds allow `0..3` branches; acquisition allows at most one. Independent multilayer bolt shells remain future. A final reveal pulse suppressed by pool saturation is not guaranteed to retry.
5. Settings normalization does not restore ordering for `acquisitionSpawnIntervalStartSeconds` / `acquisitionSpawnIntervalEndSeconds` or `acquisitionStrengthMin` / `acquisitionStrengthMax`. This is a known settings-contract gap, not an undefined/NaN runtime path.

## 2026-09-01 — BINDING Asterion Resonator field geometry and presentation target

This decision supersedes conflicting depth-band and field-presentation assumptions above. It does not change sector motion, Rune/Scenario/Guidance ownership, or the implemented R4 descriptor.

1. The visual field uses Resonator-local coordinates: `X` is depth outward from the platform, `Y` is vertical height, `Z` is lateral width, `Z-` is left, and `Z+` is right.
2. One continuous 16-point cage contains four four-corner slices. `S0=(X 0 m, width 8.25 m, height 5.50 m)`, `S1=(43.333333 m, 11.75 m, 8.50 m)`, `S2=(86.666667 m, 18.25 m, 11.50 m)`, and `S3=(130 m, 27.75 m, 14.50 m)`; every slice uses corners `(X, ±height/2, ±width/2)`. Their span averages are the approved Level 1 `~10 × 7 m`, Level 2 `~15 × 10 m`, and Level 3 `~23 × 13 m` bands.
3. EARTH/`α` controls the left profile, WOOD/`β` the right profile, and FIRE/`γ` selects depth. Canonical `γ` is `0=NONE/OFF`, `1=NEAR (S0→S1)`, `2=MID (S1→S2)`, `3=FAR (S2→S3)`. The unchanged runtime still exposes `NONE/FAR/MID/NEAR`; this is a CURRENT IMPLEMENTATION GAP.
4. In a fully active `(α,β,γ)` state, `γ` selects near/far `X` planes; `α` and `β` select the endpoint dimensions of their corresponding canonical left/right band profiles, which are transplanted onto that depth span to create the nominal eight active-volume corners.
5. The core retains 64 physical states, 27 fully active states, and nine laterally symmetric (`α=β>0`) states. All 27 fully active states are legal, but only coherent presets `111`, `222`, and `333` may fully reveal the distant Large Glyph. The other 24 may lose stability/energy and may affect other supported objects. Exact scoring is not frozen.
6. The cage is rounded and deformable, never a sharp box. Per-side mismatch is `dLeft=abs(α-γ)` and `dRight=abs(β-γ)`; CURRENT TARGET fillet strength is `8%` for difference `0`, `15%` for `1`, and `22%` for `2`. Signed mismatch may choose wall-bow direction; exact bow amplitude remains TUNING.
7. The future read-only presentation is one lightweight translucent deformable skin plus one brighter curved edge/skeleton layer, semantically driven by the 16-point cage and committed `FieldDescriptor`. The target direction is a low-vertex custom indexed `BufferGeometry`, Bézier-style rounded paths, and few intermediate cross-sections. CSG, boolean geometry, raymarching, required volumetric textures, 27 authored meshes, and visually sharp 90-degree corners are excluded. Opacity, shader values, subdivisions, line thickness, and transition timing remain TUNING.
8. A supported object inside the field may show a bright green halo and its Proto-Astro sign, with no additional quest marker or UI decoration. This response and the field presentation are CURRENT TARGET / NOT IMPLEMENTED.

## 2026-09-02 — BINDING Resonator side-aperture geometry and canonical forward alignment (SUPERSEDES FIXED-CAGE APERTURE/ORIGIN ASSUMPTIONS)

This decision supersedes the fixed `S0–S3` aperture dimensions and field-origin assumptions in the 2026-09-01 field geometry decision. It preserves sector motion/detents, FieldActor and Scenario/Guidance/Rune ownership, lightweight presentation architecture, and the exclusive `111 / 222 / 333` full Large Glyph revelation rule.
1. Semantic axes are authoritative: FORWARD scans away from the platform, LATERAL runs left ↔ right, and VERTICAL runs down ↔ up. The current Three.js target maps them to platform-local `+Z`, `X`, and `Y` respectively.
2. Canonical Experience VR `entryDirection = (0,0,+1)` defines FORWARD. The authored progress-floor sector layout must point FIRE's outward radial axis along it, and the field follows that axis. This is not live Monkey-head tracking. Astro Furnace, Portal, Crystal Reliquary, their controls/buttons, and the player passenger hierarchy remain outside the layout rotation; no runtime transform API is established here.
3. The first visible/effective field boundary is `10 m` along FORWARD. Cage depth planes are `D0=10 m`, `D1=50 m`, `D2=90 m`, and `D3=130 m`. FIRE/`γ` controls depth only: `0=NONE`, `1=NEAR 10–50 m`, `2=MID 50–90 m`, `3=FAR 90–130 m`.
4. EARTH/`α` independently selects the LEFT aperture half-profile and WOOD/`β` the RIGHT. Half-extents from the field center axis are: level 1 WIDE/LOW = `23 m` LATERAL and `7 m` VERTICAL; level 2 BALANCED = `13 m / 13 m`; level 3 NARROW/HIGH = `7 m / 23 m`. Symmetric full dimensions are therefore `46×14 m`, `26×26 m`, and `14×46 m`. Unequal sides intentionally create asymmetric nominal apertures.
5. The core remains 64 physical states and 27 fully active configurations. All 27 are legal, but only `111` (NEAR, wide/low), `222` (MID, balanced/square), and `333` (FAR, narrow/high) may fully reveal a Large Glyph. Target scoring is not defined.
6. A reusable rounded 16-corner cage remains valid: the active band's near and far boundaries use the same selected LEFT and RIGHT profiles, while gamma supplies only FORWARD coordinates. No 27 authored geometries are introduced.
7. Rounded/Bézier-style fillets remain, including permissible mismatch tuning `8% / 15% / 22%`. Bow remains an optional secondary electromagnetic presentation cue; nominal aperture coordinates now provide the primary deformation, and exact bow amplitude remains TUNING. The translucent skin, brighter curved skeleton, reusable topology, and morphing direction remain approved; CSG, boolean geometry, raymarching, required volumetric textures, and 27 authored meshes remain excluded.
8. The supported-target response remains a bright green halo plus the target's Proto-Astro sign, without another quest marker or HUD decoration.
9. CURRENT IMPLEMENTED RUNTIME is not aligned with this superseding target: its resolver uses the prior fixed `S0–S3` origin-based geometry; side levels lack the new half-extents; signed bow derives from that former geometry; presentation is parented under fixtures; and the sector layout has not been intentionally aligned so FIRE/FORWARD matches entryDirection. These are new implementation gaps, not defects in the superseded implementation.

## 2026-09-02 — BINDING Experience VR platform and Rune audio timing corrections

1. Branch-specific `electricity_short_01–05` now plays on the first valid frame of a genuinely new powered-sector `ACQUIRING` attempt, not after the unchanged `1.0 s` lock dwell; invalid contact, bare GRIP, reset and reconstruction remain silent.
2. Live Zwornik arrival remains exactly `130 m` outward but now lasts `4.0 s`: `electricity_short_06` stays at `t=0.0 s`, while `DOCKED` and branch-specific `zwornik_*` occur only at physical completion at `t=4.0 s`. Hydration remains silently settled.
3. During live Rune Stone installation, branch-specific `creating_01–05` plays exactly once when final `DESCENT` first has `<= 1.0 s` remaining, or at `DESCENT` start if its full duration is `<= 1.0 s`. This anticipation does not advance physical, bridge, progression or installed-spatial-audio truth, and reconstruction remains silent.
4. Persistent Rune Stone spatial audio is eligible only when physical `INSTALLED` and installed-family progression truth agree. It is a separate lifecycle from Attractor audio and is restored idempotently by reconstruction without replaying pull or installation cues. Position is owned by a dedicated Progress Floor sector anchor at local `+Z = 8.0 m`, sibling to `SectorMotionRoot`; it inherits platform/gyro/layout/sector yaw but not detent tilt and explicitly does not follow the stone root, installation anchor or bridge. The DEVICE source uses the shared HRTF/linear spatial primitive with `refDistanceMeters = 0.25`; its former `maxDistanceMeters = 2.0` tuning is **SUPERSEDED** by the latest entry above.

## 2026-09-02 — CURRENT equal-27 target containment and resonance acquisition (SUPERSEDES SPECIAL `111 / 222 / 333` REVELATION)

This decision supersedes every earlier target-selection, scoring, revelation, or presentation statement that gives coherent `111 / 222 / 333` configurations special authority or prescribes a generic bright-green halo. It does not change field geometry, sector motion, depth planes, aperture dimensions, forward alignment, Rune ownership, or Scenario boundaries.

1. All 27 fully active `(α,β,γ)` configurations have identical target-detection authority. The three channels define only LEFT aperture, RIGHT aperture, and depth geometry. There is no target-family mapping, revelation password, scoring privilege, or Large Glyph privilege. Any configuration containing a core LEVEL 0 performs no target acquisition.
2. A registered supported target is detected only while its canonical detection anchor lies inside nominal active-field geometry. Fillets, bow, skin/skeleton geometry, opacity, morphing, and other presentation tuning do not affect containment. The mechanism is generic, not Large-Glyph-specific.
3. First detection shows the target's Proto-Astro sign. Continuous containment completes stages at `2 / 4 / 6 s`, adding rings 1/2/3. Exactly three rings mean full acquisition / `PULL_READY` and begin a slow pulse. Fractional stage progress is discarded on exit; only completed stages are retained.
4. Only `PULL_READY` grants eligibility to become targetable/pullable by Astrolabium Więzi. Astrolabium remains the owner of attraction; Resonator acquisition never performs the pull.
5. Outside the field, acquisition stops and one completed ring decays every `20 s`: `3 → 2 → 1 → 0`. Three rings remain ready; `3 → 2` removes eligibility. Re-entry stops decay, resets the current outside interval, and resumes from retained rings, requiring `0 / 2 / 4 / 6 s` from three/two/one/zero. Every later exit starts a fresh 20-second interval. Exact within-interval fades remain TUNING.
6. The sign remains visible through acquisition, readiness, and ring decay, then for an additional `60 s` after ring 0. This sign-only memory is not ready and requires full six-second reacquisition. After that minute outside, the sign disappears and undiscovered presentation returns.
7. Target presentation is the Proto-Astro sign plus up to three thin target-centered rings, all in the target's family presentation color. The sign always faces the current player head and keeps approximately constant apparent size across depth. Exact sizing calculations/clamps, ring geometry, line thickness, spacing, pulse values, and fade curves are TUNING; no renderer, shader, billboard, actor, or registry API is established.
8. Resonator Field geometry/domain owns active state and nominal shape. Future containment owns geometric inclusion. Future resonance acquisition owns per-target stages, timing, decay, sign memory, and `PULL_READY`. Field Presentation is read-only. Scenario/Guidance interprets discovery and progression without owning physical truth.
9. This is design canon only. Containment, resonance state/timing, rings/sign response, and Astrolabium eligibility integration are FUTURE / NOT IMPLEMENTED. Current field-shape runtime still exposes superseded `coherentPreset / largeGlyphRevealEligible`; that mismatch is an explicit implementation gap and runtime code is unchanged by this decision.

## 2026-09-02 — CURRENT implemented Resonator field and target-runtime checkpoint (SUPERSEDES CONFLICTING ACTIVE STATUS CLAIMS)

This checkpoint preserves earlier entries as historical evidence while superseding their conflicting implementation-status claims.

1. Revised nominal field geometry/alignment is active runtime: semantic FORWARD/LATERAL/VERTICAL map to Three.js `+Z/X/Y`, the dedicated Resonator Field Frame follows FIRE outward / `entryDirection`, and the `10 / 50 / 90 / 130 m` depth planes plus independent `23/7`, `13/13`, `7/23 m` side profiles own gameplay geometry. All 27 fully active states have equal authority; partial LEVEL-0 states do not acquire, and no `111/222/333` privilege or configuration scoring/password remains.
2. Generic registered-target containment is active against canonical anchors in Field Frame local coordinates and nominal resolved shape only. Presentation fillets, bow, skin, skeleton, opacity and morphing do not affect it. The five Large Glyph nodes are the current registered target set, not the limit of the generic architecture.
3. Independent per-target resonance is active: sign at first valid containment, rings at `2 / 4 / 6 s`, exactly three rings as `PULL_READY`, `20 s` per-ring outside decay, and an additional `60 s` zero-ring sign memory. Only completed stages persist.
4. The read-only response is the family-colored canonical Proto-Astro sign plus up to three target-centered rings; all three pulse at `PULL_READY`. The generic Large Glyph halo is removed from this reacquisition path. Exact sizing, opacity, thickness, palette, pulse and scale calculations remain TUNING.
5. Large Glyph Astrolabium consumes bounded `PULL_READY` eligibility while retaining selection, attraction, capture and cancellation/return ownership. It does not compute containment, ring count or timing, and pull start neither resets nor freezes Resonator state.
6. Scenario remains authored only through `5.10`. Resonator field/target audio, METAL/WATER/ETHER contribution, later supported target classes and finale work remain FUTURE / NOT IMPLEMENTED. Quest hardware comfort and perceptual sign/ring/color/pulse/containment/timing QA remain outstanding.
