# Three Scene Model

Current scene responsibilities:
- Central GLB loader module in `src/scene/monkeyModel.js` attempts to load `/glb/monkey.glb` via vendored GLTFLoader path (`vendor/three/examples/jsm/loaders/GLTFLoader.js`).
- Renderer + animation loop managed from `src/main.js`.
- Scene bootstrap in `src/scene/createScene.js` with dark background and fog.
- Soft lighting setup in `src/scene/lights.js`.
- Temporary central symbolic placeholder in `src/scene/centralObject.js`.
- Five interactive orbit nodes in `src/scene/orbitNodes.js`.
- Lightweight atmospheric particles in `src/scene/particles.js`.
- Raycast picking in `src/scene/raycaster.js`.
- Calm camera idle drift in `src/scene/cameraRig.js`.

Current status note:
- Central placeholder remains mandatory fallback and is hidden only after successful monkey GLB load.
- Monkey GLB binary is expected at `public/glb/monkey.glb` and is managed manually outside Codex PR flow.
- Central object is explicitly temporary and only represents the future meditating monkey model.
- Node interactions use HTML overlay and hover label for readability instead of in-scene text.
- Next scene step is visual refinement + eventual GLB monkey integration.

- Vendored Three.js baseline is `r184`; GLTFLoader must also be sourced from `r184` only.
- Required loader file path: `vendor/three/examples/jsm/loaders/GLTFLoader.js`.
- Runtime monkey asset URL: `/glb/monkey.glb` (local file: `public/glb/monkey.glb`, manually managed binary).
- Placeholder fallback is mandatory when loader or GLB is unavailable.
- npm `three` dependency remains intentionally unused in runtime integration.

- GLTFLoader r184 is vendored at `vendor/three/examples/jsm/loaders/GLTFLoader.js`.
- Required GLTFLoader utilities are vendored at `vendor/three/examples/jsm/utils/BufferGeometryUtils.js` and `vendor/three/examples/jsm/utils/SkeletonUtils.js`.
- Vite resolve alias maps bare `three` imports to local vendored module `vendor/three/three.module.js` via `vite.config.js`.
