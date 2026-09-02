# Experience VR — Asterion Resonator Field Model

## 1. Status, authority, and scope

Status: **CURRENT / BINDING — REVISED FIELD, TARGET ACQUISITION, TARGET RESPONSE AND ASTROLABIUM ELIGIBILITY IMPLEMENTED; HARDWARE QA OUTSTANDING**.

This subordinate model is the binding authority for Resonator field geometry, nominal containment, resonance acquisition, and read-only presentation. Runtime derives the immutable `FieldDescriptor`, resolves the revised nominal aperture geometry in a dedicated Resonator Field Frame, evaluates registered targets, projects their response, and exposes bounded `PULL_READY` eligibility to Astrolabium.

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

In the current Three.js implementation, `FORWARD → platform-local +Z`, `LATERAL → platform-local X`, and `VERTICAL → platform-local Y`. Engine-axis letters are implementation detail and do not redefine the semantic contract.

Current settings expose `spatial.entryDirection = (0, 0, +1)`. FIRE is the central Resonator sector. The implemented progress-floor composition aligns the authored geometry / sector layout so FIRE's outward radial axis points along canonical `FORWARD / entryDirection`, and the Resonator field forward axis follows it:

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

## 8. Target containment and resonance — IMPLEMENTED

A registered supported distant target accumulates resonance only while its canonical detection anchor is inside the nominal active field of a fully active configuration. Containment uses nominal field geometry. Presentation-only fillets, bow, skin morphing, skeleton geometry, opacity, and other visual tuning never alter the containment result. This mechanism is generic and is not hardcoded to Large Glyphs.

On first detection the target's Proto-Astro sign becomes visible. Acquisition resumes from retained completed stages and completes one stage per continuous `2.0 s` of containment: sign at `0 s`, ring 1 at `2 s`, ring 2 at `4 s`, and ring 3 plus full acquisition / `PULL_READY` at `6 s`. Only completed stages persist; leaving containment discards fractional progress toward the next stage. Exactly three rings mean `PULL_READY`, and all three rings then pulse slowly. Only a `PULL_READY` target is eligible to become targetable/pullable by Astrolabium Więzi; Astrolabium remains the sole owner of attraction.

Leaving the field stops acquisition and begins decay. One completed stage is lost after each continuous `20 s` outside: `3 → 2 → 1 → 0`, so three rings take `60 s` to disappear. The target remains `PULL_READY` while three rings remain; `3 → 2` removes eligibility. Re-entry stops decay, resets the current outside-field interval, and resumes from retained rings: three rings are already ready, while two/one/zero rings require `2 / 4 / 6 s`. A later exit starts a fresh 20-second interval from the then-retained state. Exact fade curves within decay intervals remain **TUNING**.

The Proto-Astro sign remains visible throughout acquisition, `PULL_READY`, and ring decay. After the final ring disappears it persists for an additional `60 s`; during this sign-only memory the target is not ready and needs the full `6 s` to reacquire. After that additional minute outside the field, the sign disappears and the target returns to its undiscovered presentation state.

The response consists only of the target's Proto-Astro sign and up to three thin target-centered resonance rings, using that target's Proto-Astro family presentation color. The sign always faces the player's current head position and keeps an approximately constant apparent size across target depth. Exact angular size, world-scale calculation, scale clamps, ring dimensions, line thickness, spacing, pulse values, and fade curves are **TUNING**, not canon. The runtime presentation is a read-only projection of acquisition truth. Its exact angular sizes, opacity, ring thickness, palette, pulse amplitude/period, and scale calculations remain **TUNING**, not architectural law.

## 9. Remaining runtime gaps and validation boundary

The revised nominal shape, depth planes, side profiles, dedicated Field Frame/alignment, containment, per-target acquisition/decay/sign memory, sign-and-ring response, and Astrolabium eligibility are **IMPLEMENTED**. The active shape result no longer carries the superseded `coherentPreset` or `largeGlyphRevealEligible` fields.

Genuine **FUTURE / NOT IMPLEMENTED** scope is limited here to Resonator field/target audio, METAL/WATER contribution and advanced amplification, registration of later supported target classes beyond the currently composed five Large Glyph nodes, and later Scenario/finale systems.

**HARDWARE QA OUTSTANDING:** this synchronization does not validate Quest comfort, perceptual sign size, ring or family-color readability, pulse comfort, ease of maintaining containment, or the practical feel of `6 s` acquisition and `20 s` decay. This validation gap does not regress implemented architecture.

## 10. Ownership and boundaries

| Owner | Owns | Does not own |
| --- | --- | --- |
| progress-floor geometry / sector layout | implemented FIRE-radial-to-FORWARD relationship and dedicated Resonator Field Frame | fixture positions/orientations, player passenger hierarchy, live Monkey tracking |
| sector control | lock, local sector setting, bounded motion commands | field geometry, descriptor interpretation, response |
| Resonator Field Domain / R4 actor | authoritative active field state, nominal field shape, immutable descriptor and Field Frame | MotionRoot, resonance memory, Scenario truth, presentation geometry |
| Resonator Target Acquisition | generic registered-target canonical-anchor containment in Field Frame local coordinates; per-target completed stages, acquisition/decay, sign memory and `PULL_READY` | raycasting, scene traversal, physics, presentation geometry, attraction/pull, Scenario meaning |
| Target Response Presentation | read-only Proto-Astro sign and ring projection from acquisition truth | containment, timing, eligibility, pull |
| Field Presentation | read-only projection of descriptor into skin and skeleton | gameplay/containment/resonance truth, sector motion |
| Astrolabium Więzi | targetability and attraction/pull after `PULL_READY` eligibility | containment and resonance eligibility truth |
| `PlatformEnergyVfxActor` | procedural platform/Zwornik energy | field skin, field skeleton, target response |
| Scenario / Guidance | narrative meaning, guidance, crystal-acquisition gates | containment and resonance truth |

METAL/WATER contribution, Resonator field/target audio, later supported target registrations, and later finale systems remain **FUTURE / NOT IMPLEMENTED**.
