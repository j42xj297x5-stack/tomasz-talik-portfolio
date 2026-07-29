# Experience VR Handoff

## Binding decisions

Experience VR remains a separately and dynamically imported WebXR runtime. It owns its renderer, scene, camera, `playerRig`, lifecycle, controllers, and animation loop. Immersive UI stays in Three.js and WebXR retains ownership of tracked-camera transforms.

## Current architecture

- `src/experienceVr.js` coordinates preparation, preload, session start/end, frame order, reset, and reuse.
- `src/config/experienceVrSettings.js` normalizes the VR contract, including portal/canvas dimensions and locomotion deadzone/speeds.
- Orbit, light feedback, moving-mesh interaction, controller rays, and compensated entry transition remain separate XR modules.
- `createVrPortalDisplay` owns the world-space `/glb/portal.glb` arrival root positioned on the head-to-monkey line.
- `createVrSpatialPlaque` remains the temporary active-glyph content renderer, but its `CanvasTexture` plane is a child inside the portal rather than a separate plaque above the monkey.
- `createVrLocomotion` owns stick-driven `playerRig` translation and smooth yaw without changing rig Y or tracked-camera transforms.

## Current user flow and parameters

The visitor enters the independent immersive session, targets the dynamically ready orbiting glyph, and triggers the existing transition into the ring. Spawn is `(0, 0, 8.6)`, effective ring radius is `7.6`, readiness threshold/hysteresis are `0.24`/`0.04`, and arrival is about `5.8` from center.

Arrival reveals one world-space portal between the head and monkey. The portal faces the player and its internal plane displays the activated glyph title/body. Portal size, placement, and canvas offsets are settings-driven; this stage does not consume a Blender anchor. The old stone plaque and separate above-monkey canvas are not used.

The right stick moves forward/back and strafes on XZ from horizontal head direction. The left stick rotates the rig smoothly. Deadzone, move speed, and turn speed are configurable. Session end restores spawn and resets portal, canvas, locomotion, transition, orbit, lights, activation, and controller state without duplicating objects.

## Asset and preload contract

The Experience VR preload subset includes `/glb/portal.glb` as `vr-portal-model`, together with the loader, monkey, and glyph assets needed by this runtime. Per-glyph plaque models are no longer included in that subset.

## Meta Quest 3S validation status

Previously confirmed hardware behavior includes session start, head tracking, scene scale, controller rays/triggers, glyph interaction, transition, orbit, light feedback, and dynamic readiness. The new portal scale/offsets, internal-canvas visibility/readability, Quest controller axis mapping, smooth-locomotion speed, and comfort remain unverified on Meta Quest 3S. Automated tests cover their code contracts only.

## Active exclusions and prohibitions

Crystals, sockets, grabbing, insertion, throwing, physics, collision, gravity, teleportation, jump, snap turn, portal interaction, bridge building, VR audio, atmosphere, and galaxies are outside this stage. Do not merge VR with Experience 3D, modify `src/experience3d.js`, move HTML/CSS overlays into VR, steer the tracked camera, stop glyph orbit, or restore geometric interaction markers.
