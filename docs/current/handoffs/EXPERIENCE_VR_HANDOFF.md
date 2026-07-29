# Experience VR Handoff

## Binding decisions

Experience VR is a separately and dynamically imported WebXR runtime, not a shared Experience 3D runtime. It owns its renderer, scene, camera, `playerRig`, lifecycle, controllers, and `setAnimationLoop`. Immersive UI stays in Three.js; tracked camera transforms remain owned by WebXR.

## Current architecture and implemented modules

- `src/experienceVr.js` coordinates preparation, session start/end, frame order, reset, and reuse.
- `src/config/experienceVrSettings.js` normalizes the VR contract.
- `src/xr/vrCapability.js` checks secure context and immersive-VR support.
- `playerRigOrientation`, `createVrControllers`, `createVrGlyphOrbit`, `createVrGlyphInteraction`, `createVrGlyphLights`, and `createVrEntryTransition` own orientation, two rays, motion/readiness, current-mesh raycasts, warm-light feedback, and compensated rig motion.
- `createVrPlaqueComposition` owns the shared world-space root positioned on the head-to-monkey line; `createVrGlyphPlaque` plus `resolveVrGlyphPlaqueAsset` own its selected lower stone, while `createVrSpatialPlaque` owns the canvas directly above the active stone bounds.

## Current user flow and parameters

The visitor selects Experience VR, waits for its independent runtime, and uses a second direct gesture to request `immersive-vr`. The runtime requests `local-floor` and falls back to `local`. The player spawns at `(0, 0, 8.6)`. Five glyphs orbit continuously on base radius `3.8` multiplied by `2`, giving effective radius `7.6`; their frame update continues during transition and after activation/arrival. Dynamic entry readiness uses threshold `0.24` and hysteresis `0.04`. A trigger on the currently ready glyph latches that glyph and moves the `playerRig`, with physical head-offset compensation, to `targetRadiusFactor = 0.76` (about `5.8` from center). Arrival reveals one gaze-independent, world-space composition between the head and monkey: the stone below and identically oriented canvas above it. Session end resets the shared root and state; re-entry reuses the same runtime objects without duplicates.

## Stone plaque mapping

| Stable glyph ID | Asset |
| --- | --- |
| `ai-guide` | `/glb/plaque_ai_guide.glb` |
| `spotify-digger` | `/glb/plaque_dig_engine.glb` |
| `haiku-cosmos` | `/glb/plaque_haiku_cosmos.glb` |
| `creative-ai` | `/glb/plaque_creative_ai.glb` |
| `ethics-life-protection` | `/glb/plaque_ethics.glb` |

Mapping is by stable glyph ID, never orbital index.

## Meta Quest 3S test status

Hardware-confirmed before `280ceb7`: Meta Quest Browser/GitHub Pages session start, head tracking and scene scale, start orientation, two controller rays, independent triggers, raycasting and glyph activation, comfortable transition, readable canvas, enlarged rotating ring, light hover, raycasting of moving solids, and dynamic `entryReady`.

Still awaiting hardware acceptance: the approximately `5.8` stopping point and the final shared stone/canvas composition (placement, common facing, and visibility from arrival). The code and automated tests are complete, but the result remains pending a Meta Quest 3S test.

## Next planned stage

After acceptance of `280ceb7`, implement locomotion separately: right stick forward/back plus left/right strafe; left stick smooth left/right rotation. Teleportation, jump, snap turn, physics, grabbing/throwing, plaque raycasting, bridge building, VR audio, atmosphere, and galaxies are outside that stage.

## Active architectural prohibitions

- Do not merge Experience VR with Experience 3D or introduce a mandatory shared world factory.
- Do not change protected `src/experience3d.js` for VR work.
- Do not move the HTML/CSS overlay into VR or steer the tracked camera.
- Do not stop glyph orbit during interaction, restore geometric markers, or raycast static positions.
- Do not combine locomotion, physics, and grabbing in one stage.
