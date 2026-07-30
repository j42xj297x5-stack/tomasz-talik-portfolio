# Decision Log

Status: current binding decisions, not a patch chronology.

## Repository and delivery

1. `docs/current/` is canonical. Superseded material belongs in `docs/legacy/` and is not default reading.
2. The application remains Vite plus vanilla JavaScript, vendored Three.js r184 and GitHub Pages-safe public paths.
3. Classic 2D, Experience 3D and Experience VR are distinct presentations over stable portfolio content IDs.

## Runtime ownership

1. `src/main.js` owns language/mode selection, capability gating and conditional imports.
2. `src/experience3d.js` owns Experience 3D and remains protected. VR neither imports it nor requires a shared world factory.
3. `src/experienceVr.js` owns a separate renderer, scene, base camera, `playerRig`, lifecycle and animation loop.
4. The tracked camera belongs to WebXR. Entry and locomotion transform `playerRig`; application code does not steer the camera.
5. Immersive UI is rendered in Three.js and does not reuse the desktop HTML/CSS overlay.
6. Runtime preparation precedes session entry; `immersive-vr` is requested only by the second direct gesture. `local-floor` falls back to `local`.

## World and entry

1. Five glyphs continuously orbit at effective radius `7.6`. Activation suppresses further readiness but never stops orbit.
2. `entryReady` is dynamic and raycasting targets current GLB meshes/fallback colliders, not stored orbit positions.
3. Warm point lights are the accepted glyph feedback; geometric hover/readiness markers are excluded.
4. Entry compensates the physical head X/Z offset and targets `7.6 × 0.76 = 5.776` from center while preserving rig Y and orientation.
5. Session reset reuses existing objects and does not duplicate models, listeners, mixers or runtime hit areas.

## Portal, pages and crystals

1. `/glb/portal.glb` is a fixed world-space composition present from scene readiness. Arrival neither moves nor hides it, and its placement does not depend on XR head pose.
2. Blender-authored `PORTAL_CANVAS_SURFACE` geometry, UVs, aspect, hierarchy and transform are authoritative. Runtime assigns `CanvasTexture` directly; a generated plane is warning-only compatibility fallback.
3. VR pages form a separate variable-length model keyed by stable `glyphId` and `page.id`. Current content is three pages per glyph and 15 preloaded crystal assets; localized portfolio data is selected rather than duplicated.
4. Crystal spawn and authored-model transforms are deterministic from `page.id`, bounds-centered and floor-grounded. `materializing` completes before interaction.
5. Crystal interaction is controller target-ray plus hierarchy parenting. Squeeze pulls the pointed available crystal to `holdSocket`; it is not a nearest-hand interaction. No physics, gravity, collision, velocity or throwing is implied.
6. `AssetManager` is the sole source of runtime models. Spawn clones preload results and performs no fetch.

## Reliquary and complete page cycle

1. Insertion, activation and release are separate explicit stages. Insertion attaches a visible crystal and occupies the socket; activate displays the page; release alone removes the crystal and frees the socket.
2. The binding state machine is `materializing → available → pulling → held → inserted → active → released`. Only `available` is targetable/grabbable. Both `inserted` and `active` remain visible.
3. The hidden Blender insertion zone owns insertion geometry. `RELIQUARY_CRYSTAL_ANCHOR` is only the authored marker; the visible crystal is parented to the separate `VrReliquaryCrystalDisplayAnchor` (or visible fallback), so it cannot inherit technical invisibility.
4. Activate and release are independent preloaded companions with independent controller hits, placement roots, scale roots, animation mixers and reset behavior. Their binding animation contract uses named press clips; the current release asset/runtime name mismatch is an implementation inconsistency, not a replacement decision.
5. The current placement is axial: the reliquary is `1.5 m` from portal with no lateral shift; model/insertion/anchors/crystal receive `heightOffset = 0.5`. Companion buttons remain unraised, lie `1 m` forward and `0.5 m` to either side, and use runtime scale `0.3`.
6. Activate requires `inserted`; release accepts `inserted` or `active`. Release is delayed by `1 s`, locked against repeat clicks, and resets both buttons after freeing the socket.
7. `readPageIds` is runtime memory only. Releasing `active` marks its page read; resets and re-entry within the prepared page retain the Set, while navigation/reload does not. No persistent storage, read UI or crystal marking is part of the contract.

## Scope

1. Smooth joystick locomotion is implemented: right-stick head-relative XZ movement and left-stick continuous yaw transform `playerRig` while preserving Y.
2. Persistent read storage/UI/marking, physics, gravity, collision, throwing, velocity, teleport, jump, snap turn, VR audio, atmosphere, galaxies and bridge construction remain excluded.

## 2026-07-29 — First complete reliquary cycle is binding

- **Decision:** The accepted Experience VR content loop is deterministic materialization → target-ray pull → visible insertion → explicit activation → delayed explicit release → reusable socket, with runtime-only read tracking.
- **Reason:** Separating insertion, display and release keeps the physical object legible, makes portal changes intentional and permits repeated pages without rebuilding runtime objects.
- **Consequences:** Both buttons and the visible runtime anchor are required current architecture. Hardware QA may tune accepted settings but must not collapse these stages or infer hardware acceptance from automated tests.
