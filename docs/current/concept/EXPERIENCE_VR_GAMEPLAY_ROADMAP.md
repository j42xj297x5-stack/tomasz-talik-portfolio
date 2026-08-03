# Experience VR — gameplay and progression roadmap

Status: approved product direction and implementation checklist synchronized on 2026-08-02. The [runtime model](../technical/VR_RUNTIME_MODEL.md) remains the authority for current behavior.

`[x]` means present in the current runtime. `[ ]` means future, including decisions that are approved but not implemented.

## Product direction

Experience VR is a spatial progression game built around five portfolio branches and 18 cards. The stable loop is glyph acquisition → crystal handling → reliquary preview/commit → floor progress. Completed global tiers progressively unlock world mechanics. Future systems must extend this loop without moving page identity onto physical crystals or weakening the single progression owner.

## Current implemented foundation

### Runtime, cards and floor

- [x] Independent Experience VR runtime with WebXR lifecycle and `playerRig` locomotion.
- [x] Five branches and 18 cards in counts `3 / 3 / 3 / 4 / 5`.
- [x] Physical crystals carry branch+tier, not page/card identity.
- [x] Glyph hold spawns the next unrepresented branch tier; acquisition can stock future tiers.
- [x] Current global tier gates insertion, not acquisition.
- [x] Activate previews; Release commits through `VrProgressionController` and consumes the crystal.
- [x] Five authored floor sectors, 18 independently activated panels and five procedural global tier rings.
- [x] Ordinary interaction rays have a maximum range of `2.3 m`.
- [ ] Progressive sector-background illumination with a soft gradient boundary.
- [ ] Central progression core.

### Completed Tier-1 Astro/shell slice

- [x] Tier 1 unlock event activates the shell field and unlocks Astro.
- [x] Semantic input works even though handedness is assigned only after WebXR `connected`.
- [x] A / `toggleRightTool` toggles `NORMAL_HAND ↔ ASTRO_ATTRACTOR` after unlock.
- [x] `createVrHandModeController` owns Astro visibility/equipment and right ordinary-ray visibility.
- [x] Astro visual model is mounted to the right controller.
- [x] Shell field contains 18 instances: six assets × three clones.
- [x] Right squeeze above `0.1` activates one `3R`, `2.5°` scan cone.
- [x] Cached bounding-sphere cone-volume targeting selects shells analytically.
- [x] Right trigger above `0.1` starts/sustains accelerated pull while scan remains active.
- [x] Cancellation returns a shell to its advancing orbit in `0.8 s`.
- [x] Capture point is `PIVOT_RING_MASTER` world position plus controller world `-Z × 1.3 m`; readiness radius is `0.28 m`.
- [x] `capture_ready` is acquired by left ordinary ray + reported hit + squeeze, not proximity.
- [x] Left release creates `placed`; either free ordinary hand can repeatedly re-grab it, with the right hand limited to `NORMAL_HAND`.
- [x] Shell visuals preserve authored maps, show pull/captured/held emission and deterministic tumble.
- [x] `?p1` provides the QA post-Tier-1 state.

## Approved Astro band progression — future

A remains the high-level right-hand choice `NORMAL_HAND ↔ ASTRO_ATTRACTOR`. It is implemented and is not replaced by band selection.

- [ ] B selects only bands unlocked by progression. **B is not implemented.**
- [ ] **RED** targets local utility elements, primarily crystals and later floor controls.
- [ ] **YELLOW** targets shells.
- [ ] **GREEN** targets small glyphs.
- [ ] **BLUE** targets rune stones.
- [ ] **ULTRAVIOLET** targets final/distant glyphs.
- [ ] Immediately after Tier 1, the planned available set is RED + YELLOW; later progression unlocks the remaining bands.

RED is a filtered local capability, not a global scene raycast. It must not include the monkey, portal, reliquary, buttons, Astro Furnace or decoration.

The current shell slice does not yet implement YELLOW as a selectable band; shells are directly available to the unlocked Astro mode. The list above describes the future selector/capability model.

## Sphere assembly and floor-control direction — future

```text
sphereAssembly.requiredShells = 6
```

- [ ] Count six acquired shells toward assembly.
- [ ] Consume/transfer those six shells into a visible construction sequence.
- [ ] Build the luminous floor-control sphere.
- [ ] Materialize the completed sphere as a left-hand tool.
- [ ] Use the sphere as a spatial gyroscope for floor control.

The value `requiredShells = 6` is an approved design value only. The current runtime has no assembly counter, hologram, shell consumption, completed sphere or sphere-tool state.

After the sphere is built, further progression is intended to pass to **small glyphs**. The sphere remains a left-hand tool; the right hand retains A-controlled `NORMAL_HAND ↔ ASTRO_ATTRACTOR`.

## Spatial progression requirement after Tier 1

The ordinary `2.3 m` interaction range must stop being sufficient for subsequent glyph progression. The intended separation is approximately `3 m`, establishing a reason to use new mechanics rather than the ordinary ray.

How that separation is created is unresolved. The accepted alternatives remain:

- movement of the player platform; or
- displacement of the glyph ring.

This roadmap does not select either solution.

## Later progression — future

### Small glyphs and floor control

- [ ] Small glyphs take over progression after sphere construction.
- [ ] GREEN capability targets small glyphs.
- [ ] Left-hand sphere controls bounded floor pitch/roll as a spatial gyroscope.
- [ ] Locomotion follows the controlled local floor plane inside the safe central boundary.
- [ ] Input priorities prevent tool, crystal, button and shell actions from firing together.

### Moving sectors and antenna

- [ ] Completed sectors become controllable antenna elements.
- [ ] Alignment/lensing provides clear visual feedback and remains solvable without audio.

### Rune stones and essence

- [ ] BLUE capability targets rune stones.
- [ ] Rune extraction supplies progression essence.

### Final radar and Haiku Cosmos

- [ ] ULTRAVIOLET capability reveals final/distant glyphs.
- [ ] Completed sectors and essence unlock the final radar.
- [ ] The final crystal returns to the established reliquary preview/commit contract.

## Cross-cutting future work

- [ ] Progressive floor backgrounds and central core.
- [ ] Explicit capability state for unlocked Astro bands.
- [ ] Comfort limits and device validation for any floor motion.
- [ ] Performance validation for transparency, emission, halos and long sessions.
- [ ] Durable save and controlled full-game reset.
- [ ] Audio and final polish; sound must not be required to understand mechanics.

## Constraints that remain binding

- `VrProgressionController` remains the single logical owner of committed cards and tier completion.
- Physical crystals remain branch+tier objects; page resolution stays at Activate.
- Existing Astro handoff remains explicit left-ray targeting and squeeze, not proximity takeover.
- Placed shells remain ordinary-ray re-grabbable and excluded from Astro targeting.
- No future band implies an unrestricted global scene raycast.
- New movement/tilt mechanics require comfort testing on target hardware.
- Planned systems remain unchecked until runtime implementation and validation exist.

## Risks

1. **Floor motion and comfort:** prototype bounded motion before expanding dependent puzzles; keep a stable reference and test seated/standing use.
2. **State ownership:** keep explicit state machines and idempotent progression events; avoid distributing committed state across visual modules.
3. **Transparency/emission cost:** control overdraw and simultaneous lights on Quest-class hardware.
4. **Input conflicts:** preserve semantic actions, hand-mode ownership and real-hit priorities.
5. **Communication:** each tier transition needs readable spatial feedback without relying on text or sound.
