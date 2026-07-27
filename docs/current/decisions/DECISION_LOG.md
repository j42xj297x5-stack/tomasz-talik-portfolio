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

## 2026-05-22 — DIG Engine per-node glyph visual with preserved collider fallback

1. Assigned optional node visual metadata to `DIG Engine` only (`modelPath: /glb/glyph_4.glb`, `modelKind: glyph`) while keeping existing node copy/content unchanged.
2. Reused the existing orbit-node per-node GLB loading path via vendored GLTFLoader r184; no npm `three` dependency was introduced.
3. Preserved the sphere mesh/collider as the interaction target and fallback visual if `/glb/glyph_4.glb` fails to load.
4. Kept AI Guide on `/glb/glyph_1.glb`, Creative AI on `/glb/glyph_2.glb`, Ethics / Life Protection on `/glb/glyph_3.glb`, and left Haiku Cosmos as sphere placeholder.


## 2026-05-22 — Haiku Cosmos per-node glyph visual with preserved collider fallback

1. Assigned optional node visual metadata to `Haiku Cosmos` only (`modelPath: /glb/glyph_5.glb`, `modelKind: glyph`) while keeping existing node copy/content unchanged.
2. Reused the existing orbit-node per-node GLB loading path via vendored GLTFLoader r184; no npm `three` dependency was introduced.
3. Preserved the sphere mesh/collider as the interaction target and fallback visual if `/glb/glyph_5.glb` fails to load.
4. All five orbit nodes now have GLB glyph visuals: AI Guide `/glb/glyph_1.glb`, Creative AI `/glb/glyph_2.glb`, Ethics / Life Protection `/glb/glyph_3.glb`, DIG Engine `/glb/glyph_4.glb`, and Haiku Cosmos `/glb/glyph_5.glb`.


## 2026-05-22 — Milestone: central monkey + five glyph orbit-node runtime baseline

1. All five portfolio nodes now use GLB glyph visuals in runtime (AI Guide `glyph_1`, Creative AI `glyph_2`, Ethics / Life Protection `glyph_3`, DIG Engine `glyph_4`, Haiku Cosmos `glyph_5`).
2. Glyph mapping is content-driven via `src/content/portfolioNodes.js` metadata (`modelPath`, `modelKind`).
3. Fallback/collider model remains required: monkey placeholder fallback and per-node sphere collider/fallback are non-optional runtime safety behavior.
4. Final visual polish (scale/orientation/lighting/composition refinement) remains intentionally separate from integration completion.
5. Snapshot recorded: `docs/current/audits/snapshots/2026-05-22_15-38-35__snapshot__monkey-five-glyphs-runtime-baseline.md`.


## 2026-05-22 — Canonical five-glyph hover effects model (documentation decision)

1. Final element mapping for the five glyphs is fixed from current visual appearance and existing glyph-to-node assignments (glyph_1/AI Guide = Wood, glyph_2/Creative AI = Fire, glyph_3/Ethics = Earth, glyph_4/DIG Engine = Metal, glyph_5/Haiku Cosmos = Water).
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


## 2026-05-30 — Current runtime baseline: galaxy/progression/loader/debug/mobile (documentation-only)

1. Galaxy sprites, atmosphere progression, loading diagnostics, debug import/export, and mobile pointer handling are now part of the current runtime baseline.
2. Deployment-safe public asset paths remain baseline behavior: logical public paths are resolved through base-aware runtime helpers for local Vite and GitHub Pages compatibility.
3. Loader performance/mobile staging remains an open issue; next investigation should evaluate staged preload groups and mobile concurrency limits before further loader optimization.
4. Snapshot recorded: `docs/current/audits/snapshots/2026-05-30_07-10-52__snapshot__galaxy-progress-loader-mobile-runtime.md`.
5. This decision is documentation-only and does not change runtime code, scene logic, runtime configuration, assets, loader optimization, mobile performance, or visual tuning.


## 2026-06-02 — Portfolio direction expands to language-first, dual-mode entry

Status: planned / documentation accepted.

Decision: The portfolio direction expands from a single 3D-first entry into a language-first entry shell followed by a dual-mode choice: `Classic 2D` / `Klasyczne 2D` or `Experience 3D` / `Doświadczenie 3D`.

Rationale:
1. Improves accessibility by giving visitors a readable language and mode choice before the experience starts.
2. Avoids forcing heavy 3D on every visitor or device.
3. Preserves the full atmospheric current Three.js experience as `Experience 3D`.
4. Creates a deliberate lightweight `Classic 2D` path that is fast, readable, calm, retro-symbolic, and first-class rather than degraded fallback.
5. Prepares the content model for future PL/EN bilingual structure.

Consequences:
1. Future runtime needs a pre-runtime entry shell.
2. 3D boot should become conditional on selecting `Experience 3D`.
3. Content model should evolve toward a shared PL/EN source of truth consumed by both modes.
4. `Classic 2D` becomes a first-class experience, not a degraded fallback.
5. Current Three.js runtime, deployment/public-path rules, runtime IDs, assets, CSS, and implementation remain unchanged until separate implementation tasks are accepted.


## 2026-06-02 — Entry shell and conditional Experience 3D boot implemented

Status: accepted / implemented.

Decision: The lightweight language/mode entry shell and conditional Experience 3D boot are now implemented. `src/main.js` owns entry shell orchestration, and `src/experience3d.js` owns the current Experience 3D runtime bootstrap.

Rationale:
1. Prevents eager 3D startup before the visitor chooses a mode.
2. Preserves the existing Three.js runtime and its scene, loader, glyph, panel, camera, debug, mobile input, deployment path, asset, and content behavior.
3. Creates a stable branch point for future Classic 2D implementation.
4. Keeps the architecture in vanilla JavaScript rather than introducing a framework.

Consequences:
1. `src/main.js` is no longer the direct 3D runtime bootstrap.
2. `src/experience3d.js` is now the Experience 3D bootstrap.
3. Future runtime tasks must check both `src/main.js` and `src/experience3d.js`.
4. At the time of this entry Classic 2D was future/placeholder-only; this consequence is superseded by the implemented Classic 2D decision dated 2026-06-03.
5. Current deployment/public-path rules, Vite config, assets, package files, and content remain unchanged.


## 2026-06-03 — Classic 2D MVP with floating glyph hotspots implemented

Status: accepted / implemented.

Decision: Classic 2D is now an implemented MVP lightweight flat portfolio experience with a central monkey PNG, five floating flat PNG glyph hotspots, shared-content readable panels, and subtle no-ring hover/focus glow behavior.

Rationale:
1. Turns Classic 2D from a placeholder into a functional lightweight portfolio path.
2. Keeps 2D fast, accessible, and readable without forcing the 3D runtime for visitors choosing the flat mode.
3. Reuses the existing shared `src/content/portfolioNodes.js` records rather than duplicating content for 2D.
4. Preserves the conditional boot boundary: Experience 3D still starts only after explicit Experience 3D selection.
5. Removes or reduces heavy persistent tile/card visuals in favor of symbolic floating glyph hotspots.
6. Addresses hover text blur by keeping text layers unscaled and limiting transform motion to glyph/halo layers.

Consequences:
1. Classic 2D is now part of the current runtime baseline.
2. Future tasks must preserve shared content usage and stable gate IDs across Classic 2D and Experience 3D.
3. Future visual polish should not reintroduce heavy persistent cards or tiles for glyph hotspots unless explicitly decided.
4. Ring/orbital outline effects are deferred and were intentionally not added in this pass.
5. Browser/runtime public paths must remain logical paths such as `/png/monkey_small.png` and `/png/glif_ai_guide.png`, not `public/png/...` paths.
6. Experience 3D remains separate and unchanged by this Classic 2D MVP decision.

## 2026-07-20 — Unified Experience 3D glyph panel system implemented

Status: accepted / implemented.

Decision: The five Experience 3D glyph panels use one opaque, full-viewport CSS-gradient layout on desktop and mobile, without an SVG frame. Each record's existing ornament remains unchanged.

Rationale:
1. The legacy desktop vertical PNG panels constrained Full HD text to roughly 420–500px.
2. A shared layout allows centred, internally scrolling content up to 1200px wide without relying on the Three.js scene for contrast.
3. Removing the eight-piece SVG frame eliminates its runtime asset loading and geometry maintenance without changing the ornament treatment.

Consequences:
1. Legacy vertical panel PNGs are no longer rendered or included in `criticalInitial` preload, though their physical public files remain available.
2. The `portfolio_frame_mobile_*` SVG files remain in `public/svg/` but are no longer runtime dependencies.
3. `ornamentPath` is universal Experience 3D metadata; the mobile-only ornament flag was removed, and ornament placement, proportions, and responsive scaling are retained.
4. Classic 2D is intentionally unchanged.

## 2026-07-21 — Smooth camera handoff after Experience 3D panels

Status: accepted / implemented.

Decision: Fine-pointer camera control pauses while an Experience 3D detail panel is open and, after any normal overlay close path, smoothly resumes toward the latest remembered cursor target over 1500 ms.

Rationale: The panel must be readable without camera movement, while closing it should not cause an abrupt visual jump if the visitor moved the cursor during reading.

Consequences:
1. `src/ui/overlay.js` exposes a single close callback to the Experience 3D runtime.
2. `src/experience3d.js` coordinates the close callback with `cameraRig.resumeMouseControl(...)`.
3. `src/scene/cameraRig.js` owns the transition timing and preserves the existing yaw/pitch limits and normal damping outside the handoff.

## 2026-07-22 — Shared five-glyph plaque interaction

Status: accepted / implemented.

1. All five Experience 3D glyphs use one shared, data-driven plaque system; `portfolioNodes` supplies each plaque model and visual configuration.
2. Unique hover effects are replaced by a common light scale/light one-shot for every glyph.
3. Project detail remains in the readable HTML/CSS overlay; plaques are a scene transition rather than a content surface.
4. Visible additive plaque glow is configured per node, while hover, transition, and plaque lighting plus GLB materials remain neutral/shared.
5. Plaques are cached as one cloned instance per node, and interaction serialization permits one active plaque animation at a time.

## 2026-07-23 — Incremental shared PL/EN content resolver

Status: accepted / implemented.

1. `creative-ai` is the first portfolio record with shared `translations.pl` and `translations.en` panel copy consumed by both Classic 2D and Experience 3D.
2. Translation content is not duplicated in either presentation runtime; both resolve the same source record before rendering.
3. Remaining portfolio records retain their existing top-level content as fallback and will migrate incrementally in separate tasks.
4. Runtime IDs, including `creative-ai`, remain stable throughout the migration.

## 2026-07-23 — Ethics / Life Protection shared PL/EN localization

Status: accepted / implemented.

1. `ethics-life-protection` now uses the existing shared `translations.pl` and `translations.en` model and resolver.
2. Classic 2D and Experience 3D consume the same localized record, without duplicating Ethics content between presentation modes.
3. The stable runtime ID `ethics-life-protection` and its scene metadata remain unchanged.
4. The migration remains incremental: the two remaining records continue to use their existing top-level fallback fields until separately localized.

## 2026-07-23 — AI Guide shared PL/EN localization

Status: accepted / implemented.

1. `ai-guide` now uses the existing shared `translations.pl` and `translations.en` model and resolver for its panel copy.
2. Classic 2D and Experience 3D consume the same localized record without duplicating AI Guide content between presentation modes.
3. The stable runtime ID `ai-guide` and all scene metadata remain unchanged.
4. The migration remains incremental: three of five portfolio records are localized, while DIG Engine and Haiku Cosmos retain their base fields as fallback.

## 2026-07-23 — DIG Engine shared PL/EN localization

Status: accepted / implemented.

1. `spotify-digger` now uses the existing shared `translations.pl` and `translations.en` model for its complete main panel, case study, and six-item gallery.
2. The stable runtime ID `spotify-digger` and its shared GLB, GIF, plaque, ornament, visual, and runtime metadata remain unchanged.
3. Classic 2D and Experience 3D resolve the same localized record through the shared resolver, without duplicating DIG Engine content between presentation modes.
4. Both translations provide complete `caseStudy` objects because the resolver's `{ ...node, ...translation }` contract is shallow.
5. The incremental migration now covers four of five portfolio records; Haiku Cosmos remains on Polish fallback pending a separate task.


## 2026-07-23 — Shared panel-chrome localization and opposite-language return control

Status: accepted / implemented.

1. Generic Classic 2D and Experience 3D panel chrome uses the shared `src/i18n/interfaceCopy.js` PL/EN resolver, independently of portfolio-record translations.
2. The shared copy covers visible controls and associated accessibility labels for panels, case studies, project links, demos, lightboxes, and screenshot galleries.
3. The mode-selection return-to-language control intentionally displays the language opposite the active selection and sets `lang` to match its visible text.
4. This change does not alter portfolio records, their resolver, or project-specific content.

## 2026-07-24 — Complete Haiku Cosmos PL/EN localization and case-study replacement

Status: accepted / implemented.

1. Localization is complete for all five portfolio records: each has full PL and EN content resolved from the shared `portfolioNodes` source by the common resolver used by Classic 2D and Experience 3D.
2. The stable runtime ID `haiku-cosmos` is preserved; its GLB, GIF path, plaque, ornament, links, and other shared runtime metadata remain at record level.
3. The former extensive Haiku Cosmos case study has been replaced with a shorter approved version in both languages.
4. The obsolete claim that an R1 card can be activated during RUN has been removed. Active prototype mechanics are described separately from designed systems and future directions.
5. Both `translations.pl` and `translations.en` contain complete, independent `caseStudy` objects. This is required because the resolver uses the shallow overlay `{ ...node, ...translation }`.
6. The case study presents active prototype capabilities distinctly from planned eons, collectible glyphs, special cards, artifacts, and other future development directions.
7. Classic 2D and Experience 3D continue to use one content source and one resolver, with no duplicate record content between modes.

## 2026-07-26 — Single-plane galaxy backdrop and direct celestial-light tuning

Status: accepted / implemented.

1. The galaxy layer uses each of the five unique PNG textures once, at equal angular intervals on one plane and one shared radius; random copies, vertical/depth spread, alpha threshold tuning, and additive blending are removed.
2. Radius, orbit speed, self rotation, enabled state, and opacity update live. Minimum and maximum size retain a debounced galaxy-only rebuild.
3. Schema-version-1 imports normalize the former inner/outer radius and speed multiplier fields into the new radius and direct-speed contract; canonical exports contain only the simplified fields.
4. Sun and moon panels expose live spotlight intensity, angle, and fade duration. Spotlight distance remains an internal Three.js cutoff but is hidden because its effect is not useful at the current scene scale.

## 2026-07-26 — Camera-centred Milky Way inner-sphere background

Status: accepted / implemented.

1. `/png/milky_way.webp` is loaded in `deferredWarm` by the shared AssetManager and mapped onto the inside of an unlit, transparent sphere in `galaxyBackgroundScene`.
2. The sphere renders before the five existing galaxy sprites without adding a render pass, follows the camera position, and remains independent of main-scene lighting and fog.
3. Its reveal uses the same `galaxies` progression multiplier and approximately 0.65-second interpolation as the sprite layer; missing optional texture data leaves the existing galaxies operational.
4. Radius, base opacity, and initial X/Y/Z orientation remain named module constants for later visual tuning rather than settings-panel controls.

## 2026-07-27 — Even shared sun/moon intensity progression

Status: accepted / implemented.

1. Sun and moon continue to use one shared progression multiplier, now increasing evenly from 60% at level 0 through 70%, 80%, and 90% to 100% at the stones level, then remaining at 100% for galaxies.
2. Disabling progression still yields a multiplier of 100%.
3. Base spotlight intensity, horizon fading, orbital behavior, layer thresholds, and progression commit timing remain unchanged.

## 2026-07-27 — Progressive cosmic reveal and animated stone relics

Status: accepted / implemented.

1. The cumulative atmosphere reveal uses one order: shells, small glyphs, stars, animated stones, then galaxies together with the Milky Way. Stones occupy the fourth stage so that they do not dominate the beginning of the experience.
2. Galaxy sprites and the Milky Way appear together at the fifth stage through the shared `galaxies` progression multiplier.
3. The runtime automatically plays every non-empty animation clip embedded in a stone GLB on a per-instance mixer with indefinite repeat; no internal mesh, controller, or clip names need to be identified in code. GLBs without animation remain valid static relics.
4. Each cloned animation root stays inside an outer wrapper that independently preserves random placement, scale, orientation, manual spin, orbit, and drift regardless of embedded GLB animation.
