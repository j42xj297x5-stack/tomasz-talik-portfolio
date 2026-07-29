# Experience VR Runtime Model

## Boundary and lifecycle

Experience VR is a separate Meta Quest 3S WebXR runtime, dynamically imported only after capability detection and VR selection. It does not import or start Experience 3D. `src/experienceVr.js` owns its renderer, scene, camera, `playerRig`, session state, lifecycle, and `renderer.setAnimationLoop`. A prepared runtime is reused after session end; portal, canvas, locomotion, transition, rig pose, orbit phase, lights, readiness, activation, and controller hits reset without duplicating runtime objects.

Entry remains two-stage: prepare the independent runtime, then request `immersive-vr` from the direct **Enter VR** gesture. The runtime requests `local-floor` and falls back to `local`.

## Ring, interaction, and entry

The effective ring radius remains `7.6` (`3.8 × 2`) and spawn remains `(0, 0, 8.6)`. Five glyphs continue orbiting in every XR frame. Dynamic entry readiness uses threshold `0.24` and hysteresis `0.04`. Controller rays test current GLB meshes (or fallback colliders), and hover/readiness/activation feedback remains light-only.

A trigger on the ready glyph latches it and starts `createVrEntryTransition`. The transition moves `playerRig`, never the tracked camera, compensates for the physical head's initial X/Z offset, preserves Y and orientation, and targets `effectiveRingRadius × 0.76` (about `5.8` from center).

## Portal arrival display

After the transition reaches `arrived`, `createVrPortalDisplay` reveals the preloaded `/glb/portal.glb` as a world-space root on the horizontal line between the XR head and central monkey. The root faces the head and is not camera-parented. The former per-glyph stone GLBs and separate plaque above the monkey are no longer used by the arrival flow.

The active-glyph title/body resolver remains the temporary content source. `createVrSpatialPlaque` renders it with `CanvasTexture` on `PlaneGeometry`, now named `VrPortalCanvas` and parented directly to `VrPortalDisplay`. Configurable local X/Y/Z offsets place the plane inside the portal opening with a small Z separation. Model and canvas inherit the same root orientation. The display has no raycast, grabbing, sockets, or physics behavior.

## Smooth locomotion

`createVrLocomotion` is a separate XR module updated by the VR animation loop. The right stick supplies forward/back movement and strafe using the tracked head's horizontal forward direction with pitch removed. The left stick supplies continuous yaw. Both transform `playerRig`, never the tracked camera, and movement preserves the rig's Y. Settings expose deadzone, movement speed, and turn speed. There is no collision, gravity, teleport, jump, or snap turn.

## Reset and validation status

Session end hides and resets the portal/canvas, resets the locomotion module, restores the rig spawn pose, and resets transition, orbit, lights, activation, and controller hits. Orbit behavior and the entry flow remain intact.

Automated coverage verifies preload/runtime wiring, portal ownership and orientation, internal canvas placement, locomotion deadzone, XZ translation, smooth yaw, stable Y, and absence of tracked-camera steering. The new portal scale/offsets, canvas readability, Quest controller axis mapping, locomotion speed, and comfort have not been manually validated on Meta Quest 3S.

## Exclusions and prohibitions

Crystals, sockets, grabbing/insertion, throwing, collision, gravity, physics, teleportation, jump, snap turn, portal interaction, bridge construction, VR audio, atmosphere, and galaxies remain out of scope. Do not merge Experience VR with Experience 3D, modify protected `src/experience3d.js`, transfer HTML/CSS overlays into VR, steer the tracked camera, pause glyph orbit, restore geometric interaction markers, or raycast static orbital positions.
