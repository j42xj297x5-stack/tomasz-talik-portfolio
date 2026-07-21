# Snapshot — unified Experience 3D glyph panels

Date: 2026-07-20

> **Historical intermediate state:** This snapshot records a prior SVG-frame implementation. It is evidence only and is superseded as the active baseline by `2026-07-21_00-00-00__snapshot__current-dual-mode-panels-and-camera.md`.

## Recorded state

- The five Experience 3D glyph panels share one full-viewport CSS layout on desktop and mobile: `calc(100vw - 20px)` wide and `calc(100dvh - 20px)` high, with a preceding `100vh` fallback.
- Panel copy is horizontally centred, is constrained to `1200px`, retains safe frame/ornament clearance, and scrolls inside the panel.
- The existing resize-aware eight-piece SVG frame loader and geometry solver are used at every viewport; corner SVGs remain undeformed, lines stretch only on their intended axis, and frame overflow remains visible.
- Each content record supplies its existing `ornamentPath`; ornaments render above the SVG frame and below content on desktop and mobile.
- Opaque CSS theme gradients remain keyed by `data-panel-theme` for `ai-guide`, `creative-ai`, `ethics`, `spotify-digger`, and `haiku-cosmos`, so readability does not depend on the Three.js scene.
- The legacy vertical panel PNGs (`ai_guide.png`, `creative_ai.png`, `ai_ethics.png`, `digger.png`, `haiku_cosmos.png`) are no longer runtime or critical-preload dependencies. Their physical public files remain untouched.
- This replaces the historical desktop/mobile panel split recorded by the earlier mobile-glyph-panel snapshot.
