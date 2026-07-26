# Frontend Runtime Model

## Runtime ownership

The Vite/vanilla-JavaScript entry shell conditionally imports Experience 3D. `src/experience3d.js` owns its canvas, renderer, scene systems, staged loading, interaction state, panel coordination, and single animation loop. Classic 2D remains a separate lightweight consumer of the shared portfolio records. Public paths are resolved through `publicPath(...)` for local Vite and GitHub Pages.

## Canonical configuration

Scene composition has two canonical inputs:

1. complete code defaults in `src/config/experience3dSettings.js`;
2. the deployed schema-version-1 file `public/data/experience3d-settings.json`, fetched through `publicPath(...)` while the loader is visible.

Known server fields are normalized and merged with defaults. A missing, malformed, or incompatible file does not block startup: complete defaults are used; an invalid individual field falls back independently and unknown fields are ignored. The current public file configures fog reveal for **180 seconds**, from `near: 0`, `far: 0.1` to final `near: 0`, `far: 150`, with `smoothstep`. This is the checked-in canonical value; it conflicts with an external expectation of 45 seconds and must not be silently documented as 45.

Scene settings are neither read from nor automatically written to `localStorage`. Panel edits affect only the current session. Manual import accepts schema version 1, normalizes it, and applies atmosphere, galaxies, fog, sun, and moon without changing progression or tuning mode. Manual export downloads the composition-only schema as `experience3d-settings.json` for placement in `public/data/`. Diagnostics, loader/runtime progress, fog elapsed time, and fog progress are not part of that JSON.

## Startup and interaction release

Experience 3D starts in this order:

1. show and subscribe the loader;
2. fetch canonical server configuration, normalize it, and merge it with code defaults (or use defaults on failure);
3. preload critical, deferred-warm, and optional assets with bounded concurrency;
4. create the renderer, the main scene, the dedicated galaxy background scene, camera, and scene systems;
5. attach the monkey, main glyphs, atmosphere, celestial bodies, progression, and plaque controller;
6. hydrate deferred relic models and galaxy sprites;
7. prewarm one complete plaque wrapper per glyph;
8. compile both galaxy and main-scene shader variants, including plaque fade and stable modes;
9. warm up the exact final two-pass render path;
10. restore temporary warm-up visibility and the fog reveal start state;
11. finish and remove the loader;
12. set the interaction state to `idle` and record `interactionReady`;
13. start the fog-reveal clock and the existing animation loop.

Fog reveal is not asset preload, shader compilation, or render warm-up and does not replace any of them. Warm-up never consumes fog intro time.

## Tuning panel contract

The panel emits `{ owner, action, value }` events. `optionsEventRouter` dispatches each event only to its owner (`atmosphere`, `galaxies`, `scene`, `sun`, `moon`, or `progression`), preventing unrelated layer work. Orbit, self-spin, opacity, enabled state, galaxy radius, fog values, and celestial controls apply live where the underlying structure is unchanged. Count, shell/radius distribution, scale distribution, dust geometry, and galaxy-size changes use 140 ms debounced, layer-local rebuilds rather than rebuilding the whole world. Each composition section has its own reset.

Tuning mode forces progression-controlled atmosphere and galaxy visibility for inspection. It ignores progression visibility only: it neither changes progression state nor bypasses main-scene fog. The panel supports manual JSON import/export. It has no scene presets or technical debug controls; performance is a read-only status section.

## Fog reveal and world progression

`fogRevealController` is an independent runtime system. It starts only after loader completion and `interactionReady`, advances by delta from the existing loop, and creates no timer or second `requestAnimationFrame`. Because the Three.js timer is connected to the document and ticks only with that loop, a stopped loop or hidden tab does not spend reveal time.

The reveal begins at `0/0.1`, eases with `smoothstep` toward the canonical JSON's final `0/150`, and supports restart and skip. Import can restart an enabled reveal. Tuning mode does not disable fog, and runtime progress is never exported.

Fog reveal opens the **base scene core**: the monkey, five main glyphs, Sun, and Moon. It does not automatically unlock the farther cosmos. Stones, shells, small glyphs, dust/stars, and galaxies remain controlled by the existing progression driven by user interaction with the main glyphs.

The systems remain independent:

- fog never reads or changes progression state;
- glyph clicks may unlock a layer while fog is still expanding, and that main-scene layer is visible only within the current fog range;
- after fog completes, later unlocked layers appear through their normal progression fade, with no additional automatic reveal;
- galaxies are outside fog because they render in the background scene, but they still respect their own progression threshold.

## Project-detail interaction

Only `idle` accepts normal selection. A glyph click pauses orbit and serializes focus, plaque reveal, hold, safe dolly, and HTML/CSS panel opening. Close performs dolly-out, reverse plaque reveal, camera return, orbit resume, unlock, and a 1500 ms fine-pointer handoff. Coarse-pointer and reduced-motion contexts preserve the order with shorter timings. A plaque failure is isolated to that node and falls back to its readable panel.

## Diagnostics boundary

With `?debug`, runtime diagnostics sample frame timing, renderer totals, startup/build counters, program milestones, layer visibility, and fog state. Renderer totals cover both render passes. Diagnostics may report whether settings came from `server`, `defaults`, or `imported-session`, plus an optional load error; none of these values belongs to exported settings.
