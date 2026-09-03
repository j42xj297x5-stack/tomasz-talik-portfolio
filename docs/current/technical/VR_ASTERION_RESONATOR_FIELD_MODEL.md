# Experience VR — Asterion Resonator Field Model

## 1. Status, authority, and scope

Status: **CURRENT / BINDING — CORE FIELD, METAL EXTENSION, TARGET ACQUISITION/RESPONSE AND ASTROLABIUM ELIGIBILITY IMPLEMENTED; HARDWARE QA OUTSTANDING**.

This subordinate model is the binding authority for Resonator field geometry, nominal containment, resonance acquisition, and read-only presentation. Runtime derives the immutable `FieldDescriptor`, resolves the revised nominal aperture geometry in a dedicated Resonator Field Frame, evaluates registered targets, projects their response, and exposes bounded `PULL_READY` eligibility to Astrolabium.

Sector motion remains `0° / 13° / 23° / 36°`. Sector control, FieldActor, Rune, Scenario, Guidance, and platform-energy ownership do not change. This model does not define a general runtime transform/registry/rendering API or shader constants; concrete Metal axes, expansion values and rounding multipliers are explicitly **TUNING / HARDWARE QA**.

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

On first detection the target's Proto-Astro sign becomes visible. Acquisition resumes from retained completed stages and completes one stage per continuous `2.0 s` of containment: sign at `0 s`, ring 1 at `2 s`, ring 2 at `4 s`, and ring 3 plus full acquisition / `PULL_READY` at `6 s`. Only completed stages persist; leaving containment discards fractional progress toward the next stage. Exactly three rings mean `PULL_READY`, and all three rings then pulse slowly. `PULL_READY` is the transient additional physical-pull grant for late `SPHERE_FAR` escaped/reacquisition targets. Persistent Astrolabium family knowledge remains separate and is sufficient for ordinary earlier Large Glyph attraction. This early/late policy is **IMPLEMENTED CURRENT**. Astrolabium remains the sole owner of attraction.

Leaving the field stops acquisition and begins decay. One completed stage is lost after each continuous `20 s` outside: `3 → 2 → 1 → 0`, so three rings take `60 s` to disappear. The target remains `PULL_READY` while three rings remain; `3 → 2` removes eligibility. Re-entry stops decay, resets the current outside-field interval, and resumes from retained rings: three rings are already ready, while two/one/zero rings require `2 / 4 / 6 s`. A later exit starts a fresh 20-second interval from the then-retained state. Exact fade curves within decay intervals remain **TUNING**.

The Proto-Astro sign remains visible throughout acquisition, `PULL_READY`, and ring decay. After the final ring disappears it persists for an additional `60 s`; during this sign-only memory the target is not ready and needs the full `6 s` to reacquire. After that additional minute outside the field, the sign disappears and the target returns to its undiscovered presentation state.

The response consists only of the target's Proto-Astro sign and up to three thin target-centered resonance rings, using that target's Proto-Astro family presentation color. The sign always faces the player's current head position and keeps an approximately constant apparent size across target depth. Exact angular size, world-scale calculation, scale clamps, ring dimensions, line thickness, spacing, pulse values, and fade curves are **TUNING**, not canon. The runtime presentation is a read-only projection of acquisition truth. Its exact angular sizes, opacity, ring thickness, palette, pulse amplitude/period, and scale calculations remain **TUNING**, not architectural law.

## 8a. Metal advanced field extension — CURRENT / IMPLEMENTED

The implemented EARTH/WOOD/FIRE geometry remains unchanged. Installed Metal plus `CAN_USE_ADVANCED_RESONATOR` enables the existing acquisition path and two independent physical detented DOFs, `M(angle, tilt)`, each with `0 = OFF` and active values `1/2/3`. Their state is transient Resonator control truth and resets to `M00`; it is not Scenario or Rune progression truth. The provisional implementation maps `angle → LATERAL` and `tilt → FORWARD/depth`, with no VERTICAL expansion. The semantic assignment and sector-local gesture/motion axes are **TUNING / HARDWARE QA**.

Angle levels `1/3` add `8 m` per LATERAL side; `0/2` add zero. Tilt levels `1/3` expand the selected FIRE band by up to `10 m` at both ends, clamped to the global `10–130 m` depth domain; `0/2` preserve the exact original band. Therefore NEAR becomes `10–60 m`, MID `40–100 m`, and FAR `80–130 m`. These values are **TUNING / HARDWARE QA**. `M22` preserves compact gameplay range while retaining its distinct active midpoint state. The resolved shape carries Metal levels, expansions and descriptive `harmonicCenter`; no harmonic recognition is implemented.

Metal also drives a read-only presentation response through existing field morphing. When both DOFs are active, mismatch fillet is multiplied by `1.50` at `M22`, `0.90` with exactly one off-center DOF, or `0.60` with both off center, then clamped to `0.32`. These values are **TUNING / HARDWARE QA**. If either DOF is OFF, pre-Metal mismatch fillet is unchanged. Bow amplitude is unchanged, and presentation fillet/bow/skin never changes containment.

Future WATER does not widen ordinary containment. Its active angle maps `1 → GREEN`, `2 → BLUE`, `3 → VIOLET/PURPLE`; active tilt maps `1 → very dark`, `2 → medium luminance`, `3 → very bright`; `0` is OFF. Hue and luminance express Water frequency state, not a generic power ladder. `W(2,2)` is medium BLUE. At `222 / M22 / W22`, the compact balanced field gains maximum rounding and a gentle coherent BLUE breathing pulse; exact color, luminance, pulse and deformation values remain tuning.

Installed Water plus `222 / M22 / W22` derives future WATER SYNC LOCK. Lock plus Haiku Cosmos's canonical anchor inside the active field derives WATER SYNC CONTACT; only contact strongly damps its angular and radial motion. Target Acquisition remains generic and owns containment, stages, decay, sign memory and `PULL_READY`, not Water timers. It may reach and retain generic readiness before Water. Final Haiku pull eligibility separately requires family knowledge + late context + `PULL_READY` + current WATER SYNC CONTACT, so Metal-expanded containment and retained rings cannot bypass Water.

## 9. Remaining runtime gaps and validation boundary

The revised nominal shape, depth planes, side profiles, dedicated Field Frame/alignment, containment, per-target acquisition/decay/sign memory, sign-and-ring response, and Astrolabium eligibility are **IMPLEMENTED**. The active shape result no longer carries the superseded `coherentPreset` or `largeGlyphRevealEligible` fields.

Genuine **FUTURE / NOT IMPLEMENTED** scope includes Resonator field/target audio, Water control and hue/luminance/pulse presentation, Water Sync Lock/Contact, harmonic recognition, Haiku damping and the Water-specific final anti-bypass gate, plus later Scenario/finale systems. The late-only `PULL_READY` policy and Large Glyph angular plus `20–110 m` radial motion are implemented; their numeric tuning and hardware QA remain outstanding.

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
| Metal advanced domain / sector control | transient `M(angle, tilt)`, sector-local dual-DOF motion, LATERAL/FORWARD tuning and descriptive harmonic-center state | target family, `PULL_READY`, Scenario truth, harmonic recognition, Haiku motion |
| future Water advanced domain | hue/luminance settings, Water Sync Lock and bounded Sync Contact truth | acquisition timers, physical motion, Scenario truth |
| Large Glyph Actor | physical angular/radial motion and future damped response | Water lock/contact truth, pull eligibility |
| Astrolabium Więzi | selected band and attraction/pull after family and context eligibility | family truth, containment and resonance eligibility truth |
| `PlatformEnergyVfxActor` | procedural platform/Zwornik energy | field skin, field skeleton, target response |
| Scenario / Guidance | narrative meaning, guidance, crystal-acquisition gates | containment and resonance truth |

Water contribution, Resonator field/target audio, later supported target registrations, harmonic synchronization and later finale systems remain **FUTURE / NOT IMPLEMENTED**.
