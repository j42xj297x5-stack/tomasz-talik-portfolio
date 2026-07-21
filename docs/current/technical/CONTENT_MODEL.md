# Content Model

Current active content module: `src/content/portfolioNodes.js`.

Each gate node contains:
- `id`
- `title`
- `shortLabel`
- `draftText`
- Optional visual model metadata (`modelPath`, `modelKind`) for per-node GLB visuals.
- Optional `projectLinks` array for Experience 3D overlay links. Each valid entry contains `kind`, `label`, and an absolute `http` or `https` `url`; the overlay renders these as safe external links and does not pass their URLs through the public-path helper.

Current draft gates:
1. AI Guide
2. DIG Engine
3. Haiku Cosmos
4. Creative AI
5. Ethics / Life Protection

Rules in current MVP:
- Content is intentionally draft and non-final.
- Scene and UI read node metadata directly from the content module.
- Overlay displays draft status note: "Draft content — final copy pending".
- `AI Guide` declares a glyph visual model at runtime path `/glb/glyph_1.glb` (expected local binary: `public/glb/glyph_1.glb`).
- `DIG Engine` now declares a glyph visual model at runtime path `/glb/glyph_4.glb` (expected local binary: `public/glb/glyph_4.glb`).
- `Creative AI` now declares a glyph visual model at runtime path `/glb/glyph_2.glb` (expected local binary: `public/glb/glyph_2.glb`).
- `Ethics / Life Protection` now declares a glyph visual model at runtime path `/glb/glyph_3.glb` (expected local binary: `public/glb/glyph_3.glb`).
- `Ethics / Life Protection` may be referenced internally as `AI Dharma`, while user-facing copy remains unchanged.
- `Haiku Cosmos` now declares a glyph visual model at runtime path `/glb/glyph_5.glb` (expected local binary: `public/glb/glyph_5.glb`).
- All five portfolio nodes now declare GLB glyph visuals while retaining sphere collider/fallback behavior.

## Milestone content mapping checkpoint
- All five portfolio nodes now declare GLB glyph visuals via `modelPath` metadata in `portfolioNodes`.
- Active runtime mapping: AI Guide -> `/glb/glyph_1.glb`, Creative AI -> `/glb/glyph_2.glb`, Ethics / Life Protection -> `/glb/glyph_3.glb`, DIG Engine -> `/glb/glyph_4.glb`, Haiku Cosmos -> `/glb/glyph_5.glb`.
- Mapping remains content-driven while renderer preserves sphere fallback/collider behavior for hover/click safety.

## Mobile panel theme mapping checkpoint (2026-06-02)
- Gate/content metadata remains the source of the active panel topic and runtime `gateId`.
- The overlay UI maps each `gateId` to a stable `data-panel-theme` value for CSS-owned mobile panel theming.
- In particular, the content/runtime gate `ethics-life-protection` maps to `data-panel-theme="ethics"` so mobile CSS can avoid conflicts between long-form gate IDs, legacy `theme-*` classes, and `.overlay__panel--ethics` selectors.


## Classic 2D usage checkpoint (2026-06-03)

- Classic 2D now consumes the current `portfolioNodes` records directly from `src/content/portfolioNodes.js`.
- Gate IDs remain stable across the flat Classic 2D MVP and the Experience 3D gate model.
- Text is not duplicated for 2D; Classic 2D panels derive their readable content from the existing shared record fields such as `leadText`, `bodyText`, `draftText`, `closingText`, and feature metadata where present.
- Flat glyph sprite mapping is a UI/visual mapping in `src/classic2d.js`, not a content rename and not a replacement for the GLB glyph metadata used by Experience 3D.
- Current Classic 2D flat sprite mapping: AI Guide -> `/png/glif_ai_guide.png`, DIG Engine -> `/png/glif_dig_engine.png`, Haiku Cosmos -> `/png/glif_haiku_cosmos.png`, Creative AI -> `/png/glif_creative_ai.png`, Ethics / Life Protection -> `/png/glif_ethics.png`.
- Browser/runtime asset paths must remain logical public paths such as `/png/glif_ai_guide.png`, not `public/png/glif_ai_guide.png`.
- Full PL/EN content modeling, final bilingual copy, and content-locking remain future work.

## Haiku Cosmos content checkpoint (2026-07-17)

- Polska treść Haiku Cosmos została zaktualizowana.
- Główny opis i pełne case study znajdują się w rekordzie `haiku-cosmos` w `src/content/portfolioNodes.js`.
- Classic 2D i Experience 3D konsumują ten sam rekord.
- Treść nie jest duplikowana pomiędzy trybami.
- Rekord `haiku-cosmos` deklaruje `projectLinks` dla publicznego demo i repozytorium; Experience 3D renderuje je przed case study, a Classic 2D nie zmienia swojego interfejsu.


## Planned shared PL/EN content model for dual modes

Status: planned / documentation-only. The current active source remains `src/content/portfolioNodes.js`.

Future direction:
- The content model should support bilingual PL/EN content in a structured model.
- `Classic 2D` and `Experience 3D` should consume the same gate IDs and the same content records.
- Text must not be duplicated separately across 2D and 3D implementations.
- The current five portfolio gates remain the conceptual mapping:
  1. AI Guide
  2. DIG Engine / Spotify Digger, preserving current legacy naming where applicable
  3. Haiku Cosmos
  4. Creative AI
  5. Ethics / Life Protection
- Runtime IDs must not be renamed unless a separate migration task is created.
- User-facing labels may evolve before final copy is locked.
- Current copy remains draft; final Polish and English text is not accepted yet.

Planned rule: content records should become the source of truth for both the future flat `Classic 2D` panels and the current `Experience 3D` overlay panels.

## Unified Experience 3D ornament checkpoint (2026-07-20)
- Each of the five portfolio records retains its `ornamentPath` for the Experience 3D overlay.
- Ornaments are viewport-independent overlay metadata; `ornamentMobileOnly` has been removed.
- The content/runtime gate still maps to the same stable `data-panel-theme` values, while Classic 2D continues to consume the shared records without adopting Experience 3D overlay styling.

## Current Haiku Cosmos and conditional-detail contract

- The `haiku-cosmos` record is the shared source for its full case study, `projectLinks`, demo GIF metadata (`demoGifPath` and `demoGifAlt`), and `ornamentPath`; neither presentation mode receives a separate content record.
- `src/ui/overlay.js` resets and conditionally renders demo media, project links, case-study blocks, and ornament data for the selected record. Missing optional fields leave the relevant element hidden or empty, so a prior panel's GIF, links, or case-study state cannot leak into another panel.
- External project links are validated as absolute HTTP(S) URLs; demo, ornaments, and gallery media use `publicPath(...)` where they are public assets.
