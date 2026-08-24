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
→ 4.40 observation / guidance continuation
→ 4.50–4.70 mandatory P2 communication and Tier-3 rights
→ 4.80 stable implemented Tier-3 boundary
→ future Rune Stone Act → FIRST_RUNE_INSTALLED (TARGET / NOT IMPLEMENTED)
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

Future rune tuning does not replace this owner:

```text
sector progression completeness ─→ rune eligibility
canonical Proto-Astro resolvers ─→ Wu Xing recipe resolver
Small Glyph ─┐
             ├→ RuneRecipeInteraction (two typed slots) → one 18 s Furnace cycle
Shell ───────┘                                      └→ RuneStoneProgressionController.tunedRuneFamilies

tunedRuneFamilies → RUNESTONES band valid targets
Rune Stone actor + RuneBridgeActor → completed capture
                                   └→ RuneStoneProgressionController.installedRuneFamilies
```

`RuneStoneProgressionController` nie kopiuje paneli sektorów i nie należy do `ProtoAstroTuningController`. Rune Stones używają istniejącej warstwy `50–75 m`; Large Glyph pozostaje osobnym aktorem używającym istniejącego `SPHERE_FAR = 80 m`.

## Guidance projection

```text
Scenario capabilities + domain truth
→ Monkey knowledge resolver
→ Player Guide current task / tools
→ capability-gated B line
```

## Future seams

`LARGE_GLYPHS` family-gated target/pull jest **IMPLEMENTED**. Panele 2–4 pozostają future. `RUNESTONES`, rune recipe/bridge/transport i authored pointy po `4.80` są **TARGET / NOT IMPLEMENTED**; VI/Eter finale jest **RESERVED / NOT YET DESIGNED**. Fizyczna możliwość stage `SPHERE_FAR` istnieje w Large Glyph actorze, lecz post-Tier-3 przejście i jego prezentacja są **NOT AUTHORED / NOT IMPLEMENTED**.
