# Experience VR Runtime Model

## Status and boundary

Experience VR is a separate Meta Quest 3S WebXR runtime, loaded only after the VR choice. It reuses assets and small scene factories, but does not start or import the Experience 3D runtime. It owns one scene, renderer, XR animation loop, player rig, two target-ray controllers, a readable canvas plaque, one stone-glyph-plaque controller, and VR-specific glyph orbit, lighting, and interaction controllers. It contains no joystick locomotion, teleportation, physics, grabbing, or DOM overlay.

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

Activation hides both reused plaques and starts `createVrEntryTransition`. The horizontal destination is the ring center plus the normalized center-to-spawn direction multiplied by `effectiveRingRadius * targetRadiusFactor`. The factor defaults to `0.5` (bounded to `0.2–0.8`), so radius `7.6` produces a `3.8`-unit stopping distance. The destination remains a head destination: the rig displacement subtracts the XR head's physical starting X/Z offset, while Y and orientation remain unchanged.

Only `onComplete`, after state `arrived`, shows both objects from the latched `activatedEntryGlyph`. The stone plaque is selected by stable portfolio ID, not orbit index: `ai-guide` → `/glb/plaque_ai_guide.glb`, `spotify-digger` → `/glb/plaque_dig_engine.glb`, `haiku-cosmos` → `/glb/plaque_haiku_cosmos.glb`, `creative-ai` → `/glb/plaque_creative_ai.glb`, and `ethics-life-protection` → `/glb/plaque_ethics.glb`. All five GLBs are included in VR preload and obtained through the existing AssetManager cache.

The stone instances retain shared geometry, textures, relief, ornament, and engraved asset text. Their meshes receive VR-owned cloned materials for fade animation. A `Box3` supplies dimensions and center; one uniform factor `min(maxWidth / width, maxHeight / height)` preserves proportions, and the centered model retains its configured front yaw. At show time the container is anchored `distance` along the XR camera's horizontal view direction and at `headY + verticalOffset`; it faces the head with world-up and does not follow later head motion. Its delta-driven smoothstep materialization moves from `hidden` through `appearing` to `visible`, restoring each cloned material's original opacity, transparency, and depth-write values at completion without modifying cached materials.

The separate canvas keeps its established dimensions, resolution, and typography. A world-space monkey `Box3` places its center at `monkeyBounds.max.y + monkeyVerticalGap + height / 2`; it faces the current horizontal head position and then remains world-anchored. Thus its lower edge clears the monkey while the stone artifact remains lower in front of the player. Neither plaque participates in raycasting, hover, grabbing, locomotion, or physics. Later glyph hits cannot change either visible object.

Before a new session and after session end, the runtime restores spawn/yaw, resets the transition and both plaques to `hidden`, restores initial orbital phase, clears `activatedEntryGlyph`, `entryReady`, and both controller hits, and turns off glyph lights. Existing loaded plaque models, VR-owned material instances, controllers, listeners, colliders, lights, orbit controller, interaction system, and canvas are reused rather than duplicated. Moving-glyph orbit updates and real-mesh/fallback-collider raycasting retain their existing frame order and behavior.

Orbit and light `dispose()` methods are idempotent and do not remove glyph models. Light disposal removes module-owned anchors/lights. Interaction disposal removes its listeners and fallback colliders, clears mappings and hits, and disposes only module-owned fallback geometry/material—not GLB resources.

## Configuration

Schema version 1 accepts `glyphRing.enabled`, `radiusMultiplier`, `angularSpeed`, `direction`, `entryAngleThreshold`, and `entryAngleHysteresis`; `entryTransition.targetRadiusFactor`; `spatialPlaque.monkeyVerticalGap`; and the stone plaque's enabled, size, distance, vertical-offset, duration, and start-scale values, in addition to renderer, controller, spawn, reference-space, and world-scale settings. Invalid values fall back to bounded code defaults. Experience VR settings are not stored in localStorage and do not expose controller-axis movement.
