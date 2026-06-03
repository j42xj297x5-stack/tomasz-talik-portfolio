# Snapshot — Classic 2D MVP and floating glyph hotspots

Status: accepted documentation snapshot / current Classic 2D MVP evidence.
Date: 2026-06-03 17:29:26 UTC.

## Summary

Classic 2D is no longer a placeholder-only branch. It is now implemented as a lightweight flat portfolio experience that starts from the language/mode entry shell without booting the heavy Experience 3D runtime.

The current Classic 2D MVP presents:
- a central monkey PNG as the symbolic anchor,
- five floating portfolio glyph hotspots arranged around the monkey,
- flat PNG glyph sprites for each portfolio gate,
- click-to-open readable project panels sourced from the shared portfolio content records,
- a back flow to mode selection,
- keyboard-focusable button controls,
- reduced-motion-aware transition behavior where implemented.

The persistent rectangular card/tile look for glyph triggers has been removed or reduced. The current hotspot direction is symbolic and lightweight: transparent gate buttons, glyph imagery, soft halo/glow behavior, and readable text without visible ring/orbital outlines or rectangular borders in this pass.

Experience 3D remains unchanged and still boots conditionally only after selecting `Experience 3D` / `Doświadczenie 3D`.

## Files changed in the implementation stage

Implementation-stage files reflected by this snapshot:
- `src/main.js` — entry shell and mode routing now call Classic 2D for the `classic-2d` branch and dynamically import Experience 3D only for the 3D branch.
- `src/classic2d.js` — owns the lightweight Classic 2D flat portfolio runtime.
- `src/styles/main.css` — owns Classic 2D layout, floating glyph hotspot visual styling, hover/focus glow behavior, responsive behavior, and reduced-motion transition handling.
- `src/content/portfolioNodes.js` — remains the shared content source consumed by Classic 2D; content records were not duplicated for the 2D mode.

Documentation-only files changed by this snapshot task are listed in the final report of the task that created this file.

## Current Classic 2D behavior

Classic 2D currently behaves as follows:
1. The visitor selects a language in the entry shell.
2. The visitor selects `Classic 2D` / `Klasyczne 2D` from mode selection.
3. `src/main.js` calls the Classic 2D startup path rather than importing the 3D runtime.
4. `src/classic2d.js` renders the flat portfolio stage.
5. The stage shows the central monkey PNG with a fallback drawn in HTML/CSS if the PNG fails.
6. Five button-based glyph hotspots are generated from the shared `portfolioNodes` records.
7. Clicking a glyph marks it active, slightly tilts the monkey, and opens a readable project panel for the matching record.
8. Closing the panel clears active gate state and returns focus to the glyph circle.
9. The back button returns to mode selection.

Classic 2D is implemented with HTML, CSS, and vanilla JavaScript. It does not introduce Three.js into the flat 2D path.

## Shared content usage

Classic 2D consumes the existing `portfolioNodes` records from `src/content/portfolioNodes.js`.

Current shared portfolio gates:
1. `ai-guide` — AI Guide
2. `spotify-digger` — DIG Engine
3. `haiku-cosmos` — Haiku Cosmos
4. `creative-ai` — Creative AI
5. `ethics-life-protection` — Ethics / Life Protection

The Classic 2D glyph sprite mapping is UI/visual mapping only. It does not rename gate IDs, fork content records, or create a separate 2D content model.

## Flat asset mapping

Classic 2D uses logical browser/runtime public paths. These paths intentionally omit `public/`; runtime URL resolution remains base-aware through the existing public asset path model.

Central monkey:
- `/png/monkey_small.png`

Flat glyph sprites:
- AI Guide -> `/png/glif_ai_guide.png`
- DIG Engine -> `/png/glif_dig_engine.png`
- Haiku Cosmos -> `/png/glif_haiku_cosmos.png`
- Creative AI -> `/png/glif_creative_ai.png`
- Ethics / Life Protection -> `/png/glif_ethics.png`

## Hover/focus visual model

Current Classic 2D glyph hotspots use a lightweight symbolic hover/focus model:
- soft halo behind the glyph,
- subtle glyph glow,
- small glyph-only lift/scale where motion is allowed,
- slightly brighter text on hover/focus/active,
- transparent gate button background,
- no persistent rectangular tile/card border around each glyph,
- no ring or orbital outline effect in this pass.

This pass intentionally favors floating symbolic hotspots over durable cards or framed tiles.

## Text clarity / no-blur rule

Text clarity is part of the accepted Classic 2D hotspot polish baseline:
- do not scale the text layer during hover/focus,
- transform only the glyph and halo layers,
- allow text color and text-shadow changes for emphasis,
- keep gate labels crisp during hover/focus/active states.

This rule addresses the earlier hover blur issue caused by scaling text together with the hotspot.

## What was intentionally not implemented

This snapshot does not claim completion of final Classic 2D visual language.

Intentionally not implemented in this pass:
- ring/orbital outline hover effects,
- persistent rectangular cards/tiles for glyph triggers,
- a full retro-polish pass,
- final Classic 2D visual contract beyond this MVP snapshot,
- final PL/EN portfolio content model,
- rewritten portfolio content,
- Three.js usage in Classic 2D,
- changes to Experience 3D behavior.

## Validation / build notes

Checks run during this documentation snapshot task:
- `git diff --check -- docs/current/audits/snapshots/2026-06-03_17-29-26__snapshot__classic-2d-floating-glyph-hotspots.md docs/current/maps/PROJECT_INDEX.md docs/current/technical/ENTRY_FLOW_AND_MODES_MODEL.md docs/current/technical/FRONTEND_RUNTIME_MODEL.md docs/current/technical/CONTENT_MODEL.md docs/current/maps/DEPENDENCY_MAP.md docs/current/decisions/DECISION_LOG.md` passed.
- `npm run build` passed. Vite reported the existing large `experience3d` chunk warning after minification; this was not introduced by documentation changes. Generated `dist/` output was restored/removed because this is a documentation-only task.

Available implementation evidence from inspected runtime files:
- `src/main.js` routes mode selection to Classic 2D or conditional Experience 3D boot.
- `src/classic2d.js` imports shared `portfolioNodes`, maps five glyph sprites, uses `/png/monkey_small.png`, renders gate buttons, opens panels, and supports a mode-selection back flow.
- `src/styles/main.css` contains the Classic 2D layout, transparent glyph hotspot button styling, halo/glow hover/focus behavior, text-only color/shadow changes, responsive rules, and reduced-motion transition suppression.
- `src/content/portfolioNodes.js` remains the shared source for the five portfolio gate records.

No runtime source, CSS, assets, Vite config, package files, or portfolio content were changed by this documentation snapshot task.

## Risks / known limitations

- Classic 2D is now functional, but final visual language is still future work.
- Text is currently sourced from draft shared content records; final bilingual PL/EN content remains future work.
- The flat glyph sprite files are manual public assets and remain subject to filename/case-sensitivity risks in deployed environments.
- The central monkey PNG has an HTML/CSS fallback, but the intended visual depends on `/png/monkey_small.png` being present and correctly deployed.
- Future polish could accidentally reintroduce text blur if transforms are applied to `.classic-2d-gate__text` or parent layers that affect text rasterization.
- Future polish could accidentally reintroduce heavy tile/card visuals unless this snapshot and the decision log are treated as baseline constraints.

## Suggested next steps

1. Preserve the current shared-content contract when extending Classic 2D.
2. Define a dedicated Classic 2D visual contract before adding larger retro-polish effects.
3. Keep ring/orbital outline effects deferred unless a later explicit decision accepts them.
4. Continue testing keyboard focus, panel close/back flow, responsive layout, and reduced-motion behavior.
5. Plan the full PL/EN content model separately from visual/runtime polish.
6. Keep Experience 3D behavior isolated from Classic 2D changes unless an explicit dual-mode integration task requires shared runtime changes.
