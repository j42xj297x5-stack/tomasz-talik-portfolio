# Three Scene Model

## Scene composition

`src/experience3d.js` wires one renderer, one canvas, one perspective camera, and two scenes:

- the main scene contains the monkey, five interactive main glyphs, plaques, Sun, Moon, lights, stones, shells, small glyphs, dust/stars, and fog;
- `galaxyBackgroundScene` contains only the galaxy sprite layer and has no fog.

The monkey and main glyph loaders retain visual fallbacks. Main glyph sphere colliders remain the interaction targets. Readable project content belongs to `src/ui/overlay.js`; plaques are transitional scene presentation, not text surfaces.

## Final two-pass render path

`renderScenePasses(...)` is used by both every runtime frame and startup warm-up. With renderer auto-clear and info auto-reset disabled, it:

1. resets renderer statistics once;
2. clears color, depth, and stencil;
3. renders `galaxyBackgroundScene`;
4. clears depth only;
5. renders the main scene with the same camera.

This guarantees that galaxies are always a backdrop: every main-scene object can cover them regardless of physical distance. Main-scene fog never affects galaxies. `renderer.info` totals include both passes because the statistics reset occurs before the pair, not between them.

## Atmospheric layers

The tuning model exposes four independently owned atmosphere layers: **Stones**, **Shells**, **Small Glyphs**, and **Dust / Stars**. Each relic layer has its own inner/outer spherical-shell radii; positions are sampled volumetrically (uniform by shell volume), not placed only on a surface. Count, scale range, and shell/radius changes rebuild only the affected layer after local debounce. Enabled state, orbit, self-spin multiplier, and opacity apply live.

Stone, shell, and small-glyph cloned materials use `depthTest: true`. Their `depthWrite` becomes active only when effective opacity is at least `0.98`, avoiding invisible occlusion during progression fades while allowing effectively opaque relics to cover dust. Dust uses `depthTest: true` and `depthWrite: false`.

## Galaxy backdrop

The canonical configuration names exactly five unique PNGs, `galaxy_01.png` through `galaxy_05.png`. Normalization de-duplicates paths and caps the layer at five; hydration creates one sprite per available unique texture, so every configured texture is used once. There are no copies, random cloud, vertical spread, or depth spread.

Sprites are spaced at equal angles on one XY plane and one shared radius. The whole arrangement orbits by advancing each equal-angle position together, while every sprite also accumulates its own material rotation. Radius, orbit speed, self rotation, opacity, and enabled state update live; changing the size range rebuilds only galaxies. Materials use normal blending, premultiplied alpha, internal alpha cutoff `0.05`, `depthTest: true`, and `depthWrite: false`.

Galaxies live in the separate `galaxyBackgroundScene`, outside main-scene fog. Their visibility nevertheless remains controlled by the galaxy progression multiplier (or tuning-mode visibility override).

## Fog reveal boundary

`src/scene/fogRevealController.js` owns only main-scene fog. After loader completion and `interactionReady`, its delta-driven clock expands fog from `near: 0`, `far: 0.1` to the canonical public JSON's `near: 0`, `far: 150` over **180 seconds** with `smoothstep`. It has restart and skip operations and no separate timer/RAF. Warm-up restores its start state and never advances it.

Fog reveals the monkey, main glyphs, Sun, and Moon; it does not mutate or replace world progression. Stones, shells, small glyphs, dust/stars, and galaxies still unlock from interaction with main glyphs. An unlocked main-scene layer remains constrained by the current fog reach. Galaxies avoid fog due to the background pass but still obey their progression threshold.

## Sun and Moon

Sun and Moon compose camera/target-facing orientation with an independently accumulated self rotation, so self-spin remains effective while `lockFacing` is enabled. Their panel controls for `Light intensity`, `Light angle`, and `Fade duration` apply live, as do the other non-structural celestial values. `SpotLight.distance` remains an internal attenuation-range parameter in canonical settings and is deliberately absent from the simplified panel.

Both lights retain targets at the central monkey pivot and keep their own eased fade behavior. Their effective intensity continues to include the `sunMoon` progression multiplier; fog reveal does not grant or alter progression.

## Plaque and interaction lifecycle

Startup prewarms and caches one independently cloned plaque wrapper per portfolio node, including cloned materials, validated bounds, glow, and light. Shader warm-up compiles fade and stable modes before interaction. A single serialized state flow remains active:

`idle → focusing → revealingPlaque → plaqueHold → dollyIn → panelOpen → dollyOut → restoringGlyph → returning → idle`.

Only after dolly-in does the HTML/CSS overlay open. Closing reverses the plaque, returns the camera, resumes orbit, and restores pointer control. A missing plaque affects only that node and uses the panel fallback.
