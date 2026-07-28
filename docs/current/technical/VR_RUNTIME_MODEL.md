# Experience VR Runtime Model

## Status and boundary

Experience VR is a separate Meta Quest 3S WebXR runtime, loaded only after the VR choice. It reuses assets and small scene factories, but does not start or import the Experience 3D runtime. It owns one scene, renderer, XR animation loop, player rig, two target-ray controllers, one plaque, and VR-specific glyph orbit, lighting, and interaction controllers. It contains no joystick locomotion, teleportation, physics, grabbing, or DOM overlay.

## Ring and spawn

`createOrbitNodes` remains the source of the base glyph radius, `3.8` world units. The VR `glyphRing.radiusMultiplier` defaults to `2`, producing an effective radius of `7.6` without scaling glyphs, colliders, monkey, plaque, rig, or world. Since the former spawn `(0, 0, 6)` would be inside that orbit, VR spawn is `(0, 0, 8.6)`; height and `lookAt` remain unchanged.

`createVrGlyphOrbit` records the five initial, equally spaced angles, fixed heights, scales, and model rotations. On every existing `renderer.setAnimationLoop` frame it adds `delta * angularSpeed * direction` to one shared phase and recomputes X/Z on the common radius. It never pauses for hover, activation, transition, arrival, or plaque display. Model rotations remain at the orientation established by `createOrbitNodes`, matching Experience 3D's phase-independent glyph orientation.

## Dynamic entry zone

The horizontal direction from ring center toward the configured spawn defines the entry direction. The orbit controller compares each current glyph angle with that direction and selects at most the closest glyph within `entryAngleThreshold`. The current selection is retained inside the threshold plus `entryAngleHysteresis` unless another candidate is meaningfully closer; this prevents boundary flicker. Because every glyph shares the orbit, every glyph can become `entryReady` in turn.

A trigger is accepted only when that controller's current hit equals the current `entryReady` glyph and no glyph has already been activated. It latches that logical glyph as `activatedEntryGlyph` and starts the existing transition once. Hits outside the zone only contribute hover and cannot show the plaque or start movement.

## Moving-geometry raycasting

`createVrGlyphInteraction` builds one target record per logical glyph: `glyphRoot`, `raycastObjects`, and optional `fallbackCollider`. It recursively collects visible, renderable meshes from the loaded GLB hierarchy. When no useful mesh exists, it creates one invisible low-poly collider as a child of that glyph root, so normal parent transforms carry it through orbital position, rotation, scale, and world-root transforms.

An explicit object-to-glyph map resolves a hit mesh or collider back to its logical glyph. Each connected controller independently stores `currentHit` and `currentRayLength`; its world origin and quaternion transform local `(0, 0, -1)`, and `Raycaster.far` equals the visible ray length. Hover is aggregated as a set, so one controller losing a shared hit does not cancel the other.

The frame order is: orbit update; `glyphRing.updateMatrixWorld(true)`; controller raycasts; dynamic entry-ready assignment; glyph-light update; entry-transition and plaque update; render. Raycasts therefore see the glyph transform from the same frame.

## Light-only feedback

There is no blue/gold sphere, shell, ring, circle, or geometric halo. `createVrGlyphLights` owns one warm `PointLight` (`#fffaf2`, matching the Experience 3D glyph light) per glyph. Each light anchor is a child of its glyph. On update its local position is derived from the center-to-glyph radial direction at factor `1.16`, placing it beyond and in front of the visible glyph side while parent transforms make it follow the orbit.

Light states are `idle` (off), `hovered` (2.8), `entryReady` (subtle 1.15), and `activated` (3). Activated has precedence, then aggregated hover, then entry readiness. Hover continues after arrival and orbital motion never stops.

## Transition, plaque, and lifecycle

Activation hides the reused plaque and starts `createVrEntryTransition`. Only its `onComplete`, after state `arrived`, calls `spatialPlaque.show` with content resolved from the latched `activatedEntryGlyph.userData`. Later hits cannot change that glyph, plaque content, or restart the transition.

Before a new session and after session end, the runtime restores spawn/yaw, resets the transition and plaque, restores initial orbital phase, clears `activatedEntryGlyph`, `entryReady`, and both controller hits, and turns off glyph lights. Existing controllers, listeners, colliders, lights, orbit controller, interaction system, and plaque are reused rather than duplicated.

Orbit and light `dispose()` methods are idempotent and do not remove glyph models. Light disposal removes module-owned anchors/lights. Interaction disposal removes its listeners and fallback colliders, clears mappings and hits, and disposes only module-owned fallback geometry/material—not GLB resources.

## Configuration

Schema version 1 accepts `glyphRing.enabled`, `radiusMultiplier`, `angularSpeed`, `direction`, `entryAngleThreshold`, and `entryAngleHysteresis`, in addition to renderer, controller, transition, plaque, spawn, reference-space, and world-scale settings. Invalid values fall back to bounded code defaults. Experience VR settings are not stored in localStorage and do not expose controller-axis movement.
