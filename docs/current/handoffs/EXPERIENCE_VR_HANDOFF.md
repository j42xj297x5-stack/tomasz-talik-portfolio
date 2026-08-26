# Experience VR — Current Handoff

Status: **CURRENT operational snapshot — 2026-08-26**. Authorities: [`VR_RUNTIME_MODEL.md`](../technical/VR_RUNTIME_MODEL.md), [`VR_SCENARIO_DIRECTOR_MODEL.md`](../technical/VR_SCENARIO_DIRECTOR_MODEL.md) and [`VR_RUNE_STONES_MODEL.md`](../technical/VR_RUNE_STONES_MODEL.md).

## Canonical checkpoint

- Scenario is implemented through `4.40 → 4.50 → 4.60 → 4.70 → 4.80`; `4.80` is the stable authored boundary. `P5 → 4.80` is only a debug/QA alias.
- Natural Rune A1–A8 and A9.1–A9.6 foundations are implemented. **NATURAL RUNE A9 FOUNDATION = COMPLETE**; the Rune Act and Scenario after `4.80` are not complete.
- Large Glyph stages include implemented `SPHERE_FAR = 80 m`; natural Rune Stones occupy the implemented `50–75 m` layer.
- Panel 1 Rune U and Panel 2 current-band presentation are implemented. Panels 3–4 remain future.

## Rune ownership and readiness

Natural tuning is independent of sectors. Targetability equals `tunedRuneFamilies`. Installation readiness alone reads sector completion through `ProgressionController.isBranchComplete() → RuneInstallationReadinessProjection → RuneBridgeActor HIDDEN/DOCKED`. After `4.80`, Earth/Fire/Wood are normally ready; Metal/Water are not. The Water override seam exists, but its real trigger is not implemented.

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

Every natural pair exposes stable `VrRuneStoneHoverAnchor_<BRANCH>` and `VrRuneStoneInstallationAnchor_<BRANCH>`. `VrRuneBridgeMotionRoot_<BRANCH>` owns implemented radial bridge translation; its distance derives from authored geometry/canonical alignment rather than a magic world offset. Extension settles `DOCKED → EXTENDING → EXTENDED`, then completed installation sets the bridge to `ORBITING`. `ORBITING` spin/rotation presentation is not implemented.

## A9.6 hydration and reconstruction

`RuneInstalledStateProjection` reads installed truth, resolves family to natural branch, obtains the stable InstallationAnchor and issues only bounded reconstruction commands. `RuneStoneActor.restoreInstalled()` restores canonical local pose, authored scale, anchor parenting and `INSTALLED`. `RuneBridgeActor.restoreInstalled()` directly restores visibility, authored-derived extension distance and `ORBITING`. Neither path replays lock, carried transport, capture, tween or bridge extension transitions.

Reconstruction order is bridge readiness → installed Rune physical state → Furnace redraw without a fake domain event → remaining derived state such as absorbed shells. The lifecycle remains `restoreBaseline → stateAt(X) → hydrate owners → synchronize derived state → Director at X → activate X`. A9.6 prepares the domain for future points; it does not provide production direct-target parity after `4.80`, because no such Scenario points exist.

## Next bounded work

There is no invented A9.7 or NEXT A9. The next gameplay slice requires a separate architecture/authoring decision. Future scope includes authored Scenario after `4.80`, the Water override trigger, special Ether flow, bridge spin/presentation, Rune Stone spatial audio, antenna and late Metal/Water/finale beats, durable full-game persistence and full-game reset. Collision is superseded and not a target.

## Traceability

Key evidence: A6 `b091b4e`/`0fc4ce3`; A7 `cc77fb2`/`83ec32f`; A8 `ad83cb2`/`f98188a`; tuning correction `d0f9a17`/`c862b9b`; A9.1 `f03daad`/`3181dc9`; hardening `9ab56aa`/`6b52511`; A9.2 `fd4e519`/`091b7da`; A9.3 `8c3caca`/`d23743d`; A9.4 `38b46cf`/`575dc18`. Current HEAD code is authority for A9.5 platform handoff/extension and A9.6 hydration/reconstruction.
