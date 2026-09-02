# Experience VR — Asterion Resonator Field Model

## 1. Status, authority, and scope

Status: **CURRENT DESIGN TARGET / R4 FIELD DOMAIN AND PREVIOUS FIELD PRESENTATION IMPLEMENTED / REVISED GEOMETRY NOT IMPLEMENTED / TARGET RESPONSE NOT IMPLEMENTED**.

This subordinate model is the binding authority for the Resonator field geometry and presentation target. The runtime R4 actor derives an immutable `FieldDescriptor` from installed Rune truth and committed EARTH/WOOD/FIRE levels, and a presentation currently renders the superseded cage. The revised aperture geometry and canonical forward alignment below are not runtime claims.

Sector motion remains `0° / 13° / 23° / 36°`. Sector control, FieldActor, Rune, Scenario, Guidance, and platform-energy ownership do not change. This model does not define scoring, target containment, a runtime transform API, shader constants, or METAL/WATER contribution.

## 2. Powered and field-active sectors

A **POWERED SECTOR** has its correct Rune Stone installed and is responsive and lockable. A **FIELD-ACTIVE SECTOR** is powered and has a committed level above `0`. Rune installation alone is not `fieldActive`.

```text
Rune installed → powered → lockable → LEVEL 0 / 0° → field contribution OFF
```

Each core channel retains four stable levels: `LEVEL 0 / 0° / OFF`, then active levels `1 / 13°`, `2 / 23°`, and `3 / 36°`.

## 3. Semantic axes and canonical forward alignment

The semantic field axes are authoritative:

- **FORWARD** — the direction in which the Resonator scans away from the platform, aligned with the canonical world entry direction;
- **LATERAL** — left ↔ right across the field;
- **VERTICAL** — down ↔ up.

For the current Three.js implementation target, `FORWARD → platform-local +Z`, `LATERAL → platform-local X`, and `VERTICAL → platform-local Y`. Engine-axis letters are implementation detail and do not redefine the semantic contract.

Current settings expose `spatial.entryDirection = (0, 0, +1)`. FIRE is the central Resonator sector. The authored progress-floor geometry / sector layout must be aligned so FIRE's outward radial axis points along canonical `FORWARD / entryDirection`, and the Resonator field forward axis follows it:

```text
Monkey / player reference direction
        ↓
canonical entryDirection / FORWARD
        ↓
FIRE outward radial axis
        ↓
Resonator field forward axis
```

This is a fixed authored layout relationship, not a live dependency on Monkey head rotation. Only progress-floor geometry / sector layout participates in this alignment. Astro Furnace, Portal, Crystal Reliquary, their controls/buttons, and the player passenger hierarchy retain their independent authored positions, orientations, and ownership outside this layout rotation.

## 4. Field start, depth bands, and control cage

The first visible/effective boundary is `10 m` from platform center along FORWARD; maximum target depth is `130 m`. Four depth planes retain a lightweight 16-corner control cage:

| Plane | FORWARD coordinate |
| --- | ---: |
| `D0` | `10 m` |
| `D1` | `50 m` |
| `D2` | `90 m` |
| `D3` | `130 m` |

FIRE / `γ` controls depth only:

| `γ` | Meaning | Near → far planes | Depth band |
| --- | --- | --- | --- |
| `0` | `NONE / OFF` | none | none |
| `1` | `NEAR` | `D0 → D1` | `10–50 m` |
| `2` | `MID` | `D1 → D2` | `50–90 m` |
| `3` | `FAR` | `D2 → D3` | `90–130 m` |

Gamma does not control aperture width, aperture height, left profile, or right profile. The previous `S0–S3` fixed width/height cage and `0 / 43.333333 / 86.666667 / 130 m` slices are superseded and are not CURRENT design geometry.

## 5. Independent side-wing aperture profiles

EARTH / `α` controls the **LEFT half** of the aperture. WOOD / `β` independently controls the **RIGHT half**. Every value below is a **half-extent measured from the field center axis**, not a complete width or height.

| Level | Profile | LATERAL half-extent | VERTICAL half-extent |
| --- | --- | ---: | ---: |
| `1` | WIDE / LOW | `23 m` | `7 m` |
| `2` | BALANCED | `13 m` | `13 m` |
| `3` | NARROW / HIGH | `7 m` | `23 m` |

Consequently, symmetric apertures measure `46 × 14 m` for `1-1`, `26 × 26 m` for `2-2`, and `14 × 46 m` for `3-3` (complete width × complete height).

At each active band's near and far planes, the LEFT corners derive from `α` and the RIGHT corners derive from `β`, using the same selected side profiles at both boundaries. Gamma supplies only the two FORWARD coordinates. This yields nominal eight-corner active geometry without 27 separately authored meshes.

Left and right profiles are intentionally independent. For example, `α=1, β=3` creates a far-out, low LEFT side and a close-in, high RIGHT side. Legal configurations therefore include balanced squares, wide/low rectangles, narrow/high rectangles, and asymmetric intermediate apertures. Their primary difference comes from nominal aperture coordinates, not a cosmetic bow around one common box.

## 6. State space and revelation presets

The physical core has `4 × 4 × 4 = 64` states including LEVEL 0. Its fully active subset has:

```text
3 LEFT profiles × 3 RIGHT profiles × 3 depth bands = 27 configurations
```

All 27 fully active configurations are legal field states. Only `111`, `222`, and `333` permit full Large Glyph revelation:

| Preset | Depth | Aperture signature |
| --- | --- | --- |
| `111` | NEAR | wide / low |
| `222` | MID | balanced / square |
| `333` | FAR | narrow / high |

The other 24 fully active configurations are not eligible for full Large Glyph revelation. Exact scoring is not defined here.

## 7. Fillet, bow, and presentation architecture

The nominal aperture corners define a rounded deformable cage, never a sharp rectangular box. The existing mismatch-driven fillet tuning may remain:

| Difference | Fillet strength |
| ---: | ---: |
| `0` | `8%` |
| `1` | `15%` |
| `2` | `22%` |

Rounded corners and Bézier-style fillets remain part of the target. Presentation wall bow is allowed only as a secondary electromagnetic deformation cue: it does not create the principal level-dependent width/height differences. Exact bow amplitude is **TUNING**, and the runtime `bowFraction` must not become canonical gameplay geometry.

The approved read-only presentation remains one lightweight translucent deformable skin plus one brighter curved geometric skeleton, with fixed/reusable topology and morphing between committed configurations. CSG, boolean geometry, raymarching, mandatory volumetric textures, and 27 authored meshes are excluded. Exact opacity, skeleton radius, morph duration, and bow amplitude remain **TUNING**.

## 8. Supported-object response — CURRENT TARGET, NOT IMPLEMENTED

The approved supported-target response remains a bright green halo plus the target's Proto-Astro sign, with no additional quest marker or HUD decoration. Full Large Glyph revelation remains restricted to `111`, `222`, and `333`. This document does not further design target response.

## 9. CURRENT IMPLEMENTED RUNTIME gaps

The current runtime correctly reflects the superseded canon but is not yet aligned with this revised CURRENT DESIGN TARGET:

1. the shape resolver still uses the superseded fixed `S0–S3` geometry;
2. its field begins at the previous origin/depth model rather than `10 m` along FORWARD;
3. side levels do not use the new `23 / 13 / 7 m` LATERAL and `7 / 13 / 23 m` VERTICAL half-extent mapping;
4. presentation signed bow is derived from the superseded geometry and becomes only a secondary effect under the revised model;
5. Field Presentation is mounted under the fixture hierarchy rather than a future sector-layout-aligned field frame;
6. sector layout has not yet been intentionally realigned so the FIRE outward radial axis and field FORWARD match canonical `entryDirection`.

These are implementation gaps introduced by the superseding design decision, not defects in the previous implementation. Runtime code and settings are unchanged by this documentation task.

## 10. Ownership and boundaries

| Owner | Owns | Does not own |
| --- | --- | --- |
| progress-floor geometry / sector layout | authored FIRE-radial-to-FORWARD relationship | fixture positions/orientations, player passenger hierarchy, live Monkey tracking |
| sector control | lock, local sector setting, bounded motion commands | field geometry, descriptor interpretation, response |
| Resonator Field Domain / R4 actor | read-only committed state and current immutable descriptor | MotionRoot, Scenario truth, presentation geometry |
| Field Presentation | read-only projection of descriptor into skin and skeleton | gameplay truth, scoring, sector motion |
| `PlatformEnergyVfxActor` | procedural platform/Zwornik energy | field skin, field skeleton, target response |
| Scenario / Guidance | narrative meaning, guidance, crystal-acquisition gates | physical field ownership |

METAL/WATER contribution, exact target selection and scoring, field audio, and implementation of the revised geometry and approved response remain future work.
