# DEPRECATED — historyczny model anteny

Ten dokument opisuje historyczny model anteny i nie jest źródłem bieżącego kanonu. Aktualnymi źródłami są [`VR_ASTERION_RESONATOR_MODEL.md`](../current/technical/VR_ASTERION_RESONATOR_MODEL.md) oraz [`EXPERIENCE_VR_RUNES_RESONATOR_FINALE.md`](../current/concept/EXPERIENCE_VR_RUNES_RESONATOR_FINALE.md).

# Experience VR Platform Antenna Model — superseded

> **Status: SUPERSEDED.** The earlier three-sector antenna model in this file is
> no longer canonical. The current late-game contract is the Rune Stones →
> sectors → Asterion Resonator flow defined in
> [`EXPERIENCE_VR_RUNES_RESONATOR_FINALE.md`](../concept/EXPERIENCE_VR_RUNES_RESONATOR_FINALE.md).
> Do not implement the antenna described below; the remainder is retained only
> as historical design context until it is moved to legacy documentation.

## 1. Status and authority

Status: **TARGET / NOT IMPLEMENTED**.

This document is the canonical technical-gameplay contract for the future Experience VR platform antenna. It distinguishes four kinds of statements:

- **CANON** — binding spatial, gameplay and ownership invariants;
- **TUNING** — values or presentation parameters that may be adjusted without changing the mechanic;
- **OPEN DESIGN DECISION** — deliberately unresolved choices that must be settled in the named bounded implementation stage;
- **IMPLEMENTATION STAGE** — ordered delivery boundary, not evidence that runtime exists.

Runtime code remains authority for what is currently implemented. Nothing in this target model declares antenna runtime, controls, geometry, VFX, Large Glyph integration or Scenario orchestration implemented. Future implementation must preserve this geometric contract rather than reconstructing it from discussions.

## 2. Purpose

**CANON:** the antenna is a physical instrument for spatially searching the sky for Large Glyphs. It is not a classic raycast, nearest-ray hit, single scan cone, Astro Attractor target selector or pre-authored world-space target box.

Three completed Tier-3 platform sectors form a spatial “spoon.” Their visible surfaces generate finite directed volumes; only the common world-space intersection of all three volumes is the active scan field. Side-sector adjustment primarily controls field width, center-sector adjustment primarily controls depth and vertical direction, and Asterion subsequently sweeps the configured instrument through the world.

This document freezes geometry and ownership before any semantic motion API is designed. It intentionally defines no final motion command names and authorizes no generic THREE transform setters.

## 3. Dependencies

The antenna depends on the following canonical/runtime contracts:

- [`VR_PROGRESS_FLOOR_MODEL.md`](VR_PROGRESS_FLOOR_MODEL.md): five-sector `72°` layout, sector-local frame, `VrTiltableFloorRoot`, ActorRoot/MotionRoot ownership and visible authored presentation truth;
- [`VR_RUNTIME_MODEL.md`](VR_RUNTIME_MODEL.md): platform-relative versus world-stable hierarchy and actor composition boundaries;
- [`VR_RUNE_STONES_MODEL.md`](VR_RUNE_STONES_MODEL.md): installed Rune Stone, displaced bridge and platform-bound pair contract;
- [`EXPERIENCE_VR_GAMEPLAY_ROADMAP.md`](../concept/EXPERIENCE_VR_GAMEPLAY_ROADMAP.md): deferred gameplay routing without new Scenario point IDs;
- current Floor Sector Actor, Floor Actor and Asterion gyro runtime are implementation evidence only.

**CANON dependency gate:** antenna work begins on a correct platform-relative chain in which `floor → installed stone → displaced bridge` works and the entire sector/installed-stone/bridge pair inherits the sector `VrProgressFloorSectorMotionRoot`. Rune Stone installation and bridge extension therefore precede antenna hinges. Any mismatch must be corrected in the Rune/floor bounded stage, not hidden with antenna world offsets.

## 4. Antenna trio

**CANON:** WOOD, FIRE and EARTH form the antenna after their Tier-3 panels are complete. FIRE is the center; WOOD and EARTH are side wings.

The current canonical clockwise `rotationIndex` sequence is:

```text
0 METAL → 1 WATER → 2 WOOD → 3 FIRE → 4 EARTH → back to 0 METAL
```

Thus WOOD, FIRE and EARTH are three adjacent sectors, and FIRE is between WOOD and EARTH. The two side roles are derived from predecessor/successor ordering around FIRE in this canonical five-slot `72°` layout. “LEFT SIDE” and “RIGHT SIDE” are semantic results of that ordering and the sector-facing frame; they must never be inferred from global world X/Z or frozen as global world-left/world-right.

## 5. Canonical coordinate frames

**CANON:** at neutral, every identity MotionRoot uses the existing right-handed sector-local frame:

- `+X`: tangential/across the sector;
- `+Y`: platform surface normal;
- `+Z`: radial outward, from platform center through sector center.

The canonical neutral plane is the platform plane at antenna angle `0`. ActorRoot supplies the sector's canonical `rotationIndex × 72°` placement. `VrProgressFloorSectorMotionRoot` remains the owner of future per-sector runtime motion and inherits `VrTiltableFloorRoot`.

The geometric base of a sector-directed volume is the **currently transformed visible authored sector footprint**, not the permanently invisible technical `VR_PROGRESS_SECTOR_*_BASE`. The direction is the current world-space normal of that visible surface. No magic world offsets, branch corrections or global-axis sign assumptions may replace those live transforms.

Future implementation may introduce internal hinge/helper roots below MotionRoot, for example to express an off-center pivot while keeping the authored visual and Rune Installation Frame together. **CANON** freezes the physical pivot and axis, not helper-node names or an exact internal hierarchy.

## 6. Side-sector kinematics

**CANON:** WOOD and EARTH perform mirrored, one-sided radial roll around each sector's own local `+Z` axis. Neutral is `0°` in the canonical platform plane.

- one wing raises its outer-facing left edge while lowering the opposite edge;
- the other raises its outer-facing right edge while lowering the opposite edge;
- their rotation signs are derived from each wing's predecessor/successor relationship to FIRE in canonical sector ordering;
- the normals converge toward a shared spatial region and principally bound AntennaField width.

The wings do not receive the same signed world-axis rotation. They do not move through a symmetric `±` range. Their only legal path is `0 → inward roll → maximum`, with absolute maximum no greater than `45°` from neutral.

## 7. Center-sector hinge kinematics

**CANON:** FIRE does not use the side radial roll. It pitches around a hinge on its inner edge, nearest the platform center/Monkey side, about sector-local tangential `+X`.

- the inner edge remains fixed at canonical level `0`;
- the outer radial edge moves downward;
- the motion is one-sided: `0 → outer edge downward → maximum`;
- the absolute maximum is no greater than `45°` from neutral;
- this surface principally controls AntennaField depth and vertical direction.

Rotating FIRE around the center of its geometric bounds is forbidden because it would also displace the inner platform edge. A helper-node hierarchy is an implementation choice, but the inner-edge pivot and tangential hinge axis are invariants.

## 8. Detent model

**CANON UX:** final sector settings are discrete, not arbitrary continuous angles. SIDE adjustment has exactly three stable width settings; CENTER adjustment has exactly three stable depth settings. Neutral is the first stable state. Semantic labels may be `LEVEL_0 / LEVEL_1 / LEVEL_2` or `NEUTRAL / MID / MAX`; exact runtime naming is not frozen here.

SIDE and CENTER need not share angle values. Both remain one-sided and respect the hard limit `≤ 45°`. Smooth travel between stable states belongs to implementation, while arbitrary free-transform settlement is forbidden.

**TUNING:** the exact SIDE angles, CENTER angles and useful maximum. `30°` is only a reference; it is not an invariant.

## 9. Sector directed volumes

For each antenna sector, the target construction is:

```text
SectorVolume = extrude(
  current visible sector footprint,
  along current world-space surface normal,
  for a finite length
)
```

**CANON:** WOOD, FIRE and EARTH each produce one finite directed volume from live physical sector transforms. The visible authored presentation geometry supplies spatial meaning; the invisible technical BASE cannot become presentation truth. Volume geometry should be a simplified convex representation of the visible footprint rather than an unnecessary high-polygon copy.

**TUNING / OPEN DESIGN DECISION:** finite extrusion length. Exact footprint simplification and bounded representation are selected during P4/P5 without changing the visible-surface/normal contract.

## 10. AntennaField intersection

**CANON:** the active scan space exists in world space and is exactly the common portion of all three live directed volumes:

```text
AntennaField = WoodVolume ∩ FireVolume ∩ EarthVolume
```

No union, pairwise-only overlap, pre-saved target volume or static world-space box is equivalent. A change to any detent or any inherited platform transform changes the field live because it changes a physical surface and/or its world-space normal.

The Antenna Geometry Actor owns construction of the three volumes, their intersection and the authoritative live AntennaField. **OPEN DESIGN DECISION (P5):** the bounded mathematical intersection representation and update algorithm suitable for Quest 3S.

## 11. Live field presentation

**CANON:** AntennaField is visible while the player adjusts sectors so the spatial effect of every change can be read immediately. Its presentation is a bright, green, translucent, world-space volume representing the actual authoritative intersection. It is not a UI overlay and does not create gameplay truth.

Antenna VFX Projection reads AntennaField without owning or modifying its geometry. **TUNING / VFX implementation:** exact green, opacity, edge treatment, bloom, noise and subdivision.

## 12. Large Glyph membership

**CANON:** Large Glyphs remain world-stable; neither sector motion nor AntennaField transports them. A physical Large Glyph inside AntennaField receives an intense green reveal/highlight:

```text
LargeGlyph ∈ AntennaField
```

This is spatial membership, not nearest-ray selection, current direct Large Glyph scanning or Astro Attractor targeting. Large Glyph integration reads membership results and never owns antenna geometry.

**OPEN DESIGN DECISION (P7):** the exact membership rule—root point, bounding sphere, AABB or percentage overlap. The preferred bounded solution should use live physical actor bounds rather than root position alone, but that preference does not freeze an algorithm.

## 13. Asterion sweep

**CANON:** after sector geometry is configured, the player uses the existing Asterion Sphere mechanism to rotate the whole `VrTiltableFloorRoot`. The three sectors retain their selected detents and remain rigid relative to one another during the sweep.

Asterion rotates the platform, antenna sectors, their surface normals and AntennaField together. Large Glyphs remain world-stable, so the active intersection sweeps the sky. No second world-scanning controller may be introduced. Asterion continues to own only platform-root rotation and does not own antenna geometry, detent truth or membership.

## 14. Ownership boundaries

| Owner | Owns | Must not own |
| --- | --- | --- |
| Progress Floor / Sector Actors | physical sectors, hinge transforms, detent state; MotionRoot as sector motion owner | AntennaField intersection, glyph membership, Scenario truth |
| Antenna Geometry Actor | reads current sector transforms; constructs three SectorVolumes; computes and updates AntennaField | sector progression, input mapping, VFX styling, glyph transforms |
| Antenna VFX Projection | read-only world-space presentation of AntennaField | geometry/gameplay truth |
| Large Glyph integration | reads spatial membership; applies reveal/highlight presentation | antenna geometry or sector motion |
| Asterion | rotates `VrTiltableFloorRoot` using the existing mechanism | antenna truth or a second scan controller |
| Scenario | decides when antenna use is legal/required | geometry, transforms, intersection or detent interpolation |

**CANON:** no central global gameplay store is introduced. Semantic motion API belongs to a later bounded implementation stage after the geometric contract; this model defines neither final command names nor generic transform access.

## 15. Performance contract

Status: **TARGET**, designed for standalone Quest 3S.

**CANON performance constraints:**

- use geometrically simplified convex SectorVolumes;
- use a bounded intersection representation;
- recompute when an antenna transform changes and while an active Asterion sweep changes world transforms;
- do not require high-polygon volumetric CSG mesh generation every frame;
- assess CPU/GPU cost before selecting any CSG-like strategy;
- keep authoritative geometry separate from optional read-only VFX complexity.

**OPEN DESIGN DECISION (P5):** exact intersection algorithm, caching/change detection and bounded update cadence. A permanently heavy per-frame CPU/GPU volumetric CSG assumption is not acceptable.

## 16. Implementation stages P0–P9

Every item below is an **IMPLEMENTATION STAGE**. Only P0 is completed by this document; P1–P9 remain not implemented antenna work.

### ANTENNA P0 — Canonical model

Create and route this canonical contract. Do not implement runtime.

### ANTENNA P1 — Rune Stone installation / bridge extension completion

Prove `floor → installed stone → displaced bridge` and ensure the entire pair inherits Sector MotionRoot before antenna motion begins.

### ANTENNA P2 — Antenna hinge foundations

Add side radial hinges and the center inner-edge tangential hinge without gameplay controls. Preserve the pivot/axis invariants; helper-node naming and equivalent internal hierarchy remain implementation choices.

### ANTENNA P3 — Detent motion controller

Provide three stable SIDE states, three stable CENTER states, smooth transitions, one-sided motion and `≤ 45°`; prohibit arbitrary free transform. Define semantic commands only in this bounded stage.

### ANTENNA P4 — SectorVolume geometry

For WOOD, FIRE and EARTH derive a simplified visible-sector footprint, current world normal and finite extrusion.

### ANTENNA P5 — Three-volume intersection

Compute `WoodVolume ∩ FireVolume ∩ EarthVolume`, recompute live on relevant transform changes and select a bounded Quest 3S strategy.

### ANTENNA P6 — Green AntennaField VFX

Project the field read-only as a bright green translucent spatial volume without creating gameplay truth.

### ANTENNA P7 — Large Glyph membership

Test world-stable Large Glyph physical membership and apply intense green reveal/highlight.

### ANTENNA P8 — Asterion sweep integration

Keep the configured antenna rigid relative to the platform while existing `VrTiltableFloorRoot` rotation scans the world.

### ANTENNA P9 — Scenario / capabilities / guidance

Author availability, requirements, capabilities and guidance only after the physical mechanic works. Do not assign new Scenario point IDs in advance.

## 17. Open design decisions

All items below are **OPEN DESIGN DECISION** and must not be guessed in earlier stages:

1. exact angles of all three SIDE detents;
2. exact angles of all three CENTER detents;
3. whether the final useful maximum is `30°`, `35°`, `40°` or `45°` (always `≤ 45°`);
4. SectorVolume length;
5. mathematical representation of the three-volume intersection;
6. Large Glyph membership method;
7. exact AntennaField VFX;
8. UX for entering and leaving detents;
9. input mapping for sector motion;
10. Scenario beat/capability that enables the antenna.

## 18. Explicitly not implemented

This P0 task implements documentation only. It does **not** implement hinge nodes, sector rotation, detents, tweens, motion commands, input, AntennaField mesh, CSG, Large Glyph highlight, Asterion integration, Scenario effects, capabilities, player guidance, audio or VFX runtime.

The following invariants remain binding for later stages: WOOD/FIRE/EARTH are the trio; FIRE is central; sides use mirrored radial roll; FIRE uses inner-edge tangential pitch with its inner edge at level `0` and outer edge downward; all motion is one-sided and `≤ 45°`; each adjustment type has three stable positions; AntennaField is the live intersection of three normal-directed volumes; Large Glyphs remain world-stable; Asterion sweeps the configured instrument; MotionRoot owns sector motion; Scenario owns no geometry; and no magic offsets or global X/Z side-sign assumptions are permitted.
