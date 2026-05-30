# Snapshot: Galaxy, progression, loader, mobile runtime checkpoint

Timestamp: `2026-05-30_07-10-52` UTC
Scope: documentation-only checkpoint after recent runtime work.

## A. Executive summary

The current runtime baseline now includes a modular distant-galaxy sprite layer, staged atmosphere progression, loading diagnostics, debug settings import/export, base-aware public asset path resolution, and mobile pointer/orientation/input fixes. This snapshot records the state as-is for future audits and follow-up planning. It does not introduce runtime changes, scene logic changes, loader optimization, visual tuning, binary asset moves, or mobile performance fixes.

## B. Runtime state after this checkpoint

- The portfolio runtime remains a Three.js scene with a central monkey, five interactive orbit glyph nodes, sun/moon cycles, layered background atmosphere, loader overlay, options/debug panel, and content overlays.
- Recent runtime changes are now treated as baseline behavior rather than experimental branches: galaxy sprites, atmosphere progression multipliers, loading diagnostics, debug import/export, deployment-safe public paths, and mobile input handling belong to the current runtime model.
- The known next-risk area is startup/loading perception, especially on mobile: some assets are staged/preloaded, but the visual world can still appear in jumps after the loader.

## C. Galaxy Sprites layer

- A new modular layer owns distant galaxy visuals separately from core orbit-node interaction.
- The implementation uses `THREE.Sprite` and `THREE.SpriteMaterial` for transparent PNG galaxy cards.
- Placement is deterministic through seeded random generation, so the same config/seed reproduces the same layout.
- Each sprite has an independent slow orbit around the scene rather than sharing one global orbit phase.
- Each sprite also has center self-spin through `material.rotation`, separate from orbital motion.
- Sprite metadata is non-interactive; galaxy sprites are visual-only and should not become raycast targets.
- Alpha-friendly defaults use normal blending by default, with additive blending available as an option rather than the baseline.
- Cleanup/rebuild behavior is expected to be safe: rebuildable structural fields can dispose/recreate the layer without leaving stale sprite objects/materials/textures in the scene graph.
- Integration happens from `src/main.js` after scene, sun, and moon setup, and the galaxy controller is updated from the main animation loop.
- The layer does not change orbit-node raycasting, hover labels, overlay routing, or glyph interaction logic.
- Texture URLs use `publicPath(...)` / `import.meta.env.BASE_URL` semantics so runtime requests work in local Vite and GitHub Pages subpath deployments.
- Config stores logical paths such as `/png/galaxy_01.png`; runtime resolves them to browser URLs at load time.
- The Options panel exposes `galaxySprites` runtime controls and persists that runtime config together with other debug/runtime settings.
- Fields are split conceptually between structural rebuild fields (counts, scale range, radii, seed, texture/blending-affecting setup) and runtime material/motion fields (enabled, opacity, orbit speed multiplier, own-spin speed multiplier).
- Orbit/self-spin behavior was corrected by using independent per-sprite orbit phases, spin phases, directions, and speeds.

## D. Atmosphere progression model

Current progression model:

- `progress 0` = core only.
- Layers reveal in this order:
  1. stones,
  2. shells,
  3. small glyphs,
  4. stars,
  5. galaxies.
- Default duration for each of the five thresholds is `10` seconds.
- Layer transitions are linear over the configured duration.
- Progression acts as a multiplier and does not overwrite debug values.
- Stones, shells, small glyphs, stars/dust, and galaxies multiply their debug opacity/visibility by the progression multiplier.
- Sun/moon light multipliers by progress level:
  - `progress 0` = `1`
  - `progress 1` = `0.3`
  - `progress 2` = `0.6`
  - `progress 3` = `1`
  - `progress 4` = `1`
  - `progress 5` = `1`

## E. Debug settings import/export

- Debug/runtime settings can be exported to a JSON file.
- Debug/runtime settings can be imported back from a JSON file.
- Import/export is connected to the debug/presets area of the Options panel.
- The intent is to let a full runtime/debug tuning state be saved outside the browser and restored later for QA, screenshots, visual audits, or regression checks.

## F. Asset paths / deployment compatibility

- Runtime GLB relic paths were normalized toward base-aware relative/public paths instead of brittle root-relative deployment assumptions.
- Public asset resolution is compatible with `import.meta.env.BASE_URL`.
- The same logical asset references should work for local Vite and GitHub Pages under the repository subpath.
- Rule: config/content can store logical public paths, while runtime loaders resolve them through a helper such as `publicPath(...)`.
- Do not hard-code root-relative paths in runtime paths when they would break deployment under a subpath such as GitHub Pages.

## G. Asset Loading / Loading Diagnostics v1

Current loader/diagnostics baseline:

- Initial conservative loader is present before scene reveal.
- A central asset manifest defines runtime asset groups/stages.
- Required preload groups exist for initial scene readiness.
- Diagnostics report asset counts and byte totals where browser responses expose usable size data.
- Critical failures block scene reveal instead of silently entering a broken scene state.
- An atmospheric loader overlay is displayed before the scene is revealed.

Known caveat: the v1/v2 loader work improved part of the loading problem, but it still needs a deeper audit. Mobile loading can be slower, and parts of the world can still appear visually in jumps. This is a known limitation / next investigation item and is intentionally not fixed in this snapshot.

## H. Mobile interaction and viewport fixes

- The viewport meta uses `viewport-fit=cover` without disabling user scaling.
- Glyph activation moved from click-only assumptions toward Pointer Events on the canvas.
- Canvas input handles `pointerdown`, `pointermove`, `pointerup`, and `pointercancel`.
- Desktop fine-pointer mouse hover behavior remains preserved.
- Tap-vs-drag detection uses:
  - movement threshold: `10px`,
  - max tap duration: `500ms`.
- Dragging the scene should not accidentally open glyph panels.
- Interaction debug logs are gated behind `?debug`.
- Debug logs include pointer type, tap/drag/cancel states, raycast hit data, and orientation resize dimensions.
- Raycaster pointer coordinates are normalized from `renderer.domElement.getBoundingClientRect()`.
- Desktop camera pointer normalization also uses canvas bounds rather than assuming full-window coordinates.
- Resize/orientation handling is centralized around:
  - camera aspect/projection updates,
  - renderer pixel ratio capped at `2`,
  - renderer size updates,
  - delayed resize after `orientationchange`.
- CSS hardening includes:
  - canvas `touch-action: none`,
  - hidden overlays do not receive pointer events,
  - completed loader overlay no longer intercepts input,
  - Options panel controls are explicitly interactive.

## I. Known limitations / open issues

- The world can still appear visually in jumps after the loader.
- Future audit must distinguish late loading from intended progression visibility.
- Loader runtime hydration can worsen mobile startup if too many assets are treated as critical.
- Next loader step should be staging preload: `criticalInitial` / `deferredWarm` / `optionalLate`.
- Progression layers may need fade/scale reveal instead of sudden `visible = true` transitions.
- Mobile may need concurrency-limited loading.

## J. Files likely affected

Runtime files confirmed present in this repo and relevant to the recorded baseline:

- `src/main.js` — scene bootstrap, loader orchestration, input handling, resize/orientation handling, and galaxy/progression wiring.
- `src/scene/galaxySprites.js` — modular distant galaxy sprite layer.
- `src/assets/assetManifest.js` — central asset manifest and staged preload groups.
- `src/assets/preloadAssets.js` — preload helpers and loading diagnostics.
- `src/assets/assetManager.js` — runtime asset cache/manager.
- `src/ui/loaderOverlay.js` — atmospheric loader overlay and debug diagnostics text.
- `src/ui/optionsPanel.js` — debug/preset controls, import/export, progression, and galaxy controls.
- `src/ui/overlay.js` — content overlay routing/panel behavior.
- `src/scene/monkeyModel.js` — central GLB model loading with fallback behavior.
- `src/scene/orbitNodes.js` — interactive orbit nodes, glyph model loading, collider/fallback ownership.
- `src/scene/sunCycle.js` — sun cycle and progression multiplier integration.
- `src/scene/moonCycle.js` — moon cycle and progression multiplier integration.
- `src/scene/atmosphere.js` — atmosphere layer visibility/opacity state.
- `src/scene/atmosphere/atmosphereProgression.js` — current progression order, transition timing, and sun/moon multipliers.
- `src/utils/publicPath.js` — base-aware public asset URL helper.
- `index.html` — viewport meta baseline.
- `src/styles/main.css` — mobile/overlay pointer-event hardening.

Current documentation areas already carrying related state:

- `docs/current/technical/FRONTEND_RUNTIME_MODEL.md`
- `docs/current/technical/THREE_SCENE_MODEL.md`
- `docs/current/technical/DEPLOYMENT_MODEL.md`
- `docs/current/maps/PROJECT_INDEX.md`
- `docs/current/maps/DEPENDENCY_MAP.md`
- `docs/current/decisions/DECISION_LOG.md`

No requested runtime file from the list is absent in this repo.

## K. QA / verification notes

Checklist for validating this baseline after the documentation checkpoint:

- [ ] `npm run build`
- [ ] `npm run dev`
- [ ] Desktop: hover/click glyphs.
- [ ] Desktop: camera movement unchanged.
- [ ] Mobile: tap opens glyph panel.
- [ ] Mobile: drag does not open panel.
- [ ] Mobile: orientation resize works.
- [ ] GitHub Pages/publicPath assets still load.
- [ ] Debug settings export/import available.
- [ ] Galaxy controls persist and rebuild when structural fields change.
- [ ] Loader diagnostics visible in debug.
