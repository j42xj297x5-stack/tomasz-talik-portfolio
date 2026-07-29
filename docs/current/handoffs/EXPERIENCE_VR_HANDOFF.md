# Experience VR Handoff

## Binding decisions

Experience VR remains a separately and dynamically imported WebXR runtime. It owns its renderer, scene, camera, `playerRig`, lifecycle, controllers, and animation loop. Immersive UI stays in Three.js and WebXR retains ownership of tracked-camera transforms.

## Current architecture

- `src/experienceVr.js` coordinates preparation, preload, session start/end, frame order, reset, and reuse.
- `src/config/experienceVrSettings.js` normalizes the VR contract, including portal/canvas dimensions and locomotion deadzone/speeds.
- Orbit, light feedback, moving-mesh interaction, controller rays, and compensated entry transition remain separate XR modules.
- `createVrPortalDisplay` owns the always-visible world-space `/glb/portal.glb`, grounded and fixed about 2 m to the monkey’s right from the configured spawn view; placement is independent of the XR head.
- `createVrCrystalReliquary` owns the always-visible, authored-scale `/glb/portal_crystal_reliquary.glb`. Its placement root is exactly 1.5 m along the portal's quaternion-derived horizontal front toward the player, without a lateral offset. A model root raises the authored model, hidden insertion sphere, named anchor, runtime anchor, and inserted crystal by 0.5 m. A sibling companions root keeps activate and release at their prior height; their placement roots are 1 m forward of the reliquary and 0.5 m left/right of the portal axis, with portal-parallel orientation and scale roots fixed at `0.3`, without modifying either GLB's authored transform.
- `createVrSpatialPlaque` remains the active-glyph content renderer. It assigns its `CanvasTexture` directly to the portal's Blender-authored `PORTAL_CANVAS_SURFACE`, rather than creating a second plane when that mesh is valid.
- `createVrLocomotion` owns stick-driven `playerRig` translation and smooth yaw without changing rig Y or tracked-camera transforms.
- `experienceVrPages` owns the stable glyph-to-variable-pages mapping; each page points at one of 15 preloaded crystals and resolves concise localized text from `portfolioNodes`.
- `createVrCrystalCollection` owns deterministic floor spawn, separate target-ray crystal hits, `materializing` plus `available` → `pulling` → `held` → `inserted` → `active` state, squeeze pull-to-hand, non-physical release, portal insertion, and reset.

## Current user flow and parameters

The visitor enters the independent immersive session, targets the dynamically ready orbiting glyph, and triggers the existing transition into the ring. Spawn is `(0, 0, 8.6)`, effective ring radius is `7.6`, readiness threshold/hysteresis are `0.24`/`0.04`, and arrival is about `5.8` from center.

The fixed portal, reliquary, and internal canvas are visible before glyph selection, showing the localized waiting title and crystal insertion instruction. Arrival does not alter them; it only spawns the activated glyph’s crystals in an irregular deterministic area about 1.55 m in front of the monkey toward configured spawn. Their wrappers materialize with a short staggered smoothstep scale, rise, and slight yaw, and remain non-interactive until `available`. Each controller retains its trigger ray and grip/hold socket. A dedicated raycaster selects the nearest available crystal along local -Z and highlights its outer wrapper; it never overwrites the glyph hit. Squeeze pulls that target smoothly to the hand in 0.25 seconds only when its intersection is within 1.8 m. Early release cancels the pull at its current world transform; held release inserts the visible crystal at `RELIQUARY_CRYSTAL_ANCHOR` when its center enters the Blender-authored hidden sphere. The portal page is deferred until a target-ray `selectstart` hits the render-transparent trigger and successfully activates it. The button emits 0/1/5 for idle/hover/latched and plays `Relic_Reliquary_ActivateButton_Press` once, clamped in its pressed pose. Missing or invalid reliquary data produces one warning and falls back to the old portal socket. Blender remains the source of truth for both this sphere and `PORTAL_CANVAS_SURFACE`. Runtime canvas resolution preserves that surface ratio within the configured pixel limits; manual `portalCanvas.width`, `height`, and `offset` remain only a warned fallback for an absent or invalid surface. The old stone plaque and separate above-monkey canvas are not used.

The right stick moves forward/back and strafes on XZ from horizontal head direction. The left stick rotates the rig smoothly. Deadzone, move speed, and turn speed are configurable. Session end restores spawn, the fixed visible portal and waiting canvas, locomotion, transition, orbit, lights, activation, and controller state without duplicating objects.

## Asset and preload contract

The Experience VR preload subset includes the separate `/glb/portal_crystal_reliquary_button_activate.glb` activate button as well as `/glb/portal.glb` as `vr-portal-model` and `/glb/portal_crystal_reliquary.glb` as `vr-crystal-reliquary-model`. The portal provides `PORTAL_CANVAS_SURFACE`; the reliquary provides `RELIQUARY_CRYSTAL_INSERT_ZONE` and `RELIQUARY_CRYSTAL_ANCHOR`. The subset also includes all 15 page crystal GLBs and the loader, monkey, and glyph assets needed by this runtime. AssetManager is the sole model source and runtime creation performs no fetch. Per-glyph plaque models are no longer included in that subset.

## Meta Quest 3S validation status

Previously confirmed hardware behavior includes session start, head tracking, scene scale, controller rays/triggers, glyph interaction, transition, orbit, light feedback, and dynamic readiness. Actual portal position, front visibility, ground height, angled canvas readability, crystal placement in front of the monkey, materialization timing/readability, post-effect crystal raycast, comfort of the 1.8 m limit, pull speed, held orientation, socket-release comfort, Quest controller axis mapping, smooth-locomotion speed, and comfort remain unverified on Meta Quest 3S. The new placement additionally requires checking whether the 1.5 m portal distance and 1 m forward button distance are comfortable, whether both buttons are comfortable, whether neither object obscures the portal, whether the button remains in raycast range, and whether approaching with a held crystal is comfortable. Automated tests cover code contracts only.

## Active exclusions and prohibitions

A release/second button and read-page persistence remain deliberately outside this stage. Throwing, physics, collision, gravity, teleportation, jump, snap turn, bridge building, VR audio, atmosphere, and galaxies are outside this stage. Do not merge VR with Experience 3D, modify `src/experience3d.js`, move HTML/CSS overlays into VR, steer the tracked camera, stop glyph orbit, or restore geometric interaction markers.

## Release kryształu relikwiarza

Experience VR ładuje osobne modele activate i release przez `AssetManager`. Oba przyciski mają runtime scale `0.3` i symetryczne placementy 1 m przed relikwiarzem oraz 0,5 m po obu stronach osi portalu (1 m między środkami). Kryształ pozostaje widoczny po insertion i activation. Release po skonfigurowanym opóźnieniu usuwa wyłącznie osadzony kryształ, zwalnia socket oraz resetuje oba przyciski. Zbiór przeczytanych stron istnieje obecnie tylko w runtime, bez `localStorage` i UI.
