# Experience VR Runtime Model

## Boundary and lifecycle

Experience VR is a separate Meta Quest 3S WebXR runtime, dynamically imported only after capability detection and VR selection. It does not import or start Experience 3D. `src/experienceVr.js` owns its renderer, scene, camera, `playerRig`, session state, lifecycle, and `renderer.setAnimationLoop`. The prepared runtime is reused after session end: transition, plaques, rig pose, orbit phase, lights, readiness, activation, and controller hits reset without duplicating models, listeners, controllers, or module-owned helpers.

Entry is deliberately two-stage: prepare the independent runtime, then request `immersive-vr` from the direct **Enter VR** gesture. The runtime requests `local-floor`; if that reference space is unavailable it uses `local`. Capability probing checks secure context and `navigator.xr.isSessionSupported('immersive-vr')` without blocking other modes.

## Ring, spawn, and dynamic readiness

`createOrbitNodes` supplies the base radius `3.8`. VR applies `radiusMultiplier = 2`, producing effective radius `7.6` without scaling the world, player, models, or colliders. Spawn is `(0, 0, 8.6)` and the rig initially faces the configured look-at point.

`createVrGlyphOrbit` continuously advances one phase for five glyphs and recomputes their X/Z positions every XR frame. Orbit does not stop for hover, activation, movement, arrival, or plaque display. Every glyph can become `entryReady` as it crosses the spawn-facing entry direction. The angular threshold is `0.24` radians and hysteresis is `0.04` radians, retaining the current candidate near the boundary to prevent flicker.

## Controllers, raycasting, and light feedback

`createVrControllers` owns two independent target-ray controllers. Each visible ray and its raycaster point down the controller's local `-Z` axis. Trigger handling remains independent per controller.

`createVrGlyphInteraction` collects the current visible renderable meshes from each loaded GLB. If a glyph has no usable mesh, it adds an invisible child fallback collider. An explicit mapping resolves `hit.object → glyphRoot`; therefore parent transforms keep raycasting aligned with moving geometry, and interaction never tests stale/static orbital positions. On each frame the orbit updates and `glyphRing.updateMatrixWorld(true)` runs before raycasting.

Hover/readiness/activation feedback is light-only. `createVrGlyphLights` attaches a warm `PointLight` to every glyph and follows current world transforms. No sphere, shell, ring, halo, or other geometric marker is used. Hover can continue after arrival and never pauses orbit.

## Entry transition

Only a trigger hit on the current `entryReady` glyph can latch `activatedEntryGlyph` and start one transition. `createVrEntryTransition` moves the `playerRig`, never the tracked camera. It treats the destination as a head destination and subtracts the physical XR head's starting X/Z offset. Y and orientation remain unchanged.

The destination lies along the center-to-spawn direction at `effectiveRingRadius × targetRadiusFactor`. `targetRadiusFactor = 0.5`, so the current `7.6` ring stops the head about `3.8` units from its center.

## Arrival plaques

After transition state becomes `arrived`, two separate world-space objects appear:

- `createVrGlyphPlaque` places a proportionally scaled stone GLB in front of the player, based on the latched glyph;
- `createVrSpatialPlaque` draws the glyph's readable text to canvas and anchors the plane above the monkey using its world bounds.

Both face the player's head when shown and remain world-anchored. They are not raycast, grabbed, thrown, or physics-enabled.

### Stone asset mapping

| Stable glyph ID | Stone plaque GLB |
| --- | --- |
| `ai-guide` | `/glb/plaque_ai_guide.glb` |
| `spotify-digger` | `/glb/plaque_dig_engine.glb` |
| `haiku-cosmos` | `/glb/plaque_haiku_cosmos.glb` |
| `creative-ai` | `/glb/plaque_creative_ai.glb` |
| `ethics-life-protection` | `/glb/plaque_ethics.glb` |

`resolveVrGlyphPlaqueAsset` resolves by stable glyph ID, not orbital index; orbit order and current position cannot change content selection. All five assets are included in the VR preload subset and reused from `AssetManager`.

## Implementation status versus Quest 3S validation

Implemented in code: the complete architecture and behavior above, including the half-radius target and both arrival plaques.

Confirmed on Meta Quest 3S before `280ceb7`: session start from Meta Quest Browser and GitHub Pages, head tracking and scene scale, correct starting orientation, two controller rays, independent triggers, glyph raycast/activation, comfortable transition, readable canvas, enlarged rotating ring, light hover, current moving-solid raycasting, and dynamic `entryReady`.

Not yet confirmed on hardware from `280ceb7`: final half-radius destination, stone plaque in front of the player, canvas above the monkey, and their mutual composition. Thus `280ceb7` remains pending manual Quest 3S acceptance despite being implemented.

## Next planned stage and exclusions

After that acceptance, locomotion is a separate stage: right stick controls forward/back and left/right strafe; left stick controls smooth left/right rotation. It is not implemented now.

Teleportation, jump, snap turn, physics, grabbing/throwing, plaque raycasting, bridge construction, VR audio, atmosphere, and galaxies remain out of scope.

## Architectural prohibitions

Experience VR must not become a shared runtime with Experience 3D, and a common world factory is not the binding direction. Do not modify protected `src/experience3d.js` for VR work; transfer the desktop HTML/CSS overlay into VR; steer the tracked camera; pause the glyph orbit during interaction; restore geometric markers; raycast static positions; or combine locomotion, physics, and grabbing in one stage.
