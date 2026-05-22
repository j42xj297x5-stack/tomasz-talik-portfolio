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
- Monkey GLB now loads successfully in local runtime and hides the central placeholder only on successful load; placeholder fallback remains mandatory.
- Current visual tuning keeps the monkey centered, camera-facing, and slightly smaller for clean orbit separation.
- Orbit radius and light intensities were minimally increased to improve readability while preserving the calm dark atmosphere.
- Orbit node visuals now support optional per-node GLB attachments (AI Guide and Creative AI) while preserving the sphere mesh as the raycast/collider and visual fallback.
- Next scene step may be post-MVP snapshot capture or small interaction polish.

- Vendored Three.js baseline is `r184`; GLTFLoader must also be sourced from `r184` only.
- Required loader file path: `vendor/three/examples/jsm/loaders/GLTFLoader.js`.
- Runtime monkey asset URL: `/glb/monkey.glb` (local file: `public/glb/monkey.glb`, manually managed binary).
- Placeholder fallback is mandatory when loader or GLB is unavailable.
- npm `three` dependency remains intentionally unused in runtime integration.

- GLTFLoader r184 is vendored at `vendor/three/examples/jsm/loaders/GLTFLoader.js`.
- Required GLTFLoader utilities are vendored at `vendor/three/examples/jsm/utils/BufferGeometryUtils.js` and `vendor/three/examples/jsm/utils/SkeletonUtils.js`.
- Vite resolve alias maps bare `three` imports to local vendored module `vendor/three/three.module.js` via `vite.config.js`.
- Camera rig now uses mouse-driven orbital motion around a fixed monkey pivot (`0, 0.8, 0`) with smooth damping and continuous `lookAt` target lock.
- Horizontal orbit is clamped by named constant to ±45° (`MAX_YAW_DEG`).
- Vertical orbit uses named configurable limit (`MAX_PITCH_DEG`) currently set to 30° as a calmer default than the 45° upper bound.
- Subtle idle drift remains as a secondary additive influence when mouse input is present and as primary fallback when it is not.
- Desktop/fine-pointer devices get cursor-driven orbit; non-fine/touch pointer contexts keep neutral/idle behavior.
- AI Guide node can load `/glb/glyph_1.glb` as a visual override; if loader or asset fails, the original orbit sphere remains visible and interactive.
- Spotify Digger node can load `/glb/glyph_4.glb` as a visual override; if loader or asset fails, the original orbit sphere remains visible and interactive.
- Creative AI node can load `/glb/glyph_2.glb` with the same fallback behavior and collider/raycast preservation.
- Ethics / Life Protection node can load `/glb/glyph_3.glb` with the same fallback behavior and collider/raycast preservation (internal concept note: AI Dharma).
