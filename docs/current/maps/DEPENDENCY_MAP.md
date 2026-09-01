# Dependency Map

## Documentation flow

`PROJECT_INDEX → canonical technical model → runtime evidence`. Rune authority is [`VR_RUNE_STONES_MODEL.md`](../technical/VR_RUNE_STONES_MODEL.md), while sector-control/Rezonator authority is [`VR_ASTERION_RESONATOR_MODEL.md`](../technical/VR_ASTERION_RESONATOR_MODEL.md) with its subordinate field contract in [`VR_ASTERION_RESONATOR_FIELD_MODEL.md`](../technical/VR_ASTERION_RESONATOR_FIELD_MODEL.md).

## Experience VR composition

```text
SPINE → SCENARIO → DIRECTOR → RuntimeExperience → actors / domain owners
```

Scenario is implemented through `4.40 → 4.50 → 4.60 → 4.70 → 4.80`. Continuation after `4.80` is deferred.

Scenario owns dramaturgy, required progression beats, revealed knowledge, Guidance/hints and crystal-acquisition gates. It observes domain truth but does not gate physical Rune tuning, Rune pull, Rune installation, sector control or Resonator creation through `currentPoint`.

## Experience VR main-background ownership

```text
Scenario semantic audio entry → Ambient Sequencer → VrAudioBridge → audioManager
```

This is the CURRENT / BINDING target ownership. Runtime synchronization remains pending; the current composition still derives main-ambient selection from progression tier and an Asterion subthreshold.

## Spatial presentation

```text
Tier 3 completion → LargeGlyphActor.SPHERE_FAR (80 m)
SphericalLayerRegistry.RUNE_STONES (50–75 m) → RuneStoneActor natural collection
```

Large Glyph is not a spherical layer.

## Rune tuning, transport and installation

```text
Small Glyph + Shell
→ RuneRecipeInteraction (two typed slots, 18 s RUNE_TUNING)
→ RuneStoneProgressionController.tunedRuneFamilies
→ RuneStoneAttractorBandProjection
→ RuneStoneAttractorInteraction
→ RuneStoneActor LOCKED_BY_ASTRO
→ CARRIED_ORBIT
→ invisible platform-centered handoff sphere + legality check
→ ownership handoff to RuneStoneInstallationInteraction
→ SOCKET_CAPTURE / APPROACH
→ BRIDGE_OPEN / RuneBridgeActor physical extension
→ DESCENT
→ RuneStoneActor INSTALLED
→ RuneBridgeActor ORBITING (technical settled state; no spin canon)
→ RuneStoneProgressionController.installedRuneFamilies
```

The platform root's current world-space position centers the handoff sphere. Current tuning is a `9.0 m` transport minimum and `10 m` handoff radius. `BRIDGE_STONE_CAPTURE` and `capture_radius_m` are not gameplay triggers; authored capture data may remain private calibration evidence. Accepted handoff does not pass through `FREE`, and trigger input no longer owns installation.

Natural tuning does not read sector completeness. The `RUNESTONES` band target set is exactly tuned natural families. Installation readiness is checked only during handoff legality. Ether is excluded from the natural flow. Without the proper existing Zwornik, a tuned legal stone may remain near but outside the platform; this is a legal sandbox state, not a required Scenario branch.

## Zwornik, sector control and Rezonator (R2A + R2B + R4 CORE IMPLEMENTED)

```text
sector panels complete
├→ persistent Zwornik Runiczny
└→ read-only RUNE_BINDER_REVEAL presentation

installed Rune Stone → sector powered / lockable
local LEVEL > 0 → sector field-active
GRIP + 1.0 s same powered target → SECTOR LOCK → bounded local motion command
Asterion Sphere TRIGGER → existing global platform orientation owner

3 required powered cooperating sectors
→ Resonator exists, including at (0,0,0) with field contribution OFF
→ (EARTH α, WOOD β, FIRE γ), each LEVEL 0..3
→ 0° OFF; active CURRENT TARGET positions 13° / 23° / 36°
→ Resonator Field Domain read-only descriptor
→ response evaluated by domain-supported legal distant targets
→ separate read-only field lensing presentation

later METAL + WATER
→ advanced tuning / amplification of the same field
```

R4 composition creates one derived Field Actor after the Rune progression and R2B owners. It reads canonical installed families and committed levels only, freezes the descriptor and nested values, deduplicates semantic changes, and synchronizes explicitly after hydration/reconstruction and source resets. It has no frame update; METAL/WATER changes are outside its core signature.

The physical core contains `4 × 4 × 4 = 64` states. Its fully active subset contains 27 configurations, including 9 primary active symmetric configurations (`α = β > 0`). Asymmetric and one-wing-active states are legal. Sector control owns lock/setting/motion commands; Field Domain owns descriptor/field response; `PlatformEnergyVfxActor` separately owns procedural platform energy; lensing only reads Field output. TRIGGER retains priority over GRIP. Scenario/Guidance interprets but does not create these states, and crystal acquisition remains progression-gated.

## Rune reconstruction

```text
Scenario settled runeProgression
→ hydrate RuneStoneProgressionController
→ RuneInstalledStateProjection
├→ RuneStoneActor.restoreInstalled
└→ RuneBridgeActor.restoreInstalled
```

`runeProgression` owns `tunedRuneFamilies` and `installedRuneFamilies`, with `installedRuneFamilies ⊆ tunedRuneFamilies`. It is separate from `runeStones`, which hydrates only presentation visibility / physical actor presentation. The projection owns no persistent truth and restores settled `INSTALLED` stones and extended `ORBITING` bridges without replaying `LOCKED_BY_ASTRO`, `CARRIED_ORBIT`, capture, tween or `DOCKED → EXTENDING → EXTENDED`.

Derived reconstruction ordering is: bridge readiness → installed Rune physical state → Furnace redraw without a fake domain event → remaining derived state such as absorbed shells. This is owner synchronization, not Scenario authoring.

The implemented core includes the presentation-only volumetric sector acquisition beam, whose endpoint follows the moving panel-3 anchor. Future scope remains target selection/response beyond current acquisition, Field/lensing presentation, Field audio, detent VFX/audio, `RUNE_INSTALL`, METAL/WATER contribution and later finale work.

## Platform energy VFX presentation (PARTIALLY IMPLEMENTED)

```text
sector-complete readiness transition ─→ RUNE_BINDER_REVEAL ─┐
R2A ACQUIRING state + progress ───────→ SECTOR_ACQUISITION ─┼→ read-only projections → shared PlatformEnergyVfxActor → sector-local / platform-bound procedural lightning
R2B same-frame physical angle change ─→ FLOOR_DRIVE ────────┘
```

These three profiles are implemented. The projections and shared actor are presentation-only and never write back to Rune, progression, acquisition, sector-control, platform-motion or Field owners. `RUNE_INSTALL` remains future; this CURRENT local-sector `FLOOR_DRIVE` contract does not decide whether a distinct global-drive energy concept may be designed later. Authority and tuning boundaries are defined in [`VR_PLATFORM_ENERGY_VFX_MODEL.md`](../technical/VR_PLATFORM_ENERGY_VFX_MODEL.md).

## Installation readiness

```text
ProgressionController.isBranchComplete()
→ RuneInstallationReadinessProjection
→ RuneBridgeActor HIDDEN / DOCKED
```

This flow is **IMPLEMENTED**. Normal readiness after stable `4.80` is Earth/Fire/Wood ready and Metal/Water not ready. The future Water override trigger affects Water installation readiness only; it never modifies floor/panel truth, natural tuning or targetability.

## Independent owners

- `ProtoAstroTuningController`: natural essences for Large Glyph.
- `RuneStoneProgressionController`: canonical `tunedRuneFamilies` and `installedRuneFamilies` persistent truth.
- sector progression owner: panel/sector completeness.
- `RuneStoneActor`: physical/transient stone state; `RuneBridgeActor`: authored geometry, stable anchors, extension translation and transient bridge state.
- `RuneStoneAttractorInteraction`: target/transport ownership until accepted platform handoff.
- `RuneStoneInstallationInteraction`: automatic installation choreography and final transaction orchestration.
- projections: read-only interpretation/synchronization; no copied persistent truth.

## Remaining seams

Natural Rune A9.1–A9.6 foundation is complete. R2A acquisition, R2B EARTH/WOOD/FIRE sector control, the R4 Resonator Field Actor, the volumetric sector acquisition beam, Binder reveal energy, acquisition energy and local-sector `FLOOR_DRIVE` are implemented. Authored Scenario after `4.80`, Water readiness override trigger, special Ether flow, Rune Stone spatial audio, `RUNE_INSTALL`, target response, Field presentation/audio, detent VFX/audio, later Metal/Water contribution/finale beats, durable full-game persistence/save and full-game reset remain future. Bridge spin, the historical antenna model and carried ↔ installed collision are superseded; physical bridge extension is implemented.
