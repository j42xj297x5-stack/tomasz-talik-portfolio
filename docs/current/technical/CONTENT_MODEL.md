# Content Model

Current active content modules are mode-specific: `src/content/portfolioNodes.js` supplies Classic 2D and Experience 3D, while `src/content/portalCards.js` supplies Experience VR crystal-card content.

## Portal card registry contract

- `src/content/portalCards.js` is the canonical content registry for the 18 bilingual portal cards across five glyph branches.
- Every card has semantic, order-independent `id` and `crystalId` values. The separate `order` and `starter` fields prepare the records for a future progression model without defining or activating that progression now.
- Each Polish and English translation includes `crystalLabel`, reserved for later dynamic labeling of crystal models.
- The 18-card registry is the active source of localized crystal-card content for Experience VR.
- `src/content/experienceVrPages.js` adapts those semantic records to runtime page and existing crystal-asset metadata; it does not own duplicate copy.
- Resolved VR pages expose `crystalLabel` for a later visual-labeling stage, but the label is not rendered on the crystal model yet.

Each gate node contains:
- `id`
- `title`
- `shortLabel`
- Base metadata such as IDs, visual assets, plaque configuration, and model paths remains shared at record level.
- Required `translations.pl` and `translations.en` content objects provide complete localized panel content while retaining the base record's shared metadata.
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
- All five records now use the complete shared PL/EN content model; Classic 2D continues to consume the same resolver output as Experience 3D.

## Haiku Cosmos content checkpoint (2026-07-24)

- Haiku Cosmos has complete localized main-panel and case-study content in `translations.pl` and `translations.en` within `src/content/portfolioNodes.js`.
- Classic 2D and Experience 3D consume the same resolved record; content is not duplicated between modes.
- The shared record retains the project links for the public demo and repository. Experience 3D renders them before the case study, while Classic 2D retains its existing interface.


## Complete shared PL/EN content model for dual modes

Status: implemented. The active source remains `src/content/portfolioNodes.js`, with `src/content/resolvePortfolioNodes.js` as the shared language resolver.

Current contract:
- All five portfolio records provide `translations.pl` and `translations.en`; no record uses Polish top-level content as a language fallback.
- `Classic 2D` and `Experience 3D` use one source and one resolver with the same stable record IDs; neither mode owns a duplicate translation.
- The resolver shallowly overlays a selected translation with `{ ...node, ...translation }`. Consequently, every localized nested object required by a panel, including `caseStudy`, must be complete and independent in both language variants.
- `Haiku Cosmos` (`haiku-cosmos`) has a localized main panel and a complete localized case study in both languages. Its shared GLB, GIF, plaque, ornament, links, and other runtime metadata remain at record level.
- `AI Guide`, `Creative AI`, and `Ethics / Life Protection` preserve multi-paragraph body copy in template literals so both panel implementations retain the same paragraph boundaries.
- `DIG Engine` localizes its main panel, full case study, and six-item gallery in both languages; its GLB, GIF, plaque, ornament, and other runtime metadata remain shared at record level.
- The five portfolio gates remain the conceptual mapping: AI Guide; DIG Engine / Spotify Digger; Haiku Cosmos; Creative AI; and Ethics / Life Protection.
- Runtime IDs must not be renamed unless a separate migration task is created.

Shared rule: content records remain the single source of truth for both `Classic 2D` panels and `Experience 3D` overlay panels.

## Unified Experience 3D ornament checkpoint (2026-07-20)
- Each of the five portfolio records retains its `ornamentPath` for the Experience 3D overlay.
- Ornaments are viewport-independent overlay metadata; `ornamentMobileOnly` has been removed.
- The content/runtime gate still maps to the same stable `data-panel-theme` values, while Classic 2D continues to consume the shared records without adopting Experience 3D overlay styling.

## Current Haiku Cosmos and conditional-detail contract

- The `haiku-cosmos` record retains shared runtime metadata for `projectLinks`, demo GIF path (`demoGifPath`), and `ornamentPath`; its localized `demoGifAlt`, project-link labels, main panel, and complete case-study objects reside in each PL/EN translation.
- `src/ui/overlay.js` resets and conditionally renders demo media, project links, case-study blocks, and ornament data for the selected record. Missing optional fields leave the relevant element hidden or empty, so a prior panel's GIF, links, or case-study state cannot leak into another panel.
- External project links are validated as absolute HTTP(S) URLs; demo, ornaments, and gallery media use `publicPath(...)` where they are public assets.
