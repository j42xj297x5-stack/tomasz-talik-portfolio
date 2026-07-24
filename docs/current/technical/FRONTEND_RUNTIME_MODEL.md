# Frontend Runtime Model

## Runtime ownership

The application uses Vite, vanilla JavaScript, and vendored Three.js. `src/main.js` owns language/mode selection and conditionally imports Experience 3D. `src/experience3d.js` then owns the canvas shell, renderer, scene wiring, staged asset loading, input, overlay coordination, and animation loop. Public runtime paths use `publicPath(...)` for local Vite and GitHub Pages compatibility.

Classic 2D remains a separate lightweight runtime in `src/classic2d.js`; it consumes the same `portfolioNodes` records without loading Three.js.

## Experience 3D project opening

The Experience 3D project detail flow is a single serialized interaction. Selecting a glyph blocks new interaction and pauses its orbit. The runtime focuses the camera on that node, reveals the configured plaque, holds, and performs a safe dolly-in. The HTML/CSS overlay opens only after that sequence completes.

Closing the overlay keeps the selected node context long enough to dolly out, perform the reverse plaque reveal, return the camera home, resume orbit, unlock interaction, and smoothly hand the camera to the latest remembered fine-pointer target. Fine-pointer handoff takes 1500 ms. Coarse-pointer and reduced-motion contexts use shortened transition timings while preserving the same ordering.

If an individual plaque cannot load, the same node's HTML/CSS overlay opens through an isolated fallback; the failure does not block other nodes.

## Overlay and content boundary

`src/ui/overlay.js` derives project detail from `portfolioNodes`, applies `data-panel-theme`, resolves `ornamentPath` through `publicPath(...)`, and renders an opaque, responsive CSS/HTML panel with internal scrolling. Plaque models are transitional 3D presentation, not a replacement for readable panel content. Generic panel chrome for both Experience 3D and Classic 2D is resolved from `src/i18n/interfaceCopy.js`; it is independent of portfolio-record translations.

The removed SVG-frame runtime, its fetch/geometry/resize solvers, and legacy vertical panel assets are not active dependencies.

## Asset and rendering safety

`src/assets/assetManifest.js` derives five plaque GLB entries from `portfolioNodes` into the `deferredWarm` stage. `src/scene/plaqueTransition.js` caches a cloned plaque wrapper per node and ensures only one transition is active. Glyph and monkey model fallbacks remain mandatory. Vendored Three.js r184 with matching GLTFLoader remains the runtime source of truth; npm `three` is intentionally not the runtime source.
