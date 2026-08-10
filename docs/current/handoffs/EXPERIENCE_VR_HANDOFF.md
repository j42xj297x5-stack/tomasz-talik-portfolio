# Experience VR Handoff

Status: current implementation handoff synchronized on 2026-08-10. `VR_RUNTIME_MODEL.md` and `VR_AUDIO_MODEL.md` remain the detailed runtime authorities.

## Status vocabulary

- **IMPLEMENTED** — present in runtime/code.
- **HARDWARE VALIDATED** — confirmed by the Designer on Meta Quest 3S.
- **KNOWN QA ISSUE** — implemented, but current hardware QA found a specific defect.
- **PRESENT / AUTHORED** — a physical asset or internal asset reference has been prepared, without implying runtime integration.
- **FUTURE / NEXT IMPLEMENTATION STEP** — approved direction that HEAD does not yet compose.

## Current architecture and interaction baseline

`src/experienceVr.js` composes an independent WebXR runtime. `VrTiltableFloorRoot` carries the progress floor, monkey, platform fixtures and `VrFloorPassengerRoot/playerRig`; glyph ring, shell field and cosmos remain world-stable. Camera/controllers inherit the tilting platform. Right-stick locomotion resolves on its local tangent plane with the radial boundary; left stick yaws continuously. Ordinary rays are real-hit rays capped at `2.3 m`.

`VrProgressionController` exclusively owns portfolio-card/tier progress. Glyph hold creates branch+tier crystals; reliquary Activate previews and Release commits. Tier 1 unlocks the right-hand Astro Przyciągacz and the 18-shell field (six unique assets, three instances each). The Attractor uses analytic cone targeting, pull/cancel/return and explicit left ordinary-ray+squeeze handoff; placed shells are ordinary-ray re-grabbable but excluded from Attractor targeting.

The guidance baseline is also **IMPLEMENTED**. Y opens the left-grip player reference panel. The Monkey has three attention arcs, a system-set message panel and a separate ray-interactive dialogue panel. Its current choice can ask about progress, then browse `VrProgressionController` history and read existing localized cards. Newly committed cards pulse as transient unread entries until opened. Outside the bounded intro P0, this remains a technical communication surface only: further authored narrative, dialogue between progression stages, quests, personality and stuck-player assistance remain **NOT DESIGNED / FUTURE**.

The rebuilt intro P0 is **IMPLEMENTED**: XR calibration leads through radial fog reveal and silence, three timed orientation messages and a persistent Y instruction that clears only when the panel actually opens, controls/pointer/trigger onboarding, invitation, `FOLLOWING`, threshold choice, physical entry into the ring, `MONKEY_SETTLING` and `GLYPH_FREE_EXPLORE`. The sequence temporarily moves the existing `monkeyMotionRoot` and finally restores the canonical transform captured after current layout application. Do not rebuild or reinterpret the scene anchors: `ANCHOR_MONKEY` remains the unchanged layout/runtime anchor and `monkeyMotionRoot` remains the transform owner defined by HEAD.

## Monkey / stone asset handoff

`public/glb/monkey.glb` and `public/glb/monkey_stone.glb` are separate **PRESENT** assets. The character's main node is `monkey`; the approved character-internal contract is `MONKEY_ANCHOR → monkey`. The stone is not part of the Monkey mesh and carries `MONKEY_STONE_ROOT` with its stone mesh and `MONKEY_SEAT_ANCHOR` children. `MONKEY_STONE_ROOT` is the local lower/root reference and `MONKEY_SEAT_ANCHOR` is the local point for seating the character on the upper surface.

The asset contract and runtime assembly are **IMPLEMENTED**. Both GLBs are critical P0 preloads. Under `VrMonkeyVisualRoot`, `VrMonkeyAssemblyRoot` matrix-aligns the stone root to assembly origin and the complete character anchor transform to the seat anchor, then applies one uniform assembly scale. The unchanged `VrMonkeyMotionRoot` remains the only actor-motion owner; `ANCHOR_MONKEY`, calibration, the 1.5 m starting geometry and P0 trajectory remain authoritative. The character-only interaction root excludes the stone from Monkey rays and halo.

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

**IMPLEMENTED:** fail-soft `VrAudioBridge`; five unity-gain buses `SPACE`, `AMBIENT`, `DEVICE`, `WORLD`, `UI` feeding existing Master Volume/mute; wired UI/WORLD/DEVICE one-shots for panels, monkey, reliquary, progression and furnace; glyph `glif_hover_loop` acquisition lifecycle (1.0 s recovery, same-source reacquire, 0.1 s regain, success fade and elemental completion mapping); shell Attractor `noise_laud_loop_02.mp3` on DEVICE (true loop, 1 s recovery, 0.1 s regain, 0.5 s successful-handoff fade); furnace open/close and both process sounds; equipped/drive Asterion Sphere loops; and the composed transient ambient sequencer for tier thresholds and the completed-shell/built-Sphere subthreshold.

**NOT IMPLEMENTED / PLANNED:** spatial audio, non-shell Attractor target mappings and future small-glyph/rune furnace processes.

## Meta Quest 3S hardware QA

**HARDWARE VALIDATED:** `UTWÓRZ` is clickable after `6/6`; the sixth-shell transition works without manual open→close; the full 18-second construction and furnace mechanics run; the panel process works; patch sphere changes into a rotating contour blueprint; and the physical Sphere is rendered/materialized.

**HARDWARE VALIDATION PENDING — PHYSICAL PLACEMENT:** HEAD parents every produced object to `VR_FURNACE_CONTENT_ANCHOR` and derives the Sphere target with the shared content-placement helper. The earlier behind-panel result predates this correction and must not be treated as the current runtime state. The corrected chamber position still requires Wizjoner confirmation on Quest.

**KNOWN QA ISSUE — CONTOUR CONTINUITY:** the rotating blueprint is semantically readable, but its contour lines are locally fragmented/gapped and need later cosmetic refinement.

## Future boundary

Narrative design and radar/sector targeting are next-stage spaces. Authored Monkey guidance, Astro bands/B selection, small-glyph progression, antenna, rune/Emanation Matrix processing, final radar/finale, spatial audio, durable persistence and full-game reset remain **FUTURE**. Pending placement validation and the contour issue do not move production Asterion back to FUTURE.
