# Content Model

Current active content module: `src/content/portfolioNodes.js`.

Each gate node contains:
- `id`
- `title`
- `shortLabel`
- `draftText`
- Optional visual model metadata (`modelPath`, `modelKind`) for per-node GLB visuals.

Current draft gates:
1. AI Guide
2. Spotify Digger
3. Haiku Cosmos
4. Creative AI
5. Ethics / Life Protection

Rules in current MVP:
- Content is intentionally draft and non-final.
- Scene and UI read node metadata directly from the content module.
- Overlay displays draft status note: "Draft content — final copy pending".
- `AI Guide` now declares a glyph visual model at runtime path `/glb/glyph_1.glb` (expected local binary: `public/glb/glyph_1.glb`), while other nodes remain sphere-only placeholders.
