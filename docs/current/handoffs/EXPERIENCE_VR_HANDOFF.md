# Experience VR — Current Handoff

Status: **CURRENT operational snapshot — 2026-08-27**. Authorities: [`VR_RUNTIME_MODEL.md`](../technical/VR_RUNTIME_MODEL.md), [`VR_SCENARIO_DIRECTOR_MODEL.md`](../technical/VR_SCENARIO_DIRECTOR_MODEL.md) and [`VR_RUNE_STONES_MODEL.md`](../technical/VR_RUNE_STONES_MODEL.md).

## Asterion sector-control and Field R4 boundary

Implemented runtime: R2A semantic left GRIP powered-sector acquisition and transient `SECTOR LOCK`; R2B committed EARTH/WOOD/FIRE `0/1/2/3` detents; and R4's event-driven Resonator Field Actor. R4 derives `resonatorExists`, runtime `α/β/γ`, POWERED/FIELD-ACTIVE, partial/full/symmetric/asymmetric state, depth band and analytic lateral values in an immutable descriptor with exactly-on-change subscriptions. Hydration/reconstruction and baseline reset explicitly synchronize it after upstream owners. Its downstream subscription boundary commits descriptor truth before notification and is fail-soft: one consumer exception cannot propagate into gameplay or block delivery to the remaining consumers.

Not implemented: target selection/scoring or response, field/lensing presentation, grip beam, field audio, or METAL/WATER field contribution. Global platform orientation remains owned by the existing Asterion Gyro interaction.

## Canonical checkpoint

- Scenario is implemented through `4.40 → 4.50 → 4.60 → 4.70 → 4.80`; `4.80` is the stable authored boundary. `P5 → 4.80` is only a debug/QA alias.
- Natural Rune A1–A8 and A9.1–A9.6 foundations are implemented. **NATURAL RUNE A9 FOUNDATION = COMPLETE**; the Rune Act and Scenario after `4.80` are not complete.
- Large Glyph stages include implemented `SPHERE_FAR = 80 m`; natural Rune Stones occupy the implemented `50–75 m` layer.
- Panel 1 Rune U and Panel 2 current-band presentation are implemented. Panels 3–4 remain future.

## Rune ownership and readiness

Natural tuning is independent of sectors. Targetability equals `tunedRuneFamilies`. Installation readiness alone reads sector completion through `ProgressionController.isBranchComplete() → RuneInstallationReadinessProjection → RuneBridgeActor HIDDEN/DOCKED`. Every successful live crystal/page commit synchronizes that seam once after the existing semantic handoff, so the completing panel produces exactly one idempotent `HIDDEN → DOCKED` materialization without Scenario ownership; independent VFX and R3c audio projections consume the same transition list. The audio projection starts one WORLD one-shot in deterministic `creating_01 → 02 → 03 → 01` order and does not own readiness or depend on VFX success. The bridge then remains visible before installation. After `4.80`, Earth/Fire/Wood are normally ready; Metal/Water are not. The Water override seam exists, but its real trigger is not implemented.

`RuneStoneProgressionController` is the canonical persistent owner of separate `tunedRuneFamilies` and `installedRuneFamilies`, with `installedRuneFamilies ⊆ tunedRuneFamilies`. `runeProgression` hydrates both facts silently and atomically. The distinct `runeStones` owner section hydrates presentation visibility only; no central Rune store or duplicate truth exists.

## A9.5 physical handoff and installation

Physical runtime implements `FREE → LOCKED_BY_ASTRO → CARRIED_ORBIT → SOCKET_CAPTURE → INSTALLED`. Player-driven transport preserves the `9.0 m` platform minimum. A logical, invisible `10 m` handoff sphere is centered on the current world-space platform root:

```text
CARRIED_ORBIT
→ platform-centered handoff sphere
→ legality check
→ ownership handoff
→ SOCKET_CAPTURE
→ APPROACH
→ BRIDGE_OPEN
→ DESCENT
→ INSTALLED
```

Accepted handoff never passes through `FREE`; afterward player trigger state no longer controls installation. Authored `BRIDGE_STONE_CAPTURE` / `capture_radius_m` may remain private asset calibration evidence but are not gameplay triggers.

Every natural pair exposes stable `VrRuneStoneHoverAnchor_<BRANCH>` and `VrRuneStoneInstallationAnchor_<BRANCH>`. `VrRuneBridgeMotionRoot_<BRANCH>` owns implemented radial bridge translation; its distance derives from authored geometry/canonical alignment rather than a magic world offset. Extension settles `DOCKED → EXTENDING → EXTENDED`, then completed installation sets the bridge to settled `BOUND`; historical `ORBITING` no longer exists. A private presentation root applies shared `2.0×` scale and sector-local `+Z 1.0 m` offset only to bridge geometry. Stable stone/hover anchors remain unchanged siblings, and Rune Installation Frame parenting carries the bridge and installed stone with R2B sector motion.

## A9.6 hydration and reconstruction

`RuneInstalledStateProjection` reads installed truth, resolves family to natural branch, obtains the stable InstallationAnchor and issues only bounded reconstruction commands. `RuneStoneActor.restoreInstalled()` restores canonical local pose, authored scale, anchor parenting and `INSTALLED`. `RuneBridgeActor.restoreInstalled()` directly restores visibility, authored-derived extension distance and `BOUND`. Neither path replays lock, carried transport, capture, tween or bridge extension or reveal transitions.

Reconstruction order is bridge readiness → installed Rune physical state → Furnace redraw without a fake domain event → remaining derived state such as absorbed shells. The lifecycle remains `restoreBaseline → stateAt(X) → hydrate owners → synchronize derived state → Director at X → activate X`. A9.6 prepares the domain for future points; it does not provide production direct-target parity after `4.80`, because no such Scenario points exist.

## Next bounded work

R3b adds the shared `PlatformEnergyVfxActor` foundation and the only active profile, `RUNE_BINDER_REVEAL`. Its bounded reusable ribbon pool now receives sector-local midpoint/fractal paths with hierarchical decreasing displacement and stable sampled endpoints. R3c adds a separate audio projection: live readiness transitions start that lightning, binder presentation materialization and one mandatory-preloaded WORLD creation one-shot, followed by the existing final VFX pulse; reconstruction stays settled and silent. Branch bolts, multilayer bolts, true bridge-endpoint targeting and guaranteed retry of a pool-exhausted final pulse remain unimplemented. Future scope also includes authored Scenario after `4.80`, the Water override trigger, special Ether flow, `RUNE_INSTALL`, `FLOOR_DRIVE`, installation/detent/motion audio, detent sparks, grip beam, target response/field lensing, spatial binder/Rune Stone audio, antenna and late Metal/Water/finale beats, durable full-game persistence and full-game reset.

## Traceability

Key evidence: A6 `b091b4e`/`0fc4ce3`; A7 `cc77fb2`/`83ec32f`; A8 `ad83cb2`/`f98188a`; tuning correction `d0f9a17`/`c862b9b`; A9.1 `f03daad`/`3181dc9`; hardening `9ab56aa`/`6b52511`; A9.2 `fd4e519`/`091b7da`; A9.3 `8c3caca`/`d23743d`; A9.4 `38b46cf`/`575dc18`. Current HEAD code is authority for A9.5 platform handoff/extension and A9.6 hydration/reconstruction.
# Asterion sector control handoff (R2B)

Implemented composition now updates hand mode, R2A acquisition, R2B sector control, then the existing global gyro owner. R2B supports only EARTH, WOOD and FIRE. Their physical projection is corrected from the earlier mirrored runtime: EARTH/WOOD are mirrored downward-folding side wings on the actual outer radial edges at `±36°` from local `+Z`; both axes pass through platform origin, so MotionRoot.position stays zero while the inner edges toward FIRE descend. FIRE retains its central downward pitch on the bounds-derived inner radial hinge. The complete MotionRoot subtree remains rigid; sector visual, moving panel-3 beam anchor/overlay, energy mount, Rune Installation Frame, Zwornik and installed Rune inherit one transform without correction offsets. LEVEL 0 stays identity, while levels, gesture direction, constant-speed detents and Field semantics remain unchanged. Sector-local R3b reveal VFX inherits its motion automatically; R4 observes R2B `DETENT_COMMITTED` and installed Rune truth without a frame update; its immutable descriptor remains unchanged during transient DRIVING. Floor drive/detent VFX, field audio, grip beam, target selection/scoring/response, lensing and METAL/WATER movement/contribution remain explicit follow-up work.

## Asterion sector acquisition beam handoff — IMPLEMENTED

The runtime now composes a presentation-only acquisition owner after Sphere, Progress Floor and acquisition/control owners. Frame order is hand mode → acquisition interaction → sector control → acquisition presentation, so the ribbon consumes current gameplay truth and the panel-3 anchor's same-frame R2B transform. The beam is a reusable curved, tapered, spectral camera-facing ribbon; ACQUIRING shows progress-driven pulsing whole-sector glow and LOCKED shows a settled lock glow. Target changes clear the previous sector immediately. Reset and dispose clear feedback, and dispose releases owned GPU resources without touching dependencies.

The existing `1.0 s` dwell and powered-Rune filter remain authoritative. Its geometric source is now exclusively the five invisible flat sector buttons derived from authored BASE geometry and held under ActorRoot above MotionRoot; local sector tilt cannot move them, while global platform tilt still does. The beam continues to terminate at the real moving panel-3 anchor rather than at the flat button. Acquisition lightning/sparks, `FLOOR_DRIVE` lightning, drive/detent audio, `RUNE_INSTALL` VFX/audio, field/lensing presentation and target response remain **NOT IMPLEMENTED** and are separate bounded work.


## Platform energy extension — IMPLEMENTED

A presentation-only projection now adds existing-progress `SECTOR_ACQUISITION` lightning and actual-angle-change `FLOOR_DRIVE` lightning without changing acquisition, R2B, Field, or progression truth. Acquisition stops at `LOCKED`; stationary `DRIVING`/`DETENT_HOLD` produces no drive energy, while physically changing `SETTLING` angles do. The single shared bounded pool emits sector surface bolts and fail-soft Binder feeds to the authored `BRIDGE_STONE_CAPTURE` inside the scaled, radially offset bridge presentation subtree. World-to-sector-local conversion preserves the true endpoint through the same downward MotionRoot hinge inheritance. `RUNE_INSTALL`, detent sparks, motion/detent audio, branch/multilayer bolts, Field/lensing, target response, and Metal/Water motion remain not implemented. Hardware QA remains outstanding.
