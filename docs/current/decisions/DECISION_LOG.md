# Decision Log

Status: current binding decisions, not a patch chronology.

## Repository and delivery

1. `docs/current/` is canonical; superseded plans belong in `docs/legacy/` and are not default reading.
2. The application remains Vite plus vanilla JavaScript with the vendored Three.js r184 toolchain and GitHub Pages-safe public paths.
3. Classic 2D, Experience 3D, and Experience VR are three distinct presentation modes over stable portfolio content IDs.

## Runtime boundaries

1. `src/main.js` owns language/mode selection and conditional imports.
2. `src/experience3d.js` owns Experience 3D and remains protected. Experience VR must neither import it nor require its migration to a common world factory.
3. `src/experienceVr.js` is a separate, dynamically imported WebXR runtime with its own renderer, scene, camera, `playerRig`, lifecycle, and `setAnimationLoop`.
4. Experience 3D may use HTML/CSS panels; immersive VR content does not reuse that overlay and does not programmatically steer the tracked camera.
5. A WebXR session begins only from the second direct user gesture after capability detection and runtime preparation. `local-floor` falls back to `local`.

## Current Experience VR interaction

1. Five glyphs continuously orbit at effective radius `7.6`; interaction never pauses the orbit.
2. `entryReady` is dynamic. Any glyph entering the configured angular zone can be activated; readiness is not tied to a fixed glyph or orbit index.
3. Two local-`-Z` controller rays hit current GLB meshes or child fallback colliders. Hits resolve through an explicit object-to-glyph-root mapping; static stored positions are not raycast targets.
4. Feedback is provided by warm point lights. Geometric hover/readiness markers are not part of the accepted design.
5. Entry moves the `playerRig`, compensating for the physical XR head offset. With `targetRadiusFactor = 0.76`, the current destination is about `5.8` units from ring center.
6. One grounded portal and its existing internal canvas are visible from initial scene readiness, fixed about 2 m to the monkey’s right from the configured spawn view. Arrival never moves or hides it; the selected stone plaque and separate canvas above the monkey are not part of this flow.
7. Session exit/re-entry resets mutable state and reuses runtime objects without duplication.
8. VR pages are a separate variable-length mapping keyed by stable glyph ID. The MVP maps 15 preloaded crystal assets to concise selectors over localized shared portfolio content.
9. Arrival spawns only the activated glyph’s page crystals in front of the monkey toward configured spawn. Deterministic bounds-based placement keeps their authored models on floor Y=0 with individual 0.22–0.28 scale; staggered wrapper materialization precedes the interactive `available` state.
10. Trigger remains glyph-ray activation. Squeeze performs nearest grip-space grab; release either preserves the crystal's world transform or consumes it at the invisible bounds-derived portal socket and updates the existing canvas.
11. Crystal interaction is explicitly transform/parenting based: no physics engine, gravity, collision, throwing, or velocity.

## Scope sequencing

1. Smooth joystick locomotion and deterministic squeeze crystal interaction are implemented as separate modules.
2. Teleportation, jump, snap turn, physics, throwing, plaque raycasting, bridge building, VR audio, atmosphere, and galaxies remain excluded.
3. Future stages must preserve the current separation between locomotion, crystal parenting, and any later world simulation.
