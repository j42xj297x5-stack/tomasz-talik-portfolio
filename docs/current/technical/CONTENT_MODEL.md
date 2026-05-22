# Content Model

Current active content module: `src/content/portfolioNodes.js`.

Each gate node contains:
- `id`
- `title`
- `shortLabel`
- `draftText`

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
