# Experience VR — Scenario sandbox reconciliation

Status: **CURRENT / BINDING target, foundation partially implemented — 2026-09-11**. This document defines reconciliation law for ordinary portfolio Rings 1–3. Runtime orchestration by a Scenario Progress Reconciler remains **NOT IMPLEMENTED**.

## 1. Core canon and ownership

```text
DOMAIN TRUTH MAY ADVANCE AHEAD OF SCENARIO
SCENARIO MUST RECONCILE TO DOMAIN TRUTH
```

`ProgressionController` owns committed pages and `currentTier`. Scenario owns mandatory dramaturgy, authored presentation and story-only permissions. Actors retain physical state. Monkey guides and interprets; it is not a permission broker for mechanics the player has already legitimately solved.

After legitimate reveal, the ordinary Reliquary lifecycle is governed by domain and physical legality, not by the current Scenario capability set. The first three portfolio rings are sandbox-progressible, with mandatory completion beats between sandbox intervals.

## 2. Current canonical topology

Asterion is neither a Ring 2 nor Ring 3 prerequisite. It becomes the mechanical frontier only after the mandatory Ring 3 completion boundary:

```text
Ring 2 completion
4.20 → 4.30 → 4.40 → 4.50 → 4.60

Ring 3 completion and frontier
4.70 → 4.75 → 3.80 → 4.80
```

Point `4.75` is the explicit mandatory Ring 3 completion point. Its self-contained entry feedback and physical Large Glyph sphere distribution must settle before `THIRD_RING_COMPLETION_PRESENTATION_COMPLETED` advances Scenario to `3.80`. Rings 1 and 2 likewise begin their mandatory completion effects at destination points `2.40` and `4.20`; these entry effects do not require predecessor event payload.

Sandbox freedom exists between these mandatory completion beats. The mandatory sequence is not optional merely because portfolio truth can advance early.

## 3. Current implemented reconciliation foundation

The runtime now provides bounded primitives and seams required by later orchestration:

- ordinary Reliquary play remains domain/physical after its legitimate reveal;
- Ring 2 and Ring 3 topology does not require prior Asterion ownership;
- `ExperienceDirector.catchUpToPoint()` performs canonical-spine, forward-only live movement on the existing Director, without hydration, Director replacement, skipped effects, milestone loss or `lastEvent` mutation; destination entry effects are explicitly optional;
- ring-completion destination effects are self-contained and tolerate an already-hydrated Progress Floor completion;
- active presentation owners expose bounded live cancellation without destructively resetting their physical world state;
- Large Glyph exposes stage/transition/transient observation, rejects transient leases during canonical transitions, and provides a final-transient-clear wake-up callback.

These are reconciliation-safe foundations only. There is no snapshot resolver, destination mapping, automatic catch-up, domain subscription, polling loop or Scenario Progress Reconciler.

## 4. Binding future reconciler responsibility

The future reconciler reads authoritative domain and physical snapshots and determines whether the current Scenario point is still semantically relevant. If not, it resolves the nearest still-relevant mandatory checkpoint and uses bounded live catch-up.

```text
DOMAIN TRUTH CHANGES
        ↓
reconciliation audit
        ↓
current point still relevant?
  YES → stay
  NO  → resolve destination → bounded live catch-up
```

It must never fabricate world state or infer independent facts. In particular:

```text
Tier 3 complete
≠ Astrolabium EARNED
≠ Asterion EARNED
≠ Resonator PULL_READY
```

The reconciler must sequence legal Large Glyph stages in actor order:

```text
RING_INITIAL → RING_ELEVATED → RING_EXPANDED → SPHERE_FAR
```

It must wait for an active actor transition or transient lease to clear rather than teleporting, hydrating or polling the actor.

## 5. Events versus persistent truth

`CARD_COMMITTED` and `TIER_COMPLETED` are immediate observations, not the sole evidence of persistent achievement. If Scenario did not accept a one-shot event, later reconciliation must use authoritative snapshots rather than requiring the achievement again or replaying the missed event.

A missed `CARD_COMMITTED` can also leave Progress Floor card/panel presentation behind authoritative `ProgressionController.getActivatedPageIds()`, because `UPDATE_COMMITTED_CARD_PRESENTATION` is currently a Scenario transition effect. The future reconciler must audit domain portfolio snapshot against Progress Floor presentation and synchronize only missing presentation state. It must not replay historical card feedback or missed card audio, and Progress Floor ownership must not move into `ProgressionController`. This synchronization is **NOT IMPLEMENTED**.

## 6. Live catch-up contract

Live catch-up is not reconstruction:

```text
LIVE CATCH-UP
≠ stateAt()
≠ hydrate()
≠ activatePoint()
```

It is canonical-spine forward only on the existing Director. It executes no skipped transition or entry effects. A caller may explicitly request self-contained destination entry effects. Same-point movement is a no-op; backward or off-spine movement is rejected. Existing milestones and `lastEvent` remain intact.

Direct/reconstruction activation and live catch-up must be able to enter the same mandatory completion point truthfully. Synthetic predecessor payload is forbidden.

## 7. Idempotence and skipped dramaturgy

```text
same domain snapshot + same Scenario/actor state
→ repeated reconciliation adds no effects
```

Skipped points do not play rapidly. Reconciliation must not replay obsolete Monkey dialogue, observation windows, tutorials, world reveals, audio, tier feedback, card feedback, crystal generation, tool awards or Rune actions. Only explicitly authored, self-contained entry behavior at the selected destination may execute.

## 8. Natural frontier and bounded scope

After Ring 3, Large Glyphs reach `SPHERE_FAR`. Ordinary pull then requires both extracted family knowledge and Resonator `PULL_READY`; operating that path requires legitimately earned Asterion platform control. This is a physical/domain frontier, not a retroactive prerequisite for Rings 2–3.

This contract is bounded to ordinary portfolio Rings 1–3, their mandatory completion beats, ordinary Reliquary lifecycle, Large Glyph stages and the Asterion frontier. It does not alter Tier 4/5, Ether, Water, Rune installation, advanced Resonator or finale law.

## 9. Forbidden anti-patterns

```text
repeat CARD_COMMITTED or TIER_COMPLETED until Scenario listens
make every point consume every domain event
activatePoint(futurePoint) during live play
hydrate settledConsequences to simulate skipped gameplay
pass synthetic predecessor payload to destination entry effects
infer tool ownership or Resonator readiness from portfolio tier
replay skipped Monkey, presentation, card or audio effects
move portfolio truth backward to match Scenario
poll actor state waiting for reconciliation
make Scenario own portfolio, Reliquary or Astrolabium domain truth
```

## 10. Still pending / explicitly not implemented

- Scenario Progress Reconciler and its orchestration;
- authoritative snapshot → Scenario destination mapping;
- automatic calls to `catchUpToPoint()`;
- stale-point, Asterion-branch or Resonator-branch resolution;
- automatic Large Glyph desired-stage sequencing;
- reconciliation subscriptions or polling;
- Progress Floor snapshot/presentation synchronization;
- replay of missed `CARD_COMMITTED` or `TIER_COMPLETED` events.
