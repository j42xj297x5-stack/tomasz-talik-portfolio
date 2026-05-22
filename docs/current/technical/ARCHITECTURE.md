# Architecture (Planned)

## Current repository state
- No `package.json` detected.
- No Vite runtime initialized yet.
- This file defines the planned structure for the first MVP implementation task.

## Proposed runtime structure

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

public/
  assets/
    models/
    textures/
    images/
    audio/
```

## Architecture principles
- Keep Three.js scene logic modular (`scene/*`).
- Keep readable UI as HTML/CSS overlays (`ui/*`, `styles/*`).
- Keep textual/content payload separate from scene logic (`content/*`).
- Delay final branding/copy decisions until after MVP usability checks.

## Out of scope in this phase
- Runtime code implementation.
- Package installation.
- Final model/art pipeline decisions.
