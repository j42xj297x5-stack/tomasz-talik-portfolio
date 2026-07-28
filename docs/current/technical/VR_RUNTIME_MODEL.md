# Experience VR Runtime Model

## Status and target

Experience VR is an implemented, minimal WebXR proof of concept targeted exclusively at Meta Quest 3S in Meta Quest Browser. It is a third runtime, separate from Classic 2D and Experience 3D. Ordinary desktop and mobile browsers are not target VR devices; when they do not expose `immersive-vr`, the entry shell keeps the VR choice visible but disabled.

## Entry and capability contract

The lightweight entry shell checks `window.isSecureContext`, `navigator.xr`, and `navigator.xr.isSessionSupported('immersive-vr')` without user-agent detection. Capability failure is isolated and never blocks Classic 2D or Experience 3D. The VR runtime is loaded only through the dynamic `import('./experienceVr.js')` after an enabled VR choice is selected.

Selection does not request a session. It opens a dedicated preparation screen, loads the monkey and five glyph assets, builds one renderer and one minimal scene, and then enables the localized **Enter VR / Wejdź do VR** button. Only that direct user gesture calls `navigator.xr.requestSession('immersive-vr', { optionalFeatures: ['local-floor'] })`.

## Minimal scene

`src/experienceVr.js` owns its canvas, WebGLRenderer, PerspectiveCamera, player rig, scene, session state, resize listener, and XR animation loop. The renderer enables XR, prefers `local-floor`, and falls back to `local` when the session cannot supply floor space. The camera is a child of the configured player rig; tracked head rotation is never overwritten.

The scene contains only a dark background, the existing base lights, the central monkey with its existing placeholder fallback, the five existing glyphs with their sphere fallbacks, target rays for up to two connected controllers, and one low-cost interaction marker. Glyph positions are the static initial ring produced by `createOrbitNodes`; the orbit controller is not advanced. There is no plaque, panel, overlay, atmosphere, dust, relic, galaxy, Milky Way, sun, moon, or world progression runtime.

## Controllers

Experience VR creates two symmetric WebXR target-ray controllers through `renderer.xr.getController(0)` and `(1)` and attaches them to the player rig. WebXR supplies their transforms; the runtime does not update controller position or rotation. An input source's `handedness`, `targetRayMode`, and `profiles` are captured as runtime-only controller data on `connected`, without assuming that an index identifies a particular hand.

Each connected source shows a thin, untextured line from the controller's local origin along local `-Z`. `selectstart` records that controller's `isSelecting` state and applies the configured active length scale; `selectend` restores its idle state and scale. `disconnected` hides its line and clears its input, trigger, and hit state. Controller models and hand tracking are not loaded.

## Entry glyph interaction

After world matrices are current, the runtime compares every glyph's world position with the player rig's initial world position. The smallest squared distance selects the sole entry glyph; strict comparison preserves `nodes` array order for a tie. This remains valid when spawn position or world scale changes. The other four glyphs stay visible but are never raycast, hovered, or activated.

Every frame, each connected controller independently stores `currentHit` as either `null` or the entry node. Its ray origin and world quaternion come from `controller.matrixWorld`; rotating local `(0, 0, -1)` by that quaternion supplies the world direction. The raycaster tests only the entry-node collider, and `far` equals the controller's current visible length (`rayLength × idleScale` or `rayLength × activeScale`).

The aggregated interaction states are `idle`, `hovered`, and `activated`. A single transparent, unlit shell around the entry glyph is hidden while idle, blue and subtle while either controller hits, and stronger gold after activation. Losing one of two simultaneous hits does not remove hover. Only `selectstart` from a controller whose own `currentHit` is the entry node activates it. Activation invokes its callback once and remains latched until reset. That callback starts the one-shot entry transition; further activation attempts while the transition is `moving` or `arrived` cannot start another movement.

## Entry transition

The first glyph moves the user from the spawn side of the ring to the configurable horizontal target `(0, 1.8)` in front of the central monkey. The transition moves `playerRig` only; it never positions or rotates the tracked XR camera. At start, it reads the active XR camera's world position and adds the horizontal offset required to place the user's current physical head position at the target, rather than treating the rig origin as the head position.

During the default three-second movement, delta time from the existing XR animation loop drives `smoothstep` interpolation of only the rig's `X` and `Z` coordinates. Rig `Y`, rig rotation, tracked head position/orientation, and controller orientation remain untouched. The terminal state is `arrived`, and completion runs once. Disabling the configured transition applies the same head-relative destination immediately and enters `arrived`. There is no rotation, audio, plaque, content, or subsequent gameplay.

## Configuration

`src/config/experienceVrSettings.js` defines and validates schema version 1. `public/data/experience-vr-settings.json` may override the reference-space preference, world scale, player spawn position/look target, pixel-ratio cap, antialias setting, bounded controller values, and the entry transition's enabled flag, duration, horizontal target, and easing. The target intentionally has no public height coordinate. Missing, malformed, incompatible, or individually invalid data falls back safely to code defaults. VR settings do not use localStorage and do not copy the Experience 3D composition schema.

The initial floor is world `Y = 0`; the player rig starts at `(0, 0, 6)` and faces the monkey. Its yaw is derived from the horizontal direction between `spawn.position` and `spawn.lookAt`, aligning the camera's local `-Z` forward axis without applying pitch or roll. These are proof-of-concept calibration values, not final comfort tuning.

## Session lifecycle

The renderer uses `setAnimationLoop` only while a session is active. Session start stores one active session and exposes an exit control. Before each session request, runtime cancellation resets the transition to `idle`, restores the rig to the configured spawn position, reapplies the accepted starting yaw, and resets controller hits, the glyph visual, and its activation latch. The callback can therefore run once again only in a new, reset session. Session end stops the loop and clock, cancels any `moving` transition back to `idle` without delayed completion, clears session and glyph-interaction state, and re-enables entry. Re-entry reuses the same transition, scene, assets, renderer, camera, rig, controls, controller objects, rays, marker, and listeners; it does not add callbacks or start Experience 3D.

Experience VR does not start Experience 3D ambient audio or its intro sequence. The existing delegated entry-button click effect remains the only inherited audio behavior.
