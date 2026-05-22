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
- Camera interaction layer now combines raycast input with a mouse-driven orbital camera rig around the monkey pivot while keeping Vanilla JS modules.
- Orbit constants are explicit and configurable (`MAX_YAW_DEG = 45`, `MAX_PITCH_DEG = 30`) with damping-based smoothing.
- Camera always resolves position from orbit math and continuously `lookAt`s the monkey pivot.
- Mobile/touch behavior remains fallback-safe: no complex gesture controls added, neutral/idle drift remains available.

## Milestone status — monkey + five glyph runtime baseline
- Vite + Vanilla JS runtime baseline is stable locally with vendored Three.js r184 and vendored GLTFLoader r184.
- Vite alias continues resolving bare `three` imports to `vendor/three/three.module.js`; npm `three` remains unused.
- Monkey and all five node glyph assets are now integrated in runtime with fallback-safe behavior.
- Camera interaction model is mouse-driven orbital movement around monkey pivot with constrained yaw/pitch and no OrbitControls dependency.
- Milestone snapshot: `docs/current/audits/snapshots/2026-05-22_15-38-35__snapshot__monkey-five-glyphs-runtime-baseline.md`.


## Checkpoint update — glyph_1 tree hover baseline (2026-05-22)
- First glyph (`AI Guide`) now uses accepted hover-effect baseline based on `/glb/glyph_1-tree.glb` visual effect runtime (with fallback to `/glb/glyph_1.glb` for safe degradation).
- Hover lifecycle baseline is explicit: enter => reveal-in + glow-up, active => sustain + orbit light, leave/off-canvas => fade-out + cursor reset + clean re-entry readiness.
- Raycast/click contract is unchanged: only glyph node collider stays interactive; tree effect visuals (mesh/shader reveal helpers/light) are non-interactive.
- Technical snapshot reference: `docs/current/audits/snapshots/2026-05-22_18-18-33__snapshot__glyph-1-tree-effect-baseline.md`.
