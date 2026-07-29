# Experience VR Handoff

## Binding decisions

Experience VR remains a separately and dynamically imported WebXR runtime. It owns its renderer, scene, camera, `playerRig`, lifecycle, controllers, and animation loop. Immersive UI stays in Three.js and WebXR retains ownership of tracked-camera transforms.

## Current architecture

- `src/experienceVr.js` coordinates preparation, preload, session start/end, frame order, reset, and reuse.
- `src/config/experienceVrSettings.js` normalizes the VR contract, including portal/canvas dimensions and locomotion deadzone/speeds.
- Orbit, light feedback, moving-mesh interaction, controller rays, and compensated entry transition remain separate XR modules.
- `createVrPortalDisplay` owns the world-space `/glb/portal.glb` arrival root positioned on the head-to-monkey line.
- `createVrSpatialPlaque` remains the active-glyph content renderer. It assigns its `CanvasTexture` directly to the portal's Blender-authored `PORTAL_CANVAS_SURFACE`, rather than creating a second plane when that mesh is valid.
- `createVrLocomotion` owns stick-driven `playerRig` translation and smooth yaw without changing rig Y or tracked-camera transforms.
- `experienceVrPages` owns the stable glyph-to-variable-pages mapping; each page points at one of 15 preloaded crystals and resolves concise localized text from `portfolioNodes`.
- `createVrCrystalCollection` owns deterministic floor spawn, `available`/`held`/`consumed` state, squeeze near-grab, non-physical release, portal insertion, and reset.

## Current user flow and parameters

The visitor enters the independent immersive session, targets the dynamically ready orbiting glyph, and triggers the existing transition into the ring. Spawn is `(0, 0, 8.6)`, effective ring radius is `7.6`, readiness threshold/hysteresis are `0.24`/`0.04`, and arrival is about `5.8` from center.

Arrival reveals one world-space portal between the head and monkey. Its internal surface first displays a localized crystal instruction, and only crystals mapped to the activated glyph spawn irregularly between player and portal. Each controller retains its trigger ray and adds a grip/hold socket. Squeeze grabs the nearest crystal inside the configured radius; release preserves world transform unless the crystal is inside the bounds-derived invisible portal socket, where it is consumed and its page replaces the existing canvas content. Blender is the source of truth for `PORTAL_CANVAS_SURFACE` placement, rotation, scale, aspect ratio, geometry, and UVs. Runtime canvas resolution preserves that surface ratio within the configured pixel limits; manual `portalCanvas.width`, `height`, and `offset` remain only a warned fallback for an absent or invalid surface. The old stone plaque and separate above-monkey canvas are not used.

The right stick moves forward/back and strafes on XZ from horizontal head direction. The left stick rotates the rig smoothly. Deadzone, move speed, and turn speed are configurable. Session end restores spawn and resets portal, canvas, locomotion, transition, orbit, lights, activation, and controller state without duplicating objects.

## Asset and preload contract

The Experience VR preload subset includes `/glb/portal.glb` as `vr-portal-model`; this asset provides `PORTAL_CANVAS_SURFACE` with its authored transform and full UV mapping. The subset also includes all 15 page crystal GLBs and the loader, monkey, and glyph assets needed by this runtime. AssetManager is the sole model source and spawn performs no fetch. Per-glyph plaque models are no longer included in that subset.

## Meta Quest 3S validation status

Previously confirmed hardware behavior includes session start, head tracking, scene scale, controller rays/triggers, glyph interaction, transition, orbit, light feedback, and dynamic readiness. Portal/canvas readability, actual crystal size and scatter, grab radius, hold-socket position, portal-socket position, insertion comfort, Quest controller axis mapping, smooth-locomotion speed, and comfort remain unverified on Meta Quest 3S. Automated tests cover their code contracts only.

## Active exclusions and prohibitions

Throwing, physics, collision, gravity, teleportation, jump, snap turn, bridge building, VR audio, atmosphere, and galaxies are outside this stage. Do not merge VR with Experience 3D, modify `src/experience3d.js`, move HTML/CSS overlays into VR, steer the tracked camera, stop glyph orbit, or restore geometric interaction markers.
