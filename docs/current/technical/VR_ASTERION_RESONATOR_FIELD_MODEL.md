# Experience VR — Asterion Resonator Field Model

## 1. Status, authority, and scope

Status: **CURRENT DESIGN TARGET / R4 FIELD DOMAIN AND PREVIOUS FIELD PRESENTATION IMPLEMENTED / REVISED GEOMETRY NOT IMPLEMENTED / TARGET RESPONSE NOT IMPLEMENTED**.

This subordinate model is the binding authority for Resonator field geometry, future containment, resonance acquisition, and presentation target. The runtime R4 actor derives an immutable `FieldDescriptor` from installed Rune truth and committed EARTH/WOOD/FIRE levels, and a presentation currently renders the superseded cage. The revised aperture geometry, canonical forward alignment, containment, resonance acquisition, target response, and Astrolabium eligibility integration below are not runtime claims.

Sector motion remains `0° / 13° / 23° / 36°`. Sector control, FieldActor, Rune, Scenario, Guidance, and platform-energy ownership do not change. This model does not define a runtime transform/registry/rendering API, shader constants, numerical presentation tuning, or METAL/WATER contribution.

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

## 6. State space and equal detection authority

The physical core has `4 × 4 × 4 = 64` states including LEVEL 0. Its fully active subset has:

```text
3 LEFT profiles × 3 RIGHT profiles × 3 depth bands = 27 configurations
```

All 27 fully active configurations have identical target-detection authority. `α`, `β`, and `γ` define only field geometry: LEFT aperture profile, RIGHT aperture profile, and depth band respectively. No configuration has a target-family mapping, revelation password, scoring privilege, or Large Glyph privilege; `111`, `222`, and `333` are ordinary members of the 27-state set. A partial configuration containing any core channel at LEVEL 0 performs no target acquisition.

## 7. Fillet, bow, and presentation architecture

The nominal aperture corners define a rounded deformable cage, never a sharp rectangular box. The existing mismatch-driven fillet tuning may remain:

| Difference | Fillet strength |
| ---: | ---: |
| `0` | `8%` |
| `1` | `15%` |
| `2` | `22%` |

Rounded corners and Bézier-style fillets remain part of the target. Presentation wall bow is allowed only as a secondary electromagnetic deformation cue: it does not create the principal level-dependent width/height differences. Exact bow amplitude is **TUNING**, and the runtime `bowFraction` must not become canonical gameplay geometry.

The approved read-only presentation remains one lightweight translucent deformable skin plus one brighter curved geometric skeleton, with fixed/reusable topology and morphing between committed configurations. CSG, boolean geometry, raymarching, mandatory volumetric textures, and 27 authored meshes are excluded. Exact opacity, skeleton radius, morph duration, and bow amplitude remain **TUNING**.

## 8. Target containment and resonance — CURRENT TARGET, NOT IMPLEMENTED

A registered supported distant target accumulates resonance only while its canonical detection anchor is inside the nominal active field of a fully active configuration. Containment uses nominal field geometry. Presentation-only fillets, bow, skin morphing, skeleton geometry, opacity, and other visual tuning never alter the containment result. This mechanism is generic and is not hardcoded to Large Glyphs.

On first detection the target's Proto-Astro sign becomes visible. Acquisition resumes from retained completed stages and completes one stage per continuous `2.0 s` of containment: sign at `0 s`, ring 1 at `2 s`, ring 2 at `4 s`, and ring 3 plus full acquisition / `PULL_READY` at `6 s`. Only completed stages persist; leaving containment discards fractional progress toward the next stage. Exactly three rings mean `PULL_READY`, and all three rings then pulse slowly. Only a `PULL_READY` target is eligible to become targetable/pullable by Astrolabium Więzi; Astrolabium remains the sole owner of attraction.

Leaving the field stops acquisition and begins decay. One completed stage is lost after each continuous `20 s` outside: `3 → 2 → 1 → 0`, so three rings take `60 s` to disappear. The target remains `PULL_READY` while three rings remain; `3 → 2` removes eligibility. Re-entry stops decay, resets the current outside-field interval, and resumes from retained rings: three rings are already ready, while two/one/zero rings require `2 / 4 / 6 s`. A later exit starts a fresh 20-second interval from the then-retained state. Exact fade curves within decay intervals remain **TUNING**.

The Proto-Astro sign remains visible throughout acquisition, `PULL_READY`, and ring decay. After the final ring disappears it persists for an additional `60 s`; during this sign-only memory the target is not ready and needs the full `6 s` to reacquire. After that additional minute outside the field, the sign disappears and the target returns to its undiscovered presentation state.

The response consists only of the target's Proto-Astro sign and up to three thin target-centered resonance rings, using that target's Proto-Astro family presentation color. The sign always faces the player's current head position and keeps an approximately constant apparent size across target depth. Exact angular size, world-scale calculation, scale clamps, ring dimensions, line thickness, spacing, pulse values, and fade curves are **TUNING**, not canon. No exact renderer, shader, billboard mechanism, actor name, or registry API is established here.

## 9. CURRENT IMPLEMENTED RUNTIME gaps

The current runtime correctly reflects the superseded canon but is not yet aligned with this revised CURRENT DESIGN TARGET:

1. the shape resolver still uses the superseded fixed `S0–S3` geometry;
2. its field begins at the previous origin/depth model rather than `10 m` along FORWARD;
3. side levels do not use the new `23 / 13 / 7 m` LATERAL and `7 / 13 / 23 m` VERTICAL half-extent mapping;
4. presentation signed bow is derived from the superseded geometry and becomes only a secondary effect under the revised model;
5. Field Presentation is mounted under the fixture hierarchy rather than a future sector-layout-aligned field frame;
6. sector layout has not yet been intentionally realigned so the FIRE outward radial axis and field FORWARD match canonical `entryDirection`.
7. physical target containment, per-target resonance stages/decay/sign memory, sign-and-ring response, and Astrolabium eligibility integration do not exist;
8. field-shape code still exposes the superseded `coherentPreset / largeGlyphRevealEligible` concept.

These are implementation gaps introduced by the superseding design decision, not defects in the previous implementation. Runtime code and settings are unchanged by this documentation task.

## 10. Ownership and boundaries

| Owner | Owns | Does not own |
| --- | --- | --- |
| progress-floor geometry / sector layout | authored FIRE-radial-to-FORWARD relationship | fixture positions/orientations, player passenger hierarchy, live Monkey tracking |
| sector control | lock, local sector setting, bounded motion commands | field geometry, descriptor interpretation, response |
| Resonator Field Domain / R4 actor | authoritative active field state, nominal field shape, and immutable descriptor | MotionRoot, containment, resonance memory, Scenario truth, presentation geometry |
| future containment | whether a registered supported target's canonical anchor is inside the nominal fully active field | presentation geometry, resonance memory, attraction |
| future resonance acquisition | per-target completed stages, acquisition timing, decay, sign memory, and `PULL_READY` | field geometry, attraction/pull, Scenario meaning |
| Field Presentation | read-only projection of descriptor into skin and skeleton | gameplay/containment/resonance truth, sector motion |
| Astrolabium Więzi | targetability and attraction/pull after `PULL_READY` eligibility | containment and resonance eligibility truth |
| `PlatformEnergyVfxActor` | procedural platform/Zwornik energy | field skin, field skeleton, target response |
| Scenario / Guidance | narrative meaning, guidance, crystal-acquisition gates | containment and resonance truth |

METAL/WATER contribution, field audio, and implementation of revised geometry, containment, resonance acquisition, approved response, and Astrolabium eligibility integration remain future work.
