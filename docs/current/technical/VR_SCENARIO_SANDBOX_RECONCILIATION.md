# Experience VR Scenario Sandbox Reconciliation

Status: **CURRENT / BINDING DESIGN TARGET / IMPLEMENTATION PENDING**

This document freezes the future reconciliation law for moving the mostly linear Experience VR Scenario toward a bounded sandbox-compatible model. It extends, and does not supersede, [`VR_SCENARIO_DIRECTOR_MODEL.md`](VR_SCENARIO_DIRECTOR_MODEL.md), [`VR_RUNTIME_MODEL.md`](VR_RUNTIME_MODEL.md), [`VR_ASTROLABIUM_SANDBOX_MIGRATION.md`](VR_ASTROLABIUM_SANDBOX_MIGRATION.md), and [`VR_PROTO_ASTRO_MODEL.md`](VR_PROTO_ASTRO_MODEL.md). Nothing described here as a target is implemented by this concept freeze.

## 1. Problem being solved

The current Scenario assumes that some legitimate gameplay achievements occur only while Director is waiting at the matching authored point. That conflicts with the emerging sandbox model:

```text
CAN_USE_GLYPHS
→ Intro gate only
→ continuous from 2.10 onward

Astrolabium family knowledge
→ domain-owned
→ independent from Scenario progression
```

Runtime can already form `Large Glyph → getNextCrystalTier(node) → Crystal`, but ordinary Reliquary use remains Scenario-capability gated. After the first ring, Scenario temporarily removes `CAN_USE_RELIQUARY`, `CAN_ACTIVATE_RELIQUARY`, and `CAN_RELEASE_RELIQUARY` through the post-first-ring `2.40–3.80` sequence. This blocks legitimate later portfolio progress through sandbox play.

Restoring access alone is insufficient. `CARD_COMMITTED` or `TIER_COMPLETED` may occur while the current point has no route for that event. A one-shot domain achievement can precede the authored wait and must not be required twice.

## 2. Core canon and ownership

```text
DOMAIN TRUTH MAY ADVANCE AHEAD OF SCENARIO
SCENARIO MUST RECONCILE TO DOMAIN TRUTH

not:
DOMAIN TRUTH MUST WAIT FOR SCENARIO
```

Scenario remains responsible for dramaturgy, Monkey guidance, authored presentation, narrative timing, story-only permissions, and selecting the next still-relevant narrative checkpoint. Scenario is not authoritative for already-legal sandbox gameplay truth.

## 3. Player intent and sandbox philosophy

The player may ignore Monkey guidance and experiment. Understanding legitimate mechanics should produce real progress, with every action still subject to its physical and domain requirements:

```text
Shell
→ Small Glyph
→ extracted family knowledge
→ Large Glyph
→ Crystal
→ Reliquary
→ portfolio page
→ next Crystal tier
```

Monkey teaches, guides, and interprets; Monkey is not a mandatory permission broker for a mechanic the player has already solved.

## 4. Sandbox frontier

The first three portfolio rings are sandbox-progressible:

```text
RING 1
RING 2
RING 3
= sandbox-progressible
```

The third completed ring is the frontier. In current `ProgressionController` terminology:

```text
currentTier === 4
→ Tier 1 complete
→ Tier 2 complete
→ Tier 3 complete
```

That is authoritative portfolio/domain truth. This target does not redefine `ProgressionController`.

## 5. Natural hard barrier after the third ring

After Ring 3, Large Glyphs reach `SPHERE_FAR`. Astrolabium family knowledge alone is then insufficient:

```text
family knowledge
+ Resonator PULL_READY
→ Astrolabium may pull the distant Large Glyph
```

Operating the Resonator/antenna requires the Asterion platform-control tool. Player knowledge may bypass guidance through the first three rings, but completion of the third ring reaches a genuine Asterion-dependent mechanical boundary. World mechanics, not an artificial Scenario lock, prevent completion merely by ignoring Monkey.

## 6. Asterion must not gate Rings 2–3

```text
Asterion ownership
≠ prerequisite for Tier 2
≠ prerequisite for Tier 3
```

The current authored spine places `ASTERION_CLAIMED` before the ordinary second-ring Scenario loop. That is current runtime structure, not the binding future sandbox law. Future reconciliation must permit legitimate Ring 2 and Ring 3 progress without Director first passing the existing Asterion narrative gate. Exact point topology is not redesigned here.

## 7. Reliquary sandbox law

The Reliquary reveal remains an authored Intro/early-game boundary. Ordinary use may remain unavailable before physical reveal completion. After the Reliquary is legitimately revealed and physically interaction-ready, Scenario movement must not revoke its ordinary lifecycle:

```text
Crystal physically available
→ grab
→ insert
→ activate
→ preview
→ release / commit
```

```text
RELIQUARY PHYSICALLY READY
≠ CURRENT SCENARIO POINT

portfolio canInsertCrystal(...)
= domain legality

physical socket / inserted state
= physical legality

Scenario
= observer / presenter
```

The exact future treatment of `CAN_USE_RELIQUARY`, `CAN_ACTIVATE_RELIQUARY`, and `CAN_RELEASE_RELIQUARY` remains an implementation-audit decision. The binding outcome is that, after the first legitimate reveal, Scenario creates no later temporary dead zones for ordinary Reliquary gameplay. This document changes no capability.

## 8. Events are observations, not the only truth source

`CARD_COMMITTED` and `TIER_COMPLETED` remain useful immediate observations, but cannot be the sole evidence of persistent achievement:

```text
EVENT
= immediate observation

DOMAIN SNAPSHOT
= authoritative persistent truth
```

If `TIER_COMPLETED` occurred while Scenario was elsewhere, the event may have been missed while the achievement remains true. Later reconciliation must read `currentTier` and must not await the same tier completion again.

## 9. Scenario Progress Reconciler

The conceptual future component is the **Scenario Progress Reconciler**. Its responsibility is frozen; its runtime class/module name is not.

```text
DOMAIN TRUTH CHANGES
        ↓
reconciliation
        ↓
is current Scenario still semantically relevant?
        ↓
YES → stay
NO  → resolve nearest still-relevant narrative checkpoint
        ↓
Director catch-up
```

The reconciler reads authoritative facts; it does not own them.

## 10. Catch-up moves story, never fabricates world state

Live reconciliation may move Director/Scenario narrative position. It must not create physical or domain achievements. Catch-up must never award or infer Astrolabium `EARNED`, Asterion `EARNED`, processed Shells, extracted family knowledge, Rune tuning, Rune installation, portfolio pages, or Resonator `PULL_READY`. If the player did not perform an action, reconciliation cannot pretend that they did.

## 11. Live catch-up is not `activatePoint()`

Current `RuntimeExperience.activatePoint(pointId)` uses the reconstruction lifecycle:

```text
stateAt(pointId)
→ hydrate reconstructed settled state
→ replace Director
→ activate point
```

That lifecycle is valid for QA, reconstruction, debug checkpoint activation, and deliberate state hydration. It is invalid for live sandbox reconciliation because `stateAt()` accumulates authored `settledConsequences`, potentially including `astroProduction = EARNED`, `asterionProduction = EARNED`, progression tiers, and Rune progression.

```text
LIVE SCENARIO CATCH-UP
≠ stateAt()
≠ hydrate()
≠ activatePoint()
```

Live catch-up must preserve existing domain state.

## 12. Existing Director narrative-skip semantics

**CURRENT / FACT:** `ExperienceDirector` supports an `EXPLICIT` transition to a target point, proving that narrative position can change without canonical-next traversal.

This document does not prescribe the future mechanism. The implementation audit may select explicit authored reconciliation transitions, a bounded Director catch-up API, or a small layer above Director, provided it moves narrative position without reconstruction or fabricated domain state.

## 13. Idempotence

```text
same domain snapshot
+ same Scenario state
→ repeated reconciliation produces no additional side effects
```

Reconciliation must not repeatedly replay Monkey dialogue, world reveals, audio, or tier feedback; commit pages; generate crystals; award tools; retune Runes; or rebuild Asterion.

## 14. Skipped points do not play

Obsolete points are skipped, not executed rapidly in sequence. Obsolete observation windows, Monkey attention/dialogue, tutorial hints, and waiting points must not fire after the player has solved their mechanics. Catch-up removes stale dramaturgy rather than replaying it faster.

## 15. No skipped entry-effect replay

```text
points skipped by live reconciliation
→ their entryEffects are NOT automatically executed
```

Only explicitly intended live-entry behavior at the destination may run. A future implementation must audit which destination effects remain meaningful; this document does not define that mapping.

## 16. Large Glyph physical stage catch-up

Portfolio truth must not leave the Large Glyph world permanently behind:

```text
Ring 1 complete
→ Large Glyph world advances toward RING_ELEVATED

Ring 2 complete
→ Large Glyph world advances toward RING_EXPANDED

Ring 3 complete
→ Large Glyph world advances toward SPHERE_FAR
```

`createVrLargeGlyphActor` remains physical owner of its stage. `ProgressionController` remains owner of portfolio tier truth. A future read-only reconciliation/projection may request actor transitions; stage ownership must not move into `ProgressionController`.

## 17. Preserve actor transition order

```text
RING_INITIAL
→ RING_ELEVATED
→ RING_EXPANDED
→ SPHERE_FAR
```

Reconciliation must preserve this legal transition lifecycle. If portfolio truth is already Tier 4 while the actor is `RING_ELEVATED`, physical catch-up proceeds `RING_ELEVATED → RING_EXPANDED → SPHERE_FAR`. Live catch-up must not teleport, illegally mutate, or rehydrate the actor.

## 18. Third-ring reconciliation decision

```text
currentTier >= 4
→ first three rings are already complete
→ narrative beats whose only purpose was teaching/waiting for those rings are obsolete
```

The destination then depends on the complete domain snapshot:

- If Asterion is not legitimately earned, Scenario reconciles toward the still-relevant Asterion acquisition boundary, never a point that assumes ownership.
- If Asterion is legitimately earned, Scenario may pass obsolete Asterion-acquisition guidance toward the third-ring/Resonator boundary.
- If later required physical facts are also true, reconciliation may continue to the next still-relevant checkpoint.

## 19. Never infer tool ownership from portfolio tier

```text
Tier 3 complete
≠ Astrolabium EARNED
≠ Asterion EARNED
≠ Resonator ready
```

These facts remain independent even when a combination is impossible in ordinary play today. This protects QA, hydration, future design changes, and recovery from unusual play order.

## 20. Monkey role

Monkey remains the canonical guide for guidance, interpretation, and narrative—not the mandatory permission broker for understood mechanics. A guided player receives the authored experience; successful experimentation may obsolete guidance. Beyond the sandbox frontier, Monkey can regain importance as genuine new requirements appear.

## 21. Bounded scope

The initial binding scope is ordinary portfolio progression through Rings 1–3, Large Glyph physical ring stages, ordinary Reliquary lifecycle, Scenario catch-up around those achievements, and the Asterion mandatory frontier.

This does not grant free-order progression for Tier 4/Tier 5, Ether intervention or Rune tuning, the Water special path, Rune installation, advanced Resonator, finale, or XR ending. Existing story/domain laws remain binding until explicitly redesigned. This is not an “everything is sandbox” model.

## 22. Current facts versus canonical target

### CURRENT / FACT

- `ProgressionController` owns committed pages and `currentTier`; `commitPage()` advances tier from persistent page truth.
- `CARD_COMMITTED` and `TIER_COMPLETED` are emitted through semantic handoff.
- Director ignores an event for which the current point has no route and supports `EXPLICIT` transitions.
- `RuntimeExperience.activatePoint()` reconstructs and hydrates canonical point state.
- The current Asterion gate precedes the ordinary second-ring Scenario loop.
- Reliquary capabilities disappear during the post-first-ring `2.40–3.80` sequence.
- The Large Glyph actor owns its physical stage and ordered legal transitions.
- `CAN_USE_GLYPHS` is continuous from `2.10`.
- Astrolabium Large Glyph family knowledge and late Resonator `PULL_READY` are separate truths.

### KANONICAL TARGET / NOT IMPLEMENTED

- Reliquary remains sandbox-usable after first legitimate reveal.
- Portfolio Rings 1–3 may advance ahead of Scenario.
- Scenario reconciles/catches up to domain truth, so missed historical events cannot deadlock it.
- Obsolete narrative points may be skipped without hydrating or fabricating domain state.
- Large Glyph physical stage catches up to completed Rings 1–3 through legal transitions.
- Asterion is the genuine required boundary after Ring 3, not a prerequisite for Rings 2–3.

## 23. Reference player paths

### Guided path

```text
player follows Monkey
→ Scenario and domain truth remain approximately aligned
→ reconciliation does nothing
```

### Partial sandbox path

```text
player legitimately progresses faster than Monkey
→ commits some Tier 2 pages
→ Scenario remains behind
→ reconciliation recognizes current domain truth
→ stale guidance is skipped
→ next still-relevant checkpoint remains active
```

### Full early sandbox path

```text
Ring 1 complete
→ player experiments

Shell
→ Small Glyph
→ essence
→ Large Glyph
→ Crystal
→ Reliquary

Ring 2 complete
→ continues experimenting

RING 3 complete
→ currentTier = 4
→ Large Glyph world reaches SPHERE_FAR

Asterion not earned
→ Scenario catches up to Asterion-required boundary
→ player must legitimately obtain/build/claim Asterion
→ no domain truth is fabricated

Asterion earned
→ Resonator/platform path becomes the next meaningful progression
```

## 24. Forbidden anti-patterns

```text
repeat TIER_COMPLETED until Scenario happens to listen

make every intermediate point consume every possible event

activatePoint(futurePoint) during live play

hydrate settledConsequences to simulate skipped gameplay

infer Asterion EARNED because Tier 3 is complete

replay every skipped Monkey / presentation beat

move portfolio truth back to match Scenario

make Scenario the owner of Astrolabium knowledge or portfolio pages
```

## 25. Future implementation audit

Before implementation, the next thread must audit:

1. exact current Reliquary capability consumers;
2. exact first-reveal physical readiness owner;
3. `CARD_COMMITTED` / `TIER_COMPLETED` event handling across current points;
4. minimal reconciliation trigger points;
5. safe way to move Director without hydration;
6. cancellation of stale active Monkey/presentation actors;
7. mapping from domain snapshot to nearest still-relevant Scenario checkpoint;
8. Large Glyph stage catch-up sequencing;
9. behavior when Tier 2 or Tier 3 completes during a physical Large Glyph transition;
10. debug/hydration separation from live reconciliation;
11. how Scenario enters the Asterion-required frontier when Asterion is absent;
12. behavior when Asterion is already legitimately earned;
13. preservation of later Rune/Ether/Water story gates.

This checklist is an implementation precondition, not work completed by this document.
