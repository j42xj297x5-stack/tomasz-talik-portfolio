# Architecture

## Current repository structure

```text
src/
  main.js                 # entry shell and conditional mode boot
  experience3d.js         # Experience 3D orchestration and animation loop
  classic2d.js             # independent lightweight mode
  content/portfolioNodes.js
  assets/assetManifest.js
  scene/
    cameraRig.js
    orbitNodes.js
    plaqueTransition.js
    monkeyModel.js
    ...atmosphere and scene modules
  ui/overlay.js
  styles/main.css
vendor/three/
```

## Boundaries

- Content records remain separate from runtime behavior. `portfolioNodes` supplies glyph, plaque, glow, and overlay metadata to both presentation modes where relevant.
- `assetManifest` turns node plaque metadata into deferred preload records; it does not duplicate plaque paths by hand.
- Scene modules keep rendering and interaction mechanics modular. `experience3d.js` coordinates their guarded state machine rather than embedding plaque/camera internals.
- `cameraRig` owns canonical camera pose changes. `plaqueTransition` owns model cloning, cross-fade, materials, glow and reset. `orbitNodes` owns collider-preserving glyph visuals, orbit, and the common hover/transition light.
- HTML/CSS overlays retain readable project content; Three.js models remain scene presentation.

## Interaction model

Every one of the five glyphs uses the same architecture: click locks interaction and pauses orbit; `cameraRig` focuses the node; `plaqueTransition` reveals its cached per-node plaque; the camera dollies in; then `overlay` opens. Close reverses the dolly and plaque reveal, returns the camera, resumes orbit, and hands cursor control back smoothly.

This model has one active transition but not one shared plaque instance: plaque wrappers are cached independently per node. The active hover response is common scale/light only; no tree, fire, sparks, or ember sphere belongs to the active runtime.

## Platform foundations

Vendored Three.js r184 and its matching GLTFLoader are the runtime source of truth. `publicPath(...)` preserves local Vite and GitHub Pages asset resolution. Monkey/glyph visual fallbacks and sphere raycast colliders are retained as runtime safety behavior.
