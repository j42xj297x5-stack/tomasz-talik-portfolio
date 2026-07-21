# Three Scene Model

Current scene responsibilities:
- Central GLB loader module in `src/scene/monkeyModel.js` attempts to load `/glb/monkey.glb` via vendored GLTFLoader path (`vendor/three/examples/jsm/loaders/GLTFLoader.js`).
- Renderer + animation loop managed from `src/experience3d.js`.
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
- Orbit node visuals now support optional per-node GLB attachments for all five nodes while preserving the sphere mesh as the raycast/collider and visual fallback.
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
- Opening a project overlay pauses fine-pointer camera targeting at its current direction. Pointer movement over the overlay is remembered without steering the camera; when any overlay close path completes, the rig smoothsteps to the latest cursor target over 1500 ms, updating that endpoint during the transition before returning to normal mouse damping.
- AI Guide node can load `/glb/glyph_1.glb` as a visual override; if loader or asset fails, the original orbit sphere remains visible and interactive.
- DIG Engine node can load `/glb/glyph_4.glb` as a visual override; if loader or asset fails, the original orbit sphere remains visible and interactive.
- Creative AI node can load `/glb/glyph_2.glb` with the same fallback behavior and collider/raycast preservation.
- Ethics / Life Protection node can load `/glb/glyph_3.glb` with the same fallback behavior and collider/raycast preservation (internal concept note: AI Dharma).
- Haiku Cosmos node can load `/glb/glyph_5.glb` with the same fallback behavior and collider/raycast preservation.

## Milestone checkpoint — central monkey + five glyph orbit nodes
- First complete symbolic scene baseline is reached: central monkey + five GLB glyph orbit nodes.
- Monkey runtime asset: `/glb/monkey.glb` (source `public/glb/monkey.glb`).
- Node glyph runtime assets: `/glb/glyph_1.glb` through `/glb/glyph_5.glb` mapped from content metadata.
- Mouse-driven camera orbit remains pivot-locked to monkey center without OrbitControls.
- Hover labels, overlays, and sphere collider fallback behavior remain active.
- Full checkpoint snapshot recorded at `docs/current/audits/snapshots/2026-05-22_15-38-35__snapshot__monkey-five-glyphs-runtime-baseline.md`.


## Checkpoint update — AI Guide tree effect in scene runtime (2026-05-22)
- Scene runtime for node `ai-guide` includes dedicated tree effect model `/glb/glyph_1-tree.glb` plus safe fallback `/glb/glyph_1.glb`.
- Tree effect is reveal-mask/shader based (visual growth), not runtime boolean/CSG geometry synthesis.
- Lighting baseline for this effect is green emissive + orbiting green point light that persists while hover/active remains true.
- Interaction safety remains mandatory: tree model/lights/helpers do not become raycast targets; collider ownership remains on node sphere/glyph node.
- Full checkpoint details and parameter list are recorded in `docs/current/audits/snapshots/2026-05-22_18-18-33__snapshot__glyph-1-tree-effect-baseline.md`.

## Checkpoint update — distant galaxy sprite layer (2026-05-29)
- `src/scene/galaxySprites.js` owns the distant galaxy sprite layer as an isolated, visual-only `THREE.Group`; it is added by `src/experience3d.js` after the scene, sun, and moon setup and is updated from the main animation loop.
- The layer uses `THREE.Sprite` + `THREE.SpriteMaterial`, so each transparent PNG sprite billboards toward the camera while retaining a per-material center spin via `SpriteMaterial.rotation`.
- Galaxy sprites are not included in raycaster target lists and carry `userData.nonInteractive = true`; they must remain background atmosphere only and must not replace HTML overlay/hover interactions.
- Instance generation is deterministic through `galaxySprites.randomSeed`, bounded by `totalMax`, and rejects the protected central reading cone so the monkey and five primary glyphs stay readable.
- Motion is deliberately slow: each instance has independent radius, orbit angle, direction, speed, inclination, vertical offset, eccentricity, opacity variance, scale, and spin speed.
- Reduced-motion users keep the layer visible, but orbit and spin speed are multiplied by `reducedMotionSpeedMultiplier` rather than removed.

## Current renderer, loop and panel-camera contract

- `src/experience3d.js` owns the Experience 3D renderer and its `requestAnimationFrame` animation loop; `src/main.js` only selects and launches the mode.
- The camera remains pivoted on the monkey with the existing yaw/pitch limits and touch fallback behavior.
- Opening an overlay pauses fine-pointer steering at the current camera direction. Pointer movement is remembered while the panel is open. On close, `experience3d.js` calls `cameraRig.resumeMouseControl(...)`, which smoothsteps toward the latest cursor target for **1500 ms** before returning to normal pointer damping.
