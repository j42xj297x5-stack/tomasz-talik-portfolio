# Frontend Runtime Model

## Runtime ownership

The application uses Vite, vanilla JavaScript, and vendored Three.js. `src/main.js` owns language/mode selection and conditionally imports Experience 3D. `src/experience3d.js` then owns the canvas shell, renderer, scene wiring, staged asset loading, input, overlay coordination, and animation loop. Public runtime paths use `publicPath(...)` for local Vite and GitHub Pages compatibility.

Classic 2D remains a separate lightweight runtime in `src/classic2d.js`; it consumes the same `portfolioNodes` records without loading Three.js.

Audio is a shared, non-blocking subsystem described by `AUDIO_RUNTIME_MODEL.md`. `main` mounts one master/mute capsule outside `#app` from the language screen onward and delegates eligible button effects in both modes. Web Audio is unlocked only by interaction; Classic 2D never starts ambient. Selecting Experience 3D starts looping `ambient_01` during its launch/loader path, prepares optional short effects before interaction release, and connects actual atmosphere progress-level changes to alternating five-second equal-power ambient crossfades. Scene tuning exposes session-only ambient/effects bus gains under `?debug`; these values are deliberately absent from schema-version-1 scene import/export.

The single Experience loader remains active through bounded critical/deferred preload (four concurrent operations on desktop, two on mobile/coarse pointers), scene attachment, deferred atmosphere/galaxy hydration, plaque prewarm, asynchronous shader compilation when supported, and a final warm-up render. A black, non-interactive intro layer is created beneath the loader and above the runtime shell during this work. After every temporary warm-up state is restored, fog is reset and one clean scene frame replaces the warm-up canvas buffer before the shell and loader are revealed. The loader is then removed and the localized intro is awaited in the `intro` interaction state. Only after its DOM is removed are interaction readiness, fog reveal, and the animation loop released, so no scene clock advances behind the intro.

## Experience 3D startup gate

The canonical startup order is:

1. select the mode and language;
2. preload assets;
3. build and hydrate the scene;
4. prewarm every plaque;
5. compile shaders and issue the warm-up render;
6. restore the proper visibility and material states of temporarily exposed layers;
7. render the correct initial frame over the temporary warm-up image;
8. complete and remove the loader;
9. play the localized opening intro;
10. enter `interactionReady` by changing the guarded state to `idle`;
11. start fog reveal;
12. create the scene timer and start the main `tick()`.

The intro belongs only to Experience 3D and is replayed on every entry. `experienceIntro` builds its Polish or English text with DOM nodes and `textContent`, never unsanitized HTML. Its opaque black, pointer-inert DOM/CSS layer sits above the canvas but below the loader. While the runtime is in `intro`, input remains rejected and no scene timer exists, so fog reveal, orbit, atmosphere progression, celestial updates, and other active-scene clocks consume no time.

The standard motion treats all stanzas as one white CSS 3D plane. It begins below the viewport with a broad, strongly enlarged lower edge; perspective narrows successive lines toward a central vanishing point while the plane travels continuously toward the centre and into depth, without pauses between intermediate transforms. The final text stays small and fades near the centre, then the black background fades only after the text animation ends. `prefers-reduced-motion` uses a shortened, static fade without the spatial journey.

Experience 3D first fetches `public/data/experience3d-settings.json` through `publicPath(...)` while the loader is visible. Schema-version-1 known fields are normalized and merged with the code defaults before the scene, fog, atmosphere, galaxies, sun, moon, relic hydration, or shader warm-up is created. A missing, malformed, or incompatible file never blocks startup: the complete code defaults are used, while an invalid individual field falls back independently and unknown fields are ignored. The source order is server file, then code fallback; browser `localStorage` is not a scene-settings source and panel changes remain session-only.

The tuning panel exports the canonical composition-only schema as `experience3d-settings.json`, with a trailing newline, for direct placement in `public/data/`. Import accepts schema version 1, normalizes it, and applies atmosphere, galaxies, fog, sun, and moon once each without changing progression or tuning mode. Debug diagnostics expose `settingsSource` (`server`, `defaults`, or `imported-session`) and an optional load error, but neither belongs to the exported settings.

Fog has an independent active-scene reveal clock. After preload, hydration, compilation, warm-up, loader completion, the full-screen text intro, and `interactionReady`, the controller starts at near/far `0/0.1` and expands toward the configured final `0/150` over 180 active seconds using smoothstep easing. It advances only from the existing render-loop delta, so the startup intro, a hidden tab, or a stopped loop does not spend its active time. It neither reads nor changes world progression, and tuning mode does not disable it. The Fog panel can restart or skip the fog reveal; import restarts enabled reveal, while export contains only static `fog.reveal` configuration and never its elapsed time or progress.

With `?debug`, a persistent, non-interactive performance HUD samples frame timings and `renderer.info` every 1.25 seconds. The debug export includes the same snapshot, startup/build counters, shader-program milestones, and one-time scene censuses captured after scene attachment, deferred hydration, plaque prewarm, warm-up, and interaction release.

## Experience 3D project opening

The Experience 3D project detail flow is a single serialized interaction. Selecting a glyph blocks new interaction and pauses its orbit. The runtime focuses the camera on that node, reveals the configured plaque, holds, and performs a safe dolly-in. The HTML/CSS overlay opens only after that sequence completes.

Closing the overlay keeps the selected node context long enough to dolly out, perform the reverse plaque reveal, return the camera home, resume orbit, unlock interaction, and smoothly hand the camera to the latest remembered fine-pointer target. Fine-pointer handoff takes 1500 ms. Coarse-pointer and reduced-motion contexts use shortened transition timings while preserving the same ordering.

If an individual plaque cannot load, the same node's HTML/CSS overlay opens through an isolated fallback; the failure does not block other nodes.

## Overlay and content boundary

`src/ui/overlay.js` derives project detail from `portfolioNodes`, applies `data-panel-theme`, resolves `ornamentPath` through `publicPath(...)`, and renders an opaque, responsive CSS/HTML panel with internal scrolling. Plaque models are transitional 3D presentation, not a replacement for readable panel content. Generic panel chrome for both Experience 3D and Classic 2D is resolved from `src/i18n/interfaceCopy.js`; it is independent of portfolio-record translations.

The removed SVG-frame runtime, its fetch/geometry/resize solvers, and legacy vertical panel assets are not active dependencies.

## Asset and rendering safety

`src/assets/assetManifest.js` derives five plaque GLB entries from `portfolioNodes` into the `deferredWarm` stage. `src/scene/plaqueTransition.js` caches a cloned plaque wrapper per node and ensures only one transition is active. Glyph and monkey model fallbacks remain mandatory. Vendored Three.js r184 with matching GLTFLoader remains the runtime source of truth; npm `three` is intentionally not the runtime source.

Before reveal, the plaque controller prewarms a complete cloned wrapper (materials, bounds, glow, and light) for every node; the first selection therefore performs no plaque model parsing or construction. Optional asset failures remain isolated, while critical failures keep the loader in its error state.
