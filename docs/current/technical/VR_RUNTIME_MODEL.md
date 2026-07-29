# Experience VR Runtime Model

## Boundary and lifecycle

Experience VR is a separate Meta Quest 3S WebXR runtime, dynamically imported only after capability detection and VR selection. It does not import or start Experience 3D. `src/experienceVr.js` owns its renderer, scene, camera, `playerRig`, session state, lifecycle, and `renderer.setAnimationLoop`. A prepared runtime is reused after session end; portal, canvas, locomotion, transition, rig pose, orbit phase, lights, readiness, activation, and controller hits reset without duplicating runtime objects.

Entry remains two-stage: prepare the independent runtime, then request `immersive-vr` from the direct **Enter VR** gesture. The runtime requests `local-floor` and falls back to `local`.

## Ring, interaction, and entry

The effective ring radius remains `7.6` (`3.8 × 2`) and spawn remains `(0, 0, 8.6)`. Five glyphs continue orbiting in every XR frame. Dynamic entry readiness uses threshold `0.24` and hysteresis `0.04`. Controller rays test current GLB meshes (or fallback colliders), and hover/readiness/activation feedback remains light-only.

A trigger on the ready glyph latches it and starts `createVrEntryTransition`. The transition moves `playerRig`, never the tracked camera, compensates for the physical head's initial X/Z offset, preserves Y and orientation, and targets `effectiveRingRadius × 0.76` (about `5.8` from center).

## Portal arrival display and crystal pages

After the transition reaches `arrived`, `createVrPortalDisplay` reveals the preloaded `/glb/portal.glb` as a world-space root on the horizontal line between the XR head and central monkey. The root faces the head and is not camera-parented. The former per-glyph stone GLBs and separate plaque above the monkey are no longer used by the arrival flow.

`experienceVrPages` maps stable glyph IDs to variable-length page arrays. The MVP has three pages per glyph and one preloaded crystal GLB per page (15 total); short localized title/body content is selected from the already resolved `portfolioNodes` record rather than duplicated. On arrival the existing `VrPortalCanvas` first shows a localized insertion instruction. Only the activated glyph's pages spawn, and inserting later crystals replaces the content on that same canvas.

`createVrPortalDisplay` owns an invisible `VrPortalCrystalSocket` child. Its lower-central, player-facing local position is derived from centered portal-model bounds and configured factors; no marker is rendered. The socket exposes its world position and configured insertion radius.

`createVrCrystalCollection` clones only preloaded AssetManager scenes. It deterministically derives scale (0.22–0.28), yaw, slight tilt, and an irregular XZ layout from `page.id`, centers each model by bounds, and moves its lowest bound to floor Y=0. State is explicit: `available`, `held`, or `consumed`.

Both target-ray controllers remain trigger-driven for glyph activation. Each now also owns a WebXR grip and an invisible hold socket. `squeezestart` parents the nearest available crystal within `grabRadius` to that hand's socket; hands hold independently and cannot share an instance. `squeezeend` consumes and hides it only within the portal insertion radius, otherwise reparenting it to the scene while preserving its world transform. There is deliberately no physics engine, gravity, world collision, throwing, or velocity.

## Smooth locomotion

`createVrLocomotion` is a separate XR module updated by the VR animation loop. The right stick supplies forward/back movement and strafe using the tracked head's horizontal forward direction with pitch removed. The left stick supplies continuous yaw. Both transform `playerRig`, never the tracked camera, and movement preserves the rig's Y. Settings expose deadzone, movement speed, and turn speed. There is no collision, gravity, teleport, jump, or snap turn.

## Reset and validation status

Session end releases both hands, removes the active crystal set, clears consumed/page state, hides and resets the portal/socket/canvas instruction, resets locomotion, restores the rig spawn pose, and resets transition, orbit, lights, activation, and controller hits. Runtime objects and squeeze listeners are reused rather than duplicated. Orbit behavior and the entry flow remain intact.

Automated coverage verifies the exact 15-asset/page mapping, variable page-count spawn, deterministic scale/layout, bounds-based floor placement, independent nearest-hand grabbing, preserved release transforms, insertion/consume/reset behavior, preload/runtime wiring, portal ownership and orientation, internal canvas placement, locomotion, and absence of tracked-camera steering. Actual crystal size and scatter, grab radius, hold-socket position, portal-socket position, insertion comfort, canvas readability, Quest controller axis mapping, locomotion speed, and comfort have not been manually validated on Meta Quest 3S.

## Exclusions and prohibitions

Throwing, collision, gravity, physics, teleportation, jump, snap turn, bridge construction, VR audio, atmosphere, and galaxies remain out of scope. Do not merge Experience VR with Experience 3D, modify protected `src/experience3d.js`, transfer HTML/CSS overlays into VR, steer the tracked camera, pause glyph orbit, restore geometric interaction markers, or raycast static orbital positions.
