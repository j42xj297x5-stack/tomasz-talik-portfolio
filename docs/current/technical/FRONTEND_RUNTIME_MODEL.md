# Frontend Runtime Model

Current runtime: Vite + Vanilla JavaScript modules + vendored Three.js.

Layers:
1. Scene layer (`src/scene/*`) — renderer, camera drift, lighting, particles, central placeholder object, interactive orbit nodes.
2. Interaction bridge (`src/scene/raycaster.js`) — pointer raycast selection and hover/click targeting.
3. Overlay UI layer (`src/ui/*` + `src/styles/main.css`) — readable HTML hover label + overlay detail panel.
4. Content layer (`src/content/portfolioNodes.js`) — draft node content model.

## MVP runtime status (2026-05-22)
- Monkey runtime loader now successfully resolves `/glb/monkey.glb` locally and keeps placeholder fallback if GLTFLoader or asset loading fails.
- GLTFLoader import target is vendored: `vendor/three/examples/jsm/loaders/GLTFLoader.js` (if present).
- Three.js npm package remains intentionally unused.
- `index.html` mounts `src/main.js` via Vite.
- First interactive Three.js MVP scene is implemented.
- Three.js imports are centralized through `src/vendor/three.js`, which re-exports `vendor/three/three.module.js`.
- Overlay copy is intentionally draft-only.
- Mobile fallback notice is present; scene remains desktop-first.

## Deferred implementation
- Final meditating monkey GLB asset.
- Post-MVP snapshot pass and minor interaction polish.
- Final branded copy/content.

- Vendored Three.js baseline is `r184`; GLTFLoader must also be sourced from `r184` only.
- Required loader file path: `vendor/three/examples/jsm/loaders/GLTFLoader.js`.
- Runtime monkey asset URL: `/glb/monkey.glb` (local file: `public/glb/monkey.glb`, manually managed binary).
- Placeholder fallback is mandatory when loader or GLB is unavailable.
- npm `three` dependency remains intentionally unused in runtime integration.

- GLTFLoader r184 is vendored at `vendor/three/examples/jsm/loaders/GLTFLoader.js`.
- Required GLTFLoader utilities are vendored at `vendor/three/examples/jsm/utils/BufferGeometryUtils.js` and `vendor/three/examples/jsm/utils/SkeletonUtils.js`.
- Vite resolve alias maps bare `three` imports to local vendored module `vendor/three/three.module.js` via `vite.config.js`.
