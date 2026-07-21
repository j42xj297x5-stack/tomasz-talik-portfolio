# Frontend Runtime Model

## Current runtime

The application uses Vite, vanilla JavaScript and vendored Three.js. `src/main.js` owns the entry shell: language and mode selection, small persisted selection state, Classic 2D routing, and the conditional dynamic import of Experience 3D. It does not own the Experience 3D renderer or animation loop.

`src/experience3d.js` owns the Experience 3D canvas shell, renderer, scene wiring, loading and asset-preload stages, camera/input, overlays, debug tooling, and animation loop. Experience 3D starts only after its explicit mode selection. Public runtime paths use `publicPath(...)` for local Vite and GitHub Pages compatibility.

## Classic 2D

`src/classic2d.js` is an implemented, polished lightweight portfolio path. It uses the shared `portfolioNodes` records, the central monkey PNG and five glyph sprites. On desktop its square scene scales to the available shorter dimension; the monkey is centred with an optical correction and the five glyph controls form a regular pentagon with labels facing outward. On mobile the monkey is at the top and the glyphs become a vertical list. Its readable, internally scrolling panels, hero hierarchy and footer return CTA are CSS/HTML owned. Classic 2D remains separate from Three.js and does not duplicate portfolio content.

## Experience 3D panels

Experience 3D uses one shared, full-viewport overlay contract on desktop and mobile. `src/ui/overlay.js` derives panel content from `portfolioNodes`, applies `data-panel-theme`, resolves `ornamentPath` through `publicPath(...)`, and renders an opaque CSS gradient panel with an internal scrolling content region and clipping viewport. Responsive ornaments sit in that CSS/HTML layer.

The SVG frame, its fetch, geometry and resize solvers, and frame diagnostics have been removed from runtime. Legacy vertical panel PNGs and `portfolio_frame_mobile_*` SVGs can remain in `public/` as historical files, but they are not runtime dependencies or preload inputs.

## Camera and interaction

When an Experience 3D panel opens, `experience3d.js` pauses fine-pointer camera control through `cameraRig.js`. The overlay close callback resumes toward the latest remembered fine-pointer position; the rig smoothsteps the handoff for 1500 ms before normal mouse damping resumes. Existing yaw and pitch limits and touch fallback behavior remain unchanged.

## Runtime safety

Vendored Three.js r184 and the matching GLTFLoader remain runtime sources of truth; npm `three` is intentionally not the runtime source. The monkey and glyph model paths retain fallbacks. Asset loading, diagnostics, and base-aware public paths remain part of the Experience 3D contract.
