# Architecture

## Current repository state
- Central model loader is isolated in `src/scene/monkeyModel.js` and invoked from `src/main.js` after placeholder creation.
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
    monkeyModel.js
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

- Vendored Three.js baseline is `r184`; GLTFLoader must also be sourced from `r184` only.
- Required loader file path: `vendor/three/examples/jsm/loaders/GLTFLoader.js`.
- Runtime monkey asset URL: `/glb/monkey.glb` (local file: `public/glb/monkey.glb`, manually managed binary).
- Placeholder fallback is mandatory when loader or GLB is unavailable.
- npm `three` dependency remains intentionally unused in runtime integration.

- GLTFLoader r184 is vendored at `vendor/three/examples/jsm/loaders/GLTFLoader.js`.
- Required GLTFLoader utilities are vendored at `vendor/three/examples/jsm/utils/BufferGeometryUtils.js` and `vendor/three/examples/jsm/utils/SkeletonUtils.js`.
- Vite resolve alias maps bare `three` imports to local vendored module `vendor/three/three.module.js` via `vite.config.js`.
- `src/scene/cameraRig.js` now owns pointer-normalization, yaw/pitch targeting, easing, and orbit-position solving around the monkey pivot without OrbitControls.
- `src/main.js` forwards pointer movement to the camera rig while preserving existing node raycast hover/click event flow.
- Idle drift behavior is retained as a low-amplitude secondary signal to avoid static framing while preventing seasick motion.
