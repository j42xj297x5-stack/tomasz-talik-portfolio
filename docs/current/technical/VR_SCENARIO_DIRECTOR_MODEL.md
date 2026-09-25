# Experience VR Scenario and Director Model

Status: **CURRENT / BINDING**, synchronized on 2026-09-25 with the implemented canonical graph through terminal point `100.10`.

> **Cross-reference — CURRENT / IMPLEMENTED / MIGRATION COMPLETE:** [`VR_SCENARIO_SANDBOX_RECONCILIATION.md`](VR_SCENARIO_SANDBOX_RECONCILIATION.md) remains the primary authority for Rings 1–3 domain-ahead sandbox reconciliation. `ExperienceDirector` supplies the bounded, forward-only `catchUpToPoint()` primitive; `RuntimeExperience` remains the effect-execution boundary; production `ScenarioProgressReconciler` provides event-driven orchestration.

## Ownership

`Spine → Scenario → Director → RuntimeExperience / actors / domain owners`. Scenario owns the authored graph: point definitions, canonical mainline edges, accepted semantic events, transition kinds, milestones, capabilities, settled consequences and symbolic entry effects. Director owns the current point, validates transition legality, commits Scenario milestones and ensures point activation occurs once. `RuntimeExperience` executes the symbolic effects returned by Director and exposes the canonical direct-activation lifecycle. Physical, transient and committed gameplay truth remains with actors/domain controllers; neither point IDs nor debug aliases replace it.

Scenario capabilities are not a generic sandbox permission registry. Ordinary Astrolabium equip, band switching, scan, target, pull and natural Small Glyph extraction remain physical/domain laws. Genuine story permissions—including Ether tuning, the Water special path and advanced Resonator use—remain Scenario-owned without recreating ordinary natural-family eligibility.

`CAN_USE_GLYPHS` is the Intro boundary for ordinary Large Glyph ray interaction. It first appears at `2.10 — GLYPH_FREE_EXPLORE` and remains continuous through the late gameplay points where glyph interaction is meaningful. It does not express Astrolabium Large Glyph family knowledge, Resonator `PULL_READY`, or portfolio crystal eligibility: physical reach and `getNextCrystalTier(node)` remain independent restrictions.

## Authored spine and transition semantics

```text
1.10 → … → 4.10 → 4.20 → 4.30 → 4.40 → 4.50 → 4.60 → 4.70 → 4.75
→ 3.80 → 4.80 → 5.10 → 5.15 → 5.20 → 5.30 → 5.40 → 5.50 → 5.60
→ 5.70 → 5.80 → 6.10 → 6.20 → 6.30 → 100.10
```

Point order follows authored graph edges rather than numeric ID comparison. `STAY` accepts an event without moving; `COMPLETE` follows the point's canonical mainline edge; crossing-only `COMPLETE_IF` completes only when `crossingComplete === true`; `EXPLICIT` follows its named target. An accepted transition applies its own effects and, when the point changes, the destination's entry effects. `100.10` has no outgoing transitions.

| Point | CURRENT Scenario role and completion condition |
| --- | --- |
| `4.70` | Proto-Astro tuning and third-ring sandbox gameplay; real `TIER_COMPLETED` enters `4.75`. |
| `4.75` | Mandatory third-ring completion presentation; `THIRD_RING_COMPLETION_PRESENTATION_COMPLETED` enters `3.80`. |
| `3.80` | Post-third-ring Asterion frontier; waits for the real Asterion claim. |
| `4.80` | Waits for the physical Resonator result; `RESONATOR_READY` enters `5.10`. |
| `5.10` | Joins Tier 4 completion with the fourth natural Rune; `FINAL_WATER_ATTEMPT_READY` enters `5.15`. |
| `5.15` | Controlled final Water acquisition attempt; rejection alone enters `5.20`. |
| `5.20` | Begins Ether intervention; `ETHER_INTERVENTION_COMPLETED` unlocks Ether tuning and enters `5.30`. |
| `5.30` | Ether tuning is permitted; `ETHER_RUNE_TUNED` enters `5.40`. |
| `5.40` | Reveals the tuned Ether Rune for transport; `ETHER_MONKEY_CAPTURED` enters `5.50`. |
| `5.50` | Opens and communicates the Water installation path; five installed elemental Runes enter `5.60`. |
| `5.60` | Announces the full Resonator and enables advanced Resonator use; communication completion enters `5.70`. |
| `5.70` | Final Water Glyph/portfolio hunt; Tier 5 completion enters `5.80`. |
| `5.80` | Begins the final Monkey farewell and ambient wait; farewell completion enters `6.10`. |
| `6.10` | Begins final world release; completion enters `6.20`. |
| `6.20` | Begins end credits after ensuring final ambient; credits completion enters `6.30`. |
| `6.30` | Begins the final Orange Monkey VR brand slate; slate completion enters `100.10`. |
| `100.10` | Canonical terminal exit; its one-time entry effect requests XR session end. |

`4.80` enters with `SET_MAIN_AMBIENT_04` and `CHECK_RESONATOR_JOIN`; the check handles a Resonator that already exists. `5.10` similarly uses `CHECK_FINAL_WATER_ATTEMPT_JOIN` so Tier 4 and fourth-Rune results may arrive in either order. These semantic joins observe domain truth rather than creating or owning it.

The Intro's authored early-exit choices remain explicit branches to the same terminal. At `1.100` and `1.120`, choice 3 first stays while the Monkey exit reaction runs; only `INTRO_EXIT_REACTION_COMPLETED` explicitly targets `100.10`. The canonical mainline also reaches `100.10` from `6.30` by `COMPLETE`.

## Reconstruction, activation and entry effects

`stateAt(X)` folds settled consequences strictly before `X`. It describes state implied by Scenario history at `X`; it does not pre-apply `X`'s settled consequence or replay transient interactions. Thus `stateAt(4.75)` enters rather than pre-settles the third-ring completion presentation, while later points reconstruct its settled `SPHERE_FAR` result. The same history-derived rule applies to late portfolio, Rune/Ether, farewell, world-release and credits state.

Canonical direct activation is:

```text
restore baseline → stateAt(X) → hydrate domain owners → synchronize derived state
→ replace Director at X → activateCurrentPoint()
```

Activation places the Director at `X` and executes `X`'s entry effects exactly once. Repeating `activateCurrentPoint()` for that Director is a no-op. This keeps reconstruction separate from entry choreography and prevents live-only discovery Guidance or transient effects from replaying during hydration. Reset clears the activation flag so the session start point can be activated again after its baseline is restored.

Live catch-up is not reconstruction: `catchUpToPoint()` moves only forward in canonical-spine order and optionally includes the destination entry effects. It does not synthesize settled history. The existing sandbox reconciliation contract determines when domain-ahead truth may request this bounded catch-up.

`P5 → 4.80` and `P6 → 5.10` are implemented debug/QA aliases only. Neither owns gameplay truth, capabilities or Scenario consequences; canonical hydration remains `stateAt → hydrate/synchronize → activate`.

## Runtime boundary

`RuntimeExperience.dispatch()` asks Director to interpret an event and executes effects only for an accepted change. `RuntimeExperience.activatePoint(X)` owns the full canonical baseline/reconstruction/Director-replacement/activation sequence above. Missing symbolic effect handlers are runtime composition errors, not implicit Scenario behavior.

`experienceVr.js` composes the Scenario, Director lifecycle, reconstruction/hydration owners and effect handlers, including the late Ether, Water-path, full-Resonator, farewell, world-release, credits, brand-slate and XR-exit owners. Scenario orchestrates those owners through semantic events and effects; it does not duplicate their detailed mechanics.

Rune tuning, transport, installation, Binder readiness, sector control and Resonator operation remain independent domain laws observed by Scenario. Detailed Rune, Resonator, Water, audio and finale presentation behavior belongs to their dedicated canonical documents. The implemented Scenario/Director boundary itself is the complete graph through `100.10`; only additions beyond that graph are genuine future Scenario extensions.
