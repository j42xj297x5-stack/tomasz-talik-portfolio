# Architecture

## Current repository state
- Frontend scaffold initialized with Vite-compatible layout.
- Runtime entrypoints now exist: `index.html`, `src/main.js`, `src/styles/main.css`.
- `vendor/three` remains the source of Three.js runtime files.

## Current runtime structure

```text
index.html
src/
  main.js
  styles/
    main.css
vendor/
  three/
    three.module.js
    ...
```

## Planned near-term runtime structure

```text
src/
  main.js
  scene/
    createScene.js
    cameraRig.js
    lights.js
    particles.js
    monkey.js
    nodes.js
  ui/
    overlay.js
    panels.js
    navigation.js
  content/
    portfolioNodes.js
    draftTexts.js
  styles/
    main.css
```

## Architecture principles
- Keep Three.js scene logic modular (`scene/*`).
- Keep readable UI as HTML/CSS overlays (`ui/*`, `styles/*`).
- Keep textual/content payload separate from scene logic (`content/*`).
- Keep vendored Three.js as the current dependency source until an explicit decision changes it.
