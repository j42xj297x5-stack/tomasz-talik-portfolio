# Snapshot — current dual-mode panels and camera

Date: 2026-07-21

## Recorded state

- Classic 2D is a refined implemented path: a square responsive desktop composition, optically corrected central monkey, five-glyph pentagon with outward labels, mobile top-monkey/vertical-list layout, readable hero, and footer return CTA.
- Both modes consume the shared `portfolioNodes` records. Haiku Cosmos includes its full case study, responsive ornament, demo GIF, and conditionally rendered public demo/repository links.
- Experience 3D uses one opaque, full-screen CSS-gradient panel contract keyed by `data-panel-theme`, with a clipping viewport and internal scroll; it has no SVG frame.
- Ornaments use each record's `ornamentPath` and scale responsively inside the overlay layer.
- Closing an Experience 3D panel resumes fine-pointer camera control smoothly toward the last remembered cursor position over 1500 ms.
- Legacy vertical panel PNGs and `portfolio_frame_mobile_*` SVG files may remain in `public/` solely as inactive historical assets; they are not runtime or preload dependencies.
