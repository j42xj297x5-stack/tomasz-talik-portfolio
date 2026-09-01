# Experience VR — Asterion Resonator Field Model

## 1. Status, authority, and scope

Status: **CURRENT TARGET / R4 FIELD DOMAIN IMPLEMENTED / FIELD PRESENTATION AND TARGET RESPONSE NOT IMPLEMENTED**.

This subordinate model freezes the semantic field geometry and visual-presentation target. The runtime R4 actor already derives an immutable `FieldDescriptor` from installed Rune truth and committed EARTH/WOOD/FIRE levels. It does not yet implement the geometry, presentation, target response, or revised depth-band meaning defined here.

Sector motion remains `0° / 13° / 23° / 36°`. Sector control, Rune, Scenario, Guidance, and platform-energy ownership do not change. This model does not define scoring, shader constants, or METAL/WATER contribution.

## 2. Powered and field-active sectors

A **POWERED SECTOR** has its correct Rune Stone installed and is responsive and lockable. A **FIELD-ACTIVE SECTOR** is powered and has a committed level above `0`. Therefore Rune installation alone is not `fieldActive`.

```text
Rune installed → powered → lockable → LEVEL 0 / 0° → field contribution OFF
```

Each core channel retains four stable levels: `LEVEL 0 / 0° / OFF`, then active levels `1 / 13°`, `2 / 23°`, and `3 / 36°`.

## 3. Field coordinate system and continuous control cage

The visual field uses Resonator-local coordinates:

- `X` = depth outward from the platform;
- `Y` = vertical height;
- `Z` = lateral width;
- `Z-` = left;
- `Z+` = right.

One continuous 16-point control cage defines the field: four depth cross-sections, each with four corners. For every slice the corners are `(X, ±height/2, ±width/2)`.

| Slice | `X` | Width along `Z` | Height along `Y` | Four corners |
| --- | ---: | ---: | ---: | --- |
| `S0` | `0 m` | `8.25 m` | `5.50 m` | `(0, ±2.75, ±4.125)` |
| `S1` | `43.333333 m` | `11.75 m` | `8.50 m` | `(43.333333, ±4.25, ±5.875)` |
| `S2` | `86.666667 m` | `18.25 m` | `11.50 m` | `(86.666667, ±5.75, ±9.125)` |
| `S3` | `130 m` | `27.75 m` | `14.50 m` | `(130, ±7.25, ±13.875)` |

The values intentionally make the average dimensions of the three depth spans equal to the approved bands:

| Level | Span | Average width | Average height |
| --- | --- | ---: | ---: |
| `LEVEL 1` | `S0 → S1`, `0–43.333333 m` | `~10 m` | `~7 m` |
| `LEVEL 2` | `S1 → S2`, `43.333333–86.666667 m` | `~15 m` | `~10 m` |
| `LEVEL 3` | `S2 → S3`, `86.666667–130 m` | `~23 m` | `~13 m` |

## 4. Channel semantics and implementation gap

- EARTH / `α` controls the **left** field profile.
- WOOD / `β` controls the **right** field profile.
- FIRE / `γ` selects the **depth span**.

The canonical target mapping is:

| `γ` | Meaning | Selected span |
| --- | --- | --- |
| `0` | `NONE / OFF` | none |
| `1` | `NEAR` | `S0 → S1` |
| `2` | `MID` | `S1 → S2` |
| `3` | `FAR` | `S2 → S3` |

**CURRENT IMPLEMENTATION GAP:** `createVrAsterionResonatorFieldActor.js` still exposes `0=NONE, 1=FAR, 2=MID, 3=NEAR`. Runtime therefore does not yet align with the canonical `NONE / NEAR / MID / FAR` target. This documentation does not change the actor or `FieldDescriptor`.

## 5. Active field construction and state space

For a fully active state `(α, β, γ)`:

1. `γ` selects the `X` coordinates of the near and far field planes.
2. `α` selects the two endpoint dimensions of the **left half-profile** from its corresponding canonical band.
3. `β` selects the two endpoint dimensions of the **right half-profile** from its corresponding canonical band.
4. Those left and right profiles are transplanted onto the depth span selected by `γ`.
5. The result supplies the nominal eight corners of the active field volume; the continuous cage and curvature rules turn those corners into the rendered shape.

The physical core has `4 × 4 × 4 = 64` states. The fully active subset has `3 × 3 × 3 = 27` states. The nine states with `α = β > 0` remain laterally symmetric across the three active depth spans.

Only three coherent full-field presets permit full Large Glyph revelation: `(1,1,1)`, `(2,2,2)`, and `(3,3,3)`. The other 24 fully active configurations remain legal field states. They may lose stability or energy and may produce responses from other supported objects, but they must not fully reveal the distant Large Glyph target. Partial and asymmetric states also remain legal. Exact scoring is not frozen.

## 6. Curvature and fillet target

The nominal corners define a deformable rounded cage, not a sharp rectangular box. For each side:

```text
dLeft  = abs(α - γ)
dRight = abs(β - γ)
```

Initial CURRENT TARGET edge-trim / fillet tuning is:

| Difference | Fillet strength |
| ---: | ---: |
| `0` | `8%` |
| `1` | `15%` |
| `2` | `22%` |

Greater mismatch creates stronger rounding and deformation. Signed mismatch (`α-γ` or `β-γ`) may determine the bow direction of the corresponding wall. Exact bow amplitude remains **TUNING** and is not frozen.

## 7. Presentation architecture — CURRENT TARGET, NOT IMPLEMENTED

The primary field presentation consists of:

1. one lightweight, lightly translucent deformable skin;
2. one brighter curved edge/skeleton layer.

The 16-point cage is the semantic shape source. The target implementation direction is a custom indexed `BufferGeometry`, rounded corner paths using quadratic/cubic Bézier-style interpolation, a small number of intermediate cross-sections, and a low vertex count. Presentation reads committed `FieldDescriptor` state and never owns gameplay truth.

The field must have no visually sharp 90-degree corners. Edges are more visible than surfaces, and the result must read as an electromagnetic/resonant volume rather than a glass box. CSG, boolean geometry, raymarching, mandatory volumetric textures, and 27 separately authored meshes are excluded. Exact opacity, shader values, subdivision counts, line thickness, and transition timing remain **TUNING**.

## 8. Supported-object response — CURRENT TARGET, NOT IMPLEMENTED

A supported object inside the active field may respond visually. The approved base response is a bright green halo plus the object's Proto-Astro sign, with no additional quest marker or UI decoration. Full Large Glyph revelation remains restricted to `(1,1,1)`, `(2,2,2)`, and `(3,3,3)`.

## 9. Ownership and boundaries

| Owner | Owns | Does not own |
| --- | --- | --- |
| sector control | lock, local sector setting, bounded motion commands | field geometry, descriptor interpretation, response |
| Resonator Field Domain / R4 actor | read-only committed state and current immutable descriptor | MotionRoot, Scenario truth, presentation geometry |
| Field Presentation | read-only projection of descriptor into skin, skeleton, and supported-object visuals | gameplay truth, scoring, sector motion |
| `PlatformEnergyVfxActor` | procedural platform/Zwornik energy | field skin, field skeleton, target response |
| Scenario / Guidance | narrative meaning, guidance, crystal-acquisition gates | physical field ownership |

METAL/WATER contribution, exact target selection and scoring, field audio, and implementation of the approved presentation remain future work.
