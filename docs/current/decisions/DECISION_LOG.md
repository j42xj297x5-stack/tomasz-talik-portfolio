# Decision Log

## 2026-05-22 — Initial repository documentation baseline

1. `docs/current` is the active source of truth.
2. `docs/legacy` stores superseded documentation.
3. First MVP should prefer Vanilla Three.js + Vite.
4. React/React Three Fiber is out of scope for first prototype unless explicitly requested later.
5. Use HTML/CSS overlays for readable text panels.
6. Use Three.js for scene, camera, lights, particles, central object, and interactive nodes.
7. Final portfolio copy is intentionally undecided.
8. Final project/portfolio name is intentionally undecided.
9. Meditating monkey is a symbolic central object, not a meme mascot.
10. GitHub Pages is the likely deployment target; exact workflow can be finalized later.

## 2026-05-22 — Vite scaffold initialization and vendored Three.js policy

1. Added Vite-compatible frontend scaffold (`index.html`, `src/main.js`, `src/styles/main.css`) with Vanilla JavaScript modules.
2. Created `package.json` with `dev`, `build`, and `preview` scripts for Vite.
3. Three.js remains vendored under `vendor/three`; npm package `three` is intentionally not installed.
4. Runtime currently imports Three.js from `vendor/three/three.module.js` as the MVP-safe path.
5. Portfolio scene implementation remains intentionally deferred; next step is first MVP Three.js scene modules.

## 2026-05-22 — First Three.js MVP scene implementation

1. Implemented first runtime scene modules under `src/scene/*` with dark atmospheric baseline, soft lighting, placeholder center object, particles, and camera drift.
2. Implemented five interactive orbit nodes representing portfolio gates, with hover highlight and HTML hover label.
3. Implemented HTML/CSS overlay panel with draft title/text, close button, and Escape close behavior.
4. Node content is centralized in `src/content/portfolioNodes.js` and intentionally remains draft.
5. Added `src/vendor/three.js` re-export bridge to keep module imports clean while preserving vendored dependency policy.
6. Next step: visual refinement, transitions, and replacement of placeholder center geometry with meditating monkey GLB asset.


## 2026-05-22 — Central monkey GLB runtime integration path

1. Runtime integration targets monkey GLB at `/glb/monkey.glb` (expected source: `public/glb/monkey.glb`, managed manually outside Codex PR flow).
2. Placeholder center object remains mandatory fallback and is hidden only after a successful GLB load callback.
3. GLTFLoader lookup is constrained to vendored Three.js path `vendor/three/examples/jsm/loaders/GLTFLoader.js`; npm `three` remains intentionally unused.
4. If vendored GLTFLoader is missing, runtime logs a warning and continues with placeholder-only rendering.

- Vendored Three.js baseline is `r184`; GLTFLoader must also be sourced from `r184` only.
- Required loader file path: `vendor/three/examples/jsm/loaders/GLTFLoader.js`.
- Runtime monkey asset URL: `/glb/monkey.glb` (local file: `public/glb/monkey.glb`, manually managed binary).
- Placeholder fallback is mandatory when loader or GLB is unavailable.
- npm `three` dependency remains intentionally unused in runtime integration.

- GLTFLoader r184 is vendored at `vendor/three/examples/jsm/loaders/GLTFLoader.js`.
- Required GLTFLoader utilities are vendored at `vendor/three/examples/jsm/utils/BufferGeometryUtils.js` and `vendor/three/examples/jsm/utils/SkeletonUtils.js`.
- Vite resolve alias maps bare `three` imports to local vendored module `vendor/three/three.module.js` via `vite.config.js`.


## 2026-05-22 — Monkey visual tuning pass after successful GLB load

1. Monkey GLB local load is confirmed in runtime; placeholder remains mandatory fallback and is hidden only on successful load callback.
2. Monkey transform tuning keeps center alignment, rotates monkey to face camera, and slightly reduces target model dimension for cleaner composition.
3. Orbit node radius is increased to reduce central overlap risk while preserving five-node behavior and existing hover/click/raycast interaction model.
4. Lighting receives minimal ambient/key/fill intensity and placement adjustments to improve monkey readability without breaking dark atmospheric mood.
5. Next likely step is post-MVP snapshot capture and/or small interaction polish, not architectural rewrite.
## 2026-05-22 — Mouse-driven monkey-pivot camera orbit (no OrbitControls)

1. Replaced pure time-based camera drift with a camera rig that orbits around fixed monkey pivot coordinates and always calls `camera.lookAt(pivot)`.
2. Chose explicit named orbit limits: horizontal yaw ±45° (`MAX_YAW_DEG`) and vertical pitch limit (`MAX_PITCH_DEG`) set to 30° default for calmer framing while keeping 45° as the upper design bound.
3. Preserved subtle idle drift as secondary additive motion and fallback when no fine-pointer mouse input is active.
4. Kept mobile/touch behavior intentionally simple (neutral/idle fallback), avoided OrbitControls, and preserved existing raycast-driven nodes, hover labels, and overlays.

## 2026-05-22 — AI Guide per-node glyph visual with safe sphere fallback

1. Added optional per-node visual model metadata in content (`modelPath`, `modelKind`) and assigned it only to `AI Guide` with runtime URL `/glb/glyph_1.glb`.
2. Extended orbit node runtime to attempt GLB load per node via vendored GLTFLoader r184 path, without introducing npm `three`.
3. Kept the original orbit sphere mesh as the interaction target (raycast metadata + hover/click behavior) and as visual fallback if GLB load fails.
4. Other four portfolio nodes intentionally remain sphere visuals to preserve incremental rollout scope.


## 2026-05-22 — Creative AI per-node glyph visual with preserved collider fallback

1. Assigned optional node visual metadata to `Creative AI` only (`modelPath: /glb/glyph_2.glb`, `modelKind: glyph`) while keeping existing node copy/content unchanged.
2. Reused the existing orbit-node per-node GLB loading path via vendored GLTFLoader r184; no npm `three` dependency was introduced.
3. Preserved the sphere mesh/collider as the interaction target and fallback visual if `/glb/glyph_2.glb` fails to load.
4. Kept AI Guide on `/glb/glyph_1.glb` and left all remaining nodes as sphere placeholders.

## 2026-05-22 — Ethics / Life Protection per-node glyph visual with preserved collider fallback

1. Assigned optional node visual metadata to `Ethics / Life Protection` only (`modelPath: /glb/glyph_3.glb`, `modelKind: glyph`) while keeping existing node copy/content unchanged.
2. Reused the existing orbit-node per-node GLB loading path via vendored GLTFLoader r184; no npm `three` dependency was introduced.
3. Preserved the sphere mesh/collider as the interaction target and fallback visual if `/glb/glyph_3.glb` fails to load.
4. Kept AI Guide on `/glb/glyph_1.glb`, Creative AI on `/glb/glyph_2.glb`, and left remaining nodes as sphere placeholders.
5. Internal concept note allows association with `AI Dharma` without changing user-facing overlay labels/copy.

## 2026-05-22 — Spotify Digger per-node glyph visual with preserved collider fallback

1. Assigned optional node visual metadata to `Spotify Digger` only (`modelPath: /glb/glyph_4.glb`, `modelKind: glyph`) while keeping existing node copy/content unchanged.
2. Reused the existing orbit-node per-node GLB loading path via vendored GLTFLoader r184; no npm `three` dependency was introduced.
3. Preserved the sphere mesh/collider as the interaction target and fallback visual if `/glb/glyph_4.glb` fails to load.
4. Kept AI Guide on `/glb/glyph_1.glb`, Creative AI on `/glb/glyph_2.glb`, Ethics / Life Protection on `/glb/glyph_3.glb`, and left Haiku Cosmos as sphere placeholder.


## 2026-05-22 — Haiku Cosmos per-node glyph visual with preserved collider fallback

1. Assigned optional node visual metadata to `Haiku Cosmos` only (`modelPath: /glb/glyph_5.glb`, `modelKind: glyph`) while keeping existing node copy/content unchanged.
2. Reused the existing orbit-node per-node GLB loading path via vendored GLTFLoader r184; no npm `three` dependency was introduced.
3. Preserved the sphere mesh/collider as the interaction target and fallback visual if `/glb/glyph_5.glb` fails to load.
4. All five orbit nodes now have GLB glyph visuals: AI Guide `/glb/glyph_1.glb`, Creative AI `/glb/glyph_2.glb`, Ethics / Life Protection `/glb/glyph_3.glb`, Spotify Digger `/glb/glyph_4.glb`, and Haiku Cosmos `/glb/glyph_5.glb`.


## 2026-05-22 — Milestone: central monkey + five glyph orbit-node runtime baseline

1. All five portfolio nodes now use GLB glyph visuals in runtime (AI Guide `glyph_1`, Creative AI `glyph_2`, Ethics / Life Protection `glyph_3`, Spotify Digger `glyph_4`, Haiku Cosmos `glyph_5`).
2. Glyph mapping is content-driven via `src/content/portfolioNodes.js` metadata (`modelPath`, `modelKind`).
3. Fallback/collider model remains required: monkey placeholder fallback and per-node sphere collider/fallback are non-optional runtime safety behavior.
4. Final visual polish (scale/orientation/lighting/composition refinement) remains intentionally separate from integration completion.
5. Snapshot recorded: `docs/current/audits/snapshots/2026-05-22_15-38-35__snapshot__monkey-five-glyphs-runtime-baseline.md`.


## 2026-05-22 — Canonical five-glyph hover effects model (documentation decision)

1. Final element mapping for the five glyphs is fixed from current visual appearance and existing glyph-to-node assignments (glyph_1/AI Guide = Wood, glyph_2/Creative AI = Fire, glyph_3/Ethics = Earth, glyph_4/Spotify Digger = Metal, glyph_5/Haiku Cosmos = Water).
2. `docs/current/technical/GLYPH_HOVER_EFFECTS_MODEL.md` is established as the active working canon for hover-only effect language, symbolism, consistency rules, and implementation order.
3. This step is documentation-only and does not modify runtime, scene architecture, shader stack, interaction baseline, or node naming/mapping.


## 2026-05-22 — Glyph 1 tree hover effect accepted baseline (documentation snapshot)

1. For first glyph (`AI Guide`), runtime baseline is the GLB tree effect (`/glb/glyph_1-tree.glb`) with safe fallback path to `/glb/glyph_1.glb`; previous procedural/non-solid variant is superseded.
2. Reveal model is documented as visual mask/shader growth from base (non-CSG), with slower reveal-in pacing and responsive fade-out on mouse-off.
3. Green emissive/glow/light direction is fixed as baseline for glyph 1; previous yellow direction is rejected for this checkpoint.
4. Point light remains active after full reveal during hover/active and transitions into orbit (with faster orbit than the earliest orbit pass); orbit radius is treated as stable unless a future explicit decision changes it.
5. Interaction safety is reaffirmed: tree visual meshes/helpers/lights are not raycast targets; collider/interactive target remains the glyph node.
6. Snapshot recorded: `docs/current/audits/snapshots/2026-05-22_18-18-33__snapshot__glyph-1-tree-effect-baseline.md`.

## 2026-05-29 — First working dual-runtime deployment snapshot (documentation-only)

1. The active deployment model supports both local Vite runtime and GitHub Pages runtime from the same codebase.
2. GitHub Pages deployment is documented under the repository base path `/tomasz-talik-portfolio/`.
3. Vite `base` / `import.meta.env.BASE_URL` is the source of truth for browser-visible public asset URLs.
4. Runtime asset references should use logical public paths such as `/glb/...` and `/png/...`, then normalize them through `publicPath(...)` before loading.
5. Browser URLs must not include the `public/` segment.
6. Vendored Three.js r184 and vendored `GLTFLoader` remain the runtime dependency source; npm `three` remains intentionally unused for runtime integration.
7. GLB model loading and PNG public asset loading share the same base-aware public path convention.
8. Fallback behavior remains required for deployment safety: monkey placeholder, node sphere/collider fallback, optional hover-effect degradation, and non-crashing loader failure handling.
9. Known risks are GitHub Pages cache, browser cache, case-sensitive filenames, large GLB size, and missing manually managed binary assets.
10. Snapshot recorded: `docs/current/audits/snapshots/2026-05-29_19-59-42__snapshot__dual-runtime-github-pages-deployment.md`.
11. This decision is documentation-only and does not change runtime code, visuals, scene behavior, content, assets, camera, lighting, or animation.
