# Architecture

## Current repository state
- Frontend runtime is active with first Three.js MVP scene.
- `vendor/three` remains the dependency source for Three.js runtime files.
- Overlay UX is HTML/CSS for text readability.

## Current runtime structure

```text
index.html
src/
  main.js
  vendor/
    three.js
  scene/
    createScene.js
    cameraRig.js
    lights.js
    centralObject.js
    orbitNodes.js
    particles.js
    raycaster.js
  ui/
    overlay.js
    hoverLabel.js
  content/
    portfolioNodes.js
  styles/
    main.css
vendor/
  three/
    three.module.js
    ...
```

## Architecture principles
- Keep scene logic modular under `scene/*`.
- Keep readable UI in HTML/CSS layers (`ui/*` + `styles/*`).
- Keep content payload separate from behavior (`content/*`).
- Keep vendored Three.js as current dependency source until a later decision changes it.
