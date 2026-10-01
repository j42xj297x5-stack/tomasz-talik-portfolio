# Experience VR — Asterion Resonator Field Model

## Status and scope

Status: **CURRENT / IMPLEMENTED**. This subordinate model owns the field descriptor, containment and read-only presentation. The primary system boundary is [VR_ASTERION_RESONATOR_MODEL.md](VR_ASTERION_RESONATOR_MODEL.md).

## Field truth

The field is derived from installed/powered sectors and their current controls. It remains a box-derived rounded containment volume aligned to the platform/entry frame. Earth, Wood and Fire establish the base bands; Metal's two controls expand lateral and forward/depth coverage and alter rounding. Equal containment rules apply to registered targets; field visuals never become gameplay truth.

The field actor exposes a descriptor and `containsWorldPoint()`. Target acquisition consumes those seams and owns ring accumulation/decay, ceiling policy and `PULL_READY`. Field presentation consumes the descriptor to morph a translucent skin and skeleton. No owner reconstructs another owner's truth from visible pixels.

## Water control and presentation

Installed Water provides two discrete levels `0..3`:

- ANGLE maps the Water frequency/hue: 0 neutral, 1 green, 2 blue, 3 violet/purple;
- TILT maps monotonically increasing skin/skeleton luminance and additive halo strength.

The control interaction owns input mapping; the Field Actor records the resulting descriptor; Field Presentation smoothly applies hue, opacity and halo. Water does not select a target family and does not independently change generic field coverage or containment.

## Synchronization and final Water policy

The synchronized array is:

```text
EARTH=2 / WOOD=2 / FIRE=2 / METAL angle=2 / METAL tilt=2 / WATER angle=2 / WATER tilt=2
= 222 / M22 / W22
```

With Water powered, the field actor derives `waterSyncLock === true` only for that balanced state. Field Presentation projects lock as a slow coherent blue breath across skin, skeleton thickness/opacity and halo. `createVrAsterionResonatorFieldArcPresentation` separately projects lightning while the Resonator is correctly tuned. Both are read-only effects and do not confirm lock back into the domain.

For final `haiku-cosmos` after Tier 4, composition maps unlocked state to `maximumRingCount: 2`, `cycleAtCeiling: true`, and retained completed stages outside. The target cycles at the two-ring ceiling and emits generic `CEILING_CYCLED`; the bounded semantic handoff turns that into controlled final-Water rejection. When `waterSyncLock` becomes true, composition restores the normal three-ring, non-cycling policy so the existing acquisition and pull path can complete.

There is intentionally no extra Water Sync Contact state, no strong motion damping and no additional Water acceleration. These are closed abandoned ideas, not missing Field work. The existing final target already rotates slowly, remains black before readiness, and oscillates in depth/scale.

## Final hint lifecycle boundary

`createVrFinalWaterHintLifecycle` belongs to Guidance, not the Field. It begins only at active point `5.70` when Water is installed, full-Resonator teaching is learned, and lock is still false. Elapsed puzzle time triggers ordered hints at 180/360/540 seconds. Mandatory-channel contention delays presentation without changing the semantic clock.

The third hint asks for consent: keep trying or show the exact solution. Keep-trying stops automatic escalation and publishes a persistent optional solution offer; show-me teaches the exact all-level-2 configuration. Acquiring `waterSyncLock` permanently resolves this lifecycle. Ordinary experimentation, target loss or partial rings do not reset it.

## Boundaries

- Scenario owns when the rejection, Ether intervention and final hunt occur.
- Rune owners own Water installation; the Field only reads powered-sector truth.
- Large Glyph owns physical motion and dark/ready materials.
- Astrolabium owns the legal physical pull once acquisition makes it ready.
- Numeric tuning may be adjusted only against runtime evidence; it is not an architectural backlog for new mechanics.
