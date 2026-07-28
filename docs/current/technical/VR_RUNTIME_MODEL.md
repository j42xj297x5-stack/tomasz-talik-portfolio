# Experience VR Runtime Model

## Status and target

Experience VR is an implemented, minimal WebXR proof of concept targeted exclusively at Meta Quest 3S in Meta Quest Browser. It is a third runtime, separate from Classic 2D and Experience 3D. Ordinary desktop and mobile browsers are not target VR devices; when they do not expose `immersive-vr`, the entry shell keeps the VR choice visible but disabled.

## Entry and capability contract

The lightweight entry shell checks `window.isSecureContext`, `navigator.xr`, and `navigator.xr.isSessionSupported('immersive-vr')` without user-agent detection. Capability failure is isolated and never blocks Classic 2D or Experience 3D. The VR runtime is loaded only through the dynamic `import('./experienceVr.js')` after an enabled VR choice is selected.

Selection does not request a session. It opens a dedicated preparation screen, loads the monkey and five glyph assets, builds one renderer and one minimal scene, and then enables the localized **Enter VR / Wejdź do VR** button. Only that direct user gesture calls `navigator.xr.requestSession('immersive-vr', { optionalFeatures: ['local-floor'] })`.

## Minimal scene

`src/experienceVr.js` owns its canvas, WebGLRenderer, PerspectiveCamera, player rig, scene, session state, resize listener, and XR animation loop. The renderer enables XR, prefers `local-floor`, and falls back to `local` when the session cannot supply floor space. The camera is a child of the configured player rig; tracked head rotation is never overwritten.

The scene contains only a dark background, the existing base lights, the central monkey with its existing placeholder fallback, and the five existing glyphs with their sphere fallbacks. Glyph positions are the static initial ring produced by `createOrbitNodes`; the orbit controller is not advanced. There is no hover, raycasting, plaque, panel, overlay, atmosphere, dust, relic, galaxy, Milky Way, sun, moon, or world progression runtime.

## Configuration

`src/config/experienceVrSettings.js` defines and validates schema version 1. `public/data/experience-vr-settings.json` may override only the reference-space preference, world scale, player spawn position/look target, pixel-ratio cap, and antialias setting. Missing, malformed, incompatible, or individually invalid data falls back safely to code defaults. VR settings do not use localStorage and do not copy the Experience 3D composition schema.

The initial floor is world `Y = 0`; the player rig starts at `(0, 0, 6)` and faces the monkey. These are proof-of-concept calibration values, not final comfort tuning.

## Session lifecycle

The renderer uses `setAnimationLoop` only while a session is active. Session start stores one active session and exposes an exit control. Session end stops the loop, clears session state, and re-enables entry. Re-entry reuses the same scene, assets, renderer, camera, rig, controls, and listeners. It does not start Experience 3D.

Experience VR does not start Experience 3D ambient audio or its intro sequence. The existing delegated entry-button click effect remains the only inherited audio behavior.
