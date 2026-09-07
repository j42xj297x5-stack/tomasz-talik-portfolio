# Experience VR — Astrolabium Sandbox Migration

Status: **BINDING DESIGN TARGET / MIGRATION CONTRACT / NOT YET FULLY IMPLEMENTED**.

This document freezes the migration from Scenario-gated Astrolabium progression to domain-owned sandbox behavior. `CURRENT` describes observed runtime facts. `TARGET` and `KANON` are binding implementation requirements, not claims about the current runtime.

## Canonical separation of rights

**KANON:** these rights are independent and must not be collapsed into one generic eligibility flag:

```text
TOOL OWNED
≠ BAND EXISTS
≠ SCAN BEAM MAY DISPLAY
≠ FAMILY IS UNDERSTOOD
≠ TARGET MAY BE ACQUIRED
≠ TARGET MAY BE PULLED
≠ RESULT MAY BE CONSUMED / USED
≠ WORLD INSTALLATION IS READY
```

## Physical ownership and bands

**CURRENT / IMPLEMENTED (S1):** physical ownership derives from `AstroAttractorProductionController.EARNED` after the player physically claims the Furnace product. It is permanent for the rest of the session:

```text
Astrolabium physically EARNED
→ may equip
→ may switch between SHELLS / SMALL_GLYPHS / LARGE_GLYPHS / RUNESTONES
→ selected band may display its scan beam
```

All-four-band availability begins only at physical `EARNED` ownership. Before ownership this contract grants no equip, band, or beam right. After ownership, band existence and beam visibility do not imply a legal target. Scenario events such as `ASTRO_ATTRACTOR_PRODUCED` and `ASTRO_ATTRACTOR_CLAIMED` may advance narrative and observe the claim, but Scenario must not own or revoke equip, band-switch, scan, target, or pull rights.

The `RUNESTONES` band exists from Astrolabium ownership. An empty targetable Rune-family set means:

```text
band selectable
+ blue scan beam available
+ zero legal Rune Stone targets
```

It does not mean `band unavailable`. Runtime exposes the band independently of `RuneStoneAttractorBandProjection.isAvailable()`; that projection continues to describe family targetability.

## Natural-family knowledge chain

**KANON:** family targetability remains domain-derived.

| Band | Domain-owned targetability law |
| --- | --- |
| `SHELLS` | Natural Shell families require no prior tuning and are targetable after Astrolabium ownership. |
| `SMALL_GLYPHS` | `processed natural Shell family → matching Small Glyph family targetable` |
| `LARGE_GLYPHS` | `extracted natural Small Glyph essence → matching Large Glyph family targetable` |
| `RUNESTONES` | `tunedRuneFamilies → matching Rune Stone family targetable` |

Natural Shells therefore permit immediate sandbox experimentation after ownership. Large Glyph family knowledge is independent from portfolio crystal availability.

## Small Glyph physical/domain readiness

**CURRENT / IMPLEMENTED (S2):** Small Glyph visuals participate in the first world reveal independently of physical gameplay. Astrolabium production `EARNED` is projected into `fieldReady`; on that transition passive canonical glyphs become `FIELD`. Processed natural Shell families independently determine matching family targetability.

Point `4.30` owns only its authored presentation lifecycle and completion event. It neither creates `FIELD` permission nor rewrites transient glyph state. The runtime separation is:

```text
Small Glyph world presentation
≠ fieldReady (Astrolabium EARNED projection)
≠ family targetability (processed Shell families)
≠ 4.30 authored presentation completion
```

This is not permission to treat `HIDDEN` as `FIELD`. The implementation must establish a clean physical/domain readiness boundary and preserve `FIELD`, `PULLING`, `CAPTURE_READY`, `HELD`, `PLACED`, `RETURNING`, `CONSUMED`, reset, hydration, and world-reveal presentation. Hybrid semantic states are forbidden.

## Furnace extraction

**CURRENT / IMPLEMENTED (S3):** natural Small Glyph essence extraction is a physical/domain operation when all are true:

- Astrolabium is physically `EARNED`;
- the player possesses a legal Small Glyph;
- Furnace physical interaction requirements are satisfied;
- `ProtoAstroTuningController.canExtractSmallGlyph()` returns true.

```text
Astrolabium EARNED
AND legal physical Furnace state
AND ProtoAstroTuningController.canExtractSmallGlyph(glyph)
→ natural Small Glyph essence extraction allowed
```

Scenario progression is not required, and `CAN_EXTRACT_SMALL_GLYPH_ESSENCE` is no longer a runtime extraction permission. `ProtoAstroTuningController` remains authoritative for whether the natural family was already extracted and for committing extracted-family truth.

## Large Glyph and portfolio separation

**KANON:** Large Glyph pull eligibility and portfolio crystal eligibility are separate.

```text
Fire Large Glyph known
+ current portfolio tier does not allow another Fire crystal
→ Astrolabium may still target and pull Fire Large Glyph
→ ordinary crystal acquisition produces no crystal
```

Astrolabium family knowledge must not create portfolio progress. Crystal creation remains owned by progression and `getNextCrystalTier()` truth.

For ordinary earlier stages:

```text
family knowledge → Astrolabium targetability
```

For `SPHERE_FAR`:

```text
family knowledge AND Resonator PULL_READY
→ Astrolabium targetability / pull
```

`PULL_READY` remains transient Resonator truth; it is not persistent Astrolabium family knowledge.

## Rune Stone targeting and installation

**KANON:** targetability and world installation readiness remain separate:

```text
Rune tuned → Rune Stone targetable / pullable

Rune Stone installation
→ separate platform installation readiness
→ correct Rune Bridge / Zwornik state
```

Thus this is valid sandbox behavior:

```text
Rune family tuned
→ Rune Stone targeted
→ Rune Stone pulled toward platform
→ no matching Zwornik / installation readiness
→ installation rejected / not started
```

Installation readiness must not become a prerequisite for targeting.

## Ownership boundary after migration

| Owner | Binding responsibility |
| --- | --- |
| Scenario | Authored beats, Monkey communication, narrative timing, world-presentation beats, authored transitions, observations and acknowledgements, and genuinely story-only permissions. |
| Physical/domain owners | Astrolabium ownership after `EARNED`, band existence, scan-beam availability, natural-family targetability and pull legality, Proto-Astro extracted essence truth, Rune tuning truth, Rune installation readiness, and Large Glyph/crystal separation. |

Scenario must not act as an indirect permission registry for ordinary sandbox Astrolabium actions.

## CURRENT Scenario capability debt

The following historical capability family belongs to migration review:

- `CAN_EQUIP_ASTRO`
- `CAN_SCAN_SHELLS`
- `CAN_TARGET_SHELLS`
- `CAN_SWITCH_ASTRO_BAND`
- `CAN_SCAN_SMALL_GLYPHS`
- `CAN_TARGET_SMALL_GLYPHS`
- `CAN_PULL_SMALL_GLYPHS`
- `CAN_SCAN_LARGE_GLYPHS`
- `CAN_TARGET_LARGE_GLYPHS`
- `CAN_PULL_LARGE_GLYPHS`
- `CAN_EXTRACT_SMALL_GLYPH_ESSENCE`

Their presence is **MIGRATION GAP**, not proof that each identifier currently has a runtime consumer. They are not removed by this documentation task. Implementation must first remove consumers and prove replacement ownership; only then may obsolete capabilities be removed. Narrative events remain.

## CURRENT known runtime gaps

1. **RESOLVED IN S1:** physical `EARNED`, rather than Scenario `CAN_EQUIP_ASTRO` or the intro QA bypass, owns Astrolabium equip and band switching.
2. **RESOLVED IN S1:** all four bands exist after ownership; `RUNESTONES` no longer requires a non-empty tuned-family set.
3. **RESOLVED IN S1:** every selected-band beam, including `SMALL_GLYPHS`, may display after ownership without requiring a legal target.
4. **RESOLVED IN S2:** Small Glyph physical gameplay uses the `fieldReady` projection from Astrolabium production `EARNED`, while candidates still require glyph `FIELD`, visibility, and family eligibility.
5. **RESOLVED IN S2:** Scenario point `4.30` records authored presentation completion only and does not establish physical `FIELD` permission.
6. **RESOLVED IN S3:** Furnace Small Glyph essence extraction requires physical Astrolabium ownership and Proto-Astro extraction legality instead of consuming `CAN_EXTRACT_SMALL_GLYPH_ESSENCE`.
7. Scenario still carries the historical Astro equip/scan/target/pull capability family.
8. Large Glyph family targetability is already primarily domain-owned through Proto-Astro tuning and must not regress.
9. Rune Stone targetability and installation readiness are already separate domain laws and must not regress.

## Ordered implementation plan

### MIGRATION S1 — PHYSICAL TOOL OWNERSHIP

**Goal:** move equip and band availability from Scenario permission to physical `EARNED` ownership.

```text
EARNED → equip → all four bands → all four scan beams usable
```

Remove the runtime `CAN_EQUIP_ASTRO` dependency, always return all four bands after physical ownership, and stop deriving `RUNESTONES` existence from a non-empty family set. **IMPLEMENTED:** scan-beam activation is independent from family targetability, while Small Glyph semantic field ownership remains unchanged for S2.

### MIGRATION S2 — SMALL GLYPH SANDBOX FIELD

**IMPLEMENTED.**

**Goal:** allow physically present Small Glyphs to participate after tool ownership instead of waiting for Scenario `4.30`. World reveal, physical field readiness, family targetability, transient state, and authored presentation completion are separate runtime facts. Scenario hydration restores presentation facts only; post-hydration synchronization projects production ownership into field readiness.

### MIGRATION S3 — DOMAIN-OWNED SMALL GLYPH EXTRACTION

**IMPLEMENTED.**

**Goal:** remove natural Small Glyph essence extraction dependency on `CAN_EXTRACT_SMALL_GLYPH_ESSENCE`. Gate extraction through physical Furnace state, Astrolabium ownership, and Proto-Astro domain truth.

### MIGRATION S4 — SCENARIO CAPABILITY CLEANUP

**NOT IMPLEMENTED.**

**Goal:** after consumers migrate, audit and remove obsolete Astro equip/scan/target/pull/extraction capabilities. Do not remove narrative events or capabilities genuinely consumed by unrelated systems.

### MIGRATION S5 — CANON / RUNTIME SYNC

**NOT IMPLEMENTED.**

**Goal:** perform the final static ownership audit:

```text
Scenario = dramaturgy
Astrolabium EARNED = physical ownership
AstrolabiumTuningActor = family targeting knowledge
ProtoAstroTuningController = extracted Large Glyph knowledge
RuneStoneProgressionController = Rune tuning truth
ProgressionController = portfolio crystal truth
RuneInstallationReadinessProjection = installation truth
Resonator Target Acquisition = late PULL_READY truth
```

No alternate gameplay eligibility owner may remain.

## Reference sandbox walkthrough — Fire

```text
Player claims Astrolabium from Furnace
→ all four bands are immediately selectable

select SHELLS
→ Fire Shell can be scanned and pulled

process Fire Shell in Furnace
→ Fire Small Glyph family becomes targetable

select SMALL_GLYPHS
→ Fire Small Glyph can be scanned and pulled

extract Fire Small Glyph essence
→ Fire Large Glyph family becomes targetable

select LARGE_GLYPHS
→ Fire Large Glyph can be scanned and pulled

if portfolio progression currently allows Fire crystal
→ ordinary glyph interaction may create crystal

if portfolio progression does NOT allow Fire crystal
→ Large Glyph remains Astrolabium-pullable
→ no crystal is created

later complete the required Rune recipe
→ corresponding Rune Stone family becomes targetable

select RUNESTONES
→ Rune Stone can be scanned and pulled

if matching Zwornik / installation readiness is absent
→ Rune Stone cannot install

if matching Zwornik / readiness exists
→ normal installation choreography may begin
```

This illustrates ownership laws; it is not a mandatory linear player path.

## Non-goals and special families

This migration does not mean that all families or objects are immediately targetable/pullable; Rune Stones ignore tuning or Zworniki; Large Glyphs always produce crystals; `SPHERE_FAR` loses Resonator `PULL_READY`; Asterion Sphere or portfolio tier progression changes; Scenario or authored beats disappear.

**OUTSIDE THIS MIGRATION:** Ether `V` is not automatically included in the natural-family sandbox migration. Existing independent special Ether laws remain unchanged unless a later explicit contract changes them.
