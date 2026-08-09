# Experience VR Handoff

Status: current implementation handoff synchronized on 2026-08-09. `VR_RUNTIME_MODEL.md` and `VR_AUDIO_MODEL.md` remain the detailed runtime authorities.

## Status vocabulary

- **IMPLEMENTED** — present in runtime/code.
- **HARDWARE VALIDATED** — confirmed by the Designer on Meta Quest 3S.
- **KNOWN QA ISSUE** — implemented, but current hardware QA found a specific defect.

## Current architecture and interaction baseline

`src/experienceVr.js` composes an independent WebXR runtime. `VrTiltableFloorRoot` carries the progress floor, monkey, platform fixtures and `VrFloorPassengerRoot/playerRig`; glyph ring, shell field and cosmos remain world-stable. Camera/controllers inherit the tilting platform. Right-stick locomotion resolves on its local tangent plane with the radial boundary; left stick yaws continuously. Ordinary rays are real-hit rays capped at `2.3 m`.

`VrProgressionController` exclusively owns portfolio-card/tier progress. Glyph hold creates branch+tier crystals; reliquary Activate previews and Release commits. Tier 1 unlocks the right-hand Astro Przyciągacz and the 18-shell field (six unique assets, three instances each). The Attractor uses analytic cone targeting, pull/cancel/return and explicit left ordinary-ray+squeeze handoff; placed shells are ordinary-ray re-grabbable but excluded from Attractor targeting.

## Astro Furnace and production Asterion

`VrAstroFurnaceProgressionController` separately owns the six unique Asterion shell slots. The furnace offers two implemented process kinds through one authoritative driver:

- `SHELL_EXTRACTION`: one missing shell, 18 s at 42 RPM, `SPINUP → STEADY → EXTRACTION → COOLDOWN`, completion-only commit, `astro_piec_work_01.mp3`.
- `ASTERION_CONSTRUCTION`: no shell required in the content slot, accepted by panel **UTWÓRZ**, 18 s at 42 RPM, `SPINUP → STEADY → FORMATION → COOLDOWN`, `astro_piec_work_create_01.mp3` only.

Production is **IMPLEMENTED** and independent of the QA query:

```text
6 unique shells → complete 6/6 → READY → UTWÓRZ
→ optional COMPLETE/SHELL_EXTRACTION preparation
→ PREPARING_CONSTRUCTION → reverse button-lock animation
→ ASTERION_CONSTRUCTION / SPINUP → BUILDING (18 s) → AVAILABLE
→ OPEN chamber → left NORMAL_HAND ordinary ray (≤2.3 m) + real hit + halo + squeeze
→ EARNED → automatic left-hand equip
→ X: NORMAL_HAND ↔ ASTERION_SPHERE
```

The lock preparation precedes and is not part of the 18 seconds. `?asterionSphere` is only an availability QA override: it never sets `6/6`, `AVAILABLE` or `EARNED`, and never becomes a production-progress source. An `AVAILABLE` production Sphere cannot be equipped with X before explicit claim.

The same `/glb/asterion_sphere.glb` socket/model serves production presentation and equipment; claim creates no second model. Presentation targets `VR_FURNACE_CONTENT_ANCHOR` through the shared content-placement helper and finishes at scale `1`. Presentation and equipment lifecycles are distinct: `unequipFromHand()` preserves presentation; production owns `clearPresentation()`. Claim clears presentation, commits `EARNED`, and moves the same socket into the equipment lifecycle.

The furnace panel builds its input sphere from six shell patches. During construction it fades those patches while progressively revealing and rotating a cached contour/wireframe derived from the actual Sphere model. Panel and physical materialization consume the same authoritative formation progress. At completion it reports **KULA GOTOWA / OTWÓRZ KOMORĘ**.

## Asterion gyro

Production unlocks the already implemented and hardware-checked gyro; it is not a replacement control system. PREVIEW, COMMAND and CURRENT retain CONTROL BASE + HAND REFERENCE, smooth target rebase, continued motion after trigger release, no-jump re-equip and the heavy angular drive:

```text
maxAngularSpeedDegrees = 32
angularAccelerationDegrees = 32
angularDecelerationDegrees = 45
settleAngularSpeedDegrees = 0.15
```

After `EARNED`, the left Sphere and right Astro Przyciągacz remain independent and may operate concurrently.

## Audio snapshot

**IMPLEMENTED:** fail-soft `VrAudioBridge`; five unity-gain buses `SPACE`, `AMBIENT`, `DEVICE`, `WORLD`, `UI` feeding existing Master Volume/mute; wired UI/WORLD/DEVICE one-shots for panels, monkey, reliquary, progression and furnace; glyph `glif_hover_loop` acquisition lifecycle (1.0 s recovery, same-source reacquire, 0.1 s regain, success fade and elemental completion mapping); shell Attractor `noise_laud_loop_02.mp3` on DEVICE (true loop, 1 s recovery, 0.1 s regain, 0.5 s successful-handoff fade); furnace open/close and the two process sounds above.

**NOT IMPLEMENTED / PLANNED:** ambient sequencer, spatial audio, non-shell Attractor target mappings, future small-glyph/rune furnace processes. Asterion active control remains **DEVICE SOUND TBD**; no asset is assigned.

## Meta Quest 3S hardware QA

**HARDWARE VALIDATED:** `UTWÓRZ` is clickable after `6/6`; the sixth-shell transition works without manual open→close; the full 18-second construction and furnace mechanics run; the panel process works; patch sphere changes into a rotating contour blueprint; and the physical Sphere is rendered/materialized.

**KNOWN QA ISSUE — PHYSICAL PLACEMENT:** the physical Sphere currently materializes **behind the Astro Furnace panel**, not at the expected location inside the chamber. Code targets `VR_FURNACE_CONTENT_ANCHOR` with the shared placement helper, but correct final chamber placement is not hardware validated.

**KNOWN QA ISSUE — CONTOUR CONTINUITY:** the rotating blueprint is semantically readable, but its contour lines are locally fragmented/gapped and need later cosmetic refinement.

## Future boundary

Radar/sector targeting is the next major stage. Astro bands/B selection, small-glyph progression, antenna, rune/Emanation Matrix processing, final radar/finale, ambient sequencing, spatial audio, durable persistence and full-game reset remain **FUTURE**. The two QA issues above are bugs in implemented functionality, not reasons to move production Asterion back to FUTURE.
