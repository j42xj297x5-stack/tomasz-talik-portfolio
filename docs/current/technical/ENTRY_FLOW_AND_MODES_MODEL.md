# Entry Flow and Modes Model

## Shared entry shell

`src/main.js` selects language and then exposes three modes. The modes share stable portfolio IDs and content data where applicable, but each presentation owns its runtime. Failure or lack of WebXR capability does not block Classic 2D or Experience 3D.

## Classic 2D

Classic 2D routes directly to `src/classic2d.js`. It is the lightweight HTML/CSS/JavaScript portfolio with responsive glyph navigation and readable shared-content panels; it does not boot Three.js.

## Experience 3D

Experience 3D is dynamically imported only after its selection. `src/experience3d.js` owns the desktop Three.js renderer, scene, camera interaction, animation lifecycle, plaque sequence, atmosphere, and HTML/CSS content overlay. It is not migrated into a VR world factory and remains protected from VR work.

## Experience VR WebXR flow

```text
language → mode selection
               ↓ capability available + Experience VR selected
        dynamic import of src/experienceVr.js
               ↓ prepare independent scene/runtime
        enabled “Enter VR” control
               ↓ second, direct user gesture
        request immersive-vr session
               ↓ request local-floor; fallback local
        attach session + renderer.setAnimationLoop
               ↓ session end
        stop loop, reset state, offer re-entry using existing runtime objects
```

Capability detection checks the secure context and `navigator.xr.isSessionSupported('immersive-vr')`. Experience VR owns its renderer, scene, camera, `playerRig`, controllers, interaction, and lifecycle. Immersive content uses Three.js objects; the Experience 3D HTML/CSS overlay is not transferred into VR, and tracked-camera pose is never driven by application input.

## Current boundary

Experience VR implements head tracking, two controller rays, moving-glyph raycasting, light-only hover/entry feedback, entry transition, a selected stone plaque, and a canvas plaque above the monkey. Joystick locomotion is the next separate stage, not current behavior.
