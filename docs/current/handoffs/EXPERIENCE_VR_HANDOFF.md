# Experience VR Handoff

## Binding decisions

Experience VR remains a separately and dynamically imported WebXR runtime. It owns its renderer, scene, camera, `playerRig`, lifecycle, controllers, and animation loop. Immersive UI stays in Three.js and WebXR retains ownership of tracked-camera transforms.

## Current architecture

- `src/experienceVr.js` coordinates preparation, preload, session start/end, frame order, reset, and reuse.
- `src/config/experienceVrSettings.js` normalizes the VR contract, including portal/canvas dimensions and locomotion deadzone/speeds.
- Orbit, light feedback, moving-mesh interaction, controller rays, and compensated entry transition remain separate XR modules.
- `createVrPortalDisplay` owns the always-visible world-space `/glb/portal.glb`, grounded and fixed about 2 m to the monkey’s right from the configured spawn view; placement is independent of the XR head.
- `createVrSpatialPlaque` remains the active-glyph content renderer. It assigns its `CanvasTexture` directly to the portal's Blender-authored `PORTAL_CANVAS_SURFACE`, rather than creating a second plane when that mesh is valid.
- `createVrLocomotion` owns stick-driven `playerRig` translation and smooth yaw without changing rig Y or tracked-camera transforms.
- `experienceVrPages` owns the stable glyph-to-variable-pages mapping; each page points at one of 15 preloaded crystals and resolves concise localized text from `portfolioNodes`.
- `createVrCrystalCollection` owns deterministic floor spawn, separate target-ray crystal hits, `materializing`/`available`/`pulling`/`held`/`consumed` state, squeeze pull-to-hand, non-physical release, portal insertion, and reset.

## Current user flow and parameters

The visitor enters the independent immersive session, targets the dynamically ready orbiting glyph, and triggers the existing transition into the ring. Spawn is `(0, 0, 8.6)`, effective ring radius is `7.6`, readiness threshold/hysteresis are `0.24`/`0.04`, and arrival is about `5.8` from center.

The fixed portal and its internal canvas are visible before glyph selection, showing the localized waiting title and crystal insertion instruction. Arrival does not alter the portal; it only spawns the activated glyph’s crystals in an irregular deterministic area about 1.55 m in front of the monkey toward configured spawn. Their wrappers materialize with a short staggered smoothstep scale, rise, and slight yaw, and remain non-interactive until `available`. Each controller retains its trigger ray and grip/hold socket. A dedicated raycaster selects the nearest available crystal along local -Z and highlights its outer wrapper; it never overwrites the glyph hit. Squeeze pulls that target smoothly to the hand in 0.25 seconds only when its intersection is within 1.8 m. Early release cancels the pull at its current world transform; held release remains deterministic and non-physical unless the crystal is inside the bounds-derived invisible portal socket, where it is consumed and its page replaces the existing canvas content. Blender is the source of truth for `PORTAL_CANVAS_SURFACE` placement, rotation, scale, aspect ratio, geometry, and UVs. Runtime canvas resolution preserves that surface ratio within the configured pixel limits; manual `portalCanvas.width`, `height`, and `offset` remain only a warned fallback for an absent or invalid surface. The old stone plaque and separate above-monkey canvas are not used.

The right stick moves forward/back and strafes on XZ from horizontal head direction. The left stick rotates the rig smoothly. Deadzone, move speed, and turn speed are configurable. Session end restores spawn, the fixed visible portal and waiting canvas, locomotion, transition, orbit, lights, activation, and controller state without duplicating objects.

## Asset and preload contract

The Experience VR preload subset includes `/glb/portal.glb` as `vr-portal-model`; this asset provides `PORTAL_CANVAS_SURFACE` with its authored transform and full UV mapping. The subset also includes all 15 page crystal GLBs and the loader, monkey, and glyph assets needed by this runtime. AssetManager is the sole model source and spawn performs no fetch. Per-glyph plaque models are no longer included in that subset.

## Meta Quest 3S validation status

Previously confirmed hardware behavior includes session start, head tracking, scene scale, controller rays/triggers, glyph interaction, transition, orbit, light feedback, and dynamic readiness. Actual portal position, front visibility, ground height, angled canvas readability, crystal placement in front of the monkey, materialization timing/readability, post-effect crystal raycast, comfort of the 1.8 m limit, pull speed, held orientation, socket-release comfort, Quest controller axis mapping, smooth-locomotion speed, and comfort remain unverified on Meta Quest 3S. Automated tests cover their code contracts only.

## Active exclusions and prohibitions

Throwing, physics, collision, gravity, teleportation, jump, snap turn, bridge building, VR audio, atmosphere, and galaxies are outside this stage. Do not merge VR with Experience 3D, modify `src/experience3d.js`, move HTML/CSS overlays into VR, steer the tracked camera, stop glyph orbit, or restore geometric interaction markers.
