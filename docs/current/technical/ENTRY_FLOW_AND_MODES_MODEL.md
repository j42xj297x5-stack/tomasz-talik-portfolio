# Entry Flow and Modes Model

## Current contract

The lightweight entry shell in `src/main.js` first selects language and then mode. It routes `Classic 2D` directly to `src/classic2d.js`; it dynamically imports `src/experience3d.js` only after the visitor selects `Experience 3D`. The two modes share `src/content/portfolioNodes.js` and stable gate IDs, rather than separate 2D records. On the mode-selection screen, the return-to-language button intentionally uses the language opposite the active selection and declares that visible language with its `lang` attribute.

## Classic 2D

Classic 2D is implemented—not a placeholder or a future MVP. It is a lightweight HTML/CSS/vanilla-JS portfolio experience with a readable hero and a clear footer CTA returning to mode selection.

- On desktop, the scene is square and scales to the available shorter dimension.
- The central monkey PNG is optically corrected in the centre.
- Five glyphs sit at the points of a regular pentagon; their text labels face the outside of the scene.
- On mobile, the monkey moves to the top and the glyphs become a vertical list.
- A glyph opens a full-screen, scrollable panel with a clipping viewport; the panel reads from the same content record as Experience 3D.
- The panels include the available structured project content, including a demo, links, and case-study material when the selected record supplies it.

## Experience 3D

Experience 3D preserves the Three.js scene, conditional boot and readable HTML/CSS overlay. Its full-screen panels use opaque CSS gradients keyed by `data-panel-theme`, responsive `ornamentPath` artwork, and internal scrolling; they do not use an SVG frame. Opening a panel pauses fine-pointer camera steering. Closing it smoothly hands the camera to the latest cursor position over 1500 ms.

## Remaining work

Only actual unfinished direction remains: a fully structured PL/EN content-record model, final bilingual copy, accessibility/performance verification, and optional further visual polish. No planned work should treat Classic 2D as unbuilt or reintroduce separate content records.

## Constraints

Maintain the conditional Experience 3D boot, GitHub Pages-compatible `publicPath(...)` contract, stable runtime IDs, shared content source, keyboard-readable entry controls, and reduced-motion support. This model does not prescribe a framework change, asset deletion, or a return to SVG-framed panels.
