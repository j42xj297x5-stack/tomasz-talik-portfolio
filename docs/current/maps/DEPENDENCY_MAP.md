# Dependency Map

## Documentation flow

`PROJECT_INDEX → canonical task model → DEPENDENCY_MAP / DECISION_LOG`. Proto-Astro/small-glyph/bands/tuning zaczyna się w [`VR_PROTO_ASTRO_MODEL.md`](../technical/VR_PROTO_ASTRO_MODEL.md), a potem przechodzi do Runtime, Scenario albo communication docs zależnie od zadania.

## Experience VR composition

```text
experienceVr composition root
→ Scenario → Director → RuntimeExperience
→ effect handlers / semantic callbacks
→ actors and single domain owners
```

Nie istnieje centralny global gameplay store.

## Authored progression

```text
3.80 Astro EARNED + shell/Furnace/Asterion loop
→ 4.10 second Glyph → Crystal → Reliquary
→ TIER_COMPLETED / Tier 2 complete
→ 4.20 radial presentation
→ P2_RADIAL_PRESENTATION_COMPLETED
→ 4.30 small glyph materialization
→ SMALL_GLYPH_FIELD_PRESENTATION_COMPLETED
→ 4.40 stable P2 Proto-Astro boundary (no transition)
→ 100.10 canonicalMainline target / story terminal, no auto-advance
```

## Proto-Astro and small glyph dependencies

```text
smallGlyphSystem
→ smallGlyphAttractorInteraction
→ Furnace content interaction

protoAstroRegistry
→ small-glyph resolver
→ ProtoAstroTuningController
← large-glyph/page resolver

Scenario capabilities
→ LargeGlyphAttractorInteraction
→ ProtoAstroTuningController family gate
→ LargeGlyphActor transient ownership

Scenario settledConsequences
→ largeGlyphs.stage
→ LargeGlyphActor hydration
```

`smallGlyphSystem` owns field geometry; interaction owns transient transport; TuningController alone owns extracted natural family truth.

## Furnace content boundary

```text
SHELL ───────┐
             ├→ one createVrAstroFurnaceContentInteraction chamber owner
SMALL_GLYPH ─┘
```

`floor_gyroscope_sphere` routes shells to Asterion progression. `astro_attractor` routes natural small glyphs to essence extraction and TuningController, then restores the physical glyph to field.

## Guidance projection

```text
Scenario capabilities + domain truth
→ Monkey knowledge resolver
→ Player Guide current task / tools
→ capability-gated B line
```

## Future seams

`LARGE_GLYPHS` family-gated target/pull jest **IMPLEMENTED**. Panele 2–4 i later P2 authoring pozostają future. `RUNESTONES` remains future; VI/Eter finale is **RESERVED / NOT YET DESIGNED**; `SPHERE_FAR` is **FUTURE / NOT AUTHORED / NOT IMPLEMENTED**.
